import { useAppSettings } from "@/contexts/AppContext";
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, User } from "@heroui/react";
import { useIsSSR } from "@react-aria/ssr";
import { useTheme } from "next-themes";
import Header from "../Header";
import { EllipsisVertical, MoonIcon, SunIcon } from "lucide-react";
import router from "next/router";

export const LeftSideBarTop = ({ handleLogout, isMobile }: { handleLogout: () => void, isMobile: boolean }) => {
  const { theme, resolvedTheme } = useTheme();
  const { setThemeMode } = useAppSettings();
  const isSSR = useIsSSR();
  const activeTheme = (resolvedTheme ?? theme ?? "light") as "light" | "dark";

  const onChange = () => {
    const nextTheme = activeTheme === "light" ? "dark" : "light";
    setThemeMode(nextTheme);
  };

  if (isMobile) {
    return (
      <Header className="flex items-center justify-between ">
        <div className="flex items-center justify-between h-full">
          <Dropdown placement="bottom-start">
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
              <DropdownItem key="settings" onPress={() => router.push('/settings')}>My Settings</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>

        <Dropdown>
          <DropdownTrigger>
            <Button variant="light" isIconOnly><EllipsisVertical className="h-5 w-5 text-foreground" /></Button>
          </DropdownTrigger>
          <DropdownMenu aria-label="" >
            <DropdownItem key="profile" className="h-14 gap-2">
              <p className="font-bold">Signed in as</p>
              <p className="font-bold">@admin</p>
            </DropdownItem>
            <DropdownItem key="theme_switch" onPress={onChange} >
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
      </Header>
    );
  }

  return (
    <Header>
      <div className="flex items-center justify-between h-full">
        <Dropdown placement="bottom-start">
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
            <DropdownItem key="settings" onPress={() => router.push('/settings')}>My Settings</DropdownItem>
            <DropdownItem key="theme_switch" onPress={onChange} >
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
      </div>
    </Header>
  );
}
