import type { Metadata } from 'next'
import { H1, H2, Lead, List, P, Shell } from '../../lib/page'
import { colors, fonts } from '../../lib/tokens'

export const metadata: Metadata = {
  title: 'Metodología de DóndeTa — cómo recopilamos y presentamos precios',
  description:
    'Cómo DóndeTa obtiene los precios publicados, cada cuánto los actualiza, cómo construye el historial de cada producto y qué limitaciones tienen los datos.',
  alternates: { canonical: '/metodologia' },
}

export default function MethodologyPage() {
  return (
    <Shell>
      <H1>Metodología</H1>
      <Lead>
        DóndeTa publica precios como referencia informativa. Aquí explicamos de dónde salen los datos, con qué frecuencia
        se actualizan y qué puedes y qué no puedes concluir de ellos.
      </Lead>

      <section style={{ marginBottom: 26 }}>
        <H2>Fuentes de datos</H2>
        <P>
          Los precios provienen de la información que las propias tiendas publican en sus catálogos en línea. Actualmente
          seguimos cinco cadenas dominicanas: Plaza Lama, Jumbo, Sirena, Corripio y PriceSmart. Cada oferta conserva el
          nombre de la tienda y, cuando está disponible, el enlace directo a la ficha original para que puedas verificar.
        </P>
        <P>
          No recibimos pagos de las tiendas por incluir o destacar productos. Cuando exista publicidad en el sitio, estará
          claramente separada del contenido y no altera el orden de las ofertas.
        </P>
      </section>

      <section style={{ marginBottom: 26 }}>
        <H2>Frecuencia de actualización</H2>
        <P>
          El sistema revisa los catálogos en ciclos programados, varias veces por semana. En cada ciclo se guarda el
          precio publicado de ese día para cada producto. A cada uno de esos registros lo llamamos una <em>medición</em>.
          El número de mediciones que aparece en una ficha indica cuánto historial tiene ese producto.
        </P>
      </section>

      <section style={{ marginBottom: 26 }}>
        <H2>Cómo se construye el historial</H2>
        <P>Para cada producto, a partir de sus mediciones calculamos y mostramos:</P>
        <List
          items={[
            'Precio actual: el más reciente que hemos registrado, o el de la oferta en vivo cuando la tenemos.',
            'Mínimo y máximo registrados, con la fecha en que ocurrieron.',
            'Variación total: la diferencia entre la primera medición y la actual.',
            'Número de cambios de precio en el periodo observado.',
          ]}
        />
        <P>
          Estos valores son relativos a la propia historia del producto en la tienda que lo publica. No son un precio de
          mercado ni una comparación entre todos los comercios del país.
        </P>
      </section>

      <section style={{ marginBottom: 26 }}>
        <H2>Ordenamiento de ofertas</H2>
        <P>
          Cuando un producto tiene precio en más de una tienda, primero mostramos las ofertas disponibles y luego las
          ordenamos por costo total estimado. El costo total incluye el envío cuando la tienda publica ese dato; si no,
          mostramos el precio de lista y una advertencia para verificar condiciones. Por eso el primer resultado no
          siempre es el de menor precio de lista.
        </P>
        <P>
          Hoy la mayoría de los productos dominicanos tiene una sola tienda con precio publicado, porque las cadenas
          venden referencias distintas y el emparejamiento entre catálogos todavía es limitado. En esos casos la ficha
          funciona como registro histórico y punto de verificación.
        </P>
      </section>

      <section style={{ marginBottom: 26 }}>
        <H2>Páginas que mantenemos fuera del índice</H2>
        <P>
          Las fichas con una sola tienda y menos de cinco mediciones aportan poco contexto por sí solas. Las marcamos con
          <code style={{ fontFamily: 'monospace', fontSize: 13 }}> noindex </code>
          y las dejamos fuera del sitemap hasta que acumulen más historial, para que el sitio no dependa de páginas casi
          vacías.
        </P>
      </section>

      <section
        style={{ padding: 18, borderRadius: 14, background: colors.background, fontFamily: fonts.body, fontSize: 14, lineHeight: 1.7, color: colors.navy400 }}
      >
        <strong style={{ color: colors.navy }}>Limitaciones.</strong> Una tienda puede cambiar precios sin aviso, retirar
        inventario o aplicar condiciones por sucursal. El historial no predice precios futuros ni garantiza
        disponibilidad. DóndeTa es una herramienta de contexto para una decisión de compra, no una garantía de precio
        final. Verifica siempre con la tienda antes de comprar.
      </section>
    </Shell>
  )
}
