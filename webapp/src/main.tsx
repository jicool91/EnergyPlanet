/**
 * Energy Planet Webapp - Main Entry Point
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initializeTelegramWebApp, onTelegramThemeChange } from './services/telegram';
import { authStore } from './store/authStore';
import { uiStore } from './store/uiStore';
import { getResolvedTelegramTheme, initializeTelegramTheme } from './utils/telegramTheme';

initializeTelegramTheme();
initializeTelegramWebApp();
uiStore.updateTheme(getResolvedTelegramTheme());
authStore.hydrate();
onTelegramThemeChange(theme => uiStore.updateTheme(theme));

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
