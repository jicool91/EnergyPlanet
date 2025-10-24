import { motion } from 'framer-motion';
import type { Notification } from '../../store/uiStore';
import { useUIStore } from '../../store/uiStore';

interface ToastProps {
  notification: Notification;
}

const TOAST_THEME: Record<
  string,
  {
    container: string;
    iconBg: string;
    text: string;
    accent: string;
    close: string;
  }
> = {
  success: {
    container: 'border border-lime/35 bg-gradient-to-r from-lime/15 via-dark-card to-dark-card shadow-lg',
    iconBg: 'bg-lime/80 text-gray-900',
    text: 'text-lime-100',
    accent: 'bg-lime/60',
    close: 'text-lime-100/70 hover:text-lime-100',
  },
  error: {
    container: 'border border-red-error/50 bg-gradient-to-r from-red-error/20 via-dark-card to-dark-card shadow-lg',
    iconBg: 'bg-red-error text-white',
    text: 'text-red-100',
    accent: 'bg-red-error/70',
    close: 'text-red-100/70 hover:text-red-100',
  },
  warning: {
    container: 'border border-amber-400/50 bg-gradient-to-r from-amber-400/20 via-dark-card to-dark-card shadow-lg',
    iconBg: 'bg-amber-400 text-gray-900',
    text: 'text-amber-100',
    accent: 'bg-amber-400/70',
    close: 'text-amber-100/70 hover:text-amber-100',
  },
  star: {
    container: 'border border-yellow-300/40 bg-gradient-to-r from-yellow-300/15 via-dark-card to-dark-card shadow-lg',
    iconBg: 'bg-yellow-300 text-gray-900',
    text: 'text-yellow-100',
    accent: 'bg-yellow-300/70',
    close: 'text-yellow-100/70 hover:text-yellow-100',
  },
  trophy: {
    container: 'border border-orange-400/60 bg-gradient-to-r from-orange-400/20 via-dark-card to-dark-card shadow-lg',
    iconBg: 'bg-orange-400 text-gray-900',
    text: 'text-orange-100',
    accent: 'bg-orange-400/70',
    close: 'text-orange-100/70 hover:text-orange-100',
  },
  info: {
    container: 'border border-cyan/40 bg-gradient-to-r from-cyan/20 via-dark-card to-dark-card shadow-lg',
    iconBg: 'bg-cyan/80 text-gray-900',
    text: 'text-white',
    accent: 'bg-cyan/70',
    close: 'text-white/70 hover:text-white',
  },
};

const ICON_SYMBOLS: Record<string, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ⓘ',
  star: '★',
  trophy: '🏆',
};

const ICON_LABELS: Record<string, string> = {
  success: 'Success notification',
  error: 'Error notification',
  warning: 'Warning notification',
  info: 'Information notification',
  star: 'Star notification',
  trophy: 'Achievement notification',
};

const MESSAGE_PREFIX: Record<string, string> = {
  success: 'Успех',
  error: 'Ошибка',
  warning: 'Предупреждение',
  info: 'Информация',
  star: 'Награда',
  trophy: 'Достижение',
};

export function Toast({ notification }: ToastProps) {
  const removeNotification = useUIStore(state => state.removeNotification);
  const icon = notification.icon || 'info';
  const theme = TOAST_THEME[icon] ?? TOAST_THEME.info;
  const symbol = ICON_SYMBOLS[icon] || ICON_SYMBOLS.info;
  const prefix = MESSAGE_PREFIX[icon] || MESSAGE_PREFIX.info;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      whileHover={{ translateY: -4 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
      aria-live="polite"
      className={`relative flex items-center gap-3 rounded-xl px-4 py-3 sm:px-5 sm:py-4 backdrop-blur-md min-w-[280px] shadow-lg ${theme.container}`}
    >
      <span className={`absolute left-2 top-2 bottom-2 w-1 rounded-full ${theme.accent}`} aria-hidden />

      {/* Icon Badge */}
      <div
        className={`relative flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-bold text-base shadow-md ${theme.iconBg}`}
        role="img"
        aria-label={ICON_LABELS[icon] || ICON_LABELS.info}
      >
        {symbol}
      </div>

      {/* Message */}
      <div className={`flex-1 text-sm font-medium leading-snug ${theme.text}`} role="status">
        <span className="font-semibold tracking-wide uppercase text-xs sm:text-[13px]">
          {prefix}
        </span>
        <span className="block text-sm sm:text-base text-white/90">{notification.message}</span>
      </div>

      {/* Close Button */}
      <button
        onClick={() => removeNotification(notification.id)}
        className={`flex-shrink-0 transition-colors p-1 focus-ring ${theme.close}`}
        aria-label="Close notification"
      >
        <span className="text-lg leading-none">✕</span>
      </button>
    </motion.div>
  );
}
