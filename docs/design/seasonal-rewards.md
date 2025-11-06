# Seasonal Rewards Specification

## Цель
Завершать каждый календарный месяц сезоном лидерборда, вручать завершённым игрокам призы (внутриигровые и купоны) и фиксировать историю победителей.

## Роли
- **Игрок** — участвует в рейтинге, видит прошлые сезоны, получает награды.
- **Админ** — закрывает сезон, проверяет итоговый топ, вручает призы и ведёт учёт купонов.

## Поток сезона
1. **Старт** — сезон длится 30/31 день; результаты пишутся в `season_snapshots`.
2. **Финиш** — cron + админ-панель переводят сезон в `closed`, сохраняют топ‑100 и метаданные.
3. **Награждение**  
   - Админ открывает страницу Season Awards.  
   - В таблице видны место, игрок, итоговая энергия, статус купона.  
   - Для каждого призового места доступны кнопки `Reward Gold/Silver/Bronze`.  
   - Нажатие логирует событие (`season_reward_granted`) и выдаёт предметы/код.
4. **История** — игроки видят “Прошлый сезон” (топ‑3 и награды) и прогресс текущего сезона.

## UI
- Season Awards: таблица лидеров + действия выдачи (dark/light, адаптив).  
- Toast при успешной выдаче и запись в журнал админа.  
- Season Recap Modal для игроков при старте нового сезона (топ‑3 + CTA).

### Реализация (обновление 2025‑11‑07)
- `SeasonRewardsAdminPanel` покрывает таблицу, выдачу наград и выгрузку JSON.  
- Storybook: `Seasonal/SeasonRewardsAdminPanel` (empty / top3 / granted).  
- PvP/Event витрина обновлена (`MatchLobby`, `EventSchedule`, `PvPEventsScreen`).

## Технические заметки
- Снапшот топ‑100 хранится в `season_snapshot`.  
- `GET /admin/seasons/snapshot` отдаёт последний закрытый сезон с метриками и топ‑3.  
- `POST /admin/seasons/:id/reward` принимает `userId`, `rewardTier`, `couponCode`.  
- Логи (`season_reward_granted`) записываются в таблицу `events`.  
- Playwright QA: сценарий выдачи награды через mock (см. `tests/qa/stage-f.spec.ts`).

## Наградные пакеты (утверждено 2025‑11‑07)
- **Gold (1‑е место)** — 1 000 ⭐ + купон Wildberries на 1 500 ₽ + Premium Boost Bundle.  
  Код хранится в `season_rewards.coupon_code`; панель подставляет свободный купон из `season_coupons` и помечает его как `used_at`.
- **Silver (2‑е место)** — 600 ⭐ + купон Wildberries на 1 000 ₽ + Daily Boost Bundle.
- **Bronze (3‑е место)** — 300 ⭐ + 5 Premium Boost Token (без внешнего купона).

Купоны выгружаются маркетингом в `content/seasonal/rewards-YYYY-MM.csv`.  
Скрипт `backend/scripts/loadSeasonCoupons.ts` импортирует данные в `season_coupons (code, tier, batch_id, is_used)`.

## Копирайтинг и i18n
- Диалог подтверждения:  
  - RU: `Выдать награду {reward} игроку {player}? Отменить нельзя.`  
  - EN: `Grant {reward} to {player}? This action cannot be undone.`
- Toast успеха:  
  - RU: `Награда {reward} выдана. Купон отправлен игроку в личные сообщения.`  
  - EN: `{reward} granted. Coupon delivered via in-game inbox.`
- Бронзовый сценарий (без купона):  
  - RU: `Бронзовый приз: 5 премиум‑бустов добавлены в инвентарь.`  
  - EN: `Bronze reward: 5 premium boosts added to inventory.`
- Строки добавлены в `webapp/src/i18n/ru/rewards.json` и `webapp/src/i18n/en/rewards.json` (ключи `season.reward.*`).

## Коммуникация с игроком
- **Season Recap Modal** — показывает топ‑3, награды и CTA “Перейти к рейтингам”, используется при первом входе нового сезона.  
- **Inbox сообщение** (сервис `SeasonRewardNotifier`): `Поздравляем! Вы заняли {place} место. Награда: {rewardSummary}.` Купон выводится отдельным блоком с кнопкой “Скопировать код”.

## Статус задач
- [x] Спецификацию наград согласовать с маркетингом (approval NPS‑341 от 2025‑11‑07).  
- [x] Подготовить купонные коды и интеграцию (`season_coupons`, загрузчик CSV).  
- [x] Добавить сезонные тексты в i18n и UX (SeasonRecapModal, inbox шаблон).
