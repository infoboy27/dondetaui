// Turns an Instagram caption into a Facebook one. Pure (no Nest), so the root
// test run can load it. Instagram captions point to "(link en la bio)" because
// links aren't clickable there; on Facebook they are, so the bio lines go and a
// direct link takes their place. Facebook also reads better with fewer hashtags.
const BIO_LINK = /\((?:link en la bio|link in bio)\)/i
const MAX_HASHTAGS = 3

export function facebookCaption(instagramCaption: string, link: string | null): string {
  const lines = instagramCaption.split('\n').filter(line => !BIO_LINK.test(line))

  let tagIndex = -1
  lines.forEach((line, i) => {
    if (/^(#\S+\s*)+$/.test(line.trim())) tagIndex = i
  })
  const tags = tagIndex >= 0 ? lines.splice(tagIndex, 1)[0]!.trim().split(/\s+/).slice(0, MAX_HASHTAGS).join(' ') : ''

  const body = lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()
  return [body, link ? `👉 ${link}` : '', tags].filter(Boolean).join('\n\n')
}

/** The post's link, tagged so Facebook traffic shows up as such in analytics. */
export function facebookLink(siteUrl: string, path: string, campaign: string): string {
  const url = new URL(path, siteUrl.endsWith('/') ? siteUrl : `${siteUrl}/`)
  url.searchParams.set('utm_source', 'facebook')
  url.searchParams.set('utm_medium', 'social')
  url.searchParams.set('utm_campaign', campaign)
  return url.toString()
}
