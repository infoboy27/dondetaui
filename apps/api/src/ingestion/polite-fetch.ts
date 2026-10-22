// Plain-HTTP fetch for retailer sites that allow crawling but throttle: an
// identifying User-Agent, a pause between requests and a back-off on 429/5xx
// (Shopify answers 429 after a handful of quick requests).
const USER_AGENT = 'Mozilla/5.0 (compatible; DondeTaBot/1.0; +https://dondeta.com.do/metodologia)'

export const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))

export async function politeFetch(url: string, init: RequestInit = {}, attempts = 5): Promise<Response> {
  for (let attempt = 1; ; attempt++) {
    const response = await fetch(url, {
      ...init,
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/json', ...init.headers },
    })
    if (response.ok) return response
    const retryable = response.status === 429 || response.status >= 500
    if (!retryable || attempt >= attempts) throw new Error(`${url}: HTTP ${response.status}`)
    const retryAfter = Number(response.headers.get('retry-after'))
    await sleep((Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 15 * attempt) * 1_000)
  }
}
