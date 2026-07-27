import { describe, expect, it } from "vitest";

import {
  getImportFileExtension,
  normalizeImportedDocumentTitle,
} from "@/features/document-import/server/import-file-name";

describe("import file name helpers", () => {
  it("removes paths, the final extension, and excess whitespace", () => {
    expect(
      normalizeImportedDocumentTitle("C:\\fakepath\\  Quarterly review.final.md  "),
    ).toBe("Quarterly review.final");
  });

  it("keeps intermediate extensions and strips unsafe characters", () => {
    expect(
      normalizeImportedDocumentTitle("../unsafe/<roadmap>|v2?.txt"),
    ).toBe("roadmap v2");
  });

  it("returns undefined when no usable title remains", () => {
    expect(normalizeImportedDocumentTitle("...***?.md")).toBeUndefined();
  });

  it("extracts only supported trailing extensions", () => {
    expect(getImportFileExtension("notes.md")).toBe(".md");
    expect(getImportFileExtension("notes.txt")).toBe(".txt");
    expect(getImportFileExtension("archive.tar")).toBe(".tar");
    expect(getImportFileExtension("README")).toBeNull();
  });
});
