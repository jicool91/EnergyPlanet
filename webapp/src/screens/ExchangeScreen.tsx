import { startTransition, useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MainScreen } from './MainScreen';
import type { ShopSection } from '@/components/ShopPanel';

type ExchangeTab = 'shop' | 'builds';

export function ExchangeScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const [shopSection, setShopSection] = useState<ShopSection>('star_packs');
  const [exchangeTab, setExchangeTab] = useState<ExchangeTab>('shop');
  const validSections = useMemo<ShopSection[]>(() => ['star_packs', 'boosts'], []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const section = params.get('section');
    if (section && validSections.includes(section as ShopSection)) {
      startTransition(() => {
        setShopSection(section as ShopSection);
        setExchangeTab('shop');
      });
    }
  }, [location.search, validSections]);

  useEffect(() => {
    if (exchangeTab !== 'shop') {
      return;
    }
    const params = new URLSearchParams(location.search);
    if (params.get('section') === shopSection) {
      return;
    }
    params.set('section', shopSection);
    navigate({ pathname: '/exchange', search: params.toString() }, { replace: true });
  }, [shopSection, exchangeTab, location.search, navigate]);

  const handleTabChange = useCallback(
    (tab: 'home' | 'shop' | 'builds' | 'leaderboard' | 'account' | 'clan') => {
      switch (tab) {
        case 'shop':
        case 'builds': {
          setExchangeTab(tab);
          break;
        }
        case 'home': {
          navigate('/', { replace: false });
          break;
        }
        case 'leaderboard': {
          navigate('/friends', { replace: false });
          break;
        }
        case 'account': {
          navigate('/earn', { replace: false });
          break;
        }
        case 'clan': {
          navigate('/airdrop', { replace: false });
          break;
        }
        default:
          navigate('/', { replace: false });
      }
    },
    [navigate]
  );

  const handleOpenAdminMetrics = useCallback(() => {
    navigate('/earn', { replace: false });
  }, [navigate]);

  return (
    <div className="flex h-full w-full flex-col">
      <MainScreen
        activeTab={exchangeTab}
        onTabChange={handleTabChange}
        shopSection={shopSection}
        onShopSectionChange={setShopSection}
        onOpenAdminMetrics={handleOpenAdminMetrics}
      />
    </div>
  );
}
