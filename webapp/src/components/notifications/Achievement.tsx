import { motion } from 'framer-motion';
import type { Notification } from '../../store/uiStore';
import { useUIStore } from '../../store/uiStore';
import { useDevicePerformance } from '../../hooks';

interface AchievementProps {
  notification: Notification;
}

export function Achievement({ notification }: AchievementProps) {
  const removeNotification = useUIStore(state => state.removeNotification);
  const performance = useDevicePerformance();
  const isLowPerformance = performance === 'low';
  const isMediumPerformance = performance === 'medium';
  const trophyAnimation = isLowPerformance
    ? undefined
    : {
        rotate: [0, 4, -4, 0],
        scale: [1, isMediumPerformance ? 1.05 : 1.1, 1],
      };
  const trophyTransition = isLowPerformance
    ? undefined
    : { duration: isMediumPerformance ? 1.8 : 1.5, repeat: Infinity, delay: 0.2 };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, y: -50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.5, y: 50 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      onClick={() => removeNotification(notification.id)}
      role="button"
      tabIndex={0}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          removeNotification(notification.id);
        }
      }}
      className="cursor-pointer focus-ring"
    >
      {/* Glow effect */}
      <motion.div
        className={`absolute -inset-4 bg-gradient-to-r from-yellow-500/20 via-amber-500/20 to-orange-500/20 rounded-2xl ${
          isLowPerformance ? 'blur-md opacity-40' : 'blur-2xl'
        }`}
        animate={isLowPerformance ? undefined : { opacity: [0.5, 1, 0.5] }}
        transition={isLowPerformance ? undefined : { duration: 2.2, repeat: Infinity }}
        style={{ zIndex: -1 }}
      />

      <motion.div
        className="bg-gradient-to-br from-dark-card to-dark-bg border-2 border-yellow-500/30 rounded-2xl p-6 shadow-2xl max-w-sm backdrop-blur-sm"
        animate={{
          y: [0, -4, 0],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {/* Trophy Icon */}
        <motion.div
          className="text-5xl mb-3 text-center"
          animate={trophyAnimation}
          transition={trophyTransition}
        >
          <span role="img" aria-label="Achievement trophy">
            🏆
          </span>
        </motion.div>

        {/* Title */}
        <motion.h3
          className="text-xl font-bold text-yellow-300 text-center mb-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {notification.title || 'Achievement Unlocked!'}
        </motion.h3>

        {/* Message */}
        <motion.p
          className="text-sm text-gray-300 text-center mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {notification.message}
        </motion.p>

        {/* Confetti animation (stars) */}
        <div className="flex justify-center gap-2">
          {[0, 1, 2].map(i => (
            <motion.span
              key={i}
              className="text-2xl"
              aria-hidden="true"
              animate={
                isLowPerformance
                  ? undefined
                  : {
                      y: [-20, 0, -20],
                      opacity: [0, 1, 0],
                    }
              }
              transition={
                isLowPerformance
                  ? undefined
                  : {
                      duration: isMediumPerformance ? 1.2 : 1,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }
              }
            >
              ⭐
            </motion.span>
          ))}
        </div>

        {/* Tap to dismiss hint */}
        <motion.p
          className="text-xs text-gray-500 text-center mt-4"
          animate={{ opacity: [0.5, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          Tap to dismiss
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
