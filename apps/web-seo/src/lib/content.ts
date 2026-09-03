export const CONTACT_EMAIL = 'jonathanmaria@gmail.com'

export const MAIN_NAV = [
  { href: '/', label: 'Inicio' },
  { href: '/metodologia', label: 'Metodología' },
  { href: '/guias', label: 'Guías' },
  { href: '/sobre-dondeta', label: 'Sobre DóndeTa' },
  { href: '/contacto', label: 'Contacto' },
]

export interface GuideSection {
  title: string
  /** One or more paragraphs. */
  body: string[]
  /** Optional bullet list rendered after the paragraphs. */
  list?: string[]
}

export interface Guide {
  slug: string
  title: string
  description: string
  /** ISO date of the last substantive review of this guide. */
  updated: string
  /** One or more intro paragraphs. */
  intro: string[]
  sections: GuideSection[]
  faqs?: { q: string; a: string }[]
  /** Slugs of related guides. */
  related?: string[]
}

export const BUYING_GUIDES: Guide[] = [
  {
    slug: 'comprar-electrodomesticos-rd',
    title: 'Cómo comparar electrodomésticos antes de comprar en República Dominicana',
    description:
      'Método práctico para comparar precio, costo total, garantía, entrega y disponibilidad de electrodomésticos en tiendas dominicanas antes de decidir.',
    updated: '2026-09-03',
    intro: [
      'Comprar un electrodoméstico grande en República Dominicana rara vez es una decisión de un solo número. Entre Plaza Lama, Jumbo, Sirena, Corripio y PriceSmart puede haber diferencias de precio de lista, pero también de envío, instalación, garantía y disponibilidad real en tienda. Comparar solo el precio visible lleva a sorpresas al momento de pagar o recibir el producto.',
      'Esta guía resume el método que usamos en DóndeTa para ordenar opciones y el que recomendamos a cualquier comprador antes de una compra de varios miles de pesos.',
    ],
    sections: [
      {
        title: 'Empieza por el costo total, no por el precio de lista',
        body: [
          'El precio que aparece en la vitrina o en la página del producto es el punto de partida, no el costo final. En electrodomésticos grandes —neveras, lavadoras, estufas, aires— el costo total suele incluir transporte, instalación, y en algunos casos el retiro del equipo viejo. Una tienda con un precio de lista más alto pero envío e instalación incluidos puede terminar siendo más barata que otra que cobra ambos aparte.',
          'Antes de decidir, pide el costo puesto en tu casa y funcionando. Si compras en PriceSmart, considera también el costo de la membresía si no la usas para otras compras.',
        ],
        list: [
          'Precio de lista del producto',
          'Costo de envío a tu zona (varía entre el Gran Santo Domingo y el interior)',
          'Instalación, cuando aplica (aires, lavadoras, estufas de gas)',
          'Retiro del equipo usado, si lo necesitas',
          'Financiamiento: verifica la tasa y el precio final a plazos, no solo la cuota',
        ],
      },
      {
        title: 'Compara productos realmente equivalentes',
        body: [
          'Dos modelos pueden verse iguales en una foto y variar en capacidad, consumo eléctrico, tipo de tecnología o cobertura de garantía. Un error común es comparar el precio de un modelo de 18 pies con otro de 21 pies, o un aire convencional con uno inverter, y concluir que una tienda es "más cara".',
          'Fíjate siempre en la marca y el número de modelo exacto. Ese código —no el nombre comercial— es lo que te permite saber si estás comparando lo mismo en dos tiendas distintas.',
        ],
      },
      {
        title: 'Usa el historial de precio como señal, no como garantía',
        body: [
          'Un precio que bajó esta semana no siempre es una oferta: puede ser una corrección después de una subida, o el inicio de una liquidación por cambio de modelo. Un precio que se mantiene estable durante varias semanas dice algo distinto a una rebaja puntual de fin de semana.',
          'En DóndeTa cada ficha de producto muestra cuántas veces hemos registrado el precio, su mínimo y su máximo, y cuánto se ha movido. Eso te da contexto para saber si el precio de hoy es competitivo frente a su propia historia, aunque haya una sola tienda vendiéndolo.',
        ],
      },
      {
        title: 'Confirma disponibilidad y condiciones antes de ir a la tienda',
        body: [
          'La disponibilidad publicada en línea no siempre coincide con el inventario de la sucursal. Para productos grandes conviene llamar o escribir a la tienda y confirmar que hay unidades, en qué sucursal, y cuánto tarda la entrega. Pregunta también por la garantía: qué cubre, por cuánto tiempo, y si el servicio técnico es local o depende de un importador.',
          'Una diferencia de precio pequeña entre dos tiendas casi nunca justifica renunciar a una entrega rápida, una instalación incluida o una garantía con soporte local.',
        ],
      },
    ],
    faqs: [
      {
        q: '¿Conviene siempre comprar en la tienda con el precio más bajo?',
        a: 'No necesariamente. Si la diferencia es pequeña, la entrega, la instalación incluida y una garantía con servicio local pueden pesar más que unos cientos de pesos de descuento.',
      },
      {
        q: '¿Cada cuánto cambian los precios de electrodomésticos en RD?',
        a: 'Depende de la categoría y la tienda. En nuestras mediciones muchos productos mantienen el mismo precio durante semanas y cambian en fechas comerciales o por liquidación de modelo.',
      },
    ],
    related: ['elegir-aire-acondicionado', 'comparar-neveras', 'entender-historial-precios'],
  },

  {
    slug: 'elegir-aire-acondicionado',
    title: 'Cómo elegir un aire acondicionado por BTU, consumo y presupuesto',
    description:
      'Guía para comparar aires acondicionados en RD según capacidad en BTU, tecnología inverter, consumo eléctrico, instalación y garantía.',
    updated: '2026-09-03',
    intro: [
      'El aire acondicionado es una de las categorías donde más se nota la diferencia entre comprar por impulso y comparar con calma. Un equipo mal dimensionado enfría poco y consume de más; uno sobredimensionado cuesta más de lo necesario y enciende y apaga con demasiada frecuencia. En un país con tarifas eléctricas altas y uso intensivo, el consumo pesa tanto como el precio de compra.',
    ],
    sections: [
      {
        title: 'Relaciona los BTU con el tamaño y el uso del espacio',
        body: [
          'Los BTU miden la capacidad de enfriamiento. Como referencia general, una habitación de dormitorio estándar en RD suele quedar bien con 12,000 BTU; una sala o un espacio con mucha entrada de sol, techo alto o varias personas puede necesitar 18,000 o 24,000 BTU. Estos números son un punto de partida: la orientación de las ventanas, el aislamiento y la cantidad de equipos electrónicos también influyen.',
          'Usa la capacidad como primer filtro para descartar modelos que no aplican, y recién después compara precio, marca y disponibilidad entre los que sí sirven para tu espacio.',
        ],
        list: [
          'Habitación pequeña (hasta ~14 m²): 9,000–12,000 BTU',
          'Habitación mediana o con sol directo (~14–22 m²): 12,000–18,000 BTU',
          'Sala o espacio abierto (~22–35 m²): 18,000–24,000 BTU',
          'Espacios más grandes: considera dos equipos o una unidad de mayor capacidad',
        ],
      },
      {
        title: 'Inverter frente a convencional: cuándo se paga solo',
        body: [
          'Un aire inverter regula la velocidad del compresor en lugar de encender y apagar de golpe. Cuesta más al comprar, pero consume menos cuando el equipo se usa muchas horas seguidas y mantiene la temperatura más estable. Si el aire va a estar encendido toda la noche todos los días, la diferencia de consumo suele compensar el precio inicial en un plazo razonable.',
          'Si el uso es ocasional —una habitación de visitas, una oficina que se usa pocas horas— la ventaja del inverter es menor y un equipo convencional bien dimensionado puede ser suficiente.',
        ],
      },
      {
        title: 'No compres sin confirmar instalación y garantía',
        body: [
          'La instalación de un split tiene costo aparte en la mayoría de las tiendas y puede variar según la distancia entre la unidad interior y la exterior, la necesidad de tubería adicional o soportes. Pregunta el costo estimado antes de comprar y si la tienda usa técnicos propios o subcontratados.',
          'Sobre la garantía, verifica si cubre el compresor (la pieza más cara) y por cuánto tiempo, y si el servicio depende de un importador local. Una garantía larga sin servicio técnico accesible vale poco.',
        ],
      },
      {
        title: 'Revisa el historial de precio antes de decidir la fecha de compra',
        body: [
          'Los aires acondicionados tienen picos de demanda en los meses más calientes, y ahí los precios rara vez bajan. En la ficha de cada modelo en DóndeTa puedes ver si el precio actual está cerca de su mínimo registrado o si viene de una subida reciente. Eso ayuda a decidir si conviene comprar ya o esperar.',
        ],
      },
    ],
    faqs: [
      {
        q: '¿Cuántos BTU necesito para un dormitorio en Santo Domingo?',
        a: 'Como referencia, 12,000 BTU cubren bien un dormitorio estándar. Si la habitación recibe sol directo, tiene techo alto o es más grande de lo normal, considera 18,000 BTU.',
      },
      {
        q: '¿Vale la pena pagar más por un aire inverter?',
        a: 'Sí cuando el equipo se usa muchas horas al día de forma constante, porque el ahorro en consumo compensa el precio inicial. Para uso ocasional la diferencia es menor.',
      },
    ],
    related: ['comprar-electrodomesticos-rd', 'entender-historial-precios'],
  },

  {
    slug: 'comparar-neveras',
    title: 'Qué revisar antes de comprar una nevera o refrigerador',
    description:
      'Capacidad, tipo de puerta, consumo, ruido y entrega: los puntos que realmente importan al comparar neveras en tiendas dominicanas.',
    updated: '2026-09-03',
    intro: [
      'Una nevera es una compra que dura entre diez y quince años y funciona sin apagarse nunca. Elegir solo por precio puede llevar a un modelo con poca capacidad para el hogar, consumo alto durante toda su vida útil, o una entrega complicada por el tamaño. Vale la pena dedicarle una comparación cuidadosa.',
    ],
    sections: [
      {
        title: 'Capacidad y distribución interna',
        body: [
          'La capacidad se mide en pies cúbicos. Una pareja o una persona sola suele estar bien con 10 a 14 pies; una familia de cuatro o más, o un hogar que cocina y almacena mucho, se beneficia de 18 pies o más. Pero el número total importa menos que cómo se reparte ese espacio: proporción entre refrigerador y congelador, cantidad y ajuste de las gavetas, y si los estantes se pueden mover.',
          'Si compras mucho producto congelado, prioriza un congelador amplio y de fácil acceso. Si usas más el refrigerador para frescos, un modelo con el congelador abajo o al lado te dará más espacio a la altura de la vista.',
        ],
      },
      {
        title: 'Tipo de puerta y espacio disponible en tu cocina',
        body: [
          'El tipo de puerta no es solo estético. Un modelo top mount (congelador arriba) es el más compacto y económico. Uno de puerta francesa o side by side necesita más ancho y, sobre todo, espacio libre al frente para abrir las puertas por completo. Antes de comprar, mide el hueco donde irá la nevera —ancho, alto y profundidad— y el ancho de las puertas y pasillos por donde tiene que entrar.',
          'Deja unos centímetros de holgura a los lados y arriba para la ventilación; una nevera encajada sin espacio trabaja forzada y consume más.',
        ],
      },
      {
        title: 'Consumo y nivel de ruido',
        body: [
          'La nevera es uno de los electrodomésticos que más aporta a la factura eléctrica porque nunca se apaga. Revisa la etiqueta de eficiencia energética y, si el modelo la indica, el consumo estimado anual. Los modelos inverter y los de tecnología no frost más reciente suelen consumir menos, aunque cuesten más.',
          'Si la cocina es abierta a la sala o hay dormitorios cerca, pregunta por el nivel de ruido en decibeles. Los compresores inverter suelen ser más silenciosos.',
        ],
      },
      {
        title: 'Entrega, instalación y estabilización',
        body: [
          'Confirma que la tienda entregue a tu zona y si sube la nevera a pisos altos sin ascensor. Tras la entrega, una nevera que viajó acostada o inclinada debe reposar de pie varias horas antes de conectarse, para que el aceite del compresor regrese a su lugar. Pregunta a la tienda la recomendación específica del modelo.',
          'Si hay una diferencia de precio pequeña entre dos tiendas, la que ofrezca entrega e instalación sin complicaciones suele ser la mejor opción.',
        ],
      },
    ],
    faqs: [
      {
        q: '¿Cuántos pies cúbicos necesita una familia de cuatro personas?',
        a: 'Como referencia, entre 16 y 20 pies cúbicos suelen ser suficientes para una familia de cuatro. Si cocinan y almacenan mucho, o compran a granel, considera más.',
      },
      {
        q: '¿Cuánto tiempo debe reposar una nevera nueva antes de encenderla?',
        a: 'Si fue transportada de pie, unas pocas horas. Si viajó acostada o muy inclinada, se recomienda dejarla de pie varias horas —a veces hasta un día— antes de conectarla. Confirma con la tienda la indicación del modelo.',
      },
    ],
    related: ['comprar-electrodomesticos-rd', 'elegir-lavadora'],
  },

  {
    slug: 'elegir-lavadora',
    title: 'Cómo elegir una lavadora: carga, tipo, consumo de agua y espacio',
    description:
      'Diferencias entre lavadoras de carga superior y frontal, capacidad recomendada, consumo de agua y energía, e instalación en hogares dominicanos.',
    updated: '2026-09-03',
    intro: [
      'La lavadora es un electrodoméstico de uso frecuente y su elección afecta el consumo de agua y de electricidad durante años. En República Dominicana conviven modelos de carga superior sencillos y económicos con lavadoras frontales más eficientes pero más caras y exigentes en instalación. La decisión correcta depende del tamaño del hogar, el espacio disponible y el suministro de agua.',
    ],
    sections: [
      {
        title: 'Carga superior o carga frontal',
        body: [
          'Las lavadoras de carga superior son más baratas, más rápidas por ciclo, más fáciles de cargar sin agacharse y toleran mejor las interrupciones de agua y de energía. A cambio, suelen gastar más agua y son menos delicadas con la ropa.',
          'Las de carga frontal lavan con menos agua y energía, cuidan más los tejidos y suelen tener mayor capacidad en el mismo tamaño exterior, pero cuestan más, tardan más por ciclo y necesitan una instalación más cuidadosa y una superficie nivelada por las vibraciones del centrifugado.',
        ],
      },
      {
        title: 'Capacidad según el tamaño del hogar',
        body: [
          'La capacidad se expresa en kilos o libras de ropa seca. Una persona sola o una pareja suele estar bien con 7 a 9 kilos; una familia de cuatro con 12 a 15 kilos; hogares más grandes o que lavan cobijas y edredones con frecuencia, más. Comprar una lavadora más grande de lo necesario significa pagar de más y, si la usas a media carga, desperdiciar agua y energía en cada ciclo.',
        ],
      },
      {
        title: 'Suministro de agua y presión',
        body: [
          'Muchas lavadoras frontales y algunas automáticas de carga superior necesitan una presión de agua mínima para llenar en un tiempo razonable. Si en tu zona el agua llega por gravedad desde un tinaco o con presión baja, confirma con la tienda si el modelo funciona bien en esas condiciones o si necesitarás una bomba.',
          'Si el servicio de agua es intermitente, una lavadora que permita pausar el ciclo y retomarlo sin reiniciar es una ventaja práctica.',
        ],
      },
      {
        title: 'Espacio, nivelación e instalación',
        body: [
          'Mide el sitio donde irá la lavadora, incluyendo el espacio detrás para las mangueras y el desagüe. Las lavadoras frontales deben quedar bien niveladas sobre piso firme; sobre una base poco rígida vibran y "caminan" durante el centrifugado. Pregunta si la tienda incluye instalación y kit de mangueras, o si van aparte.',
        ],
      },
    ],
    faqs: [
      {
        q: '¿Qué lavadora conviene si el agua llega con poca presión?',
        a: 'En zonas con presión baja o suministro desde tinaco, muchas lavadoras de carga superior funcionan mejor. Si prefieres una frontal, confirma con la tienda que el modelo tolera presión baja o prevé instalar una bomba.',
      },
      {
        q: '¿Cuántos kilos de capacidad necesita una familia de cuatro?',
        a: 'Entre 12 y 15 kilos de ropa seca suele ser suficiente para una familia de cuatro. Si lavan edredones y cobijas con frecuencia, considera más capacidad.',
      },
    ],
    related: ['comprar-electrodomesticos-rd', 'comparar-neveras'],
  },

  {
    slug: 'comprar-televisor',
    title: 'Cómo comparar televisores: tamaño, resolución, panel y conexiones',
    description:
      'Qué mirar al comparar televisores en RD: pulgadas según distancia de visión, 4K, tipo de panel, sistema operativo y puertos HDMI.',
    updated: '2026-09-03',
    intro: [
      'El precio de los televisores varía mucho entre marcas y tiendas para la misma pulgada, en parte porque no todos los paneles ni los sistemas son iguales. Antes de comparar precios conviene definir el tamaño correcto para tu sala y qué características realmente vas a usar, para no pagar por funciones que no aprovechas ni quedarte corto en lo que sí importa.',
    ],
    sections: [
      {
        title: 'Tamaño según la distancia de visión',
        body: [
          'La pulgada ideal depende de a qué distancia te vas a sentar. Como referencia práctica para contenido 4K, una distancia de entre 2 y 2.5 metros se disfruta bien con un televisor de 55 pulgadas; a 3 metros, uno de 65 pulgadas. Sentarse demasiado cerca de una pantalla grande cansa la vista; una pantalla pequeña vista de lejos desaprovecha la resolución.',
          'Mide la distancia real entre el mueble del televisor y donde te sientas antes de decidir la pulgada.',
        ],
      },
      {
        title: 'Resolución y tipo de panel',
        body: [
          'Hoy la mayoría de los televisores medianos y grandes son 4K, y es la opción recomendada salvo en pantallas muy pequeñas. Lo que más diferencia la calidad de imagen a igual resolución es el tipo de panel y el manejo del brillo y el contraste: los paneles OLED ofrecen negros profundos y buen contraste pero cuestan más; los LED/QLED son más brillantes y económicos y funcionan mejor en salas con mucha luz.',
          'Si ves televisión de día en una sala luminosa, prioriza brillo. Si ves películas de noche con poca luz, el contraste y los negros importan más.',
        ],
      },
      {
        title: 'Sistema operativo y aplicaciones',
        body: [
          'Los televisores traen distintos sistemas (Google TV, Roku, Tizen, WebOS, entre otros). Todos cubren las aplicaciones de streaming más usadas, pero varían en fluidez, frecuencia de actualizaciones y facilidad de uso. Si ya usas un dispositivo externo de streaming, el sistema del televisor pesa menos en la decisión.',
        ],
      },
      {
        title: 'Conexiones que vas a necesitar',
        body: [
          'Cuenta cuántos dispositivos vas a conectar por HDMI: consola, dispositivo de streaming, barra de sonido, decodificador. Un televisor con solo dos puertos HDMI se queda corto rápido. Si piensas conectar una consola de última generación o un PC, verifica que al menos un puerto sea HDMI 2.1 y que el televisor soporte las frecuencias de actualización que te interesan.',
        ],
        list: [
          'Número de puertos HDMI (3 o más es cómodo)',
          'Al menos un HDMI 2.1 si usarás consola nueva o PC para juegos',
          'Salida de audio para barra de sonido (HDMI ARC/eARC u óptica)',
          'Wi‑Fi y puerto de red si el streaming será por la TV',
        ],
      },
    ],
    faqs: [
      {
        q: '¿Qué pulgada de televisor conviene para una sala común?',
        a: 'Depende de la distancia de visión. A 2–2.5 metros, 55 pulgadas funciona bien; a 3 metros, 65 pulgadas. Mide la distancia real antes de decidir.',
      },
      {
        q: '¿Vale la pena un OLED o es mejor un QLED/LED?',
        a: 'OLED da mejor contraste y negros para ver películas con poca luz, a mayor precio. QLED/LED es más brillante y económico y rinde mejor en salas muy iluminadas.',
      },
    ],
    related: ['comprar-electrodomesticos-rd', 'entender-historial-precios'],
  },

  {
    slug: 'comprar-estufa-cocina',
    title: 'Cómo elegir una estufa o cocina: gas o eléctrica, tamaño y seguridad',
    description:
      'Diferencias entre estufas de gas y eléctricas, cantidad de hornillas, tipo de horno e instalación segura en hogares dominicanos.',
    updated: '2026-09-03',
    intro: [
      'En República Dominicana la mayoría de los hogares cocina con gas por costo y por costumbre, pero la oferta incluye también estufas eléctricas y de vitrocerámica. La elección correcta depende del tipo de cocción que haces, el espacio disponible y las condiciones de instalación.',
    ],
    sections: [
      {
        title: 'Gas o eléctrica',
        body: [
          'Las estufas de gas calientan de inmediato, permiten regular la llama con precisión y siguen funcionando durante un apagón. El gas licuado (GLP) en cilindro es la instalación más común. La desventaja es el manejo del cilindro y la necesidad de ventilación y de revisar mangueras y reguladores periódicamente.',
          'Las estufas eléctricas y de vitrocerámica son más fáciles de limpiar y no dependen de cilindros, pero cocinan más lento al inicio, aumentan el consumo eléctrico y quedan inservibles durante un apagón salvo que tengas respaldo de energía.',
        ],
      },
      {
        title: 'Cantidad de hornillas y tamaño del horno',
        body: [
          'Para una persona o una pareja, cuatro hornillas suelen sobrar. Un hogar que cocina para varios o que prepara varios platos a la vez aprovecha una estufa de cinco o seis hornillas. Revisa que al menos una hornilla sea de alta potencia para hervir rápido y otra de baja para salsas y cocción lenta.',
          'Si horneas con frecuencia, fíjate en la capacidad del horno en litros, si tiene termostato y luz interior, y si la puerta cierra bien. Un horno pequeño o sin control de temperatura limita mucho lo que puedes preparar.',
        ],
      },
      {
        title: 'Medidas e instalación',
        body: [
          'Las estufas de piso vienen principalmente en 20, 24, 30 y 36 pulgadas de ancho. Mide el hueco de tu cocina y el ancho de la puerta por donde debe entrar. Para las estufas empotrables (tope y horno separados), las medidas del corte del mueble deben coincidir exactamente con las del modelo.',
          'La instalación de gas debería hacerla alguien con experiencia: conexión con manguera y regulador en buen estado, prueba de fugas con agua y jabón, y ventilación adecuada. Pregunta si la tienda ofrece este servicio o si va aparte.',
        ],
      },
      {
        title: 'Seguridad',
        body: [
          'Busca modelos con encendido eléctrico y, sobre todo, con dispositivo de seguridad por falla de llama (termopar) que corta el gas si la hornilla se apaga sola. Es una función que vale la pena priorizar aunque suba un poco el precio.',
        ],
      },
    ],
    faqs: [
      {
        q: '¿Conviene más una estufa de gas o eléctrica en RD?',
        a: 'Para la mayoría de los hogares el gas sale más económico y sigue funcionando durante apagones. La eléctrica conviene si buscas fácil limpieza y tienes respaldo de energía.',
      },
      {
        q: '¿Qué función de seguridad debo priorizar en una estufa de gas?',
        a: 'El dispositivo de seguridad por falla de llama (termopar), que corta el gas automáticamente si una hornilla se apaga sola.',
      },
    ],
    related: ['comprar-electrodomesticos-rd', 'elegir-lavadora'],
  },

  {
    slug: 'entender-historial-precios',
    title: 'Cómo leer el historial de precios de un producto en DóndeTa',
    description:
      'Qué significan el precio mínimo, el máximo, la variación y el número de mediciones que aparecen en cada ficha de producto, y cómo usarlos para decidir.',
    updated: '2026-09-03',
    intro: [
      'La mayoría de los productos en DóndeTa tiene hoy una sola tienda con precio publicado, así que la comparación entre tiendas todavía es limitada. Lo que sí registramos para casi todos los productos es cómo cambia su precio en el tiempo. Esta guía explica qué mostramos en cada ficha y cómo interpretarlo.',
    ],
    sections: [
      {
        title: 'Qué es una "medición"',
        body: [
          'Cada vez que nuestro sistema revisa el catálogo de una tienda, guarda el precio publicado de ese día para cada producto. A eso llamamos una medición. Un producto con 23 mediciones tiene aproximadamente tres semanas de historial diario; uno con 3 mediciones apenas se está empezando a registrar y su historial dice poco todavía.',
          'Cuando una ficha tiene pocas mediciones y una sola tienda, la marcamos como página de bajo contexto y no la priorizamos en buscadores hasta que acumule más datos.',
        ],
      },
      {
        title: 'Mínimo y máximo registrados',
        body: [
          'El mínimo es el precio más bajo que hemos visto para ese producto desde que lo seguimos; el máximo, el más alto. No son el precio más bajo del mercado ni un pronóstico: son la referencia de su propia historia. Si el precio de hoy está muy cerca del mínimo registrado, es una señal de que el momento es relativamente bueno. Si está cerca del máximo, quizá convenga esperar.',
        ],
      },
      {
        title: 'Variación total y número de cambios',
        body: [
          'La variación total es la diferencia entre el primer precio que registramos y el actual. El número de cambios cuenta cuántas veces el precio pasó de un valor a otro en el periodo. Un producto que cambió de precio una sola vez en un mes se comporta distinto a uno que sube y baja cada pocos días; el segundo requiere más paciencia para comprar en un buen momento.',
        ],
      },
      {
        title: 'Qué NO puedes concluir del historial',
        body: [
          'El historial no garantiza que el precio vaya a bajar, ni que la tienda tenga inventario, ni que no exista una oferta mejor en un comercio que todavía no seguimos. Es una herramienta de contexto para una decisión, no un sustituto de confirmar precio final, disponibilidad y condiciones con la tienda antes de comprar.',
        ],
      },
    ],
    faqs: [
      {
        q: '¿El precio mínimo registrado es el más barato del mercado?',
        a: 'No. Es el más bajo que DóndeTa ha registrado para ese producto en la tienda que lo publica, no un precio de mercado ni una comparación entre todos los comercios del país.',
      },
      {
        q: '¿Por qué algunos productos no aparecen en Google?',
        a: 'Las fichas con una sola tienda y pocas mediciones aportan poco contexto, así que las mantenemos fuera del índice de búsqueda hasta que acumulen más historial.',
      },
    ],
    related: ['comprar-electrodomesticos-rd', 'elegir-aire-acondicionado'],
  },
]

export function findGuide(slug: string): Guide | undefined {
  return BUYING_GUIDES.find(guide => guide.slug === slug)
}

/** Rough reading-time estimate in minutes for a guide's body text. */
export function guideReadingMinutes(guide: Guide): number {
  const words = [
    ...guide.intro,
    ...guide.sections.flatMap(s => [...s.body, ...(s.list ?? [])]),
    ...(guide.faqs?.flatMap(f => [f.q, f.a]) ?? []),
  ]
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length
  return Math.max(2, Math.round(words / 200))
}
