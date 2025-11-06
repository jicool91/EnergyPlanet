import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { LevelUpScreen } from '@/components/LevelUpScreen';
import { usePreferencesStore } from '@/store/preferencesStore';
import '@/index.css';

function LevelUpPreview() {
  const [open, setOpen] = useState(true);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-primary text-text-primary">
      <LevelUpScreen
        isOpen={open}
        newLevel={42}
        onDismiss={() => setOpen(false)}
        autoDismissDuration={null}
      />
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-6 rounded-2xl border border-border-layer bg-layer-overlay-soft px-4 py-2 text-caption font-semibold text-text-primary focus-ring"
        >
          Открыть снова
        </button>
      )}
    </div>
  );
}

export function renderLevelUpPreview(container: HTMLElement, params: URLSearchParams) {
  const reduceMotionParam = params.get('motion');
  const shouldReduceMotion = reduceMotionParam === 'reduced' || reduceMotionParam === 'true';
  const theme = params.get('theme') === 'light' ? 'light' : 'dark';

  usePreferencesStore.setState(state => ({
    ...state,
    reduceMotion: shouldReduceMotion,
  }));

  document.documentElement.dataset.previewTheme = theme;
  document.documentElement.style.colorScheme = theme;
  document.body.style.background = 'var(--color-bg-primary)';

  const root = createRoot(container);
  root.render(
    <StrictMode>
      <LevelUpPreview />
    </StrictMode>
  );
}
