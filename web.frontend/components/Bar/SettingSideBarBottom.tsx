import { Link, Listbox, ListboxItem, ListboxSection } from "@heroui/react"
import {  SunIcon, UserIcon } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import type { Selection } from "@react-types/shared"

export const SettingSideBarBottom = () => {
    const router = useRouter()
    const pathname = usePathname()

    const handleSelectionChange = (keys: Selection) => {
        if (keys === "all" || !keys) return
        const selectedKey = Array.from(keys)[0] as string
        if (selectedKey === "Vim mode") {
            router.push("/settings/vim")
        } else if (selectedKey === "theme") {
            router.push("/settings")
        } else if (selectedKey === "appearance") {
            router.push("/settings")
        } else if (selectedKey === "account") {
            router.push("/settings")
        }
    }

    const selectedKeys = pathname === "/settings/vim" ? new Set(["Vim mode"]) : 
                         pathname === "/settings" ? new Set(["theme"]) : 
                         new Set<string>()

    return (
        <div className="">
            <Link href="/">back</Link>
            
            <Listbox 
                aria-label="Settings"
                className="p-2 gap-0 divide-y  overflow-visible "
                itemClasses={{
                    base: "px-3 first:rounded-t-medium last:rounded-b-medium rounded-none gap-3 h-12 data-[hover=true]:bg-default-100/80",
                }}
                selectedKeys={selectedKeys}
                onSelectionChange={handleSelectionChange}
                selectionMode="single"
            >
                <ListboxSection title="General">
                    <ListboxItem key="theme" startContent={<SunIcon size={15} />}>
                        <div>Theme</div>
                    </ListboxItem>
                    <ListboxItem key="Vim mode" startContent={<img src="/Vimlogo.svg" alt="Vim" className="h-4 w-4" />}>
                        <div>Vim mode</div>
                    </ListboxItem>
                </ListboxSection>
                <ListboxSection title="Appearance">
                    <ListboxItem key="appearance" startContent={<SunIcon size={15} />}>
                        <div>Appearance</div>
                    </ListboxItem>
                </ListboxSection>
                <ListboxSection title="Account">
                    <ListboxItem key="account" startContent={<UserIcon size={15} />}>
                        <div>Account</div>
                    </ListboxItem>
                </ListboxSection>
            </Listbox>
        </div>
    )
}