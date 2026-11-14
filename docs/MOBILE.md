# App móvil (Android + iOS)

`apps/mobile`: Expo SDK 57 + expo-router, misma API que la web
(`EXPO_PUBLIC_API_URL`). Bundle id / package: **`com.dondeta.app`** (definitivo desde el
2026-11-14; no cambiarlo después de publicar). Versión 1.0.0. Proyecto EAS
`jfmcss/dondeta` (las versiones las lleva EAS: `appVersionSource: remote`).

## Arrancar

```bash
cd apps/mobile
pnpm install                 # lo hace scripts/setup.sh
npx eas login                # cuenta Expo jfmcss (una vez por máquina)
pnpm start                   # Metro; abrir con Expo Go o con el dev client
```

`apps/mobile/.env` (no se sube) decide a qué API apunta en desarrollo; por
defecto producción (`https://dondeta.com.do/api`). Los builds de EAS
`preview`/`production` fijan la URL de producción en `eas.json`.

Expo Go sirve para casi todo. Lo que necesita módulos nativos (notificaciones
push) solo funciona en un build real o en el dev client.

## iOS (en la Mac)

1. Xcode desde el App Store, abrirlo una vez para aceptar la licencia e
   instalar el simulador de iOS.
2. Simulador sin cuenta de Apple: `pnpm ios` (compila localmente con Xcode y
   abre el simulador), o en la nube `pnpm build:ios:simulator` e instalar el
   `.app` que devuelve EAS.
3. iPhone físico **sin pagar** (instalación personal, dura 7 días):
   - Activa *Ajustes → Privacidad y seguridad → Modo desarrollador* en el iPhone.
   - Agrega tu Apple ID en *Xcode → Settings → Accounts*.
   - Elige tu "Personal Team" una vez en *Signing & Capabilities* para obtener el Team ID.
   - Ejecuta:
     ```bash
     DONDETA_DEVICE_TEAM=<team id> npx expo prebuild --platform ios --no-install
     DONDETA_DEVICE_TEAM=<team id> npx expo run:ios --device
     ```
   - En el iPhone: *Ajustes → General → VPN y gestión de dispositivos → confiar*.
   - Usa el bundle id `com.jonatanmaria.dondeta.dev` (cambiable con `DONDETA_DEVICE_BUNDLE_ID`) y no tiene notificaciones push (los equipos gratuitos no las firman). Ver `app.config.js`.
4. iPhone físico vía TestFlight: requiere **Apple Developer Program** (US$99/año). Luego:
   - `npx eas device:create` para registrar el iPhone (ad hoc).
   - `pnpm build:ios:preview` → instalar desde el enlace de EAS.
5. App Store: `pnpm build:ios:production` y `pnpm submit:ios` (pide crear la
   app en App Store Connect la primera vez; EAS gestiona certificados y
   perfiles).

Ya configurado para iOS:

- `ITSAppUsesNonExemptEncryption=false`, así App Store Connect no pregunta por cifrado en cada build.
- Ubicación solo "mientras se usa la app", sin ubicación en segundo plano: los textos de "siempre", movimiento, micrófono y Face ID están desactivados (`false` en los plugins), porque Apple rechaza textos que la app no usa o que quedan en inglés.
- Manifiesto de privacidad (`ios.privacyManifests` en `app.json` → `PrivacyInfo.xcprivacy`): ver "Respuestas de privacidad" abajo.
- Ícono de 1024 sin transparencia (Apple rechaza el canal alfa).
- Textos de los permisos de cámara y ubicación.
- Ciclo de vida por escenas (UIScene), obligatorio desde iOS 27: sin él la app
  se cierra al abrir. Lo activa `plugins/withSceneLifecycle.js` en cada prebuild
  (no editar `ios/` a mano: se regenera). Quitarlo cuando la plantilla de Expo
  ya lo traiga.
- Solo iPhone (`supportsTablet: false`). Así no hacen falta capturas de iPad para publicar; se puede activar más adelante.

Para la ficha de App Store hacen falta capturas de 6.7" y 6.5", el texto de la ficha, la URL de privacidad (`https://dondeta.com.do/privacy`) y una cuenta de prueba para la revisión de Apple, porque la app tiene inicio de sesión.

## Android

- APK de prueba: `pnpm build:android:preview` (instalable directo).
- Play Store: `pnpm build:android:production` (AAB) + `pnpm submit:android`
  (sube al track interno). Requiere la cuenta de Play Console (US$25) y, para
  `eas submit`, una service account de Google Play.
- Compilar Android localmente en Windows falla por el límite de 260
  caracteres en rutas (react-native-worklets); usar EAS o una Mac/Linux.

## Gaming (Eneba)

- Portada: bloque 🎮 Gaming con el sello "En alianza con Eneba", el código DONDETA (botón Copiar, `expo-clipboard`) y el escaparate de recargas y juegos.
- `app/gaming.tsx`: la sección completa, con filtros Recargas / Suscripciones / Juegos PC; los datos vienen de `/api/products/highlights` → `gaming`.
- Ficha de producto: "Código digital", el código DONDETA y las notas de entrega digital.
- El botón "Ver oferta" pasa por `/api/go` (clic registrado) y el enlace conserva `af_id=dondeta`.
- La lógica está en `src/domain/gaming.ts` y es copia de la de la web: hay que mantener las dos iguales. Sus tests (`gaming.test.ts`) corren con el `pnpm test` de la raíz.
- El logo de Eneba está en `assets/partners/eneba.png`, aprobado por Eneba. Usarlo en otro sitio requiere su aprobación otra vez.

## Diseño de la app (iOS nativo)

La app no copia la web: usa los controles del sistema y conserva la marca
(verde, naranja y azul marino). Dirección aprobada el 2026-10-12.

- **Navegación:** pestañas nativas (`expo-router/unstable-native-tabs`, Liquid Glass en iOS 26+); "Buscar" con `role="search"`. Cada pestaña es una pila con títulos grandes (`src/design/navigation.ts`).
- **Tipografía:** `src/design/type.ts`. En iOS se usa SF Pro con los tamaños de Dynamic Type y SF Pro Rounded para los precios. En Android se usan DM Sans y Poppins. Poppins en iOS solo aparece en la portada (`type.brand`).
- **Íconos:** `src/components/Icon.tsx`: SF Symbols en iOS y Material Symbols en Android. Íconos nuevos se agregan ahí, nunca con emojis.
- **Componentes:** `src/components/ui/`: Touchable (respuesta al toque), Button, Skeleton, EmptyState, SectionHeader, SegmentedControl, GroupedList.
- **Errores:** `src/api/errors.ts` (`friendlyError`): nunca mostrar mensajes técnicos.
- **Hápticos:** `src/design/haptics.ts`.
- **Enlaces:** las ofertas se abren dentro de la app con `expo-web-browser` (`src/domain/links.ts`).
- **Precios:** en pesos enteros (`formatPrice` redondea).
- **iOS 27:** exige el ciclo de vida por escenas. Ver `plugins/withSceneLifecycle.js`.

## Cuenta y seguridad

- **Sin cuenta:** buscar, comparar, escanear, tiendas cercanas, Gaming, compartir y favoritos solo en el teléfono.
- **Con cuenta:** favoritos sincronizados con la web, alertas de precio, reseñas e historial.
- **Funciones de cuenta sin sesión:** abren la hoja `app/auth` con `?reason=alerts|reviews|sync`, que explica para qué sirve la cuenta.
- **Pantallas de acceso (`app/auth/`):** iniciar sesión / crear cuenta, verificación en dos pasos (`mfa`), recuperar contraseña (`forgot`) y confirmar correo (`verify-email`).
- **Seguridad (`app/(tabs)/profile/`):** `security`, `change-password`, `two-factor` (correo o app autenticadora; en iOS "Agregar a mi app" abre el llavero) y `delete-account`, que exigen Apple y Google.
- **Sesión cerrada desde otro lado** (cerrar todas las sesiones, cambio de contraseña, cuenta borrada): la API responde 401 y la app cierra la sesión sola (`setSessionExpiredHandler`). Una contraseña incorrecta en una confirmación responde 403, no 401.
- **Correos** (bienvenida con código, recuperación, código de acceso, avisos de seguridad): los envía Resend. Sin `RESEND_API_KEY`, la API solo los registra en el log, y fuera de producción con el contenido, útil para pruebas locales.
- **Web:** el mismo flujo en `src/components/AuthForm.tsx` (2FA y recuperación) y `/cuenta/seguridad` (`src/screens/AccountSecurityScreen.tsx`). Esa URL es el enlace para "eliminar cuenta" que pide Google Play.

## Anuncios (AdMob)

- **Código:** `src/ads/`. `ads.ts` contiene los IDs de bloques, el consentimiento (`AdsConsent.gatherConsent`: mensaje de AdMob y luego el permiso de rastreo de Apple) y la inicialización. Los IDs de las apps están en `app.json`, plugin `react-native-google-mobile-ads`.
- **Dónde aparecen:**
  - un nativo (`NativeAdCard`) con forma de tarjeta y etiqueta "Anuncio", en Inicio y en Buscar: después del producto 6 y luego cada 12 (`src/domain/feed.ts`);
  - un banner (`BannerSlot`) al final de la ficha de producto.
  - Sin anuncios en Escanear, Guardados, Perfil, Gaming ni los carruseles.
- **Si no hay anuncio:** no queda hueco (el componente no se renderiza).
- **Contenido:** clasificación PG, palabras clave de hogar y tecnología. Sin consentimiento de personalización, los anuncios son no personalizados.
- **Desarrollo:** siempre usa los `TestIds` de Google. Nunca tocar anuncios reales desde un build propio: es tráfico inválido.
- **`app-ads.txt`:** en `public/` de la web, con el mismo editor que `ads.txt`.
- **Android:** la librería 17.x trae `play-services-ads` 25.4.0 (Kotlin 2.3), que rompió el build de release con Kotlin 2.1. Probar la opción `androidSdk` del plugin al retomar Android.

## Pruebas de interfaz (Maestro)

`apps/mobile/.maestro/`: recorren portada, búsqueda (con y sin resultados),
ficha de producto, Guardados, Perfil, Escanear y Tiendas cercanas, y toman
capturas.

```bash
brew install mobile-dev-inc/tap/maestro   # una vez (usa Java 17)
cd apps/mobile && pnpm ios                # build de desarrollo en el simulador
npx expo start --dev-client               # Metro, en otra terminal
maestro test .maestro
```

En el build de desarrollo, el botón flotante ⚙️ de Expo puede tapar botones;
no existe en los builds de release.

## Checks

```bash
pnpm typecheck
pnpm doctor                  # expo-doctor: 21/21 al 2026-10-12
npx expo export --platform ios      # verifica que el bundle compile
npx expo export --platform android
```

## Pendientes de la app

- **Relevancia de la búsqueda:** "Neveras" trae bebederos primero. Esto se ajusta en la API, no en la app.
- **Escáner:** probarlo en un iPhone real. Al 2026-10-12, 582 de 1,802 variantes (32 %) tienen EAN/UPC; solo una de las fuentes de ingesta lo guarda.

- **Paridad con la web:** la navegación por secciones de las demás categorías y el filtro de tipos de artículo aún no están en la app (Gaming sí, desde 2026-10-12).
- **`android/` en la raíz:** es el intento viejo con Capacitor; la app oficial es `apps/mobile`.

## Publicación en las tiendas (preparado el 2026-11-14)

Todo lo que no necesita las cuentas de Apple y Google ya está en el código. Lo que falta, en orden:

1. **Apple Developer** (organización con D-U-N-S) y **Play Console** (organización: evita la prueba cerrada de 12 testers/14 días).
2. **Enlaces universales / App Links** (`https://dondeta.com.do/product/…`, `/stores/…`, `/store/…`, `/cuenta/black-friday` abren la app):
   - `public/.well-known/apple-app-site-association`: cambiar `TEAMID` por el **Team ID** de Apple (10 caracteres, *Membership details*). Queda `ABCDE12345.com.dondeta.app`.
   - `public/.well-known/assetlinks.json`: cambiar `PLAY_APP_SIGNING_SHA256` por la huella **SHA-256 del certificado de firma de Play** (*Play Console → Configuración → Integridad de la app → Firma de apps*), en formato `AB:CD:…`. Si también se instalan builds firmados con la llave de subida (EAS), agregar esa huella como segundo elemento.
   - nginx los sirve como JSON en `/.well-known/` sin redirección ni fallback (`deploy/nginx.conf`). Comprobar después del deploy: `curl -sI https://dondeta.com.do/.well-known/apple-app-site-association` → `200` y `content-type: application/json`.
   - La app ya declara `applinks:dondeta.com.do` (iOS) y los `intentFilters` con `autoVerify` (Android). `app/+native-intent.tsx` traduce las rutas web a las de la app (`src/domain/deepLinks.ts`).
3. **`eas.json` → `submit.production.ios`**: cuando exista la app en App Store Connect, agregar `ascAppId` (el *Apple ID* numérico de la app), `appleTeamId` y, si se usa API key, `ascApiKeyPath`/`ascApiKeyId`/`ascApiKeyIssuerId`. Para Android, `serviceAccountKeyPath` de una service account con acceso a Play Console. No se pusieron valores de ejemplo para no subir algo inválido.
4. **Push:** EAS crea la llave APNs al primer build de producción; Android necesita el `google-services.json` del proyecto de Firebase (FCM v1) en `apps/mobile/`.
5. `pnpm build:ios:production` / `pnpm build:android:production`, luego `pnpm submit:ios` / `pnpm submit:android`.
6. **Cuenta de prueba para la revisión de Apple** (la app tiene inicio de sesión): crear una cuenta sin 2FA y ponerla en *App Review Information*.

**Android:** React Native 0.86 trae `compileSdk`/`targetSdk` 36 y `minSdk` 24 con NDK r27, que cumple el requisito de Google Play (target 35+) y alinea las librerías nativas a páginas de 16 KB. `react-native-google-mobile-ads` 17.2 (play-services-ads 25.x) también es compatible con 16 KB. Permisos: cámara y ubicación aproximada/precisa; `blockedPermissions` en `app.json` quita los que agregan las librerías sin usarse (micrófono, ubicación en segundo plano, servicio en primer plano, almacenamiento, `SYSTEM_ALERT_WINDOW`). Se mantienen `INTERNET`, `ACCESS_NETWORK_STATE`, `VIBRATE`, `POST_NOTIFICATIONS`, `RECEIVE_BOOT_COMPLETED`, `WAKE_LOCK` y `com.google.android.gms.permission.AD_ID` (AdMob).

## Respuestas de privacidad (formularios de las tiendas)

Fuente: lo que la app y la API hacen de verdad (revisado el 2026-11-14). El manifiesto de iOS (`app.json` → `ios.privacyManifests`) dice lo mismo.

**App Store → App Privacy** ("Data Used to Track You" = solo lo de AdMob cuando el usuario acepta el permiso de rastreo):

| Dato | ¿Se recoge? | ¿Ligado al usuario? | ¿Rastreo? | Para qué |
|---|---|---|---|---|
| Correo | Sí (cuenta) | Sí | No | Funcionalidad de la app |
| Nombre | Sí, opcional | Sí | No | Funcionalidad |
| Teléfono | Sí, opcional (alertas por WhatsApp) | Sí | No | Funcionalidad |
| ID de usuario | Sí | Sí | No | Funcionalidad |
| Historial de búsqueda | Sí, con cuenta (búsquedas recientes sincronizadas) | Sí | No | Funcionalidad |
| Otro contenido del usuario (reseñas, favoritos, alertas) | Sí, con cuenta | Sí | No | Funcionalidad |
| Ubicación precisa | Sí, solo en "Cerca de ti": se envía a la API para buscar sucursales y no se guarda en la cuenta | No | No | Funcionalidad |
| ID del dispositivo (IDFA) | Sí (AdMob) | No | **Sí** | Publicidad de terceros |
| Datos de publicidad | Sí (AdMob) | No | **Sí** | Publicidad de terceros |
| Ubicación aproximada (por IP) | Sí (AdMob) | No | No | Publicidad de terceros |
| Interacción con el producto | Sí (AdMob) | No | No | Publicidad, analítica |
| Fallos, rendimiento y otros diagnósticos | Sí (SDK de AdMob) | No | No | Analítica |

No se recogen: contactos, fotos (la cámara solo lee códigos de barras en el teléfono), salud, pagos, audio ni mensajes. El token de notificaciones push se guarda ligado a la cuenta solo para enviar las alertas.

**Google Play → Seguridad de los datos:**

- Cifrado en tránsito: **sí** (todo por HTTPS).
- Eliminación de datos: **sí**, desde la app (*Perfil → Seguridad → Eliminar cuenta*) y en la web: `https://dondeta.com.do/cuenta/seguridad`.
- Datos **recopilados**: los de la tabla de arriba, con estas marcas:
  - Correo, ID de usuario: obligatorios para tener cuenta (la app se usa sin cuenta).
  - Nombre, teléfono: opcionales.
  - Ubicación precisa: opcional, para tiendas cercanas.
  - Historial de búsqueda, contenido del usuario: solo con cuenta.
- Datos **compartidos**: ID de dispositivo/publicidad, ubicación aproximada, interacción y diagnósticos, con Google (AdMob), para publicidad y analítica.
- Ninguno se procesa solo de forma efímera salvo la ubicación precisa.

**Clasificación por edad:** sin violencia, contenido sexual, apuestas ni compras dentro de la app. Tiene contenido generado por usuarios (reseñas) con moderación: filtro de lenguaje, "Reportar" y "Ocultar reseñas de este usuario" en cada reseña, revisión en menos de 24 h desde `/admin/resenas` y aviso a Discord en cada reporte. Términos con tolerancia cero en `https://dondeta.com.do/terminos`, aceptados al crear la cuenta (web y app).

## Paridad con la web (2026-11-14)

- **Ofertas reales de Black Friday por correo:** fila en Perfil (solo RD) y pantalla `app/black-friday-alerts.tsx` (también el destino de `/cuenta/black-friday?activar=1`). Con `?activar=1` suscribe apenas hay sesión, incluso después de crear la cuenta desde ahí.
- **Tarjeta "Crea tu cuenta gratis" en Inicio** para quien no tiene sesión: copia de Black Friday en RD durante la campaña; "Ahora no" la oculta 14 días; nunca vuelve tras crear cuenta (`src/domain/signupNudge.ts`).
- **Origen del registro:** la app manda `source=utm_source=app&utm_medium=ios|android` (más la pantalla de origen) para el aviso de Discord.
- **Reseñas:** menú "…" en cada reseña con "Reportar reseña" (pide cuenta) y "Ocultar reseñas de este usuario" (funciona sin cuenta, se guarda en el teléfono y, con sesión, en la cuenta).

## Capturas para las tiendas

Build de release en el simulador, contra la API de producción, sin Metro:

```bash
cd apps/mobile
npx expo prebuild --platform ios --clean --no-install
npx expo run:ios --configuration Release --device "iPhone 18 Pro Max"   # 6.9"
maestro test -e RELEASE=true .maestro        # recorre las pantallas y guarda capturas
```

Los anuncios en release son reales: no tocarlos (en el simulador Google los trata como de prueba, pero mejor no). Para 6.5" se puede usar el mismo build en otro simulador si App Store Connect lo pide; desde 2024 basta con 6.9".
