import {
  Suspense,
  startTransition,
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useUIStore } from './store/uiStore';
import { AppLayout } from './components/layout/AppLayout';
import type {
  BottomNavigationTab,
  BottomNavigationTabId,
} from './components/layout/BottomNavigation';
import { TapScreen } from './screens/TapScreen';
import { ShopScreen } from './screens/ShopScreen';
import { FriendsScreen } from './screens/FriendsScreen';
import { EarnScreen } from './screens/EarnScreen';
import { ChatScreen } from './screens/ChatScreen';
import { AuthErrorModal } from './components/AuthErrorModal';
import { OfflineSummaryModal } from './components/OfflineSummaryModal';
import { LevelUpScreen } from './components/LevelUpScreen';
import { NotificationContainer } from './components/notifications/NotificationContainer';
import { ModalBase } from './components/ModalBase';
import { useGameStore } from './store/gameStore';
import { useNotification } from './hooks/useNotification';
import { useTelegramBackButton } from './hooks/useTelegramBackButton';
import { useAuthBootstrap } from './hooks';
import { useAuthStore, authStore } from './store/authStore';
import { initializePreferenceCloudSync } from './services/preferencesSync';
import { logClientEvent } from './services/telemetry';
import { logger } from './utils/logger';
import { AdminMonetizationScreen } from './screens/AdminMonetizationScreen';
import { Text } from '@/components';
import { ConnectedTapStatusHeader, SimpleHeader } from '@/components/layout/StatusHeader';
import { PvPEventsScreen } from './screens/PvPEventsScreen';
import { AdminModalContext } from './contexts/AdminModalContext';
import { ensureExperimentVariant } from '@/store/experimentsStore';
import { getHeaderSchema } from '@/constants/headerSchema';
import { ProfileScreen } from './screens/ProfileScreen';

const NAVIGATION_TABS: BottomNavigationTab[] = [
  { id: 'tap', label: 'Tap', icon: '⚡️', path: '/' },
  { id: 'shop', label: 'Shop', icon: '🛒', path: '/shop' },
  { id: 'chat', label: 'Chat', icon: '💬', path: '/chat' },
  { id: 'friends', label: 'Friends', icon: '🤝', path: '/friends' },
  { id: 'earn', label: 'Earn', icon: '💼', path: '/earn' },
];

const PATH_TO_TAB: Record<string, BottomNavigationTabId> = {
  '/': 'tap',
  '/shop': 'shop',
  '/exchange': 'shop',
  '/friends': 'friends',
  '/earn': 'earn',
  '/chat': 'chat',
  '/profile': 'earn',
  '/events': 'tap',
};

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

function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.replace(/\/+$/, '');
  }
  return pathname;
}

interface RenderHeaderParams {
  activeTab: BottomNavigationTabId;
  path: string;
  navigate: (path: string, options?: { replace?: boolean }) => void;
}

interface NextUiRouterProps {
  renderHeader: (params: RenderHeaderParams) => React.ReactNode;
}

function NextUiRouter({ renderHeader }: NextUiRouterProps) {
  const location = useLocation();
  const navigateInternal = useNavigate();
  const normalizedPath = normalizePath(location.pathname);

  const activeTab = useMemo<BottomNavigationTabId>(() => {
    return PATH_TO_TAB[normalizedPath] ?? 'tap';
  }, [normalizedPath]);

  const handleTabSelect = useCallback(
    (tab: BottomNavigationTab) => {
      if (tab.path === normalizedPath) {
        return;
      }
      startTransition(() => {
        navigateInternal(tab.path, { replace: false });
      });
    },
    [navigateInternal, normalizedPath]
  );

  const headerNode = useMemo(() => {
    return renderHeader({
      activeTab,
      path: normalizedPath,
      navigate: (path, options) => {
        const target = path.startsWith('/') ? path : `/${path}`;
        if (normalizePath(target) === normalizedPath && !options?.replace) {
          return;
        }
        startTransition(() => {
          navigateInternal(target, { replace: options?.replace ?? false });
        });
      },
    });
  }, [activeTab, navigateInternal, normalizedPath, renderHeader]);

  return (
    <AppLayout
      activeTab={activeTab}
      tabs={NAVIGATION_TABS}
      onTabSelect={handleTabSelect}
      header={headerNode}
    >
      <Suspense
        fallback={
          <Text variant="body" tone="secondary" className="px-4 py-6">
            Загрузка…
          </Text>
        }
      >
        <Routes>
          <Route path="/" element={<TapScreen />} />
          <Route path="/shop" element={<ShopScreen />} />
          <Route path="/exchange" element={<Navigate to="/shop" replace />} />
          <Route path="/friends" element={<FriendsScreen />} />
          <Route path="/earn" element={<EarnScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="/chat" element={<ChatScreen />} />
          <Route path="/events" element={<PvPEventsScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AppLayout>
  );
}

function NextUiApp() {
  useAuthBootstrap();

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const nextAppRenderCount = (window.__renderMetrics?.app ?? 0) + 1;
    window.__renderMetrics = {
      ...(window.__renderMetrics ?? {}),
      app: nextAppRenderCount,
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    ensureExperimentVariant('palette_v1', () => (Math.random() < 0.5 ? 'classic' : 'dual-accent'));
  }, []);

  useEffect(() => {
    initializePreferenceCloudSync().catch(error => {
      console.warn('Preference cloud sync failed to initialize', error);
    });
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
  const isAdmin = useGameStore(state => state.isAdmin);
  const { toast } = useNotification();
  const authReady = useAuthStore(state => state.authReady);

  const previousLevelRef = useRef(1);
  const hasBootstrappedLevelRef = useRef(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [overlayLevel, setOverlayLevel] = useState<number | null>(null);
  const [isAdminMetricsOpen, setAdminMetricsOpen] = useState(false);

  const handleLevelCelebration = useEffectEvent(
    ({ majorLevel, gainedLevels }: { majorLevel: number | undefined; gainedLevels: number[] }) => {
      if (majorLevel) {
        setOverlayLevel(majorLevel);
        setShowLevelUp(true);
        void logClientEvent('level_up_overlay', { level: majorLevel });
      }

      gainedLevels
        .filter(levelValue => !shouldShowMajorLevel(levelValue))
        .forEach(levelValue => {
          toast(`Уровень ${levelValue}! Новые постройки доступны.`, 2600, 'trophy');
          void logClientEvent('level_up_toast', { level: levelValue });
        });
    }
  );

  useEffect(() => {
    logger.info('🔍 Next UI state check', {
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

    logger.info('🎮 Calling initGame from NextUiApp');
    initGame();
  }, [authReady, initGame, isInitialized]);

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
    const majorLevel = [...gainedLevels]
      .reverse()
      .find(levelValue => shouldShowMajorLevel(levelValue));
    handleLevelCelebration({ majorLevel, gainedLevels });
    previousLevelRef.current = currentLevel;
  }, [currentLevel, isInitialized]);

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
  }, [authReady, isInitialized, logoutSession, refreshSession]);

  const modalBackHandler = useCallback(() => {
    if (isAuthModalOpen) {
      dismissAuthError();
      return;
    }
    if (offlineSummary) {
      acknowledgeOfflineSummary();
      return;
    }
    if (isAdminMetricsOpen) {
      setAdminMetricsOpen(false);
    }
    if (showLevelUp) {
      setShowLevelUp(false);
      setOverlayLevel(null);
    }
  }, [
    acknowledgeOfflineSummary,
    dismissAuthError,
    isAdminMetricsOpen,
    isAuthModalOpen,
    offlineSummary,
    showLevelUp,
  ]);

  useTelegramBackButton(modalBackHandler, {
    enabled: isAuthModalOpen || Boolean(offlineSummary) || isAdminMetricsOpen || showLevelUp,
  });

  const openAdminMetrics = useCallback(() => {
    if (!isAdmin) {
      return;
    }
    setAdminMetricsOpen(true);
  }, [isAdmin]);

  const adminContextValue = useMemo(
    () => ({
      openAdminMetrics,
    }),
    [openAdminMetrics]
  );

  const renderHeader = useCallback(({ activeTab, path, navigate }: RenderHeaderParams) => {
    const schema = getHeaderSchema(activeTab, { pathname: path });
    if (schema.id === 'profile') {
      return <SimpleHeader title={schema.title} actions={schema.actions} onNavigate={navigate} />;
    }

    if (schema.layout === 'tap-status') {
      return <ConnectedTapStatusHeader actions={schema.actions} onNavigate={navigate} />;
    }

    return <SimpleHeader title={schema.title} actions={schema.actions} onNavigate={navigate} />;
  }, []);

  return (
    <>
      <AdminModalContext.Provider value={adminContextValue}>
        <BrowserRouter>
          <NextUiRouter renderHeader={renderHeader} />
        </BrowserRouter>

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
          onClose={() => {
            setAdminMetricsOpen(false);
            void logClientEvent('admin_monetization_close', {});
          }}
          size="lg"
        >
          <AdminMonetizationScreen />
        </ModalBase>
        <NotificationContainer />
      </AdminModalContext.Provider>
    </>
  );
}

export default function App() {
  return <NextUiApp />;
}
