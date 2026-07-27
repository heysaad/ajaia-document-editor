# Ajai Docs

A lightweight, full-stack rich-text document editor built with Next.js 16,
PostgreSQL, Prisma, shadcn-style UI components, and Tiptap.

## What is included

- Better Auth email/password registration, login, database sessions, and logout.
- Three seeded reviewer accounts.
- Server-enforced document ownership.
- Create, list, reopen, rename, and delete workflows.
- Rich-text paragraphs, headings, bold, italic, underline, and lists.
- Debounced autosave with visible saved, saving, error, and conflict states.
- Optimistic concurrency that prevents stale edits from overwriting newer data.
- Downloadable local JSON when a conflict needs manual recovery.

## Local setup

Requirements:

- Node.js 20 or newer.
- Docker Desktop (recommended), or PostgreSQL 15 or newer.

From this `src/` directory:

```bash
npm install
```

Start the local PostgreSQL service and copy the matching environment file:

```bash
npm run infra:up
```

```powershell
Copy-Item .env.example .env
```

On macOS or Linux, use `cp .env.example .env` instead. The default connection
is:

```dotenv
DATABASE_URL="postgresql://ajai:local_dev_password@localhost:5432/ajai_docs?schema=public"
BETTER_AUTH_SECRET="replace-with-at-least-32-random-characters"
BETTER_AUTH_URL="http://localhost:3000"
DEMO_USER_PASSWORD="replace-with-a-strong-demo-password"
```

Prepare the database and start the application:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in or create an
account. The seed command is idempotent and can be run repeatedly. It creates:

- `maya@example.com`
- `jordan@example.com`
- `avery@example.com`

All three use the `DEMO_USER_PASSWORD` value from `.env`.

The initial migration includes the complete Better Auth schema and intentionally
does not support upgrading the earlier demo-cookie database. If that schema was
already applied, recreate the local database before running `db:migrate`.

The PostgreSQL data is stored in the named Docker volume
`ajai-docs_postgres-data`, so `npm run infra:down` stops the service without
deleting local data. Use `npm run infra:logs` to follow database logs. To use an
existing PostgreSQL installation instead, skip `infra:up` and set
`DATABASE_URL` in `.env` to that database.

## Architecture

Application code is grouped by feature. Document rules are independent of
Next.js and Prisma:

- `DocumentService` depends on `IDocumentRepository`.
- Better Auth owns password hashing and session persistence through its Prisma
  adapter.
- Server components and route handlers resolve the Better Auth session through
  one server-only helper.
- Route handlers only parse HTTP input, resolve identity, call a service, and
  map errors.
- Tiptap content validation and plain-text derivation are pure functions.
- The editor depends on `DocumentSaveClientPort`; its fetch implementation can
  be replaced by a fake in unit tests.

The database stores Tiptap JSON as the canonical document body, a derived text
preview, and an integer version. Content updates use a conditional
`id + ownerId + expectedVersion` write and increment the version atomically.

## Validation limits

- Titles: 120 characters.
- List page size: 20 by default, 50 maximum.
- Content JSON: 256 KiB.
- Total text: 100,000 characters.
- Nesting: 20 levels.
- Only the nodes, marks, and attributes enabled by the editor are accepted.

## Tests and quality checks

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run test:integration
npm run build
npx playwright install chromium
npm run test:e2e
```

Integration and E2E tests require `DATABASE_URL` to reference a migrated,
seeded test database. The repository integration suite creates and removes only
its own fixed test records. The E2E suite creates a document through the UI and
deletes it before finishing.

## Deployment

The intended deployment is Vercel with Neon PostgreSQL:

1. Create a Neon database and set `DATABASE_URL`, `BETTER_AUTH_SECRET`,
   `BETTER_AUTH_URL`, and `DEMO_USER_PASSWORD` in Vercel.
2. Run `npm run db:migrate` and `npm run db:seed` against the production
   connection.
3. Deploy the `src/` project with the standard `npm run build` command.

File import, sharing, password recovery, email verification, OAuth, automatic
conflict merging, and real-time collaboration are intentionally deferred.
