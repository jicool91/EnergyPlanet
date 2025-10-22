# Telegram Stars Mock Payment Flow

_Updated: 2025-10-22_

## Overview
- Поток ориентирован на моковые платежи Telegram Stars в локальной разработке и staging.
- `MOCK_PAYMENTS=true` обязательна для вызовов `/purchase` и `/purchase/invoice`; при отключении Stars должны быть включены через `TELEGRAM_STARS_ENABLED=true`.
- Все операции ведут логи в PostgreSQL (`purchases`), Event Store (`events`) и структурированные логи (`logger`).

## Endpoints
- `POST /api/v1/purchase/invoice`
  - Создаёт (или переиспользует) запись со статусом `pending`.
  - Возвращает `{ purchase_id, status, pay_url }`.
  - Возвращает `409 purchase_conflict`, если invoice пытается заново создать другой пользователь.
- `POST /api/v1/purchase`
  - Завершает моковую покупку, переводя статус в `succeeded`.
  - Идемпотентен: повторный вызов с тем же `purchase_id` возвращает существующую запись.
  - Возвращает `409 purchase_conflict`, если другой пользователь пытается завершить покупку.
- `POST /api/v1/purchase/webhook`
  - Заглушка, отдаёт 202; оставлена для реальной подписи Telegram.

## Status Lifecycle
```
draft (клиент) -> POST /purchase/invoice -> pending
pending -> POST /purchase -> succeeded
pending/succeeded -> markFailed(purchase_id) -> failed
```
- `purchaseService.createInvoice` устанавливает статус `pending` и сохраняет `purchase_invoice_created`.
- `purchaseService.recordMockPurchase` переводит `pending` → `succeeded` (или создаёт новую запись сразу в `succeeded`).
- `purchaseService.markFailed` переводит любую запись в `failed`; используется для QA/ретраев.

## Logging & Events
- Logger (`backend/src/utils/logger.ts`)
  - `purchase_invoice_created` – invoice создана.
  - `purchase_invoice_reused` – повторный возврат данным же пользователем.
  - `purchase_succeeded` – успешное завершение покупки (`previous_status`, `metadata`).
  - `purchase_succeeded_idempotent` – повторный вызов `/purchase` без изменений.
  - `purchase_failed` – перевод в `failed`.
- Event Store (`logEvent`)
  - `purchase_invoice_created` + payload `{ purchase_id, item_id, price_stars, purchase_type }`.
  - `purchase_succeeded` + payload `{ purchase_id, item_id, price_stars, purchase_type, previous_status, metadata }`.
  - `purchase_failed` + payload `{ purchase_id, item_id, price_stars, purchase_type, previous_status }`.
- Логи `purchase_user_mismatch` / `purchase_invoice_user_mismatch` → статус 409, сигнализируют о попытке переиспользовать чужой invoice.

## QA Checklist
- Создать invoice → убедиться в статусе `pending` и наличии события `purchase_invoice_created`.
- Завершить покупку → статус `succeeded`, событие `purchase_succeeded`, логи `purchase_succeeded`/`purchase_succeeded_idempotent` при повторе.
- Попробовать другой userId с тем же `purchase_id` → ожидаемый 409 и лог `purchase_user_mismatch`.
- Вызвать `markFailed` (через консоль или скрипт) → статус `failed`, событие `purchase_failed`.

## Follow-ups
- Реальная интеграция Telegram: заменить `mockPayments` на live, добавить подпись и webhook-подтверждение.
- Добавить `source`/`channel` в `purchases` для раздельной аналитики бустов и косметики.
- Расширить события аналитики (`purchase_succeeded`) метриками времени (ms) между invoice и покупкой, для воронки.
