# Фаза 4: Performance, Polish & Marketing UX

**Эстимейт:** 3-4 дня | **Микротаски:** 12

**Требует:** Фазы 1, 2, 3 ✅

---

## 📋 Микротаски

### 4.1 Добавить Loading States для асинхронных операций
**Цель:** Визуальный feedback при покупке/апгрейде
- [ ] Кнопка покупки: добавить spinner при `loading=true`
- [ ] Кнопка апгрейда: добавить spinner
- [ ] Disable кнопок во время операции
- [ ] Скрыть текст или заменить на "Ожидание…"
- [ ] Проверить в BuildingCard, ShopPanel

### 4.2 Добавить Error Toast/Alert компоненты
**Цель:** Красивые сообщения об ошибках
- [ ] Улучшить `Alert.tsx` компонент (если есть)
- [ ] Добавить error state с иконкой ❌
- [ ] Добавить warning state с иконкой ⚠️
- [ ] Добавить success state с иконкой ✅
- [ ] Auto-dismiss после 3-5 сек

### 4.3 Добавить Skeleton Loaders для всех панелей
**Цель:** Красивый loading state при fetch данных
- [ ] Обновить `LeaderboardSkeleton.tsx`
- [ ] Обновить `ShopSkeleton.tsx`
- [ ] Обновить `ProfileSkeleton.tsx`
- [ ] Добавить `BuildingSkeleton.tsx` (уже есть?)
- [ ] Использовать animation pulse для реалистичности

### 4.4 Улучшить Featured Item визуализацию в Shop
**Цель:** Выделить special offers и featured items
- [ ] Star packs с `featured=true` → яркий background
- [ ] Featured items → свечение/гло эффект (box-shadow)
- [ ] Добавить "Special!" или "Limited" badge
- [ ] Используйте `from-[#ffd362] to-orange` для featured
- [ ] Проверить что выглядит мотивирующе

### 4.5 Добавить Social Proof элементы на главной
**Цель:** Показать что друзья уже играют
- [ ] Маленькая карточка "Friends playing" с аватарами
- [ ] Показать количество онлайн друзей
- [ ] Quick-link в Leaderboard
- [ ] Разместить внизу главного экрана
- [ ] Данные из useGameStore если доступны

### 4.6 Добавить Daily Reward/Special Offer баннер
**Цель:** FOMO элемент для engagement
- [ ] Баннер "Daily Login Reward" на главной
- [ ] Или "Limited Time Offer" для specific items
- [ ] Таймер обратного отсчета
- [ ] Яркие цвета (gold/lime)
- [ ] Проверить дизайн на мобильных

### 4.7 Улучшить Leaderboard визуалы
**Цель:** Показать прогресс и мотивацию
- [ ] Добавить позицию текущего игрока (highlight)
- [ ] Показать разницу со следующим игроком
- [ ] Медаль для top-3 (🥇 🥈 🥉)
- [ ] Progressive bar для позиции в рейтинге
- [ ] Refresh кнопка работает и обновляет

### 4.8 Добавить Animation для Level Up
**Цель:** Праздничное сообщение при уровне
- [ ] Улучшить LevelUpScreen анимацию
- [ ] Confetti при major level-up
- [ ] Звук +  haptic feedback
- [ ] Big emoji/icon (✨ или 🎉)
- [ ] Проверить что анимация не laggy на старых телефонах

### 4.9 Добавить Micro-interactions для кнопок
**Цель:** Улучшить кликабельность и feedback
- [ ] Button hover: scale up или change shadow
- [ ] Button tap: scale down (press effect)
- [ ] Button success: color change + checkmark animation
- [ ] Button error: shake animation
- [ ] Используйте Framer Motion для smooth анимаций

### 4.10 Optimize Image Loading
**Цель:** Быстрая загрузка иконок и preview
- [ ] Lazy-load images используя `loading="lazy"`
- [ ] Добавить `width` и `height` атрибуты
- [ ] Используйте WebP с fallback (если можно)
- [ ] Проверить что preview_url и icon_url загружаются быстро

### 4.11 Улучшить Progress Indicators
**Цель:** Красивые визуализации прогресса
- [ ] XP bar: gradient colors (cyan → lime → gold)
- [ ] Energy bar: компактная версия (если добавлять)
- [ ] Purchase progress: цвет меняется по % ready
- [ ] Animate всех progress bars on change

### 4.12 Добавить Haptic Feedback для всех действий
**Цель:** Тактильная feedback для критичных операций
- [ ] Успешная покупка: `hapticSuccess()`
- [ ] Ошибка операции: `hapticError()`
- [ ] Level up: паттерн vibration
- [ ] Тап планеты: уже есть, проверить что работает
- [ ] Upgrade building: `hapticSuccess()`

---

## 🎯 Success Criteria

После этой фазы:
- [ ] Все async операции имеют loading/error states
- [ ] Featured items явно выделены
- [ ] Social proof элементы видны на главной
- [ ] Leaderboard мотивирует
- [ ] Animations smooth (60fps на мобильных)
- [ ] Haptic feedback работает везде где нужно
- [ ] Нет janky скроллов или laggy анимаций
- [ ] Code review approved
- [ ] Тестирование на реальных мобильных (iOS + Android)

---

**Разблокирует:** Фаза 5
**Зависит от:** Фазы 1, 2, 3 ✅
