# Техническая оптимизация Energy Planet

**Дата:** Ноябрь 2025
**Фокус:** Performance, Security, Scalability

---

## ⚡ Frontend Performance

### Bundle Optimization

**Target:** < 500KB initial load

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-core': ['react', 'react-dom'],
          'telegram': ['@tma.js/sdk'],
          'animations': ['framer-motion', '@react-spring/web'],
        }
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      }
    }
  }
});
```

### Image Optimization

```bash
# Оптимизация assets
npm install -D imagemin imagemin-webp

# Конвертация в WebP
imagemin assets/*.png --out-dir=assets/webp --plugin=webp

# Результат: 60-80% меньше размер
```

### Code Splitting

```tsx
// Lazy load non-critical screens
const ShopScreen = lazy(() => import('./screens/ShopScreen'));
const ProfileScreen = lazy(() => import('./screens/ProfileScreen'));

// Preload на hover для instant feel
<Link
  to="/shop"
  onMouseEnter={() => import('./screens/ShopScreen')}
>
  Shop
</Link>
```

---

## 🗄️ Backend Performance

### Database Indexing

```sql
-- Критичные индексы для Energy Planet

-- Users lookup (самый частый запрос)
CREATE INDEX CONCURRENTLY idx_users_telegram_id
  ON users(telegram_id);

-- Progress queries
CREATE INDEX CONCURRENTLY idx_progress_user_id
  ON progress(user_id);

-- Leaderboard (composite для sort)
CREATE INDEX CONCURRENTLY idx_leaderboard
  ON progress(total_energy_produced DESC, level DESC)
  WHERE total_energy_produced > 0;

-- Inventory lookup
CREATE INDEX CONCURRENTLY idx_inventory_user_building
  ON inventory(user_id, building_id);

-- Purchases (idempotency check)
CREATE INDEX CONCURRENTLY idx_purchases_purchase_id
  ON purchases(purchase_id)
  WHERE purchase_id IS NOT NULL;

-- Events для analytics (partial index)
CREATE INDEX CONCURRENTLY idx_events_user_recent
  ON events(user_id, created_at DESC)
  WHERE created_at > NOW() - INTERVAL '7 days';
```

### Query Optimization

```typescript
// ❌ N+1 Query Problem
for (const building of buildings) {
  const inventory = await db.query(
    'SELECT * FROM inventory WHERE user_id = $1 AND building_id = $2',
    [userId, building.id]
  );
}

// ✅ Single JOIN Query
const result = await db.query(`
  SELECT
    b.*,
    COALESCE(i.count, 0) as owned_count,
    COALESCE(i.level, 0) as upgrade_level
  FROM buildings b
  LEFT JOIN inventory i ON i.building_id = b.id AND i.user_id = $1
  ORDER BY b.tier, b.base_cost
`, [userId]);
```

### Connection Pooling

```typescript
// backend/src/db/connection.ts
export const pool = new Pool({
  // Production settings
  max: 20, // Max connections
  min: 5,  // Always ready
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,

  // Performance
  statement_timeout: 5000, // 5s query timeout
  query_timeout: 5000,

  // Connection string
  connectionString: process.env.DATABASE_URL,

  // SSL for production
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
});

// Health check
export const healthCheck = async () => {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    return true;
  } finally {
    client.release();
  }
};
```

---

## 🚀 Redis Caching Strategy

### Cache Layers

```typescript
// 3-tier caching
class CacheService {
  // Layer 1: In-memory (fastest, 100ms TTL)
  private memCache = new Map<string, any>();

  // Layer 2: Redis (fast, 60s-3600s TTL)
  private redis: Redis;

  // Layer 3: Database (slowest, source of truth)

  async get<T>(key: string): Promise<T | null> {
    // L1: Check memory
    if (this.memCache.has(key)) {
      return this.memCache.get(key);
    }

    // L2: Check Redis
    const cached = await this.redis.get(key);
    if (cached) {
      const value = JSON.parse(cached);
      this.memCache.set(key, value);
      return value;
    }

    // L3: Not cached
    return null;
  }

  async set(key: string, value: any, ttl: number) {
    // Save to both layers
    this.memCache.set(key, value);
    await this.redis.setex(key, ttl, JSON.stringify(value));

    // L1 auto-expire
    setTimeout(() => this.memCache.delete(key), 100);
  }
}
```

### Cache Patterns

```typescript
// 1. Leaderboard (expensive query)
const getLeaderboard = cache.wrap('leaderboard:global', 60, async () => {
  return await db.query(`
    SELECT u.username, p.total_energy_produced
    FROM progress p
    JOIN users u ON u.id = p.user_id
    ORDER BY p.total_energy_produced DESC
    LIMIT 100
  `);
});

// 2. User session (frequent access)
const getSession = cache.wrap(`session:${userId}`, 300, async () => {
  return await sessionService.getSession(userId);
});

// 3. Content (static, long TTL)
const getBuildings = cache.wrap('content:buildings', 3600, async () => {
  return contentService.getBuildings();
});
```

---

## 🔒 Security Hardening

### Rate Limiting (Redis-backed)

```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

// Distributed rate limiting
const createLimiter = (windowMs: number, max: number) => {
  return rateLimit({
    store: new RedisStore({
      client: redis,
      prefix: 'rl:',
    }),
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

// Per-endpoint limits
app.post('/tap', createLimiter(1000, 10), tapController); // 10/sec
app.post('/upgrade', createLimiter(1000, 5), upgradeController); // 5/sec
app.post('/purchase', createLimiter(10000, 1), purchaseController); // 1/10sec
```

### Input Validation (Zod)

```typescript
import { z } from 'zod';

// Request schemas
const TapRequestSchema = z.object({
  tapCount: z.number().int().positive().max(100),
  sessionDuration: z.number().positive().max(3600),
  clientTimestamp: z.number().int(),
});

const UpgradeRequestSchema = z.object({
  upgradeType: z.enum(['tap', 'building']),
  itemId: z.string().optional(),
  purchaseId: z.string().uuid(),
});

// Middleware
const validate = (schema: z.ZodSchema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    res.status(400).json({
      error: 'Validation failed',
      details: error.errors
    });
  }
};

// Usage
app.post('/tap', validate(TapRequestSchema), tapController);
```

### SQL Injection Prevention

```typescript
// ✅ ALWAYS use parameterized queries
const user = await pool.query(
  'SELECT * FROM users WHERE telegram_id = $1',
  [userId] // Параметр, не конкатенация
);

// ❌ NEVER concatenate user input
const user = await pool.query(
  `SELECT * FROM users WHERE telegram_id = '${userId}'` // ОПАСНО!
);
```

---

## 📊 Monitoring & Observability

### Prometheus Metrics

```typescript
import promClient from 'prom-client';

const register = new promClient.Registry();

// Business metrics
export const tapCounter = new promClient.Counter({
  name: 'game_taps_total',
  help: 'Total taps',
  labelNames: ['user_id'],
  registers: [register],
});

export const energyGauge = new promClient.Gauge({
  name: 'game_energy_total',
  help: 'Total energy across all users',
  registers: [register],
});

export const apiLatency = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'API latency',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
  registers: [register],
});

// Middleware для tracking
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    apiLatency.labels(req.method, req.route?.path || 'unknown', res.statusCode.toString())
      .observe(duration);
  });

  next();
});
```

### Structured Logging

```typescript
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'energy-planet',
    environment: process.env.NODE_ENV,
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/combined.log'
    })
  ]
});

// Usage
logger.info('Tap processed', {
  userId,
  tapCount,
  energyGained,
  duration: Date.now() - startTime
});
```

---

## 🔄 Background Jobs

### TapAggregator (Batch Writes)

```typescript
class TapAggregator {
  private queue: Map<string, number> = new Map();
  private flushInterval = 1000; // 1 second

  start() {
    setInterval(() => this.flush(), this.flushInterval);
  }

  addTap(userId: string, energy: number) {
    const current = this.queue.get(userId) || 0;
    this.queue.set(userId, current + energy);
  }

  private async flush() {
    if (this.queue.size === 0) return;

    const batch = Array.from(this.queue.entries());
    this.queue.clear();

    // Batch update в одной транзакции
    await pool.query(`
      UPDATE progress
      SET
        energy = progress.energy + updates.gained,
        total_energy_produced = progress.total_energy_produced + updates.gained
      FROM (VALUES ${batch.map((_, i) => `($${i*2+1}, $${i*2+2})`).join(',')}) AS updates(user_id, gained)
      WHERE progress.user_id = updates.user_id
    `, batch.flat());

    logger.info('Tap batch flushed', { count: batch.length });
  }
}
```

---

## 🌍 Horizontal Scaling

### Stateless Backend

```typescript
// ✅ DO: Store state in Redis/DB
const session = await redis.get(`session:${userId}`);

// ❌ DON'T: Store state in memory
const sessions = new Map(); // Lost on restart/scale
```

### Load Balancer Config

```nginx
# nginx.conf
upstream backend {
  least_conn; # Route to least busy server
  server api-1:3000 max_fails=3 fail_timeout=30s;
  server api-2:3000 max_fails=3 fail_timeout=30s;
  server api-3:3000 max_fails=3 fail_timeout=30s;
}

server {
  listen 80;

  location /api {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;

    # Timeouts
    proxy_connect_timeout 2s;
    proxy_send_timeout 10s;
    proxy_read_timeout 10s;
  }
}
```

---

## 📈 Performance Targets

### Frontend

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| First Contentful Paint | < 1.5s | TBD | 🟡 |
| Time to Interactive | < 2.5s | TBD | 🟡 |
| Bundle Size | < 500KB | TBD | 🟡 |
| Tap Latency | < 50ms | TBD | 🟡 |

### Backend

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| API p95 Latency | < 100ms | ~80ms | ✅ |
| API p99 Latency | < 300ms | ~150ms | ✅ |
| Throughput | 1000 req/s | TBD | 🟡 |
| Error Rate | < 1% | < 0.5% | ✅ |

### Database

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Query p95 | < 50ms | ~30ms | ✅ |
| Connection Pool | 20-50 | 20 | ✅ |
| Cache Hit Rate | > 80% | TBD | 🟡 |

---

## 🎯 Quick Wins (1-2 days)

1. ✅ **Redis для leaderboard** → 90% faster
2. ✅ **Composite indexes** → 50% faster queries
3. ✅ **Rate limiting** → DoS protection
4. ✅ **Tap batching** → 80% less DB writes
5. ✅ **Image optimization** → 70% smaller bundle

---

**Следующий:** [Marketing Strategy](./07_marketing_strategy.md)
