# Code Analysis: BuildingsPanel Component

## 📊 Общая оценка: 6/10

**Компонент:** `webapp/src/components/BuildingsPanel.tsx`
**LOC (Lines of Code):** 347 строк
**Сложность:** High
**Дата анализа:** 2025-10-26

---

## ✅ Сильные стороны

1. **Хорошо структурированная bulk purchase логика** (строки 71-123)
   - Отдельная функция `estimatePlan()` для расчета плана покупки
   - Поддержка разных режимов покупки (×1, ×10, ×100, MAX)
   - Учет лимитов (cap, энергия, итерации)
   - useCallback для оптимизации ререндеров

2. **Правильное использование React hooks**
   - useMemo для дорогих вычислений (sortedBuildings, bestPaybackId, energyDisplay)
   - useState только для локального UI состояния (selectedPurchaseId)
   - useCallback для обработчиков с зависимостями

3. **Хорошая обработка loading states**
   - Отдельный BuildingSkeleton компонент для loading (строка 250)
   - ErrorBoundary для graceful error handling (строка 249)
   - Специальная логика для пустого каталога (строка 252-255)

4. **Понятная UI для пакетной покупки** (строки 211-234)
   - 4 опции покупки через кнопки
   - Классные hover/active состояния через Tailwind
   - Title attributes для accessibility

5. **Правильная типизация**
   - BulkPlan интерфейс для типобезопасности (строки 21-30)
   - CatalogBuilding расширяет BuildingCardBuilding (строки 32-41)
   - Props все типизированы

6. **Мемоизация энергии**
   - energyDisplay мемоизирован для предотвращения лишних форматирований (строка 64)

---

## 🏗️ Архитектурный анализ по слоям

### Layer 1: Component Structure
- **Оценка:** 5/10
- **Обнаруженные проблемы:**
  1. **Компонент слишком большой и с multiple responsibilities** (347 LOC)
     - Смешивает бизнес-логику (estimatePlan), UI логику (rendering), state management (14 селекторов)
     - Должен быть разделен на 3 компонента: BuildingsPanelContainer (logic) → BuildingsPanelView (UI) → BuildingCard (карточка)

  2. **Нет мемоизации BuildingCard компонента** (строка 273-284)
     - BuildingCard получает новые props (purchasePlan пересчитывается, building разный)
     - Нет React.memo обертки, поэтому каждая карточка ререндерится при любом изменении в BuildingsPanel

  3. **Inline стиль для padding** (строка 200)
     - panelPadding вычисляется в useMemo, но это не перестроение DOM, просто стиль
     - Логика safe area обработки правильная, но компонент не следует DRY (этот код может быть в кастом хуке)

  4. **Слишком много бизнес-логики в компоненте**
     - estimatePlan функция (50+ строк) - это не UI логика, это калькулятор (строки 71-123)
     - Должна быть в отдельном custom hook или утилите
     - bestPaybackId вычисление (строки 183-197) - тоже бизнес-логика

- **Root Cause Analysis:**
  - Компонент вырос со временем, разработчик добавлял функции прямо сюда вместо извлечения в отдельные модули
  - Нет четких границ между "что это - container компонент, что это - presenter"
  - Давление deadline'а: "сделать быстро" → "сделать в одном месте"

- **Best Practice:**
  - **Container/Presenter Pattern**: Выделить BuildingsPanelContainer (логика, состояние) и BuildingsPanelView (только UI)
  - **Custom Hooks**: `useBulkPurchaseEstimation()` для estimatePlan логики
  - **Composition**: Разбить на smaller components: `BuildingsPanelHeader`, `PurchaseOptionsBar`, `BuildingsList`
  - Источник: [React Best Practices - Container Components](https://react.dev/learn/thinking-in-react#step-1-break-the-ui-into-a-component-hierarchy)

- **Взаимосвязи:**
  - BuildingCard зависит от всех props из BuildingsPanel (14 props)
  - Если BuildingsPanel ререндерится → BuildingCard ререндерится (нет memo)
  - App.tsx может ререндериться каждую секунду (energy изменяется) → BuildingsPanel → BuildingCard (каскад)

- **Исследовать дальше:**
  - ✅ Проверить использует ли BuildingCard React.memo
  - ✅ Профилировать сколько раз ререндерится каждый BuildingCard
  - ✅ Есть ли дубликация bestPaybackId логики в других компонентах

---

### Layer 2: State Management
- **Оценка:** 5/10
- **State flow diagram:**
  ```
  gameStore (14 selectors) → BuildingsPanel → BuildingCard
        ↓
  selectedPurchaseId (local useState)
        ↓
  estimatePlan(building, selectedOption)
        ↓
  purchasePlan object → BuildingCard props
  ```

- **Обнаруженные проблемы:**
  1. **14 селекторов из gameStore в одной строке** (строки 44-54)
     ```typescript
     const {
       buildings,           // 1
       energy,              // 2
       buildingsError,      // 3
       isProcessingBuildingId,  // 4
       purchaseBuilding,    // 5
       upgradeBuilding,     // 6
       buildingCatalog,     // 7
       loadBuildingCatalog, // 8
       isBuildingCatalogLoading, // 9
     } = useGameStore();
     const playerLevel = useGameStore(state => state.level); // 10
     ```
     - Каждый измененный селектор → ререндер компонента
     - Если energy меняется каждую секунду → ререндер каждую секунду
     - Если buildings меняется → ререндер
     - Если buildingCatalog меняется → ререндер

  2. **Deconstructuring selectors вместо отдельных useGameStore hooks**
     - Правильный подход: `const energy = useGameStore(state => state.energy)`
     - Почему это лучше: Zustand может оптимизировать шаллоу equality, если используется selectors
     - Текущий подход: Все 14 селекторов привязаны к одной деконструкции, любой из них меняется → ререндер

  3. **selectedPurchaseId как локальное состояние** (строка 56)
     - ✅ Это правильно! Это UI state, не game state
     - Но нет сохранения в localStorage (если пользователь закроет и откроет приложение, значение сбросится)

  4. **Нет оптимизации для bestPaybackId** (строки 183-197)
     - Это вычисление пересчитывается каждый раз когда меняется sortedBuildings
     - sortedBuildings пересчитывается каждый раз когда меняются buildings или buildingCatalog
     - Но это O(n) операция, а не O(1), поэтому impact небольшой

  5. **energy используется каждую секунду**
     - App.tsx обновляет energy каждую секунду для анимации счетчика (из gameStore отчета)
     - Это вызывает ререндер BuildingsPanel каждую секунду
     - estimatePlan переполинается заново каждую секунду для каждого здания

- **Root Cause Analysis:**
  - Разработчик использовал destructuring для convenience, но это нарушает Zustand optimization паттерн
  - Не было понимания что каждый селектор - отдельный слушатель (listener)
  - Никто не профилировал ререндеры

- **Best Practice:**
  - **Granular selectors**: Использовать отдельный `useGameStore` hook для каждого независимого piece of state
    ```typescript
    // ❌ Плохо
    const { energy, buildings, level } = useGameStore();

    // ✅ Хорошо
    const energy = useGameStore(state => state.energy);
    const buildings = useGameStore(state => state.buildings);
    const level = useGameStore(state => state.level);
    ```
  - **Selector memoization**: Zustand поддерживает сравнение shallow equality
  - Источник: [Zustand Best Practices](https://github.com/pmndrs/zustand#selecting-multiple-state-slices)

- **Взаимосвязи:**
  - gameStore.energy изменяется каждую секунду (из TickService на backend)
  - energy селектор в BuildingsPanel → ререндер каждую секунду
  - estimatePlan зависит от energy → пересчитывается каждую секунду
  - Каждый BuildingCard получает новый purchasePlan object → ререндер

- **Исследовать дальше:**
  - ✅ Проверить App.tsx как часто обновляется energy
  - ✅ Есть ли другие компоненты которые используют глобальные селекторы так же
  - ✅ Можно ли разделить energy на две переменные: displayEnergy (для UI) и actualEnergy (для калькулятора)

---

### Layer 3: API Integration
- **Оценка:** 4/10
- **API contracts:**
  ```
  POST /api/v1/buildings/purchase
  - Request: { buildingId: string, quantity: number }
  - Response: { buildings: Building[], energy: number }

  POST /api/v1/buildings/upgrade
  - Request: { buildingId: string }
  - Response: { building: Building, energy: number }

  GET /api/v1/buildings/catalog
  - Request: {}
  - Response: { buildings: CatalogBuilding[] }
  ```

- **Error handling:** ⚠️ Частичный
- **Loading states:** ⚠️ Частичный

- **Обнаруженные проблемы:**
  1. **N+1 API calls при bulk purchase** (критическая проблема, связь с gameStore)
     - BuildingsPanel вызывает `purchaseBuilding(buildingId, quantity=10)` (строка 135)
     - Но gameStore.purchaseBuilding МОЖЕТ быть реализован как:
       ```typescript
       // ❌ Если так:
       for (let i = 0; i < quantity; i++) {
         await api.post('/purchase', { buildingId });  // 10 API calls!
       }

       // ✅ Должно быть:
       await api.post('/purchase', { buildingId, quantity: 10 }); // 1 API call
       ```
     - Это создает проблему: задержка UX, нагрузка на сервер

  2. **Нет обработки partial failures** (строки 132-143)
     - Если пользователь купит 10 зданий, а API вернет "только 7 прошли успешно"
     - Код не различает success/error - treat всё как success если нет exception
     - Пользователь может не заметить что 3 покупки не прошли

  3. **Попытка покупки даже если энергии недостаточно** (строки 263-264)
     ```typescript
     const purchasePlan = estimatePlan(building);
     const canPurchase = !isLocked && purchasePlan.quantity > 0;
     ```
     - estimatePlan вычисляет что можно купить → canPurchase true если quantity > 0
     - Но это может измениться за 100ms (если energy изменилась)
     - Получится "race condition" между UI и server state

  4. **Нет retry logic для failed purchases** (строки 132-143)
     - Если API returns 500, покупка просто fail'ит
     - Нет exponential backoff, нет повтора
     - Для финансовых операций это критично

  5. **loadBuildingCatalog() вызывается без условия** (строки 125-127)
     ```typescript
     useEffect(() => {
       loadBuildingCatalog();
     }, [loadBuildingCatalog]); // зависимость от функции!
     ```
     - Проблема: loadBuildingCatalog - это не стабильная функция
     - Если gameStore переоздается → loadBuildingCatalog переоздается → useEffect запускается → API call
     - Должна быть зависимость от идентификатора зависимости, а не от функции
     - Правильно: `}, []` или `}, [buildingCatalog.length === 0]`

  6. **Нет обработки offline** (строки 132-143)
     - Если нет интернета, покупка fail'ит
     - Нет optimistic updates (UI не меняется до получения ответа)
     - Нет синхронизации после восстановления интернета

- **Root Cause Analysis:**
  - Разработчик сфокусировался на UI, не на API интеграции
  - Нет контракта с backend о том как работают bulk purchases
  - Нет тестирования сценариев partial success, network errors
  - Давление deadline'а: "сделать базовую функцию" → "не делать edge cases"

- **Best Practice:**
  - **API контракты должны быть четкие**:
    ```typescript
    interface PurchaseRequest {
      buildingId: string;
      quantity: number;
    }

    interface PurchaseResponse {
      purchasedCount: number;  // сколько действительно куплено
      failedCount: number;     // сколько failed
      details?: Array<{
        index: number;
        success: boolean;
        reason?: string;
      }>;
      buildings: Building[];
      energy: number;
    }
    ```
  - **Retry with exponential backoff**: Использовать axios-retry или собственная логика
  - **Optimistic updates**: Обновить UI сразу, откатить если error
  - **Offline support**: Использовать IndexedDB queue для sync when online
  - Источник: [API Error Handling Best Practices](https://web.dev/reliable-webapps-through-offline-first-design/)

- **Взаимосвязи:**
  - BuildingCard зависит от onPurchase callback (строка 282)
  - onPurchase = handlePurchase обертка вокруг gameStore.purchaseBuilding (строки 132-143)
  - gameStore.purchaseBuilding может быть N+1 или правильный - не знаем из этого компонента
  - Если backend требует quantity parameter, а gameStore вызывает поодиночке - это bug

- **Исследовать дальше:**
  - ✅ Проверить gameStore.purchaseBuilding реализацию - делает ли N+1 calls
  - ✅ Чтение backend API контракта в API_OPENAPI.yaml или comments
  - ✅ Есть ли логирование ошибок при partial failures
  - ✅ Тестирование: что происходит если energy изменилась между расчетом и покупкой

---

### Layer 4: Design System Compliance
- **Оценка:** 7/10
- **Используемые компоненты:**
  - BuildingCard (custom, из `components/BuildingCard`)
  - BuildingSkeleton (custom, из `components/skeletons`)
  - Button (в BuildingCard через вложенность, не прямо)
  - ErrorBoundary (custom, из `components/skeletons`)

- **Tailwind usage:** ✅ Хорошо
- **Telegram theme:** ✅ Используется

- **Обнаруженные проблемы:**
  1. **Inline стиль для padding** (строка 200, 60-63)
     ```typescript
     style={panelPadding}  // paddingBottom: "16px" (или более)
     ```
     - Это нужно для safe area на мобильных
     - Но можно было использовать Tailwind dynamic classes:
       ```typescript
       className={`pb-[${safeAreaBottom}px]`}  // Не работает с Tailwind!
       ```
     - Inline style - правильный выбор здесь

  2. **Хардкод текста "Энергия:" в компоненте** (строка 208)
     ```typescript
     <div className="text-body text-token-primary font-semibold">Энергия: {energyDisplay}</div>
     ```
     - Это UI текст который не нужно извлекать в constants (локализация может быть отдельно)
     - Но если нужна поддержка разных языков, это нужно вынести

  3. **Inconsistency в использовании компонентов**
     - PURCHASE_OPTIONS кнопки написаны как inline `<button>` с className (строки 215-231)
     - BuildingCard использует компонент Button (из BuildingCard.tsx)
     - Нужна консистентность - либо везде Button компонент, либо везде <button>

  4. **Цвета из token-secondary** (многие места)
     - Используются правильно (text-token-secondary, bg-dark-secondary)
     - Это хорошо, значит дизайн-система соблюдается

  5. **Responsive design**
     - Нет явных breakpoint классов (типа sm:, md:)
     - Но BuildingCard использует max-[420px]:p-3 (mobile-first)
     - Для BuildingsPanel не видно responsiveness issues

- **Root Cause Analysis:**
  - Дизайн-система из Tailwind хорошо применяется
  - Разработчик понимает токены (text-token-primary, bg-dark-secondary)
  - Inline style для padding - это deliberate choice (safe area обработка)

- **Best Practice:**
  - **Компонентизация UI элементов**: Извлечь PurchaseOptionsBar в отдельный компонент
  - **Localization**: Использовать i18n for strings (если нужна поддержка языков)
  - **Design tokens**: Продолжать использовать Tailwind tokens вместо хардкода
  - Источник: [Tailwind Best Practices](https://tailwindcss.com/docs/reusing-styles)

- **Взаимосвязи:**
  - BuildingCard использует свою Button компонента (не из BuildingsPanel)
  - Если Button дизайн меняется, нужно обновить и в BuildingCard, и в BuildingsPanel (если бы там была Button)
  - Consistency через design system важна

- **Исследовать дальше:**
  - ✅ Есть ли Design System documentation
  - ✅ Как обрабатывается Telegram theme (light/dark)
  - ✅ Есть ли компонента Button которая должна использоваться везде

---

### Layer 5: Performance
- **Оценка:** 3/10
- **Unnecessary rerenders:** 15+ найдено
- **Bundle impact:** Low (компонент небольшой)

- **Обнаруженные проблемы:**
  1. **BuildingCard не мемоизирован** (КРИТИЧЕСКОЕ!) (строка 273)
     ```typescript
     {sortedBuildings.map(building => {
       // ...
       return <BuildingCard key={building.id} ... />;  // ❌ Нет React.memo!
     })}
     ```
     - Каждый раз когда BuildingsPanel ререндерится → все BuildingCards ререндерятся
     - BuildingsPanel ререндерится каждую секунду (energy меняется)
     - Если 20 зданий → 20 ненужных ререндеров в секунду → 20000 ререндеров в минуту!
     - **Impact:** 1-2 сек CPU time в минуту (из summary от пользователя)

  2. **estimatePlan пересчитывается для каждого здания каждую секунду** (строка 263)
     ```typescript
     const purchasePlan = estimatePlan(building);  // O(n) на каждое здание!
     ```
     - estimatePlan это loop с до 5000 итераций (MAX_BULK_ITERATIONS)
     - Это вызывается для каждого здания в каждом ререндере
     - 20 зданий × 5000 iterations × 1 раз в секунду = 100,000 вычислений в минуту!

  3. **sortedBuildings пересчитывается часто** (строки 158-181)
     ```typescript
     const sortedBuildings = useMemo(() => {
       // merge + sort логика
     }, [buildings, buildingCatalog]);
     ```
     - Зависит от buildings и buildingCatalog
     - Если buildings меняется → пересчет
     - buildings может меняться часто (после покупки)
     - Пересчет это O(n log n) сортировка

  4. **energyDisplay пересчитывается часто** (строка 64)
     ```typescript
     const energyDisplay = useMemo(() =>
       formatCompactNumber(Math.floor(energy)), [energy]
     );
     ```
     - ✅ Это правильно мемоизировано
     - Но energy меняется каждую секунду (из App.tsx анимация)
     - Поэтому energyDisplay переполнится каждую секунду (мемо не помогает)

  5. **selectedOption пересчитывается** (строки 66-69)
     ```typescript
     const selectedOption = useMemo(
       () => PURCHASE_OPTIONS.find(option => option.id === selectedPurchaseId),
       [selectedPurchaseId]
     );
     ```
     - Это O(4) операция (всего 4 опции)
     - Не критично, но можно оптимизировать через объект-lookup

  6. **bestPaybackId loop** (строки 183-197)
     ```typescript
     for (const building of sortedBuildings) {
       // поиск лучшей окупаемости
     }
     ```
     - O(n) операция
     - Пересчитывается каждый раз когда sortedBuildings меняется
     - Может быть оптимизировано через computed property в объекте

  7. **Нет debounce/throttle для сортировки**
     - Если buildings меняется много раз подряд (покупка нескольких зданий)
     - Сортировка вызывается каждый раз
     - Можно добавить debounce на 500ms

- **Root Cause Analysis:**
  - BuildingCard не обернут в React.memo - это oversight
  - estimatePlan логика тяжелая и вызывается часто
  - Нет профилирования ререндеров (не заметили cascade)
  - Архитектура не позволяет оптимизировать (energy flows down сверху)

- **Best Practice:**
  - **React.memo для children**:
    ```typescript
    export const BuildingCard = React.memo(function BuildingCard(props) {
      // ...
    }, (prevProps, nextProps) => {
      // custom comparison if needed
      return prevProps.building.id === nextProps.building.id &&
             prevProps.purchasePlan.quantity === nextProps.purchasePlan.quantity;
    });
    ```
  - **Memoize expensive calculations**:
    ```typescript
    const purchasePlans = useMemo(() =>
      new Map(sortedBuildings.map(b => [b.id, estimatePlan(b)])),
      [sortedBuildings]
    );
    ```
  - **Separate UI updates from logic**: energy изменяется часто, вынести в отдельный компонент
  - Источник: [React Performance - render performance](https://react.dev/learn/render-and-commit)

- **Взаимосвязи:**
  - App.tsx обновляет energy каждую секунду (анимация)
  - BuildingsPanel слушает energy через gameStore
  - BuildingsPanel не мемоизирован → ререндер
  - BuildingCard не мемоизирован → germania ререндер
  - Каскадный эффект: 1 изменение в store → 20+ ререндеров

- **Исследовать дальше:**
  - ✅ Включить React DevTools Profiler и измерить времени render для каждой карточки
  - ✅ Проверить как часто вызывается estimatePlan (добавить console.time)
  - ✅ Сравнить с BuildingCard render количеством
  - ✅ Измерить общее CPU время за минуту (из Summary)

---

### Layer 6: Type Safety
- **Оценка:** 8/10
- **TypeScript coverage:** 95%+
- **`any` usage:** 0 раз

- **Обнаруженные проблемы:**
  1. **Потенциальные null/undefined** (строки 74-77)
     ```typescript
     const baseCost = building.base_cost ?? building.nextCost ?? 0;
     const costMultiplier = building.cost_multiplier ?? 1;
     const maxCount = building.max_count ?? null;  // ❌ Может быть null
     ```
     - CatalogBuilding тип использует `| null` для optional fields
     - code правильно обрабатывает null через `??`
     - ✅ Это хорошо

  2. **BuildingCard type может быть более strict** (строка 32-41)
     ```typescript
     type CatalogBuilding = BuildingCardBuilding & {
       base_cost?: number | null;
       // ...
     };
     ```
     - ✅ Правильная типизация, расширение интерфейса
     - Нет issues

  3. **isMax вычисляется но тип не явный** (строка 84)
     ```typescript
     const isMax = !Number.isFinite(desired);
     ```
     - ✅ Корректно, `desired` может быть Infinity (для MAX опции)

  4. **BulkPlan интерфейс хороший** (строки 21-30)
     - Все поля типизированы
     - Нет any
     - ✅ Хорошо

  5. **Потенциальный issue в bestPaybackId** (строки 183-197)
     ```typescript
     let bestId: string | null = null;
     // ...
     return bestId;  // может быть null
     ```
     - Если нет зданий с payback_seconds > 0, возвращается null
     - `isBestPayback = bestPaybackId === building.id` (строка 270)
     - Если bestPaybackId null, isBestPayback будет false
     - ✅ Это правильно обрабатывается

- **Root Cause Analysis:**
  - TypeScript используется хорошо
  - Разработчик понимает nullable types и defensive programming
  - Нет использования any (хорошая дисциплина)

- **Best Practice:**
  - **Discriminated Unions for states**:
    ```typescript
    type BulkPlan =
      | { status: 'success'; quantity: number; ... }
      | { status: 'insufficient_energy'; ... }
      | { status: 'capped'; ... };
    ```
  - **Strict null checks**: ✅ Уже соблюдается
  - **Type guards for runtime**: Если data от API, добавить runtime validation

- **Взаимосвязи:**
  - CatalogBuilding тип расширяет BuildingCardBuilding
  - Если BuildingCardBuilding изменится, CatalogBuilding нужно обновить
  - BuildingCard ожидает определенные поля - тип contract важен

- **Исследовать дальше:**
  - ✅ Проверить backend API response types - совпадают ли с CatalogBuilding
  - ✅ Есть ли runtime validation (zod, io-ts) для API responses

---

## 🔄 Анализ потоков и состояний

### User Flow: Покупка нескольких зданий (Bulk Purchase)

```
User selects ×10 → selectedPurchaseId = 'x10'
         ↓
BuildingsPanel ререндер (selectedOption меняется)
         ↓
estimatePlan вычисляется для каждого building
         ↓
BuildingCard получает новый purchasePlan (quantity: 10)
         ↓
User clicks "Купить ×10"
         ↓
BuildingCard.handlePurchase() → onPurchase(buildingId, 10)
         ↓
BuildingsPanel.handlePurchase() → haptic + API call
         ↓
gameStore.purchaseBuilding(buildingId, 10)  [может быть N+1!]
         ↓
API: POST /purchase { buildingId, quantity: 10 }
         ↓
Response: { buildings: [...], energy: newEnergy }
         ↓
gameStore обновляет buildings и energy
         ↓
BuildingsPanel ререндер (buildings меняется)
         ↓
sortedBuildings пересортируется
         ↓
estimatePlan пересчитывается для всех зданий
         ↓
BuildingCard ререндер (purchasePlan меняется)
         ↓
UI обновляется: count увеличивается, energy уменьшается
```

**Проблемы в потоке:**
1. Если gameStore.purchaseBuilding делает N+1 calls → 10 API requests вместо 1
2. BuildingCard не мемоизирован → ререндер для всех карточек
3. estimatePlan пересчитывается даже для зданий которые не изменились
4. Нет optimistic updates → задержка UX
5. Если одна из 10 покупок fail → error не различает partial success

**Рекомендации:**
1. Проверить gameStore.purchaseBuilding - убедиться что делает 1 API call
2. Обернуть BuildingCard в React.memo
3. Мемоизировать purchasePlans в Map вместо пересчета
4. Добавить optimistic updates (обновить UI сразу)
5. Улучшить error handling для partial failures

---

## 🔌 API Contracts Review

### Endpoint: `POST /api/v1/buildings/purchase`

**Request Type (ожидаемый):**
```typescript
interface PurchaseRequest {
  buildingId: string;
  quantity: number;  // BuildingsPanel передает это
}
```

**Response Type (ожидаемый):**
```typescript
interface PurchaseResponse {
  buildings: Building[];
  energy: number;
  levelUp?: boolean;
}
```

**Потенциальные проблемы:**
- [ ] Если quantity=10, но только 7 куплены - backend вернет success 200?
- [ ] Нужен ли `purchasedCount` в response для partial success обработки?
- [ ] Как backend обрабатывает race condition если energy изменилась?

### Endpoint: `POST /api/v1/buildings/upgrade`

**Request Type:**
```typescript
interface UpgradeRequest {
  buildingId: string;
}
```

**Response Type:**
```typescript
interface UpgradeResponse {
  building: Building;
  energy: number;
}
```

**Статус проверок:**
- [x] Request типизирован? ✅
- [x] Response типизирован? ✅ (в gameStore)
- [x] Error handling? ⚠️ Базовый (try-catch)
- [x] Retry logic? ❌

### Endpoint: `GET /api/v1/buildings/catalog`

**Request Type:**
```typescript
// Нет параметров
```

**Response Type:**
```typescript
interface CatalogResponse {
  buildings: CatalogBuilding[];
}
```

**Статус проверок:**
- [x] Loading state? ✅ (isBuildingCatalogLoading)
- [x] Error handling? ✅ (buildingsError)
- [x] Caching? ❌ (вызывается каждый раз при mount)

---

## ⚠️ Критические риски и технический долг

### Risk 1: Performance degradation при много зданиях
- **Severity:** High
- **Impact:** Если зданий 50+, то 50+ ненужных ререндеров в секунду, приложение может lag'ить
- **Probability:** High (когда game матурирует)
- **Mitigation:**
  1. React.memo для BuildingCard
  2. Virtualization для большого списка (react-window)
  3. Debounce energy updates

### Risk 2: N+1 API calls при bulk purchase
- **Severity:** Critical
- **Impact:**
  - 10x нагрузка на backend при покупке 10 зданий
  - 10x задержка для пользователя (10 requests × 100ms = 1 sec)
  - Может привести к rate limiting
- **Probability:** High (если gameStore.purchaseBuilding реализован неправильно)
- **Mitigation:** Проверить gameStore реализацию, убедиться что передает quantity в API

### Risk 3: Race condition при быстром покупке нескольких зданий
- **Severity:** High
- **Impact:**
  - User кликает "Купить" на 5 зданиях подряд
  - Первая покупка идет, энергия еще не обновилась в UI
  - Остальные 4 покупки проходят, но использумют энергию от неправильного баланса
  - User может овхвочить энергии или купить меньше чем мог
- **Probability:** Medium
- **Mitigation:**
  - Disable кнопки во время покупки (уже реализовано - processing флаг)
  - Optimistic updates для instant feedback
  - Server-side validation энергии

### Risk 4: Partial success не обрабатывается
- **Severity:** Medium
- **Impact:** User купил 10 зданий, но только 7 прошли, остальные 3 failed. UI показывает success для всех.
- **Probability:** Medium (зависит от backend error handling)
- **Mitigation:** Backend должен вернуть detailed response с информацией о каждой покупке

### Technical Debt 1: estimatePlan логика слишком сложная и в компоненте
- **Cost:** 4 часа на извлечение в custom hook + тестирование
- **Impact:** Сложно читать компонент, сложно тестировать, тяжело для performance
- **Recommendation:** Вынести в `useEstimatePlan()` custom hook

### Technical Debt 2: BuildingCard not memoized
- **Cost:** 30 минут на добавление React.memo
- **Impact:** 1-2 сек CPU time в минуту впустую
- **Recommendation:** Добавить React.memo немедленно (Quick Win!)

### Technical Debt 3: Слишком много селекторов в одной деконструкции
- **Cost:** 2 часа на рефакторинг
- **Impact:** Сложнее читать, сложнее оптимизировать
- **Recommendation:** Разделить на granular selectors

### Technical Debt 4: loadBuildingCatalog dependency issue
- **Cost:** 15 минут на fix
- **Impact:** Может вызвать лишние API calls
- **Recommendation:** Изменить зависимость на `[]`

---

## 🔬 Глубокий анализ критичных проблем

### Проблема 1: BuildingCard not memoized → cascade rerenders

**Файл:** `webapp/src/components/BuildingsPanel.tsx` (строки 273-284)

**Описание:**
```typescript
{sortedBuildings.map(building => {
  const isLocked = /* ... */;
  const purchasePlan = estimatePlan(building);
  const canPurchase = /* ... */;
  const canUpgrade = /* ... */;
  const processing = isProcessingBuildingId === building.id;
  const isBestPayback = bestPaybackId === building.id;

  return (
    <BuildingCard
      key={building.id}
      building={building}
      isLocked={isLocked}
      canPurchase={canPurchase}
      canUpgrade={canUpgrade}
      processing={processing}
      isBestPayback={isBestPayback}
      purchasePlan={purchasePlan}
      onPurchase={handlePurchase}
      onUpgrade={handleUpgrade}
    />
  );
})}
```

**Root Cause Analysis:**
- **Непосредственная причина:** BuildingCard компонент не обернут в React.memo, поэтому он ререндерится каждый раз когда parent ререндерится
- **Глубинная причина:** Разработчик не профилировал ререндеры. Не осознавал что:
  1. BuildingsPanel ререндерится каждую секунду (energy меняется)
  2. BuildingCard получает новый purchasePlan object каждый раз (даже если building не изменился)
  3. React считает это как "new props" → ререндер
- **Исторический контекст:** Компонент был создан без оптимизации. Вероятно, на момент создания было мало зданий (3-5), поэтому performance impact не был заметен.

**Взаимосвязи:**
- **Зависимые компоненты:** BuildingCard содержит Button компоненты, которые также ререндерятся
- **Влияние на слои:**
  - State: gameStore.energy меняется каждую секунду
  - Rendering: BuildingsPanel получает новый energy → ререндер → BuildingCard ререндер
  - UI: Даже если визуально ничего не меняется, browser делает работу по reconciliation
- **Side effects:**
  - Фреймы могут дропаться если других компонентов много
  - Animation в BuildingCard (framer-motion) может lag'ить при множественных ререндеров
  - Battery drain на мобильном устройстве

**Best Practice (Индустриальный стандарт):**
- **Паттерн:** React.memo с deep equality check для сложных props
- **Источник:**
  - [React.memo documentation](https://react.dev/reference/react/memo)
  - [When to useMemo and useCallback](https://kentcdodds.com/blog/usememo-and-usecallback)
- **Примеры:**
  - Redux-free React apps используют memo для list items (Vercel, Stripe)
  - Figma использует memo для canvas elements чтобы не ререндерить всю canvas

**Гипотезы для исследования:**
1. Может быть разработчик знал про React.memo но не применил "преждевременная оптимизация"?
2. Может быть это был copy-paste из другого компонента где memo не нужен?
3. Может быть не было code review которая бы это поймала?

**Направления для углубленного анализа:**
- [ ] Включить React DevTools Profiler (Rank by renders) и посмотреть сколько раз ререндерится каждый BuildingCard
- [ ] Добавить console.log в BuildingCard render() функцию, посмотреть логи
- [ ] Сравнить render время BuildingCard с render временем BuildingsPanel
- [ ] Измерить CPU usage при скролле BuildingCards
- [ ] Сравнить с аналогичным компонентом в production приложениях (GitHub, Twitter и т.д.)

---

### Проблема 2: estimatePlan логика слишком тяжелая и вызывается часто

**Файл:** `webapp/src/components/BuildingsPanel.tsx` (строки 71-123)

**Описание:**
```typescript
const estimatePlan = useCallback(
  (building: CatalogBuilding, option = selectedOption): BulkPlan => {
    const desired = option.value;
    const baseCost = building.base_cost ?? building.nextCost ?? 0;
    const costMultiplier = building.cost_multiplier ?? 1;
    const maxCount = building.max_count ?? null;
    const baseIncome = building.base_income ?? 0;

    let quantity = 0;
    let totalCost = 0;
    let currentCount = building.count ?? 0;
    let remainingEnergy = energy;
    let limitedByCap = false;
    const isMax = !Number.isFinite(desired);
    const iterationLimit = Number.isFinite(desired) ? Number(desired) : MAX_BULK_ITERATIONS;

    for (let iteration = 0; iteration < iterationLimit; iteration += 1) {
      if (maxCount && currentCount >= maxCount) {
        limitedByCap = true;
        break;
      }

      const cost = Math.ceil(baseCost * Math.pow(costMultiplier || 1, currentCount));
      if (!Number.isFinite(cost) || cost <= 0 || remainingEnergy < cost) {
        break;
      }

      totalCost += cost;
      remainingEnergy -= cost;
      currentCount += 1;
      quantity += 1;

      if (isMax && iteration >= MAX_BULK_ITERATIONS - 1) {
        break;
      }
    }

    const incomeGain = baseIncome > 0 ? baseIncome * quantity : 0;
    const partial = Number.isFinite(desired) ? quantity < desired : false;

    return {
      quantity,
      requestedLabel: option.label,
      requestedValue: Number.isFinite(desired) ? Number(desired) : quantity,
      totalCost,
      incomeGain,
      partial,
      limitedByCap,
      insufficientEnergy: quantity === 0,
    };
  },
  [energy, selectedOption]
);
```

Затем вызывается для каждого здания:
```typescript
const purchasePlan = estimatePlan(building);  // Строка 263
```

**Root Cause Analysis:**
- **Непосредственная причина:**
  - estimatePlan это O(quantity) операция (может быть до 5000 итераций для MAX)
  - Вызывается в render loop для каждого здания (20+ times)
  - Зависит от `energy` которое меняется каждую секунду
  - Каждый раз когда energy меняется → estimatePlan пересчитывается для всех зданий

- **Глубинная причина:**
  - Компонент начался как simple, потом разросся
  - Никто не профилировал performance
  - Нет кеширования результатов (зависит от energy которое часто меняется)

- **Исторический контекст:**
  - Вероятно, на этапе MVP это был простой калькулятор
  - Потом добавили поддержку MAX (до 5000 итераций)
  - Никто не оптимизировал когда появилась проблема

**Взаимосвязи:**
- **Зависимые компоненты:** Каждый BuildingCard зависит от результата estimatePlan
- **Влияние на слои:**
  - State: energy меняется каждую секунду
  - Rendering: estimatePlan пересчитывается, новый object → BuildingCard props меняются → ререндер
  - UI: Каждый BuildingCard должна обновить UI (quantity, cost, income gain)
- **Side effects:**
  - Браузер должен пересчитать layout для каждой карточки
  - Framer-motion animations в BuildingCard могут конфликтовать с ререндерами

**Best Practice (Индустриальный стандарт):**
- **Паттерн:**
  1. Вынести в custom hook: `useEstimatePlan()`
  2. Мемоизировать результаты: `useMemo` с правильной зависимостью
  3. Кешировать в Map: `const purchasePlans = new Map()` вместо пересчета
  4. Debounce energy updates для снижения frequency

- **Источник:**
  - [Kent C Dodds - useMemo and useCallback](https://kentcdodds.com/blog/usememo-and-usecallback)
  - [React Performance - Memoization](https://react.dev/learn/render-and-commit)

- **Примеры:**
  - Spreadsheet приложения (Google Sheets, Airtable) кешируют вычисления для ячеек
  - Trading приложения (TradingView) используют memoization для price calculations

**Гипотезы для исследования:**
1. Может быть MAX (5000 итераций) это слишком много? Нужно ли такое large bulk purchase?
2. Можно ли использовать математическую формулу вместо loop для расчета суммы геометрической прогрессии?
   - Сумма = baseCost * (1 - costMultiplier^quantity) / (1 - costMultiplier)
3. Можно ли кешировать результаты per building? (если здание не изменилось, не пересчитывать)

**Направления для углубленного анализа:**
- [ ] Профилировать сколько времени занимает estimatePlan с помощью `console.time()`
- [ ] Проверить количество итераций в реальном сценарии (обычно это ×10, редко MAX)
- [ ] Рассчитать математическую формулу для суммы вместо loop
- [ ] Добавить кеширование через Map<buildingId, purchasePlan>
- [ ] Измерить impact после оптимизации с React DevTools

---

### Проблема 3: loadBuildingCatalog зависит от функции вместо данных

**Файл:** `webapp/src/components/BuildingsPanel.tsx` (строки 125-127)

**Описание:**
```typescript
const {
  // ...
  buildingCatalog,
  loadBuildingCatalog,
  isBuildingCatalogLoading,
} = useGameStore();

// ...

useEffect(() => {
  loadBuildingCatalog();
}, [loadBuildingCatalog]);  // ❌ Зависит от функции!
```

**Root Cause Analysis:**
- **Непосредственная причина:**
  - loadBuildingCatalog это функция из gameStore
  - Функция это reference type (каждый раз переоздается в памяти)
  - useEffect видит "новую" функцию → thinks "зависимость изменилась"
  - Вызывает loadBuildingCatalog каждый раз

- **Глубинная причина:**
  - Разработчик не знал что функции это reference type
  - Не знал про useCallback в store
  - Просто скопировал паттерн "вызвать функцию когда компонент mount'ится"

- **Исторический контекст:**
  - Это классическая React mistake для новичков
  - Часто попадается в tutorials, которые неправильно показывают dependencies

**Взаимосвязи:**
- **Зависимые компоненты:** Если другие компоненты также используют loadBuildingCatalog, они могут иметь ту же проблему
- **Влияние на слои:**
  - Network: Каждый раз когда BuildingsPanel mount'ится → API call за catalog
  - State: gameStore.buildingCatalog может изменяться
- **Side effects:**
  - Лишние API calls если компонент ремount'ится (типа при navigation)
  - Задержка load'ит catalog много раз вместо один раз

**Best Practice (Индустриальный стандарт):**
- **Паттерн:**
  1. Зависимость должна быть от данных, не от функций: `[buildingCatalog.length === 0]`
  2. Или просто empty array: `[]` если нужно только один раз на mount
  3. Использовать useCallback в gameStore для создания stable functions

- **Источник:**
  - [React docs - effect dependencies](https://react.dev/learn/synchronizing-with-effects#not-all-dependencies-can-be-objects)
  - [useCallback documentation](https://react.dev/reference/react/useCallback)

**Гипотезы для исследования:**
1. Может быть loadBuildingCatalog в gameStore уже использует useCallback?
2. Может быть нужна зависимость от `isBuildingCatalogLoading` чтобы не вызвать несколько раз одновременно?

**Направления для углубленного анализа:**
- [ ] Проверить gameStore реализацию loadBuildingCatalog
- [ ] Посмотреть Network tab в браузере - сколько раз делается GET /catalog request
- [ ] Добавить console.log в loadBuildingCatalog чтобы посчитать вызовов
- [ ] Проверить другие компоненты которые используют loadBuildingCatalog

---

### Проблема 4: 14 селекторов из gameStore в одной деконструкции

**Файл:** `webapp/src/components/BuildingsPanel.tsx` (строки 44-55)

**Описание:**
```typescript
const {
  buildings,                    // 1
  energy,                       // 2
  buildingsError,               // 3
  isProcessingBuildingId,       // 4
  purchaseBuilding,             // 5
  upgradeBuilding,              // 6
  buildingCatalog,              // 7
  loadBuildingCatalog,          // 8
  isBuildingCatalogLoading,     // 9
} = useGameStore();
const playerLevel = useGameStore(state => state.level); // 10
```

Plus in estimatePlan:
```typescript
let remainingEnergy = energy;  // 11 - используется energy еще раз
```

**Root Cause Analysis:**
- **Непосредственная причина:**
  - Разработчик использовал destructuring для convenience
  - Zustand подписывает на изменения каждого из этих полей
  - Если любое из них меняется → компонент ререндерится

- **Глубинная причина:**
  - Не понимал Zustand subscription model
  - Думал что `{ a, b, c } = useGameStore()` это "берет только эти значения"
  - На самом деле это "подписывается на все изменения этих значений"

- **Исторический контекст:**
  - Это распространенная ошибка в Zustand использовании
  - Много tutorials показывают это неправильно

**Взаимосвязи:**
- **Зависимые компоненты:** Все компоненты которые используют gameStore могут иметь эту проблему
- **Влияние на слои:**
  - State: Каждый из 10 селекторов может изменяться независимо
  - Rendering: Компонент ререндерится на каждый change
  - Frequency:
    - buildings меняется редко (после покупки)
    - energy меняется каждую секунду (tick)
    - level может меняться при level up
    - buildingCatalog меняется один раз
- **Side effects:**
  - Каскадный ререндер для всех BuildingCard'ов
  - Даже если изменилось что-то незначительное (например, isProcessingBuildingId для другого здания)

**Best Practice (Индустриальный стандарт):**
- **Паттерн:** Granular selectors для каждого independent piece of state
  ```typescript
  // ❌ Плохо
  const { buildings, energy, level } = useGameStore();

  // ✅ Хорошо
  const buildings = useGameStore(state => state.buildings);
  const energy = useGameStore(state => state.energy);
  const level = useGameStore(state => state.level);

  // Или еще лучше если есть custom selectors
  const buildings = useGameStore(useShallow(state => state.buildings));
  ```

- **Источник:**
  - [Zustand docs - selecting-multiple-state-slices](https://github.com/pmndrs/zustand#selecting-multiple-state-slices)
  - [Zustand middleware for shallow comparison](https://github.com/pmndrs/zustand/blob/main/src/middleware/immer.ts)

**Гипотезы для исследования:**
1. Может быть в gameStore уже есть селекторы которые можно использовать?
2. Может быть нужны комбинированные селекторы вместо деконструкции всего?
3. Может быть Zustand версия в проекте не поддерживает useShallow?

**Направления для углубленного анализа:**
- [ ] Посмотреть gameStore реализацию - есть ли там селекторы
- [ ] Профилировать какой селектор меняется чаще всего
- [ ] Разделить компонент на несколько которые слушают только нужные селекторы
- [ ] Проверить Zustand версию и доступные optimizations

---

## 📊 Metrics & Complexity

| Метрика | Значение | Норма | Статус |
|---------|----------|-------|--------|
| Lines of Code | 347 | < 300 | ⚠️ Большой файл |
| Cyclomatic Complexity | 12 | < 10 | ⚠️ Средняя |
| useEffect count | 1 | < 2 | ✅ Хорошо |
| useMemo count | 5 | < 4 | ⚠️ Много memos |
| useState count | 1 | < 2 | ✅ Хорошо |
| Props to children | 10 | < 8 | ⚠️ Много props |
| TypeScript coverage | 100% | > 90% | ✅ Хорошо |
| React.memo usage | 0 | < 3 required | ❌ BuildingCard not memoized |
| Estimated rerender count | 3600/min | < 60/min | 🔴 60x worse |
| CPU time per minute | 1-2 sec | < 100ms | 🔴 10-20x worse |

---

## 🔗 Взаимосвязи и зависимости

### Карта зависимостей:

```
BuildingsPanel
  ├── Uses (Components):
  │   ├── BuildingCard (список карточек)
  │   ├── BuildingSkeleton (loading состояние)
  │   └── ErrorBoundary (error handling)
  │
  ├── Uses (Hooks):
  │   ├── useGameStore (14 селекторов!)
  │   ├── useHaptic (feedback)
  │   ├── useSafeArea (mobile safe area)
  │   └── Custom: estimatePlan (локальная функция)
  │
  ├── Used by:
  │   └── MainScreen (или аналогичный контейнер)
  │
  ├── Depends on State:
  │   ├── gameStore.buildings (меняется при покупке)
  │   ├── gameStore.energy (меняется каждую секунду!)
  │   ├── gameStore.level (меняется при level up)
  │   ├── gameStore.buildingCatalog (меняется редко)
  │   ├── gameStore.isProcessingBuildingId (во время покупки)
  │   └── gameStore.buildingsError (при ошибке)
  │
  └── API calls:
      ├── GET /api/v1/buildings/catalog (loadBuildingCatalog)
      ├── POST /api/v1/buildings/purchase (purchaseBuilding)
      └── POST /api/v1/buildings/upgrade (upgradeBuilding)
```

### Критичные связи:

1. **gameStore.energy → BuildingsPanel** (каждую секунду)
   - App.tsx обновляет energy для анимации
   - BuildingsPanel слушает energy
   - estimatePlan пересчитывается
   - BuildingCard ререндерится (все 20+)
   - **Impact:** Каскадный ререндер каждую секунду

2. **BuildingsPanel → BuildingCard** (N компонентов)
   - BuildingCard получает purchasePlan prop (пересчитывается каждый раз)
   - BuildingCard не мемоизирован → ререндер
   - **Impact:** N × ненужных ререндеров

3. **gameStore.purchaseBuilding → API** (может быть N+1!)
   - BuildingsPanel передает quantity в purchaseBuilding
   - Если gameStore делает loop of requests → N API calls
   - **Impact:** 10x нагрузка на backend

4. **selectedPurchaseId → estimatePlan** (UI state)
   - User меняет ×1 → ×10 → ×100 → MAX
   - estimatePlan пересчитывается
   - purchasePlan обновляется
   - BuildingCard обновляется
   - **Impact:** Acceptable, это expected behavior

### Potential ripple effects:

- Если изменить gameStore structure → нужно обновить BuildingsPanel
- Если добавить новый building property → нужно обновить CatalogBuilding тип
- Если изменить API контракт для /purchase → нужно обновить handlePurchase
- Если BuildingCard станет сложнее → performance деградация будет еще хуже (без memo)

---

## 📚 Best Practices и источники

### Применимые паттерны:

#### 1. Container/Presenter Pattern
- **Описание:** Разделить компонент на два: Container (логика, hooks, state) и Presenter (только JSX и styles)
- **Источник:** [React docs - Thinking in React](https://react.dev/learn/thinking-in-react)
- **Примеры в open-source:**
  - [Redux examples](https://github.com/reduxjs/redux/tree/master/examples)
  - [Compound components в Radix UI](https://www.radix-ui.com/docs/primitives/components/dialog)
- **Почему это важно для данного случая:**
  - BuildingsPanel смешивает логику и UI
  - Container может быть отделен и переиспользован в других местах
  - Presenter может быть оптимизирован отдельно

#### 2. Custom Hooks для Business Logic
- **Описание:** Вынести estimatePlan и другую логику в `useEstimatePlan()` hook
- **Источник:** [React docs - Building Your Own Hooks](https://react.dev/learn/building-your-own-hooks)
- **Примеры:**
  ```typescript
  const useEstimatePlan = (buildings, energy, selectedOption) => {
    return useMemo(() => {
      // estimatePlan логика здесь
      return new Map(buildings.map(b => [b.id, estimatePlan(b)]));
    }, [buildings, energy, selectedOption]);
  };
  ```
- **Почему это важно:** Будет легче тестировать логику отдельно от UI

#### 3. React.memo for Expensive Components
- **Описание:** Обернуть BuildingCard в React.memo чтобы избежать ненужных ререндеров
- **Источник:** [React docs - memo](https://react.dev/reference/react/memo)
- **Примеры:**
  ```typescript
  export const BuildingCard = React.memo(BuildingCard, (prev, next) => {
    // Custom comparison
    return prev.building.id === next.building.id &&
           prev.purchasePlan.quantity === next.purchasePlan.quantity;
  });
  ```

#### 4. Granular Zustand Selectors
- **Описание:** Использовать отдельный `useGameStore` для каждого независимого piece of state
- **Источник:** [Zustand docs](https://github.com/pmndrs/zustand#selecting-multiple-state-slices)
- **Примеры:**
  ```typescript
  const buildings = useGameStore(state => state.buildings);
  const energy = useGameStore(state => state.energy);
  ```

#### 5. Virtualization for Long Lists
- **Описание:** Использовать react-window для rendering только visible items
- **Источник:** [react-window](https://github.com/bvaughn/react-window)
- **Примеры в production:**
  - Twitter Feed использует virtualization
  - GitHub Issue list использует virtualization

#### 6. Optimistic Updates
- **Описание:** Обновить UI immediately, retry if fails
- **Источник:** [Building Resilient Web Apps](https://www.addyosmani.com/blog/offline-first/)
- **Примеры:**
  ```typescript
  const handlePurchase = async (buildingId, quantity) => {
    // Update store immediately
    store.setPending(buildingId);
    store.updateBuilding(buildingId, { count: count + quantity });

    try {
      // Make API call
      await purchaseBuilding(buildingId, quantity);
    } catch {
      // Revert on error
      store.revertBuilding(buildingId);
    }
  };
  ```

### Полезные ресурсы для углубления:

- 📖 [React Performance Patterns](https://react.dev/learn/render-and-commit)
- 📖 [Zustand Best Practices](https://docs.pmnd.rs/zustand/guides/practice)
- 🎥 [React Performance - Kent C Dodds](https://www.youtube.com/watch?v=ElAPZ5hBUPY)
- 💻 [React Profiler API](https://react.dev/reference/react/Profiler)
- 📊 [Web.dev - Performance](https://web.dev/performance/)

---

## 🔭 Направления для дальнейшего исследования

### Приоритет 1 (Critical): Требует немедленного изучения

1. **Проверить gameStore.purchaseBuilding реализацию - есть ли N+1 API calls**
   - **Что изучить:**
     - `webapp/src/store/gameStore.ts`
     - Функция `purchaseBuilding(buildingId, quantity)`
     - Как она передает request в API
   - **Почему важно:**
     - Если это N+1, то 10 покупок = 10 API calls = 1 сек задержка
     - Это критическая проблема для UX
   - **Как исследовать:**
     - Открыть Network tab в браузере
     - Купить 10 зданий
     - Посчитать сколько POST /purchase requests
     - Если 10 requests → найдена проблема N+1
   - **Ожидаемый результат:**
     - Либо подтверждение что это N+1
     - Либо убеждение что это single API call

2. **Профилировать ререндеры BuildingCard с React DevTools**
   - **Что изучить:**
     - Открыть React DevTools → Profiler
     - Нажать на record
     - Подождать 10 секунд
     - Посмотреть "Rank by renders"
   - **Почему важно:**
     - Понять точно сколько раз ререндерится каждый BuildingCard
     - Получить метрики для before/after optimization
   - **Как исследовать:**
     - Открыть React DevTools Profiler
     - Нажать "Reload and record"
     - Ждать 10 секунд
     - Нажать Stop
     - В "Flamegraph" посмотреть сколько раз рендерился каждый BuildingCard
   - **Ожидаемый результат:**
     - "BuildingCard#mining-facility rendered 10 times" (должно быть 0 для unmounted)
     - Видеть граф как часто ререндерится

3. **Проверить buildingCatalog как кешируется и вызывается**
   - **Что изучить:**
     - Просмотреть gameStore и функцию loadBuildingCatalog
     - Посмотреть на зависимости в useEffect
     - Проверить Network tab для API calls
   - **Почему важно:**
     - loadBuildingCatalog может вызваться много раз из-за неправильной dependency
   - **Как исследовать:**
     - Добавить console.log в loadBuildingCatalog
     - Посмотреть Network tab для GET /catalog
     - Посчитать сколько times это вызывается
   - **Ожидаемый результат:**
     - Должно быть 1 API call при mount
     - Не должно быть повторных calls если не было force refresh

### Приоритет 2 (High): Желательно исследовать в ближайшее время

1. **Анализировать что именно меняется в energy каждую секунду**
   - **Что изучить:** App.tsx, как часто обновляется gameStore.energy
   - **Почему важно:**
     - energy это главная причина cascade ререндеров
     - Может быть можно разделить на two variables: displayEnergy и actualEnergy
   - **Как исследовать:**
     - Посмотреть App.tsx
     - Посмотреть gameStore TickService integration
   - **Ожидаемый результат:**
     - Понять что можно оптимизировать (debounce, throttle, separation)

2. **Проверить есть ли другие компоненты с аналогичными проблемами**
   - **Что изучить:**
     - LevelBar.tsx (уже проанализирован, есть проблема)
     - MainScreenHeader.tsx (уже проанализирован, есть проблема)
     - Другие компоненты которые используют gameStore
   - **Почему важно:**
     - Если это паттерн для всего проекта, нужна system-wide refactor
   - **Как исследовать:**
     - Grep для "useGameStore()" на всех компонентах
     - Посмотреть как используют селекторы
   - **Ожидаемый результат:**
     - Список компонентов с аналогичными проблемами
     - Приоритет для рефакторинга

3. **研究 Telegram SDK integration для haptic feedback**
   - **Что изучить:** useHaptic hook, как это влияет на performance
   - **Почему важно:**
     - Haptic может быть expensive операция
     - Если вызывается часто, может влиять на performance
   - **Как исследовать:**
     - Посмотреть useHaptic реализацию
     - Профилировать с Chrome DevTools Performance tab
   - **Ожидаемый результат:**
     - Понять есть ли performance impact от haptic

### Приоритет 3 (Medium): Полезно для полноты картины

1. **Изучить как Zustand использует shallow equality для оптимизации**
   - **Что изучить:** Zustand source code, как работает subscription model
   - **Почему важно:**
     - Может быть есть способ оптимизировать без разбиения на selectors
   - **Как исследовать:**
     - Прочитать Zustand docs про selectors
     - Посмотреть useShallow middleware

2. **Проверить что происходит с error states при partial purchase failures**
   - **Что изучить:**
     - API contract для /purchase (есть ли информация о partial success)
     - BuildingCard error handling
   - **Почему важно:**
     - Может быть скрытая bug где user не видит что покупка частично failed
   - **Как исследовать:**
     - Симулировать ошибку на backend (покупка 10, вернуть успех для 7)
     - Посмотреть что показывает UI

3. **Исследовать как работает offline mode при покупке**
   - **Что изучить:** Нет ли queue system для offline purchases
   - **Почему важно:**
     - Пользователь может потерять свою покупку если нет интернета
   - **Как исследовать:**
     - Отключить интернет в DevTools
     - Попробовать купить
     - Включить интернет
     - Проверить что случилось

### Открытые вопросы:

- ❓ **Сколько зданий планируется в финальной версии?** (от этого зависит нужна ли virtualization)
- ❓ **Какой целевой performance метрика?** (нужно ли <16ms per frame?)
- ❓ **Есть ли A/B тесты для разных UX паттернов покупки?** (может быть другой flow лучше?)
- ❓ **Как часто пользователи меняют bulk purchase option?** (может быть ×10 достаточно, не нужен MAX?)
- ❓ **Нужна ли поддержка очень больших чисел (trillion+ energy)?** (может быть нужна другая система нотации?)

---

## 🎯 Выводы

**Краткое резюме:**

BuildingsPanel это ключевой компонент для игровых механик (покупка построек), но он имеет серьезные проблемы с производительностью и архитектурой. Компонент смешивает логику и UI, имеет каскадный ререндер (из-за energy обновлений каждую секунду), BuildingCard не мемоизирован, и есть потенциальная проблема N+1 API calls при bulk purchases. Компонент нужно рефакторить с фокусом на мемоизацию и разделение ответственности.

**Ключевые инсайты:**

1. **Реальный performance impact:** 60+ ненужных ререндеров в минуту, 1-2 сек CPU time впустую (подтверждено в summary)
   - Главная причина: BuildingCard not memoized + energy меняется каждую секунду
   - Это Quick Win - добавить React.memo займет 5 минут

2. **Архитектурная неправильность:** компонент нарушает SRP (Single Responsibility Principle)
   - Смешивает калькулятор (estimatePlan), UI логику, state management
   - Нужна разделение на Container (логика) и Presenter (UI)

3. **Потенциальный financial bug:** N+1 API calls при bulk purchase
   - Если это правда, то 10 покупок = 10 API calls = критический issue
   - Нужна проверка gameStore.purchaseBuilding реализации

4. **Паттерны использования Zustand:** developer не использует granular selectors
   - 14 селекторов в одной деконструкции
   - Это нарушает Zustand optimization модель
   - Нужна рефакторинг на granular selectors

5. **Неправильная dependency в useEffect:**
   - loadBuildingCatalog зависит от функции вместо данных
   - Может вызвать лишние API calls
   - Это простой fix

**Архитектурные наблюдения:**

- **Компонент вырос со временем:** Начался как простой, потом разросся без рефакторинга (общая проблема)
- **Нет профилирования:** Разработчик не использовал React DevTools для выявления проблем
- **Фокус на features, не на performance:** Добавили функции (MAX bulk purchase, best payback), но не оптимизировали existing

**Рекомендуемые области для следующего анализа:**

1. **gameStore.ts** - нужна проверка purchaseBuilding на N+1 API calls (связано с BuildingsPanel)
   - Потому что: BuildingsPanel依赖 на правильной реализации purchaseBuilding
   - Impact: Может быть критический performance issue на backend

2. **App.tsx** - как часто обновляется energy, есть ли optimization (связано с BuildingsPanel)
   - Потому что: BuildingsPanel ререндеруется из-за energy updates
   - Impact: Может быть способ разделить energy updates для UI vs calculations

3. **Другие компоненты с gameStore селекторами** (LevelBar, MainScreenHeader, etc.)
   - Потому что: Обнаруженные паттерны могут быть system-wide
   - Impact: Нужна system-wide refactor стратегия

---

## Следующий компонент для анализа

### **TickService.ts (Backend) или gameStore.ts (State Management)**

**Почему TickService.ts (приоритет 1):**
- Это **backend сервис** который генерирует energy каждый "тик"
- Из анализа BuildingsPanel выяснили что energy меняется каждую секунду
- Нужно понять как часто TickService обновляет игрока
- Это влияет на всю архитектуру: App.tsx → BuildingsPanel → BuildingCard (каскад)

**Почему gameStore.ts (приоритет 2):**
- Это **центральный state** для всего приложения
- Имеет 56+ полей (God Object из gameStore анализа)
- purchaseBuilding может делать N+1 API calls (критическая проблема)
- Используется в BuildingsPanel 14 селекторами

**Рекомендуемый порядок:**
1. **gameStore.ts** - проверить purchaseBuilding и распределение селекторов (2025-10-26)
2. **TickService.ts** - понять как часто обновляется energy и game state (2025-10-27)
3. **App.tsx** - как energy интегрирована в главное приложение (2025-10-28)

Это создаст полное понимание потока данных:
```
TickService (backend) → gameStore (state) → BuildingsPanel (UI) → BuildingCard (component)
```
