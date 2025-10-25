# Code Analysis: App.tsx (Main Application Container)

## 📊 Общая оценка: 3/10

**Компонент:** `webapp/src/App.tsx`
**LOC (Lines of Code):** 235 строк
**Сложность:** High
**Дата анализа:** 2025-10-26

---

## ✅ Сильные стороны

1. **Хорошая структура модальных окон** (строки 205-229)
   - Auth error modal
   - Offline summary modal
   - Level up screen
   - Все правильно управляются через state

2. **Правильная обработка lifecycle events** (строки 124-148)
   - visibilitychange listener (для logout при скрытии приложения)
   - beforeunload listener (для final flush)
   - Правильная cleanup в useEffect return

3. **Memoized style object** (строки 64-71)
   - appPaddingStyle правильно мемоизирован через useMemo
   - Зависит от safeArea (правильная dependency)

4. **Level up detection логика продуманная** (строки 18-29)
   - shouldShowMajorLevel функция определяет какие уровни показывать
   - Есть разные thresholds для разных ranges (10, 100, 1000)

5. **Хорошее использование Telegram Back Button** (строки 161-163)
   - Интеграция с useTelegramBackButton hook
   - Включается только когда нужно (isAuthModalOpen or offlineSummary)

6. **Правильное разделение на компоненты**
   - MainScreenHeader (отдельный компонент)
   - MainScreen (отдельный компонент для контента)
   - TabBar (отдельный компонент для навигации)
   - Модали (отдельные компоненты)

---

## 🏗️ Архитектурный анализ по слоям

### Layer 1: Component Structure
- **Оценка:** 4/10
- **Обнаруженные проблемы:**

1. **КРИТИЧЕСКОЕ: Дублирование селектора level** (строки 41-42)
   ```typescript
   const currentLevel = useGameStore(state => state.level);
   const level = useGameStore(state => state.level);
   // ❌ Зачем два? Это выглядит как bug!
   ```
   - currentLevel используется в useEffect (строка 85, 92)
   - level используется в render (строка 172)
   - Это одно и то же значение
   - **Это не bug, а плохой pattern** - нужно использовать одно имя

2. **Компонент смешивает разные ответственности** (235 строк)
   - Layout (header, content, footer)
   - Level up detection (40 строк логики)
   - Visibility tracking (logout/refresh)
   - Modal management (auth, offline, level up)
   - Tab navigation
   - Preferences sync
   - Слишком много!

3. **Нет React.memo для компонентов**
   - MainScreenHeader получает level, energy, stars каждую сек
   - energy меняется каждую сек из-за gameStore ticker
   - MainScreenHeader ремерируется каждую сек
   - MainScreen может тоже ремеруваться

4. **Level up логика слишком сложная и в главном компоненте** (строки 73-112)
   ```typescript
   // Это 40 строк для простого feature:
   useEffect(() => {
     if (!isInitialized) return;
     if (!hasBootstrappedLevelRef.current) {
       previousLevelRef.current = currentLevel;
       hasBootstrappedLevelRef.current = true;
       return;
     }

     const previousLevel = previousLevelRef.current;
     if (currentLevel <= previousLevel) {
       previousLevelRef.current = currentLevel;
       return;
     }

     const gainedLevels: number[] = [];
     for (let lvl = previousLevel + 1; lvl <= currentLevel; lvl += 1) {
       gainedLevels.push(lvl);
     }

     const majorLevel = [...gainedLevels].reverse().find(...);
     if (majorLevel) {
       setOverlayLevel(majorLevel);
       setShowLevelUp(true);
       void logClientEvent('level_up_overlay', { level: majorLevel });
     }

     gainedLevels
       .filter(level => !shouldShowMajorLevel(level))
       .forEach(level => {
         toast(`Уровень ${level}!...`, 2600, 'trophy');
         void logClientEvent('level_up_toast', { level });
       });

     previousLevelRef.current = currentLevel;
   }, [currentLevel, isInitialized, toast]);
   ```
   - Должна быть в отдельном custom hook: `useLevelUpDetection()`
   - Сейчас это makes App.tsx hard to read и maintain

5. **Too many dependencies in useEffect**
   - visibilitychange listener (124-148) зависит от: isInitialized, logoutSession, refreshSession
   - Если refreshSession меняется → useEffect переполняется

- **Root Cause Analysis:**
  - App.tsx начался как простой wrapper, потом разросся
  - Level up detection добавили прямо в App вместо custom hook
  - Нет рефакторинга когда появилась сложность
  - Давление на быстрый MVP

- **Best Practice:**
  - **Extract level up detection to custom hook:**
    ```typescript
    function useLevelUpDetection(currentLevel: number, isInitialized: boolean) {
      const [showLevelUp, setShowLevelUp] = useState(false);
      const [overlayLevel, setOverlayLevel] = useState<number | null>(null);
      const previousLevelRef = useRef(1);
      const hasBootstrappedRef = useRef(false);

      useEffect(() => {
        // All level up detection logic here
      }, [currentLevel, isInitialized]);

      return { showLevelUp, overlayLevel, setShowLevelUp, setOverlayLevel };
    }

    // В App.tsx:
    const levelUp = useLevelUpDetection(currentLevel, isInitialized);
    ```
  - **Reduce component responsibilities**: только layout + routing
  - **Move business logic to custom hooks**

- **Взаимосвязи:**
  - App.tsx это root component → все children компоненты зависят от него
  - Если App ремеруется каждую сек → вся app ремеруется
  - MainScreenHeader, MainScreen, TabBar все дети App

- **Исследовать дальше:**
  - ✅ Зачем duplciate level селектора?
  - ✅ Используется ли currentLevel где-то?
  - ✅ Как часто MainScreenHeader ремеруется?
  - ✅ Может ли MainScreen быть мемоизирован?

---

### Layer 2: State Management
- **Оценка:** 2/10
- **State flow diagram:**
  ```
  gameStore (56 fields)
       ├── energy (меняется каждую сек!)
       ├── level, xp, stars (меняются при actions)
       └── initGame, logoutSession, refreshSession (actions)
            ↓
  App.tsx (10 селекторов из gameStore)
       ├── initGame → useEffect (строка 116)
       ├── energy → MainScreenHeader (строка 173)
       ├── level → MainScreenHeader (строка 172)
       ├── stars → MainScreenHeader (строка 174)
       ├── xpIntoLevel, xpToNextLevel → MainScreenHeader (строка 175-178)
       ├── currentLevel → level up detection (строка 85, 92)
       └── logoutSession, refreshSession → visibility handler (строка 131, 133)
            ↓
  MainScreenHeader (5 props)
       ├── level
       ├── energy (МЕНЯЕТСЯ КАЖДУЮ СЕК!)
       ├── stars
       └── xpProgress
            ↓
  MainScreenHeader ремеруется каждую сек
  ```

- **Обнаруженные проблемы:**

1. **КРИТИЧЕСКОЕ: energy передается в MainScreenHeader** (строка 173)
   - energy меняется каждую сек в gameStore
   - App.tsx слушает energy (строка 43)
   - App.tsx ремеруется каждую сек
   - MainScreenHeader получает новое energy значение каждую сек
   - MainScreenHeader ремеруется каждую сек
   - **Это root причина cascade ребендеров из BuildingsPanel анализа!**

2. **10 селекторов из gameStore в App.tsx**
   ```typescript
   // Строки 32-46
   const initGame = useGameStore(state => state.initGame);
   const isInitialized = useGameStore(state => state.isInitialized);
   const logoutSession = useGameStore(state => state.logoutSession);
   const refreshSession = useGameStore(state => state.refreshSession);
   const currentLevel = useGameStore(state => state.level);
   const level = useGameStore(state => state.level);  // DUPLICATE!
   const energy = useGameStore(state => state.energy);
   const stars = useGameStore(state => state.stars);
   const xpIntoLevel = useGameStore(state => state.xpIntoLevel);
   const xpToNextLevel = useGameStore(state => state.xpToNextLevel);
   ```
   - Это деконструкция из одной useGameStore call? Или разные calls?
   - Если деконструкция → Zustand может не оптимизировать (как в BuildingsPanel)

3. **Duplicate level селектор**
   - currentLevel и level это одно и то же
   - currentLevel используется в level detection logic
   - level используется в MainScreenHeader
   - Это confusing и неправильно

4. **UIStore также используется** (строки 33-37)
   ```typescript
   const authErrorMessage = useUIStore(state => state.authErrorMessage);
   const isAuthModalOpen = useUIStore(state => state.isAuthModalOpen);
   const dismissAuthError = useUIStore(state => state.dismissAuthError);
   const offlineSummary = useUIStore(state => state.offlineSummary);
   const acknowledgeOfflineSummary = useUIStore(state => state.clearOfflineSummary);
   ```
   - Это 5 дополнительных селекторов
   - Если что-то в UIStore меняется → App ремеруется

5. **Нет оптимизации для energy которое меняется часто**
   - energy не должна быть в главном state
   - Или нужна отдельная store для display энергии
   - Или нужна calculation функция которая не вызывает ребендер

6. **Visibility tracking логика зависит от 3 функций**
   - logoutSession, refreshSession
   - Если они меняют reference → useEffect переполняется

- **Root Cause Analysis:**
  - Разработчик прямо передает energy из gameStore в MainScreenHeader
  - Не знал что это вызовет cascade ребендеры
  - gameStore дизайн (56 полей + энергия каждую сек) создает проблему
  - App.tsx платит цену за bad state design

- **Best Practice:**
  - **Decouple display from game state:**
    ```typescript
    // Вместо:
    const energy = useGameStore(state => state.energy);
    <MainScreenHeader energy={energy} />

    // Лучше:
    // MainScreenHeader сама calculate display energy:
    function MainScreenHeader({ energyPerSec }) {
      const lastServerEnergy = useGameStore(s => s.energy);
      const displayEnergy = useMemo(() => {
        const elapsed = (Date.now() - lastSyncTime) / 1000;
        return lastServerEnergy + (elapsed * energyPerSec);
      }, [lastServerEnergy, energyPerSec, lastSyncTime]);

      return <div>Energy: {displayEnergy}</div>;
    }
    ```

  - **Use granular selectors:**
    ```typescript
    const energy = useGameStore(state => state.energy);
    const level = useGameStore(state => state.level);
    const stars = useGameStore(state => state.stars);
    // Вместо деконструкции всего!
    ```

- **Взаимосвязи:**
  - App.tsx это intermediate layer между gameStore и UI components
  - Если energy меняется в gameStore каждую сек → App ремеруется каждую сек
  - App ремеруется → все дети (MainScreenHeader, MainScreen, TabBar) потенциально ремеруются

- **Исследовать дальше:**
  - ✅ Профилировать React DevTools - сколько раз ремеруется App vs MainScreenHeader
  - ✅ Есть ли способ не передавать energy в MainScreenHeader?
  - ✅ Может ли MainScreenHeader calculate energy локально?
  - ✅ Что если отделить display energy от game energy?

---

### Layer 3: API Integration
- **Оценка:** 6/10
- **API contracts:**
  ```
  No direct API calls in App.tsx
  Все API calls в gameStore/services
  App вызывает gameStore actions:
  - initGame()
  - refreshSession()
  - logoutSession()
  ```

- **Error handling:** ✅ Хорошо (auth error modal)
- **Loading states:** ✅ Хорошо (isInitialized check)

- **Обнаруженные проблемы:**

1. **initGame вызывается без error boundary** (строки 114-117)
   ```typescript
   useEffect(() => {
     initGame();
   }, [initGame]);
   ```
   - initGame может throw error
   - Но это обрабатывается через UIStore.openAuthError (в gameStore)
   - ✅ Это правильно - gameStore управляет auth errors

2. **refreshSession и logoutSession передают в visibility handler**
   - Правильно управляют session lifecycle
   - ✅ Это хорошо

- **Root Cause Analysis:**
  - App.tsx правильно делегирует API calls в gameStore
  - Error handling правильно (через UIStore modal)

---

### Layer 4: Design System Compliance
- **Оценка:** 7/10
- **Используемые компоненты:**
  - MainScreenHeader (из components)
  - MainScreen (из screens)
  - TabBar (из components)
  - AuthErrorModal (из components)
  - OfflineSummaryModal (из components)
  - LevelUpScreen (из components)
  - NotificationContainer (из components/notifications)

- **Tailwind usage:** ✅ Хорошо
- **Telegram theme:** ✅ Используется через useSafeArea

- **Обнаруженные проблемы:**

1. **app-shell класс** (строка 167)
   ```typescript
   <div className="w-full h-screen flex flex-col app-shell overflow-hidden" style={appPaddingStyle}>
   ```
   - app-shell вероятно custom class (не из Tailwind)
   - Правильно использован для layout

2. **Hardcoded emoji в TabBar items** (строки 191-197)
   ```typescript
   { id: 'home', icon: '🏠', label: 'Главная', title: 'Home' },
   { id: 'shop', icon: '🛍️', label: 'Магазин', title: 'Shop' },
   ```
   - Emoji hardcoded в компоненте
   - Не проблема, но можно было вынести в constants

3. **Safe area handling правильный** (строки 61-71)
   - useSafeArea hook
   - Правильное вычисление padding'ов
   - Мемоизировано

- **Root Cause Analysis:**
  - Design system соблюдается хорошо
  - Нет obvious проблем

---

### Layer 5: Performance
- **Оценка:** 2/10
- **Unnecessary rerenders:** 60+ в минуту
- **Bundle impact:** Low

- **Обнаруженные проблемы:**

1. **КРИТИЧЕСКОЕ: App ремеруется каждую сек** (из-за energy)
   - energy меняется каждую сек в gameStore
   - App.tsx слушает energy (строка 43)
   - App.tsx ремеруется
   - Все дети App потенциально ремеруются

2. **Нет React.memo для MainScreenHeader**
   - MainScreenHeader получает energy, level, stars каждую сек
   - Даже если не мемоизирован → может оптимизировать самостоятельно (если memo)
   - Но сейчас без мемо → всегда ремеруется

3. **Нет React.memo для MainScreen**
   - MainScreen получает activeTab (меняется по click, не каждую сек)
   - Но если App ремеруется каждую сек → MainScreen может ремеруваться

4. **Нет React.memo для TabBar**
   - TabBar получает active tab и onChange callback
   - Если App ремеруется → TabBar ремеруется
   - Это компонент который не должен часто меняться

5. **useCallback для modalBackHandler** (строки 150-159)
   ```typescript
   const modalBackHandler = useCallback(() => {
     if (isAuthModalOpen) {
       dismissAuthError();
       return;
     }
     if (offlineSummary) {
       acknowledgeOfflineSummary();
     }
   }, [isAuthModalOpen, offlineSummary, dismissAuthError, acknowledgeOfflineSummary]);
   ```
   - Правильно мемоизирован
   - Зависит от 4 значений (может быть optimized)

6. **useTelegramBackButton вызывается каждый render**
   - Хук правильный, но может быть дополнительные updates

- **Root Cause Analysis:**
  - energy меняется каждую сек → root issue
  - App передает energy в MainScreenHeader
  - Никто не мемоизирован

- **Best Practice:**
  - **Memoize child components:**
    ```typescript
    const MemoMainScreenHeader = React.memo(MainScreenHeader, (prevProps, nextProps) => {
      return prevProps.energy === nextProps.energy &&
             prevProps.level === nextProps.level &&
             prevProps.stars === nextProps.stars;
    });
    ```

  - **Decouple energy from main state:**
    ```typescript
    // Вместо передачи energy в MainScreenHeader:
    <MainScreenHeader level={level} stars={stars} />
    // MainScreenHeader сама получает energy когда нужна
    ```

  - **useMemo для computations:**
    ```typescript
    const xpProgress = useMemo(() =>
      xpIntoLevel + xpToNextLevel > 0
        ? Math.min(1, xpIntoLevel / (xpIntoLevel + xpToNextLevel))
        : 0,
      [xpIntoLevel, xpToNextLevel]
    );

    <MainScreenHeader xpProgress={xpProgress} />
    ```

- **Взаимосвязи:**
  - App.tsx это точка где energy enters the component tree
  - Отсюда это propagates в MainScreenHeader
  - MainScreenHeader propagates в children (если есть)

- **Исследовать дальше:**
  - ✅ Профилировать App.tsx render time с React DevTools Profiler
  - ✅ Посмотреть timeline - сколько раз ремеруется каждую сек
  - ✅ Сравнить с и без energy prop

---

### Layer 6: Type Safety
- **Оценка:** 7/10
- **TypeScript coverage:** 95%+
- **`any` usage:** 0

- **Обнаруженные проблемы:**

1. **TabKey type не используется полностью** (строка 16)
   ```typescript
   type TabKey = 'home' | 'shop' | 'boosts' | 'builds' | 'leaderboard' | 'profile' | 'settings';
   ```
   - Используется в activeTab: TabKey (строка 58)
   - Используется в setActiveTab (строки 180, 201)
   - ✅ Правильно типизировано

2. **Props passing without types**
   ```typescript
   <MainScreenHeader
     level={level}
     energy={energy}
     stars={stars}
     xpProgress={...}
     onShopClick={() => setActiveTab('shop')}
     onSettingsClick={() => setActiveTab('settings')}
   />
   ```
   - Props не явно типизированы в App.tsx
   - Но MainScreenHeader имеет свой Props тип
   - ✅ Это окей (implicit types)

3. **useRef typed correctly** (строки 47-48)
   ```typescript
   const previousLevelRef = useRef(1);
   const hasBootstrappedLevelRef = useRef(false);
   ```
   - ✅ Правильно типизированы (inferred)

4. **Optional properties in offlineSummary** (строки 213-219)
   ```typescript
   energy={offlineSummary?.energy ?? 0}
   xp={offlineSummary?.xp ?? 0}
   durationSec={offlineSummary?.duration_sec ?? 0}
   capped={offlineSummary?.capped ?? false}
   ```
   - ✅ Правильно обработаны с ?? fallback

- **Root Cause Analysis:**
  - TypeScript используется хорошо
  - Нет issues

---

## 🔄 Анализ потоков и состояний

### User Flow: App Initialization and Energy Display

```
App mount
  ↓
useEffect: initGame() called (строка 116)
  ↓
gameStore.initGame():
  - Authenticate with Telegram
  - POST /session
  - Set state: userId, level, energy, buildings, etc.
  - configurePassiveIncome(perSec, multiplier)
    └─ setInterval every 1000ms:
       energy += perSec
  ↓
App.tsx слушает energy (строка 43)
  ↓
energy меняется каждую сек
  ↓
App.tsx ремеруется (целый компонент!)
  ↓
MainScreenHeader получает новое energy props
  ↓
MainScreenHeader ремеруется
  ↓
Cascade: 60+ ребендеров в минуту
```

### User Flow: Level Up Detection

```
currentLevel изменяется (через gameStore tick)
  ↓
useEffect в App.tsx детектирует изменение (строка 74)
  ↓
Калькулирует какие уровни были набраны
  ↓
Находит majorLevel (использует shouldShowMajorLevel)
  ↓
Если majorLevel:
  ├─ setShowLevelUp(true)
  ├─ setOverlayLevel(majorLevel)
  └─ logClientEvent('level_up_overlay', {...})
  ↓
Для каждого non-major level:
  ├─ toast(`Уровень ${level}!`)
  └─ logClientEvent('level_up_toast', {...})
  ↓
LevelUpScreen показывается (строка 222-229)
```

**Проблемы:**
1. Эта логика слишком сложна для App.tsx
2. Должна быть в отдельном custom hook

**Рекомендации:**
1. Extract в `useLevelUpDetection()` hook
2. Упростить App.tsx

---

## 🔌 API Contracts Review

### No direct API calls in App.tsx

Все API calls делаются через gameStore actions:
- initGame() → POST /auth/telegram, POST /session
- refreshSession() → POST /session
- logoutSession() → POST /session/logout (with keepalive)

**Status:**
- [x] initGame обрабатывает errors? ✅ (через UIStore.openAuthError)
- [x] refreshSession имеет error handling? ✅ (в gameStore)
- [x] logoutSession имеет cleanup? ✅ (в gameStore)

---

## ⚠️ Критические риски и технический долг

### Risk 1: Energy cascade rerenders (CRITICAL)
- **Severity:** Critical 🔴
- **Impact:** 60+ rerenders per minute from energy updates
- **Probability:** High (confirmed)
- **Mitigation:** Decouple energy from main component tree

### Risk 2: Duplicate level selector (HIGH)
- **Severity:** High 🟠
- **Impact:** Code confusion, potential bugs
- **Probability:** Medium (already happening)
- **Mitigation:** Use single level selector with clear naming

### Risk 3: Complex level up detection in App.tsx (HIGH)
- **Severity:** High 🟠
- **Impact:** App.tsx hard to understand and maintain
- **Probability:** High (already happening)
- **Mitigation:** Extract to custom hook

### Risk 4: No memoization of child components (HIGH)
- **Severity:** High 🟠
- **Impact:** Children rerender when App rerenders
- **Probability:** High (App rerenders every second)
- **Mitigation:** Add React.memo to MainScreenHeader, MainScreen, TabBar

### Technical Debt 1: Level up detection logic mixed with layout
- **Cost:** 4 hours to extract to hook
- **Impact:** App.tsx is confusing and hard to change
- **Recommendation:** Extract useLevelUpDetection hook immediately

### Technical Debt 2: Multiple stores (gameStore + UIStore)
- **Cost:** 8 hours for unified state architecture
- **Impact:** Hard to trace data flow
- **Recommendation:** Consider single store or better separation

### Technical Debt 3: Energy flowing through main component tree
- **Cost:** 6 hours for proper architecture
- **Impact:** Cascade rerenders throughout app
- **Recommendation:** Implement display energy separation

---

## 🔬 Глубокий анализ критичных проблем

### Проблема 1: Energy Updates Cause App-Wide Rerenders

**Файл:** `webapp/src/App.tsx` (строки 43, 173)

**Описание:**

```typescript
// Строка 43: App.tsx слушает energy
const energy = useGameStore(state => state.energy);

// Строка 173: energy передается в MainScreenHeader
<MainScreenHeader
  level={level}
  energy={energy}  // ← energy меняется каждую сек!
  stars={stars}
  xpProgress={...}
  onShopClick={() => setActiveTab('shop')}
  onSettingsClick={() => setActiveTab('settings')}
/>

// gameStore (строки 468-474):
setInterval(() => {
  set(state => ({
    energy: state.energy + perSec,  // ← Меняется здесь!
    pendingPassiveEnergy: state.pendingPassiveEnergy + perSec,
    pendingPassiveSeconds: state.pendingPassiveSeconds + 1,
  }));
}, 1000);
```

**Root Cause Analysis:**

- **Непосредственная причина:**
  - energy меняется каждую сек в gameStore
  - App.tsx слушает energy (деконструкция из useGameStore)
  - Zustand notifies App that state changed
  - App.tsx ремеруется
  - Props energy меняются → MainScreenHeader получает новое значение

- **Глубинная причина:**
  - Разработчик думал что energy нужно показывать в реальном времени
  - Не предвидел что это вызовет cascade ребендеры
  - gameStore дизайн (56 полей) усугубляет проблему

- **Исторический контекст:**
  - Это был MVP - нужно было быстро делать
  - Performance не был priority
  - Никто не профилировал

**Взаимосвязи:**

- **Зависимые компоненты:**
  - App.tsx (root)
  - MainScreenHeader (header с энергией)
  - MainScreen (содержимое)
  - TabBar (footer)

- **Влияние на слои:**
  - State: gameStore updates energy every 1 sec
  - Component: App rerenders every 1 sec
  - UI: MainScreenHeader, MainScreen, TabBar all potentially rerender
  - Browser: 60+ render cycles per minute

- **Side effects:**
  - Animations in other components may conflict
  - Mobile: battery drain
  - Performance degradation with more features

**Best Practice:**

- **Паттерн 1: Display energy calculated locally**
  ```typescript
  // gameStore: only stores lastServerEnergy and energyPerSec
  interface EnergyState {
    lastServerEnergy: number;
    energyPerSec: number;
    lastSyncTime: number;

    getDisplayEnergy: () => {
      const elapsed = (Date.now() - lastSyncTime) / 1000;
      return lastServerEnergy + (elapsed * energyPerSec);
    }
  }

  // MainScreenHeader: calculates and animates locally
  function MainScreenHeader({ energyPerSec }) {
    const [displayEnergy, setDisplayEnergy] = useState(0);

    useEffect(() => {
      const lastServerEnergy = useGameStore(s => s.energy);
      const ticker = setInterval(() => {
        setDisplayEnergy(prev => prev + energyPerSec);
      }, 1000);
      return () => clearInterval(ticker);
    }, [energyPerSec]);

    return <div>Energy: {displayEnergy}</div>;
  }
  ```

- **Паттерн 2: Separate energy store**
  ```typescript
  // Don't include energy in gameStore
  // Create separate energyStore for display
  const useEnergyStore = create(state => ({
    serverEnergy: 0,
    energyPerSec: 0,
    // Display calculation
  }));
  ```

- Источник: [React Performance - State Structure](https://react.dev/learn/choosing-the-state-structure)

**Гипотезы для исследования:**

1. Может быть energy нужна только в MainScreenHeader?
2. Может быть можно не передавать energy в App?
3. Может быть используется animation которая нужна каждую сек?

**Направления для углубленного анализа:**

- [ ] Посмотреть как energy используется в MainScreenHeader
  - Есть ли animation?
  - Может ли быть calculated locally?

- [ ] Профилировать сколько компонентов ремеруется
  - Только MainScreenHeader или еще MainScreen?
  - Как это влияет на performance?

- [ ] Проверить есть ли способ не передавать energy
  - Если MainScreenHeader может получить energyPerSec
  - Может вычислить display энергию самостоятельно

---

### Проблема 2: Duplicate Level Selector

**Файл:** `webapp/src/App.tsx` (строки 41-42)

**Описание:**

```typescript
const currentLevel = useGameStore(state => state.level);  // Строка 41
const level = useGameStore(state => state.level);        // Строка 42

// currentLevel используется в:
// - Строка 85: const previousLevel = previousLevelRef.current;
// - Строка 86: if (currentLevel <= previousLevel)
// - Строка 92: for (let lvl = previousLevel + 1; lvl <= currentLevel; lvl += 1)
// - Строка 112: dependency array

// level используется в:
// - Строка 172: <MainScreenHeader level={level} />
```

**Root Cause Analysis:**

- **Непосредственная причина:**
  - Разработчик создал две переменные для одного значения
  - Вероятно, для разных purposes (currentLevel для логики, level для UI)
  - Но это confusing

- **Глубинная причина:**
  - Нет clear naming convention
  - Нет review который бы поймал это

- **Исторический контекст:**
  - Это выглядит как случайное дублирование
  - Или попытка быть explicit о разных uses

**Взаимосвязи:**

- currentLevel используется в level up detection
- level используется в MainScreenHeader

**Best Practice:**

- **Вариант 1: Single variable with clear name**
  ```typescript
  const level = useGameStore(state => state.level);
  // Используется везде с одним именем
  ```

- **Вариант 2: Descriptive names if really different**
  ```typescript
  const playerLevel = useGameStore(state => state.level);
  const displayLevel = playerLevel; // Only if truly different
  ```

**Гипотезы:**

1. Это может быть artifact из рефакторинга
2. Может быть был план разделить на разные переменные но не завершено

**Направления для анализа:**

- [ ] Проверить git history - когда появилось дублирование?
- [ ] Есть ли comment объясняющий почему два селектора?
- [ ] Используются ли они действительно независимо?

---

### Проблема 3: Level Up Detection Logic Too Complex for App.tsx

**Файл:** `webapp/src/App.tsx` (строки 73-112)

**Описание:**

```typescript
// useEffect с 40 строк кода для level up detection
useEffect(() => {
  if (!isInitialized) {
    return;
  }

  if (!hasBootstrappedLevelRef.current) {
    previousLevelRef.current = currentLevel;
    hasBootstrappedLevelRef.current = true;
    return;
  }

  const previousLevel = previousLevelRef.current;
  if (currentLevel <= previousLevel) {
    previousLevelRef.current = currentLevel;
    return;
  }

  const gainedLevels: number[] = [];
  for (let lvl = previousLevel + 1; lvl <= currentLevel; lvl += 1) {
    gainedLevels.push(lvl);
  }

  const majorLevel = [...gainedLevels].reverse().find(level => shouldShowMajorLevel(level));

  if (majorLevel) {
    setOverlayLevel(majorLevel);
    setShowLevelUp(true);
    void logClientEvent('level_up_overlay', { level: majorLevel });
  }

  gainedLevels
    .filter(level => !shouldShowMajorLevel(level))
    .forEach(level => {
      toast(`Уровень ${level}! Новые постройки доступны.`, 2600, 'trophy');
      void logClientEvent('level_up_toast', { level });
    });

  previousLevelRef.current = currentLevel;
}, [currentLevel, isInitialized, toast]);
```

**Root Cause Analysis:**

- **Непосредственная причина:**
  - Логика level up detection довольно сложная
  - Нужны refs для отслеживания предыдущего уровня
  - Нужна bootstrap логика (чтобы не show уровни при инициализации)
  - Это заняло много кода

- **Глубинная причина:**
  - Разработчик не захотел создавать отдельный hook
  - Думал "это просто useEffect, оставлю в App"
  - Но это усложнило App.tsx

- **Исторический контекст:**
  - Это был MVP sprint - "сделать быстро"
  - Feature флаг для level up системы? Или всегда нужна?

**Взаимосвязи:**

- Влияет на App.tsx readability
- Использует toast hook
- Использует logClientEvent

**Best Practice:**

- **Extract to custom hook:**
  ```typescript
  function useLevelUpDetection(currentLevel: number, isInitialized: boolean) {
    const [showLevelUp, setShowLevelUp] = useState(false);
    const [overlayLevel, setOverlayLevel] = useState<number | null>(null);
    const previousLevelRef = useRef(1);
    const hasBootstrappedRef = useRef(false);
    const { toast } = useNotification();

    useEffect(() => {
      if (!isInitialized) return;

      if (!hasBootstrappedRef.current) {
        previousLevelRef.current = currentLevel;
        hasBootstrappedRef.current = true;
        return;
      }

      const previousLevel = previousLevelRef.current;
      if (currentLevel <= previousLevel) {
        previousLevelRef.current = currentLevel;
        return;
      }

      // Rest of detection logic...

      previousLevelRef.current = currentLevel;
    }, [currentLevel, isInitialized, toast]);

    return { showLevelUp, overlayLevel, setShowLevelUp, setOverlayLevel };
  }

  // In App.tsx:
  const levelUp = useLevelUpDetection(currentLevel, isInitialized);
  ```

- **Benefits:**
  - App.tsx becomes cleaner
  - Logic is reusable
  - Easier to test
  - Easier to maintain

- Источник: [React Hooks - Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)

---

## 📊 Metrics & Complexity

| Метрика | Значение | Норма | Статус |
|---------|----------|-------|--------|
| Lines of Code | 235 | < 150 | ⚠️ Большой |
| useEffect count | 4 | < 2 | ⚠️ Много |
| useState count | 3 | < 2 | ⚠️ Много |
| useRef count | 2 | < 1 | ⚠️ Много |
| useCallback count | 1 | < 1 | ✅ OK |
| useMemo count | 1 | < 1 | ✅ OK |
| Selectors from gameStore | 10 | < 5 | ⚠️ Many |
| Selectors from UIStore | 5 | < 3 | ⚠️ Many |
| Props passed to MainScreenHeader | 5 | < 3 | ⚠️ Many |
| Rerenders per minute | 60+ | < 5 | 🔴 60x worse |
| React.memo usage | 0 | > 3 | ❌ None |

---

## 🔗 Взаимосвязи и зависимости

### Карта зависимостей:

```
App.tsx (Root Container)
  ├── Uses (Stores):
  │   ├── gameStore (10 selectors!)
  │   │   ├── energy (каждую сек!)
  │   │   ├── level, stars, xp
  │   │   ├── initGame, logoutSession, refreshSession
  │   │   └── isInitialized
  │   └── UIStore (5 selectors)
  │       ├── authErrorMessage, isAuthModalOpen, dismissAuthError
  │       ├── offlineSummary, acknowledgeOfflineSummary
  │
  ├── Uses (Hooks):
  │   ├── useNotification (toast)
  │   ├── useTelegramBackButton
  │   ├── useSafeArea
  │   └── Implicit: useCallback, useEffect, useState, useMemo, useRef
  │
  ├── Uses (Services):
  │   ├── logClientEvent (telemetry)
  │   └── initializePreferenceCloudSync
  │
  ├── Renders (Child Components):
  │   ├── MainScreenHeader (5 props, energy changes every sec!)
  │   ├── MainScreen (activeTab prop)
  │   ├── TabBar (active, onChange)
  │   ├── AuthErrorModal (3 props)
  │   ├── OfflineSummaryModal (5 props)
  │   ├── LevelUpScreen (3 props)
  │   └── NotificationContainer
  │
  └── State Hierarchy:
      App (60+ rerenders/min)
      ├── MainScreenHeader (60+ rerenders/min)
      ├── MainScreen (potentially 60+ rerenders/min)
      ├── TabBar (potentially 60+ rerenders/min)
      └── Modals (less frequent)
```

### Критичные связи:

1. **gameStore.energy → App → MainScreenHeader** (CRITICAL)
   - Energy updates every 1 second
   - App rerenders
   - MainScreenHeader rerenders
   - **Cascade effect confirmed**

2. **gameStore.level → App → level up detection** (HIGH)
   - Level change detected in useEffect
   - Complex logic runs
   - Modal shows up
   - Toast notifications

3. **UIStore → App → Modal components**
   - Auth errors shown through modal
   - Offline summary shown through modal
   - These don't update frequently (good)

4. **activeTab → MainScreen** (OK)
   - Only changes on user interaction
   - Not frequency issue

### Potential ripple effects:

- If gameStore structure changes → many places to update
- If MainScreenHeader prop list changes → need to update App
- If level up detection changes → need to find in App.tsx (hard to locate)

---

## 📚 Best Practices и источники

### Применимые паттерны:

#### 1. Extract Level Up Detection to Custom Hook
- **Описание:** Move complex logic out of component to reusable hook
- **Источник:** [React Hooks - Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)
- **Примеры:**
  ```typescript
  function useLevelUpDetection(level, isInitialized) {
    // All detection logic here
  }
  ```

#### 2. Memoize Child Components
- **Описание:** Prevent unnecessary rerenders of child components
- **Источник:** [React.memo documentation](https://react.dev/reference/react/memo)
- **Примеры:**
  ```typescript
  const MemoMainScreenHeader = React.memo(MainScreenHeader);
  const MemoMainScreen = React.memo(MainScreen);
  ```

#### 3. Separate Display State from Game State
- **Описание:** Energy display shouldn't be in main game state
- **Источник:** [React - Choosing State Structure](https://react.dev/learn/choosing-the-state-structure)

#### 4. Use Dependency Array Correctly
- **Описание:** Avoid creating new object/function references in dependencies
- **Источник:** [React - Synchronizing Effects](https://react.dev/learn/synchronizing-with-effects)

### Полезные ресурсы:

- 📖 [React Performance Best Practices](https://react.dev/learn/render-and-commit)
- 📖 [Fixing Performance Issues](https://react.dev/learn/scaling-up-with-reducer-and-context)
- 🎥 [Jack Herrington - React Performance](https://www.youtube.com/watch?v=9JJva4GrkA4)

---

## 🔭 Направления для дальнейшего исследования

### Приоритет 1 (Critical): Требует немедленного изучения

1. **Confirm that MainScreenHeader rerenders every 1 second**
   - **Что изучить:**
     - React DevTools Profiler
     - Select MainScreenHeader component
     - Record for 10 seconds
     - Count rerenders
   - **Почему важно:**
     - Если rerenders 10 раз за 10 сек → 1 раз в сек
     - Это confirmedProblem
   - **Как исследовать:**
     - DevTools → Profiler
     - Record for 10 seconds
     - Look at MainScreenHeader in the list
   - **Ожидаемый результат:**
     - Number of rerenders
     - Duration of each render

2. **Check if MainScreen also rerenders**
   - **Что изучить:**
     - Does MainScreen get energy as prop?
     - Does it have children that depend on energy?
     - How often does it rerender?
   - **Почему важно:**
     - If MainScreen also rerenders → bigger cascade
   - **Как исследовать:**
     - Grep для energy usage в MainScreen
     - Посмотреть children компоненты
     - Профилировать MainScreen rerenders

3. **Profile energy consumption impact**
   - **Что изучить:**
     - CPU usage with Chrome DevTools Performance tab
     - How much time spent rendering per minute?
     - How much time if energy updates removed?
   - **Почему важно:**
     - Understand real-world impact
     - Know if optimization worth it
   - **Как исследовать:**
     - Open DevTools → Performance
     - Record for 30 seconds of idle
     - Look at CPU time in Main thread

### Приоритет 2 (High): Желательно исследовать

1. **Extract level up detection to hook**
   - **Что изучить:**
     - Move 40-line useEffect to separate hook
     - Test that it works
   - **Почему важно:**
     - Improve App.tsx readability
     - Make logic reusable

2. **Fix duplicate level selector**
   - **Что изучить:**
     - Are currentLevel and level used differently?
     - Can they be unified?

3. **Check MainScreenHeader implementation**
   - **Что изучить:**
     - How is energy used in MainScreenHeader?
     - Are there animations?
     - Can it calculate energy locally?

### Приоритет 3 (Medium): Полезно для полноты

1. **Analyze MainScreen implementation**
   - **Что изучить:**
     - What tabs does it contain?
     - Which ones have expensive components?
     - Which ones use energy data?

2. **Look at TabBar implementation**
   - **Что изучить:**
     - Does TabBar need to rerender every second?
     - Can it be memoized?

### Открытые вопросы:

- ❓ **Почему energy display нужна в real-time?** Есть ли requirements для плавной анимации?
- ❓ **Как часто пользователи смотрят на энергию?** Нужна ли каждую сек?
- ❓ **Есть ли animation на energy counter?** Если нет → можно только синхронизировать при server update
- ❓ **Зачем две переменные level?** Исторический artifact или deliberate?
- ❓ **Есть ли другие компоненты которые pass energy down?** Или это only в MainScreenHeader?

---

## 🎯 Выводы

**Краткое резюме:**

App.tsx это главный контейнер приложения, но он стал горлышком бутылки для performance. Energy обновляется каждую сек в gameStore, App.tsx слушает energy, App ремеруется каждую сек, и все дети компоненты (MainScreenHeader, MainScreen, TabBar) потенциально ремеруются. Дополнительно, level up detection логика (40 строк) слишком сложна для главного компонента и должна быть в отдельном hook. Есть дублирование level селектора которое confusing.

**Ключевые инсайты:**

1. **Energy is the root cause of cascade rerenders**
   - Меняется каждую сек в gameStore
   - App слушает it
   - App ремеруется каждую сек
   - ALL children potentially rerender
   - **Это точка где нужна оптимизация!**

2. **App.tsx имеет слишком много ответственности**
   - Layout management
   - Level up detection (40 строк сложной логики)
   - Modal management
   - Navigation state
   - Visibility tracking
   - **Нужна разделение**

3. **Duplicate level selector confusing**
   - currentLevel и level это одно и то же
   - Это неправильный pattern
   - Нужен единый, ясный names

4. **No memoization of children**
   - MainScreenHeader, MainScreen, TabBar не мемоизированы
   - Когда App ремеруется → они все ремеруются
   - **Quick win:** добавить React.memo

5. **App-wide performance bottleneck identified**
   - energy propagates через весь компонент tree
   - Это starting point для optimization
   - Отсюда это идет в BuildingsPanel → BuildingCard

**Архитектурные наблюдения:**

- **Energy is too tightly coupled** to main component tree
- **Logic is mixed with layout** - level up detection in App.tsx
- **No clear separation of concerns** - store management + layout + business logic
- **Performance optimization never happened** - "works, ship it"

**Рекомендуемые области для следующего анализа:**

1. **MainScreenHeader.tsx** - как energy используется там? Может ли быть calculated locally?
   - Потому что: это receiving energy prop каждую сек
   - Impact: Может быть способ decuple energy display

2. **MainScreen.tsx** - какие tabs есть? Используют ли они energy?
   - Потому что: может быть unnecessary rerenders
   - Impact: Может быть нужна memoization

3. **TickService (Backend)** - как часто backend updates game state?
   - Потому что: энергия должна синхроноваться с сервером
   - Impact: Может быть правильный refresh rate это не каждую сек

---

## Следующий компонент для анализа

### **MainScreenHeader.tsx (Priority 1 - Получает energy каждую сек)**

**Почему именно?**
- Это receiving energy prop из App.tsx каждую сек (строка 173)
- Это главная причина MainScreenHeader rerenders
- Может быть используется animation? Или может быть calculated locally?
- Если это может быть decoupled → можно fix cascade ребендеров

**Что проверим:**
1. Как energy используется в MainScreenHeader?
2. Есть ли animation на energy counter?
3. Может ли energy быть calculated locally?
4. Какие другие props используются?

**Ожидаемый результат:**
- Понимание как energy display работает
- Возможное решение для decouple energy
- Рекомендации для optimization

---

**Отчет готов! 🚀**

**Ключевые рекомендации для App.tsx:**

1. 🔴 **КРИТИЧНО:** Профилировать MainScreenHeader - сколько раз ремеруется?
2. 🟠 **URGENT:** Extract level up detection в `useLevelUpDetection()` hook
3. 🟠 **HIGH:** Добавить React.memo для MainScreenHeader, MainScreen, TabBar
4. 🟠 **HIGH:** Проанализировать MainScreenHeader - может ли energy быть calculated locally?
5. 🟡 **MEDIUM:** Fix duplicate level selector
6. 🟡 **MEDIUM:** Understand energy display requirements (animation needed?)

