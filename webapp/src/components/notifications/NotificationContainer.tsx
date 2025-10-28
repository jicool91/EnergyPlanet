import { AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../store/uiStore';
import { Toast } from './Toast';
import { Achievement } from './Achievement';
import { Alert } from './Alert';

export function NotificationContainer() {
  const notifications = useUIStore(state => state.notifications);

  // Separate notifications by type
  const toasts = notifications.filter(n => n.type === 'toast');
  const achievements = notifications.filter(n => n.type === 'achievement');
  const alerts = notifications.filter(n => n.type === 'alert');

  return (
    <>
      {/* Toasts - Bottom right corner */}
      <div
        className="fixed z-50 flex flex-col gap-2 pointer-events-auto"
        style={{
          right: 'calc(var(--safe-area-right) + 16px)',
          bottom: 'calc(var(--safe-area-bottom) + 80px)',
        }}
      >
        <AnimatePresence mode="popLayout">
          {toasts.map(notification => (
            <Toast key={notification.id} notification={notification} />
          ))}
        </AnimatePresence>
      </div>

      {/* Achievements - Top center */}
      <div
        className="fixed z-50 pointer-events-auto -translate-x-1/2"
        style={{
          left: '50%',
          top: 'calc(var(--safe-area-top) + 72px)',
        }}
      >
        <AnimatePresence mode="wait">
          {achievements.length > 0 && <Achievement notification={achievements[0]} />}
        </AnimatePresence>
      </div>

      {/* Alerts - Center of screen (modal) */}
      <AnimatePresence>
        {alerts.length > 0 && <Alert key={alerts[0].id} notification={alerts[0]} />}
      </AnimatePresence>
    </>
  );
}
