import type { Metadata } from 'next'
import { CONTACT_EMAIL } from '../../lib/content'
import { H1, H2, Lead, P, Shell } from '../../lib/page'
import { colors } from '../../lib/tokens'

export const metadata: Metadata = {
  title: 'Contacto — DóndeTa',
  description:
    'Contacta a DóndeTa para reportar precios incorrectos, solicitar correcciones, proponer alianzas comerciales o hacer consultas sobre privacidad.',
  alternates: { canonical: '/contacto' },
}

export default function ContactPage() {
  return (
    <Shell>
      <H1>Contacto</H1>
      <Lead>
        Usa este canal para reportar precios incorrectos, solicitar correcciones, proponer alianzas o consultar sobre el
        tratamiento de datos personales.
      </Lead>

      <section style={{ marginBottom: 22 }}>
        <H2>Correo</H2>
        <P>
          Escríbenos a{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: colors.primary }}>{CONTACT_EMAIL}</a>. Respondemos en un
          plazo razonable. Si reportas un precio o un problema de disponibilidad, incluye el enlace de la ficha del
          producto en DóndeTa y, si lo tienes, el enlace de la tienda; así podemos verificar y corregir más rápido.
        </P>
      </section>

      <section style={{ marginBottom: 22 }}>
        <H2>Correcciones de datos</H2>
        <P>
          Si detectas un precio, una marca o una categoría equivocada en una ficha, avísanos. Corregimos los datos en el
          siguiente ciclo de actualización y, cuando aplica, ajustamos la regla que causó el error.
        </P>
      </section>

      <section style={{ marginBottom: 22 }}>
        <H2>Publicidad y colaboraciones</H2>
        <P>
          Evaluamos espacios comerciales siempre que no interfieran con el contenido ni confundan al usuario. Los
          anuncios deben estar claramente separados de la información editorial y de las acciones principales del sitio, y
          nunca alteran el orden de las ofertas.
        </P>
      </section>

      <section style={{ marginBottom: 22 }}>
        <H2>Privacidad</H2>
        <P>
          Para solicitudes sobre datos personales (acceso, corrección o eliminación) usa el mismo correo e indica
          &ldquo;privacidad&rdquo; en el asunto. Más detalles en la{' '}
          <a href="/privacy" style={{ color: colors.primary }}>política de privacidad</a>.
        </P>
      </section>
    </Shell>
  )
}
