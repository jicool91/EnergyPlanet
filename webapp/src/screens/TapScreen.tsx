import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainScreen } from './MainScreen';
import type { ShopSection } from '@/components/ShopPanel';

export function TapScreen() {
  const navigate = useNavigate();
  const [shopSection, setShopSection] = useState<ShopSection>('star_packs');

  const handleTabChange = useCallback(
    (tab: 'home' | 'shop' | 'builds' | 'leaderboard' | 'account' | 'clan') => {
      switch (tab) {
        case 'home': {
          navigate('/', { replace: false });
          break;
        }
        case 'shop':
        case 'builds': {
          navigate('/exchange', { replace: false });
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
        activeTab="home"
        onTabChange={handleTabChange}
        shopSection={shopSection}
        onShopSectionChange={setShopSection}
        onOpenAdminMetrics={handleOpenAdminMetrics}
      />
    </div>
  );
}
