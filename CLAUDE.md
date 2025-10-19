# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Energy Planet** is an idle tap game built as a Telegram Mini App. Players generate energy by tapping and building structures, competing on leaderboards and unlocking cosmetics.

**Tech Stack:**
- **Backend:** Node.js (TypeScript), Express, PostgreSQL, Redis
- **Frontend:** React (TypeScript), Vite, Telegram WebApp SDK
- **Infrastructure:** Docker, Kubernetes, Jenkins CI/CD
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

## Development Commands

### Local Development Setup

```bash
# Start all services (PostgreSQL, Redis, Backend, Webapp)
docker-compose up

# Backend only
cd backend
npm install
npm run dev

# Webapp only
cd webapp
npm install
npm run dev
```

### Database Migrations

```bash
cd backend

# Run all pending migrations
npm run migrate:up

# Rollback last migration
npm run migrate:down

# Create new migration
# Manually create: migrations/00X_name.sql
```

### Testing

```bash
# Backend tests
cd backend
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:integration    # Integration tests only

# Linting & Type checking
npm run lint
npm run typecheck
```

### Building

```bash
# Backend
cd backend
npm run build               # Compile TypeScript to dist/

# Webapp
cd webapp
npm run build               # Build production bundle to dist/

# Docker images
docker build -t energy-planet-backend:latest ./backend
docker build -t energy-planet-webapp:latest ./webapp
```

## Key Architecture Patterns

### Content-as-Data

All game content (buildings, cosmetics, seasons, feature flags) is stored in versioned JSON/YAML files under `/content/`. This allows:
- Content updates without code deploys
- Easy A/B testing via feature flags
- Version control and rollback
- Designer-friendly editing

**Content Loader:** `backend/src/services/ContentService.ts` loads content on startup and caches it.

### Anti-Cheat System

Server-side validation for all game actions:

**Tap Validation** (`TapService`):
```typescript
maxTaps = sessionDuration * 10; // Max 10 TPS
if (reportedTaps > maxTaps) flag_suspicious_activity();
```

**Energy Gain Validation** (`TickService`):
```typescript
maxGain = passiveIncome * timeDelta * 1.1; // 10% tolerance
if (reportedGain > maxGain) clamp_and_log();
```

**Purchase Idempotency** (`MonetizationService`):
- Every purchase has unique `purchase_id` (client-generated UUID)
- Check if `purchase_id` exists before processing
- Return same result if already processed (idempotent)

### Feature Flags

All features controlled via `/content/flags/default.json`:

```json
{
  "features": {
    "tier_4_buildings_enabled": false,
    "clan_system_enabled": false,
    "arena_system_enabled": false
  }
}
```

**Usage in code:**
```typescript
if (!contentService.isFeatureEnabled('cosmetics_shop_enabled')) {
  return res.status(503).json({ error: 'Feature disabled' });
}
```

### API Authentication

**Telegram OAuth Flow:**
1. Client sends `initData` from Telegram WebApp
2. Server validates hash using bot token
3. Server issues JWT access token (15 min) + refresh token (30 days)
4. Client includes `Authorization: Bearer <token>` in all requests

**Middleware:** `backend/src/middleware/auth.ts`

### State Management (Frontend)

**Zustand Store** (`webapp/src/store/gameStore.ts`):
- Single global state
- Actions for `initGame()`, `tap()`, `upgrade()`
- Optimistic updates for UI responsiveness

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

### Deploying to Production

**Via Jenkins:**
1. Push to `main` branch
2. Jenkins auto-triggers pipeline (Jenkinsfile)
3. Pipeline: Test → Build → Push Images → Migrate DB → Deploy K8s → Smoke Test

**Manual K8s deploy:**
```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml  # Update secrets first!
kubectl apply -f k8s/deploy.yaml

# Check status
kubectl get pods -n energy-planet
kubectl logs -f deployment/backend -n energy-planet
```

### Rolling Back a Deploy

```bash
# Rollback backend
kubectl rollout undo deployment/backend -n energy-planet

# Rollback webapp
kubectl rollout undo deployment/webapp -n energy-planet
```

## Important Notes

### Game Balance Formulas

All formulas defined in `/docs/GDD.md`:
- Tap income: `base_tap * (1 + level * 0.15) * (1 + boosts)`
- Building cost: `base_cost * (1.12 ^ count)`
- XP to next level: `100 * (level ^ 1.5)`

**Always sync code with GDD formulas!**

### Offline Gains

- Max offline duration: **12 hours** (capped)
- Offline multiplier: **0.5** (50% of passive income)
- Calculated in `SessionService.calculateOfflineGains()`

### Rate Limits

Per-endpoint limits (see `backend/src/middleware/rateLimiter.ts`):
- `/tap`: 10 req/sec
- `/upgrade`: 5 req/sec
- `/purchase`: 1 req/10sec
- General: 100 req/min

### Security

- **Never commit `.env` files** (use `.env.sample`)
- **Always validate user input** server-side
- **Use parameterized SQL queries** (prevent injection)
- **Validate Telegram initData hash** before auth

## Troubleshooting

### Backend won't start
- Check PostgreSQL connection: `docker ps | grep postgres`
- Check Redis connection: `redis-cli ping`
- Verify `.env` variables match `.env.sample`

### Database migration fails
- Check migration syntax: `psql -U energyplanet_app -d energy_planet -f migrations/001_initial_schema.sql`
- Rollback: manually drop tables or restore backup

### Frontend API errors
- Verify backend is running: `curl http://localhost:3000/health`
- Check CORS settings in `backend/src/config/index.ts`
- Inspect browser DevTools Network tab

### Content not loading
- Check file paths in `backend/src/config/index.ts` → `content.path`
- Verify JSON/YAML syntax: `node -e "require('./content/items/buildings.json')"`
- Check logs: `docker logs energy-planet-backend`

## Testing Strategy

### Unit Tests
- Business logic in `services/`
- Utilities and helpers
- Target: 80% code coverage

### Integration Tests
- API endpoints (supertest)
- Database interactions
- Authentication flow

### Load Testing
- Target: 1000 concurrent users
- Tools: k6, Artillery
- Test `/tap`, `/tick`, `/upgrade` endpoints

## Documentation

- **GDD:** Game design, formulas, balance (`docs/GDD.md`)
- **MVP Spec:** Features, user flows, monetization (`docs/MVP_SPEC.md`)
- **Roadmap:** MVP → Clans → Arena timeline (`docs/ROADMAP.md`)
- **API Docs:** OpenAPI 3.0 spec (`docs/API_OPENAPI.yaml`)

## Performance Targets

### Backend
- API Response Time (p95): < 100ms
- API Response Time (p99): < 300ms
- Throughput: 1000 req/sec per instance

### Frontend
- First Contentful Paint: < 1.5s
- Time to Interactive: < 2.5s
- Tap latency: < 50ms

### Database
- Query time (p95): < 50ms
- Connection pool: 20-50 connections
- Always index foreign keys

## Support

- **Issues:** GitHub Issues
- **Documentation:** `/docs` folder
- **API Reference:** `/docs/API_OPENAPI.yaml`
- **Game Design:** `/docs/GDD.md`
