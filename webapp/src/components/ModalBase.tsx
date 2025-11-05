import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { createPortal } from 'react-dom';
import { Button } from './Button';
import { useAppReducedMotion } from '@/hooks/useAppReducedMotion';

/**
 * ModalBase Component
 * Base component for modals/dialogs
 * Provides backdrop, animation, and action buttons
 */

export interface ModalAction {
  /**
   * Button label
   */
  label: string;

  /**
   * Button variant (from Button component)
   */
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';

  /**
   * Callback when clicked
   */
  onClick: () => void;

  /**
   * Disable this button
   */
  disabled?: boolean;
}

export interface ModalBaseProps {
  /**
   * Whether modal is open
   */
  isOpen: boolean;

  /**
   * Modal title
   */
  title: string;

  /**
   * Modal content
   */
  children: ReactNode;

  /**
   * Action buttons at the bottom
   */
  actions?: ModalAction[];

  /**
   * Callback when closing modal
   */
  onClose: () => void;

  /**
   * Show close button (X) in top right
   */
  showClose?: boolean;

  /**
   * Modal size
   */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * ModalBase Component
 *
 * @example
 * // Simple modal with actions
 * <ModalBase
 *   isOpen={isOpen}
 *   title="Confirm Action"
 *   onClose={() => setIsOpen(false)}
 *   actions={[
 *     { label: 'Cancel', variant: 'secondary', onClick: () => setIsOpen(false) },
 *     { label: 'Confirm', variant: 'primary', onClick: handleConfirm },
 *   ]}
 * >
 *   Are you sure?
 * </ModalBase>
 *
 * @example
 * // Modal with custom content and close button
 * <ModalBase
 *   isOpen={isOpen}
 *   title="Level Up!"
 *   size="lg"
 *   showClose
 *   onClose={() => setIsOpen(false)}
 * >
 *   <h2>Congratulations!</h2>
 *   <p>You reached level {newLevel}</p>
 * </ModalBase>
 */
export function ModalBase({
  isOpen,
  title,
  children,
  actions = [],
  onClose,
  showClose = true,
  size = 'md',
}: ModalBaseProps) {
  const sizeStyles: Record<Required<ModalBaseProps>['size'], string> = {
    sm: 'w-[min(92vw,420px)]',
    md: 'w-[min(92vw,560px)]',
    lg: 'w-[min(92vw,720px)]',
  };
  const reduceMotion = useAppReducedMotion();
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [isOpen]);

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-layer-overlay-strong backdrop-blur-sm"
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
          />

          {/* Modal */}
          <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              ref={dialogRef}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 20 }}
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: reduceMotion ? 0 : 0.24, ease: 'easeOut' }}
              className={clsx(
                'pointer-events-auto flex w-full max-h-[85vh] flex-col gap-5 rounded-4xl border border-border-layer bg-surface-glass-strong p-6 shadow-elevation-4 backdrop-blur-xl sm:gap-6 sm:p-7',
                sizeStyles[size]
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-4">
                <h2 id={titleId} className="flex-1 text-heading font-semibold text-text-primary">
                  {title}
                </h2>

                {showClose && (
                  <button
                    onClick={onClose}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-layer-overlay-ghost-strong text-text-secondary transition-colors hover:bg-layer-overlay-strong hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface-primary"
                    aria-label="Close modal"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto pr-1 text-body text-text-secondary">
                {children}
              </div>

              {/* Actions */}
              {actions.length > 0 && (
                <div className="flex flex-wrap justify-end gap-3">
                  {actions.map((action, index) => (
                    <Button
                      key={index}
                      variant={action.variant || 'primary'}
                      size="md"
                      onClick={action.onClick}
                      disabled={action.disabled}
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  if (typeof document === 'undefined') {
    return modalContent;
  }

  return createPortal(modalContent, document.body);
}
