// Fire-and-forget: alerting must never affect the request it's reporting on.
// Logs failures to the server console instead of throwing -- a Discord
// outage or a missing/misconfigured webhook URL should never turn into a
// 500 for a real user. 3 s timeout so a hung Discord never piles up sockets;
// no mentions, since some content (sign-up attribution) comes from users.
export function sendDiscordAlert(webhookUrl: string | undefined, content: string): void {
  if (!webhookUrl) return

  fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, allowed_mentions: { parse: [] } }),
    signal: AbortSignal.timeout(3_000),
  }).catch(error => {
    console.error('[discord-alert] failed to send', error instanceof Error ? error.message : error)
  })
}

// New-account alerts: DISCORD_WEBHOOK_SIGNUPS, or the older
// DISCORD_WEBHOOK_REGISTRATIONS if only that one is set.
export function signupsWebhook(env: Record<string, string | undefined> = process.env): string | undefined {
  return env.DISCORD_WEBHOOK_SIGNUPS?.trim() || env.DISCORD_WEBHOOK_REGISTRATIONS?.trim() || undefined
}
