# UI/UX Analysis - Детальный анализ проблем интерфейса

**Версия:** 1.0
**Дата:** 2025-10-25
**Статус:** 🔴 Критические проблемы требуют срочного исправления

---

## 📋 Содержание

1. [Safe Area & Layout Issues](#safe-area--layout-issues-критично)
2. [Modal & Component Issues](#modal--component-issues)
3. [Responsive & Overflow Issues](#responsive--overflow-issues)
4. [Component-specific Problems](#component-specific-problems)

---

## 🔴 Safe Area & Layout Issues (КРИТИЧНО)

### Проблема 1: Safe Area не обрабатывается корректно

**Описание:**
Элементы пользовательского интерфейса заезжают под:
- Notch (вырез) на iPhone
- Status bar (шторка) на iOS
- Кнопка "закрыть" (close button) Telegram
- Bottom safe area (область снизу с индикатором)

**Текущее состояние кода:**

**App.tsx (линия 158):**
```tsx
<div className="w-full h-screen flex flex-col bg-gradient-to-b from-dark-bg to-black
  pl-safe-left pr-safe-right pt-safe-top pb-safe-bottom overflow-hidden">
```

**Проблема:**
- Используются Tailwind классы `pt-safe-top`, `pb-safe-bottom` и т.д.
- Эти классы работают с переменными `env()` через CSS
- НО в Telegram Mini Apps нужно использовать CSS переменные от Telegram SDK: `--tg-safe-area-inset-*`
- Tailwind safe-inset классы не полностью поддерживаются в Telegram

**Best Practice (Telegram Mini Apps):**

Согласно документации https://docs.telegram-mini-apps.com/platform/viewport:
- Telegram предоставляет CSS переменные: `--tg-safe-area-inset-top`, `--tg-safe-area-inset-bottom`, `--tg-safe-area-inset-left`, `--tg-safe-area-inset-right`
- Альтернативно: используется контент safe area: `--tg-content-safe-area-inset-*`
- НЕ нужно использовать `env(safe-area-inset-*)` - это iOS Safari переменные, не Telegram!

**HomePanel.tsx (линия 85-86):**
```tsx
paddingTop: 'calc(var(--tg-content-safe-area-top, 0px) + 12px)',
paddingBottom: 'calc(var(--tg-content-safe-area-bottom, 0px) + 16px)',
```

**Проблема:**
- Переменные `--tg-content-safe-area-top/bottom` не стандартные для Telegram
- Должны быть: `--tg-safe-area-inset-top`, `--tg-safe-area-inset-bottom`
- ИЛИ использовать context API от Telegram WebApp SDK

**Решение:**
```typescript
// 1. Получить safe area из Telegram SDK
const tg = window.Telegram?.WebApp;
const safeAreaInsets = {
  top: tg?.safeAreaInset?.top ?? 0,
  bottom: tg?.safeAreaInset?.bottom ?? 0,
  left: tg?.safeAreaInset?.left ?? 0,
  right: tg?.safeAreaInset?.right ?? 0,
};

// 2. Применить через inline styles или CSS переменные
style={{
  paddingTop: `${safeAreaInsets.top + 12}px`,
  paddingBottom: `${safeAreaInsets.bottom + 16}px`,
  paddingLeft: `${safeAreaInsets.left}px`,
  paddingRight: `${safeAreaInsets.right}px`,
}}

// 3. ИЛИ через CSS переменные (лучше для Tailwind):
// :root { --safe-area-top: 24px; --safe-area-bottom: 32px; }
// className="pt-[var(--safe-area-top)] pb-[var(--safe-area-bottom)]"
```

**Файлы требующие исправления:**
- ✅ `webapp/src/App.tsx` (line 158)
- ✅ `webapp/src/components/HomePanel.tsx` (line 85-86)
- ✅ `webapp/src/components/TapSection.tsx` (line 63-64)
- ✅ `webapp/src/components/MainScreenHeader.tsx` (вероятно)
- ✅ `webapp/src/components/TabBar.tsx` (вероятно)

---

## 🟠 Modal & Component Issues

### Проблема 2: OfflineSummaryModal имеет ненужную кнопку "Продолжить"

**Описание:**
При входе в приложение появляется модаль с информацией об офлайн прибыли и кнопка "Продолжить" которая добавляется через Telegram MainButton.

**Текущее состояние кода:**

**OfflineSummaryModal.tsx (линии 54-58):**
```tsx
useTelegramMainButton({
  text: 'Продолжить',
  onClick: onClose,
  enabled: isOpen && supportsMainButton,
});
```

**Проблема:**
- Кнопка "Продолжить" занимает bottom safe area (специальное место для кнопок Telegram)
- Пользователи не знают что нажать
- Это не лучшая UX практика для modals - нужна кнопка внутри модали
- Telegram MainButton должен использоваться для основного действия, не для закрытия модали

**Best Practice:**
- MainButton используется только для основного действия на экране (например, "Купить", "Отправить")
- Для закрытия модалей используются кнопки внутри модали (в Modal.footer)
- На iOS у пользователей есть интуитивное понимание что можно свайпнуть вверх чтобы закрыть

**Решение:**
```typescript
// 1. Убрать MainButton
// useTelegramMainButton({ ... }); // DELETE THIS

// 2. Оставить только кнопку в модали внутри Modal component
<ModalBase
  isOpen={isOpen}
  title="Возврат офлайн"
  onClose={onClose}
  showClose={true}  // показать крестик сверху
  // Добавить внутреннюю кнопку:
  actions={[
    { label: 'Ясно', variant: 'primary', onClick: onClose }
  ]}
>
```

**Файлы требующие исправления:**
- ✅ `webapp/src/components/OfflineSummaryModal.tsx` (lines 54-58)
- ✅ `webapp/src/hooks/useTelegramMainButton.ts` (проверить использование)

---

### Проблема 3: OfflineSummaryModal обрезается с правой стороны

**Описание:**
Модаль с информацией об офлайн прибыли отображает таблицу со статистикой, но содержимое обрезается справа и скролится за экран.

**Текущее состояние кода:**

**OfflineSummaryModal.tsx (линии 69-110):**
```tsx
<div className="max-h-[80vh] overflow-y-auto pr-1 space-y-4">
  <div className="grid gap-3 text-sm text-white/75">
    <div className="flex justify-between items-center bg-white/5 border border-white/10 rounded-lg px-3 py-2">
      <span className="text-white/60">Пассивный доход</span>
      <span className="font-semibold">
        {Math.floor(energy / Math.max(durationSec, 1)).toLocaleString()} E/с
      </span>
    </div>
  </div>
</div>
```

**Проблема:**
- Содержимое не имеет `overflow-x-hidden` или `break-words`
- Большие числа (например, `12345678 E/с`) не переносятся и вылезают за экран
- `pr-1` (padding-right: 0.25rem) - недостаточно
- Grid layout не учитывает узкие экраны

**Best Practice:**
- Используй `overflow-hidden` и `break-words` для больших чисел
- Компактный формат для чисел (5.2M вместо 5200000)
- Responsive grid (например, `grid-cols-1` на мобилях)

**Решение:**
```tsx
<div className="max-h-[80vh] overflow-y-auto overflow-x-hidden space-y-4">
  <div className="grid gap-3 text-sm text-white/75 grid-cols-1">
    <div className="flex justify-between items-center bg-white/5 border border-white/10 rounded-lg px-3 py-2 min-w-0">
      <span className="text-white/60 flex-shrink-0">Пассивный доход</span>
      <span className="font-semibold text-right break-words">
        {formatCompactNumber(Math.floor(energy / Math.max(durationSec, 1)))} E/с
      </span>
    </div>
  </div>
</div>
```

**Файлы требующие исправления:**
- ✅ `webapp/src/components/OfflineSummaryModal.tsx` (lines 69-110)
- ✅ Использовать `formatCompactNumber()` из `utils/number.ts`

---

## 🟠 Component-specific Problems

### Проблема 4: Карточка комбо (streak/multiplier) опускает планету вниз

**Описание:**
При активном комбо (множителе) на главном экране появляется StatCard с количеством комбо, что опускает всю планету вниз и создает плохой UX.

**Текущее состояние кода:**

**HomePanel.tsx (линии 92-114):**
```tsx
<div className="grid grid-cols-2 gap-2 px-4 py-2 lg:px-0 lg:grid-cols-2 xl:grid-cols-4">
  {/* Essential Stats */}
  <StatCard icon="⚡" label="Энергия" value={`${energyCompact} E`} subLabel="Баланс" />
  <StatCard icon="🪐" label="Tap Lvl" value={`Lv ${tapLevel}`} subLabel={`${tapIncomeDisplay} E`} />
  {/* ... еще статы ... */}

  {/* Streak indicator (only if active) */}
  {streakCount > 0 && (
    <StatCard
      icon={isCriticalStreak ? '⚡' : '🔥'}
      label="Комбо"
      value={`×${streakCount}`}
      subLabel={`Лучшее: ${bestStreak}`}
      tone={isCriticalStreak ? 'positive' : 'default'}
    />
  )}
```

**Проблема:**
- StatCard с комбо добавляется в grid и занимает место
- Это опускает TapSection (планету) вниз
- На узких экранах (мобили) это сильно влияет на раскладку
- Во время интенсивного тапинга пользователь видит как планета прыгает вверх-вниз

**Best Practice:**
- Динамические элементы (комбо) НЕ должны менять layout основного контента
- Комбо показывается над планетой или рядом с планетой в overlay
- На главном экране в компактной форме (не занимает место в grid)

**Решение:**
```tsx
// Вариант 1: Overlay поверх планеты (рекомендуется)
<div className="relative">
  <TapSection onTap={handleTap} />
  {streakCount > 0 && (
    <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 rounded-full px-3 py-2">
      <span className="text-sm font-semibold">×{streakCount}</span>
    </div>
  )}
</div>

// Вариант 2: Floating badge над TapSection
<div className="relative">
  <TapSection onTap={handleTap} />
  {streakCount > 0 && (
    <motion.div
      className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan/80 to-lime/80 rounded-full px-4 py-2 text-white font-bold whitespace-nowrap"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      🔥 {streakCount}x комбо!
    </motion.div>
  )}
</div>

// Вариант 3: Убрать из grid и показать справа
// Переместить StatCard в отдельную позицию (например, corner overlay)
```

**Файлы требующие исправления:**
- ✅ `webapp/src/components/HomePanel.tsx` (lines 92-114, нужна реструктуризация)
- ✅ `webapp/src/screens/MainScreen.tsx` (возможно потребуется изменение компоновки)

---

### Проблема 5: Энергия в профиле не минимизирована

**Описание:**
В ProfilePanel при отображении текущей энергии показывается полное число (например, 123456789), вместо компактного формата (123.4M).

**Текущее состояние кода:**

**ProfilePanel.tsx (линии 68-71):**
```tsx
<Card className="flex flex-col gap-2">
  <span className="text-micro uppercase text-[var(--color-text-secondary)]">Энергия</span>
  <strong className="text-heading">
    {Math.floor(profile.progress.energy).toLocaleString()}
  </strong>
</Card>
```

**Проблема:**
- Используется `.toLocaleString()` который добавляет только пробелы (123 456 789)
- Для больших чисел это выглядит громоздко
- Best practice - компактный формат (5.2M, 1.2B)

**Best Practice:**
- Используй компактный формат для больших чисел (типа `formatCompactNumber()`)
- Это экономит место и читается быстрее
- Используется везде в приложении (например, в HomePanel, BuildingsPanel)

**Решение:**
```tsx
import { formatCompactNumber } from '../utils/number';

<Card className="flex flex-col gap-2">
  <span className="text-micro uppercase text-[var(--color-text-secondary)]">Энергия</span>
  <strong className="text-heading">
    {formatCompactNumber(Math.floor(profile.progress.energy))}
  </strong>
</Card>
```

**Файлы требующих исправления:**
- ✅ `webapp/src/components/ProfilePanel.tsx` (lines 68-71)
- ✅ Проверить другие места где показывается полная энергия

---

### Проблема 6: Daily Quest обрезана снизу

**Описание:**
Компонент Daily Reward/Quest находится снизу под планетой, но видна только верхняя часть карточки и кнопку нельзя нажать.

**Вероятные причины:**
- `paddingBottom` основного контейнера недостаточен
- `overflow-hidden` на parent container
- TabBar снизу занимает место и перекрывает контент

**Best Practice:**
- Основной контент должен иметь padding снизу чтобы не перекрываться TabBar
- Обычно: `pb-safe-bottom + height(TabBar) + margin`
- На Telegram: минимум 70-80px padding снизу для TabBar + safe area

**Файлы требующих анализа:**
- ✅ `webapp/src/screens/MainScreen.tsx` (line 320 - `paddingBottom`)
- ✅ `webapp/src/components/DailyRewardBanner.tsx`
- ✅ `webapp/src/components/TabBar.tsx` (высота)

---

## 📊 Сводная таблица проблем

| ID | Проблема | Компонент | Строка | Серьезность |
|----|----------|-----------|--------|------------|
| 1 | Safe Area не работает | App.tsx | 158 | 🔴 КРИТИЧНО |
| 2 | Safe Area в HomePanel | HomePanel.tsx | 85-86 | 🔴 КРИТИЧНО |
| 3 | Кнопка "Продолжить" | OfflineSummaryModal.tsx | 54-58 | 🟠 ВЫСОКО |
| 4 | Modal обрезана справа | OfflineSummaryModal.tsx | 69-110 | 🟠 ВЫСОКО |
| 5 | Комбо опускает планету | HomePanel.tsx | 92-114 | 🟠 ВЫСОКО |
| 6 | Энергия не минимизирована | ProfilePanel.tsx | 68-71 | 🟡 СРЕДНЕ |
| 7 | Daily Quest обрезана | MainScreen.tsx | 320 | 🟠 ВЫСОКО |

---

## ✅ Чек-лист исправлений

- [ ] Исправить Safe Area (использовать Telegram SDK переменные)
- [ ] Убрать MainButton из OfflineSummaryModal
- [ ] Добавить overflow-hidden и min-width constraints в Modal
- [ ] Переместить Streak карточку из grid в overlay
- [ ] Использовать formatCompactNumber в ProfilePanel
- [ ] Добавить proper padding-bottom для Daily Quest visibility
- [ ] Тестировать на iPhone с notch
- [ ] Тестировать на узких экранах (320px)
- [ ] Тестировать в Telegram Desktop и Mobile

---

**Создано:** 2025-10-25 | **Версия:** 1.0 | **Статус:** ✅ Анализ завершен
