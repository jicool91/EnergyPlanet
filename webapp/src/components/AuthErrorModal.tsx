import { ModalBase } from './ModalBase';

/**
 * AuthErrorModal Component
 * Displays authentication error with retry option
 * Uses ModalBase for consistent styling and animation
 */

interface AuthErrorModalProps {
  isOpen: boolean;
  message: string;
  onRetry: () => void;
  onDismiss: () => void;
}

export function AuthErrorModal({
  isOpen,
  message,
  onRetry,
  onDismiss,
}: AuthErrorModalProps) {
  return (
    <ModalBase
      isOpen={isOpen}
      title="Ошибка авторизации"
      onClose={onDismiss}
      showClose={false}
      size="sm"
      actions={[
        {
          label: 'Закрыть',
          variant: 'secondary',
          onClick: onDismiss,
        },
        {
          label: 'Повторить',
          variant: 'primary',
          onClick: onRetry,
        },
      ]}
    >
      {message}
    </ModalBase>
  );
}
