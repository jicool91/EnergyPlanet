type ColorScheme = 'light' | 'dark';

export type TelegramThemeColorKey =
  | 'bg_color'
  | 'text_color'
  | 'hint_color'
  | 'link_color'
  | 'button_color'
  | 'button_text_color'
  | 'secondary_bg_color'
  | 'header_bg_color'
  | 'bottom_bar_bg_color'
  | 'accent_text_color'
  | 'section_bg_color'
  | 'section_header_bg_color'
  | 'section_header_text_color'
  | 'section_separator_color'
  | 'subtitle_text_color'
  | 'destructive_text_color';

export type TelegramThemeParams = Partial<Record<TelegramThemeColorKey, string>> & {
  header_color?: string;
  bottom_bar_color?: string;
};

export const TELEGRAM_THEME_VARIABLES: Record<TelegramThemeColorKey, string> = {
  bg_color: '--tg-theme-bg-color',
  text_color: '--tg-theme-text-color',
  hint_color: '--tg-theme-hint-color',
  link_color: '--tg-theme-link-color',
  button_color: '--tg-theme-button-color',
  button_text_color: '--tg-theme-button-text-color',
  secondary_bg_color: '--tg-theme-secondary-bg-color',
  header_bg_color: '--tg-theme-header-bg-color',
  bottom_bar_bg_color: '--tg-theme-bottom-bar-bg-color',
  accent_text_color: '--tg-theme-accent-text-color',
  section_bg_color: '--tg-theme-section-bg-color',
  section_header_bg_color: '--tg-theme-section-header-bg-color',
  section_header_text_color: '--tg-theme-section-header-text-color',
  section_separator_color: '--tg-theme-section-separator-color',
  subtitle_text_color: '--tg-theme-subtitle-text-color',
  destructive_text_color: '--tg-theme-destructive-text-color',
};

export const DEFAULT_THEME: TelegramThemeParams = {
  bg_color: '#0f0f0f',
  text_color: '#ffffff',
  hint_color: '#9aa0b1',
  link_color: '#3d9eff',
  button_color: '#1f6feb',
  button_text_color: '#ffffff',
  secondary_bg_color: '#181a20',
  header_bg_color: '#0f0f0f',
  bottom_bar_bg_color: '#0f0f0f',
  accent_text_color: '#7ab7ff',
  section_bg_color: '#181a20',
  section_header_bg_color: '#1e212c',
  section_header_text_color: '#ffffff',
  section_separator_color: 'rgba(255, 255, 255, 0.08)',
  subtitle_text_color: '#c4cad8',
  destructive_text_color: '#ff5a5a',
};

let lastResolvedTheme: TelegramThemeParams = { ...DEFAULT_THEME };

function resolveColorScheme(): ColorScheme {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const scheme = window.Telegram?.WebApp?.colorScheme;
  if (scheme === 'dark' || scheme === 'light') {
    return scheme;
  }

  const stored = document.documentElement.dataset.colorScheme;
  if (stored === 'dark' || stored === 'light') {
    return stored;
  }

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function updateMetaThemeColor(color: string) {
  if (typeof document === 'undefined') {
    return;
  }

  const meta =
    document.querySelector<HTMLMetaElement>('meta[name="theme-color"]') ??
    (() => {
      const element = document.createElement('meta');
      element.setAttribute('name', 'theme-color');
      document.head.appendChild(element);
      return element;
    })();

  meta.content = color;
}

function applyDocumentTheme(params: TelegramThemeParams) {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;

  (Object.entries(TELEGRAM_THEME_VARIABLES) as Array<[TelegramThemeColorKey, string]>).forEach(
    ([paramKey, cssVar]) => {
      const value = params[paramKey];
      if (value) {
        root.style.setProperty(cssVar, value);
      }
    }
  );

  if (params.bg_color) {
    document.body.style.backgroundColor = params.bg_color;
  }

  if (params.text_color) {
    document.body.style.color = params.text_color;
  }

  root.dataset.colorScheme = resolveColorScheme();

  updateMetaThemeColor(params.bg_color ?? DEFAULT_THEME.bg_color ?? '#000000');
}

export function getResolvedTelegramTheme(): TelegramThemeParams {
  return { ...lastResolvedTheme };
}

export function mergeTelegramTheme(theme?: TelegramThemeParams): TelegramThemeParams {
  return { ...DEFAULT_THEME, ...(theme ?? {}) };
}

export function initializeTelegramTheme(theme?: TelegramThemeParams): TelegramThemeParams {
  lastResolvedTheme = mergeTelegramTheme(theme);
  applyDocumentTheme(lastResolvedTheme);
  return getResolvedTelegramTheme();
}

export function updateThemeVariables(theme?: TelegramThemeParams): TelegramThemeParams {
  lastResolvedTheme = mergeTelegramTheme(theme);
  applyDocumentTheme(lastResolvedTheme);
  return getResolvedTelegramTheme();
}
