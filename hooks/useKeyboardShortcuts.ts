import { useEffect } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  handler: (event: KeyboardEvent) => void;
  enabled?: boolean;
}

/**
 * Custom hook for registering keyboard shortcuts
 * @param shortcuts Array of keyboard shortcut configurations
 * @param dependencies Dependencies array for the effect
 */
export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  dependencies: React.DependencyList = []
) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      shortcuts.forEach((shortcut) => {
        // Skip if shortcut is disabled
        if (shortcut.enabled === false) {
          return;
        }

        // Check if the key matches
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();

        // Check modifier keys
        const ctrlMatches = shortcut.ctrlKey === undefined || event.ctrlKey === shortcut.ctrlKey;
        const metaMatches = shortcut.metaKey === undefined || event.metaKey === shortcut.metaKey;
        const shiftMatches = shortcut.shiftKey === undefined || event.shiftKey === shortcut.shiftKey;
        const altMatches = shortcut.altKey === undefined || event.altKey === shortcut.altKey;

        // If all conditions match, call the handler
        if (keyMatches && ctrlMatches && metaMatches && shiftMatches && altMatches) {
          // Prevent default behavior if handler exists
          event.preventDefault();
          shortcut.handler(event);
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts, ...dependencies]);
}

/**
 * Hook specifically for modal escape key handling
 * @param isOpen Whether the modal is open
 * @param onClose Callback to close the modal
 */
export function useEscapeKey(isOpen: boolean, onClose: () => void) {
  useKeyboardShortcuts(
    [
      {
        key: 'Escape',
        handler: onClose,
        enabled: isOpen,
      },
    ],
    [isOpen, onClose]
  );
}
