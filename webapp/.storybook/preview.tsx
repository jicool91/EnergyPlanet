import type { Preview } from 'storybook';
import '@/index.css';
import { initializeTelegramTheme } from '@/utils/telegramTheme';

initializeTelegramTheme();

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    backgrounds: {
      default: 'dark',
    },
  },
};

export default preview;
