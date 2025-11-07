# Design System Migration Plan

| Экран / модуль | Ответственный | Stage | Статус | Визуальные тесты | Комментарий |
|----------------|---------------|-------|--------|-------------------|-------------|
| TapScreen      | UI Team A     | D     | ✅ Done | Playwright + Chromatic | Stage D baseline 2025-11-06 |
| ExchangeScreen | UI Team A     | D     | ✅ Done | Playwright + Chromatic | |
| FriendsScreen  | UI Team A     | D     | ✅ Done | Playwright + Chromatic | |
| PvP Lobby      | UI Team B     | F     | ✅ Done | Storybook (PvP), Playwright | Chromatic build #4 baseline |
| Events Schedule| UI Team B     | F     | ✅ Done | Storybook + Chromatic | Seasonal tokens учтены |
| Premium Shop   | Monetization  | F     | ✅ Done | Storybook + Playwright | ShopPanel + админ-превью синхронизированы с Seasonal Rewards |
| Leaderboards (Global) | Social Squad | F | ✅ Done | Chromatic + Playwright | Clan screen в Stage G roadmap |
| ChatScreen     | Social Squad  | F     | ✅ Done | Storybook (placeholder) | Плейсхолдер + QA, ждёт чат-бэкенд |

- Добавляйте новые строки для экранов, которые мигрируете.
- Обновляйте столбец **Stage** (E/F) и статус (`☐ Todo`, `🛠 In progress`, `✅ Done`).
- Если добавлены новые визуальные тесты, укажите какие (Chromatic, Playwright и т.п.).
- После завершения — переносите уроки/гайды в `docs/training/stage-e-faq.md`.
