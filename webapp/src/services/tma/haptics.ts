import { hapticFeedback } from '@tma.js/sdk';
import type { ImpactHapticFeedbackStyle, NotificationHapticFeedbackType } from '@tma.js/bridge';
import { ensureTmaSdkReady, isTmaSdkAvailable } from './core';

function isSupported(): boolean {
  ensureTmaSdkReady();
  return isTmaSdkAvailable() && hapticFeedback.isSupported();
}

export function triggerTmaHapticImpact(style: ImpactHapticFeedbackStyle = 'light'): void {
  if (!isSupported()) {
    return;
  }

  try {
    hapticFeedback.impactOccurred(style);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.debug('Haptic impact not available', error);
    }
  }
}

export function triggerTmaHapticNotification(type: NotificationHapticFeedbackType): void {
  if (!isSupported()) {
    return;
  }

  try {
    hapticFeedback.notificationOccurred(type);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.debug('Haptic notification not available', error);
    }
  }
}

export function triggerTmaHapticSelection(): void {
  if (!isSupported()) {
    return;
  }

  try {
    hapticFeedback.selectionChanged();
  } catch (error) {
    if (import.meta.env.DEV) {
      console.debug('Haptic selection not available', error);
    }
  }
}

export const triggerHapticImpact = triggerTmaHapticImpact;
export const triggerHapticNotification = triggerTmaHapticNotification;
export const triggerHapticSelection = triggerTmaHapticSelection;
