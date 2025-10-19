# ⚡ Energy Planet - Быстрый старт

## Автоматический запуск (рекомендуется)

```bash
cd /Users/jicool/Desktop/code/energyPlanet
./start.sh
```

Скрипт автоматически:
- ✅ Проверит Docker и ngrok
- ✅ Запустит все сервисы (PostgreSQL, Redis, Backend, Webapp)
- ✅ Применит миграции БД
- ✅ Запустит ngrok туннели
- ✅ Обновит конфигурацию
- ✅ Выведет все необходимые URL

## Ручной запуск (если нужен контроль)

### 1. Запусти Docker Compose

```bash
docker-compose up -d
```

### 2. Примени миграции

```bash
docker exec -i energy-planet-postgres psql -U energyplanet_app -d energy_planet < backend/migrations/001_initial_schema.sql
```

### 3. Запусти ngrok (2 терминала)

**Терминал 1 - Backend:**
```bash
ngrok http 3000
```

**Терминал 2 - Webapp:**
```bash
ngrok http 5173
```

### 4. Обновить webapp/.env

Замени URL на твой ngrok backend URL:
```bash
echo "VITE_API_URL=https://YOUR-NGROK-URL.ngrok-free.app/api/v1" > webapp/.env
docker-compose restart webapp
```

### 5. Настрой Telegram Bot

1. Открой [@BotFather](https://t.me/botfather)
2. `/mybots` → выбери бота
3. **Bot Settings** → **Menu Button** → **Edit Menu Button URL**
4. Введи URL: `https://YOUR-WEBAPP-NGROK-URL.ngrok-free.app`

## 🎯 Твой Telegram Bot

**Token:** `7740631915:AAFWKWsF2Nt7GZNZlmezcYx9ONiJIX4M97U`

Этот токен уже настроен в `backend/.env`

## 📱 Как открыть Mini App в Telegram

После настройки Menu Button URL:
1. Открой своего бота в Telegram
2. Нажми кнопку меню (или /start)
3. Mini App откроется автоматически

## 🧪 Тестирование

```bash
# Health check
curl http://localhost:3000/health

# Через ngrok
curl https://YOUR-NGROK-URL.ngrok-free.app/health

# Открой webapp в браузере
open https://YOUR-WEBAPP-NGROK-URL.ngrok-free.app
```

## 🔍 Полезные команды

```bash
# Логи
docker-compose logs -f backend
docker-compose logs -f webapp

# Остановить всё
docker-compose down

# БД консоль
docker exec -it energy-planet-postgres psql -U energyplanet_app -d energy_planet

# Проверить таблицы
docker exec -it energy-planet-postgres psql -U energyplanet_app -d energy_planet -c "\dt"

# ngrok dashboard
open http://127.0.0.1:4040
```

## ⚠️ Важно!

### ngrok URL меняется при перезапуске

Каждый раз когда перезапускаешь ngrok:
1. Обнови `webapp/.env` с новым backend URL
2. Перезапусти webapp: `docker-compose restart webapp`
3. Обнови Menu Button URL в Telegram Bot Settings

### Платная версия ngrok (опционально)

С платной версией ($8/мес) получишь:
- Фиксированный URL (не меняется)
- Больше туннелей одновременно
- Больше запросов в минуту

## 📚 Подробная документация

См. [SETUP_LOCAL.md](SETUP_LOCAL.md) для детальных инструкций.
