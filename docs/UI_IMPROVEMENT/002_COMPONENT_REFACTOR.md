# Фаза 2: Component Library & Refactor

**Эстимейт:** 4-5 дней | **Микротаски:** 14

**Требует:** Фаза 1 (Design System) ✅

---

## 📋 Микротаски

### 2.1 Создать базовый Button компонент
**Цель:** Единая кнопка для всех типов (primary, secondary, success, danger)
- [ ] Создать `webapp/src/components/Button.tsx`
- [ ] Props: `variant` (primary|secondary|success|danger), `size` (sm|md|lg), `disabled`, `loading`
- [ ] Добавить loading spinner when `loading=true`
- [ ] Экспортировать из `components/index.ts`
- [ ] Написать примеры использования в comments

### 2.2 Создать Card компонент
**Цель:** Standardized контейнер для контента
- [ ] Создать `webapp/src/components/Card.tsx`
- [ ] Props: `children`, `className`, `highlighted` (for featured items)
- [ ] Использовать design tokens для padding, border, shadow
- [ ] Экспортировать из `components/index.ts`

### 2.3 Создать Badge компонент
**Цель:** Для таблиц (rarity, status, labels)
- [ ] Создать `webapp/src/components/Badge.tsx`
- [ ] Props: `children`, `variant` (default|primary|success|warning|error|epic|legendary)
- [ ] Color mapping: rarity enum → color
- [ ] Size: auto или fixed options

### 2.4 Создать Input компонент (если нужна новая функция)
**Цель:** Для форм и фильтров в будущем
- [ ] Создать `webapp/src/components/Input.tsx`
- [ ] Props: `type`, `placeholder`, `value`, `onChange`, `disabled`
- [ ] Добавить focus/invalid states
- [ ] Keep simple for now

### 2.5 Переделать BuildingCard на новые компоненты
**Цель:** Использовать Button, Card, Badge из library
- [ ] Заменить hardcoded button styles на `<Button>`
- [ ] Заменить card container на `<Card>`
- [ ] Заменить badge на `<Badge variant="rarity">`
- [ ] Удалить все дубли стилей
- [ ] Проверить что вся функционал работает

### 2.6 Переделать ShopPanel на новые компоненты
**Цель:** Единообразный вид star packs и cosmetics
- [ ] Заменить все кнопки на `<Button>`
- [ ] Заменить контейнеры на `<Card>`
- [ ] Заменить rarity badges на `<Badge variant={rarity}>`
- [ ] Унифицировать стиль для star_packs и cosmetics items
- [ ] Проверить что purchase логика работает

### 2.7 Переделать ProfilePanel на новые компоненты
**Цель:** Consistency с остальными панелями
- [ ] Заменить stats cards на `<Card>`
- [ ] Унифицировать typography
- [ ] Добавить `<Badge>` для boost типов
- [ ] Убрать все hardcoded colors

### 2.8 Переделать BoostHub на новые компоненты
**Цель:** Consistency
- [ ] Проверить текущие кнопки и контейнеры
- [ ] Заменить на компонентную библиотеку
- [ ] Унифицировать spacing и padding

### 2.9 Переделать LeaderboardPanel на новые компоненты
**Цель:** Улучшить вид лидерборда
- [ ] Проверить текущую структуру
- [ ] Использовать `<Card>` для записей
- [ ] Добавить `<Badge>` для ranks
- [ ] Унифицировать table стиль

### 2.10 Переделать SettingsScreen на новые компоненты
**Цель:** Consistency
- [ ] Проверить текущие компоненты
- [ ] Заменить на стандартные кнопки и inputs
- [ ] Унифицировать layout

### 2.11 Создать StatCard компонент (обновить существующий)
**Цель:** Базовый компонент для stat карточек
- [ ] Обновить `webapp/src/components/StatCard.tsx`
- [ ] Убедиться что использует design tokens
- [ ] Props: `icon`, `label`, `value`, `subLabel`, `tone` (default|positive|negative)
- [ ] Проверить на главной экране

### 2.12 Создать ModalBase компонент
**Цель:** Базовый modal для error/success dialogs
- [ ] Создать `webapp/src/components/ModalBase.tsx`
- [ ] Props: `isOpen`, `title`, `children`, `actions`, `onClose`
- [ ] Использовать для AuthErrorModal, OfflineSummaryModal, LevelUpScreen
- [ ] Добавить backdrop + overlay
- [ ] Добавить animation

### 2.13 Переделать модальные компоненты
**Цель:** Использовать ModalBase
- [ ] AuthErrorModal → использовать ModalBase
- [ ] OfflineSummaryModal → использовать ModalBase
- [ ] LevelUpScreen → использовать ModalBase (check if possible)
- [ ] PurchaseSuccessModal → использовать ModalBase
- [ ] Убрать дубли CSS

### 2.14 Обновить index.ts exports
**Цель:** Упростить импорты из компонентов
- [ ] Обновить `webapp/src/components/index.ts`
- [ ] Добавить экспорты всех новых компонентов
- [ ] Добавить комментарии what each component is for

---

## 🎯 Success Criteria

После этой фазы:
- [ ] 10+ компонентов в библиотеке
- [ ] Нет дублирующихся стилей в компонентах
- [ ] Все компоненты используют design tokens
- [ ] Все существующие панели переделаны
- [ ] Все тесты pass
- [ ] Нет console.error о missing props
- [ ] Code review approved

---

**Разблокирует:** Фазы 3, 4
**Зависит от:** Фаза 1 (Design System) ✅
