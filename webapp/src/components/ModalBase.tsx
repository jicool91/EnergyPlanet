import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './Button';
import clsx from 'clsx';

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
  children: React.ReactNode;

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
export const ModalBase: React.FC<ModalBaseProps> = ({
  isOpen,
  title,
  children,
  actions = [],
  onClose,
  showClose = true,
  size = 'md',
}) => {
  const sizeStyles: Record<Required<ModalBaseProps>['size'], string> = {
    sm: 'w-[min(92vw,420px)]',
    md: 'w-[min(92vw,560px)]',
    lg: 'w-[min(92vw,720px)]',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 backdrop-blur-sm z-40"
            style={{
              background: 'color-mix(in srgb, var(--app-bg) 60%, transparent)',
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className={clsx(
              'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50',
              'bg-[var(--app-bg)] rounded-xl border border-[var(--color-border-subtle)] shadow-xl backdrop-blur-md',
              'max-h-[85vh] flex flex-col gap-5 p-5 sm:gap-6 sm:p-6',
              sizeStyles[size]
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-heading font-semibold text-token-primary flex-1">{title}</h2>

              {showClose && (
                <button
                  onClick={onClose}
                  className="text-token-secondary hover:text-token-primary transition-colors focus-ring"
                  aria-label="Close modal"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            <div className="flex-1 overflow-y-auto pr-1 text-body text-token-secondary">
              {children}
            </div>

            {/* Actions */}
            {actions.length > 0 && (
              <div className="flex gap-3 justify-end flex-wrap">
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
        </>
      )}
    </AnimatePresence>
  );
};
