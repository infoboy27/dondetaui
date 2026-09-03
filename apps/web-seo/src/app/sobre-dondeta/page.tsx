import type { Metadata } from 'next'
import { H1, Lead, Card, H2, P, Shell } from '../../lib/page'

export const metadata: Metadata = {
  title: 'Sobre DóndeTa',
  description: 'Que es DóndeTa, para quien existe y como ayuda a compradores en Republica Dominicana.',
  alternates: { canonical: '/sobre-dondeta' },
}

export default function AboutPage() {
  return (
    <Shell>
      <H1>Sobre DóndeTa</H1>
      <Lead>DóndeTa es una herramienta dominicana para comparar precios publicados antes de comprar electrodomesticos, tecnologia y productos de alto valor.</Lead>
      <Card>
        <H2>Por que existe</H2>
        <P>En Republica Dominicana muchas compras requieren revisar varias tiendas, abrir fichas de producto, comparar disponibilidad y volver a confirmar precios. DóndeTa organiza esa informacion para que el usuario tenga un punto de partida mas claro.</P>
        <P>No vendemos productos directamente y no sustituimos la confirmacion final en tienda. Nuestra funcion es recopilar, ordenar y explicar datos publicos para reducir friccion al comparar.</P>
      </Card>
      <Card>
        <H2>Que valor agrega</H2>
        <P>Ademas del precio visible, DóndeTa presenta tienda, disponibilidad, historial de observaciones cuando existe, categorias y enlaces de verificacion. Tambien publica guias de compra para entender criterios practicos como capacidad, consumo, garantia y entrega.</P>
      </Card>
    </Shell>
  )
}
