import { Button, ButtonGroup, Dropdown, Avatar } from "@heroui/react";
// import { useIsSSR } from "@react-aria/ssr";
import { useTheme } from "next-themes";
import {
  MoonIcon,
  SunIcon,
  PanelLeftClose,
  PanelLeftOpen,
  SettingsIcon,
  FileSearchCorner,
  ChevronsUpDown,
} from "lucide-react";
import { useRouter } from "next/navigation";

import Header from "../Header";

import { useAppSettings } from "@/contexts/AppContext";

export const LeftSideBarTop = ({
  handleLogout,
  isMobile,
  onToggleSidebar,
  isCollapsed,
}: {
  handleLogout: () => void;
  isMobile: boolean;
  onToggleSidebar?: () => void;
  isCollapsed?: boolean;
}) => {
  const router = useRouter();
  const { theme, resolvedTheme } = useTheme();
  const { setThemeMode, editMode, setEditMode } = useAppSettings();
  // const isSSR = useIsSSR();
  const activeTheme = (resolvedTheme ?? theme ?? "obsidian") as
    | "obsidian"
    | "obsidian-dark";
  const isDarkTheme = activeTheme === "obsidian-dark";

  const onChange = () => {
    const nextTheme = activeTheme === "obsidian" ? "obsidian-dark" : "obsidian";

    setThemeMode(nextTheme);
  };

  const onToggleEditMode = () => {
    setEditMode(!editMode);
  };

  // if (isMobile) {
  //   return (
  //     <Header className="flex items-center justify-between ">
  //       <Dropdown className="before:bg-default-200 bg-background/90 text-foreground border-none backdrop-blur-xs">
  //         <Button
  //           aria-label="User menu"
  //           className="h-auto min-w-0 rounded-full p-0"
  //           variant="ghost"
  //         >
  //           <Avatar className="transition-transform" size="sm">
  //             <Avatar.Image alt="Admin" src="/blank.webp" />
  //             <Avatar.Fallback delayMs={600}>Admin</Avatar.Fallback>
  //           </Avatar>
  //         </Button>
  //         <Dropdown.Popover>
  //           <Dropdown.Menu aria-label="User Actions">
  //             <Dropdown.Section>
  //               <div className="px-3 py-1 text-xs text-foreground-500">
  //                 Options
  //               </div>
  //               <Dropdown.Item
  //                 key="settings"
  //                 onPress={() => router.push("/settings")}
  //               >
  //                 My Settings
  //               </Dropdown.Item>
  //               <Dropdown.Item id="edit_mode" onPress={onToggleEditMode}>
  //                 <div className="flex items-center justify-between gap-2">
  //                   <div>Edit mode</div>
  //                   <div className="text-xs text-foreground-500">
  //                     {editMode ? "On" : "Off"}
  //                   </div>
  //                 </div>
  //               </Dropdown.Item>
  //             </Dropdown.Section>

  //             <Dropdown.Item id="theme_switch" onPress={onChange}>
  //               <div className="flex items-center justify-between gap-2">
  //                 <div>Theme switch</div>
  //                 <div>
  //                   {!isDarkTheme ? (
  //                     <SunIcon size={15} />
  //                   ) : (
  //                     <MoonIcon size={15} />
  //                   )}
  //                 </div>
  //               </div>
  //             </Dropdown.Item>
  //             <Dropdown.Item id="logout" onPress={handleLogout}>
  //               Log Out
  //             </Dropdown.Item>
  //           </Dropdown.Menu>
  //         </Dropdown.Popover>
  //       </Dropdown>

  //       <ButtonGroup className="">
  //         <ToggleSidebarButton
  //           className="bg-foreground/10"
  //           isCollapsed={isCollapsed ?? false}
  //           onToggleSidebar={onToggleSidebar ?? (() => {})}
  //         />
  //       </ButtonGroup>
  //     </Header>
  //   );
  // }

  return (
    <Header>
      <ButtonGroup className="flex items-center justify-between h-full">
        <Dropdown className="w-full">
          <Button
            aria-label="User menu"
            className="gap-2 w-full p-3 justify-between"
            variant="tertiary"
          >
            <p className="font-bold text-foreground">@Admin</p>
            <ChevronsUpDown className="w-4 h-4 text-foreground" />
          </Button>

          <Dropdown.Popover>
            <Dropdown.Menu aria-label="User Actions">
              <Dropdown.Item className="gap-2" id="profile">
                <p className="font-bold">Signed in as</p>
                <p className="font-bold">@admin</p>
              </Dropdown.Item>
              <Dropdown.Item
                id="settings"
                onPress={() => router.push("/settings")}
              >
                <div className="flex items-center gap-2">
                  <SettingsIcon size={15} />
                  Settings
                </div>
              </Dropdown.Item>
              <Dropdown.Item id="edit_mode" onPress={onToggleEditMode}>
                <div className="flex items-center justify-between gap-2 w-full">
                  <div>Edit mode</div>
                  <div className="text-xs text-foreground-500">
                    {editMode ? "On" : "Off"}
                  </div>
                </div>
              </Dropdown.Item>
              <Dropdown.Item id="theme_switch" onPress={onChange}>
                <div className="flex items-center justify-between gap-2 w-full">
                  <div>Theme switch</div>
                  <div>
                    {!isDarkTheme ? (
                      <SunIcon size={15} />
                    ) : (
                      <MoonIcon size={15} />
                    )}
                  </div>
                </div>
              </Dropdown.Item>
              <Dropdown.Item id="logout" onPress={handleLogout}>
                Log Out
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
        {isMobile && (
          <Button
            isIconOnly
            aria-label="Open search"
            className="p-0 md:p-5"
            variant="tertiary"
            onPress={() => {
              // Simulate Ctrl+K to open CommandMenu
              if (typeof document !== "undefined") {
                const event = new KeyboardEvent("keydown", {
                  key: "k",
                  ctrlKey: true,
                });

                document.dispatchEvent(event);
              }
            }}
          >
            <ButtonGroup.Separator />
            <FileSearchCorner className=" text-foreground" />
          </Button>
        )}
        {/* Sidebar Toggle Button */}
        <ToggleSidebarButton
          className=" p-3 pr-3 "
          isCollapsed={isCollapsed ?? false}
          onToggleSidebar={onToggleSidebar ?? (() => {})}
        />
      </ButtonGroup>
    </Header>
  );
};
const ToggleSidebarButton = ({
  className,
  isCollapsed,
  onToggleSidebar,
}: {
  className: string;
  isCollapsed: boolean;
  onToggleSidebar: () => void;
}) => {
  return (
    onToggleSidebar && (
      <Button
        isIconOnly
        aria-label="Toggle sidebar"
        className={className}
        variant="tertiary"
        onPress={onToggleSidebar}
      >
        <ButtonGroup.Separator />
        {isCollapsed ? (
          <PanelLeftOpen className="h-5 w-5 text-foreground" />
        ) : (
          <PanelLeftClose className="h-5 w-5 text-foreground" />
        )}
      </Button>
    )
  );
};
