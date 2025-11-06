import { useEffect } from 'react';
import { CheckmarkAnimation } from './animations/CheckmarkAnimation';
import { Confetti } from './animations/Confetti';
import { ModalBase } from './ModalBase';
import { Panel } from './Panel';
import { Text } from './ui/Text';
import { useSoundEffect } from '@/hooks/useSoundEffect';

interface PurchaseSuccessModalProps {
  isOpen: boolean;
  itemName: string;
  quantity?: number;
  cost?: number;
  onDismiss: () => void;
  autoClose?: boolean;
  autoCloseDuration?: number;
}

/**
 * PurchaseSuccessModal: Displays success feedback with animations
 *
 * Features:
 * - Bounce-in modal animation
 * - Animated checkmark (SVG stroke)
 * - Confetti particle effect
 * - Success sound effect
 * - Auto-close after delay
 *
 * Example:
 * <PurchaseSuccessModal
 *   isOpen={true}
 *   itemName="Solar Panel"
 *   quantity={1}
 *   cost={5000}
 *   onDismiss={handleClose}
 * />
 */
export const PurchaseSuccessModal: React.FC<PurchaseSuccessModalProps> = ({
  isOpen,
  itemName,
  quantity = 1,
  cost,
  onDismiss,
  autoClose = true,
  autoCloseDuration = 2000,
}) => {
  const playSound = useSoundEffect();
  const purchaseMessage =
    quantity > 1 ? `Вы получили ${quantity}× ${itemName}.` : `Вы получили ${itemName}.`;

  // Play success sound and auto-close on mount
  useEffect(() => {
    if (isOpen) {
      playSound('success');

      if (autoClose) {
        const timer = setTimeout(onDismiss, autoCloseDuration);
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, playSound, autoClose, autoCloseDuration, onDismiss]);

  return (
    <>
      {isOpen && <Confetti count={32} duration={2.6} />}
      <ModalBase
        isOpen={isOpen}
        title="Покупка оформлена"
        onClose={onDismiss}
        showClose={false}
        size="sm"
        actions={[{ label: 'Продолжить', variant: 'success', onClick: onDismiss }]}
      >
        <div className="flex flex-col items-center gap-5 text-center">
          <CheckmarkAnimation size={84} color="#00ff88" duration={0.6} />
          <div className="flex flex-col gap-2">
            <Text as="p" variant="title" weight="bold" tone="success" className="m-0">
              Покупка завершена
            </Text>
            <Text as="p" variant="bodySm" tone="secondary" className="m-0">
              {purchaseMessage}
            </Text>
          </div>

          <Panel
            tone="overlay"
            border="accent"
            elevation="soft"
            spacing="sm"
            className="w-full text-left"
          >
            <div className="flex items-center justify-between gap-sm">
              <Text variant="caption" tone="secondary">
                Товар
              </Text>
              <Text variant="bodySm" weight="semibold">
                {itemName}
              </Text>
            </div>
            {quantity > 1 && (
              <div className="flex items-center justify-between gap-sm">
                <Text variant="caption" tone="secondary">
                  Количество
                </Text>
                <Text variant="bodySm" weight="semibold" tone="accent">
                  ×{quantity}
                </Text>
              </div>
            )}
            {cost !== undefined && (
              <div className="flex items-center justify-between gap-sm">
                <Text variant="caption" tone="secondary">
                  Списано
                </Text>
                <Text variant="bodySm" weight="semibold" tone="accent">
                  {cost.toLocaleString('ru-RU')} E
                </Text>
              </div>
            )}
          </Panel>

          <Text variant="caption" tone="tertiary">
            Бонус уже начислен на счёт — проверьте обновлённый баланс в магазине.
          </Text>
        </div>
      </ModalBase>
    </>
  );
};
