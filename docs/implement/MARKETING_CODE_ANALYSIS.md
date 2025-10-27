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
- **Бекенд контент:** `ContentService` грузит три пакета Stars (119₽, 479₽, 969₽) из `backend/content/monetization/star_packs.json`, а API `/purchase/invoice` → `/purchase` уже мокирует Telegram Stars (`backend/src/api/controllers/PurchaseController.ts`, `webapp/src/store/catalogStore.ts:233-305`).
- **Телеметрия и события:** всё, что попадёт в `logClientEvent`, сохраняется через `/telemetry/client` в таблицу `events` (`backend/src/api/controllers/TelemetryController.ts`, `backend/src/repositories/EventRepository.ts`). Можно строить отчёты, если начать логировать нужные действия.
- **Boost Hub и premium-предложения:** UI для бесплатных/рекламных/премиум бустов есть (`webapp/src/components/BoostHub.tsx`), backend даёт конфиг с КД и множителями (`backend/src/services/BoostService.ts`).

---

## 3. Критические разрывы
1. **Баланс Stars не поднимается в клиент.** `SessionService` не возвращает поле `stars` (`backend/src/services/SessionService.ts:26-219`), а `gameStore` держит `stars` в стейте, но нигде не обновляет (`webapp/src/store/gameStore.ts:139`, `237`, `611-704`). Итог: UI не знает, что игрок купил Stars.
2. **HomePanel не может показать монетизационные подсказки.** Пропсы `HomePanel` не содержат Stars (`webapp/src/components/HomePanel.tsx:21-75`), а предложенный ранее код с `stars < 100` просто не скомпилируется.
3. **Навигация не измеряется.** Таббар задаётся жёстко (`webapp/src/App.tsx:244-255`), но ни `TabBar`, ни `setActiveTab` не логируют клики. Перестановка вкладок «ради +40%» без данных — слепой риск.
4. **Daily Reward = только бесплатный буст.** Баннер (`webapp/src/components/DailyRewardBanner.tsx`) управляет `claimBoost('daily_boost')`, но после получения награды нет upsell/предложения Stars. Нужно сперва знать баланс и время до следующего буста, прежде чем строить апсейл.
5. **Quests отсутствуют полностью.** В кодовой базе нет стора или API для квестов; фича выключена флагом `daily_quests_enabled: false` (`backend/content/flags/default.json`). Запрос «трёх часов» нереален — тут полноценный backend+frontend эпик.
6. **Лидеры и престиж не монетизированы.** `PrestigeCard` и `LeaderboardPanel` дают прогресc, но нет платных шорткатов, бандлов или pay-to-flex элементов. Нужно отдельное продуктовое решение, а не просто «+30% spending».

---

## 4. Разбор воронки и фичей

### 4.1 Навигация и вход в магазин
- Текущий порядок: Home → Shop → Builds → Leaderboard → Clan (`webapp/src/App.tsx:244-251`). Домашняя вкладка становится пустой без основного CTA, если вынести Shop на первую позицию.
- Реальные шаги: добавить логирование `tab_click` в `TabBar` и `tab_impression` в `MainScreen`, собрать когорты за ≥1 неделю и только потом решать об эксперименте с порядком вкладок. Для теста достаточно зафлажить порядок через конфиг, чтобы не пересобирать приложение.

### 4.2 Магазин и предложения
- Пакеты Stars: small (120), medium (650 +10%), large (1400 +20%). Средний пакет помечен `featured`, значит `ShopPanel` выводит его отдельной карточкой. Цена-качество настраивается контентом, а не кодом.
- Косметика и бусты уже имеют purchase flow через `catalogStore`. Отсутствует лишь отображение обновлённого баланса — без него не понять ценность покупки.
- Добавление баннеров/апсейлов должно опираться на доступные данные: звёзды на аккаунте, cooldown бустов, прогресс до цели (`purchaseInsight` уже приходит в `HomePanel`).

### 4.3 Ежедневная активность
- **Daily Reward:** Работает через Boost Hub, с кулдауном из бекенда (`boostHubTimeOffsetMs` и `claimBoost`). Можно добавить второй шаг (предложение premium boost) после того, как баннер узнает, что бесплатный буст активен и какие ресурсы нужны игроку.
- **Achievements:** уже реализованы и отображаются в `HomePanel` (кнопка «Достижения»). Перекрёстная монетизация возможна через привязку наград к косметике (`webapp/src/store/catalogStore.ts`, `webapp/src/services/achievements.ts`), но сейчас нет автоматического разблокирования.
- **Quests / Daily Missions:** отсутствуют. Нужен отдельный документ: схемы таблиц, API роуты, Zustand store, UI блок. Минимум один спринт backend + frontend.

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
