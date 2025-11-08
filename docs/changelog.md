# Energy Planet Docs Changelog

## 2025-11-07
- Added `docs/telegram-fullscreen-status-bar.md` — плейбук по Telegram fullscreen/status-bar.
- Обновлён `webapp/docs/DESIGN_SYSTEM.md` блоком про статус-бар и токены `--app-header-*`.
- Task 02 (верхний статус-бар) отмечен в `docs/06-11-2025/ui-task-02-top-bar.md` + добавлены QA тесты и dev-команда `/debug_safe_area`.
- `webapp/src/main.tsx` логирует `ui_safe_area_delta`, а `/debug_safe_area` доступна по горячей клавише `Meta+Shift+S`.
- Добавлена desktop/web кнопка закрытия (`manual-close-button`) и тесты Playwright (safe-area.spec.ts) проверяют её наличие/отсутствие.

## 2025-11-08
- Телеметрия safe area / viewport теперь агрегируется на backend (`backend/src/metrics/telemetry.ts`) и пишется событиями `safe_area_changed`, `viewport_metrics_changed`, `viewport_action`, `ui_safe_area_delta`.
- `infra/grafana/dashboards/telegram-miniapp-product.json` получил новый ряд **Safe Area & Fullscreen** (четыре панели) для мониторинга инсетов и fullscreen статусов.
- Обновлено `docs/ARCHITECTURE_STATUS_BAR_FULL_ANALYSIS.md` разделом про телеметрию/Grafana, `docs/06-11-2025/ui-task-02-top-bar.md` — статус 2025-11-08.
