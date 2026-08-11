# Testing

100% test coverage is the key to great vibe coding. Tests let you move fast, trust your instincts, and ship with confidence — without them, vibe coding is just yolo coding. With tests, it's a superpower.

## Framework

[Vitest](https://vitest.dev) + [React Testing Library](https://testing-library.com/react), running in a `jsdom` environment.

## Running tests

```bash
pnpm test          # run once (used by CI, via `pnpm check`)
pnpm test:watch    # watch mode
```

## Layers

- **Unit tests** — pure functions in `src/domain/` (`offers.ts`, `notifications.ts`, `currency.ts`) and small utility modules like `src/auth/session.ts`. Colocated as `*.test.ts` next to the source file.
- **Component tests** — not yet established; would use `@testing-library/react` + `@testing-library/user-event`, colocated as `*.test.tsx`.
- **Backend tests** — none yet in `apps/api`; the auth flow has so far been verified manually against a scratch Postgres + compiled API (see commit history), not via an automated suite.
- **E2E** — none; QA has so far been manual/agent-driven browser testing (`/qa`), not a checked-in Playwright/Cypress suite.

## Conventions

- File naming: `<module>.test.ts` colocated with the module under test.
- `describe` blocks group by exported function; `it` descriptions state the behavior being verified, not the input ("sorts unavailable offers after available ones", not "test case 1").
- Build fixtures with small local factory functions (see `offer()` in `offers.test.ts`, `product()` in `notifications.test.ts`) rather than importing `src/data/mock.ts` — keeps tests independent of prototype fixture data that may change.
- Assert real behavior/output, not just "doesn't throw" or "is defined".
