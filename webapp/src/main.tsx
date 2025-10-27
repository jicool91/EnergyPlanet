/**
 * Energy Planet Webapp - Main Entry Point
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { authStore } from './store/authStore';
import { uiStore } from './store/uiStore';
import { initializeTelegramTheme } from './utils/telegramTheme';
import { logger } from './utils/logger';
import { ensureTmaSdkReady } from '@/services/tma/core';
import { getTmaThemeSnapshot, onTmaThemeChange } from '@/services/tma/theme';
import { getTmaSafeAreaSnapshot, getTmaViewportMetrics, onTmaSafeAreaChange, onTmaViewportChange } from '@/services/tma/viewport';

// Export logger to window for debugging
declare global {
  interface Window {
    _energyLogs?: typeof logger;
  }
}

window._energyLogs = logger;

initializeTelegramTheme();
try {
  ensureTmaSdkReady();
} catch (error) {
  logger.warn('Failed to initialize TMA SDK', { error });
}

uiStore.updateTheme(getTmaThemeSnapshot());
getTmaSafeAreaSnapshot();
getTmaViewportMetrics();
const noop = () => {};
onTmaSafeAreaChange(noop);
onTmaViewportChange(noop);
authStore.hydrate();
onTmaThemeChange(theme => uiStore.updateTheme(theme));

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
