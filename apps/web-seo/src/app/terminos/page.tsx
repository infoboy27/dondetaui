import type { Metadata } from 'next'
import { H1, H2, Lead, P, Shell } from '../../lib/page'

export const metadata: Metadata = {
  title: 'Términos de uso — DóndeTa',
  description:
    'Condiciones de uso de DóndeTa: precios, disponibilidad, historial, enlaces externos, reseñas (tolerancia cero con el contenido ofensivo) y uso permitido.',
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
          compra, garantía y servicio al cliente. DóndeTa no participa en la transacción. Algunos enlaces son de
          afiliado (por ejemplo, Eneba y Amazon): si compras a través de ellos, DóndeTa puede recibir una comisión sin
          costo adicional para ti, y eso no cambia qué opción mostramos como más barata.
        </P>
      </section>

      <section style={{ marginBottom: 22 }}>
        <H2>Cuentas y reseñas</H2>
        <P>
          Con una cuenta puedes publicar reseñas de productos en el sitio y en la app. Eres responsable de lo que
          publicas, que debe ser tu experiencia real con el producto.
        </P>
        <P>
          <strong>Tolerancia cero con el contenido ofensivo y los usuarios abusivos.</strong> No se permiten insultos,
          lenguaje discriminatorio u ofensivo, amenazas, contenido sexual, datos personales de otras personas, spam,
          publicidad ni reseñas falsas. Filtramos automáticamente el lenguaje ofensivo antes de publicar.
        </P>
        <P>
          Cualquier persona puede reportar una reseña (opción «Reportar») u ocultar las reseñas de un usuario («Ocultar
          reseñas de este usuario»). Revisamos los reportes en menos de 24 horas: retiramos el contenido que incumple
          estas reglas y podemos impedir que su autor publique más reseñas o cerrar su cuenta. Una reseña con varios
          reportes se oculta mientras la revisamos.
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
