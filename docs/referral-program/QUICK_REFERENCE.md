# Quick Reference: Реферальная программа

**Шпаргалка для быстрого старта**

---

## 🎯 Главное за 1 минуту

### Текущее состояние: 6.5/10

**Работает:**
✅ Двусторонние награды (300⭐ + 350⭐)
✅ Revenue share (1% от покупок)
✅ Milestones (1, 5, 15, 30 рефералов)
✅ Telegram интеграция

**НЕ работает:**
❌ **КРИТИЧНО:** Автоактивация кода (конверсия 5% вместо 90%)
❌ **КРИТИЧНО:** Fraud prevention (теряем $2-5K/месяц)
❌ Gamification (нет leaderboard)
❌ Smart timing (нет event-driven промтов)

### Quick Win (30 минут):
**Автоактивация → Conversion +1700%**

---

## 📚 Навигация по документам

| Документ | Для кого | Читать если... |
|----------|----------|----------------|
| [EXECUTIVE_SUMMARY](./EXECUTIVE_SUMMARY.md) | CEO, Product Lead | Нужен overview + ROI |
| [README](./README.md) | Все | Первый раз смотришь документацию |
| [USER_EXPERIENCE_GUIDE](./USER_EXPERIENCE_GUIDE.md) | Product, Marketing | Хочешь понять user journey |
| [AUTO_ACTIVATION_GUIDE](./AUTO_ACTIVATION_GUIDE.md) 🔴 | Frontend Dev | MUST READ - Quick Win! |
| [REFERRAL_ANALYSIS](./REFERRAL_ANALYSIS.md) | Engineering | Нужны технические детали |
| [BEST_PRACTICES](./BEST_PRACTICES.md) | Product, UX | Изучаешь индустрию |
| [IMPLEMENTATION_ROADMAP](./IMPLEMENTATION_ROADMAP.md) | Eng Lead, PM | Планируешь спринты |
| [FRAUD_PREVENTION](./FRAUD_PREVENTION.md) | Security, Backend | Имплементируешь защиту |

---

## ⚡ Quick Start по ролям

### Frontend Developer
```bash
1. Прочитай: AUTO_ACTIVATION_GUIDE.md
2. Создай 3 файла (30 минут):
   - webapp/src/utils/telegram.ts
   - webapp/src/hooks/useAutoReferral.ts
   - Добавь hook в App.tsx
3. Deploy → Конверсия +1700%
```

### Backend Developer
```bash
1. Прочитай: FRAUD_PREVENTION.md → Implementation Guide
2. Sprint 1 tasks (Week 1-2):
   - Create FraudDetectionService.ts
   - Migration: IP tracking table
   - Delayed rewards system
3. Deploy → Fraud -75%
```

### Product Manager
```bash
1. Прочитай: EXECUTIVE_SUMMARY.md (10 минут)
2. Прочитай: USER_EXPERIENCE_GUIDE.md (понять UX)
3. Review: IMPLEMENTATION_ROADMAP.md (approve sprints)
4. Action: Approve автоактивацию ASAP
```

### Security Team
```bash
1. Прочитай: FRAUD_PREVENTION.md → Threat Model
2. Review: Detection techniques
3. Approve: Thresholds и monitoring
4. Setup: Incident response процессы
```

---

## 🔥 Top 3 Priorities

### 1️⃣ AUTO-ACTIVATION (Сделать СЕЙЧАС!)

**Почему:**
- Conversion 5% → 90% (+1700%)
- 30 минут работы
- ROI: немедленный

**Что делать:**
```typescript
// 1. webapp/src/utils/telegram.ts
export function getTelegramStartParam() {
  return window.Telegram?.WebApp?.initDataUnsafe?.start_param || null
}

export function parseReferralCode(param: string | null) {
  return param?.match(/^ref_(.+)$/)?.[1] || null
}

// 2. webapp/src/hooks/useAutoReferral.ts
export function useAutoReferral() {
  useEffect(() => {
    const param = getTelegramStartParam()
    const code = parseReferralCode(param)
    if (code && !alreadyReferred) {
      activateCode(code)
    }
  }, [])
}

// 3. App.tsx
function App() {
  useAutoReferral() // ← Добавить эту строку
  return <YourApp />
}
```

**Проверка:**
```bash
# Test в dev:
window.Telegram = {
  WebApp: {
    initDataUnsafe: { start_param: 'ref_EP-TEST' }
  }
}

# Должно автоматически активировать код EP-TEST
```

---

### 2️⃣ FRAUD PREVENTION (Week 1-2)

**Почему:**
- Сейчас теряем $2-5K/месяц
- Fraud rate 30-40%
- Нечестная конкуренция

**Минимальная защита (День 1):**
```typescript
// При активации кода:
async function activateCode(userId, code, context) {
  // 1. IP check
  const referrerIP = await getUserIP(referrerId)
  if (referrerIP === context.ip) {
    throw new Error('SAME_IP_DETECTED')
  }

  // 2. Email check
  const normalized = normalizeEmail(user.email)
  const duplicate = await findByNormalizedEmail(normalized)
  if (duplicate) {
    throw new Error('EMAIL_DUPLICATE')
  }

  // 3. Velocity check
  const recentActivations = await countActivationsByIP(context.ip, '24h')
  if (recentActivations >= 3) {
    throw new Error('VELOCITY_EXCEEDED')
  }

  // Existing logic...
}
```

---

### 3️⃣ FIX MILESTONES (2 часа)

**Почему:**
- Gap между 1 и 5 слишком большой
- Best practice: первый milestone ≤ 2 реферала

**Что делать:**
```json
// backend/content/referrals.json

// БЫЛО:
"milestones": [
  { "id": "first_crew", "threshold": 1, "rewards": { "stars": 500 } },
  { "id": "expedition", "threshold": 5, "rewards": { "stars": 1500 } },  ← Gap!
  ...
]

// СТАЛО:
"milestones": [
  { "id": "first_crew", "threshold": 1, "rewards": { "stars": 300 } },
  { "id": "growing_squad", "threshold": 3, "rewards": { "stars": 800 } }, ← NEW
  { "id": "expedition", "threshold": 7, "rewards": { "stars": 2000 } },
  { "id": "galactic_club", "threshold": 15, "rewards": { "stars": 5000 } },
  { "id": "legend_circle", "threshold": 30, "rewards": { "stars": 12000 } },
  { "id": "cosmic_influencer", "threshold": 50, "rewards": { "stars": 25000 } } ← NEW
]
```

---

## 📊 Метрики (что мониторить)

### Автоактивация (после deploy)
```
✅ start_param detected: >95%
✅ Auto-activation success: >90%
❌ Errors: <5%

Alert if:
- Success rate <80%
- Error rate >10%
```

### Fraud Detection (после Sprint 1)
```
✅ Fraud detected: Track daily
✅ False positives: <5%
✅ Legitimate approved: >95%

Alert if:
- Fraud rate >15%
- False positive >10%
```

### Overall Health
```
Viral Coefficient: >0.8 (target)
Conversion Rate: >85% (с автоактивацией)
Fraud Rate: <10%
Retention D7: >40%
```

---

## 🛠️ Полезные команды

### Backend

```bash
# Посмотреть текущие метрики
psql -d energyplanet -c "
  SELECT
    COUNT(*) as total_activations,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24h') as today,
    COUNT(DISTINCT referrer_id) as unique_referrers
  FROM referral_relations
  WHERE status = 'activated'
"

# Проверить fraud suspects
psql -d energyplanet -c "
  SELECT referrer_id, COUNT(*) as count
  FROM referral_relations
  WHERE created_at > NOW() - INTERVAL '7d'
  GROUP BY referrer_id
  HAVING COUNT(*) > 10
  ORDER BY count DESC
"

# Revenue share totals
psql -d energyplanet -c "
  SELECT
    SUM(share_amount) as total_granted,
    COUNT(DISTINCT referrer_id) as active_referrers
  FROM referral_revenue_events
  WHERE granted_at > NOW() - INTERVAL '30d'
"
```

### Frontend

```javascript
// Debug Telegram WebApp
console.log('Telegram WebApp:', window.Telegram?.WebApp)
console.log('Start param:', window.Telegram?.WebApp?.initDataUnsafe?.start_param)

// Test auto-activation locally
window.Telegram = {
  WebApp: {
    initDataUnsafe: {
      start_param: 'ref_EP-TEST'
    }
  }
}

// Force reload
location.reload()
```

---

## 🚨 Troubleshooting

### Автоактивация не работает

**Проблема:** `start_param` is `undefined`

**Решения:**
1. Проверь формат ссылки: `?startapp=ref_CODE` (не `?start=`)
2. Telegram WebApp должен быть инициализирован
3. Параметр доступен только при запуске через ссылку (не при обычном открытии)

**Debug:**
```javascript
console.log('WebApp available:', !!window.Telegram?.WebApp)
console.log('Start param:', window.Telegram?.WebApp?.initDataUnsafe?.start_param)
```

---

### Код активируется многократно

**Проблема:** Hook срабатывает при каждом render

**Решение:**
```typescript
const attempted = useRef(false)

useEffect(() => {
  if (attempted.current) return
  attempted.current = true
  // ... activation logic
}, []) // Empty deps!
```

---

### False positives в fraud detection

**Проблема:** Легитимные пользователи блокируются

**Решение:**
1. Проверь thresholds (может быть слишком строго)
2. Добавь manual review queue
3. Разреши appeals
4. Логируй все блокировки для анализа

---

## 💡 Часто задаваемые вопросы

### Q: Когда делать автоактивацию?
**A:** НЕМЕДЛЕННО. Это 30 минут работы с ROI 18×.

### Q: Сколько стоит fraud prevention?
**A:** ~$8K разработка, экономия $2-5K/месяц. Payback <2 месяца.

### Q: Нужно ли делать все улучшения?
**A:** Нет. Приоритеты:
1. Auto-activation (критично)
2. Fraud prevention (критично)
3. Остальное по возможности

### Q: Какой timeline реалистичен?
**A:**
- Auto-activation: 1 день
- Fraud prevention: 2 недели
- Full roadmap: 12 недель

### Q: Как измерить success?
**A:** Ключевые метрики:
- Conversion rate >85%
- Fraud rate <10%
- Viral coefficient >0.8
- Retention D7 >40%

---

## 📞 Контакты

**Вопросы по:**
- Автоактивации → Frontend Lead
- Fraud prevention → Security Team
- Roadmap → Engineering Lead
- Бизнес-кейс → Product Lead

**Документация:**
- Issues: GitHub
- Updates: Engineering Slack
- Reviews: Weekly sync

---

## ✅ Чеклист перед стартом

### Product Manager
- [ ] Прочитал EXECUTIVE_SUMMARY
- [ ] Понял ROI автоактивации
- [ ] Approved roadmap
- [ ] Aligned с Engineering Lead

### Engineering Lead
- [ ] Прочитал IMPLEMENTATION_ROADMAP
- [ ] Allocated resources
- [ ] Setup project tracking
- [ ] Scheduled kickoff

### Frontend Developer
- [ ] Прочитал AUTO_ACTIVATION_GUIDE
- [ ] Понял Telegram WebApp API
- [ ] Готов к имплементации
- [ ] Setup test environment

### Backend Developer
- [ ] Прочитал FRAUD_PREVENTION
- [ ] Понял threat model
- [ ] Готов к Sprint 1
- [ ] DB migrations reviewed

### Security Team
- [ ] Reviewed threat model
- [ ] Approved detection methods
- [ ] Setup monitoring
- [ ] Defined incident response

---

**Последнее обновление:** 2025-11-16
**Версия:** 1.0
