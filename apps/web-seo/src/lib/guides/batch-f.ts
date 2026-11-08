import type { Guide } from '../content'

export const GUIDES_F: Guide[] = [
  {
    slug: 'comprar-en-amazon-desde-rd',
    title: 'Comprar en Amazon desde RD: cómo calcular lo que pagas de verdad',
    description:
      'Cómo comparar un producto de Amazon traído por courier con el precio en una tienda dominicana: envío por libra, peso volumétrico, el límite de US$200, impuestos, garantía y devoluciones.',
    updated: '2026-11-08',
    intro: [
      'Comprar en Amazon y traerlo por courier es parte de la rutina de muchos dominicanos. A veces sale mucho más barato; otras veces, cuando se suman el envío, los impuestos y el riesgo de una devolución, la tienda de aquí termina ganando.',
      'Esta guía no recomienda un courier ni una tienda. Te da la cuenta completa para que compares el total con el precio local que ves en DóndeTa, y te explica los puntos que más sorprenden: el peso volumétrico, el límite de US$200 y la garantía.',
    ],
    sections: [
      {
        title: 'La cuenta completa: precio, envío local en EE. UU., courier e impuestos',
        body: [
          'El precio de Amazon es solo el primer número. Al total hay que sumarle el envío desde Amazon hasta la dirección de tu courier en Miami (muchas veces gratis, pero no siempre), la tarifa del courier hasta República Dominicana y, si el valor pasa del límite de exención, los impuestos de importación.',
          'Convierte todo a pesos con la tasa que realmente te cobra tu tarjeta, no con la tasa del día que ves en las noticias. Muchas tarjetas aplican una comisión por compras en moneda extranjera que también se suma.',
        ],
        list: [
          'Precio del producto en Amazon, con el impuesto de venta del estado de tu dirección en Miami si aplica',
          'Envío de Amazon a la dirección del courier (gratis en muchos productos, no en todos)',
          'Tarifa del courier por libra, más cargos como combustible, seguro o manejo',
          'Impuestos dominicanos si el envío supera el límite de exención',
          'Comisión de tu tarjeta por compras en dólares',
        ],
      },
      {
        title: 'Peso real y peso volumétrico: por qué una caja grande sale cara',
        body: [
          'Los couriers cobran por libra, pero no siempre por el peso real. En los paquetes voluminosos y livianos cobran el peso volumétrico, que se calcula con las medidas de la caja. Un abanico de pie, una freidora de aire o una silla pueden pesar poco y cobrarse como si pesaran el doble o más.',
          'Antes de comprar, mira en la ficha de Amazon las medidas y el peso del paquete (no del producto) y pregúntale a tu courier cómo calcula el peso volumétrico. Con eso puedes estimar el costo del envío antes de pagar y no al recibir la factura.',
        ],
      },
      {
        title: 'El límite de US$200 y los impuestos',
        body: [
          'En República Dominicana, los envíos por courier para uso personal de hasta US$200 suelen entrar sin pagar impuestos de importación. Cuando el valor supera ese monto, se paga el ITBIS (18 %) y, según el producto, un arancel, calculados sobre el valor de la mercancía y el flete.',
          'El límite se evalúa por envío, y las reglas pueden cambiar o tener excepciones según el tipo de producto. Confirma siempre con tu courier o con la Dirección General de Aduanas antes de una compra grande; para un televisor o una nevera la diferencia puede ser de miles de pesos.',
        ],
      },
      {
        title: 'Un ejemplo con cifras redondas',
        body: [
          'Imagina una licuadora que en Amazon cuesta US$80 con envío gratis a Miami. La caja pesa 9 libras y tu courier cobra, por decir algo, US$3 por libra más US$5 de cargos: son US$32 de courier. El total es US$112, sin impuestos porque está por debajo de US$200. A una tasa de RD$60 por dólar serían unos RD$6,720.',
          'Si en DóndeTa la misma licuadora aparece en RD$7,200 en una tienda local, el ahorro de traerla es de unos RD$480, a cambio de esperar una o dos semanas y de una garantía más complicada. Si la tienda local la tiene en RD$6,500, conviene comprarla aquí. Las cifras del ejemplo son ilustrativas: usa las tarifas reales de tu courier y la tasa de tu tarjeta.',
        ],
      },
      {
        title: 'Garantía, devoluciones y voltaje',
        body: [
          'La garantía es el costo escondido de importar. Si el producto llega dañado o falla, devolverlo a Amazon desde República Dominicana significa pagar el envío de vuelta y esperar semanas, y muchas marcas no honran aquí la garantía de un equipo comprado en EE. UU. En una tienda local tienes la garantía del vendedor y los derechos que te da la ley de protección al consumidor.',
          'El voltaje sí juega a favor: los aparatos para EE. UU. usan 110-120 V y 60 Hz, igual que la red dominicana, y los enchufes son del mismo tipo. Revisa aun así la ficha del producto, sobre todo en equipos de cocina de alta potencia.',
        ],
        list: [
          'Para productos caros o delicados (televisores, neveras, aires), pesa más la garantía local',
          'Para accesorios, ropa, libros y repuestos pequeños, importar suele salir mejor',
          'Algunos productos tienen restricciones de envío (baterías de litio sueltas, aerosoles, líquidos inflamables): pregunta antes',
        ],
      },
      {
        title: 'Cómo usar DóndeTa para decidir',
        body: [
          'Busca el producto en DóndeTa y anota el precio más bajo entre las tiendas dominicanas, mirando también el historial: si el precio local está en su punto más bajo del mes, la ventaja de importar se achica. Luego haz la cuenta completa de Amazon con esta guía.',
          'En las fichas de producto encontrarás el enlace «¿Y en Amazon?» para buscar el mismo modelo. Es un enlace de afiliado: si compras, DóndeTa puede ganar una comisión sin costo para ti, y eso no cambia qué opción te mostramos como más barata.',
        ],
      },
    ],
    faqs: [
      {
        q: '¿Siempre sale más barato comprar en Amazon?',
        a: 'No. En productos livianos y de menos de US$200 suele convenir, pero en artículos voluminosos o de más de US$200 el envío, los impuestos y la garantía pueden hacer que la tienda local salga mejor.',
      },
      {
        q: '¿Qué es el peso volumétrico?',
        a: 'Es un peso calculado con las medidas de la caja. Si es mayor que el peso real, el courier cobra ese. Por eso las cajas grandes y livianas salen caras de traer.',
      },
      {
        q: '¿Los aparatos de EE. UU. funcionan en República Dominicana?',
        a: 'En general sí: ambos países usan 110-120 V y 60 Hz y el mismo tipo de enchufe. Revisa la ficha del producto por si acaso.',
      },
    ],
    related: [
      'garantia-electrodomesticos-rd-derechos-consumidor',
      'entender-historial-precios',
      'cuando-comprar-feriados-black-friday-rd',
      'comprar-electrodomesticos-rd',
    ],
  },
]
