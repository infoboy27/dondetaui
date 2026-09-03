import type { Metadata } from 'next'
import { H1, H2, Lead, P, Shell } from '../../lib/page'

export const metadata: Metadata = {
  title: 'Términos de uso — DóndeTa',
  description:
    'Condiciones de uso de DóndeTa y aclaraciones sobre precios, disponibilidad, historial, enlaces externos y uso permitido del sitio.',
  alternates: { canonical: '/terminos' },
}

export default function TermsPage() {
  return (
    <Shell>
      <H1>Términos de uso</H1>
      <Lead>
        Al usar DóndeTa aceptas que la información publicada es referencial y debe verificarse con la tienda antes de
        comprar.
      </Lead>

      <section style={{ marginBottom: 22 }}>
        <H2>Precios y disponibilidad</H2>
        <P>
          Los precios y la disponibilidad provienen de información publicada por las tiendas y pueden cambiar sin aviso.
          DóndeTa no garantiza inventario, promociones, financiamiento, instalación, envío ni las condiciones finales de
          venta. El precio y las condiciones definitivas son los que confirme la tienda al momento de la compra.
        </P>
      </section>

      <section style={{ marginBottom: 22 }}>
        <H2>Historial de precio</H2>
        <P>
          El historial que mostramos se basa en las mediciones que ha tomado DóndeTa y es relativo a la propia trayectoria
          del producto en la tienda que lo publica. No constituye un precio de mercado, una comparación exhaustiva entre
          todos los comercios ni un pronóstico de precios futuros.
        </P>
      </section>

      <section style={{ marginBottom: 22 }}>
        <H2>Enlaces externos</H2>
        <P>
          Algunas fichas enlazan a tiendas externas. Cada tienda es responsable de su propio contenido, proceso de
          compra, garantía y servicio al cliente. DóndeTa no participa en la transacción ni obtiene comisión por ella.
        </P>
      </section>

      <section style={{ marginBottom: 22 }}>
        <H2>Uso permitido</H2>
        <P>
          Puedes consultar y compartir enlaces del sitio libremente. No está permitido extraer datos de forma masiva o
          automatizada, interferir con el funcionamiento del servicio, ni presentar la información de DóndeTa como propia
          sin atribución.
        </P>
      </section>

      <section style={{ marginBottom: 22 }}>
        <H2>Cambios en estos términos</H2>
        <P>
          Podemos actualizar estos términos cuando cambie el funcionamiento del sitio. La versión vigente es siempre la
          publicada en esta página.
        </P>
      </section>
    </Shell>
  )
}
