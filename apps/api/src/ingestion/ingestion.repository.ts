import { randomUUID } from 'node:crypto'
import type { Pool, PoolClient } from 'pg'
import type { IngestionResult, NormalizedRetailerItem } from './ingestion.types'
import { brandsCompatible, bundlesCompatible, extractModelCodes } from './model-codes'
import { cleanBrand } from './brands'

// DóndeTa is an appliance price-comparison app. Discovery is already scoped to each
// retailer's appliance department by URL, but sites nest non-appliance subcategories
// in there too (e.g. Plaza Lama files "Accesorios Tecnológicos" — gaming keyboards,
// cables — under /ca/electrodomesticos). This is the last line of defense: skip
// anything whose derived category doesn't look like an actual appliance, regardless
// of which retailer or URL it came from.
const APPLIANCE_CATEGORY_KEYWORDS = [
  'electrodomest', 'linea blanca', 'línea blanca',
  'nevera', 'refriger', 'congelad', 'freezer',
  'estufa', 'horno', 'microond', 'cocina', 'cocc',
  'lavador', 'lavaplat', 'secador', 'lavad',
  'acondicionad', 'climatiz', 'abanico', 'ventilad',
  'licuad', 'batidor', 'cafeter', 'tostad', 'plancha',
  'aspirad', 'television', 'televisor', 'tv y audio', 'audio',
  'dispensador', 'freidora', 'air fryer',
  'extractor', 'procesador', 'barras de sonido', 'electro hogar', 'electro cocina',
  'nevecon', 'lavavajill', 'minibar', 'calentador',
]

function isApplianceCategory(categoryName: string): boolean {
  const normalized = categoryName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
  return APPLIANCE_CATEGORY_KEYWORDS.some(keyword => normalized.includes(keyword))
}

// The one non-appliance department: Eneba's hand-picked Gaming catalog
// (eneba.catalog.ts). Tied to that retailer so a store's own "gaming"
// subcategory (keyboards, cables) is still filtered out.
export function acceptsCategory(item: Pick<NormalizedRetailerItem, 'categoryName' | 'categorySlug' | 'retailer'>): boolean {
  if (item.retailer.slug === 'eneba' && item.categorySlug === 'gaming') return true
  return isApplianceCategory(item.categoryName)
}

// Suffixed with a slice of the product's own id, so this never needs a
// collision-retry loop against the unique index even if two products
// slugify to the same text.
function slugify(text: string, productId: string): string {
  const base = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  return `${base}-${productId.slice(0, 8)}`
}

export class IngestionRepository {
  constructor(private readonly pool: Pool) {}

  async ingest(rawItem: NormalizedRetailerItem, ingestionRunId?: string): Promise<IngestionResult> {
    const item = { ...rawItem, brand: cleanBrand(rawItem.brand, rawItem.name) }
    if (!acceptsCategory(item)) {
      throw new Error(`Skipped: category "${item.categoryName}" is not an appliance category`)
    }

    const client = await this.pool.connect()

    try {
      await client.query('begin')

      const retailerId = await this.upsertRetailer(client, item)
      const categoryId = await this.upsertCategory(client, item)
      const modelCodes = extractModelCodes(item.name, item.model)
      const matched = await this.findVariant(client, item, retailerId, modelCodes)

      let productId: string
      let variantId: string
      let createdProduct = false

      if (matched) {
        productId = matched.productId
        variantId = matched.variantId
        // Once a second retailer's offer is attached, the product's name and
        // category belong to whoever created it -- otherwise every run would
        // flip the title back and forth between retailers' wording.
        await client.query(
          `update products
           set name = case when shared.yes then name else $2 end,
               -- 'dores-y-felpas' is what a broken Jumbo brand regex stored
               -- (matched inside "marcadores-y-felpas"); repair it even on
               -- shared products.
               brand = case when shared.yes and brand not in ('dores-y-felpas', 'Desconocida') then brand else $3 end,
               image_url = coalesce(image_url, $4),
               category_id = case when shared.yes then category_id else $5 end,
               updated_at = now()
           from (
             select exists (
               select 1 from offers o
               join product_variants pv on pv.id = o.product_variant_id
               where pv.product_id = $1 and o.retailer_id <> $6
             ) as yes
           ) shared
           where id = $1`,
          [productId, item.name, item.brand, item.imageUrl ?? null, categoryId, retailerId],
        )
        if (modelCodes.length) {
          await client.query(
            `update product_variants
             set model_codes = array(select distinct unnest(model_codes || $2::text[]) order by 1)
             where id = $1`,
            [variantId, modelCodes],
          )
        }
      } else {
        // Generated client-side (rather than the products.id column's own
        // gen_random_uuid() default) so the slug -- which embeds a slice of
        // the id for collision-avoidance -- can be included in this same
        // insert instead of a separate update, since slug has been NOT NULL
        // since migration 006.
        productId = randomUUID()
        const slug = slugify(`${item.brand} ${item.name}`, productId)

        await client.query(
          `insert into products(id, category_id, name, brand, subtitle, image_url, slug)
           values ($1, $2, $3, $4, $5, $6, $7)`,
          [productId, categoryId, item.name, item.brand, item.subtitle ?? item.model, item.imageUrl ?? null, slug],
        )

        const variant = await client.query<{ id: string }>(
          `insert into product_variants(product_id, model, ean, upc, manufacturer_sku, model_codes, is_primary)
           values ($1, $2, $3, $4, $5, $6, true)
           returning id::text`,
          [productId, item.model, item.ean ?? null, item.upc ?? null, item.externalSku, modelCodes],
        )
        variantId = variant.rows[0].id
        createdProduct = true
      }

      const offerId = await this.upsertOffer(client, retailerId, variantId, item)

      await client.query(
        `insert into price_observations(offer_id, price, shipping_price, availability)
         values ($1, $2, $3, $4)`,
        [offerId, item.price, item.shippingPrice, item.available ? 'in_stock' : 'out_of_stock'],
      )

      await client.query(
        `insert into retailer_raw_items(retailer_id, ingestion_run_id, external_sku, source_url, payload)
         values ($1, $2, $3, $4, $5::jsonb)`,
        [retailerId, ingestionRunId ?? null, item.externalSku, item.sourceUrl, JSON.stringify(item.raw)],
      )

      await client.query('commit')
      return { productId, variantId, offerId, createdProduct }
    } catch (error) {
      await client.query('rollback')
      throw error
    } finally {
      client.release()
    }
  }

  private async upsertRetailer(client: PoolClient, item: NormalizedRetailerItem): Promise<string> {
    const result = await client.query<{ id: string }>(
      `insert into retailers(name, slug, abbr, primary_color, website_url)
       values ($1, $2, $3, $4, $5)
       on conflict (slug) do update
       set name = excluded.name,
           abbr = excluded.abbr,
           primary_color = excluded.primary_color,
           website_url = excluded.website_url
       returning id::text`,
      [
        item.retailer.name,
        item.retailer.slug,
        item.retailer.abbr,
        item.retailer.primaryColor,
        item.retailer.websiteUrl,
      ],
    )
    return result.rows[0].id
  }

  private async upsertCategory(client: PoolClient, item: NormalizedRetailerItem): Promise<string> {
    const result = await client.query<{ id: string }>(
      `insert into categories(name, slug)
       values ($1, $2)
       on conflict (slug) do update set name = excluded.name
       returning id::text`,
      [item.categoryName, item.categorySlug],
    )
    return result.rows[0].id
  }

  private async findVariant(
    client: PoolClient,
    item: NormalizedRetailerItem,
    retailerId: string,
    modelCodes: string[],
  ): Promise<{ productId: string; variantId: string } | null> {
    // This retailer has listed this exact SKU before: stay on the same
    // product even if its name/model wording changed since.
    const bySku = await client.query<{ product_id: string; variant_id: string }>(
      `select pv.product_id::text, pv.id::text as variant_id
       from offers o
       join product_variants pv on pv.id = o.product_variant_id
       where o.retailer_id = $1 and o.external_sku = $2
       order by o.last_seen_at desc
       limit 1`,
      [retailerId, item.externalSku],
    )
    if (bySku.rows[0]) {
      return { productId: bySku.rows[0].product_id, variantId: bySku.rows[0].variant_id }
    }

    // Same retailer page under a different SKU: the retailer (or our adapter)
    // changed SKU format, e.g. Sirena's HTML crawler -> VTEX API. Without this
    // every listing was created a second time.
    const byUrl = await client.query<{ product_id: string; variant_id: string }>(
      `select pv.product_id::text, pv.id::text as variant_id
       from offers o
       join product_variants pv on pv.id = o.product_variant_id
       where o.retailer_id = $1 and o.url = $2
       order by o.last_seen_at desc
       limit 1`,
      [retailerId, item.sourceUrl],
    )
    if (byUrl.rows[0]) {
      return { productId: byUrl.rows[0].product_id, variantId: byUrl.rows[0].variant_id }
    }

    if (item.ean) {
      const byEan = await client.query<{ product_id: string; variant_id: string }>(
        `select product_id::text, id::text as variant_id
         from product_variants where ean = $1 limit 1`,
        [item.ean],
      )
      if (byEan.rows[0]) {
        return { productId: byEan.rows[0].product_id, variantId: byEan.rows[0].variant_id }
      }
    }

    const byModel = await client.query<{ product_id: string; variant_id: string }>(
      `select pv.product_id::text, pv.id::text as variant_id
       from product_variants pv
       join products p on p.id = pv.product_id
       where lower(p.brand) = lower($1) and lower(pv.model) = lower($2)
       limit 1`,
      [item.brand, item.model],
    )

    if (byModel.rows[0]) {
      return { productId: byModel.rows[0].product_id, variantId: byModel.rows[0].variant_id }
    }

    return this.findVariantByModelCodes(client, item, modelCodes)
  }

  // Same manufacturer model code in another product's name/model (see
  // model-codes.ts) -- the match that actually links retailers, since their
  // `model` fields rarely agree. Most shared codes first.
  private async findVariantByModelCodes(
    client: PoolClient,
    item: NormalizedRetailerItem,
    modelCodes: string[],
  ): Promise<{ productId: string; variantId: string } | null> {
    if (!modelCodes.length) return null
    const candidates = await client.query<{ product_id: string; variant_id: string; brand: string; name: string }>(
      `select pv.product_id::text, pv.id::text as variant_id, p.brand, p.name
       from product_variants pv
       join products p on p.id = pv.product_id
       where pv.model_codes && $1::text[]
       order by cardinality(array(select unnest(pv.model_codes) intersect select unnest($1::text[]))) desc,
                p.created_at asc
       limit 10`,
      [modelCodes],
    )
    const match = candidates.rows.find(row => brandsCompatible({ brand: row.brand, name: row.name }, item) && bundlesCompatible(row, item))
    return match ? { productId: match.product_id, variantId: match.variant_id } : null
  }

  private async upsertOffer(
    client: PoolClient,
    retailerId: string,
    variantId: string,
    item: NormalizedRetailerItem,
  ): Promise<string> {
    // Same SKU, or the same page under an older SKU (keeps its price history).
    const existing = await client.query<{ id: string }>(
      `select id::text
       from offers
       where product_variant_id = $1
         and retailer_id = $2
         and store_id is null
         and (external_sku = $3 or url = $4)
       order by (external_sku = $3) desc, last_seen_at desc
       limit 1`,
      [variantId, retailerId, item.externalSku, item.sourceUrl],
    )

    if (existing.rows[0]) {
      await client.query(
        `update offers
         set url = $2,
             price = $3,
             shipping_price = $4,
             availability = $5,
             external_sku = $6,
             last_seen_at = now(),
             updated_at = now()
         where id = $1`,
        [
          existing.rows[0].id,
          item.sourceUrl,
          item.price,
          item.shippingPrice,
          item.available ? 'in_stock' : 'out_of_stock',
          item.externalSku,
        ],
      )
      return existing.rows[0].id
    }

    const created = await client.query<{ id: string }>(
      `insert into offers(
        product_variant_id, retailer_id, external_sku, url, price, shipping_price, availability
       ) values ($1, $2, $3, $4, $5, $6, $7)
       returning id::text`,
      [
        variantId,
        retailerId,
        item.externalSku,
        item.sourceUrl,
        item.price,
        item.shippingPrice,
        item.available ? 'in_stock' : 'out_of_stock',
      ],
    )
    return created.rows[0].id
  }
}
