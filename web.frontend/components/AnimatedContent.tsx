'use client';

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEditPage } from "@/contexts/EditPageContext";
import { useEffect, useState, useRef } from "react";
import { animations, AnimationType } from "@/utils/animations";

export default function AnimatedContent({ 
  children, 
  animationType = 'fade' 
}: { 
  children: React.ReactNode;
  animationType?: AnimationType;
}) {
  const pathname = usePathname();
  const { isContentLoading } = useEditPage();
  const [animationKey, setAnimationKey] = useState(pathname);
  const previousPathnameRef = useRef(pathname);

  // When pathname changes, update key immediately to trigger exit animation
  useEffect(() => {
    if (pathname !== previousPathnameRef.current) {
      previousPathnameRef.current = pathname;
      // Update key immediately to trigger fade out of old content
      setAnimationKey(pathname);
    }
  }, [pathname]);

  const selectedAnimation = animations[animationType];

  // Control animation based on loading state
  // When loading, keep at initial state (opacity 0) until content is ready
  // When loaded, animate to visible state (opacity 1)
  // This ensures: fade out old → wait for loading → fade in new
  const shouldAnimate = !isContentLoading;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={animationKey}
        initial={selectedAnimation.initial}
        animate={shouldAnimate ? selectedAnimation.animate : selectedAnimation.initial}
        exit={selectedAnimation.exit}
        transition={selectedAnimation.transition}
        className="flex-1 overflow-hidden"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

