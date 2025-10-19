# Product Roadmap: Energy Planet

## Phase 1: MVP (Weeks 1-8)

### Week 1-2: Foundation
**Backend Setup**
- [x] Project structure setup
- [x] PostgreSQL schema & migrations
- [x] Redis integration
- [x] Telegram OAuth authentication
- [x] JWT token system
- [x] Basic API endpoints (/session, /tap, /tick)
- [x] Content loader (YAML/JSON)
- [x] Feature flags system

**Frontend Setup**
- [ ] React + TypeScript boilerplate
- [ ] Telegram Mini App SDK integration
- [ ] UI component library setup
- [ ] State management (Zustand)
- [ ] API client with auth

**DevOps**
- [ ] Dockerfile for backend & frontend
- [ ] Docker Compose for local development
- [ ] Jenkins pipeline (build, test, deploy)
- [ ] Kubernetes manifests
- [ ] Monitoring setup (Prometheus)

**Estimated effort:** 80 hours (2 developers)

---

### Week 3-4: Core Gameplay
**Backend**
- [x] Building system (/upgrade endpoint)
- [x] Passive income calculation
- [x] Offline gains logic
- [x] XP & leveling system
- [x] Anti-cheat validation (tap & energy)
- [x] Leaderboard service with caching

**Frontend**
- [ ] Main game screen (planet, tap mechanic)
- [ ] Energy counter with animations
- [ ] Buildings list & purchase UI
- [ ] Upgrade buttons & modals
- [ ] Level progress bar
- [ ] Passive income ticker

**Content**
- [ ] Buildings config (Tier 1-3)
- [ ] Upgrade formulas implementation
- [ ] Balance tuning

**Estimated effort:** 120 hours (2 developers)

---

### Week 5-6: Monetization & Social
-**Backend**
- [ ] Telegram Stars integration
  - [ ] Invoice generation
  - [ ] Payment webhook handling
  - [ ] Purchase idempotency
- [ ] Rewarded Ads integration (Yandex.Direct)
- [x] Boost system (ad boost, premium boost, daily boost)
- [x] Profile API (/profile/:userId)
- [x] Cosmetics system (/cosmetics, /cosmetics/purchase)
- [x] Mock Stars purchase endpoint (idempotent logging, mock payments)
- [x] Leaderboard API (/leaderboard)

**Frontend**
- [ ] Energy shop (Star packs)
- [ ] Boost UI & timers
- [ ] Cosmetics shop (frames, skins, effects)
- [ ] Profile inspection modal
- [ ] Leaderboard screen
- [ ] Rewarded ad integration

**Content**
- [ ] Cosmetics catalog (20+ items)
- [ ] Pricing & monetization config
- [ ] Season 1 configuration

**Estimated effort:** 100 hours (2 developers)

---

### Week 7-8: Polish & Testing
**Quality Assurance**
- [ ] Unit tests (80% coverage)
- [ ] Integration tests (API endpoints)
- [ ] E2E tests (critical user flows)
- [ ] Load testing (1000 concurrent users)
- [ ] Security audit
- [ ] Balance testing & adjustments

**Polish**
- [ ] Tutorial/FTUE flow
- [ ] Sound effects & haptic feedback
- [ ] Animations & transitions
- [ ] Error handling & user feedback
- [ ] Localization (EN, RU)

**DevOps**
- [ ] Staging environment deployment
- [ ] Production environment setup
- [ ] Monitoring dashboards (Grafana)
- [ ] Alerting rules
- [ ] Backup & recovery procedures

**Estimated effort:** 80 hours (2 developers + 1 QA)

---

### MVP Release Criteria
- ✅ Core gameplay loop functional
- ✅ Monetization working (Stars + Ads)
- ✅ Leaderboard operational
- ✅ Anti-cheat active
- ✅ < 1% error rate in staging
- ✅ Performance targets met
- ✅ Security audit passed

**Total MVP Effort:** 380 hours (~9-10 weeks with 2 developers)

---

## Phase 2: Clan System (Weeks 9-14)

### Week 9-10: Clan Foundation
**Backend**
- [ ] Clan database schema
  - [ ] `clans` table
  - [ ] `clan_members` table
  - [ ] `clan_chat` table (simple)
- [ ] Clan CRUD API
  - [ ] POST /api/v1/clans (create)
  - [ ] GET /api/v1/clans/:id (info)
  - [ ] POST /api/v1/clans/:id/join (join request)
  - [ ] POST /api/v1/clans/:id/leave
  - [ ] GET /api/v1/clans/:id/members
- [ ] Clan roles & permissions (Leader, Officer, Member)
- [ ] Clan leaderboard (by total clan energy)

**Frontend**
- [ ] Clan creation flow
- [ ] Clan browser (discover & join)
- [ ] Clan info screen
- [ ] Member list
- [ ] Join/leave functionality

**Estimated effort:** 60 hours

---

### Week 11-12: Clan Features
**Backend**
- [ ] Clan chat (simple REST API)
- [ ] Clan perks system
  - [ ] Passive bonus based on member count
  - [ ] Clan-wide boosts
- [ ] Clan events/challenges
  - [ ] Weekly clan energy race
  - [ ] Rewards distribution
- [ ] Clan invitation system

**Frontend**
- [ ] Clan chat UI
- [ ] Clan perks display
- [ ] Clan events screen
- [ ] Invitation notifications
- [ ] Clan settings (for leaders)

**Content**
- [ ] Clan perks configuration
- [ ] Clan event templates
- [ ] Clan cosmetics (clan flags, colors)

**Estimated effort:** 80 hours

---

### Week 13-14: Clan Polish
- [ ] Clan activity feed
- [ ] Kick/ban functionality
- [ ] Clan search & filters
- [ ] Clan statistics dashboard
- [ ] Achievements for clan activities
- [ ] Testing & bug fixes

**Estimated effort:** 40 hours

**Total Clan System Effort:** 180 hours (~6 weeks with 2 developers)

---

## Phase 3: Arena/PvP (Weeks 15-22)

### Week 15-16: Arena Foundation
**Backend**
- [ ] Arena database schema
  - [ ] `arena_stats` table (ELO, wins, losses)
  - [ ] `arena_battles` table (match history)
  - [ ] `arena_seasons` table
- [ ] Matchmaking algorithm
  - [ ] ELO-based pairing
  - [ ] Queue system (BullMQ)
- [ ] Battle simulation logic
  - [ ] Formula: compare total energy production rates
  - [ ] Outcome: winner determined by production * random(0.9-1.1)
- [ ] Arena API
  - [ ] POST /api/v1/arena/queue (join queue)
  - [ ] DELETE /api/v1/arena/queue (leave queue)
  - [ ] GET /api/v1/arena/stats
  - [ ] GET /api/v1/arena/history

**Frontend**
- [ ] Arena screen (stats, queue button)
- [ ] Matchmaking UI (searching...)
- [ ] Battle animation (simple visualization)
- [ ] Battle results modal
- [ ] Arena leaderboard

**Estimated effort:** 80 hours

---

### Week 17-18: Arena Progression
**Backend**
- [ ] Arena ranking system (Bronze → Silver → Gold → Platinum → Diamond)
- [ ] Seasonal resets (every 2 weeks)
- [ ] Arena rewards
  - [ ] End-of-season rewards (cosmetics, energy)
  - [ ] Win streak bonuses
- [ ] Spectator mode (view live battles)
- [ ] Replay system (save battle data)

**Frontend**
- [ ] Rank badges & progression UI
- [ ] Season timer & info
- [ ] Rewards preview
- [ ] Spectator UI
- [ ] Replay viewer

**Content**
- [ ] Arena season configurations
- [ ] Rank thresholds & rewards
- [ ] Exclusive arena cosmetics

**Estimated effort:** 70 hours

---

### Week 19-20: Arena Features
**Backend**
- [ ] Tournament system
  - [ ] 32-player brackets
  - [ ] Scheduled events (weekends)
- [ ] Arena challenges (daily quests)
- [ ] Defensive loadout (allow customization)
- [ ] Arena shop (special currency)

**Frontend**
- [ ] Tournament bracket UI
- [ ] Tournament registration
- [ ] Arena challenges screen
- [ ] Loadout editor
- [ ] Arena shop

**Estimated effort:** 60 hours

---

### Week 21-22: Arena Polish & Balance
- [ ] Balance testing (simulation of 10k battles)
- [ ] Anti-cheat for arena (validate loadouts)
- [ ] Arena notifications (match found, results)
- [ ] Arena achievements
- [ ] Testing & bug fixes
- [ ] Soft launch to 10% of users

**Estimated effort:** 50 hours

**Total Arena System Effort:** 260 hours (~8 weeks with 2 developers)

---

## Phase 4: Future Features (Post-Arena)

### Q2 2025: Engagement Features
- [ ] Achievements system (100+ achievements)
- [ ] Daily quests & missions
- [ ] Friends system (Telegram contacts)
- [ ] Gift system (send energy to friends)
- [ ] Prestige system (reset for permanent bonuses)
- [ ] Tier 5 buildings (late-game content)

**Estimated effort:** 200 hours (8 weeks)

---

### Q3 2025: Events & Seasons
- [ ] Limited-time events
  - [ ] Energy Rush (2x income weekend)
  - [ ] Building Spree (discount on buildings)
  - [ ] Leaderboard Blitz (special prizes)
- [ ] Seasonal content rotation
  - [ ] Seasonal cosmetics
  - [ ] Seasonal buildings (temporary)
  - [ ] Battle Pass system
- [ ] Holiday events

**Estimated effort:** 150 hours (6 weeks)

---

### Q4 2025: Advanced Features
- [ ] Guild Wars (clan vs clan battles)
- [ ] Cooperative raids (PvE content)
- [ ] Player trading (cosmetics)
- [ ] Crafting system (combine items)
- [ ] Pet system (companions that boost income)
- [ ] Web3 integration (optional NFT cosmetics)

**Estimated effort:** 300 hours (12 weeks)

---

## Timeline Summary

| Phase | Duration | Developers | Effort | Release |
|-------|----------|------------|--------|---------|
| **MVP** | 8 weeks | 2 | 380h | Week 8 |
| **Clan System** | 6 weeks | 2 | 180h | Week 14 |
| **Arena/PvP** | 8 weeks | 2 | 260h | Week 22 |
| **Future Features** | Ongoing | 2-3 | Variable | 2025-2026 |

---

## Resource Allocation

### Team Structure (MVP → Arena)
- **2x Backend Developers** (Node.js/TypeScript)
- **1x Frontend Developer** (React/TypeScript)
- **0.5x DevOps Engineer** (part-time, setup phase)
- **0.5x QA Engineer** (part-time, testing phase)
- **1x Game Designer** (balance, content)
- **0.25x UI/UX Designer** (assets, mockups)

### Infrastructure Costs (Monthly)
- **Development:** $50 (small VPS)
- **Staging:** $100 (mid-tier VPS + DB)
- **Production:** $300-500 (scalable infra)
  - 2x Backend instances (k8s)
  - PostgreSQL managed DB
  - Redis cache
  - CDN for static assets
  - Monitoring stack
- **Total (Prod):** ~$500/month initially

### Third-Party Costs
- **Telegram Bot API:** Free
- **Telegram Stars:** 30% platform fee
- **Ad Network (Yandex/AdMob):** 30% platform fee
- **Monitoring (Grafana Cloud):** Free tier → $50/month
- **Domain & SSL:** $20/year

---

## Risks & Mitigations

### Technical Risks
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Telegram API rate limits | High | Medium | Implement aggressive caching, request batching |
| Database performance at scale | High | Medium | Index optimization, read replicas, caching layer |
| Anti-cheat bypass | Medium | High | Multi-layer validation, anomaly detection, manual review |
| Payment webhook failures | High | Low | Retry logic, idempotency, transaction logging |

### Business Risks
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Low user retention | High | Medium | Tight core loop, regular content updates, events |
| Poor monetization | High | Medium | A/B testing prices, diverse monetization options |
| Competitor launches similar game | Medium | High | Fast iteration, unique features, community building |
| Telegram policy changes | High | Low | Stay compliant, diversify platform (web version) |

---

## Success Metrics by Phase

### MVP Success (Week 8)
- 1,000+ installs in first week
- 50%+ D1 retention
- 3+ min average session
- < 1% crash rate

### Clan System Success (Week 14)
- 30%+ of active users in clans
- 20%+ D7 retention
- 5+ clan events completed per week

### Arena Success (Week 22)
- 20%+ of active users try arena
- 10+ battles per active arena user per week
- 15%+ D30 retention

---

## Next Steps

1. **Immediate (This Week):**
   - Finalize MVP technical architecture
   - Set up development environment
   - Begin backend foundation work

2. **Short-term (Month 1):**
   - Complete core gameplay loop
   - First playable prototype
   - Internal alpha testing

3. **Mid-term (Month 2-3):**
   - MVP feature complete
   - Beta testing with 50-100 users
   - Soft launch preparation

4. **Long-term (Month 4+):**
   - Public launch
   - Iterate based on metrics
   - Plan Clan System development
