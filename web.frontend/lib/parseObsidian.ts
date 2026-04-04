// lib/parseObsidian.ts

const VAULT_IMAGE_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".svg",
]);

/** Same base as `lib/axios.ts` (…/api) so image URLs match API routes. */
export function getPublicApiBaseUrl(): string {
  if (process.env.NODE_ENV === "production") {
    return process.env.NEXT_PUBLIC_API_URL || "/api";
  }

  return `${process.env.NEXT_PUBLIC_API_PROTOCOL}://${process.env.NEXT_PUBLIC_API_HOST}:${process.env.NEXT_PUBLIC_API_PORT}/api`;
}

/** Vault-relative path is an image the backend serves via GET /api/image?filename=… */
export function isVaultImagePath(path: string): boolean {
  const dot = path.lastIndexOf(".");

  if (dot < 0) return false;

  return VAULT_IMAGE_EXTENSIONS.has(path.slice(dot).toLowerCase());
}

/** Same resolution as `![[…]]` embeds: basename lookup under the vault. */
export function getVaultImageUrl(vaultRelativePath: string): string {
  const apiBase = getPublicApiBaseUrl();
  const name = vaultRelativePath.split("/").pop() || vaultRelativePath;

  return `${apiBase}/image?filename=${encodeURIComponent(name)}`;
}

export function resolveObsidianImages(content: string): string {
  const apiBase = getPublicApiBaseUrl();

  return content.replace(
    /!\[\[([^\]|]+?)(?:\|([^\]]*))?\]\]/g,
    (full, filename, alt) => {
      const name = filename.trim();
      const altText = alt?.trim() || name;

      const imageExts = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"];
      const ext = name.slice(name.lastIndexOf(".")).toLowerCase();

      if (!imageExts.includes(ext)) return full;

      const url = `${apiBase}/image?filename=${encodeURIComponent(name)}`;

      return `![${altText}](${url})`;
    },
  );
}
