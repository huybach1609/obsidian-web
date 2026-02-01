import type { Root, Text } from 'mdast';
import { visit } from 'unist-util-visit';

/** Obsidian-style internal link: [[Note]] or [[Note|Alias]] */
const WIKILINK_REGEX = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

export interface WikiLinkNode {
  type: 'wikiLink';
  value: string;
  alias?: string;
  /** unist compatibility */
  position?: Text['position'];
}

type MdastNode = Root | Text | WikiLinkNode;

function splitWikiLinkSegments(value: string): Array<{ type: 'text' | 'wikiLink'; value: string; alias?: string }> {
  const segments: Array<{ type: 'text' | 'wikiLink'; value: string; alias?: string }> = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  WIKILINK_REGEX.lastIndex = 0;
  while ((m = WIKILINK_REGEX.exec(value)) !== null) {
    if (m.index > lastIndex) {
      segments.push({ type: 'text', value: value.slice(lastIndex, m.index) });
    }
    segments.push({
      type: 'wikiLink',
      value: m[1].trim(),
      alias: m[2]?.trim(),
    });
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < value.length) {
    segments.push({ type: 'text', value: value.slice(lastIndex) });
  }
  return segments;
}

/**
 * Remark plugin: parse Obsidian internal links [[Note]] and [[Note|Alias]]
 * into wikiLink nodes. Resolving to hrefs is done in the rehype phase (renderMarkdown).
 */
export function remarkInternalLinks() {
  return (tree: Root) => {
    visit(tree, 'text', (node, index, parent) => {
      if (!parent || index === undefined) return;
      const segments = splitWikiLinkSegments(node.value);
      if (segments.length <= 1 && segments[0]?.type === 'text') return;

      const newNodes: MdastNode[] = segments.map((seg) => {
        if (seg.type === 'text') {
          return { type: 'text' as const, value: seg.value };
        }
        return {
          type: 'wikiLink' as const,
          value: seg.value,
          ...(seg.alias && { alias: seg.alias }),
        } as WikiLinkNode;
      });
      (parent as { children: MdastNode[] }).children.splice(index, 1, ...newNodes);
    });
  };
}
