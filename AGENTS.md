# Repository Guidelines

## Project Structure & Module Organization
- `src/` houses the Next.js + TypeScript app: routes in `src/app`, shared UI in `src/components`, background jobs in `src/services`.
- Common helpers live in `src/lib` and `src/utils`; import them through the `@/` alias. Types reside in `src/types`, translations in `src/locales`.
- Database schemas and migrations stay under `prisma/`; keep generated Prisma client artifacts out of git.
- Automation scripts live in `scripts/`, operational docs in `docs/`, Playwright suites in `tests/`, and static assets in `public/`.

## Build, Test, and Development Commands
- `npm run dev` (or `npm run dev:next`) boots the local server with hot reload.
- `npm run build` runs Prisma generate/migrate deploy before compiling Next; run it in CI and ahead of releases.
- `npm run start` serves the production bundle.
- `npm run lint`, `npm run format:check`, and `npm run typecheck` enforce linting, formatting, and type safety.
- `npm run test:e2e` executes Playwright; add `--ui` or `--debug` for flaky specs. `npm run perf:lighthouse` checks lighthouse KPIs.

## Coding Style & Naming Conventions
- Write TypeScript with 2-space indentation, camelCase for logic, PascalCase for React components, kebab-case for static assets.
- Use Prettier (`npm run format`) and the Next.js ESLint config; resolve lint warnings before merging.

## Testing Guidelines
- End-to-end flows live in `tests/e2e`; mirror route names (e.g., `tests/e2e/models/`).
- Performance checks reside in `tests/performance`; run them before large UI or data changes.
- Default `npm test` is a stub; add focused Vitest or Jest specs for complex utilities and services when needed.
- Refresh fixtures in `data/` and seed logic in `prisma/seed.ts` whenever API contracts change.

## Commit & Pull Request Guidelines
- Follow conventional prefixes (`feat`, `fix`, `debug`) and keep subject lines under ~70 characters.
- Capture the “why” in commit bodies, reference tickets, and reserve `[skip ci]` for doc-only updates.
- PRs should include a summary, validation results (commands + outcomes), linked issues, and screenshots or Loom links for UI changes.
- Call out migrations or config changes directly in the PR description.

## Security & Configuration Tips
- Keep secrets in `.env.*` files and commit placeholders like `API_KEY=replace-me` instead of real credentials.
- Mirror new MCP or worker commands inside `~/.codex/config.toml` under unique `[mcp_servers.*]` entries.
- Point `DATABASE_URL` at staging when running `npm run db:migrate` locally; promotion happens through CI.
