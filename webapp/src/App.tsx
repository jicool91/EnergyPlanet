/**
 * Main App Component
 */

import { useEffect, useCallback } from 'react';
import { useGameStore } from './store/gameStore';
import { MainScreen } from './screens/MainScreen';
import { AuthErrorModal } from './components/AuthErrorModal';
import { OfflineSummaryModal } from './components/OfflineSummaryModal';
import './App.css';
import { withTelegramBackButton } from './services/telegram';

function App() {
  const initGame = useGameStore(state => state.initGame);
  const authErrorMessage = useGameStore(state => state.authErrorMessage);
  const isAuthModalOpen = useGameStore(state => state.isAuthModalOpen);
  const dismissAuthError = useGameStore(state => state.dismissAuthError);
  const offlineSummary = useGameStore(state => state.offlineSummary);
  const acknowledgeOfflineSummary = useGameStore(state => state.acknowledgeOfflineSummary);
  const isInitialized = useGameStore(state => state.isInitialized);
  const logoutSession = useGameStore(state => state.logoutSession);
  const refreshSession = useGameStore(state => state.refreshSession);

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
    <div className="app">
      <MainScreen />
      {isAuthModalOpen && authErrorMessage && (
        <AuthErrorModal message={authErrorMessage} onRetry={handleRetry} onDismiss={dismissAuthError} />
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
    </div>
  );
}

export default App;
