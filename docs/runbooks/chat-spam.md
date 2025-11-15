# Runbook: глобальный чат заспамлен / злоупотребления

## Симптомы
- Пользователи жалуются на спам/флуд в глобальном чате.
- Логи `chat_rate_limit_fallback` или `chat_rate_limited` вспыхивают.
- Redis ключ `chat:global:rate:{userId}` постоянно превышает лимит.

## Шаги
1. **Идентифицировать пользователя**
   - Запрос `GET /chat/global/messages?limit=100` (через admin token) или прямой SQL:
     ```sql
     SELECT id, user_id, message, created_at
     FROM global_chat_messages
     WHERE created_at > now() - interval '10 minutes'
     ORDER BY created_at DESC;
     ```
   - Зафиксировать `user_id`, `client_message_id`.

2. **Отключить отправителя**
   - `UPDATE users SET is_banned = true WHERE id = '<user_id>';` (снимет доступ ко всем API).
   - Либо включите флаг `chat_enabled=false` в `backend/content/flags` (отключит чат целиком) и перезапустите backend.

3. **Очистить спам**
   - DELETE: `DELETE FROM global_chat_messages WHERE user_id = '<user_id>' AND created_at > now() - interval '1 day';`
   - Клиент автоматически подтянет новые сообщения при poll.

4. **Ужесточить лимиты**
   - Настройки в `.env` → `GLOBAL_CHAT_RATE_WINDOW_SEC`, `GLOBAL_CHAT_RATE_MAX` (config `config.chat.global`).
   - Можно уменьшить `maxMessageLength`.

5. **Мониторинг**
   - Добавьте метрику `chat_messages_per_user` (TODO) или запрос `rate(global_chat_messages[5m])` в Prometheus.
   - Рассмотрите модераторские инструменты (вебхуки, ML).

## Пост-инцидент
- Сообщите пользователям в новостном канале.
- Обновите runbook, если модерация будет автоматизирована.
