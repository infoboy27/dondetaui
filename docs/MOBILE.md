# App móvil (Android + iOS)

`apps/mobile`: Expo SDK 57 + expo-router, misma API que la web
(`EXPO_PUBLIC_API_URL`). Bundle id / package: `com.jfmcss.dondeta`. Proyecto EAS
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
3. iPhone físico: requiere **Apple Developer Program** (US$99/año, cuenta de
   Jonatan). Luego:
   - `npx eas device:create` para registrar el iPhone (ad hoc).
   - `pnpm build:ios:preview` → instalar desde el enlace de EAS.
4. App Store: `pnpm build:ios:production` y `pnpm submit:ios` (pide crear la
   app en App Store Connect la primera vez; EAS gestiona certificados y
   perfiles).

Ya configurado para iOS:

- `ITSAppUsesNonExemptEncryption=false`, así App Store Connect no pregunta por cifrado en cada build.
- Ubicación solo "mientras se usa la app", sin ubicación en segundo plano.
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

- **Tiendas cercanas sin datos:** `/api/stores/nearby` no devuelve sucursales ni siquiera en Santo Domingo (radio de 25 km, 2026-10-12). Hay que revisar si la tabla de sucursales está cargada.
- **Relevancia de la búsqueda:** "Neveras" trae bebederos primero. Esto se ajusta en la API, no en la app.
- **Escáner:** probarlo en un iPhone real y medir cuántos productos tienen EAN/UPC (`product_variants.ean/upc`). Solo una de las fuentes de ingesta lo guarda.

- **Paridad con la web:** la navegación por secciones de las demás categorías y el filtro de tipos de artículo aún no están en la app (Gaming sí, desde 2026-10-12).
- **`android/` en la raíz:** es el intento viejo con Capacitor; la app oficial es `apps/mobile`.
