// The Resend SDK reports failures (unverified domain, bad key, rate limit) in
// the result instead of throwing. Plain module (no Nest imports) so the root
// vitest run can test it.
export interface SendResult {
  error?: { name?: string; message: string } | null
}

export function assertSent(result: SendResult): void {
  if (result.error) throw new Error(`email not sent (${result.error.name ?? 'error'}): ${result.error.message}`)
}
