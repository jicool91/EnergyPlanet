declare global {
  interface TelegramWebAppLite {
    colorScheme?: 'light' | 'dark';
    fontScale?: number | string;
    settings?: {
      font_scale?: number | string;
    } & Record<string, unknown>;
  }

  interface TelegramNamespace {
    WebApp?: TelegramWebAppLite & Record<string, unknown>;
  }

  interface Window {
    Telegram?: TelegramNamespace;
  }
}

export {};
