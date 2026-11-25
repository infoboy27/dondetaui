import type { Metadata } from 'next'
import { colors, fonts } from '../../lib/tokens'

export const metadata: Metadata = {
  title: 'Eliminar tu cuenta — DóndeTa',
  description: 'Cómo borrar tu cuenta de DóndeTa y qué datos se eliminan.',
}

// Linked from the Google Play listing (account deletion URL). Keep the steps,
// the deleted/kept data and the retention period accurate: deleting a user
// cascades to every user-owned table (apps/api/migrations) and the daily DB
// backups are kept BACKUP_RETENTION_DAYS (deploy/backup.sh, 14 by default).

const CONTACT_EMAIL = 'jonathanmaria@gmail.com'

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

const list = { paddingLeft: 20, margin: 0 }

export default function DeleteAccountPage() {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 80px' }}>
      <p style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 15, color: colors.primary, marginBottom: 8 }}>
        DóndeTa
      </p>
      <h1 style={{ fontFamily: fonts.display, fontSize: 32, fontWeight: 700, color: colors.navy, marginBottom: 24 }}>
        Eliminar tu cuenta de DóndeTa
      </h1>

      <Section title="Desde la app (lo más rápido)">
        <ol style={list}>
          <li>Abre la app DóndeTa e inicia sesión.</li>
          <li>Ve a <strong>Perfil &gt; Seguridad &gt; Eliminar cuenta</strong>.</li>
          <li>Escribe tu contraseña y confirma.</li>
        </ol>
        <p style={{ marginTop: 12 }}>
          La cuenta se borra en el momento y te enviamos un correo de confirmación.
        </p>
      </Section>

      <Section title="Sin la app">
        <p>
          Escríbenos a{' '}
          <a href={`mailto:${CONTACT_EMAIL}?subject=Eliminar%20mi%20cuenta%20de%20DóndeTa`} style={{ color: colors.primary }}>
            {CONTACT_EMAIL}
          </a>{' '}
          desde el correo con el que te registraste, con el asunto &quot;Eliminar mi cuenta de DóndeTa&quot;. La
          borramos en un plazo máximo de 7 días y te confirmamos por correo.
        </p>
      </Section>

      <Section title="Qué se borra">
        <ul style={list}>
          <li>Tu cuenta: correo, nombre, teléfono (si lo diste) y contraseña encriptada.</li>
          <li>Tus favoritos, alertas de precio y búsquedas guardadas.</li>
          <li>Tus reseñas y los reportes o bloqueos de reseñas que hiciste.</li>
          <li>Tus suscripciones a correos y los tokens de notificaciones push de tus dispositivos.</li>
          <li>Tus sesiones abiertas y la configuración de verificación en 2 pasos.</li>
        </ul>
      </Section>

      <Section title="Qué se conserva y por cuánto tiempo">
        <ul style={list}>
          <li>
            Las copias de seguridad cifradas de la base de datos pueden contener tus datos hasta <strong>14 días</strong>;
            después se eliminan automáticamente.
          </li>
          <li>
            Los precios, productos y tiendas no son datos tuyos y siguen en DóndeTa.
          </li>
          <li>
            Los datos que Google AdMob recopila para los anuncios los gestiona Google según su propia política; puedes
            restablecer o eliminar tu ID de publicidad en los ajustes del teléfono.
          </li>
        </ul>
      </Section>

      <p style={{ fontSize: 14, color: colors.navy200 }}>
        Más detalles en la <a href="/privacy" style={{ color: colors.primary }}>política de privacidad</a>.
      </p>
    </main>
  )
}
