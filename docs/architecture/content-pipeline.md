# Контентный пайплайн

## 1. Источники данных
| Каталог | Назначение | Используется |
|---------|------------|--------------|
| `backend/content/items/buildings.json` | Каталог зданий (id, имя, tier, base_income/cost, множители, иконки, фич-флаги). | `ContentService.getBuildings()`, `UpgradeService`, `passiveIncome`. |
| `backend/content/flags/*.json` | Feature flags, эксперименты, лимиты, параметры монетизации/anti-cheat. | `ContentService.getFeatureFlags()` → сервисы (Boost, Tap, Quest, Monetization). |
| `backend/content/quests/quests.json` | Daily/weekly квесты (metric, target, reward). | `QuestService`. |
| `backend/content/monetization/star_packs.json` | Пакеты Stars для магазина. | `PurchaseController.packs`, клиентский магазин. |
| `backend/content/referrals.json` | Бонусы за рефералов, milestones, события, revenue share определения. | `ReferralService`, `ReferralRevenueService`. |
| `backend/content/seasons/*.yaml` | Сезонные настройки (id, даты, награды, события, cosmetics). | `SeasonService`. |
| `backend/content/cosmetics/*.json` | Косметика (пока хранится в общем JSON, авто-сидится в БД). | `CosmeticService`. |
| `content/**` (корень) | Дубликат текущего набора для deployment (монтируется как ConfigMap). | Используется при docker/k8s деплое. |
| `shared/tokens/safe-area.json` | Токены для UI (Padding, header reserve). | `webapp/src/constants/layout.ts`. |

## 2. Жизненный цикл контента
1. **Редактирование**: меняйте JSON/YAML в `backend/content`. Пользуйтесь Prettier/JSONLint.
2. **Валидация**: запустите `npm run test` (backend) — многие сервисы имеют unit-тесты на маппинг контента. Для YAML можно использовать `scripts/validate-content.ts` (TODO).
3. **Горячая загрузка**: backend перезагружает контент каждые `CONTENT_RELOAD_INTERVAL_MIN` минут (по умолчанию 60). Для немедленного применения перезапустите backend.
4. **Синхронизация с БД**: некоторые справочники (косметика) синхронизируются при запуске (`CosmeticService.ensureCosmeticsSeeded`). При изменении косметики очистите таблицу вручную или обновите через SQL.
5. **Deployment**: в Kubernetes конфиг-менеджер `game-content` монтирует `backend/content` (см. `k8s/deploy.yaml`). Обновите ConfigMap (kubectl replace/apply) перед рестартом backend.

## 3. Формат и правила
### Buildings (`items/buildings.json`)
- Поля: `base_income`, `base_cost`, `cost_multiplier`, `upgrade_cost_multiplier`, `upgrade_income_bonus`, `max_count`, `unlock_level`, `feature_flag` (для tier 4+).
- Сервис `ContentService` вычисляет стоимости (`getBuildingCost`), лимиты (`getMaxBuildingCount`), доход (`getBuildingIncome`).
- При добавлении нового здания убедитесь, что:
  - `id` уникален.
  - Указаны `icon_url`/`animation_url` (использует CDN `cdn.energyplanet.game`).
  - Фич-флаг включён в `content/flags`.

### Feature flags (`flags/default.json`)
- Структура: `features`, `experiments`, `limits`, `monetization`, `anti_cheat`, `rate_limits`, `maintenance`.
- Сервис `contentService.isFeatureEnabled('chat_enabled')` управляет API (`ChatService`).
- Обновление флага = изменение JSON + рестарт backend.

### Quests (`quests/quests.json`)
- Каждая запись: `id`, `title`, `description`, `metric` (taps, energy, buildings, prestige_energy), `target`, `reward` (stars/energy/xp).
- `QuestService` сопоставляет `metric` с прогрессом игрока (см. `METRIC_KEYS`).
- При изменении логики метрик обновите и `QuestService.resolveMetric`.

### Referrals (`referrals.json`)
- Поля `inviteeReward`, `referrerReward`, `milestones[]`, `limits`, `events[]`, `share`, `revenueShare`.
- Multipliers для событий используются при активации кода и выдаче наград.
- При добавлении новых milestones убедитесь, что `id` уникален и есть словарь `reward` (stars + optional cosmetic).

### Seasons (`content/seasons/season_001.yaml`)
- YAML с ключами `season`, `dates`, `theme`, `multipliers`, `leaderboard_rewards`, `events`, `exclusive_cosmetics`, `battle_pass`.
- Для нового сезона создайте `season_XXX.yaml`, добавьте в репозиторий и пропишите в `SeasonService` загрузку (по умолчанию читает все файлы).

## 4. Процесс изменения
1. **Issue/PR** — опишите, какой контент и почему меняете.
2. **Правки файлов** — следите за форматированием, используйте `jq`/`yq` при необходимости.
3. **Smoke** — локально запустите backend, вызовите `/content/buildings`, `/content/flags`, `/monetization/packs`, `/referrals` чтобы проверить сериализацию.
4. **Документация** — если изменения затрагивают механику (новый тип квеста, флаг, сезон), обновите `architecture/backend.md`, `architecture/data-model.md` и `roadmap/2025.md` (если это roadmap-фича).
5. **Деплой** — обновите ConfigMap + перезапустите backend pods. Для критичных изменений держите наготове `content` Git tag.

## 5. Контент и клиент
- Некоторые значения напрямую используются на фронте (например, `shared/tokens/safe-area.json`). При изменении убеждайтесь, что UI учитывает новые значения (например, header padding).
- Клиент читает feature flags/контент через API (`/content/flags`, `/content/buildings`). Любые breaking-changes (удалённое поле) должны сопровождаться версионной логикой.

## 6. Контроль версий
- Пока нет формального versioning контента. Рекомендуется тегировать релизы (`content-vYYYYMMDD`) при крупных апдейтах, чтобы проще откатываться.
- Для автоматизации можно добавить задачу в Jenkins, которая генерирует ConfigMap напрямую из `backend/content` (TODO).

Этот файл — точка входа для всех, кто меняет игровые данные без перекомпиляции кода. Соблюдайте процесс и описывайте изменения в PR/релиз-нотах.
