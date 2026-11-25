import type { Metadata } from 'next'
import { colors, fonts } from '../../lib/tokens'
import { AMAZON, COUNTRY, SITE_URL } from '../../lib/site'
import { AMAZON_DISCLOSURE } from '../../lib/amazon'

export const metadata: Metadata = {
  title: 'Política de privacidad — DóndeTa',
  description: 'Cómo DóndeTa recopila, usa y protege tus datos.',
}

// Otherwise this page pre-renders once at `next build` time -- before
// SITE_URL (a docker-compose runtime env var) exists -- permanently baking
// in site.ts's fallback domain. Same root cause as robots.ts.
export const dynamic = 'force-dynamic'

const CONTACT_EMAIL = 'jonathanmaria@gmail.com'
const LAST_UPDATED = '25 de noviembre de 2026'
const SITE_HOSTNAME = new URL(SITE_URL).hostname

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 32 }}>
      <h2 style={{ fontFamily: fonts.display, fontSize: 20, fontWeight: 600, color: colors.navy, marginBottom: 8 }}>
        {title}
      </h2>
      <div style={{ fontSize: 15, lineHeight: 1.7, color: colors.navy400 }}>{children}</div>
    </section>
  )
}

export default function PrivacyPolicyPage() {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 80px' }}>
      <p style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 15, color: colors.primary, marginBottom: 8 }}>
        DóndeTa
      </p>
      <h1 style={{ fontFamily: fonts.display, fontSize: 32, fontWeight: 700, color: colors.navy, marginBottom: 4 }}>
        Política de privacidad
      </h1>
      <p style={{ fontSize: 14, color: colors.navy200, marginBottom: 40 }}>Última actualización: {LAST_UPDATED}</p>

      <Section title="Qué es DóndeTa">
        <p>
          DóndeTa es un comparador de precios de electrodomésticos y productos en tiendas de {COUNTRY.name}, disponible
          en <strong>{SITE_HOSTNAME}</strong> y como aplicación para iPhone (App Store) y Android (Google Play). La app
          también compara precios en Colombia y México. Esta política aplica al sitio web y a las apps.
        </p>
      </Section>

      <Section title="Qué información recopilamos">
        <p style={{ marginBottom: 12 }}>
          <strong>Cuenta (opcional):</strong> buscar, comparar y escanear funcionan sin cuenta. Si te registras,
          guardamos tu correo electrónico, nombre y una contraseña encriptada (nunca en texto plano). El teléfono es
          opcional, solo si activas alertas por SMS.
        </p>
        <p style={{ marginBottom: 12 }}>
          <strong>Uso de la app:</strong> tus productos favoritos, alertas de precio que configuras, tu historial
          de búsqueda dentro de la app y las reseñas que escribas.
        </p>
        <p style={{ marginBottom: 12 }}>
          <strong>Ubicación:</strong> solo si usas "Tiendas cercanas" y das permiso explícito al sistema operativo.
          Se usa en el momento para calcular distancias a sucursales — no se guarda un historial de tu ubicación.
        </p>
        <p style={{ marginBottom: 12 }}>
          <strong>Cámara:</strong> solo si usas el escáner y das permiso. Se usa para leer el código de barras del
          producto; las imágenes no se guardan ni se envían a nuestros servidores, solo el número del código.
        </p>
        <p style={{ marginBottom: 12 }}>
          <strong>Notificaciones push:</strong> si aceptas notificaciones en la app, guardamos un token de
          dispositivo (emitido por Expo) para poder enviarte avisos de bajada de precio.
        </p>
        <p>
          <strong>Publicidad:</strong> las apps muestran anuncios de Google AdMob, que nos permiten mantener DóndeTa
          gratis. Google puede recopilar el identificador de publicidad del dispositivo, tu dirección IP, una ubicación
          aproximada derivada de ella y datos de interacción con los anuncios, según se explica más abajo.
        </p>
      </Section>

      <Section title="Cómo usamos tu información">
        <p>
          Para operar el servicio: mostrarte comparaciones de precio, avisarte cuando un producto que sigues baja de
          precio (por correo, SMS o notificación push, según lo que actives), mostrarte tiendas cercanas cuando lo
          pidas y mostrar anuncios. No vendemos tus datos personales (correo, nombre, teléfono, favoritos, alertas o
          búsquedas) ni los compartimos con anunciantes.
        </p>
      </Section>

      <Section title="Anuncios y rastreo">
        <p style={{ marginBottom: 12 }}>
          Los anuncios de las apps los sirve Google AdMob. Google puede usar el identificador de publicidad del
          dispositivo (IDFA en iPhone, ID de publicidad en Android) para mostrar anuncios personalizados y medir su
          rendimiento, combinándolo con datos de otras apps y sitios. Eso es "rastreo" según Apple.
        </p>
        <p style={{ marginBottom: 12 }}>
          <strong>En iPhone</strong>, la app te pregunta si permites el rastreo antes de cargar cualquier anuncio. Si
          no lo permites, Google no recibe el IDFA y los anuncios no se personalizan con él. Puedes cambiarlo en
          Ajustes &gt; Privacidad y seguridad &gt; Rastreo.
        </p>
        <p style={{ marginBottom: 12 }}>
          <strong>En Android</strong>, puedes restablecer o eliminar tu ID de publicidad en Ajustes &gt; Privacidad
          &gt; Anuncios (o Ajustes &gt; Google &gt; Anuncios).
        </p>
        <p style={{ marginBottom: 12 }}>
          Donde la ley lo exige (por ejemplo, en el Espacio Económico Europeo y el Reino Unido), la app muestra el
          formulario de consentimiento de Google antes de mostrar anuncios, y puedes elegir anuncios no
          personalizados.
        </p>
        <p>
          Más información sobre cómo usa Google estos datos:{' '}
          <a href="https://policies.google.com/technologies/partner-sites" style={{ color: colors.primary }}>
            policies.google.com/technologies/partner-sites
          </a>
          . El sitio web usa Google Analytics para medir visitas y puede mostrar anuncios de Google AdSense, con
          cookies de Google.
        </p>
      </Section>

      <Section title="Con quién compartimos datos">
        <p>
          Además de Google (anuncios y analítica, arriba), usamos proveedores externos para operar funciones que
          activas: Resend para enviar correos de alerta, Twilio para SMS, y Expo para notificaciones push. Estos
          proveedores procesan los datos mínimos necesarios (tu correo, teléfono o token de dispositivo) solo para
          entregar esas notificaciones. Los datos viajan cifrados (HTTPS).
        </p>
      </Section>

      <Section title="Enlaces de afiliado">
        <p>
          Algunos enlaces hacia tiendas son de afiliado (por ejemplo, Eneba{AMAZON ? ' y Amazon' : ''}). Si haces clic, esa
          tienda puede guardar una cookie en tu navegador para atribuirnos la compra y pagarnos una comisión, sin costo
          adicional para ti. DóndeTa no recibe tus datos de compra, y las comisiones no cambian el orden de los precios.
          {AMAZON && ` ${AMAZON_DISCLOSURE}`}
        </p>
      </Section>

      <Section title="Tus derechos">
        <p>
          Puedes eliminar tus favoritos, alertas y reseñas desde la app, y borrar tu cuenta con todos sus datos en
          Perfil &gt; Seguridad &gt; Eliminar cuenta. También puedes pedir la eliminación, o hacer cualquier pregunta
          sobre esta política, escribiéndonos a{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: colors.primary }}>
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </Section>

      <Section title="Menores de edad">
        <p>DóndeTa no está dirigida a menores de 13 años y no recopila datos a sabiendas de esa población.</p>
      </Section>

      <Section title="Cambios a esta política">
        <p>
          Si esta política cambia de forma significativa, actualizaremos la fecha en la parte superior de esta
          página.
        </p>
      </Section>
    </main>
  )
}
