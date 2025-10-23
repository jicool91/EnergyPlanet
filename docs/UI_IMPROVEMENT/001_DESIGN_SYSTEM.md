# Фаза 1: Design System Implementation

**Эстимейт:** 3-4 дня | **Микротаски:** 12

---

## 📋 Микротаски

### 1.1 Подготовка Tailwind конфига
**Цель:** Создать centralized design tokens в `tailwind.config.ts`
- [ ] Добавить custom colors (primary, success, warning, error)
- [ ] Добавить spacing scale (8px base)
- [ ] Добавить custom shadows
- [ ] Добавить custom border-radius
- [ ] Проверить что все значения используются в компонентах

### 1.2 Нормализовать цвета
**Цель:** Заменить все hardcoded colors на named colors
- [ ] `#00D9FF` → `--color-cyan` / `text-cyan`
- [ ] `#48FFAD` → `--color-lime` / `text-lime`
- [ ] `#FFC957` → `--color-gold` / `text-gold`
- [ ] `#FF9898` → `--color-red` / `text-red-error`
- [ ] `#0a0e20` → `--color-dark-bg` (уже в use)
- [ ] `rgba(10,14,32,0.9)` → `--color-card-dark` (create new)
- [ ] Обновить все компоненты которые используют `bg-[rgba(...)]`

### 1.3 Нормализовать spacing
**Цель:** Заменить все spacing на standard scale
- [ ] `gap-[6px]` → `gap-1` (8px)
- [ ] `p-4` → `p-4` (16px) ✓ Already good
- [ ] `p-5` → `p-6` (24px)
- [ ] `px-5 py-2.5` → `px-4 py-2` (standardize)
- [ ] Audit и выровнять все padding/margin/gap в компонентах

### 1.4 Нормализовать типографию
**Цель:** Создать unified font-size scale
- [ ] Create utility classes: `.text-display`, `.text-heading`, `.text-body`, `.text-caption`
- [ ] `text-xl` → `.text-heading` (24px)
- [ ] `text-base` → `.text-body` (16px)
- [ ] `text-sm` → `.text-caption` (14px)
- [ ] `text-[13px]` → `.text-caption-sm` (13px)
- [ ] `text-[11px]` → `.text-micro` (11px)
- [ ] Обновить MainScreen, BuildingCard, ShopPanel

### 1.5 Нормализовать border-radius
**Цель:** Использовать стандартные rounded значения
- [ ] `rounded-3xl` → `rounded-xl` (16px)
- [ ] `rounded-lg` → `rounded-lg` (12px)
- [ ] `rounded-md` → `rounded-md` (6px)
- [ ] `rounded-[18px]` → `rounded-2xl` (18px) или создать custom
- [ ] `rounded-full` → keep as-is
- [ ] Audit все border-radius в компонентах

### 1.6 Нормализовать shadows
**Цель:** Заменить все `box-shadow` на named shadows
- [ ] `shadow-[0_4px_12px_...]` → `shadow-sm`
- [ ] `shadow-[0_12px_24px_...]` → `shadow-md`
- [ ] `shadow-[0_18px_40px_...]` → `shadow-lg`
- [ ] `shadow-[0_24px_60px_...]` → `shadow-xl`
- [ ] Проверить Tailwind конфиг что все значения правильные

### 1.7 Создать цветовые пресеты для компонентов
**Цель:** Named color combinations для частых pattern'ов
- [ ] `bg-card-dark` = `bg-[rgba(10,14,32,0.9)]`
- [ ] `bg-card-dark-secondary` = `bg-dark-secondary/60`
- [ ] `border-card-light` = `border-cyan/[0.12]`
- [ ] `bg-button-primary` = `from-cyan/25 to-[rgba(38,127,255,0.35)]`
- [ ] `bg-button-secondary` = `bg-cyan/[0.22]`
- [ ] `bg-button-success` = `from-[#ffd362] to-orange`
- [ ] Обновить все компоненты на новые пресеты

### 1.8 Создать компонентные типовые стили
**Цель:** Standardize common element combos
- [ ] Header style: `text-heading text-white font-semibold`
- [ ] Subheader: `text-caption text-white/60`
- [ ] Card container: `rounded-lg bg-card-dark border-card-light`
- [ ] Button primary: `px-4 py-2 rounded-md bg-button-primary text-white text-caption font-semibold`
- [ ] Button secondary: `px-4 py-2 rounded-md bg-button-secondary text-white`
- [ ] Badge: `px-2 py-1 rounded-full text-micro font-semibold bg-card-dark/50`

### 1.9 Создать CSS файл с design tokens
**Цель:** Документировать все токены в одном месте
- [ ] Создать `webapp/src/styles/design-tokens.css`
- [ ] Добавить CSS custom properties для всех цветов, spacing, shadows
- [ ] Документировать как использовать токены
- [ ] Добавить примеры использования в каждом компоненте

### 1.10 Validate consistency в существующих компонентах
**Цель:** Убедиться что все компоненты используют новую систему
- [ ] StatCard: проверить padding, spacing, font-sizes
- [ ] BuildingCard: нормализовать все inline styles
- [ ] ShopPanel: привести к стандарту
- [ ] ProfilePanel: align с остальными
- [ ] BoostHub: check и update

### 1.11 Обновить компонентные тесты
**Цель:** Убедиться что новые токены не сломали функционал
- [ ] Run `npm test` после каждого обновления компонента
- [ ] Проверить что все snapshot тесты pass
- [ ] Обновить snapshots если нужно (check дифф!)

### 1.12 Документировать Design System
**Цель:** Создать гайд для разработчиков
- [ ] Создать `webapp/docs/DESIGN_SYSTEM.md`
- [ ] Описать как использовать colors
- [ ] Описать как использовать spacing
- [ ] Описать как использовать typography
- [ ] Показать примеры компонентов
- [ ] Добавить "what NOT to do" примеры

---

## 🎯 Success Criteria

После этой фазы:
- [ ] Tailwind config полностью настроен
- [ ] Все custom colors/spacing/shadows в конфиге
- [ ] Нет hardcoded RGB/hex в компонентах (кроме логотипов/иллюстраций)
- [ ] Типография standardized
- [ ] Border radius standardized
- [ ] Документация написана
- [ ] Все тесты pass
- [ ] Code review approved

---

**Блокирует:** Фазы 2, 3, 4, 5
