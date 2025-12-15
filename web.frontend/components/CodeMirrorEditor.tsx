// components/CodeMirrorEditor.tsx
'use client';

import { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching, HighlightStyle } from '@codemirror/language';
import { tags } from '@lezer/highlight'; // <--- Required for custom syntax coloring
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';

interface CodeMirrorEditorProps {
    initialContent: string;
    onChange?: (value: string) => void;
    onSave?: (value: string) => void;
    theme?: 'light' | 'dark';
    readOnly?: boolean;
}

export default function CodeMirrorEditor({
    initialContent,
    onChange,
    onSave,
    theme = 'dark', // Defaulting to dark since your styling is dark-focused
    readOnly = false,
}: CodeMirrorEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);

    useEffect(() => {
        if (!editorRef.current) return;

        // 1. DEFINE THE UI THEME (Container, Gutters, Cursor, Selection)
        const obsidianUITheme = EditorView.theme({
            "&": {
                height: "100%",
                backgroundColor: "#1e1e1e",
                color: "#abb2bf",
                fontSize: "15px",
            },
            ".cm-scroller": {
                overflow: "auto",
                fontFamily: '"Inter", -apple-system, sans-serif',
            },
            ".cm-content": {
                caretColor: "#528bff",
                padding: "20px",
            },
            ".cm-gutters": {
                backgroundColor: "#1e1e1e",
                color: "#4b5263",
                border: "none",
            },
            ".cm-activeLineGutter": {
                backgroundColor: "transparent",
                color: "#c678dd",
            },
            ".cm-activeLine": {
                backgroundColor: "rgba(255, 255, 255, 0.03)",
            },
            // Selection Color
            ".cm-selectionBackground, ::selection": {
                backgroundColor: "rgba(62, 68, 81, 0.5) !important",
            },
            "&.cm-focused .cm-selectionBackground": {
                backgroundColor: "rgba(62, 68, 81, 0.7) !important",
            },
        }, { dark: true });

        // 2. DEFINE SYNTAX HIGHLIGHTING (Keywords, Headers, Bold, etc.)
        const obsidianSyntaxHighlighting = HighlightStyle.define([
            { tag: tags.heading1, fontSize: "1.6em", fontWeight: "bold", color: "#61afef" },
            { tag: tags.heading2, fontSize: "1.4em", fontWeight: "bold", color: "#61afef" },
            { tag: tags.heading3, fontSize: "1.2em", fontWeight: "bold", color: "#61afef" },
            { tag: tags.heading, fontWeight: "bold", color: "#61afef" },
            { tag: tags.strong, fontWeight: "bold", color: "#e5c07b" },
            { tag: tags.emphasis, fontStyle: "italic", color: "#98c379" },
            { tag: tags.link, textDecoration: "underline", color: "#528bff" },
            { tag: tags.list, color: "#c678dd" },
            { tag: tags.quote, color: "#5c6370", fontStyle: "italic" },
            { tag: tags.monospace, color: "#98c379", backgroundColor: "rgba(0,0,0,0.2)", borderRadius: "3px", padding: "0 2px" },
            { tag: tags.keyword, color: "#c678dd" },
            { tag: tags.atom, color: "#d19a66" },
            { tag: tags.number, color: "#d19a66" },
            { tag: tags.string, color: "#98c379" },
            { tag: tags.variableName, color: "#e06c75" },
        ]);

        // Custom keymap for save functionality
        const saveKeymap = keymap.of([
            {
                key: 'Mod-s',
                run: (view) => {
                    if (onSave) {
                        onSave(view.state.doc.toString());
                    }
                    return true;
                },
            },
        ]);

        // Create editor state
        const startState = EditorState.create({
            doc: initialContent,
            extensions: [
                // Basics
                lineNumbers(),
                highlightActiveLineGutter(),
                highlightActiveLine(),
                history(),
                bracketMatching(),
                closeBrackets(),
                autocompletion(),
                highlightSelectionMatches(),
                
                // Markdown Language Support
                markdown({ base: markdownLanguage }),

                // --- APPLYING THE THEMES HERE ---
                obsidianUITheme, // Apply the container styles
                syntaxHighlighting(obsidianSyntaxHighlighting), // Apply the colors to text tokens
                
                // Keymaps
                keymap.of([
                    ...closeBracketsKeymap,
                    ...defaultKeymap,
                    ...searchKeymap,
                    ...historyKeymap,
                    ...completionKeymap,
                ]),
                saveKeymap,

                // Event Listeners
                EditorView.updateListener.of((update) => {
                    if (update.docChanged && onChange) {
                        onChange(update.state.doc.toString());
                    }
                }),
                EditorState.readOnly.of(readOnly),
                EditorView.editable.of(!readOnly),
            ],
        });

        const view = new EditorView({
            state: startState,
            parent: editorRef.current,
        });

        viewRef.current = view;

        return () => {
            view.destroy();
            viewRef.current = null;
        };
    }, [theme, readOnly]); // Note: Re-creating editor on prop change is expensive but safe for simple use cases

    // Update content when initialContent changes
    useEffect(() => {
        if (viewRef.current && initialContent !== viewRef.current.state.doc.toString()) {
            // Prevent cursor jumping if the update is coming from a different source
            // Ideally, you should only update if the content is vastly different 
            // or if it's an initial load.
             viewRef.current.dispatch({
                changes: {
                    from: 0,
                    to: viewRef.current.state.doc.length,
                    insert: initialContent,
                },
            });
        }
    }, [initialContent]);

    return <div ref={editorRef} style={{ height: '100%', overflow: 'hidden' }} />;
}
// // components/CodeMirrorEditor.tsx
// 'use client';

// import { useEffect, useRef } from 'react';
// import { EditorState } from '@codemirror/state';
// import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
// import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
// import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
// import { syntaxHighlighting, defaultHighlightStyle, bracketMatching } from '@codemirror/language';
// import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
// import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';

// interface CodeMirrorEditorProps {
//     initialContent: string;
//     onChange?: (value: string) => void;
//     onSave?: (value: string) => void;
//     theme?: 'light' | 'dark';
//     readOnly?: boolean;
// }

// export default function CodeMirrorEditor({
//     initialContent,
//     onChange,
//     onSave,
//     theme = 'light',
//     readOnly = false,
// }: CodeMirrorEditorProps) {
//     const editorRef = useRef<HTMLDivElement>(null);
//     const viewRef = useRef<EditorView | null>(null);

//     useEffect(() => {
//         if (!editorRef.current) return;

//         // // Custom theme matching your CSS variables
//         const customTheme = EditorView.baseTheme({
//             '&': {
//                 height: '100%',
//                 backgroundColor: 'var(--markdown-bg)',
//                 color: 'var(--markdown-text)',
//             },
//             '.cm-scroller': {
//                 overflow: 'auto',
//                 fontFamily: 'var(--font-sans)',
//                 lineHeight: '1.4',
//             },
//             '.cm-content': {
//                 padding: '20px',
//                 minHeight: '100%',
//                 caretColor: 'var(--markdown-text)',
//                 fontFamily: 'var(--font-sans)',
//             },
//             '.cm-line': {
//                 lineHeight: '1.4',
//             },
//             // Gutters (line numbers)
//             '.cm-gutters': {
//                 backgroundColor: 'var(--markdown-bg)',
//                 color: 'color-mix(in srgb, var(--markdown-text) 50%, transparent)',
//                 border: 'none',
//             },
//             '.cm-activeLineGutter': {
//                 backgroundColor: 'color-mix(in srgb, var(--markdown-text) 5%, transparent)',
//             },
//             '.cm-activeLine': {
//                 backgroundColor: 'color-mix(in srgb, var(--markdown-text) 3%, transparent)',
//             },
//             // Headers
//             '.cm-header.cm-header-1': {
//                 fontSize: '1.8rem',
//                 color: 'var(--markdown-h1)',
//                 fontWeight: 'bold',
//                 lineHeight: '1.4',
//             },
//             '.cm-header.cm-header-2': {
//                 fontSize: '1.4rem',
//                 color: 'var(--markdown-h2)',
//                 fontWeight: 'bold',
//                 lineHeight: '1.4',
//             },
//             '.cm-header.cm-header-3': {
//                 fontSize: '1.2rem',
//                 color: 'var(--markdown-h2)',
//                 fontWeight: 'bold',
//                 lineHeight: '1.4',
//             },
//             '.cm-header.cm-header-4': {
//                 fontSize: '1.1rem',
//                 color: 'var(--markdown-h2)',
//                 fontWeight: 'bold',
//                 lineHeight: '1.4',
//             },
//             '.cm-header.cm-header-5': {
//                 fontSize: '1rem',
//                 color: 'var(--markdown-h2)',
//                 fontWeight: 'bold',
//                 lineHeight: '1.4',
//             },
//             '.cm-header.cm-header-6': {
//                 fontSize: '0.9rem',
//                 color: 'var(--markdown-h2)',
//                 fontWeight: 'bold',
//                 lineHeight: '1.4',
//             },
//             // Code inline and blocks
//             '.cm-inlineCode': {
//                 fontFamily: 'var(--font-mono)',
//                 backgroundColor: 'color-mix(in srgb, var(--markdown-code-bg) 80%, transparent)',
//                 padding: '2px 4px',
//                 borderRadius: '4px',
//                 color: 'var(--markdown-code-text)',
//             },
//             '.cm-code': {
//                 fontFamily: 'var(--font-mono)',
//                 color: 'var(--markdown-code-text)',
//             },
//             // Lists
//             '.cm-list': {
//                 color: 'var(--markdown-text)',
//             },
//             // Quotes
//             '.cm-quote': {
//                 color: 'var(--markdown-quote-text)',
//                 borderLeft: '4px solid var(--markdown-quote-border)',
//                 paddingLeft: '12px',
//             },
//             // Links
//             '.cm-link': {
//                 color: 'var(--markdown-text)',
//                 textDecoration: 'underline',
//             },
//             '.cm-url': {
//                 color: 'color-mix(in srgb, var(--markdown-text) 80%, transparent)',
//             },
//             // Bold and Italic
//             '.cm-strong': {
//                 fontWeight: 'bold',
//             },
//             '.cm-emphasis': {
//                 fontStyle: 'italic',
//             },
//             // Selection
//             '.cm-selectionBackground, ::selection': {
//                 backgroundColor: 'color-mix(in srgb, var(--markdown-text) 20%, transparent) !important',
//             },
//             '&.cm-focused .cm-selectionBackground, &.cm-focused ::selection': {
//                 backgroundColor: 'color-mix(in srgb, var(--markdown-text) 25%, transparent) !important',
//             },
//             // Cursor
//             '.cm-cursor': {
//                 borderLeftColor: 'var(--markdown-text)',
//             },
//             // Search matches
//             '.cm-searchMatch': {
//                 backgroundColor: 'color-mix(in srgb, var(--markdown-text) 30%, transparent)',
//             },
//             '.cm-searchMatch-selected': {
//                 backgroundColor: 'color-mix(in srgb, var(--markdown-text) 40%, transparent)',
//             },
//         });

//         // Theme customization for Obsidian-like appearance
//         const obsidianTheme = EditorView.theme({
//             '&': {
//                 backgroundColor: '#1e1e1e',
//             },
//             '.cm-content': {
//                 caretColor: '#528bff',
//                 fontFamily: '"Inter", -apple-system, system-ui, sans-serif',
//             },
//             '.cm-wikilink-mark': {
//                 cursor: 'pointer',
//                 '&:hover': {
//                     textDecoration: 'underline',
//                 },
//             },
//             '.cm-tag': {
//                 cursor: 'pointer',
//                 '&:hover': {
//                     opacity: '0.8',
//                 },
//             },
//             // Frontmatter styling
//             '.cm-meta': {
//                 color: '#6c7a89',
//                 fontStyle: 'italic',
//             },
//             // Headers
//             '.cm-header': {
//                 fontWeight: 'bold',
//             },
//             '.cm-header-1': {
//                 fontSize: '1.6em',
//                 color: '#61afef',
//             },
//             '.cm-header-2': {
//                 fontSize: '1.4em',
//                 color: '#61afef',
//             },
//             '.cm-header-3': {
//                 fontSize: '1.2em',
//                 color: '#61afef',
//             },
//             // Code blocks
//             '.cm-code': {
//                 backgroundColor: '#2d2d2d',
//                 borderRadius: '4px',
//                 padding: '2px 4px',
//                 fontFamily: '"Fira Code", monospace',
//             },
//             // Links
//             '.cm-link': {
//                 color: '#528bff',
//                 textDecoration: 'underline',
//             },
//             // Bold and italic
//             '.cm-strong': {
//                 fontWeight: 'bold',
//                 color: '#e5c07b',
//             },
//             '.cm-emphasis': {
//                 fontStyle: 'italic',
//                 color: '#98c379',
//             },
//             // Lists
//             '.cm-list': {
//                 color: '#c678dd',
//             },
//         }, { dark: true });


//         // Custom keymap for save functionality
//         const saveKeymap = keymap.of([
//             {
//                 key: 'Mod-s',
//                 run: (view) => {
//                     if (onSave) {
//                         onSave(view.state.doc.toString());
//                     }
//                     return true;
//                 },
//             },
//         ]);

//         // Create editor state
//         const startState = EditorState.create({
//             doc: initialContent,
//             extensions: [
//                 lineNumbers(),
//                 highlightActiveLineGutter(),
//                 highlightActiveLine(),
//                 history(),
//                 bracketMatching(),
//                 closeBrackets(),
//                 autocompletion(),
//                 highlightSelectionMatches(),
//                 markdown({
//                     base: markdownLanguage,
//                 }),
//                 syntaxHighlighting(defaultHighlightStyle),
//                 keymap.of([
//                     ...closeBracketsKeymap,
//                     ...defaultKeymap,
//                     ...searchKeymap,
//                     ...historyKeymap,
//                     ...completionKeymap,
//                 ]),
//                 saveKeymap,
//                 EditorView.updateListener.of((update) => {
//                     if (update.docChanged && onChange) {
//                         onChange(update.state.doc.toString());
//                     }
//                 }),
//                 EditorState.readOnly.of(readOnly),
//                 EditorView.editable.of(!readOnly),
//             ],
//         });

//         // Create editor view
//         const view = new EditorView({


//             state: startState,
//             parent: editorRef.current,

//         });

//         viewRef.current = view;

//         // Cleanup
//         return () => {
//             view.destroy();
//             viewRef.current = null;
//         };
//     }, [theme, readOnly]);
//     // Update content when initialContent changes
//     useEffect(() => {
//         if (viewRef.current && initialContent !== viewRef.current.state.doc.toString()) {
//             viewRef.current.dispatch({
//                 changes: {
//                     from: 0,
//                     to: viewRef.current.state.doc.length,
//                     insert: initialContent,
//                 },
//             });
//         }
//     }, [initialContent]);

//     return <div ref={editorRef} style={{ height: '100%', overflow: 'hidden' }} />;
// }