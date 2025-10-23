# Energy Planet - UI/UX Improvement Roadmap

## 📊 Анализ текущего состояния UI

### Критические проблемы (MUST FIX)

#### 1. **Перегруженное нижнее меню (Bottom Navigation)**
- **Проблема:** 7 кнопок в нижнем меню - это максимум, который вмещается удобно
- **Последствие:** На мобильных с notch текст кнопок скрывается, иконки едва видны
- **Решение:** Переделать в иерархичное меню или использовать скролл с популярными вкладками

#### 2. **Отсутствие Design System**
- **Проблема:** Цвета, spacings, border-radius, типография разбросаны по компонентам
- **Последствие:** Нет консистентности, сложно масштабировать, тяжелый редизайн
- **Решение:** Создать единую систему токенов (colors, spacing, typography, shadows)

#### 3. **Дубли кода и несогласованные стили**
- **Проблема:** BuildingCard, ShopPanel, ProfilePanel используют разные стили для одинаковых элементов
- **Примеры дублей:**
  - `bg-dark-secondary/60` vs `bg-[rgba(10,14,32,0.9)]`
  - Кнопки с разными класами: `px-[18px] py-[10px]` vs `px-4 py-2`
  - Border: `border-cyan/[0.12]` vs `border-cyan/[0.14]`
- **Решение:** Создать компонентную библиотеку (Button, Card, Badge и т.д.)

#### 4. **Рендеринг элементов на все экраны**
- **Проблема:**
  - Stats grid (`grid-cols-2 md:grid-cols-4`) рендерится всегда, даже когда выбрана другая вкладка
  - Nav footer находится в MainScreen - перерендеривается при каждом табе
  - TapParticles рендерится в памяти для всех вкладок
- **Решение:** Лениво загружать компоненты, использовать virtualization для списков

#### 5. **Нет маркетинговых элементов**
- **Проблема:** UI не манит играть, нет глаза-ловушек, яркости, конверсии
- **Отсутствие:**
  - Featured/Recommended элементы в Shop (есть flag `featured`, но не выделяется визуально)
  - Daily reward/Special offer банеры
  - Social proof (friends/leaderboard на главной)
  - FOMO элементы (ограниченные предложения, сроки)
  - Свечение/градиенты на важных элементах
- **Решение:** Добавить маркетинговые элементы с яркими цветами и анимациями

#### 6. **Вертикальное переполнение контентом**
- **Проблема:** На главной слишком много контента вверху (4 stat cards + xp bar + next goal)
- **Последствие:** До кнопки тапа нужно скролить на мобильных, теряются клики
- **Решение:** Переделать главный экран: сделать тап в центре, остальное ниже/сбоку

### Важные проблемы (SHOULD FIX)

#### 7. **Плохая типография иерархия**
- **Проблема:** Много разных font-sizes в одном месте, сложно читать
- **Решение:** Standardize на 3-4 уровней: title, subtitle, body, caption

#### 8. **Inconsistent spacing**
- **Проблема:** `gap-5`, `gap-4`, `gap-3`, `gap-2`, `gap-[6px]` - хаос
- **Решение:** Использовать 8px базовую сетку: 8, 16, 24, 32, 40...

#### 9. **Медленные переходы между экранами**
- **Проблема:** ScreenTransition с fade/slide, но нет предзагрузки контента
- **Решение:** Lazy load данные параллельно с анимацией

#### 10. **Нет loading states для асинхронных действий**
- **Проблема:** При покупке/апгрейде кнопка меняет текст, но нет прогресса
- **Решение:** Добавить progress/spinner для длительных операций

### UX Инсайты (NICE TO HAVE)

#### 11. **Монетизация не явная**
- **Проблема:** Stars не видны на главной, магазин скрыт во вкладке
- **Решение:** Показать Stars в header с fast-access кнопкой для Top-up

#### 12. **Нет тактильной feedback на важные события**
- **Проблема:** Уже есть haptic для тапов, но не для всех действий
- **Решение:** Добавить haptic для: purchase, upgrade, level-up, achievement

#### 13. **Лидерборд не мотивирует**
- **Проблема:** Просто список без контекста, где я в рейтинге?
- **Решение:** Показать позицию игрока, разницу со следующим, прогресс

---

## 🎯 Стратегия исправления

### Фазы улучшения (Sequential):

1. **[Фаза 1: Design System](./001_DESIGN_SYSTEM.md)** (3-4 дня)
   - Создать design tokens (colors, spacing, shadows, typography)
   - Настроить Tailwind config
   - Документировать все новые значения

2. **[Фаза 2: Component Refactor](./002_COMPONENT_REFACTOR.md)** (4-5 дней)
   - Создать базовые компоненты (Button, Card, Badge, Input)
   - Переделать существующие компоненты
   - Удалить дубли

3. **[Фаза 3: Layout Optimization](./003_LAYOUT_OPTIMIZATION.md)** (3-4 дня)
   - Переделать главный экран (Tap-first layout)
   - Оптимизировать нижнее меню
   - Lazy-load вкладки и контент

4. **[Фаза 4: Marketing & Polish](./004_PERFORMANCE_POLISH.md)** (3-4 дня)
   - Добавить marketing элементы (featured, banners, social proof)
   - Улучшить анимации
   - Добавить loading/error states

5. **[Фаза 5: Monetization UX](./005_MONETIZATION_UX.md)** (2-3 дня)
   - Выделить Stars в header
   - Улучшить shop experience
   - Добавить FOMO элементы

---

## 📏 Design System Принципы

### Цветовая палитра
```
Primary:   #00D9FF (cyan)
Success:   #48FFAD (lime)
Warning:   #FFC957 (gold)
Error:     #FF9898 (red)
Dark:      #0a0e20 (dark-bg)
Secondary: #1a2540 (dark-secondary)
```

### Spacing Scale (8px base)
```
xs:  4px    (0.25rem)
sm:  8px    (0.5rem)
md:  16px   (1rem)
lg:  24px   (1.5rem)
xl:  32px   (2rem)
2xl: 40px   (2.5rem)
```

### Typography
```
Display:   48px / 56px (font-bold)
Heading:   24px / 32px (font-semibold)
Subheading: 16px / 24px (font-semibold)
Body:      14px / 20px (font-normal)
Caption:   12px / 16px (font-normal)
Micro:     11px / 14px (font-semibold)
```

### Border Radius
```
sm:  6px   (input, badge)
md:  12px  (card, button)
lg:  16px  (panel, modal)
xl:  24px  (large section)
```

### Shadows
```
sm:  0 4px 12px rgba(0,0,0,0.15)
md:  0 12px 24px rgba(0,0,0,0.25)
lg:  0 20px 48px rgba(0,0,0,0.35)
xl:  0 24px 60px rgba(0,0,0,0.45)
```

---

## ✅ Success Criteria

После завершения всех фаз:

- [ ] Нет дублирующегося кода
- [ ] Все компоненты используют design tokens
- [ ] Tap-to-shop ratio улучшена на 30%+
- [ ] Нет несогласованных стилей
- [ ] Lazy-loading всех панелей работает
- [ ] Featured элементы явно выделены
- [ ] Все loading states реализованы
- [ ] Monetization clear и видна на главной

---

## 📱 Мобильные первая стратегия

**Приоритет:** Mobile (375px) → Tablet (768px) → Desktop (1024px+)

Все задачи сначала для мобильных, потом desktop расширения.

---

**Статус:** 🔴 In Progress
**Last Updated:** 2025-10-23
**Owner:** UI/UX Team
