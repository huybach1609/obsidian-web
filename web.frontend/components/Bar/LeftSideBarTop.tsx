import { useAppSettings } from "@/contexts/AppContext";
import {
  Button,
  ButtonGroup,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownSection,
  DropdownTrigger,
  User,
} from "@heroui/react";
import { useIsSSR } from "@react-aria/ssr";
import { useTheme } from "next-themes";
import Header from "../Header";
import {
  EllipsisVertical,
  MoonIcon,
  SunIcon,
  PanelLeftClose,
  PanelLeftOpen,
  SettingsIcon,
  FileSearchCorner,
} from "lucide-react";
import { useRouter } from "next/navigation";

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
  const isSSR = useIsSSR();
  const activeTheme = (resolvedTheme ?? theme ?? "light") as "light" | "dark";

  const onChange = () => {
    const nextTheme = activeTheme === "light" ? "dark" : "light";
    setThemeMode(nextTheme);
  };

  const onToggleEditMode = () => {
    setEditMode(!editMode);
  };

  if (isMobile) {
    return (
      <Header className="flex items-center justify-between ">
        <Dropdown
          placement="bottom-start"
          classNames={{
            base: "before:bg-default-200", // change arrow background
            content:
              "bg-background/90 text-foreground border-none backdrop-blur-xs",
          }}
        >
          
          <DropdownTrigger>
            <User
              as="button"
              avatarProps={{
                isBordered: true,
                src: "/blank.webp",
              }}
              className="transition-transform"
              description="@admin_123"
              name="Admin"
            />
          </DropdownTrigger>
          <DropdownMenu aria-label="User Actions" variant="flat">
            <DropdownSection title="Options">
              <DropdownItem
                key="settings"
                onPress={() => router.push("/settings")}
              >
                My Settings
              </DropdownItem>
              <DropdownItem key="edit_mode" onPress={onToggleEditMode}>
                <div className="flex items-center justify-between gap-2">
                  <div>Edit mode</div>
                  <div className="text-xs text-foreground-500">
                    {editMode ? "On" : "Off"}
                  </div>
                </div>
              </DropdownItem>
            </DropdownSection>

            <DropdownItem key="theme_switch" onPress={onChange}>
              <div className="flex items-center justify-between gap-2">
                <div>Theme switch</div>
                <div>
                  {activeTheme === "light" || isSSR ? (
                    <SunIcon size={15} />
                  ) : (
                    <MoonIcon size={15} />
                  )}
                </div>
              </div>
            </DropdownItem>
            <DropdownItem key="logout" color="danger" onPress={handleLogout}>
              Log Out
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>

        <ButtonGroup className="">
          <Button
            variant="light"
            isIconOnly
            className="bg-foreground/10"
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
            aria-label="Open search"
          >
            <FileSearchCorner className="h-5 w-5 text-foreground" />
          </Button>
          <ToggleSidebarButton
            className="bg-foreground/10"
            isCollapsed={isCollapsed ?? false}
            onToggleSidebar={onToggleSidebar ?? (() => {})}
          />
        </ButtonGroup>
      </Header>
    );
  }

  return (
    <Header>
      <div className="flex items-center justify-between h-full gap-2">
        <Dropdown
          placement="bottom-start"
          classNames={{
            base: "before:bg-default-200", // change arrow background
            content:
              "bg-background/90 text-foreground border-none backdrop-blur-xs",
          }}
        >
          <DropdownTrigger>
            <User
              as="button"
              avatarProps={{
                isBordered: true,
                src: "/blank.webp",
              }}
              className="transition-transform"
              description="@admin"
              name="Admin"
            />
          </DropdownTrigger>
          <DropdownMenu aria-label="User Actions" variant="flat">
            <DropdownItem key="profile" className="h-14 gap-2">
              <p className="font-bold">Signed in as</p>
              <p className="font-bold">@admin</p>
            </DropdownItem>
            <DropdownItem
              startContent={<SettingsIcon size={15} />}
              key="settings"
              onPress={() => router.push("/settings")}
            >
              Settings
            </DropdownItem>
            <DropdownItem key="edit_mode" onPress={onToggleEditMode}>
              <div className="flex items-center justify-between gap-2">
                <div>Edit mode</div>
                <div className="text-xs text-foreground-500">
                  {editMode ? "On" : "Off"}
                </div>
              </div>
            </DropdownItem>
            <DropdownItem key="theme_switch" onPress={onChange}>
              <div className="flex items-center justify-between gap-2">
                <div>Theme switch</div>
                <div>
                  {activeTheme === "light" || isSSR ? (
                    <SunIcon size={15} />
                  ) : (
                    <MoonIcon size={15} />
                  )}
                </div>
              </div>
            </DropdownItem>
            <DropdownItem key="logout" color="danger" onPress={handleLogout}>
              Log Out
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>

        {/* Sidebar Toggle Button */}
        <ToggleSidebarButton
          className=""
          isCollapsed={isCollapsed ?? false}
          onToggleSidebar={onToggleSidebar ?? (() => {})}
        />

      </div>
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
        variant="light"
        className={className}
        isIconOnly
        onPress={onToggleSidebar}
        aria-label="Toggle sidebar"
      >
        {isCollapsed ? (
          <PanelLeftOpen className="h-5 w-5 text-foreground" />
        ) : (
          <PanelLeftClose className="h-5 w-5 text-foreground" />
        )}
      </Button>
    )
  );
};
