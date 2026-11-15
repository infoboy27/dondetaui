import path from 'node:path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // This app sits behind nginx at /product, /sitemap.xml, /robots.txt only —
  // see deploy/nginx.conf. Everything else stays on the existing Vite SPA.
  output: 'standalone',
  // Without this, Next.js guesses the workspace root from the nearest
  // lockfile and finds the unrelated root pnpm-lock.yaml one level up.
  outputFileTracingRoot: path.join(__dirname),
  // Fonts and logos the share card reads from disk at runtime (not imported,
  // so the tracer can't see them on its own).
  outputFileTracingIncludes: {
    '/product/[slug]/share-image': ['./assets/og/**/*'],
  },
}

export default nextConfig
