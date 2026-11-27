import { describe, expect, it } from 'vitest'
import { dropOverpricedPacks, feedRows, parseEnebaPrice, selectEnebaItems, withAffiliateId, type EnebaFeedRow } from './eneba.catalog'
import { acceptsCategory } from './ingestion.repository'

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

  // Regression: the first production run ingested 0/66 -- the repository's
  // appliance-only category guard rejected every Gaming item.
  it('produces items the repository accepts, without opening the guard to other stores', () => {
    const [item] = selectEnebaItems([row('roblox-roblox-800-robux-key-global', 'Roblox - 800 Robux Key GLOBAL', '555.99 DOP')], 'DOP')
    expect(acceptsCategory(item)).toBe(true)
    expect(acceptsCategory({ ...item, retailer: { ...item.retailer, slug: 'plaza-lama' } })).toBe(false)
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

  it('adds Project Zomboid and the plain Game Pass Ultimate listings, not the look-alikes', () => {
    const items = selectEnebaItems([
      row('steam-gift-project-zomboid-steam-gift-global', 'Project Zomboid Steam Gift GLOBAL', '502.31 DOP'),
      row('xbox-xbox-game-pass-ultimate-1-month-subscription-xbox-one-windows-10-xbox-live-key-latam', 'Xbox Game Pass Ultimate - 1 Month (LATAM)', '229.49 DOP'),
      row('xbox-xbox-game-pass-ultimate-1-month-trial-subscription-xbox-windows-non-stackable-key-latam', 'Xbox Game Pass Ultimate - 1 Month Trial (LATAM)', '234.53 DOP'),
      row('xbox-xbox-game-pass-ultimate-1-month-trial-subscription-xbox-windows-for-new-accounts-only-key-global', 'Xbox Game Pass Ultimate Trial, new accounts only', '264.34 DOP'),
      row('xbox-xbox-game-pass-ultimate-1-month-subscription-xbox-windows-non-stackable-key-global', 'Xbox Game Pass Ultimate - 1 Month (Global)', '263.50 DOP'),
    ], 'DOP')

    expect(items.map(item => [item.name, item.price]).sort()).toEqual([
      ['Project Zomboid (PC, Steam)', 502.31],
      ['Xbox Game Pass Ultimate (1 mes, Global)', 263.5],
      ['Xbox Game Pass Ultimate (1 mes, LATAM)', 229.49],
    ])
  })

  it('adds the Modern Warfare 4 Vault Edition but not its DLC or skins', () => {
    const items = selectEnebaItems([
      row('steam-call-of-duty-modern-warfare-4-vault-edition-steam-key-pc-global', 'Call of Duty: Modern Warfare 4 - Vault Edition Steam Key (PC) GLOBAL', '7409.38 DOP'),
      row('xbox-call-of-duty-modern-warfare-4-vault-edition-windows-xbox-series-x-s-xbox-live-key-global', 'Call of Duty: Modern Warfare 4 Vault Edition (Windows/Xbox Series X|S)', '5886.23 DOP'),
      row('other-call-of-duty-modern-warfare-4-zero-chill-operator-skin-dlc-ps4-ps5-xbox-one-xbox-series-x-pc-official-website-key-global', 'MW4 - Zero Chill Operator Skin (DLC)', '158.24 DOP'),
    ], 'DOP')
    expect(items.map(item => item.name).sort()).toEqual([
      'Call of Duty: Modern Warfare 4 Vault Edition (PC, Steam)',
      'Call of Duty: Modern Warfare 4 Vault Edition (Xbox / Windows)',
    ])
  })
})

describe('dropOverpricedPacks', () => {
  const pack = (name: string, price: number, group: 'recargas' | 'juegos' = 'recargas') => ({ rule: { group }, name, price })

  it('drops a pack a bigger one beats, and per-unit outliers (feed of 2026-11-27)', () => {
    const items = [
      pack('Minecraft 330 Minecoins', 134.53), pack('Minecraft 1000 Minecoins', 1721.63), pack('Minecraft 1720 Minecoins', 411.38),
      pack('Minecraft 3500 Minecoins', 1062.9), pack('Minecraft 8800 Minecoins', 2678.89),
      pack('Fortnite 1000 V-Bucks', 1869.91), pack('Fortnite 2800 V-Bucks', 4920.16), pack('Fortnite 5000 V-Bucks', 4920.82),
      pack('EA SPORTS FC 26 1050 FC Points (PC)', 594.44), pack('EA SPORTS FC 26 2800 FC Points (PC)', 1347.65),
    ]
    expect(dropOverpricedPacks(items).map(i => i.name)).toEqual([
      'Minecraft 330 Minecoins', 'Minecraft 1720 Minecoins', 'Minecraft 3500 Minecoins', 'Minecraft 8800 Minecoins',
      'Fortnite 1000 V-Bucks', 'Fortnite 5000 V-Bucks',
      'EA SPORTS FC 26 1050 FC Points (PC)', 'EA SPORTS FC 26 2800 FC Points (PC)',
    ])
  })

  it('leaves games and single packs alone', () => {
    const items = [pack('Cyberpunk 2077 (PC, GOG)', 9000, 'juegos'), pack('Hogwarts Legacy (PC, Steam)', 300, 'juegos'), pack('Roblox 400 Robux', 5000)]
    expect(dropOverpricedPacks(items)).toHaveLength(3)
  })
})
