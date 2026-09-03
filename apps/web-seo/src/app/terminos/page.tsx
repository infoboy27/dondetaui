import type { Metadata } from 'next'
import { H1, Lead, Card, H2, P, Shell } from '../../lib/page'

export const metadata: Metadata = {
  title: 'Terminos de uso — DóndeTa',
  description: 'Condiciones de uso de DóndeTa y aclaraciones sobre precios, disponibilidad y enlaces externos.',
  alternates: { canonical: '/terminos' },
}

export default function TermsPage() {
  return (
    <Shell>
      <H1>Terminos de uso</H1>
      <Lead>Al usar DóndeTa aceptas que la informacion publicada es referencial y debe verificarse con la tienda antes de comprar.</Lead>
      <Card>
        <H2>Precios y disponibilidad</H2>
        <P>Los precios pueden cambiar sin aviso. DóndeTa no garantiza inventario, promociones, financiamiento, instalacion, envio ni condiciones finales de venta.</P>
      </Card>
      <Card>
        <H2>Enlaces externos</H2>
        <P>Algunos productos enlazan a tiendas externas. Cada tienda es responsable de su contenido, proceso de compra, garantia y servicio al cliente.</P>
      </Card>
      <Card>
        <H2>Uso permitido</H2>
        <P>No esta permitido usar DóndeTa para extraer datos de forma abusiva, interferir con el servicio o presentar la informacion como propia sin atribucion.</P>
      </Card>
    </Shell>
  )
}
