# WealthPilot

Personal financial management + budgeting + investment portfolio tracking —
a Nigeria-first (NGN), single financial command center. Built in phases:
foundation → core budgeting MVP → financial goals → investment portfolio →
intelligence (allocation/news) → forecasting, with notifications, an AI
assistant, and bank/brokerage integrations designed for but deferred to
later phases.

## Tech stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Database**: Postgres via [Supabase](https://supabase.com), accessed with [Drizzle ORM](https://orm.drizzle.team)
- **Auth**: Supabase Auth (`@supabase/ssr`)
- **UI**: Tailwind CSS v4 + shadcn/ui (Base UI primitives)
- **Forms/validation**: react-hook-form + Zod
- **Testing**: Vitest (unit) + Playwright (e2e)

> Next.js 16 renamed `middleware.ts` to `proxy.ts` — route protection lives
> in [src/proxy.ts](src/proxy.ts), not a `middleware.ts` file.

## Prerequisites

- Node.js 22+ and npm
- A [Supabase](https://supabase.com) project (free tier is fine)

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the env template and fill in real values from your Supabase
   project's **Settings → API** and **Settings → Database**:

   ```bash
   cp .env.example .env.local
   ```

   - Use the **Connection Pooling** tab's connection strings for both `DATABASE_URL` (transaction mode, port 6543, `?pgbouncer=true&connection_limit=1`) and `DIRECT_URL` (session mode, port 5432, used only for migrations).
   - Don't use the "direct connection" host (`db.<ref>.supabase.co`) — it's IPv6-only on Supabase's free tier and will fail with `ENOTFOUND` on networks without outbound IPv6.

3. Apply the database schema:

   ```bash
   npm run db:migrate
   ```

4. Open the Supabase SQL Editor and run
   [`supabase/migrations/0001_rls_and_triggers.sql`](supabase/migrations/0001_rls_and_triggers.sql)
   once. This sets up the trigger that auto-creates a `profiles` row on
   signup, plus Row Level Security policies (defense-in-depth — the app
   itself enforces user isolation in application code, since its DB
   connection bypasses RLS; see the comment at the top of that file).

5. Seed system categories (once Phase 1 lands `db:seed`'s content):

   ```bash
   npm run db:seed
   ```

6. Run the dev server:

   ```bash
   npm run dev
   ```

   Visit [http://localhost:3000](http://localhost:3000).

## Scripts

| Script                | Purpose                                           |
| --------------------- | ------------------------------------------------- |
| `npm run dev`         | Start the dev server                              |
| `npm run build`       | Production build                                  |
| `npm run lint`        | ESLint                                            |
| `npm run typecheck`   | Generate Next.js route types, then `tsc --noEmit` |
| `npm run format`      | Prettier (writes)                                 |
| `npm run test`        | Vitest unit tests                                 |
| `npm run test:e2e`    | Playwright e2e tests                              |
| `npm run db:generate` | Generate a Drizzle migration from schema changes  |
| `npm run db:migrate`  | Apply pending migrations                          |
| `npm run db:studio`   | Open Drizzle Studio (DB browser)                  |
| `npm run db:seed`     | Seed system data (categories, etc.)               |

## Project structure

```
src/
├── app/                  Next.js routes
│   ├── (auth)/           login, signup, forgot/reset password
│   ├── (dashboard)/      protected app shell + feature pages
│   └── api/v1/           versioned HTTP API (Route Handlers)
├── server/
│   ├── db/               Drizzle schema + client
│   ├── supabase/         server & browser Supabase clients
│   ├── services/         domain logic (added per phase)
│   ├── repositories/      DB access per entity (added per phase)
│   ├── providers/         mock/live adapters for external financial data
│   ├── events/emit.ts     domain event stub (feeds Phase 6 notifications)
│   └── audit/log.ts       audit trail writer
├── components/            shadcn/ui primitives + feature components
├── lib/                   money, provenance, validation, env
└── proxy.ts               session refresh + route protection
supabase/migrations/       hand-written SQL (RLS policies, triggers)
drizzle/                   generated SQL migrations (do not hand-edit)
```

## Data provenance

Every monetary/derived figure the API returns is tagged as `actual`,
`current`, `estimated`, `projected`, or `ai_interpretation` (see
[src/lib/provenance.ts](src/lib/provenance.ts)) so the UI can show users
where a number came from instead of presenting everything as equally
certain.

## Status

Phase 0 (foundation) in progress.
