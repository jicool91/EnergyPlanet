# Energy Planet: Balance Analysis vs Best Practices

**Analysis Date:** October 26, 2025

---

> **Обновление (25 октября 2025).** После внедрения новой итерации экономики:
> - Престиж реализован (`POST /prestige`): множитель увеличивается на `floor((energy_since_prestige / 1e12)^{1/3})`, применяется ко всем источникам дохода.
> - Апгрейды зданий используют кусочно-экспоненциальную формулу: до 25-го уровня множители 1.20/1.22/1.24/1.26 (типы 1–4), после 25-го — сглаженные 1.10/1.12/1.14/1.16.
> - Кап опыта динамический: 40 % до 100 lvl, 33 % на 100–299, 28 % на 300–599, 25 % на 600+, демпфер ослаблен (`base=400`, `exponent=1.3`).
> - Boost Hub читает конфиг: рекламный ×1.8 на 10 мин с кулдауном 30 мин, дневной ×1.5 на 15 мин, премиум ×2.5.
> Детальная сверка — в `docs/ENERGY_PLANET_BALANCE_RECONCILIATION.md`.

## Executive Summary

Energy Planet's game balance по-прежнему **выглядит здорово**, а свежие правки закрыли прежние критические риски. Текущий фокус:

1. ✅ **Income scaling** — сохраняет правильный переход tap → passive.
2. ✅ **Prestige system** — внедрена; контролируйте ретеншн и темп мультипликатора.
3. ⚠️ **XP transaction cap** — динамический (40 % → 33 % → 28 % → 25 %), наблюдать ощущение прогресса на 300+ уровнях.
4. ⚠️ **Cost scaling в поздней игре** — софт-кэп после 25 уровня сгладил стену, но тира 4 стоит дополнительно тестировать.

---

## 1. Income Analysis

### 1.1 Tap Income Formula

**Current Implementation:**
```typescript
tap_income = 1 × (1 + tapLevel × 0.15) × (1 + boost_percentage)
```

**Comparison with Best Practices:**
- ✅ **Base income:** 1 is correct
- ✅ **Multiplier:** 0.15 per level is industry standard (0.15-0.20 range)
- ✅ **Boost stacking:** Multiplicative (correct, not additive)

**Verdict:** EXCELLENT - Matches Cookie Clicker standards

**Sample progression:**
```
Level 0: 1.0 income
Level 5: 1.75 income
Level 10: 2.50 income
Level 20: 4.00 income
```

---

### 1.2 Passive Income Formula

**Current Implementation:**
```typescript
passive_income = Σ(building_base_income × count × (1 + level × 0.20))
```

**Comparison:**
- ✅ **Building upgrade bonus:** 0.20 (20% per level) is industry standard
- ✅ **Stacking:** Additive within buildings, multiplicative with boosts (correct)
- ✅ **Formula structure:** Matches standard design

**Verdict:** EXCELLENT

**Key insight from GDD:**
```
Early game (L1-5):   70% tap, 30% passive
Mid game (L5-15):    40% tap, 60% passive
Late game (L15+):    20% tap, 80% passive
```

This progression is **textbook perfect** for engagement.

---

### 1.3 Income-to-Cost Ratio

**Analysis:** Does cost growth exceed income growth?

**Tap Income Growth:**
```
Linear: 1 + level × 0.15
Growth rate per level: +0.15 (+15%)
```

**Building Purchase Cost Growth:**
```
Exponential: base_cost × 1.12^count
Growth rate: 12% per building
```

**Building Upgrade Cost Growth:**
```
Exponential: (base_cost × 5) × 1.25^level
Growth rate: 25% per level (FASTER)
```

**Analysis:**
- Tap growth: +15% per level (LINEAR)
- Building growth: +12% per building (EXPONENTIAL)
- Upgrade growth: +25% per level (EXPONENTIAL, FASTEST)

✅ **This is correct!** Exponential costs >> Linear income growth

**Result:** Players naturally progress from:
- Tap-focused (early) → Building focused (mid) → Upgrade focused (late)

---

## 2. Cost Analysis

### 2.1 Building Purchase Costs

**Current Implementation:**
```typescript
building_cost(count) = base_cost × (1.12 ^ count)
```

**Comparison with Standards:**
- Cookie Clicker: 1.15x (more expensive)
- Realm Grinder: 1.10x (cheaper)
- Energy Planet: 1.12x (balanced sweet spot)

**Verdict:** ✅ GOOD - Slightly easier than Cookie Clicker, rewards early players

**Time-to-Purchase Analysis** (assuming 10 E/sec passive):
```
Tier 1 building (base 500E):
- 1st: 500E = 50 seconds
- 5th: 881E = 88 seconds
- 10th: 1,552E = 155 seconds
- Total for 10: ~20 minutes (good pacing)

Tier 2 building (base 8,000E):
- 1st: 8,000E = 13 minutes
- 5th: 14,148E = 23 minutes
- 10th: 24,921E = 42 minutes
```

**Verdict:** ✅ EXCELLENT - Pacing feels rewarding without being grindy

---

### 2.2 Upgrade Costs

**Current Implementation:**
```typescript
upgrade_cost(level) = (base_cost × 5) × (1.25 ^ level)
```

**Comparison:**
- Multiplier (5x base): ✅ Industry standard
- Growth rate (25%): ✅ Steeper than purchases (correct)

**Verdict:** ✅ GOOD

**Why 1.25 > 1.12?**
- Encourages buying more buildings rather than maxing one
- Prevents early "mega-building" strategies
- Creates natural progression gates

**However:** May be TOO steep in late game (see section 5.2)

---

### 2.3 Tap Upgrade Costs

**Current Implementation:**
```typescript
tap_upgrade_cost(level) = 100 × (1.15 ^ level)
```

**Sample progression:**
```
Level 1: 100E
Level 5: 201E
Level 10: 405E
Level 15: 816E
Level 20: 1,637E
Level 50: 163,789E
```

**Comparison:**
- ✅ Base cost (100E) is accessible
- ✅ Growth rate (1.15) prevents tap dominance
- ✅ By level 20, tap income is expensive relative to building income

**Verdict:** ✅ EXCELLENT

**Design insight:**
This makes tap upgrades attractive early but naturally transitions to building focus by mid-game.

---

## 3. XP & Progression Analysis

### 3.1 Level Progression Formula

**Current Implementation:**
```typescript
if (level <= 100):
  xp = 100 × level^1.5

if (100 < level <= 1000):
  xp = xp_at_100 + constant × (level - 100)

if (level > 1000):
  xp = xp_at_1000 + quadratic × (level - 1000)^2
```

**Comparison with Best Practices:**
- ✅ **Exponent 1.5:** Perfect for 1.5-2.0 range
- ✅ **Soft caps:** Properly implemented at 100, 1000, 2000
- ✅ **Late game safety:** Quadratic scaling prevents infinity

**Verdict:** ⭐ EXCELLENT - Better than many published games

**Sample progression:**
```
Level 1→2: 100 XP
Level 10→11: 3,162 XP
Level 20→21: 8,944 XP
Level 50→51: 35,355 XP
Level 100→101: 100,000 XP (soft cap switches to linear)
Level 500→501: 400,000 XP (linear phase)
Level 1000→1001: ~10M XP (quadratic phase begins)
```

**Time analysis** (assuming 1 XP per 10 energy):
```
Tap baseline: 1 E/tap → 0.1 XP/tap
Level 1→10: ~1-2 hours (matches GDD target)
Level 10→20: ~5-8 hours (reasonable for mid-game)
Level 20→50: ~40-60 hours (deep late-game)
```

✅ **Pacing is perfect for engagement targets in GDD**

---

### 3.2 XP from Taps

**Current Implementation:**
```typescript
xp_from_energy = energy / 10
```

**Analysis:**
- Ratio: 1 XP per 10 energy
- This means 1 tap = 0.1 XP (assuming base 1 energy)
- 10 taps needed per XP gained

**Comparison:**
- ✅ Reasonable ratio (not too generous, not grindy)
- ✅ Creates natural incentive to focus on buildings

**Verdict:** ✅ GOOD

---

### 3.3 XP from Transactions (Purchase & Upgrade)

**Current Implementation:**
```typescript
purchase_xp = (cost^0.75) × 2.7 (with cap)
upgrade_xp = (cost^0.7) × 1.2 (with cap)

Transaction cap = level_threshold_xp × 0.25
```

**Comparison with Best Practices:**
- ✅ **Power law exponent:** 0.70-0.75 is standard
- ✅ **Coefficients:** Calibrated to avoid trivial/massive XP
- ✅ **Cap system:** 25% of level threshold is reasonable

**Verdict:** ✅ GOOD, but see section 5.2

**Example:**
```
Cost 1,000E:
- Purchase: 1000^0.75 × 2.7 ≈ 204 XP (before cap)
- Upgrade: 1000^0.7 × 1.2 ≈ 71 XP (before cap)
- Both capped at 25% of current level's threshold

Cap prevents:
- Spending entire bank on one transaction
- Rushing through multiple levels at once
- "Gaming" the progression system
```

**However:** Cap may be TOO STRICT (see section 5.2)

---

## 4. Boost System Analysis

### 4.1 Boost Stacking

**Current Implementation:**
```typescript
total_multiplier = Π(1 + boost_i) - 1
```

**Example:**
```
Ad Boost (100%) + Premium (200%) = (1 + 1.0) × (1 + 2.0) - 1 = 5.0 = 500%
```

**Verdict:** ✅ EXCELLENT - Matches Cookie Clicker standard

---

### 4.2 Boost Types & Duration

**From GDD:**

| Boost Type | Duration | Effect | Stack | Cost |
|-----------|----------|--------|-------|------|
| Ad Boost | 5 min | +100% tap | ✅ | FREE |
| Premium | 1 hour | +200% all | ✅ | 50 Stars |
| Daily | 10 min | +50% tap | ✅ | FREE |

**Comparison with Industry Standards:**
- ✅ Ad boosts: 5 min is standard (YouTube, TikTok viewer attention)
- ✅ Premium: 1-7 hours is standard range (good monetization)
- ⚠️ Stacking: May be too generous (see section 5.1)

**Verdict:** ✅ GOOD overall, slightly generous on stacking

---

### 4.3 Monetization Targets

**Current GDD targets:**
```
Stars ARPDAU: $0.10 (10% payers × $1 ARPPU)
Ad ARPDAU: $0.05
Total ARPDAU: $0.15
```

**Comparison:**
- Small/casual games: $0.05-0.10 ARPDAU
- Mid-tier games: $0.10-0.30 ARPDAU
- Large games: $0.30+ ARPDAU

✅ **Targets are realistic for Telegram ecosystem**

---

## 5. Problem Areas & Recommendations

### 5.1 ⚠️ Problem: Boost Stacking May Be Too Generous

**Issue:**
```
With multiplicative stacking:
- Base passive: 100 E/sec
- Ad boost (100%): 200 E/sec
- Premium boost (200%): 600 E/sec
- Both: (1+1)(1+2)-1 = 500%: 600 E/sec

This is mathematically correct but:
- Players can "farm" money during boost windows
- Reduces incentive to progress legitimately
- May suppress spending on new buildings
```

**Best Practice:**
- Some games use additive stacking for boosts
- Some limit to 2-3 active boosts simultaneously
- Some use soft caps per boost type

**Recommendation (Optional):**
```typescript
// If you want to reduce boost power:
Option A: Reduce multipliers
  - Ad boost: +50% (not 100%)
  - Premium: +100% (not 200%)

Option B: Limit simultaneous boosts
  - Max 1 premium boost + 1 ad boost + daily boost
  - Prevents "triple stack" scenarios

Option C: Add diminishing returns
  total_multiplier = Math.min(Π(1 + boost_i), max_cap)
  - Cap at 5x or 10x total
```

**Current State:** ✅ Acceptable, but monitor in playtesting

---

### 5.2 ⚠️ Problem: XP Transaction Cap Is Too Strict

**Current Formula:**
```
cap = level_threshold_xp × 0.25
```

**Example (Level 30):**
```
Level 30 threshold: ~164,924 XP
Transaction cap: 0.25 × 164,924 = 41,231 XP

Spending 100,000 E on one building:
- Raw XP: 100,000^0.75 × 2.7 ≈ 7,628 XP
- Capped at: 41,231 XP
- Actually applied: 7,628 XP (no cap reached)

Spending 500,000 E on one building:
- Raw XP: 500,000^0.75 × 2.7 ≈ 29,842 XP
- Capped at: 41,231 XP
- Actually applied: 29,842 XP (no cap reached)

Spending 1,000,000 E (entire bank):
- Raw XP: 1,000,000^0.75 × 2.7 ≈ 53,955 XP
- Capped at: 41,231 XP
- Actually applied: 41,231 XP (CAPPED!)
```

**Problem:**
- Players spending their entire bank feel punished
- Makes late-game "splurges" feel less rewarding
- Industry standard cap: 33-50% of level threshold

**Recommendation:**
```typescript
// Option 1: Increase cap
cap = level_threshold_xp × 0.33  // was 0.25
// Allows more single-transaction XP

// Option 2: Reduce purchase XP further
// But cap at higher percentage
purchase_xp = (cost^0.65) × 2.0  // lower exponent
cap = level_threshold_xp × 0.25   // keep cap

// Option 3: Dynamic cap based on level
if (level < 50):
  cap = threshold × 0.50  // generous early
else if (level < 100):
  cap = threshold × 0.33  // moderate mid
else:
  cap = threshold × 0.25  // strict late
```

**Current State:** ⚠️ Slightly punitive, adjust based on playtesting

---

### 5.3 ⚠️ Problem: Building Upgrade Costs Scale Too Fast in Late Game

**Current Formula:**
```
upgrade_cost = (base_cost × 5) × (1.25^level)
```

**Issue Analysis:**
```
Tier 1 building (base 500):
- Level 0→1: 2,500 E
- Level 5→6: 7,629 E
- Level 10→11: 23,283 E
- Level 20→21: 224,709 E
- Level 50→51: 35,891,578 E

By level 50, upgrading a single Tier 1 building costs
35 million energy - completely unreasonable!
```

**Comparison:**
- 1.25 growth: Very steep
- 1.15 growth: Moderate
- 1.12 growth: Gentle

**Problem:**
- Creates "upgrade dead zone" around level 30+
- Players abandon building upgrades entirely
- Passive income upgrades become irrelevant

**Recommendation:**
```typescript
// Option 1: Reduce growth rate for late game
upgrade_cost(level) = {
  if (level < 20):
    (base_cost × 5) × (1.25^level)
  else:
    (base_cost × 5) × (1.15^20) × (1.12^(level-20))
}

// Option 2: Use soft caps like XP
if (level < 30):
  cost = (base_cost × 5) × (1.25^level)
else:
  cost_at_30 + (constant × (level - 30))

// Option 3: Keep building upgrades capped at reasonable level
max_upgrade_level = Math.min(current_level, player_level / 2)
```

**Current State:** ⚠️ High risk of engagement cliff around level 25-30

---

### 5.4 ✅ Prestige System (Implemented)

**Статус:** Доступно через `POST /prestige`. Сбрасывает уровень, энергию, инвентарь и активные бусты, но увеличивает постоянный множитель: `prestige_multiplier += floor((energy_since_prestige / 1e12)^{1/3})`.

**Текущий эффект:**
- Первое прохождение (≈1e12 энергии) → множитель ×2.
- Каждое последующее увеличение в 8 раз даёт ещё +1 к множителю.
- Множитель применяется к тапу и пассиву, отображается в профиле и сессии.

**Что проверить на плейтестах:**
- Время до первого престижа (целевой уровень 45–55).
- Насколько быстро растёт множитель после 5+ престижа (не допускать runaway >×50).
- Запросить фидбек на «ощущение нуля»: нужно ли автополучение стартовой Solar Panel или бонус к энергии.

**Следующие шаги:**
- Добавить косметику/ачивки за определённый `prestige_level`.
- Логировать `prestige_gain` и время между престижами для балансовой аналитики.

---

## 6. Detailed Comparison Table

| Aspect | Best Practice | Energy Planet | Status |
|--------|-------------|----------------|--------|
| **Income** | | | |
| Tap income scaling | 0.10-0.20 per level | 0.15 | ✅ OPTIMAL |
| Passive income multiplier | 0.15-0.25 per level | 0.20 | ✅ OPTIMAL |
| Boost stacking | Multiplicative | Multiplicative | ✅ CORRECT |
| Income balance | Tap→Passive shift | 70%→30%→80% | ✅ EXCELLENT |
| **Costs** | | | |
| Building purchase growth | 1.12-1.15 | 1.12 | ✅ GOOD |
| Building upgrade growth | 1.20-1.30 | 1.25 | ✅ GOOD (but steep) |
| Tap upgrade growth | 1.15+ | 1.15 | ✅ OPTIMAL |
| Cost > Income growth | YES | YES | ✅ CORRECT |
| **Progression** | | | |
| XP exponent | 1.5-2.0 | 1.5 | ✅ OPTIMAL |
| XP soft caps | Recommended | 100, 1000, 2000 | ✅ EXCELLENT |
| Transaction cap | 25-50% threshold | 25% | ⚠️ STRICT |
| Purchase XP formula | Power law 0.65-0.80 | 0.75 | ✅ OPTIMAL |
| **Boosts** | | | |
| Free boost frequency | Unlimited or 1/hr | Unlimited | ⚠️ MAY BE GENEROUS |
| Premium boost cost | 50-500 currency | 50-2000 Stars | ✅ GOOD |
| Premium multiplier | 2-5x | 2-3x (100-200%) | ✅ GOOD |
| **Late Game** | | | |
| Prestige system | Required | Implemented (reset + multiplier) | ✅ READY |
| Upgrade dead zone | Should not exist | Exists at L30+ | ⚠️ HIGH RISK |
| Progression soft cap | Yes | Partial | ⚠️ NEEDS WORK |
| **Anti-Cheat** | | | |
| Tap rate limiting | 10-30 /sec | 30 /sec | ✅ GOOD |
| Energy gain validation | ±10-15% tolerance | Monitored | ✅ GOOD |
| Purchase idempotency | Required | Implemented | ✅ GOOD |

---

## 7. Risk Assessment

### Critical Issues (Fix before launch)
1. **Prestige System** - Отслеживать метрики и UX, добавить косметику
   - Risk Level: 🔴 CRITICAL
   - Impact: Player churn at Level 30-50
   - Timeline: 2-3 days to implement

### High Priority Issues (Fix for MVP)
2. **Building Upgrade Costs** - Scale too fast after Level 20
   - Risk Level: 🟠 HIGH
   - Impact: Gameplay cliff, frustration
   - Timeline: 1 day to test and tune

3. **XP Transaction Cap** - May be too punitive
   - Risk Level: 🟠 HIGH
   - Impact: Late-game progression feels slow
   - Timeline: Easy tuning parameter

### Medium Priority Issues (Post-launch)
4. **Boost Stacking** - May reduce monetization incentive
   - Risk Level: 🟡 MEDIUM
   - Impact: Lower spending rates
   - Timeline: Monitor in playtesting

---

## 8. Recommendations Summary

### Immediate Actions (Before MVP)

1. **Prestige System telemetry & UX**
   ```typescript
   // уже в продакшн: множитель накапливается по энергии с момента последнего престижа
   // TODO: добавить аналитические события prestige_available/prestige_skipped
   ```

2. **Fix Building Upgrade Cost Cliff**
   ```typescript
   // Apply soft cap at Level 25
   if (level >= 25):
     // Use linear scaling instead of exponential
     cost = cost_at_25 + (constant_rate × (level - 25))
   ```

3. **Tune XP Transaction Cap**
   ```typescript
   // Option: Increase from 0.25 to 0.33
   cap = level_threshold_xp × 0.33

   // This allows:
   // - More flexibility in spending
   // - Still prevents extreme rushes
   // - Better pacing at Level 30+
   ```

### Post-MVP Improvements

1. **Monitor Boost Monetization**
   - Track spending on premium boosts
   - If < 5% of players spend, reduce ad boost power
   - If > 30% of players spend, boost is too expensive

2. **Add Prestige Cosmetics**
   - Frames that show prestige level (cosmetics every 5 prestiges)
   - Encourages continued play

3. **Consider Seasonal Content**
   - Time-limited events with exclusive buildings/cosmetics
   - Proven engagement multiplier

---

## 9. Conclusion

**Overall Assessment:** ⭐⭐⭐⭐ (4/5 stars)

Energy Planet's game design is **well above average** for idle games. The formulas are calibrated correctly, the income balance is textbook perfect, and the progression is thoughtful.

**Key Strengths:**
- ✅ Excellent tap-to-passive income transition
- ✅ Proper exponential cost scaling
- ✅ Advanced XP system with soft caps
- ✅ Good anti-cheat validation

**Key Weaknesses:**
- ❌ Missing prestige system (critical gap)
- ⚠️ Building upgrade cost cliff at late game
- ⚠️ XP cap may be too strict
- ⚠️ No long-term goal mechanism

**Playtesting Focus:**
- Test progression from Level 1-50 with actual players
- Monitor engagement cliff around Level 30
- Collect metrics on prestige urgency
- Validate XP cap frustration with power players

**Time to Fix:** 2-4 days for critical issues, ready to soft-launch

---

**Analysis By:** AI Game Balance Review
**Date:** October 26, 2025
**Game:** Energy Planet
**Version:** MVP Specification
