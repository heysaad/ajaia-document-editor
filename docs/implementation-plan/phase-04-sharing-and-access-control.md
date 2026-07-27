# Phase 4 — Sharing and Access Control

## Outcome

Enable an owner to grant another seeded user access to a document, while making owned and shared documents visibly distinct and enforcing permissions on every server operation.

**Prerequisite:** Phases 1–3 are complete, including centralized identity, owner authorization, versioned saves, and the owned-document dashboard.

## Product decisions

- Share with existing seeded users selected by email; do not build invitations or outbound email.
- A share grants `EDITOR` access. The owner remains the only user who can rename, delete, or manage sharing.
- Shared editors can open and edit document content.
- Prevent owners from sharing with themselves and prevent duplicate shares.
- Owners can revoke access at any time.
- Real-time collaborative editing is out of scope; the Phase 2 version-conflict behavior protects against silent overwrites.

## Scope

### Data model

- Add `DocumentShare`: `documentId`, `userId`, `role`, timestamps.
- Use a composite unique constraint on document and user.
- Index shared-document lookup by user and recent document activity.
- Cascade shares when a document is deleted.
- Add and verify a migration without rewriting existing documents.

### Backend

- Centralize document authorization in a policy that returns:
  - owner access;
  - shared-editor access;
  - no access.
- Update fetch and content-save operations to allow owners and shared editors.
- Keep rename, delete, grant, list shares, and revoke owner-only.
- Add operations to:
  - list eligible seeded users;
  - list current shares;
  - grant access by normalized email/user ID;
  - revoke access;
  - list documents shared with the current user.
- Make grant behavior deterministic under duplicate/concurrent requests.
- Do not reveal whether unrelated documents or users exist through authorization error detail.

### Frontend

- Split the dashboard into clear `Owned by me` and `Shared with me` sections.
- Mark shared items with owner identity and shared status.
- Add an owner-only share dialog with:
  - user selection/search;
  - current-access list;
  - grant pending/error/success states;
  - revoke confirmation.
- Hide or disable owner-only actions for shared documents, while still relying on server authorization.
- Show a clear access-revoked/not-found state if a shared editor loses access while viewing.
- Identify the owner in the editor header.

## Permission matrix

| Action | Owner | Shared editor | Other user |
| --- | --- | --- | --- |
| List in relevant dashboard section | Yes | Yes | No |
| Open document | Yes | Yes | No |
| Edit content | Yes | Yes | No |
| Rename | Yes | No | No |
| Delete | Yes | No | No |
| View/manage shares | Yes | No | No |

## Validation and tests

### Unit tests

- Authorization policy returns correct permissions for owner, shared editor, and unrelated user.
- Self-share and duplicate-share rules are enforced.
- Email normalization is deterministic.
- Revocation is owner-only.

### Integration tests

- A granted user sees the document in `Shared with me`, but not `Owned by me`.
- A shared editor can fetch and save content.
- A shared editor cannot rename, delete, grant, list, or revoke shares.
- An unrelated user cannot discover or access the document.
- Revocation immediately prevents future fetches and saves.
- Duplicate or concurrent grant requests create one share.
- Deleting a document removes its shares.
- Version conflicts still work between owner and shared editor.

### UI and end-to-end tests

- The owner shares a document, switches users, and opens it from the shared section.
- Shared and owned documents are visually unambiguous.
- Shared editors see only permitted controls.
- The owner can revoke access and the former editor receives an appropriate state.
- Empty shared-document and no-eligible-user states are usable.

## Acceptance criteria

- A reviewer can demonstrate the full share flow using seeded accounts.
- Ownership and shared access are visibly distinct on the dashboard and editor.
- The permission matrix is enforced server-side for every relevant operation.
- Duplicate, self, unauthorized, and revoked access cases are tested.
- Concurrent editing never silently overwrites a newer version.
- `lint`, type checking, tests, and production build pass.

## Excluded

- Public links and anonymous access.
- Email invitations and unregistered recipients.
- Viewer/commenter roles.
- Ownership transfer.
- Presence, live cursors, comments, and real-time synchronization.

## Main risks and mitigations

- **Authorization scattered across handlers:** use one feature-level access policy and test the complete permission matrix.
- **Demo identity confusion:** visibly show the active user and document owner.
- **Concurrent overwrites:** retain optimistic concurrency and conflict recovery from Phase 2.
