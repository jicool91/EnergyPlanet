# Roadmap & Приоритеты Energy Planet

**Дата:** Ноябрь 2025
**Фокус:** Пошаговый план от MVP до Scale

---

## 🚀 Critical Path to Launch

### Week 1-2: Foundation (MVP Blockers) 🔴

**Цель:** Минимально жизнеспособный продукт

#### Backend (3-5 дней)
- [ ] **Telegram OAuth валидация** (1-2 дня)
  - Реализовать initData validation в AuthService
  - Тестирование с реальным Telegram
  - Документация: [Telegram WebApps](https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app)

- [ ] **Завершить Rate Limiting** (1 день)
  - Per-endpoint limits (tap, upgrade, purchase)
  - Redis-backed для distributed setup
  - Тестирование под нагрузкой

- [ ] **Telegram Stars real integration** (2-3 дня)
  - createInvoiceLink API
  - Payment webhook handling
  - Idempotency validation
  - Sandbox testing

#### Frontend (7-10 дней)
- [ ] **Setup React project** (1 день)
  - Vite + TypeScript
  - Telegram SDK integration (@tma.js/sdk)
  - Router setup (React Router)
  - State management (Zustand)

- [ ] **TapScreen** (2-3 дня)
  - Planet image с tap animation
  - Energy counter (animated)
  - Stats display (tap income, passive income)
  - Haptic feedback
  - API integration (/tap endpoint)

- [ ] **BuildingsScreen** (2-3 дня)
  - Building list (virtual scrolling)
  - Purchase UI
  - Upgrade UI
  - Lock indicators (level requirements)
  - API integration (/upgrade endpoint)

- [ ] **Bottom Navigation** (1 день)
  - Tab bar (Home, Buildings, Shop, Profile)
  - Screen transitions
  - Active state indicators

- [ ] **ShopScreen (MVP)** (2 дня)
  - Energy packs display
  - Telegram Stars integration (openInvoice)
  - Rewarded ads placeholder
  - Purchase flow

#### DevOps (2-3 дня)
- [ ] **Railway Deployment** (2 дня)
  - Backend deployment config
  - Frontend deployment (Nginx)
  - Environment variables setup
  - Database migration on deploy
  - Health checks

- [ ] **CI/CD Pipeline** (1 день)
  - GitHub Actions
  - Auto-deploy on main branch
  - Test before deploy

**Success Metrics:**
- ✅ All API endpoints working
- ✅ Can tap and earn energy
- ✅ Can purchase buildings
- ✅ Can buy with Telegram Stars
- ✅ Deployed to production

---

## 📈 Month 1: MVP Polish & Soft Launch

### Week 3: Polish & Testing

- [ ] **ProfileScreen** (2 дня)
  - User stats display
  - Level progression
  - Leaderboard ranking
  - Cosmetics showcase

- [ ] **Animations & Polish** (2-3 дня)
  - Tap particles effect
  - Level up modal with confetti
  - Loading skeletons
  - Error states
  - Success toasts

- [ ] **Rewarded Ads Integration** (2 дня)
  - Monetag SDK setup
  - Ad placement (boost button)
  - Reward claiming flow
  - Fallback if ads unavailable

### Week 4: Launch Preparation

- [ ] **Testing** (3 дня)
  - Manual testing on iOS/Android
  - Load testing (500 concurrent users)
  - Payment flow testing
  - Bug fixes

- [ ] **Monitoring Setup** (1 день)
  - Prometheus metrics
  - Grafana dashboards
  - Error tracking (Sentry)
  - Alerting

- [ ] **Content Preparation** (1 день)
  - Marketing materials
  - Gameplay GIFs/videos
  - Launch announcement
  - Telegram channel setup

- [ ] **Soft Launch** (ongoing)
  - Week 4-5: Launch to 500-1,000 users
  - Monitor metrics daily
  - Quick iteration on feedback
  - Fix critical bugs

**Success Metrics:**
- ✅ 500+ users acquired
- ✅ D1 Retention > 40%
- ✅ Error rate < 1%
- ✅ 10+ purchases ($100+ revenue)
- ✅ Average session > 3 minutes

---

## 🌱 Month 2: Growth & Optimization

### Feature Development

- [ ] **Referral System** (1 неделя)
  - Referral link generation
  - Reward distribution
  - Analytics dashboard
  - In-app sharing UI

- [ ] **Daily Rewards** (3 дня)
  - Login tracking
  - Reward calendar UI
  - Claim flow
  - Streak mechanics

- [ ] **Push Notifications** (3 дня)
  - Telegram Bot notifications
  - Trigger logic (offline, events, friends)
  - User preferences

- [ ] **Enhanced Cosmetics** (1 неделя)
  - 10+ new items (frames, skins)
  - Preview system
  - Rarity tiers
  - Unlock conditions

### Optimization

- [ ] **A/B Testing Framework** (3 дня)
  - Feature flags system
  - Analytics integration
  - Pricing experiments
  - UI variants

- [ ] **Performance Optimization** (ongoing)
  - Frontend bundle size < 500KB
  - API p95 latency < 100ms
  - Database query optimization
  - Redis caching expansion

- [ ] **Anti-Cheat Hardening** (2 дня)
  - Stricter validation
  - Anomaly detection algorithms
  - Automated ban system
  - Manual review dashboard

### Marketing

- [ ] **Paid Acquisition Start** (Week 5)
  - Telegram Ads campaign ($50/day)
  - TikTok creative production
  - Influencer outreach

- [ ] **Community Building** (ongoing)
  - Telegram channel growth
  - User feedback collection
  - Feature requests prioritization

**Success Metrics:**
- ✅ 5,000+ DAU
- ✅ D7 Retention > 25%
- ✅ ARPDAU > $0.12
- ✅ Viral coefficient > 0.3
- ✅ CPI < $0.30

---

## 🚀 Month 3: Scale & New Features

### Major Features

- [ ] **Achievements System** (1 неделя)
  - 20+ achievements
  - Unlock conditions
  - Reward distribution
  - Notification system
  - Showcase in profile

- [ ] **Daily Quests** (1 неделя)
  - Quest types (tap, build, upgrade)
  - Daily rotation
  - Progress tracking
  - Reward system

- [ ] **Seasonal Content** (1 неделя)
  - Season framework
  - Battle pass (free + premium)
  - Exclusive rewards
  - Time-limited events

- [ ] **Clan System (Post-MVP)** (2 недели)
  - Clan creation/joining
  - Clan leaderboard
  - Clan chat
  - Cooperative goals

### Infrastructure

- [ ] **Database Scaling** (1 неделя)
  - Read replicas setup
  - Query optimization
  - Sharding preparation (if needed)

- [ ] **Multi-Region Deployment** (1 неделя)
  - CDN for static assets
  - Regional API servers (if needed)
  - Latency optimization

### Marketing Scale

- [ ] **Influencer Partnerships** (ongoing)
  - Micro-influencer campaigns
  - Content collaborations
  - Sponsored posts

- [ ] **Cross-Promotions** (ongoing)
  - Partner with other TMA games
  - Traffic exchange deals

**Success Metrics:**
- ✅ 25,000+ DAU
- ✅ D30 Retention > 15%
- ✅ ARPDAU > $0.15
- ✅ $100,000+ MRR
- ✅ Top 100 TMA games

---

## 🌍 Month 4+: Enterprise Scale

### Advanced Features

- [ ] **Arena/PvP System** (3 недели)
  - Matchmaking
  - Battle mechanics
  - Leaderboards
  - Rewards

- [ ] **Prestige System** (2 недели)
  - Reset mechanics
  - Prestige bonuses
  - New progression curve

- [ ] **Web3 Integration** (optional, 3 недели)
  - TON blockchain integration
  - NFT cosmetics
  - Tokenomics
  - Wallet connection

### Infrastructure

- [ ] **Kubernetes Migration** (2-3 недели)
  - K8s cluster setup
  - Auto-scaling policies
  - Service mesh (Istio)
  - Monitoring stack

- [ ] **Microservices** (optional, 1-2 месяца)
  - Break monolith if needed
  - Service communication (gRPC)
  - API gateway

**Success Metrics:**
- ✅ 100,000+ DAU
- ✅ $500,000+ MRR
- ✅ Top 50 TMA games
- ✅ Profitability

---

## 🎯 Key Milestones

```
┌─────────────────────────────────────────────────────────┐
│                      Timeline                            │
├─────────────────────────────────────────────────────────┤
│ Week 1-2:  MVP Development (Critical Path)              │
│ Week 3-4:  Polish & Soft Launch (500-1K users)          │
│ Month 2:   Growth & Optimization (5K-10K DAU)           │
│ Month 3:   Scale & New Features (25K+ DAU)              │
│ Month 4+:  Enterprise Scale (100K+ DAU)                 │
└─────────────────────────────────────────────────────────┘

Revenue Projections:
Month 1:  $3,000
Month 2:  $15,000
Month 3:  $45,000
Month 6:  $150,000+
Month 12: $500,000+
```

---

## ⚠️ Risk Mitigation

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Slow Frontend Dev** | HIGH | CRITICAL | Hire contractor, reduce scope |
| **Telegram API Changes** | MEDIUM | HIGH | Follow official channels, version lock |
| **Performance Issues** | MEDIUM | HIGH | Load test early, optimize proactively |
| **Security Breach** | LOW | CRITICAL | Penetration testing, bug bounty |

### Business Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Low Retention** | MEDIUM | CRITICAL | Extensive playtesting, iterate fast |
| **Poor Monetization** | MEDIUM | HIGH | A/B test pricing, study competitors |
| **Clone Apps** | HIGH | MEDIUM | Speed to market, unique features |
| **Market Saturation** | MEDIUM | MEDIUM | Differentiation, quality over quantity |

---

## 📊 Decision Framework

### Go/No-Go Criteria (After Soft Launch)

**Proceed to Scale if:**
- ✅ D1 Retention > 35%
- ✅ D7 Retention > 20%
- ✅ ARPDAU > $0.08
- ✅ Error rate < 2%
- ✅ Positive user feedback

**Pivot if:**
- ❌ D1 Retention < 25%
- ❌ Negative user sentiment
- ❌ High churn after purchase

**Kill if:**
- ❌ D1 Retention < 15%
- ❌ Fundamental product issues
- ❌ Unsolvable technical problems

---

## 🎓 Learning & Iteration

### Weekly Review Process

**Every Monday:**
1. Review metrics dashboard
2. Identify bottlenecks
3. Prioritize fixes/features
4. Update roadmap

**Key Questions:**
- Where are users dropping off?
- What features have highest engagement?
- Which channels have best ROAS?
- What's the #1 complaint?

### Monthly Strategy Review

**Every Month:**
1. Deep dive analytics
2. Competitive analysis
3. User interviews (10-20)
4. Financial review
5. Roadmap adjustment

---

## 🎯 Final Checklist

### Before MVP Launch:
- [ ] All critical features working
- [ ] Tested on iOS and Android
- [ ] Payment flow tested with real money
- [ ] Monitoring and alerting set up
- [ ] Rollback plan ready
- [ ] Support channel created (Telegram)
- [ ] Terms of Service & Privacy Policy
- [ ] BotFather configuration complete

### Before Scale (Month 2):
- [ ] Soft launch metrics validate product-market fit
- [ ] Infrastructure can handle 10x traffic
- [ ] Ad creative tested and optimized
- [ ] Referral program ready
- [ ] Customer support process defined

### Before Enterprise (Month 4+):
- [ ] Proven unit economics (LTV > 3x CAC)
- [ ] Scalable infrastructure (K8s)
- [ ] Team expanded (if needed)
- [ ] Legal/compliance reviewed
- [ ] Exit strategy defined (if relevant)

---

## 💡 Pro Tips

**Development:**
- Start simple, iterate fast
- Ship features in smallest viable increments
- Don't over-engineer early
- Technical debt is OK if managed

**Marketing:**
- Quality > Quantity of users
- Retention > Acquisition
- Organic > Paid (but paid accelerates)
- Community is everything

**Monetization:**
- Fair pricing = better LTV
- Don't kill retention for short-term revenue
- Diversify income streams
- Trust takes time to build

**Team:**
- Focus is key - say no to distractions
- Celebrate small wins
- Learn from failures fast
- User feedback is gold

---

## 🚀 Conclusion

Energy Planet имеет четкий путь от **MVP** (2 weeks) к **Scale** (3+ months).

**Critical success factors:**
1. Execute MVP flawlessly
2. Hit retention targets
3. Iterate based on data
4. Scale proven channels

**С правильным execution:**
- Month 3: 25K+ DAU, $45K MRR
- Month 6: 100K+ DAU, $150K+ MRR
- Month 12: Top 50 TMA game

**Время действовать! 🎮⚡**

---

**Полная документация:** [README.md](./README.md)
