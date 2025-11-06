import { motion } from 'framer-motion';
import type { Notification } from '../../store/uiStore';
import { useUIStore } from '../../store/uiStore';
import { Panel } from '../Panel';
import { Text } from '../ui/Text';
import { Button, type ButtonProps } from '../Button';

interface AlertProps {
  notification: Notification;
}

// Type-to-icon and color mapping
const ALERT_CONFIGS: Record<
  string,
  {
    icon: string;
    label: string;
    tone: 'success' | 'warning' | 'danger' | 'accent';
    buttonVariant: NonNullable<ButtonProps['variant']>;
  }
> = {
  success: {
    icon: '✓',
    label: 'Success',
    tone: 'success',
    buttonVariant: 'success',
  },
  error: {
    icon: '✕',
    label: 'Error',
    tone: 'danger',
    buttonVariant: 'danger',
  },
  warning: {
    icon: '⚠',
    label: 'Warning',
    tone: 'warning',
    buttonVariant: 'primary',
  },
  info: {
    icon: 'ⓘ',
    label: 'Information',
    tone: 'accent',
    buttonVariant: 'secondary',
  },
};

export function Alert({ notification }: AlertProps) {
  const removeNotification = useUIStore(state => state.removeNotification);
  const type = notification.icon || 'info';
  const config = ALERT_CONFIGS[type] || ALERT_CONFIGS.info;

  const handleDismiss = () => {
    notification.onDismiss?.();
    removeNotification(notification.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-layer-overlay-strong/70 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="w-[min(92vw,360px)] px-4"
      >
        <Panel tone="overlayStrong" border="accent" spacing="lg" className="shadow-elevation-4">
          <div className="flex items-center gap-4">
            <Text
              as="span"
              variant="hero"
              tone={config.tone}
              role="img"
              aria-label={config.label}
              className="drop-shadow-glow"
            >
              {config.icon}
            </Text>
            <div className="flex flex-col gap-xs">
              <Text as="h2" variant="title" weight="bold">
                {notification.title || 'Уведомление'}
              </Text>
              <Text variant="caption" tone="secondary">
                {config.label}
              </Text>
            </div>
          </div>

          <div>
            {notification.message.split(/\n+/).map(line => (
              <Text key={line} variant="body" tone="secondary">
                {line}
              </Text>
            ))}
          </div>

          <div className="flex justify-end">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant={config.buttonVariant} size="sm" onClick={handleDismiss}>
                ОК
              </Button>
            </motion.div>
          </div>
        </Panel>
      </motion.div>
    </motion.div>
  );
}
