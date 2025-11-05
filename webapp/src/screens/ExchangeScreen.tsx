import { startTransition, useCallback, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { useLocation, useNavigate } from 'react-router-dom';
import { TabPageSurface, ShopPanel, BuildingsPanel } from '@/components';
import { Surface } from '@/components/ui/Surface';
import { Text } from '@/components/ui/Text';
import type { ShopSection } from '@/components/ShopPanel';
import { useAdminModal } from '@/contexts/AdminModalContext';

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
    <div className="flex flex-col gap-4">
      <nav aria-label="Навигация магазина">
        <Surface
          tone="overlay"
          border="subtle"
          elevation="soft"
          padding="sm"
          rounded="3xl"
          className="flex gap-2"
        >
          {EXCHANGE_TABS.map(tab => {
            const isActive = exchangeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={clsx(
                  'group flex-1 rounded-2xl px-4 py-3 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-primary',
                  isActive
                    ? 'bg-state-accent-pill shadow-[0_12px_28px_rgba(243,186,47,0.25)]'
                    : 'hover:bg-layer-overlay-ghost'
                )}
                aria-pressed={isActive}
              >
                <span className="mr-2" aria-hidden="true">
                  {tab.icon}
                </span>
                <Text
                  as="span"
                  variant="body"
                  weight="semibold"
                  tone={isActive ? 'primary' : 'secondary'}
                  className={
                    !isActive
                      ? 'transition-colors duration-150 group-hover:text-text-primary'
                      : undefined
                  }
                >
                  {tab.label}
                </Text>
              </button>
            );
          })}
        </Surface>
      </nav>

      <TabPageSurface className="gap-6">
        {exchangeTab === 'shop' ? (
          <ShopPanel
            showHeader={false}
            activeSection={shopSection}
            onSectionChange={handleSectionChange}
          />
        ) : (
          <div className="flex flex-col gap-4">
            <BuildingsPanel showHeader={false} />
            <button
              type="button"
              onClick={openAdminMetrics}
              className="self-end rounded-2xl border border-state-success-pill-strong px-4 py-2 transition-colors duration-150 hover:bg-state-success-pill focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-feedback-success focus-visible:ring-offset-2 focus-visible:ring-offset-surface-primary"
            >
              <Text variant="body" tone="success" weight="semibold">
                Админ. метрики
              </Text>
            </button>
          </div>
        )}
      </TabPageSurface>
    </div>
  );
}
