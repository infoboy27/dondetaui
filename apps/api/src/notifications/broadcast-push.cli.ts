import { Pool } from 'pg'
import { PushProvider } from './push.provider'

// One-off push to every registered device (e.g. the Black Friday kickoff).
// Dry run by default: it only reports how many devices would receive it.
//
//   node dist/notifications/broadcast-push.cli.js "<title>" "<body>"          # dry run
//   node dist/notifications/broadcast-push.cli.js "<title>" "<body>" --send   # really sends
const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is required')

const args = process.argv.slice(2)
const send = args.includes('--send')
const [title, body] = args.filter(arg => arg !== '--send')
if (!title || !body) {
  console.error('Usage: broadcast-push.cli.js "<title>" "<body>" [--send]')
  process.exit(1)
}

const pool = new Pool({ connectionString: databaseUrl, max: 2 })

async function main() {
  const result = await pool.query<{ token: string }>('select distinct token from push_tokens')
  const tokens = result.rows.map(row => row.token)
  console.log(`[broadcast] "${title}" — "${body}"`)
  console.log(`[broadcast] ${tokens.length} device(s) registered`)

  if (!send) {
    console.log('[broadcast] dry run — nothing sent (pass --send to send)')
    return
  }
  await new PushProvider().send(tokens, title, body)
  console.log('[broadcast] sent')
}

main()
  .catch(error => {
    console.error('[broadcast] failed:', error)
    process.exitCode = 1
  })
  .finally(() => pool.end())
