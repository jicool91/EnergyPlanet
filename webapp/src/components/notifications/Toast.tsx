import { motion } from 'framer-motion';
import type { Notification } from '../../store/uiStore';
import { useUIStore } from '../../store/uiStore';

interface ToastProps {
  notification: Notification;
}

const ICON_COLORS: Record<string, string> = {
  success: 'bg-lime-500 text-white',
  error: 'bg-red-500 text-white',
  warning: 'bg-amber-500 text-white',
  info: 'bg-blue-500 text-white',
  star: 'bg-yellow-500 text-white',
  trophy: 'bg-orange-500 text-white',
};

const ICON_SYMBOLS: Record<string, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ⓘ',
  star: '★',
  trophy: '🏆',
};

export function Toast({ notification }: ToastProps) {
  const removeNotification = useUIStore(state => state.removeNotification);
  const icon = notification.icon || 'info';
  const colorClass = ICON_COLORS[icon] || ICON_COLORS.info;
  const symbol = ICON_SYMBOLS[icon] || ICON_SYMBOLS.info;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="flex items-center gap-3 bg-dark-card border border-dark-border rounded-lg px-4 py-3 shadow-lg backdrop-blur-sm min-w-[280px]"
    >
      {/* Icon Badge */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${colorClass}`}>
        {symbol}
      </div>

      {/* Message */}
      <div className="flex-1 text-sm font-medium text-white">
        {notification.message}
      </div>

      {/* Close Button */}
      <button
        onClick={() => removeNotification(notification.id)}
        className="flex-shrink-0 text-gray-400 hover:text-white transition-colors p-1"
        aria-label="Close notification"
      >
        <span className="text-lg leading-none">✕</span>
      </button>
    </motion.div>
  );
}
