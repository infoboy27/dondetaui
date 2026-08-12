import type { Metadata } from 'next'
import { colors, fonts } from '../../lib/tokens'
import { SITE_URL } from '../../lib/site'

export const metadata: Metadata = {
  title: 'Política de privacidad — DóndeTa',
  description: 'Cómo DóndeTa recopila, usa y protege tus datos.',
}

const CONTACT_EMAIL = 'jonathanmaria@gmail.com'
const LAST_UPDATED = '12 de agosto de 2026'
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
          DóndeTa es una aplicación de comparación de precios de electrodomésticos y productos en tiendas de
          República Dominicana, disponible en <strong>{SITE_HOSTNAME}</strong> y como aplicación para Android.
          Esta política aplica a ambas.
        </p>
      </Section>

      <Section title="Qué información recopilamos">
        <p style={{ marginBottom: 12 }}>
          <strong>Cuenta:</strong> si te registras, guardamos tu correo electrónico, nombre y una contraseña
          encriptada (nunca en texto plano). El teléfono es opcional, solo si activas alertas por SMS.
        </p>
        <p style={{ marginBottom: 12 }}>
          <strong>Uso de la app:</strong> tus productos favoritos, alertas de precio que configuras, tu historial
          de búsqueda dentro de la app y las reseñas que escribas.
        </p>
        <p style={{ marginBottom: 12 }}>
          <strong>Ubicación:</strong> solo si usas "Tiendas cercanas" y das permiso explícito al sistema operativo.
          Se usa en el momento para calcular distancias a sucursales — no se guarda un historial de tu ubicación.
        </p>
        <p>
          <strong>Notificaciones push:</strong> si aceptas notificaciones en la app Android, guardamos un token
          de dispositivo (emitido por Expo) para poder enviarte avisos de bajada de precio.
        </p>
      </Section>

      <Section title="Cómo usamos tu información">
        <p>
          Únicamente para operar el servicio: mostrarte comparaciones de precio, avisarte cuando un producto que
          sigues baja de precio (por correo, SMS o notificación push, según lo que actives), y mostrarte tiendas
          cercanas cuando lo pidas. No vendemos ni compartimos tus datos con terceros para publicidad.
        </p>
      </Section>

      <Section title="Con quién compartimos datos">
        <p>
          Usamos proveedores externos únicamente para operar funciones que activas: Resend para enviar correos de
          alerta, Twilio para SMS, y Expo para notificaciones push en Android. Estos proveedores procesan los datos
          mínimos necesarios (tu correo, teléfono o token de dispositivo) solo para entregar esas notificaciones.
        </p>
      </Section>

      <Section title="Tus derechos">
        <p>
          Puedes eliminar tus favoritos, alertas y reseñas desde la app. Para solicitar la eliminación completa de
          tu cuenta y datos asociados, o para cualquier pregunta sobre esta política, escríbenos a{' '}
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
