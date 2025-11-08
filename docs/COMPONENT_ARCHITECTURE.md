# Energy Planet - React Component Architecture

## 🏗️ Структура папок

```
webapp/src/
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx         # Основной лейаут с BottomNav
│   │   ├── BottomNavigation.tsx  # Нижняя навигационная панель
│   │   └── Header.tsx            # Заголовок с профилем
│   │
│   ├── screens/                  # Полноэкранные страницы
│   │   ├── TapScreen.tsx         # Главный экран (/)
│   │   ├── ExchangeScreen.tsx    # Магазин (/exchange)
│   │   ├── FriendsScreen.tsx     # Рефералы (/friends)
│   │   ├── EarnScreen.tsx        # Заработок (/earn)
│   │   ├── ChatScreen.tsx        # Социальный чат (/chat, WIP)
│   │   └── AirdropScreen.tsx     # Исторический экран airdrop (legacy)
│   │
│   ├── ui/                       # Переиспользуемые UI компоненты
│   │   ├── Button.tsx            # Кнопки (Primary, Secondary, Disabled)
│   │   ├── Card.tsx              # Карточки
│   │   ├── ProgressBar.tsx       # Прогресс-бары
│   │   ├── Modal.tsx             # Модальные окна
│   │   ├── Toast.tsx             # Уведомления
│   │   ├── Badge.tsx             # Бейджи (статусы)
│   │   ├── Spinner.tsx           # Загрузка
│   │   ├── Tabs.tsx              # Вкладки
│   │   └── Divider.tsx           # Разделители
│   │
│   ├── tap/                      # Модули экрана Tap
│   │   ├── TapCircle.tsx         # Кликабельный круг планеты
│   │   ├── StatsSummary.tsx      # Сводка по энергии/множителям/престижу
│   │   └── DailyTasksBar.tsx     # Полоса ежедневных задач и CTA
│   │
│   ├── friends/                  # Реферальные компоненты
│   │   └── FriendsList.tsx       # Список рефералов и CTA приглашений
│   │
│   ├── earn/                     # Компоненты экрана Earn
│   │   └── EarnTasksBoard.tsx    # Обёртка над BoostHub с фильтрами
│   │
│   ├── airdrop/                  # Компоненты таймлайна событий
│   │   └── AirdropTimeline.tsx   # Сезонные события и награды
│   │
│   └── common/                   # Переиспользуемые игровые элементы
│       ├── BuildingCard.tsx      # Карточка здания
│       ├── UserStats.tsx         # Статистика игрока (legacy)
│       ├── ProfitCounter.tsx     # Счетчик дохода (legacy)
│       ├── TaskCard.tsx          # Карточка задачи (legacy)
│       └── BoostBadge.tsx        # Значок активного буста (legacy)
│
├── hooks/
│   ├── useGame.ts               # Хук для игровых данных (Zustand)
│   ├── useApi.ts                # Хук для API запросов
│   ├── useAuth.ts               # Хук для авторизации
│   ├── useTelegram.ts           # Интеграция с Telegram WebApp SDK
│   └── useAnimations.ts         # Хук для анимаций (rafael)
│
├── store/
│   ├── gameStore.ts             # Zustand store для игры
│   ├── uiStore.ts               # Zustand store для UI состояния
│   └── types.ts                 # TypeScript типы для store
│
├── services/
│   ├── api.ts                   # API клиент
│   ├── telegram.ts              # Telegram WebApp SDK wrapper
│   └── storage.ts               # LocalStorage/SessionStorage
│
├── utils/
│   ├── format.ts                # Форматирование (монеты, время)
│   ├── math.ts                  # Игровые расчеты (формулы)
│   ├── constants.ts             # Константы игры
│   └── colors.ts                # Цветовая палитра
│
├── types/
│   ├── game.ts                  # Типы игровых объектов
│   ├── api.ts                   # Типы API ответов
│   └── telegram.ts              # Типы Telegram WebApp
│
└── App.tsx                      # Основной компонент приложения
```

---

## 🧩 Компоненты по типам

### Layout Components

#### `AppLayout.tsx`
**Назначение:** Обертка для всего приложения

```typescript
interface AppLayoutProps {
  children: React.ReactNode;
  currentTab: 'tap' | 'exchange' | 'friends' | 'earn' | 'airdrop';
}

// Структура:
// ┌─────────────────────┐
// │   <Header />        │  (Динамический, зависит от экрана)
// ├─────────────────────┤
// │   {children}        │  (Основной контент)
// │   (Scrollable)      │
// ├─────────────────────┤
// │ <BottomNav />       │  (Фиксированная)
// └─────────────────────┘
```

**Props:**
```typescript
- children: ReactNode
- currentTab: 'tap' | 'exchange' | 'friends' | 'earn' | 'airdrop'
```

**Features:**
- Responsive padding-bottom для контента (чтобы не скрыться под nav)
- Светлое/темное отображение Header в зависимости от экрана
- Smooth переходы между вкладками

---

#### `BottomNavigation.tsx`
**Назначение:** Навигационная панель с 5 вкладками

```typescript
interface BottomNavProps {
  activeTab: 'tap' | 'exchange' | 'friends' | 'earn' | 'airdrop';
  onTabChange: (tab: string) => void;
}

interface NavItem {
  id: 'tap' | 'exchange' | 'friends' | 'earn' | 'airdrop';
  label: string;
  icon: React.ComponentType;
  badge?: number; // для уведомлений
}
```

**Структура:**
- 5 кнопок в ряд
- Активная кнопка: темный фон, белый текст
- Неактивные: светлый текст, прозрачный фон
- Ширина каждой: 20% (1/5)
- Иконка сверху, текст снизу

**Features:**
- Анимация при клике (scale 0.95 → 1)
- Badge для непрочитанных уведомлений
- Smooth transition 150ms

---

#### `Header.tsx`
**Назначение:** Верхняя часть экрана с динамическим содержимым

```typescript
interface HeaderProps {
  type: 'tap' | 'exchange' | 'friends' | 'earn' | 'airdrop';
  userName: string;
  userLevel: string;
  userAvatar?: string;
  profitPerHour: number;
  currentBalance?: number;
  levelProgress?: number;
}
```

**Варианты:**
- **TAP Screen Header**
  - Профиль + Уровень + Доход в час
  - Settings иконка

- **EXCHANGE Header**
  - "Exchange" заголовок
  - Текущий баланс

- **FRIENDS Header**
  - "Friends & Referrals" заголовок
  - Быстрая статистика рефералов

- **EARN Header**
  - "Earn More" заголовок

- **AIRDROP Header**
  - "Events & Airdrops" заголовок

---

### Screen Components

#### `TapScreen.tsx`
**Назначение:** Главный экран с кликабельной планетой

```typescript
interface TapScreenProps {}

// Состояние:
const [points, setPoints] = useState(0);
const [energy, setEnergy] = useState(0);
const [clicks, setClicks] = useState<ClickAnimation[]>([]);
```

**Структура:**
1. Header (профиль, уровень, доход)
2. Daily Tasks Bar (3 карточки с таймерами)
3. Points Display (большой текст с балансом)
4. Tap Circle (главный интерактивный элемент)
5. Float Animations (числа, которые плывут вверх)

**Key Features:**
- Real-time энергия восстановления (tick каждую секунду)
- 3D tilt эффект на Tap Circle при клике
- Floating number animation (+11, +50 и т.д.)
- Haptic feedback через Telegram WebApp API
- Anti-tap spam (макс 10 тапов в секунду)

---

#### `ExchangeScreen.tsx`
**Назначение:** Магазин зданий и улучшений

```typescript
interface ExchangeScreenProps {
  buildings: Building[];
  inventory: Record<string, number>;
  currentBalance: number;
  onBuildingBuy: (buildingId: string) => void;
}

interface Building {
  id: string;
  name: string;
  icon: string;
  profitPerHour: number;
  baseCost: number;
  currentCost: number; // базовая стоимость * multiplier ^ count
  level: number;
  maxLevel: number;
  category: 'profitability' | 'special' | 'rare';
  unlockLevel?: number;
  description: string;
}
```

**Структура:**
1. Header с балансом
2. Scrollable список категорий:
   - PROFITABILITY (обычные здания)
   - SPECIALS (специальные)
   - RARE (редкие)
3. Building Cards (повторяющиеся)
4. Action: Buy / Upgrade кнопка

**Key Features:**
- Категории с collapse/expand
- Фильтрация по доступности (locked если нет уровня)
- Цветные иконки зданий
- Отображение стоимости в сокращенном формате (1.2K, 5.5M)
- Мгновенное обновление UI при покупке (оптимистичный update)

---

#### `FriendsScreen.tsx`
**Назначение:** Реферальная система

```typescript
interface FriendsScreenProps {
  userStats: {
    friendCount: number;
    earnedFromReferrals: number;
    growthLastWeek: number;
  };
  referralLink: string;
  invitedFriends: InvitedFriend[];
}

interface InvitedFriend {
  id: string;
  name: string;
  level: string;
  earnings: number;
  status: 'joined' | 'pending';
  invitedAt: Date;
  joinedAt?: Date;
}
```

**Структура:**
1. Stats Box (друзья, заработок, прирост)
2. Invite Link Section
   - Ссылка
   - QR код (опционально)
   - [COPY] [SHARE] кнопки
3. Referral Program Info (условия)
4. Invited Friends List (scrollable)

**Key Features:**
- Copy to clipboard функция
- Share через Telegram Direct (использует Telegram SDK)
- Переключение между "Joined" и "Pending" статусом
- Real-time обновление списка
- Отображение дохода от каждого друга

---

#### `EarnScreen.tsx`
**Назначение:** Дополнительные способы заработка

```typescript
interface EarnScreenProps {
  adAvailableCount: number;
  maxAdsPerDay: number;
  tasks: Task[];
  activeBoosts: Boost[];
}

interface Task {
  id: string;
  title: string;
  description: string;
  reward: number;
  status: 'completed' | 'claimable' | 'locked' | 'available';
  externalLink?: string;
  unlockCondition?: string;
}

interface Boost {
  id: string;
  name: string;
  description: string;
  multiplier: number;
  timeLeft: number; // в секундах
}
```

**Структура:**
1. Watch Ads Section
   - Описание (30 sec video)
   - Награда
   - Лимит счетчик (5/10)
   - [WATCH] кнопка
   - Таймер до следующего объявления

2. Tasks Section (scrollable)
   - Task Cards
   - Разные статусы: ✅ COMPLETED / [CLAIM] / [LOCKED]

3. Active Boosts (scrollable)
   - Boost Cards с временем

**Key Features:**
- Интеграция с рекламными сетями (Yandex Ads, AdMob)
- Таймер для лимита объявлений
- Внешние ссылки на задачи (Twitter, Discord и т.д.)
- Real-time счетчик активных бустов
- Анимация при получении награды (pop-up notification)

---

#### `AirdropScreen.tsx`
**Назначение:** События, сезоны, будущие раздачи

```typescript
interface AirdropScreenProps {
  currentSeason: Season;
  upcomingEvents: GameEvent[];
  tokenAirdrop: TokenAirdrop;
}

interface Season {
  id: string;
  name: string;
  description: string;
  timeLeftSeconds: number;
  playerProgress: number; // 0-100
  rewards: SeasonReward[];
}

interface GameEvent {
  id: string;
  title: string;
  description: string;
  startsIn: number; // секунды
  bonus: string;
}

interface TokenAirdrop {
  status: 'coming_soon' | 'active' | 'ended';
  qualificationRequirements: string[];
  estimatedDate?: string;
}
```

**Структура:**
1. Current Season Card
   - Название
   - Таймер
   - Прогресс-бар
   - Список наград (top %, количество)

2. Upcoming Events List (scrollable)
   - Event Cards
   - Дата/время начала
   - Краткая описание

3. Token Airdrop Info
   - Статус
   - Условия квалификации
   - Дата (если известна)

**Key Features:**
- Live таймеры (обновляются каждую секунду)
- Прогресс-бар с процентом
- Визуальное отображение наград (медали 🥇🥈🥉)
- Красивая типография для больших чисел

---

### UI Components (Reusable)

#### `Button.tsx`
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}

// Варианты:
// Primary: Золотой фон, черный текст (для основных действий)
// Secondary: Темный фон, белый текст (для вторичных действий)
// Tertiary: Прозрачный фон, цветной текст (для ссылок)
// Ghost: Без фона, только текст
```

#### `Card.tsx`
```typescript
interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'interactive' | 'highlight';
  padding?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

// Варианты:
// default: Стандартная карточка с бордюром
// interactive: Курсор меняется на pointer, hover эффект
// highlight: Яркий фон для привлечения внимания
```

#### `ProgressBar.tsx`
```typescript
interface ProgressBarProps {
  value: number; // 0-100
  label?: string;
  showPercent?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
}
```

#### `Modal.tsx`
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  actions?: ModalAction[];
}

interface ModalAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}
```

#### `Toast.tsx`
```typescript
interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number; // мс
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Используется через useToast hook
const { showToast } = useToast();
showToast('Построка куплена!', 'success');
```

---

### Game-Specific Components

#### `TapCircle.tsx`
```typescript
interface TapCircleProps {
  onTap: (x: number, y: number) => void;
  imageUrl: string;
  isDisabled?: boolean;
  size?: number; // в px, по умолчанию 320
}

// Features:
// - 3D tilt эффект при движении мыши
// - Pulse animation (glow)
// - Ripple эффект при клике
// - Disabled state при низкой энергии
```

#### `DailyTasksBar.tsx`
```typescript
interface DailyTasksBarProps {
  tasks: DailyTask[];
}

interface DailyTask {
  id: 'reward' | 'cipher' | 'combo';
  icon: string;
  label: string;
  timeLeftSeconds: number;
  isCompleted?: boolean;
  onClick?: () => void;
}

// Отображает 3 карточки в ряд
// Каждая карточка содержит:
// - Иконка
// - Название
// - Таймер (HH:MM)
// - Статус (доступна / уже получена)
```

#### `BuildingCard.tsx`
```typescript
interface BuildingCardProps {
  building: Building;
  level: number;
  canAfford: boolean;
  isLocked: boolean;
  onBuy: () => void;
}

// Структура:
// ┌──────────────────────────┐
// │ [ICON] Building Name     │
// │ Profit/hour: +5.2K       │
// │ Level: 5/10              │
// │ Cost: 150,000            │
// │          [BUY] or [LOCK] │
// └──────────────────────────┘
```

#### `UserStats.tsx`
```typescript
interface UserStatsProps {
  userName: string;
  userLevel: string;
  levelProgress: number; // 0-100
  currentLevelIndex: number;
  maxLevels: number;
}

// Отображает:
// - Имя пользователя
// - Уровень с прогресс-баром
// - Индекс уровня (6/10)
```

---

## 🎨 Styling Strategy

### Tailwind CSS Classes

**Основные классы для использования:**

```css
/* Цвета фона */
.bg-black          /* #000000 - основной фон */
.bg-slate-900      /* #1d2025 - вторичный фон */
.bg-slate-800      /* #272a2f - карточки */
.bg-amber-400      /* #f3ba2f - золотой accent */
.bg-gray-700       /* #43433b - бордюры */

/* Текст */
.text-white        /* основной текст */
.text-gray-400     /* вторичный текст */
.text-amber-400    /* цветной текст */

/* Размеры */
.w-80 .h-80        /* 320px квадрат для tap circle */
.p-4               /* 16px padding */
.gap-2 до .gap-4   /* spacing между items */

/* Округление */
.rounded-lg        /* 12px */
.rounded-3xl       /* 24px - для nav */

/* Тени и эффекты */
.shadow-lg         /* box-shadow для elevation */
.backdrop-blur     /* blur эффект */
```

### CSS Modules (для сложных стилей)

```css
/* src/components/TapCircle/TapCircle.module.css */
.tapCircle {
  /* 3D perspective */
  perspective: 1000px;
  transition: transform 100ms cubic-bezier(0.4, 0, 0.2, 1);
}

.tapCircle:hover {
  transform: rotateX(var(--rotateX)) rotateY(var(--rotateY));
}

.pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(243, 186, 47, 0.7); }
  50% { box-shadow: 0 0 0 10px rgba(243, 186, 47, 0); }
}
```

---

## 🔗 Зависимости компонентов

```
App
├── AppLayout
│   ├── Header
│   ├── [ScreenComponents] (одна из):
│   │   ├── TapScreen
│   │   │   ├── DailyTasksBar
│   │   │   ├── TapCircle
│   │   │   └── FloatingNumber (animated)
│   │   ├── ExchangeScreen
│   │   │   └── BuildingCard (x many)
│   │   ├── FriendsScreen
│   │   │   ├── StatsBox
│   │   │   ├── InviteLink
│   │   │   └── FriendsList
│   │   ├── EarnScreen
│   │   │   ├── AdSection
│   │   │   ├── TaskCard (x many)
│   │   │   └── BoostBadge (x many)
│   │   └── AirdropScreen
│   │       ├── SeasonCard
│   │       ├── EventCard (x many)
│   │       └── TokenAirdropInfo
│   │
│   └── BottomNavigation
│       └── NavItem (x5)
│
└── Global Modals
    ├── Toast (from useToast)
    └── Modal (from useModal)
```

---

## 📦 Dependencies

```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.x.x",
  "zustand": "^4.x.x",
  "tailwindcss": "^3.x.x",
  "typescript": "^5.x.x",
  "@tma.js/sdk": "^3.x.x",
  "@tma.js/sdk-react": "^3.x.x"
}
```
> ℹ️ В соответствии с https://docs.telegram-mini-apps.com/packages/tma-js-sdk официальная команда Telegram выводит `@telegram-apps/*` из эксплуатации в 2026, поэтому новые зависимости указываем через `@tma.js/*`.

---

## 🚀 Следующие шаги для реализации

1. **Setup проект структуру:**
   - Создать папки согласно структуре
   - Создать базовые компоненты (Button, Card, ProgressBar)

2. **Реализовать Layout:**
   - AppLayout + BottomNavigation
   - Header с динамическим контентом

3. **Реализовать TapScreen:**
   - DailyTasksBar
   - TapCircle с 3D эффектом
   - Floating animations

4. **Реализовать остальные экраны:**
   - Exchange, Friends, Earn, Airdrop

5. **Интегрировать Zustand:**
   - gameStore для состояния игры
   - uiStore для UI состояния

6. **API интеграция:**
   - Подключить к backend API
   - Оптимистичные updates

7. **Telegram SDK:**
   - WebApp инициализация
   - Haptic feedback
   - Share функция

Все готово к реализации! 🚀
