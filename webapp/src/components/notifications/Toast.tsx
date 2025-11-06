import { motion } from 'framer-motion';
import clsx from 'clsx';
import type { Notification } from '../../store/uiStore';
import { useUIStore } from '../../store/uiStore';
import { Panel } from '../Panel';
import { Text } from '../ui/Text';

interface ToastProps {
  notification: Notification;
}

type ToastVariant = 'success' | 'error' | 'warning' | 'info' | 'star' | 'trophy';

const TOAST_CONFIG: Record<
  ToastVariant,
  {
    icon: string;
    label: string;
    indicator: string;
    tone: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger';
    panelClass?: string;
  }
> = {
  success: {
    icon: '✓',
    label: 'Успех',
    indicator: 'bg-feedback-success',
    tone: 'success',
    panelClass: 'border-feedback-success/50',
  },
  error: {
    icon: '✕',
    label: 'Ошибка',
    indicator: 'bg-feedback-error',
    tone: 'danger',
    panelClass: 'border-feedback-error/60',
  },
  warning: {
    icon: '⚠',
    label: 'Предупреждение',
    indicator: 'bg-feedback-warning',
    tone: 'warning',
    panelClass: 'border-feedback-warning/60',
  },
  info: {
    icon: 'ⓘ',
    label: 'Информация',
    indicator: 'bg-accent-cyan',
    tone: 'accent',
    panelClass: 'border-accent-cyan/50',
  },
  star: {
    icon: '★',
    label: 'Награда',
    indicator: 'bg-accent-gold',
    tone: 'accent',
    panelClass: 'border-accent-gold/60',
  },
  trophy: {
    icon: '🏆',
    label: 'Достижение',
    indicator: 'bg-accent-magenta',
    tone: 'accent',
    panelClass: 'border-accent-magenta/60',
  },
};

export function Toast({ notification }: ToastProps) {
  const removeNotification = useUIStore(state => state.removeNotification);
  const variant: ToastVariant = (notification.icon as ToastVariant) ?? 'info';
  const config = TOAST_CONFIG[variant] ?? TOAST_CONFIG.info;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      whileHover={{ translateY: -4 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
      aria-live="polite"
    >
      <Panel
        tone="overlayStrong"
        border="subtle"
        spacing="sm"
        className={clsx(
          'relative flex min-w-[280px] items-center gap-sm pr-sm sm:gap-md sm:pr-md',
          config.panelClass
        )}
      >
        <span
          className={clsx('absolute inset-y-sm left-0 w-[6px] rounded-full', config.indicator)}
          aria-hidden="true"
        />
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-layer-overlay-ghost-soft text-title">
          {config.icon}
        </div>
        <div className="flex flex-1 flex-col gap-xs">
          <Text variant="micro" tone={config.tone} transform="uppercase" weight="semibold">
            {config.label}
          </Text>
          <Text as="span" variant="bodySm" tone="primary">
            {notification.message}
          </Text>
        </div>
        <button
          onClick={() => removeNotification(notification.id)}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-layer-overlay-ghost-soft text-title text-text-secondary transition-colors hover:bg-layer-overlay-strong hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface-primary"
          aria-label="Закрыть уведомление"
          type="button"
        >
          ×
        </button>
      </Panel>
    </motion.div>
  );
}
