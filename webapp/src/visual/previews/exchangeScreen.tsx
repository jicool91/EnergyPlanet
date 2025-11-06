import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { ExchangeScreen } from '@/screens/ExchangeScreen';
import { ensureTapPreviewState } from './tapScreen';
import '@/index.css';

const validSections = new Set(['star_packs', 'boosts', 'builds']);

export function renderExchangePreview(container: HTMLElement, params: URLSearchParams) {
  const themeParam = params.get('theme');
  const theme: 'light' | 'dark' = themeParam === 'light' ? 'light' : 'dark';
  const sectionParam = params.get('section');
  const section = sectionParam && validSections.has(sectionParam) ? sectionParam : 'star_packs';

  ensureTapPreviewState(theme);

  document.documentElement.dataset.previewTheme = theme;
  document.documentElement.style.colorScheme = theme;
  document.body.style.background = 'var(--color-bg-primary)';

  const search = new URLSearchParams();
  search.set('section', section);
  if (theme === 'light') {
    search.set('theme', 'light');
  }

  const root = createRoot(container);
  root.render(
    <StrictMode>
      <MemoryRouter initialEntries={[`/exchange?${search.toString()}`]}>
        <div
          data-testid="exchange-preview-root"
          className="min-h-screen w-full bg-surface-primary px-4 py-6 text-text-primary"
        >
          <ExchangeScreen />
        </div>
      </MemoryRouter>
    </StrictMode>
  );
}
