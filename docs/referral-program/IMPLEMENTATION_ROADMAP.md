# Roadmap: Улучшение реферальной программы

**Проект:** Energy Planet Referral System 2.0
**Команда:** Backend (2), Frontend (1), QA (1)
**Timeline:** 3 месяца
**Приоритет:** High

---

## Executive Summary

**Текущее состояние:** 6.5/10
**Целевое состояние:** 8.5/10
**Ожидаемый impact:**
- Viral coefficient: 0.3-0.5 → 0.8-1.2 (+160%)
- Fraud rate: 30-40% → 5-8% (-75%)
- Referral retention D7: 20-30% → 40-55% (+80%)
- Cost per acquisition: Unknown → <$0.50

**Инвестиции:**
- Development: ~12 недель (3 человека)
- Infrastructure: Минимальные (используем существующий стек)
- External services: ~$200/месяц (fraud detection APIs)

**ROI:**
- Снижение fraud losses: $2000-5000/месяц
- Organic growth: +40-60% новых пользователей
- Improved retention: +$3-5 LTV на реферала
- Payback period: <2 месяца

---

## Sprint Plan Overview

```
Sprint 1 (Week 1-2): 🔴 Fraud Prevention Foundation
  Priority: CRITICAL
  Risk: HIGH if delayed
  Dependencies: None

Sprint 2 (Week 3-4): 🟠 Basic Analytics & Tracking
  Priority: HIGH
  Risk: MEDIUM
  Dependencies: Sprint 1 (for fraud metrics)

Sprint 3 (Week 5-6): 🟠 UX Improvements & Smart Timing
  Priority: HIGH
  Risk: LOW
  Dependencies: Sprint 2 (for tracking)

Sprint 4 (Week 7-8): 🟡 Gamification Layer
  Priority: MEDIUM
  Risk: LOW
  Dependencies: Sprint 2 (for leaderboard data)

Sprint 5 (Week 9-10): 🟡 Gameplay Integration
  Priority: MEDIUM
  Risk: MEDIUM (requires game mechanics changes)
  Dependencies: Sprint 4

Sprint 6 (Week 11-12): 🟢 Advanced Features & Polish
  Priority: LOW
  Risk: LOW
  Dependencies: All previous sprints
```

---

## Sprint 1: Fraud Prevention Foundation (Week 1-2)

### Цель
Снизить fraud rate с 30-40% до <15% через базовые техники детекции

### Задачи

#### Backend (8 дней)

##### 1.1 Fraud Detection Service
**Файл:** `backend/src/services/FraudDetectionService.ts`
**Оценка:** 3 дня

```typescript
interface FraudCheck {
  ipAddress: string
  deviceFingerprint?: string
  telegramId: bigint
  accountAge: number
}

interface FraudResult {
  allowed: boolean
  fraudScore: number  // 0-1
  flags: string[]
  reason?: string
}

class FraudDetectionService {
  // IP-based checks
  async checkIPMatch(referrerId: string, referredId: string): Promise<boolean>
  async checkIPVelocity(ip: string, window: string): Promise<boolean>

  // Email pattern detection
  async checkEmailPattern(email: string): Promise<boolean>
  async findSimilarEmails(email: string, period: string): Promise<string[]>

  // Comprehensive check
  async validateActivation(check: FraudCheck): Promise<FraudResult>
}
```

**Tests:**
```typescript
// backend/src/services/__tests__/FraudDetectionService.spec.ts
describe('FraudDetectionService', () => {
  it('detects same IP self-referral')
  it('detects email alias patterns')
  it('detects velocity abuse')
  it('calculates fraud score correctly')
  it('allows legitimate activations')
})
```

##### 1.2 IP Tracking Infrastructure
**Migration:** `backend/migrations/016_ip_tracking.sql`
**Оценка:** 1 день

```sql
CREATE TABLE user_ip_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  ip_address INET NOT NULL,
  user_agent TEXT,
  action VARCHAR(50), -- 'registration', 'activation', 'login'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_ip_history_user_id ON user_ip_history(user_id);
CREATE INDEX idx_user_ip_history_ip ON user_ip_history(ip_address);
CREATE INDEX idx_user_ip_history_created ON user_ip_history(created_at DESC);

-- Velocity tracking (Redis-backed)
-- Uses existing Redis for rate limiting
```

##### 1.3 Delayed Rewards System
**Migration:** `backend/migrations/017_pending_rewards.sql`
**Оценка:** 2 дня

```sql
CREATE TABLE referral_pending_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  referral_relation_id UUID REFERENCES referral_relations(id),

  reward_type VARCHAR(50) NOT NULL, -- 'activation_invitee', 'activation_referrer', 'milestone'
  reward_payload JSONB NOT NULL,

  -- Fraud analysis
  fraud_score DECIMAL(3,2),
  fraud_flags JSONB,
  automated_decision VARCHAR(20), -- 'pending', 'approved', 'rejected'

  -- Timing
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  review_after TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours',
  processed_at TIMESTAMP WITH TIME ZONE,

  -- Manual review (if needed)
  reviewed_by UUID REFERENCES users(id),
  review_notes TEXT
);

CREATE INDEX idx_pending_rewards_review ON referral_pending_rewards(review_after)
  WHERE processed_at IS NULL;
CREATE INDEX idx_pending_rewards_user ON referral_pending_rewards(user_id);
```

**Service:**
```typescript
// backend/src/services/PendingRewardService.ts
class PendingRewardService {
  async createPendingReward(userId: string, rewardType: string, payload: any)
  async processPendingRewards(): Promise<ProcessingReport>
  async approvePendingReward(rewardId: string)
  async rejectPendingReward(rewardId: string, reason: string)
}

// Cron job
schedule.scheduleJob('*/30 * * * *', async () => {
  await pendingRewardService.processPendingRewards()
})
```

##### 1.4 Update ReferralService
**Файл:** `backend/src/services/ReferralService.ts`
**Оценка:** 2 дня

```typescript
// Изменения в методе activateReferralCode
async activateReferralCode(
  userId: string,
  code: string,
  context: { ip: string, userAgent: string }
): Promise<ActivationResult> {

  // 1. Existing validations
  // ...

  // 2. NEW: Fraud checks
  const fraudCheck = await this.fraudDetectionService.validateActivation({
    referrerId,
    referredId: userId,
    ipAddress: context.ip,
    telegramId: user.telegram_id,
    accountAge: getAccountAge(user.created_at)
  })

  if (!fraudCheck.allowed) {
    await this.logFraudAttempt(userId, code, fraudCheck)
    throw new FraudError(fraudCheck.reason)
  }

  // 3. Create relation
  const relation = await this.createRelation(referrerId, userId, code)

  // 4. NEW: Create pending rewards instead of immediate grants
  await this.pendingRewardService.createPendingReward(userId, 'activation_invitee', {
    stars: config.rewards.invitee.stars,
    cosmetic: config.rewards.invitee.cosmetic,
    fraudScore: fraudCheck.fraudScore
  })

  await this.pendingRewardService.createPendingReward(referrerId, 'activation_referrer', {
    stars: config.rewards.referrer.stars,
    fraudScore: fraudCheck.fraudScore
  })

  // 5. Log IP
  await this.logIPAddress(userId, context.ip, 'activation')

  return {
    status: 'pending_review',
    relation,
    estimatedReviewTime: '24h'
  }
}
```

#### Frontend (2 дня)

##### 1.5 Pending Rewards UI
**Файл:** `webapp/src/components/referral/PendingRewardsNotice.tsx`
**Оценка:** 1 день

```typescript
export function PendingRewardsNotice() {
  const { pendingRewards } = useReferralStore()

  if (!pendingRewards || pendingRewards.length === 0) return null

  return (
    <Card className="pending-rewards">
      <Icon name="clock" />
      <div>
        <h4>Rewards Pending Review</h4>
        <p>
          Your referral rewards are being verified.
          This usually takes up to 24 hours.
        </p>
        <ul>
          {pendingRewards.map(reward => (
            <li key={reward.id}>
              {reward.amount}⭐ - Review at {formatTime(reward.reviewAfter)}
            </li>
          ))}
        </ul>
      </div>
    </Card>
  )
}
```

##### 1.6 Store Updates
**Файл:** `webapp/src/store/referralStore.ts`
**Оценка:** 0.5 дня

```typescript
interface ReferralStore {
  // ...existing
  pendingRewards: PendingReward[]

  fetchPendingRewards: () => Promise<void>
}
```

##### 1.7 Email Notification Template
**Файл:** `backend/src/templates/emails/reward-approved.html`
**Оценка:** 0.5 дня

```html
Subject: Your {{amount}}⭐ referral reward is ready!

Great news! Your referral reward has been approved.

Reward: {{amount}} Stars
Type: {{rewardType}}
Added to your account: {{approvedAt}}

Keep inviting friends to earn more rewards!

[View My Referrals]
```

#### QA (2 дня)

- [ ] Test fraud detection with various scenarios
- [ ] Test delayed rewards workflow
- [ ] Test edge cases (concurrent activations, etc)
- [ ] Performance test (1000 pending rewards)

### Acceptance Criteria

- [ ] Fraud detection service operational
- [ ] IP tracking captures all activations
- [ ] Rewards delayed by 24h minimum
- [ ] Pending rewards UI shows status
- [ ] Email notifications sent on approval/rejection
- [ ] Tests pass with >90% coverage
- [ ] Fraud rate reduced to <15% (measure after 1 week)

### Rollout Plan

**Week 1:**
- Deploy to staging
- Internal testing with fake accounts
- Fraud detection tuning (adjust thresholds)

**Week 2:**
- Deploy to production with feature flag
- Enable for 10% of users
- Monitor metrics daily
- Adjust fraud score thresholds
- Scale to 100% if metrics good

### Success Metrics

```
Measure after 7 days:
- Fraud rate: <15% (from ~35%)
- False positive rate: <5%
- Average review time: <12 hours
- User complaints: <1% of activations
- Legitimate activations approved: >95%
```

---

## Sprint 2: Analytics & Tracking (Week 3-4)

### Цель
Visibility into referral funnel and user behavior

### Задачи

#### Backend (5 дней)

##### 2.1 Analytics Events Table
**Migration:** `backend/migrations/018_analytics_events.sql`
**Оценка:** 1 день

```sql
CREATE TABLE referral_analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),

  event_type VARCHAR(50) NOT NULL,
  -- 'code_viewed', 'share_clicked', 'share_completed', 'code_copied', etc.

  -- Context
  screen VARCHAR(50),             -- where it happened
  trigger VARCHAR(50),            -- what triggered it
  share_method VARCHAR(50),       -- telegram, whatsapp, copy, etc.

  -- Metadata
  metadata JSONB,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_analytics_events_user ON referral_analytics_events(user_id);
CREATE INDEX idx_analytics_events_type ON referral_analytics_events(event_type);
CREATE INDEX idx_analytics_events_created ON referral_analytics_events(created_at DESC);
```

##### 2.2 Analytics Service
**Файл:** `backend/src/services/ReferralAnalyticsService.ts`
**Оценка:** 2 дня

```typescript
interface FunnelMetrics {
  codeGenerated: number
  codeViewed: number
  shareClicked: number
  shareCompleted: number
  linkOpened: number
  codeActivated: number

  conversionRates: {
    viewToShare: number
    shareToComplete: number
    completeToActivate: number
    overall: number
  }
}

interface ViralMetrics {
  viralCoefficient: number  // K-factor
  averageInvitesPerUser: number
  inviteConversionRate: number
}

class ReferralAnalyticsService {
  // Funnel analysis
  async getFunnelMetrics(period: string): Promise<FunnelMetrics>

  // Viral coefficient
  async calculateViralCoefficient(period: string): Promise<number>

  // Cohort analysis
  async getCohortRetention(cohort: string): Promise<RetentionData>

  // Quality comparison
  async compareReferralVsOrganic(): Promise<ComparisonData>

  // Top referrers insights
  async getTopReferrerInsights(limit: number): Promise<ReferrerInsight[]>
}
```

##### 2.3 Analytics API Endpoints
**Файл:** `backend/src/api/controllers/AnalyticsController.ts`
**Оценка:** 1 день

```typescript
// Admin-only endpoints
GET  /api/admin/analytics/referral/funnel?period=7d
GET  /api/admin/analytics/referral/viral-coefficient?period=30d
GET  /api/admin/analytics/referral/cohorts
GET  /api/admin/analytics/referral/quality-comparison
GET  /api/admin/analytics/referral/top-insights

// Public tracking endpoint
POST /api/analytics/referral-event
Body: { eventType: string, metadata?: any }
```

##### 2.4 Update Existing Services
**Файлы:** Various
**Оценка:** 1 день

```typescript
// Track events throughout the codebase:

// When code generated:
await analyticsService.track(userId, 'code_generated', {})

// When relation activated:
await analyticsService.track(referredId, 'code_activated', {
  referrerId,
  code
})

// In PurchaseService (revenue share):
await analyticsService.track(referrerId, 'revenue_share_earned', {
  amount,
  referredId
})
```

#### Frontend (3 дня)

##### 2.5 Analytics Tracking Integration
**Файл:** `webapp/src/services/analytics.ts`
**Оценка:** 1 день

```typescript
export const trackReferralEvent = async (
  eventType: ReferralEventType,
  metadata?: Record<string, any>
) => {
  try {
    await fetch('/api/analytics/referral-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType, metadata })
    })
  } catch (error) {
    // Silent fail, don't block UX
    console.warn('Analytics tracking failed:', error)
  }
}

// Usage throughout app:
// In ReferralInviteCard.tsx:
useEffect(() => {
  trackReferralEvent('code_viewed', { screen: 'settings' })
}, [])

const handleShare = () => {
  trackReferralEvent('share_clicked', { method: 'telegram' })
  // ... existing share logic
}
```

##### 2.6 Admin Dashboard (Basic)
**Файл:** `webapp/src/screens/admin/ReferralAnalyticsDashboard.tsx`
**Оценка:** 2 дня

```typescript
export function ReferralAnalyticsDashboard() {
  const [period, setPeriod] = useState('7d')
  const { funnel, viralCoefficient, topInsights } = useReferralAnalytics(period)

  return (
    <Dashboard>
      <MetricCard
        title="Viral Coefficient"
        value={viralCoefficient.toFixed(2)}
        target="0.8-1.2"
        status={viralCoefficient >= 0.8 ? 'good' : 'warning'}
      />

      <FunnelChart data={funnel} />

      <TopReferrersTable data={topInsights} limit={10} />

      <QualityComparisonChart />
    </Dashboard>
  )
}
```

#### QA (2 дня)

- [ ] Test all tracking events fire correctly
- [ ] Verify analytics calculations
- [ ] Test dashboard visualization
- [ ] Performance test with high event volume

### Acceptance Criteria

- [ ] All key events tracked
- [ ] Funnel metrics calculated correctly
- [ ] Viral coefficient calculated
- [ ] Admin dashboard deployed
- [ ] Data retention policy defined (6 months)
- [ ] Performance: <10ms per track call

### Success Metrics

```
After 7 days:
- Events captured: >10,000/day
- Data quality: >98% valid events
- Dashboard load time: <2s
- Insights actionable: Team identifies 3+ optimization opportunities
```

---

## Sprint 3: UX Improvements & Smart Timing (Week 5-6)

### Цель
Increase conversion rate через better timing и placement

### Задачи

#### Backend (2 дня)

##### 3.1 Event Trigger System
**Файл:** `backend/src/services/EventTriggerService.ts`
**Оценка:** 2 дня

```typescript
enum ReferralTriggerEvent {
  PVP_WIN = 'pvp_win',
  ACHIEVEMENT_UNLOCK = 'achievement_unlock',
  LEVEL_UP = 'level_up',
  RARE_ITEM_DROP = 'rare_item_drop',
  TUTORIAL_COMPLETE = 'tutorial_complete'
}

interface TriggerEligibility {
  eligible: boolean
  reason?: string
  cooldownRemaining?: number
}

class EventTriggerService {
  async checkEligibility(
    userId: string,
    trigger: ReferralTriggerEvent
  ): Promise<TriggerEligibility>

  async recordPromptShown(userId: string, trigger: string): Promise<void>
  async recordPromptDismissed(userId: string, trigger: string): Promise<void>
}
```

**Rules:**
```typescript
const TRIGGER_RULES = {
  cooldown: 24 * 60 * 60 * 1000,  // 24h between prompts
  maxDismissals: 3,                // Give up after 3 dismissals
  minAccountAge: 7 * 24 * 60 * 60 * 1000  // 7 days minimum
}
```

#### Frontend (6 дней)

##### 3.2 Referral Prompt Component
**Файл:** `webapp/src/components/referral/ReferralPrompt.tsx`
**Оценка:** 2 дня

```typescript
interface ReferralPromptProps {
  trigger: ReferralTriggerEvent
  context?: any
  onShare?: () => void
  onDismiss?: () => void
}

export function ReferralPrompt({ trigger, context }: ReferralPromptProps) {
  const message = getContextualMessage(trigger, context)
  const { code } = useReferralStore()

  return (
    <Modal variant="celebration">
      <Animation type={getAnimationType(trigger)} />

      <h2>{message.title}</h2>
      <p>{message.body}</p>

      <RewardPreview rewards={REFERRAL_REWARDS} />

      <ShareButtons
        code={code}
        prefilledMessage={message.shareText}
        onShare={() => {
          trackReferralEvent('share_clicked', { trigger })
        }}
      />

      <Button variant="text" onClick={handleDismiss}>
        Maybe later
      </Button>
    </Modal>
  )
}

function getContextualMessage(trigger, context) {
  switch(trigger) {
    case 'pvp_win':
      return {
        title: "Awesome Victory! 🎉",
        body: "Invite friends to challenge them and earn 350⭐ per friend!",
        shareText: `Just won in Energy Planet! Join me with code ${code} for 300⭐ bonus!`
      }

    case 'achievement_unlock':
      return {
        title: `Achievement Unlocked: ${context.achievementName}! 🏆`,
        body: "Share your success and invite friends to earn even more!",
        shareText: `Unlocked "${context.achievementName}" in Energy Planet! Use my code ${code} to get started with 300⭐!`
      }

    // ... other triggers
  }
}
```

##### 3.3 Integration with Game Events
**Файлы:** Various game event handlers
**Оценка:** 2 дня

```typescript
// In PvP victory handler:
if (playerWon) {
  // Show victory screen
  await showVictoryAnimation()

  // Check if eligible for referral prompt
  const eligible = await eventTriggerService.checkEligibility(
    userId,
    ReferralTriggerEvent.PVP_WIN
  )

  if (eligible) {
    await showReferralPrompt({
      trigger: ReferralTriggerEvent.PVP_WIN,
      context: { opponent: opponentName }
    })
  }
}

// Similar integration for:
// - Achievement unlock
// - Level up
// - Rare item drop
// - Tutorial completion
```

##### 3.4 Improved Milestone Structure
**Файл:** `backend/content/referrals.json`
**Оценка:** 0.5 дня

```json
{
  "milestones": [
    {
      "id": "first_crew",
      "threshold": 1,
      "rewards": {
        "stars": 300,
        "cosmetic": { "type": "badge", "id": "badge_first_recruit" }
      }
    },
    {
      "id": "growing_squad",
      "threshold": 3,
      "rewards": {
        "stars": 800,
        "cosmetic": { "type": "frame", "id": "frame_recruiter" }
      }
    },
    {
      "id": "expedition_launch",
      "threshold": 7,
      "rewards": {
        "stars": 2000,
        "cosmetic": { "type": "badge", "id": "badge_squad_leader" }
      }
    },
    {
      "id": "galactic_club",
      "threshold": 15,
      "rewards": {
        "stars": 5000,
        "cosmetic": { "type": "aura", "id": "aura_galactic_trail" }
      }
    },
    {
      "id": "legend_circle",
      "threshold": 30,
      "rewards": {
        "stars": 12000,
        "cosmetic": { "type": "badge", "id": "badge_referral_champion" }
      }
    },
    {
      "id": "cosmic_influencer",
      "threshold": 50,
      "rewards": {
        "stars": 25000,
        "cosmetic": { "type": "title", "id": "title_supreme_recruiter" }
      }
    }
  ]
}
```

##### 3.5 Progress Visualization
**Файл:** `webapp/src/components/referral/MilestoneProgress.tsx`
**Оценка:** 1.5 дня

```typescript
export function MilestoneProgress() {
  const { referralCount, milestones, nextMilestone } = useReferralStore()

  return (
    <div className="milestone-progress">
      <h3>Your Progress</h3>

      <ProgressBar
        current={referralCount}
        target={nextMilestone.threshold}
        color="gradient"
      />

      <p>
        {nextMilestone.threshold - referralCount} more friends to unlock{' '}
        <strong>{nextMilestone.rewards.stars}⭐</strong>!
      </p>

      <MilestoneMap milestones={milestones} current={referralCount} />
    </div>
  )
}

function MilestoneMap({ milestones, current }) {
  return (
    <div className="milestone-map">
      {milestones.map((milestone, index) => (
        <MilestoneNode
          key={milestone.id}
          milestone={milestone}
          status={getStatus(milestone.threshold, current)}
          isLast={index === milestones.length - 1}
        />
      ))}
    </div>
  )
}
```

#### QA (2 дня)

- [ ] Test all trigger conditions
- [ ] Test cooldown logic
- [ ] Test prompt dismissal
- [ ] Visual QA for prompt component
- [ ] A/B test setup (variant with/without prompts)

### Acceptance Criteria

- [ ] Prompts show after configured events
- [ ] Cooldown prevents spam
- [ ] Messages are contextual
- [ ] Progress visualization accurate
- [ ] New milestone structure deployed
- [ ] Conversion rate improved (measure via A/B)

### Success Metrics

```
After 14 days:
- Prompt shown rate: >20% of eligible events
- Prompt → share rate: >15%
- Overall conversion: +30-50% vs baseline
- User feedback: <2% negative mentions
```

---

## Sprint 4: Gamification Layer (Week 7-8)

### Цель
Add competitive elements to drive engagement

### Задачи

#### Backend (4 дня)

##### 4.1 Leaderboard Service
**Файл:** `backend/src/services/LeaderboardService.ts`
**Оценка:** 2 дня

```typescript
interface LeaderboardEntry {
  rank: number
  userId: string
  username: string
  avatar?: string
  referralCount: number
  badge?: string
  rewards: {
    thisWeek: number
    thisMonth: number
    allTime: number
  }
}

class LeaderboardService {
  // Global leaderboards
  async getGlobalLeaderboard(period: 'week' | 'month' | 'alltime', limit: number): Promise<LeaderboardEntry[]>

  // User's position
  async getUserRank(userId: string, period: string): Promise<{ rank: number, nearby: LeaderboardEntry[] }>

  // Season management
  async createSeason(name: string, start: Date, end: Date): Promise<Season>
  async getActiveSeason(): Promise<Season | null>
  async endSeason(seasonId: string): Promise<void>
}
```

##### 4.2 Season System
**Migration:** `backend/migrations/019_seasons.sql`
**Оценка:** 1 день

```sql
CREATE TABLE referral_seasons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  start_at TIMESTAMP WITH TIME ZONE NOT NULL,
  end_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) DEFAULT 'upcoming', -- upcoming, active, ended
  rewards JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE referral_season_rankings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  season_id UUID NOT NULL REFERENCES referral_seasons(id),
  user_id UUID NOT NULL REFERENCES users(id),
  rank INTEGER,
  referral_count INTEGER DEFAULT 0,
  rewards_claimed BOOLEAN DEFAULT FALSE,
  UNIQUE(season_id, user_id)
);

CREATE INDEX idx_season_rankings_season ON referral_season_rankings(season_id);
CREATE INDEX idx_season_rankings_rank ON referral_season_rankings(season_id, rank);
```

##### 4.3 Badge System
**Migration:** `backend/migrations/020_referral_badges.sql`
**Оценка:** 1 день

```sql
CREATE TABLE referral_badges (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(100),
  requirement JSONB NOT NULL,  -- { type: 'referral_count', threshold: 10 }
  rarity VARCHAR(20)  -- common, rare, epic, legendary
);

CREATE TABLE user_referral_badges (
  user_id UUID NOT NULL REFERENCES users(id),
  badge_id VARCHAR(50) NOT NULL REFERENCES referral_badges(id),
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, badge_id)
);

-- Seed badges
INSERT INTO referral_badges VALUES
  ('first_referral', 'First Recruit', 'Invited your first friend', 'badge_first', '{"type":"referral_count","threshold":1}', 'common'),
  ('social_butterfly', 'Social Butterfly', 'Invited 5 friends', 'badge_butterfly', '{"type":"referral_count","threshold":5}', 'rare'),
  ('master_recruiter', 'Master Recruiter', 'Invited 30 friends', 'badge_master', '{"type":"referral_count","threshold":30}', 'epic'),
  ('legend', 'Referral Legend', 'Invited 100 friends', 'badge_legend', '{"type":"referral_count","threshold":100}', 'legendary'),
  ('season_winner', 'Season Champion', 'Rank #1 in a season', 'badge_champion', '{"type":"season_rank","rank":1}', 'legendary');
```

#### Frontend (4 дня)

##### 4.4 Leaderboard Screen
**Файл:** `webapp/src/screens/ReferralLeaderboardScreen.tsx`
**Оценка:** 2 дня

```typescript
export function ReferralLeaderboardScreen() {
  const [period, setPeriod] = useState<'week' | 'month' | 'alltime'>('month')
  const { leaderboard, userRank, loading } = useLeaderboard(period)

  return (
    <Screen>
      <Header>
        <h1>🏆 Top Recruiters</h1>
        <PeriodSelector value={period} onChange={setPeriod} />
      </Header>

      {userRank && (
        <YourRankCard rank={userRank.rank} nearby={userRank.nearby} />
      )}

      <TopThreeShowcase entries={leaderboard.slice(0, 3)} />

      <LeaderboardList entries={leaderboard.slice(3)} />

      <SeasonInfo activeSeason={activeSeason} />
    </Screen>
  )
}

function TopThreeShowcase({ entries }) {
  return (
    <div className="top-three">
      <RankCard entry={entries[1]} rank={2} medal="silver" />
      <RankCard entry={entries[0]} rank={1} medal="gold" size="large" />
      <RankCard entry={entries[2]} rank={3} medal="bronze" />
    </div>
  )
}
```

##### 4.5 Badge Display
**Файл:** `webapp/src/components/referral/BadgeCollection.tsx`
**Оценка:** 1 день

```typescript
export function BadgeCollection() {
  const { badges, earnedBadges } = useReferralBadges()

  return (
    <div className="badge-collection">
      <h3>Achievements</h3>
      <div className="badge-grid">
        {badges.map(badge => (
          <BadgeCard
            key={badge.id}
            badge={badge}
            earned={earnedBadges.includes(badge.id)}
            earnedAt={getEarnedDate(badge.id, earnedBadges)}
          />
        ))}
      </div>
    </div>
  )
}

function BadgeCard({ badge, earned, earnedAt }) {
  return (
    <div className={`badge-card ${earned ? 'earned' : 'locked'}`}>
      <BadgeIcon
        icon={badge.icon}
        rarity={badge.rarity}
        grayscale={!earned}
      />
      <h4>{badge.name}</h4>
      <p>{badge.description}</p>
      {earned && <small>Earned {formatDate(earnedAt)}</small>}
      {!earned && <ProgressToward badge={badge} />}
    </div>
  )
}
```

##### 4.6 Profile Integration
**Файл:** `webapp/src/components/profile/ProfileBadges.tsx`
**Оценка:** 1 день

```typescript
// Display badges on user profile (visible to others)
export function ProfileBadges({ userId }) {
  const { badges } = useUserBadges(userId)

  // Show top 3 rarest badges
  const topBadges = badges
    .sort(byRarity)
    .slice(0, 3)

  return (
    <div className="profile-badges">
      {topBadges.map(badge => (
        <BadgeIcon key={badge.id} icon={badge.icon} size="small" />
      ))}
    </div>
  )
}
```

#### QA (2 дня)

- [ ] Test leaderboard ranking accuracy
- [ ] Test season transitions
- [ ] Test badge awards
- [ ] Performance test (10k users leaderboard)
- [ ] Visual QA

### Acceptance Criteria

- [ ] Leaderboard displays correctly
- [ ] User rank calculation accurate
- [ ] Season system works (create, active, end)
- [ ] Badges awarded automatically
- [ ] Profile shows badges
- [ ] Performance: <1s leaderboard load

### Success Metrics

```
After 14 days:
- Leaderboard views: >30% of active referrers
- Competition effect: Top 100 increase referrals by +40%
- Badge pursuit: +25% users work toward next badge
- Retention: Referrers +15% D30 retention
```

---

## Sprint 5: Gameplay Integration (Week 9-10)

### Цель
Tie referrals to core gameplay for better retention

### Задачи

#### Backend (4 дней)

##### 5.1 Co-op Bonus System
**Migration:** `backend/migrations/021_coop_bonuses.sql`
**Оценка:** 1 день

```sql
CREATE TABLE referral_coop_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES users(id),
  referred_id UUID NOT NULL REFERENCES users(id),
  event_type VARCHAR(50) NOT NULL, -- 'coop_pvp', 'buddy_levelup', etc.

  bonus_granted BIGINT NOT NULL,
  bonus_type VARCHAR(50) NOT NULL, -- 'stars', 'energy', etc.

  event_context JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_coop_events_referrer ON referral_coop_events(referrer_id);
CREATE INDEX idx_coop_events_referred ON referral_coop_events(referred_id);
```

##### 5.2 Co-op Bonus Service
**Файл:** `backend/src/services/ReferralCoopService.ts`
**Оценка:** 2 дня

```typescript
interface CoopConfig {
  coopPvPMultiplier: number      // 1.5 = +50% rewards
  buddyLevelUpReward: number     // 100⭐ when referral levels up
  clanBonuses: {
    minReferredMembers: number
    bonusType: string
    bonusValue: number
  }
}

class ReferralCoopService {
  // Check if two players are in referral relationship
  async areReferralBuddies(userId1: string, userId2: string): Promise<boolean>

  // Apply coop bonus in PvP
  async applyCoopPvPBonus(winnerId: string, partnerId: string, baseReward: number): Promise<number>

  // Reward referrer when buddy levels up
  async handleBuddyLevelUp(userId: string, newLevel: number): Promise<void>

  // Check clan composition
  async checkClanReferralBonus(clanId: string): Promise<ClanBonus | null>
}
```

##### 5.3 Integration Points
**Файлы:** Various game services
**Оценка:** 1 день

```typescript
// In PvP reward calculation:
let reward = baseReward

// Check if playing with referral buddy
if (await coopService.areReferralBuddies(player1, player2)) {
  reward = await coopService.applyCoopPvPBonus(winnerId, partnerId, reward)
  await showCoopBonusNotification('+50% Buddy Bonus!')
}

// In LevelService:
async function handleLevelUp(userId: string, newLevel: number) {
  // Existing levelup logic
  // ...

  // NEW: Notify referrer
  await coopService.handleBuddyLevelUp(userId, newLevel)
}

// In ClanService:
async function calculateClanBonuses(clanId: string) {
  // Existing bonuses
  // ...

  // NEW: Referral bonus
  const referralBonus = await coopService.checkClanReferralBonus(clanId)
  if (referralBonus) {
    bonuses.push(referralBonus)
  }
}
```

#### Frontend (3 дня)

##### 5.4 Buddy System UI
**Файл:** `webapp/src/components/referral/ReferralBuddies.tsx`
**Оценка:** 2 дня

```typescript
export function ReferralBuddies() {
  const { referredFriends } = useReferralStore()
  const { onlineFriends } = useFriendsStore()

  const onlineBuddies = referredFriends.filter(friend =>
    onlineFriends.includes(friend.id)
  )

  return (
    <Card>
      <h3>Your Referral Buddies</h3>
      <p>Play together for +50% rewards!</p>

      {onlineBuddies.length > 0 && (
        <div className="online-buddies">
          <h4>🟢 Online Now</h4>
          {onlineBuddies.map(buddy => (
            <BuddyCard key={buddy.id} buddy={buddy}>
              <Button onClick={() => inviteToMatch(buddy.id)}>
                Invite to PvP
              </Button>
            </BuddyCard>
          ))}
        </div>
      )}

      <BuddyList buddies={referredFriends} />
    </Card>
  )
}
```

##### 5.5 Co-op Bonus Indicators
**Файл:** `webapp/src/components/pvp/CoopBonusIndicator.tsx`
**Оценка:** 1 день

```typescript
// Show during match if playing with buddy
export function CoopBonusIndicator({ partnerId }) {
  const isBuddy = useIsBuddy(partnerId)

  if (!isBuddy) return null

  return (
    <div className="coop-bonus-badge">
      🤝 Buddy Bonus Active: +50% Rewards!
    </div>
  )
}

// Show in post-match summary
export function MatchRewardSummary({ baseReward, bonuses }) {
  return (
    <div>
      <div>Base Reward: {baseReward}⭐</div>
      {bonuses.coopBonus && (
        <div className="bonus">
          🤝 Buddy Bonus: +{bonuses.coopBonus}⭐
        </div>
      )}
      <div className="total">Total: {calculateTotal(baseReward, bonuses)}⭐</div>
    </div>
  )
}
```

#### QA (3 дня)

- [ ] Test buddy detection
- [ ] Test coop bonuses in PvP
- [ ] Test levelup notifications
- [ ] Test clan bonuses
- [ ] Integration testing with game systems

### Acceptance Criteria

- [ ] Buddy system identifies referral relationships
- [ ] Coop PvP grants +50% rewards
- [ ] Referrer notified on buddy levelup
- [ ] Clan bonuses calculated correctly
- [ ] UI shows buddy status and bonuses
- [ ] No game balance breaking

### Success Metrics

```
After 14 days:
- Referral buddy matches: >15% of PvP matches
- Retention of referred users: +40% D30
- Re-engagement: +30% dormant referrals return
- Social play: +25% co-op participation
```

---

## Sprint 6: Advanced Features & Polish (Week 11-12)

### Цель
Nice-to-have features and system refinement

### Задачи

#### Backend (3 дня)

##### 6.1 Gifting System
**Migration:** `backend/migrations/022_gifts.sql`
**Оценка:** 1 день

```sql
CREATE TABLE referral_gifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES users(id),
  recipient_id UUID NOT NULL REFERENCES users(id),

  gift_type VARCHAR(50) NOT NULL, -- 'stars', 'energy', 'cosmetic'
  amount BIGINT,
  cosmetic_id VARCHAR(100),
  message TEXT,

  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  claimed_at TIMESTAMP WITH TIME ZONE,

  -- Verification
  is_referral_buddy BOOLEAN NOT NULL  -- must be true
);

CREATE INDEX idx_gifts_recipient ON referral_gifts(recipient_id, claimed_at);
```

##### 6.2 Gift Service
**Файл:** `backend/src/services/GiftService.ts`
**Оценка:** 2 дня

```typescript
interface GiftLimits {
  maxStarsPerDay: number         // 100⭐
  maxGiftsPerDay: number         // 5 gifts
  cooldownMinutes: number        // 60 min between gifts
}

class GiftService {
  async sendGift(
    senderId: string,
    recipientId: string,
    gift: Gift
  ): Promise<Gift>

  async claimGift(recipientId: string, giftId: string): Promise<void>

  async getReceivedGifts(userId: string): Promise<Gift[]>

  // Bonus: sender gets 50% back
  async applyGiftBonus(senderId: string, amount: number): Promise<void>
}
```

#### Frontend (3 дня)

##### 6.3 Gift UI
**Файл:** `webapp/src/components/referral/GiftModal.tsx`
**Оценка:** 2 дня

```typescript
export function GiftModal({ buddy }) {
  const [giftType, setGiftType] = useState<'stars' | 'energy'>('stars')
  const [amount, setAmount] = useState(50)

  const handleSend = async () => {
    await sendGift(buddy.id, { type: giftType, amount })
    showToast(`Sent ${amount}⭐ to ${buddy.name}! You got ${amount * 0.5}⭐ back!`)
  }

  return (
    <Modal>
      <h2>Send Gift to {buddy.name}</h2>

      <GiftTypeSelector value={giftType} onChange={setGiftType} />
      <AmountSlider
        value={amount}
        max={100}
        onChange={setAmount}
      />

      <div className="gift-preview">
        <p>They get: {amount}⭐</p>
        <p>You get back: {amount * 0.5}⭐</p>
      </div>

      <Button onClick={handleSend}>Send Gift</Button>
    </Modal>
  )
}
```

##### 6.4 Notifications
**Файл:** `webapp/src/components/notifications/ReferralNotifications.tsx`
**Оценка:** 1 день

```typescript
// Push notification integration
const NOTIFICATION_TYPES = {
  FRIEND_JOINED: '{name} just joined using your code! +350⭐',
  MILESTONE_AVAILABLE: 'Claim your {milestone} reward! 🎁',
  REVENUE_EARNED: 'You earned +{amount}⭐ from {name}\'s purchase!',
  BUDDY_ONLINE: '{name} is online! Play together for +50% rewards',
  SEASON_ENDING: 'Season ends in 24h! You\'re rank #{rank}',
  GIFT_RECEIVED: '{name} sent you a gift! 🎁'
}
```

#### Polish (2 дня)

##### 6.5 Performance Optimization
- [ ] Database query optimization
- [ ] Redis caching for leaderboards
- [ ] Lazy loading for analytics
- [ ] Image optimization

##### 6.6 Error Handling
- [ ] Graceful degradation
- [ ] User-friendly error messages
- [ ] Retry logic for failed API calls
- [ ] Offline support

#### QA (2 дня)

- [ ] End-to-end testing full flow
- [ ] Load testing
- [ ] Security audit
- [ ] Accessibility review
- [ ] Cross-browser testing

### Acceptance Criteria

- [ ] Gifting system works
- [ ] All notifications sent correctly
- [ ] Performance targets met (<2s load time)
- [ ] No critical bugs
- [ ] Documentation complete

---

## Post-Launch Plan

### Week 13-14: Monitoring & Iteration

**Objectives:**
- Monitor all metrics closely
- Identify bottlenecks
- Quick bug fixes
- Gather user feedback

**Daily monitoring:**
```
Key metrics dashboard:
- Fraud rate
- Conversion funnel
- Viral coefficient
- User feedback sentiment
- System performance

Alert thresholds:
- Fraud rate >10% → investigate
- Conversion drop >20% → rollback/fix
- Viral coefficient <0.5 → analyze
- API errors >1% → urgent fix
```

**Iteration priorities:**
1. Fix critical bugs
2. Adjust fraud thresholds
3. Optimize conversion bottlenecks
4. Add quick wins from user feedback

---

### Month 4+: Continuous Improvement

**A/B Testing Roadmap:**
```
Month 1:
- Test reward amounts (200⭐ vs 300⭐ vs 500⭐)
- Test milestone structure (current vs recommended)

Month 2:
- Test share messages (formal vs casual vs FOMO)
- Test prompt timing (immediate vs delayed)

Month 3:
- Test leaderboard visibility (always vs opt-in)
- Test season duration (weekly vs monthly)

Month 4:
- Test coop bonus amounts (50% vs 100%)
- Test gift limits (100⭐ vs 200⭐ per day)
```

**Feature Backlog:**
- [ ] Referral landing pages
- [ ] Deep social integration (Discord, Twitter)
- [ ] Predictive LTV modeling
- [ ] Advanced fraud ML model
- [ ] Referral tournaments
- [ ] Team referral challenges

---

## Risk Management

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Fraud detection false positives | Medium | High | Gradual rollout, manual review queue |
| Performance degradation | Low | Medium | Load testing, caching, monitoring |
| Database migration issues | Low | High | Staged rollout, backups, rollback plan |
| Third-party API failures | Medium | Low | Fallbacks, graceful degradation |

### Business Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| User backlash (delayed rewards) | Medium | Medium | Clear communication, email notifications |
| Economic imbalance | Low | High | Caps, monitoring, ability to adjust config |
| Low adoption | Low | Medium | A/B testing, user education, incentives |
| Budget overrun (rewards) | Medium | Medium | Daily/monthly caps, fraud prevention |

---

## Success Criteria

### Sprint-level

Each sprint must meet:
- [ ] All acceptance criteria passed
- [ ] Tests coverage >80%
- [ ] No critical bugs
- [ ] Performance targets met
- [ ] Documentation updated

### Project-level

Project succeeds if after 3 months:
- [ ] Viral coefficient: >0.8 (from ~0.4)
- [ ] Fraud rate: <10% (from ~35%)
- [ ] Conversion rate: +30% improvement
- [ ] Referral retention D7: +40%
- [ ] User satisfaction: >4/5 stars
- [ ] ROI: Positive within 60 days

---

## Resource Allocation

### Team Composition

**Backend Developer (Senior):**
- Sprint 1-2: Full-time
- Sprint 3-6: 50% time
- Total: 8 weeks FTE

**Backend Developer (Mid):**
- Sprint 1-6: 50% time
- Total: 3 weeks FTE

**Frontend Developer (Senior):**
- Sprint 3-6: Full-time
- Sprint 1-2: 25% time (planning, prep)
- Total: 4.5 weeks FTE

**QA Engineer:**
- All sprints: 25% time
- Sprint 6: 50% time (final testing)
- Total: 2 weeks FTE

**Total:** 17.5 weeks FTE over 12 weeks (1.5 people)

### Budget Estimate

```
Development: 17.5 weeks × $2000/week = $35,000
External services (fraud APIs): $200/month × 3 = $600
Infrastructure: Negligible (existing stack)
Total: ~$36,000

Expected savings (fraud reduction): $2000-5000/month
Expected revenue increase: 40-60% growth
ROI: Positive in <2 months
```

---

## Conclusion

This roadmap provides a clear path to upgrade Energy Planet's referral system from 6.5/10 to 8.5/10 over 12 weeks.

**Key outcomes:**
- ✅ Fraud-resistant system
- ✅ Data-driven optimization
- ✅ Engaging gamification
- ✅ Deep gameplay integration
- ✅ Viral growth engine

**Next steps:**
1. Review and approve roadmap
2. Allocate team resources
3. Set up project tracking
4. Begin Sprint 1

**Questions? Contact:** Engineering Team Lead
