import { Pool } from 'pg'
import { formatPrice } from '../common/currency'
import { freshOfferSql } from '../common/freshness'
import {
  CROSS_STORE_OUTLIER_RATIO,
  IMAGE_FAILURES_TO_CLEAR,
  classifyImageResponse,
  offersToDetach,
  priceSpread,
  qualityReportMessage,
  type QualitySummary,
} from './data-quality'

// Automatic data-quality pass, run at the end of every ingestion cycle
// (deploy/ingestion-loop*.sh), after merge-products:
//  1. Splits bad matches: a variant one store lists several times at clearly
//     different prices loses the extra offers; the next ingestion re-creates
//     them on their own products (the repository no longer matches a store's
//     listing onto a variant that store already lists).
//  2. Checks product images the way a visitor's browser loads them (from
//     dondeta, following redirects) and clears ones that fail twice in a row,
//     so the next ingestion stores a working image.
//  3. Flags products whose stores' current prices differ wildly (probably two
//     different items matched together) for a human, once each.
// Posts a summary to DISCORD_WEBHOOK_ALERTS when it fixed or found something.
// --dry-run reports without changing anything.

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is required')
const pool = new Pool({ connectionString: databaseUrl, max: 3 })
const dryRun = process.argv.includes('--dry-run')
const site = process.env.SITE_URL ?? 'https://dondeta.com.do'
const imageBatch = Number(process.env.QUALITY_IMAGE_BATCH ?? 600)
const BROWSER_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'

async function splitSameStoreMatches(summary: QualitySummary) {
  const { rows } = await pool.query<{
    variant_id: string
    creator_sku: string | null
    product_name: string
    retailer: string
    offers: Array<{ id: string; external_sku: string; price: string; created_at: string }>
  }>(`
    select pv.id::text as variant_id, pv.manufacturer_sku as creator_sku, p.name as product_name, r.name as retailer,
           json_agg(json_build_object('id', o.id, 'external_sku', o.external_sku, 'price', o.price, 'created_at', o.created_at)) as offers
    from offers o
    join product_variants pv on pv.id = o.product_variant_id
    join products p on p.id = pv.product_id
    join retailers r on r.id = o.retailer_id
    where o.store_id is null
    group by pv.id, p.name, r.name
    having count(*) > 1`)

  for (const row of rows) {
    const offers = row.offers.map(o => ({ id: o.id, externalSku: o.external_sku, price: Number(o.price), createdAt: new Date(o.created_at) }))
    const detach = offersToDetach(offers, row.creator_sku)
    if (!detach.length) continue
    summary.detachedOffers.push({ product: row.product_name, retailer: row.retailer, prices: offers.map(o => o.price).sort((a, b) => a - b) })
    console.log(`[quality] split ${row.retailer} "${row.product_name}": detach ${detach.map(o => o.externalSku).join(', ')}`)
    if (!dryRun) await pool.query('delete from offers where id = any($1::uuid[])', [detach.map(o => o.id)])
  }
}

async function checkImage(url: string): Promise<{ status: number | null; contentType: string | null }> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': BROWSER_UA, Referer: `${site.replace(/\/$/, '')}/`, Accept: 'image/avif,image/webp,image/*,*/*;q=0.8' },
      redirect: 'follow',
      signal: AbortSignal.timeout(15_000),
    })
    await response.body?.cancel()
    return { status: response.status, contentType: response.headers.get('content-type') }
  } catch {
    return { status: null, contentType: null }
  }
}

async function checkImages(summary: QualitySummary) {
  // Products a visitor can see (a fresh offer), least recently checked first.
  const { rows } = await pool.query<{ id: string; name: string; image_url: string; image_failures: number }>(`
    select p.id::text, p.name, p.image_url, p.image_failures
    from products p
    where p.image_url like 'http%'
      and (p.image_checked_at is null or p.image_checked_at < now() - interval '20 hours')
      and exists (
        select 1 from product_variants pv join offers o on o.product_variant_id = pv.id
        where pv.product_id = p.id and ${freshOfferSql('o')}
      )
    order by p.image_checked_at nulls first
    limit $1`, [imageBatch])

  let next = 0
  const worker = async () => {
    while (next < rows.length) {
      const row = rows[next++]!
      const { status, contentType } = await checkImage(row.image_url)
      const verdict = classifyImageResponse(status, contentType)
      summary.imagesChecked += 1
      if (dryRun) {
        if (verdict === 'broken') summary.clearedImages.push({ product: row.name, host: new URL(row.image_url).host })
        continue
      }
      if (verdict === 'ok') {
        await pool.query('update products set image_checked_at = now(), image_failures = 0 where id = $1', [row.id])
      } else if (verdict === 'broken' && row.image_failures + 1 >= IMAGE_FAILURES_TO_CLEAR) {
        // Only if the image wasn't replaced meanwhile by an ingestion run.
        const cleared = await pool.query(
          `update products set image_url = null, image_checked_at = now(), image_failures = 0
           where id = $1 and image_url = $2`,
          [row.id, row.image_url],
        )
        if (cleared.rowCount) summary.clearedImages.push({ product: row.name, host: new URL(row.image_url).host })
      } else if (verdict === 'broken') {
        await pool.query('update products set image_checked_at = now(), image_failures = image_failures + 1 where id = $1', [row.id])
      } else {
        await pool.query('update products set image_checked_at = now() where id = $1', [row.id])
      }
    }
  }
  await Promise.all(Array.from({ length: 8 }, worker))
}

async function flagPriceOutliers(summary: QualitySummary) {
  const { rows } = await pool.query<{ id: string; name: string; slug: string; prices: Array<{ retailer: string; price: string }> }>(`
    select p.id::text, p.name, p.slug,
           json_agg(json_build_object('retailer', r.name, 'price', o.price) order by o.price) as prices
    from products p
    join product_variants pv on pv.product_id = p.id
    join offers o on o.product_variant_id = pv.id
    join retailers r on r.id = o.retailer_id
    where ${freshOfferSql('o')} and o.price > 0
    group by p.id
    having count(distinct o.retailer_id) > 1`)

  const outliers = rows
    .map(row => ({ ...row, spread: priceSpread(row.prices.map(p => Number(p.price))) }))
    .filter(row => row.spread > CROSS_STORE_OUTLIER_RATIO)
  const ids = outliers.map(o => o.id)

  if (!dryRun) {
    // Resolved: no longer an outlier (fixed by hand, or the offers changed).
    await pool.query(
      `update data_quality_flags set resolved_at = now()
       where kind = 'cross_store_price' and resolved_at is null and not (product_id = any($1::uuid[]))`,
      [ids],
    )
  }
  for (const row of outliers) {
    const detail = row.prices.map(p => `${p.retailer} ${formatPrice(Number(p.price))}`).join(' / ')
    if (dryRun) {
      summary.newOutliers.push({ product: row.name, slug: row.slug, detail })
      continue
    }
    const flag = await pool.query<{ inserted: boolean }>(
      `insert into data_quality_flags (product_id, kind, detail) values ($1, 'cross_store_price', $2)
       on conflict (product_id, kind) do update
         set detail = excluded.detail, last_seen_at = now(),
             first_seen_at = case when data_quality_flags.resolved_at is null then data_quality_flags.first_seen_at else now() end,
             resolved_at = null
       returning (xmax = 0 or first_seen_at = last_seen_at) as inserted`,
      [row.id, detail],
    )
    if (flag.rows[0]?.inserted) summary.newOutliers.push({ product: row.name, slug: row.slug, detail })
  }
  summary.openOutliers = outliers.length
}

async function main() {
  const summary: QualitySummary = { site, detachedOffers: [], clearedImages: [], imagesChecked: 0, newOutliers: [], openOutliers: 0 }
  await splitSameStoreMatches(summary)
  await checkImages(summary)
  await flagPriceOutliers(summary)

  console.log(
    `[quality]${dryRun ? ' (dry run)' : ''} ${summary.detachedOffers.length} bad matches split, ` +
    `${summary.clearedImages.length} broken images ${dryRun ? 'found' : 'cleared'} of ${summary.imagesChecked} checked, ` +
    `${summary.openOutliers} cross-store price outliers (${summary.newOutliers.length} new)`,
  )
  if (dryRun) {
    for (const o of summary.newOutliers) console.log(`[quality] outlier ${o.product}: ${o.detail}`)
    for (const c of summary.clearedImages) console.log(`[quality] broken image ${c.host}: ${c.product}`)
    return
  }
  const message = qualityReportMessage(summary, formatPrice)
  const webhook = process.env.DISCORD_WEBHOOK_ALERTS
  if (message && webhook) {
    const response = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: message.slice(0, 1990), allowed_mentions: { parse: [] } }),
    })
    if (!response.ok) console.error(`[quality] Discord webhook failed (${response.status})`)
  }
}

main()
  .catch(error => {
    console.error('[quality] failed:', error)
    process.exitCode = 1
  })
  .finally(() => pool.end())
