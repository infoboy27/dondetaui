import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BUYING_GUIDES, findGuide, guideReadingMinutes } from '../../../lib/content'
import { H1, H2, H3, Lead, List, P, Shell } from '../../../lib/page'
import { SITE_URL } from '../../../lib/site'
import { colors, fonts } from '../../../lib/tokens'

interface Props {
  params: Promise<{ slug: string }>
}

function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}

export function generateStaticParams() {
  return BUYING_GUIDES.map(guide => ({ slug: guide.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const guide = findGuide(slug)
  if (!guide) return {}
  return {
    title: `${guide.title} — DóndeTa`,
    description: guide.description,
    alternates: { canonical: `/guias/${guide.slug}` },
    openGraph: { title: guide.title, description: guide.description, type: 'article' },
  }
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params
  const guide = findGuide(slug)
  if (!guide) notFound()

  const related = (guide.related ?? [])
    .map(findGuide)
    .filter((g): g is NonNullable<typeof g> => Boolean(g))

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.description,
    datePublished: guide.updated,
    dateModified: guide.updated,
    author: { '@type': 'Organization', name: 'DóndeTa' },
    publisher: { '@type': 'Organization', name: 'DóndeTa' },
    mainEntityOfPage: `${SITE_URL}/guias/${guide.slug}`,
  }

  const faqLd = guide.faqs?.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: guide.faqs.map(f => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      }
    : null

  return (
    <Shell>
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(articleLd) }} />
      {faqLd && (
        // eslint-disable-next-line @next/next/no-sync-scripts
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(faqLd) }} />
      )}

      <p style={{ fontFamily: fonts.body, fontSize: 13, color: colors.navy400, margin: '0 0 10px' }}>
        <a href="/guias" style={{ color: colors.navy400, textDecoration: 'none' }}>Guías</a> ·{' '}
        {guideReadingMinutes(guide)} min · actualizada el {guide.updated}
      </p>

      <H1>{guide.title}</H1>
      {guide.intro.map((paragraph, i) => (
        <Lead key={i}>{paragraph}</Lead>
      ))}

      {guide.sections.map(section => (
        <section key={section.title} style={{ marginBottom: 26 }}>
          <H2>{section.title}</H2>
          {section.body.map((paragraph, i) => (
            <P key={i}>{paragraph}</P>
          ))}
          {section.list && <List items={section.list} />}
        </section>
      ))}

      {guide.faqs?.length ? (
        <section style={{ marginBottom: 26 }}>
          <H2>Preguntas frecuentes</H2>
          {guide.faqs.map(faq => (
            <div key={faq.q} style={{ marginBottom: 14 }}>
              <H3>{faq.q}</H3>
              <P>{faq.a}</P>
            </div>
          ))}
        </section>
      ) : null}

      <section
        style={{ marginTop: 8, padding: 18, borderRadius: 14, background: colors.background, fontFamily: fonts.body, fontSize: 13, lineHeight: 1.7, color: colors.navy400 }}
      >
        DóndeTa no vende productos. Esta guía es orientación general; confirma precio final, disponibilidad, garantía y
        condiciones con la tienda antes de comprar. Para ver precios y su historial, abre el{' '}
        <a href="/search" style={{ color: colors.primary }}>comparador</a>.
      </section>

      {related.length > 0 && (
        <section style={{ marginTop: 26 }}>
          <H2>Guías relacionadas</H2>
          <div style={{ display: 'grid', gap: 10 }}>
            {related.map(g => (
              <a
                key={g.slug}
                href={`/guias/${g.slug}`}
                style={{ display: 'block', padding: 14, borderRadius: 12, border: `1px solid ${colors.border}`, background: colors.card, textDecoration: 'none' }}
              >
                <strong style={{ fontFamily: fonts.display, fontSize: 14, color: colors.navy }}>{g.title}</strong>
                <span style={{ display: 'block', marginTop: 4, fontFamily: fonts.body, fontSize: 12, color: colors.navy400 }}>
                  {g.description}
                </span>
              </a>
            ))}
          </div>
        </section>
      )}
    </Shell>
  )
}
