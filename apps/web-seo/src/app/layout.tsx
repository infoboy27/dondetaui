import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { colors } from '../lib/tokens'

export const metadata: Metadata = {
  metadataBase: new URL('https://dondeta.jfmcss.com'),
}

const gaId = process.env.GA_MEASUREMENT_ID

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
      </head>
      <body style={{ margin: 0, background: colors.background, fontFamily: "'DM Sans', sans-serif" }}>
        {children}
      </body>
    </html>
  )
}
