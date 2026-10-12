import { describe, expect, it } from 'vitest'
import { feedRows, parseEnebaPrice, selectEnebaItems, withAffiliateId, type EnebaFeedRow } from './eneba.catalog'

const HEADER = 'id, title, original_title, description, link, image_link, availability, price, google_product_category, brand, region, condition, identifier_exists'

function row(id: string, title: string, price: string, availability = 'in stock'): EnebaFeedRow {
  return {
    id,
    title,
    link: `https://www.eneba.com/latam/${id}?af_id=dondeta&currency=DOP`,
    image_link: `https://products.eneba.games/${id}.jpeg`,
    availability,
    price,
    brand: 'Some Brand',
  }
}

describe('Eneba catalog', () => {
  it('parses the CSV feed, including quoted titles with commas', () => {
    const csv = `${HEADER}\nsteam-hogwarts-legacy-pc-steam-key-global,"Hogwarts Legacy, Steam Key (PC) GLOBAL","x",,https://www.eneba.com/latam/a?af_id=dondeta,https://img/a.jpeg,"in stock","338.07 DOP",1279,"Warner",global,new,no\n`
    const [parsed] = feedRows(csv)
    expect(parsed.title).toBe('Hogwarts Legacy, Steam Key (PC) GLOBAL')
    expect(parsed.price).toBe('338.07 DOP')
  })

  it('keeps only curated products, named in Spanish, cheapest listing per product', () => {
    const items = selectEnebaItems([
      row('top-up-free-fire-100-diamonds-aaaaa-global', 'Top Up Free Fire Diamonds Global', '77.39 DOP'),
      row('top-up-free-fire-100-diamonds-bbbbb-global', 'Top Up Free Fire Diamonds Global', '90.00 DOP'),
      row('roblox-roblox-800-robux-key-global', 'Roblox - 800 Robux Key GLOBAL', '555.99 DOP'),
      row('steam-hogwarts-legacy-pc-steam-key-global', 'Hogwarts Legacy Steam Key (PC) GLOBAL', '338.07 DOP'),
      row('steam-obscure-dlc-steam-key-global', 'Obscure (DLC) Steam Key GLOBAL', '50.00 DOP'),
      row('razer-gold-gift-card-5-usd-key-global', 'Razer Gold Gift Card 5 USD Key GLOBAL', '288.52 DOP'),
    ], 'DOP')

    expect(items.map(item => [item.name, item.price]).sort()).toEqual([
      ['Free Fire 100 diamantes', 77.39],
      ['Hogwarts Legacy (PC, Steam)', 338.07],
      ['Roblox 800 Robux', 555.99],
    ])
    expect(items.every(item => item.categorySlug === 'gaming' && item.retailer.slug === 'eneba')).toBe(true)
  })

  it('skips out-of-stock rows, other currencies and odd Robux amounts', () => {
    const items = selectEnebaItems([
      row('roblox-roblox-400-robux-key-global', 'Roblox - 400 Robux Key GLOBAL', '405.96 DOP', 'out of stock'),
      row('roblox-roblox-800-robux-key-global', 'Roblox - 800 Robux Key GLOBAL', '9.99 EUR'),
      row('roblox-roblox-1800-robux-key-global', 'Roblox - 1,800 Robux Key GLOBAL', '1615.02 DOP'),
    ], 'DOP')
    expect(items).toEqual([])
  })

  it('always links with the affiliate id', () => {
    expect(withAffiliateId('https://www.eneba.com/latam/x?currency=DOP')).toBe('https://www.eneba.com/latam/x?currency=DOP&af_id=dondeta')
    expect(withAffiliateId('https://www.eneba.com/latam/x?af_id=other')).toBe('https://www.eneba.com/latam/x?af_id=dondeta')
  })

  it('reads prices only in the expected currency', () => {
    expect(parseEnebaPrice('60.42 DOP', 'DOP')).toBe(60.42)
    expect(parseEnebaPrice('0.00 DOP', 'DOP')).toBeNull()
    expect(parseEnebaPrice('60.42 DOP', 'MXN')).toBeNull()
  })
})
