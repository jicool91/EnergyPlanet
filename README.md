# Energy Planet

Idle tap игра в формате Telegram Mini App. Развивай энергетическую инфраструктуру планеты, накапливай энергию через тапы и пассивный доход от построек.

## Возможности

- **Idle Tap геймплей**: тапай планету для получения энергии
- **Система построек**: 8 типов построек (от солнечных панелей до квантовых генераторов)
- **Прогрессия**: система уровней и опыта
- **Косметика**: рамки аватаров, скины планет, эффекты тапа, фоны
- **Социальные фичи**: глобальные и недельные лидерборды, осмотр профилей
- **Монетизация**: Telegram Stars, Rewarded Ads
- **Post-MVP**: кланы, арена/PvP, ачивки, дневные квесты

## Технологии

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js (TypeScript)
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Queue**: BullMQ
- **Auth**: JWT + Telegram OAuth

### Frontend
- **Framework**: React 18 (TypeScript)
- **Build Tool**: Vite
- **State**: Zustand
- **API Client**: Axios
- **UI**: Telegram UI Kit + Custom

### Infrastructure
- **Containers**: Docker
- **Orchestration**: Kubernetes
- **CI/CD**: Jenkins
- **Monitoring**: Prometheus + Grafana

## Быстрый старт

### Требования
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+ (или используй Docker)
- Redis 7+ (или используй Docker)

### Установка

1. **Клонируй репозиторий**
```bash
git clone https://github.com/yourusername/energyPlanet.git
cd energyPlanet
```

2. **Настрой переменные окружения**
```bash
# Backend
cd backend
cp .env.sample .env
# Отредактируй .env и заполни TELEGRAM_BOT_TOKEN и другие значения

# Webapp
cd ../webapp
cp .env.sample .env
```

3. **Запусти с помощью Docker Compose**
```bash
docker-compose up
```

Это запустит:
- PostgreSQL (порт 5432)
- Redis (порт 6379)
- Backend API (порт 3000)
- Webapp dev server (порт 5173)

4. **Открой приложение**
- Backend API: http://localhost:3000
- Webapp: http://localhost:5173
- Health check: http://localhost:3000/health

### Разработка без Docker

**Backend:**
```bash
cd backend
npm install
npm run dev
```

**Webapp:**
```bash
cd webapp
npm install
npm run dev
```

## Структура проекта

```
energyPlanet/
├── backend/              # Node.js API сервер
├── webapp/               # React Telegram Mini App
├── content/              # Игровой контент (JSON/YAML)
├── k8s/                  # Kubernetes манифесты
├── docs/                 # Документация
│   ├── GDD.md           # Game Design Document
│   ├── MVP_SPEC.md      # MVP спецификация
│   ├── ROADMAP.md       # Дорожная карта
│   └── API_OPENAPI.yaml # OpenAPI спецификация
├── Jenkinsfile          # CI/CD пайплайн
├── docker-compose.yml   # Локальная разработка
└── README.md
```

## Основные команды

### Разработка
```bash
# Запустить всё
docker-compose up

# Тесты backend
cd backend && npm test

# Линтинг
cd backend && npm run lint
cd webapp && npm run lint

# Type checking
cd backend && npm run typecheck
cd webapp && npm run typecheck

# Storybook / Chromatic
cd webapp && npm run storybook        # локальный просмотр
cd webapp && npm run test:storybook   # публикация снапшотов

# Visual previews (static build)
# Примеры: http://localhost:5173/visual.html?view=events&theme=light
# Доступные view: offline, friends, tap, exchange, levelup, auth-error, purchase-success, events
```

### Сборка
```bash
# Backend
cd backend && npm run build

# Webapp
cd webapp && npm run build

# Docker образы
docker build -t energy-planet-backend ./backend
docker build -t energy-planet-webapp ./webapp
```

### База данных
```bash
# Применить миграции
cd backend && npm run migrate:up

# Откатить последнюю миграцию
cd backend && npm run migrate:down
```

## Документация

- **[GDD (Game Design Document)](docs/GDD.md)** - дизайн игры, экономика, баланс, формулы
- **[MVP Specification](docs/MVP_SPEC.md)** - функционал MVP, user flows, монетизация
- **[Roadmap](docs/ROADMAP.md)** - план развития (MVP → Кланы → Арена)
- **[API Documentation](docs/API_OPENAPI.yaml)** - OpenAPI 3.0 спецификация
- **[CLAUDE.md](CLAUDE.md)** - инструкции для Claude Code

## Архитектурные особенности

### Content-as-Data
Весь игровой контент хранится в файлах `/content/`:
- `items/buildings.json` - характеристики построек
- `cosmetics/skins.json` - косметические предметы
- `seasons/season_001.yaml` - сезонный контент
- `flags/default.json` - feature flags

**Преимущества:**
- Обновление контента без деплоя кода
- Версионирование через Git
- Легко редактировать дизайнерами

### Anti-Cheat
Серверная валидация всех игровых действий:
- **Tap validation**: max 10 TPS
- **Energy validation**: проверка по формулам
- **Purchase idempotency**: уникальные UUID для каждой покупки

### Feature Flags
Управление фичами через конфиг:
```json
{
  "features": {
    "tier_4_buildings_enabled": false,
    "clan_system_enabled": false
  }
}
```

## Деплой

### Production (Kubernetes)

```bash
# Применить манифесты
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml  # Сначала заполни секреты!
kubectl apply -f k8s/deploy.yaml

# Проверка статуса
kubectl get pods -n energy-planet
kubectl logs -f deployment/backend -n energy-planet
```

### CI/CD (Jenkins)

Пуш в `main` автоматически запускает пайплайн:
1. Тесты (lint, typecheck, unit tests)
2. Сборка Docker образов
3. Push в registry
4. Миграции БД
5. Деплой в Kubernetes
6. Smoke tests

## Тестирование

```bash
# Unit tests
cd backend && npm test

# Integration tests
cd backend && npm run test:integration

# Coverage
cd backend && npm run test -- --coverage

# Load testing (требует k6)
k6 run tests/load/tap_test.js
```

## Мониторинг

- **Health check**: GET /health
- **Metrics**: Prometheus на порту 9090
- **Logs**: Winston (JSON format в production)
- **Dashboards**: Grafana

## Безопасность

- ✅ Telegram OAuth с валидацией хеша
- ✅ JWT tokens (access 15min, refresh 30d)
- ✅ Rate limiting на всех эндпоинтах
- ✅ SQL injection protection (parameterized queries)
- ✅ CORS настроен
- ✅ Helmet.js для HTTP headers
- ✅ Server-side валидация всех действий

## Производительность

### Целевые метрики
- **API Response (p95)**: < 100ms
- **API Response (p99)**: < 300ms
- **Throughput**: 1000 req/sec
- **Frontend FCP**: < 1.5s
- **Frontend TTI**: < 2.5s
- **Tap latency**: < 50ms

## Roadmap

### ✅ MVP (8 недель)
- Базовый геймплей (tap, buildings, upgrades)
- Прогрессия (levels, XP)
- Лидерборды
- Косметика
- Монетизация (Stars + Ads)

### 🚧 Phase 2: Кланы (6 недель)
- Создание и управление кланами
- Клановый чат
- Клановые перки
- Клановые события

### 📅 Phase 3: Арена/PvP (8 недель)
- Matchmaking система
- ELO рейтинг
- Сезоны и награды
- Турниры

Подробнее в [ROADMAP.md](docs/ROADMAP.md)

## FAQ

**Q: Как добавить новое здание?**
A: Отредактируй `/content/items/buildings.json` и перезапусти backend. Код менять не нужно.

**Q: Как протестировать Telegram WebApp локально?**
A: Используй [ngrok](https://ngrok.com/) для туннелирования localhost и настрой Telegram Bot URL.

**Q: Где хранятся секреты в production?**
A: Kubernetes Secrets (см. `k8s/secrets.yaml` template).

**Q: Как откатить деплой?**
A: `kubectl rollout undo deployment/backend -n energy-planet`

## Участие в разработке

1. Fork репозиторий
2. Создай feature branch (`git checkout -b feature/amazing-feature`)
3. Commit изменения (`git commit -m 'Add amazing feature'`)
4. Push в branch (`git push origin feature/amazing-feature`)
5. Открой Pull Request

## Лицензия

MIT License - см. [LICENSE](LICENSE)

## Контакты

- **Telegram**: @energyplanet_support
- **Email**: support@energyplanet.game
- **Issues**: [GitHub Issues](https://github.com/yourusername/energyPlanet/issues)

---

Сделано с ⚡ Energy Planet Team
