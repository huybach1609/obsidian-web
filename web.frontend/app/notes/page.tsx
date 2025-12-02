import { EyeIcon } from '@heroicons/react/24/outline';

export default function NotesPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-background text-foreground">
      <EyeIcon className="h-16 w-16 text-gray-400 mb-4" />
      <h2 className="text-xl font-semibold text-gray-600">No File Selected</h2>
      <p className="text-gray-500 mt-2">Select a file from the sidebar to preview</p>
    </div>
  );
}