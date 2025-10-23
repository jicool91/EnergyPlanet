import { motion } from 'framer-motion';
import type { Notification } from '../../store/uiStore';
import { useUIStore } from '../../store/uiStore';

interface AlertProps {
  notification: Notification;
}

export function Alert({ notification }: AlertProps) {
  const removeNotification = useUIStore(state => state.removeNotification);

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
        {/* Header */}
        <div className="border-b border-dark-border px-6 py-4">
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
            className="px-6 py-2 rounded-lg bg-lime-500 hover:bg-lime-600 text-white font-medium transition-colors"
          >
            OK
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
