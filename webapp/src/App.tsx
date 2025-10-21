/**
 * Main App Component
 */

import { useEffect, useCallback } from 'react';
import { useGameStore } from './store/gameStore';
import { MainScreen } from './screens/MainScreen';
import { AuthErrorModal } from './components/AuthErrorModal';
import { OfflineSummaryModal } from './components/OfflineSummaryModal';
import './App.css';

function App() {
  const initGame = useGameStore(state => state.initGame);
  const authErrorMessage = useGameStore(state => state.authErrorMessage);
  const isAuthModalOpen = useGameStore(state => state.isAuthModalOpen);
  const dismissAuthError = useGameStore(state => state.dismissAuthError);
  const offlineSummary = useGameStore(state => state.offlineSummary);
  const acknowledgeOfflineSummary = useGameStore(state => state.acknowledgeOfflineSummary);

  useEffect(() => {
    // Initialize game on mount
    initGame();
  }, [initGame]);

  const handleRetry = useCallback(() => {
    dismissAuthError();
    initGame();
  }, [dismissAuthError, initGame]);

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
