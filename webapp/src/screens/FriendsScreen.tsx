import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainScreen } from './MainScreen';
import type { ShopSection } from '@/components/ShopPanel';

export function FriendsScreen() {
  const navigate = useNavigate();
  const [shopSection, setShopSection] = useState<ShopSection>('star_packs');

  const handleTabChange = useCallback(
    (tab: 'home' | 'shop' | 'builds' | 'leaderboard' | 'account' | 'clan') => {
      switch (tab) {
        case 'leaderboard':
          break;
        case 'home':
          navigate('/', { replace: false });
          return;
        case 'shop':
        case 'builds':
          navigate('/exchange', { replace: false });
          return;
        case 'account':
          navigate('/earn', { replace: false });
          return;
        case 'clan':
          navigate('/airdrop', { replace: false });
          return;
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
        activeTab="leaderboard"
        onTabChange={handleTabChange}
        shopSection={shopSection}
        onShopSectionChange={setShopSection}
        onOpenAdminMetrics={handleOpenAdminMetrics}
      />
    </div>
  );
}
