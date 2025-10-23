import { motion } from 'framer-motion';
import type { Notification } from '../../store/uiStore';
import { useUIStore } from '../../store/uiStore';

interface AlertProps {
  notification: Notification;
}

// Type-to-icon and color mapping
const ALERT_CONFIGS: Record<
  string,
  { icon: string; headerBg: string; accentColor: string }
> = {
  success: {
    icon: '✓',
    headerBg: 'from-lime-500/20 to-lime-500/10',
    accentColor: 'bg-lime-500 hover:bg-lime-600',
  },
  error: {
    icon: '✕',
    headerBg: 'from-red-500/20 to-red-500/10',
    accentColor: 'bg-red-500 hover:bg-red-600',
  },
  warning: {
    icon: '⚠',
    headerBg: 'from-amber-500/20 to-amber-500/10',
    accentColor: 'bg-amber-500 hover:bg-amber-600',
  },
  info: {
    icon: 'ⓘ',
    headerBg: 'from-blue-500/20 to-blue-500/10',
    accentColor: 'bg-blue-500 hover:bg-blue-600',
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
      className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm"
      style={{
        background: 'rgba(0, 0, 0, 0.5)',
      }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="bg-gradient-to-b from-dark-card to-dark-bg border border-dark-border rounded-2xl shadow-2xl max-w-sm mx-4 overflow-hidden"
      >
        {/* Header with Icon */}
        <div className={`bg-gradient-to-r ${config.headerBg} border-b border-dark-border px-6 py-4 flex items-center gap-4`}>
          <div className="text-4xl">{config.icon}</div>
          <h2 className="text-xl font-bold text-white">{notification.title || 'Alert'}</h2>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          <p className="text-gray-300 text-sm leading-relaxed">{notification.message}</p>
        </div>

        {/* Footer */}
        <div className="border-t border-dark-border px-6 py-4 flex gap-3 justify-end">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDismiss}
            className={`px-6 py-2 rounded-lg ${config.accentColor} text-white font-medium transition-colors`}
          >
            OK
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
