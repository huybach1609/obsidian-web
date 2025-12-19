export function decodePathParam(param: string | string[] | undefined): string {
  return decodeURIComponent(
    Array.isArray(param)
      ? param.join('/')
      : param ?? ''
  );
}

/**
 * Build a new path by keeping the original directory and file extension
 * but replacing the base filename with the provided newName.
 *
 * Examples:
 *  - oldPath: "folder/note.md",   newName: "renamed" => "folder/renamed.md"
 *  - oldPath: "/note.md",         newName: "renamed" => "/renamed.md"
 *  - oldPath: "note",             newName: "renamed" => "renamed"
 */
export function buildRenamedPath(oldPath: string, newName: string): string {
  if (!oldPath) return newName;

  const lastSlashIndex = oldPath.lastIndexOf('/');
  const dir = lastSlashIndex >= 0 ? oldPath.slice(0, lastSlashIndex + 1) : '';
  const filePart = lastSlashIndex >= 0 ? oldPath.slice(lastSlashIndex + 1) : oldPath;
  const dotIndex = filePart.lastIndexOf('.');
  const ext = dotIndex > 0 ? filePart.slice(dotIndex) : '';

  return `${dir}${newName}${ext}`;
}


export const sortByTypeAndName = <T extends { isDir: boolean; name: string }>(items: T[]): T[] => {
  return [...items].sort((a, b) => {
    // Folders first, then files
    if (a.isDir && !b.isDir) return -1;
    if (!a.isDir && b.isDir) return 1;
    // Same type: sort alphabetically (case-insensitive)
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });
};

export const getParentPaths = (filePath: string): string[] => {
  if (!filePath || filePath === '/') return [];

  const parts = filePath.split('/').filter(p => p);
  const parentPaths: string[] = [];

  for (let i = 1; i <= parts.length; i++) {
    parentPaths.push('/' + parts.slice(0, i).join('/'));
  }

  return parentPaths;
};
export const extractFileName = (path: string) => {
  return path.split('/').pop()?.split('.').shift();
};

