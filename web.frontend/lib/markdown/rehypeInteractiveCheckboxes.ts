import type { Root, Element } from 'hast';
import { visit } from 'unist-util-visit';

/**
 * Rehype plugin: make GFM task list checkboxes interactive by removing
 * the disabled attribute and adding data-interactive so the view page
 * can attach click handlers to toggle them.
 */
export function rehypeInteractiveCheckboxes() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'input') return;
      const props = node.properties ?? {};
      const type = props.type;
      if (type !== 'checkbox') return;
      // Remove disabled so the checkbox is clickable; mark for our click handler
      delete props.disabled;
      (props as Record<string, unknown>)['data-interactive'] = 'true';
    });
  };
}
