import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AMAZON_DISCLOSURE, amazonSearchUrl } from '../../lib/amazon'
import { H1, Lead, P, Shell } from '../../lib/page'
import { AMAZON, COUNTRY } from '../../lib/site'
import { colors } from '../../lib/tokens'
import Calculator from './Calculator'

// Amazon + courier vs the local store. Dominican rules (US$200 limit, ITBIS),
// so only the DR stack serves it. Product pages link here with ?q=&local=.

export const metadata: Metadata = {
  title: 'Calculadora Amazon + courier: ¿conviene traerlo a RD? | DóndeTa',
  description: 'Calcula cuánto te sale de verdad un producto de Amazon traído por courier a República Dominicana (envío por libra, límite de US$200, arancel e ITBIS) y compáralo con el precio en las tiendas de aquí.',
  alternates: { canonical: '/calculadora-amazon' },
}

interface Props {
  searchParams: Promise<{ q?: string; local?: string }>
}

export default async function AmazonCalculatorPage({ searchParams }: Props) {
  if (!COUNTRY.isDominican) notFound()
  const { q, local } = await searchParams
  const productName = q?.trim().slice(0, 140) || null
  const initialLocal = Math.max(0, Math.round(Number(local) || 0))
  const amazonUrl = productName ? amazonSearchUrl({ name: productName, brand: '', categoryId: '' }, AMAZON) : null

  return (
    <Shell>
      <H1>¿Conviene traerlo de Amazon? Calculadora con courier</H1>
      <Lead>
        Pon el precio de Amazon, el peso y la tarifa de tu courier. Te decimos cuánto te sale puesto en República Dominicana,
        con impuestos si pasa de US$200, y si te conviene más que la tienda de aquí.
      </Lead>
      <Calculator initialLocal={initialLocal} productName={productName} amazonUrl={amazonUrl} />
      <P>
        Es un estimado: la factura de tu courier manda. Para entender cada número (peso volumétrico, el límite de US$200, la
        garantía y las devoluciones), lee la guía{' '}
        <a href="/guias/comprar-en-amazon-desde-rd" style={{ color: colors.primary }}>Comprar en Amazon desde RD</a>. Para el
        precio local, busca el producto en <a href="/" style={{ color: colors.primary }}>DóndeTa</a> y mira también su historial.
      </P>
      {AMAZON && <P>{AMAZON_DISCLOSURE}</P>}
    </Shell>
  )
}
