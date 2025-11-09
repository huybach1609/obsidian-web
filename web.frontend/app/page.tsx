// export default function Home() {
//   return (
//     <div>
//       <h1>Hello World</h1>
//     </div>
//    );
// }
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TreeView from '@/components/TreeView';
import Editor from '@/components/Editor';
import { setAuthToken } from '@/lib/axios';
import { 
  ArrowRightOnRectangleIcon, 
  FolderIcon, 
  EyeIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
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
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  // Don't render main app if not authenticated (will redirect)
  if (!token) {
    return null;
  }
  return (
    <div className="grid grid-cols-[300px_1fr_1fr] bg-gray-100 w-full h-screen">
      {/* Left Sidebar - File Explorer */}
      <div className="border-r-2 border-gray-300 bg-gray-50 flex flex-col">
        <div className="p-4 bg-white border-b border-gray-300">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <UserCircleIcon className="h-5 w-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Logged in</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-500 hover:bg-red-600 text-white border-none rounded-md transition-colors cursor-pointer"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
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
          <div className="flex items-center gap-2">
            <EyeIcon className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-800">Preview</h3>
          </div>
        </div>
        <div 
          id="preview-area" 
          className="flex-1 overflow-auto p-4 text-gray-800 bg-white"
        ></div>
      </div>
    </div>
  );
}
   // <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
    //   <div className="inline-block max-w-xl text-center justify-center">
    //     <span className={title()}>Make&nbsp;</span>
    //     <span className={title({ color: "violet" })}>beautiful&nbsp;</span>
    //     <br />
    //     <span className={title()}>
    //       websites regardless of your design experience.
    //     </span>
    //     <div className={subtitle({ class: "mt-4" })}>
    //       Beautiful, fast and modern React UI library.
    //     </div>
    //   </div>

    //   <div className="flex gap-3">
    //     <Link
    //       isExternal
    //       className={buttonStyles({
    //         color: "primary",
    //         radius: "full",
    //         variant: "shadow",
    //       })}
    //       href={siteConfig.links.docs}
    //     >
    //       Documentation
    //     </Link>
    //     <Link
    //       isExternal
    //       className={buttonStyles({ variant: "bordered", radius: "full" })}
    //       href={siteConfig.links.github}
    //     >
    //       <GithubIcon size={20} />
    //       GitHub
    //     </Link>
    //   </div>

    //   <div className="mt-8">
    //     <Snippet hideCopyButton hideSymbol variant="bordered">
    //       <span>
    //         Get started by editing <Code color="primary">app/page.tsx</Code>
    //       </span>
    //     </Snippet>
    //   </div>
    // </section>
