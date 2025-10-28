# Аналитика систем Energy Planet
## Папка для хранения технических анализов и расследований

**Дата создания:** 29 октября 2025
**Статус:** Активное расследование

---

## 📋 Документы в папке

### 1. **INVESTIGATION_SUMMARY.md** ⭐ НАЧНИ ОТСЮДА
   - **Объём:** 300 слов
   - **Время чтения:** 5 минут
   - **Содержание:**
     - Краткая проблема: 782 уровня за ночь
     - Таблица 5 корневых причин
     - Численный расчёт проблемы
     - Таблица гипотез для проверки
     - Следующие шаги
   - **Для кого:** Руководители, для быстрого понимания проблемы

---

### 2. **XP_SYSTEM_ANALYSIS.md** 📊 ПОЛНЫЙ АНАЛИЗ
   - **Объём:** 2000+ слов
   - **Время чтения:** 30 минут
   - **Содержание:**
     - Архитектура системы XP
     - Анализ каждого источника XP
       - Офлайн-доход (основная проблема)
       - Множитель престижа (экспоненциальный рост)
       - Множитель достижений (без cap'а)
       - XP от покупок (затухание слишком слабое)
       - Система уровней (линейная после уровня 100)
     - Совокупный эффект всех проблем
     - Сравнение с best practices индустрии
     - 9 прямых причин скачка на 782 уровня
     - Таблица критичных параметров
     - Гипотезы для тестирования
   - **Для кого:** Backend разработчики, требуется понимание системы

---

### 3. **IDLE_GAME_BALANCE_BEST_PRACTICES.md** 🎓 РУКОВОДСТВО
   - **Объём:** 2500+ слов
   - **Время чтения:** 40 минут
   - **Содержание:**
     - Архитектура системы прогрессии
     - Экспоненциальные формулы для XP
     - Фаза-система (Early/Mid/Late/End Game)
     - Множители и их ограничения
       - Престиж (как делать правильно)
       - Достижения (структура и лимиты)
       - Активные бусты (временные, не вечные)
     - Офлайн-доход (best practices)
     - XP от транзакций (покупки, квесты)
     - Примеры формул из Cookie Clicker
     - Система мониторинга и аналитики
     - Чеклист перед production
     - Python скрипты для симуляции
     - Regression тесты
   - **Для кого:** Дизайнеры, архитекторы, все разработчики

---

## 🎯 Как читать эти документы

### Для быстрого понимания (5-10 минут):
```
1. INVESTIGATION_SUMMARY.md
   └─ Прочитать разделы: "КРАТКАЯ ПРОБЛЕМА" + "ТОП 5 ПРИЧИН"
```

### Для глубокого анализа (1 час):
```
1. INVESTIGATION_SUMMARY.md ......................... 5 мин
2. XP_SYSTEM_ANALYSIS.md разделы 1-4 ............ 25 мин
3. XP_SYSTEM_ANALYSIS.md раздел 9 (гипотезы) .. 10 мин
4. IDLE_GAME_BALANCE_BEST_PRACTICES.md раздел 7 . 15 мин
```

### Для имплементации фиксов (2-3 часа):
```
1. INVESTIGATION_SUMMARY.md раздел "ФАЙЛЫ ДЛЯ РЕФАКТОРИНГА" .. 10 мин
2. XP_SYSTEM_ANALYSIS.md раздел 6-9 (критичные параметры) .. 30 мин
3. IDLE_GAME_BALANCE_BEST_PRACTICES.md разделы 1-5 ........ 60 мин
4. Кодирование каждого fix'а ........................... 60-120 мин
```

---

## 📊 Сводка проблем

| Проблема | Файл | Критичность |
|----------|------|-------------|
| Офлайн-доход применяет множители | XP_SYSTEM_ANALYSIS.md #2.2 | 🔴 P0 |
| Престиж-множитель без cap'а | XP_SYSTEM_ANALYSIS.md #2.3 | 🔴 P0 |
| Уровни линейные после 100 | XP_SYSTEM_ANALYSIS.md #2.6 | 🔴 P0 |
| Достижения множаются бесконечно | XP_SYSTEM_ANALYSIS.md #2.4 | 🟠 P1 |
| Cap на покупки 40% слишком высокий | XP_SYSTEM_ANALYSIS.md #2.5 | 🟠 P1 |

---

## 🔧 Как использовать для фиксов

### Шаг 1: Выбери одну проблему из INVESTIGATION_SUMMARY.md
```
Пример: "Офлайн-доход применяет ВСЕ множители"
```

### Шаг 2: Перейди в XP_SYSTEM_ANALYSIS.md для деталей
```
Раздел 2.2: "Офлайн прирост (THE BIGGEST PROBLEM)"
```

### Шаг 3: Найди рекомендацию в IDLE_GAME_BALANCE_BEST_PRACTICES.md
```
Раздел 3.1: "Принципы офлайн-дохода"
Параметры в таблице
```

### Шаг 4: Кодируй fix
```
1. Редактируй backend/src/services/SessionService.ts
2. Убери множители из расчёта офлайна
3. Напиши тест (regression test из раздела 9.2)
4. Запусти симуляцию (Python скрипт из раздела 9.1)
5. Commit в отдельный PR
```

---

## 📈 Как добавлять новый анализ

1. **Создай новый файл:** `docs/analytics/FEATURE_NAME_ANALYSIS.md`
2. **Используй структуру:**
   - Обзор проблемы (1-2 абзаца)
   - Технический анализ (с примерами кода)
   - Сравнение с best practices
   - Рекомендации по исправлению
   - Гипотезы для тестирования
3. **Обнови этот README** с ссылкой на новый документ

---

## 🧪 Тестирование гипотез

### На тестовом сервере:

```bash
# 1. Создай тестового игрока
curl -X POST http://localhost:3000/api/test/create-player \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-123", "level": 100}'

# 2. Симулируй 12-часовой офлайн
curl -X POST http://localhost:3000/api/test/simulate-offline \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-123", "hours": 12}'

# 3. Проверь прогресс
curl http://localhost:3000/api/progress/test-123 \
  -H "Authorization: Bearer test-token"

# 4. Смотри логи событий
curl http://localhost:3000/api/events/test-123?limit=50
```

### В коде:

```typescript
// В backend/src/services/SessionService.ts:
console.log('[DEBUG] Offline calculation');
console.log('  baseIncome:', baseIncome);
console.log('  offlineSeconds:', offlineSeconds);
console.log('  offlineMultiplier:', offlineMultiplier);
console.log('  prestigeMultiplier:', progress.prestigeMultiplier);
console.log('  achievementMultiplier:', progress.achievementMultiplier);
console.log('  TOTAL multiplier:',
  progress.prestigeMultiplier * progress.achievementMultiplier);
console.log('  offlineEnergy (BEFORE mult):', offlineEnergy);
console.log('  offlineEnergy (AFTER mult):', boostedEnergy);
console.log('  offlineXp:', offlineXp);
```

---

## 📚 Ссылки на внешние ресурсы

**Авторитетные источники по дизайну idle games:**

1. **Game Developer Magazine**
   - "The Math of Idle Games, Part I, II, III"
   - URL: https://www.gamedeveloper.com (поиск по "idle games")

2. **Kongregate**
   - "The Math of Idle Games" series
   - URL: https://blog.kongregate.com/

3. **Machinations.io**
   - "Idle Games and How to Design Them"
   - URL: https://machinations.io/articles/idle-games-and-how-to-design-them

4. **Cookie Clicker**
   - Open-source формулы и баланс
   - GitHub: dashnet/cookie-clicker

5. **Idle Champions**
   - Официальный блог с постами о балансировке
   - URL: https://codenameentertainment.com (раздел Blog)

---

## 🔮 Следующие анализы для создания

- [ ] `CLICK_MECHANICS_ANALYSIS.md` - анализ механики тапов
- [ ] `BUILDING_ECONOMY_ANALYSIS.md` - экономика зданий
- [ ] `ACHIEVEMENT_INFLATION_ANALYSIS.md` - инфляция множителей достижений
- [ ] `PRESTIGE_LOOP_ANALYSIS.md` - цикл престижа (когда повторяется)
- [ ] `COSMETICS_MONETIZATION_ANALYSIS.md` - косметика и доход
- [ ] `QUEST_REWARDS_ANALYSIS.md` - баланс наград квестов
- [ ] `BOOSTS_COST_ANALYSIS.md` - стоимость и эффективность бустов

---

## 💬 Обсуждение результатов

Для обсуждения гипотез и результатов тестирования:

1. Создай **GitHub Issue** с меткой `balance` и `analytics`
2. Ссылка на соответствующий раздел документа
3. Поделись результатами тестирования
4. Обсудите рекомендации с командой

**Шаблон Issue:**

```markdown
### Проблема: [Название]

**Документация:** INVESTIGATION_SUMMARY.md #H1

**Гипотеза:** [Краткое описание]

**Тестирование:**
- [ ] Дебаг на локальном сервере
- [ ] Проверка логов
- [ ] Симуляция прогрессии
- [ ] Regression тест

**Результаты:**
[Вставить результаты]

**Рекомендация:**
[На основе документации]
```

---

## 📝 История версий

| Дата | Версия | Автор | Изменения |
|------|--------|-------|-----------|
| 29.10.2025 | v1.0 | AI | Первоначальный анализ системы XP |
| - | v1.1 | TBD | После тестирования гипотез H1-H6 |
| - | v2.0 | TBD | После имплементации фиксов |

---

## ⚖️ Disclaimer

Эта аналитика основана на **статическом анализе кода** и **best practices индустрии**.

Реальные проблемы могут отличаться от выявленных гипотез. Требуется **динамическое тестирование** на реальных данных игроков для подтверждения.

**Не все рекомендации** могут быть применимы к дизайну Energy Planet. Требуется обсуждение с дизайнер-командой перед имплементацией.

