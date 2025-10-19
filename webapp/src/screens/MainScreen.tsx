/**
 * Main Game Screen
 */

import { useGameStore } from '../store/gameStore';

export function MainScreen() {
  const { energy, level, isLoading, tap } = useGameStore();

  const handleTap = () => {
    tap(1);
  };

  if (isLoading) {
    return (
      <div className="loading-screen">
        <p>Loading Energy Planet...</p>
      </div>
    );
  }

  return (
    <div className="main-screen">
      <header className="header">
        <div className="level">Level {level}</div>
        <div className="energy">{Math.floor(energy).toLocaleString()} E</div>
      </header>

      <div className="planet-container" onClick={handleTap}>
        <div className="planet">
          <span>🌍</span>
        </div>
        <p className="tap-hint">Tap to generate energy!</p>
      </div>

      <footer className="footer">
        <button className="tab-button">🏠 Home</button>
        <button className="tab-button">🏗️ Buildings</button>
        <button className="tab-button">🏆 Leaderboard</button>
        <button className="tab-button">👤 Profile</button>
      </footer>
    </div>
  );
}
