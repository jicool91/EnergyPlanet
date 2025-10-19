# MVP Specification: Energy Planet

## 1. MVP Scope

### 1.1 Included Features
- ✅ Core tap mechanic
- ✅ Building system (Tier 1-3)
- ✅ Upgrade system (tap & buildings)
- ✅ Passive income & offline gains
- ✅ Player progression (levels & XP)
- ✅ Basic cosmetics (avatar frames, planet skins)
- ✅ Profile inspection system
- ✅ Global leaderboard
- ✅ Monetization (Telegram Stars + Rewarded Ads)
- ✅ Anti-cheat validation
- ✅ Feature flags system
- ✅ Seasonal content framework

### 1.2 Post-MVP Features
- ❌ Clan system
- ❌ Arena/PvP
- ❌ Friends leaderboard
- ❌ Achievements system
- ❌ Daily quests
- ❌ Push notifications

## 2. User Flows

### 2.1 First Time User Experience (FTUE)

```
1. User opens Telegram Mini App
   ↓
2. Auto-login via Telegram OAuth
   ↓
3. POST /api/v1/session → Create new user
   ↓
4. Tutorial overlay:
   - "Tap the planet to generate energy!"
   - Show tap animation
   - "Energy lets you build structures"
   - Highlight first building (Solar Panel)
   ↓
5. Force first building purchase (gifted)
   ↓
6. "Great! Now you earn energy passively"
   ↓
7. Tutorial complete → Full UI unlocked
```

### 2.2 Core Gameplay Loop

```
Active Session:
1. Tap planet → Gain energy (with animation)
   ↓
2. Check progress:
   - Energy counter updates
   - Buildings produce passive income
   - XP bar fills
   ↓
3. Spend energy:
   - Buy new buildings
   - Upgrade tap power
   - Upgrade buildings
   ↓
4. Level up → Unlock new buildings/features
   ↓
5. Repeat
```

### 2.3 Player Inspection Flow

```
Entry Points:
- Leaderboard: Tap on player's row
- Direct link: t.me/energy_planet_bot/app?startapp=profile_<user_id>
- Share button in player's own profile

Flow:
1. User taps on player name/avatar
   ↓
2. GET /api/v1/profile/:userId
   ↓
3. Modal/Page opens showing:
   ┌─────────────────────────────┐
   │  [Avatar with Frame]        │
   │  Username • Level 42        │
   │  Rank: #127                 │
   ├─────────────────────────────┤
   │  📊 Total Energy: 1.2M      │
   │  🏗️ Buildings: 234          │
   │  ⚡ Energy/sec: 5,420       │
   ├─────────────────────────────┤
   │  🎨 Active Cosmetics:       │
   │  • Golden Frame             │
   │  • Cyber Planet Skin        │
   │  • Spark Tap Effect         │
   ├─────────────────────────────┤
   │  [View Cosmetics Shop] 🛒   │
   │  [Close]                    │
   └─────────────────────────────┘
   ↓
4. User sees cosmetic item they like
   ↓
5. Tap "View Cosmetics Shop"
   ↓
6. Redirected to Cosmetics Shop with filter/highlight
```

### 2.4 Cosmetics Purchase Flow

```
1. User opens Cosmetics Shop (from profile or main menu)
   ↓
2. GET /api/v1/cosmetics → Fetch available items
   ↓
3. Browse cosmetics by category:
   - Avatar Frames
   - Planet Skins
   - Tap Effects
   - Backgrounds
   ↓
4. User selects item to preview
   ↓
5. Preview modal:
   ┌─────────────────────────────┐
   │  [Live Preview]             │
   │  Golden Energy Frame        │
   │  Rarity: Rare               │
   ├─────────────────────────────┤
   │  Price: 250 ⭐ Stars        │
   │  or                         │
   │  Unlock at Level 30 (free)  │
   ├─────────────────────────────┤
   │  [Purchase with Stars] 💳   │
   │  [Cancel]                   │
   └─────────────────────────────┘
   ↓
6a. Purchase with Stars:
    - Client: telegram.openInvoice(invoice_link)
    - Telegram handles payment
    - Webhook: Payment successful
    - POST /api/v1/cosmetics/purchase (idempotent)
    - Item added to inventory
    - Success notification

6b. Level-locked item:
    - "Reach level 30 to unlock!"
    - [Close]
```

### 2.5 Monetization Flows

#### Flow A: Energy Pack Purchase
```
1. User runs low on energy
   ↓
2. "Need more energy?" banner appears
   ↓
3. User taps banner → Energy Shop opens
   ↓
4. Select pack:
   - Small: 10K E = 10 ⭐
   - Medium: 50K E = 40 ⭐ (20% bonus)
   - Large: 150K E = 100 ⭐ (50% bonus)
   ↓
5. Tap "Buy with Stars"
   ↓
6. Telegram Stars payment flow
   ↓
7. POST /api/v1/purchase (purchase_id, item_type: energy_pack)
   ↓
8. Energy added to balance
   ↓
9. Success: "Energy pack received! +50,000 E"
```

#### Flow B: Rewarded Ad for Boost
```
1. User taps "Watch Ad for Boost" button
   ↓
2. Check cooldown: GET /api/v1/profile → ad_boost_expires_at
   ↓
3. If available:
   - Load ad from provider (Yandex.Direct / Google AdMob)
   ↓
4. User watches 15-30 sec video ad
   ↓
5. Ad completion confirmed
   ↓
6. POST /api/v1/boost/claim (boost_type: ad_boost)
   ↓
7. Server validates and activates boost:
   - ad_boost_expires_at = now + 300 sec
   - Response: {success: true, expires_at: timestamp}
   ↓
8. Client shows boost timer (5:00 countdown)
   ↓
9. Tap income doubled for 5 minutes
```

#### Flow C: Premium Boost Purchase
```
1. User taps "Premium Boost" in shop
   ↓
2. Modal:
   ┌─────────────────────────────┐
   │  ⚡ Premium Boost            │
   │  +200% income for 1 hour    │
   ├─────────────────────────────┤
   │  • Stacks with ad boosts    │
   │  • Works offline            │
   │  • No cooldown              │
   ├─────────────────────────────┤
   │  Price: 50 ⭐ Stars         │
   │  [Purchase] [Cancel]        │
   └─────────────────────────────┘
   ↓
3. User confirms purchase
   ↓
4. Telegram Stars payment
   ↓
5. POST /api/v1/purchase (item_type: premium_boost_1h)
   ↓
6. Boost activated immediately
   ↓
7. Boost timer shown in UI (59:59 countdown)
```

## 3. Technical Requirements

### 3.1 Backend

**Tech Stack:**
- Language: Node.js (TypeScript)
- Framework: Express.js
- Database: PostgreSQL 15+
- Cache: Redis 7+
- Queue: BullMQ (for async jobs)

**Key Modules:**
```
src/
├── api/           # HTTP routes
├── services/      # Business logic
├── db/            # Database layer
├── middleware/    # Auth, validation, rate limiting
├── content/       # Content loader (YAML/JSON)
├── anti-cheat/    # Validation logic
└── integrations/  # Telegram, Ad providers
```

**Critical Services:**
- `SessionService` - session management, offline gains calculation
- `TapService` - tap validation, energy increment
- `UpgradeService` - purchase validation, balance updates
- `LeaderboardService` - ranking calculation, caching
- `ContentService` - load content from files
- `AntiCheatService` - anomaly detection
- `MonetizationService` - IAP handling, idempotency

### 3.2 Frontend (Telegram Mini App)

**Tech Stack:**
- Framework: React 18 + TypeScript
- UI Library: Telegram UI Kit + Custom components
- State: Zustand or Redux Toolkit
- API Client: Axios with interceptors
- Build: Vite

**Key Features:**
- Responsive design (mobile-first)
- Smooth animations (60 FPS tap feedback)
- Optimistic UI updates
- Offline detection
- Haptic feedback (Telegram.WebApp.HapticFeedback)

**Directory Structure:**
```
webapp/
├── src/
│   ├── components/   # UI components
│   ├── screens/      # Main screens
│   ├── hooks/        # Custom hooks
│   ├── services/     # API client
│   ├── store/        # State management
│   ├── types/        # TypeScript types
│   └── utils/        # Helpers
├── public/
│   └── assets/       # Images, sounds
└── index.html
```

### 3.3 Infrastructure

**Deployment:**
- Container: Docker
- Orchestration: Kubernetes
- CI/CD: Jenkins
- Monitoring: Prometheus + Grafana
- Logging: ELK Stack

**Environments:**
- `dev` - development
- `staging` - pre-production testing
- `production` - live environment

### 3.4 Security

**Authentication:**
- Telegram Mini App OAuth
- JWT tokens (15 min expiry, refresh tokens)
- Server-side validation of `initData` hash

**Rate Limiting:**
- `/tap`: 10 req/sec per user
- `/upgrade`: 5 req/sec per user
- `/purchase`: 1 req/10sec per user
- General API: 100 req/min per user

**Data Protection:**
- HTTPS only
- SQL injection prevention (parameterized queries)
- XSS protection (sanitize inputs)
- CSRF tokens for sensitive operations

## 4. Content Management

### 4.1 Content-as-Data Approach

All game content stored in versioned files:

```
/content/
├── seasons/
│   └── season_001.yaml    # Current season config
├── items/
│   ├── buildings.json     # All buildings data
│   └── upgrades.json      # Upgrade definitions
├── cosmetics/
│   ├── frames.json        # Avatar frames
│   ├── skins.json         # Planet skins
│   ├── effects.json       # Tap effects
│   └── backgrounds.json   # Background themes
└── flags/
    └── default.json       # Feature flags
```

**Benefits:**
- Content updates without code changes
- A/B testing via feature flags
- Easy rollback
- Version control

### 4.2 Feature Flags

```json
{
  "features": {
    "rewarded_ads_enabled": true,
    "leaderboard_enabled": true,
    "cosmetics_shop_enabled": true,
    "premium_boosts_enabled": true,
    "tier_4_buildings_enabled": false,
    "clan_system_enabled": false
  },
  "experiments": {
    "boost_duration_test": {
      "enabled": true,
      "variants": ["300s", "600s"],
      "rollout": 50
    }
  }
}
```

Server checks flags on every relevant request:
```typescript
if (!featureFlags.get('cosmetics_shop_enabled')) {
  return res.status(503).json({ error: 'Feature temporarily disabled' });
}
```

## 5. Anti-Cheat Implementation

### 5.1 Tap Validation

```typescript
// Server-side
async validateTaps(userId: string, tapCount: number, sessionDuration: number) {
  const maxTaps = sessionDuration * 10; // 10 TPS maximum

  if (tapCount > maxTaps) {
    await this.flagSuspiciousActivity(userId, 'excessive_taps', {
      reported: tapCount,
      max: maxTaps
    });
    return false;
  }

  return true;
}
```

### 5.2 Energy Gain Validation

```typescript
async validateEnergyGain(userId: string, reportedGain: number) {
  const user = await this.getUser(userId);
  const maxTapIncome = this.calculateMaxTapIncome(user);
  const maxPassiveGain = this.calculateMaxPassiveGain(user);
  const maxGain = maxTapIncome + maxPassiveGain;

  if (reportedGain > maxGain * 1.1) { // 10% tolerance
    await this.clampEnergyGain(userId, maxGain);
    return false;
  }

  return true;
}
```

### 5.3 Purchase Idempotency

```typescript
async processPurchase(userId: string, purchaseId: string, itemType: string) {
  // Check if purchase already processed
  const existing = await db.purchases.findOne({ purchase_id: purchaseId });

  if (existing) {
    // Idempotent: return same result
    return {
      success: true,
      already_processed: true,
      purchase: existing
    };
  }

  // Process new purchase
  await db.transaction(async (trx) => {
    await trx.purchases.insert({ purchase_id: purchaseId, user_id: userId, item_type: itemType });
    await this.grantItem(trx, userId, itemType);
  });

  return { success: true, already_processed: false };
}
```

## 6. Performance Targets

### 6.1 Backend
- API Response Time (p95): < 100ms
- API Response Time (p99): < 300ms
- Throughput: 1000 req/sec per instance
- Database queries: < 50ms (p95)

### 6.2 Frontend
- First Contentful Paint: < 1.5s
- Time to Interactive: < 2.5s
- Tap latency: < 50ms (UI feedback)
- Memory usage: < 150MB

### 6.3 Database
- Connection pool: 20-50 connections
- Query timeout: 5 seconds
- Index all foreign keys and query columns

## 7. Monitoring & Metrics

### 7.1 Business Metrics
- DAU (Daily Active Users)
- ARPDAU (Average Revenue Per DAU)
- Retention: D1, D7, D30
- Session length (average)
- Conversion rate (% of payers)

### 7.2 Technical Metrics
- API latency (by endpoint)
- Error rate (by endpoint)
- Database query performance
- Cache hit rate
- Queue processing time

### 7.3 Game Metrics
- Average taps per session
- Average session duration
- Buildings purchased per day
- Upgrade rate
- Leaderboard engagement

## 8. MVP Launch Checklist

### Pre-Launch
- [ ] All API endpoints tested
- [ ] Anti-cheat validation working
- [ ] Telegram Stars integration tested in production
- [ ] Rewarded Ads integration tested
- [ ] Database migrations applied
- [ ] Redis cache configured
- [ ] Feature flags system ready
- [ ] Monitoring dashboards set up
- [ ] Load testing completed (1000 concurrent users)
- [ ] Security audit passed

### Launch Day
- [ ] Deploy to production
- [ ] Verify health checks
- [ ] Monitor error rates
- [ ] Check payment webhooks
- [ ] Verify leaderboard updates
- [ ] Test from multiple devices/regions

### Post-Launch (Week 1)
- [ ] Daily metric reviews
- [ ] Bug fixes prioritization
- [ ] User feedback collection
- [ ] Balance adjustments based on data
- [ ] Performance optimization

## 9. Success Criteria

**Week 1:**
- 1,000+ installs
- 50%+ D1 retention
- < 1% error rate
- Average session: 3+ minutes

**Month 1:**
- 10,000+ installs
- 30%+ D7 retention
- $0.10+ ARPDAU
- 5%+ conversion rate

**Month 3:**
- 50,000+ installs
- 20%+ D30 retention
- $0.15+ ARPDAU
- Clan system launched (Post-MVP)
