# Game Balance Summary: Energy Planet vs Best Practices

**Last Updated:** October 26, 2025
**Status:** ⭐⭐⭐⭐ (4/5 stars)

---

> **Обновление (25 октября 2025).**
> - Престиж реализован: множитель растёт по `floor((energy_since_prestige / 1e12)^{1/3})`, сбрасывая энергию, уровни и строения.
> - Апгрейды зданий имеют софт-кэп после 25-го уровня (множители 1.20/1.22/1.24/1.26 → 1.10/1.12/1.14/1.16).
> - XP-кап стал динамическим (40 % → 33 % → 28 % → 25 %), демпфер ослаблен.
> - Boost Hub читает значения из `content/flags/default.json` (реклама ×1.8 на 10 мин / кулдаун 30 мин, дневной ×1.5 на 15 мин, премиум ×2.5).

## Quick Overview

Energy Planet has **excellent game balance** that closely follows industry best practices established by games like Cookie Clicker, Idle Heroes, and Realm Grinder. However, there are **4 actionable findings** that need attention.

| Category | Rating | Comment |
|----------|--------|---------|
| Income Scaling | ✅ EXCELLENT | Tap→Passive shift perfectly balanced |
| Cost Scaling | ✅ GOOD | Exponential costs > Linear income (correct) |
| Progression System | ⭐ EXCELLENT | XP soft caps are industry-leading |
| Boost System | ✅ GOOD | Multiplicative stacking, correct monetization |
| **Prestige System** | ✅ READY | Реализовано, множитель накапливается |
| **Late Game Scaling** | ⚠️ MONITOR | Софт-кэп после 25 уровня, отслеживать тир 4 |

---

## Key Findings

### 1. ✅ Income Design (EXCELLENT)

**What you got right:**
```
Tap multiplier:  0.15 per level ✅
Passive multiplier: 0.20 per level ✅
Income balance: 70/30 → 40/60 → 20/80 ✅
Boost stacking: Multiplicative (correct) ✅
```

This exactly matches Cookie Clicker's proven design.

---

### 2. ✅ Cost Scaling (GOOD)

**What you got right:**
```
Building purchase: 1.12^count ✅
Building upgrade: 1.25^level ✅
Tap upgrade: 1.15^level ✅

All satisfy: Cost growth > Income growth ✓
```

**Assessment:**
- Buildings are perfectly priced (easier than Cookie Clicker's 1.15)
- Tap upgrades don't dominate (1.15 is standard)
- Upgrade scaling is steep but appropriate for mid-game

---

### 3. ⭐ Progression System (EXCELLENT)

**What you got right:**
```
Base formula: 100 × level^1.5 ✅
Soft cap at level 100 ✅
Linear scaling (100-1000) ✅
Quadratic safety cap (1000+) ✅

XP from tap: energy / 10 ✅
XP from purchases: cost^0.75 × 2.7 ✅
Transaction cap: 25% of threshold ✅
```

This is **more sophisticated** than most published idle games.

**Why the soft caps matter:**
- Level 1-100: Natural progression (exponential)
- Level 100-1000: Prevents too-fast leveling
- Level 1000+: Prevents infinity (quadratic)
- Result: Game scales gracefully from 1-2000 levels

---

### 4. ⚠️ XP Transaction Cap (SLIGHTLY STRICT)

**Current setting:**
```
cap = level_threshold_xp × 0.25
```

**What this means:**
- Level 30 player spends 1,000,000 E
- Raw XP: ~53,955 XP
- But capped at 41,231 XP (25% of level threshold)
- Player gets full XP regardless

**Problem:**
- Feels punitive when spending large amounts
- Industry standard: 25-50% threshold
- Current: On lower end

**Recommendation:**
```
Change to 0.33 (33%) or even 0.40 (40%)

This allows:
- Players to "splash" spend and feel rewarded
- Still prevents rushing multiple levels
- Better late-game pacing
```

**Impact:** Low - easy parameter to adjust

---

### 5. ⚠️ Building Upgrade Costs (ESCALATION PROBLEM)

**Current formula:**
```
cost = (base × 5) × 1.25^level
```

**The problem:**
```
Tier 1 building (base 500E):

Level 0→1:  2,500 E ✅ Reasonable
Level 5→6:  7,629 E ✅ Fair
Level 10→11: 23,283 E ✅ Still reasonable
Level 20→21: 224,709 E ⚠️ Getting expensive
Level 30→31: 9,313,225 E ❌ ABSURD
Level 50→51: 35,891,578 E ❌ COMPLETELY UNREALISTIC
```

**Why this matters:**
- Upgrade multiplier (1.25) is too steep for exponential scaling
- Creates a "dead zone" around Level 25-30
- Players stop upgrading buildings and hit a wall
- Results in engagement cliff and churn

**This is a HIGH PRIORITY FIX**

**Comparison with best practices:**
```
Cookie Clicker: 1.15 scaling (much gentler)
Realm Grinder: 1.10 scaling (even gentler)
Energy Planet: 1.25 scaling (TOO STEEP)
```

**Recommendation:**
```
Option A: Reduce growth rate after Level 20
  if (level < 20): 1.25^level
  else: (1.25^20) × (1.12^(level-20))

Option B: Add soft cap at Level 25
  if (level >= 25): constant + linear growth
  Example: cost_at_25 + (100000 × (level - 25))

Option C: Just reduce multiplier
  Use 1.20 instead of 1.25
  Still steep, but not cliff-like
```

**Impact:** HIGH - Could cause player churn around Level 25-35

---

### 6. ✅ Prestige System (Live)

**Current status:** В игре. Престиж доступен после Level 50 при накоплении ≥1e12 энергии в текущем прогоне. Эндпоинт `POST /prestige` сбрасывает энергию, уровень, здания и активные бусты, добавляя постоянный множитель: `prestige_multiplier += floor((energy_since_prestige / 1e12)^{1/3})`.

**Что даёт игроку:**
```
• 1-й престиж: множитель ×2 (1e12 энергии) — прогресс серьёзно ускоряется.
• Каждые +8× энергии добавляют ещё +1 к множителю.
• Множитель применяется к тапу и пассиву, отображается в профиле/сессии.
```

**Метрики для мониторинга:**
- Время от старта до первого престижа и между последующими престижами.
- Рост `prestige_multiplier` после 5+ циклов (прицельно избегать runaway эффектов >×50).
- Поведение игроков, отказывающихся престижить — добавить напоминания или частичные награды, если это частый случай.

**Следующие итерации:**
- Подготовить косметику/ачивки за `prestige_level`.
- Завести события `prestige_available` / `prestige_skip` в telemetry.
- Продумать легкий onboarding после первого престижа (подсказка, стартовый буст).

---

## Detailed Comparison Table

### Income System

| Aspect | Industry Standard | Energy Planet | Rating |
|--------|-------------------|----------------|--------|
| Tap growth | 0.10-0.20 | 0.15 | ✅ OPTIMAL |
| Passive growth | 0.15-0.25 | 0.20 | ✅ OPTIMAL |
| Boost stacking | Multiplicative | Multiplicative | ✅ CORRECT |
| Passive domination | By Level 20-30 | By Level 15 | ✅ EXCELLENT |

### Cost System

| Aspect | Industry Standard | Energy Planet | Rating |
|--------|-------------------|----------------|--------|
| Purchase multiplier | 1.12-1.15 | 1.12 | ✅ BALANCED |
| Upgrade multiplier | 1.20-1.30 | 1.20→1.10 / 1.26→1.16 | ✅ SOFT CAP |
| Tap cost scaling | 1.15+ | 1.15 | ✅ GOOD |
| Cost > Income | YES | YES | ✅ CORRECT |

### Progression System

| Aspect | Industry Standard | Energy Planet | Rating |
|--------|-------------------|----------------|--------|
| XP exponent | 1.5-2.0 | 1.5 | ✅ OPTIMAL |
| Soft caps | Recommended | 100, 1000, 2000 | ⭐ EXCELLENT |
| Transaction cap | 25-50% | 40→33→28→25% | ✅ RE-TUNED |
| Purchase XP | 0.65-0.80 exponent | 0.75 | ✅ GOOD |

### Monetization

| Aspect | Industry Standard | Energy Planet | Rating |
|--------|-------------------|----------------|--------|
| Premium cost | 50-500 | 50-2000 Stars | ✅ GOOD |
| Premium effect | 2-5x multiplier | 3x (200%) | ✅ GOOD |
| Ad frequency | 1/hr - unlimited | Unlimited | ⚠️ GENEROUS |
| ARPDAU target | $0.10-0.30 | $0.15 | ✅ REALISTIC |

### Critical Features

| Feature | Status | Priority | Est. Work |
|---------|--------|----------|-----------|
| Prestige | ✅ DEPLOYED | 🟢 COMPLETE | Implemented |
| Upgrade scaling fix | ✅ DEPLOYED | 🟢 COMPLETE | Soft cap @ 25 |
| XP cap tuning | ✅ DEPLOYED | 🟢 COMPLETE | Dynamic ratios |
| Boost balance | ⚠️ IDENTIFIED | 🟡 MEDIUM | 1 day |

---

## Action Plan

### Before MVP Launch (CRITICAL)

- [x] **Implement Prestige System**
  - В проде: `POST /prestige`, постоянный множитель, сброс энергии и строений.
  - Требует мониторинга метрик и UX-подсказок для первого престижа.

### For MVP (HIGH PRIORITY)

- [x] **Fix Upgrade Cost Cliff**
  - Кусочно-экспоненциальная формула: <25 уровней — 1.20/1.22/1.24/1.26, >=25 — 1.10/1.12/1.14/1.16.
  - Необходимо прогнать плейтесты по тиру 4.

- [x] **Tune XP Cap**
  - Динамические коэффициенты: 40 % → 33 % → 28 % → 25 %.
  - Демпфер ослаблен (`base=400`, `exponent=1.3`); отслеживать ощущения 300+ уровней.

### Post-MVP (MEDIUM PRIORITY)

- [ ] **Monitor Boost Monetization**
  - Track spending patterns
  - Adjust if needed
  - Timeline: Ongoing

- [ ] **Add Prestige Cosmetics**
  - Special frames for prestige levels
  - Timeline: 1 week

- [ ] **Seasonal Content**
  - Time-limited events
  - Exclusive buildings/cosmetics
  - Timeline: 2 weeks

---

## Document References

This analysis references three comprehensive documents:

1. **IDLE_GAME_DESIGN_BEST_PRACTICES.md**
   - Complete industry standards for idle games
   - Formulas, metrics, and design principles
   - Extracted from Kongregate "Math of Idle Games" series

2. **BALANCE_ANALYSIS_vs_BEST_PRACTICES.md**
   - Detailed comparison of Energy Planet vs standards
   - Problem identification with examples
   - Specific recommendations and code suggestions

3. **GDD.md** (original)
   - Your current game design document
   - All implemented formulas and systems

---

## Key Numbers at a Glance

**Tap System:**
```
Base income: 1 E/tap
Upgrade cost: 100 × 1.15^level
Upgrade effect: +15% per level
```

**Building System:**
```
Purchase cost: base × 1.12^count
Upgrade cost: (base × 5) ×
  { pre-25: 1.20/1.22/1.24/1.26 ^ level,
    post-25: pre_cap × 1.10/1.12/1.14/1.16 ^ (level-25) }
Income multiplier: 1 + (level × 0.20)
```

**Progression:**
```
Base: 100 × level^1.5
Soft caps: 100, 1000, 2000
XP from tap: energy / 10
XP from purchase: cost^0.75 × 2.7
Transaction cap: 40% → 33% → 28% → 25% от порога
```

**Boosts:**
```
Ad: 10 min, +80% income, кулдаун 30 мин
Premium: 1ч / 24ч / 7д ×2.5
Daily: 15 мин, +50% tap income
Stacking: Multiplicative
```

**Prestige:**
```
Status: DEPLOYED ✅
Multiplier: prestige += floor((energy_since_prestige / 1e12)^(1/3))
Reset: энергия/уровни/здания/бусты, множитель сохраняется
```

---

## Final Assessment

**Overall Score: ⭐⭐⭐⭐ (4 out of 5 stars)**

### Strengths
- ✅ Income system is textbook perfect
- ✅ Cost scaling follows industry standards
- ✅ Progression system is sophisticated
- ✅ Anti-cheat validation is solid

### Weaknesses
- ⚠️ Требуется телеметрия престижа и UX подсказки
- ⚠️ Проверить тира 4 на новых мультипликаторах
- ⚠️ Ad boost ×1.8: мониторить ARPDAU и retention
- ⚠️ XP кап: продолжить наблюдения 300+ уровней

### Playtesting Recommendations
1. Run 10-20 player beta tests to Level 50+
2. Monitor where engagement drops (likely Level 25-30)
3. Collect feedback on XP cap frustration
4. Validate prestige appeal with players

### Timeline to Launch
- With prestige & upgrade fixes: **Ready in 3-4 days**
- Without fixes: **Ready but high churn risk**

---

## Questions for Design Team

1. **Prestige Timing:** When should first prestige be available?
   - Option A: Level 50 (late game)
   - Option B: Level 30 (mid game, encourages speedrun)
   - Option C: Flexible, based on energy threshold

2. **Upgrade Costs:** How high should upgrades go?
   - Option A: Keep 1.25 (current, steep)
   - Option B: Reduce to 1.20 (moderate)
   - Option C: Soft cap at Level 25 (hybrid)

3. **XP Transaction Cap:** Punish large spenders?
   - Option A: Keep at 0.25 (current, strict)
   - Option B: Increase to 0.33 (moderate)
   - Option C: Dynamic based on level (complex)

4. **Boost Generosity:** Free ads too strong?
   - Option A: Keep unlimited (current, player-friendly)
   - Option B: Add cooldown 1/hour (monetization boost)
   - Option C: Reduce multiplier to 50% (balance)

---

**Analysis Complete**

For detailed technical recommendations, see:
- `docs/BALANCE_ANALYSIS_vs_BEST_PRACTICES.md` (sections 5.1-5.4)
- `docs/IDLE_GAME_DESIGN_BEST_PRACTICES.md` (sections 3-7)
