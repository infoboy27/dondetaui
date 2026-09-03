export const CONTACT_EMAIL = 'jonathanmaria@gmail.com'

export const MAIN_NAV = [
  { href: '/', label: 'Inicio' },
  { href: '/metodologia', label: 'Metodologia' },
  { href: '/guias/comprar-electrodomesticos-rd', label: 'Guias' },
  { href: '/sobre-dondeta', label: 'Sobre DóndeTa' },
  { href: '/contacto', label: 'Contacto' },
]

export const BUYING_GUIDES = [
  {
    slug: 'comprar-electrodomesticos-rd',
    title: 'Como comparar electrodomesticos antes de comprar en RD',
    description: 'Criterios practicos para evaluar precio, garantia, entrega y disponibilidad antes de elegir una tienda.',
    intro:
      'Comprar electrodomesticos en Republica Dominicana no deberia depender de revisar manualmente cinco tiendas diferentes. Esta guia resume el metodo que usamos para comparar precios publicados y evitar decisiones apresuradas.',
    sections: [
      {
        title: 'Mira el costo total, no solo el precio visible',
        body:
          'El precio mas bajo no siempre es la mejor compra si el envio, instalacion o retiro en tienda cambian el costo final. En productos grandes como neveras, lavadoras o aires, confirma disponibilidad, condiciones de entrega y si la tienda incluye servicios adicionales.',
      },
      {
        title: 'Compara productos equivalentes',
        body:
          'Dos modelos pueden parecer iguales por foto, pero variar en capacidad, consumo, garantia o tecnologia. Antes de decidir, revisa marca, modelo, capacidad y especificaciones basicas. DóndeTa ayuda a ordenar esas opciones, pero la validacion final debe hacerse en la tienda.',
      },
      {
        title: 'Usa el historial como senal de oportunidad',
        body:
          'Si un precio baja de forma reciente o se mantiene estable por varias mediciones, es una senal distinta a una oferta aislada. El historial de DóndeTa sirve para entender si el precio actual parece competitivo frente a lecturas anteriores.',
      },
    ],
  },
  {
    slug: 'elegir-aire-acondicionado',
    title: 'Como elegir un aire acondicionado por BTU, espacio y presupuesto',
    description: 'Guia rapida para comparar aires acondicionados segun capacidad, consumo y precio publicado.',
    intro:
      'Los aires acondicionados son una de las categorias donde mas se nota la diferencia entre comprar por impulso y comparar con calma. BTU, eficiencia, instalacion y garantia pesan tanto como el precio.',
    sections: [
      {
        title: 'Relaciona BTU con el tamano del espacio',
        body:
          'Un equipo pequeno trabajara forzado en una habitacion grande, mientras uno sobredimensionado puede consumir mas de lo necesario. Usa los BTU como primer filtro y luego compara precio, marca y disponibilidad.',
      },
      {
        title: 'Revisa tecnologia inverter y consumo',
        body:
          'Un aire inverter puede costar mas al inicio, pero reducir consumo en uso frecuente. Si el equipo estara encendido muchas horas al dia, el precio inicial no debe ser el unico criterio.',
      },
      {
        title: 'Verifica instalacion y garantia',
        body:
          'Antes de comprar, confirma si la tienda ofrece instalacion, que cubre la garantia y si hay disponibilidad inmediata. Esos detalles pueden justificar elegir una oferta que no sea la mas barata.',
      },
    ],
  },
  {
    slug: 'comparar-neveras',
    title: 'Que revisar antes de comprar una nevera o refrigerador',
    description: 'Capacidad, tipo de puerta, consumo y disponibilidad: los puntos clave para comparar neveras.',
    intro:
      'Una nevera es una compra de varios anos. Comparar solo por precio puede llevar a elegir un modelo con poca capacidad, consumo alto o entrega complicada.',
    sections: [
      {
        title: 'Capacidad y distribucion interna',
        body:
          'Compara litros o pies cubicos, tipo de congelador, gavetas y espacio util. Dos neveras con precio parecido pueden servir a hogares muy distintos.',
      },
      {
        title: 'Tipo de puerta y espacio disponible',
        body:
          'Side-by-side, puerta francesa o congelador superior no son solo estilos: cambian el espacio necesario para abrir puertas y organizar alimentos. Mide antes de comprar.',
      },
      {
        title: 'Precio, entrega y soporte',
        body:
          'El mejor precio debe evaluarse con disponibilidad, transporte y soporte local. Si hay una diferencia pequena entre tiendas, la garantia y facilidad de entrega pueden pesar mas.',
      },
    ],
  },
]
