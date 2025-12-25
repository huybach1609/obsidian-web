import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseSidebarOptions {
  /** Sidebar width in pixels (default: 256) */
  sidebarWidth?: number;
  /** Hover trigger zone width in pixels (default: 12) */
  hoverTriggerZone?: number;
  /** Whether the sidebar should be enabled (default: true) */
  enabled?: boolean;
}

export interface UseSidebarReturn {
  // State
  isCollapsed: boolean;
  isHoverRevealed: boolean;
  isSidebarVisible: boolean;
  
  // Refs
  sidebarRef: React.RefObject<HTMLDivElement>;
  
  // Framer Motion variants
  sidebarVariants: {
    expanded: { x: number; transition: { type: string; stiffness: number; damping: number } };
    collapsed: { x: number; transition: { type: string; stiffness: number; damping: number } };
  };
  
  // Public actions
  toggle: () => void;
  collapse: () => void;
  expand: () => void;
  
  // Event handlers for sidebar div
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
}

/**
 * Custom hook for managing sidebar state and interactions
 * 
 * Features:
 * - Collapsed/expanded states
 * - Keyboard shortcut (Ctrl/Cmd + \)
 * - Hover reveal on left edge
 * - Click outside to collapse
 */
export const useSidebar = (
  isMobile: boolean,
  isWebView: boolean,
  options: UseSidebarOptions = {}
): UseSidebarReturn => {
  const {
    sidebarWidth = 256,
    hoverTriggerZone = 12,
    enabled = true,
  } = options;

  // State: collapsed and hover-revealed
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHoverRevealed, setIsHoverRevealed] = useState(false);
  
  // Refs
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Public action: Toggle sidebar collapsed/expanded state
  const toggle = useCallback(() => {
    setIsCollapsed((prev) => {
      const newValue = !prev;
      // If toggling to expanded, clear hover reveal state
      if (newValue === false) {
        setIsHoverRevealed(false);
      }
      return newValue;
    });
  }, []);

  // Public action: Collapse sidebar
  const collapse = useCallback(() => {
    setIsCollapsed(true);
    setIsHoverRevealed(false);
  }, []);

  // Public action: Expand sidebar
  const expand = useCallback(() => {
    setIsCollapsed(false);
    setIsHoverRevealed(false);
  }, []);

  // Keyboard shortcut: Ctrl/Cmd + \ to toggle sidebar
  useEffect(() => {
    if (!enabled || isMobile || isWebView) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '\\' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        toggle();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled, isMobile, isWebView, toggle]);

  // Hover reveal: When collapsed, detect mouse near left edge (8-12px zone)
  useEffect(() => {
    if (!enabled || isMobile || isWebView || !isCollapsed) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      // Check if mouse is within trigger zone from left edge
      if (e.clientX <= hoverTriggerZone && e.clientX >= 0) {
        if (!isHoverRevealed) {
          // Clear any existing timeout
          if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
          }
          setIsHoverRevealed(true);
        }
      } else {
        // Mouse moved away from trigger zone, but don't hide immediately
        // We'll handle hiding on click outside or mouse leave
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
        }
      }
    };

    const handleMouseLeave = () => {
      // When mouse leaves the document, hide hover-revealed sidebar after a delay
      if (isHoverRevealed) {
        hoverTimeoutRef.current = setTimeout(() => {
          setIsHoverRevealed(false);
        }, 300);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, [enabled, isCollapsed, isHoverRevealed, isMobile, isWebView, hoverTriggerZone]);

  // Click outside to collapse when hover-revealed
  useEffect(() => {
    if (!enabled || !isHoverRevealed || !isCollapsed) {
      return;
    }

    const handleClickOutside = (e: MouseEvent) => {
      // If clicked outside the sidebar, collapse the hover-revealed sidebar
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setIsHoverRevealed(false);
      }
    };

    // Use capture phase to catch clicks before they propagate
    document.addEventListener('click', handleClickOutside, true);

    return () => {
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, [enabled, isHoverRevealed, isCollapsed]);

  // Framer Motion variants for sidebar animation using translateX
  const sidebarVariants = {
    expanded: {
      x: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      },
    },
    collapsed: {
      x: -sidebarWidth,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      },
    },
  };

  // Determine if sidebar should be visible (expanded OR hover-revealed)
  const isSidebarVisible = !isCollapsed || isHoverRevealed;

  // Event handlers for sidebar div
  const handleMouseEnter = useCallback(() => {
    // Keep sidebar visible when hovering over it while collapsed
    if (isCollapsed && isHoverRevealed) {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    }
  }, [isCollapsed, isHoverRevealed]);

  const handleMouseLeave = useCallback(() => {
    // Hide hover-revealed sidebar after delay when mouse leaves
    if (isCollapsed && isHoverRevealed) {
      hoverTimeoutRef.current = setTimeout(() => {
        setIsHoverRevealed(false);
      }, 300);
    }
  }, [isCollapsed, isHoverRevealed]);

  return {
    // State
    isCollapsed,
    isHoverRevealed,
    isSidebarVisible,
    
    // Refs
    sidebarRef,
    
    // Variants
    sidebarVariants,
    
    // Public actions
    toggle,
    collapse,
    expand,
    
    // Event handlers
    handleMouseEnter,
    handleMouseLeave,
  };
};

