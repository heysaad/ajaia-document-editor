# Phase 3 — File Import

## Outcome

Allow a reviewer to upload a relevant file and turn it into a new editable document with predictable validation, conversion, and failure handling.

**Prerequisite:** Phase 2 is complete so imported content can use the same validated document schema and be verified in the working editor.

## Product decisions

- Support `.txt` and `.md` files in the first release.
- Import creates a new document rather than replacing an open draft, avoiding accidental data loss.
- Limit uploads to 1 MiB and clearly state supported types and size in the UI and README.
- Parse Markdown with a maintained parser, convert only supported constructs into the editor schema, and treat embedded HTML as plain text or remove it.
- Use the file name without its extension as the initial document title.
- Do not store the original upload after conversion.

## Scope

### Backend

- Implement a multipart import endpoint in the document feature.
- Verify:
  - authenticated identity;
  - exactly one file;
  - allowed extension;
  - allowed MIME type as a secondary signal;
  - maximum byte size;
  - valid UTF-8 text;
  - non-empty usable content.
- Do not trust the client-supplied MIME type or file name.
- Normalize unsafe file names before deriving a title.
- Convert:
  - plain text into paragraphs while preserving line breaks reasonably;
  - Markdown paragraphs, headings, emphasis, strong text, and ordered/unordered lists into supported Tiptap JSON.
- Ignore or safely flatten unsupported Markdown constructs while preserving readable text where possible.
- Validate converted content through the same schema used by normal editor saves.
- Create the document only after conversion succeeds so failed imports leave no partial record.

### Frontend

- Add an import action to the owned-document dashboard.
- Build a shadcn dialog/dropzone with:
  - file picker;
  - supported-format and size guidance;
  - selected-file summary;
  - progress/pending state;
  - accessible error messaging;
  - cancel and retry behavior.
- After success, navigate to the imported document editor.
- Show actionable messages for wrong type, oversized file, encoding failure, empty file, parse failure, and server failure.
- Ensure keyboard-only users can complete the workflow.

## Validation and tests

### Unit tests

- File-name normalization handles paths, multiple extensions, whitespace, and unusual characters.
- Text conversion handles blank lines, CRLF, Unicode, and trailing newlines.
- Markdown conversion covers all supported formatting.
- Unsupported HTML and links cannot inject executable markup.
- Size, extension, MIME, empty-file, and UTF-8 validation produce stable errors.

### Integration tests

- Valid `.txt` and `.md` files create owner-scoped documents.
- Imported formatting persists and reopens in the editor.
- Invalid files do not create a document.
- A valid extension with misleading binary content is rejected.
- An unauthenticated import is rejected.
- Two files in one request are rejected.

### UI and end-to-end tests

- A reviewer can import both supported file types and edit the result.
- The UI blocks obvious wrong types and still handles server-side rejection.
- Oversized, empty, and malformed files display clear recovery guidance.
- Cancelling the dialog does not create a document.

## Acceptance criteria

- Supported types and the 1 MiB limit are visible before file selection.
- Importing a valid `.txt` or `.md` file creates exactly one editable owned document.
- Supported Markdown formatting is preserved in the rich-text editor.
- Invalid uploads cannot leave partial data or execute embedded content.
- Import errors are specific, accessible, and recoverable.
- `lint`, type checking, tests, and production build pass.

## Excluded

- `.docx`, PDF, image, and binary attachment support.
- Original-file retention and attachment management.
- Importing into or replacing an existing document.
- Remote URL imports.

## Main risks and mitigations

- **Content injection:** never render uploaded HTML directly; convert to the strict editor schema.
- **Memory pressure:** enforce request and byte limits before expensive parsing.
- **Markdown fidelity expectations:** document the supported subset and preserve readable text for unsupported constructs.
