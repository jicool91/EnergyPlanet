import { Suspense, startTransition, useCallback, useMemo } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import LegacyApp from './AppLegacy';
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

function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.replace(/\/+$/, '');
  }
  return pathname;
}

function NextUiRouter() {
  const location = useLocation();
  const navigate = useNavigate();
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
        navigate(tab.path, { replace: false });
      });
    },
    [navigate, normalizedPath]
  );

  return (
    <AppLayout activeTab={activeTab} tabs={NAVIGATION_TABS} onTabSelect={handleTabSelect}>
      <Suspense
        fallback={
          <div className="px-4 py-6 text-sm text-[var(--color-text-secondary)]">Загрузка…</div>
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

export default function App() {
  const isNextUiEnabled = useUIStore(state => state.isNextUiEnabled);

  if (!isNextUiEnabled) {
    return <LegacyApp />;
  }

  return (
    <BrowserRouter>
      <NextUiRouter />
    </BrowserRouter>
  );
}
