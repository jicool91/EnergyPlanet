import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { OfflineSummaryModal } from '@/components/OfflineSummaryModal';
import '@/index.css';

export function renderOfflineSummaryPreview(container: HTMLElement, params: URLSearchParams) {
  const root = createRoot(container);

  const theme = params.get('theme');
  if (theme === 'light') {
    document.documentElement.style.colorScheme = 'light';
    document.documentElement.dataset.previewTheme = 'light';
  } else {
    document.documentElement.style.colorScheme = 'dark';
    document.documentElement.dataset.previewTheme = 'dark';
  }
  document.body.style.background = 'var(--color-bg-primary)';

  root.render(
    <StrictMode>
      <div className="min-h-screen w-full bg-surface-primary text-text-primary">
        <OfflineSummaryModal
          isOpen
          energy={125_000}
          xp={2_450}
          durationSec={6 * 60 * 60 + 48 * 60 + 12}
          capped
          levelStart={48}
          levelEnd={52}
          levelsGained={4}
          onClose={() => undefined}
        />
      </div>
    </StrictMode>
  );
}
