import type { Pool, PoolClient } from 'pg'
import type { IngestionResult, NormalizedRetailerItem } from './ingestion.types'

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
]

function isApplianceCategory(categoryName: string): boolean {
  const normalized = categoryName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
  return APPLIANCE_CATEGORY_KEYWORDS.some(keyword => normalized.includes(keyword))
}

export class IngestionRepository {
  constructor(private readonly pool: Pool) {}

  async ingest(item: NormalizedRetailerItem, ingestionRunId?: string): Promise<IngestionResult> {
    if (!isApplianceCategory(item.categoryName)) {
      throw new Error(`Skipped: category "${item.categoryName}" is not an appliance category`)
    }

    const client = await this.pool.connect()

    try {
      await client.query('begin')

      const retailerId = await this.upsertRetailer(client, item)
      const categoryId = await this.upsertCategory(client, item)
      const matched = await this.findVariant(client, item)

      let productId: string
      let variantId: string
      let createdProduct = false

      if (matched) {
        productId = matched.productId
        variantId = matched.variantId
        await client.query(
          `update products
           set name = $2,
               brand = $3,
               image_url = coalesce($4, image_url),
               updated_at = now()
           where id = $1`,
          [productId, item.name, item.brand, item.imageUrl ?? null],
        )
      } else {
        const product = await client.query<{ id: string }>(
          `insert into products(category_id, name, brand, subtitle, image_url)
           values ($1, $2, $3, $4, $5)
           returning id::text`,
          [categoryId, item.name, item.brand, item.model, item.imageUrl ?? null],
        )
        productId = product.rows[0].id

        const variant = await client.query<{ id: string }>(
          `insert into product_variants(product_id, model, ean, upc, manufacturer_sku, is_primary)
           values ($1, $2, $3, $4, $5, true)
           returning id::text`,
          [productId, item.model, item.ean ?? null, item.upc ?? null, item.externalSku],
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
  ): Promise<{ productId: string; variantId: string } | null> {
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

    return byModel.rows[0]
      ? { productId: byModel.rows[0].product_id, variantId: byModel.rows[0].variant_id }
      : null
  }

  private async upsertOffer(
    client: PoolClient,
    retailerId: string,
    variantId: string,
    item: NormalizedRetailerItem,
  ): Promise<string> {
    const existing = await client.query<{ id: string }>(
      `select id::text
       from offers
       where product_variant_id = $1
         and retailer_id = $2
         and store_id is null
         and external_sku = $3
       limit 1`,
      [variantId, retailerId, item.externalSku],
    )

    if (existing.rows[0]) {
      await client.query(
        `update offers
         set url = $2,
             price = $3,
             shipping_price = $4,
             availability = $5,
             last_seen_at = now(),
             updated_at = now()
         where id = $1`,
        [
          existing.rows[0].id,
          item.sourceUrl,
          item.price,
          item.shippingPrice,
          item.available ? 'in_stock' : 'out_of_stock',
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
