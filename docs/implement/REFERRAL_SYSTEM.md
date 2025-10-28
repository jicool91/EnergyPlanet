# Реферальная система Energy Planet

**Обновлено:** 2025-10-28  
**Scope:** поддержка Stage 3 — рост за счёт вирусности и сообществ.

---

## Архитектура

- **Контент:** `backend/content/referrals.json` — описание welcome-бонусов, тиров, лимитов и временных событий.  
- **База данных:**  
  - `referral_codes` — персональные коды игроков.  
  - `referral_relations` — связи «пригласил → приглашён», статус `activated`.  
  - `referral_rewards` — учёт выданных milestone-наград (idempotency).  
  - `referral_events` — вспомогательные логи для аналитики/антифрода.
- **Сервис:** `ReferralService` (TS) — генерация кодов, проверка лимитов, выдача наград, сбор сводки.  
- **API:**  
  - `GET /api/v1/referrals` — сводка: код, лимиты, активные события, прогресс тиров.  
  - `POST /api/v1/referrals/activate` — активация чужого кода.  
  - `POST /api/v1/referrals/milestones/:id/claim` — получение награды за этап.
- **Фронтенд:**  
  - Стора `useReferralStore` (zustand) + сервис `referrals.ts`.  
  - UI в `Settings → Друзья и награды` (`ReferralInviteCard`): копирование/шаринг, вход чужого кода, прогресс тиров.  
  - Телеметрия в `services/telemetry`: `referral_summary_loaded`, `referral_code_activated`, `referral_milestone_claim`, ошибки.

---

## Награды

| Сценарий | Бонус (до множителей событий) |
|----------|-------------------------------|
| Промокод для приглашённого | 300 ⭐ |
| Награда пригласившему (каждый друг) | 350 ⭐ |
| Этап `starter_pack` (1 друг) | 500 ⭐ + рамка `frame_starlight` |
| Этап `growth_stage` (5 друзей) | 1 500 ⭐ |
| Этап `galaxy_club` (15 друзей) | 3 500 ⭐ + аура `aura_galactic_trail` |
| Этап `legend_circle` (30 друзей) | 8 000 ⭐ + бейдж `badge_referral_champion` |

**Лимиты:** 10 активаций в сутки на пользователя, 5 выдач наград в сутки.  
**Временные события:** `double_weekend` (x2 для обеих сторон, тиро-выплаты x1.5) и `year_end_push` (x1.5 на все бонусы).

---

## Аналитика и телеметрия

- События в `events`:  
  - `referral_activation` — приглашённый активировал код.  
  - `referral_invite_reward` — мгновенный бонус пригласившего.  
  - `referral_reward_granted` — milestone-награда.  
  - `referral_code_created` — генерация кода.
- Дополнительные логи в `referral_events` (для агрегаций/антифрода).  
- SQL-отчёт: см. `docs/analytics/REFERRAL_METRICS.md`.

---

## Антиабуз и UX

- Проверка на self-referral и повторную активацию.  
- Дневные лимиты по активациям/наградам.  
- Телеметрия ошибок (`*_error`) + тосты в UI.  
- Share URL строится через `TELEGRAM_MINI_APP_URL`/`TELEGRAM_BOT_USERNAME`; при отсутствии — fallback на копирование текста.

---

## Следующие итерации

1. Добавить выдачу временных бустов и космических эффектов (когда будет поддержка бустов в rewards).  
2. Расширить `referral_events` данными об источнике (deeplink, канал, инфлюенсер).  
3. Подготовить виджет в админ-панели (top referrers, конверсия по каналам).  
4. Настроить автоалерты на рост мошенничества (анализ `referral_events` + антифрод-флаги).
