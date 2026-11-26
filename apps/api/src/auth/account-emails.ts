// Transactional emails for shopper accounts, in Spanish, with a plain-text
// body plus a small branded HTML version. Pure functions (no Nest) so they
// are unit-tested in the root suite.

export interface EmailContent {
  subject: string
  text: string
  html: string
}

const GREEN = '#00B894'
const NAVY = '#0F1D2D'
const MUTED = '#5B6B7C'
const SITE = 'https://dondeta.com.do'
// Hosted from the web app's public/ folder (mail clients block inline images).
const LOGO_URL = `${SITE}/email/dondeta-logo.png`

function escape(value: string): string {
  return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!)
}

function greeting(name: string | null): string {
  const first = name?.trim().split(/\s+/)[0]
  return first ? `Hola, ${first}:` : 'Hola:'
}

// Shared layout: wordmark, body paragraphs, optional big code, footer.
function layout(opts: {
  name: string | null
  paragraphs: string[]
  code?: string
  after?: string[]
  cta?: { label: string; url: string }
  // HTML-only deal card that replaces the first paragraph (the text body keeps it).
  highlight?: { badge: string; title: string; value: string; oldValue?: string; savings?: string; imageUrl?: string }
  // Product rows (digest emails), after the paragraphs.
  deals?: DealRow[]
  preheader?: string
  footer?: string
  // Plain link under the footer, e.g. one-click unsubscribe.
  footerLink?: { label: string; url: string }
}): { text: string; html: string } {
  const lines = [greeting(opts.name), '', ...opts.paragraphs]
  if (opts.code) lines.push('', `Tu código: ${opts.code}`, '')
  if (opts.deals?.length) {
    lines.push('')
    for (const d of opts.deals) lines.push(`• ${d.name} — ${d.price}${d.store ? ` en ${d.store}` : ''} (${d.note})`, `  ${d.url}`)
  }
  if (opts.after) lines.push(...opts.after)
  if (opts.cta) lines.push('', `${opts.cta.label}: ${opts.cta.url}`)
  lines.push('', '— El equipo de DóndeTa', 'https://dondeta.com.do')
  // Why you get it / how to stop it, also for plain-text readers.
  if (opts.footer) lines.push('', opts.footer)
  if (opts.footerLink) lines.push('', `${opts.footerLink.label}: ${opts.footerLink.url}`)
  const text = lines.join('\n')

  const p = (value: string) => `<p style="margin:0 0 14px;font-size:15px;line-height:22px;color:${NAVY}">${escape(value)}</p>`
  const code = opts.code
    ? `<div style="margin:22px 0;text-align:center"><span style="display:inline-block;font-size:32px;letter-spacing:10px;font-weight:800;color:${NAVY};background:#E6F7F3;border-radius:12px;padding:14px 22px;font-family:ui-rounded,'SF Pro Rounded',Arial,sans-serif">${escape(opts.code)}</span></div>`
    : ''
  const cta = opts.cta
    ? `<div style="margin:22px 0 4px;text-align:center"><a href="${escape(opts.cta.url)}" style="display:inline-block;background:${GREEN};color:${NAVY};font-weight:700;font-size:15px;text-decoration:none;border-radius:999px;padding:13px 28px">${escape(opts.cta.label)}</a></div>`
    : ''
  const highlight = opts.highlight
    ? `<div style="margin:0 0 18px;border:1px solid #CDEFE7;background:#F2FBF8;border-radius:14px;padding:18px 20px">
<span style="display:inline-block;background:${GREEN};color:${NAVY};font-size:11px;font-weight:800;letter-spacing:.6px;text-transform:uppercase;border-radius:999px;padding:4px 10px">${escape(opts.highlight.badge)}</span>
${opts.highlight.imageUrl ? `<div style="margin:14px 0 0;text-align:center;background:#ffffff;border-radius:10px;padding:10px"><img src="${escape(opts.highlight.imageUrl)}" alt="${escape(opts.highlight.title)}" height="150" style="display:inline-block;border:0;max-width:100%;height:150px;width:auto;object-fit:contain"></div>` : ''}
<div style="margin:12px 0 6px;font-size:17px;line-height:23px;font-weight:700;color:${NAVY}">${escape(opts.highlight.title)}</div>
<div style="font-size:34px;line-height:40px;font-weight:800;color:${NAVY}">${escape(opts.highlight.value)}${opts.highlight.oldValue ? ` <span style="font-size:16px;font-weight:500;color:${MUTED};text-decoration:line-through">${escape(opts.highlight.oldValue)}</span>` : ''}</div>
${opts.highlight.savings ? `<div style="margin-top:4px;font-size:14px;font-weight:700;color:#007A63">${escape(opts.highlight.savings)}</div>` : ''}
</div>`
    : ''
  const deals = (opts.deals ?? []).map(d => {
    const image = d.imageUrl && /^https:\/\//.test(d.imageUrl)
      ? `<td width="64" style="padding:10px 12px 10px 0;vertical-align:middle"><img src="${escape(d.imageUrl)}" alt="" width="56" height="56" style="display:block;border:0;width:56px;height:56px;object-fit:contain;background:#ffffff;border-radius:8px"></td>`
      : ''
    return `<a href="${escape(d.url)}" style="display:block;text-decoration:none;border:1px solid #E8EDF2;border-radius:12px;margin:0 0 10px;padding:0 12px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${image}<td style="padding:10px 0;vertical-align:middle">
<div style="font-size:14px;line-height:19px;font-weight:600;color:${NAVY}">${escape(d.name)}</div>
<div style="font-size:12px;line-height:17px;color:#007A63;font-weight:700">${escape(d.note)}</div></td>
<td style="padding:10px 0 10px 10px;text-align:right;vertical-align:middle;white-space:nowrap"><div style="font-size:15px;font-weight:800;color:${NAVY}">${escape(d.price)}</div><div style="font-size:12px;color:${MUTED}">${escape(d.store)}</div></td></tr></table></a>`
  }).join('\n')
  const paragraphs = opts.highlight ? opts.paragraphs.slice(1) : opts.paragraphs
  const preheader = opts.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${escape(opts.preheader)}</div>`
    : ''
  const html = `<!doctype html><html lang="es"><body style="margin:0;background:#F2F4F7;font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif">
${preheader}<div style="max-width:480px;margin:0 auto;padding:28px 16px">
<a href="${SITE}" style="display:inline-block;margin-bottom:18px"><img src="${LOGO_URL}" width="168" alt="DóndeTa" style="display:block;border:0;height:auto;font-size:22px;font-weight:800;color:${NAVY}"></a>
<div style="background:#ffffff;border-radius:16px;padding:24px">
${p(greeting(opts.name))}
${highlight}${paragraphs.map(p).join('\n')}
${code}
${deals}
${(opts.after ?? []).map(p).join('\n')}
${cta}
</div>
<p style="font-size:12px;line-height:18px;color:${MUTED};margin:16px 4px 0">${escape(opts.footer ?? 'Recibes este correo porque tienes una cuenta en DóndeTa. Si no fuiste tú, ignóralo o escríbenos respondiendo a este mensaje.')}</p>
${opts.footerLink ? `<p style="font-size:12px;line-height:18px;margin:6px 4px 0"><a href="${escape(opts.footerLink.url)}" style="color:${MUTED}">${escape(opts.footerLink.label)}</a></p>` : ''}
</div></body></html>`
  return { text, html }
}

export interface DealRow {
  name: string
  price: string
  store: string
  /** Short verdict, e.g. "12 % bajo su mínimo de 30 días". */
  note: string
  url: string
  imageUrl?: string | null
}

const CODE_NOTE = 'El código vence en 10 minutos. Si no lo pediste, puedes ignorar este correo.'

export function welcomeEmail(name: string | null, code: string): EmailContent {
  return {
    subject: `${code} es tu código para confirmar tu correo en DóndeTa`,
    ...layout({
      name,
      paragraphs: [
        '¡Bienvenido a DóndeTa! Desde ahora puedes guardar productos en todos tus dispositivos y recibir alertas cuando un precio baje.',
        'Para confirmar que este correo es tuyo, escribe este código en la app:',
      ],
      code,
      after: [CODE_NOTE],
    }),
  }
}

export function verifyEmailEmail(name: string | null, code: string): EmailContent {
  return {
    subject: `${code} es tu código para confirmar tu correo en DóndeTa`,
    ...layout({ name, paragraphs: ['Escribe este código en DóndeTa para confirmar tu correo:'], code, after: [CODE_NOTE] }),
  }
}

export function resetPasswordEmail(name: string | null, code: string): EmailContent {
  return {
    subject: `${code} es tu código para cambiar la contraseña de DóndeTa`,
    ...layout({
      name,
      paragraphs: ['Recibimos una solicitud para cambiar la contraseña de tu cuenta. Escribe este código en la app para elegir una nueva:'],
      code,
      after: [CODE_NOTE, 'Tu contraseña actual sigue funcionando hasta que la cambies.'],
    }),
  }
}

export function loginCodeEmail(name: string | null, code: string): EmailContent {
  return {
    subject: `${code} es tu código para entrar a DóndeTa`,
    ...layout({
      name,
      paragraphs: ['Alguien (probablemente tú) está iniciando sesión en tu cuenta. Para continuar, escribe este código:'],
      code,
      after: ['El código vence en 10 minutos. Si no fuiste tú, cambia tu contraseña: tu cuenta sigue protegida porque nadie puede entrar sin este código.'],
    }),
  }
}

export function passwordChangedEmail(name: string | null): EmailContent {
  return {
    subject: 'Cambiaste la contraseña de DóndeTa',
    ...layout({
      name,
      paragraphs: [
        'La contraseña de tu cuenta se acaba de cambiar y cerramos la sesión en tus otros dispositivos.',
        'Si no fuiste tú, usa "¿Olvidaste tu contraseña?" en la app para recuperar tu cuenta.',
      ],
    }),
  }
}

export function mfaChangedEmail(name: string | null, method: 'email' | 'totp' | null): EmailContent {
  const enabled = method !== null
  const how = method === 'totp' ? 'un código de tu app autenticadora' : 'un código que te enviamos por correo'
  return {
    subject: enabled ? 'Activaste la verificación en dos pasos en DóndeTa' : 'Desactivaste la verificación en dos pasos en DóndeTa',
    ...layout({
      name,
      paragraphs: enabled
        ? [`Desde ahora, al iniciar sesión te pediremos ${how} además de tu contraseña.`]
        : ['Tu cuenta ya no pide un segundo paso al iniciar sesión. Puedes volver a activarlo cuando quieras en Perfil › Seguridad.'],
      after: ['Si no fuiste tú, cambia tu contraseña de inmediato.'],
    }),
  }
}

export function accountDeletedEmail(name: string | null): EmailContent {
  return {
    subject: 'Tu cuenta de DóndeTa fue eliminada',
    ...layout({
      name,
      paragraphs: [
        'Eliminamos tu cuenta y todos sus datos: favoritos, alertas de precio, reseñas e historial de búsqueda.',
        'Puedes seguir usando DóndeTa sin cuenta, o crear una nueva cuando quieras. Gracias por haber sido parte.',
      ],
    }),
  }
}

export interface PriceDropDetails {
  previousPrice?: string
  savings?: string
  imageUrl?: string | null
  // Path under the site, e.g. /product/nevera-samsung.
  path?: string | null
  // Also the lowest price in 90 days (the lowest_price_90d alert, merged in).
  lowest90d?: boolean
}

export function priceDropEmail(productName: string, price: string, details: PriceDropDetails = {}): EmailContent {
  // Mail clients only load absolute https images.
  const imageUrl = details.imageUrl && /^https:\/\//.test(details.imageUrl) ? details.imageUrl : undefined
  const url = details.path?.startsWith('/') ? `${SITE}${details.path}` : SITE
  const was = details.previousPrice ? ` (antes ${details.previousPrice})` : ''
  const lowest = details.lowest90d === true
  return {
    subject: lowest ? `Precio más bajo en 90 días: ${productName} ahora ${price}` : `Bajó de precio: ${productName} ahora ${price}`,
    ...layout({
      name: null,
      paragraphs: [
        lowest ? `${productName} ahora cuesta ${price}${was}: es su precio más bajo de los últimos 90 días.` : `${productName} ahora cuesta ${price}${was}.`,
        'Lo guardaste en DóndeTa, así que te avisamos apenas bajó. Los precios pueden cambiar en cualquier momento, no te quedes sin el tuyo.',
      ],
      highlight: { badge: lowest ? 'Más bajo en 90 días' : 'Bajó de precio', title: productName, value: price, oldValue: details.previousPrice, savings: details.savings, imageUrl },
      preheader: `${productName} ahora cuesta ${price}. Míralo antes de que vuelva a subir.`,
      cta: { label: 'Ver la oferta', url },
      footer: 'Recibes este correo porque guardaste este producto en DóndeTa y activaste las alertas de precio. Puedes quitarlo de tus favoritos cuando quieras.',
    }),
  }
}

// "Las ofertas reales de Black Friday": products that today cost clearly less
// than at any point in the previous 30 days in that store (price-check
// 'lowest'), sent to shoppers who opted in at /cuenta/black-friday.
export function dealDigestEmail(opts: { name: string | null; deals: DealRow[]; pageUrl: string; unsubscribeUrl: string; eventName?: string }): EmailContent {
  const eventName = opts.eventName ?? 'Black Friday'
  const count = opts.deals.length
  const lead = count === 1 ? 'Hoy encontramos 1 oferta real' : `Hoy encontramos ${count} ofertas reales`
  return {
    subject: `${eventName}: ${count === 1 ? '1 oferta real' : `${count} ofertas reales`} de hoy (comparadas con 30 días)`,
    ...layout({
      name: opts.name,
      paragraphs: [
        `${lead}: productos que hoy cuestan menos que en cualquier día de los últimos 30 días en esa misma tienda. Nada de rebajas infladas.`,
      ],
      deals: opts.deals,
      after: ['Los precios cambian varias veces al día: confirma el precio final, el envío y la garantía con la tienda antes de comprar.'],
      cta: { label: `Ver todas las ofertas de ${eventName}`, url: opts.pageUrl },
      preheader: `${lead}, verificadas contra su historial de precios.`,
      footer: `Recibes este correo porque pediste las ofertas reales de ${eventName} en DóndeTa. Es como mucho un correo al día y solo durante la temporada de ofertas.`,
      footerLink: { label: 'Dejar de recibir estos correos', url: opts.unsubscribeUrl },
    }),
  }
}

// ---------------------------------------------------------------- watch notifications
// Each kind can be turned off on its own (Perfil › Notificaciones in the app);
// the footer says so. Promotional ones (weekly summary, Black Friday real
// offers) are opt-in only.

const PREFS_HINT = 'Puedes apagar este aviso cuando quieras en la app: Perfil › Notificaciones.'

function httpsImage(url: string | null | undefined): string | undefined {
  return url && /^https:\/\//.test(url) ? url : undefined
}

export interface WatchProduct {
  name: string
  price: string
  imageUrl?: string | null
  /** Absolute link to the product (the stack's own site). */
  url: string
}

export function backInStockEmail(product: WatchProduct & { store: string | null }): EmailContent {
  const where = product.store ? ` en ${product.store}` : ''
  return {
    subject: `Volvió a estar disponible: ${product.name}`,
    ...layout({
      name: null,
      paragraphs: [
        `${product.name} ya está disponible otra vez${where}, a ${product.price}.`,
        'Lo guardaste en DóndeTa cuando estaba agotado. Las existencias pueden volver a acabarse.',
      ],
      highlight: { badge: 'Disponible otra vez', title: product.name, value: product.price, imageUrl: httpsImage(product.imageUrl) },
      preheader: `${product.name} volvió a estar disponible${where}.`,
      cta: { label: 'Ver la oferta', url: product.url },
      footer: `Recibes este correo porque guardaste este producto en DóndeTa. ${PREFS_HINT}`,
    }),
  }
}

export function lowestPrice90dEmail(product: WatchProduct): EmailContent {
  return {
    subject: `Precio más bajo en 90 días: ${product.name} ahora ${product.price}`,
    ...layout({
      name: null,
      paragraphs: [
        `${product.name} cuesta hoy ${product.price}: lo más barato que lo hemos visto en los últimos 90 días.`,
        'Lo comparamos con cada día de los últimos 3 meses en todas las tiendas que lo venden.',
      ],
      highlight: { badge: 'Más bajo en 90 días', title: product.name, value: product.price, imageUrl: httpsImage(product.imageUrl) },
      preheader: `${product.name}: su precio más bajo en 3 meses.`,
      cta: { label: 'Ver la oferta', url: product.url },
      footer: `Recibes este correo porque guardaste este producto en DóndeTa. ${PREFS_HINT}`,
    }),
  }
}

export function cardDiscountEmail(opts: { store: string; phrase: string; endsOn: string; products: DealRow[] }): EmailContent {
  return {
    subject: `Nuevo descuento con tarjeta en ${opts.store}: ${opts.phrase}`,
    ...layout({
      name: null,
      paragraphs: [
        `${opts.store} tiene un descuento nuevo: ${opts.phrase}, hasta el ${opts.endsOn}. Aplica a estos productos que guardaste:`,
      ],
      deals: opts.products,
      after: ['Revisa las condiciones con el banco y la tienda (tope, compra mínima, días) antes de comprar.'],
      footer: `Recibes este correo porque guardaste productos de ${opts.store} en DóndeTa. ${PREFS_HINT}`,
    }),
  }
}

export function savedSearchEmail(opts: { query: string; maxPrice: string | null; products: DealRow[] }): EmailContent {
  const limit = opts.maxPrice ? ` por ${opts.maxPrice} o menos` : ''
  const count = opts.products.length
  return {
    subject: `Novedades en tu búsqueda “${opts.query}”`,
    ...layout({
      name: null,
      paragraphs: [
        count === 1
          ? `Encontramos 1 producto nuevo o más barato para “${opts.query}”${limit}:`
          : `Encontramos ${count} productos nuevos o más baratos para “${opts.query}”${limit}:`,
      ],
      deals: opts.products,
      footer: `Recibes este correo porque guardaste esta búsqueda en DóndeTa. Puedes borrarla, o apagar estos avisos, en la app: Perfil › Notificaciones.`,
    }),
  }
}

export function weeklyDigestEmail(opts: { name: string | null; summary: string; products: DealRow[]; pageUrl: string }): EmailContent {
  return {
    subject: `Tu resumen de la semana: ${opts.summary}`,
    ...layout({
      name: opts.name,
      paragraphs: [`Esta semana, de lo que guardaste en DóndeTa, ${opts.summary}. Cada precio comparado con el de hace 7 días:`],
      deals: opts.products,
      after: ['Los precios cambian varias veces al día: confirma el precio final con la tienda antes de comprar.'],
      preheader: `De tus guardados, ${opts.summary}.`,
      cta: { label: 'Ver mis guardados', url: opts.pageUrl },
      footer: `Recibes este correo porque activaste el resumen semanal en DóndeTa (uno por semana). ${PREFS_HINT}`,
    }),
  }
}

export function dealRealEmail(opts: { seasonName: string; products: DealRow[] }): EmailContent {
  const count = opts.products.length
  return {
    subject: `${opts.seasonName}: ${count === 1 ? '1 oferta real' : `${count} ofertas reales`} en lo que guardaste`,
    ...layout({
      name: null,
      paragraphs: [
        `Estas ofertas son reales: ${count === 1 ? 'este producto que guardaste cuesta' : 'estos productos que guardaste cuestan'} hoy menos que su precio promedio de los últimos 30 días.`,
      ],
      deals: opts.products,
      after: ['Confirma el precio final, el envío y la garantía con la tienda antes de comprar.'],
      footer: `Recibes este correo porque activaste las ofertas de temporada en DóndeTa. ${PREFS_HINT}`,
    }),
  }
}
