import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PvPEventsScreen } from '@/screens/PvPEventsScreen';
import { NotificationContainer } from '@/components';
import { usePreferencesStore } from '@/store/preferencesStore';
import '@/index.css';

export function renderPvPEventsPreview(container: HTMLElement, params: URLSearchParams) {
  const theme = params.get('theme') === 'light' ? 'light' : 'dark';

  document.documentElement.dataset.previewTheme = theme;
  document.documentElement.style.colorScheme = theme;
  document.body.style.background = 'var(--color-bg-primary)';

  const reduceMotionParam = params.get('motion');
  const shouldReduceMotion = reduceMotionParam === 'reduced' || reduceMotionParam === 'true';

  usePreferencesStore.setState(state => ({
    ...state,
    reduceMotion: shouldReduceMotion,
  }));

  const root = createRoot(container);
  root.render(
    <StrictMode>
      <>
        <PvPEventsScreen />
        <NotificationContainer />
      </>
    </StrictMode>
  );
}
