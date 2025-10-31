import { startTransition, useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TabPageSurface, ShopPanel, BuildingsPanel } from '@/components';
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
      <nav
        className="flex gap-2 rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[rgba(25,28,34,0.72)] p-2"
        aria-label="Навигация магазина"
      >
        {EXCHANGE_TABS.map(tab => {
          const isActive = exchangeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`flex-1 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-text-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-primary)] ${
                isActive
                  ? 'bg-[rgba(243,186,47,0.18)] text-[var(--color-text-primary)] shadow-[0_12px_28px_rgba(243,186,47,0.25)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[rgba(255,255,255,0.05)]'
              }`}
              aria-pressed={isActive}
            >
              <span className="mr-2" aria-hidden="true">
                {tab.icon}
              </span>
              {tab.label}
            </button>
          );
        })}
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
              className="self-end rounded-2xl border border-[rgba(74,222,128,0.32)] px-4 py-2 text-sm text-[var(--color-success)] transition-colors duration-150 hover:bg-[rgba(74,222,128,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-success)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-primary)]"
            >
              Админ. метрики
            </button>
          </div>
        )}
      </TabPageSurface>
    </div>
  );
}
