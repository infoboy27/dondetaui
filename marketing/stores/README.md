# Store listing kit (App Store + Google Play)

Everything the store consoles ask for, prepared before the developer accounts
exist. Bundle id / package: `com.dondeta.app`.

## Files

| File | Where it goes |
|---|---|
| `listing.json` | App Store Connect: name (30), subtitle (30), keywords (100), promotional text (170), categories. Google Play: title (30), short description (80), category. All within limits (checked). |
| `description-es.txt` | Description, both stores (1.7k of the 4,000-character limit). |
| `whats-new-1.0.0.txt` | "What's New" (App Store) / release notes (Play). |
| `feature-graphic-1024x500.png` | Google Play feature graphic (required, RGB, no alpha). `make_feature_graphic.py` rebuilds it. |
| `screenshots/` | Generated from the simulator/emulator once the store-ready app build lands (see below). |

## Console fields

| Field | Value |
|---|---|
| Primary language | Spanish (Latin America) — `es-419` on Play, "Spanish (Mexico)" is the closest App Store locale; keep "Spanish (Spain)" off. |
| Category | Shopping (App Store secondary: Lifestyle) |
| Price | Free. Contains ads: **yes**. In-app purchases: **no**. |
| Privacy policy URL | https://dondeta.com.do/privacy |
| Support URL | https://dondeta.com.do/contacto |
| Marketing URL | https://dondeta.com.do |
| Account deletion URL (Play) | https://dondeta.com.do/cuenta/seguridad (also in-app: Perfil → Seguridad → Eliminar cuenta) |
| Copyright | © 2026 DóndeTa |
| Countries | Start with Dominican Republic; add others only when their stacks are ready. |
| Export compliance | Uses only standard HTTPS: `ITSAppUsesNonExemptEncryption = false` (already in app.json). |

## Age rating (draft answers)

Both questionnaires: no violence, sexual content, profanity, drugs, gambling,
horror, or medical content. Unrestricted web access: **no** (offers open in an
in-app browser tab for specific store pages). User-generated content: **yes,
product reviews**. Apple guideline 1.2 requires a content filter, a way to
report reviews, blocking abusive users and published contact info; these are
being added in the mobile store-readiness PR (report button, auto-hide after
3 reports, admin moderation, review bans, terms with zero tolerance). Ads: **yes**. Expected result: 4+ (App Store),
Everyone / PEGI 3 (Play).

## Privacy forms

App Store "App Privacy" and Google Play "Data safety" answers are documented
next to the code that collects the data, in `docs/MOBILE.md` → "Privacy answers
(store forms)". Copy them from there so they stay in sync with the privacy
manifest.

## App Review notes (App Store)

Reviewers need to try the signed-in features (alerts, favorites sync, reviews).
Before the first submission create a review account on prod (a real mailbox you
control, verified email, no 2FA) and paste it in "Sign-in information". Suggested
note:

> DóndeTa compares public prices from Dominican Republic retailers. Browsing,
> search and the barcode scanner work without an account. Use the account below
> to test price alerts and favorites. Prices open the retailer's own page in an
> in-app browser; the app sells nothing.

## Screenshots needed

- **App Store:** iPhone 6.9" (1320×2868, e.g. iPhone 17 Pro Max simulator) is
  required; Apple scales it down for smaller iPhones. iPad not needed
  (`supportsTablet: false`).
- **Google Play:** at least 2 phone screenshots (1080×1920 or larger, 9:16);
  up to 8.
- Suggested set (same order on both): Home with today's drops · search results
  for a common product · product page with stores sorted and price history ·
  Black Friday "¿la oferta es real?" · card discounts on a product · scanner ·
  nearby stores · alerts.
