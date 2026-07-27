# Development setup

## Prerequisites

- Node.js 20 or later
- Docker Desktop, for the local PostgreSQL database

## Install and run

Run all commands from the `src/` directory.

```bash
npm install
npm run infra:up
```

Create a local environment file:

```powershell
Copy-Item .env.example .env
```

On macOS or Linux:

```bash
cp .env.example .env
```

The provided `.env.example` connects to the PostgreSQL container started by
`npm run infra:up`. Change the secrets before sharing an environment or using
anything other than local development.

Generate the Prisma client, apply migrations, seed the local data, and start
the development server:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

The application is available at http://localhost:3000. `npm run dev` also
applies pending migrations before starting.

## Database utilities

```bash
npm run infra:logs  # Follow PostgreSQL logs
npm run infra:down  # Stop PostgreSQL; preserves the Docker volume
```

To use PostgreSQL outside Docker, do not run `infra:up`; instead, set
`DATABASE_URL` in `.env` to the target database. The database must have the
Prisma migrations applied before starting the app.

## Checks and tests

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run test:integration
npx playwright install chromium
npm run test:e2e
npm run build
```

Integration and end-to-end tests need a migrated, seeded database referenced
by `DATABASE_URL`. End-to-end tests start the development server automatically
when one is not already running.
