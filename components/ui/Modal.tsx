
import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@/components/icons'; // Assuming you have an XMarkIcon

interface ModalAction {
  label: string;
  onClick: () => void;
  className?: string;
  ariaLabel?: string;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  primaryAction?: ModalAction;
  secondaryAction?: ModalAction;
  size?: 'sm' | 'md' | 'lg' | 'xl'; // sm: max-w-md, md: max-w-lg, lg: max-w-xl, xl: max-w-3xl
  hideCloseButton?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  icon,
  primaryAction,
  secondaryAction,
  size = 'md',
  hideCloseButton = false,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      modalRef.current?.focus(); // Focus the modal content when it opens
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-xl',
    xl: 'max-w-3xl',
  };

  const modalVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: "circOut" } },
    exit: { opacity: 0, y: 30, scale: 0.98, transition: { duration: 0.2, ease: "circIn" } },
  };
  
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.15 } },
  };


  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 20, 10, 0.4)', backdropFilter: 'blur(10px) saturate(120%)', WebkitBackdropFilter: 'blur(10px) saturate(120%)' }}
          onClick={onClose} // Close on backdrop click
          aria-labelledby="modal-title"
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            ref={modalRef}
            tabIndex={-1} // Make it focusable
            variants={modalVariants}
            className={`bg-glass p-6 rounded-xl shadow-xl w-full ${sizeClasses[size]} flex flex-col outline-none`}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal content
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                {icon && <span className="mr-3 flex-shrink-0">{icon}</span>}
                <h2 id="modal-title" className="text-xl font-semibold text-[var(--text-headings)]">
                  {title}
                </h2>
              </div>
              {!hideCloseButton && (
                <button
                  onClick={onClose}
                  className="p-1.5 -mr-1.5 -mt-1.5 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]"
                  aria-label="Close modal"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="text-sm text-[var(--text-primary)] mb-6 flex-grow" id="modal-description">
              {children}
            </div>

            {(primaryAction || secondaryAction) && (
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 space-y-2 sm:space-y-0 space-y-reverse">
                {secondaryAction && (
                  <button
                    onClick={secondaryAction.onClick}
                    className={`btn ${secondaryAction.className || 'btn-secondary'}`}
                    aria-label={secondaryAction.ariaLabel || secondaryAction.label}
                  >
                    {secondaryAction.label}
                  </button>
                )}
                {primaryAction && (
                  <button
                    onClick={primaryAction.onClick}
                    className={`btn ${primaryAction.className || 'btn-primary'}`}
                    aria-label={primaryAction.ariaLabel || primaryAction.label}
                  >
                    {primaryAction.label}
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
