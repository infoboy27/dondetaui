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

## Checks

```bash
pnpm typecheck
pnpm doctor                  # expo-doctor: 21/21 al 2026-10-12
npx expo export --platform ios      # verifica que el bundle compile
npx expo export --platform android
```

## Pendientes de la app

- **Paridad con la web:** la navegación por secciones de las demás categorías y el filtro de tipos de artículo aún no están en la app (Gaming sí, desde 2026-10-12).
- **Anuncios:** se quitó AdMob, que solo mostraba anuncios de prueba y rompía el build de release.
- **`android/` en la raíz:** es el intento viejo con Capacitor; la app oficial es `apps/mobile`.
