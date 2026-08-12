// Fire-and-forget: alerting must never affect the request it's reporting on.
// Logs failures to the server console instead of throwing -- a Discord
// outage or a missing/misconfigured webhook URL should never turn into a
// 500 for a real user.
export function sendDiscordAlert(webhookUrl: string | undefined, content: string): void {
  if (!webhookUrl) return

  fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  }).catch(error => {
    console.error('[discord-alert] failed to send', error)
  })
}
