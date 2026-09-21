# Mini Project Task Tracker

A focused project and task tracker for turning small goals into clear next actions and visible progress.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/mini-project-tracker/src/App.tsx` — responsive dashboard, projects, project detail, and task list UI
- `artifacts/mini-project-tracker/src/index.css` — shared visual theme and interaction styles
- `lib/api-spec/openapi.yaml` — source of truth for project, task, and dashboard API contracts
- `lib/db/src/schema/projects.ts` and `lib/db/src/schema/tasks.ts` — persisted data models
- `artifacts/api-server/src/routes/` — dashboard, project, and task API handlers

## Architecture decisions

- The frontend uses generated React Query hooks from the OpenAPI contract rather than hand-written fetch calls.
- Projects and tasks use calendar dates for deadlines and timestamps for audit fields.
- Project progress is derived from completed tasks and safely returns 0% when a project has no tasks.
- Deleting a project cascades to its tasks at the database level.

## Product

- Dashboard with completion, in-progress, due-today, overdue, and project-progress summaries
- Project creation and editing with scope, outcome, category, and target dates
- Task creation, editing, deletion, duplication, inline completion, search, filtering, and sorting
- Responsive desktop/mobile layout with helpful empty and loading states

## User preferences

No additional preferences recorded.

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after changing the OpenAPI contract.
- Run `pnpm run typecheck` after backend or generated-client changes.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
