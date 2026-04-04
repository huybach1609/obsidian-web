"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";

import { animations, AnimationType } from "@/utils/animations";

export default function AnimatedContent({
  children,
  animationType = "fade",
  isContentLoading = false,
}: {
  children: React.ReactNode;
  animationType?: AnimationType;
  isContentLoading?: boolean;
}) {
  const pathname = usePathname();
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
        animate={
          shouldAnimate ? selectedAnimation.animate : selectedAnimation.initial
        }
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
        exit={selectedAnimation.exit}
        initial={selectedAnimation.initial}
        style={{ transformStyle: "preserve-3d" }}
        transition={selectedAnimation.transition}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
