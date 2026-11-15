import { Pool } from 'pg'
import { PushProvider } from './push.provider'
import { PushTokensRepository } from './push-tokens.repository'

// One-off push to every registered device (e.g. the Black Friday kickoff).
// Dry run by default: it only reports how many devices would receive it.
// Manual and explicit, so it does not depend on PUSH_NOTIFICATIONS_ENABLED.
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
const pushTokens = new PushTokensRepository(pool)

async function main() {
  const tokens = await pushTokens.activeTokens()
  console.log(`[broadcast] "${title}" — "${body}"`)
  console.log(`[broadcast] ${tokens.length} active device(s) registered`)

  if (!send) {
    console.log('[broadcast] dry run — nothing sent (pass --send to send)')
    return
  }
  const outcome = await new PushProvider().send(tokens.map(to => ({ to, title: title!, body: body!, sound: 'default' as const })))
  await pushTokens.savePendingTickets(outcome.pending)
  await pushTokens.disable(outcome.disable)
  console.log(`[broadcast] sent: ${outcome.pending.length} accepted, ${outcome.disable.length} token(s) disabled`)
}

main()
  .catch(error => {
    console.error('[broadcast] failed:', error)
    process.exitCode = 1
  })
  .finally(() => pool.end())
