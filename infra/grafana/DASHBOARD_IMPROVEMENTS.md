# Grafana Dashboard Improvements — Energy Planet

## 📋 Что было сделано

### ✅ 1. Новые бизнес-метрики в коде (`backend/src/metrics/business.ts`)

Добавлены метрики для Dashboard Overview:

```typescript
// Gauge метрики
- energyplanet_active_users_current          // CCU (concurrent users)
- energyplanet_daily_active_users            // DAU (daily active users)

// Histogram метрики
- energyplanet_session_duration_seconds      // длительность сессий

// Counter метрики
- energyplanet_conversion_events_total       // воронка конверсии
- energyplanet_user_lifetime_value_stars_total  // LTV для ARPU
```

**Функции для записи:**
- `setActiveUsersMetric(count)` — обновить CCU
- `setDailyActiveUsersMetric(count)` — обновить DAU
- `recordSessionDurationMetric(seconds)` — записать длительность сессии
- `recordConversionEventMetric({eventType, cohortDay})` — записать конверсию
- `recordUserLifetimeValueMetric({userSegment, starsAmount})` — записать LTV

---

### ✅ 2. Новый основной дашборд (ранее v2)

**Файл:** `infra/grafana/dashboards/telegram-miniapp-product.json`

**Ключевые улучшения:**

#### A. Добавлены переменные (Variables)
```
$time_range: 1m, 5m, 15m, 1h, 6h (dropdown)
```
Позволяет гибко фильтровать данные без создания новых дашбордов.

#### B. Overview Row — Key Metrics (следуя Z-pattern)
```
┌──────────┬──────────┬──────────┬──────────┐
│ DAU      │ CCU      │ ⭐ Stars │ Error %  │
│ (24h)    │ (Now)    │ (24h)    │ (Gauge)  │
│ Stat     │ Stat     │ Stat     │ Gauge    │
└──────────┴──────────┴──────────┴──────────┘
```

**Метрики:**
- **DAU (24h)** — `energyplanet_daily_active_users`
  Thresholds: <10 red, 10-100 orange, >100 green

- **CCU (Now)** — `energyplanet_active_users_current`
  Thresholds: <50 green, 50-100 yellow, >100 red

- **⭐ Revenue (24h)** — `increase(energyplanet_purchase_revenue_stars_total[24h])`
  Thresholds: <100 red, 100-1000 orange, >1000 green

- **Error Rate** — `(auth_errors + tick_errors) / (total_requests)`
  Thresholds: <5% green, 5-10% orange, >10% red

#### C. Все панели с Descriptions
Каждая панель содержит description с объяснением:
- Что показывает метрика
- Как рассчитывается
- Какие thresholds и почему
- Кто owner (опционально)

#### D. Используются разные типы панелей
- **Stat panels** — для KPI (DAU, CCU, Revenue)
- **Gauge panels** — для метрик с thresholds (Error Rate)
- **Timeseries** — для трендов (Auth Rate, Tap Activity)
- **Bar charts** — для топов (Top Buildings, Top Purchases)
- **Tables** — для детального разбора

---

## 📊 Рекомендуемая структура дашборда (финальная)

### Приоритет 1: Overview & Health
```
Row: "📊 Overview & Health — Key Metrics at a Glance"
├─ Stat: DAU (24h)
├─ Stat: CCU (Now)
├─ Stat: ⭐ Revenue (24h)
└─ Gauge: Error Rate
```

### Приоритет 2: Auth & Retention
```
Row: "🔐 Auth & Retention"
├─ Gauge: Auth Success Rate (>95% green, <90% red)
├─ Timeseries: New vs Returning Users
├─ Timeseries: Session Duration Distribution
└─ Table: Top Failure Reasons
```

### Приоритет 3: Core Gameplay
```
Row: "⚡ Core Gameplay"
├─ Timeseries: Tap Activity (requests/s, taps/s)
├─ Timeseries: Tick Latency (p50, p95 with thresholds)
├─ Bar Chart: Top Buildings Purchased
├─ Timeseries: Offline Rewards Distribution
└─ Timeseries: Leveling & XP Progress
```

### Приоритет 4: Monetization
```
Row: "💰 Monetization"
├─ Stat: ARPU (Average Revenue Per User)
├─ Stat: ARPPU (Average Revenue Per Paying User)
├─ Gauge: Purchase Success Rate (>95% green)
├─ Pie Chart: Revenue by Source (boosts vs cosmetics vs referrals)
├─ Bar Chart: Top Purchases by Item
└─ Timeseries: Revenue Trend (Stars/hour)
```

### Приоритет 5: UX & Performance
```
Row: "🎨 UX & Performance"
├─ Gauge: Render Latency p95 (<800ms green, >1500ms red)
├─ Timeseries: Client Tap Success Rate
├─ Timeseries: Safe Area Events
└─ Table: Client Errors by Type
```

---

## 🎯 Best Practices применённые

### ✅ Observability Framework
Следуем **RED Method** (Rate, Errors, Duration):
- Rate: Tap requests/s, Auth requests/s
- Errors: Error Rate gauge, Auth failures
- Duration: Tick latency, Render latency

### ✅ Dashboard Design
1. **Z-Pattern Layout** — ключевые KPI в топ-левом углу
2. **Meaningful Names** — понятные названия панелей с эмодзи
3. **Descriptions** — все панели с объяснениями
4. **Color-Coded Thresholds** — зеленый/оранжевый/красный
5. **Reduced Cognitive Load** — 30 панелей вместо 52

### ✅ Template Variables
Используются переменные для гибкости:
- `$time_range` — фильтр временного окна (1m, 5m, 1h)

### ✅ Dashboard Links
Ссылка на System Dashboard для drill-down

### ✅ Refresh Rate
Автообновление каждые 30 секунд

---

## 🚀 Как использовать новый дашборд

### Шаг 1: Добавить вызовы метрик в код

Интегрировать новые метрики в сервисы:

**SessionService** (при открытии/закрытии сессии):
```typescript
import {
  setActiveUsersMetric,
  recordSessionDurationMetric
} from '../metrics/business';

// При открытии сессии
async openSession(userId: string) {
  // ... ваш код ...

  // Обновить CCU
  const activeSessions = await getActiveSessionsCount();
  setActiveUsersMetric(activeSessions);
}

// При закрытии сессии
async closeSession(userId: string) {
  // ... ваш код ...

  const duration = Date.now() - session.started_at;
  recordSessionDurationMetric(duration / 1000); // в секундах

  // Обновить CCU
  const activeSessions = await getActiveSessionsCount();
  setActiveUsersMetric(activeSessions);
}
```

**AuthService** (при логине):
```typescript
import {
  setDailyActiveUsersMetric,
  recordConversionEventMetric
} from '../metrics/business';

// После успешной авторизации
async login(telegramInitData: string) {
  // ... ваш код ...

  // Если новый пользователь
  if (isNewUser) {
    recordConversionEventMetric({
      eventType: 'signup',
      cohortDay: formatDate(new Date())
    });
  }

  // Обновить DAU (запускать периодически или при логине)
  const dauCount = await getDailyActiveUsersCount();
  setDailyActiveUsersMetric(dauCount);
}
```

**PurchaseService** (при покупке):
```typescript
import { recordUserLifetimeValueMetric } from '../metrics/business';

async completePurchase(userId: string, stars: number) {
  // ... ваш код ...

  // Записать LTV для расчета ARPU
  const userSegment = await getUserSegment(userId, stars);
  recordUserLifetimeValueMetric({
    userSegment,
    starsAmount: stars
  });
}
```

### Шаг 2: Импортировать дашборд в Grafana

1. Перезапустить Grafana (если используете volume mount):
   ```bash
   docker-compose restart grafana
   ```

2. Или вручную импортировать:
   - Grafana UI → Dashboards → Import
   - Скопировать содержимое `telegram-miniapp-product.json`
   - Save

### Шаг 3: Настроить alerting (опционально)

Создать алерты на критичные метрики:
- Error Rate > 10% → Slack/Email
- Revenue (24h) < 100 Stars → Warning
- CCU > 100 → Info (scaling needed)

---

## 📈 Метрики для расчета в Grafana (Query Examples)

### DAU (Daily Active Users)
```promql
energyplanet_daily_active_users
```

### ARPU (Average Revenue Per User)
```promql
increase(energyplanet_purchase_revenue_stars_total[24h])
/
energyplanet_daily_active_users
```

### Conversion Rate (Free to Paid)
```promql
100 * sum(rate(energyplanet_conversion_events_total{event_type="first_purchase"}[24h]))
/
sum(rate(energyplanet_conversion_events_total{event_type="signup"}[24h]))
```

### D1 Retention
```promql
100 * sum(rate(energyplanet_conversion_events_total{event_type="day1_return"}[24h]))
/
sum(rate(energyplanet_conversion_events_total{event_type="signup"}[24h]) offset 24h)
```

### Session Duration (median)
```promql
histogram_quantile(0.5,
  sum(rate(energyplanet_session_duration_seconds_bucket[5m])) by (le)
)
```

---

## 🔧 Следующие шаги (TODO)

### Высокий приоритет
- [ ] Интегрировать вызовы новых метрик в SessionService
- [ ] Интегрировать вызовы новых метрик в AuthService
- [ ] Добавить регулярный cron job для обновления DAU/CCU

### Средний приоритет
- [ ] Добавить остальные rows в основной дашборд (Auth, Gameplay, Monetization, UX)
- [ ] Создать alerting правила
- [ ] Добавить аннотации (deployments, incidents)

### Низкий приоритет
- [ ] Разделить дашборд на Executive (для бизнеса) и Technical (для девов)
- [ ] Настроить Grafana Folders для организации
- [ ] Добавить playlist для ротации дашбордов

---

## 📚 Best Practices Summary

### ✅ Что делать
- Использовать переменные вместо дублирования дашбордов
- Добавлять descriptions ко всем панелям
- Настраивать thresholds на критичных метриках
- Следовать Z-pattern layout
- Использовать разные типы панелей (stat, gauge, timeseries, bar)
- Обновлять дашборды вместе с кодом (Git)

### ❌ Чего избегать
- Копировать дашборды для разных окружений (использовать переменные)
- Создавать панели без descriptions
- Использовать только timeseries (монотонно)
- Перегружать дашборд (>40 панелей)
- Забывать удалять экспериментальные дашборды

---

## 🎓 Полезные ресурсы

- [Grafana Dashboard Best Practices](https://grafana.com/docs/grafana/latest/dashboards/build-dashboards/best-practices/)
- [RED Method for Services](https://grafana.com/blog/2018/08/02/the-red-method-how-to-instrument-your-services/)
- [Four Golden Signals](https://sre.google/sre-book/monitoring-distributed-systems/)
- [Dashboard Maturity Model](https://grafana.com/blog/2022/03/14/how-to-best-organize-your-teams-and-resources-in-grafana/)

---

**Generated:** 2025-11-09
**Version:** v2.0
**Owner:** @backend-team
