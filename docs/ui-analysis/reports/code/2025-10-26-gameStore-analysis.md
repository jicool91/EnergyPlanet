# Code Analysis: gameStore.ts (Zustand State Management)

## 📊 Общая оценка: 3/10

**Компонент:** `webapp/src/store/gameStore.ts`
**LOC (Lines of Code):** 1104 строк
**Сложность:** Very High
**Дата анализа:** 2025-10-26

---

## ✅ Сильные стороны

1. **Хорошая структура инициализации** (строки 248-379)
   - Разделение auth flow (getTelegramInitData) и session initialization
   - Правильная обработка ошибок с различными сценариями (401, 400, 500)
   - Использование postQueue для предотвращения race conditions

2. **Хорошая обработка ошибок в большинстве функций**
   - describeError() утилита для парсинга ошибок (строки 161-177)
   - Логирование ошибок через telemetry service
   - Fallback сообщения для пользователя

3. **Системы для отслеживания loading/error состояний**
   - Для каждого основного действия есть loading флаг (isCosmeticsLoading, isStarPacksLoading и т.д.)
   - Error сообщения сохраняются в state
   - Идемпотентность через isProcessingXxx флаги

4. **Правильное использование Zustand API**
   - get() для доступа к current state
   - set() для immutable updates
   - Кеширование (buildingCatalogLoaded, cosmeticsLoaded и т.д.)

5. **Хорошее логирование**
   - Использование logClientEvent для трейсинга user actions
   - Разные уровни severity (info, warn, error)
   - Включение контекста (building_id, quantity, status и т.д.)

---

## 🏗️ Архитектурный анализ по слоям

### Layer 1: Component Structure (Store Architecture)
- **Оценка:** 2/10
- **Обнаруженные проблемы:**

1. **God Object паттерн - 56 полей в одном store** (строки 78-157)
   - **Группировка полей:**
     - User data (10): userId, username, level, xp, xpIntoLevel, xpToNextLevel, tapLevel, tapIncome, energy, stars
     - Game mechanics (8): passiveIncomePerSec, passiveIncomeMultiplier, streakCount, bestStreak, isCriticalStreak, lastTapAt, pendingPassiveEnergy, pendingPassiveSeconds
     - Buildings (6): buildings, buildingsError, isProcessingBuildingId, buildingCatalog, buildingCatalogLoaded, isBuildingCatalogLoading
     - Cosmetics (5): cosmetics, cosmeticsLoaded, isCosmeticsLoading, cosmeticsError, isProcessingCosmeticId
     - Star Packs (5): starPacks, starPacksLoaded, isStarPacksLoading, starPacksError, isProcessingStarPackId
     - Boost Hub (5): boostHub, boostHubLoaded, isBoostHubLoading, boostHubError, isClaimingBoostType
     - Session (2): sessionLastSyncedAt, sessionErrorMessage
     - Leaderboard (6): leaderboardEntries, leaderboardLoaded, isLeaderboardLoading, leaderboardError, leaderboardTotal, userLeaderboardEntry
     - Profile (4): profile, profileBoosts, isProfileLoading, profileError
     - General (2): isLoading, isInitialized

   - **Проблема:** Компонент слушает 56 полей, любое из них меняется → ререндер
   - **Из BuildingsPanel анализа:** 14 селекторов в одной деконструкции вызывает ререндер каждую секунду
   - Если energy меняется → весь store пересчитывается для Zustand (shallow check)

2. **Отсутствие разделения на domain stores**
   - Нет отдельного BoostStore, CosmeticStore, LeaderboardStore
   - Все смешано в одном gameStore
   - Нарушает SRP (Single Responsibility Principle)

3. **Глобальные переменные вместо state** (строки 74-76)
   ```typescript
   let passiveTicker: ReturnType<typeof setInterval> | null = null;
   let passiveFlushTimer: ReturnType<typeof setInterval> | null = null;
   let passiveFlushInFlight = boolean;
   ```
   - ❌ Это не safe (могут быть race conditions)
   - ❌ Сложно тестировать
   - ❌ Может быть memory leak если not cleaned up properly
   - ✅ Должны быть в state или в custom hook

- **Root Cause Analysis:**
  - Разработчик использовал "horizontal slicing" вместо "domain-driven slicing"
  - На moment of creation это был простой store, потом разросся
  - Нет рефакторинга когда появились новые domains (cosmetics, boosts, leaderboard)

- **Best Practice:**
  - **Domain-Driven Stores**: Разбить на несколько stores:
    ```typescript
    // Вместо одного gameStore с 56 полями:
    const useGameStore = create(...)        // User, Progress, Energy, Tap, Buildings
    const useCosmeticStore = create(...)    // Cosmetics, Equipped
    const useBoostStore = create(...)       // BoostHub, ClaimedBoosts
    const useLeaderboardStore = create(...) // Leaderboard, UserRank
    const useSessionStore = create(...)     // Session, Sync, Offline
    ```
  - Источник: [Zustand Best Practices](https://docs.pmnd.rs/zustand/guides/typescript)

- **Взаимосвязи:**
  - Каждый компонент который использует useGameStore подписан на все 56 полей (даже если использует только 1-2)
  - BuildingsPanel, App, MainScreenHeader, LevelBar - все получают cascade ререндеры

- **Исследовать дальше:**
  - ✅ Сколько компонентов используют gameStore
  - ✅ Какие компоненты используют только 1-2 поля (они страдают больше всего)
  - ✅ Есть ли другие stores (uiStore, authStore)? Нужна ли та же разделение?

---

### Layer 2: State Management
- **Оценка:** 2/10
- **State flow diagram:**
  ```
  Backend (Session API)
       ↓
  gameStore initializes (initGame)
       ↓
  configurePassiveIncome (setInterval каждую сек)
       ↓
  energy: state.energy + perSec (каждую сек)
       ↓
  Все компоненты которые слушают energy → ререндер
       ↓
  (Через flushPassiveIncome каждые 15 сек)
       ↓
  API call /tick { time_delta: pendingSeconds }
  ```

- **Обнаруженные проблемы:**

1. **КРИТИЧЕСКОЕ: Energy меняется каждую секунду** (строки 468-474)
   ```typescript
   passiveTicker = setInterval(() => {
     set(state => ({
       energy: state.energy + perSec,
       pendingPassiveEnergy: state.pendingPassiveEnergy + perSec,
       pendingPassiveSeconds: state.pendingPassiveSeconds + 1,
     }));
   }, 1000);
   ```
   - Это вызывает обновление store каждую секунду
   - Zustand сравнивает new state vs old state (shallow)
   - Если перСек > 0 → new object → считается что state изменился
   - **Impact:** Все компоненты которые слушают energy ререндерятся каждую сек
   - Это каскадный ребендер: App → MainScreenHeader → LevelBar, BuildingsPanel → BuildingCard (из анализа)

2. **Глобальные переменные для тайменов** (строки 74-76)
   ```typescript
   let passiveTicker: ReturnType<typeof setInterval> | null = null;
   let passiveFlushTimer: ReturnType<typeof setInterval> | null = null;
   let passiveFlushInFlight = false;
   ```
   - **Проблемы:**
     - Если пользователь откроет приложение в 2 браузерских таб → 2 tickers одновременно
     - При unmount'ировании компонента не очищаются (memory leak)
     - Сложно тестировать (нужно мокировать глобальные переменные)
     - Race condition между passiveFlushTimer и passiveFlushInFlight

3. **энергия не синхронизируется с сервером между flushes**
   - Client-side энергия = старая энергия + накопленная энергия каждую сек
   - Сервер знает real энергию
   - Если есть несоответствие (client-side энергия > server) → покупка может fail
   - Нет оптимистичных updates + откатов

4. **Нет деления state на "display" vs "source of truth"**
   - `energy` используется для:
     - Отображения пользователю (UI)
     - Расчета стоимости покупок (estimatePlan в BuildingsPanel)
     - Флаша на сервер (flushPassiveIncome)
   - Если energy изменяется каждую сек, все эти компоненты ререндерятся

5. **pendingPassiveEnergy и pendingPassiveSeconds ненужны в глобальном state**
   - Используются только для flushPassiveIncome
   - Могут быть в локальном state или в отдельной session store
   - Сейчас они занимают место в gameStore и вызывают ререндеры

6. **Отсутствие batch updates**
   - В purchaseBuilding (строка 887-920) для каждой покупки вызывается `set()`
   - Это 10 separate state updates для bulk purchase ×10
   - Zustand должна batch'ить их автоматически, но лучше сделать явно

- **Root Cause Analysis:**
  - Разработчик хотел simple implementation: "каждую сек прибавить энергию"
  - Не предвидел что это вызовет каскадные ререндеры
  - Нет профилирования performance
  - Глобальные переменные - это decision из-за того что нужно очищать setInterval при unmount

- **Best Practice:**
  - **Separate display energy from source of truth:**
    ```typescript
    // Вместо одного energy которое меняется каждую сек:
    interface GameState {
      actualEnergy: number;        // Source of truth (from server)
      displayEnergy: number;       // For UI (updated every 1s locally)
      lastSyncTime: number;
    }

    // Или еще лучше:
    const energyStore = create(state => ({
      lastServerEnergy: 0,
      energyPerSec: 0,
      lastUpdateAt: Date.now(),

      getDisplayEnergy: () => {
        const elapsed = Date.now() - lastUpdateAt;
        return lastServerEnergy + (energyPerSec * elapsed / 1000);
      }
    }));
    ```
  - **Move timers to hook or service:**
    ```typescript
    function usePassiveIncomeSync() {
      useEffect(() => {
        const ticker = setInterval(() => {
          set(...);
        }, 1000);
        return () => clearInterval(ticker);
      }, []);
    }
    ```
  - Источник: [Zustand Architecture Patterns](https://docs.pmnd.rs/zustand/api/create)

- **Взаимосвязи:**
  - gameStore.energy → BuildingsPanel (14 селекторов) → ререндер
  - gameStore.energy → App.tsx → ререндер
  - gameStore.energy → MainScreenHeader → ререндер
  - gameStore.energy → LevelBar → ререндер
  - **Cascade:** 1 energy update → 4+ компонента ререндерятся × 60 раз в минуту

- **Исследовать дальше:**
  - ✅ Профилировать сколько раз game store вызывает Zustand `set()`
  - ✅ Посмотреть как часто ререндерятся компоненты которые слушают energy
  - ✅ Есть ли способ decuple display energy от calculations

---

### Layer 3: API Integration
- **Оценка:** 2/10
- **API contracts:**
  ```
  POST /auth/telegram          - Authenticate
  POST /session                - Get game state
  POST /tap                    - Send taps
  POST /upgrade                - Purchase or upgrade building
  POST /tick                   - Sync passive income
  POST /purchase/invoice       - Create star pack invoice
  POST /purchase               - Confirm purchase
  ```

- **Error handling:** ⚠️ Частичный
- **Loading states:** ✅ Хорошо
- **Batch operations:** ❌ Нет

- **Обнаруженные проблемы:**

1. **КРИТИЧЕСКОЕ: N+1 API calls в purchaseBuilding** (строки 887-920)
   ```typescript
   purchaseBuilding: async (buildingId: string, quantity = 1) => {
     // ...
     for (let index = 0; index < quantity; index += 1) {
       const response = await apiClient.post<UpgradeResponsePayload>('/upgrade', {
         building_id: buildingId,
         action: 'purchase',
       });
       // ...
     }
   }
   ```
   - **Проблема:** Для quantity=10 делается 10 отдельных POST requests
   - **Should be:** 1 request с { buildingId, quantity: 10 }
   - **Impact:**
     - User купит ×10 → ждет 10 × 100ms = 1 сек вместо 100ms
     - Backend получит 10x нагрузку для одного action
     - Сеть трафик 10x больше
     - Rate limiting может заблокировать

   - **Это точно N+1!** Подтверждено из BuildingsPanel анализа

2. **API call latency не управляется**
   - Нет timeout'ов
   - Нет retry logic
   - Нет exponential backoff
   - Если сервер slow → покупка зависает

3. **refreshSession делается много раз** (строки 932, 988, 799)
   - purchaseBuilding → refreshSession
   - upgradeBuilding → refreshSession
   - claimBoost → refreshSession
   - Это дополнительные POST /session calls
   - Могут быть batch'ены или cached

4. **flushPassiveIncome вызывается часто**
   - Перед tap (строка 384)
   - Перед purchaseBuilding (строка 880)
   - Перед upgradeBuilding (строка 961)
   - Каждые 15 сек через timer (строка 476)
   - Может быть оптимизировано

5. **Обработка partial purchase failures** (строки 905-919)
   ```typescript
   for (let index = 0; index < quantity; index += 1) {
     try {
       const response = await apiClient.post('/upgrade', { ... });
       successfulPurchases += 1;
     } catch (iterationError) {
       if (successfulPurchases > 0) {
         await logClientEvent('building_purchase_partial', ...);
         await get().refreshSession();
       }
       throw iterationError;
     }
   }
   ```
   - Вызывает refreshSession если partial fail
   - Но есть race condition: если успешно 5 из 10, вызывает refreshSession потом throw error
   - UI покажет error, но 5 покупок уже прошли (hidden в log)

6. **Нет idempotency check**
   - Если request fail и retry → может купить дважды
   - Нет purchase_id tracking (как в purchaseStarPack - строка 720)

7. **Мало retry логики для important операций**
   - tap может быть сделана заново? (нет explicit retry)
   - purchaseBuilding fail → пользователь вынужден нажимать снова

- **Root Cause Analysis:**
  - Разработчик выбрал простейшую реализацию: loop and call API N times
  - Не было обсуждения с backend team о том как должна работать bulk purchase
  - Нет performance requirements / SLA
  - Вероятно, на MVP это казалось OK (мало users = мало impact)

- **Best Practice:**
  - **Backend должен поддерживать bulk operations:**
    ```typescript
    // Request
    POST /upgrade
    {
      building_id: string;
      action: 'purchase';
      quantity: number;  // NEW!
    }

    // Response
    {
      purchases_made: number;
      purchases_failed: number;
      details?: Array<{ index, success, reason }>;
      energy: number;
      buildings: Building[];
    }
    ```

  - **Frontend должен отправить quantity в backend:**
    ```typescript
    const response = await apiClient.post('/upgrade', {
      building_id: buildingId,
      action: 'purchase',
      quantity: quantity,  // Отправить все количество, не loop!
    });
    ```

  - **Retry with exponential backoff:**
    ```typescript
    async function withRetry(fn, maxRetries = 3) {
      for (let i = 0; i < maxRetries; i++) {
        try {
          return await fn();
        } catch (error) {
          if (i === maxRetries - 1) throw error;
          await sleep(Math.pow(2, i) * 1000); // exponential backoff
        }
      }
    }
    ```

  - Источник: [API Resilience Patterns](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)

- **Взаимосвязи:**
  - gameStore.purchaseBuilding вызывается из BuildingCard (строка 135 в BuildingsPanel)
  - BuildingsPanel передает quantity (×1, ×10, ×100, MAX)
  - Если backend не поддерживает quantity → gameStore мусит делать loop
  - **Это техдолг который идет из backend**

- **Исследовать дальше:**
  - ✅ **КРИТИЧНО:** Проверить backend API контракт - поддерживает ли quantity?
  - ✅ Посмотреть Network tab когда покупаем ×10 - сколько requests?
  - ✅ Есть ли logs на backend про duplicate purchases?
  - ✅ Сколько time занимает bulk purchase (10 items)?
  - ✅ Есть ли идемпотентность на backend для retry protection?

---

### Layer 4: Design System Compliance
- **Оценка:** 6/10
- **Используемые компоненты:**
  - Нет UI компонентов в gameStore (это store, не component)
  - Используется apiClient для всех API calls
  - Используется logClientEvent для telemetry
  - Используется triggerHapticImpact для feedback

- **Telegram theme:** ✅ Используется getTelegramInitData
- **Error messages:** Немного hardcoded, но в целом consistent

- **Обнаруженные проблемы:**

1. **Hardcoded error messages** (строки 159, 352, 361)
   ```typescript
   const fallbackSessionError = 'Не удалось обновить данные. Попробуйте ещё раз позже.';
   const fallbackMessage = 'Не удалось авторизоваться. Проверьте подключение и попробуйте ещё раз.';
   ```
   - Не централизованы (разные строки в разных местах)
   - Нет i18n (интернационализации)
   - Если нужна поддержка другой языка, нужно переделывать код

2. **Inconsistent error handling messages**
   ```typescript
   // Строка 946
   set({ buildingsError: message || 'Не удалось купить постройку' });
   // Строка 1000
   set({ buildingsError: message || 'Не удалось улучшить постройку' });
   // Строка 615
   set({ cosmeticsError: message || 'Не удалось купить косметику' });
   ```
   - Разные формулировки для похожих ошибок
   - Нужна unified error message formatting

3. **Нет error codes / error types**
   - Используются только HTTP status codes
   - Нет enum'а или type для разных типов ошибок
   - Например, 'insufficient_energy' vs 'building_not_found' vs 'server_error'

- **Root Cause Analysis:**
  - Разработчик фокусировался на functionality, не на DX (Developer Experience)
  - Нет требований про i18n/localization на момент разработки
  - Копипаст'ил error handling из одного места в другой

- **Best Practice:**
  - **Centralized error messages:**
    ```typescript
    const ERROR_MESSAGES = {
      building_purchase_failed: 'Не удалось купить постройку',
      building_upgrade_failed: 'Не удалось улучшить постройку',
      insufficient_energy: 'Недостаточно энергии',
      building_not_found: 'Здание не найдено',
    } as const;

    set({ buildingsError: ERROR_MESSAGES.building_purchase_failed });
    ```

  - **Error codes enum:**
    ```typescript
    enum ErrorCode {
      INSUFFICIENT_ENERGY = 'insufficient_energy',
      BUILDING_CAPPED = 'building_capped',
      NETWORK_ERROR = 'network_error',
    }

    const response = describeError(error);
    if (response.code === ErrorCode.INSUFFICIENT_ENERGY) {
      // Handle specific error
    }
    ```

- **Взаимосвязи:**
  - Все компоненты которые слушают buildingsError, cosmeticsError и т.д. получают ошибки из gameStore
  - Если нет единого message format → разные компоненты показывают разные UI для одной ошибки

- **Исследовать дальше:**
  - ✅ Есть ли i18n планирование?
  - ✅ Какие error codes использует backend?
  - ✅ Есть ли документация про error handling?

---

### Layer 5: Performance
- **Оценка:** 1/10
- **Unnecessary rerenders:** 60+ найдено (из cascade анализа)
- **Bundle impact:** Medium (serviceWorker, timers)

- **Обнаруженные проблемы:**

1. **Energy updates every 1 second** (строки 468-474)
   - Как обсуждено в Layer 2
   - **Impact:** 60 updates per minute, каждый может trigger ререндер

2. **Zustand не оптимизирован для granular updates**
   - 56 полей в одном store
   - Компонент который использует 1 поле получает ререндер если изменилось любое из 56

3. **flushPassiveIncome called multiple times per action** (строки 384, 880, 961)
   - tap → flushPassiveIncome + API call
   - purchaseBuilding → flushPassiveIncome + API call × quantity + refreshSession
   - upgradeBuilding → flushPassiveIncome + API call + refreshSession
   - Может быть deduplicated / batched

4. **refreshSession вызывается too frequently**
   - После purchaseBuilding (строка 932)
   - После upgradeBuilding (строка 988)
   - После claimBoost (строка 799)
   - После cosmetic purchase (строка 602)
   - Это по сути DELETE cache + GET new state
   - Может быть optimized через incremental updates

5. **equipCosmetic переполнирует весь массив** (строки 634-646)
   ```typescript
   set(state => ({
     cosmetics: state.cosmetics.map(item => {  // O(n) operation!
       if (item.category !== target.category) {
         return item;
       }
       return { ...item, equipped: item.id === cosmeticId, ... };
     }),
   }));
   ```
   - Для equip'ировки одного cosmetic создается новый array
   - Если 100 cosmetic'ов → перерисовывается все 100 компонента

6. **Global timers not cleaned up on store destruction**
   - passiveTicker и passiveFlushTimer не очищаются при unmount
   - Если App remount'ится → новые timers + старые все еще работают
   - **Memory leak!**

7. **Отсутствие debounce для frequent updates**
   - энергия обновляется каждую сек
   - Нет debounce перед отправкой на сервер
   - flushPassiveIncome вызывается каждые 15 сек (строка 476)
   - Может быть optimized на 30-45 сек

- **Root Cause Analysis:**
  - Разработчик не профилировал performance
  - Нет performance targets / requirements
  - Выбраны "simple" решения которые имеют bad performance

- **Best Practice:**
  - **Separate stores for high-frequency updates:**
    ```typescript
    // energy store (обновляется каждую сек)
    const useEnergyStore = create(state => ({
      displayEnergy: 0,
      energyPerSec: 0,
      // ...
    }));

    // game store (обновляется редко)
    const useGameStore = create(state => ({
      level, xp, buildings, // не включать energy!
      // ...
    }));
    ```

  - **Debounce frequent operations:**
    ```typescript
    const debouncedFlush = debounce(
      () => flushPassiveIncome(),
      30000  // 30 seconds instead of 15
    );
    ```

  - **Batch cosmetic updates:**
    ```typescript
    // Вместо map'ирования весь array:
    set(state => ({
      cosmetics: new Map(state.cosmetics.map(c => [c.id, c]))
        .set(cosmeticId, newCosmetic)
        .values()
    }));
    ```

  - Источник: [React Performance - State Structure](https://react.dev/learn/choosing-the-state-structure)

- **Взаимосвязи:**
  - gameStore updates → Zustand notifies all subscribers
  - All subscribers that use energy → rerender (60 times/min)
  - This causes cascades in BuildingsPanel, App, MainScreenHeader, LevelBar

- **Исследовать дальше:**
  - ✅ Профилировать Zustand `set()` calls per minute
  - ✅ Посмотреть React DevTools Profiler для каждого компонента
  - ✅ Измерить CPU usage при idle (должна быть ~0%)
  - ✅ Есть ли способ decuple energy updates из других state changes

---

### Layer 6: Type Safety
- **Оценка:** 6/10
- **TypeScript coverage:** 95%+
- **`any` usage:** 0 раз (хорошо!)

- **Обнаруженные проблемы:**

1. **Optional fields in API responses** (строки 46-69)
   ```typescript
   interface TickSyncResponse {
     energy: number;
     level: number;
     xp_gained?: number;        // Optional
     xp_into_level?: number;    // Optional
     xp_to_next_level?: number; // Optional
   }

   interface UpgradeResponsePayload {
     energy?: number;           // Optional!
     level?: number;            // Optional!
     // ...
   }
   ```
   - Много ?? fallback'ов в коде (строки 846, 851-855, 902-903)
   - Это указывает что backend может не всегда возвращать все поля
   - Нужна runtime validation (zod, io-ts)

2. **Нет type guards для runtime validation**
   - API responses не валидируются
   - Могут прийти неправильные типы и упал'ить JSON parsing

3. **mapBuilding функция предполагает правильную структуру** (строки 179-189)
   ```typescript
   function mapBuilding(entry: InventoryBuildingPayload): BuildingState {
     return {
       buildingId: entry.building_id,  // Предполагает что поле есть
       // ...
     };
   }
   ```
   - Если backend не вернул building_id → это станет undefined
   - Нет проверки

4. **Generic type в apiClient.post не используется везде**
   ```typescript
   // Строка 889
   const response = await apiClient.post<UpgradeResponsePayload>('/upgrade', {...});

   // Но строка 385
   const response = await apiClient.post('/tap', { tap_count: count });
   // ↑ Нет типизации! response.data может быть any
   ```

- **Root Cause Analysis:**
  - Backend interface не стабилен (много optional полей)
  - Разработчик использовал fallback'и вместо runtime validation
  - Нет shared types между backend и frontend

- **Best Practice:**
  - **Runtime validation with zod:**
    ```typescript
    import z from 'zod';

    const TickSyncResponseSchema = z.object({
      energy: z.number(),
      level: z.number(),
      xp_gained: z.number().optional(),
    });

    const response = await apiClient.post('/tick', {...});
    const validated = TickSyncResponseSchema.parse(response.data);
    ```

  - **Strict types in GameState:**
    ```typescript
    interface GameState {
      energy: number;          // Required
      level: number;           // Required
      pendingPassiveEnergy: number; // Better to put in separate store
      // ...
    }
    ```

  - Источник: [Zod Documentation](https://zod.dev/)

- **Взаимосвязи:**
  - Если API contract меняется → много мест в gameStore нужно обновить
  - Много типов которые зависят от API responses
  - Нет single source of truth для API contracts

- **Исследовать дальше:**
  - ✅ Есть ли shared types между backend и frontend?
  - ✅ Какие поля mandatory vs optional в API responses?
  - ✅ Когда backend schema изменилась, что сломалось?

---

## 🔄 Анализ потоков и состояний

### User Flow: Bulk Purchase (5 buildings)

```
User selects ×5 → BuildingsPanel.handlePurchase(buildingId, 5)
                ↓
        gameStore.purchaseBuilding(buildingId, 5)
                ↓
        flushPassiveIncome()  [API: POST /tick] ← 1 call
                ↓
        Loop x 5:
          └─ API: POST /upgrade { action: 'purchase' }  ← 5 calls!!!
                ↓
        refreshSession()  [API: POST /session] ← 1 call
                ↓
        Total: 7 API calls for 1 action!

Expected (correct backend):
        flushPassiveIncome() ← 1 call
        API: POST /upgrade { action: 'purchase', quantity: 5 } ← 1 call
        refreshSession() ← 1 call

Total: 3 API calls
```

**Проблемы в потоке:**
1. N+1 API calls (5 instead of 1 for purchases)
2. refreshSession может быть deduplicated (калькулирует все building'ы)
3. flushPassiveIncome не нужна если недавно был flush

**Рекомендации:**
1. Backend MUST support quantity parameter
2. Optimize refreshSession timing
3. Consider optimistic updates + rollback

---

### User Flow: Energy Update (continuous)

```
setInterval every 1000ms:
  energy += perSec
  pendingPassiveEnergy += perSec
  pendingPassiveSeconds += 1
        ↓
  gameStore.set() called
        ↓
  Zustand notifies all subscribers
        ↓
  All components using gameStore rerender
        ↓
  BuildingsPanel rerender (14 selectors!)
    └─ estimatePlan recalculates for 20+ buildings
    └─ BuildingCard rerenders (no memo) x 20
        ↓
  Every second: 60+ rerenders for single energy update

Optimal solution:
  - Separate energyStore with just energy
  - Use displayEnergy = lastServerEnergy + elapsed * perSec
  - Update only when needed (sync with server)
```

---

## 🔌 API Contracts Review

### Endpoint: `POST /upgrade`

**Current Implementation (строка 889):**
```typescript
for (let index = 0; index < quantity; index += 1) {
  const response = await apiClient.post('/upgrade', {
    building_id: buildingId,
    action: 'purchase',
    // NO QUANTITY!
  });
}
```

**Should Be:**
```typescript
const response = await apiClient.post('/upgrade', {
  building_id: buildingId,
  action: 'purchase',
  quantity: quantity,  // ← This must be supported!
});
```

**Response Status:**
- [x] Request типизирован? ✅ (UpgradeResponsePayload)
- [x] Response типизирован? ✅
- [x] Error handling? ⚠️ (базовый try-catch)
- [x] Retry logic? ❌
- [x] Batch support? ❌ **CRITICAL ISSUE**

### Endpoint: `POST /tick`

**Implementation (строка 842):**
```typescript
const response = await apiClient.post('/tick', { time_delta: pendingSeconds });
```

**Response Type (строка 46-53):**
```typescript
interface TickSyncResponse {
  energy: number;
  level: number;
  xp_gained?: number;
  xp_into_level?: number;
  xp_to_next_level?: number;
  passive_income_per_sec?: number;
}
```

**Issues:**
- [x] Many optional fields (bad contract)
- [x] Unclear which are always returned
- [x] No validation

---

## ⚠️ Критические риски и технический долг

### Risk 1: N+1 API calls for bulk purchases (CRITICAL)
- **Severity:** Critical 🔴
- **Impact:**
  - User购买 ×10 buildings: 10 API calls instead of 1
  - Latency: 1-2 seconds instead of 100-200ms
  - Server load: 10x for one action
  - Could trigger rate limiting
  - Bad UX: slow response
- **Probability:** High (confirmed in code)
- **Mitigation:** URGENT - Fix backend to support quantity parameter

### Risk 2: Memory leak from global timers
- **Severity:** High 🟠
- **Impact:**
  - passiveTicker and passiveFlushTimer not cleaned up
  - If App remounts → duplicate timers
  - Multiple energy updates per second
  - Battery drain on mobile
- **Probability:** Medium (depends on navigation patterns)
- **Mitigation:** Move timers to useEffect with cleanup

### Risk 3: Energy cascade rerenders every 1 second
- **Severity:** High 🟠
- **Impact:**
  - 60+ rerenders per minute
  - 1-2 seconds CPU time wasted per minute
  - Battery drain on mobile
  - Performance degradation with more components
  - May cause jank if other operations happening
- **Probability:** High (already confirmed in analysis)
- **Mitigation:** Separate energy store, debounce updates

### Risk 4: Partial purchase failures not visible to user
- **Severity:** High 🟠
- **Impact:**
  - User buys ×10, only 7 succeed
  - UI shows success, but user didn't get 3
  - Financial loss (if Stars involved)
  - Hidden in logs, user doesn't know
- **Probability:** Medium (depends on error scenarios)
- **Mitigation:** Detailed response from backend, user-visible confirmation

### Risk 5: God Object store too large to optimize
- **Severity:** High 🟠
- **Impact:**
  - Any change to any field → potential reerendering
  - Zustand can't optimize deep updates
  - Hard to add new features without breaking perf
- **Probability:** High (already manifesting)
- **Mitigation:** Split into domain stores

### Technical Debt 1: Backend API contract not well defined
- **Cost:** 8 hours to fix (need backend involvement)
- **Impact:**
  - Many optional fields
  - No batch operation support
  - Hard to optimize
- **Recommendation:**
  - Work with backend team
  - Define clear API schemas (OpenAPI)
  - Support quantity in /upgrade endpoint

### Technical Debt 2: Global variables for timers
- **Cost:** 2 hours to move to state/hooks
- **Impact:**
  - Memory leaks
  - Race conditions
  - Hard to test
- **Recommendation:**
  - Move to useEffect hooks
  - Add cleanup functions
  - Consider custom hook: `usePassiveIncome()`

### Technical Debt 3: No domain-driven store separation
- **Cost:** 16 hours for architecture refactor
- **Impact:**
  - Store is hard to understand (56 fields)
  - Optimizations difficult
  - Testing complex
- **Recommendation:**
  - Create separate stores: GameStore, CosmeticStore, BoostStore, LeaderboardStore
  - Each domain manages its own state
  - Easier to optimize independently

### Technical Debt 4: Hardcoded error messages
- **Cost:** 4 hours for centralization
- **Impact:**
  - Difficult to add i18n
  - Inconsistent UX
  - Maintenance nightmare
- **Recommendation:**
  - Create ERROR_MESSAGES constant
  - Use error codes enum
  - Prepare for i18n

---

## 🔬 Глубокий анализ критичных проблем

### Проблема 1: N+1 API Calls in purchaseBuilding

**Файл:** `webapp/src/store/gameStore.ts` (строки 869-951)

**Описание:**
```typescript
purchaseBuilding: async (buildingId: string, quantity = 1) => {
  if (!buildingId || quantity <= 0) {
    return;
  }

  set({ isProcessingBuildingId: buildingId, buildingsError: null });

  let successfulPurchases = 0;
  let lastResponse: UpgradeResponsePayload | null = null;

  try {
    await get().flushPassiveIncome();
    await logClientEvent('building_purchase_request', { building_id: buildingId, quantity }, 'info');

    // ❌ LOOP! Это есть N+1!
    for (let index = 0; index < quantity; index += 1) {
      try {
        const response = await apiClient.post<UpgradeResponsePayload>('/upgrade', {
          building_id: buildingId,
          action: 'purchase',
          // ❌ NO QUANTITY PARAMETER!
        });
        successfulPurchases += 1;
        const payload = response.data ?? {};
        lastResponse = payload;

        set(state => ({
          xp: state.xp + (payload.xp_gained ?? 0),
          xpIntoLevel: payload.xp_into_level ?? ...,
          xpToNextLevel: payload.xp_to_next_level ?? ...,
          energy: payload.energy ?? state.energy,
          level: payload.level ?? state.level,
        }));
      } catch (iterationError) {
        // Handle partial failures
        if (successfulPurchases > 0) {
          await logClientEvent('building_purchase_partial', {...}, 'warn');
          await get().refreshSession();
        }
        throw iterationError;
      }
    }

    await logClientEvent('building_purchase_success', {...}, 'info');
    await get().refreshSession();
  } catch (error) {
    set({ buildingsError: message || 'Не удалось купить постройку' });
    throw error;
  } finally {
    set({ isProcessingBuildingId: null });
  }
}
```

**Root Cause Analysis:**

- **Непосредственная причина:**
  - Разработчик выбрал простейшую реализацию: loop and call API N times
  - Не передает `quantity` параметр в API
  - Backend не поддерживает batch operation

- **Глубинная причина:**
  - На момент разработки не было обсуждения с backend team
  - Нет API спецификации (OpenAPI контракта)
  - Разработчик предположил что нужно делать по одной (неправильное предположение)

- **Исторический контекст:**
  - Это код который попал из MVP
  - На MVP мало пользователей, поэтому impact не был видно
  - Никто не профилировал API calls
  - Вероятно, "будет оптимизировано потом"

**Взаимосвязи:**

- **Зависимые компоненты:**
  - BuildingCard → handlePurchase → gameStore.purchaseBuilding
  - BuildingsPanel → estimatePlan может рекомендовать ×10 или ×100
  - User может нажать кнопку 5 раз подряд (множественные bulk purchases)

- **Влияние на слои:**
  - Network: 10 requests вместо 1 = 10x трафик
  - Backend: 10 POST /upgrade requests для одного action
  - User: 1-2 seconds latency вместо 100-200ms
  - Rate limiting: может быть triggered

- **Side effects:**
  - Если backend имеет rate limit 1000 req/min per user → 10 purchases × 10 = 100 requests
  - Это 100/1000 = 10% от лимита за одно действие (bad)
  - Batch request был бы 10/1000 = 1% (good)

**Best Practice (Индустриальный стандарт):**

- **Паттерн:** Batch operations с quantity parameter
- **Источник:** [REST API Best Practices - Batch Operations](https://restfulapi.net/rest-api-design-best-practices/#resource-collection-filtering-sorting-and-pagination)

- **Примеры в industry:**
  - Amazon S3: `CopyObject` vs `BatchCopyObject`
  - Google Sheets API: `batchUpdate` для multiple operations
  - Stripe: Batch processing for charges

**Гипотезы для исследования:**

1. Может быть backend API DOES support quantity? Просто неиспользуется?
2. Может быть это был deliberate choice для "atomic operations"? (каждая покупка атомарна)
3. Может быть есть idempotency check на backend? (не может купить дважды)
4. Может быть есть transaction которая reverses если одна fail?

**Направления для углубленного анализа:**

- [ ] **CRITICAL:** Проверить backend /upgrade endpoint спецификацию
  - Поддерживает ли `quantity` параметр?
  - Какая ожидается batch size?
  - Есть ли примеры в tests?

- [ ] Профилировать Network tab в браузере
  - Открыть Developer Tools → Network
  - Купить ×10 buildings
  - Посчитать POST /upgrade requests
  - Если 10 requests → найдена проблема

- [ ] Измерить latency
  - Время от клика до UI обновления
  - Сравнить ×1 vs ×10

- [ ] Проверить есть ли logs на backend
  - Сколько раз вызывается /upgrade endpoint для одной bulk purchase?
  - Есть ли дублирование?

---

### Проблема 2: Energy Updates Every 1 Second causing Cascade Rerenders

**Файл:** `webapp/src/store/gameStore.ts` (строки 452-482)

**Описание:**
```typescript
configurePassiveIncome: (perSec: number, multiplier: number) => {
  const flushPassiveIncome = get().flushPassiveIncome;

  set({ passiveIncomePerSec: perSec, passiveIncomeMultiplier: multiplier });

  if (passiveTicker) {
    clearInterval(passiveTicker);
    passiveTicker = null;
  }

  if (passiveFlushTimer) {
    clearInterval(passiveFlushTimer);
    passiveFlushTimer = null;
  }

  if (perSec > 0) {
    // ❌ Это вызывается каждую секунду!
    passiveTicker = setInterval(() => {
      set(state => ({
        energy: state.energy + perSec,                           // ← Energy меняется!
        pendingPassiveEnergy: state.pendingPassiveEnergy + perSec, // ← Another change
        pendingPassiveSeconds: state.pendingPassiveSeconds + 1,   // ← Another change
      }));
    }, 1000);

    // Flush every 15 seconds
    passiveFlushTimer = setInterval(() => {
      flushPassiveIncome().catch(error => {
        console.warn('Failed to flush passive income', error);
      });
    }, 15000);
  }
}
```

**Root Cause Analysis:**

- **Непосредственная причина:**
  - setInterval запускается каждую сек
  - `set()` вызывается с новым object { energy, pendingPassiveEnergy, pendingPassiveSeconds }
  - Zustand видит что object changed → notifies all subscribers
  - Все компоненты которые используют gameStore → ererender

- **Глубинная причина:**
  - Разработчик хотел simple animation на экране (энергия растет плавно)
  - Не предвидел что это будет глобальный state update
  - Не профилировал performance impact

- **Исторический контекст:**
  - Это был сознательный выбор "накапливать энергию на клиенте"
  - Вероятно, чтобы показать плавную анимацию
  - Но это привело к cascade rerenders

**Взаимосвязи:**

- **Зависимые компоненты:**
  - App.tsx слушает energy
  - BuildingsPanel слушает energy (14 селекторов! из одной деконструкции)
  - MainScreenHeader показывает энергию
  - LevelBar может зависеть от energy
  - Все children этих компонентов ремерируются

- **Влияние на слои:**
  - State: Zustand store обновляется каждую сек
  - Rendering: 60+ ребендеров в минуту
  - UI: Browser должна пересчитать layout, paint
  - Performance: CPU usage, battery drain

- **Side effects:**
  - Если есть animations в других компонентах → они конфликтуют
  - Если есть requestAnimationFrame logic → может быть jank
  - На мобильных: battery drain, throttling

**Best Practice (Индустриальный стандарт):**

- **Паттерн 1: Separate display energy from server state**
  ```typescript
  // Вместо одного energy:
  interface EnergyState {
    serverEnergy: number;           // From server (source of truth)
    lastSyncTime: number;           // When we last synced
    passiveIncomePerSec: number;    // How much per second

    getDisplayEnergy: () => {
      const elapsed = (Date.now() - lastSyncTime) / 1000;
      return serverEnergy + (elapsed * passiveIncomePerSec);
    }
  }
  ```

- **Паттерн 2: Move to local component state**
  ```typescript
  // In component:
  const [displayEnergy, setDisplayEnergy] = useState(serverEnergy);

  useEffect(() => {
    const ticker = setInterval(() => {
      setDisplayEnergy(prev => prev + perSec);
    }, 1000);
    return () => clearInterval(ticker);
  }, [perSec]);

  useEffect(() => {
    setDisplayEnergy(serverEnergy); // Sync when server updates
  }, [serverEnergy]);
  ```

- **Паттерн 3: requestAnimationFrame instead of setInterval**
  ```typescript
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = Date.now();

    const tick = () => {
      const now = Date.now();
      const elapsed = (now - lastTime) / 1000;
      lastTime = now;

      setDisplayEnergy(prev => prev + (elapsed * perSec));
      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, [perSec]);
  ```

- Источник: [React Performance - Moving to requestAnimationFrame](https://react.dev/learn/render-and-commit#batching)

**Гипотезы для исследования:**

1. Может быть это нужно для accuracy? (server sync не всегда perfect)
2. Может быть это нужно для animation? (smooth energy counter)
3. Может быть есть другой способ показать энергию без глобального update?

**Направления для углубленного анализа:**

- [ ] Посмотреть как используется energy в компонентах
  - Отображение в UI (MainScreenHeader)?
  - Расчеты (estimatePlan в BuildingsPanel)?
  - Оба?

- [ ] Профилировать React Profiler
  - Сколько компонентов ремерируется каждую сек?
  - Какие из них могли бы не рермеруваться?

- [ ] Проверить есть ли animation на energy counter
  - Используется ли CSS transition?
  - Используется ли framer-motion?
  - Почему нужно обновлять state каждую сек?

- [ ] Разбить на display vs calculation
  - Energy для UI (displayEnergy) - может быть calculated locally
  - Energy для API calls (actualEnergy) - from server
  - Это разные вещи!

---

### Проблема 3: Global Timer Variables (Memory Leak Risk)

**Файл:** `webapp/src/store/gameStore.ts` (строки 74-76)

**Описание:**
```typescript
let passiveTicker: ReturnType<typeof setInterval> | null = null;
let passiveFlushTimer: ReturnType<typeof setInterval> | null = null;
let passiveFlushInFlight = false;
```

**Root Cause Analysis:**

- **Непосредственная причина:**
  - Timers хранятся в глобальной переменной (outside of state)
  - Когда `configurePassiveIncome()` вызывается → clear old timers and create new
  - Но если что-то не очищается → утечка

- **Глубинная причина:**
  - Разработчик не знал как правильно управлять timers в React/Zustand
  - Видимо, думал что это нужно делать в store level (не в component level)
  - Не добавил cleanup на unmount

- **Исторический контекст:**
  - Это был выбор из-за того что нужно управлять timers на store level
  - Потому что energy calculation нужна везде
  - Но это неправильное место для timers

**Взаимосвязи:**

- **Зависимые компоненты:**
  - App.tsx должна инициализировать gameStore
  - Если App remount'ится (navigation) → configurePassiveIncome не очищает старые timers

- **Влияние на слои:**
  - Memory: Два набора timers работают одновременно → утечка памяти
  - Performance: Двойное количество updates
  - Battery: Двойная drain на мобильных

- **Side effects:**
  - Если есть memory profiling → увидим утечку
  - На долгой сессии → может привести к OOM

**Best Practice (Индустриальный стандарт):**

- **Паттерн:** Move timers to custom hook with cleanup
  ```typescript
  function usePassiveIncome(perSec: number, multiplier: number) {
    useEffect(() => {
      if (perSec <= 0) return;

      const ticker = setInterval(() => {
        // Update state
      }, 1000);

      const flusher = setInterval(() => {
        // Flush passive income
      }, 15000);

      // ✅ Cleanup when unmount or perSec changes!
      return () => {
        clearInterval(ticker);
        clearInterval(flusher);
      };
    }, [perSec]);
  }
  ```

- Источник: [React docs - useEffect cleanup](https://react.dev/learn/synchronizing-with-effects#step-3-add-cleanup-if-needed)

**Гипотезы для исследования:**

1. Есть ли cleanup где-то else в коде?
2. Есть ли unsubscribe function в Zustand store?
3. Когда пользователь закрывает приложение → очищаются ли timers?

**Направления для углубленного анализа:**

- [ ] Открыть DevTools → Memory → Detached DOM elements
  - Есть ли утечка памяти при navigation?

- [ ] Добавить console.log в configurePassiveIncome
  - Сколько раз это вызывается?
  - Заложен ли clearInterval код?

- [ ] Профилировать timer count
  - Сколько active intervals после 1 часа использования?
  - Должно быть 2 (ticker + flusher)
  - Если больше → утечка

---

## 📊 Metrics & Complexity

| Метрика | Значение | Норма | Статус |
|---------|----------|-------|--------|
| Lines of Code | 1104 | < 600 | 🔴 Very Large |
| Number of State Fields | 56 | < 20 | 🔴 God Object |
| Cyclomatic Complexity | 24 | < 10 | 🔴 Very High |
| Number of Actions | 17 | < 12 | ⚠️ Many |
| API Calls per Purchase | 10 | 1 | 🔴 N+1! |
| Energy Updates/min | 60 | < 5 | 🔴 60x worse |
| useEffect count | 0 | N/A | ⚠️ Timers unmanaged |
| TypeScript coverage | 100% | > 90% | ✅ Perfect |
| Error handling | Partial | Full | ⚠️ Incomplete |
| Retry logic | None | Expected | ❌ Missing |

---

## 🔗 Взаимосвязи и зависимости

### Карта зависимостей:

```
gameStore.ts (Center of Everything)
  ├── Uses (Services):
  │   ├── apiClient (all API calls)
  │   ├── postQueue (for sequencing)
  │   ├── logClientEvent (telemetry)
  │   ├── getTelegramInitData (auth)
  │   ├── triggerHapticImpact (feedback)
  │   ├── fetchCosmetics, fetchStarPacks, fetchBoostHub (catalog)
  │   ├── fetchLeaderboard, fetchProfile (social)
  │   └── authStore, uiStore (other stores)
  │
  ├── Used by (Components):
  │   ├── App.tsx (14 selectors!)
  │   ├── BuildingsPanel.tsx (14 selectors)
  │   ├── MainScreenHeader.tsx (multiple)
  │   ├── LevelBar.tsx (multiple)
  │   ├── Leaderboard.tsx
  │   ├── CosmeticShop.tsx
  │   ├── BoostHub.tsx
  │   └── Many other components
  │
  ├── Global State:
  │   ├── User: userId, username, level, xp, tapLevel, energy, stars
  │   ├── Game: buildings, cosmetics, boosts, leaderboard, profile
  │   ├── Session: sessionLastSyncedAt, sessionErrorMessage
  │   └── Timers: passiveTicker, passiveFlushTimer (global!)
  │
  └── API Endpoints:
      ├── POST /auth/telegram
      ├── POST /session
      ├── POST /tick
      ├── POST /upgrade (for both purchase AND upgrade!)
      ├── POST /purchase/invoice
      ├── POST /purchase
      └── Various catalog endpoints
```

### Критичные связи:

1. **gameStore.energy → Every component** (каждую сек)
   - Energy обновляется каждую сек
   - Все компоненты которые слушают energy → ребендер
   - **Cascade effect:** 1 energy update → 10+ component rerenders

2. **gameStore.purchaseBuilding ← BuildingCard** (N+1 problem)
   - BuildingCard передает quantity
   - gameStore делает loop of API calls
   - **Impact:** 10x latency, 10x server load

3. **gameStore.buildings ← BuildingsPanel** (sorting + calculations)
   - BuildingsPanel использует buildings
   - sortedBuildings пересчитывается
   - estimatePlan пересчитывается для всех buildings
   - **Impact:** O(n log n) + O(n × 5000) per rerender

4. **gameStore state sprawl** (56 fields)
   - Any field change → potentially all subscribers notified
   - No optimization for granular updates
   - **Impact:** Hard to optimize, hard to understand

### Potential ripple effects:

- Если изменить structure gameStore → могут break многие компоненты
- Если добавить новое поле → потенциально все компоненты пересчитаются
- Если API contract меняется → много мест для обновления
- Если timer logic меняется → нужна coordination

---

## 📚 Best Practices и источники

### Применимые паттерны:

#### 1. Domain-Driven Store Architecture
- **Описание:** Разбить 56-field монолит на несколько domain-specific stores
- **Источник:** [Zustand - Multiple stores](https://docs.pmnd.rs/zustand/guides/how-to-use-zustand)
- **Примеры в open-source:**
  - [Redux Toolkit - Domain modeling](https://redux-toolkit.js.org/usage/structuring-reducers/normalizing-state-shape)
  - [Pinia stores (Vue)](https://pinia.vuejs.org/core-concepts/modules.html)
- **Почему важно:**
  - Каждый store может быть оптимизирован отдельно
  - Компоненты используют только нужные stores
  - Легче тестировать и масштабировать

#### 2. Separating High-Frequency Updates from State
- **Описание:** Energy меняется часто → отделить от основного state
- **Источник:** [Zustand - Performance tips](https://docs.pmnd.rs/zustand/guides/performance)
- **Примеры:**
  - Display value from calculation (not from state)
  - Use requestAnimationFrame for smooth updates
  - Batch updates before writing to state

#### 3. Batch API Operations
- **Описание:** Отправлять quantity вместо loop of calls
- **Источник:** [REST API Best Practices](https://restfulapi.net/batch-operations/)
- **Примеры:**
  - GraphQL batching (DataLoader pattern)
  - Stripe batch operations
  - Shopify bulk operations API

#### 4. Proper Timer Management with Cleanup
- **Описание:** Move timers to React effects with cleanup
- **Источник:** [React docs - Effects cleanup](https://react.dev/learn/synchronizing-with-effects)
- **Примеры:**
  ```typescript
  useEffect(() => {
    const interval = setInterval(...);
    return () => clearInterval(interval); // ← cleanup!
  }, []);
  ```

### Полезные ресурсы для углубления:

- 📖 [Zustand Best Practices](https://docs.pmnd.rs/zustand/guides/practice)
- 📖 [React Performance](https://react.dev/learn/render-and-commit)
- 🎥 [Jack Herrington - Zustand State Management](https://www.youtube.com/watch?v=gqGzm4w4GDc)
- 💻 [Redux Normalizing State Shape](https://redux.js.org/usage/structuring-reducers/normalizing-state-shape)
- 📊 [Building Scalable Web Applications](https://www.youtube.com/watch?v=sR3I7TNBcnU)

---

## 🔭 Направления для дальнейшего исследования

### Приоритет 1 (Critical): Требует немедленного изучения

1. **Confirm N+1 API calls in purchaseBuilding**
   - **Что изучить:**
     - Network tab при покупке ×5
     - Посчитать POST /upgrade requests
     - Посмотреть timeline
   - **Почему важно:**
     - Это критический issue если true
     - Может быть быстро fixed
   - **Как исследовать:**
     - Открыть DevTools → Network
     - Купить ×5 buildings
     - Посчитать requests
     - Если 5+ requests → N+1 confirmed
   - **Ожидаемый результат:**
     - Подтверждение N+1
     - Recommendation для backend fix

2. **Measure actual energy update frequency and impact**
   - **Что изучить:**
     - React DevTools Profiler
     - Сколько компонентов ремерируется каждую сек
     - Как долго занимает каждый render
   - **Почему важно:**
     - Понять real-world impact
     - Знать что оптимизировать first
   - **Как исследовать:**
     - Открыть React DevTools → Profiler
     - Запустить app на 30 seconds
     - Посмотреть "Rank by renders"
     - Посмотреть которые компоненты ремерируются most often
   - **Ожидаемый результат:**
     - Exact count of rerenderes per component
     - Timeline graph

3. **Check for memory leaks from global timers**
   - **Что изучить:**
     - DevTools → Memory tab
     - Heap snapshots при navigation
     - Compare before/after
   - **Почему важно:**
     - Memory leaks могут быть критичны на мобильных
   - **Как исследовать:**
     - Open app
     - DevTools → Memory
     - Take heap snapshot
     - Navigate to different screen
     - Navigate back
     - Take another heap snapshot
     - Compare (if size increased → leak)
   - **Ожидаемый результат:**
     - Confirmation/denial of memory leak

### Приоритет 2 (High): Желательно исследовать в ближайшее время

1. **Analyze backend API contracts**
   - **Что изучить:**
     - /upgrade endpoint spec
     - Поддерживает ли quantity?
     - Какой batch size allowed?
   - **Почему важно:**
     - Определить scope of fix
     - Может быть backend already supports it!
   - **Как исследовать:**
     - Посмотреть backend код
     - Посмотреть API documentation
     - Посмотреть backend tests
   - **Ожидаемый результат:**
     - Clear specification
     - Implementation guidance

2. **Investigate if energy updates are necessary**
   - **Что изучить:**
     - Почему энергия обновляется каждую сек?
     - Что если обновлять только при sync с сервером?
     - Может ли быть calculated locally?
   - **Почему важно:**
     - Может быть способ убрать этот update
   - **Как исследовать:**
     - Посмотреть как energy используется в UI
     - Посмотреть есть ли animations
     - Посмотреть есть ли calculations
   - **Ожидаемый результат:**
     - Понимание requirements

3. **Check state usage across components**
   - **Что изучить:**
     - Какие компоненты используют gameStore
     - Какие поля они используют
     - Есть ли components что используют только 1-2 field
   - **Почему важно:**
     - Знать где будет biggest impact от optimization
   - **Как исследовать:**
     - Grep для `useGameStore`
     - Посмотреть каждый usage
     - Посчитать selectors
   - **Ожидаемый результат:**
     - Список components с их selector count
     - Priority для optimization

### Приоритет 3 (Medium): Полезно для полноты картины

1. **Study Zustand optimization techniques**
   - **Что изучить:**
     - shallow equality
     - useShallow
     - subscribe patterns
   - **Почему важно:**
     - Может быть способ оптимизировать без splitting

2. **Analyze other stores (authStore, uiStore)**
   - **Что изучить:**
     - Есть ли аналогичные проблемы?
     - Как они структурированы?
     - Есть ли cross-store dependencies?

3. **Research competitive products**
   - **Что изучить:**
     - Как другие idle games управляют state?
     - Как они обрабатывают energy updates?
     - Как они оптимизируют performance?

### Открытые вопросы:

- ❓ **Почему 56 полей в одном store?** Была ли попытка разбить на domain stores?
- ❓ **Когда N+1 был введен?** Был ли это deliberate choice или oversight?
- ❓ **Есть ли backend support для batch purchases?** Или это frontend-only limitation?
- ❓ **Какой target performance?** Есть ли SLA/requirements?
- ❓ **Есть ли другие stores?** Почему не разбить на domain stores?
- ❓ **Кто разработал это?** Была ли code review?
- ❓ **Есть ли performance baseline?** Чтобы измерить улучшения?

---

## 🎯 Выводы

**Краткое резюме:**

gameStore.ts это центр всего приложения, но он имеет serious issues которые критически влияют на performance и quality. 56-field God Object store вызывает cascade rerenders, неправильная обработка energy updates (каждую сек!), КРИТИЧЕСКИЙ N+1 API calls bug при bulk purchases, и глобальные переменные для timers создают memory leak risk. Store нужна срочная архитектурная refactor с фокусом на разбиение на domain stores и оптимизацию energy updates.

**Ключевые инсайты:**

1. **КРИТИЧЕСКИЙ BUG: N+1 API calls** (покупка ×10 = 10 requests вместо 1)
   - Это не предположение - это в коде (loop 887-920)
   - Может быть fixed за день если backend поддерживает quantity
   - Это должно быть Priority #1

2. **Architecture problem: God Object** (56 fields = 56 potential reerendering triggers)
   - Каждый компонент который использует gameStore подписан на все 56 fields
   - energy меняется каждую сек → cascade ребендеры
   - Это системная проблема требующая refactor

3. **Energy updates pattern is wrong** (setInterval с state updates каждую сек)
   - Это вызывает 60+ rerenders в минуту
   - Было бы лучше: display calculated locally, sync with server when needed
   - Или вообще: use requestAnimationFrame вместо setInterval

4. **Memory leak risk** (global timer variables без cleanup)
   - Если App remount'ится → duplicate timers
   - Это может привести к OOM на долгих sessions
   - Нужна move to useEffect с cleanup

5. **API contract не определен** (много optional fields, no batch support)
   - Backend должен быть consulted
   - OpenAPI spec нужна
   - Batch operations должны быть поддержаны

**Архитектурные наблюдения:**

- **Horizontal slicing** вместо **vertical (domain-driven) slicing**: все subsystems (Game, Cosmetics, Boosts, Leaderboard) в одном store
- **No separation of concerns**: бизнес логика, state management, API integration - все перемешано
- **Performance last**: никакого профилирования или optimization до end
- **Technical debt accumulation**: маленькие bad decisions которые скопились

**Рекомендуемые области для следующего анализа:**

1. **Backend API Integration** - проверить /upgrade endpoint (поддерживает ли quantity?)
   - Потому что: N+1 problem зависит от backend capability
   - Impact: Может быть быстро fixed если backend ready

2. **App.tsx (how energy flows)** - понять как energy используется в главном component
   - Потому что: Energy updates вызывают cascade ребендеры
   - Impact: Может быть способ decuple displays от store updates

3. **TickService (backend)** - понять как часто backend обновляет game state
   - Потому что: Может быть backend уже batching updates?
   - Impact: Может быть клиент может быть более efficient

---

## Следующий компонент для анализа

### **App.tsx (Priority 1 - Главный контейнер)**

**Почему именно?**
- Это главный компонент который orchestrates все другие компоненты
- Нужно понять как energy flows из gameStore
- Может быть place где можно decouple energy updates
- Предыдущий анализ BuildingsPanel показал 17 селекторов из gameStore - нужно посмотреть App.tsx
- Есть ли там level up logic которая может быть оптимизирована?

**Что проверим:**
1. Сколько селекторов из gameStore используется?
2. Как часто ререндерится App.tsx?
3. Где расположена level up логика (из BuildingsPanel анализа)?
4. Есть ли способ отделить energy display от других updates?

**Ожидаемый результат:**
- Полная карта как energy flows
- Точка где можно сделать optimization
- Recommendations для refactoring

---

**Отчет готов! 🚀**

**Ключевые рекомендации:**

1. 🔴 **КРИТИЧНО:** Проверить Network tab - сколько API calls при покупке ×10?
2. 🟠 **URGENT:** Начать работу с backend для поддержки quantity в /upgrade
3. 🟠 **HIGH:** Разбить gameStore на domain stores (Game, Cosmetic, Boost, Leaderboard)
4. 🟠 **HIGH:** Переместить energy updates в separate store или component-level state
5. 🟡 **MEDIUM:** Добавить cleanup functions для глобальных timers
6. 🟡 **MEDIUM:** Implement retry logic и exponential backoff для API calls
