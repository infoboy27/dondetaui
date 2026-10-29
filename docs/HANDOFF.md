# DóndeTa — Retomar el trabajo en otra máquina

Punto de partida para seguir desde cualquier computadora (Windows, Mac o Linux).
Si eres Claude Code: lee este archivo completo antes de proponer trabajo nuevo y
actualiza la sección **Estado actual** al cerrar algo importante.

## 1. Clonar y preparar

Requisitos: Git + **git-lfs**, Node 22+, pnpm 10.34.3 (lo activa el script con
corepack si falta). Con [mise](https://mise.jdx.dev) basta `mise install` (`.mise.toml`).

```bash
git lfs install                       # una vez por máquina, ANTES de clonar
git clone https://github.com/infoboy27/dondetaui.git
cd dondetaui
bash scripts/setup.sh                 # o: pnpm setup  (--no-mobile, --e2e)
```

El script instala las 4 apps (cada una tiene su propio lockfile, no hay
workspace), crea los `.env` locales a partir de los `.env.example` sin pisar
los que existan, y corre `pnpm check`.

En Mac, para iOS: Xcode (App Store) + `xcode-select --install`, y CocoaPods lo
gestiona Expo. Ver [MOBILE.md](MOBILE.md).

## 2. Trabajar en local

| Qué | Comando | Notas |
| --- | --- | --- |
| Web con datos de prueba | `pnpm dev` | http://localhost:8443, `src/data/mock.ts` |
| Web con datos reales | `pnpm dev:prod-data` | proxy `/api` → dondeta.com.do; iniciar sesión aquí usa cuentas reales |
| Checks antes de subir | `pnpm check` | typecheck + build + vitest (lo mismo que CI) |
| E2E | `pnpm test:e2e` | Playwright, requiere `pnpm setup --e2e` |
| API local | `cd apps/api && pnpm start:dev` | necesita Postgres/Redis: `docker compose up -d postgres redis` |
| Stack completo | `docker compose up -d` | ver [DEPLOY_DEV.md](../DEPLOY_DEV.md) |
| App móvil | `cd apps/mobile && pnpm start` | ver [MOBILE.md](MOBILE.md) |

Gotchas conocidos:

- Windows: los archivos se guardan con CRLF en el disco y LF en git
  (`core.autocrlf`). En Git Bash, `MSYS_NO_PATHCONV=1` al pasar rutas como `/api`
  en variables de entorno.
- Los tests de la raíz (`pnpm test`) corren en CI **antes** de instalar
  `apps/api`: un test de `apps/api` que importe Nest u otra dependencia de la
  API rompe el deploy. Lógica testeable va en módulos puros.
- `public/` y `src/assets/` NO van por LFS (el server no tiene git-lfs); el
  resto de imágenes sí.

## 3. Deploy

- **Push a `main` = producción.** GitHub Actions (`deploy.yml`) corre las
  verificaciones y luego entra por SSH al server (`163.245.207.38`, puerto 1600)
  y ejecuta `deploy/cd/dondeta-deploy.sh deploy <sha>` (health check + rollback).
- Si cambia `deploy/cd/dondeta-deploy.sh`, copiarlo a mano en el server:
  `cp ~/dondeta/deploy/cd/dondeta-deploy.sh ~/dondeta-deploy/dondeta-deploy.sh`.
- Stacks: `~/dondeta` (RD, dondeta.com.do), `~/dondeta-co` (co.dondeta.com.do), `~/dondeta-mx` (mx.dondeta.com.do) y `~/dondeta-us` (us.dondeta.com.do, catálogo Best Buy; falta `BESTBUY_API_KEY` en su `.env` y la ruta en Traefik). Los subdominios resuelven por el comodín `*.dondeta.com.do`; las rutas están en `~/loadbalancer/dynamic/dondeta-countries.yml`. La app móvil elige el país por la región del teléfono (selector en Perfil); la web enlaza entre países y sugiere el de la lengua del navegador, sin redirigir. Los sitios no dominicanos salen con `noindex` hasta `COUNTRY_INDEXABLE=1`.
- Uptime externo: `uptime.yml` cada 5 min → Discord.

## 4. Dónde viven los secretos (nunca en el repo)

| Secreto | Dónde |
| --- | --- |
| `.env` de producción (DB, JWT, IG token, GA4, Discord, Resend…) | server, `~/dondeta/.env` (y `-co`, `-mx`) |
| `DEPLOY_SSH_KEY`, `DISCORD_WEBHOOK_ALERTS` | GitHub → Settings → Secrets → Actions |
| Llave SSH al server | `~/.ssh` de cada máquina (copiarla o autorizar una nueva en el server) |
| Firma Android / certificados iOS | EAS (cuenta Expo `jfmcss`), se bajan solos al compilar |
| Google Analytics | cuenta jmservicedo@gmail.com, propiedad 549692638 |

En una máquina nueva: `ssh -p 1600 ubuntu@163.245.207.38` debe funcionar antes
de hacer tareas de servidor, y `npx eas login` antes de compilar la app.

## 5. Estado actual (2026-10-12)

**En producción** (dondeta.com.do, más los stacks CO y MX):

- Comparador: ~1,600 productos de 5 tiendas en RD, cruce entre tiendas por modelo, historial y bajas de precio.
- Páginas SEO en `apps/web-seo`: `/precios`, `/comparaciones`, `/bajas-de-precio` y `/black-friday`.
- **Gaming con Eneba** (afiliado `af_id=dondeta`, código `DONDETA` para un 5 % de descuento, cookie de 30 días):
  - qué se vende: recargas, Game Pass y 17 juegos de PC, de `apps/api/src/ingestion/eneba.*`;
  - dónde aparece: secciones con filtros rápidos y el sello "En alianza con Eneba";
  - qué se excluye: Gaming no entra en "Bajaron de precio" ni en el piloto de Instagram.
- **Admin (`/admin`)**, con 2FA:
  - métricas: GA4 y clics de salida;
  - propuestas PDF para tiendas;
  - Instagram: publicación de productos, publicación propia (imágenes) y el piloto automático (Reels lun/mié/vie y carrusel Top 5 los domingos);
  - **Campañas**: tráfico y clics a tiendas por `utm_campaign`, más un generador de enlaces para las promociones pagadas.
  - **Tarjetas** (`/admin/tarjetas`): descuentos con tarjeta por tienda (banco, %, tope, compra mínima, días, fechas). Se cargan a mano.
- **Descuentos con tarjeta** (tabla `card_promotions`, migración 029):
  - dónde se ven: en cada tienda del producto (web, `apps/web-seo` y app), como el total con envío menos el mejor descuento que aplica hoy (hora RD);
  - qué no cambia: el orden de "Más barato";
  - vencimiento: la fecha de fin es obligatoria; la API oculta la promo al día siguiente y la borra cada 6 h;
  - Instagram: los posts diarios añaden la línea "💳 Con tarjeta…" o mencionan en qué tiendas hay descuentos hoy;
  - lanzamiento: el post está en `marketing/tarjetas-2026-11/` y se publica cuando haya promos reales cargadas.
- Instagram `@dondetard`: lanzamiento Eneba publicado (carrusel, historia y post de alianza).
- Instagram programado: la tabla `instagram_scheduled` guarda posts para una fecha; el ciclo del piloto automático los publica a su hora (aunque el piloto esté apagado), reintenta 3 veces y descarta lo que llega más de 6 h tarde, avisando por Discord. Campaña Black Friday 2026 (13, 24 y 27 de nov; feed 11:00 e historia 18:00, hora RD) en `marketing/black-friday-2026-11/` (`schedule_sql.py` genera el SQL de carga).
- **Pendiente 2027:** cargar los posts de feriados comerciales de 2027 (15 momentos, 30 posts: San Valentín, Madres, Padres, regreso a clases, Black Friday, Cyber Monday, Navidad, Fin de año) con `marketing/feriados/` (ver su README) a más tardar a finales de diciembre de 2026, tras revisar textos y diseños. Los de 2026 (Cyber Monday, Navidad, Fin de año) se cargan con `--skip bf-1,bf-2,bf-3`.
  - Piezas y textos en `marketing/eneba-lanzamiento-2026-10/`.
  - Logos en `marketing/brand/`.
- **App móvil** (`apps/mobile`, Expo SDK 57): Android v0.2.0 con APK de prueba vía EAS; iOS compila y corre en el simulador (iOS 27), con diseño nativo: pestañas Liquid Glass, SF Symbols y SF Pro. Gaming, el código DONDETA y el rediseño ya están en el código; para que lleguen al teléfono hace falta un build nuevo. Ver [MOBILE.md](MOBILE.md).

**Pendiente de Jonatan** (cuentas o accesos que solo él puede crear):

- Secret `DISCORD_WEBHOOK_ALERTS` en GitHub, para las alertas de `uptime.yml`.
- Configurar el pago de Eneba en my.eneba.com/affiliates/overview.
- Cuenta de Play Console (US$25) y Apple Developer Program (US$99/año).
- Resend: crear la cuenta, verificar el dominio `dondeta.com.do` (registros DNS) y poner `RESEND_API_KEY` en `~/dondeta/.env`. Sin eso no salen los correos de cuenta (verificación, recuperar contraseña, 2FA por correo) ni las alertas por email.
- Reaplicar a AdSense (rechazo del 2026-10-20: «contenido de bajo valor»): ver el plan de abajo, no antes de cumplirlo.
- Mergear la rama `kong-memoria` del repo serviciosadsemble (otro proyecto, mismo server).

**Siguientes pasos de producto:**

- **Móvil:** nuevo build (`pnpm build:android:preview`) para probar Gaming en el teléfono, primer build de iOS y publicación en las tiendas, probar el escáner en un iPhone real y Android: compilar con los anuncios (AdMob ya integrado en iOS).
- **Datos:** la búsqueda de "Neveras" trae bebederos primero. (Tiendas cercanas se arregló el 2026-10-12 con la migración 023: 41 sucursales.)
- **Campañas:** las promos pagadas deben llevar el enlace con `utm_medium=paid`, que se genera en /admin → Instagram → Campañas. El costo y el alcance pagado viven en Meta Ads Manager; traerlos al admin requiere un token de Marketing API con `ads_read`.
- **SEO:** pedir indexación de los 7 tipos restantes de `/precios`.
- **Tiendas RD nuevas (ingesta):** Cecomsa (Odoo, HTML de `/shop`; solo electrodomésticos y TV, ~60 productos de la marca KTC) y Electrodom (Shopify `products.json`, ~170 productos, casi todo DRIJA). Corren en el bucle de ingesta de RD cada 6 h. Pendientes: Casa Cuesta y Brik (mismo grupo; Magento sin GraphQL/sitemap y con `robots.txt` que veta las URL con `?`, hay que pedirles un feed o permiso).
- **Redes sociales por país** (una cuenta de Instagram y una Página de Facebook por país; cada stack publica solo lo suyo):
  - *Instagram:* `IG_ACCESS_TOKEN` en el `.env` del stack (`~/dondeta-co`, `~/dondeta-mx`, `~/dondeta-us`); luego reiniciar `api` e `instagram-autopilot` y activar el piloto en `/admin/instagram`. Hasta tener token, el piloto de ese país queda apagado.
  - *Facebook* (réplica automática de cada post del feed; las historias no se replican): crear la Página, vincularla al Instagram, crear una app de Meta con el permiso `pages_manage_posts` (mientras tú seas administrador de la app y de la Página no hace falta revisión de Meta), obtener el token de la Página (no caduca) y poner `FB_PAGE_ID` y `FB_PAGE_ACCESS_TOKEN` en el `.env` del stack. Activar el interruptor «Facebook» en `/admin/instagram`. El registro queda en la tabla `facebook_posts`.
  - *Textos y umbrales por país:* `src/domain/socialProfile.ts` (hashtags, ciudad, escala de precios a cada moneda; EE. UU. es bilingüe). El autopilot usa la hora local del país (`COUNTRY_CODE`).
- **Plan para reaplicar a AdSense** (rechazo por contenido de bajo valor, 2026-10-20):
  - *Contenido:* 19 guías de compra (7 originales + 12 nuevas) y fichas con texto propio (historial + posición frente a su categoría). Solo se indexan fichas con 2+ tiendas, o de una tienda con 5+ mediciones en 14+ días y algún cambio de precio (`isThinProduct`); el resto lleva `noindex` y entra solo cuando acumula historial.
  - *Antes de reaplicar:* en Search Console, enviar el sitemap, pedir indexación de las guías nuevas y de `/precios/*`, y confirmar que «Páginas indexadas» sube y que no hay «Rastreada: sin indexar» en bloque. Esperar al menos 3–4 semanas con tráfico orgánico real y publicar 1–2 guías nuevas por semana.
  - *Tráfico:* enlazar cada guía nueva desde Instagram (Stories/Reels con `utm_source=instagram`), y enlazar el sitio desde el perfil, la bio y los comentarios; compartir `/bajas-de-precio` y `/black-friday` cuando haya movimiento real (Black Friday es a finales de noviembre).
  - *Señales que AdSense mira:* páginas «Sobre», «Metodología», «Contacto», «Privacidad» y «Términos» accesibles desde el menú (ya existen) y sin páginas vacías en el índice.

## 6. Reglas de trabajo

- Diseño: no rediseñar sin pedirlo ([AGENTS.md](../AGENTS.md), [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)).
- Eneba:
  - cada pieza nueva con su logo o marca necesita aprobación escrita previa de Eneba (contacto: Verica, por email y en inglés);
  - prohibido promocionarlos en Google Ads o en sitios de cupones.
- Bases de datos: backup antes de tocarlas y nunca recrear un contenedor de DB.
- Cuentas: Claude no crea cuentas ni pone contraseñas; Jonatan se registra él mismo.
- Ramas: trabajar en una rama, `pnpm check` en verde y luego merge a `main`. El merge despliega.
