declare global {
  interface TelegramWebAppLite {
    colorScheme?: 'light' | 'dark';
  }

  interface TelegramNamespace {
    WebApp?: TelegramWebAppLite & Record<string, unknown>;
  }

  interface Window {
    Telegram?: TelegramNamespace;
  }
}

export {};
