import { startTransition, useCallback, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { useLocation, useNavigate } from 'react-router-dom';
import { TabPageSurface, ShopPanel, BuildingsPanel, Panel, Button, Text } from '@/components';
import type { ShopSection } from '@/components/ShopPanel';
import { useAdminModal } from '@/contexts/AdminModalContext';
import { useRenderLatencyMetric } from '@/hooks/useRenderLatencyMetric';

type ExchangeTab = 'shop' | 'builds';

const EXCHANGE_TABS: Array<{ id: ExchangeTab; label: string; icon: string }> = [
  { id: 'shop', label: 'Магазин Stars', icon: '🛒' },
  { id: 'builds', label: 'Постройки', icon: '🏗️' },
];

export function ExchangeScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { openAdminMetrics } = useAdminModal();
  const [shopSection, setShopSection] = useState<ShopSection>('star_packs');
  const [exchangeTab, setExchangeTab] = useState<ExchangeTab>('shop');
  const validSections = useMemo<ShopSection[]>(() => ['star_packs', 'boosts'], []);
  const renderContext = useMemo(
    () => ({
      tab: exchangeTab,
      section: shopSection,
    }),
    [exchangeTab, shopSection]
  );

  useRenderLatencyMetric({ screen: 'exchange_screen', context: renderContext });

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

  const handleTabChange = useCallback((target: ExchangeTab) => {
    setExchangeTab(target);
  }, []);

  const handleSectionChange = useCallback(
    (section: ShopSection) => {
      setShopSection(section);
      const params = new URLSearchParams(location.search);
      params.set('section', section);
      navigate({ pathname: '/exchange', search: params.toString() }, { replace: true });
    },
    [location.search, navigate]
  );

  return (
    <TabPageSurface className="gap-6">
      <nav aria-label="Навигация магазина">
        <Panel
          tone="overlay"
          border="subtle"
          elevation="soft"
          padding="sm"
          spacing="none"
          className="grid grid-cols-1 gap-sm sm:grid-cols-2"
        >
          {EXCHANGE_TABS.map(tab => {
            const isActive = exchangeTab === tab.id;
            return (
              <Button
                key={tab.id}
                type="button"
                size="sm"
                variant={isActive ? 'primary' : 'ghost'}
                onClick={() => handleTabChange(tab.id)}
                aria-pressed={isActive}
                className={clsx(
                  'group flex-1 min-w-0 justify-center rounded-2xl px-4 py-3',
                  !isActive && 'hover:bg-layer-overlay-ghost-soft'
                )}
              >
                <Text as="span" variant="title" aria-hidden="true">
                  {tab.icon}
                </Text>
                <Text
                  as="span"
                  variant="body"
                  weight="semibold"
                  tone={isActive ? 'inverse' : 'accent'}
                  className={clsx(
                    'transition-colors duration-150',
                    !isActive && 'group-hover:text-text-primary'
                  )}
                >
                  {tab.label}
                </Text>
              </Button>
            );
          })}
        </Panel>
      </nav>

      {exchangeTab === 'shop' ? (
        <Panel
          tone="overlayStrong"
          border="subtle"
          elevation="medium"
          padding="lg"
          spacing="none"
          className="w-full"
        >
          <ShopPanel
            showHeader={false}
            activeSection={shopSection}
            onSectionChange={handleSectionChange}
          />
        </Panel>
      ) : (
        <Panel
          tone="overlayStrong"
          border="subtle"
          elevation="medium"
          spacing="lg"
          className="w-full"
        >
          <BuildingsPanel showHeader={false} />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="self-end"
            onClick={openAdminMetrics}
          >
            Админ. метрики
          </Button>
        </Panel>
      )}
    </TabPageSurface>
  );
}
