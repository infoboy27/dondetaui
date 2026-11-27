import { Pool } from 'pg'
import { CANONICAL_CATEGORY_NAMES, canonicalCategory } from './category-overrides'

// Re-applies the category rules (category-overrides.ts) to products already
// in the database: ingestion only re-categorizes a product when its store
// lists it again, and never touches products several stores share. Run once
// after changing the rules; safe to repeat. Empty alias categories are left
// in place (nothing lists them any more).
//
//   node dist/ingestion/recategorize.cli.js            # dry run: prints the moves
//   node dist/ingestion/recategorize.cli.js --apply
const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is required')
const apply = process.argv.includes('--apply')
const pool = new Pool({ connectionString: databaseUrl, max: 2 })

async function main() {
  const { rows } = await pool.query<{ id: string; name: string; slug: string; category_name: string }>(
    `select p.id::text, p.name, c.slug, c.name as category_name
     from products p join categories c on c.id = p.category_id
     where c.slug <> 'gaming'`,
  )
  const moves = new Map<string, string[]>()
  for (const product of rows) {
    const target = canonicalCategory(product.name, product.slug)
    if (target === product.slug && !CANONICAL_CATEGORY_NAMES[target]) continue
    if (target === product.slug && CANONICAL_CATEGORY_NAMES[target] === product.category_name) continue
    const key = `${product.slug} -> ${target}`
    moves.set(key, [...(moves.get(key) ?? []), product.id])
    if (target !== product.slug) console.log(`[recategorize] ${key}: ${product.name}`)
  }

  let moved = 0
  for (const [key, ids] of moves) {
    const [from, to] = key.split(' -> ')
    if (from !== to) moved += ids.length
  }
  console.log(`[recategorize] ${moved} product(s) change category; canonical names refreshed for the rest`)
  if (!apply) {
    console.log('[recategorize] dry run: nothing changed (pass --apply)')
    return
  }

  const client = await pool.connect()
  try {
    await client.query('begin')
    for (const [key, ids] of moves) {
      const target = key.split(' -> ')[1]!
      const name = CANONICAL_CATEGORY_NAMES[target]
      // Canonical slugs get their canonical name; others keep theirs.
      const category = await client.query<{ id: string }>(
        name
          ? `insert into categories(name, slug) values ($1, $2) on conflict (slug) do update set name = excluded.name returning id::text`
          : `select id::text from categories where slug = $2 and $1::text is null`,
        [name ?? null, target],
      )
      if (!category.rows[0]) continue
      await client.query('update products set category_id = $1, updated_at = now() where id = any($2::uuid[])', [category.rows[0].id, ids])
    }
    await client.query('commit')
    console.log('[recategorize] applied')
  } catch (error) {
    await client.query('rollback')
    throw error
  } finally {
    client.release()
  }
}

main()
  .catch(error => {
    console.error('[recategorize] failed:', error)
    process.exitCode = 1
  })
  .finally(() => pool.end())
