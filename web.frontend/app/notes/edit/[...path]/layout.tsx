"use client";

import { useState } from "react";

import { EditPageProvider, useEditPage } from "@/contexts/EditPageContext";
import EditHeader from "@/app/_components/EditHeader";
import AnimatedContent from "@/app/_components/AnimatedContent";
import { AnimationType } from "@/utils/animations";

export default function EditLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <EditPageProvider>
      <div className="relative flex h-screen min-h-0 flex-col overflow-hidden">
        <EditHeader />
        <EditLayoutContent>{children}</EditLayoutContent>
      </div>
    </EditPageProvider>
  );
}
const EditLayoutContent = ({ children }: { children: React.ReactNode }) => {
  // Options: 'fade', 'zoomIn', 'zoomOut', 'slideLeft', 'slideRight',
  // 'slideUp', 'slideDown', 'rotate', 'flip', 'blur', 'scaleRotate', 'bounce'
  const [animationType] = useState<AnimationType>("blur");
  const { isContentLoading } = useEditPage();

  return (
    <AnimatedContent
      animationType={animationType}
      isContentLoading={isContentLoading}
    >
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </AnimatedContent>
  );
};
