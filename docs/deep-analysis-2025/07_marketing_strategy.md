# Маркетинговая стратегия Energy Planet

**Дата:** Ноябрь 2025
**Фокус:** User Acquisition & Retention для Telegram Mini Apps

---

## 🎯 Growth Objectives

### Phase 1: Soft Launch (Week 1-2)
**Target:** 500-1,000 users
**Focus:** Product validation, early feedback
**Budget:** $0-100 (organic)

### Phase 2: Scaling (Month 1-2)
**Target:** 5,000-10,000 DAU
**Focus:** Paid acquisition, viral mechanics
**Budget:** $1,000-2,000/month

### Phase 3: Mass Market (Month 3+)
**Target:** 50,000+ DAU
**Focus:** Multi-channel, influencer partnerships
**Budget:** $5,000-10,000/month

---

## 📢 Acquisition Channels

### 1. Telegram Organic (Free)

**Communities & Channels:**
```
Target channels:
• Gaming: @telegram_games, @mobilegaming
• Crypto/Tap games: @crypto_clickers, @tap2earn
• Tech: @telegram_tips, @webapps

Approach:
1. Join 20-30 relevant channels
2. Engage genuinely for 1-2 weeks
3. Post announcement with gameplay GIF
4. Offer exclusive cosmetics for early adopters
```

**Launch Post Template:**
```
🚀 Energy Planet - Build Your Energy Empire!

⚡ Tap to generate energy
🏗️ Build solar panels & reactors
🏆 Compete on global leaderboard
🎁 Earn exclusive rewards

🎮 Play now: t.me/energyplanet_bot

Early players get FREE Epic Frame! 🎁
Join 1,000+ players already building! 🌍

#TelegramGame #IdleGame #TapToEarn
```

---

### 2. Referral Program (Viral Growth)

**Mechanics:**
```typescript
// 2-tier referral system
interface ReferralReward {
  inviter: {
    immediate: 1000, // Energy при регистрации друга
    passive: 0.1,    // 10% от энергии друга (lifetime)
  },
  invited: {
    bonus: 2000, // Starter boost для нового игрока
  }
}
```

**Viral Loop:**
```
User A invites User B
→ A gets 1,000 E + 10% of B's energy forever
→ B gets 2,000 E starter bonus
→ B invites C, D, E...
→ Compound effect
```

**Viral Coefficient Target:** > 0.5
- Каждый user приводит 0.5+ новых users
- При retention 40%+ = sustained growth

**Referral UI:**
```tsx
function ReferralCard() {
  const referralLink = `https://t.me/energyplanet_bot?start=ref_${userId}`;

  return (
    <Card>
      <h3>Invite Friends</h3>
      <p>Get 1,000 E per friend + 10% of their earnings!</p>

      <div className="referral-stats">
        <StatCard label="Friends" value={referralCount} />
        <StatCard label="Bonus Earned" value={referralBonus} />
      </div>

      <Button onClick={() => {
        Telegram.WebApp.openTelegramLink(`https://t.me/share/url?url=${referralLink}&text=Join me in Energy Planet!`);
      }}>
        Share Link
      </Button>

      <input readOnly value={referralLink} />
    </Card>
  );
}
```

---

### 3. Telegram Ads ($1,000-2,000/month)

**Campaign Structure:**
```
Campaign: Energy Planet - CPI
• Budget: $50/day
• Objective: Installs
• Targeting:
  - Age: 18-45
  - Interests: Gaming, Crypto, Tech
  - Geo: US, EU, Asia
• Creative: 15s gameplay video

KPIs:
• CPI target: $0.10-0.30
• Conversion to active: 40%+
• D1 Retention: 40%+
• ROAS: > 1.5x
```

**Ad Creative Best Practices:**
```
✅ Show gameplay (tapping planet)
✅ Display energy counter going up
✅ Highlight social features (leaderboard)
✅ Clear CTA: "Play Now"

❌ Static images (low CTR)
❌ Text-heavy
❌ No clear benefit
```

---

### 4. TikTok/YouTube Shorts ($500-1,000/month)

**Content Strategy:**
```
Format: 15-60s short videos

Content types:
1. Gameplay montage (satisfying taps)
2. "How I made 1M energy in 1 day"
3. Strategy guides ("Best buildings")
4. Leaderboard flexing
5. Cosmetics showcase

Frequency: 3-5 videos/week
```

**Influencer Partnerships:**
```
Tier 1: Nano-influencers (1K-10K)
• Cost: Free (product placement)
• Reward: Exclusive cosmetics

Tier 2: Micro-influencers (10K-100K)
• Cost: $50-200/video
• Reward: Custom named building

Tier 3: Macro-influencers (100K-1M)
• Cost: $500-2,000/video
• Launch after product-market fit
```

---

### 5. Cross-Promotion (Free-Low Cost)

**Partner with other TMA games:**
```
Deal structure:
• We promote Game B to our users
• Game B promotes Energy Planet to their users
• Track conversions via unique links
• Win-win growth

Target partners:
• Similar audience (clicker/idle games)
• Non-competing (different theme)
• Similar size (fair exchange)
```

---

## 🔁 Retention Strategy

### D1 Retention Target: 50%+

**Tactics:**

**1. FTUE (First Time User Experience)**
```
Goal: Get user to Level 2 in < 5 minutes

Steps:
1. Skip intro (no long tutorial)
2. Force first 5 taps → instant gratification
3. Guide to first building purchase (gifted)
4. Show passive income working
5. Level up to Level 2 → confetti
6. Unlock features gradually
```

**2. Push Notifications (via Telegram)**
```typescript
const notifications = [
  {
    trigger: 'offline_4h',
    message: '⚡ Your buildings generated 5,000 Energy! Collect now.',
    cta: 'Collect'
  },
  {
    trigger: 'daily_reward_ready',
    message: '🎁 Daily reward ready! Don't miss it.',
    cta: 'Claim'
  },
  {
    trigger: 'friend_passed_you',
    message: '🏆 @username just passed you on the leaderboard!',
    cta: 'Compete'
  },
  {
    trigger: 'new_building_unlocked',
    message: '🏗️ New building unlocked at Level 10!',
    cta: 'Build'
  }
];
```

**3. Daily Rewards (Login Incentive)**
```
Day 1: 1,000 E
Day 2: 2,000 E
Day 3: 5,000 E + 1h Boost
Day 7: Rare Cosmetic
Day 14: Epic Cosmetic
Day 30: Exclusive Frame

Miss a day → Reset to Day 1 (FOMO)
```

---

### D7 Retention Target: 30%+

**Tactics:**

**1. Weekly Events**
```
Week 1: "Energy Rush"
• 2x energy from all sources
• Limited-time leaderboard
• Top 10 get exclusive cosmetic

Week 2: "Building Bonanza"
• 50% off all buildings
• Double upgrade effectiveness

Rotation: New event every week
```

**2. Social Features**
```
• Global leaderboard (always visible)
• Friends leaderboard (coming soon)
• Profile inspection (see others' builds)
• Clans/guilds (post-MVP)
```

**3. Content Updates**
```
Every 2 weeks:
• 2-3 new cosmetics
• 1 new building (high tier)
• Balance adjustments
• Bug fixes

Communicate via Telegram channel
```

---

### D30 Retention Target: 20%+

**Tactics:**

**1. Long-term Goals**
```
• Prestige system (reset for bonuses)
• Seasonal content (limited cosmetics)
• PvP/Arena (competitive)
• Clan wars (team competition)
```

**2. VIP Program**
```
Tier 1: Spent 100 Stars
• Exclusive badge
• 5% energy bonus

Tier 2: Spent 500 Stars
• VIP frame
• 10% energy bonus
• Early access to new content

Tier 3: Spent 1,000+ Stars
• Ultra rare cosmetic
• 20% energy bonus
• Name in credits
```

---

## 📊 Analytics & Attribution

### Key Metrics Dashboard

```typescript
interface MetricsDashboard {
  // Acquisition
  installs_today: number;
  installs_source: { [key: string]: number }; // organic, paid, referral

  // Activation
  ftue_completion_rate: number; // % who finish tutorial
  time_to_first_purchase: number; // median time

  // Retention
  d1_retention: number;
  d7_retention: number;
  d30_retention: number;

  // Revenue
  arpdau: number;
  arppu: number;
  paying_users_percent: number;

  // Engagement
  avg_session_length: number;
  avg_sessions_per_day: number;
  dau_mau_ratio: number; // Stickiness
}
```

### Attribution Tracking

```typescript
// Track install source
const startParam = Telegram.WebApp.initDataUnsafe.start_param;

// Examples:
// t.me/bot?start=ref_12345 → referral from user 12345
// t.me/bot?start=tiktok_campaign1 → TikTok campaign
// t.me/bot?start=tgads_gaming → Telegram Ads gaming audience

await analytics.track('install', {
  source: parseSource(startParam),
  timestamp: Date.now()
});
```

---

## 🎁 Launch Strategy

### Pre-Launch (Week -2 to -1)

```
□ Create Telegram channel (@energyplanet_news)
□ Tease with gameplay GIFs
□ Announce launch date
□ Early access signup (limited slots)
□ Build hype: "Only 500 spots!"
```

### Launch Day

```
9:00 AM: Open to early access users (500)
12:00 PM: Public announcement in channels
3:00 PM: Post on Reddit (r/incremental_games, r/telegram)
6:00 PM: TikTok/YouTube videos drop
9:00 PM: Analyze first metrics, iterate

Goal: 500+ users D1
```

### Post-Launch (Week 1)

```
Day 1-2: Fix critical bugs, monitor metrics
Day 3-4: Iterate on FTUE based on drop-off
Day 5-7: Scale working channels (if metrics good)

Decision point: If D1 > 40%, proceed to paid ads
```

---

## 💰 Budget Allocation (Month 1)

```
Total: $1,500

Telegram Ads: $600 (40%)
TikTok/YouTube: $450 (30%)
Influencers: $300 (20%)
Creative assets: $150 (10%)

Expected result:
• 5,000 installs
• CPI: $0.30
• 40% activation → 2,000 DAU
• 5% conversion → $3,000 revenue
• ROAS: 2x
```

---

## 🎯 Success Criteria

### Week 1:
- ✅ 500+ installs
- ✅ D1 Retention > 40%
- ✅ < 1% crash rate
- ✅ 10+ purchases

### Month 1:
- ✅ 5,000+ DAU
- ✅ D7 Retention > 25%
- ✅ ARPDAU > $0.10
- ✅ Viral coefficient > 0.3

### Month 3:
- ✅ 25,000+ DAU
- ✅ D30 Retention > 15%
- ✅ ARPDAU > $0.15
- ✅ Viral coefficient > 0.5

---

**Следующий:** [Roadmap & Priorities](./08_roadmap_priorities.md)
