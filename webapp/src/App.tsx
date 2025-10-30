import { useEffect, useCallback, useState, useRef, useMemo, useEffectEvent } from 'react';
import { useGameStore } from './store/gameStore';
import { useUIStore } from './store/uiStore';
import { MainScreen } from './screens/MainScreen';
import { AuthErrorModal } from './components/AuthErrorModal';
import { OfflineSummaryModal } from './components/OfflineSummaryModal';
import { LevelUpScreen } from './components/LevelUpScreen';
import { NotificationContainer } from './components/notifications/NotificationContainer';
import { TabBar, MainScreenHeader, type TabBarItem } from './components';
import { getTabIcon } from './components/icons/TabIcons';
import { ModalBase } from './components/ModalBase';
import { useNotification } from './hooks/useNotification';
import { useTelegramBackButton } from './hooks/useTelegramBackButton';
import { logClientEvent } from './services/telemetry';
import { initializePreferenceCloudSync } from './services/preferencesSync';
import { useSafeArea, useAuthBootstrap } from './hooks';
import { useAuthStore, authStore } from './store/authStore';
import { logger } from './utils/logger';
import { HEADER_BUFFER_PX, HEADER_RESERVE_PX } from './constants/layout';
import type { ShopSection } from './components/ShopPanel';
import { AdminMonetizationScreen } from './screens/AdminMonetizationScreen';

type TabKey = 'home' | 'shop' | 'builds' | 'leaderboard' | 'account' | 'clan';

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
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const metrics = window.__renderMetrics ?? { app: 0 };
    metrics.app += 1;
    window.__renderMetrics = metrics;
  }, []);

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
  const isAdmin = useGameStore(state => state.isAdmin);
  const previousLevelRef = useRef(1);
  const hasBootstrappedLevelRef = useRef(false);
  const { toast } = useNotification();
  const authReady = useAuthStore(state => state.authReady);

  useAuthBootstrap();

  useEffect(() => {
    initializePreferenceCloudSync().catch(error => {
      console.warn('Preference cloud sync failed to initialize', error);
    });
  }, []);

  // Global tab navigation state
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [shopSection, setShopSection] = useState<ShopSection>('star_packs');
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [overlayLevel, setOverlayLevel] = useState<number | null>(null);
  const [isAdminMetricsOpen, setAdminMetricsOpen] = useState(false);
  const { safeArea } = useSafeArea();
  const safeTop = Math.max(0, safeArea.safe.top ?? 0);
  const contentTopInset = Math.max(0, safeArea.content.top ?? 0);
  const headerBaseInset = safeTop + contentTopInset;
  const safeRight = Math.max(0, safeArea.safe.right ?? 0);
  const safeBottom = Math.max(0, safeArea.safe.bottom ?? 0);
  const safeLeft = Math.max(0, safeArea.safe.left ?? 0);
  const contentPaddingTopPx = headerBaseInset + HEADER_RESERVE_PX + HEADER_BUFFER_PX;

  const handleLevelCelebration = useEffectEvent(
    ({ majorLevel, gainedLevels }: { majorLevel: number | undefined; gainedLevels: number[] }) => {
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
    }
  );

  const appPaddingStyle = useMemo(() => {
    return {
      paddingTop: `var(--app-content-padding-top, ${contentPaddingTopPx}px)`,
      paddingRight: `${safeRight}px`,
      paddingBottom: `${safeBottom + 16}px`,
      paddingLeft: `${safeLeft}px`,
    };
  }, [contentPaddingTopPx, safeBottom, safeLeft, safeRight]);

  const previousTabRef = useRef<TabKey | null>(null);

  useEffect(() => {
    if (!isAdmin && isAdminMetricsOpen) {
      // Closing the admin modal immediately keeps it from reopening automatically
      // when admin access is restored. The lint rule is suppressed deliberately here.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAdminMetricsOpen(false);
    }
  }, [isAdmin, isAdminMetricsOpen]);

  const handleOpenAdminMetrics = useCallback(() => {
    if (!isAdmin) {
      return;
    }
    setAdminMetricsOpen(true);
  }, [isAdmin]);

  const handleCloseAdminMetrics = useCallback(() => {
    setAdminMetricsOpen(false);
    void logClientEvent('admin_monetization_close', {});
  }, []);

  const handleTabBarChange = useCallback(
    (tabId: string) => {
      const nextTab = tabId as TabKey;
      if (isInitialized) {
        void logClientEvent('tab_click', {
          tab: nextTab,
          previous: activeTab,
          source: 'tab_bar',
        });
      }
      setActiveTab(nextTab);
    },
    [activeTab, isInitialized]
  );

  const handleProgrammaticTabChange = useCallback(
    (nextTab: TabKey) => {
      if (isInitialized) {
        void logClientEvent('tab_click', {
          tab: nextTab,
          previous: activeTab,
          source: 'app',
        });
      }
      if (nextTab === 'account') {
        void logClientEvent('account_tab_open', {
          isInitialized,
          authReady,
          hasAccessToken: !!authStore.accessToken,
        });
      }
      setActiveTab(nextTab);
    },
    [activeTab, isInitialized, authReady]
  );

  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    const previous = previousTabRef.current;
    if (previous !== activeTab) {
      void logClientEvent('tab_impression', { tab: activeTab });
      if (previous) {
        void logClientEvent('tab_sequence', { from: previous, to: activeTab });
      }
      previousTabRef.current = activeTab;
    }
  }, [activeTab, isInitialized]);

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

    handleLevelCelebration({ majorLevel, gainedLevels });

    previousLevelRef.current = currentLevel;
  }, [currentLevel, isInitialized]);

  useEffect(() => {
    logger.info('🔍 App.tsx state check', {
      authReady,
      isInitialized,
      hasAccessToken: !!authStore.accessToken,
    });

    if (!authReady || isInitialized) {
      if (!authReady) {
        logger.info('⏳ Waiting for authReady...');
      }
      if (isInitialized) {
        logger.info('✅ Game already initialized, skipping initGame call');
      }
      return;
    }

    logger.info('🎮 Calling initGame from App.tsx');

    initGame();
  }, [authReady, isInitialized, initGame]);

  const handleRetry = useCallback(() => {
    dismissAuthError();
    authStore.requestBootstrapRetry();
  }, [dismissAuthError]);

  useEffect(() => {
    if (!isInitialized || !authReady) {
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
  }, [isInitialized, authReady, logoutSession, refreshSession]);

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
    <div
      className="w-full h-screen flex flex-col app-shell overflow-hidden"
      style={appPaddingStyle}
    >
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
        onShopClick={() => {
          setShopSection('star_packs');
          setActiveTab('shop');
        }}
        onSettingsClick={() => setActiveTab('account')}
      />

      {/* Main Content */}
      <MainScreen
        activeTab={activeTab}
        onTabChange={handleProgrammaticTabChange}
        shopSection={shopSection}
        onShopSectionChange={setShopSection}
        onOpenAdminMetrics={handleOpenAdminMetrics}
      />

      {/* Global Navigation Footer */}
      <TabBar
        tabs={
          [
            { id: 'home', icon: getTabIcon('home', 'Главная'), label: 'Главная', title: 'Главная' },
            { id: 'shop', icon: getTabIcon('shop', 'Магазин'), label: 'Магазин', title: 'Магазин' },
            {
              id: 'builds',
              icon: getTabIcon('builds', 'Постройки'),
              label: 'Постройки',
              title: 'Постройки',
            },
            {
              id: 'leaderboard',
              icon: getTabIcon('leaderboard', 'Рейтинг'),
              label: 'Рейтинг',
              title: 'Рейтинг игроков',
            },
            {
              id: 'account',
              icon: getTabIcon('account', 'Профиль'),
              label: 'Профиль',
              title: 'Профиль и настройки',
            },
          ] as TabBarItem[]
        }
        active={activeTab}
        onChange={handleTabBarChange}
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
      <ModalBase
        isOpen={isAdminMetricsOpen && isAdmin}
        title="Монетизация (админ)"
        onClose={handleCloseAdminMetrics}
        size="lg"
      >
        <AdminMonetizationScreen />
      </ModalBase>
      <NotificationContainer />
    </div>
  );
}

export default App;
