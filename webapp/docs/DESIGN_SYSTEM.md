# Energy Planet Design System

Единая система design tokens для Energy Planet Telegram Mini App.

## 📚 Содержание

- [Цвета](#цвета)
- [Типография](#типография)
- [Spacing](#spacing)
- [Border Radius](#border-radius)
- [Shadows](#shadows)
- [Компонентные стили](#компонентные-стили)
- [Что НЕЛЬЗЯ делать](#что-нельзя-делать)

---

## 🎨 Цвета

### Brand Colors (Основные цвета)

```
--color-cyan:   #00d9ff  (используй: text-cyan, bg-cyan, border-cyan)
--color-gold:   #ffd700  (используй: text-gold, bg-gold)
--color-lime:   #48ffad  (используй: text-lime, bg-lime)
--color-orange: #ff8d4d  (используй: text-orange, bg-orange)
```

### Status Colors (Статус-цвета)

```
--color-success: #48ffad (используй: text-success, border-success)
--color-warning: #ffc957 (используй: text-warning, border-warning)
--color-error:   #ff5a5a (используй: text-red-error, border-red-error)
```

### Background Colors (Фоны)

```
--color-dark-bg:         #0a0e27  (используй: bg-dark-bg)
--color-dark-secondary:  #101328  (используй: bg-dark-secondary)
--color-dark-tertiary:   #1a2540  (используй: bg-dark-tertiary)
```

### Как использовать цвета

✅ **ПРАВИЛЬНО:**
```tsx
<div className="bg-dark-secondary border-cyan text-lime">
  Правильно используются Tailwind классы
</div>
```

❌ **НЕПРАВИЛЬНО:**
```tsx
<div className="bg-[#101328] border-[#00d9ff] text-[#48ffad]">
  Hardcoded hex - ЗАПРЕЩЕНО!
</div>
```

---

## 🔤 Типография

### Font Sizes

```
Display:     48px / 700 weight  (используй: text-display)
Heading:     24px / 600 weight  (используй: text-heading)
Subheading:  16px / 600 weight  (используй: text-subheading)
Body:        14px / 400 weight  (используй: text-body или sm)
Caption:     12px / 400 weight  (используй: text-caption или xs)
Micro:       11px / 600 weight  (используй: text-micro)
```

### Как использовать типографию

✅ **ПРАВИЛЬНО:**
```tsx
<h1 className="text-display">Заголовок</h1>
<p className="text-body">Текст</p>
<span className="text-caption">Маленький текст</span>
```

❌ **НЕПРАВИЛЬНО:**
```tsx
<h1 className="text-[48px] font-bold">Заголовок</h1>
<p className="text-[14px]">Текст</p>
```

---

## 📏 Spacing (8px base scale)

```
xs:   4px   (используй: p-1, gap-1, m-1)
sm:   8px   (используй: p-2, gap-2, m-2)
md:   16px  (используй: p-4, gap-4, m-4)
lg:   24px  (используй: p-6, gap-6, m-6)
xl:   32px  (используй: p-8, gap-8, m-8)
2xl:  40px  (используй: p-10, gap-10, m-10)
```

### Как использовать spacing

✅ **ПРАВИЛЬНО:**
```tsx
<div className="p-4 gap-2">
  <div className="mb-6">Content</div>
</div>
```

❌ **НЕПРАВИЛЬНО:**
```tsx
<div className="p-[18px] gap-[6px]">
  <div className="mb-[24px]">Content</div>
</div>
```

---

## 🔲 Border Radius

```
xs:      4px   (используй: rounded-xs)
sm:      6px   (используй: rounded-sm)
default: 8px   (используй: rounded)
md:      12px  (используй: rounded-md)
lg:      16px  (используй: rounded-lg)
xl:      24px  (используй: rounded-xl)
2xl:     32px  (используй: rounded-2xl)
```

### Рекомендации

- **Inputs, Badges:** `rounded-sm` (6px)
- **Cards, Buttons:** `rounded-md` (12px)
- **Panels, Modals:** `rounded-lg` (16px)
- **Large sections:** `rounded-xl` (24px)
- **Circular:** `rounded-full`

---

## 🌑 Shadows

### Standard Shadows

```
shadow-sm: 0 4px 12px rgba(0, 0, 0, 0.15)     (small elements)
shadow-md: 0 12px 24px rgba(0, 0, 0, 0.25)    (medium cards)
shadow-lg: 0 20px 48px rgba(0, 0, 0, 0.35)    (large panels)
shadow-xl: 0 24px 60px rgba(0, 0, 0, 0.45)    (modals)
```

### Cyan Glow Shadows

```
shadow-card:       0 2px 8px rgba(0, 217, 255, 0.1)
shadow-card-hover: 0 4px 16px rgba(0, 217, 255, 0.2)
shadow-glow:       0 0 20px rgba(0, 217, 255, 0.3)
```

### Как использовать

✅ **ПРАВИЛЬНО:**
```tsx
<div className="rounded-md shadow-md">Card</div>
<div className="shadow-card-hover">Hover effect</div>
```

❌ **НЕПРАВИЛЬНО:**
```tsx
<div style={{ boxShadow: '0 12px 24px ...' }}>Card</div>
```

---

## 💎 Компонентные стили

### Card Container

```tsx
<div className="rounded-lg bg-dark-secondary/70 border border-cyan/[0.12] p-4">
  Content
</div>
```

### Button Primary

```tsx
<button className="px-4 py-2 rounded-md bg-gradient-to-br from-cyan/25 to-blue-500/35 text-white text-caption font-semibold hover:shadow-glow">
  Primary Button
</button>
```

### Button Secondary

```tsx
<button className="px-4 py-2 rounded-md bg-cyan/[0.22] text-white text-caption font-semibold">
  Secondary Button
</button>
```

### Status Bar Shell (Telegram fullscreen)

```
Tokens:
- --app-header-reserve = 90px (16 top + 56 core + 16 bottom + 2 lvl bar)
- --app-header-buffer = 12px (зазор от системных кнопок Telegram)
- --app-header-offset-top = calc(device safe area + Telegram content inset + buffer)
- --app-content-padding-top = отступ для основного контента под шапкой
```

```tsx
<header
  className="status-bar-shell flex flex-col gap-1 pb-3"
  data-fullscreen={isFullscreen ? 'true' : 'false'}
  style={{ paddingTop: 'var(--app-header-offset-top)' }}
>
  {/* Controls */}
</header>
```

| Состояние       | Visual rules                                                                 |
|-----------------|------------------------------------------------------------------------------|
| Default / sheet | `status-bar-shell` с рамкой и тенью, радиус 28px, blur 24px                  |
| Expanded        | То же, но придерживаемся safe-area слева/справа через `paddingLeft/Right`    |
| Fullscreen      | `data-fullscreen="true"` — убираем рамку/тень, фон = `--app-header-bg`       |

> Не допускается ручное указание `padding-top` или `top` руками — всегда используем CSS-переменные, синхронизированные с Telegram SDK.

### Button Success

```tsx
<button className="px-4 py-2 rounded-md bg-gradient-to-br from-gold to-orange text-white text-caption font-semibold">
  Success Button
</button>
```

### Badge

```tsx
<span className="inline-block px-2 py-1 rounded-full text-micro font-semibold bg-dark-secondary/50 text-white">
  Badge
</span>
```

### Header

```tsx
<h2 className="text-heading font-semibold text-white">
  Header
</h2>
```

### Subheader

```tsx
<p className="text-caption text-white/60">
  Subheader
</p>
```

---

## ❌ Что НЕЛЬЗЯ делать

### Никаких hardcoded цветов

```tsx
// ПЛОХО ❌
<div style={{ color: '#00d9ff' }} />
<div className="text-[#00d9ff]" />
<div className="bg-[rgba(10,14,32,0.9)]" />

// ХОРОШО ✅
<div className="text-cyan" />
<div className="bg-dark-secondary" />
```

### Никаких custom spacing

```tsx
// ПЛОХО ❌
<div className="p-[18px] gap-[6px] mb-[24px]" />

// ХОРОШО ✅
<div className="p-4 gap-1 mb-6" />
```

### Никаких custom font-sizes в компонентах

```tsx
// ПЛОХО ❌
<p className="text-[13px]" />
<h1 className="text-[48px]" />

// ХОРОШО ✅
<p className="text-caption" />
<h1 className="text-display" />
```

### Никаких inline styles (кроме динамических значений)

```tsx
// ПЛОХО ❌
<div style={{ padding: '16px', backgroundColor: '#101328' }} />

// ХОРОШО ✅
<div className="p-4 bg-dark-secondary" />
```

### Никаких custom border-radius

```tsx
// ПЛОХО ❌
<div className="rounded-[18px]" />
<div style={{ borderRadius: '18px' }} />

// ХОРОШО ✅
<div className="rounded-xl" /> {/* 24px */}
```

---

## 🎯 Примеры полных компонентов

### StatCard

```tsx
function StatCard({ icon, label, value, tone = 'default' }) {
  const tones = {
    default: 'bg-dark-secondary/70 border-white/10',
    positive: 'bg-lime/10 border-lime/30',
    warning: 'bg-orange/10 border-orange/30',
  };

  return (
    <div className={`rounded-md border px-4 py-3 ${tones[tone]}`}>
      <div className="flex items-center gap-2 text-sm font-medium">
        <span className="text-lg">{icon}</span>
        <span className="text-micro uppercase">{label}</span>
      </div>
      <div className="text-heading font-semibold text-white">{value}</div>
    </div>
  );
}
```

### BuildingCard

```tsx
function BuildingCard({ building, onUpgrade }) {
  return (
    <div className="rounded-lg bg-dark-secondary/60 border border-cyan/[0.12] p-4 shadow-card hover:shadow-card-hover">
      <div className="mb-3">
        <h3 className="text-subheading font-semibold text-white">{building.name}</h3>
        <p className="text-caption text-white/60">{building.description}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div>
          <p className="text-micro text-white/60 mb-1">Income</p>
          <p className="text-body font-semibold text-lime">{building.income}/s</p>
        </div>
        <div>
          <p className="text-micro text-white/60 mb-1">Cost</p>
          <p className="text-body font-semibold text-gold">{building.cost}</p>
        </div>
      </div>

      <button onClick={onUpgrade} className="w-full px-4 py-2 rounded-md bg-cyan/[0.22] text-white text-caption font-semibold">
        Upgrade
      </button>
    </div>
  );
}
```

---

## 📋 Чек-лист перед commit

- [ ] Нет hardcoded hex цветов
- [ ] Нет custom spacing (gap-[6px], p-[18px] и т.д.)
- [ ] Нет custom font-sizes
- [ ] Все цвета используют Tailwind classes из конфига
- [ ] Все spacing использует 8px scale
- [ ] Все border-radius из стандартного набора
- [ ] Все shadows из стандартного набора

---

**Last updated:** 2025-10-23
**Author:** Energy Planet UI/UX Team
