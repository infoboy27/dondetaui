import type { Metadata } from 'next'
import { H1, Lead, Card, H2, P, Shell } from '../../lib/page'

export const metadata: Metadata = {
  title: 'Metodologia de comparacion de precios — DóndeTa',
  description: 'Como DóndeTa recopila, organiza y presenta precios publicados de tiendas en Republica Dominicana.',
  alternates: { canonical: '/metodologia' },
}

export default function MethodologyPage() {
  return (
    <Shell>
      <H1>Metodologia de comparacion</H1>
      <Lead>Publicamos precios como referencia informativa. La disponibilidad, financiamiento, instalacion y promociones finales siempre deben confirmarse con la tienda.</Lead>
      <Card>
        <H2>Fuentes</H2>
        <P>Los precios provienen de informacion publicada por retailers y se actualizan en ciclos programados. Cada oferta conserva el nombre de la tienda y, cuando esta disponible, el enlace a la ficha original.</P>
      </Card>
      <Card>
        <H2>Ordenamiento</H2>
        <P>Cuando hay varias ofertas para un producto, se priorizan las disponibles y luego el costo total estimado. El costo total puede incluir envio cuando la informacion esta disponible; si no, mostramos el precio publicado y una advertencia para verificar condiciones.</P>
      </Card>
      <Card>
        <H2>Limitaciones</H2>
        <P>Una tienda puede cambiar precios sin aviso, retirar inventario o aplicar condiciones por sucursal. Por eso DóndeTa debe usarse como herramienta de comparacion inicial, no como garantia de precio final.</P>
      </Card>
    </Shell>
  )
}
