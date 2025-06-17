
import { useEffect, useRef } from 'react';

/**
 * Custom hook to focus a specific element within a container when a condition is met.
 * @param shouldFocus - Boolean condition to trigger the focus.
 * @param containerRef - React ref to the parent element containing the target focusable element.
 * @param querySelectorString - CSS selector to find the focusable element within the container.
 * @param focusDelay - Optional delay in milliseconds before attempting to focus (default: 150ms).
 */
export function useFocusOnCondition(
  shouldFocus: boolean,
  containerRef: React.RefObject<HTMLElement>,
  querySelectorString: string,
  focusDelay: number = 150
): void {
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (shouldFocus && containerRef.current) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = window.setTimeout(() => {
        const targetElement = containerRef.current?.querySelector<HTMLElement>(querySelectorString);
        if (targetElement && typeof targetElement.focus === 'function') {
          targetElement.focus();
        }
      }, focusDelay);
    }

    // Cleanup function to clear the timeout if the component unmounts
    // or if dependencies change causing the effect to re-run before timeout fires.
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [shouldFocus, containerRef, querySelectorString, focusDelay]); // Dependencies array
}
