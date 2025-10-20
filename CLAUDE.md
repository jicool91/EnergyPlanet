# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ ВАЖНО: Язык общения

**ВСЕГДА общайся с пользователем на РУССКОМ языке!** Пользователь не понимает английский. Все объяснения, вопросы и комментарии должны быть на русском.

## Статус проекта

**Текущая стадия:** MVP в разработке (упрощенная версия с моковыми данными)

**Что работает сейчас:**
- ✅ Базовый Express backend с mock эндпоинтами
- ✅ Docker Compose для локальной разработки
- ✅ Базовая структура проекта

**Что нужно реализовать для MVP:**
- 🔨 Подключение к реальной PostgreSQL и Redis
- 🔨 Полноценные сервисы (AuthService, TapService, UpgradeService и т.д.)
- 🔨 Telegram OAuth авторизация
- 🔨 React фронтенд (Telegram Mini App)
- 🔨 Система построек и улучшений
- 🔨 Лидерборды
- 🔨 Косметика
- 🔨 Монетизация (Telegram Stars + Rewarded Ads)

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

### Локальная разработка

```bash
# Запустить все сервисы (PostgreSQL, Redis, Backend, Webapp)
docker-compose up

# Backend отдельно
cd backend
npm install
npm run dev          # Запуск dev сервера на :3000

# Webapp отдельно
cd webapp
npm install
npm run dev          # Запуск Vite dev сервера на :5173

# Проверка здоровья backend
curl http://localhost:3000/health
```

### Миграции БД

⚠️ **Примечание:** Миграции пока не подключены к коду. Нужно реализовать `backend/src/db/migrate.ts`.

```bash
cd backend

# Применить все миграции (TODO: реализовать)
npm run migrate:up

# Откатить последнюю миграцию (TODO: реализовать)
npm run migrate:down

# Создать новую миграцию
# Вручную создать файл: migrations/00X_название.sql
```

**Текущие миграции:**
- `001_initial_schema.sql` - основные таблицы (users, progress, inventory, etc.)
- `002_clans_schema.sql` - система кланов (Post-MVP)
- `003_arena_schema.sql` - арена/PvP (Post-MVP)

### Тестирование

```bash
# Backend тесты
cd backend
npm test                    # Все тесты
npm run test:watch          # Watch режим
npm run test:integration    # Интеграционные тесты

# Линтинг и проверка типов
npm run lint                # ESLint
npm run typecheck           # TypeScript проверка
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

### Content-as-Data (Контент как данные)

Весь игровой контент хранится в версионированных JSON/YAML файлах в `/content/`:
- Обновление контента без деплоя кода
- Легкое A/B тестирование через feature flags
- Контроль версий и откаты
- Легко редактируется дизайнерами

**Content Loader:** `backend/src/services/ContentService.ts` загружает контент при старте и кеширует его.

⚠️ **TODO:** Нужно реализовать ContentService - сейчас контент не загружается.

### Anti-Cheat система (Защита от читов)

⚠️ **TODO:** Нужно реализовать - сейчас нет валидации.

Серверная валидация всех игровых действий:

**Tap Validation** (валидация тапов):
```typescript
// В TapService (нужно создать)
maxTaps = sessionDuration * 10; // Максимум 10 TPS
if (reportedTaps > maxTaps) flag_suspicious_activity();
```

**Energy Gain Validation** (валидация прироста энергии):
```typescript
// В TickService (нужно создать)
maxGain = passiveIncome * timeDelta * 1.1; // 10% допуск
if (reportedGain > maxGain) clamp_and_log();
```

**Purchase Idempotency** (идемпотентность покупок):
- Каждая покупка имеет уникальный `purchase_id` (UUID от клиента)
- Проверяем существование `purchase_id` перед обработкой
- Возвращаем тот же результат если уже обработано (идемпотентность)

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

⚠️ **TODO:** Нужно реализовать - сейчас моковая авторизация.

**Telegram OAuth Flow:**
1. Клиент отправляет `initData` от Telegram WebApp
2. Сервер валидирует hash используя bot token
3. Сервер выдает JWT access token (15 мин) + refresh token (30 дней)
4. Клиент включает `Authorization: Bearer <token>` во все запросы

**Middleware:** `backend/src/middleware/auth.ts` (нужно создать)

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

## Common Tasks

### Adding a New Building

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

⚠️ **TODO:** Настроить Railway для production деплоя.

**Подготовка к деплою:**

1. **Создать проект на Railway:**
   - Подключить GitHub репозиторий
   - Добавить PostgreSQL и Redis сервисы

2. **Настроить переменные окружения:**
   ```bash
   # В Railway Dashboard добавить:
   NODE_ENV=production
   DB_HOST=${{Postgres.RAILWAY_PRIVATE_DOMAIN}}
   DB_PORT=${{Postgres.PORT}}
   DB_NAME=${{Postgres.DATABASE}}
   DB_USER=${{Postgres.USER}}
   DB_PASSWORD=${{Postgres.PASSWORD}}
   REDIS_HOST=${{Redis.RAILWAY_PRIVATE_DOMAIN}}
   REDIS_PORT=${{Redis.PORT}}
   JWT_SECRET=<генерировать безопасный ключ>
   TELEGRAM_BOT_TOKEN=<ваш bot token>
   ```

3. **Настроить деплой:**
   - Backend: автодеплой из `main` ветки
   - Webapp: автодеплой из `main` ветки
   - Применить миграции после деплоя

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
⚠️ Контент пока не загружается т.к. ContentService не реализован.

```bash
# Когда реализуешь ContentService:
# 1. Проверь пути к файлам в backend/src/config/index.ts
# 2. Проверь JSON/YAML синтаксис
node -e "console.log(require('./content/items/buildings.json'))"

# 3. Проверь логи
docker logs energy-planet-backend
```

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

## MVP Чеклист (что нужно сделать)

### Критические фичи для MVP:

**Backend:**
- [ ] Подключение к PostgreSQL (настоящей БД)
- [ ] Подключение к Redis для кеша
- [ ] Telegram OAuth авторизация
- [ ] AuthService + JWT токены
- [ ] SessionService + расчет offline gains
- [ ] TapService + валидация тапов
- [ ] UpgradeService + покупка построек/улучшений
- [ ] LeaderboardService + кеширование
- [ ] ContentService + загрузка контента из JSON/YAML
- [ ] MonetizationService + Telegram Stars
- [ ] Anti-cheat валидация
- [ ] Rate limiting middleware
- [ ] Применить миграции БД

**Frontend:**
- [ ] React приложение с Telegram WebApp SDK
- [ ] Zustand store для состояния
- [ ] Экран тапа планеты
- [ ] Экран построек и улучшений
- [ ] Лидерборд
- [ ] Профиль игрока
- [ ] Магазин косметики
- [ ] Анимации и эффекты
- [ ] Haptic feedback

**Infrastructure:**
- [ ] Railway настройка
- [ ] Production переменные окружения
- [ ] Health checks
- [ ] Логирование
- [ ] Мониторинг (базовый)

## Полезные ссылки

- **Issues:** GitHub Issues
- **Документация:** `/docs` папка
- **API Reference:** `/docs/API_OPENAPI.yaml`
- **Game Design:** `/docs/GDD.md`
