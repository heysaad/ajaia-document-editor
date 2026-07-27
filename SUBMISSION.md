# Ajai Docs - Assessment Submission

## Links

- Repository: <https://github.com/heysaad/ajaia-document-editor>
- Local application: <http://localhost:3000>
- Live deployment: 

## Overview

Ajai Docs is a lightweight full-stack rich-text document editor. I prioritized a
coherent, reliable single-user document workflow: secure authentication,
persistent documents, browser-based rich-text editing, safe file import, and
clear save feedback.

## Delivered functionality

- Email/password sign-up, sign-in, sign-out, and database-backed sessions via
  Better Auth.
- Seeded reviewer accounts for Maya, Jordan, and Avery; each uses the
  `DEMO_USER_PASSWORD` set in `.env`.
- Create, list, open, rename, and delete documents.
- Rich-text editing with headings, bold, italic, underline, bulleted lists, and
  numbered lists, powered by Tiptap.
- Debounced autosave with visible saving, saved, error, and conflict states.
- Optimistic concurrency control: stale writes cannot overwrite a newer
  document version, and the editor offers a downloadable JSON recovery copy.
- Import of a single UTF-8 `.txt` or `.md` file (up to 1 MiB) into a new,
  editable document. Markdown is converted to the supported editor structure.
- PostgreSQL persistence through Prisma. Tiptap JSON is stored as the
  canonical document content, with derived plain text for dashboard previews.
- Validation and consistent API error responses for invalid content, titles,
  files, authentication, and unauthorized document access.

## Architecture

The codebase is organized by feature (`auth`, `documents`,
`document-editing`, and `document-import`) with infrastructure separated into
HTTP, database, and dependency-injection modules. Route handlers stay thin:
they validate requests, resolve the authenticated identity, call application
services, and map errors to HTTP responses. `DocumentService` depends on an
`IDocumentRepository`, keeping business rules independent of Prisma and making
them straightforward to test.

## Run locally

Requirements: Node.js 20+, Docker Desktop (or PostgreSQL 15+).

```bash
cd src
npm install
npm run infra:up
```

Copy `.env.example` to `.env`, provide a strong `BETTER_AUTH_SECRET` and
`DEMO_USER_PASSWORD`, then run:

```bash
npm run db:generate
npm run db:seed
npm run dev
```

Open <http://localhost:3000>.

## Quality checks

The project includes unit tests for document validation and service rules,
autosave state, HTTP error mapping, import parsing and validation, UI controls,
and authentication forms; it also includes repository integration tests and
Playwright document-lifecycle coverage.

## Deferred enhancements

- Live deployment (the application is deployment-ready for Vercel + Neon as
  described in the README).
- Real-time multi-user collaboration and automatic conflict merging.
- OAuth, email verification, password recovery, and richer import formats such
  as `.docx`.
