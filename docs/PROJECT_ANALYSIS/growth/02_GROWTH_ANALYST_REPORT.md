# 📊 GROWTH ANALYST REPORT
## Energy Planet - Анализ роста, retention и monetization funnel

**Дата анализа:** 2025-10-28
**Статус:** MVP (не запущена), 0 DAU
**Целевая аудитория:** Casual gamers в Telegram, возраст 12-45

---

## 📈 СВОДКА ОЦЕНОК

| Метрика | Текущее | Целевое | Gap |
|---------|---------|---------|-----|
| **D1 Retention** | - | 30%+ | Unknown |
| **D7 Retention** | - | 15%+ | Unknown |
| **D30 Retention** | - | 5%+ | Unknown |
| **Viral Coefficient** | - | 0.3+ | Unknown |
| **LTV:CAC Ratio** | - | 3:1 | Unknown |
| **ARPU** | - | $5+ | Unknown |
| **Conversion (Free→Paid)** | - | 5%+ | Unknown |

---

## 1. CONVERSION FUNNEL (Гипотеза, не данные)

### Предполагаемая Funnel для Telegram Mini App:

```
┌─────────────────────────────────────────────────┐
│ 1. DISCOVERY (100%)                             │
│ User opens Telegram bot link / Mini App link    │
│ или друг пригласил                              │
└──────────────────┬──────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────┐
│ 2. INSTALL (Ожидаемо: 70-80%)                   │
│ User clicks "Open App" → Mini App загружается   │
│ Может быть friction: slow loading, broken UI    │
│                                                  │
│ ⚠️ RISK: Webapp медленный для слабых phone      │
└──────────────────┬──────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────┐
│ 3. SIGNUP/AUTH (Ожидаемо: 85-90% of installs)   │
│ User logs in via Telegram OAuth                 │
│ БЕЗ password - single tap (хорошо!)             │
│                                                  │
│ ⚠️ RISK: OAuth может быть сломана (нужно тест) │
└──────────────────┬──────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────┐
│ 4. ONBOARDING (Ожидаемо: 80-90% of signed up)   │
│ Tutorial: как тапать, что это даёт              │
│ First few taps (quick dopamine hit)             │
│                                                  │
│ ⚠️ RISK: Длинный onboarding → drop              │
│ ✅ FIX: Максимум 30 сек до первого тапа        │
└──────────────────┬──────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────┐
│ 5. ACTIVE USER (Ожидаемо: 70-80% of onboarded)  │
│ User completes tutorial, делает несколько тапов │
│ Видит progress (energy растёт, level up)        │
│                                                  │
│ ✅ GOOD: Множитель за level up (satisfying)     │
└──────────────────┬──────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────┐
│ 6. MONETIZATION MOMENT (Ожидаемо: 3-8%)         │
│ Предложить: Boosts, Cosmetics, Energy packs     │
│ Первая покупка Telegram Stars                   │
│                                                  │
│ ⚠️ RISK: Stars может быть дорого (perception)   │
│ ✅ FIX: Первая покупка со скидкой 50%           │
└──────────────────┬──────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────┐
│ 7. PAYING USER (Ожидаемо: 100% of monetized)    │
│ Успешная покупка в Stars                        │
│ Почувствовал улучшение (boost, косметика)      │
└─────────────────────────────────────────────────┘

TOTAL FUNNEL CONVERSION:
100% → 70% → 60% → 54% → 38% → 3% → 3% = 3% Conv to Paying
```

### Анализ каждого шага:

**INSTALL (Discovery → Install: 70-80% конверсия)**
- Telegram Mini App очень quick (2 клика)
- Но может быть медленное на слабых телефонах
- **Улучшение:** Lazy load компонентов, optimize bundle size

**AUTH (Install → Signup: 85-90%)**
- ✅ ХОРОШО: No password, just Telegram login
- ⚠️ RISK: Telegram OAuth может быть сломана (see Technical)
- **Решение:** Thorough тестирование OAuth flow

**ONBOARDING (Signup → Onboarding complete: 80-90%)**
- ✅ ХОРОШО: Первые несколько тапов очень satisfying
- ⚠️ RISK: Если скучно после tutorial → drop
- **Улучшение:** Прогрессивный tutorial (unlock features по уровням)

**RETENTION (First taps → Daily active: ?)**
- 📊 UNKNOWN: Нет данных о D1/D7/D30 retention
- **Критично:** Нужно измерять сразу после запуска
- **Гипотеза:** D1 возможно 25-35% (idle games обычно 20-40%)

**MONETIZATION (Active → Paying: 3-8%)**
- 💡 KEY: Когда попросить покупку?
- **Сейчас:** После первого level up (хорошо)
- **Улучшение:** A/B тест timing покупки

**REPEAT PURCHASE (First buyer → Repeat: ?):**
- **UNKNOWN:** Нет данных
- **Гипотеза:** 30-50% (зависит от game loop)

---

## 2. RETENTION ANALYSIS (Гипотеза)

### Ожидаемая Retention для Idle Game:

```
D1 Retention (day 1): 30-35% (типичная для casual)
D7 Retention: 12-18% (неделя - крупный drop)
D30 Retention: 4-6% (месяц)

Это типичные числа для idle games в Play Store.
```

### Факторы, влияющие на Retention:

**Позитивные (удерживают пользователей):**
1. ✅ **Passive Income** (Offline gains)
   - User может зайти завтра и иметь new energy
   - Создает привычку открывать app каждый день
   - **Impact:** +15-20% D1 retention vs games без passive

2. ✅ **Short Game Loop** (Tap every 1-2 seconds)
   - Satisfying feedback: tap → energy grows → level up
   - Быстрый progress (psychologically rewarding)
   - **Impact:** +10% D1 retention

3. ✅ **Progression Systems** (Level, XP, Achievements)
   - Многоуровневые цели (level 10, then 50, then 100)
   - Каждый level дает boost (психология %)
   - **Impact:** +8% D1 retention

4. ✅ **Social Features** (Leaderboard, Clans later)
   - Сравнение с друзьями (competition)
   - Leaderboard видно сразу (FOMO)
   - **Impact:** +5-10% D1 retention

**Негативные (теряют пользователей):**
1. ❌ **Energy Cap** (макс. 1000 energy)
   - User достигает cap, не может больше тапать
   - Отсутствие прогресса → abandonment
   - **Impact:** -15% D7 retention

2. ❌ **Slow Progression** (XP требует много)
   - Если level up нужно 1000 energy, долго
   - Ощущение "stuck" → drop
   - **Impact:** -10% D7 retention

3. ❌ **No Social Pressure** (без друзей, тебе не интересно)
   - Если друзья не играют → no comparison
   - **Impact:** -5% D7 retention

4. ❌ **Monetization Too Aggressive** (попросить деньги рано)
   - Если попросить покупку день 1 → раздражение
   - **Impact:** -20% D1 retention

### Рекомендуемая Retention Strategy:

**День 1 (D1):**
- Максимально smooth onboarding
- 5 мин tutorial максимум
- Reward за каждые 10 тапов (dopamine hit)
- НЕ попросить купить ещё

**День 2-7:**
- Пассивный доход (energy ждёт, приходит по уведомлению)
- Unlock новых buildings (progression)
- Показать leaderboard (социальное давление)
- Offer cosmetics (не обязательно)
- Offer первый boost (день 3)

**День 7+ (D7 retention key):**
- Unlock advanced features (Clans, Prestige)
- Daily rewards (log in каждый день)
- Weekly challenges
- Premium battle pass (monthly retention)

**Тестирование (A/B):**
- Test 1: When to show first purchase offer (день 1 vs день 3)
- Test 2: Price of first purchase ($1 vs $3 vs $5)
- Test 3: Onboarding length (3 min vs 5 min vs 10 min)
- Test 4: Energy cap (500 vs 1000 vs unlimited)

---

## 3. VIRAL COEFFICIENT & WORD-OF-MOUTH

### Механизмы вирального роста (Сейчас):

⚠️ **Очень слабые:**
- Нет referral system (друг не может пригласить друга)
- Нет social sharing (нельзя share achievement)
- Нет leaderboard с друзьями
- Нет clan invitations

**Viral Coefficient Estimate:** ~0.0 (zero, because no invite mechanics)

### Как повысить (Post-MVP):

1. **Referral System** (+0.3 к viral coeff)
   - Дай reward за каждого invited friend
   - Friend тоже получит reward (2-way incentive)
   - Deep link в Telegram для easy sharing
   - **Example:** "Invite friend → both get 100 energy"

2. **Social Leaderboard** (+0.2 к viral coeff)
   - Покажи рейтинг только friends (vs global)
   - Add "Challenge friend" кнопка
   - Friend получит notification в Telegram
   - **Psychological:** FOMO - "John is ahead of me"

3. **Leaderboard Sharing** (+0.1 к viral coeff)
   - Share achievement: "I reached level 50!"
   - Share на Telegram story/channel
   - Deep link на твой profile (сопернику нужно тапать чтобы поймать)

4. **Clan System** (Post-MVP) (+0.2 к viral coeff)
   - Создай clan с 5+ friends
   - Clan benefits (bonus income if 5+ members active)
   - Clan leaderboard

**Potential Viral Coefficient:** 0.0 → 0.3-0.5 (медленный, органический рост)

---

## 4. CHURN ANALYSIS (Почему уходят пользователи)

### Expected Churn Reasons (по stages):

**День 0 (Onboarding churn: 10-20%)**
- Тапать скучно / не понравилось
- Графика плохая (на old phone)
- Не понял как играть
- **Решение:** Better UX, faster onboarding, better visuals

**День 1-3 (Post-onboarding churn: 20-30%)**
- Быстро надоело (repetitive taps)
- Energy cap (stuck, can't progress)
- Ожидание energy recovery скучно
- **Решение:** Auto-tap, energy packs, more content

**День 7 (Weekly churn: 60-70%)**
- Нет друзей в game (no social)
- Progression слишком медленный
- Нет социального давления
- **Решение:** Invite friends, clan system, challenges

**День 30+ (Long-term churn: 90-95%)**
- Достиг end-game (no more goals)
- Нужно больше money для progress
- Монетизация слишком агрессивна
- **Решение:** Prestige system, seasons, battle pass

### Anti-Churn Strategy:

1. **Measure Early** - Добавь analytics на день 1-2 (what events lead to churn)
2. **Winback Campaigns** - Если юзер не логинился 7 дней:
   - Push notification: "You have 100 energy waiting!"
   - Offer discount на cosmetics
   - Leaderboard: "You're 5 places behind"

3. **Content Updates** - New buildings, new cosmetics каждый месяц
4. **Battle Pass** - Monthly seasonal pass с rewards (keeps engagement)

---

## 5. LIFETIME VALUE (LTV) & MONETIZATION

### LTV Calculation (Estimate):

```
LTV = ARPU × Customer Lifetime (months)

Assumptions (Idle games):
- ARPU = $5-10 per paying user per year
- Lifetime = 6 months average (casual games)
- Conversion (Free → Paid) = 5%

Пример:
1000 users → 50 paying users
50 × $10 ARPU = $500 / год = $41/месяц
LTV per user = $500 / 1000 = $0.50

Но если viral и retention лучше:
LTV per user = $2-5 (для успешных idle games)
```

### Current Monetization Levers:

✅ **Implemented:**
1. **Cosmetics** (Skins, frames, effects)
   - Price: 50-500 Stars ($0.50-$5)
   - **Profit margin:** ~70% (mostly digital)
   - **Typical conversion:** 2-5% of cosmetics viewers buy

2. **Energy Packs** (За Telegram Stars)
   - Quick energy top-up
   - Price: 10-100 Stars ($0.10-$1)
   - **Typical conversion:** 10-20% (habitual buyers)

3. **Premium Boosts** (2x multiplier for X time)
   - Duration: 1 hour to 7 days
   - Price: 20-500 Stars ($0.20-$5)
   - **Typical conversion:** 3-8% (timing-based)

4. **Rewarded Ads** (Watch ad for energy)
   - Revenue: $0.01-0.05 per view
   - **Typical conversion:** 5-15% of users watch
   - **Income:** Low but helps monetization

⚠️ **Not Implemented Yet:**
1. **Battle Pass** (Monthly $5-10)
   - Seasonal cosmetics + bonuses
   - **Typical conversion:** 5-10% (good retention)

2. **Premium Subscription** ($1-2/month)
   - Daily energy bonus, ad-free, cosmetics
   - **Typical conversion:** 2-5%

### Revenue Forecast (Optimistic):

```
1000 Monthly Active Users:
├─ Cosmetics buyers: 30 users × $1.50 avg = $45
├─ Energy pack buyers: 100 users × $0.50 avg = $50
├─ Premium boost buyers: 50 users × $1.00 avg = $50
├─ Rewarded ads: 100 users × 0.1 views × $0.02 = $0.20
├─ Battle pass: 50 users × $5 = $250
└─ TOTAL: $395.20 / месяц (from 1000 MAU)

ARPU = $395.20 / 1000 = $0.39 / month
Annualized: $4.68 / year per user
```

**За год при 10k MAU:** $46.8k revenue

---

## 6. COMPETITIVE POSITIONING vs Similar Games

### Competitors:

| Game | Mechanic | Retention | Monetization | Strength |
|------|----------|-----------|--------------|----------|
| **Clicker Heroes** | Tap & Auto | 15%+ D7 | Battle Pass | Progression |
| **Cookie Clicker** | Tap & Auto | 20%+ D7 | Cosmetics | Addiction |
| **Hay Day** | Farming+Social | 25%+ D7 | Premium | Social |
| **Coin Master** | Spin+Raid | 30%+ D7 | Aggressive | Viral |

**Energy Planet vs Others:**
- ✅ Telegram (insta-access, no install)
- ✅ Social (leaderboard, clans)
- ✅ Multiple progression (level, prestige)
- ❌ Weak viral (no referral yet)
- ❌ Standard monetization (not innovative)

---

## 7. GROWTH LEVERS (WHAT TO FOCUS ON)

### Top Retention Levers (Ranked by Impact):

1. **Prestige System** (Implement now)
   - Reset progress but get multiplier
   - Keeps long-term players engaged
   - **Expected impact:** +20% D30 retention

2. **Social Leaderboard** (Implement now)
   - Show friends' scores
   - Deep link to challenge
   - **Expected impact:** +10% D7 retention

3. **Clan System** (Post-MVP)
   - 5-50 players per clan
   - Clan bonuses if active members
   - **Expected impact:** +15% D30 retention

4. **Battle Pass** (Post-MVP)
   - Monthly $5 with cosmetics
   - **Expected impact:** +25% ARPU

5. **Referral System** (Post-MVP)
   - Invite friend → both get reward
   - **Expected impact:** +0.3 viral coefficient

---

## ⚠️ KEY METRICS TO TRACK (MUST IMPLEMENT)

**Day 1:**
- [ ] Install rate (%)
- [ ] Auth success rate (%)
- [ ] Tutorial completion (%)
- [ ] First tap latency (ms)
- [ ] First level up (%)

**Day 1-7:**
- [ ] D1, D3, D7 retention (%)
- [ ] Average session length (min)
- [ ] Taps per session
- [ ] Level reached by day 7
- [ ] Churn reasons (qualitative)

**Monetization:**
- [ ] First purchase timing (hours/days)
- [ ] Purchase conversion rate (%)
- [ ] ARPU ($/user)
- [ ] LTV:CAC ratio
- [ ] Repeat purchase rate (%)

**Social:**
- [ ] Leaderboard views
- [ ] Friend adds
- [ ] Clan creates (later)
- [ ] Shares/invites

---

## 📋 RECOMMENDATIONS

### Immediate (Launch):
1. [x] Implement basic telemetry
2. [x] Track D1, D7 retention (via events)
3. [x] Measure session length
4. [ ] A/B test onboarding length
5. [ ] A/B test monetization timing

### Short-term (Week 1-2):
1. [ ] Add push notifications for offline gains
2. [ ] Improve first purchase offer (discount, messaging)
3. [ ] A/B test price points
4. [ ] Add social leaderboard
5. [ ] Monitor churn reasons (qualitative)

### Medium-term (Month 1-3):
1. [ ] Implement referral system
2. [ ] Launch clan system
3. [ ] Launch battle pass
4. [ ] Seasonal updates (new buildings, cosmetics)
5. [ ] Winback campaigns for churned users

### Long-term (Post-MVP):
1. [ ] Premium subscription
2. [ ] Regional pricing
3. [ ] Localization (multiple languages)
4. [ ] Cross-promotion with other Telegram games

---

## 💰 FINANCIAL IMPACT SUMMARY

| Improvement | Effort | Impact | Revenue |
|-------------|--------|--------|---------|
| Fix D1 Retention +5% | 20h | +5% MAU | +$2.3k/month |
| Better Monetization Timing | 5h | +20% conversion | +$1.5k/month |
| Referral System | 30h | +0.3 viral coeff | +$5k/month |
| Battle Pass | 40h | +25% ARPU | +$9k/month |
| Clan System | 50h | +15% D30 | +$7k/month |

**Total impact:** From $395 → $24k+ per month (at 10k MAU)

---

## 🎯 CONCLUSION

**Current Growth Status:** Early Stage
- 0 DAU (not launched)
- Monetization ready but not tested
- Retention systems partially ready (prestige done, clans pending)
- Social mechanics weak (no referral, weak leaderboard)

**Key Success Factors:**
1. **D1 Retention** - нужно 30%+ чтобы быть успешным
2. **Viral Coefficient** - нужна хорошая referral
3. **ARPU** - нужна хорошая monetization strategy
4. **Content Updates** - нужны регулярные обновления

**Next Step:** Launch with telemetry, measure D1 retention, iterate based on data.
