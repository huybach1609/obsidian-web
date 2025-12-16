// components/CodeMirrorEditor.tsx
'use client';

import { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, Decoration, DecorationSet, ViewPlugin, ViewUpdate } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching, HighlightStyle, syntaxTree } from '@codemirror/language';
import { tags } from '@lezer/highlight'; // <--- Required for custom syntax coloring
import { languages } from '@codemirror/language-data'; // language highlighting data
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { RangeSetBuilder } from '@codemirror/state';
import { vim } from "@replit/codemirror-vim";

// Define the decorations to be used
const codeBlockBase = Decoration.line({
    attributes: { class: 'cm-codeblock-line' }
});

// Optional: If you want rounded corners on the first and last line
const codeBlockStart = Decoration.line({
    attributes: { class: 'cm-codeblock-line cm-codeblock-start' }
});
const codeBlockEnd = Decoration.line({
    attributes: { class: 'cm-codeblock-line cm-codeblock-end' }
});
const codeBlockSingle = Decoration.line({
    attributes: { class: 'cm-codeblock-line cm-codeblock-start cm-codeblock-end' }
});

function codeBlockBackgroundPlugin() {
    return ViewPlugin.fromClass(class {
        decorations: DecorationSet;

        constructor(view: EditorView) {
            this.decorations = this.buildDecorations(view);
        }

        update(update: ViewUpdate) {
            // Only rebuild if the document changed or the viewport changed significantly
            if (update.docChanged || update.viewportChanged) {
                this.decorations = this.buildDecorations(update.view);
            }
        }

        buildDecorations(view: EditorView) {
            const builder = new RangeSetBuilder<Decoration>();
            const tree = syntaxTree(view.state);

            // Iterate over visible ranges to ensure performance on large documents
            for (const { from, to } of view.visibleRanges) {
                tree.iterate({
                    from,
                    to,
                    enter: (node) => {
                        // "FencedCode" is the Lezer syntax node name for ``` blocks
                        if (node.name === "FencedCode") {
                            const startLine = view.state.doc.lineAt(node.from);
                            const endLine = view.state.doc.lineAt(node.to);

                            for (let i = startLine.number; i <= endLine.number; i++) {
                                const line = view.state.doc.line(i);
                                let deco = codeBlockBase;

                                // Logic for rounded corners
                                if (startLine.number === endLine.number) {
                                    deco = codeBlockSingle; // 1-liner block
                                } else if (i === startLine.number) {
                                    deco = codeBlockStart;
                                } else if (i === endLine.number) {
                                    deco = codeBlockEnd;
                                }

                                // Add the decoration at the start of the line
                                builder.add(line.from, line.from, deco);
                            }
                        }
                    }
                });
            }
            return builder.finish();
        }
    }, {
        decorations: plugin => plugin.decorations
    });
}

interface CodeMirrorEditorProps {
    initialContent: string;
    onChange?: (value: string) => void;
    onSave?: (value: string) => void;
    theme?: 'light' | 'dark';
    readOnly?: boolean;
    useVim?: boolean;
}

export default function CodeMirrorEditor({
    initialContent,
    onChange,
    onSave,
    theme = 'dark', // Defaulting to dark since your styling is dark-focused
    readOnly = false,
    useVim = false,
}: CodeMirrorEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);

    useEffect(() => {
        if (!editorRef.current) return;

        // 1. DEFINE THE UI THEME (Container, Gutters, Cursor, Selection)
        const obsidianUITheme = EditorView.theme({
            "&": {
                height: "auto",
                backgroundColor: "var(--markdown-bg)",
                color: "var(--markdown-text)",
                fontSize: "15px",
            },
            ".cm-scroller": {
                overflow: "visible",
                fontFamily: '"Inter", -apple-system, sans-serif',
            },
            ".cm-content": {
                caretColor: "var(--markdown-text)",
                padding: "20px",
            },
            ".cm-gutters": {
                backgroundColor: "var(--markdown-bg)",
                color: "var(--markdown-text)",
                border: "none",
            },
            ".cm-activeLineGutter": {
                backgroundColor: "transparent",
                color: "var(--markdown-text)",
            },
            ".cm-activeLine": {
                backgroundColor: "rgba(255, 255, 255, 0.03)",
            },
            // Selection Color
            ".cm-selectionBackground, ::selection": {
                backgroundColor: "color-mix(in srgb, var(--markdown-text) 50%, transparent) !important",
            },
            "&.cm-focused .cm-selectionBackground": {
                backgroundColor: "color-mix(in srgb, var(--markdown-text) 70%, transparent) !important",
            },
            // Code block background decorations
            ".cm-codeblock-line": {
                backgroundColor: "var(--markdown-code-bg)", // The block color
                fontFamily: "var(--font-mono)",
                fontSize: "13px",
                // Optional padding to push text away from the edge
                paddingLeft: "12px !important", // !important often needed to override default CM padding
                paddingRight: "12px !important",
            },
            // Optional: Rounded corners and margins for distinct block look
            ".cm-codeblock-start": {
                borderTopLeftRadius: "8px",
                borderTopRightRadius: "8px",
                marginTop: "0.5rem", // Add space above the block
            },
            ".cm-codeblock-end": {
                borderBottomLeftRadius: "8px",
                borderBottomRightRadius: "8px",
                marginBottom: "0.5rem", // Add space below the block
            },

        }, { dark: true });

        // 2. DEFINE SYNTAX HIGHLIGHTING (Keywords, Headers, Bold, etc.)
        const obsidianSyntaxHighlighting = HighlightStyle.define([
            // 1. HEADINGS and BASIC
            { tag: tags.heading1, fontSize: "1.6em", fontWeight: "bold", color: "var(--markdown-h1)" },
            { tag: tags.heading2, fontSize: "1.4em", fontWeight: "bold", color: "var(--markdown-h2)" },
            { tag: tags.heading3, fontSize: "1.2em", fontWeight: "bold", color: "var(--markdown-h2)" },
            { tag: tags.heading, fontWeight: "bold", color: "var(--markdown-h2)" },
            { tag: tags.strong, fontWeight: "bold", color: "var(--markdown-text)" },
            { tag: tags.emphasis, fontStyle: "italic", color: "var(--markdown-text)" },
            { tag: tags.link, textDecoration: "underline", color: "var(--markdown-text)" },
            { tag: tags.list, color: "var(--markdown-text)" },
            { tag: tags.quote, color: "var(--markdown-text)", fontStyle: "italic" },

            // --- KEYWORDS & LITERALS ---
            { tag: tags.keyword, color: "var(--token-keyword)" },           // e.g. import, export, return
            { tag: tags.typeName, color: "var(--token-keyword)" },          // e.g. String, int, boolean (Java/C#)
            { tag: tags.className, color: "var(--token-def)" },             // e.g. MyClass (Java)
            { tag: tags.literal, color: "var(--token-string)" },            // e.g. true, false, null

            // --- VARIABLES & FUNCTIONS ---
            { tag: tags.definition(tags.variableName), color: "var(--token-def)" }, // Variable being defined
            { tag: tags.function(tags.variableName), color: "var(--token-def)" },   // Function calls: myFunc()
            { tag: tags.variableName, color: "var(--token-variable)" },             // Standard variables

            // --- PROPERTIES (Fixes JSON Keys & Object Props) ---
            { tag: tags.propertyName, color: "var(--token-variable)" },     // JSON keys: "bg": ...
            { tag: tags.attributeName, color: "var(--token-variable)" },    // HTML attributes

            // --- COMMENTS ---
            { tag: tags.comment, color: "var(--token-comment)", fontStyle: "italic" },

            // --- PUNCTUATION & OPERATORS (Optional but recommended) ---
            { tag: tags.operator, color: "var(--token-keyword)" },          // =, +, -, &&
            { tag: tags.separator, color: "var(--markdown-text)" },         // , ; :
            { tag: tags.punctuation, color: "var(--markdown-text)" },       // { } [ ]


            // --- STRINGS & NUMBERS ---
            { tag: tags.string, color: "var(--token-string)" },
            { tag: tags.number, color: "var(--token-number)" },
            { tag: tags.bool, color: "var(--token-number)" },               // Booleans often share number color

            // --- MARKDOWN SPECIFIC ---
            {
                tag: tags.monospace,             // (For inline code `const a`)
                color: "var(--markdown-code-text)",
                backgroundColor: "var(--markdown-code-bg)",
                fontFamily: "var(--font-mono)",
                borderRadius: "3px",
                padding: "0 2px"
            },

            {
                tag: tags.processingInstruction, // (The ``` backticks)
                // color: "var(--token-comment)",
                fontFamily: "var(--font-mono)",
            },

            {
                // Ensures all syntax inside blocks uses the mono font
                tag: [tags.keyword, tags.string, tags.variableName, tags.number, tags.atom, tags.comment, tags.propertyName, tags.attributeName, tags.className, tags.typeName, tags.operator, tags.separator, tags.punctuation], // Ensures all syntax inside blocks uses the mono font
                fontFamily: "var(--font-mono)",
                fontSize: "13px",
            },
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
                // lineNumbers(),
                highlightActiveLineGutter(),
                highlightActiveLine(),
                history(),
                bracketMatching(),
                closeBrackets(),
                autocompletion(),
                highlightSelectionMatches(),

                // Markdown Language Support
                markdown({
                    base: markdownLanguage,
                    codeLanguages: languages
                }),

                obsidianUITheme, // Apply the container styles
                syntaxHighlighting(obsidianSyntaxHighlighting), // Apply the colors to text tokens
                codeBlockBackgroundPlugin(), // Add code block background decorations

                // Vim mode - must be before other keymaps to take precedence
                ...(useVim ? [vim()] : []),

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
    }, [theme, readOnly, useVim]); // Note: Re-creating editor on prop change is expensive but safe for simple use cases

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

    return <div ref={editorRef} style={{ position: 'relative' }} />;
}
