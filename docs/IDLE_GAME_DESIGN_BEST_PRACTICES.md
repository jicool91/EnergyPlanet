# Idle Game Design: Best Practices & Design Formulas

**Compiled from:** Kongregate's "The Math of Idle Games" series, GDC talks, and industry standards

---

## 1. Core Principles

### 1.1 The Idle Game Loop

All successful idle/clicker games balance three elements:

1. **Simple Core Loop** - Easy entry, low barrier to play
   - User clicks/taps → Gets currency → Sees progress
   - Should be completable in 30-60 seconds

2. **Complex Economy** - Reason to return and invest
   - Multiple income sources (tap, passive, boosts)
   - Multiple expenditure options (buildings, upgrades, cosmetics)
   - Scaling progression that requires strategy

3. **Visible Progress Counter** - Shows ongoing gains
   - Per-second income display
   - Long-term total earned stat
   - Level progression bars

### 1.2 The Seesaw Balance

**Core Design Principle:**
```
Cost Growth Rate > Income Growth Rate
```

This ensures:
- Players progress quickly at first (satisfying dopamine loop)
- Costs catch up faster than income
- Players must upgrade buildings to keep up
- Creates natural "walls" that encourage boosts/purchases

---

## 2. Income Formulas

### 2.1 Tap Income (Active)

Standard formula:
```
tap_income = base_tap × tap_multiplier × (1 + boost_percentage)

Where:
- base_tap = 1 (base income per tap)
- tap_multiplier = 1 + (tap_level × upgrade_bonus)
  - Typical upgrade_bonus: 0.10-0.20 (10-20% per level)
- boost_percentage = sum of all active boosts
```

**Best Practice:**
- Tap income should start strong (high early dopa hit)
- Scale linearly with upgrades (predictable progression)
- Upgrade bonus: 0.15-0.20 is industry standard

### 2.2 Passive Income (Offline)

Standard formula:
```
passive_income_per_sec = Σ(building_base_income[i] × count[i] × multiplier[i])

Where:
- building_base_income = base income per building
- count = number of that building owned
- multiplier = 1 + (building_level × upgrade_bonus)
  - Typical upgrade_bonus: 0.15-0.25
```

**Progression Balance:**
- Early game (Levels 1-5): 70% tap income, 30% passive
- Mid game (Levels 5-15): 40% tap income, 60% passive
- Late game (15+): 20% tap income, 80% passive

This shift is critical for engagement:
- Early: Players like active gameplay
- Mid: Players want to progress while away
- Late: Game becomes true "idle" - minimal active play needed

### 2.3 Boost Stacking

**Multiplicative formula** (NOT additive):
```
total_multiplier = Π(1 + boost_i) - 1

Example:
- Ad Boost (100%) + Premium Boost (200%)
- = (1 + 1.0) × (1 + 2.0) - 1
- = 2 × 3 - 1 = 5.0 (500% boost, not 300%)
```

**Why multiplicative?**
- Prevents exponential overflow from stacking
- Creates interesting meta-game (choose boost order)
- Additive boosts would make late-game unbalanced

---

## 3. Cost Formulas

### 3.1 Building Purchase Cost

**Exponential growth** (from Cookie Clicker):
```
building_cost(count) = base_cost × (growth_rate ^ count)

Typical growth_rate: 1.12-1.15
- 1.12: Slower scaling, more affordable
- 1.15: Balanced (Cookie Clicker standard)
- 1.20+: Steep progression
```

**Example (base_cost = 500, growth = 1.12):**
```
1st building:  500
5th building:  881 (1.76x)
10th building: 1,552 (3.10x)
20th building: 4,823 (9.65x)
```

**Why exponential?**
- First buildings feel cheap (encourages purchase)
- Costs scale naturally without manual tuning
- Creates natural "walls" for progression

### 3.2 Building Upgrade Cost

Standard formula:
```
upgrade_cost(level) = (base_cost × multiplier) × (growth_rate ^ level)

Typical:
- multiplier = 5x base cost for first upgrade
- growth_rate = 1.20-1.30 (steeper than purchases)
```

**Rationale:**
- Upgrades cost more than purchases (natural progression)
- Steeper scaling encourages farming buildings first
- Creates decision: "Buy new building or upgrade existing?"

### 3.3 Tap Upgrade Cost

Typically faster scaling than buildings:
```
tap_upgrade_cost(level) = base_cost × (1.15 ^ level)

Common base_cost: 100 energy

Example:
- Level 1: 100
- Level 5: 201
- Level 10: 405
- Level 20: 1,637
```

**Design note:**
- Tap upgrades should be affordable early
- Should become expensive mid-game (prevents dominance)
- Late-game: Passive income should dominate tap

---

## 4. Progression & XP

### 4.1 Level Progression Formula

**Base formula** (used in many games):
```
xp_for_level(n) = base × (level ^ exponent)

Typical exponent: 1.5-2.0
- 1.5: Faster early progression
- 2.0: Steeper scaling
```

**Common implementation:**
```
xp_for_level(1) = 100
xp_for_level(2) = 100 × 2^1.5 ≈ 283
xp_for_level(10) = 100 × 10^1.5 ≈ 3,162
xp_for_level(20) = 100 × 20^1.5 ≈ 8,944
```

### 4.2 XP from Tap

Simple conversion:
```
xp_from_tap = tap_energy / conversion_ratio

Typical conversion_ratio: 10-20
- Lower = faster leveling
- Higher = slower leveling

Example:
- Ratio 10: 100 energy = 10 XP
- Ratio 20: 100 energy = 5 XP
```

### 4.3 XP from Transactions

Most games use **power law** to discourage grinding one action:
```
xp_from_purchase = (cost ^ exponent) × coefficient

Typical exponent: 0.65-0.80
- Lower exponent = diminishing returns
- Prevents "spam build then delete" loops

Example:
- Exponent 0.75: cost 1000 = 0.75√1000 ≈ 22 XP
- Exponent 0.75: cost 10000 = 0.75√10000 ≈ 100 XP
```

**Cap system** (optional but recommended):
```
transaction_xp_cap = level_threshold_xp × 0.20-0.25

Prevents:
- Spending all currency in one transaction
- Gaming progression system
- Rushing through content
```

### 4.4 Soft Caps for Late Game

To prevent exponential scaling from breaking:

```
If level <= 100:
  xp_needed = 100 × level^1.5

If level 100-1000:
  xp_needed = xp_at_100 + (constant × level_offset)

If level 1000+:
  xp_needed = xp_at_1000 + (quadratic × level_offset^2)
```

**Benefit:** Keeps late-game progression manageable

---

## 5. Prestige System (New Game+)

### 5.1 Core Concept

Prestige is a **planned reset** that gives:
- Temporary loss of progress (buildings, upgrades)
- Permanent multiplier for next run
- Faster progression on subsequent runs

### 5.2 Common Prestige Formulas

**Cookie Clicker style** (lifetime earnings):
```
prestige_multiplier = ∛(total_earned / 10^12)

Doubling prestige requires: 8x lifetime earnings
```

**Realm Grinder style** (maximum progress):
```
prestige = (√(1 + 8 × max_earned / 10^12) - 1) / 2

Slower early, scales faster late
```

**Egg Inc style** (soft reset earnings):
```
prestige_gained = (run_earnings / 10^6) ^ 0.14

Per-run focus (not lifetime)
Sublinear growth prevents infinite scaling
```

### 5.3 Implementation Strategy

**Suggested approach for Energy Planet:**

```
prestige_multiplier = (total_energy_produced / milestone) ^ 0.33

Where milestone = 10^12 (adjust based on economy)

Doubling prestige: Requires 8x previous energy

This creates:
- Soft cap on prestige (diminishing returns)
- Incentive to keep prestiging
- Natural stopping point (ROI diminishes)
```

### 5.4 Prestige Timing

Players should prestige when:
```
time_to_next_prestige_level < time_saved_in_next_run

Typical windows:
- First prestige: Level 50+
- Second prestige: Level 75+
- Later: Every 50-100 levels
```

---

## 6. Boost System Design

### 6.1 Types of Boosts

**Premium/Paid Boosts:**
- Duration: 1 hour - 7 days
- Effect: 2-5x multiplier
- Stacking: YES (multiplicative)
- Cost: 50-500 currency units

**Rewarded Ad Boosts:**
- Duration: 5-10 minutes
- Effect: 1-2x multiplier
- Stacking: YES (multiplicative)
- Cost: FREE
- Frequency: No cooldown or cooldown < 1 hour

**Daily/Free Boosts:**
- Duration: 10 minutes
- Effect: 0.5-1x multiplier
- Stacking: YES
- Frequency: Once per 24h

**Timed Passive Boosts:**
- Applied to passive income only
- Lower multiplier (1.5-2x)
- Longer duration (1-12 hours)

### 6.2 Monetization Balance

Good boost design:
- Free boosts should be worthwhile (players feel helped)
- Premium boosts should feel powerful (worth paying)
- Ad boosts should not feel mandatory (not required for progress)

Typical monetization split:
- 10-20% players spend on premium boosts
- 50%+ watch at least one ad boost
- 70%+ use free daily boosts

---

## 7. Anti-Cheat Validation

### 7.1 Tap Validation

```
max_taps_per_second = 10-30 (game dependent)
max_taps_per_minute = 300-600
max_tap_count_per_request = 50

Server validates:
- Second rate: if taps/sec > max → reject/flag
- Minute rate: if taps/min > max → reject/flag
- Request size: if count > 50 → reject

Log suspicious behavior for analysis
```

### 7.2 Energy Gain Validation

```
max_passive_gain = passive_income_per_sec × time_delta × 1.1

Allows 10% tolerance for clock skew

Server validates each tick:
if reported_gain > max_passive_gain:
  - Clamp to max
  - Log anomaly
  - Monitor for patterns
```

### 7.3 Purchase Idempotency

```
Every purchase gets unique purchase_id (client UUID)

If purchase_id already exists:
  return cached result (replay safe)
else:
  process purchase
  store purchase_id
```

Prevents: Duplicate charges, double-spending, race conditions

### 7.4 Cheat Detection Patterns

Watch for:
- Impossible tap rates (> 100/sec sustained)
- Instant energy jumps (> 10x expected)
- Level jumps without XP progression
- Building counts exceeding max
- Time manipulation (clock jumping backwards)

---

## 8. Monetization Strategy

### 8.1 Revenue Streams

**Telegram Stars (Premium Currency):**
- Energy packs: 10-100 Stars (bulk discount 20-50%)
- Premium boosts: 50-500 Stars
- Cosmetics: 100-500 Stars
- Battle pass / seasonal items

**Rewarded Ads:**
- Energy bonus: 500-2000 per watch
- Boost: 5-10 min per watch
- Typical eCPM: $0.01-0.05
- Expected: 3-5 ads/day from engaged players

**Expected ARPU (Annual Revenue Per User):**
- Whales (top 1-2%): $100-500/year
- Dolphins (5-10%): $10-50/year
- Minnows (20%): $1-10/year
- F2P (70%): $0/year

**Target ARPDAU** (Average Revenue Per Daily Active User):
- Small game: $0.05-0.10
- Medium game: $0.10-0.30
- Large game: $0.30+

---

## 9. Balancing Checklist

### 9.1 Early Game (Levels 1-10)

- [ ] Tap income should feel rewarding (visible progress)
- [ ] Building costs should be affordable
- [ ] First prestige should be accessible (if implemented)
- [ ] Session length: 3-5 minutes
- [ ] Progression speed: 1-2 hours to level 10

### 9.2 Mid Game (Levels 10-30)

- [ ] Passive income catching up to tap
- [ ] Building upgrades become meaningful
- [ ] New tiers unlock, creating "ah-ha" moments
- [ ] Prestige becomes relevant option
- [ ] Session length: 5-10 minutes (more idle friendly)

### 9.3 Late Game (Levels 30+)

- [ ] Passive dominates (80%+ of income)
- [ ] Tap largely irrelevant
- [ ] Cosmetics provide long-term goals
- [ ] Prestige is viable strategy
- [ ] Session length: 2-3 min (very idle)

### 9.4 Number Scaling

Good games handle:
- Small numbers: 1-100 (early game)
- Medium numbers: 1K-1M (mid game)
- Large numbers: 1M-1B (late game)
- Huge numbers: 1B+ (prestige/cosmetic only)

Use:
- Abbreviated notation (1M, 1B, 1T)
- Scientific notation in tooltips
- Regular number format for primary display

---

## 10. Common Pitfalls

### 10.1 Progression Issues

❌ **Exponential Everything**
- If both costs AND income scale exponentially with same rate, game breaks
- Solution: Keep income growth < cost growth

❌ **Tap Dominance**
- Tap income too high relative to passive
- Players feel forced to stay active
- Solution: Passive should dominate by level 20-30

❌ **Prestige Wall**
- First prestige too expensive or unrewarding
- Solution: Make first prestige accessible, multiplicative bonus

### 10.2 Economic Pitfalls

❌ **Dead Content**
- Early buildings never worth purchasing again after first few
- Solution: Upgrades should make re-purchasing relevant

❌ **Inflation**
- Numbers grow too fast, break UI and calculations
- Solution: Use soft caps, prestige resets

❌ **Paywall**
- Game unplayable without paying
- Solution: All content reachable F2P in 2-4 weeks

### 10.3 Engagement Pitfalls

❌ **No Short-term Goals**
- Player doesn't know what to work toward
- Solution: Show next building/upgrade cost prominently

❌ **Invisible Progress**
- No visible counter of per-second gains
- Solution: Display "E/sec" prominently

❌ **Mandatory Grind**
- Player must log in every X hours or fall behind
- Solution: Offline progression, generous sessions

---

## 11. Tools & Resources

### Spreadsheet Balancing

Recommended structure:
```
Columns:
- Level
- XP Needed
- XP For Next
- Tap Cost
- Tap Income
- Building 1 Cost
- Building 1 Income
- Prestige Value
- Time to Level (estimate)

Use formulas to:
- Model progression curves
- Estimate play time
- Find balance breakpoints
```

### Metrics to Track

Once live:
- Session length distribution
- Level reached by day 7, 30, 90
- Prestige frequency
- Cost to complete Tier 1, 2, 3 buildings
- Boost purchase rate
- Churn rate by level

### Communities & References

- **Kongregate Forums** - Active idle game developers
- **/r/incremental_games** - Subreddit for incremental/idle games
- **GitHub** - Open source idle games to study
  - Cookie Clicker
  - Prestige (browser version)
  - Idle Heroes

---

## 12. Sample Balanced Numbers

For reference, here's a complete sample progression system:

### Tap Progression
```
base_tap = 1
tap_upgrade_cost(level) = 100 * 1.15^level
tap_multiplier = 1 + (level * 0.15)

Progression:
Level 1: 100E cost, 1.15 income
Level 5: 201E cost, 1.75 income
Level 10: 405E cost, 2.50 income
```

### Building System
```
Base costs:
Tier 1: 500-1,200 (2-4 seconds earned)
Tier 2: 8,000-25,000 (30-90 seconds earned)
Tier 3: 150K-800K (5-30 minutes earned)
Tier 4: 5M-25M (30+ minutes earned)

Cost multiplier: 1.12^count
Upgrade multiplier: (base * 5) * 1.25^level
```

### XP System
```
Base: 100 * level^1.5
Soft caps at levels: 100, 1000, 2000
Tap XP: energy / 10
Purchase XP: cost^0.75 * 2.7, capped at 25% of level threshold
```

### Prestige (Optional)
```
Multiplier = (total_energy / 10^12) ^ 0.33
Doubling cost: 8x previous
Suggested reset points: 50, 75, 100, 150 levels
```

---

## References

1. **Kongregate "The Math of Idle Games"** - Parts I, II, III
   - https://blog.kongregate.com/the-math-of-idle-games-part-i/

2. **GDC 2016: Quest for Progress - The Math and Design of Idle Games**
   - Anthony Pecorella

3. **Cookie Clicker** - Seminal work in idle game design
   - Academic analysis available on arXiv

4. **Game Analytics: Idle Game Mathematics**
   - https://gameanalytics.com/blog/idle-game-mathematics/

5. **Machinations.io - Idle Game Design Guide**
   - https://machinations.io/articles/idle-games-and-how-to-design-them

---

**Document Version:** 1.0
**Last Updated:** October 2025
**Compiled for:** Energy Planet Project
