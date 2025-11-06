import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthErrorModal } from '@/components/AuthErrorModal';
import '@/index.css';

function AuthErrorPreview() {
  const [open, setOpen] = useState(true);

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-primary text-text-primary">
      <AuthErrorModal
        isOpen={open}
        message={'Токен истёк. Попробуйте авторизоваться повторно.\nМы сохранили ваш прогресс.'}
        onRetry={handleClose}
        onDismiss={handleClose}
      />
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-6 rounded-2xl border border-border-layer bg-layer-overlay-soft px-4 py-2 text-caption font-semibold text-text-primary focus-ring"
        >
          Показать снова
        </button>
      )}
    </div>
  );
}

export function renderAuthErrorPreview(container: HTMLElement, params: URLSearchParams) {
  const theme = params.get('theme') === 'light' ? 'light' : 'dark';

  document.documentElement.dataset.previewTheme = theme;
  document.documentElement.style.colorScheme = theme;
  document.body.style.background = 'var(--color-bg-primary)';

  const root = createRoot(container);
  root.render(
    <StrictMode>
      <AuthErrorPreview />
    </StrictMode>
  );
}
