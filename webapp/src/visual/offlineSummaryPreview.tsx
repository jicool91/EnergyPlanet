import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { OfflineSummaryModal } from '@/components/OfflineSummaryModal';
import '@/index.css';

const PreviewApp = () => {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const theme = params.get('theme');
    if (theme === 'light') {
      document.documentElement.style.colorScheme = 'light';
      document.documentElement.dataset.previewTheme = 'light';
    }
    document.body.style.background = 'var(--color-bg-primary)';
  }, []);

  return (
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
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <PreviewApp />
    </StrictMode>
  );
}
