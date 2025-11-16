# Fraud Prevention Guide: Referral Program

**Цель:** Защитить реферальную программу от мошенничества и абьюза
**Аудитория:** Engineering Team, Security Team
**Дата:** 2025-11-16

---

## Содержание

1. [Threat Model](#threat-model)
2. [Detection Techniques](#detection-techniques)
3. [Prevention Strategies](#prevention-strategies)
4. [Implementation Guide](#implementation-guide)
5. [Monitoring & Response](#monitoring--response)
6. [Incident Response](#incident-response)

---

## Threat Model

### Common Attack Vectors

#### 1. Self-Referral Attack

**Описание:**
Пользователь создает фейковые аккаунты и активирует свой реферальный код с них.

**Мотивация:**
- Получить activation rewards (350⭐ per fake account)
- Достичь milestones (500⭐ → 1500⭐ → 3500⭐ → 8000⭐)
- Общий profit: До 24,000⭐ за 30 фейковых аккаунтов

**Метод:**
```
1. User создает аккаунт → получает код EP-XXXX
2. User создает 30 фейковых Telegram аккаунтов
3. Каждый фейковый аккаунт:
   - Регистрируется в игре
   - Активирует код EP-XXXX
   - Получает 300⭐ (не важно, will abandon)
4. Main account получает:
   - 30 × 350⭐ = 10,500⭐
   - Milestones: 13,500⭐
   - Total: 24,000⭐
```

**Индикаторы:**
- Same IP address for multiple activations
- Same device fingerprint
- Sequential timing (activations in rapid succession)
- Zero activity after activation
- Similar email patterns (user+1@gmail, user+2@gmail)

---

#### 2. Referral Farm / Ring

**Описание:**
Группа пользователей создает круговую схему рефералов.

**Метод:**
```
User A refers User B
User B refers User C
User C refers User D
User D refers User A (если возможно)

Все контролируются одним человеком или группой.
```

**Индикаторы:**
- Small closed network (5-10 accounts)
- Mutual referrals (if allowed)
- Same geolocation
- Similar behavior patterns
- Coordinated timing

---

#### 3. Bot Farm

**Описание:**
Автоматизация создания аккаунтов через ботов.

**Метод:**
```
Script:
1. Generate Telegram account
2. Register in game via API
3. Activate referral code
4. Repeat × 100
```

**Индикаторы:**
- Identical behavior patterns
- Perfect timing (exactly N seconds between actions)
- Sequential usernames (user001, user002, user003)
- Same browser fingerprint with different IPs (proxy rotation)
- No human-like delays or errors

---

#### 4. Email Alias Abuse

**Описание:**
Использование email aliases для создания "разных" аккаунтов.

**Метод:**
```
Gmail ignores dots and +aliases:

john.doe@gmail.com
john.doe+1@gmail.com
john.doe+ref@gmail.com
j.o.h.n.d.o.e@gmail.com

→ Все идут на один email, но система видит как разные
```

**Индикаторы:**
- Normalized email collision
- Plus-sign patterns (+1, +2, +ref, etc.)
- Rapid account creation with similar emails

---

#### 5. VPN/Proxy Rotation

**Описание:**
Использование VPN/proxy для обхода IP-based детекции.

**Метод:**
```
1. Create account with real IP
2. Create fake account #1 via VPN (IP in different country)
3. Create fake account #2 via different VPN
4. All activate main account's code
```

**Индикаторы:**
- IP from known VPN/proxy provider
- IP geolocation mismatches language/timezone
- Datacenter IPs (not residential)
- High IP reputation scores (abuse history)

---

#### 6. Revenue Share Exploitation

**Описание:**
Создание фейковых аккаунтов, которые совершают покупки для генерации revenue share.

**Метод:**
```
1. Create fake account
2. Activate referrer's code
3. Purchase stars (small amount)
4. Referrer gets 1% revenue share
5. Repeat to maximize daily/monthly caps

Если можно использовать stolen payment methods:
→ Free money for attacker
```

**Индикаторы:**
- New account immediately makes purchase
- Purchase patterns (same amounts, timing)
- Payment method anomalies
- No gameplay, only purchases
- Revenue share consistently hitting caps

---

### Risk Assessment

| Attack Type | Probability | Impact | Detection Difficulty | Priority |
|-------------|-------------|--------|---------------------|----------|
| Self-Referral | Very High (80%) | High | Easy | 🔴 Critical |
| Email Alias | High (60%) | Medium | Easy | 🔴 Critical |
| Referral Ring | Medium (30%) | Medium | Medium | 🟠 High |
| Bot Farm | Low (15%) | High | Medium | 🟠 High |
| VPN Rotation | Medium (40%) | Medium | Hard | 🟡 Medium |
| Revenue Exploit | Very Low (5%) | Very High | Easy | 🟢 Low (if payment fraud detection exists) |

---

## Detection Techniques

### Layer 1: IP-Based Detection

#### 1.1 Exact IP Match

**Implementation:**
```typescript
// backend/src/services/FraudDetectionService.ts

async checkIPMatch(referrerId: string, referredId: string): Promise<boolean> {
  const referrerIP = await this.getUserLastIP(referrerId, 'registration')
  const referredIP = await this.getUserLastIP(referredId, 'registration')

  if (!referrerIP || !referredIP) {
    return false // Can't determine, allow
  }

  // Exact match = same device/network
  if (referrerIP === referredIP) {
    await this.logFraudEvent('IP_EXACT_MATCH', {
      referrerId,
      referredId,
      ip: referrerIP
    })
    return true // FRAUD DETECTED
  }

  return false
}
```

**Decision:**
- Exact IP match → **Auto-reject**
- Log event for analysis
- Exception: Public WiFi networks (need heuristics)

---

#### 1.2 Subnet Analysis

**Implementation:**
```typescript
async checkSubnetMatch(referrerId: string, referredId: string): Promise<number> {
  const referrerIP = await this.getUserLastIP(referrerId)
  const referredIP = await this.getUserLastIP(referredId)

  // Check if same /24 subnet (same local network)
  const referrerSubnet = this.getSubnet(referrerIP, 24)
  const referredSubnet = this.getSubnet(referredIP, 24)

  if (referrerSubnet === referredSubnet) {
    // Same network, possibly same household
    return 0.6 // Moderate fraud score
  }

  // Check /16 (same ISP region)
  const referrerRegion = this.getSubnet(referrerIP, 16)
  const referredRegion = this.getSubnet(referredIP, 16)

  if (referrerRegion === referredRegion) {
    return 0.2 // Low fraud score (same city is normal)
  }

  return 0 // Different regions
}

function getSubnet(ip: string, prefix: number): string {
  // Convert IP to binary, mask by prefix
  const parts = ip.split('.').map(Number)
  const binary = (parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]
  const mask = ~((1 << (32 - prefix)) - 1)
  const subnet = binary & mask

  return [
    (subnet >>> 24) & 255,
    (subnet >>> 16) & 255,
    (subnet >>> 8) & 255,
    subnet & 255
  ].join('.')
}
```

**Decision:**
- Same /24 subnet → **Flag for review** (fraud score +0.6)
- Same /16 → **Low suspicion** (fraud score +0.2)

---

#### 1.3 IP Velocity Check

**Implementation:**
```typescript
async checkIPVelocity(ip: string, window: string): Promise<VelocityResult> {
  const windowMs = parseWindow(window) // '24h' → 86400000
  const since = new Date(Date.now() - windowMs)

  // Count activations from this IP in window
  const count = await this.db.query(`
    SELECT COUNT(*) as count
    FROM user_ip_history
    WHERE ip_address = $1
    AND action = 'activation'
    AND created_at >= $2
  `, [ip, since])

  const limit = 3 // Max 3 activations per IP per 24h

  return {
    count: count.rows[0].count,
    limit,
    exceeded: count.rows[0].count >= limit,
    fraudScore: Math.min(1.0, count.rows[0].count / limit)
  }
}
```

**Decision:**
- Count >= 3 in 24h → **Auto-reject**
- Count = 2 → **Flag for review** (fraud score +0.5)
- Count = 1 → **Allow** (fraud score +0.1)

---

#### 1.4 VPN/Proxy Detection

**Implementation:**
```typescript
// Use external service or database
async checkVPNProxy(ip: string): Promise<VPNResult> {
  // Option 1: External API
  const response = await fetch(`https://vpnapi.io/api/${ip}?key=${API_KEY}`)
  const data = await response.json()

  return {
    isVPN: data.security.vpn,
    isProxy: data.security.proxy,
    isTor: data.security.tor,
    isDatacenter: data.location.is_datacenter,
    riskScore: data.security.risk_score
  }

  // Option 2: Local database (ASN check)
  const asn = await this.getASN(ip)
  const knownVPNASNs = [/* list of VPN provider ASNs */]

  if (knownVPNASNs.includes(asn)) {
    return { isVPN: true, riskScore: 0.8 }
  }
}
```

**Decision:**
- VPN detected → **Delay reward 72h** + flag
- Proxy detected → **Delay reward 48h**
- Tor detected → **Auto-reject** (high abuse)
- Datacenter IP → **Flag for review**

---

### Layer 2: Device Fingerprinting

#### 2.1 Browser Fingerprinting

**Implementation (Frontend):**
```typescript
// webapp/src/utils/fingerprint.ts

import FingerprintJS from '@fingerprintjs/fingerprintjs'

export async function getDeviceFingerprint(): Promise<string> {
  const fp = await FingerprintJS.load()
  const result = await fp.get()

  return result.visitorId // Unique device ID
}

// Usage during activation:
const fingerprint = await getDeviceFingerprint()

await fetch('/api/referrals/activate', {
  method: 'POST',
  body: JSON.stringify({
    code,
    fingerprint // Include in request
  })
})
```

**Backend validation:**
```typescript
async checkDeviceMatch(referrerId: string, referredId: string): Promise<boolean> {
  const referrerFingerprint = await this.getUserFingerprint(referrerId)
  const referredFingerprint = await this.getUserFingerprint(referredId)

  if (!referrerFingerprint || !referredFingerprint) {
    return false // Can't determine
  }

  // Exact match = same device
  if (referrerFingerprint === referredFingerprint) {
    await this.logFraudEvent('DEVICE_MATCH', {
      referrerId,
      referredId,
      fingerprint: referrerFingerprint
    })
    return true // FRAUD DETECTED
  }

  // Fuzzy match (90%+ similar components)
  const similarity = this.calculateFingerprintSimilarity(
    referrerFingerprint,
    referredFingerprint
  )

  if (similarity > 0.9) {
    await this.logFraudEvent('DEVICE_SIMILAR', {
      referrerId,
      referredId,
      similarity
    })
    return true // LIKELY FRAUD
  }

  return false
}
```

**Decision:**
- Exact fingerprint match → **Auto-reject**
- >90% similarity → **Flag for review**
- <90% → **Allow** (different devices)

---

#### 2.2 Telegram ID Validation

**Telegram-specific checks:**
```typescript
async checkTelegramAccount(telegramId: bigint): Promise<TelegramCheck> {
  // Check account age (via Telegram API if available)
  // New accounts (<7 days) are suspicious

  // Check if account has profile photo
  // Many fake accounts have no photo

  // Check username pattern
  // Auto-generated usernames (user123456789) are suspicious

  return {
    accountAge: days,
    hasPhoto: boolean,
    usernamePattern: 'autogenerated' | 'custom',
    fraudScore: calculateScore()
  }
}
```

**Decision:**
- Account <1 day old → **Delay reward 24h**
- No photo + autogenerated username → **Fraud score +0.3**
- Account <7 days + other flags → **Flag for review**

---

### Layer 3: Email Analysis

#### 3.1 Email Normalization

**Implementation:**
```typescript
function normalizeEmail(email: string): string {
  if (!email) return ''

  let [local, domain] = email.toLowerCase().trim().split('@')

  // Gmail: remove dots and +aliases
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    local = local.split('+')[0].replace(/\./g, '')
    domain = 'gmail.com' // Normalize googlemail
  }

  // Outlook aliases
  else if (domain.includes('outlook') || domain.includes('hotmail')) {
    local = local.split('+')[0]
  }

  // Yahoo aliases
  else if (domain.includes('yahoo')) {
    local = local.split('-')[0] // Yahoo uses -
  }

  // General: remove +alias
  else {
    local = local.split('+')[0]
  }

  return `${local}@${domain}`
}
```

**Fraud check:**
```typescript
async checkEmailDuplicate(userId: string, email: string): Promise<boolean> {
  const normalized = normalizeEmail(email)

  // Find other accounts with same normalized email
  const duplicates = await this.db.query(`
    SELECT user_id, email
    FROM users
    WHERE normalized_email = $1
    AND user_id != $2
  `, [normalized, userId])

  if (duplicates.rows.length > 0) {
    await this.logFraudEvent('EMAIL_DUPLICATE', {
      userId,
      email,
      normalized,
      duplicates: duplicates.rows.length
    })
    return true // FRAUD DETECTED
  }

  return false
}
```

**Decision:**
- Normalized email collision → **Auto-reject**
- 2+ accounts with similar emails → **Ban all accounts**

---

#### 3.2 Disposable Email Detection

**Implementation:**
```typescript
// Maintain database of disposable email domains
const DISPOSABLE_DOMAINS = [
  'tempmail.com',
  '10minutemail.com',
  'guerrillamail.com',
  'mailinator.com',
  'throwaway.email',
  // ... 5000+ domains
]

async isDisposableEmail(email: string): Promise<boolean> {
  const domain = email.split('@')[1]

  // Check local database
  if (DISPOSABLE_DOMAINS.includes(domain)) {
    return true
  }

  // Check external service (optional)
  const response = await fetch(`https://disposable.debounce.io/?email=${email}`)
  const data = await response.json()

  return data.disposable
}
```

**Decision:**
- Disposable email → **Block registration** (not just referral)
- Alternative: Allow registration, but no referral rewards

---

### Layer 4: Behavioral Analysis

#### 4.1 Timing Analysis

**Suspicious patterns:**
```typescript
async analyzeTiming(userId: string): Promise<TimingAnalysis> {
  const events = await this.getUserEvents(userId)

  // Time from registration to activation
  const registrationTime = events.find(e => e.type === 'registration')?.timestamp
  const activationTime = events.find(e => e.type === 'activation')?.timestamp

  const timeToActivation = activationTime - registrationTime

  // Red flags:
  const flags = []

  // Too fast (< 60 seconds)
  if (timeToActivation < 60 * 1000) {
    flags.push('INSTANT_ACTIVATION')
  }

  // Perfect timing (exactly same seconds across multiple accounts)
  const timingPattern = await this.checkTimingPattern(timeToActivation)
  if (timingPattern.matches > 3) {
    flags.push('IDENTICAL_TIMING')
  }

  return {
    timeToActivation,
    flags,
    fraudScore: flags.length > 0 ? 0.7 : 0
  }
}
```

---

#### 4.2 Activity Analysis

**Minimum activity requirement:**
```typescript
interface ActivityRequirement {
  minPlaytimeSeconds: 300       // 5 minutes
  minSessionCount: 2             // 2 separate sessions
  minActionsPerformed: 10        // 10 meaningful actions
  minDaysSinceRegistration: 1    // 1 day account age
}

async validateActivity(userId: string): Promise<ActivityValidation> {
  const stats = await this.getUserStats(userId)

  const passed = {
    playtime: stats.playtimeSeconds >= 300,
    sessions: stats.sessionCount >= 2,
    actions: stats.actionsPerformed >= 10,
    accountAge: stats.accountAgeDays >= 1
  }

  const allPassed = Object.values(passed).every(Boolean)

  return {
    passed,
    eligible: allPassed,
    fraudScore: allPassed ? 0 : 0.8
  }
}
```

**Decision:**
- Activity requirement NOT met → **Delay reward until met**
- Check activity daily for 7 days
- If still not met → **Reject**

---

#### 4.3 Behavioral Clustering

**Machine Learning approach:**
```python
# Train on historical data
from sklearn.ensemble import RandomForestClassifier

features = [
  'time_to_activation',         # seconds
  'playtime_first_session',     # seconds
  'actions_per_minute',
  'session_gap_hours',          # time between sessions
  'unique_screens_visited',
  'tutorial_completion_time',
  'ip_reputation_score',
  'device_age_days',
  'account_age_hours'
]

labels = [0, 1]  # 0 = legit, 1 = fraud

# Train model
model = RandomForestClassifier()
model.fit(X_train, y_train)

# Predict
fraud_probability = model.predict_proba(user_features)[0][1]

# Decision
if fraud_probability > 0.8:
  decision = 'reject'
elif fraud_probability > 0.5:
  decision = 'manual_review'
else:
  decision = 'approve'
```

---

### Layer 5: Graph Analysis

#### 5.1 Referral Network Analysis

**Detect referral rings:**
```typescript
async analyzeReferralNetwork(userId: string): Promise<NetworkAnalysis> {
  // Build graph of referral relationships
  const network = await this.buildReferralGraph(userId, depth: 3)

  // Detect circular references
  const cycles = this.detectCycles(network)
  if (cycles.length > 0) {
    return {
      suspicious: true,
      reason: 'CIRCULAR_REFERRALS',
      cycles,
      fraudScore: 0.9
    }
  }

  // Detect small closed groups (referral farms)
  const isolatedClusters = this.detectIsolatedClusters(network)
  if (isolatedClusters.length > 0) {
    // Group of 5-10 accounts that only refer each other
    return {
      suspicious: true,
      reason: 'REFERRAL_FARM',
      clusters: isolatedClusters,
      fraudScore: 0.85
    }
  }

  // Check for single-source mass referrals (bot farms)
  const massReferrals = this.detectMassReferrals(network, threshold: 50)
  if (massReferrals) {
    return {
      suspicious: true,
      reason: 'BOT_FARM',
      referrercount: massReferrals.count,
      fraudScore: 1.0
    }
  }

  return {
    suspicious: false,
    fraudScore: 0
  }
}
```

**Visualization:**
```
Normal network:
  User A → 3 friends (who have other referrers)
  User B → 2 friends (active in game)

Suspicious network (farm):
  User A → 10 accounts (all inactive)
  ↑  ↓
  Account1, Account2, ... Account10 (only interact with User A)

Suspicious network (ring):
  User A → User B → User C → User D → User A
  (Circular references)
```

---

## Prevention Strategies

### Strategy 1: Delayed Rewards

**Implementation:**
```typescript
// Instead of immediate rewards:
await this.grantReward(userId, amount)

// Use pending system:
await this.pendingRewardService.createPendingReward(userId, {
  type: 'activation',
  amount,
  reviewAfter: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
  fraudChecks: {
    ip: ipCheckResult,
    device: deviceCheckResult,
    email: emailCheckResult,
    timing: timingCheckResult,
    activity: activityCheckResult
  }
})
```

**Benefits:**
- 80% of fraud abandoned (don't wait)
- Time to run deeper analysis
- Batch processing efficiency
- Manual review if needed

**Trade-offs:**
- User friction (delay)
- Need good communication
- Email notification system

---

### Strategy 2: Progressive Trust

**Concept:** New accounts have stricter requirements

```typescript
interface TrustLevel {
  accountAge: number
  verifiedEmail: boolean
  phoneVerified: boolean
  purchaseHistory: boolean
  playtimeHours: number
}

function calculateTrustLevel(user: User): number {
  let score = 0

  // Account age
  if (user.accountAgeDays > 30) score += 3
  else if (user.accountAgeDays > 7) score += 2
  else if (user.accountAgeDays > 1) score += 1

  // Verification
  if (user.emailVerified) score += 2
  if (user.phoneVerified) score += 3

  // Engagement
  if (user.totalPurchases > 0) score += 4
  if (user.playtimeHours > 10) score += 2

  return score // 0-14
}

// Apply different rules based on trust:
async function applyTrustBasedRules(userId: string) {
  const trustLevel = calculateTrustLevel(user)

  if (trustLevel >= 10) {
    // Trusted user
    return {
      rewardDelay: 0,           // Immediate
      fraudChecks: ['basic'],
      manualReview: false
    }
  } else if (trustLevel >= 5) {
    // Medium trust
    return {
      rewardDelay: 12 * 60 * 60 * 1000,  // 12h
      fraudChecks: ['basic', 'behavioral'],
      manualReview: false
    }
  } else {
    // Low trust (new/suspicious)
    return {
      rewardDelay: 48 * 60 * 60 * 1000,  // 48h
      fraudChecks: ['all'],
      manualReview: true
    }
  }
}
```

---

### Strategy 3: Rate Limiting

**Multi-level limits:**
```typescript
const RATE_LIMITS = {
  // User-level
  user: {
    maxActivationsPerDay: 10,     // Already implemented
    maxSharesPerHour: 5,
    cooldownBetweenShares: 5 * 60 * 1000  // 5 min
  },

  // IP-level
  ip: {
    maxActivationsPerDay: 3,
    maxRegistrationsPerDay: 5
  },

  // System-level
  system: {
    maxActivationsPerHour: 100,
    maxRewardsPerHour: 50000  // stars
  }
}

async function checkRateLimits(context: Context): Promise<RateLimitResult> {
  // Check all applicable limits
  const checks = await Promise.all([
    this.checkUserLimit(context.userId),
    this.checkIPLimit(context.ip),
    this.checkSystemLimit()
  ])

  const exceeded = checks.find(c => c.exceeded)

  if (exceeded) {
    return {
      allowed: false,
      reason: exceeded.reason,
      retryAfter: exceeded.retryAfter
    }
  }

  return { allowed: true }
}
```

---

### Strategy 4: CAPTCHA / Verification

**Progressive challenges:**
```typescript
async function getChallengeRequirement(context: Context): Promise<Challenge | null> {
  const riskScore = await this.calculateRiskScore(context)

  // Low risk: No challenge
  if (riskScore < 0.3) {
    return null
  }

  // Medium risk: Simple CAPTCHA
  if (riskScore < 0.6) {
    return {
      type: 'captcha',
      difficulty: 'easy'
    }
  }

  // High risk: Complex CAPTCHA + Email verification
  if (riskScore < 0.8) {
    return {
      type: 'captcha',
      difficulty: 'hard',
      additionalVerification: 'email'
    }
  }

  // Very high risk: Manual review
  return {
    type: 'manual_review',
    estimatedTime: '24-48h'
  }
}
```

---

## Implementation Guide

### Phase 1: Logging Infrastructure (Week 1)

**Objective:** Visibility before enforcement

```sql
-- Migration: Create audit tables
CREATE TABLE fraud_detection_events (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  detection_method VARCHAR(50),
  fraud_score DECIMAL(3,2),
  details JSONB,
  action_taken VARCHAR(50), -- 'logged', 'flagged', 'blocked'
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_fraud_events_user ON fraud_detection_events(user_id);
CREATE INDEX idx_fraud_events_score ON fraud_detection_events(fraud_score DESC);
CREATE INDEX idx_fraud_events_created ON fraud_detection_events(created_at DESC);
```

**Implementation:**
```typescript
// Log everything, enforce nothing (yet)
async function activateReferralCode(userId: string, code: string) {
  // Run all fraud checks
  const fraudChecks = await this.runAllFraudChecks(userId, code)

  // LOG results
  await this.logFraudEvent('ACTIVATION_ATTEMPT', {
    userId,
    code,
    checks: fraudChecks,
    finalScore: fraudChecks.overallScore
  })

  // For now: ALLOW all (just log)
  await this.createRelation(...)
  await this.grantRewards(...)
}
```

**Goal:** Collect data for tuning thresholds

---

### Phase 2: Thresold Tuning (Week 2)

**Analyze logs:**
```sql
-- Find fraud score distribution
SELECT
  CASE
    WHEN fraud_score < 0.3 THEN 'Low'
    WHEN fraud_score < 0.6 THEN 'Medium'
    WHEN fraud_score < 0.8 THEN 'High'
    ELSE 'Critical'
  END as risk_level,
  COUNT(*) as count,
  ROUND(AVG(fraud_score), 2) as avg_score
FROM fraud_detection_events
WHERE event_type = 'ACTIVATION_ATTEMPT'
GROUP BY risk_level;

-- Sample results:
-- Low: 850 activations (avg 0.15)
-- Medium: 120 activations (avg 0.45)
-- High: 25 activations (avg 0.72)
-- Critical: 5 activations (avg 0.92)
```

**Manual review:**
- Review 100 random "Low" cases → validate legit
- Review all "Critical" cases → validate fraud
- Adjust thresholds to minimize false positives

**Set thresholds:**
```typescript
const FRAUD_THRESHOLDS = {
  autoReject: 0.8,      // >80% = definitely fraud
  manualReview: 0.5,    // 50-80% = suspicious
  delayReward: 0.3,     // 30-50% = minor concern
  autoApprove: 0.3      // <30% = likely legit
}
```

---

### Phase 3: Soft Launch (Week 3)

**Enable enforcement for 10% of users:**
```typescript
async function activateReferralCode(userId: string, code: string) {
  const fraudChecks = await this.runAllFraudChecks(userId, code)

  // Feature flag: Only enforce for 10% of users
  const enrolledInFraudPrevention = await this.isUserInExperiment(userId, 'fraud_prevention', 0.1)

  if (enrolledInFraudPrevention) {
    // ENFORCE rules
    if (fraudChecks.overallScore > FRAUD_THRESHOLDS.autoReject) {
      throw new FraudError('HIGH_FRAUD_SCORE')
    }

    if (fraudChecks.overallScore > FRAUD_THRESHOLDS.delayReward) {
      await this.createPendingReward(...) // Delay
    } else {
      await this.grantReward(...) // Immediate
    }

  } else {
    // Control group: Allow all (just log)
    await this.grantReward(...)
  }

  await this.logFraudEvent('ACTIVATION', { ...fraudChecks, enforced: enrolledInFraudPrevention })
}
```

**Monitor:**
- False positive rate
- User complaints
- Fraud reduction in experiment group
- System performance

---

### Phase 4: Full Rollout (Week 4)

**Scale to 100%:**
```typescript
// Remove feature flag
const enforced = true

if (fraudChecks.overallScore > FRAUD_THRESHOLDS.autoReject) {
  throw new FraudError('HIGH_FRAUD_SCORE')
}
```

**Communication:**
- Email to all users about new security measures
- FAQ about delayed rewards
- Support team training

---

## Monitoring & Response

### Real-Time Dashboard

**Key metrics:**
```
Fraud Detection Dashboard:

Today's Summary:
- Activations attempted: 234
- Auto-rejected: 12 (5.1%)
- Flagged for review: 18 (7.7%)
- Auto-approved: 204 (87.2%)

Fraud Rate (estimated): 8.5% ✅ (target: <10%)

Detection Methods (top flags today):
1. IP velocity exceeded: 8 cases
2. Device fingerprint match: 6 cases
3. Email alias detected: 4 cases
4. Timing anomaly: 3 cases

Pending Review Queue: 23 cases
- High priority (>0.8): 3
- Medium priority (0.5-0.8): 15
- Low priority (<0.5): 5

False Positive Reports: 2 (0.85% of rejections)
```

---

### Alert Rules

**Automated alerts:**
```typescript
const ALERT_RULES = {
  // Spike in fraud attempts
  fraudSpikeAlert: {
    condition: 'fraud_rate > 15% for 1 hour',
    severity: 'high',
    action: 'notify_security_team + enable_strict_mode'
  },

  // Mass attack detected
  massAttackAlert: {
    condition: 'rejections > 50 in 10 minutes',
    severity: 'critical',
    action: 'notify_on_call + temporary_lockdown'
  },

  // False positive spike
  falsePositiveAlert: {
    condition: 'false_positive_rate > 10%',
    severity: 'medium',
    action: 'notify_team + review_thresholds'
  },

  // System degradation
  performanceAlert: {
    condition: 'fraud_check_latency > 2s',
    severity: 'medium',
    action: 'notify_engineering + scale_resources'
  }
}
```

---

### Manual Review Process

**Review Queue UI:**
```
Pending Review Case #12345:

User: @username (ID: xxx-xxx-xxx)
Referral Code: EP-XXXX
Fraud Score: 0.67

Red Flags:
⚠️ Same subnet as referrer (0.3)
⚠️ Account <24h old (0.2)
⚠️ Zero playtime before activation (0.4)

Context:
- Registration: 2024-11-16 10:23:45
- Activation: 2024-11-16 10:45:12 (21 min later)
- IP: 192.168.1.100 (Residential, Russia)
- Device: Mobile (Android)
- Email: user@gmail.com (verified)

Actions:
[Approve] [Reject] [Request More Info] [Escalate]

Notes: ___________________________
```

**Review guidelines:**
```
Approve if:
- Single red flag with reasonable explanation
- User has other positive signals
- Account shows genuine activity

Reject if:
- Multiple red flags (3+)
- Clear pattern matching (bot-like behavior)
- Confirmed duplicate of banned account

Request more info if:
- Borderline case
- Unusual but not definitively fraud
- Need user to verify (email, SMS)
```

---

## Incident Response

### Scenario 1: Mass Attack Detected

**Detection:**
```
Alert: 100+ activation attempts from same IP in 10 minutes
Fraud rate spike: 35% → 85%
```

**Response:**
1. **Immediate (0-5 min):**
   - Auto-block IP
   - Enable rate limiting (strict mode)
   - Alert security team

2. **Short-term (5-30 min):**
   - Analyze attack pattern
   - Block related IPs/fingerprints
   - Review and reject pending rewards from attack window

3. **Medium-term (30 min - 2h):**
   - Investigate root cause
   - Ban all accounts from attack
   - Refund any wrongly granted rewards

4. **Long-term (2h+):**
   - Adjust detection rules
   - Improve defenses
   - Post-mortem analysis

---

### Scenario 2: False Positive Spike

**Detection:**
```
Alert: 15+ user complaints about rejected referrals in 1 hour
False positive rate: 2% → 12%
```

**Response:**
1. **Immediate:**
   - Pause auto-rejections (switch to flagging)
   - Manual review all recent rejections

2. **Short-term:**
   - Identify root cause (bad threshold? Bug?)
   - Temporarily loosen thresholds

3. **Medium-term:**
   - Fix bug or adjust thresholds
   - Manually approve false positives
   - Email apology to affected users

4. **Long-term:**
   - Improve detection algorithm
   - Add more context to decisions
   - Better communication to users

---

### Scenario 3: New Attack Vector

**Example: Attackers find workaround**

**Response:**
1. **Analyze:** Understand new technique
2. **Hotfix:** Quick patch to block (even if crude)
3. **Develop:** Proper detection method
4. **Deploy:** Roll out improved detection
5. **Monitor:** Ensure effectiveness

---

## Appendix

### Fraud Score Calculation

**Example composite score:**
```typescript
function calculateFraudScore(checks: FraudChecks): number {
  let score = 0

  // IP checks (30% weight)
  if (checks.ip.exactMatch) score += 0.30
  else if (checks.ip.subnetMatch) score += 0.15
  score += checks.ip.velocityScore * 0.15

  // Device checks (20% weight)
  if (checks.device.exactMatch) score += 0.20
  else if (checks.device.similarity > 0.9) score += 0.15

  // Email checks (15% weight)
  if (checks.email.duplicate) score += 0.15
  if (checks.email.disposable) score += 0.10

  // Behavioral checks (25% weight)
  score += checks.timing.suspiciousScore * 0.10
  score += checks.activity.lackOfEngagementScore * 0.15

  // Network checks (10% weight)
  if (checks.vpn.detected) score += 0.10

  // Cap at 1.0
  return Math.min(1.0, score)
}
```

---

### Tools & Services

**Recommended:**
- **Device Fingerprinting:** FingerprintJS ($99-299/month)
- **IP Intelligence:** IPQualityScore ($50-500/month)
- **Email Validation:** ZeroBounce ($15-100/month)
- **Fraud Detection:** Sift ($500+/month, ML-based)

**Open Source Alternatives:**
- Device fingerprinting: Custom implementation
- IP databases: MaxMind GeoIP2 Free
- Email validation: Local database of disposable domains

---

**Document Version:** 1.0
**Last Updated:** 2025-11-16
**Next Review:** After Sprint 1 completion
