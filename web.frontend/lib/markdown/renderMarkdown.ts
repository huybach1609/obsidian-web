import type { FileIndexDto } from '@/types/FileIndexDto';
import { resolveInternalLink } from './resolveInternalLink';
import { remarkInternalLinks } from './remarkInternalLinks';
import type { WikiLinkNode } from './remarkInternalLinks';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import { rehypeInteractiveCheckboxes } from './rehypeInteractiveCheckboxes';
import type { Element, Text } from 'hast';
import type { Handler } from 'mdast-util-to-hast';
import type { State } from 'mdast-util-to-hast';
import type { Nodes } from 'mdast';

/**
 * Create a rehype handler for wikiLink nodes that resolves internal links
 * using fileIndex and outputs <a class="internal-link"> or <span class="internal-link unresolved">.
 */
function createWikiLinkHandler(fileIndex: FileIndexDto[]): Handler {
  return (state: State, node: unknown, _parent: unknown): Element => {
    const wiki = node as WikiLinkNode;
    const resolved = resolveInternalLink(wiki.value, fileIndex);
    const displayText = wiki.alias ?? wiki.value;

    const textChild: Text = { type: 'text', value: displayText };

    if (resolved) {
      const href = `/notes/${resolved}`;
      const result: Element = {
        type: 'element',
        tagName: 'a',
        properties: { href, className: ['internal-link'] },
        children: [textChild],
      };
      state.patch(node as Nodes, result);
      return state.applyData(node as Nodes, result) as Element;
    }

    const result: Element = {
      type: 'element',
      tagName: 'span',
      properties: { className: ['internal-link', 'unresolved'] },
      children: [textChild],
    };
    state.patch(node as Nodes, result);
    return state.applyData(node as Nodes, result) as Element;
  };
}

/**
 * Render markdown to HTML on the frontend with:
 * - GFM (tables, task lists, strikethrough)
 * - Obsidian internal links [[Note]] and [[Note|Alias]] resolved via fileIndex
 * - Sanitized HTML
 */
export async function renderMarkdown(
  markdown: string,
  fileIndex: FileIndexDto[] = []
): Promise<string> {
  const handlers: Record<string, Handler> = {
    wikiLink: createWikiLinkHandler(fileIndex),
  };

  const processor = unified()
    .use(remarkParse)
    .use(remarkInternalLinks)
    .use(remarkGfm)
    .use(remarkRehype, { handlers })
    .use(rehypeInteractiveCheckboxes)
    .use(rehypeSanitize)
    .use(rehypeStringify);

  const file = await processor.process(markdown);
  const html = String(file);
  return `<div class="markdown-body">${html}</div>`;
}
