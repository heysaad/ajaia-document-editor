# Phase 5 — Hardening, Documentation, and Deployment

## Outcome

Convert the completed feature set into a reviewer-ready release with verified behavior, secure defaults, observability, complete documentation, and a working deployment.

**Prerequisite:** Phases 1–4 meet their acceptance criteria. Deployment compatibility was selected in Phase 1; this phase validates and releases it rather than discovering the storage model here.

## Scope

### Product polish

- Audit responsive layouts at mobile, tablet, and laptop widths.
- Ensure all screens have coherent loading, empty, error, and retry states.
- Standardize copy, timestamps, destructive confirmations, and notifications.
- Verify focus management for dialogs and editor controls.
- Run keyboard-only and automated accessibility checks on primary flows.
- Add a concise in-product note explaining demo users and supported imports.

### Reliability and security

- Review every route for authentication, authorization, validation, request-size limits, and safe error output.
- Apply appropriate security headers.
- Ensure document content is never rendered as untrusted HTML.
- Confirm secrets remain server-only and `.env*` files containing secrets are ignored.
- Add structured server logging with request correlation, action name, outcome, and safe identifiers.
- Avoid logging document bodies, uploads, cookies, emails, or secrets.
- Add database connection and migration failure guidance.
- Confirm timestamps and save-version behavior are consistent.
- Add rate limiting only if supported reliably by the chosen deployment platform; otherwise document it as a production follow-up rather than adding an in-memory illusion.

### Test completion

- Review the requirements-to-tests traceability and fill gaps.
- Add end-to-end coverage for the critical reviewer journey:
  1. select owner;
  2. create and rename a document;
  3. apply each formatting type;
  4. refresh and reopen;
  5. import Markdown;
  6. share with another user;
  7. switch user and edit the shared document;
  8. revoke access and verify denial.
- Cover cross-cutting edge cases:
  - missing/invalid identity;
  - malformed identifiers and request bodies;
  - database failures;
  - duplicate submissions;
  - stale document versions;
  - revoked access during editing;
  - file boundary sizes and invalid encodings.
- Keep unit and integration tests deterministic and isolate database state.
- Run the full verification matrix from a clean install and clean database.

### Documentation

- Replace the starter README with:
  - product overview and screenshots;
  - supported features and explicit non-goals;
  - prerequisites;
  - environment variables;
  - install, database, seed, dev, test, build, and start commands;
  - seeded demo accounts and reviewer walkthrough;
  - supported upload types and 1 MiB limit;
  - troubleshooting and reset guidance;
  - deployed URL.
- Add an architecture note explaining:
  - feature-folder structure;
  - request/data flow;
  - data model;
  - document JSON and versioning;
  - authorization policy;
  - file-conversion safety;
  - deliberate tradeoffs and production follow-ups.
- Add a requirement traceability table linking each assignment requirement to implementation and automated tests.

### Deployment

- Provision managed PostgreSQL for preview/production.
- Configure deployment environment variables through the platform rather than committed files.
- Run production migrations as an explicit release step.
- Seed demo users safely and idempotently.
- Deploy the production build and run smoke tests against the public URL.
- Confirm data survives refresh and a new deployment/runtime instance.
- Document rollback for application and schema changes.

## Release gates

- **Functionality:** every assignment capability passes its acceptance path.
- **Authorization:** the Phase 4 permission matrix passes at service, route, and end-to-end levels.
- **Data integrity:** persistence, version conflicts, imports, and cascades are verified.
- **Quality:** lint, type checking, unit tests, integration tests, end-to-end tests, and production build pass.
- **Usability:** primary flows work with keyboard and at supported viewport sizes.
- **Operations:** migrations, seed, logs, environment validation, deployment, and smoke checks are documented and proven.
- **Communication:** README and architecture note accurately describe implemented behavior and limitations.

## Acceptance criteria

- A public deployment URL is usable by reviewers without private setup.
- The complete reviewer journey succeeds in the deployed environment.
- Documents, formatting, and sharing persist across refreshes and runtime restarts.
- No known high-severity authorization, content-injection, or data-loss issue remains.
- Setup succeeds from a clean checkout by following the README only.
- The architecture note explains priorities, tradeoffs, and omitted features honestly.
- All automated verification commands pass, and their commands are documented.

## Explicit production follow-ups

These are not required for the assessment release unless time remains:

- Replace demo identity with a trusted authentication provider and secure sessions.
- Add CSRF protections appropriate to the final auth/request model.
- Add distributed rate limiting, audit logs, backups, and monitoring alerts.
- Add revision history and recovery.
- Add richer import formats such as `.docx`.
- Add real-time collaboration backed by an operational-transform or CRDT design.

## Main risks and mitigations

- **Deployment discovered too late:** configure a production-like PostgreSQL path in Phase 1 and test deployment before final polish if credentials are available.
- **README diverges from behavior:** generate commands from actual package scripts and perform a clean-setup rehearsal.
- **Flaky end-to-end tests:** use deterministic seed data, stable selectors, isolated test records, and explicit waits on user-visible state.
