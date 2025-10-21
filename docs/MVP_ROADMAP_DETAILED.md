# Energy Planet — MVP Detailed Roadmap
_Last updated: 2025-10-21_

## 1. Roadmap Planning Prompt Template
Use the following prompt when you need to regenerate or adjust the roadmap. It embeds best practices around prioritisation frameworks, buffer allocation, and stakeholder-friendly storytelling:
- Dual MoSCoW + RICE prioritisation so every epic’s urgency and impact are explicit.citeturn0search7
- A 20–30% capacity buffer per sprint dedicated to technical debt, instrumentation, and safeguards.citeturn0search7
- A “now/next/later” framing with crisp narratives to keep stakeholders aligned on sequencing and intent.citeturn0search6
- Explicit ownership, risk surfacing, and dependency mapping to maintain accountability across disciplines.

```
You are the product lead for “Energy Planet”, an idle tap Telegram mini-app for 5M DAU. Build a 6–8 week MVP roadmap that is laser-focused on shipping a monetisable, scalable core loop.

Constraints & expectations:
- Apply both MoSCoW and RICE: classify every Epic as Must/Should/Could and capture Reach, Impact, Confidence, Effort scores to justify prioritisation.
- Reserve 20–30% capacity each sprint for technical debt, telemetry, and automation safeguards. Explicitly list those items.
- Embrace “now/next/later” framing so stakeholders see what’s locked vs. flexible. Use short narratives (2–3 sentences) per phase to communicate the why.
- Assume two backend engineers, two frontend/mobile engineers, one designer, one data/QA hybrid. Call out ownership per task.
- Surface dependencies, risks, and success metrics per sprint. Flag any cross-team blockers early with mitigation ideas.
- Close with a backlog slice for deferred features (clans, PvP, achievements) and a measurement plan (activation, conversion, retention).
```

## 2. Roadmap Methodology
- **Planning cadence:** one-week sprints (Tuesday–Monday) to align with current release rhythm.
- **Prioritisation:** MoSCoW categorisation for stakeholder clarity, RICE scoring captured in the internal backlog spreadsheet for traceability.citeturn0search7
- **Buffers:** 25% reserved each sprint for maintenance, telemetry, tooling, and emergent fixes.
- **Metrics guardrails:** Activation (FTUE completion), D1/D7 retention, ARPDAU, conversion to first Stars purchase.

## 3. Sprint-by-Sprint Breakdown

### Sprint 0 (Oct 22 – Oct 28) — Stabilise & Instrument
**Focus:** выровнять схему базы, стабилизировать авторизацию, собрать базовые метрики, чтобы не тормозить игровую работу в следующих спринтах.

**Must Have (MoSCoW: Must)**  
- **Backend**
  - Завершить авто-запуск миграций (готово) и добавить REST `GET /admin/migrations/status` с полями `applied`, `pending`, `lastAppliedAt`. — ✅ 21.10.2025
  - Расширить логирование `/auth/telegram`: сохранять причину отказа, длину initData, используемый botToken, user-id Telegram (без PII). — ✅ 21.10.2025
  - Добавить транзакционный healthcheck `GET /admin/health/full`, агрегирующий DB, Redis и миграции. — ✅ 21.10.2025
- **Frontend**
  - В `initGame` внедрить очередь запросов: один активный POST + повтор с экспоненциальной паузой до 3 попыток. — ✅ 21.10.2025
  - Отрисовывать модалку с пояснением при ошибке авторизации и ручной кнопкой «Повторить». — ✅ 21.10.2025
- **Data / QA**
  - Составить чек-лист трассировки: какой лог где искать (auth flow, миграции, Redis). — ✅ 21.10.2025 (добавлено в `docs/STATUS.md`)
  - Набросать ручные сценарии для авторизации (валидный initData, просроченный, повреждённый). — ✅ 21.10.2025
- **Ops**
  - Документировать параметры окружения Railway (переменные, secrets) в `docs/STATUS.md` для быстрой диагностики. — ✅ 21.10.2025

**Should Have (MoSCoW: Should)**  
- Скрипт начальной инициализации БД для локалки (`scripts/bootstrap-db.ts`) с прогоном миграций и сидов. — ✅ 21.10.2025
- Мини-тест на бэке, проверяющий ответ `/admin/migrations/status` (Jest + supertest). — ✅ 21.10.2025

**Dependencies & Preparation**
- Поднять временный dump схемы после миграций и проверить права на `uuid-ossp`.
- Согласовать с дизайнером тексты новых ошибок на фронте.

**Verification Checklist**
- `railway logs --service backgame` показывает блок `Running database migrations` + успешный `GET /admin/migrations/status`.
- Ручной прогон сценариев авторизации (валидный, просроченный, битый initData).

**Deliverables**
- Документированный healthcheck, endpoint статуса миграций, UX авторизации без зацикливания.
- Обновлённый `STATUS.md` с конфигом окружения.

### Sprint 1 (Oct 29 – Nov 4) — Core Loop Polish
**Focus:** довести основной игровий цикл до «приятного на ощупь» состояния и зафиксировать прогресс игрока.

**Must Have**
- **Backend**
  - Ввести агрегацию тапов: Redis-буфер (ключ `tap:{userId}`) + воркер сброса в PostgreSQL каждые 500мс или при превышении 50 тапов. — ✅ 21.10.2025
  - Создать таблицу `tap_events` (id, user_id, taps, energy_delta, created_at) с индексом по `user_id`. — ✅ 21.10.2025
  - Пересчитать выдачу оффлайн-дохода: хранить timestamp последнего сброса, вернуть в `/session`. — ✅ 21.10.2025
- **Frontend**
  - Реализовать streak-систему (визуальный счётчик + крит-анимация на N тап). — ✅ 21.10.2025
  - Переписать панель построек: отображать пассивный доход в реальном времени (подставлять данные из `/session` + апдейт на каждую покупку). — ✅ 21.10.2025
- **Content**
  - Баланс Tier1–Tier3: пересчитать cost/profit, обновить `content/buildings.json`, добавить таблицу сравнения. — ✅ 21.10.2025
- **QA/Data**
  - Логировать события `tap_batch_commit`, `building_purchase`, `offline_income_grant` (минимальные payload: userId, величина, источник). — ✅ 21.10.2025

**Should Have**
- Экран «Итоги сессии» после возврата из офлайна с детализацией: энергия, XP, бусты. — ✅ 21.10.2025 (модалка Offline Summary)
- Авто-добавление первой солнечной панели, если игрок пропустил обучение. — ✅ 21.10.2025
- Redis Telemetry Dashboard Slice (Data/QA). — ⏳ Перенесено (ожидает постановки)

**Dependencies**
- Требуется завершённый Sprint 0 (стабильная авторизация и миграции).
- Контент-правки согласовать с дизайнером и сохранить changelog.

**Testing**
- Написать Jest-тест для Redis-буфера (симулировать burst тапов).
- Визуальное тестирование streak-анимаций на фронте (story/preview).

**Deliverables**
- Стабильный тап-цикл, пассивный доход, сохранение прогресса, обновлённые конфиги.

### Sprint 2 (Nov 5 – Nov 11) — Monetisation MVP
**Focus:** провести пользователя по полному циклу покупки Stars и выдачи награды.

**Must Have**
- **Backend**
  - Endpoint `POST /purchase/stars` с генерацией invoice_id, подписью, idempotency-key (redis set + pg log).
  - Создать таблицу `stars_transactions` (invoice_id, user_id, amount_stars, status, payload, timestamps).
  - Webhook `/purchase/stars/webhook`: валидация подписи, смена статуса, выдача товара (косметика/энергия).
- **Frontend**
  - Магазин Stars: карусель пакетов, локализация цен, UX подтверждения.
  - Интеграция `Telegram.WebApp.openInvoice`, обработка `payment_success` и ошибок (показ тостов и fallback).
- **Content**
  - Настроить `content/monetization.json`: пакеты (минимум 4), цены, бонусы за первый платёж.
- **QA**
  - Тест-кейсы: успешная покупка, отмена, повтор одного invoice, двойной клик, webhook-повтор.

**Should Have**
- Баннер «первый платеж» с бонусной косметикой.
- Сбор аналитики: эвент `stars_purchase_complete` (userId, packId, цена, время до оплаты).

**Dependencies**
- Требуется актуальный список пакетов от контента и доступ к Telegram test payment.

**Testing**
- Прогнать sandbox-инвойсы, проверить повторный webhook.
- Smoke-тест магазина на iOS/Android (Telegram WebView).

**Deliverables**
- Рабочий цикл покупки Stars, зафиксированные транзакции, обновлённый магазин.

### Sprint 3 (Nov 12 – Nov 18) — Social & Cosmetics
**Focus:** добавить социальный слой и эстетическое разнообразие через косметику.

**Must Have**
- **Backend**
  - Расширить `/profile/:userId`: блок «Активные косметики», «Последние 3 буста», «Статистика тапов».
  - Таблица `cosmetic_equips_history` (user_id, cosmetic_id, action, source, timestamp).
- **Frontend**
  - Новый профиль: вкладки Overview / Cosmetics / Stats; поддержка deep-link `?profile={id}`.
  - Магазин косметики: фильтры по редкости, предпросмотр (planet + avatar), кнопка «Подарить» (stub).
- **Content**
  - Финализировать 20 предметов (id, тип, редкость, цена, условия), загрузить ассеты (SVG/PNG) в CDN и обновить контент.
- **QA/Data**
  - Добавить события `profile_view`, `cosmetic_preview`, `cosmetic_equip`.

**Should Have**
- Значки на лидерборде для игроков с легендарными скинами.
- Cron-задача, снимающая временные косметики по окончании срока.

**Dependencies**
- Готовые ассеты от дизайнера, подтверждённый формат превью.

**Testing**
- Проверить профиль для разных пользователей (сам, чужой, легендарный).
- UI snapshot тесты на магазин (Storybook/Chromatic).

**Deliverables**
- Обновлённый профиль, магазин косметики, история экипировки.

### Sprint 4 (Nov 19 – Nov 25) — Ads & Boosts
**Focus:** монетизировать время через вознаграждаемые объявления и укрепить систему бустов.

**Must Have**
- **Backend**
  - Ввести сущность `boost_entitlements` (user_id, boost_type, state, expires_at, source).
  - Stub для rewarded ads: `POST /ads/reward` (прнимает token от SDK, проверяет подпись, выдаёт boost).
  - Планировщик очистки истёкших бустов + перенос в архив.
- **Frontend**
  - «Boost Hub» — отдельный экран с тремя типами бустов (ежедневный, рекламный, премиум), таймерами и кастомной анимацией активации.
  - Встроить Yandex SDK (или заглушку), показать пользователю прогресс + кнопку «Получить буст».
- **Content**
  - Определить длительность/эффект бустов, описания и локализацию.
- **QA/Data**
  - Тесты: одновременное получение нескольких бустов, повторная активация, экспирация.

**Should Have**
- Короткий onboarding в Boost Hub (два шага с подсветкой кнопок).
- Статистика по бустам в профиле (сколько активировано за сутки).

**Dependencies**
- Доступ к рекламному SDK, ключи окружения.

**Testing**
- Мануальные сценарии Yandex SDK (успех/отказ), проверка выдачи буста.
- Нагрузочный тест выдачи бустов (100 одновременных запросов).

**Deliverables**
- Рабочий Boost Hub, интеграция rewarded ads (на заглушке или реальном SDK), устойчивое хранение бустов.

### Sprint 5 (Nov 26 – Dec 2) — QA, Polish, Launch Readiness
**Focus:** вылизать UX, закрыть дырки в безопасности и подготовиться к масштабу.

**Must Have**
- **Backend**
  - Нагрузочное тестирование `/tap`, `/session`, `/purchase` (1k RPS, 15 мин) + фиксация индексов.
  - Security pass: пересмотреть refresh-токены, rate limits, Telegram initData проверку.
- **Frontend**
  - FTUE v2: пошаговые подсказки, возможность пропуска, поддержка RU/EN.
  - Глобальные error boundaries с кнопками «Повторить»/«Домой».
- **QA**
  - E2E-прогон ключевых сценариев (авторизация, тап, покупка, буст, профиль) на тестовых устройствах.
- **Data**
  - Финальный список метрик MVP: Activation, D1/D7, ARPDAU, конверсия в первую покупку; подготовка дашборда.
- **Product**
  - Оркестрация Launch checklist: задачи по коммуникациям, поддержке, пост-релизным ревью.

**Should Have**
- Мини-хранилище известных багов и workaround’ов.
- Лёгкий ретро-шаблон (Lessons learned).

**Dependencies**
- Завершённые предыдущие спринты.
- Утверждённые тексты FTUE и маркетинговые материалы.

**Testing**
- Повторить нагрузочный тест после оптимизаций.
- Smoke-тест платежей, бустов, косметики на staging перед релизом.

**Exit Criteria**
- Ошибки в staging < 1%,
- P95 latency < 300мс на ключевых эндпоинтах,
- FTUE completion ≥ 90%,
- Успешные платежи ≥ 75%.

## 4. Backlog (Post-MVP)
- **Clans 1.0:** schema, clan lobby, chat MVP.
- **Arena/PvP:** async challenges with seasonal ladder.
- **Achievements & Daily Quests:** retention levers (MoSCoW = Should).
- **Friends Leaderboard:** social graph integration.
- **Push Notifications:** Telegram bot messages for boosts, clan events.
- **LiveOps Toolkit:** event scheduler, dynamic multipliers.

## 5. Measurement & Review Cadence
- **Weekly:** roadmap review, RICE updates, KPI check.
- **Daily:** stand-up + health metrics (auth errors, payment drop-offs).
- **Post-launch:** 30-day retention cohort analysis, monetisation funnel deep dive, roadmap reprioritisation using the prompt template.
