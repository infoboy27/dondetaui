// Backfills product_variants.model_codes and merges products that are the
// same appliance listed by different retailers (shared EAN or manufacturer
// model code, compatible brand). Ingestion only matches going forward; this
// fixes the catalog that was ingested before matching worked.
//
//   node dist/ingestion/merge-products.cli.js           # dry run, prints groups
//   node dist/ingestion/merge-products.cli.js --apply   # writes
//
// Safe to re-run: an already-merged catalog produces no groups.
import { Pool, type PoolClient } from 'pg'
import { brandsCompatible, extractModelCodes } from './model-codes'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is required')
const apply = process.argv.includes('--apply')
// A code shared by more products than this is generic noise, not a model.
const MAX_GROUP_SIZE = Number(process.env.MERGE_MAX_GROUP_SIZE ?? 6)

const pool = new Pool({ connectionString: databaseUrl, max: 2 })

interface VariantRow {
  variant_id: string
  product_id: string
  slug: string
  name: string
  brand: string
  model: string
  ean: string | null
  created_at: Date
  retailers: string[]
}

interface ProductInfo {
  id: string
  slug: string
  name: string
  brand: string
  createdAt: Date
  retailers: Set<string>
}

async function main() {
  const { rows } = await pool.query<VariantRow>(`
    select pv.id::text as variant_id, p.id::text as product_id, p.slug, p.name, p.brand, pv.model, pv.ean,
           p.created_at,
           coalesce(array_agg(distinct r.name) filter (where r.name is not null), '{}') as retailers
    from product_variants pv
    join products p on p.id = pv.product_id
    left join offers o on o.product_variant_id = pv.id
    left join retailers r on r.id = o.retailer_id
    group by pv.id, p.id`)

  const products = new Map<string, ProductInfo>()
  const keyIndex = new Map<string, Set<string>>()
  let codesChanged = 0

  for (const row of rows) {
    const product = products.get(row.product_id) ?? {
      id: row.product_id, slug: row.slug, name: row.name, brand: row.brand,
      createdAt: row.created_at, retailers: new Set<string>(),
    }
    row.retailers.forEach(r => product.retailers.add(r))
    products.set(row.product_id, product)

    const codes = extractModelCodes(row.name, row.model)
    if (apply) {
      const result = await pool.query(
        `update product_variants set model_codes = $2::text[]
         where id = $1 and model_codes is distinct from $2::text[]`,
        [row.variant_id, codes],
      )
      codesChanged += result.rowCount ?? 0
    }
    const keys = codes.map(code => `code:${code}`)
    if (row.ean) keys.push(`ean:${row.ean}`)
    for (const key of keys) {
      const set = keyIndex.get(key) ?? new Set<string>()
      set.add(row.product_id)
      keyIndex.set(key, set)
    }
  }

  // Union-find over products, linking only across retailers -- two listings
  // from the same retailer sharing a code are usually color/size siblings.
  const parent = new Map<string, string>()
  const find = (id: string): string => {
    let root = id
    while (parent.has(root) && parent.get(root) !== root) root = parent.get(root)!
    parent.set(id, root)
    return root
  }
  for (const [key, ids] of keyIndex) {
    const list = [...ids].map(id => products.get(id)!)
    if (list.length < 2 || list.length > MAX_GROUP_SIZE) {
      if (list.length > MAX_GROUP_SIZE) console.warn(`[merge] skipping generic key ${key} (${list.length} products)`)
      continue
    }
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i]
        const b = list[j]
        const sameRetailerOnly = [...a.retailers].every(r => b.retailers.has(r)) && [...b.retailers].every(r => a.retailers.has(r))
        if (sameRetailerOnly) continue
        if (!key.startsWith('ean:') && !brandsCompatible(a, b)) continue
        parent.set(find(a.id), find(b.id))
      }
    }
  }

  const groups = new Map<string, ProductInfo[]>()
  for (const product of products.values()) {
    const root = find(product.id)
    const group = groups.get(root) ?? []
    group.push(product)
    groups.set(root, group)
  }
  const merges = [...groups.values()].filter(group => group.length > 1)

  console.log(`[merge] ${products.size} products, ${merges.length} groups to merge (${merges.reduce((n, g) => n + g.length, 0)} products)`)
  if (apply) console.log(`[merge] model_codes updated on ${codesChanged} variants`)

  for (const group of merges) {
    // Oldest product survives: its slug is the one most likely indexed.
    group.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    const [keep, ...losers] = group
    console.log(`  KEEP ${[...keep.retailers].join('+')}: ${keep.name}`)
    for (const loser of losers) console.log(`  ←    ${[...loser.retailers].join('+')}: ${loser.name}`)
    if (!apply) continue

    const client = await pool.connect()
    try {
      await client.query('begin')
      for (const loser of losers) await mergeInto(client, keep.id, loser)
      await client.query('commit')
    } catch (error) {
      await client.query('rollback')
      console.error(`[merge] group "${keep.name}" failed, left untouched: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      client.release()
    }
  }

  if (!apply) console.log('[merge] dry run -- re-run with --apply to write')
}

async function mergeInto(client: PoolClient, keepId: string, loser: ProductInfo) {
  const variants = await client.query<{ id: string; model: string }>(
    'select id::text, model from product_variants where product_id = $1',
    [loser.id],
  )
  for (const variant of variants.rows) {
    const clash = await client.query<{ id: string }>(
      'select id::text from product_variants where product_id = $1 and lower(model) = lower($2) limit 1',
      [keepId, variant.model],
    )
    if (clash.rows[0]) {
      await client.query('update offers set product_variant_id = $1 where product_variant_id = $2', [clash.rows[0].id, variant.id])
      await client.query('delete from product_variants where id = $1', [variant.id])
    } else {
      await client.query('update product_variants set product_id = $1, is_primary = false where id = $2', [keepId, variant.id])
    }
  }

  // User data: move to the surviving product unless the user already has the
  // same row there (unique per user+product), in which case the loser's copy
  // goes away with the product.
  for (const table of ['favorites', 'price_alerts', 'product_reviews']) {
    await client.query(
      `update ${table} t set product_id = $1
       where t.product_id = $2
         and not exists (select 1 from ${table} k where k.product_id = $1 and k.user_id = t.user_id)`,
      [keepId, loser.id],
    )
  }

  await client.query('update product_slug_redirects set product_id = $1 where product_id = $2', [keepId, loser.id])
  await client.query(
    `insert into product_slug_redirects(old_slug, product_id) values ($1, $2)
     on conflict (old_slug) do update set product_id = excluded.product_id`,
    [loser.slug, keepId],
  )
  await client.query('delete from products where id = $1', [loser.id])
}

main()
  .catch(error => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => pool.end())
