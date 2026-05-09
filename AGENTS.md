# Repository Guidelines

## Project Structure & Module Organization

This monorepo keeps runtime concerns split by package. `packages/core` holds Codex rollout ingest, workspace grouping, manual rename, delete, local state, and Codex writeback logic. `packages/shared` contains shared DTOs and schemas. User-facing entry points live in `packages/api`, `packages/cli`, and `packages/web`. Specs and design notes live under `docs/`; automated tests live in `test/`; helper scripts such as hook and UI launchers live in `scripts/`.

## Build, Test, and Development Commands

- `npm install` — install dependencies and run `prepare` to install Lefthook.
- `npm run lint` — run ESLint with zero warnings allowed.
- `npm run build` — compile all TypeScript project references.
- `npm run build:runtime` — build shared/core/api/cli without the web bundle.
- `npm run web` / `npm run api` / `npm run serve` — start local surfaces for development.
- `npm run web:build` — build the Vite dashboard.
- `npm test` or `npm run test:watch` — run the Vitest suite.
- `npm run validate:full` — CI-equivalent check used before push.

## Coding Style & Naming Conventions

Use TypeScript ESM, 2-space indentation, double quotes, and semicolons to match the existing codebase. Keep business rules in `packages/core` and shared types in `packages/shared`; Web/API/CLI should consume DTOs instead of duplicating writeback logic. React components use `PascalCase.tsx` (for example, `SessionBrowser.tsx`). Hooks start with `use*`. Core modules use descriptive kebab-case names such as `session-index.ts`, `codex-state.ts`, and `rollout.ts`.

## Testing Guidelines

Vitest runs in a Node environment and picks up `test/**/*.test.ts`. Add or update regression tests for rename semantics, config parsing, API contract changes, and UI state derivation when practical. No numeric coverage gate is enforced, but behavior changes should ship with matching tests.

## Commit & Pull Request Guidelines

Recent history follows Conventional Commit style, for example `feat(core): ...`, `feat(web): ...`, `test: ...`, and `docs: ...`. Keep changes small and reviewable; separate UI polish, refactors, and semantic behavior changes when possible. PRs should explain user-visible impact, note any doc updates, and include screenshots for Web UI changes.

## Local-First & JJ Workflow Notes

This project is local-first: prefer updating logic around Codex rollout files, `session_index.jsonl`, and `state_*.sqlite` writeback instead of patching Codex internals. Before pushing, run `npm run validate:full`.
