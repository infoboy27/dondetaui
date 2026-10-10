import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { colors } from '../lib/tokens'
import { SITE_URL } from '../lib/site'

// Render every page at request time. SITE_URL, GA_MEASUREMENT_ID and
// ADSENSE_CLIENT_ID only exist in the container's runtime environment, not
// during `next build` -- statically pre-rendered pages (guías, metodología,
// sobre, términos, contacto) were shipping with the fallback canonical domain
// (dondeta.jfmcss.com) and no GA/AdSense tags. robots.ts and sitemap.ts
// already had this for the same reason.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
}

const gaId = process.env.GA_MEASUREMENT_ID
const adsenseClientId = process.env.ADSENSE_CLIENT_ID

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-DO">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap"
          rel="stylesheet"
        />
        {gaId && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`,
              }}
            />
          </>
        )}
        {adsenseClientId && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body style={{ margin: 0, background: colors.background, fontFamily: "'DM Sans', sans-serif" }}>
        {children}
      </body>
    </html>
  )
}
