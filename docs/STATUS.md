# Backend Status – October 19, 2025

## ✅ Готово
- **Сессии**: `/api/v1/session` возвращает прогресс, бусты, косметику, инвентарь и фич-флаги; оффлайн-доход начисляется автоматически.
- **Косметика**: `/api/v1/cosmetics`, `/cosmetics/purchase`, `/cosmetics/equip` (mock Stars) + автодовыдача free/level предметов.
- **Бусты**: `/api/v1/boost/claim` (ad/daily/premium), кулдауны и логирование (`events`).
- **Mock Stars**: `/api/v1/purchase/invoice` → `/api/v1/purchase`, заглушка `/purchase/webhook`; idempotent запись в `purchases`.
- **Тесты**: `backend/src/__tests__/monetization.e2e.test.ts` покрывает основные монетизационные маршруты.

## 🔄 В работе / В планах
- **Telegram Stars (боевое)**: проверка подписи webhook, хранение `telegram_payment_id`, награждение товарами.
- **Rewarded Ads**: интеграция Yandex.Direct + буст от просмотра рекламы.
- **Фронтенд**: витрина Star-паков, бусты, косметика, отображение `pay_url` из инвойса.
- **DevOps**: Dockerfile, CI/CD, staging.

## 📎 Подсказки по локальной проверке
1. **Cosmetics**
   ```bash
   curl -H "Authorization: Bearer <token>" https://type-arc-derby-analyzed.trycloudflare.com/api/v1/cosmetics
   ```
   Затем покупка/экипировка с тем же токеном.
2. **Stars mock**
   ```bash
   # Инвойс
   curl -X POST .../purchase/invoice -d '{"purchase_id":"mock-1","item_id":"stars_pack_small","price_stars":100}'
   # Завершение
   curl -X POST .../purchase -d '{"purchase_id":"mock-1","item_id":"stars_pack_small","price_stars":100}'
   ```
3. **Boost**
   ```bash
   curl -X POST .../boost/claim -d '{"boost_type":"daily_boost"}'
   ```

## 📅 Следующие шаги
1. Реализовать реальный Telegram Stars webhook: валидация `X-Telegram-Bot-Api-Secret-Token`, расшифровка payload, выдача наград.
2. Подготовить выдачу наград (энергия, бусты, косметика) на базе данных `purchases`.
3. В UI отобразить `pay_url`, активные бусты и новые косметики.
4. Спланировать rewarded-ads флоу и хранилище токенов.

_Автор: автообновление CLI, дата 19.10.2025_
