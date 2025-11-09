'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TreeView from '@/components/TreeView';
import Editor from '@/components/Editor';
import { setAuthToken } from '@/lib/axios';

export default function Home() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [treePath, setTreePath] = useState('/');
  const [selected, setSelected] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('jwt');
      if (storedToken) {
        setToken(storedToken);
        setAuthToken(storedToken);
      } else {
        // Redirect to login if no token
        router.push('/login');
      }
      setIsCheckingAuth(false);
    }
  }, [router]);

  useEffect(() => {
    if (token) {
      setAuthToken(token);
    }
  }, [token]);

  function handleLogout() {
    localStorage.removeItem('jwt');
    setToken(null);
    setSelected(null);
    router.push('/login');
  }

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  // Don't render main app if not authenticated (will redirect)
  if (!token) {
    return null;
  }

  return (
    <div className="grid grid-cols-[300px_1fr_1fr] h-screen bg-gray-100">
      {/* Left Sidebar - File Explorer */}
      <div className="border-r-2 border-gray-300 bg-gray-50 flex flex-col">
        <div className="p-4 bg-white border-b border-gray-300">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Logged in</span>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-xs font-medium bg-red-500 hover:bg-red-600 text-white border-none rounded-md transition-colors cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <TreeView
            path={treePath}
            onSelect={(p) => setSelected(p)}
            isAuthenticated={true}
          />
        </div>
      </div>
      
      {/* Middle Panel - Editor */}
      <div className="bg-white flex flex-col border-r-2 border-gray-300">
        <Editor path={selected} isAuthenticated={true} />
      </div>
      
      {/* Right Panel - Preview */}
      <div className="bg-white flex flex-col">
        <div className="p-4 bg-gray-50 border-b border-gray-300">
          <h3 className="text-lg font-semibold text-gray-800">Preview</h3>
        </div>
        <div 
          id="preview-area" 
          className="flex-1 overflow-auto p-4 text-gray-800 bg-white"
        ></div>
      </div>
    </div>
  );
}
