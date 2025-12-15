// utils/codemirror-obsidian-extensions.ts
import { syntaxTree } from '@codemirror/language';
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate, WidgetType } from '@codemirror/view';
import { Range } from '@codemirror/state';

// Custom decoration for WikiLinks [[link]]
class WikiLinkWidget extends WidgetType {
  constructor(readonly linkText: string) {
    super();
  }

  toDOM() {
    const span = document.createElement('span');
    span.className = 'cm-wikilink';
    span.textContent = `[[${this.linkText}]]`;
    span.style.cssText = 'color: #7c3aed; cursor: pointer; text-decoration: underline;';
    span.onclick = () => {
      // Handle wiki link click - navigate to the note
      console.log('Navigate to:', this.linkText);
      // You can implement routing here
    };
    return span;
  }
}

// Plugin to highlight WikiLinks
export const wikiLinksPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = this.buildDecorations(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = this.buildDecorations(update.view);
      }
    }

    buildDecorations(view: EditorView): DecorationSet {
      const decorations: Range<Decoration>[] = [];
      const doc = view.state.doc;
      const text = doc.toString();
      
      // Match WikiLinks [[text]]
      const wikiLinkRegex = /\[\[([^\]]+)\]\]/g;
      let match;

      while ((match = wikiLinkRegex.exec(text)) !== null) {
        const from = match.index;
        const to = from + match[0].length;
        
        decorations.push(
          Decoration.mark({
            class: 'cm-wikilink-mark',
            attributes: {
              style: 'color: #7c3aed; font-weight: 500;'
            }
          }).range(from, to)
        );
      }

      // Match tags #tag
      const tagRegex = /#[\w-]+/g;
      while ((match = tagRegex.exec(text)) !== null) {
        const from = match.index;
        const to = from + match[0].length;
        
        decorations.push(
          Decoration.mark({
            class: 'cm-tag',
            attributes: {
              style: 'color: #0891b2; font-weight: 500;'
            }
          }).range(from, to)
        );
      }

      return Decoration.set(decorations);
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);

// Theme customization for Obsidian-like appearance
export const obsidianTheme = EditorView.theme({
  '&': {
    backgroundColor: '#1e1e1e',
  },
  '.cm-content': {
    caretColor: '#528bff',
    fontFamily: '"Inter", -apple-system, system-ui, sans-serif',
  },
  '.cm-wikilink-mark': {
    cursor: 'pointer',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  '.cm-tag': {
    cursor: 'pointer',
    '&:hover': {
      opacity: '0.8',
    },
  },
  // Frontmatter styling
  '.cm-meta': {
    color: '#6c7a89',
    fontStyle: 'italic',
  },
  // Headers
  '.cm-header': {
    fontWeight: 'bold',
  },
  '.cm-header-1': {
    fontSize: '1.6em',
    color: '#61afef',
  },
  '.cm-header-2': {
    fontSize: '1.4em',
    color: '#61afef',
  },
  '.cm-header-3': {
    fontSize: '1.2em',
    color: '#61afef',
  },
  // Code blocks
  '.cm-code': {
    backgroundColor: '#2d2d2d',
    borderRadius: '4px',
    padding: '2px 4px',
    fontFamily: '"Fira Code", monospace',
  },
  // Links
  '.cm-link': {
    color: '#528bff',
    textDecoration: 'underline',
  },
  // Bold and italic
  '.cm-strong': {
    fontWeight: 'bold',
    color: '#e5c07b',
  },
  '.cm-emphasis': {
    fontStyle: 'italic',
    color: '#98c379',
  },
  // Lists
  '.cm-list': {
    color: '#c678dd',
  },
}, { dark: true });

// Add these extensions to your CodeMirror setup:
// Import in your CodeMirrorEditor.tsx:
// import { wikiLinksPlugin, obsidianTheme } from '@/utils/codemirror-obsidian-extensions';
//
// Then add to extensions array:
// wikiLinksPlugin,
// obsidianTheme,