import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BUYING_GUIDES } from '../../../lib/content'
import { H1, Lead, Card, H2, P, Shell } from '../../../lib/page'

interface Props {
  params: Promise<{ slug: string }>
}

function findGuide(slug: string) {
  return BUYING_GUIDES.find(guide => guide.slug === slug)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const guide = findGuide(slug)
  if (!guide) return {}
  return {
    title: `${guide.title} — DóndeTa`,
    description: guide.description,
    alternates: { canonical: `/guias/${guide.slug}` },
  }
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params
  const guide = findGuide(slug)
  if (!guide) notFound()

  return (
    <Shell>
      <H1>{guide.title}</H1>
      <Lead>{guide.intro}</Lead>
      {guide.sections.map(section => (
        <Card key={section.title}>
          <H2>{section.title}</H2>
          <P>{section.body}</P>
        </Card>
      ))}
    </Shell>
  )
}
