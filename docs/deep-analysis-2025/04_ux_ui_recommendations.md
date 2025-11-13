# UX/UI Рекомендации для Energy Planet

**Дата:** Ноябрь 2025
**Фокус:** Mobile-first дизайн для Telegram Mini Apps

---

## 🎨 Design System

### Telegram UI Kit 2025

**Официальный Figma kit:**
- [Telegram Mini Apps UI Kit](https://www.figma.com/community/file/1348989725141777736)
- 25+ компонентов
- 250+ стилей
- Dark/Light themes
- Адаптированы под iOS/Android

**React библиотека:**
```bash
npm install @telegram-apps/telegram-ui
```

```tsx
import { Button, Card, List } from '@telegram-apps/telegram-ui';

<Button size="large" mode="filled">
  Тапнуть планету
</Button>

<Card>
  <List>
    <List.Item>Solar Panel - 500 E</List.Item>
  </List>
</Card>
```

---

## 📱 Screen Layouts для Energy Planet

### 1. TapScreen (Главный экран)

```
┌─────────────────────────────────┐
│  ⚡ 125,450 E    Lvl 15  🏆 #42 │ <- StatusHeader
├─────────────────────────────────┤
│                                 │
│         [Planet Image]          │ <- Tap Circle
│          (animated)             │    с particle effects
│                                 │
├─────────────────────────────────┤
│  ⚡ +125/tap   ⏱ +1,450/sec    │ <- Stats Summary
├─────────────────────────────────┤
│  [Daily Tasks Progress Bar]    │ <- Quests
├─────────────────────────────────┤
│  🏠 Buildings | 🛒 Shop | 👤   │ <- Bottom Nav
└─────────────────────────────────┘
```

**Key UX принципы:**
- ✅ Планета в центре (thumb zone)
- ✅ Instant feedback при тапе (haptic + animation)
- ✅ Stats всегда видны
- ✅ Bottom navigation для переключения

---

### 2. BuildingsScreen

```
┌─────────────────────────────────┐
│  ← Buildings      🔍 Sort ▼     │
├─────────────────────────────────┤
│  ┌───────────────────────────┐ │
│  │ 🔆 Solar Panel    x12     │ │
│  │ Income: 120 E/sec         │ │
│  │ ▶ Upgrade (Level 3)       │ │
│  │ Cost: 5,000 E             │ │
│  └───────────────────────────┘ │
│  ┌───────────────────────────┐ │
│  │ 💨 Wind Turbine   x5      │ │
│  │ Income: 125 E/sec         │ │
│  │ 🔒 Unlock at Level 5      │ │
│  └───────────────────────────┘ │
├─────────────────────────────────┤
│  🏠 Buildings | 🛒 Shop | 👤   │
└─────────────────────────────────┘
```

**Features:**
- Virtual scrolling для performance
- Skeleton loaders при загрузке
- Lock indicators для unavailable items
- Progress indicators для upgrades

---

### 3. ShopScreen

```
┌─────────────────────────────────┐
│  ← Shop           [Tabs]        │
│  Energy | Boosts | Cosmetics    │
├─────────────────────────────────┤
│  ⭐ BEST VALUE                  │
│  ┌───────────────────────────┐ │
│  │  50,000 Energy            │ │
│  │  +20% BONUS               │ │
│  │  💎 40 Stars              │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌─────────┐  ┌─────────┐      │
│  │ 10K E   │  │ 150K E  │      │
│  │ 10 ⭐   │  │ 100 ⭐  │      │
│  └─────────┘  └─────────┘      │
├─────────────────────────────────┤
│  [Watch Ad for Free Boost] 📺  │
└─────────────────────────────────┘
```

**Monetization UX:**
- Highlight best value (FOMO)
- Show bonus percentages
- Free option visible (rewarded ads)
- Native Telegram Stars integration

---

## 🎬 Animations & Micro-interactions

### Tap Animation (Critical для feel)

```tsx
import { useSpring, animated } from '@react-spring/web';

function TapCircle() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [springs, api] = useSpring(() => ({
    scale: 1,
    rotate: 0,
  }));

  const handleTap = (e: React.MouseEvent) => {
    // Haptic feedback
    window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');

    // Scale animation
    api.start({
      from: { scale: 1, rotate: 0 },
      to: [
        { scale: 1.05, rotate: 2 },
        { scale: 1, rotate: 0 }
      ],
      config: { tension: 300, friction: 10 }
    });

    // Spawn particles
    const { clientX, clientY } = e;
    const newParticles = Array.from({ length: 5 }, (_, i) => ({
      id: Date.now() + i,
      x: clientX,
      y: clientY,
      angle: (Math.PI * 2 * i) / 5,
    }));

    setParticles(prev => [...prev, ...newParticles]);

    // Remove particles after animation
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.includes(p)));
    }, 1000);

    // Call API
    onTap();
  };

  return (
    <animated.div
      className="planet-container"
      style={springs}
      onClick={handleTap}
    >
      <img src="/planet.png" alt="Planet" className="planet" />
      {particles.map(particle => (
        <TapParticle key={particle.id} {...particle} />
      ))}
      <div className="tap-indicator">+{tapIncome} E</div>
    </animated.div>
  );
}
```

**60fps particles:**
```css
@keyframes particle-float {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(var(--x), var(--y)) scale(0);
    opacity: 0;
  }
}

.particle {
  position: absolute;
  width: 20px;
  height: 20px;
  background: radial-gradient(circle, #FFD700, #FFA500);
  border-radius: 50%;
  animation: particle-float 1s ease-out forwards;
  will-change: transform, opacity;
}
```

---

### Level Up Animation

```tsx
import Confetti from 'react-confetti';
import { CheckmarkAnimation } from './CheckmarkAnimation';

function LevelUpModal({ level, onClose }: Props) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Haptic
    window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');

    // Auto-close after 3 seconds
    const timer = setTimeout(() => {
      setShow(false);
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Modal open={show} onClose={onClose}>
      <Confetti numberOfPieces={200} recycle={false} />

      <div className="level-up-modal">
        <CheckmarkAnimation />
        <h1 className="level-title">Level {level}!</h1>
        <p>New buildings unlocked</p>

        <button onClick={onClose}>Continue</button>
      </div>
    </Modal>
  );
}
```

---

## 🎯 Gamification Elements

### Progress Visualization

```tsx
function ProgressBar({ current, max, label }: Props) {
  const percentage = (current / max) * 100;

  return (
    <div className="progress-container">
      <div className="progress-label">
        <span>{label}</span>
        <span>{current.toLocaleString()} / {max.toLocaleString()}</span>
      </div>

      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{
            width: `${percentage}%`,
            transition: 'width 0.3s ease-out'
          }}
        />
      </div>
    </div>
  );
}

// XP Bar Example
<ProgressBar
  current={user.xp}
  max={user.xpToNextLevel}
  label={`Level ${user.level}`}
/>
```

---

### Achievement Notifications

```tsx
function AchievementToast({ achievement }: Props) {
  return (
    <motion.div
      className="achievement-toast"
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="achievement-icon">🏆</div>
      <div className="achievement-content">
        <h4>Achievement Unlocked!</h4>
        <p>{achievement.name}</p>
      </div>
    </motion.div>
  );
}
```

---

## 📊 Data Visualization

### Energy Counter (Animated Numbers)

```tsx
import { useSpring, animated } from '@react-spring/web';

function AnimatedNumber({ value }: { value: number }) {
  const { number } = useSpring({
    from: { number: 0 },
    number: value,
    config: { tension: 20, friction: 10 }
  });

  return (
    <animated.span>
      {number.to(n => n.toFixed(0).toLocaleString())}
    </animated.span>
  );
}

// Usage
<div className="energy-display">
  <span className="energy-icon">⚡</span>
  <AnimatedNumber value={energy} />
  <span className="energy-label">Energy</span>
</div>
```

---

## 🎨 Dark Mode Support

```typescript
// Синхронизация с Telegram theme
const useTelegramTheme = () => {
  const [colorScheme, setColorScheme] = useState(
    window.Telegram.WebApp.colorScheme
  );

  useEffect(() => {
    const handleThemeChange = () => {
      setColorScheme(window.Telegram.WebApp.colorScheme);
    };

    window.Telegram.WebApp.onEvent('themeChanged', handleThemeChange);

    return () => {
      window.Telegram.WebApp.offEvent('themeChanged', handleThemeChange);
    };
  }, []);

  return colorScheme;
};
```

```css
/* CSS Variables для тем */
:root {
  --bg-primary: var(--tg-theme-bg-color, #ffffff);
  --text-primary: var(--tg-theme-text-color, #000000);
  --accent: var(--tg-theme-button-color, #2481cc);
}

[data-theme="dark"] {
  --bg-primary: #1c1c1e;
  --text-primary: #ffffff;
  --accent: #0a84ff;
}
```

---

## ♿ Accessibility

### Font Sizes (Respect user settings)

```css
/* Base font size от системы */
html {
  font-size: 16px; /* Fallback */
  font-size: max(16px, 1rem); /* Respect user zoom */
}

/* Relative units */
.heading {
  font-size: 1.5rem; /* 24px */
}

.body-text {
  font-size: 1rem; /* 16px */
}

.small-text {
  font-size: 0.875rem; /* 14px */
}
```

### Touch Targets

```css
/* Минимум 44x44px (Apple HIG) */
.button,
.tap-target {
  min-width: 44px;
  min-height: 44px;
  padding: 12px 24px;
}

/* Spacing между targets */
.button-group {
  display: flex;
  gap: 8px;
}
```

---

## 🖼️ Asset Optimization

### Image Formats

```tsx
// Responsive images с WebP
<picture>
  <source
    srcSet="/assets/planet-320.webp 320w,
            /assets/planet-640.webp 640w,
            /assets/planet-1024.webp 1024w"
    type="image/webp"
  />
  <source
    srcSet="/assets/planet-320.png 320w,
            /assets/planet-640.png 640w,
            /assets/planet-1024.png 1024w"
    type="image/png"
  />
  <img
    src="/assets/planet-640.png"
    alt="Planet"
    loading="lazy"
    decoding="async"
  />
</picture>
```

### Icon System

```tsx
// SVG icons inline для instant load
export const EnergyIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" />
  </svg>
);

// Или icon font
import '@telegram-apps/telegram-ui/dist/styles.css';
```

---

## 📱 Responsive Breakpoints

```css
/* Mobile-first approach */
.container {
  padding: 16px;
}

/* Small phones (320px) */
@media (min-width: 320px) {
  .container {
    padding: 16px;
  }
}

/* Large phones (375px+) */
@media (min-width: 375px) {
  .container {
    padding: 20px;
  }
}

/* Tablets (768px+) - редко для TMA, но возможно */
@media (min-width: 768px) {
  .container {
    padding: 32px;
    max-width: 600px;
    margin: 0 auto;
  }
}
```

---

## 🚀 Loading States

### Skeleton Screens

```tsx
function BuildingSkeleton() {
  return (
    <div className="building-card skeleton">
      <div className="skeleton-icon" />
      <div className="skeleton-content">
        <div className="skeleton-title" />
        <div className="skeleton-subtitle" />
      </div>
      <div className="skeleton-button" />
    </div>
  );
}
```

```css
@keyframes skeleton-loading {
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
}

.skeleton {
  background: linear-gradient(
    90deg,
    #f0f0f0 0px,
    #e0e0e0 40px,
    #f0f0f0 80px
  );
  background-size: 200px 100%;
  animation: skeleton-loading 1.5s infinite;
}

[data-theme="dark"] .skeleton {
  background: linear-gradient(
    90deg,
    #2c2c2e 0px,
    #3a3a3c 40px,
    #2c2c2e 80px
  );
}
```

---

## 🎯 Итоговые рекомендации

### Приоритетные улучшения:
1. ✅ **Telegram UI Kit** - нативный look & feel
2. ✅ **60fps анимации** - smooth user experience
3. ✅ **Haptic feedback** - физический отклик
4. ✅ **Loading states** - perceived performance
5. ✅ **Dark mode** - комфорт для глаз

### Metrics для отслеживания:
- Time to Interactive < 2.5s
- First Contentful Paint < 1.5s
- Tap latency < 50ms
- Animation FPS > 55

**Следующий документ:** [Monetization Strategy](./05_monetization_strategy.md)
