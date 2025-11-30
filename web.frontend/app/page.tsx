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
import Header from '@/components/Header';
import { setAuthToken } from '@/lib/axios';
import { usePlatform } from '@/contexts/PlatformContext';
import { useAppSettings, getTokenFromCookie } from '@/contexts/AppContext';
import {
  FolderIcon,
  EyeIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { Avatar, Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, User } from '@heroui/react';
import { LogOut, Code, Eye, WrapText, AlignLeft } from 'lucide-react';
import { ThemeSwitch } from '@/components/theme-switch';
import { getFilePreview } from '@/services/fileservice';
import { motion } from 'framer-motion';
import '../styles/markdown.css';


type MobileView = 'files' | 'editor' | 'preview';

export default function Home() {
  const router = useRouter();
  const { isMobile, isWebView } = usePlatform();
  const { accessToken, setAccessToken } = useAppSettings();
  const [treePath, setTreePath] = useState('/');
  const [selected, setSelected] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  // function to move to other views files, editor, preview
  const [mobileView, setMobileView] = useState<MobileView>('files');
  const [textWrap, setTextWrap] = useState(true);

  useEffect(() => {
    const cookieToken = getTokenFromCookie();
    const storedToken = accessToken ?? cookieToken;

    if (storedToken) {
      if (!accessToken && cookieToken) {
        setAccessToken(cookieToken);
      }
      setAuthToken(storedToken);
      setIsCheckingAuth(false);
      return;
    }

    setIsCheckingAuth(false);
    router.push('/login');
  }, [accessToken, router, setAccessToken]);

  // Switch to editor view when a file is selected on mobile
  useEffect(() => {
    if (isMobile && selected) {
      // setMobileView('editor');
      setMobileView('preview');
      handlePreview();
    }
  }, [selected, isMobile]);

  useEffect(() => {
    if (selected) {
      handlePreview();
    }
  }, [selected]);

  const handlePreview = async () => {
    console.log('handlePreview', selected);
    if (selected) {
      const previewHtml = await getFilePreview(selected);
      const previewArea = document.getElementById('preview-area');
      if (previewArea) {
        previewArea.innerHTML = previewHtml;
      }
    }
  }

  function handleLogout() {
    setAccessToken(null);
    setSelected(null);
    router.push('/login');
  }

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render main app if not authenticated (will redirect)
  if (!accessToken) {
    return null;
  }

  // Mobile Layout
  if (isMobile || isWebView) {
    return (
      <div className="flex flex-col bg-background text-foreground w-full h-screen">
        {/* Top Header - Always visible */}
        <Header className="h-16">
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center gap-2">
              <UserCircleIcon className="h-5 w-5 text-foreground" />
              <span className="text-sm font-medium text-foreground">Logged in</span>
            </div>
            <div className="flex items-center gap-3">
              <ThemeSwitch />
              <Button
                onPress={handleLogout}
                color="danger"
                variant="solid"
                size="sm"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </Header>

        {/* Content Area - Switches based on selected tab */}
        <div className="flex-1 overflow-hidden">
          {mobileView === 'files' && (
            <div className="h-full bg-background text-foreground">
              <TreeView
                path={treePath}
                onSelect={(p) => setSelected(p)}
                isAuthenticated={true}
              />
            </div>
          )}

          {mobileView === 'editor' && (
            <div className="h-full bg-background text-foreground">
              <Editor path={selected} isAuthenticated={true} />
            </div>
          )}

          {mobileView === 'preview' && (
            <div className="h-full bg-background text-foreground flex flex-col min-w-0">
              <Header className="h-16">
                <div className="flex items-center justify-between h-full w-full">
                  <div className="flex items-center gap-2">
                    <EyeIcon className="h-5 w-5 text-foreground" />
                    <h3 className="text-lg font-semibold text-gray-800">Preview</h3>
                  </div>
                  <Button
                    isIconOnly
                    variant="light"
                    size="sm"
                    onPress={() => setTextWrap(!textWrap)}
                    aria-label={textWrap ? "Disable text wrap" : "Enable text wrap"}
                  >
                    {textWrap ? (
                      <WrapText className="h-5 w-5 text-foreground" />
                    ) : (
                      <AlignLeft className="h-5 w-5 text-foreground" />
                    )}
                  </Button>
                </div>
              </Header>
              <div
                id="preview-area"
                className={`flex-1 text-foreground bg-background ${textWrap ? 'text-wrap break-words whitespace-pre-wrap overflow-auto' : 'no-wrap whitespace-pre overflow-x-auto overflow-y-auto'
                  }`}
              ></div>
            </div>
          )}
        </div>

        {/* Bottom Navigation - Button-based */}
        <div className="bg-background text-foreground border-t border-gray-300 flex relative">
          {/* Animated indicator bar */}
          <motion.div
            className="absolute top-0 h-0.5 bg-primary"
            initial={false}
            animate={{
              x: mobileView === 'files' ? '0%' : mobileView === 'preview' ? '100%' : '200%',
              width: '33.333%'
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30
            }}
          />

          <motion.button
            onClick={() => setMobileView('files')}
            whileTap={{ scale: 0.95 }}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 px-2 transition-colors ${mobileView === 'files'
              ? 'bg-primary-light text-primary'
              : 'text-foreground hover:bg-primary-light'
              }`}
          >
            <motion.div
              animate={{
                scale: mobileView === 'files' ? 1.1 : 1,
                rotate: mobileView === 'files' ? [0, -5, 5, 0] : 0
              }}
              transition={{ duration: 0.3 }}
            >
              <FolderIcon className="h-5 w-5" />
            </motion.div>
            <motion.span
              className="text-xs font-medium"
              animate={{
                fontWeight: mobileView === 'files' ? 600 : 500
              }}
            >
              Files
            </motion.span>
          </motion.button>
          <motion.button
            onClick={() => setMobileView('preview')}
            disabled={!selected}
            whileTap={selected ? { scale: 0.95 } : {}}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 px-2 transition-colors ${mobileView === 'preview'
              ? 'bg-primary-light text-primary'
              : 'text-foreground hover:bg-primary-light'
              } ${!selected ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <motion.div
              animate={{
                scale: mobileView === 'preview' ? 1.1 : 1,
                rotate: mobileView === 'preview' ? [0, -5, 5, 0] : 0
              }}
              transition={{ duration: 0.3 }}
            >
              <Eye className="h-5 w-5" />
            </motion.div>
            <motion.span
              className="text-xs font-medium"
              animate={{
                fontWeight: mobileView === 'preview' ? 600 : 500
              }}
            >
              Preview
            </motion.span>
          </motion.button>

          <motion.button
            onClick={() => setMobileView('editor')}
            disabled={!selected}
            whileTap={selected ? { scale: 0.95 } : {}}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 px-2 transition-colors ${mobileView === 'editor'
              ? 'bg-primary-light text-primary'
              : 'text-foreground hover:bg-primary-light'
              } ${!selected ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <motion.div
              animate={{
                scale: mobileView === 'editor' ? 1.1 : 1,
                rotate: mobileView === 'editor' ? [0, -5, 5, 0] : 0
              }}
              transition={{ duration: 0.3 }}
            >
              <Code className="h-5 w-5" />
            </motion.div>
            <motion.span
              className="text-xs font-medium"
              animate={{
                fontWeight: mobileView === 'editor' ? 600 : 500
              }}
            >
              Editor
            </motion.span>
          </motion.button>


        </div>

      </div>
    );
  }


  // Web Layout - Original three-panel layout
  return (
    <div className="flex bg-background text-foreground w-full h-screen">
      {/* Left Sidebar - File Explorer */}
      <div className="border-r-2 border-gray-300 bg-background text-foreground flex flex-col min-w-64 ">
        <LeftSidebarTop handleLogout={handleLogout} />
        <div className="flex-1 overflow-y-auto">
          <TreeView
            path={treePath}
            onSelect={(p) => setSelected(p)}
            isAuthenticated={true}
          />
        </div>
      </div>

      {/* Middle Panel - Editor */}
      {/* <div className="bg-background text-foreground flex flex-col border-r-2 border-gray-300 min-h-0 grow-1">
        <Editor path={selected} isAuthenticated={true} />
      </div> */}

      {/* Right Panel - Preview */}
      <div className="bg-background text-foreground flex flex-col min-h-0 grow-1 min-w-0">
        <Header>
          <div className="flex items-center justify-between h-full w-full text-foreground bg-background">
            <div className="flex items-center gap-2">
              <EyeIcon className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Preview</h3>
            </div>
            <Button
              isIconOnly
              variant="light"
              size="sm"
              onPress={() => setTextWrap(!textWrap)}
              aria-label={textWrap ? "Disable text wrap" : "Enable text wrap"}
            >
              {textWrap ? (
                <WrapText className="h-5 w-5 text-foreground" />
              ) : (
                <AlignLeft className="h-5 w-5 text-foreground" />
              )}
            </Button>
          </div>
        </Header>
        <div
          id="preview-area"
          className={`flex-1 text-foreground bg-background ${textWrap ? 'text-wrap break-words whitespace-pre-wrap overflow-auto' : 'no-wrap whitespace-pre overflow-x-auto overflow-y-auto'
            }`}
        ></div>
      </div>
    </div>
  );
}

const LeftSidebarTop = ({ handleLogout }: { handleLogout: () => void }) => {
  return (
    <Header>
      <div className="flex items-center justify-between h-full">

        {/* <div className="flex items-center gap-2 text-foreground">
          <UserCircleIcon className="h-5 w-5" />
          <span className="text-sm font-medium text-foreground">Logged in</span>
        </div> */}

        <div className="flex items-center gap-3">
          {/* <ThemeSwitch />
          <Button
            onPress={handleLogout}
            color="danger"
            variant="solid"
            size="sm"
            isIconOnly
          >
            <LogOut className="h-4 w-4" />
          </Button> */}

          <div className="flex items-center gap-4">
     
            <Dropdown placement="bottom-start">
              <DropdownTrigger>
                <User
                  as="button"
                  avatarProps={{
                    isBordered: true,
                    src: "/blank.jpg",
                  }}
                  className="transition-transform"
                  description="@tonyreichert"
                  name="Tony Reichert"
                />
              </DropdownTrigger>
              <DropdownMenu aria-label="User Actions" variant="flat">
                <DropdownItem key="profile" className="h-14 gap-2">
                  <p className="font-bold">Signed in as</p>
                  <p className="font-bold">@tonyreichert</p>
                </DropdownItem>
                <DropdownItem key="settings">My Settings</DropdownItem>
                <DropdownItem key="team_settings">Team Settings</DropdownItem>
                <DropdownItem key="analytics">Analytics</DropdownItem>
                <DropdownItem key="system">System</DropdownItem>
                <DropdownItem key="configurations">Configurations</DropdownItem>
                <DropdownItem key="help_and_feedback">Help & Feedback</DropdownItem>
                <DropdownItem key="logout" color="danger">
                  Log Out
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>

        </div>
      </div>
    </Header>
  );
}
