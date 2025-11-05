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
import { ExchangeScreen } from './screens/ExchangeScreen';
import { FriendsScreen } from './screens/FriendsScreen';
import { EarnScreen } from './screens/EarnScreen';
import { AirdropScreen } from './screens/AirdropScreen';
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
import { ProgressBar, Surface, Text, Button } from './components';
import { AdminModalContext } from './contexts/AdminModalContext';
import { ensureExperimentVariant } from '@/store/experimentsStore';

const NAVIGATION_TABS: BottomNavigationTab[] = [
  { id: 'tap', label: 'Tap', icon: '⚡️', path: '/' },
  { id: 'exchange', label: 'Exchange', icon: '🏢', path: '/exchange' },
  { id: 'friends', label: 'Friends', icon: '🤝', path: '/friends' },
  { id: 'earn', label: 'Earn', icon: '💼', path: '/earn' },
  { id: 'airdrop', label: 'Airdrop', icon: '🎁', path: '/airdrop' },
];

const PATH_TO_TAB: Record<string, BottomNavigationTabId> = {
  '/': 'tap',
  '/exchange': 'exchange',
  '/friends': 'friends',
  '/earn': 'earn',
  '/airdrop': 'airdrop',
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
          <Route path="/exchange" element={<ExchangeScreen />} />
          <Route path="/friends" element={<FriendsScreen />} />
          <Route path="/earn" element={<EarnScreen />} />
          <Route path="/airdrop" element={<AirdropScreen />} />
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

    const metrics = window.__renderMetrics ?? { app: 0 };
    metrics.app += 1;
    window.__renderMetrics = metrics;
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
  const level = useGameStore(state => state.level);
  const energy = useGameStore(state => state.energy);
  const stars = useGameStore(state => state.stars);
  const xpIntoLevel = useGameStore(state => state.xpIntoLevel);
  const xpToNextLevel = useGameStore(state => state.xpToNextLevel);
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

  const renderHeader = useCallback(
    ({ activeTab, navigate }: RenderHeaderParams) => {
      const formatter = new Intl.NumberFormat('ru-RU', {
        notation: 'compact',
        maximumFractionDigits: 1,
      });

      if (activeTab === 'tap') {
        return (
          <Surface
            tone="overlayMedium"
            border="subtle"
            elevation="strong"
            padding="md"
            rounded="3xl"
            className="flex items-center justify-between gap-4"
          >
            <div className="flex flex-col gap-1">
              <Text variant="label" weight="semibold" tone="accent" transform="uppercase">
                Уровень {level}
              </Text>
              <div className="flex items-center gap-3">
                <Text as="span" variant="body" tone="primary" className="flex items-center gap-1">
                  ⚡ {formatter.format(energy)}
                </Text>
                <Text as="span" variant="body" tone="accent" className="flex items-center gap-1">
                  ⭐ {formatter.format(stars)}
                </Text>
              </div>
              <ProgressBar
                value={xpIntoLevel}
                max={xpIntoLevel + xpToNextLevel}
                className="max-w-[220px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="md"
                variant="primary"
                onClick={() => navigate('/exchange?section=star_packs')}
              >
                Магазин
              </Button>
              <Button type="button" size="md" variant="secondary" onClick={() => navigate('/earn')}>
                Профиль
              </Button>
              {isAdmin && (
                <Button
                  type="button"
                  size="md"
                  variant="secondary"
                  className="border-state-success-pill-strong text-feedback-success hover:bg-state-success-pill"
                  onClick={openAdminMetrics}
                >
                  Admin
                </Button>
              )}
            </div>
          </Surface>
        );
      }

      const titleMap: Record<BottomNavigationTabId, string> = {
        tap: 'Tap',
        exchange: 'Exchange',
        friends: 'Friends',
        earn: 'Earn',
        airdrop: 'Airdrop',
      };

      return (
        <Surface
          tone="overlayMedium"
          border="subtle"
          elevation="strong"
          padding="md"
          rounded="3xl"
          className="flex items-center justify-between"
        >
          <Text as="span" variant="title" tone="primary" weight="semibold">
            {titleMap[activeTab]}
          </Text>
          <Button
            type="button"
            size="md"
            variant="secondary"
            className="text-text-secondary"
            onClick={() => navigate('/')}
          >
            На Tap
          </Button>
        </Surface>
      );
    },
    [energy, isAdmin, level, openAdminMetrics, stars, xpIntoLevel, xpToNextLevel]
  );

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
