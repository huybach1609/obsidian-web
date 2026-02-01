'use client';

import type { FileIndexDto } from '@/types/FileIndexDto';
import { resolveInternalLink } from './resolveInternalLink';
import { remarkInternalLinks } from './remarkInternalLinks';
import type { WikiLinkNode } from './remarkInternalLinks';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { rehypeInteractiveCheckboxes } from './rehypeInteractiveCheckboxes';
import type { Element, Text } from 'hast';
import type { Handler } from 'mdast-util-to-hast';
import type { State } from 'mdast-util-to-hast';
import type { Nodes } from 'mdast';
import Link from 'next/link';

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

export interface MarkdownContentProps {
  markdown: string;
  fileIndex: FileIndexDto[];
  className?: string;
}

/**
 * Renders markdown with:
 * - GFM (tables, task lists, strikethrough)
 * - Obsidian internal links [[Note]] resolved via fileIndex
 * - Internal links use Next.js Link for client-side navigation (no full reload)
 * - Sanitized HTML
 */
export function MarkdownContent({
  markdown,
  fileIndex,
  className = '',
}: MarkdownContentProps) {
  const handlers: Record<string, Handler> = {
    wikiLink: createWikiLinkHandler(fileIndex),
  };

  return (
    <Markdown
      // className={`markdown-body ${className}`.trim()}
      remarkPlugins={[remarkInternalLinks, remarkGfm]}
      rehypePlugins={[rehypeInteractiveCheckboxes, rehypeSanitize]}
      remarkRehypeOptions={{ handlers }}
      components={{
        a: ({ href, children, node, ...props }) => {
          if (href?.startsWith('/notes/')) {
            return (
              <Link
                href={href}
                className="internal-link"
                scroll={false}
                {...props}
              >
                {children}
              </Link>
            );
          }
          return (
            <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
              {children}
            </a>
          );
        },
      }}
    >
      {markdown}
    </Markdown>
  );
}
