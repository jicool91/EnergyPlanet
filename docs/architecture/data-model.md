# Модель данных (PostgreSQL)

> Все схемы описаны SQL-миграциями `backend/migrations/*.sql`. Здесь зафиксированы основные таблицы и связи по доменам.

## 1. Пользователь и прогресс
- `users` (`001_initial_schema`): Telegram ID (unique), флаги `is_admin`, `is_banned`, audit timestamps.
- `progress` (`001` + `006_prestige_system` + `007_player_sessions` + `008_achievements_system` + `009_stars_balance`): ключевые поля — уровень, XP, энергия, тап-уровень, `total_energy_produced`, параметры престижа (`prestige_level`, `prestige_multiplier`, `prestige_energy_snapshot`), достижения (`achievement_multiplier`, `total_taps`, `total_buildings_purchased`), баланс Stars (`stars_balance`).
- `inventory` (`001`): здания игрока с количеством и уровнем.
- `events` (`001`): аудит/античит, JSONB payload, индексы по `event_type` и GIN по `event_data`.
- `user_profile` (`001`): экипированная косметика, bio, публичность.
- `boosts` (`001`): активные бусты с `expires_at`.
- `player_sessions` (`007`): `auth_session_id`, `last_tick_at`, `pending_passive_seconds`.
- `tap_events` (`004`): агрегированные батчи тапов (для аналитики и античита).

## 2. Сессии и безопасность
- `sessions` (`001` + `012_auth_session_hardening`): refresh tokens (`refresh_token`, `expires_at`, `version`, `family_id`, `revoked_at`, `last_used_at`, `last_ip`, `last_user_agent`). Уникальный индекс `(family_id, version)`.
- `session_refresh_audit` (`012`, `013`): история ротаций и причин отказов (`reason`, `revocation_reason`).
- `session_family_revocation` — логика реализована сервисом, таблица reuse `session_refresh_audit`.

## 3. Контент и экономика
- `cosmetics` + `user_cosmetics` (`001`): справочник и владение. Заполняются через `CosmeticService.ensureCosmeticsSeeded` из `backend/content/cosmetics`.
- `purchases` (`001`): idempotent журнал (client `purchase_id`, `purchase_type`, `price_stars`, статусы `pending/completed/failed`).
- `quests` (`010_quest_progress`): `quest_progress` хранит baseline, текущий прогресс, награды, TTL (`expires_at`), JSON metadata.
- `achievement_definitions`/`achievement_tiers`/`user_achievements` (`008`).
- `boost` вспомогательные функции: БД таблица `boosts`, но бизнес-логика зависит от feature flags.
- `season_progress` / `season_rewards` / `season_events` (`017`): прогресс/награды/участие в сезонных активностях.

## 4. Монетизация и рефералы
- `referral_codes`, `referral_relations`, `referral_rewards`, `referral_events` (`011_referrals`).
- `referral_revenue_events`, `referral_revenue_totals` (`014_referral_revenue`): revenue share за покупки приглашённых.
- `purchases` + `events` — источник данных для `MonetizationAnalyticsService`.

## 5. Социальные функции
- `leaderboard_global` view (`001`) — ранжирование по `progress.total_energy_produced`.
- `clans`, `clan_members`, `clan_join_requests`, `clan_chat`, `clan_events`, `clan_event_participation`, `clan_perks` (`002_clans_schema`). Пока API выключен фич-флагами.
- `arena_stats`, `arena_battles`, `arena_queue`, `arena_seasons`, `arena_season_rewards`, `arena_tournaments`, `arena_tournament_participants`, `arena_loadouts` (`003_arena_schema`). Подготовка к PvP.
- `global_chat_messages` (`015` + `016`): история глобального чата с idempotency по `client_message_id`.

## 6. Телеметрия и аналитика
- `events` (общий лог).
- `tap_events` (агрегат по батчам окружения).
- `monetization analytics` — реализованы SQL-запросом в `MonetizationAnalyticsService` (CTE `filtered_events`).

## 7. Индексы и перфоманс
- `idx_progress_energy_rank` (`005_performance_indexes`): `(total_energy_produced DESC, updated_at ASC)` для лидерборда.
- Сложные lookups: `idx_events_user_type_created_at`, `idx_quest_progress_expires_at`, `idx_referral_relations_activated_at`, `idx_referral_revenue_events_granted_at`, `idx_global_chat_created_at`, `idx_tap_events_created_at`.
- FKs: почти везде `ON DELETE CASCADE` (users → progress/inventory/purchases/... ). Проверьте перед массовыми delete (удаление пользователя очистит почти все связанные таблицы).

## 8. Как добавлять новые таблицы
1. Создайте новую миграцию `backend/migrations/0xx_description.sql` с понятными комментариями.
2. Используйте те же правила: `uuid_generate_v4()` для PK, `created_at/updated_at`, триггер `update_updated_at_column`.
3. Добавьте индексы для всех полей, по которым планируете фильтровать/сортировать.
4. Обновите соответствующий раздел этого файла и `architecture/backend.md` при добавлении домена.

## 9. Быстрая шпаргалка по связям
```
users --1:1--> progress --1:N--> inventory
      \                    \
       \--1:N--> sessions    \--1:N--> quests, achievements, purchases, events
        \--1:1--> user_profile
        \--1:N--> referral_codes (unique)

purchases --*:1--> users
referral_relations --referrer_id--> users ; --referred_id--> users
referral_revenue_totals --referral_relation_id--> referral_relations
quests_progress --user_id--> users
achievement tables --user_id--> users
season_progress --user_id--> users

global_chat_messages --user_id--> users
clan_* / arena_* --user_id--> users
```

Используйте этот документ как источник правды по схеме. Для более подробных SQL см. сами миграции и `docs/migrations/` (если добавите подробный changelog).
