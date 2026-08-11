# Testing

100% test coverage is the key to great vibe coding. Tests let you move fast, trust your instincts, and ship with confidence — without them, vibe coding is just yolo coding. With tests, it's a superpower.

## Framework

[Vitest](https://vitest.dev) + [React Testing Library](https://testing-library.com/react), running in a `jsdom` environment.

## Running tests

```bash
pnpm test          # unit tests, run once (used by CI, via `pnpm check`)
pnpm test:watch    # unit tests, watch mode
pnpm test:e2e      # Playwright E2E — builds + serves the app, then runs e2e/*.spec.ts
```

## Layers

- **Unit tests** — pure functions in `src/domain/` (`offers.ts`, `notifications.ts`, `currency.ts`) and small utility modules like `src/auth/session.ts`. Colocated as `*.test.ts` next to the source file.
- **Component tests** — not yet established; would use `@testing-library/react` + `@testing-library/user-event`, colocated as `*.test.tsx`.
- **Backend tests** — none yet in `apps/api`; the auth flow has so far been verified manually against a scratch Postgres + compiled API (see commit history), not via an automated suite.
- **E2E** — [Playwright](https://playwright.dev), `e2e/*.spec.ts`, run via `pnpm test:e2e` (own CI job, `.github/workflows/ci.yml`'s `e2e` job — separate from the required `validate` job so a flaky browser run never blocks merges). Runs against the SPA's mock-data mode (`VITE_USE_API` unset → `src/data/mock.ts`), deliberately: these tests simulate a real user clicking through the UI (search, favorite a product, revisit the favorites tab, scanner permission flow) without needing a live Postgres + API stack, so they run identically on a laptop and in CI. Two Playwright projects (`chromium` = desktop viewport, `mobile-chrome` = Pixel 7) cover both of the app's two genuinely different navigation models — see the comment at the top of `e2e/golden-path.spec.ts` for specifics (e.g. desktop has no dedicated `/results` or `/alerts?tab=favoritos` route; results/favorites render inline instead). **Not yet covered**: real-backend flows (actual login persisting across a session, server-side favorites/alerts/reviews) — those still rely on the manual scratch-Postgres-+-compiled-API verification described elsewhere in this doc; wiring a Postgres service container into the `e2e` CI job is a reasonable next step if that coverage becomes worth the added CI time.

## Conventions

- File naming: `<module>.test.ts` colocated with the module under test.
- `describe` blocks group by exported function; `it` descriptions state the behavior being verified, not the input ("sorts unavailable offers after available ones", not "test case 1").
- Build fixtures with small local factory functions (see `offer()` in `offers.test.ts`, `product()` in `notifications.test.ts`) rather than importing `src/data/mock.ts` — keeps tests independent of prototype fixture data that may change.
- Assert real behavior/output, not just "doesn't throw" or "is defined".
