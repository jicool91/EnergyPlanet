# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ ВАЖНО: Язык общения

**ВСЕГДА общайся с пользователем на РУССКОМ языке!** Пользователь не понимает английский. Все объяснения, вопросы и комментарии должны быть на русском.

## Статус проекта

**Текущая стадия:** MVP в разработке

**Что уже реализовано:**
- ✅ Express backend с TypeScript
- ✅ Docker Compose для локальной разработки
- ✅ Все основные services (AuthService, TapService, UpgradeService, SessionService, LeaderboardService, CosmeticService и т.д.)
- ✅ Repository паттерн (UserRepository, ProgressRepository, InventoryRepository и т.д.)
- ✅ Полная система миграций БД (migrate up/down/status)
- ✅ ContentService для загрузки контента из JSON/YAML
- ✅ Anti-cheat валидация в TapService и UpgradeService
- ✅ Middleware (auth, error handling, logging)
- ✅ Redis кеш и session management
- ✅ PostgreSQL подключение

**Что ещё нужно для MVP:**
- 🔨 Telegram OAuth авторизация (валидация initData)
- 🔨 JWT токены (access 15мин + refresh 30 дней)
- 🔨 React фронтенд (Telegram Mini App)
- 🔨 Zustand state management
- 🔨 Rate limiting middleware
- 🔨 Монетизация (Telegram Stars + Rewarded Ads)
- 🔨 Feature flags система
- 🔨 Load тестирование

## Project Overview

**Energy Planet** - idle tap игра в формате Telegram Mini App. Игроки генерируют энергию тапами и строят структуры, соревнуются в лидербордах и открывают косметику.

**Tech Stack:**
- **Backend:** Node.js (TypeScript), Express, PostgreSQL, Redis
- **Frontend:** React (TypeScript), Vite, Telegram WebApp SDK
- **Infrastructure:** Docker Compose (локально), Railway (production)
- **Monetization:** Telegram Stars, Rewarded Ads (Yandex/AdMob)

## Repository Structure

```
energyPlanet/
├── backend/              # Node.js/Express API server
│   ├── src/
│   │   ├── api/         # HTTP routes & controllers
│   │   ├── services/    # Business logic
│   │   ├── db/          # Database connection
│   │   ├── cache/       # Redis client
│   │   ├── middleware/  # Auth, rate limiting, error handling
│   │   ├── config/      # Configuration loader
│   │   └── utils/       # Helpers & logger
│   ├── migrations/      # SQL migration scripts
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── webapp/              # React Telegram Mini App
│   ├── src/
│   │   ├── screens/    # Main UI screens
│   │   ├── components/ # Reusable components
│   │   ├── store/      # Zustand state management
│   │   ├── services/   # API client
│   │   └── types/      # TypeScript types
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── vite.config.ts
│
├── content/             # Game content (Content-as-Data)
│   ├── seasons/        # Season configs (YAML)
│   ├── items/          # Buildings, upgrades (JSON)
│   ├── cosmetics/      # Skins, frames, effects (JSON)
│   └── flags/          # Feature flags (JSON)
│
├── k8s/                 # Kubernetes manifests
│   ├── deploy.yaml     # Deployments, Services, Ingress
│   ├── configmap.yaml  # Environment config
│   └── secrets.yaml    # Secrets template
│
├── docs/                # Documentation
│   ├── GDD.md          # Game Design Document
│   ├── MVP_SPEC.md     # MVP specification
│   ├── ROADMAP.md      # Product roadmap
│   └── API_OPENAPI.yaml # OpenAPI spec
│
├── Jenkinsfile          # CI/CD pipeline
├── docker-compose.yml   # Local development
└── README.md
```

## Команды разработки

### Быстрый старт с Docker Compose (рекомендуется)

```bash
# Запустить все сервисы (PostgreSQL, Redis, Backend, Webapp, Mail)
docker-compose up

# Или в фоновом режиме
docker-compose up -d

# Просмотр логов
docker-compose logs -f backend
docker-compose logs -f webapp

# Остановить все
docker-compose down

# Удалить все данные и пересоздать
docker-compose down -v && docker-compose up
```

**Доступные сервисы:**
- Backend API: http://localhost:3000
- Webapp: http://localhost:5173
- PostgreSQL: localhost:5432
- Redis: localhost:6379
- Health check: http://localhost:3000/health

### Локальная разработка без Docker

Если хочешь запустить backend и webapp локально (требует Node.js 18+, PostgreSQL и Redis):

**Backend:**
```bash
cd backend

# Установить зависимости
npm install

# Создать .env файл
cp .env.sample .env
# Отредактировать .env с реальными данными PostgreSQL и Redis

# Применить миграции БД
npm run migrate:up

# Запустить dev сервер на :3000
npm run dev
```

**Webapp:**
```bash
cd webapp

# Установить зависимости
npm install

# Создать .env файл
cp .env.sample .env

# Запустить Vite dev сервер на :5173
npm run dev
```

### Миграции БД

✅ **Система миграций полностью реализована** в `backend/src/db/migrate.ts`

```bash
cd backend

# Применить все новые миграции
npm run migrate:up

# Откатить последнюю миграцию
npm run migrate:down

# Показать статус всех миграций
npm run migrate:status

# Создать новую миграцию
# Вручную создать файл в формате: migrations/00X_название.sql
# Пример: migrations/004_my_feature.sql
```

**Текущие миграции:**
- `001_initial_schema.sql` - основные таблицы (users, progress, inventory, sessions, purchases, events)
- `002_clans_schema.sql` - система кланов (Post-MVP)
- `003_arena_schema.sql` - арена/PvP (Post-MVP)

**Как работает система миграций:**
- Миграции отслеживаются в таблице `schema_migrations` (версия, имя, дата применения)
- При `migrate:up` применяются только новые миграции
- При `migrate:down` используются файлы отката `00X_название_rollback.sql` (если есть)
- Все миграции выполняются в транзакции для безопасности

### Тестирование

```bash
cd backend

# Все тесты с покрытием
npm test

# Watch режим (перезапускает при изменении файлов)
npm run test:watch

# Один конкретный тест
npm test -- --testNamePattern="TapService"
npm test -- AuthService

# Только интеграционные тесты
npm run test:integration

# Линтинг и проверка типов
npm run lint                # ESLint проверка
npm run lint:fix            # ESLint фиксирование ошибок
npm run typecheck           # TypeScript проверка типов
npm run format              # Prettier форматирование
```

### Сборка

```bash
# Backend
cd backend
npm run build               # Компиляция TypeScript в dist/

# Webapp
cd webapp
npm run build               # Production сборка в dist/

# Docker образы (для Railway)
docker build -t energy-planet-backend:latest ./backend
docker build -t energy-planet-webapp:latest ./webapp
```

### Тестирование в Telegram

```bash
# 1. Запусти локальный сервер
docker-compose up

# 2. Используй ngrok для туннелирования
ngrok http 5173

# 3. Настрой Telegram Bot с URL от ngrok
# 4. Открой Mini App в Telegram для тестирования
```

## Ключевые архитектурные паттерны

### Repository Pattern (Доступ к данным)

Все операции с БД инкапсулированы в Repository классах (в `backend/src/repositories/`):

```typescript
// base.ts - базовые утилиты для всех repository
export async function runQuery<T>(text: string, params?: any[], client?: PoolClient): Promise<QueryResult<T>>

// Конкретные repositories (наследуют подход):
- UserRepository - операции с пользователями (getById, create, update)
- ProgressRepository - прогрессия игрока (energy, level, XP)
- InventoryRepository - инвентарь (какие построки у игрока)
- SessionRepository - сессии игроков
- PurchaseRepository - история покупок
- LeaderboardRepository - кеширование лидербордов
- BoostRepository - активные бусты
- EventRepository - логирование событий для anti-cheat
- ProfileRepository - профиль и косметика
- UserCosmeticsRepository - владение косметикой
```

**Преимущества:**
- Все SQL запросы в одном месте - легко проверить на уязвимости
- Параметризованные запросы - защита от SQL injection
- Переиспользуемая логика через базовый класс
- Легко тестировать с mock'ами

**Как использовать:**
```typescript
// В сервисах
import { UserRepository } from '../repositories/UserRepository';

const userRepo = new UserRepository();
const user = await userRepo.getById(userId);
await userRepo.update(userId, { energy: newEnergy });
```

### Content-as-Data (Контент как данные)

Весь игровой контент хранится в версионированных JSON/YAML файлах, отделён от кода:
- ✅ Контент в git вместе с кодом (GitOps)
- ✅ Обновление контента без изменения кода
- ✅ Легкое A/B тестирование через feature flags
- ✅ Контроль версий и откаты
- ✅ Легко редактируется дизайнерами

**Content Loader:** `backend/src/services/ContentService.ts`
- Загружает контент при старте приложения
- Gracefully обрабатывает отсутствие файлов (MVP mode)
- Использует переменную окружения `CONTENT_PATH` для гибкости

**Как это работает:**

| Среда | Путь контента | Как передается |
|--------|--------------|-----------------|
| **Local dev** | `/content` (корень repo) | Auto-detection в config |
| **Production** | `CONTENT_PATH` env var | Railway/K8s переменная окружения |
| **Future (K8s)** | Image Volume | Отдельный container image |

**MVP стратегия:**
- ContentService не падает если контент не найден
- Приложение запускается с пустым контентом (все методы возвращают defaults)
- На Railway контент загружается через инициализационный процесс (сейчас используется env переменная)

### Anti-Cheat система (Защита от читов)

✅ **Основная валидация реализована** в `TapService` и `UpgradeService`

Серверная валидация всех игровых действий:

**Tap Validation** (валидация тапов в TapService):
- Максимум 10 тапов в секунду (TPS)
- Проверка силы тапа не превышает баланс
- Логирование подозрительных действий в таблицу `events`

**Energy Gain Validation** (валидация прироста энергии):
- Проверка энергии от пассивного дохода (10% допуск)
- Логирование аномалий для анализа
- В TickService рассчитывается корректный прирост

**Purchase Idempotency** (идемпотентность покупок):
- ✅ Реализована в `PurchaseService`
- Каждая покупка имеет уникальный `purchase_id` (UUID от клиента)
- Проверяем существование `purchase_id` перед обработкой в `PurchaseRepository`
- Возвращаем тот же результат если уже обработано

**Event Logging** (`EventRepository`):
- Все подозрительные действия логируются для анализа
- Используется для статистики и обнаружения паттернов читов

### Feature Flags (Флаги функций)

⚠️ **TODO:** Нужно реализовать систему флагов.

Все фичи управляются через `/content/flags/default.json`:

```json
{
  "features": {
    "tier_4_buildings_enabled": false,
    "clan_system_enabled": false,
    "arena_system_enabled": false,
    "cosmetics_shop_enabled": true,
    "rewarded_ads_enabled": true
  }
}
```

**Использование в коде:**
```typescript
// В сервисах (когда реализуем)
if (!contentService.isFeatureEnabled('cosmetics_shop_enabled')) {
  return res.status(503).json({ error: 'Feature disabled' });
}
```

### API Authentication (Аутентификация)

⚠️ **В процессе реализации:**
- Структура middleware готова в `backend/src/middleware/auth.ts`
- JWT генерация реализована
- Нужно: Telegram OAuth валидация initData хеша

**Планируемый Telegram OAuth Flow:**
1. Клиент отправляет `initData` от Telegram WebApp
2. Сервер валидирует hash используя bot token (в AuthService)
3. Сервер выдает JWT access token (15 мин) + refresh token (30 дней)
4. Клиент включает `Authorization: Bearer <token>` во все запросы

**Текущее состояние:**
- `AuthService.ts` - основная логика авторизации
- `backend/src/middleware/auth.ts` - middleware для проверки токена
- Нужно добавить валидацию Telegram initData hash в AuthService

### Service Layer (Бизнес логика)

Все основные сервисы находятся в `backend/src/services/`. Каждый сервис отвечает за одну область:

```
AuthService          - авторизация, JWT токены, валидация Telegram
TapService           - валидация тапов, начисление энергии
UpgradeService       - покупка улучшений, проверка ресурсов
SessionService       - управление сессией, offline gains
TickService          - пассивный доход каждый "тик" времени
LeaderboardService   - кеширование лидербордов
CosmeticService      - косметика, владение, экипировка
BoostService         - активные эффекты и бусты
PurchaseService      - история покупок, идемпотентность
ProfileService       - профиль игрока
ContentService       - загрузка контента из JSON/YAML
```

**Как написать новый сервис:**
1. Создай файл `backend/src/services/MyService.ts`
2. Инжектируй нужные Repository через конструктор
3. Реализуй публичные методы
4. Используй в контроллерах

```typescript
// Пример структуры сервиса
export class MyService {
  private userRepo: UserRepository;
  private progressRepo: ProgressRepository;

  constructor() {
    this.userRepo = new UserRepository();
    this.progressRepo = new ProgressRepository();
  }

  async doSomething(userId: string) {
    const user = await this.userRepo.getById(userId);
    // логика...
    return result;
  }
}
```

### State Management (Управление состоянием фронтенда)

⚠️ **TODO:** Нужно реализовать Zustand store.

**Zustand Store** (`webapp/src/store/gameStore.ts`):
- Единое глобальное состояние
- Actions для `initGame()`, `tap()`, `upgrade()`
- Оптимистичные обновления UI для отзывчивости

### Database Schema

**Core Tables:**
- `users` - Telegram user accounts
- `progress` - Player stats (level, energy, XP)
- `inventory` - User buildings & counts
- `purchases` - Transaction log (idempotency)
- `events` - Analytics & anti-cheat logs
- `cosmetics` - Catalog (synced from content files)
- `user_cosmetics` - Ownership
- `user_profile` - Equipped cosmetics
- `boosts` - Active boost effects

**Post-MVP Tables:** (migrations 002, 003)
- `clans`, `clan_members`, `clan_chat`
- `arena_stats`, `arena_battles`, `arena_queue`

See: `backend/migrations/001_initial_schema.sql`

## Типовые задачи и паттерны разработки

### Добавить новый API эндпоинт

Типичный flow: Route → Controller → Service → Repository

```typescript
// 1. Создай route в backend/src/api/routes/myRoute.ts
router.post('/my-endpoint', myController.handleRequest);

// 2. Создай controller в backend/src/api/controllers/MyController.ts
export class MyController {
  async handleRequest(req: Request, res: Response) {
    const result = await myService.doSomething(req.body);
    res.json(result);
  }
}

// 3. Создай service в backend/src/services/MyService.ts
export class MyService {
  async doSomething(data) {
    // используй repositories
    return result;
  }
}

// 4. Зарегистрируй route в backend/src/api/routes/index.ts
app.use('/api/my', myRoute);

// 5. Обнови docs/API_OPENAPI.yaml
```

### Добавить новое здание в игру

1. Edit `/content/items/buildings.json`:
```json
{
  "id": "new_building",
  "name": "New Building",
  "tier": 2,
  "base_income": 500,
  "base_cost": 50000,
  "unlock_level": 8,
  ...
}
```

2. Restart backend (content auto-loaded)
3. No code changes needed!

### Adding a New API Endpoint

1. Create route in `backend/src/api/routes/`
2. Create controller in `backend/src/api/controllers/`
3. Create service in `backend/src/services/`
4. Add to `backend/src/api/routes/index.ts`
5. Update `docs/API_OPENAPI.yaml`

### Деплой на Railway

✅ **Railway конфигурация готова** (railway.json в backend/ и webapp/)

**Подготовка к деплою на Railway:**

1. **Создать проект на Railway Dashboard:**
   - New Project → GitHub
   - Выбрать репозиторий `EnergyPlanet`
   - Добавить PostgreSQL сервис
   - Добавить Redis сервис
   - Добавить 2 приложения (backend + webapp)

2. **Настроить переменные окружения для Backend:**
   ```bash
   # Database
   DB_HOST=${{Postgres.RAILWAY_PRIVATE_DOMAIN}}
   DB_PORT=${{Postgres.PORT}}
   DB_NAME=${{Postgres.DATABASE}}
   DB_USER=${{Postgres.USER}}
   DB_PASSWORD=${{Postgres.PASSWORD}}

   # Redis
   REDIS_HOST=${{Redis.RAILWAY_PRIVATE_DOMAIN}}
   REDIS_PORT=${{Redis.PORT}}

   # Security
   JWT_SECRET=<генерировать случайный ключ 32+ символа>
   TELEGRAM_BOT_TOKEN=<bot token от BotFather>

   # Content (контент находится в repo, загружается локально)
   CONTENT_PATH=/app/content  # или оставить пусто для auto-detection
   NODE_ENV=production
   ```

3. **Настроить деплой:**
   - Backend: автодеплой из `main` ветки ✅
   - Webapp: автодеплой из `main` ветки ✅
   - railway.json в каждой папке уже настроены

4. **После первого деплоя:**
   - Backend автоматически применит миграции БД при старте (connect + loadContent)
   - Проверь логи: `docker logs backend`
   - Тестируй health check: `curl https://<your-app>.railway.app/health`

**Деплой процесс:**
```bash
# 1. Пуш в main ветку
git push origin main

# 2. Railway автоматически:
#    - Собирает Docker образы
#    - Запускает тесты
#    - Деплоит новую версию
#    - Делает health check

# 3. Проверка деплоя
curl https://your-app.railway.app/health
```

**Откат деплоя:**
- В Railway Dashboard выбрать предыдущий деплой
- Нажать "Redeploy"

## Важные примечания

### Формулы игрового баланса

Все формулы определены в `/docs/GDD.md`:
- Доход с тапа: `base_tap * (1 + level * 0.15) * (1 + boosts)`
- Стоимость постройки: `base_cost * (1.12 ^ count)`
- XP до след. уровня: `100 * (level ^ 1.5)`

**Всегда синхронизируй код с формулами из GDD!**

### Оффлайн прирост (Offline Gains)

⚠️ **TODO:** Нужно реализовать в SessionService.

- Макс. оффлайн время: **12 часов** (ограничение)
- Оффлайн множитель: **0.5** (50% от пассивного дохода)
- Рассчитывается в `SessionService.calculateOfflineGains()`

### Rate Limits (Ограничения запросов)

⚠️ **TODO:** Нужно реализовать rate limiter middleware.

Лимиты на эндпоинт (см. `backend/src/middleware/rateLimiter.ts`):
- `/tap`: 10 req/sec
- `/upgrade`: 5 req/sec
- `/purchase`: 1 req/10sec
- Общий: 100 req/min

### Безопасность

- **Никогда не коммить `.env` файлы** (использовать `.env.sample`)
- **Всегда валидировать пользовательский ввод** на сервере
- **Использовать параметризованные SQL запросы** (защита от SQL injection)
- **Валидировать Telegram initData hash** перед авторизацией

## Решение проблем (Troubleshooting)

### Backend не запускается
```bash
# Проверь подключение к PostgreSQL
docker ps | grep postgres

# Проверь подключение к Redis
docker exec energy-planet-redis redis-cli ping

# Проверь переменные окружения
cat backend/.env

# Проверь логи
docker logs energy-planet-backend
```

### Миграции БД не работают
```bash
# Проверь синтаксис миграции
psql -U energyplanet_app -d energy_planet -f backend/migrations/001_initial_schema.sql

# Откат: удали таблицы вручную или восстанови бэкап
psql -U energyplanet_app -d energy_planet -c "DROP TABLE IF EXISTS users CASCADE;"
```

### Ошибки API на фронтенде
```bash
# Проверь работает ли backend
curl http://localhost:3000/health

# Проверь CORS настройки
# В backend/src/index.ts должно быть: cors({ origin: '*' })

# Проверь Network tab в DevTools браузера
```

### Контент не загружается

```bash
# 1. Проверь пути к файлам в backend/src/config/index.ts
cat backend/src/config/index.ts | grep -i content

# 2. Проверь JSON/YAML синтаксис файлов контента
node -e "console.log(JSON.stringify(require('./content/items/buildings.json'), null, 2))"

# 3. Проверь логи backend
docker logs energy-planet-backend

# 4. Проверь что ContentService инициализируется при старте
grep -r "ContentService" backend/src/index.ts
```

**Если контент не загружается:**
- Проверь существование файлов в `/content/`
- Убедись что JSON валиден (используй `jq` или онлайн валидатор)
- Проверь права доступа на файлы
- ContentService должен логировать загрузку - посмотри в логах

### Telegram Mini App не открывается
```bash
# 1. Убедись что используешь ngrok для туннеля
ngrok http 5173

# 2. Проверь Bot URL в BotFather
# Должен быть: https://your-ngrok-url.ngrok.io

# 3. Проверь что webapp работает локально
curl http://localhost:5173
```

## Стратегия тестирования

⚠️ **TODO:** Нужно написать тесты для MVP функционала.

### Unit тесты
```bash
cd backend
npm test
```

Покрытие:
- Бизнес логика в `services/`
- Утилиты и хелперы
- Цель: 80% code coverage

### Integration тесты
```bash
cd backend
npm run test:integration
```

Тестировать:
- API эндпоинты (supertest)
- Взаимодействие с БД
- Поток авторизации

### Load тестирование
- Цель: 1000 одновременных пользователей
- Инструменты: k6, Artillery
- Тестировать эндпоинты: `/tap`, `/tick`, `/upgrade`

## Документация

- **GDD:** Дизайн игры, формулы, баланс (`docs/GDD.md`)
- **MVP Spec:** Функции, user flows, монетизация (`docs/MVP_SPEC.md`)
- **Roadmap:** MVP → Кланы → Арена (`docs/ROADMAP.md`)
- **API Docs:** OpenAPI 3.0 спецификация (`docs/API_OPENAPI.yaml`)

## Performance Targets (Целевая производительность)

### Backend
- API Response Time (p95): < 100ms
- API Response Time (p99): < 300ms
- Throughput: 1000 req/sec на инстанс

### Frontend
- First Contentful Paint: < 1.5s
- Time to Interactive: < 2.5s
- Tap latency: < 50ms (задержка отклика тапа)

### Database
- Query time (p95): < 50ms
- Connection pool: 20-50 соединений
- Всегда индексировать foreign keys

## 🚀 Railway Deployment Status

**✅ Webapp успешно развёрнута на Railway:**
- Nginx запущен и слушает на порту 80
- Health check endpoint `/health` доступен
- SPA fallback настроен для React Router
- Static assets кешируются (1 год)
- Security headers настроены
- Nginx proxy forwards /api/* to backend

**✅ Backend успешно развёрнут на Railway:**
- Express запущен на порту 8080 (или PORT env)
- PostgreSQL подключена
- Redis подключена
- Content loaded

---

## 🔍 Как смотреть логи на Railway

**Из терминала:**

```bash
# Смотреть логи фронта (webapp/nginx)
timeout 10 railway logs --service frontgame

# Смотреть логи бэка (backend/express)
timeout 10 railway logs --service backgame

# Смотреть последние N строк
railway logs --service backgame --lines 50

# Следить в реальном времени (Ctrl+C для выхода)
railway logs --service backgame --follow
```

**Где искать:**
- Фронт логи: nginx логи (GET запросы, ошибки 404, 405)
- Бэк логи: Express логи (запросы, ошибки БД, startup сообщения)

**Что смотреть:**
- ✅ Startup сообщения (говорят что сервис запустился)
- 📨 Request логи (говорят что запросы доходят)
- ❌ ERROR логи (красные строки - проблемы)
- ⚠️ WARN логи (жёлтые строки - возможные проблемы)

---

## MVP Чеклист (текущий прогресс)

### Backend (70% готов)

**✅ Завершено:**
- [x] Подключение к PostgreSQL
- [x] Подключение к Redis для кеша
- [x] AuthService + JWT токены (основа готова)
- [x] SessionService + расчет offline gains
- [x] TapService + валидация тапов
- [x] UpgradeService + покупка построек/улучшений
- [x] LeaderboardService + кеширование
- [x] ContentService + загрузка контента из JSON/YAML
- [x] CosmeticService + система косметики
- [x] Anti-cheat валидация (тапы, энергия, идемпотентность)
- [x] Repository паттерн для всех операций с БД
- [x] System миграций БД (migrate up/down/status)
- [x] Middleware (auth, error handling, logging)
- [x] Health check эндпоинт

**🔨 В процессе:**
- [ ] Telegram OAuth валидация initData
- [ ] Rate limiting middleware
- [ ] MonetizationService (Telegram Stars + Ads)

**📋 TODO:**
- [ ] Feature flags система (загрузка из `/content/flags/`)
- [ ] Дополнительные anti-cheat метрики
- [ ] Мониторинг и метрики

### Frontend (10% готов)

**❌ Еще не начато:**
- [ ] React приложение с Telegram WebApp SDK
- [ ] Zustand store для состояния
- [ ] Экран тапа планеты
- [ ] Экран построек и улучшений
- [ ] Лидерборд
- [ ] Профиль игрока
- [ ] Магазин косметики
- [ ] Анимации и эффекты
- [ ] Haptic feedback

### Infrastructure (50% готов)

**✅ Завершено:**
- [x] Docker Compose для локальной разработки
- [x] Kubernetes манифесты (базовая структура)
- [x] Health checks

**🔨 В процессе:**
- [ ] Railway настройка
- [ ] Production переменные окружения

**📋 TODO:**
- [ ] CI/CD пайплайн (Jenkins)
- [ ] Логирование (Winston)
- [ ] Мониторинг (Prometheus + Grafana)

## Полезные ссылки

- **Issues:** GitHub Issues
- **Документация:** `/docs` папка
- **API Reference:** `/docs/API_OPENAPI.yaml`
- **Game Design:** `/docs/GDD.md`
