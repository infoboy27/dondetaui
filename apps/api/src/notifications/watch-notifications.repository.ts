import type { Pool } from 'pg'
import { freshOfferSql } from '../common/freshness'
import type { NotificationType } from './notification-prefs'
import type { StockState } from './notification-rules'
import { sentKey, type ProductSnapshot, type RecentCardPromotion, type RetailerOffer, type SavedSearchMatch, type WatchRecipient } from './watch-plan'

// SQL for the alerts worker's watch notifications (CLI only, no Nest).
// "Watched" = saved (favorites) or followed (price_alerts).

export class WatchNotificationsRepository {
  constructor(private readonly pool: Pool) {}

  /** Users with something watched or a saved search, with contact info, active push tokens and prefs. */
  async recipients(): Promise<WatchRecipient[]> {
    const result = await this.pool.query<{ user_id: string; email: string; name: string | null; push_tokens: string[]; prefs: unknown }>(
      `select
        u.id::text as user_id,
        u.email,
        u.name,
        coalesce(pt.tokens, array[]::text[]) as push_tokens,
        np.prefs
      from users u
      left join notification_preferences np on np.user_id = u.id
      left join (
        select user_id, array_agg(token) as tokens
        from push_tokens
        where disabled_at is null
        group by user_id
      ) pt on pt.user_id = u.id
      where exists (select 1 from favorites f where f.user_id = u.id)
        or exists (select 1 from price_alerts pa where pa.user_id = u.id)
        or exists (select 1 from saved_searches ss where ss.user_id = u.id)`,
    )
    return result.rows.map(row => ({ userId: row.user_id, email: row.email, name: row.name, pushTokens: row.push_tokens, prefs: row.prefs }))
  }

  /** (user, product) pairs: saved or followed. */
  async watched(): Promise<{ userId: string; productId: string }[]> {
    const result = await this.pool.query<{ user_id: string; product_id: string }>(
      `select user_id::text, product_id::text from favorites
      union
      select user_id::text, product_id::text from price_alerts`,
    )
    return result.rows.map(row => ({ userId: row.user_id, productId: row.product_id }))
  }

  async snapshots(productIds: string[]): Promise<Map<string, ProductSnapshot>> {
    const map = new Map<string, ProductSnapshot>()
    if (!productIds.length) return map
    const result = await this.pool.query<{
      product_id: string
      name: string
      slug: string | null
      image_url: string | null
      current: string | null
      store: string | null
      fresh_in: string
      fresh_out: string
      points: Array<{ date: string; price: string | number }> | null
    }>(
      `select
        p.id::text as product_id,
        p.name,
        p.slug,
        p.image_url,
        cur.current::text as current,
        cur.store,
        st.fresh_in::text as fresh_in,
        st.fresh_out::text as fresh_out,
        h.points
      from products p
      left join lateral (
        select o.price + o.shipping_price as current, r.name as store
        from offers o
        join product_variants v on v.id = o.product_variant_id
        join retailers r on r.id = o.retailer_id
        where v.product_id = p.id and o.availability = 'in_stock' and ${freshOfferSql('o')}
        order by o.price + o.shipping_price
        limit 1
      ) cur on true
      left join lateral (
        select
          count(*) filter (where o.availability = 'in_stock') as fresh_in,
          count(*) filter (where o.availability = 'out_of_stock') as fresh_out
        from offers o
        join product_variants v on v.id = o.product_variant_id
        where v.product_id = p.id and ${freshOfferSql('o')}
      ) st on true
      left join lateral (
        select json_agg(json_build_object('date', d.day, 'price', d.price) order by d.day) as points
        from (
          select po.observed_at::date::text as day, min(po.price + po.shipping_price) as price
          from price_observations po
          join offers o on o.id = po.offer_id
          join product_variants v on v.id = o.product_variant_id
          where v.product_id = p.id
            and po.observed_at >= current_date - 90
            and po.observed_at < current_date
          group by po.observed_at::date
        ) d
      ) h on true
      where p.id = any($1::uuid[])`,
      [productIds],
    )
    for (const row of result.rows) {
      map.set(row.product_id, {
        productId: row.product_id,
        name: row.name,
        slug: row.slug,
        imageUrl: row.image_url,
        current: row.current === null ? null : Number(row.current),
        store: row.store,
        freshInStock: Number(row.fresh_in),
        freshOutOfStock: Number(row.fresh_out),
        history: (row.points ?? []).map(point => ({ date: point.date, price: Number(point.price) })),
      })
    }
    return map
  }

  async stockStates(productIds: string[]): Promise<Map<string, StockState>> {
    const map = new Map<string, StockState>()
    if (!productIds.length) return map
    const result = await this.pool.query<{ product_id: string; state: StockState }>(
      'select product_id::text, state from product_stock_states where product_id = any($1::uuid[])',
      [productIds],
    )
    for (const row of result.rows) map.set(row.product_id, row.state)
    return map
  }

  async saveStockStates(states: { productId: string; state: StockState }[]): Promise<void> {
    if (!states.length) return
    await this.pool.query(
      `insert into product_stock_states (product_id, state)
      select * from unnest($1::uuid[], $2::text[])
      on conflict (product_id) do update set state = excluded.state, changed_at = now()
      where product_stock_states.state <> excluded.state`,
      [states.map(s => s.productId), states.map(s => s.state)],
    )
  }

  /** Promotions running today that started or were loaded in the last couple of days (the rule narrows it). */
  async recentCardPromotions(today: string): Promise<RecentCardPromotion[]> {
    const result = await this.pool.query<{
      id: string
      retailer_id: string
      store: string
      bank: string
      card: string | null
      percent: string
      kind: 'discount' | 'cashback'
      weekdays: number[] | null
      starts_on: string
      ends_on: string
      created_on: string
    }>(
      `select
        p.id::text,
        p.retailer_id::text,
        r.name as store,
        p.bank,
        p.card,
        p.percent::text,
        p.kind,
        p.weekdays,
        to_char(p.starts_on, 'YYYY-MM-DD') as starts_on,
        to_char(p.ends_on, 'YYYY-MM-DD') as ends_on,
        to_char(p.created_at, 'YYYY-MM-DD') as created_on
      from card_promotions p
      join retailers r on r.id = p.retailer_id
      where p.starts_on <= $1::date and p.ends_on >= $1::date
        and greatest(p.starts_on, p.created_at::date) >= $1::date - 2`,
      [today],
    )
    return result.rows.map(row => ({
      id: row.id,
      retailerId: row.retailer_id,
      store: row.store,
      bank: row.bank,
      card: row.card,
      percent: Number(row.percent),
      kind: row.kind,
      weekdays: row.weekdays,
      startsOn: row.starts_on,
      endsOn: row.ends_on,
      createdOn: row.created_on,
    }))
  }

  /** Fresh in-stock offers of these products at these retailers: product -> retailer -> best price. */
  async offersAtRetailers(productIds: string[], retailerIds: string[]): Promise<RetailerOffer[]> {
    if (!productIds.length || !retailerIds.length) return []
    const result = await this.pool.query<{ product_id: string; retailer_id: string; price: string }>(
      `select v.product_id::text, o.retailer_id::text, min(o.price + o.shipping_price)::text as price
      from offers o
      join product_variants v on v.id = o.product_variant_id
      where v.product_id = any($1::uuid[])
        and o.retailer_id = any($2::uuid[])
        and o.availability = 'in_stock'
        and ${freshOfferSql('o')}
      group by v.product_id, o.retailer_id`,
      [productIds, retailerIds],
    )
    return result.rows.map(row => ({ productId: row.product_id, retailerId: row.retailer_id, price: Number(row.price) }))
  }

  /**
   * Products matching each saved search the same way the search box does
   * (name, brand, model or category), in stock now, that are either newer
   * than the search or within its max price. savedSearchReason decides.
   */
  async savedSearchMatches(perSearch = 30): Promise<SavedSearchMatch[]> {
    const result = await this.pool.query<{
      search_id: string
      user_id: string
      query: string
      max_price: string | null
      search_created_at: Date
      product_id: string
      name: string
      slug: string | null
      image_url: string | null
      product_created_at: Date
      store: string
      current: string
      previous: string | null
    }>(
      `select
        ss.id::text as search_id,
        ss.user_id::text as user_id,
        ss.query,
        ss.max_price::text as max_price,
        ss.created_at as search_created_at,
        m.product_id,
        m.name,
        m.slug,
        m.image_url,
        m.created_at as product_created_at,
        m.store,
        m.current::text as current,
        m.previous::text as previous
      from saved_searches ss
      cross join lateral (
        select
          p.id::text as product_id,
          p.name,
          p.slug,
          p.image_url,
          p.created_at,
          best.current,
          best.store,
          prev.previous
        from products p
        join product_variants pv on pv.product_id = p.id and pv.is_primary = true
        join categories c on c.id = p.category_id
        cross join lateral (
          select o.price + o.shipping_price as current, r.name as store
          from offers o
          join product_variants v on v.id = o.product_variant_id
          join retailers r on r.id = o.retailer_id
          where v.product_id = p.id and o.availability = 'in_stock' and ${freshOfferSql('o')}
          order by o.price + o.shipping_price
          limit 1
        ) best
        left join lateral (
          select min(po.price + po.shipping_price) as previous
          from price_observations po
          join offers o on o.id = po.offer_id
          join product_variants v on v.id = o.product_variant_id
          where v.product_id = p.id and po.observed_at::date = current_date - 1
        ) prev on true
        where (p.name ilike '%' || ss.query || '%' or p.brand ilike '%' || ss.query || '%'
            or pv.model ilike '%' || ss.query || '%' or c.name ilike '%' || ss.query || '%')
          and (p.created_at > ss.created_at or (ss.max_price is not null and best.current <= ss.max_price))
        order by best.current
        limit $1
      ) m`,
      [perSearch],
    )
    return result.rows.map(row => ({
      searchId: row.search_id,
      userId: row.user_id,
      query: row.query,
      maxPrice: row.max_price === null ? null : Number(row.max_price),
      searchCreatedAt: row.search_created_at.toISOString(),
      productId: row.product_id,
      name: row.name,
      slug: row.slug,
      imageUrl: row.image_url,
      productCreatedAt: row.product_created_at.toISOString(),
      store: row.store,
      current: Number(row.current),
      previous: row.previous === null ? null : Number(row.previous),
    }))
  }

  /** Event keys already sent, as "user|type|key". */
  async sentKeys(types: NotificationType[]): Promise<Set<string>> {
    const result = await this.pool.query<{ user_id: string; type: string; event_key: string }>(
      `select user_id::text, type, event_key from notification_events
      where type = any($1::text[]) and sent_at > now() - interval '400 days'`,
      [types],
    )
    return new Set(result.rows.map(row => sentKey(row.user_id, row.type, row.event_key)))
  }

  async markSent(userId: string, type: NotificationType, keys: string[]): Promise<void> {
    if (!keys.length) return
    await this.pool.query(
      `insert into notification_events (user_id, type, event_key)
      select $1::uuid, $2, unnest($3::text[])
      on conflict do nothing`,
      [userId, type, keys],
    )
  }

  /** Markers older than the longest dedupe window are no longer needed. */
  async pruneEvents(): Promise<void> {
    await this.pool.query(`delete from notification_events where sent_at < now() - interval '400 days'`)
  }
}
