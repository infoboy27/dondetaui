import type { Guide } from '../content'

export const GUIDES_B: Guide[] = [
  {
    slug: 'inverter-vs-convencional-ahorro-energia',
    title: 'Inverter o convencional: cuánto ahorras de verdad en la factura de luz',
    description:
      'Cómo funcionan los compresores inverter y convencionales en aires, neveras y lavadoras, cómo leer el consumo en kWh y cómo estimar si el ahorro compensa el precio.',
    updated: '2026-10-20',
    intro: [
      'La palabra inverter aparece hoy en casi todos los aires acondicionados y en muchas neveras y lavadoras, casi siempre acompañada de una promesa de ahorro. La promesa tiene una base técnica real, pero el ahorro que verás en tu factura depende de cuántas horas usas el equipo, de cómo está instalado y de cómo es tu casa. No es un número igual para todos.',
      'Esta guía explica en términos simples qué cambia dentro del equipo, cómo leer los datos de consumo y cómo hacer tu propio cálculo con la factura de luz, sin depender de cifras de publicidad.',
    ],
    sections: [
      {
        title: 'Qué hace distinto a un compresor inverter',
        body: [
          'En un equipo convencional, el compresor tiene una sola velocidad: cuando el termostato pide frío, trabaja a toda su capacidad; cuando se alcanza la temperatura, se apaga. Después de un rato la temperatura sube y vuelve a encender. Ese ciclo de arranque y parada se repite todo el día, y cada arranque exige un pico de corriente.',
          'Un compresor inverter usa un componente electrónico que cambia la velocidad del motor. Al empezar trabaja fuerte para llegar rápido a la temperatura pedida y luego baja el ritmo para mantenerla, sin apagarse del todo. Es parecido a manejar con velocidad constante en carretera frente a acelerar y frenar en cada semáforo.',
        ],
      },
      {
        title: 'Por qué puede consumir menos, y cuándo no se nota',
        body: [
          'El ahorro viene de dos fuentes: se evitan muchos arranques completos y el equipo trabaja con frecuencia a una potencia parcial, que suele ser más eficiente que el máximo. Además, la temperatura se mantiene más estable, lo que se nota en el confort y en el ruido.',
          'Esa ventaja crece cuanto más tiempo está funcionando el equipo. Un aire encendido toda la noche, todos los días, aprovecha el modo de mantenimiento durante horas. Un aire que se enciende una hora en una habitación de visitas casi no llega a esa etapa, y ahí la diferencia es pequeña. En neveras, que funcionan las 24 horas, el efecto es continuo; en lavadoras, el beneficio del motor inverter se relaciona más con el ruido, las vibraciones y el control del ciclo que con un gran cambio en la factura.',
        ],
      },
      {
        title: 'Cómo leer la etiqueta de consumo y la ficha técnica',
        body: [
          'Busca en la etiqueta del equipo, en el manual o en la ficha del producto el consumo expresado en kWh, que es la unidad que cobra la distribuidora eléctrica. En neveras y lavadoras suele aparecer como consumo anual o por ciclo. En aires, muchas veces se muestra como un índice de eficiencia (por ejemplo SEER, EER o una clasificación por letras o estrellas) en lugar de kWh directos.',
          'Dos precauciones al comparar. Primero, verifica que ambos modelos se midieron con la misma norma y que tienen la misma capacidad: comparar la eficiencia de un aire de 12,000 BTU con la de uno de 18,000 BTU no tiene sentido. Segundo, recuerda que son valores obtenidos en condiciones de laboratorio; en tu casa, con calor, humedad y puertas que se abren, el consumo real será distinto. Úsalos para comparar modelos entre sí, no como predicción exacta de tu factura. Si un dato no aparece, confírmalo con la tienda o con el manual.',
        ],
      },
      {
        title: 'Cómo estimar el efecto en tu propia factura',
        body: [
          'No necesitas conocer ninguna tarifa de memoria: tu factura de luz ya trae lo que hace falta. Sigue estos pasos con un lápiz o una hoja de cálculo.',
        ],
        list: [
          'Busca en tu factura el consumo del mes en kWh y el monto total, y divide el monto entre los kWh para obtener tu costo aproximado por kWh (incluye cargos e impuestos, que es lo que realmente pagas).',
          'Anota la potencia o el consumo de cada modelo que comparas, según la ficha o la etiqueta, y las horas diarias que lo usarías.',
          'Multiplica kWh por hora o por día, por los días de uso al mes, para obtener los kWh mensuales de cada opción.',
          'Resta los kWh mensuales de ambas opciones y multiplícalos por tu costo por kWh: esa es la diferencia mensual estimada.',
          'Repite el cálculo con un escenario de uso moderado y otro intensivo para ver el rango, no un solo número.',
        ],
      },
      {
        title: 'El cálculo de recuperación: cuándo se paga solo',
        body: [
          'Toma la diferencia de precio entre el modelo inverter y el convencional equivalente y divídela entre el ahorro mensual que calculaste. El resultado son los meses que tardarías en recuperar el sobreprecio solo con electricidad. Si ese plazo es corto frente a la vida útil del equipo, que en aires y neveras suele medirse en años, la compra tiene sentido; si es larguísimo, probablemente no.',
          'Incluye también lo que no se ve en la factura: un equipo más silencioso, una temperatura más pareja y, en algunos modelos, garantías distintas para el compresor. Y no olvides que el precio cambia con el tiempo, así que revisa el historial del modelo antes de decidir; en las fichas de DóndeTa puedes ver cómo se ha movido y enlazar a la tienda para verificar el precio actual.',
        ],
      },
      {
        title: 'Voltaje inestable, apagones y protector de voltaje',
        body: [
          'En República Dominicana la red es de 110-120 V a 60 Hz, y las subidas, bajadas y cortes bruscos son parte de la realidad en muchas zonas. Los equipos inverter incluyen electrónica de potencia y tarjetas de control que son más sensibles a picos y variaciones que un compresor convencional simple. Algunos modelos toleran un rango amplio de voltaje; otros no. Revisa en el manual el rango de operación y confírmalo con la tienda.',
          'Un protector de voltaje, o un regulador, es una inversión pequeña frente al costo de una tarjeta electrónica. Elige uno con la capacidad adecuada para el equipo (consulta la corriente de arranque en el manual) y con retardo de reconexión para aires y neveras, de modo que el compresor no arranque inmediatamente cuando regresa la luz. Revisa además si la garantía exige o excluye daños por variación eléctrica.',
        ],
      },
    ],
    faqs: [
      {
        q: '¿Un aire inverter siempre consume menos que uno convencional?',
        a: 'No siempre. Con uso largo y continuo suele consumir menos; con uso ocasional la diferencia puede ser pequeña. Lo mejor es comparar el consumo declarado de dos modelos de la misma capacidad y hacer el cálculo con tus horas de uso.',
      },
      {
        q: '¿Necesito un protector de voltaje con un equipo inverter?',
        a: 'Es muy recomendable en zonas con variaciones de voltaje o apagones frecuentes, porque la electrónica del equipo es sensible. Confirma en el manual el rango de voltaje que tolera y qué dice la garantía sobre daños eléctricos.',
      },
      {
        q: '¿Los kWh de la etiqueta son lo que pagaré?',
        a: 'Son una referencia para comparar modelos en condiciones de prueba. Tu consumo real depende del clima, el uso, la instalación y el mantenimiento.',
      },
    ],
    related: [
      'elegir-aire-acondicionado',
      'comparar-neveras',
      'elegir-lavadora',
      'inversor-o-planta-electrica-rd',
      'como-leer-ficha-tecnica-electrodomesticos',
    ],
  },

  {
    slug: 'garantia-electrodomesticos-rd-derechos-consumidor',
    title: 'Garantía de electrodomésticos en RD: qué revisar y qué hacer si falla',
    description:
      'Qué cubre y qué excluye normalmente una garantía, diferencia entre garantía de tienda y de fabricante, qué guardar y cómo proceder si el equipo falla.',
    updated: '2026-10-20',
    intro: [
      'La garantía es parte del precio de un electrodoméstico, aunque no aparezca en la etiqueta. Dos modelos con el mismo precio pueden ofrecer protección muy distinta: uno con servicio técnico cercano y reparación rápida, otro con un papel que nadie sabe cómo hacer válido. Leer las condiciones antes de pagar es mucho más fácil que reclamar después.',
      'Esta guía describe lo que normalmente cubre y excluye una garantía, qué documentos conservar y cómo actuar si el equipo falla. Las condiciones exactas cambian según la marca, la tienda y el producto, así que úsala como lista de preguntas, no como texto legal.',
    ],
    sections: [
      {
        title: 'Qué suele cubrir una garantía y qué suele excluir',
        body: [
          'En general, una garantía cubre defectos de fabricación o de funcionamiento que aparecen con un uso normal durante un plazo determinado. Puede incluir reparación, sustitución de piezas o, según las condiciones, cambio del equipo. Lo que se cubre, por cuánto tiempo y quién paga la mano de obra o el traslado varía mucho: confírmalo por escrito.',
          'Las exclusiones también son habituales y conviene conocerlas de antemano. Revisa especialmente las que tocan a tu casa y tu clima.',
        ],
        list: [
          'Daños por variaciones de voltaje, rayos o apagones, que en RD son un motivo frecuente de discusión.',
          'Instalación hecha por personas no autorizadas por la marca o la tienda.',
          'Golpes, caídas, derrames, humedad excesiva o plagas dentro del equipo.',
          'Uso comercial de un equipo diseñado para uso doméstico.',
          'Piezas de desgaste, accesorios, filtros, empaques o consumibles.',
          'Etiquetas o números de serie borrados o alterados.',
        ],
      },
      {
        title: 'Garantía de la tienda y garantía del fabricante',
        body: [
          'A veces se mencionan como si fueran lo mismo, pero no siempre lo son. La garantía del fabricante o importador respalda el producto y suele gestionarse a través de su red de servicio técnico. La garantía de la tienda es el compromiso del vendedor, que puede añadir condiciones propias, como cambios en los primeros días o gestión del reclamo en su nombre.',
          'Antes de comprar pregunta quién atiende el reclamo en la práctica: ¿llevas el equipo a la tienda, llamas a un centro de servicio o contactas al importador? Averigua también si la garantía cubre visitas a domicilio para equipos grandes como neveras o aires, o si debes trasladarlos tú. Para un aire o una nevera, un técnico que llegue a tu casa pesa más que un año adicional de garantía en el papel.',
        ],
      },
      {
        title: 'Verifica el servicio técnico local antes de pagar',
        body: [
          'Una garantía sin piezas ni técnicos disponibles se vuelve un trámite lento. Si el servicio depende de un importador, busca el centro de servicio autorizado más cercano, confirma que tiene teléfono y horario, y pregunta si mantiene repuestos de los modelos que vende. Esto es especialmente relevante fuera del Gran Santo Domingo, donde las distancias alargan los plazos.',
          'Una pregunta útil al vendedor es qué ocurre si la reparación se demora: si hay un equipo de reemplazo, si se extiende el plazo de garantía o si se devuelve el dinero. Si la respuesta es vaga, pídela por escrito o considera otra opción.',
        ],
      },
      {
        title: 'Conserva la factura y registra el producto',
        body: [
          'La factura de compra es tu comprobante principal: guárdala con la fecha, el modelo y el número de serie. Una foto del documento y de la etiqueta del equipo en tu teléfono es un respaldo barato, porque el papel térmico se desvanece con el tiempo. Guarda también la tarjeta de garantía sellada, el manual y, si es posible, el empaque durante las primeras semanas por si necesitas devolver o cambiar el equipo.',
          'Si el fabricante ofrece registrar el producto en línea o por teléfono, hazlo dentro del plazo que indiquen. El registro no siempre es obligatorio, pero puede facilitar el reclamo. Revisa si la garantía empieza en la fecha de compra o en la de instalación o entrega, porque puede cambiar el cálculo del plazo.',
        ],
      },
      {
        title: 'Qué revisar el día de la compra y de la entrega',
        body: [
          'Antes de pagar, pide las condiciones por escrito: duración, qué cubre, qué excluye, quién repara y dónde. Al recibir el equipo, ábrelo delante de quien lo entrega si es posible y comprueba que no tenga golpes, que incluya accesorios y manual, y que el modelo y el número de serie coincidan con la factura. Si es un equipo que requiere instalación, pregunta si la instalación autorizada es condición para mantener la garantía.',
          'Enciéndelo de inmediato y prueba las funciones básicas. Un defecto visible o de arranque es más fácil de resolver cuando se reporta en los primeros días.',
          'Si algo no coincide con lo que compraste, por ejemplo otro modelo, un color distinto o una pieza faltante, no firmes la recepción sin dejar constancia de la observación. Una nota en el comprobante de entrega y una foto con fecha ayudan mucho más que una llamada días después. Pregunta también si la tienda tiene una política propia de cambio por defecto de fábrica y por cuántos días aplica, porque eso depende de cada establecimiento.',
        ],
      },
      {
        title: 'Si el equipo falla: pasos recomendados',
        body: [
          'Primero revisa que el problema no sea de instalación o de uso: enchufe, disyuntor, filtros, configuración. Si persiste, reúne factura, tarjeta de garantía y número de serie, y contacta a la tienda o al servicio técnico autorizado. Pide un número de caso, anota la fecha y el nombre de la persona que te atiende, y solicita el diagnóstico por escrito.',
          'Si no recibes respuesta o no estás de acuerdo con la solución, existe la Ley General de Protección de los Derechos del Consumidor (Ley No. 358-05) y el organismo encargado de aplicarla, Pro Consumidor, donde se pueden presentar quejas. No citamos aquí plazos ni derechos específicos porque dependen de cada caso: consulta directamente con Pro Consumidor para verificar qué aplica a tu situación y cómo presentar tu reclamo.',
        ],
      },
    ],
    faqs: [
      {
        q: '¿Puedo reclamar la garantía sin la factura?',
        a: 'Es mucho más difícil. La factura demuestra fecha y lugar de compra. Si la perdiste, pide una copia a la tienda cuanto antes y guarda además una foto de la nueva.',
      },
      {
        q: '¿La garantía cubre daños por apagones o subidas de voltaje?',
        a: 'Con frecuencia se excluyen. Revisa las condiciones y pregunta específicamente; un protector de voltaje puede evitar el problema y, en algunos casos, ser requerido.',
      },
      {
        q: '¿Dónde puedo presentar una queja si no me resuelven?',
        a: 'Pro Consumidor es la entidad dominicana a la que se acude para quejas de consumo. Verifica con ellos los requisitos y pasos vigentes para tu caso.',
      },
    ],
    related: [
      'comprar-electrodomesticos-rd',
      'comprar-a-cuotas-electrodomesticos',
      'cuidar-electrodomesticos-clima-tropical',
      'como-leer-ficha-tecnica-electrodomesticos',
    ],
  },

  {
    slug: 'comprar-a-cuotas-electrodomesticos',
    title: 'Comprar electrodomésticos a cuotas: cómo comparar el costo real',
    description:
      'Financiamiento de la tienda, cuotas con tarjeta de crédito o pago de contado: qué preguntar, cómo comparar ofertas por total pagado y cómo evitar comprometerte de más.',
    updated: '2026-10-20',
    intro: [
      'Pagar un electrodoméstico en cuotas hace que una compra grande parezca liviana: una nevera o un aire se convierte en un pago mensual que cabe en el presupuesto. El riesgo es que la cuota esconde cuánto terminas pagando en total, y que una oferta con cuota baja puede costar más que otra con cuota más alta pero menos plazo.',
      'Esta guía te da un método para comparar financiamientos con un solo número, el total pagado, y una lista de preguntas para hacer antes de firmar. No incluimos tasas porque cambian por entidad, producto y perfil; pídelas siempre por escrito.',
    ],
    sections: [
      {
        title: 'Tres formas de pagar y en qué se diferencian',
        body: [
          'Contado: pagas el precio acordado y no hay intereses, aunque a veces implica desembolsar una suma grande de una vez. Es la referencia con la que deberías comparar todo lo demás, y es útil preguntar si la tienda ofrece un precio distinto por pagar en efectivo, transferencia o tarjeta. Si pagar de contado te deja sin colchón para una emergencia, esa también es una razón válida para considerar cuotas, siempre que conozcas su costo.',
          'Financiamiento de la tienda: la tienda o una entidad aliada te da un plan de pago. Puede incluir un plazo fijo, cuota fija y condiciones propias, como cargos de apertura o seguros. Cuotas con tarjeta de crédito: el banco divide la compra en pagos mensuales, con condiciones que dependen de tu tarjeta y de la promoción vigente. En ambos casos, lo importante es saber si hay intereses y cuáles son los cargos adicionales.',
        ],
      },
      {
        title: 'Qué preguntar antes de aceptar un plan',
        body: [
          'Una cuota atractiva no dice nada sin el resto de las condiciones. Pregunta y anota las respuestas, de preferencia en un documento con el plan completo.',
        ],
        list: [
          '¿Cuál es el precio de contado y cuál es el total que pagaré al final del plazo?',
          '¿Hay intereses? ¿Cuál es la tasa y cómo se expresa (mensual, anual, efectiva)?',
          '¿Hay cargos de apertura, administración, comisión o seguro de vida o de desempleo? ¿Son obligatorios?',
          '¿La cuota incluye todo, o se añaden cargos en el estado de cuenta?',
          '¿Qué pasa si me atraso: recargos, intereses por mora, reporte a burós de crédito?',
          '¿Puedo pagar antes de tiempo? ¿Hay penalidad o recálculo de intereses?',
          '¿El equipo queda a mi nombre desde el primer día o hay reserva de dominio hasta el último pago?',
        ],
      },
      {
        title: 'Compara dos ofertas con el total pagado',
        body: [
          'Para cada oferta, suma el pago inicial (si lo hay), todas las cuotas multiplicadas por el número de meses, y cualquier cargo único como apertura o seguro. Ese es el total pagado. Réstale el precio de contado: la diferencia es lo que te cuesta el financiamiento.',
          'Un ejemplo sin cifras reales: la oferta A tiene una cuota menor pero más meses, y la oferta B una cuota mayor con menos meses. Al multiplicar y sumar los cargos, puede que A termine costando más, aunque se sienta más cómoda cada mes. Si una oferta es a cero interés, revisa que el precio de lista no sea más alto que el de contado en otra tienda; a veces el costo del financiamiento está dentro del precio.',
        ],
      },
      {
        title: 'Pagos anticipados y cierre del plan',
        body: [
          'Pregunta cómo se calculan los intereses si adelantas pagos. En algunos planes, abonar extra reduce el plazo o los intereses futuros; en otros, la cuota se mantiene y el beneficio es menor o inexistente. Conviene saber también si hay un cargo por cancelar el plan antes.',
          'Si te llega dinero extra, como un bono, puede tener sentido cancelar la deuda de la compra antes de tiempo, pero solo si las condiciones del contrato lo permiten sin penalización. Confírmalo antes de firmar, no cuando ya tienes el dinero en mano.',
          'Guarda el contrato, el calendario de pagos y los comprobantes de cada cuota. Cuando termines de pagar, pide una constancia de que la deuda quedó saldada y revisa que el estado de cuenta o tu reporte de crédito lo reflejen. Es un paso que mucha gente olvida y que evita confusiones meses después.',
        ],
      },
      {
        title: 'Cuidado con comprometerte de más',
        body: [
          'Una regla práctica es sumar todas tus cuotas mensuales de deudas, incluyendo esta nueva, y comprobar que dejan espacio para gastos fijos, ahorro y imprevistos. Si la nueva cuota solo cabe si nada sale mal, es una señal de que el plazo o el producto no es el adecuado.',
          'Recuerda que el equipo seguirá consumiendo luz y puede necesitar instalación, un protector de voltaje o mantenimiento; esos gastos también cuentan. En cuotas largas, además, el equipo puede dañarse o volverse obsoleto antes de terminar de pagarlo. Elegir un modelo más sencillo o esperar a juntar más pago inicial suele costar menos que un plan largo.',
          'Evita también acumular varias compras a cuotas al mismo tiempo, aunque cada cuota sea pequeña: la suma es la que importa. Si ya tienes tarjetas con saldo pendiente, financiar otra compra sobre ellas encarece todo. Y desconfía de la presión para firmar en el momento: un buen plan sigue siendo bueno mañana, después de que lo hayas calculado con calma en casa.',
        ],
      },
      {
        title: 'Cómo ordenar la decisión',
        body: [
          'Primero compara el precio de contado del mismo modelo exacto en varias tiendas, por ejemplo entre Plaza Lama, Jumbo, Sirena, Corripio o PriceSmart, y revisa el historial de precio. Después pide el plan de financiamiento de la opción que mejor te convenga y calcula el total pagado. Finalmente, decide si la diferencia entre pagar de contado y a cuotas se justifica para ti.',
          'En las fichas de DóndeTa puedes ver el precio registrado y enlazar a la tienda para confirmar condiciones vigentes; la información de financiamiento siempre debe verificarse directamente con la tienda o el banco.',
        ],
      },
    ],
    faqs: [
      {
        q: '¿Las cuotas sin interés realmente no cuestan nada?',
        a: 'Pueden no tener intereses, pero revisa si hay cargos, seguros o un precio de lista más alto que el de contado en otro lugar. Compara siempre el total pagado.',
      },
      {
        q: '¿Conviene más financiar con la tienda o con tarjeta de crédito?',
        a: 'Depende de las condiciones de cada una. Pide ambas por escrito, calcula el total pagado y revisa las condiciones de pago anticipado y de mora.',
      },
      {
        q: '¿Puedo pagar antes de tiempo sin penalidad?',
        a: 'Depende del contrato. Pregunta antes de firmar si hay cargos por cancelación anticipada y cómo se recalculan los intereses.',
      },
    ],
    related: [
      'comprar-electrodomesticos-rd',
      'garantia-electrodomesticos-rd-derechos-consumidor',
      'cuando-comprar-feriados-black-friday-rd',
      'entender-historial-precios',
    ],
  },

  {
    slug: 'cuando-comprar-feriados-black-friday-rd',
    title: 'Cuándo comprar electrodomésticos en RD: fechas, ofertas y descuentos reales',
    description:
      'Cómo se agrupan las promociones alrededor de Black Friday, Navidad, Día de las Madres y los Padres y el regreso a clases, y cómo evitar descuentos falsos.',
    updated: '2026-10-20',
    intro: [
      'En República Dominicana las promociones de electrodomésticos no se reparten parejo durante el año: se concentran alrededor de fechas comerciales. Saber cuáles son te permite planificar la compra, pero una fecha de ofertas no garantiza un buen precio, y esperar demasiado tiene su propio costo si el equipo es una necesidad.',
      'Esta guía repasa el calendario típico, cómo prepararte antes de que empiece la campaña y cómo distinguir un descuento real de uno que solo lo parece. No hablamos de porcentajes concretos porque cambian cada año y cada tienda.',
    ],
    sections: [
      {
        title: 'El calendario comercial que más mueve las ofertas',
        body: [
          'Hay fechas en las que es habitual ver campañas en tiendas y supermercados. Las fechas exactas y las condiciones las define cada tienda, así que sirven como orientación, no como promesa.',
        ],
        list: [
          'Black Friday y Cyber Monday, a finales de noviembre: el inicio de la temporada fuerte, con campañas tanto en tiendas físicas como en línea.',
          'Navidad y fin de año: ofertas ligadas a regalos y a las compras del hogar para las fiestas.',
          'Día de las Madres, el último domingo de mayo: suele concentrar promociones de cocina, lavado y electrodomésticos pequeños.',
          'Día de los Padres, el último domingo de julio: más enfocado en televisores, audio y herramientas.',
          'Regreso a clases: promociones de computadoras, tabletas y electrónica.',
          'Liquidaciones por cambio de modelo: ocurren cuando llegan versiones nuevas y la tienda quiere vaciar inventario anterior.',
        ],
      },
      {
        title: 'Prepárate antes de la fecha: sigue el precio con anticipación',
        body: [
          'La mejor preparación empieza semanas antes. Decide el modelo exacto que quieres (marca y número de modelo) y anota su precio en varias tiendas durante un tiempo. Así sabrás qué es normal para ese producto y podrás reconocer una rebaja real cuando aparezca.',
          'Define también tu tope: el precio máximo que estás dispuesto a pagar por ese modelo con envío e instalación. Con un número decidido de antemano es más fácil resistir la urgencia de una cuenta regresiva o de un cartel de última hora.',
          'Prepara además la logística: mide el espacio y la puerta por donde entrará el equipo, confirma que tu instalación eléctrica o de gas es la adecuada y deja listo el método de pago. Si planeas usar una tarjeta o un financiamiento, revisa antes sus condiciones, porque descubrirlas el día de la campaña es la forma más rápida de decidir mal. Y si tienes varios productos en mente, ordénalos por necesidad: lo urgente primero, lo deseable después.',
        ],
      },
      {
        title: 'Compara contra la historia del producto, no contra el precio tachado',
        body: [
          'El precio tachado que aparece como el precio anterior no siempre refleja el precio al que se vendió el producto. Puede ser un precio de lista que casi nadie pagó, o uno que subió pocos días antes de la campaña. La referencia más fiable es la historia real del producto: cuánto costó en las semanas y meses previos.',
          'En las páginas de producto de DóndeTa puedes ver el historial de precio y enlazar a la tienda para verificar el precio vigente. Revisa si el precio de la oferta es realmente menor al mínimo habitual del producto o solo vuelve a un nivel que ya se había visto.',
        ],
      },
      {
        title: 'Cómo reconocer un descuento falso',
        body: [
          'Algunas señales deberían hacerte desconfiar y revisar más. Un descuento muy grande frente a un precio anterior que no puedes comprobar; un modelo que cambió de código respecto al que ves en otras tiendas, lo que impide comparar; condiciones de la oferta que cambian en la letra pequeña (solo con una tarjeta específica, solo con financiamiento, solo en cierta sucursal); o una rebaja que viene acompañada de un cargo extra de envío o instalación.',
          'Haz una comparación sencilla: precio final con envío e instalación, para el mismo modelo exacto, en dos o tres tiendas. Si la diferencia con la oferta es pequeña, probablemente no valga la pena el apuro.',
        ],
      },
      {
        title: 'Stock, entrega y plazos',
        body: [
          'En campañas grandes los productos más buscados pueden agotarse, y los envíos se retrasan por la demanda. Pregunta si el producto está en inventario o se reserva, cuándo se entrega y qué pasa si se agota después de pagar. Para equipos grandes confirma la fecha de entrega y la instalación antes de pagar.',
          'Las ofertas suelen tener fecha límite y a veces cantidades limitadas. Si el modelo es el que ya tenías decidido, comprar en el primer tramo de la campaña puede evitarte quedarte sin él; si hay varias opciones aceptables, esperar a ver cómo se mueve el precio puede ser razonable.',
        ],
      },
      {
        title: 'Cuándo no conviene esperar',
        body: [
          'Si tu nevera se dañó o necesitas un aire para dormir, esperar tres meses una fecha comercial tiene un costo práctico. Compara el posible ahorro con lo que te cuesta no tener el equipo, y decide con ese criterio. A veces es mejor comprar con un buen precio hoy que perseguir una oferta que quizás no llegue.',
          'Si piensas pagar en cuotas, recuerda que una promoción no compensa un financiamiento caro: compara siempre el total pagado. Y revisa la garantía y el servicio técnico, porque son parte del valor del descuento.',
          'Considera también el momento del año para cada categoría. Los aires acondicionados tienen más demanda en los meses calurosos, y un televisor nuevo suele tener más atractivo cuando acaba de salir una versión posterior del mismo modelo. Observar el ritmo de cada producto durante unas semanas te da más información que cualquier calendario general.',
          'Finalmente, desconfía de la urgencia fabricada. Contadores regresivos, avisos de pocas unidades y mensajes de última oportunidad son técnicas de venta comunes y no prueban que el precio sea bueno. Si ya comparaste el modelo exacto, calculaste el costo total y te conviene, compra con tranquilidad; si no, está bien dejar pasar la oferta.',
        ],
      },
    ],
    faqs: [
      {
        q: '¿Black Friday es siempre el mejor momento para comprar?',
        a: 'No necesariamente. Puede haber buenas ofertas, pero también precios que no cambian o descuentos sobre precios inflados. Compara con el historial del producto y con otras tiendas.',
      },
      {
        q: '¿Cuándo es el Día de las Madres y el de los Padres en RD?',
        a: 'El Día de las Madres se celebra el último domingo de mayo y el Día de los Padres el último domingo de julio. Las tiendas suelen lanzar campañas alrededor de esas fechas.',
      },
      {
        q: '¿Cómo sé si una oferta es real?',
        a: 'Compara el precio con el que tenía el mismo modelo exacto en semanas anteriores y con el de otras tiendas, incluyendo envío e instalación.',
      },
    ],
    related: [
      'entender-historial-precios',
      'comprar-electrodomesticos-rd',
      'comprar-a-cuotas-electrodomesticos',
      'comprar-televisor',
    ],
  },
]
