import type { NormalizedRetailerItem } from './ingestion.types'

// Eneba's affiliate feed (products.csv?country=..&af_id=dondeta) is the whole
// marketplace: ~46k keys, mostly obscure DLC, plus sellers asking absurd
// prices. DóndeTa shows a short, curated list instead: the top-ups and
// subscriptions people in DR/CO/MX actually buy, and well-known PC games.
// Everything in a country's feed is already activatable in that country
// (Eneba filters by region), so no region logic here.
//
// Excluded on purpose: e-money vouchers (Razer Gold, RewUp, OffGamers, Eneba
// gift cards...) earn no commission under the affiliate terms.

export const ENEBA_AFFILIATE_ID = 'dondeta'
export const ENEBA_DISCOUNT_CODE = 'dondeta'

export type EnebaGroup = 'recargas' | 'suscripciones' | 'juegos'

export interface EnebaFeedRow {
  id: string
  title: string
  link: string
  image_link: string
  availability: string
  price: string
  brand: string
}

interface Rule {
  group: EnebaGroup
  brand: string
  // Returns the Spanish display name, or null when the row isn't this product.
  name: (row: EnebaFeedRow) => string | null
}

const amount = (value: string) => Number(value.replace(/[,.]/g, '')).toLocaleString('es-DO')

function byId(re: RegExp, label: (n: string) => string) {
  return (row: EnebaFeedRow) => {
    const match = row.id.match(re)
    return match ? label(amount(match[1])) : null
  }
}

function byTitle(re: RegExp, label: (n: string) => string) {
  return (row: EnebaFeedRow) => {
    const match = row.title.match(re)
    return match ? label(amount(match[1])) : null
  }
}

const ROBUX_CARDS = new Set([400, 800, 1700, 2000, 4500, 10000])

// Exact Eneba ids: stable across the do/co/mx feeds, and immune to the
// marketplace's look-alike listings.
const GAMES: Record<string, string> = {
  'rockstar-social-club-grand-theft-auto-v-enhanced-pc-rockstar-games-launcher-key-global': 'Grand Theft Auto V Enhanced (PC, Rockstar)',
  'rockstar-social-club-red-dead-redemption-2-pc-rockstar-key-global': 'Red Dead Redemption 2 (PC, Rockstar)',
  'steam-hogwarts-legacy-pc-steam-key-global': 'Hogwarts Legacy (PC, Steam)',
  'other-minecraft-java-bedrock-edition-pc-official-website-key-global': 'Minecraft: Java & Bedrock Edition (PC, Mojang)',
  'ea-app-ea-sports-fc-26-standard-edition-ea-app-key-pc-global': 'EA SPORTS FC 26 (PC, EA App)',
  'gog-cyberpunk-2077-gog-key-global': 'Cyberpunk 2077 (PC, GOG)',
  'steam-black-myth-wukong-pc-steam-key-global': 'Black Myth: Wukong (PC, Steam)',
  'steam-helldivers-2-pc-steam-key-global': 'Helldivers 2 (PC, Steam)',
  'steam-nba-2k26-steam-key-pc-global': 'NBA 2K26 (PC, Steam)',
  'steam-god-of-war-pc-steam-key-global': 'God of War (PC, Steam)',
  'steam-marvels-spider-man-remastered-pc-steam-key-global': "Marvel's Spider-Man Remastered (PC, Steam)",
  'steam-hollow-knight-silksong-pc-steam-key-global': 'Hollow Knight: Silksong (PC, Steam)',
  'steam-euro-truck-simulator-2-steam-key-global': 'Euro Truck Simulator 2 (PC, Steam)',
  'ea-app-battlefield-6-ea-app-pc-key-global': 'Battlefield 6 (PC, EA App)',
  'gog-the-witcher-3-wild-hunt-remastered-pc-gog-key-global': 'The Witcher 3: Wild Hunt (PC, GOG)',
  'steam-mortal-kombat-11-ultimate-steam-key-global': 'Mortal Kombat 11 Ultimate (PC, Steam)',
  'steam-dead-by-daylight-steam-key-global': 'Dead by Daylight (PC, Steam)',
  'steam-gift-project-zomboid-steam-gift-global': 'Project Zomboid (PC, Steam)',
}

// Game Pass Ultimate: only the plain 1-month listings. The feed is full of
// look-alikes ("trial", "for new accounts only", "valid for a week after
// purchase") that cost the same but aren't the product people expect. Which of
// these exist depends on the country feed (DR has none; CO and MX have theirs).
const GAME_PASS_ULTIMATE: Record<string, string> = {
  'xbox-xbox-game-pass-ultimate-1-month-subscription-xbox-one-windows-10-xbox-live-key-latam': 'Xbox Game Pass Ultimate (1 mes, LATAM)',
  'xbox-xbox-game-pass-ultimate-1-month-subscription-xbox-one-windows-10-xbox-live-key-mexico': 'Xbox Game Pass Ultimate (1 mes, México)',
  'xbox-xbox-game-pass-ultimate-1-month-subscription-xbox-one-windows-10-xbox-live-key-colombia': 'Xbox Game Pass Ultimate (1 mes, Colombia)',
  'xbox-xbox-game-pass-ultimate-1-month-subscription-xbox-windows-non-stackable-key-global': 'Xbox Game Pass Ultimate (1 mes, Global)',
}

const RULES: Rule[] = [
  { group: 'recargas', brand: 'Garena', name: byId(/^top-up-free-fire-(\d+)-diamonds/, n => `Free Fire ${n} diamantes`) },
  {
    group: 'recargas',
    brand: 'Roblox',
    // Only Roblox's own card denominations; the marketplace also lists odd
    // amounts (1,800 Robux costing more than 2,000).
    name: row => {
      const match = row.title.match(/^Roblox - ([\d,]+) Robux Key GLOBAL$/i)
      const robux = match ? Number(match[1].replace(/,/g, '')) : 0
      return ROBUX_CARDS.has(robux) ? `Roblox ${amount(String(robux))} Robux` : null
    },
  },
  { group: 'recargas', brand: 'Epic Games', name: byTitle(/^Fortnite - (\d+) V-Bucks Gift Card Key GLOBAL$/i, n => `Fortnite ${n} V-Bucks`) },
  { group: 'recargas', brand: 'Riot Games', name: byTitle(/^Valorant Points (\d+) VP Key/i, n => `Valorant ${n} VP`) },
  { group: 'recargas', brand: 'Riot Games', name: byTitle(/^League of Legends Gift Card - (\d+) RP/i, n => `League of Legends ${n} RP`) },
  { group: 'recargas', brand: 'Moonton', name: byId(/^mdirect-mobile-legends-mobile-legends-bang-bang-\d+-usd-(\d+)-diamonds/, n => `Mobile Legends ${n} diamantes`) },
  { group: 'recargas', brand: 'NetEase Games', name: byId(/^top-up-marvel-rivals-pc-playstation-xbox-(\d+)-lattices/, n => `Marvel Rivals ${n} Lattices`) },
  { group: 'recargas', brand: 'Electronic Arts', name: byTitle(/^EA Sports FC 26 - (\d+) FC Points Origin Key GLOBAL$/i, n => `EA SPORTS FC 26 ${n} FC Points (PC)`) },
  { group: 'recargas', brand: 'Mojang', name: byTitle(/^Minecraft: Minecoins Pack: (\d+) Coins/i, n => `Minecraft ${n} Minecoins`) },
  { group: 'recargas', brand: 'Blizzard', name: byTitle(/^Overwatch 2 - (\d+) Overwatch Coins Battle\.net Key GLOBAL$/i, n => `Overwatch 2 ${n} Coins`) },
  {
    group: 'suscripciones',
    brand: 'Microsoft',
    name: row =>
      row.id === 'xbox-xbox-game-pass-for-pc-1-month-windows-store-non-stackable-key-global'
        ? 'Xbox Game Pass para PC (1 mes)'
        : GAME_PASS_ULTIMATE[row.id] ?? null,
  },
  { group: 'juegos', brand: '', name: row => GAMES[row.id] ?? null },
]

const SUBTITLES: Record<EnebaGroup, string> = {
  recargas: 'Recarga digital · Entrega inmediata',
  suscripciones: 'Suscripción digital · Entrega inmediata',
  juegos: 'Juego para PC · Código digital',
}

export function parseEnebaPrice(value: string, currency: string): number | null {
  const match = value.trim().match(/^([\d.]+)\s+([A-Z]{3})$/)
  if (!match || match[2] !== currency) return null
  const price = Number(match[1])
  return Number.isFinite(price) && price > 0 ? price : null
}

// The feed's links already carry af_id; make sure, since a link without it
// earns nothing.
export function withAffiliateId(link: string): string {
  const url = new URL(link)
  url.searchParams.set('af_id', ENEBA_AFFILIATE_ID)
  return url.toString()
}

export function selectEnebaItems(rows: EnebaFeedRow[], currency: string): NormalizedRetailerItem[] {
  const best = new Map<string, { row: EnebaFeedRow; rule: Rule; name: string; price: number }>()
  for (const row of rows) {
    if (row.availability !== 'in stock') continue
    const price = parseEnebaPrice(row.price, currency)
    if (price === null) continue
    for (const rule of RULES) {
      const name = rule.name(row)
      if (!name) continue
      const current = best.get(name)
      if (!current || price < current.price) best.set(name, { row, rule, name, price })
      break
    }
  }

  return [...best.values()].map(({ row, rule, name, price }) => ({
    retailer: {
      name: 'Eneba',
      slug: 'eneba',
      abbr: 'EN',
      primaryColor: '#6C2BD9',
      websiteUrl: 'https://www.eneba.com/latam',
    },
    externalSku: row.id,
    sourceUrl: withAffiliateId(row.link),
    name,
    brand: rule.brand || row.brand || 'Eneba',
    model: row.id,
    subtitle: SUBTITLES[rule.group],
    categoryName: 'Gaming',
    categorySlug: 'gaming',
    imageUrl: row.image_link || undefined,
    price,
    shippingPrice: 0,
    available: true,
    raw: { source: 'eneba-feed', group: rule.group, title: row.title, price: row.price, digital: true },
  }))
}

// RFC 4180 CSV (quoted fields, doubled quotes, commas/newlines inside quotes).
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else quoted = false
      } else field += c
    } else if (c === '"') quoted = true
    else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else if (c !== '\r') field += c
  }
  if (field || row.length) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

export function feedRows(csv: string): EnebaFeedRow[] {
  const [header, ...lines] = parseCsv(csv)
  if (!header) return []
  const cols = header.map(h => h.trim())
  const at = (name: string) => cols.indexOf(name)
  const idx = {
    id: at('id'), title: at('title'), link: at('link'), image_link: at('image_link'),
    availability: at('availability'), price: at('price'), brand: at('brand'),
  }
  if (Object.values(idx).some(i => i < 0)) throw new Error(`Eneba feed: unexpected header ${cols.join(',')}`)
  return lines
    .filter(line => line.length === cols.length)
    .map(line => ({
      id: line[idx.id].trim(),
      title: line[idx.title].trim(),
      link: line[idx.link].trim(),
      image_link: line[idx.image_link].trim(),
      availability: line[idx.availability].trim(),
      price: line[idx.price].trim(),
      brand: line[idx.brand].trim(),
    }))
}
