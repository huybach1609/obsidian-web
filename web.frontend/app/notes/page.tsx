import { AlarmClockOff } from "lucide-react";

import HelpSheet from "@/app/_components/HelpSheet";

export default function NotesPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-background text-foreground">
      <AlarmClockOff className="h-16 w-16 text-foreground/60 mb-4" />
      <h2 className="text-xl font-semibold text-foreground/80">
        No File Selected
      </h2>
      <p className="text-foreground/60 mt-2">
        Select a file from the sidebar to preview
      </p>
      <HelpSheet />
    </div>
  );
}
