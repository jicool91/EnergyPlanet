import { ModalBase } from './ModalBase';
import { Panel } from './Panel';
import { Text } from './ui/Text';

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

export function AuthErrorModal({ isOpen, message, onRetry, onDismiss }: AuthErrorModalProps) {
  const messageLines = message.split(/\n+/).filter(Boolean);

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
      <Panel tone="overlay" border="accent" spacing="sm">
        <Text variant="title" weight="semibold" tone="danger">
          Не удалось подтвердить доступ
        </Text>
        <div className="flex flex-col gap-xs">
          {messageLines.length > 0 ? (
            messageLines.map(line => (
              <Text key={line} variant="bodySm" tone="secondary">
                {line}
              </Text>
            ))
          ) : (
            <Text variant="bodySm" tone="secondary">
              Попробуйте войти ещё раз — мы повторно вызовем авторизацию Telegram.
            </Text>
          )}
          <Text variant="caption" tone="tertiary">
            Если ошибка сохраняется, очистите веб-превью Telegram и перезапустите мини-приложение.
          </Text>
        </div>
      </Panel>
    </ModalBase>
  );
}
