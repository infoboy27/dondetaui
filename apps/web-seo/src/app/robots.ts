import type { MetadataRoute } from 'next'
import { SITE_URL } from '../lib/site'

// Without this, Next.js pre-renders this route once at `next build` time --
// SITE_URL is only set at container runtime (docker-compose environment:),
// not available during the Docker build stage, so the static output would
// permanently bake in site.ts's fallback domain regardless of the real
// deployment's env. sitemap.ts already has this; robots.ts didn't.
export const dynamic = 'force-dynamic'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
