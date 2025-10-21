/**
 * Main App Component
 */

import { useEffect, useCallback } from 'react';
import { useGameStore } from './store/gameStore';
import { MainScreen } from './screens/MainScreen';
import { AuthErrorModal } from './components/AuthErrorModal';
import './App.css';

function App() {
  const initGame = useGameStore(state => state.initGame);
  const authErrorMessage = useGameStore(state => state.authErrorMessage);
  const isAuthModalOpen = useGameStore(state => state.isAuthModalOpen);
  const dismissAuthError = useGameStore(state => state.dismissAuthError);

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
    </div>
  );
}

export default App;
