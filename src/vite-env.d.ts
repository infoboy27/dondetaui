/// <reference types="vite/client" />

// Injected by the figma-site-configuration Vite plugin (vite.config.ts) only
// when .figma/make/site.json sets analytics.googleAnalyticsId — absent (and
// this stays undefined) until that's configured.
interface Window {
  gtag?: (...args: unknown[]) => void
}
