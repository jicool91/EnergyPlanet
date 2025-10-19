# Game Design Document: Energy Planet

## 1. Core Concept

**Energy Planet** - idle tap игра в формате Telegram Mini App, где игроки развивают энергетическую инфраструктуру планеты, накапливая энергию через тапы и пассивный доход от построек.

## 2. Core Loop

1. **Тап** → Получение энергии
2. **Улучшения** → Увеличение дохода с тапа и пассивного дохода
3. **Прогресс** → Открытие новых построек и контента
4. **Социальное взаимодействие** → Осмотр профилей, лидерборды

## 3. Economy System

### 3.1 Основная валюта

**Energy (E)** - основная игровая валюта

### 3.2 Источники дохода

#### Tap Income
```
tap_income = base_tap * tap_multiplier * (1 + boost_percentage)

где:
- base_tap = 1 (начальное значение)
- tap_multiplier = 1 + (tap_upgrade_level * 0.15)
- boost_percentage = сумма всех активных бустов (0.0 - 5.0)
```

#### Passive Income (в секунду)
```
passive_income_per_sec = Σ (building_base_income[i] * building_count[i] * building_multiplier[i])

где для каждой постройки:
- building_base_income = базовый доход (см. buildings.json)
- building_count = количество построенных
- building_multiplier = 1 + (building_upgrade_level * 0.20)
```

### 3.3 Формулы стоимости улучшений

#### Tap Upgrade Cost
```
tap_upgrade_cost(level) = 100 * (1.15 ^ level)

Примеры:
- Level 1: 100 E
- Level 5: 201 E
- Level 10: 405 E
- Level 20: 1,637 E
```

#### Building Cost
```
building_cost(base_cost, count) = base_cost * (1.12 ^ count)

Примеры для base_cost = 500:
- 1-я постройка: 500 E
- 5-я постройка: 881 E
- 10-я постройка: 1,552 E
- 20-я постройка: 4,823 E
```

#### Building Upgrade Cost
```
building_upgrade_cost(base_cost, level) = (base_cost * 5) * (1.25 ^ level)

Примеры для building с base_cost = 500:
- Upgrade 1: 2,500 E
- Upgrade 5: 7,629 E
- Upgrade 10: 23,283 E
```

### 3.4 Прогрессионные пороги

```
next_level_exp(current_level) = 100 * (current_level ^ 1.5)

Примеры:
- Level 1→2: 100 XP
- Level 5→6: 1,118 XP
- Level 10→11: 3,162 XP
- Level 20→21: 8,944 XP
```

XP начисляется за:
- Tap: 1 XP за каждые 10 energy
- Upgrade: level * 50 XP
- Achievement: variable

## 4. Building System

### 4.1 Типы построек (Tiers)

**Tier 1: Starter** (доступны с Level 1)
- Solar Panel: 10 E/sec, cost: 500 E
- Wind Turbine: 25 E/sec, cost: 1,200 E

**Tier 2: Advanced** (доступны с Level 5)
- Geothermal Plant: 100 E/sec, cost: 8,000 E
- Hydro Dam: 250 E/sec, cost: 25,000 E

**Tier 3: Industrial** (доступны с Level 10)
- Nuclear Reactor: 1,000 E/sec, cost: 150,000 E
- Fusion Core: 5,000 E/sec, cost: 800,000 E

**Tier 4: Futuristic** (доступны с Level 20)
- Dyson Sphere Node: 25,000 E/sec, cost: 5,000,000 E
- Quantum Generator: 100,000 E/sec, cost: 25,000,000 E

### 4.2 Building Limits

```
max_buildings_per_type = 50 + (player_level * 2)

Примеры:
- Level 1: 52 постройки каждого типа
- Level 10: 70
- Level 50: 150
```

## 5. Boost System

### 5.1 Типы бустов

**Ad Boost** (Rewarded Ad)
- Duration: 300 sec (5 min)
- Effect: +100% tap income
- Cooldown: 0 (можно смотреть подряд)
- Stack: не стакается с другими ad boost

**Premium Boost** (Telegram Stars)
- Duration: 3600 sec (1 hour)
- Effect: +200% all income
- Cost: 50 Stars
- Stack: стакается с ad boost

**Daily Boost** (Free)
- Duration: 600 sec (10 min)
- Effect: +50% tap income
- Cooldown: 86400 sec (24 hours)
- Stack: стакается с другими

### 5.2 Стакинг бустов

```
total_boost = Π (1 + boost_i) - 1

Пример:
- Ad Boost (100%) + Premium Boost (200%) = (1 + 1.0) * (1 + 2.0) - 1 = 5.0 = 500%
```

## 6. Cosmetics System

### 6.1 Типы косметики

**Avatar Frames** - рамки вокруг аватара
**Planet Skins** - визуальные темы планеты
**Tap Effects** - анимации тапа
**Background Themes** - фоны игры

### 6.2 Источники получения

- **Free**: за достижения, события, уровни
- **Premium**: покупка за Telegram Stars (100-500 Stars)
- **Event**: временные события и сезоны

## 7. Anti-Cheat Measures

### 7.1 Server-side validation

```
max_taps_per_session = 10 * session_duration_seconds
max_energy_gain = max_taps_per_session * max_possible_tap_income

Server проверяет:
if (reported_energy - last_known_energy) > max_energy_gain:
    flag_suspicious_activity()
```

### 7.2 Tick validation

```
max_passive_gain = passive_income_per_sec * time_delta_sec * 1.1 (10% tolerance)

Server проверяет каждый tick:
if (reported_passive_gain > max_passive_gain):
    clamp_to_max()
    log_anomaly()
```

### 7.3 Purchase idempotency

Каждая покупка имеет уникальный `purchase_id` (client-generated UUID):
```
if purchase_id exists in purchases table:
    return existing purchase result (idempotent)
else:
    process purchase
```

## 8. Monetization

### 8.1 Telegram Stars

**Energy Packs**
- Small: 10,000 E = 10 Stars
- Medium: 50,000 E = 40 Stars (20% bonus)
- Large: 150,000 E = 100 Stars (50% bonus)

**Premium Boosts**
- 1 Hour: 50 Stars
- 24 Hours: 400 Stars (33% discount)
- 7 Days: 2,000 Stars (43% discount)

**Exclusive Cosmetics**
- Common: 100 Stars
- Rare: 250 Stars
- Epic: 500 Stars

### 8.2 Rewarded Ads

**Ad Rewards**
- Energy Bonus: 500 * player_level E
- 5-min Boost: +100% tap income
- Cooldown: none (unlimited views)

**Expected Monetization**
```
ARPDAU = (Stars_Revenue + Ad_Revenue) / DAU

Target:
- Stars ARPDAU: $0.10 (10% payers * $1.00 ARPPU)
- Ad ARPDAU: $0.05 (3 ads/day * $0.015 eCPM)
- Total ARPDAU: $0.15
```

## 9. Session System

### 9.1 Session Flow

1. Client открывает игру → POST /api/v1/session
2. Server возвращает:
   - Текущее состояние игрока (energy, buildings, upgrades)
   - Accumulated passive income с последнего выхода
   - Active boosts
3. Client применяет offline gains
4. Session остаётся активной до закрытия игры

### 9.2 Offline Gains

```
offline_duration_sec = current_time - last_logout_time
max_offline_duration = 43200 sec (12 hours)

actual_offline_duration = min(offline_duration_sec, max_offline_duration)
offline_energy = passive_income_per_sec * actual_offline_duration

Offline коэффициент = 0.5 (50% от обычного пассивного дохода)
final_offline_energy = offline_energy * 0.5
```

## 10. Progression Milestones

| Level | Unlock |
|-------|--------|
| 1 | Tier 1 Buildings, Daily Boost |
| 5 | Tier 2 Buildings, Profile Customization |
| 10 | Tier 3 Buildings, Leaderboards |
| 15 | Clan System (Post-MVP) |
| 20 | Tier 4 Buildings, Arena (Post-MVP) |
| 30 | Seasonal Content |
| 50 | Prestige System (Future) |

## 11. Balancing Targets

### 11.1 Session Length
- Average session: 3-5 minutes
- Core loop cycle: 30-60 seconds (tap → check progress → upgrade → tap)

### 11.2 Progression Speed
- Level 1→10: ~1-2 hours of active play
- Level 10→20: ~8-10 hours
- Level 20→30: ~40-50 hours

### 11.3 Energy Scaling
```
По мере прогресса соотношение tap:passive меняется:
- Early game (L1-5): 70% tap, 30% passive
- Mid game (L5-15): 40% tap, 60% passive
- Late game (L15+): 20% tap, 80% passive
```

## 12. Social Features

### 12.1 Player Inspection

Любой игрок может открыть профиль другого игрока через:
- Leaderboard
- Clan roster (Post-MVP)
- Direct link

Отображается:
- Level, Avatar, Frame
- Total Energy produced (all-time stat)
- Visible cosmetics
- Rank in leaderboard
- Achievement badges

### 12.2 Leaderboards

**Global Leaderboard**
- Top 100 игроков по total energy produced
- Update: real-time (с кешированием 60 sec)

**Weekly Leaderboard**
- Resets every Monday 00:00 UTC
- Rewards: эксклюзивные avatar frames для Top 10

**Friends Leaderboard** (Post-MVP)
- Telegram contacts who play the game
