# Code Analysis: gameStore.ts (Zustand Global State)

## 📊 Общая оценка: 4/10

**Компонент:** `webapp/src/store/gameStore.ts`
**LOC (Lines of Code):** 1104 строки
**Сложность:** Very High
**Дата анализа:** 2025-10-25

**Критичность:** 🔴 **CRITICAL** - Центральное хранилище состояния всего приложения

---

## ✅ Сильные стороны

1. **Типизация TypeScript**: Все интерфейсы state и API responses строго типизированы
2. **Централизованное state management**: Вся логика игры в одном месте (хотя это и минус)
3. **Error handling**: Присутствует обработка ошибок с типизированными responses
4. **Оптимистичные обновления**: Streak counter обновляется мгновенно, energy показывается с pending значениями
5. **Использование Zustand**: Современная библиотека state management с хорошими performance характеристиками
6. **Immutable updates**: Все обновления state используют spread operator (не мутируют напрямую)
7. **Telemetry integration**: Логирование критических событий через `logClientEvent`

---

## 🏗️ Архитектурный анализ по слоям

### Layer 1: Component Structure (God Object Antipattern)

- **Оценка:** 2/10
- **Обнаруженные проблемы:**

#### Проблема 1: God Object / Mega Store (строки 78-157)
```typescript
interface GameState {
  // User data (8 полей)
  userId, username, level, xp, xpIntoLevel, xpToNextLevel, tapLevel, tapIncome...

  // Energy & passive income (7 полей)
  energy, stars, passiveIncomePerSec, passiveIncomeMultiplier...

  // Streak system (4 поля)
  streakCount, bestStreak, isCriticalStreak, lastTapAt...

  // Buildings (6 полей)
  buildings, buildingsError, isProcessingBuildingId, buildingCatalog...

  // Cosmetics (6 полей)
  cosmetics, cosmeticsLoaded, isCosmeticsLoading, cosmeticsError...

  // Star Packs (6 полей)
  starPacks, starPacksLoaded, isStarPacksLoading, starPacksError...

  // Boost Hub (5 полей)
  boostHub, boostHubLoaded, isBoostHubLoading, boostHubError...

  // Session (2 поля)
  sessionLastSyncedAt, sessionErrorMessage...

  // Leaderboard (6 полей)
  leaderboardEntries, leaderboardLoaded, isLeaderboardLoading...

  // Profile (4 поля)
  profile, profileBoosts, isProfileLoading, profileError...

  // Game state (2 поля)
  isLoading, isInitialized...

  // Actions (17 методов!!!)
  initGame, tap, upgrade, resetStreak, configurePassiveIncome...
}
```

**Итого:**
- 56+ полей state
- 17 action методов
- 1104 строки кода в ОДНОМ файле

**Root Cause Analysis:**
Store начинался как простое хранилище user data и energy, но по мере развития проекта в него добавлялись новые фичи (buildings, cosmetics, boosts, leaderboard, profile). Вместо разделения на отдельные stores (по доменам), все складывалось в один файл. Вероятно:
- Отсутствие архитектурного планирования на старте
- Быстрая разработка MVP под deadline
- Недостаток понимания Zustand best practices (разделение на slices)

**Best Practice:**
Zustand рекомендует разделять большие stores на **slices** (срезы) по доменам:
- `useUserStore` - user profile, level, XP
- `useEnergyStore` - energy, tap mechanics, streak
- `useBuildingsStore` - buildings inventory, catalog
- `useCosmeticsStore` - cosmetics, shop items
- `useLeaderboardStore` - leaderboard data
- `useSessionStore` - session management, offline gains

**Источник:** [Zustand Slices Pattern](https://github.com/pmndrs/zustand#slices-pattern)

**Взаимосвязи:**
Этот God Object используется в **27 местах** кода (по результатам grep). Каждый компонент вытягивает нужные поля через селекторы, но это создаёт:
- Сложность понимания data flow
- Риск ненужных ререндеров (если селекторы написаны неправильно)
- Невозможность переиспользовать логику в других проектах

**Исследовать дальше:**
- Проверить все компоненты, использующие `useGameStore` - какие поля они реально используют?
- Построить dependency graph - какие части state независимы друг от друга?
- Измерить ререндеры компонентов при изменении несвязанных частей state

---

#### Проблема 2: Глобальные переменные вне Zustand store (строки 74-76)

```typescript
let passiveTicker: ReturnType<typeof setInterval> | null = null;
let passiveFlushTimer: ReturnType<typeof setInterval> | null = null;
let passiveFlushInFlight = false;
```

**Root Cause Analysis:**
setInterval возвращает ID таймера, который нужно где-то хранить для clearInterval. Разработчик выбрал глобальные переменные вместо хранения в Zustand state, потому что:
- Проще в реализации (не нужно обновлять state каждый раз)
- setInterval ID не нужен для UI (не влияет на рендеринг)
- Возможно, попытка избежать лишних ререндеров

**НО:**
- Нарушает архитектуру Zustand (state должен быть в store)
- Усложняет тестирование (глобальные переменные = side effects)
- Потенциальная утечка памяти при hot reload в dev mode
- Нарушает Functional Programming принципы

**Best Practice:**
Хранить timer IDs в state или использовать `useRef` в компоненте, который управляет пассивным доходом:

```typescript
// Вариант 1: В Zustand state
interface GameState {
  _passiveTicker: number | null; // private field
  _passiveFlushTimer: number | null;
  _passiveFlushInFlight: boolean;
}

// Вариант 2: В React component с useRef (лучше!)
function PassiveIncomeManager() {
  const tickerRef = useRef<number | null>(null);
  const flushTimerRef = useRef<number | null>(null);

  useEffect(() => {
    // Start timers
    return () => {
      // Cleanup
      if (tickerRef.current) clearInterval(tickerRef.current);
      if (flushTimerRef.current) clearInterval(flushTimerRef.current);
    };
  }, []);
}
```

**Источник:**
- [React useRef for mutable values](https://react.dev/reference/react/useRef#referencing-a-value-with-a-ref)
- [Zustand Best Practices](https://github.com/pmndrs/zustand/wiki/Best-Practices)

**Взаимосвязи:**
`passiveTicker` обновляет `energy` каждую секунду → вызывает ререндер всех компонентов, подписанных на `energy` → может влиять на производительность

**Исследовать дальше:**
- Замерить влияние на производительность: сколько компонентов ререндерится каждую секунду?
- Рассмотреть паттерн "debounced selectors" для оптимизации
- Проверить, есть ли утечки памяти при hot reload

---

### Layer 2: State Management (Структура и организация)

- **Оценка:** 5/10
- **State flow diagram:**

```
User Action (Tap/Purchase)
    ↓
Component Event Handler
    ↓
gameStore Action (tap/purchaseBuilding)
    ↓
API Call (apiClient.post)
    ↓
Response Handling
    ↓
Zustand set() → State Update
    ↓
Component Re-render (selective via selectors)
```

**Дополнительный поток (пассивный доход):**
```
setInterval (1 sec)
    ↓
Update pendingPassiveEnergy
    ↓
Every 15 sec: flushPassiveIncome()
    ↓
POST /tick → Server sync
```

**Обнаруженные проблемы:**

#### Проблема 1: Смешивание state, business logic и API calls (вся файл)

**Что не так:**
Zustand store должен содержать только state и простые reducers. Сложная бизнес-логика и API интеграция должны быть вынесены в отдельные слои:
- **Services** - API calls, data fetching
- **Hooks** - реиспользуемая логика с side effects
- **Store** - только state + простые setters/getters

**Текущая реализация:**
Store делает ВСЁ:
- Хранит state ✅
- Делает API calls ❌ (должно быть в services)
- Обрабатывает ошибки ❌ (должно быть в services)
- Управляет таймерами ❌ (должно быть в hooks/components)
- Бизнес-логика (streak, passive income) ❌ (должно быть в services)

**Best Practice - Clean Architecture:**

```
┌─────────────────────────────────────────┐
│         Components (UI Layer)           │
│  - Только рендеринг и user interaction  │
└────────────────┬────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│      Custom Hooks (Logic Layer)         │
│  - usePassiveIncome, useTapMechanics    │
└────────────────┬────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│       Services (Data Layer)             │
│  - API calls, data transformation       │
└────────────────┬────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│      Zustand Store (State Layer)        │
│  - Только state + простые setters       │
└─────────────────────────────────────────┘
```

**Root Cause Analysis:**
Разработчик следовал примеру из Zustand документации, где actions объявляются внутри store. Это работает для простых случаев, но не масштабируется на большие приложения. Возможно:
- Нехватка опыта с Clean Architecture
- Отсутствие code review на раннем этапе
- Фокус на скорости разработки MVP

**Источники:**
- [Clean Architecture by Uncle Bob](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Feature-Sliced Design](https://feature-sliced.design/)

---

#### Проблема 2: Дублирование логики между initGame и refreshSession (строки 248-378 и 484-561)

Оба метода делают почти одно и то же:
1. POST /session
2. Парсят user, progress, offline_gains, inventory
3. Обновляют state одинаковыми полями
4. Вызывают `configurePassiveIncome`

**Дублирование кода:**
- Маппинг `inventory` → `buildings` (строки 294, 489)
- Расчёт `offlineSummary` (строки 296-318, 491-513)
- Обновление state (строки 322-345, 523-540)

**Root Cause:**
Copy-paste programming. `refreshSession` был добавлен позже и скопирован из `initGame`, но не вынесен в общую функцию.

**Best Practice:**
Вынести общую логику в приватную функцию:

```typescript
function _syncSessionData(response: SessionResponse, previousLevel: number) {
  const { user, progress, offline_gains, inventory } = response.data;
  const buildings = Array.isArray(inventory) ? inventory.map(mapBuilding) : [];

  const offlineSummary = calculateOfflineSummary(offline_gains, previousLevel, progress.level);

  return {
    stateUpdates: {
      userId: user.id,
      username: user.username,
      // ...
    },
    offlineSummary,
    passiveConfig: {
      perSec: progress.passive_income_per_sec ?? 0,
      multiplier: progress.passive_income_multiplier ?? 1,
    },
  };
}
```

**Взаимосвязи:**
Если в логике обновления сессии обнаружится баг, его нужно будет фиксить в ДВУХ местах → риск несоответствия.

---

#### Проблема 3: Сложная логика в purchaseBuilding с циклами и partial success (строки 869-951)

```typescript
purchaseBuilding: async (buildingId: string, quantity = 1) => {
  let successfulPurchases = 0;
  let lastResponse: UpgradeResponsePayload | null = null;

  try {
    for (let index = 0; index < quantity; index += 1) {
      try {
        const response = await apiClient.post(...);
        successfulPurchases += 1;
        lastResponse = payload;

        // Update state after EACH purchase
        set(state => ({ ... }));
      } catch (iterationError) {
        if (successfulPurchases > 0) {
          await logClientEvent('building_purchase_partial', ...);
          await get().refreshSession();
        }
        throw iterationError;
      }
    }
  } catch (error) {
    // Final error handling
  }
}
```

**Что не так:**
1. **N+1 API calls**: Покупка 10 построек = 10 отдельных HTTP запросов
2. **Partial success handling**: Усложняет логику и state consistency
3. **State updates в цикле**: Может вызывать множественные ререндеры
4. **Смешивание concerns**: Retry logic + error logging + state updates в одном месте

**Root Cause Analysis:**
Backend API `/upgrade` не поддерживает batch purchases (купить несколько построек одним запросом). Фронтенд вынужден делать multiple requests. Разработчик добавил partial success handling, чтобы:
- Не терять прогресс пользователя если 5 из 10 покупок прошли
- Показывать более детальные ошибки

**НО:**
Это создаёт complexity и потенциальные проблемы:
- Race conditions (что если пользователь закроет приложение в середине цикла?)
- Inconsistent state (pending energy не синхронизирован с server)
- Плохой UX (долгие задержки при покупке 10+ построек)

**Best Practice:**
**Вариант 1:** Добавить batch endpoint на backend:
```typescript
POST /upgrade/batch
{
  "building_id": "solar_panel",
  "quantity": 10
}
```

**Вариант 2:** Использовать optimistic updates:
```typescript
// 1. Обновить UI сразу (optimistic)
set(state => ({
  energy: state.energy - (cost * quantity),
  buildings: updateBuildingCount(state.buildings, buildingId, quantity),
}));

// 2. Отправить один запрос на backend
try {
  await apiClient.post('/upgrade/bulk', { building_id, quantity });
} catch (error) {
  // 3. Rollback при ошибке
  await get().refreshSession();
}
```

**Источники:**
- [Optimistic UI Patterns](https://www.apollographql.com/docs/react/performance/optimistic-ui/)
- [React Query Optimistic Updates](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)

**Взаимосвязи:**
Влияет на UX в `BuildingsPanel.tsx` → медленные покупки → плохой feedback

---

### Layer 3: API Integration (Прямые API calls в store)

- **Оценка:** 4/10
- **API contracts:** ✅ Типизированы
- **Error handling:** ⚠️ Частично (есть, но смешано с бизнес-логикой)
- **Loading states:** ✅ Присутствуют (`isLoading`, `isProcessing*`)

**Обнаруженные проблемы:**

#### Проблема 1: API calls разбросаны по всему store (множество строк)

**Примеры:**
- `apiClient.post('/auth/telegram')` - строка 258
- `apiClient.post('/session')` - строки 270, 488
- `apiClient.post('/tap')` - строка 385
- `apiClient.post('/upgrade')` - строки 428, 889, 964
- `apiClient.post('/tick')` - строка 842
- `apiClient.post('/purchase/invoice')` - строка 730
- `fetch('/tick')` с keepalive - строка 830

**Root Cause:**
Store взял на себя роль API client слоя. В начале это казалось удобным (всё в одном месте), но по мере роста привело к:
- Невозможности переиспользовать API calls в других местах
- Сложности тестирования (нужно мокать apiClient в каждом тесте store)
- Дублирование error handling логики

**Best Practice:**
Вынести все API calls в отдельные service файлы:

```typescript
// services/sessionService.ts
export async function startSession() {
  const response = await apiClient.post('/session');
  return response.data;
}

export async function syncPassiveIncome(timeDelta: number) {
  const response = await apiClient.post('/tick', { time_delta: timeDelta });
  return response.data;
}

// В gameStore.ts
import { startSession, syncPassiveIncome } from '../services/sessionService';

initGame: async () => {
  const sessionData = await startSession();
  set({ /* обновление state */ });
}
```

**Преимущества:**
- ✅ Тестируемость (легко мокать services)
- ✅ Переиспользуемость (сервисы можно вызвать откуда угодно)
- ✅ Разделение ответственности (store = state, services = data fetching)
- ✅ Type safety (один источник правды для API contracts)

**Источники:**
- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)
- [Service Layer Pattern](https://martinfowler.com/eaaCatalog/serviceLayer.html)

**Примечание:**
В проекте уже есть `/services/` папка с файлами (`cosmetics.ts`, `buildings.ts`, `leaderboard.ts` и т.д.), которые экспортируют fetch функции. Это ПРАВИЛЬНЫЙ подход! Но gameStore не следует этому паттерну для core endpoints (`/tap`, `/session`, `/upgrade`).

**Исследовать дальше:**
- Почему core endpoints не вынесены в services?
- Проверить consistency между существующими services и inline API calls

---

#### Проблема 2: Различные методы fetch (apiClient vs native fetch) (строки 385, 830)

**apiClient.post:**
```typescript
const response = await apiClient.post('/tap', { tap_count: count });
```

**Native fetch с keepalive:**
```typescript
const response = await fetch(`${API_BASE_URL}/tick`, {
  method: 'POST',
  body: JSON.stringify({ time_delta: pendingSeconds }),
  headers,
  keepalive: true,
});
```

**Root Cause:**
`keepalive: true` нужен для отправки запроса при закрытии страницы (`beforeunload`, `visibilitychange`). Axios (который используется в `apiClient`) не поддерживает `keepalive`, поэтому разработчик использовал native fetch.

**Проблема:**
- Inconsistent API - два разных способа делать HTTP запросы
- Дублирование логики (headers, error handling)
- Сложность понимания: почему здесь fetch, а там apiClient?

**Best Practice:**
Обернуть оба случая в сервис с единым интерфейсом:

```typescript
// services/apiClient.ts
export async function post(
  url: string,
  data: unknown,
  options?: { keepalive?: boolean }
) {
  if (options?.keepalive) {
    return nativeFetchPost(url, data, { keepalive: true });
  }
  return axiosClient.post(url, data);
}

// В store
await apiClient.post('/tick', { time_delta }, { keepalive: true });
```

---

### Layer 4: Design System Compliance

- **Оценка:** N/A (не применимо к store файлу)
- Store не содержит UI/styling кода

---

### Layer 5: Performance (Оптимизация производительности)

- **Оценка:** 6/10
- **Unnecessary rerenders:** Потенциально высокий риск
- **Bundle impact:** High (1104 LOC в одном файле)

**Обнаруженные проблемы:**

#### Проблема 1: Passive income ticker обновляет state каждую секунду (строки 468-474)

```typescript
passiveTicker = setInterval(() => {
  set(state => ({
    energy: state.energy + perSec,
    pendingPassiveEnergy: state.pendingPassiveEnergy + perSec,
    pendingPassiveSeconds: state.pendingPassiveSeconds + 1,
  }));
}, 1000);
```

**Что происходит:**
- Каждую секунду вызывается `set()` → обновляет state
- Все компоненты, подписанные на `energy`, `pendingPassiveEnergy` или `pendingPassiveSeconds`, ререндерятся
- При 10+ компонентах на экране → 10+ ререндеров в секунду

**Root Cause:**
Нужно показывать пользователю растущую энергию в реальном времени (для engagement). Но обновление global state каждую секунду - это overhead.

**Best Practice:**
Использовать **локальный state** для UI-only updates:

```typescript
// В компоненте, который показывает energy
function EnergyDisplay() {
  const baseEnergy = useGameStore(state => state.energy);
  const passivePerSec = useGameStore(state => state.passiveIncomePerSec);
  const [displayEnergy, setDisplayEnergy] = useState(baseEnergy);

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayEnergy(prev => prev + passivePerSec);
    }, 1000);
    return () => clearInterval(interval);
  }, [passivePerSec]);

  return <div>{displayEnergy.toFixed(0)}</div>;
}
```

**Преимущества:**
- ✅ Глобальный state НЕ обновляется каждую секунду
- ✅ Только один компонент ререндерится (EnergyDisplay)
- ✅ Меньше нагрузка на Zustand
- ✅ Проще тестировать

**Источники:**
- [When to use local vs global state](https://kentcdodds.com/blog/application-state-management-with-react)
- [Zustand Performance Tips](https://github.com/pmndrs/zustand#performance)

**Исследовать дальше:**
- Профилировать в React DevTools → сколько компонентов ререндерятся каждую секунду?
- Замерить FPS при открытом приложении

---

#### Проблема 2: Большой bundle size одного файла (1104 LOC)

**Impact на build:**
- Весь store загружается сразу (не lazy)
- Все dependencies загружаются (axios, services, telemetry)
- Увеличивает initial bundle size

**Best Practice:**
- Разделить на slices (как описано выше)
- Lazy load редко используемые части (leaderboard, profile)

```typescript
// Вместо:
import { useGameStore } from './store/gameStore'; // вся 1104 строки

// Можно:
const useLeaderboardStore = lazy(() => import('./store/leaderboardStore'));
```

---

### Layer 6: Type Safety (TypeScript строгость)

- **Оценка:** 8/10
- **TypeScript coverage:** ~95%
- **`any` usage:** Минимальное (1-2 места)

**Обнаруженные проблемы:**

#### Проблема 1: Опциональные поля в API responses без type guards (строки 46-53, 55-69)

```typescript
interface TickSyncResponse {
  energy: number;
  level: number;
  xp_gained?: number; // Опциональное поле
  xp_into_level?: number;
  xp_to_next_level?: number;
  passive_income_per_sec?: number;
}
```

**Использование:**
```typescript
const passivePerSec = payload.passive_income_per_sec ?? 0; // ✅ Хорошо
xpIntoLevel: payload.xp_into_level ?? Math.max(0, state.xpIntoLevel) // ✅ Хорошо
```

**Оценка:** ✅ Хорошо - используется nullish coalescing (`??`) для fallback значений

**НО:** Нет runtime валидации. Если backend вернёт `xp_into_level: "invalid"` (string вместо number), TypeScript не поможет в runtime.

**Best Practice:**
Использовать runtime type validation (Zod, io-ts):

```typescript
import { z } from 'zod';

const TickSyncResponseSchema = z.object({
  energy: z.number(),
  level: z.number(),
  xp_gained: z.number().optional(),
  xp_into_level: z.number().optional(),
});

// В store action
const payload = TickSyncResponseSchema.parse(response.data);
```

**Источники:**
- [Zod Documentation](https://zod.dev/)
- [Why runtime validation matters](https://www.totaltypescript.com/concepts/runtime-validation)

---

## 🔄 Анализ потоков и состояний

### User Flow 1: Tap Action

```
User taps planet
    ↓
HomePanel.onTap() → MainScreen.handleTap()
    ↓
useGameStore().tap(1)
    ↓
1. await flushPassiveIncome() [синк pending energy с сервером]
    ↓
2. POST /tap { tap_count: 1 }
    ↓
3. Server Response: { energy, energy_gained, xp_gained, level, boost_multiplier }
    ↓
4. Update local state:
   - energy (optimistic: max(server + pending, current + gained))
   - xp, level, xpIntoLevel, xpToNextLevel
   - streakCount (+1)
   - isCriticalStreak (if streak % 25 === 0)
    ↓
5. triggerHapticImpact()
    ↓
6. Component re-render → UI updates
```

**Проблемы в потоке:**
1. **Последовательные async calls**: `flushPassiveIncome()` должен завершиться перед `/tap` → увеличивает latency
2. **Оптимистичное обновление energy**: Использует `Math.max(serverEnergy + pendingPassive, currentEnergy + gained)` → может давать inconsistent результат если `flushPassiveIncome` не успел синхронизироваться
3. **Нет debounce**: Rapid taps → множественные API calls

**Рекомендации:**
- Добавить debounce (например, батчить тапы: 3 тапа за 500ms → 1 запрос `tap_count: 3`)
- Сделать `flushPassiveIncome` неблокирующим для tap action

---

### User Flow 2: Purchase Building

```
User clicks "Buy Building x10"
    ↓
BuildingCard.onPurchase(buildingId, 10)
    ↓
useGameStore().purchaseBuilding(buildingId, 10)
    ↓
1. await flushPassiveIncome() [блокирующий]
    ↓
2. Loop: for (i = 0; i < 10; i++)
    ↓
    2.1. POST /upgrade { building_id, action: 'purchase' } [КАЖДЫЙ в отдельном HTTP запросе]
    ↓
    2.2. Update state after EACH purchase
    ↓
    2.3. If error → log partial success → throw
    ↓
3. await refreshSession() [полная синхронизация с сервером]
    ↓
4. Component re-render → UI updates
```

**Проблемы:**
1. **N+1 API calls**: 10 покупок = 10 HTTP requests (~2-5 секунд total)
2. **Блокирующий UI**: Пока идут запросы, пользователь не может ничего делать
3. **Partial success complexity**: Сложная обработка ошибок в середине цикла
4. **Множественные ререндеры**: После каждой покупки обновляется state → 10 ререндеров

**Рекомендации:**
- Backend: добавить bulk purchase endpoint
- Frontend: optimistic UI updates (сразу показать результат, синхронизировать потом)

---

### User Flow 3: Passive Income (Background Process)

```
App initialization
    ↓
configurePassiveIncome(perSec, multiplier)
    ↓
Start passiveTicker: setInterval(1000ms)
    ↓
Every second:
    - energy += perSec
    - pendingPassiveEnergy += perSec
    - pendingPassiveSeconds += 1
    ↓
Every 15 seconds: passiveFlushTimer
    ↓
flushPassiveIncome()
    ↓
POST /tick { time_delta: pendingPassiveSeconds }
    ↓
Server validates and returns actual energy
    ↓
Update state:
    - energy = server value
    - pendingPassiveEnergy = 0
    - pendingPassiveSeconds = 0
```

**Проблемы:**
1. **Глобальные timers**: `passiveTicker`, `passiveFlushTimer` - вне React lifecycle
2. **Potential drift**: Локальное начисление может не совпадать с серверным (из-за boosts, server-side validation)
3. **No error recovery**: Если `/tick` request fails → pending energy теряется
4. **Cleanup issues**: Если пользователь закрывает страницу → timers не очищаются должным образом

**Рекомендации:**
- Переместить timer логику в React component с `useEffect`
- Добавить retry logic для failed `/tick` requests
- Хранить `pendingPassiveSeconds` в localStorage для persistence

---

## 🔌 API Contracts Review

### Endpoint: `POST /api/v1/tap`

**Request Type:**
```typescript
{
  tap_count: number;
}
```

**Response Type:**
```typescript
{
  energy: number;
  energy_gained: number;
  xp_gained: number;
  level: number;
  level_up: boolean;
  xp_into_level: number;
  xp_to_next_level: number;
  boost_multiplier?: number;
}
```

**Проблемы:**
- [ ] Request типизирован? ❌ (инлайн в коде, нет интерфейса)
- [x] Response типизирован? ⚠️ (частично, через destructuring)
- [x] Error handling? ✅
- [ ] Retry logic? ❌

**Рекомендация:**
Создать explicit типы:

```typescript
// types/api.ts
export interface TapRequest {
  tap_count: number;
}

export interface TapResponse {
  energy: number;
  energy_gained: number;
  xp_gained: number;
  level: number;
  level_up: boolean;
  xp_into_level: number;
  xp_to_next_level: number;
  boost_multiplier?: number;
}

// В store
const response = await apiClient.post<TapResponse>('/tap', {
  tap_count: count,
} satisfies TapRequest);
```

---

### Endpoint: `POST /api/v1/upgrade`

**Request Type:**
```typescript
{
  building_id: string;
  action: 'purchase' | 'upgrade';
}
```

**Response Type:**
```typescript
interface UpgradeResponsePayload {
  energy?: number;
  level?: number;
  xp_gained?: number;
  xp_into_level?: number;
  xp_to_next_level?: number;
  building?: {
    building_id: string;
    count: number;
    level: number;
    income_per_sec: number;
    next_cost: number;
    next_upgrade_cost: number;
  };
}
```

**Проблемы:**
- [x] Request типизирован? ⚠️ (инлайн, нет интерфейса)
- [x] Response типизирован? ✅ (`UpgradeResponsePayload`)
- [x] Error handling? ✅
- [ ] Retry logic? ❌
- [ ] Bulk operations? ❌ (нет batch endpoint)

---

## ⚠️ Критические риски и технический долг

### Risk 1: God Object затрудняет масштабирование

- **Severity:** 🔴 Critical
- **Impact:**
  - Невозможно добавлять новые фичи без усложнения store
  - Сложность onboarding новых разработчиков
  - Высокий риск багов при изменениях (ripple effects)
- **Probability:** High (уже проявляется)
- **Mitigation:**
  1. Разделить на domain-specific slices (приоритет 1)
  2. Вынести API calls в services (приоритет 2)
  3. Создать архитектурную документацию

### Risk 2: Глобальные timers вне React lifecycle

- **Severity:** 🟠 High
- **Impact:**
  - Потенциальные memory leaks
  - Сложность тестирования
  - Проблемы при hot reload в development
- **Probability:** Medium
- **Mitigation:**
  - Переместить в React component с useEffect
  - Добавить cleanup функции
  - Написать тесты для timer logic

### Risk 3: N+1 API calls при bulk purchases

- **Severity:** 🟡 Medium
- **Impact:**
  - Плохой UX (медленные покупки)
  - Повышенная нагрузка на backend
  - Риск rate limiting
- **Probability:** High (происходит регулярно)
- **Mitigation:**
  - Backend: добавить batch endpoint
  - Frontend: optimistic updates

---

## Technical Debt 1: Разделение на slices

- **Cost:** 16-24 часа (2-3 рабочих дня)
- **Impact:**
  - ✅ Улучшит maintainability
  - ✅ Упростит тестирование
  - ✅ Позволит lazy loading редких features
  - ⚠️ Требует изменений во всех компонентах, использующих store
- **Recommendation:** Выполнить в ближайшем sprint after MVP launch

**План рефакторинга:**
1. Создать отдельные stores:
   - `userStore.ts` (user, level, xp)
   - `energyStore.ts` (energy, tap, streak)
   - `buildingsStore.ts`
   - `cosmeticsStore.ts`
   - `sessionStore.ts`
2. Обновить все компоненты (27 файлов)
3. Написать миграционные тесты
4. Постепенный rollout (feature flag)

---

## Technical Debt 2: Вынести API calls в services

- **Cost:** 8-12 часов
- **Impact:**
  - ✅ Легче тестировать
  - ✅ Переиспользуемость
  - ✅ Консистентность с существующими services
- **Recommendation:** Высокий приоритет, можно делать параллельно с разработкой новых фич

**Endpoints для миграции:**
- `/auth/telegram` → `authService.ts`
- `/session`, `/session/logout` → `sessionService.ts`
- `/tap` → `tapService.ts`
- `/upgrade` → `upgradeService.ts`
- `/tick` → `sessionService.ts`

---

## 🔬 Глубокий анализ критичных проблем

### Проблема 1: Смешивание sync и async state updates

**Файл:** `webapp/src/store/gameStore.ts` (строки 403-414)

**Описание:**
```typescript
tap: async (count: number) => {
  // 1. Async: wait for server
  await get().flushPassiveIncome();
  const response = await apiClient.post('/tap', { tap_count: count });

  // 2. Sync: calculate new streak (client-side)
  const previousStreak = get().streakCount;
  const newStreak = previousStreak + count;
  const isCritical = newStreak > 0 && newStreak % STREAK_CRIT_THRESHOLD === 0;

  // 3. Mixed: server data + client calculations
  set(state => ({
    energy: Math.max(serverEnergy + state.pendingPassiveEnergy, state.energy + energyGained),
    // ^^^ Почему Math.max? Какие edge cases?
    level,
    xp: state.xp + xp_gained,
    streakCount: newStreak, // Client-side only
    isCriticalStreak: isCritical, // Client-side only
  }));
}
```

**Root Cause Analysis:**

**Непосредственная причина:**
Streak counter управляется только на клиенте (server не знает о нем). Energy приходит от сервера, но с учетом pending passive income нужно делать Math.max.

**Глубинная причина:**
Разделение ответственности между client и server недостаточно четкое:
- Что должен валидировать сервер? (energy, XP, level)
- Что может быть только на клиенте? (streak для UI feedback)
- Как синхронизировать в случае рассинхронизации?

**Исторический контекст:**
Вероятно, streak был добавлен позже как "gamification фича" для улучшения engagement. Разработчик решил не усложнять backend и хранить его только на клиенте. Но это создало смешивание server state и client-only state.

**Взаимосвязи:**
- **Зависимые компоненты:** `HomePanel.tsx` показывает streakCount → если клиент и сервер рассинхронизируются, пользователь может увидеть неправильные значения
- **Влияние на слои:** State layer содержит как server-synced data (energy), так и client-only data (streak) → усложняет debugging
- **Side effects:**
  - Если streak должен давать бонусы (например, streak > 50 → +10% energy) → нужна server-side validation
  - Client-side streak легко читерить (edit localStorage/Redux DevTools)

**Best Practice (Индустриальный стандарт):**

**Паттерн:** Source of Truth Separation

**Принцип:**
Разделяй server state и client state в разные stores:

```typescript
// serverState.ts (synced with backend)
interface ServerState {
  energy: number;
  level: number;
  xp: number;
}

// clientState.ts (local UI state)
interface ClientState {
  streakCount: number;
  lastTapTimestamp: number;
  isCriticalStreak: boolean;
}

// Обновление:
// 1. Server state - только из API responses
// 2. Client state - только из user actions
```

**Источник:**
- [React Query: Server State vs Client State](https://tkdodo.eu/blog/practical-react-query#treat-the-query-key-like-a-dependency-array)
- [Jotai Atoms Philosophy](https://jotai.org/docs/basics/primitives#atoms)

**Примеры в open-source:**
- [TanStack Query (React Query)](https://github.com/TanStack/query) - разделяет server cache и client state
- [Recoil](https://recoiljs.org/docs/introduction/motivation#motivation) - atoms для независимых state units

**Почему это важно для данного случая:**
Energy Planet - это idle game с потенциальным cheating риском. Если streak влияет на game economy (даёт бонусы), он ДОЛЖЕН валидироваться на сервере. Если это только UI feedback - может быть client-only, но должен быть явно помечен.

**Гипотезы для исследования:**
1. Проверить: влияет ли streak на game balance? (есть ли награды за streak?)
2. Если да → нужно переместить streak на backend
3. Если нет → вынести в отдельный `uiStore` для ясности

**Направления для углубленного анализа:**
- [ ] Проверить GDD.md - есть ли streak rewards?
- [ ] Изучить backend - валидируется ли streak где-то?
- [ ] Сравнить с другими idle games - как они управляют streak?

---

### Проблема 2: Passive income drift и sync issues

**Файл:** `webapp/src/store/gameStore.ts` (строки 452-482)

**Описание:**
```typescript
configurePassiveIncome: (perSec: number, multiplier: number) => {
  // Clear old timers
  if (passiveTicker) clearInterval(passiveTicker);
  if (passiveFlushTimer) clearInterval(passiveFlushTimer);

  if (perSec > 0) {
    // Client-side accumulation (every 1 sec)
    passiveTicker = setInterval(() => {
      set(state => ({
        energy: state.energy + perSec,
        pendingPassiveEnergy: state.pendingPassiveEnergy + perSec,
        pendingPassiveSeconds: state.pendingPassiveSeconds + 1,
      }));
    }, 1000);

    // Server sync (every 15 sec)
    passiveFlushTimer = setInterval(() => {
      flushPassiveIncome().catch(error => {
        console.warn('Failed to flush passive income', error);
      });
    }, 15000);
  }
}
```

**Root Cause Analysis:**

**Проблема:** Клиент начисляет energy локально каждую секунду, но синхронизируется с сервером только раз в 15 секунд. Что если:
- Server-side multiplier изменился (boost expired) → client продолжает начислять по старому множителю
- Network error → pending energy теряется
- User closes tab at 14 seconds → pending energy НЕ синхронизирован

**Глубинная причина:**
Желание показать smooth UI updates (energy растет плавно) vs. необходимость server-side validation (anti-cheat). Компромисс - локальное начисление + periodic sync.

**Исторический контекст:**
Это классическая проблема idle games. Разработчик выбрал "optimistic UI" подход для лучшего UX, но не учёл edge cases.

**Best Practice:**

**Паттерн:** Authoritative Server с Client Prediction

```typescript
// 1. Client показывает predicted value
function useDisplayedEnergy() {
  const baseEnergy = useGameStore(state => state.energy);
  const perSec = useGameStore(state => state.passiveIncomePerSec);
  const lastSyncTime = useGameStore(state => state.sessionLastSyncedAt);

  const [displayEnergy, setDisplayEnergy] = useState(baseEnergy);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsedSec = (Date.now() - lastSyncTime) / 1000;
      setDisplayEnergy(baseEnergy + (elapsedSec * perSec));
    }, 100); // 10 FPS update

    return () => clearInterval(interval);
  }, [baseEnergy, perSec, lastSyncTime]);

  return displayEnergy;
}

// 2. Server sync регулярно обновляет baseEnergy
// 3. При discrepancy - server wins, client resync
```

**Источники:**
- [Client-Server Game Architecture](https://www.gabrielgambetta.com/client-server-game-architecture.html)
- [Authoritative Server Pattern](https://docs.colyseus.io/concepts/authoritative-server/)

---

## 📊 Metrics & Complexity

| Метрика | Значение | Норма | Статус |
|---------|----------|-------|--------|
| Lines of Code | 1104 | < 300 | 🔴 Критично |
| Cyclomatic Complexity | ~45 (оценка) | < 10 | 🔴 Очень высокая |
| Number of State Fields | 56 | < 15 | 🔴 Слишком много |
| Number of Actions | 17 | < 8 | 🔴 Слишком много |
| TypeScript coverage | 95% | > 90% | ✅ Хорошо |
| Number of Dependencies | 12 imports | < 10 | ⚠️ Много |
| API endpoints called | 7+ | < 3 в store | 🔴 Должно быть в services |
| Global variables | 3 | 0 | 🔴 Antipattern |
| Duplicated code blocks | 2+ | 0 | 🔴 Рефакторинг нужен |

**Расшифровка Cyclomatic Complexity:**
- `initGame`: ~8 (try-catch, if-else branches, error handling)
- `tap`: ~5
- `purchaseBuilding`: ~12 (цикл + nested try-catch + условия)
- `refreshSession`: ~7
- `flushPassiveIncome`: ~6

**Общая сложность файла:** Очень высокая, трудно поддерживать

---

## 🔗 Взаимосвязи и зависимости

### Карта зависимостей:

```
gameStore.ts (1104 LOC)
  ├── Uses:
  │   ├── zustand (create)
  │   ├── axios (isAxiosError)
  │   ├── ../services/apiClient
  │   ├── ../services/requestQueue
  │   ├── ../services/telemetry (logClientEvent)
  │   ├── ../services/cosmetics (4 functions)
  │   ├── ../services/starPacks (fetchStarPacks)
  │   ├── ../services/boosts (fetchBoostHub, claimBoost)
  │   ├── ../services/buildings (fetchBuildingCatalog)
  │   ├── ../services/telegram (getTelegramInitData, triggerHapticImpact)
  │   ├── ../services/leaderboard (fetchLeaderboard)
  │   ├── ../services/profile (fetchProfile)
  │   ├── ./authStore
  │   └── ./uiStore
  │
  └── Used by: (27 компонентов)
      ├── App.tsx (11 раз)
      ├── MainScreen.tsx (2 раза)
      ├── BuildingsPanel.tsx (3 раза)
      ├── ShopPanel.tsx (2 раза)
      ├── BoostHub.tsx (2 раза)
      ├── LeaderboardPanel.tsx (2 раза)
      ├── ProfilePanel.tsx (2 раза)
      ├── SettingsScreen.tsx (2 раза)
      ├── HomePanel.tsx (используется через props от MainScreen)
      └── [19+ других компонентов]
```

### Критичные связи:

1. **apiClient** → почти все actions делают HTTP requests
   - Если apiClient сломается → весь gameStore перестанет работать
   - Сложность мокирования в тестах

2. **authStore / uiStore** → cross-store dependencies
   - `authStore.setTokens()` вызывается из gameStore
   - `uiStore.openAuthError()` вызывается из gameStore
   - Создаёт coupling между stores

3. **Global timers** → side effects вне React
   - `passiveTicker` и `passiveFlushTimer` живут вне component lifecycle
   - Могут не очищаться при hot reload

### Potential ripple effects:

**Если изменить структуру GameState:**
- ❌ 27 компонентов потребуют обновления селекторов
- ❌ Все тесты, мокирующие gameStore, сломаются
- ❌ TypeScript errors в десятках мест

**Если изменить API contracts:**
- ⚠️ Нужно обновлять интерфейсы в gameStore
- ⚠️ Backend и frontend должны деплоиться синхронно

**Если добавить новую фичу (например, PvP Arena):**
- 🔴 Придётся добавлять ещё 5-10 полей в GameState
- 🔴 Файл станет ещё больше (1200+ LOC)
- 🔴 Complexity вырастет экспоненциально

---

## 📚 Best Practices и источники

### Применимые паттерны:

#### 1. Feature-Sliced Design (разделение по features)

- **Описание:** Организация кода по бизнес-доменам вместо технических слоёв
- **Источник:** [Feature-Sliced Design](https://feature-sliced.design/)
- **Примеры в open-source:**
  - [Real-world FSD example](https://github.com/feature-sliced/examples)
- **Почему это важно для данного случая:**
  Energy Planet имеет чёткие домены: User, Energy, Buildings, Cosmetics, Leaderboard. Каждый домен должен иметь свой store, services, types.

**Структура:**
```
webapp/src/
  features/
    user/
      store/userStore.ts
      api/userApi.ts
      types/user.types.ts
    energy/
      store/energyStore.ts
      hooks/usePassiveIncome.ts
      api/tapApi.ts
    buildings/
      store/buildingsStore.ts
      api/buildingsApi.ts
    ...
```

---

#### 2. Zustand Slices Pattern (разделение store на слайсы)

- **Описание:** Вместо одного большого store, создавать несколько маленьких и комбинировать
- **Источник:** [Zustand Slices Documentation](https://github.com/pmndrs/zustand#slices-pattern)
- **Примеры в open-source:**
  - [Zustand Slices Example](https://github.com/pmndrs/zustand/blob/main/docs/guides/slices-pattern.md)

**Пример реализации:**
```typescript
// userSlice.ts
export const createUserSlice = (set, get) => ({
  userId: null,
  username: null,
  level: 1,
  setUser: (user) => set({ userId: user.id, username: user.username }),
});

// energySlice.ts
export const createEnergySlice = (set, get) => ({
  energy: 0,
  tap: async (count) => { /* tap logic */ },
});

// Combined store
export const useGameStore = create((set, get) => ({
  ...createUserSlice(set, get),
  ...createEnergySlice(set, get),
}));
```

**Почему это важно:**
- ✅ Легче поддерживать (каждый slice < 200 LOC)
- ✅ Переиспользуемость (slice можно использовать в других проектах)
- ✅ Тестируемость (каждый slice тестируется отдельно)

---

#### 3. Repository Pattern для API calls

- **Описание:** Абстракция для доступа к данным, изолирует бизнес-логику от data source
- **Источник:** [Martin Fowler - Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)
- **Примеры в open-source:**
  - [TypeScript Repository Pattern](https://github.com/microsoft/TypeScript-Node-Starter/blob/master/src/models/User.ts)

**Пример:**
```typescript
// repositories/UserRepository.ts
export class UserRepository {
  async getUser(userId: string) {
    const response = await apiClient.get(`/users/${userId}`);
    return UserMapper.toDomain(response.data);
  }

  async updateUser(userId: string, data: Partial<User>) {
    await apiClient.patch(`/users/${userId}`, data);
  }
}

// В store
const userRepo = new UserRepository();
loadUser: async (userId) => {
  const user = await userRepo.getUser(userId);
  set({ user });
}
```

---

#### 4. Optimistic UI Updates

- **Описание:** Обновлять UI сразу, не дожидаясь server response (для perceived performance)
- **Источник:** [Optimistic UI - Apollo Docs](https://www.apollographql.com/docs/react/performance/optimistic-ui/)
- **Примеры:**
  - [TanStack Query Optimistic Updates](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)
  - [SWR Optimistic UI](https://swr.vercel.app/docs/mutation#optimistic-updates)

**Пример для tap:**
```typescript
tap: async (count) => {
  const prevState = get();

  // 1. Optimistic update (instant UI)
  set(state => ({
    energy: state.energy + (count * state.tapIncome),
    streakCount: state.streakCount + count,
  }));

  try {
    // 2. Server sync
    const response = await apiClient.post('/tap', { tap_count: count });

    // 3. Apply server truth
    set({ energy: response.data.energy });
  } catch (error) {
    // 4. Rollback on error
    set({ energy: prevState.energy, streakCount: prevState.streakCount });
    throw error;
  }
}
```

---

### Полезные ресурсы для углубления:

- 📖 [Zustand Best Practices Wiki](https://github.com/pmndrs/zustand/wiki/Best-Practices)
- 📖 [State Management in React 2024](https://kentcdodds.com/blog/application-state-management-with-react)
- 🎥 [Zustand in 100 Seconds](https://www.youtube.com/watch?v=_ngCLZ5Iz-0)
- 💻 [React Query + Zustand Example](https://github.com/TanStack/query/tree/main/examples/react/react-query-with-zustand)
- 📖 [Clean Architecture in Frontend](https://dev.to/bespoyasov/clean-architecture-on-frontend-4311)
- 📖 [TypeScript Deep Dive - Advanced Types](https://basarat.gitbook.io/typescript/type-system)

---

## 🔭 Направления для дальнейшего исследования

### Приоритет 1 (Critical): Требует немедленного изучения

#### 1. **Профилирование performance: сколько компонентов ререндерятся при passive income updates**

**Что изучить:**
- Открыть React DevTools Profiler
- Записать 30-секундную сессию
- Посчитать: сколько компонентов ререндерятся каждую секунду?
- Какие компоненты ререндерятся без необходимости?

**Почему важно:**
Если >5 компонентов ререндерятся каждую секунду → это будет тормозить на слабых устройствах (телефоны 2019-2020 года).

**Как исследовать:**
1. `npm run dev`
2. React DevTools → Profiler → Start recording
3. Ждать 30 секунд (пассивный доход начисляется)
4. Stop recording → анализировать Flamegraph

**Ожидаемый результат:**
Список компонентов + количество ререндеров → решение: локальный state или memo

---

#### 2. **Анализ зависимостей: какие компоненты используют какие части gameStore**

**Что изучить:**
```bash
# Для каждого компонента найти используемые поля
grep -r "useGameStore" webapp/src/components --include="*.tsx" -A 5
```

**Построить таблицу:**
| Компонент | Используемые поля | Частота ререндеров |
|-----------|-------------------|-------------------|
| App.tsx | level, energy, stars, xp, ... | High |
| HomePanel | energy, streak, tap | Very High |
| BuildingsPanel | buildings, buildingCatalog | Medium |

**Почему важно:**
Это покажет, можно ли разделить store на независимые части.

**Ожидаемый результат:**
Граф зависимостей → план разделения на slices

---

### Приоритет 2 (High): Желательно исследовать в ближайшее время

#### 1. **Backend API: поддерживает ли bulk operations?**

**Что изучить:**
- Прочитать `backend/src/api/routes/upgrade.ts`
- Проверить: есть ли параметр `quantity` в `/upgrade`?
- Если нет → оценить стоимость добавления

**Почему важно:**
Это решит проблему N+1 API calls при покупке построек.

**Ожидаемый результат:**
- Если есть → обновить frontend, использовать bulk
- Если нет → создать ticket для backend team

---

#### 2. **Streak system: влияет ли на game balance?**

**Что изучить:**
- Прочитать `docs/GDD.md` → есть ли rewards за streak?
- Проверить backend: `/api/tap` → валидируется ли streak на сервере?

**Почему важно:**
Если streak даёт бонусы → MUST быть server-side validated (anti-cheat).

**Ожидаемый результат:**
- Если влияет → переместить на backend
- Если нет → оставить client-only, но вынести в `uiStore`

---

### Приоритет 3 (Medium): Полезно для полноты картины

#### 1. **Сравнительный анализ с другими Telegram Mini Apps**

**Что изучить:**
- Найти 2-3 open-source Telegram idle games
- Проанализировать их state management
- Сравнить подходы к passive income sync

**Примеры для изучения:**
- [Notcoin (если есть open-source parts)](https://github.com/search?q=notcoin+telegram)
- [Hamster Kombat architecture discussions](https://habr.com/ru/articles/)

**Ожидаемый результат:**
Best practices от успешных игр → применить в Energy Planet

---

### Открытые вопросы:

- ❓ **Почему core endpoints (`/tap`, `/session`) не вынесены в services, хотя остальные (cosmetics, buildings) вынесены?**
  → Проверить git history: когда добавлялись services? Возможно, это technical debt из раннего MVP.

- ❓ **Есть ли планы добавлять PvP/Clans features? Если да, как gameStore будет масштабироваться?**
  → Обсудить с product owner: roadmap → архитектурные требования.

- ❓ **Какой процент пользователей закрывает приложение до 15-секундного flush?**
  → Посмотреть telemetry: сколько pending energy теряется? → решить, нужен ли shorter flush interval.

- ❓ **Есть ли rate limiting на backend для `/tap` и `/upgrade`?**
  → Если нет → риск abuse (bot tapping) → обсудить с backend team.

---

## 🎯 Выводы

**Краткое резюме:**
gameStore.ts - это **God Object antipattern**: один файл на 1104 строки, управляющий всем приложением. Это работает для MVP, но создаёт серьёзные проблемы масштабируемости, поддерживаемости и тестируемости. Архитектура нуждается в рефакторинге для долгосрочного успеха проекта.

**Ключевые инсайты:**

1. **Архитектурный долг накоплен из-за быстрой разработки MVP**
   Все новые фичи (buildings, cosmetics, boosts, leaderboard) добавлялись в один store вместо создания отдельных domain stores. Это классический пример "начали правильно, но не успели поддерживать качество при росте".

2. **Смешивание ответственностей на всех уровнях**
   Store делает API calls, управляет таймерами, содержит бизнес-логику. Это нарушает Single Responsibility Principle и усложняет тестирование.

3. **Глобальные переменные вне Zustand - скрытая бомба**
   `passiveTicker`, `passiveFlushTimer`, `passiveFlushInFlight` - это side effects вне React lifecycle. Потенциальные memory leaks, проблемы с hot reload, сложность тестирования.

**Архитектурные наблюдения:**

- **Паттерны которые повторяются:**
  - Каждая новая фича → +10 полей в GameState + 1-2 action метода
  - API call → error handling → set state → refresh session
  - Loading states: `isLoading`, `isProcessingId`, `error` для каждой feature

- **Признаки эволюции архитектуры:**
  - Ранний код (user, energy) - простой и чистый
  - Поздний код (buildings, purchases) - сложный, с error recovery и partial success
  - Services folder существует, но используется непоследовательно

- **Технический долг как индикатор приоритетов:**
  Store показывает, что команда фокусировалась на скорости доставки фич (time-to-market), жертвуя архитектурной чистотой. Это нормально для MVP, но требует рефакторинга после валидации product-market fit.

**Рекомендуемые области для следующего анализа:**

1. **App.tsx и MainScreen.tsx** - потому что они используют gameStore 11 и 2 раза соответственно, являются главными consumers. Анализ покажет, как God Object влияет на компоненты верхнего уровня.

2. **BuildingsPanel.tsx (347 LOC)** - потому что это сложный UI компонент, взаимодействующий с `purchaseBuilding` action. Анализ покажет проблемы UX из-за N+1 API calls.

3. **Вся папка `/services`** - потому что там уже есть правильная архитектура (cosmetics.ts, buildings.ts), но она не используется для core endpoints. Сравнение покажет, как миграция должна выглядеть.

4. **Сравнительный анализ: ShopPanel.tsx (627 LOC) vs BuildingsPanel (347 LOC)** - почему ShopPanel почти в 2 раза больше? Есть ли дублирование логики? Можно ли вынести общий код?

---

## 📌 Следующий компонент для анализа

**Рекомендация:** **App.tsx**

**Обоснование:**
1. **Критичность:** Главная точка входа приложения, orchestrates весь lifecycle
2. **Complexity:** 235 LOC, 11 использований useGameStore - подозрение на tight coupling
3. **Влияние:** Любые изменения в App.tsx влияют на весь user flow
4. **Связь с текущим анализом:** App.tsx - главный consumer gameStore, анализ покажет ripple effects от God Object

**Ключевые вопросы для исследования:**
- Почему App.tsx использует gameStore 11 раз? Нет ли prop drilling?
- Как управляется global navigation state (activeTab)?
- Есть ли логика, которая должна быть в отдельных компонентах?
- Как обрабатываются модалки (AuthError, OfflineSummary, LevelUp)?

**Альтернативные кандидаты:**
- **ShopPanel.tsx (627 LOC)** - второй по размеру компонент, потенциальный God Component
- **MainScreen.tsx (446 LOC)** - routing logic, lazy loading, potential performance issues

---

**Конец отчёта.**
Дата: 2025-10-25
Аналитик: Claude Code (Senior Frontend Architect Agent)
Следующий шаг: Систематический анализ App.tsx по той же методологии
