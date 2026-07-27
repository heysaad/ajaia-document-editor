import { describe, expect, it } from "vitest";

import {
  normalizeCreateTitle,
  normalizeRenameTitle,
} from "@/features/documents/server/document-title";
import { ValidationError } from "@/lib/application-errors";

describe("document title normalization", () => {
  it("uses the default title when creation omits a title", () => {
    expect(normalizeCreateTitle()).toBe("Untitled document");
    expect(normalizeCreateTitle("   ")).toBe("Untitled document");
  });

  it("trims and collapses whitespace", () => {
    expect(normalizeCreateTitle("  Product   brief \n Q3 ")).toBe(
      "Product brief Q3",
    );
    expect(normalizeRenameTitle("  Renamed\t document ")).toBe(
      "Renamed document",
    );
  });

  it("rejects empty and over-limit rename values", () => {
    expect(() => normalizeRenameTitle(" \n ")).toThrow(ValidationError);
    expect(() => normalizeRenameTitle("x".repeat(121))).toThrow(
      /120 characters/,
    );
  });
});
