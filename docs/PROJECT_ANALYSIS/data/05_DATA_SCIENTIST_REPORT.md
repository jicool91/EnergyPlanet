# 📈 DATA SCIENTIST REPORT
## Energy Planet - Analytics, Metrics & A/B Testing Strategy

**Дата:** 2025-10-28 | **Status:** Analytics infrastructure 30% ready
**Data Readiness Score:** 4/10 | **A/B Testing Readiness:** 3/10

---

## 1. ANALYTICS INFRASTRUCTURE

### Current State:

✅ **Events table exists** (anti-cheat logging)
```sql
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  user_id UUID,
  event_type VARCHAR(50),
  event_data JSONB,
  is_suspicious BOOLEAN,
  created_at TIMESTAMP
);
```

✅ **Telemetry endpoint ready** (`POST /api/v1/telemetry`)
- Accepts event data from frontend
- Logs to events table

⚠️ **But:** No analytics dashboard to view data
⚠️ **But:** No filtering/querying for product insights
⚠️ **But:** No real-time metrics visualization

### Missing Critical Events:

```
❌ User lifecycle:
  - signup
  - first_login
  - last_login
  - signup_source (organic/referral/ad)

❌ Game events:
  - tap (too granular?)
  - level_up
  - building_purchase
  - prestige_triggered

❌ Monetization:
  - first_purchase_shown
  - first_purchase_completed
  - repeat_purchase
  - cosmetics_equipped

❌ Engagement:
  - session_start
  - session_end
  - session_duration
  - buildings_viewed
  - leaderboard_viewed

❌ Social:
  - friend_added
  - clan_created
  - clan_joined
  - challenge_sent
```

---

## 2. KEY METRICS TO TRACK

### Tier 1 (MUST HAVE - measure first):

| Метрика | Target | How to Measure | Why |
|---------|--------|---|---|
| **D1 Retention** | 30%+ | `users_login_day0 / users_login_day1` | Primary engagement signal |
| **Session Length** | 5-10 min | `logout_time - login_time` | Engagement quality |
| **First Tap Time** | <30s | `first_tap_timestamp` | Onboarding friction |
| **Auth Success Rate** | 95%+ | `login_attempts / successful_logins` | Critical blocker |
| **API Error Rate** | <1% | `errors / total_requests` | Technical health |

### Tier 2 (IMPORTANT - measure week 2):

| Метрика | Target | How to Measure |
|---------|--------|---|
| D7 Retention | 15%+ | Users active day 7 |
| Level 1 Completion | 80%+ | Users reach level 2 |
| First Purchase (if offered) | 5%+ | Purchase / users shown offer |
| Average Taps per Session | 500+ | Total taps / sessions |
| Energy Cap Hits | Track | Sessions where energy maxed |

### Tier 3 (STRATEGIC - measure month 1):

| Метрика | Target | How to Measure |
|---------|--------|---|
| D30 Retention | 5%+ | Users active day 30 |
| Repeat Purchase Rate | 30%+ | Buyers who buy 2x / 1x buyers |
| LTV (Lifetime Value) | $0.50+ | Revenue / users |
| CAC (Customer Acq Cost) | $0 (organic) | Ad spend / new users |
| ARPU (Avg Revenue/User) | $0.50/month | Revenue / MAU |
| Churn Rate | <5%/week | Lost users / week |

---

## 3. ANALYTICS GAPS (CRITICAL)

### Gap 1: No User Funnel Tracking

**What's missing:**
```
Current flow not tracked:
├─ Signup started → Signup completed (gap: do users abandon?)
├─ Onboarding started → Onboarding completed (gap: where do they quit?)
├─ First purchase shown → First purchase completed (gap: conversion rate?)
└─ Regular user → Loyal user (gap: what keeps them?)
```

**Solution:**
```typescript
// Add funnel events
await telemetry.log({
  event: 'funnel_step',
  funnel: 'onboarding',
  step: 'shown',
  step_number: 1
});

await telemetry.log({
  event: 'funnel_step',
  funnel: 'onboarding',
  step: 'completed',
  step_number: 1,
  time_spent_ms: 45000
});
```

**Impact:** Identify where 20% of users are lost

---

### Gap 2: No User Segmentation

**What's missing:**
- DAU/MAU trends
- Cohort analysis (users from different weeks)
- User segments (paying vs free, casual vs hardcore)

**SQL to implement:**
```sql
-- Daily cohort analysis
SELECT
  DATE(created_at) as signup_date,
  COUNT(*) as cohort_size,
  SUM(CASE WHEN last_login >= (created_at + INTERVAL '7 days') THEN 1 ELSE 0 END) as d7_retained,
  SUM(CASE WHEN last_login >= (created_at + INTERVAL '30 days') THEN 1 ELSE 0 END) as d30_retained
FROM users
GROUP BY signup_date
ORDER BY signup_date DESC;
```

---

### Gap 3: No A/B Testing Framework

**Missing:**
- No experiment assignment (random group assignment)
- No statistical significance calculation
- No result tracking

**Need to implement:**
```sql
CREATE TABLE experiments (
  id UUID,
  name VARCHAR,
  variant VARCHAR, -- 'control', 'test_a', 'test_b'
  user_id UUID,
  assignment_date TIMESTAMP,
  UNIQUE(id, user_id)
);
```

---

## 4. A/B TESTING ROADMAP

### Test 1: Onboarding Length (Week 1)
```
Hypothesis: Shorter tutorial = higher completion + higher retention

Groups:
- Control: 60s tutorial (current)
- Fast: 20s tutorial (skip some steps)
- Long: 90s tutorial (more explanation)

Measure:
- Tutorial completion rate (target: 85%+ for winner)
- D1 retention (target: 30%+)
- Time spent in tutorial (target: <30s for Fast)

Sample size: 100 users per group (3 weeks to get results)
Minimum win: 5% difference in D1 retention
```

### Test 2: First Purchase Offer Timing (Week 2)
```
Hypothesis: Offering at level 2 = higher conversion than level 1

Groups:
- Control: Show at level 1 (5 min)
- Delayed: Show at level 3 (15 min)
- Delayed Plus: Show at level 5 (45 min)

Measure:
- First purchase conversion (target: 5%+)
- Time to first purchase (target: <10 min)
- Purchase price (target: $1+)

Sample size: 200 users per group
Minimum win: 2% difference in conversion
```

### Test 3: Energy Cap Messaging (Week 3)
```
Hypothesis: Better messaging = fewer drops + more energy pack purchases

Groups:
- Control: Silent (just can't tap)
- Message: "Buy energy to keep earning!"
- CTA: Buy button appears (1-click purchase)

Measure:
- Energy pack purchase rate (target: 10%+)
- Session length (target: +2 min)
- Churn at cap (sessions stopped early: target -50%)

Sample size: 300 users per group
Minimum win: 3% in energy pack purchase rate
```

### Test 4: Building Recommendation (Week 4)
```
Hypothesis: Highlighting "recommended" building = higher upgrade rate

Groups:
- Control: All buildings equal (current)
- Recommended: Highlight best income building
- Suggested: Show "Most popular: Wind Farm" (social proof)

Measure:
- Average upgrades per session (target: +20%)
- Progression speed (level reached per hour)
- Session length

Sample size: 400 users per group
Minimum win: 3 more upgrades per session
```

---

## 5. METRICS THAT ACTUALLY MATTER

### Proxy Metrics (Easy to measure, indicate health):
- Session length
- Taps per session
- Buildings purchased per session
- Level reached in first hour

### True North Metrics (What we care about):
- D1 Retention
- D30 Retention
- LTV (revenue per user lifetime)
- Viral coefficient (friends invited)

### Vanity Metrics (Don't rely on):
- Total users (could be fake/bots)
- Emails collected (don't play)
- Page views (without engagement)

---

## 6. FORECAST MODELS

### Cohort-Based Forecast:

```
Week 1 Launch: 100 beta users
├─ D1 retention: 30% = 30 active users
├─ D7 retention: 15% = 15 active users
└─ Monetization: 5% * 100 = 5 users * $1 = $5 revenue

Month 1: 1000 users (organic + word of mouth)
├─ D1: 300 active
├─ D7: 150 active
├─ D30: 50 active
├─ Revenue: 1000 * 5% conversion * $1 = $50

Month 2: 5000 users (50% growth + referral)
├─ D1: 1500 active
├─ D30: 250 active
├─ Revenue: 5000 * 5% * $1 + 250 * $5 battle_pass = $1,500

Month 3: 15000 users (3x growth)
├─ Revenue: 15000 * 5% * $1 + 750 * $5 = $4,500
```

**Key assumptions to validate:**
- D1 retention = 30% (need to test)
- Conversion = 5% (need to test)
- MoM growth = 50% (depends on viral + marketing)

---

## 7. CRITICAL QUESTIONS TO ANSWER (First 2 weeks)

1. **What drives D1 retention?**
   - Is it first level up? (magic moment)
   - Is it cosmetics? (sunk cost)
   - Is it leaderboard? (competition)

2. **When do users decide to buy?**
   - First 1 hour? (hot + engaged)
   - After level 5? (realized potential)
   - After energy cap? (frustrated)

3. **What causes churn at day 7?**
   - Energy cap? (progress blocked)
   - Slow progression? (boring)
   - No friends? (lonely)

**How to answer:** Daily user interviews (5 users/day) + data analytics.

---

## RECOMMENDATIONS

### Week 1 (Before launch):
- [ ] Implement event tracking for all critical flows
- [ ] Set up dashboards for:
  - Live user count
  - Session metrics
  - Purchase events
  - Error rates
- [ ] Train team on metrics interpretation

### Week 2-4 (Post-launch):
- [ ] Daily monitoring of D1 retention
- [ ] Weekly cohort analysis
- [ ] Start A/B test #1 (onboarding length)
- [ ] User interviews (5 users, understand churn)

### Month 1:
- [ ] Analyze Test #1 results
- [ ] Plan Test #2 based on learnings
- [ ] Identify unexpected patterns in data
- [ ] Forecast Month 2 users/revenue

### Month 2+:
- [ ] Continuous A/B testing
- [ ] Predictive modeling (LTV prediction)
- [ ] Automated alerts (D1 drop < 25% → investigate)

---

## CONCLUSION

**Current State:** 4/10 - Events being logged but no real analysis

**Biggest Gap:** Funnel tracking (where are users dropping?)

**Quick Win:** Daily D1 retention dashboard (impact: clarify retention status)

**Critical Action:** Implement Event taxonomy (which events to track) before launch

**Next Step:** Define events schema, build dashboards, launch with telemetry.
