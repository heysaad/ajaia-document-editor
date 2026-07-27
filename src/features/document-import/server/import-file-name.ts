const FILE_NAME_CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/g;
const FILE_NAME_RESERVED_CHARACTERS = /[<>:"/\\|?*]/g;

export function getImportFileBaseName(fileName: string): string {
  const normalized = fileName.trim().replace(FILE_NAME_CONTROL_CHARACTERS, "");
  const segments = normalized.split(/[/\\]+/u);
  return segments.at(-1) ?? "";
}

export function getImportFileExtension(fileName: string): string | null {
  const baseName = getImportFileBaseName(fileName).toLowerCase();
  const lastDotIndex = baseName.lastIndexOf(".");

  if (lastDotIndex <= 0 || lastDotIndex === baseName.length - 1) {
    return null;
  }

  return baseName.slice(lastDotIndex);
}

export function normalizeImportedDocumentTitle(
  fileName: string,
): string | undefined {
  const baseName = getImportFileBaseName(fileName);
  const lastDotIndex = baseName.lastIndexOf(".");
  const withoutExtension =
    lastDotIndex > 0 ? baseName.slice(0, lastDotIndex) : baseName;

  const sanitized = withoutExtension
    .replace(FILE_NAME_RESERVED_CHARACTERS, " ")
    .replace(FILE_NAME_CONTROL_CHARACTERS, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\.+|\.+$/g, "");

  return sanitized || undefined;
}
