import { Link, Listbox, ListboxItem, ListboxSection } from "@heroui/react"
import { ArrowLeftIcon, SunIcon, Undo2, UserIcon } from "lucide-react"
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
        } else if (selectedKey === "appearance") {
            router.push("/settings")
        } else if (selectedKey === "account") {
            router.push("/settings/account")
        }
    }

    const selectedKeys = pathname === "/settings/vim" ? new Set(["Vim mode"]) :
        pathname === "/settings" ? new Set(["theme"]) :
            pathname === "/settings/account" ? new Set(["account"]) :
                new Set<string>()

    return (
        <div className="">

            <Listbox
                aria-label="Settings"
                className="p-[5px] gap-0 divide-y  overflow-visible "
                itemClasses={{
                    base: "px-[5px] rounded-full gap-[5px]  data-[hover=true]:bg-default-100/80",
                }}
                selectedKeys={selectedKeys}
                onSelectionChange={handleSelectionChange}
                selectionMode="single"
            >
                <ListboxSection title="General">
                    <ListboxItem key="appearance" startContent={<SunIcon size={15} />}>
                        <div>Appearance</div>
                    </ListboxItem>
                    <ListboxItem key="Vim mode" startContent={<img src="/Vimlogo.svg" alt="Vim" className="h-4 w-4" />}>
                        <div>Vim mode</div>
                    </ListboxItem>
                </ListboxSection>
                <ListboxSection title="Account">
                    <ListboxItem key="account" startContent={<UserIcon size={15} />}>
                        <div>Account</div>
                    </ListboxItem>
                </ListboxSection>
                <ListboxItem key="back" startContent={<Undo2 size={15} />} onPress={() => router.push('/')}>
                    <div>Back</div>
                </ListboxItem>
            </Listbox>
        </div>
    )
}