# 🚀 Локальный запуск Energy Planet

Пошаговая инструкция для запуска проекта локально с Telegram Mini App.

## Предварительные требования

1. **Docker Desktop** - установлен и запущен
2. **ngrok** - для HTTPS туннелирования
3. **Telegram аккаунт** - для настройки бота

## Шаг 1: Установка ngrok

### macOS (через Homebrew)
```bash
brew install ngrok/ngrok/ngrok
```

### Linux
```bash
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | \
  sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null && \
  echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | \
  sudo tee /etc/apt/sources.list.d/ngrok.list && \
  sudo apt update && sudo apt install ngrok
```

### Windows
Скачай с https://ngrok.com/download

### Регистрация ngrok (опционально, но рекомендуется)
```bash
# Зарегистрируйся на https://dashboard.ngrok.com/signup
# Получи authtoken на https://dashboard.ngrok.com/get-started/your-authtoken
ngrok config add-authtoken YOUR_AUTHTOKEN
```

## Шаг 2: Запуск проекта

### 2.1 Запусти Docker Compose

```bash
cd /Users/jicool/Desktop/code/energyPlanet
docker-compose up -d
```

Это запустит:
- ✅ PostgreSQL на порту 5432
- ✅ Redis на порту 6379
- ✅ Backend API на порту 3000
- ✅ Webapp на порту 5173

### 2.2 Проверь что всё запустилось

```bash
# Проверь контейнеры
docker ps

# Проверь health backend
curl http://localhost:3000/health

# Должен вернуть: {"status":"ok","timestamp":"...","uptime":...}
```

### 2.3 Применить миграции БД

```bash
# Зайди в контейнер backend
docker exec -it energy-planet-backend bash

# Внутри контейнера примени миграции
cd /app
psql -h postgres -U energyplanet_app -d energy_planet -f /app/migrations/001_initial_schema.sql

# Или можно через docker exec напрямую:
docker exec -i energy-planet-postgres psql -U energyplanet_app -d energy_planet < backend/migrations/001_initial_schema.sql
```

## Шаг 3: Настройка ngrok туннелей

### 3.1 Создай конфиг ngrok

Создай файл `ngrok.yml` в корне проекта:

```bash
cat > ngrok.yml << 'EOF'
version: "2"
authtoken: YOUR_AUTHTOKEN_HERE
tunnels:
  backend:
    proto: http
    addr: 3000
    bind_tls: true
  webapp:
    proto: http
    addr: 5173
    bind_tls: true
EOF
```

### 3.2 Запусти ngrok туннели

В **новом терминале**:

```bash
cd /Users/jicool/Desktop/code/energyPlanet
ngrok start --all --config=ngrok.yml
```

Или без конфига (два отдельных окна):

**Терминал 1 - Backend:**
```bash
ngrok http 3000
```

**Терминал 2 - Webapp:**
```bash
ngrok http 5173
```

### 3.3 Получи ngrok URLs

После запуска ngrok покажет:

```
Session Status                online
Account                       Your Name (Plan: Free)
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123.ngrok-free.app -> http://localhost:3000
Forwarding                    https://xyz789.ngrok-free.app -> http://localhost:5173
```

**Запиши оба URL:**
- Backend API: `https://abc123.ngrok-free.app`
- Webapp: `https://xyz789.ngrok-free.app`

## Шаг 4: Обновить конфигурацию

### 4.1 Обновить webapp/.env

```bash
# Замени URL на свой ngrok backend URL
echo "VITE_API_URL=https://abc123.ngrok-free.app/api/v1" > webapp/.env
echo "VITE_ENV=development" >> webapp/.env
```

### 4.2 Перезапусти webapp контейнер

```bash
docker-compose restart webapp
```

## Шаг 5: Настройка Telegram Mini App

### 5.1 Открой BotFather в Telegram

1. Найди [@BotFather](https://t.me/botfather) в Telegram
2. Отправь команду `/mybots`
3. Выбери своего бота (тот, что с токеном `7740631915:AAFWKWsF2Nt7GZNZlmezcYx9ONiJIX4M97U`)

### 5.2 Настрой Web App

1. Выбери **"Bot Settings"** → **"Menu Button"** → **"Edit Menu Button URL"**
2. Отправь **название**: `Play Energy Planet`
3. Отправь **URL**: `https://xyz789.ngrok-free.app` (твой ngrok URL для webapp)

### 5.3 Альтернативный способ - через команду

1. В BotFather: **"Bot Settings"** → **"Commands"** → **"Edit Commands"**
2. Добавь команду:
```
start - Launch Energy Planet game
```

3. Затем настрой Web App для команды:
```
/newapp
# Выбери бота
# Введи название: Energy Planet
# Введи описание: Idle tap game
# Загрузи иконку (512x512 PNG)
# Введи Web App URL: https://xyz789.ngrok-free.app
```

## Шаг 6: Тестирование

### 6.1 Открой бота в Telegram

1. Найди своего бота в Telegram
2. Нажми **"Start"** или кнопку меню
3. Откроется Mini App (твой webapp через ngrok)

### 6.2 Проверь логи

```bash
# Backend логи
docker logs -f energy-planet-backend

# Webapp логи
docker logs -f energy-planet-webapp

# PostgreSQL логи
docker logs -f energy-planet-postgres
```

### 6.3 Тестовые запросы

```bash
# Health check
curl https://abc123.ngrok-free.app/health

# Auth (с настоящим Telegram initData не сработает без валидации)
curl -X POST https://abc123.ngrok-free.app/api/v1/auth/telegram \
  -H "Content-Type: application/json" \
  -d '{"initData":"test"}'
```

## 🎯 Итоговые URL для использования

После всех шагов у тебя будут:

| Сервис | URL | Назначение |
|--------|-----|------------|
| **Backend API** | `https://abc123.ngrok-free.app` | Telegram Mini App обращается сюда |
| **Webapp** | `https://xyz789.ngrok-free.app` | Telegram открывает это в Mini App |
| **ngrok Dashboard** | `http://127.0.0.1:4040` | Мониторинг запросов |
| **Local Backend** | `http://localhost:3000` | Прямой доступ |
| **Local Webapp** | `http://localhost:5173` | Прямой доступ |

## 📱 Telegram Mini App URL

**Используй этот URL в настройках бота:**
```
https://xyz789.ngrok-free.app
```

**Direct link для тестирования:**
```
https://t.me/YOUR_BOT_USERNAME/app
```

## ⚠️ Важные замечания

### 1. ngrok Free Plan ограничения
- URL меняется при каждом перезапуске ngrok
- После перезапуска нужно обновить:
  - `webapp/.env` (VITE_API_URL)
  - Telegram Bot Settings (Web App URL)

### 2. Bypass Telegram Auth для тестирования

Если хочешь тестировать API без Telegram, добавь в `backend/.env`:
```
BYPASS_TELEGRAM_AUTH=true
```

И перезапусти backend:
```bash
docker-compose restart backend
```

### 3. Проблемы с CORS

Если видишь CORS ошибки:
- Убедись что `CORS_ORIGIN=*` в `backend/.env`
- Проверь что webapp использует правильный API URL

### 4. Database не инициализируется

Если БД пустая:
```bash
# Вручную примени миграции
docker exec -i energy-planet-postgres psql -U energyplanet_app -d energy_planet < backend/migrations/001_initial_schema.sql
```

## 🔧 Полезные команды

```bash
# Остановить всё
docker-compose down

# Остановить + удалить volumes (свежий старт)
docker-compose down -v

# Пересобрать образы
docker-compose build

# Перезапустить конкретный сервис
docker-compose restart backend

# Посмотреть логи
docker-compose logs -f backend
docker-compose logs -f webapp

# Зайти в контейнер
docker exec -it energy-planet-backend sh
docker exec -it energy-planet-postgres psql -U energyplanet_app -d energy_planet

# Проверить состояние БД
docker exec -it energy-planet-postgres psql -U energyplanet_app -d energy_planet -c "\dt"
```

## 🐛 Troubleshooting

### Backend не стартует
```bash
# Проверь логи
docker logs energy-planet-backend

# Проверь что postgres запущен
docker ps | grep postgres

# Проверь подключение к БД
docker exec -it energy-planet-backend sh -c "nc -zv postgres 5432"
```

### Webapp показывает ошибки API
```bash
# Проверь что backend доступен
curl https://abc123.ngrok-free.app/health

# Проверь webapp/.env
cat webapp/.env

# Проверь в ngrok dashboard (http://127.0.0.1:4040) запросы
```

### Telegram Mini App не открывается
1. Проверь что ngrok URL правильный в Bot Settings
2. Убедись что webapp работает: открой ngrok URL в браузере
3. Проверь что HTTPS (не HTTP)

## ✅ Checklist для запуска

- [ ] Docker Desktop запущен
- [ ] ngrok установлен
- [ ] `docker-compose up -d` выполнен
- [ ] Миграции БД применены
- [ ] ngrok туннели запущены
- [ ] `webapp/.env` обновлен с ngrok API URL
- [ ] Telegram Bot Settings обновлены с ngrok Webapp URL
- [ ] Бот открывается в Telegram
- [ ] Mini App загружается

---

🎉 **Готово!** Теперь можешь тестировать Energy Planet в Telegram!
