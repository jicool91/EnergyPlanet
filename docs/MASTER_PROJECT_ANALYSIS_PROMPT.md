# 🎯 MASTER PROJECT ANALYSIS PROMPT
## Для анализа проектов с целью достижения крутого, красивого и прибыльного результата

**Версия:** 1.0
**Автор:** Claude Code (Multi-Disciplinary Analyst)
**Назначение:** Комплексный анализ проектов на мировом уровне

---

## 📌 КАК ИСПОЛЬЗОВАТЬ ЭТОТ ПРОМПТ:

Когда ты дашь мне задачу "проанализируй проект" или "помоги улучшить проект", я буду применять этот подход:

```
Я буду анализировать ТЕ ЖЕ ДАННЫЕ одновременно через 7 линз:
1. 👨‍💻 Technical Architect (код, масштабируемость, performance)
2. 📊 Growth Analyst (конверсия, retention, LTV, фанель)
3. 💰 Product Strategist (positioning, pricing, market fit)
4. 🎨 Product Designer (UX, visual hierarchy, psychology)
5. 📈 Data Scientist (metrics, A/B tests, forecasting)
6. 🔍 Systems Analyst (взаимозависимости, узкие места)
7. 💎 Product Excellence Officer (синтез всего выше + общая стратегия)
```

---

## 🔥 ПОЛНЫЙ ПРОЦЕСС АНАЛИЗА:

### ФАЗА 1️⃣: DISCOVERY (Сбор информации)

**Я спрашиваю тебя (вплоть до деталей):**

```
📋 О ПРОЕКТЕ:
□ Что это за проект? (игра, SaaS, соцсеть, маркетплейс?)
□ На каком этапе развития? (MVP, growth, scale, mature?)
□ Какая текущая аудитория? (DAU, MAU, целевой рынок)
□ Какие основные KPI? (доход, retention, engagement, etc)

🏗️ О ТЕХНОЛОГИИ:
□ Какой стек? (Frontend, Backend, Database, Infrastructure)
□ Какой уровень качества кода? (0-10)
□ Есть ли архитектурные долги?
□ Какой потенциал масштабируемости?

💰 О МОНЕТИЗАЦИИ:
□ Какой текущий MRR/ARR? (если есть)
□ Какая модель монетизации? (subscription, IAP, ads, freemium?)
□ Какой текущий price point?
□ Есть ли A/B тесты для цен?

📊 О ПОЛЬЗОВАТЕЛЯХ:
□ Кто твои пользователи?
□ Какова D1 retention? D7? D30?
□ Где пользователи находят проект?
□ Какова текущая конверсия в покупки?

🎯 О ЦЕЛЯХ:
□ Какой финальный годовой доход?
□ За какой timeline это нужно?
□ Какие ограничения есть? (бюджет, люди, время)
```

---

### ФАЗА 2️⃣: SIMULTANEOUS ANALYSIS (Анализ одновременно всеми "шляпами")

**Я анализирую проект с 7 позиций ОД НОВРЕМЕННО:**

---

#### 👨‍💻 LENS #1: TECHNICAL ARCHITECT

**Что я проверяю:**
```
✓ Архитектура - масштабируемая ли? Есть ли долги?
✓ Code quality - чистый код или технический мусор?
✓ Performance - быстро ли работает? Где узкие места?
✓ Dependencies - правильный выбор технологий?
✓ Testing coverage - есть ли тесты? На каком уровне?
✓ DevOps/Infrastructure - может ли масштабироваться?
```

**Мой отчет будет содержать:**
- Score: 0-10 (качество архитектуры)
- Top 3 technical debts
- Performance bottlenecks
- Architecture recommendations
- Time to implement = X hours

---

#### 📊 LENS #2: GROWTH ANALYST

**Что я проверяю:**
```
✓ Conversion funnel - где теряют пользователей?
✓ Retention loops - что их удерживает?
✓ Viral coefficient - растет ли органически?
✓ User acquisition cost - сколько стоит привести юзера?
✓ Lifetime value - сколько будет тратить за жизнь?
✓ Churn reasons - почему уходят?
```

**Мой отчет будет содержать:**
- Current funnel metrics
- D1, D7, D30 retention analysis
- Conversion bottlenecks (где теряют людей)
- Growth levers (что можно улучшить)
- Forecast: $X влияние от каждого улучшения

---

#### 💰 LENS #3: PRODUCT STRATEGIST

**Что я проверяю:**
```
✓ Price positioning - правильная ли цена?
✓ Market positioning - кто конкуренты? где ниша?
✓ Product-market fit - нужна ли эта штука?
✓ Revenue model - монетизирует ли правильно?
✓ Pricing psychology - правильные ли ценовые уровни?
✓ Competitive advantage - что уникального?
```

**Мой отчет будет содержать:**
- Competitive analysis (vs top 3 competitors)
- Pricing ladder analysis
- Market size estimation
- Revenue potential
- Strategic recommendations

---

#### 🎨 LENS #4: PRODUCT DESIGNER (UX/UI)

**Что я проверяю:**
```
✓ Visual hierarchy - что в фокусе? Что скрыто?
✓ CTA placement - где кнопки? Видны ли?
✓ User flow - логичный ли путь к покупке?
✓ Design system - консистентен ли дизайн?
✓ Accessibility - могут ли использовать все?
✓ Friction points - где пользователи "тупят"?
```

**Мой отчет будет содержать:**
- UX score: 0-10
- Critical friction points
- Design recommendations
- Predicted impact on conversion

---

#### 📈 LENS #5: DATA SCIENTIST

**Что я проверяю:**
```
✓ Current metrics - что логируется?
✓ Analytics gaps - что НУЖНО логировать?
✓ A/B testing readiness - готов ли к тестам?
✓ Data quality - правильно ли собираются данные?
✓ Forecasting - можешь ли предсказать результат?
✓ Correlation vs causation - какие реально работают рычаги?
```

**Мой отчет будет содержать:**
- Critical analytics gaps
- A/B test recommendations
- Forecast models for each change
- Statistical significance requirements

---

#### 🔍 LENS #6: SYSTEMS ANALYST

**Что я проверяю:**
```
✓ Dependencies - как одно влияет на другое?
✓ Trade-offs - что теряем, что получаем?
✓ Bottlenecks - где самые узкие места?
✓ Risks - что может пойти не так?
✓ Constraints - что ограничивает рост?
✓ Feedback loops - какие циклы есть?
```

**Мой отчет будет содержать:**
- System dependency map
- Top 5 constraints
- Risk analysis
- Recommended sequence of changes

---

#### 💎 LENS #7: PRODUCT EXCELLENCE OFFICER

**Что я делаю:**
```
✓ Синтез всех 6 выше
✓ Идентифицирую СИСТЕМНЫЕ проблемы (видны только из всех углов)
✓ Создаю unified strategy
✓ Расставляю приоритеты
✓ Прогнозирую результаты
✓ Даю дорожную карту с финансовыми предсказаниями
```

---

### ФАЗА 3️⃣: CROSS-ROLE SYNTHESIS (Синтез)

**Я ищу ВЗАИМОЗАВИСИМОСТИ между ролями:**

```
Пример:
┌─────────────────────────────────────┐
│ Техник видит: "Code хороший"        │
│ Маркетолог видит: "Shop на #2"      │  ← КОНФЛИКТ
│ Дизайнер видит: "UI красивый"       │
│ Финансист видит: "2-уровневая цена" │
│ Аналитик видит: "Нет tracking"      │
│ Систем видит: "Эти проблемы связаны"│
│ EXCELLENCE видит: "Нужна стратегия" │
└─────────────────────────────────────┘

Решение (только видно когда смотриш ВСЕ):
1. Move Shop → но это требует redesign (техник + дизайнер)
2. Переделать price ladder → но нужны A/B тесты (финанс + аналитик)
3. Добавить tracking → но это performance hit (техник + аналитик)
4. Результат: стратегия где всё скоординировано
```

---

### ФАЗА 4️⃣: DELIVERABLES (Что я выдаю)

**Я предоставляю:**

#### 1️⃣ EXECUTIVE SUMMARY (1 стр)
```
• Текущий статус проекта
• 3 главные проблемы
• 3 главные возможности
• Финансовый потенциал
• Рекомендуемый путь
```

#### 2️⃣ DETAILED ANALYSIS (по каждой роли)
```
Для каждой из 7 ролей:
├─ Current state (как сейчас)
├─ Issues found (что не так)
├─ Opportunities (что можно улучшить)
├─ Recommendations (конкретные шаги)
├─ Impact forecast (результат в $$$)
└─ Timeline (сколько времени)
```

#### 3️⃣ CROSS-ROLE INSIGHTS
```
Взаимозависимости:
├─ Техник vs Маркетолог - где конфликты?
├─ Дизайнер vs Финансист - что нужно compromise?
├─ Аналитик vs Все - какие данные нужны?
└─ Системные проблемы (видны только из всех углов)
```

#### 4️⃣ STRATEGIC ROADMAP
```
Фаза 1: Quick wins (неделя 1-2) = $X доход
Фаза 2: Core improvements (неделя 3-4) = $Y доход
Фаза 3: Advanced features (месяц 2) = $Z доход
Фаза 4: Scale & optimize (месяц 3+) = $W доход

ИТОГО: $Current → $Target (X% growth)
```

#### 5️⃣ FINANCIAL FORECAST
```
Scenario A (Conservative): $X/месяц
Scenario B (Aggressive): $Y/месяц
Scenario C (Viral): $Z/месяц

Что нужно для каждого сценария (resources, time, effort)
```

#### 6️⃣ RISK ANALYSIS & MITIGATION
```
Главные риски:
├─ Technical (performance, scalability)
├─ Market (competition, positioning)
├─ Financial (price sensitivity, CAC)
├─ UX (adoption, friction)
└─ Execution (timeline, resources)

Как их mitigate
```

---

## 🎯 КРИТЕРИИ АНАЛИЗА (На чего я смотрю)

### ДЛЯ КРАСИВОГО ПРОЕКТА:
```
✓ Code quality: 8+/10 (clean, maintainable, documented)
✓ Design quality: 8+/10 (consistent, intuitive, accessible)
✓ Architecture: 8+/10 (scalable, modular, testable)
✓ UX: 8+/10 (smooth, frictionless, delightful)
```

### ДЛЯ КРУТОГО ПРОЕКТА:
```
✓ Retention: 30%+ D1, 10%+ D7
✓ Growth: 20%+ MoM growth
✓ Product-market fit: strong PMF signals
✓ Innovation: unique features vs competitors
```

### ДЛЯ ПРИБЫЛЬНОГО ПРОЕКТА:
```
✓ Revenue: $50k+ MRR
✓ ARPU: $20+ (или equivalent)
✓ LTV:CAC ratio: 3:1 or better
✓ Unit economics: profitable at scale
```

---

## 📊 METRICS I'LL USE

**Техник:**
- Code coverage: %
- Performance score: 0-100
- Technical debt: hours to fix
- Scalability rating: current limit

**Маркетолог:**
- Conversion funnel: % at each step
- D1/D7/D30 retention: %
- CAC: $ per user
- LTV: $ total per user lifetime

**Стратег:**
- Market size: $XXM
- Competition score: 1-10
- PMF rating: 1-10
- Pricing power: 1-10

**Дизайнер:**
- Visual hierarchy score: 1-10
- CTA visibility: 1-10
- Friction points: count
- Accessibility score: 1-10

**Аналитик:**
- Data completeness: %
- A/B test readiness: 1-10
- Forecast accuracy: ±X%
- Key metric tracking: count

**Систем:**
- System health: 1-10
- Dependency complexity: count
- Constraint severity: 1-10 each
- Risk score: 1-100

**Excellence:**
- Overall project score: 0-100
- Gap to excellent: %
- Potential if fixed: $X
- Recommended focus: TOP 3 priorities

---

## 🎬 КОГДА Я ПРИМЕНЯЮ ЭТОТ ПРОМПТ

**Используй этот промпт когда:**

✅ Нужен глубокий анализ проекта (не просто код ревью)
✅ Хочешь понять откуда деньги и почему их не хватает
✅ Нужна стратегия для scaling (не просто фишки)
✅ Хочешь увидеть СИСТЕМНЫЕ проблемы (не локальные)
✅ Готовишься к большому реефакторингу или pivot
✅ Ищешь где настоящие bottleneck'и

---

## 💬 КАК ПРОСИТЬ АНАЛИЗ:

**ВАРИАНТ 1 (Минимально):**
```
"Проанализируй мой проект (даю доступ к коду)"
→ Я применю ПОЛНЫЙ MASTER PROMPT
```

**ВАРИАНТ 2 (С контекстом):**
```
"Это игра, MVP, 100k DAU, хочу $1M/месяц за 3 месяца"
→ Я применю MASTER PROMPT с фокусом на твои цели
```

**ВАРИАНТ 3 (Специфичный вопрос):**
```
"Почему retention плохой? Как улучшить?"
→ Я применю MASTER PROMPT но сфокусирусь на growth lens'е
```

---

## 🔄 ИТЕРАТИВНЫЙ ПРОЦЕСС

```
Шаг 1: Я даю анализ (7 ролей, синтез, стратегия)
       ↓
Шаг 2: Ты изучаешь, задаешь уточняющие вопросы
       ↓
Шаг 3: Я углубляю анализ по интересующим тебя областям
       ↓
Шаг 4: Вместе детализируем дорожную карту
       ↓
Шаг 5: Я помогаю с реализацией (code, design, strategy)
       ↓
Шаг 6: Мониторим метрики, адаптируем
       ↓
Повтор
```

---

## ⚡ QUICK REFERENCE (Короткая версия)

Когда ты говоришь "Проанализируй проект", я делаю:

```
🟦 TECH ARCHITECT: Is it well-built?
🟩 GROWTH ANALYST: Is it sticky? Converting?
🟪 STRATEGIST: Is it positioned right? Priced right?
🟨 DESIGNER: Is it beautiful? Frictionless?
🟥 DATA SCIENTIST: Can we measure? Forecast?
🟦 SYSTEMS ANALYST: How does it all connect?
⭐ EXCELLENCE: What's the strategy to $X?
```

**РЕЗУЛЬТАТ:** Unified strategy с финансовыми прогнозами

---

## 📝 NOTES

- Этот промпт остается с тобой в проекте
- Используй его каждый раз когда работаешь со мной
- Я буду автоматически применять этот подход
- Если тебе нужен более узкий анализ, скажи (например, только техник + маркетолог)
- Если нужен более глубокий, я могу добавить еще ролей (UX researcher, legal, compliance, etc)

---

**Version 1.0** | Created: 2025-10-28
**Next iteration:** Based on user feedback
