# 🔍 Marketing & Monetization Reality Check: Energy Planet

**Дата анализа:** 2025-10-27  
**Аналитик:** Codex (Product & Monetization Review)  
**База:** commit 22294ee  
**Задача:** Заменить прежний AI-отчёт на фактический разбор кода и инфраструктуры монетизации Energy Planet.

---

## 1. Executive Summary
- Ig core loop, Boost Hub и витрина магазина уже готовы к продакшену: навигация построена вокруг `MainScreen`/`HomePanel`, а магазин обслуживается `ShopPanel` и `catalogStore`.  
- Денежная петля пока не доведена: бекенд выдаёт пакеты Stars (`backend/content/monetization/star_packs.json`), но клиент не отображает баланс Stars и не логирует конверсию входа в магазин.  
- Retention-циклы ограничены ежедневным бустом и достижениями; квестов, сезонных целей и пушей в репозитории нет.  
- Инструменты телеметрии подключены (`webapp/src/services/telemetry.ts`, `backend/src/api/controllers/TelemetryController.ts`), однако ключевые действия монетизации (навбар, просмотр магазина, старты checkout) не размечены.

**Приоритет:** сначала восстановить наблюдаемость и поток Stars, затем решать про дополнительные петли и рост трафика в магазин. Любые прогнозы по $1M+/мес без данных — спекуляция.

---

## 2. Что уже работает хорошо
- **Shop Hero + “Best Value” визуал:** `ShopPanel` уже выделяет фичерный пакет и лучшую цену (`webapp/src/components/ShopPanel.tsx:545-654`, `713-744`). Плашка `highlightBadge` = «💰 BEST VALUE» реализована, доп. вмешательство не нужно.
- **Быстрый доступ из Home:** кнопки Boost Hub и достижения на `HomePanel` (`webapp/src/components/HomePanel.tsx:242-275`) сразу переводят на магазин через `onViewBoosts`, что создаёт естественный CTA в игровом контексте.
- **Бекенд контент:** `ContentService` теперь отдаёт пять пакетов Stars (119₽ → 3 690₽) с бонусами до +45% (`backend/content/monetization/star_packs.json`), а API `/purchase/invoice` → `/purchase` всё так же мокирует Telegram Stars (`backend/src/api/controllers/PurchaseController.ts`, `webapp/src/store/catalogStore.ts:233-305`).
- **Телеметрия и события:** всё, что попадёт в `logClientEvent`, сохраняется через `/telemetry/client` в таблицу `events` (`backend/src/api/controllers/TelemetryController.ts`, `backend/src/repositories/EventRepository.ts`). Можно строить отчёты, если начать логировать нужные действия.
- **Boost Hub и premium-предложения:** UI для бесплатных/рекламных/премиум бустов есть (`webapp/src/components/BoostHub.tsx`), backend даёт конфиг с КД и множителями (`backend/src/services/BoostService.ts`).
- **Монетизационные CTA из Home:** ежедневный баннер показывает upsell на премиум буст / Stars (`webapp/src/components/DailyRewardBanner.tsx`), `HomePanel` подсвечивает дефицит ресурсов (`webapp/src/components/HomePanel.tsx:120-215`), а лидерборд даёт прямой переход в магазин (`webapp/src/components/LeaderboardPanel.tsx:166-188`).

---

## 3. Критические разрывы
1. **Нет агрегированной аналитики.** События летят в `/telemetry/client`, но ETL/дашборд (Stage 0.3) не настроены — без baseline по `shop_visit_rate` и `checkout_success_rate` оценить Stage 1 невозможно.
2. **Quests отсутствуют полностью.** В кодовой базе нет стора или API для квестов; фича выключена флагом `daily_quests_enabled: false` (`backend/content/flags/default.json`). Запрос «трёх часов» нереален — тут полноценный backend+frontend эпик.
3. **Пуш-уведомления и повторный визит.** Телеграм-бот/уведомления не подключены, `notifications_enabled`=false — Stage 3 требует инфраструктуру расписаний и подписей.
4. **A/B и тарифные эксперименты без платформы.** Цены теперь хранятся в контенте, но нет механизма раскатки вариантов и подсчёта результата.
5. **Контроль частоты CTA.** Монетизационные подсказки появились (Home, Daily Reward, Leaderboard), но нет ограничителей частоты показов и сегментации; нужна настройка частотных окон и проверка фидбека.

---

## 4. Разбор воронки и фичей

### 4.1 Навигация и вход в магазин
- Текущий порядок: Home → Shop → Builds → Leaderboard → Clan (`webapp/src/App.tsx:244-251`). Домашняя вкладка становится пустой без основного CTA, если вынести Shop на первую позицию.
- Реальные шаги: добавить логирование `tab_click` в `TabBar` и `tab_impression` в `MainScreen`, собрать когорты за ≥1 неделю и только потом решать об эксперименте с порядком вкладок. Для теста достаточно зафлажить порядок через конфиг, чтобы не пересобирать приложение.

### 4.2 Магазин и предложения
- Пакеты Stars: теперь пять уровней (120 → 7 200) с бонусами до +45%, `stars_pack_supernova` выставлен как featured (`backend/content/monetization/star_packs.json`). Витрина подсвечивает «Best Value» автоматически (`webapp/src/components/ShopPanel.tsx`).
- Косметика и бусты обрабатываются через `catalogStore`; баланс Stars обновляется через `/session` и отображается в хедере (`webapp/src/store/gameStore.ts:365`, `webapp/src/App.tsx:264`).
- Баннеры/апсейлы уже привязаны к данным (баланс Stars, cooldown бустов, `purchaseInsight`) — следующий шаг: ограничение частоты показов и проверка влияния на конверсию.

### 4.3 Ежедневная активность
- **Daily Reward:** после claim появляется upsell на премиум буст или покупку Stars (`webapp/src/components/DailyRewardBanner.tsx`). Нужно A/B и частотный лимитер.
- **Achievements:** модалка логирует просмотр и клики (`webapp/src/components/AchievementsModal.tsx`); пересмотр наград остаётся задачей Stage 2.
- **Quests / Daily Missions:** отсутствуют. Нужен отдельный документ: схемы таблиц, API `/quests`, Zustand store, UI блок. Минимум один спринт backend + frontend.

### 4.4 Телеметрия и эксперименты
- Библиотека `logClientEvent` готова, но ключевые события не заведены: нет метрик `shop_open`, `star_pack_view`, `tab_shop_click`, `checkout_started`, `checkout_success`. Без них нельзя считать конверсию.
- Бекенд принимает и складывает события, но аналитика не агрегирована. Предлагается расписать минимальный договор событий и подключить Redash/Metabase позже.

---

## 5. Приоритезированный план (реалистичный)

### Stage 0 — Наблюдаемость и данные (2-3 дня)
1. **Добавить Stars в сессию:** расширить `SessionService` → вернуть баланс Stars, обновить `gameStore.refreshSession` и `initGame`, вывести Stars в UI (например, в хэдере) — без этого нельзя строить апсейлы.
2. **Инструментировать навигацию:** логировать `tab_click`, `tab_impression`, `shop_view`, `shop_section_change`, `star_pack_checkout_start/success`. Сразу договориться о формате событий и dashboard.
3. **Повесить базовые product analytics:** события входа в Boost Hub, нажатия «Престиж», ошибки магазина.

### Stage 1 — Контекстные офферы (1 спринт)
1. **Banner после daily boost:** если `daily_boost` активен, показывать предложение premium boost или пакет Stars с расчётом «ускорь восстановление» (использовать данные кулдауна из `BoostHub`).
2. **Surface “next goal costs Stars”:** использовать `purchaseInsight` и новый баланс Stars, чтобы подсветить дефицит прямо в `HomePanel`. Это может быть бейдж, а не агрессивный попап.
3. **Leaderboards conversion hook:** добавить CTA «Обгони конкурента» с кнопкой перехода в магазин/бусты, опираясь на разницу энергии (`LeaderboardPanel.tsx:620-657`).

### Stage 2 — Новые системы (несколько спринтов)
1. **Daily/Weekly quests:** требуется domain-модель, таблицы квестов, cron на сброс, API (`/quests`), Zustand store, UI блок на Home. Необязательно для первого релиза монетизации.
2. **Push/notifications:** Telegram-бот или внутри игры? Нужно отдельное решение с учётом правил Telegram.
3. **A/B pricing:** сперва получить стабильную метрику, затем внедрять конфиг/эксперименты.

---

## 6. Метрики для отслеживания
| Класс | Метрика | Источник |
|-------|---------|----------|
| Навигация | `tab_click`, `tab_shop_click_rate`, `home_to_shop_seconds` | `TabBar`, `MainScreen` |
| Магазин | `shop_view`, `star_pack_view`, `star_pack_checkout_start/success`, `cosmetic_purchase` | `ShopPanel`, `catalogStore` |
| Экономика | `stars_balance`, `stars_spent`, `boost_claim` | `SessionService`, `BoostService` |
| Retention | `daily_boost_claim_rate`, `prestige_attempts`, `achievement_claims` | `catalogStore`, `gameStore` |
| Experiments | `feature_flag_variant`, `ab_test_assignment` | добавить в `telemetry` |

Минимум: собрать дашборд по воронке «Home → Shop → Checkout → Success» и коррелировать с retention.

---

## 7. Что изменилось по сравнению с прежним отчётом
- Сняты все неподтверждённые прогнозы ($1.65M/мес, +60% retention и т.д.). Мы не обнаружили данных, которые могли бы это обосновать.
- Удалены некомпилирующие сниппеты (например, `stars < 100` в `HomePanel`).
- Добавлены конкретные зависимые шаги: нужен backend Stars баланс, события, контент. Это реальные блокеры, которых не было в предыдущем документе.

---

## 8. Рекомендованный next step
1. Подтвердить Stage 0 план (Stars + телеметрия).  
2. После релиза Stage 0 — собрать неделю данных, оценить долю переходов в магазин и продажи каждого пакета.  
3. На основании метрик выбрать один Stage 1 эксперимент (баннер после daily boost либо подсказка в Home).

Это заземлённый путь к росту монетизации без фантазий и с контролем качества.
