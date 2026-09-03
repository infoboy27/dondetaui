import type { Metadata } from 'next'
import { H1, H2, Lead, P, Shell } from '../../lib/page'
import { colors, fonts } from '../../lib/tokens'

export const metadata: Metadata = {
  title: 'Sobre DóndeTa',
  description:
    'Qué es DóndeTa, para quién existe, cómo se sostiene y cómo ayuda a compradores en República Dominicana a decidir con más contexto.',
  alternates: { canonical: '/sobre-dondeta' },
}

export default function AboutPage() {
  return (
    <Shell>
      <H1>Sobre DóndeTa</H1>
      <Lead>
        DóndeTa es un proyecto dominicano que registra los precios publicados de electrodomésticos, tecnología y
        productos de alto valor, y guarda su historial para dar contexto antes de una compra.
      </Lead>

      <section style={{ marginBottom: 26 }}>
        <H2>Por qué existe</H2>
        <P>
          En República Dominicana comparar antes de comprar suele implicar visitar varias tiendas, abrir muchas fichas de
          producto, anotar precios y volver a confirmar días después. Para compras de varios miles de pesos —una nevera,
          un aire, una lavadora— ese esfuerzo vale la pena, pero es tedioso y fácil de hacer mal.
        </P>
        <P>
          DóndeTa automatiza la parte repetitiva: revisa los catálogos de las tiendas, guarda los precios y los organiza
          para que tengas un punto de partida claro. No vendemos productos ni sustituimos la confirmación final en la
          tienda.
        </P>
      </section>

      <section style={{ marginBottom: 26 }}>
        <H2>Qué encuentras en el sitio</H2>
        <P>
          Cada producto tiene una ficha con el precio actual, la tienda que lo publica, un historial de cómo ha cambiado
          ese precio (mínimo, máximo, variación y número de mediciones), la categoría y un enlace para verificar en la
          tienda original. Además publicamos guías de compra por categoría con los criterios que más pesan: capacidad,
          consumo, instalación, garantía y entrega.
        </P>
        <P>
          Hoy seguimos cinco cadenas dominicanas y la mayoría de los productos tiene una sola tienda con precio
          publicado, así que el valor principal está en el seguimiento del precio en el tiempo. A medida que crezca la
          cobertura, la comparación directa entre tiendas será más útil.
        </P>
      </section>

      <section style={{ marginBottom: 26 }}>
        <H2>Cómo se sostiene</H2>
        <P>
          El proyecto se financia con publicidad claramente identificada y separada del contenido, y eventualmente con
          acuerdos comerciales que no alteren el orden ni la selección de las ofertas. Las tiendas no pagan por aparecer
          ni por mejorar su posición. Los detalles de cómo recopilamos y presentamos los datos están en la{' '}
          <a href="/metodologia" style={{ color: colors.primary }}>metodología</a>.
        </P>
      </section>

      <section
        style={{ padding: 18, borderRadius: 14, background: colors.background, fontFamily: fonts.body, fontSize: 14, lineHeight: 1.7, color: colors.navy400 }}
      >
        ¿Encontraste un precio incorrecto o quieres proponer una colaboración? Escríbenos desde la página de{' '}
        <a href="/contacto" style={{ color: colors.primary }}>contacto</a>.
      </section>
    </Shell>
  )
}
