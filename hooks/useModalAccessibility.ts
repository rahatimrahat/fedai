
import { useEffect, useRef } from 'react';

export function useModalAccessibility(
  isOpen: boolean,
  modalRef: React.RefObject<HTMLElement>, // Ref to the modal content container
  elementToFocusOnCloseRef?: React.RefObject<HTMLElement>, // Ref to element that triggered modal
  onEscapeKeyDown?: () => void // Optional callback for Escape key
): void {
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      // Store the element that had focus before the modal opened
      previouslyFocusedElementRef.current = document.activeElement as HTMLElement;

      // Focus the modal content container itself (or a specific focusable element within it)
      // Delay focus slightly to ensure modal is fully rendered and transitions complete
      const focusTimeoutId = setTimeout(() => {
        modalRef.current?.focus(); 
      }, 100); // Adjust delay as needed

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          if (onEscapeKeyDown) {
            onEscapeKeyDown();
          }
          // Default behavior could be to close the modal if no specific callback is provided,
          // but that logic should ideally reside with the modal's open/close state management.
          // This hook focuses on accessibility aspects tied to the modal's visibility.
        }
      };

      document.addEventListener('keydown', handleKeyDown);

      return () => {
        clearTimeout(focusTimeoutId);
        document.removeEventListener('keydown', handleKeyDown);
        // Restore focus to the element that opened the modal, or the fallback
        if (elementToFocusOnCloseRef?.current) {
          elementToFocusOnCloseRef.current.focus();
        } else {
          previouslyFocusedElementRef.current?.focus();
        }
      };
    }
  }, [isOpen, modalRef, elementToFocusOnCloseRef, onEscapeKeyDown]);
}
