# Ajai Docs

A lightweight, full-stack rich-text document editor built with Next.js 16,
PostgreSQL, Prisma, shadcn-style UI components, and Tiptap.

## What is included

- Three seeded users with an HTTP-only session cookie.
- Server-enforced document ownership.
- Create, list, reopen, rename, and delete workflows.
- Rich-text paragraphs, headings, bold, italic, underline, and lists.
- Debounced autosave with visible saved, saving, error, and conflict states.
- Optimistic concurrency that prevents stale edits from overwriting newer data.
- Downloadable local JSON when a conflict needs manual recovery.

The selectable-user session is isolated behind replaceable identity interfaces,
so a production authentication provider can replace it without changing
document business rules.

## Local setup

Requirements:

- Node.js 20 or newer.
- PostgreSQL 15 or newer.

From this `src/` directory:

```bash
npm install
```

Copy `.env.example` to `.env` and replace `DATABASE_URL` with a connection
string for an empty PostgreSQL database:

```dotenv
DATABASE_URL="postgresql://user:password@localhost:5432/ajai_docs?schema=public"
SESSION_COOKIE_NAME="ajai_session"
```

Prepare the database and start the application:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), select an account, and
create a document. The seed command is idempotent and can be run repeatedly.

## Architecture

Application code is grouped by feature. Document rules are independent of
Next.js and Prisma:

- `DocumentService` depends on `IDocumentRepository`.
- `IdentityService` depends on session-store and user-lookup interfaces.
- Prisma and Next.js cookies are production adapters composed in server-only
  modules.
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

1. Create a Neon database and set `DATABASE_URL` in Vercel.
2. Run `npm run db:migrate` and `npm run db:seed` against the production
   connection.
3. Deploy the `src/` project with the standard `npm run build` command.

File import, sharing, real authentication, automatic conflict merging, and
real-time collaboration are intentionally deferred to later phases.
