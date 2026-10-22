import type { Guide } from '../content'

export const GUIDES_A: Guide[] = [
  {
    slug: 'inversor-o-planta-electrica-rd',
    title: 'Inversor, UPS o planta eléctrica: qué conviene para los apagones en casa',
    description:
      'Cómo decidir entre un inversor con baterías, un UPS o una planta eléctrica en República Dominicana según lo que quieres mantener funcionando, el arranque de compresores, el mantenimiento y la seguridad.',
    updated: '2026-10-20',
    intro: [
      'En muchos hogares dominicanos los apagones dejaron de ser una sorpresa y pasaron a ser parte de la planificación: qué se descongela, qué se enfría y a qué hora hay que cargar el teléfono. La respuesta habitual es comprar un respaldo de energía, pero las opciones —UPS, inversor con baterías, planta eléctrica— resuelven problemas distintos y cuestan de formas distintas.',
      'Esta guía no recomienda una marca ni un modelo. Te ayuda a hacer la cuenta correcta: qué quieres mantener encendido, cuánta potencia necesita eso, cuántas horas esperas cubrir y qué tipo de mantenimiento estás dispuesto a asumir.',
    ],
    sections: [
      {
        title: 'Empieza por la lista de lo que quieres mantener encendido',
        body: [
          'El error más común es comprar primero el equipo y después descubrir que no alcanza. Lo correcto es al revés: haz una lista de los aparatos que realmente quieres respaldar y anota la potencia en vatios (W) de cada uno. La encuentras en la etiqueta del aparato, en el manual o en la ficha técnica.',
          'Separa lo esencial de lo deseable. Una nevera, algunos abanicos, las luces, el router y los cargadores son una carga moderada. Un aire acondicionado, una bomba de agua, una estufa eléctrica o un calentador de agua son cargas pesadas que cambian por completo el tamaño del sistema.',
        ],
        list: [
          'Esencial para casi todos: nevera, luces LED, router y módem, cargadores, uno o dos abanicos',
          'Según el hogar: televisor, computadora de trabajo, bomba de agua, equipos médicos',
          'Carga pesada: aire acondicionado, microondas, estufa o plancha eléctrica',
          'Suma las potencias de lo que podría estar encendido al mismo tiempo, no de todo lo que tienes en casa',
        ],
      },
      {
        title: 'Potencia continua y arranque: lo que el compresor exige',
        body: [
          'Los aparatos con motor o compresor —neveras, aires acondicionados, bombas— consumen mucho más durante el arranque que mientras funcionan. Ese pico dura una fracción de segundo, pero puede ser varias veces la potencia normal. Un inversor o una planta que no soporta ese pico se apaga, se sobrecarga o termina dañándose.',
          'Por eso las fichas técnicas distinguen entre potencia continua y potencia pico o de surge. Mira ambas. Si no encuentras el pico de arranque, pregúntale al técnico o al vendedor y deja un margen amplio. En general, conviene que la capacidad continua del equipo supere con holgura la suma de tus cargas, y que el pico soportado cubra el arranque del compresor más exigente.',
          'Ten en cuenta que en República Dominicana la red es de 110-120 V y 60 Hz. Confirma que el inversor o la planta entregue esa tensión y frecuencia, o que sea configurable, antes de comprarlo.',
        ],
      },
      {
        title: 'UPS, inversor con baterías y planta: qué hace cada uno',
        body: [
          'Un UPS pequeño está pensado para proteger una computadora o un router: cubre cortes de minutos u horas muy cortas y da tiempo para apagar con calma. No está hecho para sostener una nevera durante una noche entera.',
          'Un inversor con banco de baterías convierte la energía de las baterías en corriente alterna para tu casa. Es silencioso, no usa combustible y reacciona casi de inmediato al corte, pero la autonomía depende de la capacidad del banco de baterías: más horas de respaldo significan más baterías, más espacio y más inversión. Muchos sistemas se combinan con paneles solares para recargar las baterías.',
          'Una planta eléctrica genera su propia energía con un motor. Aguanta cargas mayores y funciona mientras tengas combustible, pero es ruidosa, necesita ventilación, mantenimiento del motor y tarda unos segundos o minutos en entrar, salvo que tenga arranque automático.',
        ],
      },
      {
        title: 'Baterías: tipos y qué preguntar',
        body: [
          'En términos generales hay dos familias. Las baterías de plomo-ácido (incluidas las selladas AGM o de gel) son más económicas al comprar, pero son pesadas, suelen tolerar menos ciclos de descarga profunda y su vida útil es menor. Las de litio, como las de fosfato de hierro (LiFePO4), cuestan más al inicio, pesan menos y suelen aguantar más ciclos de carga y descarga.',
          'Ninguna es mejor en todos los casos: depende de cuántos apagones tengas, de cuánto quieras invertir ahora y de cuánto tiempo esperes usar el sistema. Pregunta siempre por la vida útil en ciclos, la garantía de las baterías por separado de la del inversor, qué profundidad de descarga se recomienda y si el inversor es compatible con el tipo de batería que elijas.',
          'Pide también un inversor de onda sinusoidal pura si vas a conectar neveras, aires o equipos electrónicos sensibles; los de onda modificada pueden causar ruido, calentamiento o fallos en algunos aparatos.',
        ],
      },
      {
        title: 'Combustible, ruido y mantenimiento: el costo que no aparece en la etiqueta',
        body: [
          'La planta eléctrica tiene un costo de operación continuo: combustible, aceite, filtros y revisiones periódicas. Además, el combustible hay que almacenarlo de forma segura y tenerlo disponible justo cuando hay emergencias. Una planta que lleva meses sin arrancar suele fallar el día que se necesita, así que conviene probarla de forma regular según indique el manual.',
          'El inversor con baterías casi no requiere mantenimiento diario, pero las baterías son un gasto que llegará tarde o temprano: tienen una vida útil limitada y hay que reemplazarlas.',
          'Antes de decidir, calcula cuántas horas de apagón soportas en un mes típico en tu zona. Para cortes de pocas horas, un inversor bien dimensionado suele ser más cómodo. Para cortes largos y frecuentes, o cargas pesadas, la planta o un sistema híbrido puede tener más sentido.',
        ],
      },
      {
        title: 'Seguridad: lo que no se negocia',
        body: [
          'Nunca uses una planta eléctrica dentro de la casa, en el garaje cerrado, en un balcón techado ni cerca de ventanas. Los motores de combustión emiten monóxido de carbono, un gas sin olor que puede ser mortal. Colócala al aire libre, lejos de puertas y ventanas, protegida de la lluvia pero con buena ventilación.',
          'No conectes una planta al tablero de la casa con un cable macho a macho ni enchufándola a un tomacorriente. Eso puede devolver corriente a la red y poner en riesgo a los técnicos que trabajan en las líneas, además de dañar tus equipos. La forma correcta es un interruptor de transferencia (manual o automático) instalado por un electricista calificado, que aísla la casa de la red mientras la planta está en uso.',
          'Usa extensiones del calibre adecuado, no sobrecargues regletas y deja enfriar la planta antes de rellenar combustible. Un inversor también necesita ventilación y un lugar seco; las baterías no deben quedar en espacios cerrados sin aire ni cerca de fuentes de calor. Consulta siempre las normas de instalación vigentes y contrata a un profesional para la parte eléctrica.',
        ],
      },
    ],
    faqs: [
      {
        q: '¿Un UPS puede mantener mi nevera encendida durante un apagón?',
        a: 'Los UPS pequeños están pensados para computadoras y routers, no para compresores. Una nevera necesita potencia de arranque alta y horas de autonomía, algo que normalmente exige un inversor con banco de baterías o una planta. Confirma siempre los datos con el manual del equipo y con el vendedor.',
      },
      {
        q: '¿Puedo conectar un aire acondicionado a un inversor?',
        a: 'Se puede, pero es la carga más exigente de la casa por su consumo y su pico de arranque. Requiere un inversor y un banco de baterías considerablemente más grandes, o una planta de buena capacidad. Los aires inverter suelen tener un arranque más suave, pero igual conviene consultar con un técnico y revisar las fichas técnicas.',
      },
      {
        q: '¿Qué es un interruptor de transferencia y por qué lo necesito?',
        a: 'Es un dispositivo que conecta la casa a la red o a la planta, pero nunca a las dos a la vez. Evita que la planta envíe corriente a la red y protege a los equipos y a las personas. Debe instalarlo un electricista calificado.',
      },
      {
        q: '¿Cuántas horas de respaldo me dará un banco de baterías?',
        a: 'Depende de la capacidad de las baterías, del tipo, de la profundidad de descarga permitida y de la potencia de lo que conectes. No hay una cifra universal: pide al instalador un cálculo con tu lista de aparatos concreta.',
      },
    ],
    related: [
      'cuidar-electrodomesticos-clima-tropical',
      'elegir-aire-acondicionado',
      'comparar-neveras',
      'como-leer-ficha-tecnica-electrodomesticos',
    ],
  },

  {
    slug: 'elegir-secadora-ropa',
    title: 'Cómo elegir una secadora de ropa: gas o eléctrica, capacidad y ventilación',
    description:
      'Guía para decidir si una secadora te conviene en República Dominicana y cómo elegir entre gas y eléctrica, capacidad, ventilación, combos lavadora-secadora y cuidado del equipo.',
    updated: '2026-10-20',
    intro: [
      'En un país cálido, mucha gente seca la ropa al sol y listo. Pero en temporada de lluvias, en apartamentos sin patio o en hogares donde nadie está para recoger la ropa a tiempo, la secadora pasa de capricho a herramienta práctica. Antes de comprarla conviene saber si realmente te hace falta y qué características importan.',
      'Esta guía repasa las decisiones principales: gas o electricidad, capacidad, dónde y cómo se ventila, cuándo tiene sentido un combo lavadora-secadora y cómo cuidarla para que dure.',
    ],
    sections: [
      {
        title: 'Primero, ¿te conviene una secadora o el tendedero?',
        body: [
          'Secar al sol es gratis, deja la ropa con buen olor y no gasta electricidad ni gas. Si tienes patio o azotea, buen sol y tiempo, el tendedero sigue siendo difícil de superar para la ropa de uso diario. La secadora gana cuando llueve varios días seguidos, cuando vives en un edificio donde no se puede tender, cuando tienes bebés y mucha ropa que lavar o cuando simplemente no tienes tiempo.',
          'Tampoco tienes que elegir una sola opción. Muchas familias usan la secadora solo para toallas, ropa de cama, ropa de niños o días de lluvia, y el resto lo secan al aire. Eso reduce el uso, el consumo y el desgaste de las prendas.',
        ],
      },
      {
        title: 'Gas o eléctrica',
        body: [
          'Las secadoras eléctricas son las más simples de instalar: necesitan un tomacorriente adecuado y, según el modelo, un circuito dedicado. Muchas secadoras de tamaño completo requieren una conexión de mayor potencia que un enchufe común, así que confirma con el manual y con un electricista si tu instalación lo soporta. Verifica además si el modelo está diseñado para 110-120 V o necesita 220 V, porque no todos los hogares dominicanos tienen esa conexión disponible.',
          'Las de gas necesitan una toma de gas y una instalación segura, además de una conexión eléctrica menor para el motor y los controles. Si ya tienes gas en casa, puede ser una opción, pero siempre debe instalarla un técnico calificado. Compara el costo de operación según el tipo de gas y el precio de la electricidad en tu situación, sin asumir que una es siempre más barata que la otra.',
        ],
        list: [
          'Eléctrica: instalación más sencilla, revisa la potencia y el voltaje que exige',
          'Gas: requiere conexión de gas y técnico autorizado, y buena ventilación',
          'En ambos casos, confirma qué instalación necesitas y quién la hace antes de comprar',
          'Pregunta si el precio incluye instalación, kit de ducto y entrega',
        ],
      },
      {
        title: 'Capacidad: cuánta ropa cabe de verdad',
        body: [
          'La capacidad suele indicarse en kilogramos o en pies cúbicos. Para una persona o una pareja, un modelo compacto puede alcanzar; para familias de cuatro o más, conviene una capacidad parecida o superior a la de la lavadora. Una regla práctica es que la secadora debería poder recibir la carga completa de la lavadora sin apretarla, porque la ropa necesita espacio para girar y que el aire circule.',
          'Una secadora demasiado llena seca mal, arruga la ropa y gasta más energía. Una demasiado grande para tu uso ocupa espacio y consume más por ciclo. Mide el espacio disponible, incluyendo la puerta abierta y el hueco detrás para el ducto.',
        ],
      },
      {
        title: 'Ventilación y humedad',
        body: [
          'Una secadora expulsa aire caliente y húmedo, y ese aire tiene que salir al exterior. Los modelos con ducto de evacuación necesitan una salida hacia afuera mediante un tubo corto y lo más recto posible; un ducto largo o con muchas curvas alarga el secado y acumula pelusa. Dentro de un cuarto cerrado, esa humedad se acumula y favorece el moho en un clima como el dominicano.',
          'Si no tienes forma de sacar el aire, existen secadoras de condensación, que recogen el agua en un depósito o la envían a un desagüe, y secadoras con bomba de calor, que funcionan de forma más eficiente pero suelen costar más. Confirma en el manual cuál es el sistema, cómo se vacía el agua y si el modelo funciona bien a la temperatura ambiente típica de tu casa.',
          'Limpia la pelusa del filtro después de cada ciclo. Es un hábito que mejora el rendimiento y reduce el riesgo de que se sobrecaliente.',
        ],
      },
      {
        title: 'Combos lavadora-secadora: cuándo sí y cuándo no',
        body: [
          'Un combo lava y seca en el mismo tambor y ahorra espacio, algo útil en apartamentos pequeños. A cambio, el ciclo de secado suele ser más lento y la capacidad de secado es menor que la de lavado, de modo que a veces hay que sacar parte de la ropa para que seque bien. No puedes lavar una carga mientras se seca otra.',
          'Si el espacio es tu principal limitación, un combo puede ser una buena solución. Si lavas mucha ropa o quieres rapidez, dos equipos separados, o una torre apilable, suelen funcionar mejor. Mira también cómo es la guía de lavadoras antes de decidir qué tipo de carga te conviene.',
        ],
      },
      {
        title: 'Cuidado, programas y consumo',
        body: [
          'Revisa las etiquetas de la ropa: no todo debe ir a la secadora. Las prendas delicadas, elásticas o con adornos pueden dañarse con el calor. Usa los programas de temperatura baja o media para la mayoría de las prendas, y reserva el calor alto para toallas y sábanas.',
          'Las secadoras son de los aparatos que más electricidad o gas consumen por hora de uso. La forma de gastar menos es simple: centrifugar bien la ropa en la lavadora, no sobrecargar el tambor, limpiar el filtro y, si el modelo lo trae, usar un sensor de humedad en lugar de un tiempo fijo. Algunas familias combinan: sol cuando se puede, secadora cuando no.',
          'Compara precios entre tiendas, incluyendo entrega y ducto, y confirma la garantía y dónde está el servicio técnico antes de decidir.',
        ],
      },
    ],
    faqs: [
      {
        q: '¿Vale la pena una secadora en un clima caliente como el dominicano?',
        a: 'Depende de tu situación. Si tienes sol y espacio para tender, quizá no la uses mucho. Si vives en un apartamento, hay temporadas de lluvia o tienes poco tiempo, puede ser muy útil, aunque sea solo para ciertas cargas.',
      },
      {
        q: '¿Puedo instalar una secadora en un apartamento sin salida al exterior?',
        a: 'Hay modelos de condensación o de bomba de calor que no necesitan ducto hacia afuera. Revisa el manual para saber cómo manejan el agua y qué espacio y ventilación exigen.',
      },
      {
        q: '¿Una secadora eléctrica funciona con un enchufe normal de 110 V?',
        a: 'Algunos modelos compactos sí, pero muchos de tamaño completo piden una conexión de mayor potencia o de 220 V. Confirma en la ficha técnica y con un electricista antes de comprar.',
      },
    ],
    related: [
      'elegir-lavadora',
      'cuidar-electrodomesticos-clima-tropical',
      'como-leer-ficha-tecnica-electrodomesticos',
      'comprar-electrodomesticos-rd',
    ],
  },

  {
    slug: 'elegir-microondas',
    title: 'Cómo elegir un microondas: capacidad, potencia y tipo',
    description:
      'Qué mirar al comprar un microondas en RD: capacidad en litros, potencia en vatios, modelos solo, con grill o convección, tecnología inverter, empotrado o de mesa, seguridad y limpieza.',
    updated: '2026-10-20',
    intro: [
      'El microondas es uno de esos electrodomésticos que se usa todos los días y casi nunca se compara con cuidado. Se compra por tamaño o por precio, y semanas después se descubre que el plato no gira bien, que el modelo no calienta parejo o que no cabe el recipiente que se usa en casa.',
      'Con unos pocos datos de la ficha técnica y un poco de atención a cómo cocinas, puedes elegir un modelo que se ajuste a tu cocina y a tu consumo eléctrico.',
    ],
    sections: [
      {
        title: 'Capacidad: litros según cuántos son en casa',
        body: [
          'La capacidad interior se indica en litros. Como referencia general, los modelos compactos de unos 20 litros bastan para una o dos personas que recalientan comida y descongelan. Entre 25 y 30 litros es un rango cómodo para familias pequeñas y medianas, y los de más de 30 litros ayudan con platos grandes o bandejas amplias.',
          'Más litros no siempre significa mejor. Un modelo muy grande ocupa más espacio en la meseta y no calienta mejor una porción pequeña. Mira también el diámetro del plato giratorio: si tus platos o recipientes habituales no giran libremente, el calentamiento será desigual.',
        ],
      },
      {
        title: 'Potencia en vatios',
        body: [
          'La potencia de salida determina qué tan rápido se calienta la comida. Los microondas domésticos suelen estar en un rango de unos 700 a 1,200 vatios. Una potencia mayor reduce el tiempo de cocción, pero las recetas y los tiempos de los paquetes de comida están calculados para una potencia de referencia, así que con un modelo más potente conviene empezar con menos tiempo.',
          'No confundas la potencia de salida con la potencia de consumo eléctrico, que suele ser mayor y es la que importa para tu instalación. Si lo vas a conectar a un inversor o a una regleta compartida, revisa ese dato. En una red de 110-120 V, un microondas es una carga considerable que conviene conectar a un tomacorriente en buen estado.',
        ],
      },
      {
        title: 'Solo, con grill o con convección',
        body: [
          'Un microondas solo calienta, descongela y cocina con ondas. Es suficiente para la mayoría de los hogares y suele ser la opción más económica y más fácil de limpiar.',
          'Los modelos con grill añaden una resistencia en la parte superior que dora y gratina, útil para pan, queso o pollo. Los de convección incorporan un ventilador y una resistencia para funcionar casi como un horno pequeño; permiten hornear, aunque suelen ser más caros, más grandes y más difíciles de limpiar. Piensa con honestidad si usarás esas funciones; muchas personas pagan por ellas y después usan el aparato solo para recalentar.',
        ],
        list: [
          'Solo microondas: recalentar, descongelar, cocción rápida',
          'Con grill: dorar y gratinar además de calentar',
          'Con convección: hornear en pequeño formato, más versátil y más costoso',
          'Si ya tienes un horno o una freidora de aire, quizá no necesites estas funciones extra',
        ],
      },
      {
        title: 'Inverter, empotrado o de mesa',
        body: [
          'En un microondas convencional, la potencia se regula encendiendo y apagando el magnetrón por ciclos. En los modelos inverter, la potencia se entrega de forma más continua, lo que ayuda a descongelar y calentar con más uniformidad y puede ser más suave con los alimentos delicados. Suelen costar más, así que vale la pena si cocinas o descongelas a menudo.',
          'Los microondas de mesa son los más comunes y solo requieren un enchufe y espacio libre. Los empotrados se integran en un mueble o en un módulo con horno, se ven más limpios, pero necesitan medidas exactas, ventilación específica y una instalación planificada. Si compras uno empotrado, confirma las dimensiones del hueco y los requisitos de instalación con el manual y con el proveedor.',
        ],
      },
      {
        title: 'Qué revisar en la ficha técnica',
        body: [
          'Antes de decidir, confirma las dimensiones exteriores e interiores, el diámetro del plato, la potencia de salida y de consumo, el tipo de controles (perilla o panel digital), si tiene función de descongelado por peso, bloqueo para niños y el peso del equipo. Los controles de perilla suelen ser más fáciles de usar y de reparar; los digitales ofrecen más programas.',
          'Revisa la garantía, qué cubre y dónde está el servicio técnico. En un aparato relativamente económico, es común que la reparación cueste cerca del precio de uno nuevo, así que conviene saber qué tan accesible es el servicio antes de comprar. Compara el mismo modelo entre tiendas como Plaza Lama, Jumbo, Sirena o Corripio, fijándote en el código exacto del modelo y no solo en el nombre comercial.',
        ],
      },
      {
        title: 'Seguridad y limpieza',
        body: [
          'No uses recipientes metálicos ni papel aluminio, salvo que el manual lo permita expresamente. Usa envases aptos para microondas, vidrio o cerámica sin bordes metálicos, y deja una pequeña apertura en las tapas para que escape el vapor. Cuidado con los líquidos: pueden sobrecalentarse sin hervir y salpicar al sacarlos; deja reposar un momento antes de moverlos.',
          'Nunca lo hagas funcionar vacío. Limpia el interior con un paño húmedo después de usarlo, sobre todo si hubo salpicaduras, porque la grasa quemada reduce la eficiencia y deja olores. Un recipiente con agua y unas gotas de limón calentado unos minutos ayuda a aflojar la suciedad. Si la puerta no cierra bien, el sello está dañado o hay chispas, deja de usarlo y llama al servicio técnico.',
          'Deja espacio libre alrededor, tal como indique el manual, para que el aire circule y evitar el sobrecalentamiento, especialmente en un clima cálido.',
        ],
      },
    ],
    faqs: [
      {
        q: '¿Cuántos litros necesito para una familia de cuatro?',
        a: 'Como referencia general, entre 25 y 30 litros suele ser cómodo. Revisa también el diámetro del plato giratorio para saber si caben tus platos y recipientes habituales.',
      },
      {
        q: '¿Vale la pena pagar más por un microondas inverter?',
        a: 'Sirve sobre todo si descongelas o cocinas con él a menudo, porque calienta de forma más pareja. Si solo recalientas, un modelo convencional suele ser suficiente.',
      },
      {
        q: '¿Puedo usar mi microondas en un inversor o planta pequeña?',
        a: 'Revisa la potencia de consumo eléctrico del microondas, que es mayor que la de salida, y asegúrate de que el inversor la soporte con margen. Consulta el manual del equipo y al instalador.',
      },
    ],
    related: [
      'elegir-freidora-de-aire',
      'comprar-estufa-cocina',
      'inverter-vs-convencional-ahorro-energia',
      'como-leer-ficha-tecnica-electrodomesticos',
    ],
  },

  {
    slug: 'elegir-freidora-de-aire',
    title: 'Cómo elegir una freidora de aire: capacidad, tipo y cuidado',
    description:
      'Guía para comparar freidoras de aire en RD: capacidad según personas, canasta u horno, potencia, cuidado del antiadherente, qué cocinan bien, espacio en la meseta y consumo eléctrico.',
    updated: '2026-10-20',
    intro: [
      'La freidora de aire se volvió habitual en cocinas dominicanas porque cocina con muy poco aceite, calienta rápido y no calienta la casa como un horno grande. Pero no todas sirven para lo mismo: hay modelos pequeños que apenas alcanzan para dos porciones y otros enormes que ocupan media meseta.',
      'Antes de comprar, conviene saber para cuántas personas cocinas, qué vas a preparar y cuánto espacio y electricidad estás dispuesto a dedicarle.',
    ],
    sections: [
      {
        title: 'Capacidad: litros o cuartos según cuántas personas son',
        body: [
          'La capacidad se indica en litros o en cuartos (quarts), según la marca. Como orientación general, un modelo de unos 2 a 3 litros sirve para una persona o una pareja; entre 4 y 6 litros es un rango habitual para familias de tres o cuatro; los de más de 6 litros se orientan a familias grandes o a cocinar para reuniones.',
          'La capacidad útil es menor que la nominal. Para que el aire circule y la comida quede crujiente, no se debe llenar la canasta hasta el tope. Si sueles cocinar una pieza grande, como un pollo entero, revisa las dimensiones internas y no solo los litros.',
        ],
        list: [
          '1 a 2 personas: modelos compactos, ideales para porciones pequeñas',
          '3 a 4 personas: tamaño medio, el más versátil para el día a día',
          '5 o más personas: gran capacidad o tipo horno con varias bandejas',
          'Si cocinas por tandas, un modelo pequeño puede obligarte a repetir ciclos',
        ],
      },
      {
        title: 'Canasta o estilo horno',
        body: [
          'Las freidoras de canasta son las más comunes: una cesta extraíble en la que la comida se agita de vez en cuando. Son compactas, fáciles de limpiar y rápidas, pero cocinan en una sola capa o en un espacio limitado. Algunas traen dos compartimentos para cocinar dos cosas a la vez.',
          'Las de estilo horno tienen una puerta frontal y varias bandejas. Permiten cocinar más cantidad, hornear, deshidratar o usar función de rotisería según el modelo, pero ocupan más espacio, cuestan más y su limpieza tiene más piezas. Si ya tienes un horno o un microondas con convección, puede que no necesites este tipo.',
        ],
      },
      {
        title: 'Potencia y consumo eléctrico',
        body: [
          'La potencia suele estar entre unos 1,000 y 1,800 vatios. Una potencia mayor calienta más rápido, pero consume más mientras está encendida. Aun así, como los ciclos suelen ser cortos y no hace falta precalentar un horno grande, para porciones pequeñas puede resultar más práctica que encender el horno; el ahorro real depende de cuánto y cómo la uses, así que no asumas cifras sin comprobarlas.',
          'En una red de 110-120 V, una freidora de aire es una carga importante. Conéctala directamente a un tomacorriente en buen estado, evita compartir la regleta con otros aparatos de alto consumo y, si usas un inversor, asegúrate de que soporte su potencia con margen. Mira también el ruido del ventilador, que varía bastante entre modelos.',
        ],
      },
      {
        title: 'Qué cocina bien y qué no',
        body: [
          'Una freidora de aire funciona muy bien con papas, vegetales, alitas y piezas de pollo, empanadillas y croquetas congeladas, pescado y recalentados que antes quedaban blandos, como pizza o yuca frita. Da buenos resultados con la masa precocida y con alimentos que tengan algo de grasa propia.',
          'No es la mejor opción para masas líquidas o rebozados muy húmedos, que escurren por la canasta, ni para grandes cantidades en una sola tanda, ni para sopas o guisos. Los resultados también cambian respecto a una freidora de aceite: la textura es distinta, más seca, aunque crujiente. Ajusta tiempos y temperaturas con las recomendaciones del manual y prueba con pequeñas cantidades.',
        ],
      },
      {
        title: 'Antiadherente y cuidado',
        body: [
          'La mayoría de las canastas tienen un recubrimiento antiadherente. Para que dure, no uses utensilios metálicos que lo rayen, no lo limpies con esponjas abrasivas y no lo metas en el lavaplatos si el fabricante no lo permite. Lávalo con agua tibia, jabón suave y una esponja blanda, y sécalo bien antes de guardar.',
          'Si el recubrimiento se descascara, deja de usar esa pieza y consulta con el servicio técnico o la tienda sobre un repuesto. Evita los aerosoles de cocina en la canasta, porque algunos pueden dañar el antiadherente con el tiempo; es mejor un poco de aceite aplicado con pincel.',
          'Limpia con regularidad la resistencia y el interior, donde se acumula grasa, y vacía el fondo de la bandeja. Un equipo limpio huele menos, rinde mejor y es más seguro.',
        ],
      },
      {
        title: 'Espacio, ubicación y compra',
        body: [
          'Mide la meseta antes de comprar y deja espacio libre detrás y a los lados, tal como indique el manual, porque el equipo expulsa aire caliente. No la coloques debajo de gabinetes ni pegada a la pared. Considera también dónde la guardarás si no la dejas a la vista, ya que algunos modelos son voluminosos y pesados.',
          'Compara el mismo modelo en varias tiendas, fijándote en el código exacto, la garantía y las piezas que incluye. La ficha de cada producto en DóndeTa muestra el historial de precio y enlaces para verificar en la tienda. Antes de cerrar, confirma qué cubre la garantía y si hay repuestos, como canastas y bandejas, disponibles localmente.',
        ],
      },
    ],
    faqs: [
      {
        q: '¿Qué tamaño de freidora de aire necesito para una familia de cuatro?',
        a: 'Como referencia general, entre 4 y 6 litros suele alcanzar para el día a día, aunque cocinarás por tandas si preparas porciones grandes. Si quieres cocinar todo de una vez, considera una de mayor capacidad o de estilo horno.',
      },
      {
        q: '¿La freidora de aire gasta mucha electricidad?',
        a: 'Tiene una potencia alta mientras funciona, pero los ciclos suelen ser cortos. El consumo real depende de la potencia del modelo y de cuánto la uses; revisa la ficha técnica y no asumas ahorros sin comprobarlos.',
      },
      {
        q: '¿Puedo lavar la canasta en el lavaplatos?',
        a: 'Depende del modelo. Algunos fabricantes lo permiten y otros no, porque puede dañar el antiadherente. Confirma en el manual y, ante la duda, lávala a mano con una esponja suave.',
      },
    ],
    related: [
      'elegir-microondas',
      'comprar-estufa-cocina',
      'como-leer-ficha-tecnica-electrodomesticos',
      'comprar-electrodomesticos-rd',
    ],
  },
]
