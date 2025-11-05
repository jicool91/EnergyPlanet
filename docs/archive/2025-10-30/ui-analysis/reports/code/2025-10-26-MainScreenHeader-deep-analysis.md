# Code Analysis: MainScreenHeader.tsx (Header Component with Energy Display)

## 📊 Общая оценка: 2/10

**Компонент:** `webapp/src/components/MainScreenHeader.tsx`
**LOC (Lines of Code):** 170 строк
**Сложность:** Medium
**Дата анализа:** 2025-10-26

---

## ✅ Сильные стороны

1. **Правильная мемоизация energyCompact и starsCompact** (строки 48-49)
   ```typescript
   const energyCompact = useMemo(() => formatCompactNumber(Math.floor(energy)), [energy]);
   const starsCompact = useMemo(() => formatCompactNumber(Math.floor(stars)), [stars]);
   ```
   - ✅ formatCompactNumber это дорогая операция, правильно мемоизирована
   - ✅ Зависимости правильные

2. **Хорошая обработка safe area** (строки 50-59)
   - Правильный использование useSafeArea hook
   - Мемоизирован headerPadding
   - Поддержка notch на мобильных

3. **Хорошая типизация props** (строки 31-38)
   ```typescript
   interface MainScreenHeaderProps {
     level: number;
     energy: number;
     stars?: number;
     xpProgress?: number;
     onSettingsClick?: () => void;
     onShopClick?: () => void;
   }
   ```
   - ✅ Все props типизированы
   - ✅ Optional props правильно marked

4. **Хорошая accessibility** (строки 83-84, 96-97, 112, 139, 153)
   ```typescript
   <span className="text-caption text-text-secondary">LV</span>
   <span className="text-subheading flex-shrink-0" role="img" aria-label="Energy">
     ⚡
   </span>
   ```
   - ✅ ARIA labels для иконок
   - ✅ role="img" для emoji
   - ✅ aria-label для buttons

5. **Правильное использование Tailwind tokens** (строки 63-68)
   - Используются CSS custom properties (--app-header-bg, --app-bg)
   - Градиент для header
   - Backdrop blur для glassmorphism effect

6. **Хорошая структура JSX** (strokes 70-162)
   - Четкое разделение на sections (left, right)
   - Понятная логика
   - Хорошие comments

7. **Правильное использование framer-motion** (строки 107-126)
   - Hover и tap анимации
   - Бесконечная opacity animation (пульсирующий эффект)

---

## 🏗️ Архитектурный анализ по слоям

### Layer 1: Component Structure
- **Оценка:** 3/10
- **Обнаруженные проблемы:**

1. **КРИТИЧЕСКОЕ: Нет React.memo обертки** (строка 40)
   ```typescript
   export function MainScreenHeader({
     level,
     energy,
     stars = 0,
     xpProgress,
     onSettingsClick,
     onShopClick,
   }: MainScreenHeaderProps) {
     // ...
   }
   // ❌ НЕТ React.memo!
   ```

   - **Это KEY ISSUE:** MainScreenHeader получает energy из App.tsx каждую сек
   - Даже если energyCompact мемоизирован (useMemo), сам компонент не мемоизирован
   - React видит что energy prop changed → ремеруется ВСЕ (including JSX tree)
   - Это ненужный ребендер!

   - **Как это работает:**
     ```typescript
     // App.tsx (каждую сек):
     const energy = useGameStore(state => state.energy); // 50000 → 50001 → ...

     // MainScreenHeader получает energy prop
     <MainScreenHeader energy={energy} />

     // React видит:
     // Old props: { energy: 50000, ... }
     // New props: { energy: 50001, ... }
     // → Props changed! → RERENDER!

     // Даже если энергия потом мемоизируется в energyCompact:
     const energyCompact = useMemo(() =>
       formatCompactNumber(Math.floor(50001)), [50001]
     );
     // Это уже СЛИШКОМ ПОЗДНО!
     // Компонент уже был переполнен (re-rendered)
     ```

   - **Решение:**
     ```typescript
     export const MainScreenHeader = React.memo(function MainScreenHeader({
       level,
       energy,
       stars = 0,
       xpProgress,
       onSettingsClick,
       onShopClick,
     }: MainScreenHeaderProps) {
       // ... компонент код
     }, (prevProps, nextProps) => {
       // Custom comparison
       return prevProps.energy === nextProps.energy &&
              prevProps.level === nextProps.level &&
              prevProps.stars === nextProps.stars &&
              prevProps.xpProgress === nextProps.xpProgress;
       // Если все props equal → не ремерируй (return true)
       // Если что-то changed → ремерируй (return false)
     });
     ```

2. **Infinite animation на кнопке** (строки 115-120)
   ```typescript
   <motion.button
     animate={{
       opacity: [0.8, 1, 0.8],
     }}
     transition={{
       opacity: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
     }}
   >
   ```
   - Эта кнопка имеет infinite animation
   - Это может вызывать дополнительные ребендеры
   - framer-motion должна оптимизировать через requestAnimationFrame
   - Но это все еще может быть overhead

3. **LevelBar как child компонент** (строка 166)
   ```typescript
   {xpProgress !== undefined && (
     <LevelBar progress={xpProgress} xpCurrent={undefined} xpTotal={undefined} />
   )}
   ```
   - LevelBar это отдельный компонент
   - Если LevelBar не мемоизирован → он также ремеруется каждый раз
   - Из предыдущего анализа знаем что LevelBar имеет проблему без memo

4. **No prop destructuring validation**
   - Props не валидируются (нет PropTypes или zod)
   - Если кто-то передаст неправильный energy → может быть ошибка
   - Хотя TypeScript должен поймать это

- **Root Cause Analysis:**
  - Разработчик мемоизировал formatCompactNumber, но забыл про сам компонент
  - Мемоизация internal computation не помогает если компонент ремеруется
  - Это классическая ошибка - "optimize внутри без оптимизации снаружи"

- **Best Practice:**
  - **Всегда мемоизировать components которые получают frequently-changing props:**
    ```typescript
    export const MainScreenHeader = React.memo(
      MainScreenHeader,
      (prevProps, nextProps) => {
        // Shallow equality check
        return Object.keys(prevProps).every(key =>
          prevProps[key] === nextProps[key]
        );
      }
    );
    ```
  - **Или использовать custom comparison:**
    ```typescript
    export const MainScreenHeader = React.memo(MainScreenHeader, (prev, next) =>
      prev.energy === next.energy &&
      prev.level === next.level &&
      prev.stars === next.stars
    );
    ```
  - Источник: [React.memo documentation](https://react.dev/reference/react/memo)

- **Взаимосвязи:**
  - App.tsx передает energy → MainScreenHeader
  - energy меняется каждую сек → MainScreenHeader ремеруется
  - Это BOTTLENECK
  - LevelBar может быть дополнительный bottleneck (тоже без memo)

- **Исследовать дальше:**
  - ✅ Проверить LevelBar.tsx - есть ли там memo?
  - ✅ Есть ли другие дорогие операции в MainScreenHeader?
  - ✅ Может ли energy быть calculated locally вместо passing as prop?

---

### Layer 2: State Management
- **Оценка:** 5/10
- **State flow diagram:**
  ```
  App.tsx (every 1 sec)
    ├── energy: number (from gameStore)
    └── Passes energy prop → MainScreenHeader
         ↓
  MainScreenHeader
    ├── Receives energy prop
    ├── Memoizes: energyCompact = useMemo(..., [energy])
    ├── Displays: {energyCompact}
    └── LevelBar receives xpProgress prop
  ```

- **Обнаруженные проблемы:**

1. **Energy как prop вместо local calculation** (строки 42, 48)
   ```typescript
   // Props:
   energy: number;

   // Использование:
   const energyCompact = useMemo(() =>
     formatCompactNumber(Math.floor(energy)), [energy]
   );
   ```

   - energy передается из App.tsx
   - App обновляет energy каждую сек
   - MainScreenHeader получает новый energy prop каждую сек
   - Это вызывает ребендер (даже если energyCompact мемоизирован)

   - **Альтернатива:** MainScreenHeader может получить energyPerSec и вычислить energy локально
     ```typescript
     // Вместо:
     <MainScreenHeader energy={50000} />

     // Лучше:
     <MainScreenHeader
       lastServerEnergy={50000}
       energyPerSec={100}
       lastSyncTime={Date.now()}
     />

     // И в MainScreenHeader:
     const displayEnergy = useMemo(() => {
       const elapsed = (Date.now() - lastSyncTime) / 1000;
       return lastServerEnergy + (elapsed * energyPerSec);
     }, [lastServerEnergy, energyPerSec, lastSyncTime]);
     ```

2. **useSafeArea вызывается каждый раз** (строка 50)
   ```typescript
   const { safeArea } = useSafeArea();
   ```
   - Это hook который может быть дорогой
   - Но safe area не должна часто меняться
   - ✅ Это нормально

3. **No local state** - только props
   - ✅ Это хорошо (простой component)

- **Root Cause Analysis:**
  - Разработчик хотел simple presentation component
  - Передать energy как prop казалось правильным
  - Но это создает dependency на частый prop update

- **Best Practice:**
  - **Decouple display calculation from app state:**
    ```typescript
    // Вместо energy как prop который меняется каждую сек:
    // Передайте статичные значения + energyPerSec
    ```

---

### Layer 3: API Integration
- **Оценка:** N/A
- **No API calls in MainScreenHeader**
- Все API calls в gameStore

---

### Layer 4: Design System Compliance
- **Оценка:** 8/10
- **Используемые компоненты:**
  - LevelBar (custom component)
  - motion.button (framer-motion)
  - framer-motion animations

- **Tailwind usage:** ✅ Хорошо
- **Telegram theme:** ✅ Используется через CSS custom properties

- **Обнаруженные проблемы:**

1. **Hardcoded emoji** (строки 84, 97, 142, 157)
   ```typescript
   <span className="text-subheading" role="img" aria-label="Energy">
     ⚡
   </span>
   ```
   - Emoji hardcoded
   - Не критично, но можно было вынести в constants
   - Однако accessibility правильна

2. **Inline shadow class** (строка 135)
   ```typescript
   className="... hover:shadow-glow-card ..."
   ```
   - shadow-glow-card это custom Tailwind class
   - ✅ Правильно определен (не магические числа)

3. **CSS custom properties** (строки 64-68)
   ```typescript
   style={{
     background: 'linear-gradient(180deg, var(--app-header-bg) 0%, var(--app-bg) 85%)',
     borderBottom: '1px solid var(--color-border-subtle)',
   }}
   ```
   - ✅ Правильно используются CSS variables
   - ✅ Поддержка theme customization

- **Root Cause Analysis:**
  - Design system хорошо соблюдается
  - Нет obvious issues

---

### Layer 5: Performance
- **Оценка:** 1/10
- **Unnecessary rerenders:** EVERY SECOND (60/min)
- **Bundle impact:** Low-Medium (framer-motion)

- **Обнаруженные проблемы:**

1. **КРИТИЧЕСКОЕ: No React.memo** (строка 40)
   - Уже обсуждалось в Layer 1
   - Это главная проблема performance

2. **Infinite animation на кнопке** (строки 115-120)
   ```typescript
   animate={{
     opacity: [0.8, 1, 0.8],
   }}
   transition={{
     opacity: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
   }}
   ```
   - Эта кнопка имеет infinite animation
   - framer-motion использует requestAnimationFrame
   - Но это все еще может быть нагрузка
   - **Impact:** Может быть 30-60 fps overhead на эту кнопку

3. **LevelBar child component** (строка 166)
   ```typescript
   {xpProgress !== undefined && (
     <LevelBar progress={xpProgress} xpCurrent={undefined} xpTotal={undefined} />
   )}
   ```
   - Если LevelBar не мемоизирован → ремеруется каждый раз
   - Из предыдущего анализа: LevelBar имеет infinite shimmer animation
   - **Двойная проблема:** infinite animation + no memo

4. **formatCompactNumber вызывается много раз**
   - Мемоизирован через useMemo (хорошо)
   - Но только если energy меняется
   - Когда energy меняется каждую сек → useMemo не помогает

5. **useSafeArea hook вызывается каждый раз**
   - safe area может быть дорогой operacией
   - Но результат мемоизирован в headerPadding
   - ✅ Это нормально

- **Root Cause Analysis:**
  - Разработчик не знал что без React.memo это будет ремеруваться каждую сек
  - Добавил useMemo для internal optimization
  - Но это не решает проблему если сам компонент ремеруется

- **Best Practice:**
  - **Always add React.memo to components that receive frequently-changing props:**
    ```typescript
    export const MainScreenHeader = React.memo(MainScreenHeader);
    ```
  - **Move infinite animations to separate memoized component:**
    ```typescript
    const AnimatedTopUpButton = React.memo(function AnimatedTopUpButton({ onClick }) {
      return <motion.button {...animation} onClick={onClick}>+</motion.button>;
    });
    ```

- **Взаимосвязи:**
  - MainScreenHeader ремеруется каждую сек
  - LevelBar (child) тоже ремеруется каждую сек (если не memo)
  - Infinite animations в обоих компонентах

---

### Layer 6: Type Safety
- **Оценка:** 9/10
- **TypeScript coverage:** 100%
- **`any` usage:** 0

- **Обнаруженные проблемы:**

1. **Props interface хорошо типизирована** (строки 31-38)
   - ✅ Все поля имеют типы
   - ✅ Optional props правильно marked

2. **Нет prop validation runtime**
   - TypeScript это поймает на compile time
   - Runtime validation не нужна (TS strict mode)

- **Root Cause Analysis:**
  - Type safety очень хорошая

---

## 🔄 Анализ потоков и состояний

### User Flow: Energy Display Update

```
gameStore (every 1 sec):
  ├── setInterval: energy += perSec
  └── Zustand notifies subscribers
       ↓
App.tsx:
  ├── Listens to energy change
  ├── RERENDERS
  └── Passes new energy prop → MainScreenHeader
       ↓
MainScreenHeader:
  ├── Receives new energy prop
  ├── React: "Props changed!" → RERENDERS!
  ├── energyCompact = useMemo(formatCompactNumber(energy)) [TOO LATE]
  ├── Renders: <p>{energyCompact}</p>
  └── LevelBar (child) also RERENDERS (if no memo)
       ↓
framer-motion:
  ├── Infinite animation on +button
  ├── requestAnimationFrame tick
  └── Updates DOM every ~16ms
       ↓
Browser:
  ├── Layout calculation
  ├── Paint
  ├── Composite
  └── Display
       ↓
RESULT: 60+ RERENDERS/MIN, INFINITE ANIMATIONS RUNNING
```

**Проблемы:**
1. MainScreenHeader ремеруется каждую сек (не нужно!)
2. useMemo не помогает потому что сам компонент ремеруется
3. LevelBar тоже ремеруется (потенциально)
4. Infinite animation на кнопке runs всегда

**Рекомендации:**
1. Добавить React.memo на MainScreenHeader
2. Деколплить energy display от App state
3. Проверить LevelBar memo status

---

## ⚠️ Критические риски и технический долг

### Risk 1: Missing React.memo on frequently-updated component (CRITICAL)
- **Severity:** Critical 🔴
- **Impact:** 60+ rerenders per minute, cascade effect
- **Probability:** High (confirmed)
- **Mitigation:** Add React.memo immediately

### Risk 2: LevelBar also without memo (HIGH)
- **Severity:** High 🟠
- **Impact:** Double-rerendering of header
- **Probability:** High (known from prev analysis)
- **Mitigation:** Check and fix LevelBar memo

### Risk 3: Infinite animation overhead (MEDIUM)
- **Severity:** Medium 🟡
- **Impact:** Additional CPU usage for pulsing button
- **Probability:** Medium
- **Mitigation:** Consider CSS animation instead of framer-motion

### Technical Debt 1: Energy as prop instead of calculation
- **Cost:** 2-3 hours for refactor
- **Impact:** Requires passing only energyPerSec and calculating locally
- **Recommendation:** Lower priority, only after React.memo

### Technical Debt 2: formatCompactNumber optimization
- **Cost:** 30 minutes
- **Impact:** Could be moved to inline if simple enough
- **Recommendation:** If performance still issues after React.memo

---

## 🔬 Глубокий анализ критичных проблем

### Проблема 1: Missing React.memo - Missing Simple Fix

**Файл:** `webapp/src/components/MainScreenHeader.tsx` (строка 40)

**Описание:**

```typescript
// ❌ Текущее (БЕЗ MEMO):
export function MainScreenHeader({
  level,
  energy,
  stars = 0,
  xpProgress,
  onSettingsClick,
  onShopClick,
}: MainScreenHeaderProps) {
  const energyCompact = useMemo(() => formatCompactNumber(Math.floor(energy)), [energy]);
  const starsCompact = useMemo(() => formatCompactNumber(Math.floor(stars)), [stars]);
  const { safeArea } = useSafeArea();
  const { top: safeTop, left: safeLeft, right: safeRight } = safeArea.safe;

  const headerPadding = useMemo(() => {
    return {
      paddingTop: `${Math.max(0, safeTop) + 8}px`,
      paddingLeft: `${Math.max(0, safeLeft) + 8}px`,
      paddingRight: `${Math.max(0, safeRight) + 8}px`,
    };
  }, [safeLeft, safeRight, safeTop]);

  return (
    <header ...>
      {/* UI Code */}
    </header>
  );
}

// ✅ Правильное (С MEMO):
export const MainScreenHeader = React.memo(
  function MainScreenHeader({
    level,
    energy,
    stars = 0,
    xpProgress,
    onSettingsClick,
    onShopClick,
  }: MainScreenHeaderProps) {
    // ... same code
  },
  (prevProps, nextProps) => {
    // Custom comparison: return true если не нужно ремерировать
    return (
      prevProps.energy === nextProps.energy &&
      prevProps.level === nextProps.level &&
      prevProps.stars === nextProps.stars &&
      prevProps.xpProgress === nextProps.xpProgress &&
      prevProps.onSettingsClick === nextProps.onSettingsClick &&
      prevProps.onShopClick === nextProps.onShopClick
    );
  }
);
```

**Root Cause Analysis:**

- **Непосредственная причина:**
  - Разработчик не добавил React.memo
  - Может быть не знал что это нужно
  - Или думал что useMemo внутри достаточно

- **Глубинная причина:**
  - Нет performance requirements/awareness
  - Нет code review которая бы это поймала
  - Нет profiling при разработке

- **Исторический контекст:**
  - Компонент был создан как simple presentation component
  - React.memo был добавлен в LevelBar (по-видимому) но не в MainScreenHeader
  - Inconsistency в коде

**Взаимосвязи:**

- **Зависимые компоненты:**
  - App.tsx передает energy, level, stars
  - energy меняется каждую сек
  - MainScreenHeader ремеруется каждую сек

- **Влияние на слои:**
  - State: energy updates in gameStore every 1 sec
  - Component: MainScreenHeader rerenders
  - UI: Browser repaints
  - Performance: CPU overhead, battery drain

- **Side effects:**
  - LevelBar (child) also rerenders
  - Infinite animation + rerender = double overhead

**Best Practice:**

- **Simple fix - just add memo:**
  ```typescript
  export const MainScreenHeader = React.memo(MainScreenHeader);
  ```

- **Better - custom comparison:**
  ```typescript
  export const MainScreenHeader = React.memo(
    MainScreenHeader,
    (prev, next) =>
      prev.energy === next.energy &&
      prev.level === next.level &&
      prev.stars === next.stars
  );
  ```

- **Even better - callbacks as dependencies:**
  ```typescript
  // In App.tsx:
  const handleShopClick = useCallback(() => setActiveTab('shop'), []);
  const handleSettingsClick = useCallback(() => setActiveTab('settings'), []);

  <MainScreenHeader
    onShopClick={handleShopClick}
    onSettingsClick={handleSettingsClick}
  />
  ```

- Источник: [React.memo documentation](https://react.dev/reference/react/memo)

**Гипотезы для исследования:**

1. Может быть это был oversight в code review?
2. Может быть был deadline и "optimize later"?
3. Может быть разработчик знал про memo но забыл?

**Направления для углубленного анализа:**

- [ ] Посмотреть git history - когда был добавлен MainScreenHeader?
- [ ] Есть ли PR comments про performance?
- [ ] Есть ли TODO comments?
- [ ] Check LevelBar.tsx - есть ли там memo и почему?

---

### Проблема 2: Infinite Animation Overhead

**Файл:** `webapp/src/components/MainScreenHeader.tsx` (строки 107-126)

**Описание:**

```typescript
<motion.button
  onClick={onShopClick}
  className="flex-shrink-0 ml-1 w-6 h-6 rounded-full flex items-center justify-center border border-[var(--color-border-subtle)] bg-[var(--color-surface-secondary)] text-[var(--color-text-accent)] hover:shadow-glow-card transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-text-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--app-header-bg)]"
  title="Quick Top-Up Stars"
  type="button"
  aria-label="Quick Top-Up Stars"
  whileHover={{ scale: 1.2 }}
  whileTap={{ scale: 0.85 }}
  animate={{
    opacity: [0.8, 1, 0.8],  // ← Infinite animation!
  }}
  transition={{
    opacity: { duration: 2, repeat: Infinity, ease: 'easeInOut' },  // ← Runs forever
  }}
>
  <span className="text-caption font-bold" aria-hidden="true">
    +
  </span>
</motion.button>
```

**Root Cause Analysis:**

- **Непосредственная причина:**
  - Разработчик хотел пульсирующий эффект на кнопке "+"
  - Использовал framer-motion для animation
  - Сделал repeat: Infinity (бесконечная анимация)

- **Глубинная причина:**
  - Это хороший UX (привлекает внимание на кнопку)
  - Но не оптимизировано для performance
  - framer-motion использует requestAnimationFrame
  - Но это все еще CPU overhead

- **Исторический контекст:**
  - Это дизайнерское решение "привлечь внимание"
  - Не было performance consideration

**Взаимосвязи:**

- **Зависимые компоненты:**
  - MainScreenHeader содержит эту кнопку
  - LevelBar (child) тоже имеет infinite animation (из анализа)

- **Влияние на слои:**
  - Animation: framer-motion requestAnimationFrame tick ~60fps
  - Rendering: ComponentTree может быть invalidated
  - Performance: Continuous CPU usage

- **Side effects:**
  - Mobile battery drain
  - Interference с другими animations

**Best Practice:**

- **Паттерн 1: CSS animation вместо JS**
  ```typescript
  <style>
    @keyframes pulse {
      0%, 100% { opacity: 0.8; }
      50% { opacity: 1; }
    }
    .pulse-button {
      animation: pulse 2s infinite ease-in-out;
    }
  </style>

  <button className="pulse-button">+</button>
  ```
  - CSS animation более efficient (может быть GPU accelerated)
  - Меньше JS overhead

- **Паттерн 2: Conditional animation based on focus**
  ```typescript
  const [showAnimation, setShowAnimation] = useState(false);

  <motion.button
    animate={showAnimation ? { opacity: [0.8, 1, 0.8] } : {}}
    transition={showAnimation ? { duration: 2, repeat: Infinity } : {}}
    onMouseEnter={() => setShowAnimation(true)}
    onMouseLeave={() => setShowAnimation(false)}
  >
    +
  </motion.button>
  ```
  - Animate only when user might see it (on hover)
  - Save CPU otherwise

- **Паттерн 3: Accessibility consideration**
  ```typescript
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  <motion.button
    animate={!prefersReducedMotion ? { opacity: [0.8, 1, 0.8] } : {}}
    transition={!prefersReducedMotion ? { duration: 2, repeat: Infinity } : {}}
  >
    +
  </motion.button>
  ```
  - Respect user's motion preferences

- Источник: [CSS Animations](https://developer.mozilla.org/en-US/docs/Web/CSS/animation), [prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)

**Гипотезы для исследования:**

1. Есть ли design spec для этого эффекта?
2. Нужна ли бесконечная анимация или можно сделать conditional?
3. Есть ли user complaints про battery drain?

**Направления для анализа:**

- [ ] Посмотреть LevelBar.tsx - есть ли там похожая infinite animation?
- [ ] Профилировать CPU usage с/без этой анимации
- [ ] Check есть ли prefers-reduced-motion support

---

## 📊 Metrics & Complexity

| Метрика | Значение | Норма | Статус |
|---------|----------|-------|--------|
| Lines of Code | 170 | < 150 | ⚠️ Medium |
| Props count | 6 | < 5 | ⚠️ Many |
| useMemo count | 3 | < 2 | ⚠️ Many |
| useHook count | 1 | < 2 | ✅ OK |
| React.memo | 0 | 1 required | 🔴 MISSING |
| Infinite animations | 1 | 0 | ⚠️ Overhead |
| Child components | 1 (LevelBar) | < 2 | ✅ OK |
| Rerenders per second | 1 | < 0.1 | 🔴 60x worse |
| TypeScript coverage | 100% | > 90% | ✅ Perfect |

---

## 🔗 Взаимосвязи и зависимости

### Карта зависимостей:

```
App.tsx
  ├── energy: number (меняется каждую сек)
  ├── level: number (меняется при level up)
  ├── stars: number (меняется при purchase)
  └── xpProgress: number (меняется при action)
       ↓
MainScreenHeader (NO MEMO!)
  ├── Props received:
  │   ├── energy ← CRITICAL (changes every sec)
  │   ├── level
  │   ├── stars
  │   └── xpProgress
  │
  ├── Internal:
  │   ├── useMemo: energyCompact
  │   ├── useMemo: starsCompact
  │   ├── useMemo: headerPadding
  │   ├── useHook: useSafeArea
  │   └── Inline JSX
  │
  └── Child:
      └── LevelBar (may also NO MEMO)
           └── Infinite animation

Result:
  ├── MainScreenHeader RERENDERS every 1 sec (NO MEMO)
  ├── LevelBar RERENDERS every 1 sec (NO MEMO)
  ├── Infinite animation runs on +button
  └── Total CPU: 60+ rerenders/min + animation overhead
```

### Критичные связи:

1. **App.tsx energy → MainScreenHeader** (CRITICAL)
   - Energy updates every 1 second
   - MainScreenHeader rerenders (no memo)
   - This is the bottleneck!

2. **MainScreenHeader → LevelBar** (HIGH)
   - LevelBar is child
   - Also might be without memo
   - Double rerender problem

---

## 📚 Best Practices и источники

### Применимые паттерны:

#### 1. React.memo for Props-Based Optimization
- **Описание:** Prevent rerender when props haven't changed
- **Источник:** [React.memo](https://react.dev/reference/react/memo)
- **Примеры:**
  ```typescript
  export const MyComponent = React.memo(MyComponent);
  // or with custom comparison:
  export const MyComponent = React.memo(MyComponent, (prev, next) => {
    return prev.someProp === next.someProp;
  });
  ```

#### 2. CSS Animations Instead of JS
- **Описание:** Use CSS for performance-critical animations
- **Источник:** [CSS Animations MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/animation)
- **Примеры:**
  ```css
  @keyframes pulse {
    0%, 100% { opacity: 0.8; }
    50% { opacity: 1; }
  }
  .button { animation: pulse 2s infinite; }
  ```

#### 3. Respect Motion Preferences
- **Описание:** Check prefers-reduced-motion for accessibility
- **Источник:** [prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- **Примеры:**
  ```typescript
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!prefersReducedMotion) {
    // Show animations
  }
  ```

---

## 🔭 Направления для дальнейшего исследования

### Приоритет 1 (Critical): Немедленное действие

1. **Add React.memo to MainScreenHeader**
   - **Что:** Just one line of code
   - **Время:** 5 minutes
   - **Impact:** Eliminate 60+ rerenders/min
   - **Code:**
     ```typescript
     export const MainScreenHeader = React.memo(MainScreenHeader);
     ```

2. **Check LevelBar.tsx status**
   - **Что изучить:** Does LevelBar have React.memo?
   - **Почему:** If not, need to fix there too
   - **Как:** Grep for "export" in LevelBar.tsx

3. **Profile rerender count after adding memo**
   - **Что:** Use React DevTools Profiler
   - **Ожидание:** Should go from 60 to 0 rerenders/min

### Приоритет 2 (High): Желательно в ближайшее время

1. **Optimize infinite animation**
   - **Что изучить:** Is the pulsing button necessary?
   - **Альтернативы:**
     - CSS animation instead of framer-motion
     - Conditional animation (only on hover)
     - Respect prefers-reduced-motion

2. **Consider decoupling energy display**
   - **Что:** Pass energyPerSec instead of energy
   - **Где:** May require changes to App.tsx
   - **Impact:** Eliminate all energy-based rerenders

### Приоритет 3 (Medium): Полезно для полноты

1. **Check if formatCompactNumber is expensive**
   - **Что:** Profile the function
   - **Если:** It's cheap, useMemo is overkill

2. **Review similar patterns in codebase**
   - **Что:** Find other components without memo
   - **Pattern:** Look for components receiving props from frequently-updating stores

---

## 🎯 Выводы

**Краткое резюме:**

MainScreenHeader.tsx это simple presentation component, но это MAIN BOTTLENECK для energy display. Компонент не имеет React.memo, поэтому он ремеруется каждую сек когда App.tsx передает новое energy значение. Это даже несмотря на то что energyCompact мемоизирован внутри. Дополнительно, есть infinite animation на кнопке которая может быть overhead. LevelBar (child компонент) также может быть без memo, усугубляя проблему.

**Ключевые инсайты:**

1. **Missing React.memo is the main issue**
   - Simple one-line fix
   - Could eliminate 60+ rerenders/min
   - This is the QUICK WIN

2. **useMemo doesn't help without React.memo**
   - Optimization inside doesn't matter if component rerenders
   - Need optimization both inside AND outside

3. **Infinite animation adds overhead**
   - Not critical but could be improved
   - CSS animation would be better
   - Should respect prefers-reduced-motion

4. **LevelBar might have same problem**
   - Needs checking
   - Could be double rerender issue

5. **Energy decoupling would be ideal long-term**
   - But React.memo is quick fix for now
   - Real solution: pass energyPerSec, calculate locally

**Архитектурные наблюдения:**

- **One-line fix available** - just add React.memo
- **Layers of optimization needed** - memo + internal optimization both necessary
- **Child components also affected** - LevelBar likely same issue
- **Animation overhead under-considered** - no prefers-reduced-motion support

**IMMEDIATE ACTION ITEMS:**

1. 🔴 **Add React.memo to MainScreenHeader** (5 minutes)
2. 🔴 **Check LevelBar.tsx has memo** (2 minutes)
3. 🟠 **Test with React Profiler** (10 minutes)
4. 🟠 **Consider CSS animation** (optional, 30 min)

---

## Следующий компонент для анализа

### **LevelBar.tsx (Priority 1 - Child of MainScreenHeader)**

**Почему:**
- Это child компонент MainScreenHeader
- Получает xpProgress prop
- Из предыдущего анализа знаем что имеет infinite shimmer animation
- Вероятно, не имеет React.memo (как MainScreenHeader)
- Если добавить memo в MainScreenHeader но забыть про LevelBar → problem persists

**Что проверим:**
1. Есть ли React.memo на LevelBar?
2. Какая infinite animation?
3. Получает ли часто-меняющиеся props?
4. Может ли быть memoized?

**Ожидаемый результат:**
- Confirmation/denial про memo status
- Оценка impact'а на performance
- Рекомендации для optimization

---

**Отчет готов! 🚀**

**Ключевые рекомендации для MainScreenHeader.tsx:**

1. 🔴 **CRITICAL:** Add `React.memo(MainScreenHeader)` - 5 minutes!
2. 🔴 **URGENT:** Check LevelBar.tsx memo status
3. 🟠 **HIGH:** Test impact with React Profiler
4. 🟠 **HIGH:** Consider CSS animation for +button
5. 🟡 **MEDIUM:** Add prefers-reduced-motion support
6. 🟡 **MEDIUM:** Long-term: decouple energy display

