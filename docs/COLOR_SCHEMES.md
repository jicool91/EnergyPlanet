# Energy Planet - Color Schemes & Design Tokens

## 🎨 Color Palette

### Primary Dark Theme (основная тема)

**Использование:** Основная цветовая схема для игры (темная)

```css
/* Backgrounds */
--color-bg-primary: #000000    /* Main background */
--color-bg-secondary: #1d2025  /* Secondary backgrounds, modals */
--color-bg-tertiary: #272a2f   /* Cards, sections */
--color-bg-quaternary: #2a2a2a /* Borders, dividers */

/* Text */
--color-text-primary: #ffffff     /* Main text */
--color-text-secondary: #85827d   /* Secondary text, hints */
--color-text-tertiary: #95908a    /* Disabled text */

/* Accents */
--color-accent-gold: #f3ba2f      /* Primary action, highlights */
--color-accent-gold-dark: #d4af37 /* Hover state */
--color-accent-gold-light: #fad258 /* Bright highlights */

/* Semantic */
--color-success: #4ade80   /* Success, level up */
--color-warning: #facc15   /* Warning, limited time */
--color-error: #ef4444     /* Errors, disabled */
--color-info: #3b82f6      /* Information */

/* Borders & Shadows */
--color-border: #43433b    /* Card borders, dividers */
--color-shadow: rgba(0, 0, 0, 0.5) /* Drop shadows */
--color-overlay: rgba(0, 0, 0, 0.7) /* Modal overlays */
```

### Tailwind CSS Configuration

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    colors: {
      black: '#000000',
      white: '#ffffff',
      slate: {
        900: '#1d2025',
        800: '#272a2f',
        700: '#2a2a2a',
        600: '#43433b',
        400: '#85827d',
        300: '#95908a',
      },
      amber: {
        400: '#f3ba2f',
        300: '#fad258',
        500: '#d4af37',
      },
      emerald: {
        400: '#4ade80',  // success
      },
      yellow: {
        400: '#facc15',  // warning
      },
      red: {
        500: '#ef4444',  // error
      },
      blue: {
        500: '#3b82f6',  // info
      },
    },
  },
};
```

---

## 🎯 Color Usage by Component

### Layout & Structure

| Элемент | Цвет | Примечание |
|---------|------|-----------|
| Body background | #000000 | Основной фон всей страницы |
| Container | #1d2025 | Основной контейнер приложения |
| Card background | #272a2f | Все карточки и блоки |
| Card border | #43433b | Тонкие бордюры |

### Typography

| Тип | Цвет | Размер | Font Weight |
|-----|------|--------|-------------|
| Heading 1 | #ffffff | 32px | Bold (700) |
| Heading 2 | #ffffff | 24px | Bold (700) |
| Body text | #ffffff | 16px | Regular (400) |
| Secondary text | #85827d | 14px | Regular (400) |
| Hint/Disabled | #95908a | 12px | Regular (400) |
| Small text | #85827d | 10px | Medium (500) |

### Buttons

| State | Background | Text | Border |
|-------|-----------|------|--------|
| Primary (enabled) | #f3ba2f | #000000 | none |
| Primary (hover) | #d4af37 | #000000 | none |
| Primary (active) | #c49a1f | #000000 | none |
| Primary (disabled) | #43433b | #95908a | none |
| Secondary | #272a2f | #ffffff | #43433b |
| Secondary (hover) | #2a2a2a | #ffffff | #43433b |
| Ghost | transparent | #ffffff | transparent |

### Interactive Elements

| Элемент | Default | Hover | Active | Disabled |
|---------|---------|-------|--------|----------|
| Nav item (inactive) | text: #85827d | text: #ffffff | - | - |
| Nav item (active) | bg: #1c1f24, text: #ffffff | - | - | - |
| Tap Circle border | #f3ba2f/30 | #f3ba2f/50 | #f3ba2f | - |
| Tap Circle glow | rgba(243,186,47,0.1) | rgba(243,186,47,0.3) | - | - |
| Link/Accent text | #f3ba2f | #fad258 | #d4af37 | - |

### Status Indicators

| Статус | Цвет | Значок | Примечание |
|--------|------|--------|-----------|
| Available | #4ade80 | ✅ | Можно выполнить |
| Completed | #4ade80 | ✓ | Выполнено, награда получена |
| Claimable | #f3ba2f | 🎁 | Нужно забрать награду |
| Locked | #95908a | 🔒 | Недоступно (не хватает уровня) |
| Limited | #facc15 | ⏱️ | Ограниченное время |
| Error | #ef4444 | ❌ | Ошибка |

---

## 🌗 Dark/Light Mode Support (Future)

### Light Theme (для будущего)

```css
/* Light mode would invert most colors */
--color-bg-primary: #ffffff
--color-bg-secondary: #f8f8f8
--color-text-primary: #000000
--color-text-secondary: #666666
--color-accent-gold: #d4af37
--color-success: #22c55e
```

**Активация:**
```typescript
// App.tsx
const [theme, setTheme] = useState<'dark' | 'light'>('dark');

return (
  <div className={theme === 'dark' ? 'dark' : 'light'}>
    {/* Content */}
  </div>
);
```

---

## 🎬 Animation Colors

### Floating Numbers Animation
```css
/* При тапе выплывают числа */
color: #ffffff
font-size: 48px
opacity: 1 → 0 (fade out)
transform: translateY(0) → translateY(-100px)
duration: 1s
```

### Glow Effects

```css
/* Pulsing glow на Tap Circle */
box-shadow:
  0 0 0 0 rgba(243, 186, 47, 0.7),
  0 0 0 10px rgba(243, 186, 47, 0);
duration: 2s
```

### Progress Bar Colors

```css
/* Gradient в прогресс-баре */
background: linear-gradient(
  to right,
  #fad258 0%,
  #f3ba2f 50%,
  #d4af37 100%
);
```

---

## 📱 Dark Mode CSS Variables (for future flexibility)

```css
:root {
  --bg-primary: #000000;
  --bg-secondary: #1d2025;
  --bg-tertiary: #272a2f;
  --text-primary: #ffffff;
  --text-secondary: #85827d;
  --accent: #f3ba2f;
  --border: #43433b;
}

@media (prefers-color-scheme: light) {
  :root {
    --bg-primary: #ffffff;
    --bg-secondary: #f8f8f8;
    --bg-tertiary: #efefef;
    --text-primary: #000000;
    --text-secondary: #666666;
    --accent: #d4af37;
    --border: #cccccc;
  }
}

/* Usage in JSX/CSS */
background-color: var(--bg-primary);
color: var(--text-primary);
```

---

## 🎨 How to Apply to Your Design

### Option 1: Copy Colors to Figma Design

If using Figma for design mockups:

1. Create color palette in Figma:
   - Go to Assets → Colors
   - Add each color with label (bg-primary, text-secondary, etc.)
   - Apply to components

2. Export design with these colors
3. Ensure component styles follow this palette

### Option 2: Use Existing Hamster/NotCoin UI

If you want to leverage existing UI from cloned repos:

1. **Extract Tailwind colors:**
   ```bash
   # From Hamster Kombat clone
   grep -r "bg-\|text-\|border-" src/App.tsx | grep "className"
   ```

2. **Map to our palette:**
   - Their `bg-[#1d2025]` → our `bg-slate-900`
   - Their `text-[#85827d]` → our `text-slate-400`
   - Their `#f3ba2f` → our `amber-400`

3. **Replace in our codebase:**
   ```typescript
   // Instead of inline colors
   className="bg-[#1d2025]"

   // Use Tailwind classes
   className="bg-slate-900"
   ```

### Option 3: Custom Color Component

Create a utility for consistent color usage:

```typescript
// utils/colors.ts
export const colors = {
  bg: {
    primary: 'bg-black',
    secondary: 'bg-slate-900',
    tertiary: 'bg-slate-800',
  },
  text: {
    primary: 'text-white',
    secondary: 'text-slate-400',
  },
  accent: {
    gold: 'bg-amber-400',
    success: 'bg-emerald-400',
  },
};

// Usage in component
<div className={colors.bg.secondary}>
  <p className={colors.text.primary}>Hello</p>
</div>
```

---

## 🎯 Real-World Component Examples

### Example 1: Building Card

```tsx
<div className="bg-slate-800 border border-slate-600 rounded-lg p-4">
  {/* Header */}
  <div className="flex justify-between items-center mb-2">
    <h3 className="text-white font-bold">{building.name}</h3>
    <span className="text-amber-400 text-sm">Level {level}</span>
  </div>

  {/* Stats */}
  <p className="text-slate-400 text-sm mb-3">
    Profit: +{formatNumber(building.profitPerHour)}
  </p>

  {/* Button */}
  <button
    className={`
      w-full py-2 rounded-lg font-bold
      ${canAfford
        ? 'bg-amber-400 text-black hover:bg-amber-500'
        : 'bg-slate-600 text-slate-400 cursor-not-allowed'
      }
    `}
  >
    {canAfford ? 'BUY' : 'INSUFFICIENT'}
  </button>
</div>
```

### Example 2: Navigation Item

```tsx
<button
  className={`
    flex flex-col items-center gap-1 p-2 rounded-2xl
    transition-all duration-150
    ${isActive
      ? 'bg-slate-900 text-white'
      : 'text-slate-400 hover:text-white'
    }
  `}
>
  <Icon size={24} />
  <span className="text-xs">{label}</span>
  {badge && (
    <span className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
      {badge}
    </span>
  )}
</button>
```

### Example 3: Daily Task Card

```tsx
<div className="bg-slate-800 rounded-lg p-4 relative">
  <div className="absolute top-2 right-2 w-2 h-2 bg-yellow-400 rounded-full" />

  <img src={taskIcon} alt="" className="w-12 h-12 mx-auto mb-2" />

  <h4 className="text-white text-center text-sm mb-1">
    {task.name}
  </h4>

  <p className="text-slate-400 text-xs text-center mb-2">
    {timeLeft}
  </p>

  {isCompleted && (
    <div className="text-center text-emerald-400 text-xs font-bold">
      ✓ COMPLETED
    </div>
  )}
</div>
```

---

## 🔄 Converting from Hamster Kombat Colors

If you're adapting code from Hamster Kombat clone, here's the mapping:

| Hamster Code | Color Value | Our Tailwind |
|--------------|------------|--------------|
| bg-black | #000000 | bg-black |
| bg-[#1d2025] | #1d2025 | bg-slate-900 |
| bg-[#272a2f] | #272a2f | bg-slate-800 |
| bg-[#43433b] | #43433b | bg-slate-600 |
| text-[#85827d] | #85827d | text-slate-400 |
| text-[#95908a] | #95908a | text-slate-300 |
| text-[#f3ba2f] | #f3ba2f | text-amber-400 |
| text-white | #ffffff | text-white |

**Pro tip:** Use Find & Replace in your IDE:
```
Find: bg-\[#1d2025\]
Replace: bg-slate-900

Find: bg-\[#272a2f\]
Replace: bg-slate-800
```

---

## 📐 Complete Tailwind Config

```javascript
// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#95908a',  // custom
          400: '#85827d',  // custom
          500: '#64748b',
          600: '#43433b',  // custom
          700: '#2a2a2a',  // custom
          800: '#272a2f',  // custom
          900: '#1d2025',  // custom
        },
        amber: {
          300: '#fad258',  // custom light gold
          400: '#f3ba2f',  // custom gold
          500: '#d4af37',  // custom dark gold
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        gutter: '1rem',
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },
    },
  },
  plugins: [],
};
```

---

## ✅ Design Checklist

При создании новых компонентов проверьте:

- [ ] Используются ли правильные цвета из палитры?
- [ ] Достаточен ли контраст между текстом и фоном?
- [ ] Работает ли компонент в темном режиме?
- [ ] Все интерактивные элементы имеют hover/active состояния?
- [ ] Иконки имеют правильный цвет (белый или золотой)?
- [ ] Границы и разделители используют #43433b?
- [ ] Статусы используют семантические цвета (зеленый, желтый, красный)?
- [ ] Анимации используют стандартные цвета без inline styles?

---

## 🎨 Generate Colors Script

Если нужно быстро сгенерировать CSS переменные:

```bash
# generate-colors.js
const colors = {
  'bg-primary': '#000000',
  'bg-secondary': '#1d2025',
  'text-primary': '#ffffff',
  'accent-gold': '#f3ba2f',
  // ... и т.д.
};

const css = Object.entries(colors)
  .map(([name, value]) => `--${name}: ${value};`)
  .join('\n');

console.log(`:root {\n${css}\n}`);
```

```bash
node generate-colors.js > src/colors.css
```

Готово! Используйте эту палитру для последовательного дизайна 🎨
