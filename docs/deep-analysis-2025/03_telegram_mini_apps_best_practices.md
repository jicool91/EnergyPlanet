# Telegram Mini Apps Best Practices 2025

**Дата:** Ноябрь 2025
**Фокус:** Актуальные стандарты разработки для Telegram Mini Apps

---

## 📋 Оглавление

1. [SDK Integration](#sdk-integration)
2. [Mobile-First Design](#mobile-first-design)
3. [Performance Optimization](#performance-optimization)
4. [Security & Validation](#security--validation)
5. [Telegram Platform Features](#telegram-platform-features)
6. [Testing & QA](#testing--qa)
7. [Deployment](#deployment)

---

## 🔧 SDK Integration

### Базовая настройка (2025)

**1. Подключение SDK**

```html
<!-- webapp/index.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Energy Planet</title>

  <!-- ❗ КРИТИЧНО: Telegram WebApp SDK -->
  <script src="https://telegram.org/js/telegram-web-app.js"></script>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

**2. Инициализация в приложении**

```typescript
// webapp/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Получаем Telegram WebApp объект
const tg = window.Telegram?.WebApp;

if (!tg) {
  console.error('Telegram WebApp SDK not loaded!');
} else {
  // КРИТИЧНО: Сообщаем Telegram что приложение готово
  tg.ready();

  // Разворачиваем на полный экран
  tg.expand();

  // Настраиваем цвета под Telegram theme
  tg.setHeaderColor(tg.themeParams.bg_color || '#ffffff');
  tg.setBackgroundColor(tg.themeParams.bg_color || '#ffffff');

  // Enable closing confirmation (опционально)
  tg.enableClosingConfirmation();
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

---

### Альтернатива: tma.js SDK (Рекомендуется)

**Более удобная библиотека-обёртка:**

```bash
npm install @tma.js/sdk
```

```typescript
// webapp/src/main.tsx
import { init, backButton, mainButton, viewport } from '@tma.js/sdk';

// Инициализация SDK
init();

// Настройка viewport
viewport.expand();

// Использование компонентов
mainButton.setText('Continue');
mainButton.show();
mainButton.on('click', () => {
  console.log('Main button clicked!');
});

// Back button handling
backButton.show();
backButton.on('click', () => {
  // Handle navigation back
  window.history.back();
});
```

**Преимущества tma.js:**
- ✅ Type-safe API
- ✅ Event-driven architecture
- ✅ SSR support (Next.js)
- ✅ Better error handling
- ✅ Active development

---

## 📱 Mobile-First Design

### Viewport Configuration

```typescript
// Правильная настройка viewport
const setupViewport = () => {
  const tg = window.Telegram.WebApp;

  // Разворачиваем приложение
  tg.expand();

  // Отслеживаем изменения viewport
  tg.onEvent('viewportChanged', ({ isStateStable }) => {
    if (isStateStable) {
      console.log('Viewport size:', tg.viewportHeight, tg.viewportStableHeight);

      // Адаптируем UI под новый размер
      document.documentElement.style.setProperty(
        '--tg-viewport-height',
        `${tg.viewportHeight}px`
      );
      document.documentElement.style.setProperty(
        '--tg-viewport-stable-height',
        `${tg.viewportStableHeight}px`
      );
    }
  });
};
```

```css
/* Используем CSS переменные для адаптивности */
.app-container {
  height: var(--tg-viewport-height);
  min-height: var(--tg-viewport-stable-height);
}

/* Safe area для iOS (notch) */
.app-header {
  padding-top: env(safe-area-inset-top);
}

.app-footer {
  padding-bottom: env(safe-area-inset-bottom);
}
```

---

### Thumb Zone Optimization

**Зоны досягаемости на мобильных:**

```
┌─────────────────────────┐
│    ❌ Hard to reach     │ <- 0-20% (header)
│                         │
│    🟡 OK to reach       │ <- 20-50% (content)
│                         │
│    ✅ Easy to reach     │ <- 50-80% (actions)
│                         │
│    ✅ Thumb Zone        │ <- 80-100% (primary action)
└─────────────────────────┘
```

**Размещение UI элементов:**

```tsx
// ❌ Плохо: важные кнопки сверху
<div className="header">
  <button>Главное действие</button>
</div>

// ✅ Хорошо: важные кнопки внизу
<div className="app">
  <header>Информация</header>
  <main>Контент</main>
  <footer>
    <button className="primary-action">Тапнуть планету</button>
  </footer>
</div>
```

---

### Touch Target Sizes

**Минимальные размеры (Apple HIG & Material Design):**

```css
/* Кнопки: минимум 44x44px (iOS) или 48x48px (Android) */
.button {
  min-width: 48px;
  min-height: 48px;
  padding: 12px 24px;
}

/* Spacing между touch targets: минимум 8px */
.button-group {
  display: flex;
  gap: 8px;
}

/* Иконки: 24x24px (standard), 32x32px (large) */
.icon {
  width: 24px;
  height: 24px;
}
```

---

## ⚡ Performance Optimization

### Bundle Size Optimization

**Цель: < 500KB initial bundle**

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({ open: true }) // Анализ bundle size
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Разделяем vendor код
          'react-vendor': ['react', 'react-dom'],
          'telegram': ['@tma.js/sdk'],
        }
      }
    },
    // Минификация
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Удаляем console.log в production
      }
    }
  }
});
```

**Code splitting по роутам:**

```typescript
// ✅ Lazy loading для экранов
import { lazy, Suspense } from 'react';

const TapScreen = lazy(() => import('./screens/TapScreen'));
const ShopScreen = lazy(() => import('./screens/ShopScreen'));
const ProfileScreen = lazy(() => import('./screens/ProfileScreen'));

function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/" element={<TapScreen />} />
        <Route path="/shop" element={<ShopScreen />} />
        <Route path="/profile" element={<ProfileScreen />} />
      </Routes>
    </Suspense>
  );
}
```

---

### Image Optimization

```typescript
// Компонент оптимизированного изображения
import { useState, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height
}) => {
  const [loaded, setLoaded] = useState(false);

  // Используем Intersection Observer для lazy loading
  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => setLoaded(true);
  }, [src]);

  return (
    <div className="image-container">
      {!loaded && <div className="skeleton" style={{ width, height }} />}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        style={{ display: loaded ? 'block' : 'none' }}
      />
    </div>
  );
};
```

**Использование WebP:**

```html
<picture>
  <source srcset="/assets/planet.webp" type="image/webp" />
  <source srcset="/assets/planet.png" type="image/png" />
  <img src="/assets/planet.png" alt="Planet" />
</picture>
```

---

### 60 FPS Animations

**Используйте CSS transforms (GPU-accelerated):**

```css
/* ❌ Плохо: вызывает reflow */
@keyframes slide-bad {
  from { margin-left: 0; }
  to { margin-left: 100px; }
}

/* ✅ Хорошо: GPU-accelerated */
@keyframes slide-good {
  from { transform: translateX(0); }
  to { transform: translateX(100px); }
}

/* Критично для smooth анимаций */
.animated-element {
  will-change: transform;
  transform: translateZ(0); /* Force GPU layer */
}
```

**React Spring для сложных анимаций:**

```typescript
import { useSpring, animated } from '@react-spring/web';

function TapCircle() {
  const [springs, api] = useSpring(() => ({
    scale: 1,
    config: { tension: 300, friction: 10 }
  }));

  const handleTap = () => {
    api.start({
      from: { scale: 1 },
      to: { scale: 1.1 },
      onRest: () => api.start({ scale: 1 })
    });
  };

  return (
    <animated.div
      style={springs}
      onClick={handleTap}
      className="planet"
    >
      Tap me!
    </animated.div>
  );
}
```

---

### Memory Management

```typescript
// Правильная очистка event listeners
useEffect(() => {
  const handleResize = () => {
    // Handle resize
  };

  window.addEventListener('resize', handleResize);

  // ✅ Cleanup
  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, []);

// Очистка timers
useEffect(() => {
  const interval = setInterval(() => {
    // Update game state
  }, 1000);

  return () => clearInterval(interval);
}, []);

// Отмена fetch запросов
useEffect(() => {
  const controller = new AbortController();

  fetch('/api/data', { signal: controller.signal })
    .then(res => res.json())
    .catch(err => {
      if (err.name === 'AbortError') return;
      console.error(err);
    });

  return () => controller.abort();
}, []);
```

---

## 🔒 Security & Validation

### Валидация initData (Critical)

**Серверная валидация ОБЯЗАТЕЛЬНА:**

```typescript
// backend/src/services/AuthService.ts
import crypto from 'crypto';

export class AuthService {
  private botToken: string;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN!;
    if (!this.botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN not set!');
    }
  }

  /**
   * Валидация initData от Telegram
   * @see https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
   */
  validateInitData(initData: string): TelegramUser | null {
    try {
      const urlParams = new URLSearchParams(initData);
      const hash = urlParams.get('hash');

      if (!hash) {
        return null;
      }

      urlParams.delete('hash');

      // 1. Создаём data-check-string
      const dataCheckString = Array.from(urlParams.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

      // 2. Вычисляем secret_key
      const secretKey = crypto
        .createHmac('sha256', 'WebAppData')
        .update(this.botToken)
        .digest();

      // 3. Вычисляем hash
      const computedHash = crypto
        .createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');

      // 4. Сравниваем hashes
      if (computedHash !== hash) {
        console.error('Invalid hash');
        return null;
      }

      // 5. Проверяем auth_date (не старше 1 часа)
      const authDate = parseInt(urlParams.get('auth_date') || '0', 10);
      const currentTime = Math.floor(Date.now() / 1000);

      if (currentTime - authDate > 3600) {
        console.error('Init data expired');
        return null;
      }

      // 6. Парсим user data
      const userParam = urlParams.get('user');
      if (!userParam) {
        return null;
      }

      const user: TelegramUser = JSON.parse(userParam);

      return user;
    } catch (error) {
      console.error('Init data validation error:', error);
      return null;
    }
  }

  /**
   * Генерация JWT токена после успешной валидации
   */
  generateToken(user: TelegramUser): string {
    return jwt.sign(
      {
        userId: user.id.toString(),
        username: user.username,
      },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );
  }
}
```

**Использование в API:**

```typescript
// backend/src/api/routes/auth.ts
router.post('/login', async (req, res) => {
  const { initData } = req.body;

  // Валидируем initData
  const user = authService.validateInitData(initData);

  if (!user) {
    return res.status(401).json({ error: 'Invalid init data' });
  }

  // Создаём/обновляем пользователя в БД
  await userRepository.upsert({
    telegramId: user.id.toString(),
    username: user.username || 'Anonymous',
    firstName: user.first_name,
    lastName: user.last_name,
  });

  // Генерируем JWT токен
  const token = authService.generateToken(user);

  res.json({ token, user });
});
```

---

### Клиентская отправка initData

```typescript
// webapp/src/services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Получаем initData от Telegram
const tg = window.Telegram?.WebApp;
const initData = tg?.initData || '';

// Отправляем на авторизацию
export const login = async () => {
  const response = await api.post('/auth/login', { initData });
  const { token } = response.data;

  // Сохраняем токен
  localStorage.setItem('token', token);

  // Добавляем в headers для всех запросов
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  return response.data;
};
```

---

## 🎯 Telegram Platform Features

### Haptic Feedback (Вибрация)

```typescript
// Используйте для улучшения UX
const tg = window.Telegram.WebApp;

// При тапе планеты
const handleTap = () => {
  tg.HapticFeedback.impactOccurred('medium'); // light | medium | heavy
  // ... tap logic
};

// При покупке
const handlePurchase = () => {
  tg.HapticFeedback.notificationOccurred('success'); // error | success | warning
  // ... purchase logic
};

// При ошибке
const handleError = () => {
  tg.HapticFeedback.notificationOccurred('error');
  // ... error handling
};

// Selection changed
const handleSelect = () => {
  tg.HapticFeedback.selectionChanged();
};
```

---

### Main Button (Native кнопка)

```typescript
import { useEffect } from 'react';

function CheckoutScreen({ total, onPurchase }: Props) {
  const tg = window.Telegram.WebApp;

  useEffect(() => {
    // Настраиваем Main Button
    tg.MainButton.setText(`Buy for ${total} Stars`);
    tg.MainButton.show();
    tg.MainButton.enable();
    tg.MainButton.setParams({
      color: tg.themeParams.button_color,
      text_color: tg.themeParams.button_text_color,
    });

    // Обработчик клика
    const handleClick = () => {
      tg.MainButton.showProgress(true); // Loading state
      onPurchase().finally(() => {
        tg.MainButton.hideProgress();
      });
    };

    tg.MainButton.onClick(handleClick);

    // Cleanup
    return () => {
      tg.MainButton.offClick(handleClick);
      tg.MainButton.hide();
    };
  }, [total, onPurchase]);

  return <div>Checkout content...</div>;
}
```

---

### Back Button

```typescript
function useBackButton(onClick: () => void) {
  const tg = window.Telegram.WebApp;

  useEffect(() => {
    tg.BackButton.show();
    tg.BackButton.onClick(onClick);

    return () => {
      tg.BackButton.offClick(onClick);
      tg.BackButton.hide();
    };
  }, [onClick]);
}

// Использование
function ProfileScreen() {
  const navigate = useNavigate();

  useBackButton(() => {
    navigate('/');
  });

  return <div>Profile...</div>;
}
```

---

### Theme Adaptation

```typescript
// Адаптация под Telegram theme
const applyTelegramTheme = () => {
  const tg = window.Telegram.WebApp;
  const theme = tg.themeParams;

  document.documentElement.style.setProperty('--tg-bg-color', theme.bg_color || '#ffffff');
  document.documentElement.style.setProperty('--tg-text-color', theme.text_color || '#000000');
  document.documentElement.style.setProperty('--tg-hint-color', theme.hint_color || '#999999');
  document.documentElement.style.setProperty('--tg-link-color', theme.link_color || '#2481cc');
  document.documentElement.style.setProperty('--tg-button-color', theme.button_color || '#2481cc');
  document.documentElement.style.setProperty('--tg-button-text-color', theme.button_text_color || '#ffffff');
};

// Отслеживаем изменения темы
window.Telegram.WebApp.onEvent('themeChanged', applyTelegramTheme);
```

```css
/* Используем CSS переменные */
body {
  background-color: var(--tg-bg-color);
  color: var(--tg-text-color);
}

.button-primary {
  background-color: var(--tg-button-color);
  color: var(--tg-button-text-color);
}

.link {
  color: var(--tg-link-color);
}
```

---

### Cloud Storage (User Data)

```typescript
// Telegram предоставляет 1KB cloud storage per user
const tg = window.Telegram.WebApp;

// Сохранение настроек
const saveSettings = async (settings: Settings) => {
  const data = JSON.stringify(settings);
  await tg.CloudStorage.setItem('settings', data);
};

// Загрузка настроек
const loadSettings = async (): Promise<Settings | null> => {
  const data = await tg.CloudStorage.getItem('settings');
  return data ? JSON.parse(data) : null;
};

// Удаление
const clearSettings = async () => {
  await tg.CloudStorage.removeItem('settings');
};
```

**Use cases:**
- User preferences (sound, notifications)
- UI state (last viewed tab)
- Tutorial completion
- **НЕ** для game state (используйте backend!)

---

## 🧪 Testing & QA

### Testing в Telegram

**1. Desktop Telegram (Web K)**
- Открыть Telegram Desktop
- Найти бота → Start → Open Mini App

**2. Mobile Telegram**
- iOS: TestFlight beta testing
- Android: Internal testing track

**3. Telegram Web (web.telegram.org)**
- Работает как mobile preview
- Удобно для quick testing

---

### Local Development с ngrok

```bash
# 1. Запустить dev сервер
npm run dev # http://localhost:5173

# 2. Создать туннель
ngrok http 5173

# Output:
# Forwarding: https://abc123.ngrok.io -> http://localhost:5173

# 3. Настроить бота через BotFather
# /setmenubutton
# URL: https://abc123.ngrok.io

# 4. Открыть бота в Telegram → Menu → Mini App
```

**Альтернатива: Cloudflare Tunnel**
```bash
# Бесплатная альтернатива ngrok
cloudflared tunnel --url http://localhost:5173
```

---

### Mock Telegram Environment

```typescript
// webapp/src/utils/mockTelegram.ts
// Для development без Telegram
export const mockTelegramWebApp = () => {
  if (window.Telegram?.WebApp) {
    return; // Уже есть
  }

  // @ts-ignore
  window.Telegram = {
    WebApp: {
      initData: 'mock_init_data',
      initDataUnsafe: {
        user: {
          id: 123456,
          first_name: 'Test',
          username: 'testuser',
        },
      },
      version: '6.0',
      platform: 'web',
      colorScheme: 'light',
      themeParams: {
        bg_color: '#ffffff',
        text_color: '#000000',
        hint_color: '#999999',
        link_color: '#2481cc',
        button_color: '#2481cc',
        button_text_color: '#ffffff',
      },
      isExpanded: true,
      viewportHeight: 600,
      viewportStableHeight: 600,
      headerColor: '#ffffff',
      backgroundColor: '#ffffff',
      isClosingConfirmationEnabled: false,
      BackButton: {
        isVisible: false,
        show: () => console.log('BackButton.show()'),
        hide: () => console.log('BackButton.hide()'),
        onClick: (callback: () => void) => {},
        offClick: (callback: () => void) => {},
      },
      MainButton: {
        text: '',
        color: '#2481cc',
        textColor: '#ffffff',
        isVisible: false,
        isActive: true,
        isProgressVisible: false,
        setText: (text: string) => console.log('MainButton.setText:', text),
        show: () => console.log('MainButton.show()'),
        hide: () => console.log('MainButton.hide()'),
        enable: () => console.log('MainButton.enable()'),
        disable: () => console.log('MainButton.disable()'),
        showProgress: (show: boolean) => console.log('MainButton.showProgress:', show),
        hideProgress: () => console.log('MainButton.hideProgress()'),
        setParams: (params: any) => console.log('MainButton.setParams:', params),
        onClick: (callback: () => void) => {},
        offClick: (callback: () => void) => {},
      },
      HapticFeedback: {
        impactOccurred: (style: string) => console.log('Haptic:', style),
        notificationOccurred: (type: string) => console.log('Notification:', type),
        selectionChanged: () => console.log('Selection changed'),
      },
      ready: () => console.log('WebApp.ready()'),
      expand: () => console.log('WebApp.expand()'),
      close: () => console.log('WebApp.close()'),
      enableClosingConfirmation: () => {},
      disableClosingConfirmation: () => {},
      onEvent: (eventType: string, callback: Function) => {},
      offEvent: (eventType: string, callback: Function) => {},
      sendData: (data: string) => console.log('sendData:', data),
      openLink: (url: string) => console.log('openLink:', url),
      openTelegramLink: (url: string) => console.log('openTelegramLink:', url),
      openInvoice: (url: string, callback?: Function) => {
        console.log('openInvoice:', url);
        if (callback) callback('paid');
      },
    },
  };
};

// Использование
if (import.meta.env.DEV) {
  mockTelegramWebApp();
}
```

---

## 🚀 Deployment

### Hosting Options (2025)

| Platform | Цена/месяц | Deploy Time | Auto-scaling | SSL |
|----------|------------|-------------|--------------|-----|
| **Railway** | $5-20 | 2-5 мин | ✅ Да | ✅ Да |
| **Vercel** | $0-20 | 1-2 мин | ✅ Да | ✅ Да |
| **Netlify** | $0-20 | 1-2 мин | ✅ Да | ✅ Да |
| **Cloudflare Pages** | $0 | 2-3 мин | ✅ Да | ✅ Да |

**Рекомендация для Energy Planet:** Railway (backend) + Vercel (frontend)

---

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run lint

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        run: |
          railway up --service backend

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        run: |
          vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

---

## 📚 Дополнительные ресурсы

### Официальная документация
- [Telegram WebApps](https://core.telegram.org/bots/webapps)
- [Bot Payments API](https://core.telegram.org/bots/payments)
- [Telegram UI Guidelines](https://telegram.org/blog/telegram-mini-apps)

### Libraries & Tools
- [tma.js SDK](https://github.com/telegram-mini-apps-dev) - Лучшая обёртка
- [TelegramUI Components](https://github.com/telegram-mini-apps-dev/TelegramUI) - React компоненты
- [Telegram WebApp Types](https://www.npmjs.com/package/@twa-dev/types) - TypeScript типы

### Примеры приложений
- [Blum](https://t.me/blum) - Crypto trading game
- [TG Trivia](https://t.me/trivia_bot) - Quiz game
- [FindMini](https://t.me/findminiapp_bot) - Directory of Mini Apps

---

**Следующий шаг:** [UX/UI Recommendations](./04_ux_ui_recommendations.md) для дизайна интерфейса
