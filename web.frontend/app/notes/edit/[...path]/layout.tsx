'use client';

import { EditPageProvider, useEditPage } from "@/contexts/EditPageContext";
import EditHeader from "@/components/EditHeader";
import AnimatedContent from "@/components/AnimatedContent";
import { useState } from "react";
import { AnimationType } from "@/utils/animations";

export default function EditLayout({
  children,
}: {
  children: React.ReactNode;
}) {


  return (
    <EditPageProvider>
      <div className="h-screen overflow-hidden relative flex flex-col">
        <EditHeader />
        <EditLayoutContent>
          {children}
        </EditLayoutContent>
      </div>
    </EditPageProvider>
  );
}
const EditLayoutContent = ({ children }: { children: React.ReactNode }) => {
  // Options: 'fade', 'zoomIn', 'zoomOut', 'slideLeft', 'slideRight', 
  // 'slideUp', 'slideDown', 'rotate', 'flip', 'blur', 'scaleRotate', 'bounce'
  const [animationType] = useState<AnimationType>('blur');
  const { isContentLoading } = useEditPage();

  return (
    <AnimatedContent animationType={animationType} isContentLoading={isContentLoading}>
      {children}
    </AnimatedContent>
  );
}