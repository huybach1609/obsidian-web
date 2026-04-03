"use client";

import type { FileIndexDto } from "@/types/FileIndexDto";
import type { WikiLinkNode } from "./remarkInternalLinks";
import type { Element, Text } from "hast";
import type { Handler } from "mdast-util-to-hast";
import type { State } from "mdast-util-to-hast";
import type { Nodes } from "mdast";

import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import Markdown from "react-markdown";
import Link from "next/link";

import { rehypeInteractiveCheckboxes } from "./rehypeInteractiveCheckboxes";
import { remarkInternalLinks } from "./remarkInternalLinks";
import { resolveInternalLink } from "./resolveInternalLink";

function createWikiLinkHandler(fileIndex: FileIndexDto[]): Handler {
  return (state: State, node: unknown, _parent: unknown): Element => {
    const wiki = node as WikiLinkNode;
    const resolved = resolveInternalLink(wiki.value, fileIndex);
    const displayText = wiki.alias ?? wiki.value;

    const textChild: Text = { type: "text", value: displayText };

    if (resolved) {
      const href = `/notes/${resolved}`;
      const result: Element = {
        type: "element",
        tagName: "a",
        properties: { href, className: ["internal-link"] },
        children: [textChild],
      };

      state.patch(node as Nodes, result);

      return state.applyData(node as Nodes, result) as Element;
    }

    const result: Element = {
      type: "element",
      tagName: "span",
      properties: { className: ["internal-link", "unresolved"] },
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
  className = "",
}: MarkdownContentProps) {
  const handlers: Record<string, Handler> = {
    wikiLink: createWikiLinkHandler(fileIndex),
  };

  return (
    <Markdown
      // className={`markdown-body ${className}`.trim()}
      components={{
        a: ({ href, children, node, ...props }) => {
          if (href?.startsWith("/notes/")) {
            return (
              <Link
                className="internal-link"
                href={href}
                scroll={false}
                {...props}
              >
                {children}
              </Link>
            );
          }

          return (
            <a href={href} rel="noopener noreferrer" target="_blank" {...props}>
              {children}
            </a>
          );
        },
      }}
      rehypePlugins={[rehypeInteractiveCheckboxes, rehypeSanitize]}
      remarkPlugins={[remarkInternalLinks, remarkGfm]}
      remarkRehypeOptions={{ handlers }}
    >
      {markdown}
    </Markdown>
  );
}
