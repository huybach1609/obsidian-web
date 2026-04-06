"use client";

import type { Key, Selection } from "@react-types/shared";

import { useCallback, useMemo } from "react";
import { SunIcon, Undo2, UserIcon } from "lucide-react";
import { Header, ListBox } from "@heroui/react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { VimLogoIcon } from "../icons/VimLogoIcon";

/** Item id → next path (single source for navigation + selection sync). */
const HREF_BY_ITEM_ID: Record<string, string> = {
  appearance: "/settings",
  "Vim mode": "/settings/vim",
  account: "/settings/account",
  back: "/",
};

/** Current path → ListBox item id for controlled selection. */
const SELECTED_ID_BY_PATH: Record<string, Key> = {
  "/settings": "appearance",
  "/settings/vim": "Vim mode",
  "/settings/account": "account",
};

const rowClass = "flex items-center gap-2";

export const SettingSideBarBottom = () => {
  const router = useRouter();
  const pathname = usePathname();

  const selectedKeys = useMemo(() => {
    const id = SELECTED_ID_BY_PATH[pathname];

    return id !== undefined ? new Set<Key>([id]) : new Set<Key>();
  }, [pathname]);

  const onSelectionChange = useCallback(
    (keys: Selection) => {
      if (keys === "all") return;
      const id = keys.values().next().value as Key | undefined;

      if (id === undefined) return;
      const href = HREF_BY_ITEM_ID[String(id)];

      if (href !== undefined) {
        router.push(href);
      }
    },
    [router],
  );

  return (
    <ListBox
      aria-label="Settings"
      selectedKeys={selectedKeys}
      selectionMode="single"
      onSelectionChange={onSelectionChange}
    >
      <ListBox.Section>
        <Header>General</Header>
        <ListBox.Item id="appearance" textValue="Appearance">
          <div className={rowClass}>
            <SunIcon size={15} />
            <span>Appearance</span>
          </div>
        </ListBox.Item>
        <ListBox.Item id="Vim mode" textValue="Vim mode">
          <div className={rowClass}>
            <VimLogoIcon />
            <span>Vim mode</span>
          </div>
        </ListBox.Item>
      </ListBox.Section>
      <ListBox.Section>
        <Header>Account</Header>
        <ListBox.Item id="account" textValue="Account">
          <div className={rowClass}>
            <UserIcon size={15} />
            <span>Account</span>
          </div>
        </ListBox.Item>
      </ListBox.Section>
      <ListBox.Item id="back" textValue="Back">
        <div className={rowClass}>
          <Undo2 size={15} />
          <span>Back</span>
        </div>
      </ListBox.Item>
    </ListBox>
  );
};
