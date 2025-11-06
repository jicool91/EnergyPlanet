# Energy Planet - UI Integration Guide

## 📋 Подготовка к реализации

Этот гайд описывает как интегрировать готовый UI дизайн в существующий проект.

### Фаза 1: Подготовка (1-2 часа)

#### 1.1 Установка зависимостей

```bash
cd webapp

# Основные зависимости уже должны быть установлены:
npm list react react-dom react-router-dom zustand

# Убедитесь что установлены:
npm install --save-dev @types/react @types/react-dom

# Telegram SDK
npm install @telegram-apps/sdk-react @telegram-apps/sdk
```

#### 1.2 Проверка Tailwind CSS конфигурации

```bash
# Проверьте что Tailwind установлен и работает
npm list tailwindcss

# Убедитесь в файлах:
# - tailwind.config.js (или .cjs)
# - postcss.config.js
# - src/index.css (импортированы директивы Tailwind)
```

#### 1.3 Структура проекта

```bash
# Создайте необходимые папки:
mkdir -p src/components/{layout,screens,ui,common}
mkdir -p src/hooks
mkdir -p src/store
mkdir -p src/services
mkdir -p src/utils
mkdir -p src/types

# Проверьте что существует:
ls -la src/
# Должны быть:
# - App.tsx
# - main.tsx
# - index.css
# - App.css
```

---

### Фаза 2: Основной Layout (2-3 часа)

#### 2.1 Создать AppLayout компонент

**Файл:** `src/components/layout/AppLayout.tsx`

```typescript
import React from 'react';
import { ReactNode } from 'react';

interface AppLayoutProps {
  children: ReactNode;
  currentTab: 'tap' | 'exchange' | 'friends' | 'earn' | 'airdrop';
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  currentTab
}) => {
  return (
    <div className="bg-black flex justify-center">
      <div className="w-full bg-black text-white h-screen font-bold
                      flex flex-col max-w-xl relative">

        {/* Основной контент */}
        <div className="flex-1 overflow-y-auto pb-20">
          {children}
        </div>

        {/* Placeholder для навигации */}
        {/* будет добавлена в следующем шаге */}
      </div>
    </div>
  );
};
```

#### 2.2 Создать BottomNavigation компонент

**Файл:** `src/components/layout/BottomNavigation.tsx`

```typescript
import React from 'react';
import { useNavigate } from 'react-router-dom';

type TabType = 'tap' | 'exchange' | 'chat' | 'friends' | 'earn';

interface BottomNavigationProps {
  activeTab: TabType;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab
}) => {
  const navigate = useNavigate();

  const tabs: Array<{
    id: TabType;
    label: string;
    icon: string;
    path: string;
  }> = [
    { id: 'tap', label: 'Mine', icon: '⛏️', path: '/' },
    { id: 'exchange', label: 'Exchange', icon: '🏢', path: '/exchange' },
    { id: 'chat', label: 'Chat', icon: '💬', path: '/chat' },
    { id: 'friends', label: 'Friends', icon: '👥', path: '/friends' },
    { id: 'earn', label: 'Earn', icon: '💰', path: '/earn' },
  ];

  return (
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2
                    w-[calc(100%-2rem)] max-w-screen-md
                    bg-slate-800 flex justify-around items-center
                    z-50 rounded-3xl text-xs m-4 mb-4">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => navigate(tab.path)}
          className={`text-center w-1/5 p-2 rounded-2xl transition-all duration-150
            ${activeTab === tab.id
              ? 'bg-slate-900 text-white'
              : 'text-slate-400 hover:text-white'
            }`}
        >
          <span className="text-xl">{tab.icon}</span>
          <p className="mt-1 text-xs">{tab.label}</p>
        </button>
      ))}
    </div>
  );
};
```

#### 2.3 Обновить App.tsx

```typescript
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { BottomNavigation } from './components/layout/BottomNavigation';

// Screens будут добавлены позже
import { TapScreen } from './components/screens/TapScreen';

function AppContent() {
  const location = useLocation();

  // Определите текущую вкладку по пути
  const getCurrentTab = (): 'tap' | 'exchange' | 'chat' | 'friends' | 'earn' => {
    if (location.pathname === '/') return 'tap';
    if (location.pathname.startsWith('/exchange')) return 'exchange';
    if (location.pathname.startsWith('/chat')) return 'chat';
    if (location.pathname.startsWith('/friends')) return 'friends';
    if (location.pathname.startsWith('/earn')) return 'earn';
    return 'tap';
  };

  const currentTab = getCurrentTab();

  return (
    <AppLayout currentTab={currentTab}>
      <Routes>
        <Route path="/" element={<TapScreen />} />
        {/* Другие маршруты будут добавлены */}
      </Routes>
      <BottomNavigation activeTab={currentTab} />
    </AppLayout>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
```

---

### Фаза 3: Основные UI Компоненты (3-4 часа)

#### 3.1 Создать Button компонент

**Файл:** `src/components/ui/Button.tsx`

```typescript
import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  className = '',
  children,
  ...props
}) => {
  const baseClass = `
    font-bold rounded-lg transition-all duration-200
    disabled:cursor-not-allowed disabled:opacity-50
  `;

  const variantClass = {
    primary: 'bg-amber-400 text-black hover:bg-amber-500 active:bg-amber-600',
    secondary: 'bg-slate-800 text-white border border-slate-600 hover:bg-slate-700',
    tertiary: 'text-amber-400 hover:text-amber-300 bg-transparent',
    ghost: 'text-white hover:opacity-80 bg-transparent',
  }[variant];

  const sizeClass = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }[size];

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      disabled={disabled || loading}
      className={`${baseClass} ${variantClass} ${sizeClass} ${widthClass} ${className}`}
      {...props}
    >
      {loading ? '...' : children}
    </button>
  );
};
```

#### 3.2 Создать Card компонент

**Файл:** `src/components/ui/Card.tsx`

```typescript
import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`
        bg-slate-800 border border-slate-600 rounded-lg p-4
        ${onClick ? 'cursor-pointer hover:bg-slate-700 transition-colors' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};
```

#### 3.3 Создать ProgressBar компонент

**Файл:** `src/components/ui/ProgressBar.tsx`

```typescript
import React from 'react';

interface ProgressBarProps {
  value: number; // 0-100
  label?: string;
  showPercent?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  label,
  showPercent = false,
}) => {
  const clampedValue = Math.min(Math.max(value, 0), 100);

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between mb-1">
          <p className="text-sm text-white">{label}</p>
          {showPercent && <p className="text-sm text-slate-400">{clampedValue}%</p>}
        </div>
      )}
      <div className="w-full h-2 bg-slate-600 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500
                     rounded-full transition-all duration-300"
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
};
```

#### 3.4 Создать Badge компонент

**Файл:** `src/components/ui/Badge.tsx`

```typescript
import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default' }) => {
  const colors = {
    success: 'bg-emerald-400 text-black',
    warning: 'bg-yellow-400 text-black',
    error: 'bg-red-500 text-white',
    info: 'bg-blue-500 text-white',
    default: 'bg-slate-600 text-white',
  }[variant];

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${colors}`}>
      {children}
    </span>
  );
};
```

---

### Фаза 4: Экран Tap Screen (2-3 часа)

#### 4.1 Создать DailyTasksBar

**Файл:** `src/components/common/DailyTasksBar.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';

interface DailyTask {
  id: 'reward' | 'cipher' | 'combo';
  label: string;
  icon: string;
  nextAvailableAt: Date;
}

interface DailyTasksBarProps {
  tasks: DailyTask[];
}

export const DailyTasksBar: React.FC<DailyTasksBarProps> = ({ tasks }) => {
  const [times, setTimes] = useState<Record<string, string>>({});

  useEffect(() => {
    const updateTimes = () => {
      const newTimes: Record<string, string> = {};

      tasks.forEach((task) => {
        const now = new Date();
        const diff = task.nextAvailableAt.getTime() - now.getTime();

        if (diff < 0) {
          newTimes[task.id] = '00:00';
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          newTimes[task.id] = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        }
      });

      setTimes(newTimes);
    };

    updateTimes();
    const interval = setInterval(updateTimes, 60000); // Обновлять каждую минуту
    return () => clearInterval(interval);
  }, [tasks]);

  return (
    <div className="px-4 mt-6 flex justify-between gap-2">
      {tasks.map((task) => (
        <Card key={task.id} className="w-full">
          <div className="text-center">
            <p className="text-2xl mb-1">{task.icon}</p>
            <p className="text-[10px] text-white">{task.label}</p>
            <p className="text-[10px] text-slate-400 mt-2">{times[task.id] || '00:00'}</p>
          </div>
        </Card>
      ))}
    </div>
  );
};
```

#### 4.2 Создать TapCircle

**Файл:** `src/components/common/TapCircle.tsx`

```typescript
import React, { useState } from 'react';
import styles from './TapCircle.module.css';

interface TapCircleProps {
  onTap: (x: number, y: number) => void;
  imageUrl: string;
  disabled?: boolean;
}

export const TapCircle: React.FC<TapCircleProps> = ({
  onTap,
  imageUrl,
  disabled = false,
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const x = (e.clientX - rect.left - centerX) / centerX;
    const y = (e.clientY - rect.top - centerY) / centerY;

    e.currentTarget.style.setProperty('--rotateX', `${-y * 10}deg`);
    e.currentTarget.style.setProperty('--rotateY', `${x * 10}deg`);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.setProperty('--rotateX', '0deg');
    e.currentTarget.style.setProperty('--rotateY', '0deg');
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!disabled) {
      const rect = e.currentTarget.getBoundingClientRect();
      onTap(e.clientX - rect.left, e.clientY - rect.top);
    }
  };

  return (
    <div className="px-4 mt-4 flex justify-center">
      <div
        className={`w-80 h-80 p-4 rounded-full cursor-pointer
          ${styles.tapCircle}
          ${isPressed ? 'scale-95' : 'scale-100'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          transition-transform duration-100
          border-4 border-amber-400/30 hover:border-amber-400/50
        `}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseDown={() => !disabled && setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onClick={handleClick}
        style={{
          perspective: '1000px',
          transform: 'rotateX(var(--rotateX, 0deg)) rotateY(var(--rotateY, 0deg))',
        } as React.CSSProperties}
      >
        <div className="w-full h-full rounded-full flex items-center justify-center overflow-hidden">
          <img
            src={imageUrl}
            alt="Tap Circle"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
};
```

**Файл:** `src/components/common/TapCircle.module.css`

```css
.tapCircle {
  @apply transition-transform;

  box-shadow: 0 0 0 0 rgba(243, 186, 47, 0.7);
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(243, 186, 47, 0.7);
  }
  50% {
    box-shadow: 0 0 0 15px rgba(243, 186, 47, 0);
  }
}
```

#### 4.3 Создать TapScreen

**Файл:** `src/components/screens/TapScreen.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';
import { DailyTasksBar } from '../common/DailyTasksBar';
import { TapCircle } from '../common/TapCircle';

export const TapScreen: React.FC = () => {
  const [points, setPoints] = useState(7249365);
  const [energy, setEnergy] = useState(2532);
  const [maxEnergy] = useState(6500);
  const [level, setLevel] = useState(6);
  const [levelProgress, setLevelProgress] = useState(60);
  const [clicks, setClicks] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const pointsToAdd = 11;
  const profitPerHour = 126420;

  // Daily tasks
  const dailyTasks = [
    {
      id: 'reward' as const,
      label: 'Daily reward',
      icon: '🎁',
      nextAvailableAt: new Date(new Date().setUTCHours(24, 0, 0, 0)),
    },
    {
      id: 'cipher' as const,
      label: 'Daily cipher',
      icon: '🔐',
      nextAvailableAt: new Date(new Date().setUTCHours(19, 0, 0, 0)),
    },
    {
      id: 'combo' as const,
      label: 'Daily combo',
      icon: '⚙️',
      nextAvailableAt: new Date(new Date().setUTCHours(12, 0, 0, 0)),
    },
  ];

  // Энергия восстанавливается
  useEffect(() => {
    const interval = setInterval(() => {
      setEnergy((prev) => Math.min(prev + 1, maxEnergy));
    }, 1000);
    return () => clearInterval(interval);
  }, [maxEnergy]);

  // Пассивный доход
  useEffect(() => {
    const pointsPerSecond = Math.floor(profitPerHour / 3600);
    const interval = setInterval(() => {
      setPoints((prev) => prev + pointsPerSecond);
    }, 1000);
    return () => clearInterval(interval);
  }, [profitPerHour]);

  const handleTap = (x: number, y: number) => {
    if (energy - 11 < 0) return;

    setPoints((prev) => prev + pointsToAdd);
    setEnergy((prev) => Math.max(prev - 11, 0));
    setClicks([...clicks, { id: Date.now(), x, y }]);
  };

  const handleAnimationEnd = (id: number) => {
    setClicks((prev) => prev.filter((click) => click.id !== id));
  };

  return (
    <div className="px-4 z-10">
      {/* Header */}
      <div className="flex items-center space-x-2 pt-4 mb-4">
        <div className="p-1 rounded-lg bg-slate-800">
          <span className="text-2xl">🐹</span>
        </div>
        <div>
          <p className="text-sm text-white font-bold">Player (CEO)</p>
          <p className="text-xs text-slate-400">Legendary</p>
        </div>
      </div>

      {/* Level Progress */}
      <div className="mb-4">
        <div className="flex justify-between mb-2">
          <p className="text-sm">Level {level}</p>
          <p className="text-sm text-slate-400">{level}/10</p>
        </div>
        <ProgressBar value={levelProgress} />
      </div>

      {/* Profit per hour */}
      <div className="bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 mb-6">
        <p className="text-xs text-slate-400 mb-1">Profit per hour</p>
        <p className="text-lg font-bold text-white">+126.4K</p>
      </div>

      {/* Daily Tasks */}
      <DailyTasksBar tasks={dailyTasks} />

      {/* Points Display */}
      <div className="px-4 mt-4 flex justify-center">
        <div className="px-4 py-2 flex items-center space-x-2">
          <span className="text-2xl">💰</span>
          <p className="text-4xl text-white font-bold">{points.toLocaleString()}</p>
        </div>
      </div>

      {/* Tap Circle */}
      <TapCircle
        onTap={handleTap}
        imageUrl="path/to/planet.png"
        disabled={energy < 11}
      />

      {/* Energy Bar */}
      <div className="px-4 mt-6 mb-20">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-lg">⚡</span>
          <span className="text-white font-bold">{energy} / {maxEnergy}</span>
        </div>
        <ProgressBar value={(energy / maxEnergy) * 100} />
      </div>

      {/* Floating Numbers */}
      {clicks.map((click) => (
        <div
          key={click.id}
          className="absolute text-5xl font-bold opacity-0 text-white pointer-events-none"
          style={{
            top: `${click.y - 42}px`,
            left: `${click.x - 28}px`,
            animation: `float 1s ease-out`,
          }}
          onAnimationEnd={() => handleAnimationEnd(click.id)}
        >
          +{pointsToAdd}
        </div>
      ))}

      <style>{`
        @keyframes float {
          0% {
            opacity: 1;
            transform: translateY(0);
          }
          100% {
            opacity: 0;
            transform: translateY(-100px);
          }
        }
      `}</style>
    </div>
  );
};
```

---

### Фаза 5: Остальные экраны (6-8 часов)

#### 5.1 ExchangeScreen
#### 5.2 FriendsScreen
#### 5.3 EarnScreen
#### 5.4 AirdropScreen

Используйте документацию `UI_SCREENS.md` для структуры каждого экрана.

---

## 🔧 Debugging & Testing

### Проверка Layout

```bash
# Используйте DevTools браузера (F12)
# 1. Проверьте что компоненты отрендерены
# 2. Проверьте что нет overflow/скрытых элементов
# 3. Проверьте что навигация работает при клике
```

### Проверка Tailwind CSS

```bash
# Если стили не применяются:
1. Убедитесь что tailwind.config.js содержит src/**/*.tsx
2. Перезапустите dev сервер: npm run dev
3. Очистите кеш браузера (Ctrl+Shift+Delete)
4. Проверьте что postcss.config.js импортирует tailwindcss
```

### Проверка цветов

```bash
# Сравните с цветовой схемой:
# Черный фон должен быть #000000
# Карточки должны быть #272a2f
# Текст должен быть #ffffff
# Золотой accent должен быть #f3ba2f
```

---

## 📦 Инструменты для помощи

### Browser Extensions для Telegram Mini Apps

- **Telegram Mini App Debugger** (Chrome)
- **React DevTools** (Chrome, Firefox)
- **Redux DevTools** (если нужно, для Zustand)

### Для тестирования локально в Telegram

```bash
# 1. Используйте ngrok для туннеля
ngrok http 5173

# 2. Скопируйте URL ngrok
# 3. Обновите bot URL в BotFather
# 4. Откройте мини-приложение в Telegram
# 5. Используйте DevTools (Ctrl+Shift+I) в Mini App
```

---

## 🚀 Чеклист перед завершением

- [ ] Все компоненты создали и экспортировали
- [ ] Bottom navigation работает и переводит между экранами
- [ ] Tap circle работает с эффектом 3D и floating numbers
- [ ] Daily tasks bar показывает таймеры
- [ ] Progress bars анимируются
- [ ] Цвета соответствуют Color Scheme документации
- [ ] Нет console errors
- [ ] Responsive на мобильных (макс ширина 428px)
- [ ] Все кнопки кликабельные
- [ ] Фиксированные элементы (header, nav) не скрывают контент

---

## 📞 Поддержка

При возникновении проблем:

1. **Проверьте документацию:**
   - UI_SCREENS.md - структура экранов
   - COMPONENT_ARCHITECTURE.md - описание компонентов
   - COLOR_SCHEMES.md - цветовая палитра

2. **Проверьте консоль:**
   - Есть ли ошибки в DevTools
   - Правильно ли импортированы компоненты

3. **Проверьте файловую систему:**
   - Правильно ли названы папки/файлы
   - Правильно ли написаны import пути

Готово! Все документация подготовлена для реализации 🚀
