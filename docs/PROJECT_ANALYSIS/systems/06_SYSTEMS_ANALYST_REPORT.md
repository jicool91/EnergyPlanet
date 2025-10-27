# 🔍 SYSTEMS ANALYST REPORT
## Energy Planet - Dependencies, Bottlenecks & Risk Analysis

**Дата:** 2025-10-28 | **Status:** MVP architecture ready
**System Health Score:** 7/10 | **Risk Level:** MEDIUM

---

## 1. SYSTEM DEPENDENCY MAP

### Core Dependencies:

```
┌─────────────────────────────────────────────────────────────┐
│                      USERS (Telegram)                       │
└─────────┬───────────────────────────────────────────────────┘
          │
    ┌─────┴─────────────────────────────────────────────┐
    │                                                    │
    ↓                                                    ↓
┌──────────────────┐                        ┌─────────────────┐
│  Telegram WebApp │                        │  Backend API    │
│  (React App)     │◄───────────────────────│  (Express)      │
│  - Zustand       │   HTTP/REST            │  - Services     │
│  - Components    │   /api/v1/*            │  - Repositories │
│  - Animations    │                        │  - Middleware   │
└──────────────────┘                        └────────┬────────┘
                                                     │
                              ┌──────────────────────┼──────────────────────┐
                              │                      │                      │
                              ↓                      ↓                      ↓
                        ┌─────────────┐    ┌──────────────┐    ┌──────────────┐
                        │ PostgreSQL  │    │ Redis Cache  │    │ Content      │
                        │ (Database)  │    │ (Session)    │    │ Files        │
                        │ - Tables    │    │ - Leaderboard│    │ (JSON/YAML)  │
                        │ - Migrations│    │ - Locks      │    │ - Buildings  │
                        └─────────────┘    └──────────────┘    └──────────────┘
                              │                      │                      │
                              └──────────────────────┼──────────────────────┘
                                                     │
                            ┌────────────────────────┴────────────────────┐
                            │                                             │
                            ↓                                             ↓
                      ┌─────────────────┐                      ┌────────────────┐
                      │  Telegram Stars │                      │  Monitoring/   │
                      │  (Monetization) │                      │  Logging       │
                      │  - Payments API │                      │  - Winston     │
                      │  - Validation   │                      │  - Prometheus  │
                      └─────────────────┘                      └────────────────┘
```

### Dependencies Matrix:

| Component | Depends On | Risk | Impact |
|-----------|-----------|------|--------|
| **Webapp** | Backend API | MEDIUM | Can't play if API down |
| **Backend** | PostgreSQL | HIGH | Data loss, service crash |
| **Backend** | Redis | HIGH | Session loss, slow leaderboard |
| **Backend** | Telegram OAuth | HIGH | Can't login |
| **Backend** | Content files | LOW | Graceful degradation |
| **Monetization** | Telegram Stars API | MEDIUM | Can't buy, revenue lost |
| **WebApp** | Telegram WebApp SDK | MEDIUM | Some features broken |

---

## 2. CRITICAL DEPENDENCIES (SINGLE POINTS OF FAILURE)

### 🔴 Tier 1 (CRITICAL - Game Down):

1. **PostgreSQL Database**
   - **Risk:** Database corrupted or down
   - **Impact:** Complete game outage
   - **MTTR (Mean Time to Recover):** 30-60 min
   - **Mitigation:**
     - Daily backups (automated)
     - Replica for failover
     - Point-in-time recovery capability
     - **Timeline to implement:** 4 hours setup

2. **Telegram OAuth Service**
   - **Risk:** Telegram API changes or down
   - **Impact:** Users can't login
   - **MTTR:** 5-15 min (wait for Telegram)
   - **Mitigation:**
     - Fallback email login (for admins)
     - Graceful error message ("Telegram is temporarily down")
     - **Timeline:** Already has fallback

3. **Backend API**
   - **Risk:** Node.js crash or out of memory
   - **Impact:** Can't play, can't purchase
   - **MTTR:** 1-5 min (auto-restart)
   - **Mitigation:**
     - Docker restart policy: `unless-stopped`
     - Process manager (PM2) for monitoring
     - Memory limits + alerts
     - Load testing to find breaking point
     - **Timeline:** 2 hours to implement

### 🟠 Tier 2 (HIGH - Major Features Down):

4. **Redis Cache**
   - **Risk:** Redis crashes or loses data
   - **Impact:** Slow leaderboard, lost sessions
   - **MTTR:** 5 min (auto-restart)
   - **Mitigation:**
     - Persist to disk (RDB snapshots)
     - Redis replication (slave)
     - Failover to PostgreSQL for sessions
     - **Timeline:** 2 hours

5. **Telegram Stars API**
   - **Risk:** API down or rate limited
   - **Impact:** Users can't buy (revenue loss)
   - **MTTR:** 30 min (wait for Telegram)
   - **Mitigation:**
     - Queue purchases locally
     - Retry mechanism (exponential backoff)
     - Manual processing fallback
     - **Timeline:** 3 hours

---

## 3. BOTTLENECKS (Performance Constraints)

### 🟡 Bottleneck #1: Leaderboard Queries (MEDIUM)
**Problem:**
```sql
SELECT * FROM progress
ORDER BY xp DESC, level DESC
LIMIT 100;
```
- Full table scan if no index
- Slow with 100k+ users
- Called every 30 seconds (cache hit), but still slow to calculate

**Impact:** p95 latency +200ms, database CPU spike

**Solution:**
- Add composite index: `(xp DESC, level DESC)`
- Denormalize leaderboard (update async in background)
- Cache top 1000 instead of full table

**Timeline:** 1 hour

---

### 🟡 Bottleneck #2: Event Logging on Every Tap (MEDIUM)
**Problem:**
```typescript
// TapService inserts into events table
INSERT INTO events (user_id, event_type, event_data, is_suspicious)
VALUES ($1, $2, $3, $4);
```
- Every suspicious tap = DB write
- Could be 10,000+ writes/sec at scale
- Database write-heavy

**Impact:** Database bottleneck at 10k DAU

**Solution:**
- Batch event writes (buffer in Redis, flush every 5s)
- Or use message queue (BullMQ) for async processing
- Or use time-series DB (InfluxDB) for metrics

**Timeline:** 4 hours

---

### 🟡 Bottleneck #3: Session Lookups (LOW-MEDIUM)
**Problem:**
```typescript
// Every request does: sessionRepo.get(sessionId)
// Redis lookup on every request
```
- Not actually a bottleneck yet
- But will be at 100k RPS

**Impact:** Redis memory usage, latency

**Solution:**
- Add short-lived token cache (in-memory)
- Or use JWT (stateless, no session lookup needed)

**Timeline:** 2 hours

---

### 🟢 Bottleneck #4: Content Loading (LOW)
**Problem:**
- Content loads from files on startup
- If 1000 buildings, parsing takes time
- Currently graceful degradation (OK if files missing)

**Impact:** Startup time +2-3s

**Solution:** Minimal - already using ContentService

**Timeline:** Not critical

---

## 4. RISKS ANALYSIS

### Risk Matrix:

| Risk | Probability | Impact | Severity | Mitigation |
|------|-----------|--------|----------|-----------|
| Database corruption | 5% | CRITICAL | 25 | Daily backups |
| Telegram OAuth broken | 10% | HIGH | 50 | Fallback login |
| Backend memory leak | 15% | HIGH | 75 | Monitoring + alerts |
| Energy cap at 1000 breaks gameplay | 20% | MEDIUM | 100 | User testing |
| Monetization not working at launch | 10% | CRITICAL | 250 | Pre-launch testing |
| Leaderboard crashes at 100k users | 30% | MEDIUM | 90 | Index + denormalize |
| Event logging DoS | 25% | MEDIUM | 100 | Batch writes |
| Frontend bundle too large | 40% | MEDIUM | 80 | Code splitting |
| SQL injection vulnerability | 5% | CRITICAL | 500 | Parameterized queries (✓) |
| Rate limiting insufficient | 50% | HIGH | 150 | Increase limits + DDoS protection |

### Top 3 Risks to Address:

**🔴 1. Monetization Not Working at Launch**
- **Risk:** User tries to buy, fails silently
- **Impact:** $0 revenue, bad reviews, churn
- **Probability:** 10% (if OAuth/Stars not tested)
- **Solution:** End-to-end testing (OAuth + Stars payment)
- **Timeline:** 8 hours for testing

**🔴 2. Energy Cap Breaks Gameplay**
- **Risk:** User can't earn more energy, feels stuck
- **Impact:** 20% churn at level 5+
- **Probability:** 20% (design issue)
- **Solution:** User testing (5 users for 1 hour)
- **Timeline:** 4 hours

**🔴 3. Backend Memory Leak**
- **Risk:** Heroku crashes after 2 hours (memory full)
- **Impact:** Downtime, users frustrated
- **Probability:** 15% (common in Node.js)
- **Solution:** Memory profiling, alerts, auto-restart
- **Timeline:** 4 hours

---

## 5. CONSTRAINT ANALYSIS

### Constraint #1: Database Connections (MEDIUM)
```
Current pool: max 20 connections
At 10k DAU (100 req/sec):
├─ Each request uses 1 connection for ~100ms
├─ 100 req/sec * 0.1s = 10 concurrent connections (OK)
└─ But spikes could exceed 20

Solution: Increase to 50, monitor usage
Timeline: 30 min
```

### Constraint #2: Memory (Backend Pod)
```
Current: 512MB (Railway default)
At 10k DAU:
├─ Leaderboard cache: ~1-5MB
├─ Content in memory: ~10MB
├─ Session cache: ~1MB per 1000 users = 10MB
├─ Node.js overhead: ~100MB
└─ Total: ~130MB (OK for 512MB)

At 100k DAU:
├─ Session cache: ~100MB
├─ Leaderboard cache: ~50MB
├─ Node.js: ~150MB
└─ Total: ~300MB (OK but tight)

Solution: Monitor, scale if needed
Timeline: Ongoing monitoring
```

### Constraint #3: Telegram Stars Rate Limits
```
Unknown (Telegram doesn't publish)
Assumption: 100 payments/sec max
At $1 avg = $100/sec = $360k/hour
(If this becomes bottleneck: use payment provider instead)

Solution: Implement payment queueing
Timeline: 4 hours
```

---

## 6. INTEGRATION POINTS (Where Things Break)

### 🔴 Critical Integration: Telegram OAuth

**How it works:**
1. User clicks "Login with Telegram"
2. WebApp calls `window.Telegram.WebApp.initData`
3. Frontend sends initData to backend
4. Backend validates hash using BOT_TOKEN
5. Backend creates JWT + session
6. User can play

**Risk:** If step 4 fails (wrong hash), user can't login

**Test Checklist:**
- [ ] Test with real Telegram app
- [ ] Test with invalid hash (should reject)
- [ ] Test with expired timestamp
- [ ] Test on slow network (slow auth)
- [ ] Test offline (should fail gracefully)

---

### 🔴 Critical Integration: Telegram Stars

**How it works:**
1. User clicks "Buy" on cosmetics
2. Frontend calls `Telegram.WebApp.openInvoice()`
3. Telegram shows payment UI
4. User confirms payment
5. Telegram calls backend webhook
6. Backend validates payment, adds cosmetics

**Risk:** Webhook doesn't arrive, user doesn't get cosmetics

**Test Checklist:**
- [ ] Test sandbox payments
- [ ] Test webhook retry (if fails)
- [ ] Test idempotency (same payment twice)
- [ ] Test timeout handling

---

## 7. RECOMMENDED ACTIONS

### Immediate (This week):
- [ ] Load test: 100 concurrent users for 10 min
- [ ] End-to-end OAuth test on real Telegram
- [ ] End-to-end Stars payment test
- [ ] Database backup strategy
- [ ] Memory profiling (production simulation)

### Short-term (Week 1-2):
- [ ] Add database indexes (leaderboard)
- [ ] Implement event batching (Redis → DB)
- [ ] Add memory alerts (80% usage)
- [ ] Add API rate limiting (DDoS protection)
- [ ] Implement graceful degradation (if Redis down)

### Medium-term (Week 3-4):
- [ ] Load test: 1000 concurrent users
- [ ] Implement Redis replication
- [ ] Add distributed tracing (debug issues)
- [ ] Document disaster recovery plan
- [ ] Implement auto-scaling (if on K8s)

---

## CONCLUSION

**System Health:** 7/10 (Good, but needs monitoring)

**Critical Actions Before Launch:**
1. Test OAuth end-to-end
2. Test Stars payment end-to-end
3. Load test to 100 concurrent users
4. Set up monitoring + alerts

**Key Bottlenecks:** Leaderboard, Event logging, Memory usage

**Top Risk:** Monetization not working (10% probability, CRITICAL impact)

**Next Step:** Run pre-launch testing checklist, fix any blockers.
