
import { useEffect, useRef } from 'react';

interface UseElementScrollOptions {
  scrollOptions?: ScrollIntoViewOptions;
  delay?: number; // Milliseconds
}

const defaultScrollOptions: ScrollIntoViewOptions = { behavior: 'smooth', block: 'start' };

export function useElementScroll(
  shouldScroll: boolean,
  elementRef: React.RefObject<HTMLElement>,
  options: UseElementScrollOptions = {}
): void {
  const { scrollOptions = defaultScrollOptions, delay = 150 } = options;
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (shouldScroll && elementRef.current) {
      // Clear any existing timeout to prevent multiple scrolls if shouldScroll toggles quickly
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => {
        elementRef.current?.scrollIntoView(scrollOptions);
      }, delay);
    }

    // Cleanup function to clear the timeout if the component unmounts
    // or if dependencies change causing the effect to re-run before timeout fires.
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [shouldScroll, elementRef, scrollOptions, delay]); // Dependencies array
}
