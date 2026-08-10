# DóndeTa Design System

This document captures the approved visual language of the current DóndeTa Figma Make implementation. It is a preservation document first: structural refactors should keep these rules unless a product-design change is explicitly requested.

## Brand promise

**DóndeTa** helps people compare prices across stores in the Dominican Republic and quickly identify where buying is most convenient.

Primary consumer line:

> ¿Dónde 'ta más barato?

Supporting line:

> Busca. Compara. Ahorra.

## Visual principles

- Clear before decorative
- Savings should be immediately visible
- Best price should be visually obvious but not aggressive
- White surfaces over a soft gray app background
- Green communicates primary action / best value
- Orange communicates savings / discount emphasis
- Dark navy is the main text color
- Local Dominican personality should come through copy, not excessive visual slang

## Color tokens

| Token | Value | Usage |
|---|---:|---|
| `primary` | `#00B894` | Main CTA, best price, active states |
| `primary-light` | `#E6F7F3` | Selected/best-price background, soft green surfaces |
| `primary-dark` | `#009B7D` | Pressed/active primary treatment |
| `accent` | `#FF9F1C` | Savings, discounts, promo emphasis |
| `accent-light` | `#FFF3E0` | Soft savings surface |
| `yellow` | `#FFD166` | Rating/star secondary accent |
| `navy` | `#0F1D2D` | Primary text |
| `navy-600` | `#2D4A6B` | Secondary strong text |
| `navy-400` | `#5D7EA0` | Secondary text |
| `navy-200` | `#B0C4D8` | Muted UI labels |
| `navy-100` | `#D8E6F0` | Subtle separators |
| `navy-50` | `#F0F5F9` | Extra-soft surfaces |
| `background` | `#F2F4F7` | App/page background |
| `card` | `#FFFFFF` | Cards and primary surfaces |
| `border` | `#E8EDF2` | Standard border |
| `error` | `#FF3B3B` | Out of stock / destructive/error |

Do not introduce a new brand color when an existing token can express the state.

## Typography

### Display / headings / prices

**Poppins**

Common weights:

- 600 — section headings
- 700 — key titles and prices

### Body / interface

**DM Sans**

Common weights:

- 400 — body/muted copy
- 500 — controls/metadata
- 600 — labels and secondary emphasis

### Suggested scale

- Display: 32/40
- H1: 28/36
- H2: 24/32
- H3: 20/28
- Title: 18/26
- Body: 16/24
- Body small: 14/20
- Caption: 12/16

The existing Figma Make implementation sometimes uses tighter sizes for dense mobile cards; preserve those proportions unless intentionally revising the design.

## Radius

- Small: `8px`
- Medium: `12px`
- Large/card: `16px`
- XL: `20px`
- 2XL: `24px`
- Pill: `999px`

Default product cards: **16px**.
Primary buttons: generally **12px**.
Search fields: **12–14px** in the current implementation.

## Shadows

Use subtle shadows only. Cards should primarily read through white surface + border, not elevation.

- Small: `0 1px 3px rgba(15,29,45,.06), 0 1px 2px rgba(15,29,45,.04)`
- Medium: `0 4px 12px rgba(15,29,45,.08), 0 2px 4px rgba(15,29,45,.04)`
- Large: `0 8px 24px rgba(15,29,45,.10), 0 4px 8px rgba(15,29,45,.06)`

Avoid glassmorphism, heavy glow, or decorative gradients except where already part of the current brand treatment.

## Price presentation

Format Dominican pesos as:

`RD$24,495`

Never format as `$24,495`, `RD $24,495`, or `24,495 RD$`.

### Best price

Best price treatment should generally combine:

- green price text
- mint background or subtle green border/indicator
- `MÁS BARATO` badge where space allows

### Savings

Savings should use orange text/badges, e.g.:

`Ahorras RD$3,000`

Do not use orange as a general-purpose primary action color.

## Core components

Production component extraction should converge on patterns like:

- `Button`
- `IconButton`
- `SearchField`
- `Card`
- `ProductCard`
- `ProductComparisonCard`
- `StoreOfferRow`
- `BestPriceBadge`
- `DiscountBadge`
- `AvailabilityBadge`
- `CategoryCard`
- `FilterChip`
- `Price`
- `BottomNavigation`
- `Header`
- `PriceAlertSheet`
- `PriceHistoryChart`
- `EmptyState`
- `Skeleton`

Repeated patterns in separate screens should not remain separately styled forever.

## Mobile navigation

Primary tabs:

1. Inicio
2. Buscar
3. Escanear
4. Alertas
5. Perfil

The center scanner action is visually elevated/primary. Preserve this hierarchy in mobile implementation.

## Key screens that define the product

The minimum visual regression set is:

- Home
- Search / Results
- Product Detail
- Scanner

Additional screens:

- Alerts / Favorites
- Store Detail
- Nearby Stores
- Equipa tu Hogar
- Profile
- Desktop comparison view

## Trust UX

Price-comparison UX should surface freshness and uncertainty without overwhelming the user. Approved patterns include:

- `Actualizado hace 20 min`
- `Disponibilidad puede variar`
- `Verifica disponibilidad en tienda`

Production UI should eventually distinguish stale vs fresh offers consistently.

## Product identity

Where useful, show brand + manufacturer model to reinforce that prices are being compared for the same exact variant.

Example:

`Samsung · WA18T6360BV`

Product matching confidence is an internal system concern and should not clutter normal consumer UI unless a comparison is uncertain.

## Product imagery

Product imagery should sit on clean light surfaces and remain visually secondary to product identity + price comparison.

Prefer `object-contain` for real catalog product photography when that preserves the full product silhouette. The existing Figma prototype uses some `object-cover` placeholders because its images are illustrative; do not blindly carry that behavior into production catalog images.

## Accessibility

- Minimum practical touch target: 44px
- Visible focus states on web
- Do not communicate savings or availability using color alone
- Maintain readable contrast against mint/orange surfaces
- Icons should have accessible names where necessary

## Responsive intent

Reference widths:

- Mobile: ~390px
- Tablet: ~768px
- Small desktop: ~1024px
- Desktop: ~1440px

Do not create desktop by merely stretching mobile. Preserve the same information hierarchy while using space appropriately.

## Anti-patterns

Avoid:

- redesigning structural refactors
- arbitrary new color literals
- excessive shadows
- generic fintech dashboard styling
- glassmorphism
- oversized decorative illustrations
- hiding model identity when exact-product matching matters
- ranking offers by array position alone in production logic
