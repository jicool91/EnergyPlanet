# Repository Guidelines

## Project Structure & Module Organization
- `backend/` – TypeScript Express API. Controllers live in `src/api/controllers`, routes in `src/api/routes`, domain services in `src/services`, and data helpers in `src/db`; migrations and seeds reside under `migrations/` and `content/`.
- `webapp/` – React + Vite client. Screens sit in `src/screens`, shared state in `src/store`, and API calls in `src/services`; the `@/*` alias resolves to `src/`.
- Shared assets: `content/` (game data), `docs/` (design specs), `k8s/` (deployment manifests), and `docker-compose.yml` (local stack). Update them whenever balance or infrastructure shifts.

## Build, Test & Development Commands
- `docker-compose up` starts PostgreSQL, Redis, the API on 3000, and the webapp on 5173 for full-stack checks.
- Backend: `npm run dev`, `npm run build`, `npm run start`, `npm run migrate:up`, `npm run migrate:down`, and `npm run seed` cover day-to-day workflows.
- Webapp: `npm run dev` launches the dev server, `npm run build` emits production assets, and `npm run preview` smoke-tests the bundle.
- Run `npm run lint`, `npm run format`, and `npm run typecheck` in both packages before submitting a PR.

## Coding Style & Naming Conventions
- Format with Prettier defaults (two-space indent, single quotes) via `npm run format`, and keep ESLint clean using `npm run lint:fix` before resolving any remaining warnings.
- TypeScript runs in `strict` mode—declare return types, tighten DTOs with `zod`, and avoid `any`.
- Naming: `camelCase` for functions and variables, `PascalCase` for classes and React components, `UPPER_SNAKE_CASE` for constants and environment keys; React filenames should mirror component names.

## Testing Guidelines
- Backend: `npm test` provides coverage, `npm run test:watch` assists TDD, and `npm run test:integration` exercises endpoint flows; place specs beside sources as `*.spec.ts` or `*.test.ts`.
- Frontend tests are not yet scaffolded; when adding them, favour React Testing Library with `*.test.tsx`, capture API calls with mocked services, and document remaining gaps in the PR description.

## Commit & Pull Request Guidelines
- Use Conventional Commits (`feat:`, `fix:`, `chore:`) as reflected in `git log`; keep subjects ≤72 characters.
- Each PR should summarise scope, link the ticket, call out migrations or env updates, attach UI evidence when relevant, and confirm Docker stack, lint, tests, and type checks all passed locally.

## Environment & Configuration
- Copy `.env.sample` to `.env` in `backend/` and `webapp/`, fill Telegram tokens, database, and Redis endpoints, keep secrets out of git, and prefer migration or seed scripts over ad-hoc SQL when mutating state.
- Toggle `MOCK_PAYMENTS=true` in `backend/.env` when testing cosmetics purchases locally; disable it in environments where Telegram Stars is wired.
- Boostы доступны через `/api/v1/boot/claim`; для локальной отладки quick-boots используют mock payments и логируются в таблицу `events` — смотри `boost_claim` и `boost_activate` события.
- Моковые покупки Stars: сначала вызывай `/api/v1/purchase/invoice` (создаёт запись со статусом `pending`), затем `/api/v1/purchase` для завершения. Вебхук `/api/v1/purchase/webhook` пока заглушка, отдаёт 202 и предназначен для будущей подписи Telegram.
