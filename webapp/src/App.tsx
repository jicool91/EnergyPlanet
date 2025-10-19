/**
 * Main App Component
 */

import { useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import { MainScreen } from './screens/MainScreen';
import './App.css';

function App() {
  const initGame = useGameStore((state) => state.initGame);

  useEffect(() => {
    // Initialize game on mount
    initGame();
  }, [initGame]);

  return (
    <div className="app">
      <MainScreen />
    </div>
  );
}

export default App;
