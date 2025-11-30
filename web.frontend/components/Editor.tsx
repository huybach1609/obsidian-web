'use client';

import { useEffect, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { EditorView } from '@uiw/react-codemirror';
import { getFile, updateFile, getFilePreview } from '@/services/fileservice';
import DOMPurify from 'dompurify';
import Header from './Header';

interface EditorProps {
  path: string | null;
  isAuthenticated: boolean;
}

export default function Editor({ path, isAuthenticated }: EditorProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!path || !isAuthenticated) {
      setContent('');
      setError(null);
      return;
    }
    loadFile();
  }, [path, isAuthenticated]);

  async function loadFile() {
    if (!path || !isAuthenticated) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await getFile(path);
      setContent(data.content);
    } catch (err: any) {
      console.error('Error loading file:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Authentication required.');
      } else if (err.response?.status === 404) {
        setError('File not found.');
      } else {
        setError('Failed to load file.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!path || !isAuthenticated) return;
    
    setSaving(true);
    setError(null);
    try {
      await updateFile(path, content);
      // update preview
      try {
        const previewHtml = await getFilePreview(path);
        const previewArea = document.getElementById('preview-area');
        if (previewArea) {
          previewArea.innerHTML = DOMPurify.sanitize(previewHtml);
        }
      } catch (previewErr) {
        console.error('Error loading preview:', previewErr);
      }
    } catch (err: any) {
      console.error('Error saving file:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Authentication required.');
      } else {
        setError('Failed to save file.');
      }
    } finally {
      setSaving(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="p-4">
        <p className="text-foreground">Please login to edit files</p>
      </div>
    );
  }

  if (!path) {
    return (
      <div className="flex items-center justify-center h-full bg-background text-foreground">
        <p className="text-lg">No file selected</p>
      </div>
    );
  }

  return (
    
    <div className="h-full flex flex-col">
      <Header className="flex justify-between items-center">
        <span className="text-sm font-semibold text-foreground font-mono">{path}</span>
        <button
          onClick={save}
          disabled={saving}
          className="px-4 py-2 bg-primary hover:bg-primary-dark disabled:bg-gray-400 disabled:cursor-not-allowed text-white border-none rounded-md text-sm font-medium transition-colors cursor-pointer"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
        {error && (
          <span className="text-danger text-sm bg-danger-light px-3 py-1 rounded border border-danger-dark">
            {error}
          </span>
        )}
      </Header>
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-foreground">Loading...</p>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <CodeMirror
            value={content}
            onChange={(value) => setContent(value)}
            height="100%"
            theme={EditorView.theme({
              '&': {
                color: '#1e293b', // slate-800 - dark text
                backgroundColor: '#background', // white background
              },
              '.cm-content': {
                caretColor: '#1e293b',
                color: '#1e293b',
              },
              '&.cm-focused .cm-cursor': {
                borderLeftColor: '#1e293b',
              },
              '&.cm-focused .cm-selectionBackground, ::selection': {
                backgroundColor: '#cbd5e1', // slate-300
              },
              '.cm-gutters': {
                backgroundColor: '#f8fafc', // slate-50
                color: '#64748b', // slate-500
                border: 'none',
              },
              '.cm-lineNumbers .cm-gutterElement': {
                color: '#64748b',
              },
              '.cm-activeLineGutter': {
                backgroundColor: '#e2e8f0', // slate-200
                color: '#1e293b',
              },
              '.cm-activeLine': {
                backgroundColor: '#f1f5f9', // slate-100
              },
            }, { dark: false })}
            extensions={[EditorView.lineWrapping]}
          />
        </div>
      )}
    </div>
  );
}

