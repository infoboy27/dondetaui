import { Pool } from 'pg'
import { cleanBrand } from './brands'

// Runs every ingestion cycle (deploy/ingestion-loop*.sh). Ingestion cleans
// brands on the way in, but products a retailer no longer lists -- or shared
// products, whose brand belongs to whoever created them -- keep whatever a
// broken scraper stored. Re-clean every product brand against its name.
const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is required')

const pool = new Pool({ connectionString: databaseUrl, max: 2 })

async function main() {
  const { rows } = await pool.query<{ id: string; brand: string; name: string }>('select id::text, brand, name from products')
  let fixed = 0
  for (const row of rows) {
    const brand = cleanBrand(row.brand, row.name)
    if (brand === row.brand) continue
    await pool.query('update products set brand = $2, updated_at = now() where id = $1', [row.id, brand])
    console.log(`[repair-brands] ${row.brand} -> ${brand}: ${row.name}`)
    fixed++
  }
  console.log(`[repair-brands] ${fixed} of ${rows.length} brands fixed`)
}

main()
  .catch(error => {
    console.error('[repair-brands] failed:', error)
    process.exitCode = 1
  })
  .finally(() => pool.end())
