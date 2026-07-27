# Phase 2 — Rich-Text Editor and Saving

## Outcome

Turn the document route into a coherent browser editor supporting the required formatting, reliable saving, refresh-safe reopening, and clear recovery behavior.

**Prerequisite:** Phase 1 is complete, including identity resolution, document ownership, persistence, test tooling, and a passing production build.

## Product decisions

- Use Tiptap as the editor engine and its structured JSON as the canonical document representation.
- Enable paragraphs, headings, bold, italic, underline, bullet lists, numbered lists, list items, and history.
- Sanitize and schema-validate content on the server even though the editor produces structured JSON.
- Autosave after a short debounce and also expose save state: `Saving`, `Saved`, or `Save failed`.
- Use optimistic concurrency with the document `version`; do not silently overwrite a newer server version.
- Preserve the last confirmed server state when a save fails and allow retry.

## Scope

### Backend

- Define a versioned document-content schema with limits for:
  - total serialized size;
  - nesting depth;
  - node types;
  - text length;
  - supported marks and attributes.
- Implement update-content with:
  - authenticated identity;
  - owner authorization;
  - schema validation;
  - expected-version comparison;
  - atomic version increment;
  - updated timestamp;
  - derived plain text for dashboard previews and later search.
- Return `409 Conflict` with the latest server version when the expected version is stale.
- Ensure fetch responses include title, content, version, ownership metadata, and timestamps.

### Frontend

- Build small components within `features/document-editing`, including:
  - editor canvas;
  - formatting toolbar;
  - title field;
  - save-status indicator;
  - conflict/error banner;
  - document header and back navigation.
- Use shadcn tooltips, buttons, dropdowns, and alerts consistently.
- Support:
  - bold;
  - italic;
  - underline;
  - heading levels or text-size variation;
  - bulleted lists;
  - numbered lists;
  - undo and redo as a usability enhancement.
- Reflect active formatting state in toolbar controls.
- Add keyboard shortcuts and accessible control labels.
- Debounce saves, flush pending changes when appropriate during navigation, and cancel stale in-flight responses.
- Keep the editor usable on common laptop and mobile widths.

### Conflict behavior

- If the server reports a stale version, pause autosave.
- Tell the user that a newer copy exists.
- Offer:
  - reload the server copy; or
  - copy/download the unsaved local content before reloading.
- Do not implement automatic document merging in this assessment.

## Validation and tests

### Unit tests

- The content schema accepts each supported node and mark.
- Unsupported nodes, invalid nesting, excessive content, and malformed JSON are rejected.
- Plain-text derivation handles headings, paragraphs, and lists.
- Debounce logic coalesces rapid changes.
- Save-state transitions cover idle, saving, saved, error, retry, and conflict.

### Integration tests

- Valid formatted content persists and reopens unchanged.
- An unauthorized user cannot update content.
- A stale expected version returns a conflict and does not overwrite current content.
- Successful saves increment the version exactly once.
- Invalid or oversized documents do not alter stored content.

### UI and end-to-end tests

- Each required toolbar action changes the document and persists after refresh.
- Keyboard formatting shortcuts work.
- Rapid typing results in a bounded number of writes.
- A failed save is visible and can be retried.
- A simulated concurrent update produces the conflict experience.
- Title changes and body changes can occur without losing either.

## Acceptance criteria

- A reviewer can format text with every required formatting option.
- Formatting and structure survive save, route navigation, and refresh.
- Save progress and errors are always visible without interrupting typing.
- The server rejects unsupported or unsafe content.
- Concurrent edits cannot silently overwrite a newer stored version.
- Accessibility checks cover toolbar names, keyboard use, focus order, and contrast.
- `lint`, type checking, tests, and production build pass.

## Excluded until later

- File import.
- Sharing.
- Presence indicators, cursors, comments, and real-time co-editing.
- Automatic conflict merging and revision history.

## Main risks and mitigations

- **Editor/client hydration issues:** isolate Tiptap in a focused client component and keep data loading and authorization on the server.
- **Data corruption from arbitrary JSON:** validate against a strict, versioned schema and test round trips.
- **Lost edits during races:** use request sequencing plus optimistic concurrency, and make failures recoverable.
