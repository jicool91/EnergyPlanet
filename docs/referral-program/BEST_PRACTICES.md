# Референс: Best Practices реферальных программ 2025

**Источники:** Viral Loops, ReferralRock, AppSamurai, GameMarketingGenie, SEON, Fingerprint
**Дата:** 2025-11-16
**Индустрия:** Mobile Gaming, SaaS, E-commerce

---

## Содержание

1. [Core Principles](#core-principles)
2. [Reward Structures](#reward-structures)
3. [Gamification Techniques](#gamification-techniques)
4. [Fraud Prevention](#fraud-prevention)
5. [UX & Placement](#ux--placement)
6. [Analytics & Optimization](#analytics--optimization)
7. [Case Studies](#case-studies)

---

## Core Principles

### 1. Two-Sided Incentives (Bilateral Rewards)

**Принцип:** Награждайте обе стороны - и пригласившего, и приглашенного.

**Почему это работает:**
- Снижает friction при приглашении (друг тоже выигрывает)
- Создает win-win ситуацию
- Увеличивает conversion rate на 40-60%

**Примеры:**

| Компания | Invitee Reward | Referrer Reward |
|----------|----------------|-----------------|
| Dropbox | +500MB storage | +500MB storage |
| Uber | $5 ride credit | $5 credit |
| Airbnb | $25-55 travel credit | $25 credit |
| PayPal | $10 cash | $10 cash |

**Best Practice для игр:**
```
Invitee: Значительный head start (20-30% от первого дня прогресса)
Referrer: Ценная, но не game-breaking награда

Energy Planet пример:
✅ Invitee: 300⭐ + cosmetic (хороший старт)
✅ Referrer: 350⭐ (ценная награда)
```

**Антипаттерн:**
- ❌ Награда только для реферера (снижает мотивацию друзей)
- ❌ Слишком маленькие награды (не стоят усилий)
- ❌ Слишком большие награды (ломают экономику)

---

### 2. Make It Easy (Frictionless Experience)

**Принцип:** Каждый дополнительный клик = -20% conversion

**Checklist:**
- [ ] Код генерируется автоматически
- [ ] One-click share в популярные платформы
- [ ] Предзаполненное сообщение
- [ ] Видимое размещение (не нужно искать)
- [ ] Mobile-first дизайн
- [ ] Deep linking (автозаполнение кода)

**Пример идеального flow:**
```
User Journey (≤ 3 клика):
1. Видит реферальную карточку → 0 кликов (уже на экране)
2. Клик "Share" → 1 клик
3. Выбирает друга из списка → 2 клика
4. Отправляет → 3 клика

Друг:
1. Кликает ссылку → автозаполнение кода → регистрация
2. Получает награду → 0 дополнительных действий
```

**Viral Loops статистика:**
- 1 клик: 100% completion
- 2 клика: 80% completion
- 3 клика: 64% completion
- 5+ кликов: <40% completion

---

### 3. Value Perception (Ценность награды)

**Принцип:** Награда должна быть ценной В КОНТЕКСТЕ игры/продукта

**Формула ценности:**
```
Perceived Value = Rarity × Utility × Social Status

Пример (World of Warcraft):
- Referral Mount: Редкий (нельзя купить) × Полезен (транспорт) × Статус (все видят)
- Perceived Value: VERY HIGH

Пример (плохой):
- 10 золота: Распространенное × Полезно × Нет статуса
- Perceived Value: LOW
```

**Best Practices для типов наград:**

#### Игровая валюта
```
✅ Хорошо:
- Достаточно для значимой покупки (полный скин, неделя премиума)
- 20-30% от недельного заработка free-to-play игрока

❌ Плохо:
- Символическая сумма (5% от одной покупки)
```

#### Эксклюзивные предметы
```
✅ Хорошо:
- Уникальный визуал (нельзя получить иначе)
- Показывает статус ("я привел друзей")
- Функционально полезен или красив

❌ Плохо:
- Рескин обычного предмета
- Временный (исчезает через неделю)
```

#### Premium валюта
```
✅ Хорошо:
- 30-50% от стартового паka
- Достаточно для одной gacha попытки / loot box

❌ Плохо:
- Меньше чем стоимость самого дешевого предмета в магазине
```

---

## Reward Structures

### Tiered Milestone Systems

**Принцип:** Прогрессивные награды создают momentum

**Research (Viral Loops, ReferralRock):**
```
Первый milestone: ≤ 2 рефералов
- Создает "quick win"
- Мотивирует продолжить
- Conversion rate +45%

Дальнейшие milestones: экспоненциальный рост
- Каждый следующий требует ~2-3× рефералов
- Награда растет пропорционально или быстрее
```

**Оптимальная структура (mobile game):**

| Tier | Threshold | Multiplier | Reward Example | Psychology |
|------|-----------|------------|----------------|------------|
| 1 | 1 | 1× | 500 gems | Quick win, taste of success |
| 2 | 3 | 2-3× | 1,500 gems | Easy to achieve, builds habit |
| 3 | 7 | 5-7× | 3,500 gems | Requires effort, commitment |
| 4 | 15 | 12-15× | 7,500 gems | Serious referrer, power user |
| 5 | 30 | 30-40× | 15,000 gems | Elite tier, social proof |
| 6 | 50+ | 60-100× | 50,000 gems + Title | Legend status |

**Energy Planet текущая структура:**
```
❌ Проблема:
Tier 1: 1 ref → 500⭐
Tier 2: 5 ref → 1,500⭐  ← Слишком большой прыжок!
Tier 3: 15 ref → 3,500⭐
Tier 4: 30 ref → 8,000⭐

✅ Рекомендация:
Tier 1: 1 ref → 300⭐
Tier 2: 3 ref → 800⭐   ← Добавить промежуточный
Tier 3: 7 ref → 2,000⭐
Tier 4: 15 ref → 5,000⭐
Tier 5: 30 ref → 12,000⭐
Tier 6: 50 ref → 25,000⭐ + Title
```

---

### Revenue Share / Lifetime Value Rewards

**Принцип:** Долгосрочная мотивация через процент от покупок

**Модели:**

#### Fixed Percentage (Energy Planet модель)
```
Referrer получает: 1% от всех покупок реферала
Срок: Бессрочно (или до определенного капа)

Плюсы:
✅ Простая для понимания
✅ Предсказуемая для реферера
✅ Мотивирует приглашать платящих друзей

Минусы:
⚠️ Может быть дорого для бизнеса
⚠️ Требует caps (daily/monthly)
```

**Best Practice caps:**
```
Daily cap: 5-10% от среднего дневного дохода топ-10% игроков
Monthly cap: 20-30% от среднего месячного дохода

Energy Planet:
Daily: 2000⭐ (разумно, если средний трата топ-игроков ~1000-2000⭐/день)
Monthly: 10000⭐ (5× daily cap, стандартно)
```

#### Tiered Percentage
```
Более продвинутая модель:

First $10 spent by referral: 10% to referrer
$10-100: 5%
$100+: 2%

Мотивирует:
- Ранние покупки реферала (больший процент)
- Продолжать приглашать новых (fresh high %)
```

#### Time-Limited
```
Referrer получает 5% первые 90 дней

Плюсы:
✅ Ограниченные затраты для бизнеса
✅ Достаточно для мотивации
✅ Проще балансировать экономику

Минусы:
⚠️ Меньше долгосрочной мотивации
```

**Статистика (ReferralCandy):**
- Revenue share увеличивает LTV рефереров на 60-80%
- Рефереры приглашают на 2-3× больше друзей
- Качество рефералов выше (ищут платящих друзей)

---

### Event Multipliers

**Принцип:** Временные бусты создают urgency и FOMO

**Типы событий:**

#### Seasonal Events
```
Пример: "Holiday Season 2× Rewards"
Период: 2-4 недели (праздники)
Эффект: Все награды удваиваются

Результаты (Viral Loops data):
- Referral activity +180% во время события
- 40% новых рефереров активируются
- Spill-over effect: +30% активности после события
```

#### Weekend Boosts
```
Пример: "Weekend Warrior"
Период: Каждые выходные
Эффект: +50% к milestone наградам

Результаты:
- Создает weekly engagement паттерн
- +25% retention рефереров
```

#### Milestone-Specific
```
Пример: "First Referral Bonus Week"
Период: 1 неделя ежемесячно
Эффект: 3× награда за ПЕРВОГО реферала

Targeting: Новые рефереры, еще не приглашавшие
Результаты:
- Activation rate новых рефереров +150%
- Снижает "0 referral" пользователей на 40%
```

**Best Practice частота:**
```
✅ Хорошо:
- Seasonal: 3-4 раза в год (не чаще)
- Weekend: Каждые 2-4 выходных
- Targeted: Ежемесячно, разные сегменты

❌ Плохо:
- Постоянные события (становятся "нормой")
- Слишком частые (event fatigue)
- Непредсказуемые (нет anticipation)
```

---

## Gamification Techniques

### Leaderboards

**Принцип:** Публичное соревнование мотивирует топ-рефереров

**Структура:**

#### Global Leaderboard
```
Показывает: Топ-100 рефереров всех времен
Обновление: Real-time или каждый час
Отображение:
- Rank
- Username
- Referral count
- Special badge/title
- Total rewards earned (опционально)

Rewards:
- Top 1: Легендарный предмет + Title "Supreme Recruiter"
- Top 3: Эпический предмет + Title
- Top 10: Редкий предмет + Badge
- Top 100: Косметический badge
```

#### Season Leaderboards
```
Сбрасывается: Ежемесячно или ежеквартально
Преимущества:
✅ Дает шанс новым игрокам
✅ Сохраняет соревновательность
✅ Создает recurring engagement

Пример (Clash of Clans):
- Monthly Recruiter Challenge
- Top 10 каждого месяца получают:
  * Exclusive skin (месячной тематики)
  * 5000 gems
  * "Recruiter of the Month" title (temporary)
```

#### Personal Milestones
```
Показывает пользователю:
- Его текущий ранг
- Ближайшие соперники (±5 мест)
- До следующего ранга: "3 more referrals to reach Top 50!"

Психология:
- Loss aversion: "Я был #48, теперь #52, нужно догнать!"
- Achievability: "Всего 3 реферала до топ-50"
```

**UI Best Practices:**
```
✅ Должно быть:
- Visual ranking (1st/2nd/3rd с медалями/коронами)
- Profile pictures / avatars
- Badges и titles видимы
- Smooth animations (rank changes)
- Share кнопка ("I'm #12 in referrals!")

❌ Избегать:
- Только текстовый список
- Статический (не обновляется)
- Нет контекста (не показан user's rank)
```

**Статистика эффективности:**
- Топ-10 рефереров приглашают 60-70% всех рефералов
- Leaderboard увеличивает активность топ-рефереров на +40%
- Публичность мотивирует сильнее чем приватные награды

---

### Progress Visualization

**Принцип:** Визуальный прогресс мотивирует завершение

**Техники:**

#### Progress Bars
```
Пример:
[████████░░] 8/10 referrals to "Legend Circle"

Психология (Zeigarnik Effect):
- Незавершенные задачи создают напряжение
- Чем ближе к завершению, тем сильнее мотивация
- "Всего 2 реферала осталось!" → action

Best Practice:
- Показывать СЛЕДУЮЩИЙ milestone (не все)
- Celebrate маленькие wins (animations при заполнении)
- Color coding: red (start) → yellow (mid) → green (almost there)
```

#### Milestone Maps
```
Visual journey:

START → [✓] 1 ref → [✓] 3 refs → [○] 7 refs → [○] 15 refs → LEGEND

Каждый узел:
- Иконка награды
- Количество рефералов
- Статус (completed, in progress, locked)

Interactive:
- Клик на milestone → подробности награды
- Animation при unlock
- Glow effect на текущем milestone
```

#### Badges & Achievements
```
Visual collection UI (like Pokemon badges):

[🌟] Newcomer (1 ref)
[⭐⭐] Rising Star (3 refs)
[⭐⭐⭐] Super Nova (7 refs)
[🏆] Legend (30 refs)

Display:
- User profile (public)
- Leaderboard
- In-game chat (badge next to name)

Unlockable bonuses:
- Higher badges = special perks (chat privileges, exclusive events, etc)
```

---

### Competitions & Challenges

**Принцип:** Time-limited goals создают urgency

**Типы:**

#### Team Challenges
```
Пример: "Guild Recruitment War"

Механика:
- Guilds compete for most referrals in 2 weeks
- Top 3 guilds get rewards for ALL members

Rewards:
- 1st place: 5000⭐ per member + exclusive guild banner
- 2nd place: 3000⭐ per member
- 3rd place: 1500⭐ per member

Эффект:
- Social pressure (не подводить guild)
- Team collaboration
- 3-5× referral activity во время события
```

#### Individual Sprints
```
Пример: "Weekend Blitz"

Механика:
- 48 часов
- First 100 users to get 5 new referrals win prize

Prize:
- Exclusive limited-time cosmetic (FOMO)
- 2000⭐ bonus

Психология:
- Scarcity (только 100 winners)
- Time pressure (48h)
- Clear goal (5 referrals)
```

#### Streaks
```
Пример: "Referral Streak"

Механика:
- Get 1+ referrals per week for 4 consecutive weeks
- Streak continues → rewards multiply

Rewards:
Week 1: 500⭐
Week 2: 1000⭐ (2×)
Week 3: 2000⭐ (4×)
Week 4: 4000⭐ (8×)

Break streak: Start from Week 1

Эффект:
- Habit formation
- Consistent engagement
- Fear of losing streak (loss aversion)
```

**Research (Gameball, SaaSQuatch):**
- Competitions increase participation by 200-300%
- Time-limited rewards have 2× conversion vs permanent
- Social/team challenges outperform individual by 40%

---

## Fraud Prevention

### Detection Techniques

#### 1. Device Fingerprinting

**Что отслеживается:**
```javascript
{
  screen: { width, height, colorDepth },
  navigator: { userAgent, language, platform },
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  webgl: { vendor, renderer },
  fonts: installed fonts hash,
  canvas: canvas fingerprint hash,
  audio: audio fingerprint
}

→ Генерирует уникальный ID устройства (99.5% accuracy)
```

**Детекция:**
```
IF two users have identical fingerprint:
  → Likely same device (self-referral or fraud ring)
  → Flag for review or auto-reject
```

**Tools:**
- FingerprintJS (industry standard)
- DeviceAtlas
- Custom implementation

**Best Practice:**
```typescript
// During referral activation:
const referrerFingerprint = await getDeviceFingerprint(referrerId)
const referredFingerprint = await getDeviceFingerprint(referredId)

const similarity = calculateSimilarity(referrerFingerprint, referredFingerprint)
if (similarity > 0.95) {
  throw new FraudError('DEVICE_MATCH_DETECTED')
}
```

---

#### 2. IP Address Tracking

**Механика:**
```
Track:
- IP при регистрации
- IP при активации кода
- IP история за 7 дней

Red flags:
1. Referrer IP === Referred IP (same network)
2. Multiple activations from same IP (velocity)
3. VPN/Proxy detection (suspicious patterns)
```

**Layered approach:**

| Level | Check | Action |
|-------|-------|--------|
| 1 | Exact IP match | Auto-reject |
| 2 | Same /24 subnet | Flag for review |
| 3 | Same city + similar device | Manual review |
| 4 | VPN detected | Delay reward 72h |

**Code example:**
```typescript
const referrerIP = await getUserLastIP(referrerId)
const referredIP = currentRequest.ip

// Exact match
if (referrerIP === referredIP) {
  await logFraudAttempt('IP_MATCH', { referrerId, referredId })
  throw new FraudError('SAME_NETWORK_DETECTED')
}

// Subnet check (same /24)
if (isSameSubnet(referrerIP, referredIP, 24)) {
  await flagForReview('SUBNET_MATCH', { referrerId, referredId })
}

// VPN detection
if (await isVPN(referredIP)) {
  await delayReward(referredId, '72 hours')
}
```

**Services:**
- IPQualityScore
- MaxMind GeoIP2
- IPHub
- Custom proxy/VPN databases

---

#### 3. Email Pattern Detection

**Паттерны мошенничества:**

```
Aliases (Gmail):
john.doe+1@gmail.com
john.doe+2@gmail.com
john.doe+ref@gmail.com
→ Все идут на john.doe@gmail.com

Dots (Gmail ignores dots):
johndoe@gmail.com
john.doe@gmail.com
j.o.h.n.d.o.e@gmail.com
→ Все одинаковые

Typo domains:
john@gmail.com
john@gmai.com
john@gmial.com
→ Вариации для обхода

Disposable emails:
user@tempmail.com
user@10minutemail.com
user@guerrillamail.com
→ Временные адреса
```

**Detection logic:**
```typescript
function normalizeEmail(email: string): string {
  const [local, domain] = email.toLowerCase().split('@')

  // Gmail: remove dots and +aliases
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    const cleanLocal = local.split('+')[0].replace(/\./g, '')
    return `${cleanLocal}@gmail.com`
  }

  // Other providers: just remove +alias
  const cleanLocal = local.split('+')[0]
  return `${cleanLocal}@${domain}`
}

// Usage:
const referrerEmail = normalizeEmail(referrer.email)
const referredEmail = normalizeEmail(referred.email)

if (referrerEmail === referredEmail) {
  throw new FraudError('EMAIL_ALIAS_DETECTED')
}

// Check if similar emails used recently
const similarEmails = await findSimilarEmails(referredEmail, '30 days')
if (similarEmails.length > 3) {
  await flagForReview('MULTIPLE_SIMILAR_EMAILS', { referredId })
}
```

**Disposable email check:**
```typescript
// Use database of known disposable domains
const disposableDomains = [
  'tempmail.com',
  '10minutemail.com',
  'guerrillamail.com',
  // ... 5000+ domains
]

function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]
  return disposableDomains.includes(domain)
}

// Block or flag:
if (isDisposableEmail(newUser.email)) {
  throw new ValidationError('DISPOSABLE_EMAIL_NOT_ALLOWED')
}
```

---

#### 4. Velocity Checks

**Принцип:** Измерение скорости аномальных действий

**Метрики:**

```
User-level velocity:
- Max 3 referrals per IP per day
- Max 1 account creation per device per day
- Max 5 share actions per hour

Referrer-level velocity:
- Max 10 activations per day (уже есть в Energy Planet)
- Max 30 activations per week
- Max 100 activations per month

System-wide velocity:
- Max 50 activations from single IP per day
- Max 100 new accounts from single city per hour
```

**Implementation:**
```typescript
interface VelocityCheck {
  key: string           // user_id, ip, device_fingerprint
  action: string        // 'activation', 'registration', 'share'
  window: string        // '1h', '24h', '7d'
  limit: number
}

async function checkVelocity(check: VelocityCheck): Promise<boolean> {
  const count = await redis.get(`velocity:${check.action}:${check.key}:${check.window}`)

  if (count >= check.limit) {
    await logFraudAttempt('VELOCITY_EXCEEDED', check)
    return false
  }

  await redis.incr(`velocity:${check.action}:${check.key}:${check.window}`)
  await redis.expire(`velocity:${check.action}:${check.key}:${check.window}`, parseWindow(check.window))

  return true
}

// Usage:
await checkVelocity({
  key: referredIP,
  action: 'activation',
  window: '24h',
  limit: 3
})
```

**Redis-based sliding window:**
```typescript
// More accurate than fixed windows
async function checkSlidingVelocity(
  key: string,
  windowMs: number,
  limit: number
): Promise<boolean> {
  const now = Date.now()
  const windowStart = now - windowMs

  // Remove old entries
  await redis.zremrangebyscore(key, 0, windowStart)

  // Count entries in window
  const count = await redis.zcard(key)

  if (count >= limit) {
    return false
  }

  // Add current timestamp
  await redis.zadd(key, now, `${now}-${Math.random()}`)
  await redis.expire(key, Math.ceil(windowMs / 1000))

  return true
}
```

---

#### 5. Behavioral Analysis

**Принцип:** Реальные пользователи ведут себя иначе чем боты/фейки

**Индикаторы:**

```
Suspicious behavior (low engagement):
- Registration → Code activation в <60 секунд
- Нет interaction с игрой (0 минут playtime)
- Никаких кликов/тапов
- Immediate app close после активации
- Identical behavior patterns (bot-like)

Normal behavior:
- Registration → Onboarding → Tutorial → Code activation (10-30 мин)
- Multiple sessions over days
- Varied click patterns
- Diverse actions
```

**Minimum Activity Requirement:**
```typescript
interface ActivityRequirements {
  minPlaytimeSeconds: 300,      // 5 minutes
  minSessionCount: 2,            // At least 2 sessions
  minActionsPerformed: 10,       // 10 meaningful actions
  minDaysSinceRegistration: 1   // At least 1 day old
}

async function validateUserActivity(userId: string): Promise<boolean> {
  const stats = await getUserActivityStats(userId)

  return (
    stats.playtimeSeconds >= 300 &&
    stats.sessionCount >= 2 &&
    stats.actionsCount >= 10 &&
    stats.accountAgeDays >= 1
  )
}

// Usage during reward grant:
if (!await validateUserActivity(referredId)) {
  await delayReward(referredId, '24 hours')
  await scheduleActivityRecheck(referredId)
}
```

**Machine Learning approach:**
```python
# Train on historical data
features = [
  'time_to_activation',
  'playtime_before_activation',
  'session_count',
  'actions_performed',
  'device_type',
  'ip_reputation_score',
  'click_velocity',
  'session_gaps'
]

# Fraud score: 0 (legit) to 1 (fraud)
fraud_score = model.predict(user_features)

if fraud_score > 0.8:
  action = 'reject'
elif fraud_score > 0.5:
  action = 'manual_review'
else:
  action = 'approve'
```

---

### Prevention Techniques

#### 1. Delayed Rewards

**Принцип:** Время = возможность детектировать фрод

**Модель:**
```
Immediate: Show "Reward Pending"
24-48h: Automated fraud checks
48h+: Manual review if flagged
72h: Auto-approve if clean

Пользовательский опыт:
✅ Награда показана как "pending" (transparency)
✅ Email notification когда одобрено
✅ Если отклонено → объяснение + appeal процесс
```

**Implementation:**
```sql
CREATE TABLE pending_rewards (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  reward_type VARCHAR(50),
  reward_amount BIGINT,

  -- Fraud checks
  fraud_score DECIMAL(3,2),
  fraud_flags JSONB,
  automated_decision VARCHAR(20), -- 'approve', 'reject', 'review'

  -- Timing
  created_at TIMESTAMP,
  review_after TIMESTAMP DEFAULT NOW() + INTERVAL '24 hours',
  approved_at TIMESTAMP,
  rejected_at TIMESTAMP,

  -- Manual review
  reviewed_by UUID,
  review_notes TEXT
);
```

**Автоматизация:**
```typescript
// Cron job: каждый час
async function processПендingRewards() {
  const pending = await db.query(`
    SELECT * FROM pending_rewards
    WHERE review_after <= NOW()
    AND approved_at IS NULL
    AND rejected_at IS NULL
  `)

  for (const reward of pending) {
    const fraudScore = await calculateFraudScore(reward.user_id)

    if (fraudScore < 0.3) {
      // Auto-approve
      await approveReward(reward.id)
      await grantReward(reward.user_id, reward.reward_amount)
      await sendNotification(reward.user_id, 'REWARD_APPROVED')

    } else if (fraudScore > 0.7) {
      // Auto-reject
      await rejectReward(reward.id, 'HIGH_FRAUD_SCORE')
      await sendNotification(reward.user_id, 'REWARD_REJECTED')

    } else {
      // Manual review queue
      await flagForManualReview(reward.id, fraudScore)
    }
  }
}
```

**Статистика (Talkable):**
- 24h delay reduces fraud by 60-70%
- 80% фейковых аккаунтов abandon после задержки
- False positive rate: <5% с хорошей ML моделью

---

#### 2. Double Opt-In

**Принцип:** Подтверждение email перед активацией наград

**Flow:**
```
1. User активирует реферальный код
2. System отправляет email на referred user
3. User кликает confirmation link
4. Rewards granted

Bypass fake emails:
- Temporary email services → expire before confirmation
- Неправильные адреса → не получат письмо
- Боты → не могут открыть email
```

**Implementation:**
```typescript
async function activateReferralCode(userId: string, code: string) {
  // Validate code
  const referrer = await findReferrerByCode(code)

  // Create pending relation
  const relationId = await createPendingRelation(referrer.id, userId)

  // Send confirmation email
  const token = generateSecureToken()
  await sendConfirmationEmail(userId, {
    confirmUrl: `https://app.com/confirm-referral?token=${token}`,
    referrerName: referrer.username
  })

  // Store token
  await storeConfirmationToken(token, relationId, '48h')

  return { status: 'pending_confirmation', relationId }
}

async function confirmReferral(token: string) {
  const relationId = await validateToken(token)

  if (!relationId) {
    throw new Error('INVALID_OR_EXPIRED_TOKEN')
  }

  // Activate relation
  await activateRelation(relationId)

  // Grant rewards
  await grantActivationRewards(relationId)

  return { status: 'confirmed' }
}
```

**Email template:**
```html
Subject: Confirm your referral from {ReferrerName}!

Hi {UserName},

{ReferrerName} invited you to Energy Planet!
Click below to confirm and receive your 300⭐ welcome bonus:

[Confirm Referral] (button)

Rewards:
✨ 300 Stars
🎨 Exclusive Welcome Frame

This link expires in 48 hours.

---
Not you? Ignore this email.
```

---

#### 3. Limits & Caps

**Принцип:** Ограничения снижают привлекательность фрода

**Типы лимитов:**

```
User-level:
✅ One code activation per user (уже есть)
✅ Max 10 activations per referrer per day (уже есть)
✅ Max 5 milestone claims per day (уже есть)
⚠️ Max 3 share attempts per hour (добавить)
⚠️ Cooldown between shares: 5 minutes (добавить)

System-level:
⚠️ Max total rewards per user per day: 5000⭐
⚠️ Max total rewards per user per month: 30000⭐
⚠️ Max referrals from single IP: 5/day

Economic caps:
✅ Daily revenue share: 2000⭐ (уже есть)
✅ Monthly revenue share: 10000⭐ (уже есть)
⚠️ Lifetime referral earnings cap: 100,000⭐ (добавить)
```

**Progressive difficulty:**
```
Первые 10 рефералов: нормальный процесс
11-30 рефералов: CAPTCHA при активации
31-50 рефералов: Manual review каждого
51+ рефералов: Video verification + manual approval

Психология:
- Не блокирует легитимных power users
- Делает mass fraud непрактичным (слишком медленно)
```

---

#### 4. Monitoring & Alerts

**Принцип:** Real-time детекция аномалий

**Ключевые метрики для мониторинга:**

```typescript
interface FraudMetrics {
  // Velocity spikes
  activationsLastHour: number       // Alert if >100
  newAccountsLastHour: number       // Alert if >50
  sameIPActivations: number         // Alert if >5

  // Pattern anomalies
  avgTimeToActivation: number       // Alert if <60s
  avgPlaytimeBeforeActivation: number  // Alert if <120s
  suspiciousBehaviorRate: number    // Alert if >10%

  // Financial
  rewardsGrantedLastHour: number    // Alert if >50,000⭐
  dailyRewardBudget: number         // Alert if >budget

  // Quality
  referralRetentionD1: number       // Alert if <20%
  referralRetentionD7: number       // Alert if <10%
}
```

**Auto-alerting:**
```typescript
// Monitoring service
setInterval(async () => {
  const metrics = await calculateFraudMetrics()

  // Velocity spike
  if (metrics.activationsLastHour > 100) {
    await alert('VELOCITY_SPIKE', {
      current: metrics.activationsLastHour,
      normal: 30,
      severity: 'high'
    })
    await enableRateLimiting()
  }

  // Mass fraud pattern
  if (metrics.avgTimeToActivation < 60) {
    await alert('BOT_PATTERN_DETECTED', {
      avgTime: metrics.avgTimeToActivation,
      severity: 'critical'
    })
    await enableStrictMode()
  }

  // Budget exceeded
  if (metrics.rewardsGrantedLastHour > 50000) {
    await alert('BUDGET_EXCEEDED', {
      spent: metrics.rewardsGrantedLastHour,
      budget: 50000,
      severity: 'medium'
    })
  }

}, 5 * 60 * 1000) // Every 5 minutes
```

**Dashboard KPIs:**
```
Real-time dashboard should show:

Today:
- Activations: 234 (↑12% vs yesterday)
- Fraud rate: 8% (🟢 below 10% threshold)
- Avg time to activation: 18m (🟢 normal)
- Rewards granted: 45,000⭐ (🟢 under budget)

Flags needing review: 12 (🟡)
Auto-rejected today: 34 (🟢)
False positives reported: 2 (🟢)

Top fraud vectors:
1. Same IP (18 cases)
2. Email aliases (12 cases)
3. Device fingerprint match (8 cases)
```

---

## UX & Placement

### Strategic Timing

**Принцип:** Context and emotion matter more than visibility

**Research (GameMarketingGenie, WebEngage):**
```
Optimal moments for referral prompts:

1. After positive emotional event:
   - Just won a match: Conversion +180%
   - Unlocked achievement: Conversion +150%
   - Leveled up: Conversion +120%
   - Got rare item: Conversion +90%

2. After meaningful milestone:
   - Completed tutorial: Conversion +60%
   - First purchase: Conversion +110%
   - Reached level 10: Conversion +75%

3. Social context:
   - Viewing friends list: Conversion +50%
   - After co-op session: Conversion +140%
   - In clan/guild screen: Conversion +80%

Worst moments:
   - During match/gameplay: Conversion -70% (annoying)
   - During loading screens: Conversion -40% (ignored)
   - Random app open: Conversion baseline (0%)
```

**Implementation pattern:**
```typescript
// Event-driven prompts
enum ReferralTrigger {
  PVP_WIN = 'pvp_win',
  ACHIEVEMENT_UNLOCK = 'achievement_unlock',
  LEVEL_UP = 'level_up',
  RARE_ITEM_DROP = 'rare_item_drop',
  TUTORIAL_COMPLETE = 'tutorial_complete',
  FIRST_PURCHASE = 'first_purchase'
}

async function onGameEvent(event: GameEvent, userId: string) {
  // Check if event is referral trigger
  if (Object.values(ReferralTrigger).includes(event.type)) {

    // Check eligibility
    const eligible = await checkReferralPromptEligibility(userId, {
      trigger: event.type,
      cooldown: '24h',        // Don't spam
      maxDismissals: 3,       // Give up after 3× dismissed
      minAccountAge: '7d'     // Don't prompt new users immediately
    })

    if (eligible) {
      await showReferralPrompt(userId, {
        trigger: event.type,
        context: event.data,
        emphasize: getEmphasis(event.type)
      })
    }
  }
}

function getEmphasis(trigger: ReferralTrigger): string {
  switch(trigger) {
    case 'pvp_win':
      return "🎉 Awesome win! Invite friends to challenge them!"
    case 'achievement_unlock':
      return "🏆 Achievement unlocked! Share your success and earn rewards!"
    case 'level_up':
      return "⬆️ Level {level}! Invite friends to celebrate!"
    default:
      return "Invite friends and earn stars!"
  }
}
```

---

### Placement Best Practices

**Multi-touchpoint strategy:**

```
Priority 1 (Proactive):
✅ Post-win modal
✅ Achievement notification
✅ Level up screen
✅ Friends screen (when opening)

Priority 2 (Discoverable):
✅ Settings screen
✅ Profile screen
✅ Main menu (small widget)
✅ Shop/store (as earning option)

Priority 3 (Contextual):
✅ Empty friends list ("Invite friends to get started!")
✅ Clan creation ("Invite members for bonuses!")
✅ Co-op matchmaking ("Invite friend for bonus rewards!")

❌ Avoid:
- During gameplay (intrusive)
- Loading screens (ignored)
- Random pop-ups (annoying)
- Too frequent (fatigue)
```

**Visual hierarchy:**
```
High-visibility triggers:
- Full-screen modal (after major event)
- Large animated card
- Prominent CTA button
- Preview of rewards

Medium-visibility static:
- Card in scrollable feed
- Menu item with badge
- Profile section

Low-visibility passive:
- Settings option
- Footer link
- Help section
```

---

### Share UX Optimization

**Best Practices:**

#### Pre-populated Messages
```
Bad:
"Check out this game!"

Good:
"Hey! I'm playing Energy Planet and just hit level 20! 🚀
Join me with code EP-XY8K and get 300⭐ to start!
Download: [link]"

Great (personalized):
"Hey {Friend Name}!
I just unlocked the Galaxy Frame in Energy Planet! 🌌
Want to join? Use my code EP-XY8K for 300⭐ bonus!
We can team up in co-op mode 🎮
[link]"
```

**Elements of good message:**
- ✅ Personal touch (sender's achievement)
- ✅ Clear value prop (300⭐ bonus)
- ✅ Emotional hook (emojis, excitement)
- ✅ Social element ("we can team up")
- ✅ Easy action (code + link)

#### Platform-Specific Sharing

```typescript
interface ShareOptions {
  telegram: {
    method: 'WebApp.openTelegramLink',
    format: 'inline message',
    startapp: true          // Auto-fill code
  },

  whatsapp: {
    method: 'Web Share API',
    format: 'text + link'
  },

  native: {
    method: 'navigator.share',
    fallback: 'copy to clipboard'
  }
}

// Example implementation:
async function share(platform: 'telegram' | 'whatsapp' | 'native') {
  const message = generatePersonalizedMessage()

  switch(platform) {
    case 'telegram':
      const startapp = `ref_${userReferralCode}`
      const url = `https://t.me/share/url?url=${appUrl}&text=${message}&startapp=${startapp}`
      window.Telegram.WebApp.openTelegramLink(url)
      break

    case 'whatsapp':
      const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
      window.open(waUrl)
      break

    case 'native':
      if (navigator.share) {
        await navigator.share({ title: 'Energy Planet', text: message, url: appUrl })
      } else {
        await navigator.clipboard.writeText(message)
        showToast('Message copied!')
      }
      break
  }

  // Track
  await trackShare(platform)
}
```

---

## Analytics & Optimization

### Key Metrics to Track

#### Funnel Metrics
```
Referral Funnel:
1. Code Generated (100%)
2. Code Shown to User (80%)
3. Share Clicked (20%)
4. Share Completed (15%)
5. Link Opened by Friend (8%)
6. Friend Registered (5%)
7. Code Activated (3%)

→ Overall Conversion: 3%

Optimization:
- Biggest drop: Share clicked → completed (-25%)
  Fix: Reduce friction, better UX
- Second drop: Link opened → registered (-37.5%)
  Fix: Better landing page, clearer value prop
```

#### Quality Metrics
```sql
-- Referral vs Organic comparison
SELECT
  source,
  COUNT(*) as users,
  AVG(retention_d1) as d1_retention,
  AVG(retention_d7) as d7_retention,
  AVG(retention_d30) as d30_retention,
  AVG(ltv_30d) as ltv_30d,
  AVG(sessions_per_week) as engagement
FROM user_cohorts
GROUP BY source

Results (typical):
Organic:   D7=35%, D30=15%, LTV=$2.50, Engagement=8 sessions/week
Referral:  D7=45%, D30=22%, LTV=$3.80, Engagement=12 sessions/week
          (+28%    +47%     +52%      +50%)

→ Referrals are HIGHER QUALITY
```

#### Viral Coefficient (K-factor)
```
Formula: K = i × c
Where:
  i = invitations sent per user
  c = conversion rate of invitations

Example:
  i = 2.5 (average user sends 2.5 invites)
  c = 0.15 (15% of invites convert)
  K = 2.5 × 0.15 = 0.375

Interpretation:
  K < 1: Sub-viral (shrinking)
  K = 1: Viral equilibrium
  K > 1: Super-viral (exponential growth)

Target: K = 0.8-1.2 for sustainable growth
```

**Calculation code:**
```typescript
async function calculateViralCoefficient(period: string): Promise<number> {
  const stats = await db.query(`
    SELECT
      COUNT(DISTINCT referrer_id) as referrers,
      COUNT(DISTINCT referred_id) as referrals,
      SUM(CASE WHEN share_count > 0 THEN 1 ELSE 0 END) as sharers
    FROM referral_relations
    WHERE activated_at >= NOW() - INTERVAL '${period}'
  `)

  const invitationsPerUser = stats.referrals / stats.referrers
  const conversionRate = stats.referrals / (stats.sharers * avgInvitesPerShare)

  const kFactor = invitationsPerUser × conversionRate

  return kFactor
}
```

---

### A/B Testing Framework

**What to test:**

#### Reward Amounts
```
Test: Invitee reward
Variant A: 200⭐
Variant B: 300⭐ (control)
Variant C: 500⭐

Measure:
- Activation rate
- Referrer satisfaction (survey)
- Cost per acquisition
- Quality of referrals (retention)

Expected results:
- Activation: C > B > A
- Cost: C > B > A
- Quality: B ≈ C > A (too low → lower quality)
- ROI: B optimal (sweet spot)
```

#### Milestone Structure
```
Test: Milestone thresholds
Variant A: 1, 5, 15, 30 (current)
Variant B: 1, 3, 7, 15, 30 (recommended)
Variant C: 2, 5, 10, 20, 50

Measure:
- % reaching each tier
- Time to each tier
- Total referrals per user
- Drop-off points

Hypothesis: Variant B will have highest engagement
```

#### Share Messages
```
Test: Message tone
Variant A: Formal ("Join Energy Planet with my code")
Variant B: Casual ("Hey! Playing this awesome game, join me!")
Variant C: Benefit-focused ("Get 300 free stars with my code!")
Variant D: FOMO ("Limited time: 2× bonuses this weekend!")

Measure:
- Share completion rate
- Link click rate
- Activation rate
- Perceived spam (user feedback)
```

**Implementation:**
```typescript
// Simple A/B test framework
interface ABTest {
  id: string
  variants: {
    id: string
    weight: number      // Traffic allocation %
    config: any
  }[]
}

async function getVariant(userId: string, testId: string): Promise<any> {
  // Consistent hash (same user always gets same variant)
  const hash = murmurhash(`${userId}-${testId}`)
  const bucket = hash % 100

  const test = await getABTest(testId)
  let cumulative = 0

  for (const variant of test.variants) {
    cumulative += variant.weight
    if (bucket < cumulative) {
      await logAssignment(userId, testId, variant.id)
      return variant.config
    }
  }
}

// Usage:
const rewardConfig = await getVariant(userId, 'invitee_reward_test')
const inviteeReward = rewardConfig.stars  // 200, 300, or 500
```

---

## Case Studies

### 1. Dropbox (B2C SaaS)

**Program:**
- Invitee: +500MB storage
- Referrer: +500MB per referral (up to 16GB)

**Results:**
- 3900% growth in 15 months
- 35% of daily signups from referrals
- 10× cheaper than paid advertising

**Keys to success:**
- Perfect product-market fit (everyone needs storage)
- Inherent virality (sharing files = showing product)
- Valuable reward (storage = core product value)
- Simple UX (one-click share)

**Takeaways for Energy Planet:**
✅ Reward должна быть core currency (stars ✓)
✅ Simple activation flow ✓
⚠️ Need better viral loops (friends playing together)

---

### 2. World of Warcraft - Recruit-A-Friend

**Program:**
- Referrer gets:
  * Unique mounts & pets (exclusive)
  * Free game time tokens
  * 3× XP when playing WITH friend
- Friend gets:
  * Free trial
  * XP boost
  * Level 90 boost

**Results:**
- Millions of referrals over 15+ years
- Higher retention than any other acquisition channel
- Legendary status rewards (some mounts only obtainable this way)

**Keys to success:**
- Gameplay integration (3× XP together = play together)
- Exclusive rewards (FOMO, status)
- Long-term value (not one-time)
- Social bonding (co-op leveling)

**Takeaways for Energy Planet:**
❌ Missing gameplay integration (critical gap)
❌ Missing co-op bonuses
✅ Exclusive cosmetics ✓
✅ Long-term revenue share ✓

---

### 3. HQ Trivia (Mobile Game)

**Program:**
- Referrer gets: 1 extra life per referral
- Friend gets: standard onboarding

**Results:**
- 50%+ user acquisition via referrals
- Lives had real value (= $$ in prize pool)
- Viral coefficient: 1.2 (super-viral)

**Keys to success:**
- Reward tied to gameplay (lives = playing longer)
- Scarcity (limited lives per game)
- Timing (prompt after losing)
- Social proof ("Your friend invited you!")

**Takeaways for Energy Planet:**
⚠️ Should tie rewards to gameplay mechanics
✅ Scarcity works (limited events, exclusive cosmetics)
❌ Need better timing triggers

---

### 4. Clash of Clans (Mobile Strategy)

**Program:**
- Recruiting clanmates
- Clan perks for active members
- Special events for full clans

**Results:**
- 90%+ clans formed via referrals
- Clan members have 3× retention vs solo players
- Social pressure keeps players engaged

**Keys to success:**
- Guild/clan system (social binding)
- Team rewards (everyone benefits)
- Social pressure (don't let clan down)
- Communication tools (in-game chat)

**Takeaways for Energy Planet:**
✅ Clan system exists
❌ No referral integration with clans
❌ No team-based referral rewards

---

## Summary Checklist

Use this checklist to audit your referral program:

### Core Mechanics
- [ ] Two-sided rewards (invitee + referrer)
- [ ] Multiple reward tiers (milestones)
- [ ] Easy code generation and sharing
- [ ] Mobile-optimized UX
- [ ] Deep linking / auto-fill codes

### Gamification
- [ ] Public leaderboards
- [ ] Progress visualization (bars, maps)
- [ ] Badges and achievements
- [ ] Seasonal competitions
- [ ] Visual rewards (cosmetics, titles)

### Fraud Prevention
- [ ] Device fingerprinting
- [ ] IP address tracking
- [ ] Email pattern detection
- [ ] Velocity checks
- [ ] Delayed rewards (24-48h)
- [ ] Minimum activity requirements
- [ ] Manual review queue
- [ ] Automated fraud scoring

### UX & Engagement
- [ ] Smart placement (post-win, achievement, etc)
- [ ] Platform-specific sharing (Telegram, WhatsApp)
- [ ] Pre-populated messages
- [ ] Visual reward preview
- [ ] Share tracking and analytics

### Analytics
- [ ] Funnel tracking (generate → share → activate)
- [ ] Viral coefficient (K-factor)
- [ ] Quality metrics (retention, LTV)
- [ ] A/B testing framework
- [ ] Cohort analysis
- [ ] ROI tracking

### Optimization
- [ ] Regular A/B tests (rewards, messages, timing)
- [ ] Fraud rate monitoring (<10%)
- [ ] Conversion rate optimization
- [ ] User feedback collection
- [ ] Competitive benchmarking

---

**Energy Planet Score:**
```
Core Mechanics: ✅✅✅✅⚠️ (4.5/5)
Gamification: ⚠️⚠️❌❌❌ (2/5)
Fraud Prevention: ❌❌❌❌⚠️ (0.5/5)
UX & Engagement: ⚠️⚠️⚠️❌❌ (1.5/5)
Analytics: ❌❌❌❌⚠️ (0.5/5)
Optimization: ❌❌❌⚠️⚠️ (1/5)

Overall: 10/30 → 6.5/10
```

**Priority improvements:**
1. Fraud Prevention (0.5/5 → 4/5) - CRITICAL
2. Gamification (2/5 → 4.5/5) - HIGH IMPACT
3. UX & Engagement (1.5/5 → 4/5) - QUICK WINS
4. Analytics (0.5/5 → 3.5/5) - ENABLE OPTIMIZATION

---

**References:**
- Viral Loops: "15 Referral Program Best Practices 2025"
- ReferralRock: "Gamified Referral Programs Guide"
- SEON: "Referral Fraud Prevention"
- Fingerprint: "Device Identification for Fraud Detection"
- AppSamurai: "In-App Referral Programs"
- GameMarketingGenie: "Referral Marketing for Mobile Games"
