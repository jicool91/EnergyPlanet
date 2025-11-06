import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PurchaseSuccessModal } from '@/components/PurchaseSuccessModal';
import { usePreferencesStore } from '@/store/preferencesStore';
import '@/index.css';

export function renderPurchaseSuccessPreview(container: HTMLElement, params: URLSearchParams) {
  const reduceMotionParam = params.get('motion');
  const shouldReduceMotion = reduceMotionParam === 'reduced' || reduceMotionParam === 'true';
  const variantParam = params.get('variant');
  const localeParam = params.get('locale');
  const currencyParam = params.get('currency');

  usePreferencesStore.setState(state => ({
    ...state,
    reduceMotion: shouldReduceMotion,
  }));

  document.body.style.background = 'var(--color-bg-primary)';
  document.documentElement.dataset.previewTheme =
    params.get('theme') === 'light' ? 'light' : 'dark';

  const root = createRoot(container);
  root.render(
    <StrictMode>
      <PurchaseSuccessModal
        isOpen
        itemName={localeParam === 'en' ? 'Starter Premium Pack' : 'Тестовый пак Stars'}
        quantity={variantParam === 'subscription' ? 1 : 2}
        cost={variantParam === 'premium' ? 2990 : 1990}
        costCurrency={currencyParam ?? 'RUB'}
        variant={
          variantParam === 'premium' || variantParam === 'subscription' ? variantParam : 'standard'
        }
        locale={localeParam === 'en' ? 'en' : 'ru'}
        onDismiss={() => {}}
        autoClose={false}
        rewards={
          variantParam === 'premium'
            ? [
                {
                  label: localeParam === 'en' ? 'Included bonus' : 'Бонус',
                  value: localeParam === 'en' ? '+5% passive income' : '+5% к пассивному доходу',
                  icon: '💎',
                  tone: 'accent',
                },
                {
                  label: localeParam === 'en' ? 'Daily gift' : 'Ежедневный подарок',
                  value: localeParam === 'en' ? '500 ⭐ / day' : '500 ⭐ / день',
                  icon: '🎁',
                  tone: 'success',
                },
              ]
            : undefined
        }
        supportLink={
          variantParam === 'premium'
            ? {
                label: localeParam === 'en' ? 'Manage subscription' : 'Управлять подпиской',
                href: 'https://t.me/energy_planet_bot/settings',
              }
            : undefined
        }
      />
    </StrictMode>
  );
}
