# Code Analysis: App.tsx (Root Component)

## 📊 Общая оценка: 5/10

**Компонент:** `webapp/src/App.tsx`
**LOC (Lines of Code):** 235 строк
**Сложность:** High
**Дата анализа:** 2025-10-25

**Критичность:** 🔴 **CRITICAL** - Главная точка входа приложения, управляет lifecycle и global state

---

## ✅ Сильные стороны

1. **Чистая структура JSX**: Логическое разделение на Header, Content, Footer, Modals
2. **Custom hooks**: Использование переиспользуемых hooks (`useSafeArea`, `useTelegramBackButton`, `useNotification`)
3. **Proper cleanup**: Все event listeners правильно удаляются в useEffect cleanup
4. **TypeScript**: Строгая типизация (`TabKey`, `TabBarItem`)
5. **Lifecycle management**: Правильная обработка `visibilitychange` и `beforeunload` для синхронизации с сервером
6. **Safe area handling**: Учитывает notch/insets мобильных устройств через `useSafeArea`
7. **Level up UX**: Умная логика показа major levels (каждый 5-й до 100, каждый 25-й до 1000)

---

## 🏗️ Архитектурный анализ по слоям

### Layer 1: Component Structure (Orchestrator Component)

- **Оценка:** 6/10
- **Обнаруженные проблемы:**

#### Проблема 1: Множественные прямые обращения к stores (строки 32-46)

```typescript
const initGame = useGameStore(state => state.initGame);
const authErrorMessage = useUIStore(state => state.authErrorMessage);
const isAuthModalOpen = useUIStore(state => state.isAuthModalOpen);
const dismissAuthError = useUIStore(state => state.dismissAuthError);
const offlineSummary = useUIStore(state => state.offlineSummary);
const acknowledgeOfflineSummary = useUIStore(state => state.clearOfflineSummary);
const isInitialized = useGameStore(state => state.isInitialized);
const logoutSession = useGameStore(state => state.logoutSession);
const refreshSession = useGameStore(state => state.refreshSession);
const currentLevel = useGameStore(state => state.level);
const level = useGameStore(state => state.level); // ⚠️ ДУБЛИРОВАНИЕ!
const energy = useGameStore(state => state.energy);
const stars = useGameStore(state => state.stars);
const xpIntoLevel = useGameStore(state => state.xpIntoLevel);
const xpToNextLevel = useGameStore(state => state.xpToNextLevel);
```

**Подсчёт:**
- **11 селекторов из useGameStore**
- **6 селекторов из useUIStore**
- **Итого: 17 прямых обращений к stores**

**Root Cause Analysis:**

**Непосредственная причина:**
App.tsx выполняет роль "orchestrator" - управляет lifecycle, navigation, показывает modals, передаёт данные в child components. Для этого нужен доступ к разным частям state.

**Глубинная причина:**
Отсутствие промежуточного слоя между stores и UI. Каждый компонент напрямую подключается к global stores, что создаёт **tight coupling**.

**Историческая причина:**
Это типичная эволюция React приложения:
1. Начали с простого App.tsx + несколько state полей
2. Добавили Zustand для global state
3. Постепенно добавляли новые features → новые селекторы
4. Никто не рефакторил, потому что "и так работает"

**Проблема - ДУБЛИРОВАНИЕ:**
```typescript
const currentLevel = useGameStore(state => state.level); // Строка 41
const level = useGameStore(state => state.level);         // Строка 42
```

Две переменных для одного и того же значения! Это:
- ❌ Confusing для читателя кода
- ❌ Лишний селектор (хотя Zustand оптимизирует)
- ❌ Риск использовать не ту переменную

**Почему это произошло:**
- `currentLevel` используется в useEffect для level up detection (строка 85)
- `level` используется для передачи в MainScreenHeader (строка 172)
- Разработчик не заметил дублирование или решил, что так "понятнее"

**Best Practice:**

**Паттерн 1: Группировка селекторов в custom hooks**

```typescript
// hooks/useAppState.ts
export function useAppState() {
  const gameState = useGameStore(state => ({
    initGame: state.initGame,
    isInitialized: state.isInitialized,
    logoutSession: state.logoutSession,
    refreshSession: state.refreshSession,
    level: state.level,
    energy: state.energy,
    stars: state.stars,
    xpIntoLevel: state.xpIntoLevel,
    xpToNextLevel: state.xpToNextLevel,
  }));

  const uiState = useUIStore(state => ({
    authErrorMessage: state.authErrorMessage,
    isAuthModalOpen: state.isAuthModalOpen,
    dismissAuthError: state.dismissAuthError,
    offlineSummary: state.offlineSummary,
    clearOfflineSummary: state.clearOfflineSummary,
  }));

  return { gameState, uiState };
}

// В App.tsx
function App() {
  const { gameState, uiState } = useAppState();
  // Теперь: gameState.level, uiState.authErrorMessage
}
```

**НО:** Это создаст проблему - все изменения любого поля вызовут ререндер всего App.tsx!

**Паттерн 2: Selector composition (лучше!)**

```typescript
// Оставить селекторы как есть, но убрать дублирование
const level = useGameStore(state => state.level); // Одна переменная
// Использовать везде только `level`
```

**Паттерн 3: Split into smaller components**

Вынести логику в отдельные компоненты:
- `AppLifecycleManager` - управление visibility, beforeunload
- `LevelUpDetector` - логика level up detection
- `AppShell` - layout с header/content/footer

**Источники:**
- [React Composition vs Inheritance](https://react.dev/learn/thinking-in-react#step-4-identify-where-your-state-should-live)
- [Zustand Performance Tips](https://github.com/pmndrs/zustand#selecting-multiple-state-slices)

**Взаимосвязи:**
App.tsx → gameStore (11 полей) → любое изменение может вызвать ререндер

**Исследовать дальше:**
- Профилировать: как часто App.tsx ререндерится?
- Какие селекторы вызывают ререндеры чаще всего?
- Можно ли мемоизировать child components?

---

#### Проблема 2: Сложная бизнес-логика level up detection в UI component (строки 73-112)

```typescript
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

  // Calculate gained levels
  const gainedLevels: number[] = [];
  for (let lvl = previousLevel + 1; lvl <= currentLevel; lvl += 1) {
    gainedLevels.push(lvl);
  }

  // Find major level
  const majorLevel = [...gainedLevels].reverse().find(level => shouldShowMajorLevel(level));

  if (majorLevel) {
    setOverlayLevel(majorLevel);
    setShowLevelUp(true);
    void logClientEvent('level_up_overlay', { level: majorLevel });
  }

  // Show toast for minor levels
  gainedLevels
    .filter(level => !shouldShowMajorLevel(level))
    .forEach(level => {
      toast(`Уровень ${level}! Новые постройки доступны.`, 2600, 'trophy');
      void logClientEvent('level_up_toast', { level });
    });

  previousLevelRef.current = currentLevel;
}, [currentLevel, isInitialized, toast]);
```

**Анализ сложности:**
- 40 строк логики
- 3 условных выхода (early returns)
- Цикл построения массива
- Array методы (reverse, find, filter, forEach)
- Side effects (setOverlayLevel, setShowLevelUp, logClientEvent, toast)
- Использование useRef для tracking previous state

**Root Cause Analysis:**

**Непосредственная причина:**
Level up - это важная фича для engagement (gamification). Нужно показывать красивый overlay для major levels и toast для minor levels.

**Глубинная причина:**
Размывание границ ответственности. UI component (App.tsx) содержит game logic (определение major/minor levels, tracking progression).

**Исторический контекст:**
Вероятно, level up logic была добавлена после MVP:
1. Сначала был простой toast "Level up!"
2. Потом добавили major levels (каждый 5-й показывать overlay)
3. Потом усложнили правила (до 100 - каждый 5-й, до 1000 - каждый 25-й)
4. Логика осталась в App.tsx, потому что "тут уже есть доступ к level"

**Проблемы:**
1. ❌ **Сложность**: Трудно понять что делает код с первого взгляда
2. ❌ **Тестируемость**: Нужно мокать весь App component чтобы протестировать level up логику
3. ❌ **Переиспользуемость**: Нельзя использовать эту логику в других местах
4. ❌ **Separation of Concerns**: UI компонент знает про игровую механику

**Best Practice:**

**Решение 1: Вынести в custom hook**

```typescript
// hooks/useLevelUpDetection.ts
export function useLevelUpDetection(currentLevel: number, isInitialized: boolean) {
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [overlayLevel, setOverlayLevel] = useState<number | null>(null);
  const previousLevelRef = useRef(1);
  const hasBootstrappedLevelRef = useRef(false);
  const { toast } = useNotification();

  useEffect(() => {
    if (!isInitialized) return;

    if (!hasBootstrappedLevelRef.current) {
      previousLevelRef.current = currentLevel;
      hasBootstrappedLevelRef.current = true;
      return;
    }

    const levelDiff = currentLevel - previousLevelRef.current;
    if (levelDiff <= 0) {
      previousLevelRef.current = currentLevel;
      return;
    }

    const { majorLevel, minorLevels } = analyzeLevelGains(
      previousLevelRef.current,
      currentLevel
    );

    if (majorLevel) {
      setOverlayLevel(majorLevel);
      setShowLevelUp(true);
      void logClientEvent('level_up_overlay', { level: majorLevel });
    }

    minorLevels.forEach(level => {
      toast(`Уровень ${level}! Новые постройки доступны.`, 2600, 'trophy');
      void logClientEvent('level_up_toast', { level });
    });

    previousLevelRef.current = currentLevel;
  }, [currentLevel, isInitialized, toast]);

  const dismissLevelUp = useCallback(() => {
    setShowLevelUp(false);
    setOverlayLevel(null);
  }, []);

  return { showLevelUp, overlayLevel, dismissLevelUp };
}

// services/levelProgressionService.ts
export function analyzeLevelGains(fromLevel: number, toLevel: number) {
  const gainedLevels = Array.from(
    { length: toLevel - fromLevel },
    (_, i) => fromLevel + i + 1
  );

  const majorLevel = [...gainedLevels]
    .reverse()
    .find(level => shouldShowMajorLevel(level));

  const minorLevels = gainedLevels.filter(level => !shouldShowMajorLevel(level));

  return { majorLevel: majorLevel ?? null, minorLevels };
}

// В App.tsx
function App() {
  const level = useGameStore(state => state.level);
  const isInitialized = useGameStore(state => state.isInitialized);

  const { showLevelUp, overlayLevel, dismissLevelUp } = useLevelUpDetection(
    level,
    isInitialized
  );

  // Теперь App.tsx не знает про логику level up!
}
```

**Преимущества:**
- ✅ App.tsx становится на 40 строк проще
- ✅ Логику легко тестировать (unit tests для `analyzeLevelGains`)
- ✅ Переиспользуемость (hook можно использовать в других компонентах)
- ✅ Чёткое разделение ответственности

**Источники:**
- [Custom Hooks Best Practices](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [Separation of Concerns in React](https://kentcdodds.com/blog/colocation)

**Взаимосвязи:**
Level up logic → toast notifications → useNotification hook → NotificationContainer
Изменение в логике level up может сломать notification flow.

---

#### Проблема 3: Global navigation state в component вместо store (строка 58)

```typescript
const [activeTab, setActiveTab] = useState<TabKey>('home');
```

**Вопрос:** Почему navigation state в local component state, а не в global store?

**Root Cause Analysis:**

**Аргументы ЗА local state:**
- Navigation - это UI-only concern, не влияет на game logic
- Не нужно синхронизировать с backend
- Быстрее (нет overhead Zustand)

**Аргументы ПРОТИВ (почему это может быть проблемой):**
- Нельзя сделать deep linking (открыть приложение на конкретной вкладке)
- Нельзя сохранить tab при перезагрузке
- Нельзя программно менять tab из других мест (например, после покупки → автоматически вернуться в home)

**Анализ текущего использования:**

```typescript
// Передаётся в MainScreen
<MainScreen activeTab={activeTab} onTabChange={setActiveTab} />

// Меняется из header buttons
onShopClick={() => setActiveTab('shop')}
onSettingsClick={() => setActiveTab('settings')}

// Меняется из TabBar
onChange={tabId => setActiveTab(tabId as TabKey)}
```

**Prop drilling:**
```
App (activeTab state)
  ↓
MainScreen (props)
  ↓
Conditional render (shop/builds/leaderboard/etc)
```

**Решение зависит от requirements:**

**Вариант 1: Оставить local state (если не нужен deep linking)**
Текущая реализация OK для MVP.

**Вариант 2: Переместить в uiStore (если нужна persistence/deep linking)**

```typescript
// uiStore.ts
interface UIState {
  // ...existing fields
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
}

// App.tsx
const activeTab = useUIStore(state => state.activeTab);
const setActiveTab = useUIStore(state => state.setActiveTab);
```

**Вариант 3: Использовать URL routing (лучший вариант для SPA)**

```typescript
// Используя React Router или аналог
import { useSearchParams } from 'react-router-dom';

function App() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as TabKey) || 'home';

  const handleTabChange = (tab: TabKey) => {
    setSearchParams({ tab });
  };
}
```

**Но:** Telegram Mini Apps могут иметь ограничения с URL routing.

**Вывод:** Текущая реализация приемлема для MVP. Если в будущем понадобится deep linking - рефакторить в uiStore.

**Источники:**
- [React Router in Telegram Mini Apps](https://docs.telegram-mini-apps.com/platform/navigation)
- [State Colocation - Kent C. Dodds](https://kentcdodds.com/blog/state-colocation-will-make-your-react-app-faster)

---

### Layer 2: State Management (Lifecycle и side effects)

- **Оценка:** 7/10
- **State flow diagram:**

```
App Component Mount
    ↓
useEffect: initGame() [строка 114-117]
    ↓
useEffect: initializePreferenceCloudSync() [строка 51-55]
    ↓
gameStore.initGame() → POST /auth/telegram → POST /session
    ↓
isInitialized = true
    ↓
useEffect: setup visibility/beforeunload listeners [строка 124-148]
    │
    ├─ document.hidden → logoutSession(true)
    └─ document visible → refreshSession()

Параллельно:
useEffect: level up detection [строка 73-112]
    ↓
currentLevel changes → analyze gains → show modal/toast
```

**Обнаруженные проблемы:**

#### Проблема 1: Dependency array в useEffect может вызывать лишние вызовы (строка 117)

```typescript
useEffect(() => {
  // Initialize game on mount
  initGame();
}, [initGame]);
```

**Проблема:**
`initGame` - это функция из Zustand store. Zustand гарантирует stable reference, **НО** это зависит от реализации store. Если store пересоздастся, `initGame` получит новую ссылку → useEffect сработает повторно.

**Правильно ли это?**
- ✅ Хорошо: Если store пересоздался, нужно заново инициализировать игру
- ❌ Плохо: Если это случайно (например, hot reload), будет лишний API call

**Best Practice:**

Zustand обычно создаёт стабильные ссылки на функции, так что текущая реализация OK. Но для ясности можно добавить комментарий:

```typescript
useEffect(() => {
  // Initialize game on mount
  // Note: initGame is stable reference from Zustand, will only change if store recreates
  initGame();
}, [initGame]);
```

Или использовать ESLint disable если уверены что нужен вызов только при mount:

```typescript
useEffect(() => {
  initGame();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []); // Intentionally empty - run only on mount
```

**НО** это antipattern, лучше оставить как есть.

---

#### Проблема 2: Сложная логика в useCallback dependencies (строка 119-122, 150-159)

```typescript
const handleRetry = useCallback(() => {
  dismissAuthError();
  initGame();
}, [dismissAuthError, initGame]);

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

**Анализ:**

**handleRetry:**
- Зависит от 2 функций из stores
- Используется в AuthErrorModal.onRetry (строка 208)
- Правильный useCallback usage ✅

**modalBackHandler:**
- Зависит от 2 state values + 2 функций
- Используется в useTelegramBackButton (строка 161)
- **Проблема:** Пересоздаётся каждый раз когда меняется `isAuthModalOpen` или `offlineSummary`

**Влияние на performance:**
При каждом изменении `isAuthModalOpen` / `offlineSummary`:
1. `modalBackHandler` получает новую ссылку
2. `useTelegramBackButton` effect срабатывает заново (строка 161)
3. Telegram back button handler перерегистрируется

**Это проблема?**
⚠️ Скорее всего нет - modals открываются редко, overhead минимальный.

**Оптимизация (если нужно):**

```typescript
// Разделить на 2 стабильных handler'а
const dismissAuthErrorHandler = useCallback(() => {
  dismissAuthError();
}, [dismissAuthError]);

const dismissOfflineSummaryHandler = useCallback(() => {
  acknowledgeOfflineSummary();
}, [acknowledgeOfflineSummary]);

// Создать роутер handler
const modalBackHandler = useCallback(() => {
  if (isAuthModalOpen) {
    dismissAuthErrorHandler();
    return;
  }

  if (offlineSummary) {
    dismissOfflineSummaryHandler();
  }
}, [isAuthModalOpen, offlineSummary, dismissAuthErrorHandler, dismissOfflineSummaryHandler]);
```

**НО** это усложняет код без реальной пользы. Текущая реализация OK.

---

#### Проблема 3: Lifecycle management - отличная реализация! (строки 124-148)

```typescript
useEffect(() => {
  if (!isInitialized) {
    return;
  }

  const handleVisibility = () => {
    if (document.hidden) {
      logoutSession(true); // keepalive: true
    } else {
      refreshSession();
    }
  };

  const handleBeforeUnload = () => {
    logoutSession(true);
  };

  document.addEventListener('visibilitychange', handleVisibility);
  window.addEventListener('beforeunload', handleBeforeUnload);

  return () => {
    document.removeEventListener('visibilitychange', handleVisibility);
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
}, [isInitialized, logoutSession, refreshSession]);
```

**Оценка:** ✅ **Отлично!**

**Что сделано правильно:**
1. ✅ Guard clause: не запускать до инициализации (`if (!isInitialized)`)
2. ✅ Cleanup: removeEventListener в return
3. ✅ keepalive: true для beforeunload (гарантирует отправку запроса даже при закрытии страницы)
4. ✅ Правильные dependencies: [isInitialized, logoutSession, refreshSession]

**Это типичный паттерн для idle games:**
- Background tab → сохранить pending energy на сервере
- Возврат в tab → обновить offline gains
- Закрытие приложения → финальная синхронизация

**Best Practice это и есть!** Никаких улучшений не требуется.

**Источники:**
- [Page Lifecycle API](https://developer.chrome.com/blog/page-lifecycle-api/)
- [Beacon API & keepalive](https://developer.mozilla.org/en-US/docs/Web/API/Beacon_API)

---

### Layer 3: API Integration

- **Оценка:** N/A (App.tsx не делает прямых API calls)
- **API contracts:** N/A
- **Error handling:** Делегируется в gameStore ✅

App.tsx вызывает store actions (`initGame`, `logoutSession`, `refreshSession`), которые внутри делают API calls. Это правильная архитектура - UI component не должен знать о HTTP requests.

---

### Layer 4: Design System Compliance (UI и стилизация)

- **Оценка:** 8/10
- **Tailwind usage:** ✅ Хорошо
- **Component composition:** ✅ Отлично

**Обнаруженные проблемы:**

#### Проблема 1: Inline tabs array вместо константы (строки 189-198)

```typescript
<TabBar
  tabs={
    [
      { id: 'home', icon: '🏠', label: 'Главная', title: 'Home' },
      { id: 'shop', icon: '🛍️', label: 'Магазин', title: 'Shop' },
      { id: 'boosts', icon: '🚀', label: 'Boost Hub', title: 'Boosts' },
      { id: 'builds', icon: '🏗️', label: 'Постройки', title: 'Buildings' },
      { id: 'leaderboard', icon: '🏆', label: 'Рейтинг', title: 'Leaderboard' },
      { id: 'profile', icon: '👤', label: 'Профиль', title: 'Profile' },
      { id: 'settings', icon: '⚙️', label: 'Настройки', title: 'Settings' },
    ] as TabBarItem[]
  }
  active={activeTab}
  onChange={tabId => setActiveTab(tabId as TabKey)}
/>
```

**Проблема:**
Массив tabs пересоздаётся при каждом рендере App.tsx → TabBar получает новый prop reference → может ререндериться даже если tabs не изменились.

**Root Cause:**
Inline array literal в JSX. Разработчик не подумал про memoization.

**Best Practice:**

```typescript
// Вынести наверх файла как константу
const TAB_ITEMS: TabBarItem[] = [
  { id: 'home', icon: '🏠', label: 'Главная', title: 'Home' },
  { id: 'shop', icon: '🛍️', label: 'Магазин', title: 'Shop' },
  { id: 'boosts', icon: '🚀', label: 'Boost Hub', title: 'Boosts' },
  { id: 'builds', icon: '🏗️', label: 'Постройки', title: 'Buildings' },
  { id: 'leaderboard', icon: '🏆', label: 'Рейтинг', title: 'Leaderboard' },
  { id: 'profile', icon: '👤', label: 'Профиль', title: 'Profile' },
  { id: 'settings', icon: '⚙️', label: 'Настройки', title: 'Settings' },
];

function App() {
  return (
    // ...
    <TabBar tabs={TAB_ITEMS} active={activeTab} onChange={setActiveTab} />
  );
}
```

**Или** использовать useMemo (если tabs зависят от runtime данных):

```typescript
const tabs = useMemo(() => [
  { id: 'home', icon: '🏠', label: 'Главная', title: 'Home' },
  // ...
], []); // Empty deps = создать один раз
```

**Влияние на performance:**
⚠️ Небольшое - TabBar, вероятно, использует React.memo или shallow comparison. Но лучше исправить для хорошей практики.

---

#### Проблема 2: Вычисление xpProgress в render (строки 175-179)

```typescript
<MainScreenHeader
  level={level}
  energy={energy}
  stars={stars}
  xpProgress={
    xpIntoLevel + xpToNextLevel > 0
      ? Math.min(1, xpIntoLevel / (xpIntoLevel + xpToNextLevel))
      : 0
  }
  onShopClick={() => setActiveTab('shop')}
  onSettingsClick={() => setActiveTab('settings')}
/>
```

**Проблема:**
Вычисление `xpProgress` происходит в render. Каждый раз когда App.tsx ререндерится, пересчитывается формула, даже если `xpIntoLevel` и `xpToNextLevel` не изменились.

**Root Cause:**
Inline computation для простоты.

**Это реальная проблема?**
🤔 Зависит от частоты ререндеров:
- Если App.tsx ререндерится редко → не проблема
- Если часто (например, из-за passive income updates) → overhead

**Best Practice:**

```typescript
const xpProgress = useMemo(() => {
  const total = xpIntoLevel + xpToNextLevel;
  return total > 0 ? Math.min(1, xpIntoLevel / total) : 0;
}, [xpIntoLevel, xpToNextLevel]);

<MainScreenHeader
  level={level}
  energy={energy}
  stars={stars}
  xpProgress={xpProgress}
  // ...
/>
```

**Или** (если MainScreenHeader использует React.memo):
Оставить как есть - React.memo в MainScreenHeader предотвратит ререндер если props не изменились.

**Исследовать дальше:**
Проверить `MainScreenHeader.tsx` - использует ли React.memo?

---

### Layer 5: Performance (Оптимизация)

- **Оценка:** 6/10
- **Unnecessary rerenders:** Потенциально есть
- **Bundle impact:** Low (App.tsx - entry point, загружается всегда)

**Обнаруженные проблемы:**

#### Проблема 1: Множественные селекторы могут вызывать частые ререндеры (строки 32-46)

```typescript
const energy = useGameStore(state => state.energy);
```

**Вопрос:** Как часто меняется `energy`?

**Из анализа gameStore.ts мы знаем:**
- Пассивный доход обновляет `energy` **каждую секунду** (строка 470 в gameStore.ts)
- Каждый тап обновляет `energy`
- Каждая покупка обновляет `energy`

**Значит:**
App.tsx подписан на `energy` → ререндерится **каждую секунду**!

**Это проблема?**
🟡 Зависит:
- ✅ Если App.tsx использует React.memo для children → дети не ререндерятся
- ❌ Если нет memo → весь App ререндерится каждую секунду

**Проверим что ререндерится:**

```typescript
return (
  <div>
    <MainScreenHeader energy={energy} /> {/* Получает новый energy каждую секунду */}
    <MainScreen activeTab={activeTab} /> {/* НЕ зависит от energy */}
    <TabBar /> {/* НЕ зависит от energy */}
    {/* Modals */}
  </div>
);
```

**MainScreenHeader** получает `energy` как prop → будет ререндериться каждую секунду (если нет memo).

**Best Practice:**

**Решение 1: Убрать energy из App.tsx**
Пусть MainScreenHeader сам подписывается на energy:

```typescript
// В MainScreenHeader.tsx
function MainScreenHeader({ level, stars, xpProgress, onShopClick, onSettingsClick }) {
  const energy = useGameStore(state => state.energy); // Подписка ВНУТРИ компонента

  return (
    // render energy
  );
}

// В App.tsx
<MainScreenHeader
  level={level}
  stars={stars}
  xpProgress={xpProgress}
  // Убрали energy prop
  onShopClick={() => setActiveTab('shop')}
  onSettingsClick={() => setActiveTab('settings')}
/>
```

**Преимущества:**
- ✅ App.tsx больше не ререндерится каждую секунду из-за energy
- ✅ Только MainScreenHeader ререндерится
- ✅ Меньше prop drilling

**Решение 2: React.memo для MainScreenHeader**

```typescript
// В MainScreenHeader.tsx
export const MainScreenHeader = React.memo(function MainScreenHeader(props) {
  // ...
});
```

Но это помогает только если props не меняются. Если `energy` prop меняется каждую секунду, memo не поможет.

**Рекомендация:** Использовать Решение 1 (переместить селектор в child component).

**Источники:**
- [React Rendering Behavior](https://blog.isquaredsoftware.com/2020/05/blogged-answers-a-mostly-complete-guide-to-react-rendering-behavior/)
- [Zustand Performance Tips](https://github.com/pmndrs/zustand#performance)

---

#### Проблема 2: Inline arrow functions в JSX (строки 180-181, 201)

```typescript
onShopClick={() => setActiveTab('shop')}
onSettingsClick={() => setActiveTab('settings')}
onChange={tabId => setActiveTab(tabId as TabKey)}
```

**Проблема:**
Каждый render создаёт новые функции → child components получают новые props → могут ререндериться даже если логика не изменилась.

**Это реальная проблема?**
🟡 Зависит от реализации child components:
- Если используют React.memo с shallow comparison → будут ререндериться
- Если не используют memo → всё равно ререндерятся, так что inline functions не влияют

**Best Practice:**

```typescript
const handleShopClick = useCallback(() => setActiveTab('shop'), []);
const handleSettingsClick = useCallback(() => setActiveTab('settings'), []);
const handleTabChange = useCallback((tabId: string) => {
  setActiveTab(tabId as TabKey);
}, []);

<MainScreenHeader
  onShopClick={handleShopClick}
  onSettingsClick={handleSettingsClick}
/>

<TabBar
  onChange={handleTabChange}
/>
```

**НО:** Это premature optimization если components не используют memo.

**Рекомендация:**
1. Профилировать в React DevTools
2. Если ререндеры проблема → добавить useCallback
3. Если нет → оставить как есть (код проще)

---

### Layer 6: Type Safety (TypeScript)

- **Оценка:** 9/10
- **TypeScript coverage:** 100%
- **`any` usage:** 0 ❌ (отлично!)

**Обнаруженные проблемы:**

#### Проблема 1: Type casting в onChange (строка 201)

```typescript
<TabBar
  onChange={tabId => setActiveTab(tabId as TabKey)}
/>
```

**Проблема:**
Type casting (`as TabKey`) обходит type checking. Если TabBar вернёт невалидный `tabId`, runtime error.

**Root Cause:**
TabBar.onChange определён как `(tabId: string) => void`, а `setActiveTab` ожидает `TabKey`. TypeScript требует явного casting.

**Это безопасно?**
✅ Да, **если** TabBar гарантирует что `tabId` всегда валидный.

Посмотрим на tabs array (строки 189-198):
```typescript
tabs={[
  { id: 'home', ... },
  { id: 'shop', ... },
  // ...
] as TabBarItem[]}
```

Все `id` - это валидные `TabKey`, так что casting безопасен.

**Best Practice:**

**Вариант 1: Runtime validation (defensive programming)**

```typescript
const handleTabChange = useCallback((tabId: string) => {
  if (isValidTabKey(tabId)) {
    setActiveTab(tabId);
  } else {
    console.error(`Invalid tab key: ${tabId}`);
  }
}, []);

function isValidTabKey(key: string): key is TabKey {
  return ['home', 'shop', 'boosts', 'builds', 'leaderboard', 'profile', 'settings'].includes(key);
}
```

**Вариант 2: Улучшить типы TabBar**

```typescript
// В TabBar.tsx
interface TabBarProps<T extends string> {
  tabs: Array<{ id: T; ... }>;
  active: T;
  onChange: (tabId: T) => void; // Generic type!
}

// В App.tsx
<TabBar<TabKey>
  tabs={TAB_ITEMS}
  active={activeTab}
  onChange={setActiveTab} // Теперь без casting!
/>
```

**Вариант 3: Оставить как есть**
Текущий код OK для MVP. Casting безопасен при текущей реализации.

---

#### Проблема 2: Дублирование TabKey type (строка 16)

```typescript
type TabKey = 'home' | 'shop' | 'boosts' | 'builds' | 'leaderboard' | 'profile' | 'settings';
```

**Вопрос:** Определён ли TabKey где-то ещё?

Проверим MainScreen.tsx (строка 41):
```typescript
type TabKey = 'home' | 'shop' | 'boosts' | 'builds' | 'leaderboard' | 'profile' | 'settings';
```

**🔴 ДУБЛИРОВАНИЕ!** Один и тот же type определён в двух файлах.

**Проблема:**
- Если добавить новую вкладку, нужно обновить в ДВУХ местах
- Риск несоответствия (забыть обновить один файл)

**Best Practice:**

```typescript
// types/navigation.ts (новый файл)
export type TabKey = 'home' | 'shop' | 'boosts' | 'builds' | 'leaderboard' | 'profile' | 'settings';

export interface TabBarItem {
  id: TabKey;
  icon: string;
  label: string;
  title: string;
}

// В App.tsx и MainScreen.tsx
import type { TabKey, TabBarItem } from './types/navigation';
```

**Или** (проще):
```typescript
// components/TabBar.tsx - экспортировать types вместе с component
export type TabKey = '...';
export type TabBarItem = { ... };
export function TabBar({ ... }) { ... }

// В App.tsx и MainScreen.tsx
import { TabBar, type TabKey, type TabBarItem } from './components/TabBar';
```

**Источники:**
- [TypeScript DRY Principle](https://www.typescriptlang.org/docs/handbook/2/types-from-types.html)
- [Organizing Types in TypeScript](https://www.totaltypescript.com/books/total-typescript-essentials/designing-your-types)

---

## 🔄 Анализ потоков и состояний

### User Flow 1: App Launch & Initialization

```
User opens Telegram Mini App
    ↓
main.tsx renders <App />
    ↓
App Component Mount
    ↓
1. useEffect: initializePreferenceCloudSync() [строка 51]
   (non-blocking, может упасть без влияния на основной flow)
    ↓
2. useEffect: initGame() [строка 114]
    ↓
    gameStore.initGame()
        ↓
        POST /auth/telegram { initData }
        ↓
        authStore.setTokens({ accessToken, refreshToken })
        ↓
        POST /session
        ↓
        set({ isInitialized: true, user, progress, inventory })
        ↓
    App re-renders with isInitialized = true
    ↓
3. useEffect: setup lifecycle listeners [строка 124]
   (только после isInitialized = true)
    ↓
    addEventListener('visibilitychange', ...)
    addEventListener('beforeunload', ...)
    ↓
4. Render UI:
   - MainScreenHeader (level, energy, stars, xpProgress)
   - MainScreen (activeTab = 'home')
   - TabBar (7 tabs)
   - Modals (все закрыты)
```

**Проблемы в потоке:**
1. ⚠️ `initializePreferenceCloudSync` может упасть, но только console.warn - хорошо
2. ✅ Lifecycle listeners устанавливаются только после инициализации - правильно
3. ⚠️ Если initGame упадёт → AuthErrorModal → user can retry

**Рекомендации:**
- Добавить loading state во время initGame (сейчас просто белый экран)
- Рассмотреть retry logic для initializePreferenceCloudSync

---

### User Flow 2: Level Up (Multiple Levels)

```
User gains XP (from taps/purchases)
    ↓
gameStore updates: level: 5 → level: 8 (gained 3 levels)
    ↓
App useEffect triggered (currentLevel dependency) [строка 73]
    ↓
1. Check: !hasBootstrappedLevelRef → skip (первый раз)
    ↓
2. Calculate: previousLevel = 5, currentLevel = 8
    ↓
3. Build array: gainedLevels = [6, 7, 8]
    ↓
4. Find major level:
   - Level 6: не major (6 % 5 !== 0)
   - Level 7: не major
   - Level 8: не major
   → majorLevel = undefined
    ↓
5. Filter minor levels: [6, 7, 8]
    ↓
6. For each minor level:
   - toast("Уровень 6! ...")
   - toast("Уровень 7! ...")
   - toast("Уровень 8! ...")
   - logClientEvent('level_up_toast', { level })
    ↓
7. Update ref: previousLevelRef.current = 8
```

**Проблемы:**
1. ⚠️ Показывает 3 toast одновременно - может быть overwhelming для user
2. ⚠️ Нет rate limiting на toast notifications
3. ✅ Логирование каждого level up - хорошо для analytics

**Рекомендации:**
- Рассмотреть batching: "Получено 3 уровня!" вместо 3 отдельных toast
- Или показывать только последний level: "Уровень 8!"

---

### User Flow 3: Tab Navigation

```
User clicks Tab (например, "Shop")
    ↓
TabBar.onChange(tabId = 'shop')
    ↓
App.handleTabChange(tabId as TabKey)
    ↓
setActiveTab('shop')
    ↓
App re-renders
    ↓
MainScreen receives: activeTab='shop', onTabChange
    ↓
MainScreen renders ShopPanel (lazy loaded)
    ↓
React.lazy() loads ShopPanel.tsx
    ↓
Suspense shows fallback: <ShopSkeleton />
    ↓
ShopPanel loaded → renders
```

**Проблемы:**
1. ✅ Lazy loading - отлично для bundle size
2. ✅ Skeleton fallback - хороший UX
3. ⚠️ Каждый раз загружает component (если user переключается туда-сюда)

**Рекомендации:**
- Рассмотреть preloading: когда user наводит на tab → preload component
- Или кешировать loaded components (но это усложняет код)

---

### User Flow 4: App Backgrounding (Tab Hidden)

```
User switches to another app / minimizes browser
    ↓
document.hidden = true
    ↓
'visibilitychange' event
    ↓
handleVisibility() [строка 129]
    ↓
logoutSession(true) // keepalive: true
    ↓
gameStore.logoutSession()
    ↓
1. flushPassiveIncome({ keepalive: true })
   → POST /tick with keepalive
    ↓
2. fetch('/session/logout', { keepalive: true })
    ↓
Server syncs pending passive income
    ↓
User returns to app
    ↓
document.hidden = false
    ↓
'visibilitychange' event
    ↓
refreshSession()
    ↓
POST /session
    ↓
Server calculates offline gains
    ↓
uiStore.setOfflineSummary({ energy, xp, duration_sec, capped })
    ↓
App re-renders
    ↓
OfflineSummaryModal opens (isOpen={!!offlineSummary})
    ↓
User sees: "Пока вас не было: +500E, +50XP, 5 мин"
    ↓
User clicks "Закрыть"
    ↓
acknowledgeOfflineSummary()
    ↓
uiStore.clearOfflineSummary()
    ↓
Modal closes
```

**Оценка:** ✅ **Отличная реализация!**

**Что сделано правильно:**
1. ✅ keepalive гарантирует отправку запроса даже при закрытии
2. ✅ Offline gains пересчитываются на сервере (anti-cheat)
3. ✅ OfflineSummaryModal показывает что user получил
4. ✅ Back button работает для закрытия modal (useTelegramBackButton)

**Никаких улучшений не требуется.**

---

## ⚠️ Критические риски и технический долг

### Risk 1: App.tsx ререндерится каждую секунду из-за passive income

- **Severity:** 🟡 Medium
- **Impact:**
  - Повышенный CPU usage на слабых устройствах
  - Батарея разряжается быстрее
  - Потенциальные UI jank'и
- **Probability:** High (происходит всегда когда приложение открыто)
- **Mitigation:**
  1. Переместить `energy` селектор из App.tsx в MainScreenHeader (приоритет 1)
  2. Добавить React.memo для всех child components
  3. Профилировать в React DevTools

---

### Risk 2: Level up логика в UI component

- **Severity:** 🟡 Medium
- **Impact:**
  - Сложность тестирования
  - Нельзя переиспользовать логику
  - Трудно добавлять новые level up effects
- **Probability:** Medium (станет проблемой при добавлении новых фич)
- **Mitigation:**
  - Вынести в custom hook `useLevelUpDetection`
  - Вынести game logic в service `levelProgressionService`

---

### Risk 3: Дублирование TabKey type

- **Severity:** 🟢 Low
- **Impact:**
  - Риск несоответствия при добавлении новых tabs
  - Maintenance overhead
- **Probability:** Low (tabs редко добавляются)
- **Mitigation:**
  - Создать shared type в `types/navigation.ts`

---

## Technical Debt 1: Рефакторинг level up detection в custom hook

- **Cost:** 4-6 часов
- **Impact:**
  - ✅ App.tsx станет на 40 строк проще
  - ✅ Логика переиспользуема
  - ✅ Легче тестировать
- **Recommendation:** Medium priority, можно сделать после MVP

---

## Technical Debt 2: Оптимизация ререндеров

- **Cost:** 2-3 часа
- **Impact:**
  - ✅ Меньше CPU usage
  - ✅ Лучшая battery life
  - ✅ Более плавный UI
- **Recommendation:** High priority, сделать перед production launch

**План:**
1. Профилировать в React DevTools (30 мин)
2. Переместить `energy` в MainScreenHeader (1 час)
3. Добавить React.memo для components которые ререндерятся часто (1 час)
4. Повторно профилировать, замерить улучшения (30 мин)

---

## 🔬 Глубокий анализ критичных проблем

### Проблема 1: Bootstrap flag pattern для useEffect (строки 79-82)

**Файл:** `webapp/src/App.tsx` (строки 47-48, 79-82)

**Описание:**
```typescript
const previousLevelRef = useRef(1);
const hasBootstrappedLevelRef = useRef(false);

useEffect(() => {
  // ...
  if (!hasBootstrappedLevelRef.current) {
    previousLevelRef.current = currentLevel;
    hasBootstrappedLevelRef.current = true;
    return;
  }
  // ...
}, [currentLevel, isInitialized, toast]);
```

**Root Cause Analysis:**

**Непосредственная причина:**
При первом рендере `currentLevel` может быть уже > 1 (если user вернулся в приложение). Нужно избежать ложного "level up" при инициализации.

**Глубинная причина:**
useEffect срабатывает на любое изменение `currentLevel`, но при mount это не настоящий "level up" - это просто загрузка начального state.

**Историческая причина:**
Это типичная проблема в React: как отличить "первый рендер" от "последующих обновлений"? Bootstrap flag - распространённое решение.

**Альтернативные решения:**

**Вариант 1: usePrevious hook (более чистый)**

```typescript
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

// В App.tsx
const previousLevel = usePrevious(currentLevel);

useEffect(() => {
  if (!isInitialized || previousLevel === undefined) {
    return;
  }

  if (currentLevel <= previousLevel) {
    return;
  }

  // Level up logic...
}, [currentLevel, previousLevel, isInitialized, toast]);
```

**Вариант 2: Вынести логику в gameStore**

Пусть gameStore сам эмитит "level_up_event", а App.tsx только слушает:

```typescript
// В gameStore
const levelUpListeners = new Set<(levels: number[]) => void>();

export function onLevelUp(listener: (levels: number[]) => void) {
  levelUpListeners.add(listener);
  return () => levelUpListeners.delete(listener);
}

// Внутри actions где level меняется:
if (newLevel > state.level) {
  const gainedLevels = Array.from({ length: newLevel - state.level }, (_, i) => state.level + i + 1);
  levelUpListeners.forEach(listener => listener(gainedLevels));
}

// В App.tsx
useEffect(() => {
  return onLevelUp((gainedLevels) => {
    // Level up logic
  });
}, []);
```

**Best Practice:**
Вариант 1 (usePrevious) - стандартный React паттерн, чище и понятнее.

**Источники:**
- [usePrevious hook - React Docs](https://react.dev/reference/react/useRef#referencing-a-value-with-a-ref)
- [usehooks.com/usePrevious](https://usehooks.com/useprevious/)

---

### Проблема 2: XP Progress calculation может давать NaN или Infinity (строки 175-179)

**Файл:** `webapp/src/App.tsx` (строки 175-179)

**Описание:**
```typescript
xpProgress={
  xpIntoLevel + xpToNextLevel > 0
    ? Math.min(1, xpIntoLevel / (xpIntoLevel + xpToNextLevel))
    : 0
}
```

**Анализ:**

**Проверка:** `xpIntoLevel + xpToNextLevel > 0`

**Edge cases:**
1. `xpIntoLevel = 0, xpToNextLevel = 0` → result = 0 ✅
2. `xpIntoLevel = 50, xpToNextLevel = 50` → result = 50 / 100 = 0.5 ✅
3. `xpIntoLevel = 100, xpToNextLevel = 0` → result = 100 / 100 = 1 ✅
4. `xpIntoLevel = -10, xpToNextLevel = 100` → result = -10 / 90 = -0.11 ❌

**Может ли быть отрицательное значение?**

Проверим gameStore.ts:
```typescript
xpIntoLevel: xp_into_level ?? Math.max(0, state.xpIntoLevel + xp_gained),
xpToNextLevel: xp_to_next_level ?? Math.max(0, state.xpToNextLevel - xp_gained),
```

`Math.max(0, ...)` гарантирует что значения >= 0. ✅

**Вывод:** Текущая реализация безопасна.

**Улучшение (для clarity):**

```typescript
const xpProgress = useMemo(() => {
  const total = xpIntoLevel + xpToNextLevel;
  if (total <= 0) return 0;

  const progress = xpIntoLevel / total;
  return Math.min(1, Math.max(0, progress)); // Clamp to [0, 1]
}, [xpIntoLevel, xpToNextLevel]);
```

**Или** добавить type guard:

```typescript
function calculateXPProgress(into: number, toNext: number): number {
  if (into < 0 || toNext < 0) {
    console.warn('Invalid XP values', { into, toNext });
    return 0;
  }

  const total = into + toNext;
  return total > 0 ? Math.min(1, into / total) : 0;
}
```

---

## 📊 Metrics & Complexity

| Метрика | Значение | Норма | Статус |
|---------|----------|-------|--------|
| Lines of Code | 235 | < 200 | ⚠️ Немного больше |
| Cyclomatic Complexity | ~12 | < 10 | ⚠️ Высокая |
| Number of useEffect | 4 | < 3 | ⚠️ Много |
| Number of useState | 3 | < 5 | ✅ OK |
| Number of useRef | 2 | < 3 | ✅ OK |
| Number of store selectors | 17 | < 10 | 🔴 Слишком много |
| Number of child components | 6 | < 10 | ✅ OK |
| TypeScript coverage | 100% | > 90% | ✅ Отлично |
| Props count (max) | 5 | < 8 | ✅ OK |

**Расшифровка Cyclomatic Complexity:**
- Level up detection useEffect: ~6 branches
- Visibility handler useEffect: ~2 branches
- modalBackHandler: ~2 branches
- shouldShowMajorLevel: ~4 branches

**Общая сложность:** High, но управляемая

---

## 🔗 Взаимосвязи и зависимости

### Карта зависимостей:

```
App.tsx (235 LOC)
  ├── Uses:
  │   ├── React (useEffect, useState, useCallback, useMemo, useRef)
  │   ├── ./store/gameStore (11 селекторов)
  │   ├── ./store/uiStore (6 селекторов)
  │   ├── ./screens/MainScreen
  │   ├── ./components/AuthErrorModal
  │   ├── ./components/OfflineSummaryModal
  │   ├── ./components/LevelUpScreen
  │   ├── ./components/NotificationContainer
  │   ├── ./components/TabBar
  │   ├── ./components/MainScreenHeader
  │   ├── ./hooks/useNotification
  │   ├── ./hooks/useTelegramBackButton
  │   ├── ./hooks/useSafeArea
  │   ├── ./services/telemetry (logClientEvent)
  │   └── ./services/preferencesSync (initializePreferenceCloudSync)
  │
  └── Used by:
      └── main.tsx (entry point)
```

### Критичные связи:

1. **gameStore → App.tsx**
   - 11 селекторов, особенно `energy` (обновляется каждую секунду)
   - Любое изменение в gameStore interface влияет на App.tsx

2. **App.tsx → MainScreen**
   - Передача `activeTab` и `onTabChange`
   - Тесная связь для navigation management

3. **App.tsx → Modals**
   - Управляет открытием/закрытием 3 модалок
   - uiStore state → modal visibility

### Potential ripple effects:

**Если добавить новую вкладку:**
1. Обновить `TabKey` type в App.tsx
2. Обновить `TabKey` type в MainScreen.tsx (дублирование!)
3. Добавить item в `tabs` array (строка 189)
4. Добавить case в MainScreen.renderActiveTab() (MainScreen.tsx:270)
5. Создать новый panel component

**Если изменить gameStore.level структуру:**
1. Обновить селектор в App.tsx (строки 41-42)
2. Обновить level up detection logic (строка 73-112)
3. Обновить MainScreenHeader prop (строка 172)

---

## 📚 Best Practices и источники

### Применимые паттерны:

#### 1. Container/Presentational Pattern

- **Описание:** Разделение логики (container) и UI (presentational)
- **Источник:** [Dan Abramov - Presentational and Container Components](https://medium.com/@dan_abramov/smart-and-dumb-components-7ca2f9a7c7d0)
- **Применение:** App.tsx - это Container, должен делегировать UI в Presentational components

**Пример:**
```typescript
// AppContainer.tsx (logic)
export function AppContainer() {
  const gameState = useAppGameState();
  const uiState = useAppUIState();
  const lifecycle = useAppLifecycle();
  const levelUp = useLevelUpDetection();

  return (
    <AppView
      gameState={gameState}
      uiState={uiState}
      onTabChange={/* ... */}
      // ...
    />
  );
}

// AppView.tsx (pure UI)
export function AppView({ gameState, uiState, onTabChange, ... }) {
  return (
    <div>
      <MainScreenHeader {...headerProps} />
      <MainScreen {...mainProps} />
      <TabBar {...tabProps} />
      {/* Modals */}
    </div>
  );
}
```

---

#### 2. Custom Hooks for Complex Logic

- **Описание:** Вынос сложной логики в переиспользуемые hooks
- **Источник:** [React Docs - Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)
- **Примеры в open-source:**
  - [usehooks.com](https://usehooks.com/)
  - [React Use](https://github.com/streamich/react-use)

**Для App.tsx:**
- `useLevelUpDetection(level, isInitialized)` - level up logic
- `useAppLifecycle(isInitialized)` - visibility/beforeunload
- `useAppNavigation(initialTab)` - tab management

---

#### 3. Compound Components Pattern

- **Описание:** Компоненты, которые работают вместе, но могут быть гибко настроены
- **Источник:** [Kent C. Dodds - Compound Components](https://kentcdodds.com/blog/compound-components-with-react-hooks)
- **Применение:** TabBar + Tab items

---

### Полезные ресурсы для углубления:

- 📖 [React Performance Optimization](https://react.dev/learn/render-and-commit)
- 📖 [React Lifecycle in Telegram Mini Apps](https://docs.telegram-mini-apps.com/platform/lifecycle)
- 🎥 [React Re-rendering Explained](https://www.youtube.com/watch?v=8pDqJVdNa44)
- 💻 [React Profiler API](https://react.dev/reference/react/Profiler)
- 📖 [When to useMemo and useCallback](https://kentcdodds.com/blog/usememo-and-usecallback)

---

## 🔭 Направления для дальнейшего исследования

### Приоритет 1 (Critical): Требует немедленного изучения

#### 1. **Профилирование ререндеров App.tsx**

**Что изучить:**
```bash
# 1. Открыть приложение
npm run dev

# 2. React DevTools → Profiler → Start
# 3. Подождать 30 секунд (пассивный доход)
# 4. Stop recording

# Вопросы:
- Сколько раз App.tsx ререндерился?
- Какие селекторы вызвали ререндеры?
- Ререндерились ли child components без необходимости?
```

**Ожидаемый результат:**
- Если >30 ререндеров за 30 секунд → проблема
- Найти селекторы которые меняются чаще всего
- План оптимизации: React.memo, перемещение селекторов

---

#### 2. **Проверить MainScreenHeader - использует ли React.memo?**

**Что изучить:**
```bash
# Прочитать файл
cat webapp/src/components/MainScreenHeader.tsx
# Или
grep "React.memo" webapp/src/components/MainScreenHeader.tsx
```

**Если НЕТ memo:**
- Добавить React.memo
- Или переместить `energy` селектор внутрь компонента

**Если ЕСТЬ memo:**
- Проверить: shallow comparison или custom comparison function?

---

### Приоритет 2 (High): Желательно исследовать в ближайшее время

#### 1. **Где ещё дублируется TabKey type?**

**Что изучить:**
```bash
grep -r "type TabKey" webapp/src --include="*.tsx" --include="*.ts"
```

**Ожидаемый результат:**
Список всех файлов с дублированием → создать shared type

---

#### 2. **Сколько toast notifications показывается одновременно?**

**Что изучить:**
- Gain 5 levels at once (например, с помощью cheat/dev tools)
- Посмотреть: показываются ли 5 toast сразу?
- Это UX проблема?

**Если ДА:**
Реализовать batching: "Получено 5 уровней!" вместо 5 отдельных toast

---

### Приоритет 3 (Medium): Полезно для полноты картины

#### 1. **Как часто вызывается initializePreferenceCloudSync?**

**Что изучить:**
```typescript
// Добавить logging
useEffect(() => {
  console.log('[App] Initializing preference cloud sync');
  initializePreferenceCloudSync()
    .then(() => console.log('[App] Preference sync OK'))
    .catch(error => console.warn('[App] Preference sync failed', error));
}, []);
```

**Проверить:**
- Вызывается ли только при mount?
- Как часто fails?
- Нужен ли retry logic?

---

### Открытые вопросы:

- ❓ **Почему `level` и `currentLevel` - две разные переменных для одного значения?**
  → Проверить git blame: когда это появилось? Oversight или intentional?

- ❓ **Есть ли requirement для deep linking (открыть app на конкретной вкладке)?**
  → Если да → переместить activeTab в uiStore + добавить URL routing

- ❓ **Почему level up logic в App.tsx, а не в gameStore?**
  → Это UI concern (показать modal/toast) или game logic (определить major level)?
  → Если game logic → переместить в store

- ❓ **Тестируется ли App.tsx?**
  → Проверить `webapp/src/App.test.tsx` или `webapp/src/__tests__/`
  → Если нет → создать integration tests

---

## 🎯 Выводы

**Краткое резюме:**
App.tsx - это **хорошо структурированный orchestrator component**, но с несколькими проблемами производительности и complexity. Главная проблема - **17 прямых обращений к stores**, что создаёт tight coupling и потенциальные ререндеры каждую секунду. Lifecycle management реализован отлично, но level up логика должна быть вынесена в custom hook.

**Ключевые инсайты:**

1. **App.tsx выполняет слишком много ролей одновременно**
   - Orchestrator (управление lifecycle)
   - Router (navigation state)
   - Game logic (level up detection)
   - UI (rendering children)

   Это не критично для MVP, но усложняет тестирование и поддержку.

2. **Дублирование переменных и типов указывает на недостаток refactoring**
   - `level` и `currentLevel` - одно и то же
   - `TabKey` определён в App.tsx и MainScreen.tsx
   - Это признаки "добавили быстро, не успели почистить"

3. **Lifecycle management - эталонная реализация**
   - Правильная обработка visibilitychange + beforeunload
   - keepalive для гарантированной отправки запроса
   - Guard clauses для предотвращения ошибок

   Это пример хорошего кода!

**Архитектурные наблюдения:**

- **Эволюция компонента видна в коде:**
  - Ранние части (lifecycle, initialization) - чистые и простые
  - Поздние части (level up logic) - сложные и запутанные
  - Признак добавления фич без рефакторинга

- **Баланс между простотой и оптимизацией:**
  - Inline functions (строки 180-181, 201) - простота кода
  - Inline computations (строка 175-179) - читаемость
  - НО: потенциальная проблема производительности

- **Tight coupling с gameStore - архитектурный trade-off:**
  - PRO: Быстрый доступ к данным, нет prop drilling
  - CON: Сложно тестировать, высокая связность
  - Решение: Custom hooks как промежуточный слой

**Рекомендуемые области для следующего анализа:**

1. **MainScreenHeader.tsx** - потому что получает props из App.tsx (level, energy, stars) и может ререндериться каждую секунду. Анализ покажет bottlenecks в header.

2. **MainScreen.tsx (446 LOC)** - потому что это второй по сложности компонент после gameStore, содержит routing logic и lazy loading. Связан с App.tsx через activeTab prop.

3. **Сравнительный анализ: BuildingsPanel.tsx (347 LOC) vs ShopPanel.tsx (627 LOC)** - почему ShopPanel почти в 2 раза больше? Есть ли дублирование логики покупок? Можно ли создать shared component?

4. **NotificationContainer + useNotification hook** - потому что используется для level up toasts, и важно понять как работает notification system (может ли показать 5 toast одновременно?).

---

## 📌 Следующий компонент для анализа

**Рекомендация:** **MainScreenHeader.tsx**

**Обоснование:**
1. **Performance critical:** Получает `energy` prop, который обновляется каждую секунду
2. **Связь с App.tsx:** Прямой child component, передаются 5 props
3. **Визуально важный:** Header всегда видим, любые lag'и заметны
4. **Потенциальные проблемы:** Если нет React.memo → ререндеры каждую секунду

**Ключевые вопросы для исследования:**
- Использует ли React.memo?
- Как рендерит energy (AnimatedNumber component?)?
- Есть ли expensive computations в render?
- Можно ли переместить `energy` селектор внутрь компонента?

**Альтернативные кандидаты:**
- **MainScreen.tsx (446 LOC)** - routing и lazy loading logic
- **BuildingsPanel.tsx (347 LOC)** - сложная логика покупок, N+1 API calls

---

**Конец отчёта.**
Дата: 2025-10-25
Аналитик: Claude Code (Senior Frontend Architect Agent)
Следующий шаг: Анализ MainScreenHeader.tsx для оптимизации performance
