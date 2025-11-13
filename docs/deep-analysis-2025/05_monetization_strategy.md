# Стратегия монетизации Energy Planet

**Дата:** Ноябрь 2025
**Фокус:** Telegram Stars + Rewarded Ads

---

## 💰 Dual Monetization Model

### 1. Telegram Stars (Primary)
**Валюта:** XTR (Telegram Stars)
**Комиссия:** 0% (политика 2025)
**Конверсия:** 1 Star ≈ $0.01-0.015

### 2. Rewarded Ads (Secondary)
**SDK:** Monetag (рекомендуется)
**CPM:** $2+ (Telegram TMA)
**Fill Rate:** 100%

---

## 📊 Revenue Projections

### Month 1 (1,000 DAU)
```
Telegram Stars:
• 10% conversion rate = 100 payers
• $1 ARPPU = $100/day
• Monthly: $3,000

Rewarded Ads:
• 60% ad viewers
• 3 ads/day average
• $2 CPM
• Daily: $3.60
• Monthly: $108

Total Month 1: ~$3,100
```

### Month 3 (10,000 DAU)
```
Telegram Stars: $30,000
Rewarded Ads: $1,800
Total: ~$31,800/month
```

---

## 🛒 Product Catalog

### Energy Packs

| Product | Energy | Stars | $/Star | Value/$ |
|---------|--------|-------|--------|---------|
| Small | 10,000 | 10 | $0.10 | 100K E/$ |
| **Medium** ⭐ | 50,000 | 40 | $0.40 | **125K E/$** |
| Large | 150,000 | 100 | $1.00 | 150K E/$ |

**Best practices:**
- Highlight "BEST VALUE" (Medium pack)
- Show bonus percentage (+25% vs Small)
- Limited-time offers для urgency

---

### Premium Boosts

| Duration | Effect | Stars | $/day |
|----------|--------|-------|-------|
| 1 Hour | +200% income | 50 | $1.20 |
| 24 Hours | +200% income | 400 | $0.40 |
| 7 Days | +200% income | 2,000 | $0.27 |

**Pricing strategy:**
- Hourly для импульсных покупок
- Weekly для whale players
- Bulk discount поощряет commitment

---

### Cosmetics

| Rarity | Price | Target Audience |
|--------|-------|-----------------|
| Common | 100 ⭐ | Mid spenders |
| Rare | 250 ⭐ | Collectors |
| Epic | 500 ⭐ | Whales |

**Mix:**
- 60% free (achievements, levels)
- 40% premium (Stars)

---

## 🎬 Rewarded Ads Integration

### Monetag SDK Setup

```typescript
// webapp/public/index.html
<script src="https://alwingulla.com/88/tag.min.js" data-zone="YOUR_ZONE_ID"></script>

// webapp/src/services/ads.ts
class AdService {
  showRewardedAd(onReward: () => void, onError: () => void) {
    if (typeof window.AdProvider === 'undefined') {
      onError();
      return;
    }

    window.AdProvider.showRewardedAd({
      onAdCompleted: () => {
        onReward();
      },
      onAdError: (error) => {
        console.error('Ad error:', error);
        onError();
      }
    });
  }
}
```

### Ad Placements

**1. Energy Boost (Primary)**
```
[Watch ad for +100% tap income (5 min)]
• После 3-5 минут игры
• Cooldown: 0 (unlimited)
• Reward: Immediate boost
```

**2. Energy Reward (Secondary)**
```
[Watch ad for instant energy]
• Когда энергия < 10% для upgrade
• Cooldown: 5 минут
• Reward: 500 × player_level Energy
```

**3. Building Speed-up (Tertiary)**
```
[Skip 1 hour of offline time]
• При возвращении после > 2 часов
• Cooldown: 12 часов
• Reward: 1 hour passive income
```

---

## 💳 Telegram Stars Implementation

### Invoice Creation

```typescript
// backend/src/services/PurchaseService.ts
async createInvoice(userId: string, productId: string) {
  const product = this.getProduct(productId);

  // Создаём invoice через Bot API
  const invoice = await telegram.createInvoiceLink({
    title: product.name,
    description: product.description,
    payload: JSON.stringify({
      user_id: userId,
      product_id: productId,
      purchase_id: uuidv4(), // Для idempotency
    }),
    currency: 'XTR', // Telegram Stars
    prices: [{ label: product.name, amount: product.stars }],
  });

  return invoice.url;
}
```

### Client Payment Flow

```typescript
// webapp/src/components/ShopPanel.tsx
const handlePurchase = async (productId: string) => {
  try {
    // 1. Создаём invoice на backend
    const { invoiceUrl } = await api.post('/purchase/invoice', { productId });

    // 2. Открываем нативное окно оплаты Telegram
    const tg = window.Telegram.WebApp;

    tg.openInvoice(invoiceUrl, (status) => {
      if (status === 'paid') {
        // 3. Подтверждаем на backend
        api.post('/purchase/confirm', {
          productId,
          invoiceUrl
        }).then(() => {
          // 4. Обновляем UI
          showSuccess('Purchase successful!');
          refetchBalance();
        });
      } else {
        showError('Purchase cancelled');
      }
    });
  } catch (error) {
    showError('Purchase failed');
  }
};
```

### Webhook Handling

```typescript
// backend/src/api/routes/webhook.ts
router.post('/telegram/payment', async (req, res) => {
  const update = req.body;

  // Валидация webhook signature
  if (!validateTelegramWebhook(update)) {
    return res.sendStatus(401);
  }

  if (update.pre_checkout_query) {
    // Pre-checkout validation
    const payload = JSON.parse(update.pre_checkout_query.invoice_payload);

    // Проверяем что user всё ещё существует и активен
    const user = await userRepo.getById(payload.user_id);
    if (!user) {
      await telegram.answerPreCheckoutQuery(
        update.pre_checkout_query.id,
        false,
        'User not found'
      );
      return res.sendStatus(200);
    }

    // Одобряем
    await telegram.answerPreCheckoutQuery(
      update.pre_checkout_query.id,
      true
    );
  }

  if (update.successful_payment) {
    // Payment confirmed - зачисляем товар
    const payload = JSON.parse(update.successful_payment.invoice_payload);

    await purchaseService.processPurchase(
      payload.user_id,
      payload.product_id,
      payload.purchase_id // Idempotency key
    );
  }

  res.sendStatus(200);
});
```

---

## 📈 Optimization Tactics

### 1. Dynamic Pricing (A/B Test)

```typescript
// Разные цены для разных сегментов
const getPricing = (userId: string) => {
  const segment = getUserSegment(userId);

  return {
    whale: {
      // Выше цены, больше value
      medium_pack: 45, // +12.5% price
    },
    regular: {
      medium_pack: 40, // Standard
    },
    new_user: {
      // Первая покупка со скидкой
      medium_pack: 30, // -25% discount
    },
  }[segment];
};
```

### 2. Limited-Time Offers

```typescript
// Flash sale механика
interface Offer {
  productId: string;
  discount: number; // 0.5 = 50% off
  expiresAt: Date;
}

const getActiveOffer = (): Offer | null => {
  const now = new Date();
  const offers = [
    {
      productId: 'large_pack',
      discount: 0.3, // 30% off
      expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 24h
    },
  ];

  return offers.find(o => o.expiresAt > now) || null;
};
```

### 3. First Purchase Bonus

```typescript
const getFirstPurchaseBonus = async (userId: string) => {
  const purchases = await purchaseRepo.getByUserId(userId);

  if (purchases.length === 0) {
    return {
      bonus: 2.0, // 2x energy
      message: 'First purchase bonus: 2x energy!',
    };
  }

  return null;
};
```

---

## 🎯 Conversion Optimization

### Purchase Triggers

**1. Progress Blocker**
```
User нужно 10,000 E для upgrade
User имеет 8,000 E
→ Show: "Need 2,000 more? Get energy pack!"
```

**2. Achievement Tease**
```
User на 90% к level up
→ Show: "Almost there! Boost to level up faster"
```

**3. FOMO (Limited Cosmetic)**
```
"Cyber Frame available for 3 days only!"
+ Countdown timer
```

---

## 📊 Metrics Tracking

### Key Metrics

```typescript
interface MonetizationMetrics {
  // Conversion
  conversion_rate: number; // % of users who purchased
  first_purchase_rate: number; // % who made 1st purchase
  repeat_purchase_rate: number; // % who purchased 2+ times

  // Revenue
  arpdau: number; // Average Revenue Per DAU
  arppu: number; // Average Revenue Per Paying User
  ltv: number; // Lifetime Value per user

  // Ads
  ad_impressions: number;
  ad_completion_rate: number; // % who watched full ad
  ad_revenue: number;
}
```

### Cohort Analysis

```sql
-- Revenue by cohort (users joined in same week)
SELECT
  DATE_TRUNC('week', u.created_at) as cohort_week,
  COUNT(DISTINCT u.id) as users,
  COUNT(DISTINCT p.user_id) as paying_users,
  SUM(p.amount_stars) as total_stars,
  SUM(p.amount_stars) / COUNT(DISTINCT u.id) as arpdau
FROM users u
LEFT JOIN purchases p ON p.user_id = u.id
  AND p.created_at BETWEEN u.created_at AND u.created_at + INTERVAL '30 days'
GROUP BY cohort_week
ORDER BY cohort_week DESC;
```

---

## 🎁 Retention через Monetization

### Daily Login Rewards

```
Day 1: 1,000 Energy (free)
Day 3: 5,000 Energy (free)
Day 7: Premium Boost (1h) (free)
Day 14: Rare Cosmetic (free)
Day 30: Epic Cosmetic (free)
```

**Goal:** Habit formation → higher LTV

---

### Battle Pass (Future)

```
Free Track:
• Tier 1-10: Basic rewards
• Completion: 1 Rare cosmetic

Premium Track (500 Stars):
• Tier 1-10: 2x rewards
• Tier 11-20: Exclusive cosmetics
• Completion: 1 Epic cosmetic
```

**Revenue potential:** 15-20% take rate

---

## 💡 Best Practices Summary

### DO:
- ✅ Highlight best value
- ✅ Offer bulk discounts
- ✅ Mix free & premium content (60/40)
- ✅ Non-intrusive ad placements
- ✅ Idempotent purchases
- ✅ Clear value proposition

### DON'T:
- ❌ Pay-to-win mechanics
- ❌ Forced ads
- ❌ Hidden costs
- ❌ Aggressive upsells
- ❌ Misleading offers

---

**Target ARPDAU:** $0.15-0.20
**Path:** Stars 70% + Ads 30%

**Следующий:** [Technical Optimization](./06_technical_optimization.md)
