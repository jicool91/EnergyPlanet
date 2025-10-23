/**
 * Main App Component
 */

import { useEffect, useCallback, useState, useRef } from 'react';
import { useGameStore } from './store/gameStore';
import { useUIStore } from './store/uiStore';
import { MainScreen } from './screens/MainScreen';
import { AuthErrorModal } from './components/AuthErrorModal';
import { OfflineSummaryModal } from './components/OfflineSummaryModal';
import { LevelUpScreen } from './components/LevelUpScreen';
import { NotificationContainer } from './components/notifications/NotificationContainer';
import { withTelegramBackButton } from './services/telegram';
import { useNotification } from './hooks/useNotification';
import { logClientEvent } from './services/telemetry';

const shouldShowMajorLevel = (level: number): boolean => {
  if (level < 10) {
    return true;
  }
  if (level < 100) {
    return level % 5 === 0;
  }
  if (level < 1000) {
    return level % 25 === 0;
  }
  return level % 100 === 0;
};

function App() {
  const initGame = useGameStore(state => state.initGame);
  const authErrorMessage = useUIStore(state => state.authErrorMessage);
  const isAuthModalOpen = useUIStore(state => state.isAuthModalOpen);
  const dismissAuthError = useUIStore(state => state.dismissAuthError);
  const offlineSummary = useUIStore(state => state.offlineSummary);
  const acknowledgeOfflineSummary = useUIStore(state => state.clearOfflineSummary);
  const isInitialized = useGameStore(state => state.isInitialized);
  const logoutSession = useGameStore(state => state.logoutSession);
  const refreshSession = useGameStore(state => state.refreshSession);
  const currentLevel = useGameStore(state => state.level);
  const previousLevelRef = useRef(1);
  const { toast } = useNotification();

  const [showLevelUp, setShowLevelUp] = useState(false);
  const [overlayLevel, setOverlayLevel] = useState<number | null>(null);

  // Detect level up
  useEffect(() => {
    if (!isInitialized) {
      previousLevelRef.current = currentLevel;
      return;
    }

    const previousLevel = previousLevelRef.current;
    if (currentLevel <= previousLevel) {
      previousLevelRef.current = currentLevel;
      return;
    }

    const gainedLevels: number[] = [];
    for (let lvl = previousLevel + 1; lvl <= currentLevel; lvl += 1) {
      gainedLevels.push(lvl);
    }

    const majorLevel = [...gainedLevels].reverse().find(level => shouldShowMajorLevel(level));

    if (majorLevel) {
      setOverlayLevel(majorLevel);
      setShowLevelUp(true);
      void logClientEvent('level_up_overlay', { level: majorLevel });
    }

    gainedLevels
      .filter(level => !shouldShowMajorLevel(level))
      .forEach(level => {
        toast(`Уровень ${level}! Новые постройки доступны.`, 2600, 'trophy');
        void logClientEvent('level_up_toast', { level });
      });

    previousLevelRef.current = currentLevel;
  }, [currentLevel, isInitialized, toast]);

  useEffect(() => {
    // Initialize game on mount
    initGame();
  }, [initGame]);

  const handleRetry = useCallback(() => {
    dismissAuthError();
    initGame();
  }, [dismissAuthError, initGame]);

  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    const handleVisibility = () => {
      if (document.hidden) {
        logoutSession(true);
      } else {
        refreshSession();
      }
    };

    const handleBeforeUnload = () => {
      logoutSession(true);
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isInitialized, logoutSession, refreshSession]);

  useEffect(() => {
    if (!isAuthModalOpen && !offlineSummary) {
      return;
    }

    const backHandler = () => {
      if (isAuthModalOpen) {
        dismissAuthError();
      } else if (offlineSummary) {
        acknowledgeOfflineSummary();
      }
    };

    return withTelegramBackButton(backHandler);
  }, [isAuthModalOpen, offlineSummary, dismissAuthError, acknowledgeOfflineSummary]);

  return (
    <div className="w-full h-screen flex flex-col bg-gradient-to-b from-dark-bg to-black pl-safe-left pr-safe-right pt-safe-top pb-safe-bottom overflow-hidden">
      <MainScreen />
      {isAuthModalOpen && authErrorMessage && (
        <AuthErrorModal
          message={authErrorMessage}
          onRetry={handleRetry}
          onDismiss={dismissAuthError}
        />
      )}
      {offlineSummary && (
        <OfflineSummaryModal
          energy={offlineSummary.energy}
          xp={offlineSummary.xp}
          durationSec={offlineSummary.duration_sec}
          capped={offlineSummary.capped}
          onClose={acknowledgeOfflineSummary}
        />
      )}
      {showLevelUp && overlayLevel !== null && (
        <LevelUpScreen
          newLevel={overlayLevel}
          onDismiss={() => {
            setShowLevelUp(false);
            setOverlayLevel(null);
          }}
        />
      )}
      <NotificationContainer />
    </div>
  );
}

export default App;
