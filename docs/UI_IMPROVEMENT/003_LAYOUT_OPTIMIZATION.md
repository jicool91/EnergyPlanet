# Фаза 3: Layout Optimization & Navigation Refactor

**Эстимейт:** 3-4 дня | **Микротаски:** 13

**Требует:** Фаза 1, 2 ✅

---

## 📋 Микротаски

### 3.1 Переделать главный экран (Tap-First Layout)
**Цель:** Переместить кнопку тапа в центр, контент ниже
- [ ] Пересчитать layout: Tap в центре вьюпорта
- [ ] Stats cards переместить вниз (за скролл)
- [ ] Убрать stats из top sticky
- [ ] Level bar остается вверху (compact)
- [ ] Next goal card остается но внизу
- [ ] MainScreen.tsx refactor основного контента

### 3.2 Оптимизировать Header на главной
**Цель:** Compact header с essential информацией
- [ ] Header: Level + Energy + Stars (если нужно)
- [ ] Убрать XP progress из header (переместить вниз)
- [ ] Header fixed вверху, не scrollable
- [ ] Высота максимум 60px
- [ ] Иконка settings/profile в header

### 3.3 Refactor нижнего меню (Bottom Navigation)
**Цель:** Улучшить UX для 7 вкладок
- [ ] Option 1: Смешанный подход - 5 основных + "More" меню
- [ ] Option 2: Скроллируемый navigation с избранными сверху
- [ ] Option 3: Hamburger меню + 4 основных вкладки
- [ ] **Выбор:** Option 2 (скролл с популярными)
- [ ] Изменить footer: home, shop, builds, boosts на скролл для остального
- [ ] Проверить на мобильных с notch

### 3.4 Создать компактный Tab Bar компонент
**Цель:** Для нижней навигации
- [ ] Создать `webapp/src/components/TabBar.tsx`
- [ ] Props: `tabs` (array), `active`, `onChange`
- [ ] Поддержка scroll для избытка табов
- [ ] Адаптивный дизайн
- [ ] Highlight active tab

### 3.5 Refactor MainScreen структуру
**Цель:** Разделить на меньшие компоненты
- [ ] Создать `MainScreenHeader.tsx` (level, energy, settings)
- [ ] Создать `TapSection.tsx` (большой тап в центре)
- [ ] Оставить `MainScreen.tsx` как контроллер для tab switching
- [ ] Переместить footer на уровень App.tsx (глобальная)

### 3.6 Переместить Footer на глобальный уровень
**Цель:** Не перерендеривать на каждый таб
- [ ] Переместить footer из MainScreen в App.tsx
- [ ] Сделать footer independant от активного таба
- [ ] Использовать useGameStore для навигации
- [ ] Проверить что мобильный safe-area работает

### 3.7 Добавить Lazy Loading для всех панелей
**Цель:** Не рендерить контент вкладок пока они не активны
- [ ] Динамический импорт всех panel компонентов (ShopPanel, LeaderboardPanel и т.д.)
- [ ] React.lazy + Suspense обертка
- [ ] Fallback component с skeleton loader
- [ ] Проверить что данные загружаются только когда нужны

### 3.8 Оптимизировать Stats cards на главной
**Цель:** Скрыть ненужные stats по умолчанию
- [ ] Top stats (Energy, Level, Tap lvl, Passive income) - всегда видны
- [ ] Streak stats - только если streakCount > 0
- [ ] Остальные stats - в drawer/expandable меню
- [ ] Убрать 4-column grid, сделать 2-column

### 3.9 Создать компактный Level Bar
**Цель:** Визуальный индикатор прогресса в header
- [ ] Тонкий progress bar вверху (2px высота)
- [ ] Или в header как часть дизайна
- [ ] Hover показывает "N/X XP"
- [ ] Плавные анимации

### 3.10 Refactor XP Progress карточка
**Цель:** Скрыть по умолчанию, показать только на запрос
- [ ] Переместить большую XP card вниз
- [ ] Сделать ее compact версию в header или скрыть
- [ ] Показать в drawer/expandable section
- [ ] Упростить информацию

### 3.11 Добавить Quick Actions в header
**Цель:** Быстрый доступ к критичным функциям
- [ ] Settings/Profile иконка (⚙️ / 👤)
- [ ] Top-up Stars иконка (можно в Shop вкладке)
- [ ] Notifications иконка (для future)
- [ ] Разместить в top-right corner

### 3.12 Оптимизировать вертикальный скролл
**Цель:** Уменьшить расстояние до кнопки тапа
- [ ] На мобильных: Tap должна быть в viewport без скролла
- [ ] Убрать padding вверху
- [ ] Compact header (max 56px)
- [ ] Stats переместить вниз или скрыть

### 3.13 Добавить Scroll-to-top functionality
**Цель:** Быстрое возвращение к тапу с других вкладок
- [ ] Плавающая кнопка "Back to Tap" или double-tap на вкладку
- [ ] Анимированное возвращение в top
- [ ] Вспомогательная функция для UX

---

## 🎯 Success Criteria

После этой фазы:
- [ ] Tap visible без скролла на мобильных (375px)
- [ ] Bottom navigation работает на всех экранах
- [ ] Lazy loading работает (scroll in DevTools)
- [ ] Нет перерендеринга footer при смене таба
- [ ] Нет лишнего контента выше fold
- [ ] Header compact и информативный
- [ ] Все анимации smooth
- [ ] Code review approved

---

**Разблокирует:** Фаза 4, 5
**Зависит от:** Фазы 1, 2 ✅
