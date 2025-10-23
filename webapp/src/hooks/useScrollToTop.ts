/**
 * Custom hook for smooth scroll-to-top functionality
 * Provides ref and scroll function for scrollable containers
 */

import { useRef, useCallback } from 'react';

interface UseScrollToTopReturn {
  scrollRef: React.RefObject<HTMLDivElement>;
  scrollToTop: (smooth?: boolean) => void;
}

export function useScrollToTop(): UseScrollToTopReturn {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToTop = useCallback((smooth = true) => {
    if (!scrollRef.current) return;

    if (smooth) {
      scrollRef.current.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    } else {
      scrollRef.current.scrollTop = 0;
    }
  }, []);

  return {
    scrollRef,
    scrollToTop,
  };
}
