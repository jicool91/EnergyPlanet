# Tailwind CSS Migration Plan

**Дата начала:** 2025-10-23
**Статус:** Планирование
**Приоритет:** High

---

## 📋 Обзор

Миграция с монолитного Custom CSS (1139 строк в App.css) на Tailwind CSS для улучшения:
- Масштабируемости проекта
- Удобства разработки новых компонентов
- Решения layout issues (footer, карточки)
- Консистентности дизайна

**Ожидаемое время:** 1-1.5 дня работы

---

## 🎯 Этап 1: Подготовка (30 минут)

### Задача 1.1: Установить зависимости
- Установить `tailwindcss@latest`
- Установить `postcss`
- Установить `autoprefixer`
- Обновить `package.json` scripts

### Задача 1.2: Создать tailwind.config.js
- Настроить content paths для webapp/src
- Добавить custom theme:
  - colors (cyan #00d9ff, gold #ffd700, темный фон #0a0e27)
  - spacing переменные для safe-area
  - borderRadius кастомные значения
  - fontSize (для типографики)
- Включить plugins для viewport CSS variables

### Задача 1.3: Создать postcss.config.js
- Настроить tailwindcss plugin
- Настроить autoprefixer

### Задача 1.4: Обновить index.css
- Удалить все стили кроме глобальных переменных и box-sizing
- Добавить @tailwind directives:
  - `@tailwind base;`
  - `@tailwind components;`
  - `@tailwind utilities;`
- Оставить Telegram safe-area переменные (:root)

---

## 🎨 Этап 2: Переписать компоненты (4-6 часов)

### Задача 2.1: MainScreen.tsx
- Переписать .main-screen → Tailwind grid классы
- Переписать .main-body → Tailwind flex классы
- Переписать .footer → Tailwind fixed/sticky классы
- Переписать .header → Tailwind flex классы
- Переписать .session-status → Tailwind card классы
- Переписать .passive-panel → Tailwind stats классы
- Переписать .planet-container → Tailwind flex центрирование
- Переписать .streak-banner → Tailwind absolute positioning
- Переписать .tab-button → Tailwind button стили

### Задача 2.2: ShopPanel.tsx
- Переписать .shop-panel → flex column container
- Переписать .shop-header → flex justify-between
- Переписать .shop-subtitle → text-sm color
- Переписать .shop-refresh → button gradient
- Переписать .shop-section-tabs → flex gap
- Переписать .shop-section-tab → button активный/неактивный
- Переписать .shop-categories → flex flex-wrap
- Переписать .shop-category → button pills
- Переписать .shop-grid → flex column gap
- Переписать .shop-card → card с gap и padding
- Переписать .shop-card-featured → border + box-shadow variation
- Переписать .shop-preview → image container
- Переписать .shop-info → flex column
- Переписать .shop-title-row → flex justify-between
- Переписать .rarity-tag → badge компонент
- Переписать .shop-button → button variations (primary, accent, equipped)
- Переписать .shop-loader → loading state
- Переписать .shop-error → error message

### Задача 2.3: LeaderboardPanel.tsx
- Переписать .leaderboard-panel → flex column container
- Переписать .leaderboard-header → flex justify-between
- Переписать .leaderboard-table → table + border radius container
- Переписать table th/td стили → Tailwind text sizes, padding, borders
- Переписать .player-id → flex column gap
- Переписать .leaderboard-viewer-rank → flex justify-center статус

### Задача 2.4: BuildingsPanel.tsx
- Переписать .buildings-panel → flex column container
- Переписать .buildings-header → flex justify-between
- Переписать .buildings-subtitle → text-sm
- Переписать .buildings-balance → text-right
- Переписать .buildings-grid → flex column gap
- Переписать .buildings-card → card container с 4 variations
  - default (normal)
  - .recommended (border-green, box-shadow)
  - .locked (border-yellow, opacity-75)
- Переписать .buildings-card-header → flex justify-between
- Переписать .buildings-count → text-sm
- Переписать .buildings-meta → flex gap text-xs
- Переписать .buildings-roi → text-green
- Переписать .buildings-locked → text-yellow
- Переписать .buildings-actions → flex gap
- Переписать .buildings-button → button variations (primary, secondary)

### Задача 2.5: BoostHub.tsx
- Переписать .boost-hub → flex column container
- Переписать .boost-header → relative flex column
- Переписать .boost-refresh → absolute top-right button
- Переписать .boost-grid → flex column gap
- Переписать .boost-card → card container
- Переписать .boost-title-row → flex justify-between
- Переписать .boost-multiplier → badge
- Переписать .boost-description → text-sm
- Переписать .boost-meta → flex gap text-xs
- Переписать .boost-button → button

### Задача 2.6: ProfilePanel.tsx
- Переписать .profile-panel → flex column container
- Переписать .profile-header → flex items-center gap
- Переписать .profile-header .avatar → w-14 h-14 rounded-lg
- Переписать .profile-stats → grid-2 gap
- Переписать .profile-stats .stat → card
- Переписать .profile-bio → card
- Переписать .profile-boosts → card + ul

### Задача 2.7: AuthErrorModal.tsx
- Переписать .modal-backdrop → fixed inset-0 flex center
- Переписать .modal → bg card с border
- Переписать .modal h2 → heading
- Переписать .modal-actions → flex gap justify-end
- Переписать .modal-button → button variations (primary, secondary)

### Задача 2.8: OfflineSummaryModal.tsx
- Переписать .modal-backdrop → fixed inset-0 flex center
- Переписать .modal → bg card
- Переписать все текст/число стили на Tailwind

---

## 🎨 Этап 3: Настройка дизайна (1-2 часа)

### Задача 3.1: Добавить custom colors в tailwind.config.js
- cyan: #00d9ff
- gold: #ffd700
- lime: #48ffad
- orange: #ff8d4d
- red-error: #ff5a5a
- темный фон: #0a0e27, #101328

### Задача 3.2: Добавить custom spacing
- Привязать к Telegram safe-area переменным
- spacing для padding-bottom при footer presence

### Задача 3.3: Добавить кастомные animations
- pulse (уже есть, конвертить в @keyframes)
- Telegram-like transitions (transform, opacity)

### Задача 3.4: Настроить dark mode
- Включить dark: префикс в tailwind.config.js

---

## ✅ Этап 4: Тестирование (1-2 часа)

### Задача 4.1: Функциональное тестирование
- Вкладка "Главная" - планета, тап работает
- Вкладка "Магазин" - cards видны, скроллинг работает, footer видна
- Вкладка "Boost Hub" - список бустов, скроллинг, footer видна
- Вкладка "Постройки" - таблица, скроллинг, footer видна
- Вкладка "Рейтинг" - таблица, скроллинг, footer видна
- Вкладка "Профиль" - информация, скроллинг, footer видна

### Задача 4.2: Layout тестирование
- Footer всегда видна внизу экрана
- Нет горизонтального overflow (карточки не уезжают вправо)
- Safe area правильно учитывается на мобиле Telegram
- Responsive работает (sm:, md:, lg: классы)

### Задача 4.3: Telegram Mini App тестирование
- Протестировать в настоящем Telegram
- Проверить на разных девайсах (iPhone, Android)
- Проверить при открытии виртуальной клавиатуры

---

## 📦 Этап 5: Финализация (30 минут)

### Задача 5.1: Очистка
- Удалить webapp/src/App.css файл
- Убедиться что нет orphaned CSS файлов

### Задача 5.2: Build проверка
- `npm run build` успешно завершается
- Нет CSS errors/warnings
- Bundle size в норме

### Задача 5.3: Git commit
- Коммитить изменения
- Полное описание миграции в commit message

### Задача 5.4: Деплой
- Запушить на main
- Railway автоматически развернет
- Проверить на production

---

## 📊 Структура файлов (после миграции)

```
webapp/src/
├── index.css (только @tailwind directives + :root переменные)
├── App.tsx (без App.css import)
├── screens/
│   └── MainScreen.tsx (className: Tailwind классы)
└── components/
    ├── ShopPanel.tsx (className: Tailwind классы)
    ├── LeaderboardPanel.tsx (className: Tailwind классы)
    ├── BuildingsPanel.tsx (className: Tailwind классы)
    ├── BoostHub.tsx (className: Tailwind классы)
    ├── ProfilePanel.tsx (className: Tailwind классы)
    ├── AuthErrorModal.tsx (className: Tailwind классы)
    └── OfflineSummaryModal.tsx (className: Tailwind классы)

webapp/
├── tailwind.config.js (NEW)
├── postcss.config.js (NEW)
└── package.json (обновлен)
```

---

## 🚀 Как начать

```bash
cd webapp

# Этап 1: Установка и конфиг
npm install -D tailwindcss postcss autoprefixer

# Этап 2-3: Переписать компоненты
# (вручную или с помощью Claude Code)

# Этап 4: Локальное тестирование
npm run dev
# Протестировать все вкладки

# Этап 5: Финализация
npm run build
git add .
git commit -m "feat: migrate to Tailwind CSS"
git push origin main
```

---

## ⚠️ Потенциальные проблемы

| Проблема | Решение |
|----------|---------|
| Tailwind конфликтует с Telegram переменными | Использовать arbitrary values: `p-[calc(10px_+_var(--tg-safe-area-bottom))]` |
| CSS bundle слишком большой | Tailwind автоматически tree-shake неиспользуемые классы |
| Неправильный spacing на мобиле | Проверить tailwind.config.js safe-area mappings |
| Карточки все еще уезжают вправо | Убедиться в `box-sizing: border-box` и используется `w-full` |
| Footer исчезает при скроллинге | Использовать `sticky` или `fixed` в зависимости от контекста |

---

## ✨ Ожидаемые улучшения

- ✅ Нет layout issues (Tailwind enforces best practices)
- ✅ Код понятнее (стили прямо в JSX)
- ✅ Легче добавлять новые компоненты
- ✅ Меньше кода (убираем 1139 строк CSS)
- ✅ Лучше responsive design
- ✅ Встроенная система constraints (spacing, colors, sizes)

---

**Plan created:** 2025-10-23
**Status:** Ready for execution
