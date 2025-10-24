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
import { TabBar, MainScreenHeader, type TabBarItem } from './components';
import { useNotification } from './hooks/useNotification';
import { useTelegramBackButton } from './hooks/useTelegramBackButton';
import { logClientEvent } from './services/telemetry';
import { initializePreferenceCloudSync } from './services/preferencesSync';

type TabKey = 'home' | 'shop' | 'boosts' | 'builds' | 'leaderboard' | 'profile' | 'settings';

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
  const level = useGameStore(state => state.level);
  const energy = useGameStore(state => state.energy);
  const stars = useGameStore(state => state.stars);
  const xpIntoLevel = useGameStore(state => state.xpIntoLevel);
  const xpToNextLevel = useGameStore(state => state.xpToNextLevel);
  const previousLevelRef = useRef(1);
  const hasBootstrappedLevelRef = useRef(false);
  const { toast } = useNotification();

  useEffect(() => {
    initializePreferenceCloudSync().catch(error => {
      console.warn('Preference cloud sync failed to initialize', error);
    });
  }, []);

  // Global tab navigation state
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [overlayLevel, setOverlayLevel] = useState<number | null>(null);

  // Detect level up
  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    if (!hasBootstrappedLevelRef.current) {
      previousLevelRef.current = currentLevel;
      hasBootstrappedLevelRef.current = true;
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

  const modalBackHandler = useCallback(() => {
    if (isAuthModalOpen) {
      dismissAuthError();
      return;
    }

    if (offlineSummary) {
      acknowledgeOfflineSummary();
    }
  }, [isAuthModalOpen, offlineSummary, dismissAuthError, acknowledgeOfflineSummary]);

  useTelegramBackButton(modalBackHandler, {
    enabled: isAuthModalOpen || Boolean(offlineSummary),
  });

  return (
    <div className="w-full h-screen flex flex-col bg-gradient-to-b from-dark-bg to-black pl-safe-left pr-safe-right pt-safe-top pb-safe-bottom overflow-hidden">
      {/* Header with Quick Actions */}
      <MainScreenHeader
        level={level}
        energy={energy}
        stars={stars}
        xpProgress={
          xpIntoLevel + xpToNextLevel > 0
            ? Math.min(1, xpIntoLevel / (xpIntoLevel + xpToNextLevel))
            : 0
        }
        onShopClick={() => setActiveTab('shop')}
        onSettingsClick={() => setActiveTab('settings')}
      />

      {/* Main Content */}
      <MainScreen activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Global Navigation Footer */}
      <TabBar
        tabs={
          [
            { id: 'home', icon: '🏠', label: 'Главная', title: 'Home' },
            { id: 'shop', icon: '🛍️', label: 'Магазин', title: 'Shop' },
            { id: 'boosts', icon: '🚀', label: 'Boost Hub', title: 'Boosts' },
            { id: 'builds', icon: '🏗️', label: 'Постройки', title: 'Buildings' },
            { id: 'leaderboard', icon: '🏆', label: 'Рейтинг', title: 'Leaderboard' },
            { id: 'profile', icon: '👤', label: 'Профиль', title: 'Profile' },
            { id: 'settings', icon: '⚙️', label: 'Настройки', title: 'Settings' },
          ] as TabBarItem[]
        }
        active={activeTab}
        onChange={tabId => setActiveTab(tabId as TabKey)}
      />

      {/* Modals & Notifications */}
      <AuthErrorModal
        isOpen={isAuthModalOpen}
        message={authErrorMessage || ''}
        onRetry={handleRetry}
        onDismiss={dismissAuthError}
      />
      <OfflineSummaryModal
        isOpen={!!offlineSummary}
        energy={offlineSummary?.energy ?? 0}
        xp={offlineSummary?.xp ?? 0}
        durationSec={offlineSummary?.duration_sec ?? 0}
        capped={offlineSummary?.capped ?? false}
        levelStart={offlineSummary?.level_start}
        levelEnd={offlineSummary?.level_end}
        levelsGained={offlineSummary?.levels_gained}
        onClose={acknowledgeOfflineSummary}
      />
      <LevelUpScreen
        isOpen={showLevelUp && overlayLevel !== null}
        newLevel={overlayLevel || 1}
        onDismiss={() => {
          setShowLevelUp(false);
          setOverlayLevel(null);
        }}
      />
      <NotificationContainer />
    </div>
  );
}

export default App;
