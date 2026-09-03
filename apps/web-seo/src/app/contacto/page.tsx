import type { Metadata } from 'next'
import { CONTACT_EMAIL } from '../../lib/content'
import { H1, Lead, Card, H2, P, Shell } from '../../lib/page'
import { colors } from '../../lib/tokens'

export const metadata: Metadata = {
  title: 'Contacto — DóndeTa',
  description: 'Contacta a DóndeTa para correcciones, alianzas comerciales, publicidad o solicitudes de privacidad.',
  alternates: { canonical: '/contacto' },
}

export default function ContactPage() {
  return (
    <Shell>
      <H1>Contacto</H1>
      <Lead>Usa este canal para reportar precios incorrectos, solicitar correcciones, proponer alianzas o consultar sobre datos personales.</Lead>
      <Card>
        <H2>Correo</H2>
        <P>
          Escríbenos a <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: colors.primary }}>{CONTACT_EMAIL}</a>. Incluye el enlace del producto y la tienda relacionada cuando reportes un precio o disponibilidad.
        </P>
      </Card>
      <Card>
        <H2>Publicidad y colaboraciones</H2>
        <P>Evaluamos espacios comerciales siempre que no interfieran con la comparacion ni confundan al usuario. Los anuncios deben estar claramente separados del contenido editorial y de las acciones principales.</P>
      </Card>
    </Shell>
  )
}
