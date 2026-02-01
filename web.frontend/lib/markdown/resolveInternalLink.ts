import type { FileIndexDto } from '@/types/FileIndexDto';

/**
 * Resolve Obsidian internal link text to a vault-relative file path using fileIndex.
 * Returns the path suitable for href="/notes/{path}" or null if not found.
 */
export function resolveInternalLink(
  linkText: string,
  fileIndex: FileIndexDto[]
): string | null {
  if (!linkText.trim()) return null;

  const normalized = linkText.trim();
  const withExt = normalized.endsWith('.md') ? normalized : `${normalized}.md`;

  // 1. Exact filePath match (with or without .md)
  const exact = fileIndex.find(
    (f) =>
      f.filePath === normalized ||
      f.filePath === withExt ||
      f.filePath.replace(/\.md$/i, '') === normalized
  );
  if (exact) return exact.filePath;

  // 2. fileName match (without extension)
  const byName = fileIndex.find(
    (f) =>
      f.fileName === normalized ||
      f.fileName === normalized.replace(/\.md$/i, '')
  );
  if (byName) return byName.filePath;

  // 3. filePath ends with /linkText.md (e.g. "folder/Note" -> "folder/Note.md")
  const byPath = fileIndex.find(
    (f) =>
      f.filePath === withExt ||
      f.filePath.endsWith('/' + withExt) ||
      f.filePath.toLowerCase().endsWith('/' + withExt.toLowerCase())
  );
  if (byPath) return byPath.filePath;

  return null;
}
