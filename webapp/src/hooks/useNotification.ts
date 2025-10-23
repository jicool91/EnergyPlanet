import { useCallback } from 'react';
import { useUIStore, type Notification } from '../store/uiStore';

export function useNotification() {
  const addNotification = useUIStore(state => state.addNotification);

  const toast = useCallback(
    (message: string, duration: number = 3000, icon?: Notification['icon']) => {
      return addNotification({
        type: 'toast',
        message,
        duration,
        icon: icon || 'info',
      });
    },
    [addNotification]
  );

  const success = useCallback(
    (message: string, duration: number = 3000) => {
      return addNotification({
        type: 'toast',
        message,
        duration,
        icon: 'success',
      });
    },
    [addNotification]
  );

  const error = useCallback(
    (message: string, duration: number = 4000) => {
      return addNotification({
        type: 'toast',
        message,
        duration,
        icon: 'error',
      });
    },
    [addNotification]
  );

  const warning = useCallback(
    (message: string, duration: number = 3000) => {
      return addNotification({
        type: 'toast',
        message,
        duration,
        icon: 'warning',
      });
    },
    [addNotification]
  );

  const achievement = useCallback(
    (title: string, message: string, duration: number = 4000) => {
      return addNotification({
        type: 'achievement',
        title,
        message,
        duration,
        icon: 'star',
      });
    },
    [addNotification]
  );

  const alert = useCallback(
    (title: string, message: string, onDismiss?: () => void) => {
      return addNotification({
        type: 'alert',
        title,
        message,
        duration: 0, // persistent
        onDismiss,
      });
    },
    [addNotification]
  );

  return {
    toast,
    success,
    error,
    warning,
    achievement,
    alert,
    add: addNotification,
  };
}
