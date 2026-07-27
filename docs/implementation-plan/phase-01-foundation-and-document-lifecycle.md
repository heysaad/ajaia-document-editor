# Phase 1 — Foundation and Document Lifecycle

## Outcome

Deliver a dependable application shell where a reviewer can choose a demo user, create a document, rename it, see owned documents, reopen them after a refresh, and delete them safely.

This phase establishes the architectural conventions used by every later phase. It deliberately uses a seeded demo-user switcher instead of a full authentication system so effort stays focused on the assessed document workflow.

**Prerequisite:** None. The deployable application and its Git repository are rooted at `src/`; application code, dependencies, scripts, and deployment configuration must be changed there.

## Product decisions

- Use three seeded demo users and store the selected user ID in an HTTP-only cookie.
- Treat the cookie as a demo identity mechanism, not production authentication. Keep identity resolution behind a small boundary so real authentication can replace it later.
- Use PostgreSQL for local and deployed persistence, with Prisma for schema management and migrations.
- Confirm the managed PostgreSQL provider and deployment target before writing the first migration; do not defer storage compatibility to the release phase.
- Use UUIDs for public identifiers.
- Store rich document content as versioned JSON and a derived plain-text excerpt. Phase 1 can create an empty document; Phase 2 owns editing the JSON.
- Use explicit route handlers for mutations and queries. Validate all external input on the server with Zod.
- Return a stable error shape and never expose database errors to the client.

## Scope

### Project and infrastructure

- Review the bundled Next.js 16 documentation in `node_modules/next/dist/docs/` before implementing framework APIs.
- Add and configure shadcn/ui, Prisma, Zod, Vitest, Testing Library, and Playwright.
- Add environment parsing that fails fast when required variables are missing.
- Create `.env.example` with non-secret local setup values.
- Add scripts for type checking, unit tests, integration tests, end-to-end tests, database migration, and seed data.
- Organize code by feature:

  ```text
  src/
    app/
    features/
      auth/
      documents/
    components/ui/
    infra/
      db/
    config/
    test/
  ```

### Data model

- `User`: `id`, `name`, `email`, timestamps.
- `Document`: `id`, `ownerId`, `title`, `contentJson`, `contentText`, `version`, timestamps.
- Add an index for listing an owner's documents by most recently updated.
- Define ownership with a required foreign key and an explicit deletion policy.
- Add an initial migration and an idempotent seed command for demo users.

### Backend

- Implement one identity resolver used by all server-side operations.
- Implement document operations:
  - create with a validated default or supplied title;
  - list owned documents with pagination-ready query parameters;
  - fetch one owned document;
  - rename with trimmed title and length limits;
  - delete with explicit owner authorization.
- Keep database access in the document feature's repository and business rules in its service.
- Use a transaction where a multi-step write could leave inconsistent state.
- Map validation, unauthenticated, forbidden, not-found, conflict, and internal failures to appropriate HTTP status codes.

### Frontend

- Replace the starter screen with a responsive application shell built from shadcn components.
- Add a demo-user switcher that clearly identifies the current user.
- Add an owned-document dashboard with:
  - create-document action;
  - document cards or rows;
  - title, last-updated time, and empty state;
  - rename and delete actions;
  - loading, error, and confirmation states.
- Add a document route that loads an existing document and displays a Phase 2 editor placeholder.
- Preserve keyboard accessibility and visible focus states.

## Validation and tests

### Unit tests

- Title normalization accepts valid titles and rejects empty, whitespace-only, and over-limit values.
- Service operations enforce ownership.
- Identity resolution rejects a missing or unknown user.
- Error mapping produces the expected stable response shape.

### Integration tests

- Seed is idempotent.
- A created document persists and appears in the owner's list.
- Rename updates the title and timestamp.
- One user cannot fetch, rename, or delete another user's document.
- Deleting a document removes it without affecting other documents.

### UI and end-to-end tests

- A reviewer can switch users.
- A reviewer can create, rename, reopen, and delete a document.
- Refreshing the dashboard does not lose persisted documents.
- Empty, loading, validation-error, and server-error states are usable.

## Acceptance criteria

- The app starts from documented commands against a clean database.
- Seeded users are available without manual database edits.
- Document ownership is enforced server-side, not only hidden in the UI.
- Create, list, fetch, rename, and delete work after a browser refresh.
- Automated tests cover happy paths, authorization failures, invalid input, and missing records.
- `lint`, type checking, tests, and production build pass.

## Excluded until later

- Rich-text editing and autosave.
- File import.
- Sharing and shared-document lists.
- Real-time multi-user editing.
- Production-grade authentication.

## Main risks and mitigations

- **Framework-version mismatch:** consult the installed Next.js 16 docs before using route, cookie, caching, or request APIs.
- **Demo auth accidentally trusted as secure:** label it in the UI and README, centralize it, and enforce authorization independently on every operation.
- **Deployment database mismatch:** use PostgreSQL locally and in deployment so development does not depend on SQLite-only behavior.
