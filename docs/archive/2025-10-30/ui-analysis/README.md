# UI/UX Analysis — Energy Planet

Эта папка содержит промпты для анализа UI и отчёты по результатам аудита интерфейса.

## 📂 Структура

```
ui-analysis/
├── README.md                       # Этот файл (навигация)
├── prompts/                        # Промпты для анализа
│   ├── UI_ANALYSIS_PROMPT.md      # Визуальный анализ (по скриншотам)
│   └── CODE_ANALYSIS_PROMPT.md    # Архитектурный анализ (по коду)
├── reports/                        # Отчёты по анализу
│   ├── visual/                     # Визуальные анализы (UI/UX)
│   └── code/                       # Code review отчёты
└── screenshots/                    # Скриншоты для анализа
```

---

## 🎯 Два типа анализа

### 📸 UI/UX Analysis (по скриншотам)

**Промпт:** `prompts/UI_ANALYSIS_PROMPT.md`

**Что анализирует:**
- Layout & Spacing (отступы, grid система)
- Typography (размеры, контраст, иерархия)
- Touch Targets (размеры кнопок, доступность)
- Colors & Visual Hierarchy
- Navigation (понятность, паттерны)
- Accessibility (WCAG, контраст)
- Telegram Mini Apps специфика

**Когда использовать:**
- Оценка визуального дизайна
- Проверка соответствия Telegram guidelines
- Accessibility аудит
- Сравнение с конкурентами

**Input:** Скриншоты интерфейса
**Output:** Отчёт с визуальными проблемами и рекомендациями

---

### 💻 Code Analysis (по коду)

**Промпт:** `prompts/CODE_ANALYSIS_PROMPT.md`

**Что анализирует:**
- Архитектура компонентов (structure, composition)
- State Management (Zustand, data flow)
- API Integration (контракты, error handling)
- Design System Compliance (Tailwind, компоненты)
- Performance (rerenders, bundle size, optimization)
- Type Safety (TypeScript coverage, any usage)
- Telegram SDK интеграция
- Риски и технический долг

**Когда использовать:**
- Code review перед merge
- Архитектурный аудит
- Поиск багов и антипаттернов
- Оценка технического долга
- Performance optimization

**Input:** Файлы кода (компоненты, hooks, services)
**Output:** Детальный отчёт с анализом по слоям, рисками, рефакторинг suggestions

---

## 🔄 Workflow анализа

### Визуальный анализ (UI/UX):

1. Открой промпт: `prompts/UI_ANALYSIS_PROMPT.md`
2. Загрузи скриншоты экрана
3. Попроси Claude применить промпт
4. Сохрани отчёт: `reports/visual/YYYY-MM-DD-название-экрана.md`

### Code review (архитектурный):

1. Открой промпт: `prompts/CODE_ANALYSIS_PROMPT.md`
2. Укажи путь к компоненту/файлу для анализа
3. Попроси Claude применить промпт и проанализировать код
4. Сохрани отчёт: `reports/code/YYYY-MM-DD-компонент-название.md`

### 2. Формат названий отчётов

```
reports/2025-10-25-main-screen.md
reports/2025-10-25-buildings-page.md
reports/2025-10-26-profile-modal.md
```

**Формат**: `YYYY-MM-DD-краткое-описание.md`

---

## 📋 Список отчётов

- 2025-10-25 — [Главный экран: оффлайн-награды](reports/visual/2025-10-25-main-screen-offline-rewards.md)
- 2025-10-25 — [Вкладки Shop / Boosts / Builds: единый заголовок](reports/visual/2025-10-25-tab-headers-alignment.md)
- 2025-10-26 — [Tap Loop FPS Benchmark](reports/performance/2025-10-26-tap-loop-benchmark.md)

---

## 🔄 Workflow анализа

```
1. Сделать скриншот экрана
   ↓
2. Применить промпт из prompts/UI_ANALYSIS_PROMPT.md
   ↓
3. Получить детальный отчёт
   ↓
4. Сохранить отчёт в reports/YYYY-MM-DD-название.md
   ↓
5. Исправить критичные проблемы (P0, P1)
   ↓
6. Повторный анализ (опционально)
```

---

## ✅ Чек-лист перед анализом

- [ ] Скриншоты сделаны на реальном устройстве или симуляторе
- [ ] Захвачены все состояния UI (default, loading, error, empty)
- [ ] Разрешение соответствует целевым устройствам (320-428px ширина)
- [ ] Скриншоты показывают как светлую, так и тёмную тему (если применимо)

---

## 📊 Метрики качества UI

После каждого анализа отслеживай прогресс:

| Дата | Экран | Оценка | P0 | P1 | P2 | P3 | Статус |
|------|-------|--------|----|----|----|----|--------|
| 2025-10-25 | Main Screen | 7/10 | 2 | 3 | 5 | 1 | 🔨 В работе |
| ... | ... | ... | ... | ... | ... | ... | ... |

---

## 🎨 Целевые стандарты

**Минимальные требования для MVP:**
- Оценка UI: **8/10**
- P0 проблем: **0**
- P1 проблем: **≤ 2**
- Accessibility контраст: **WCAG AA (4.5:1)**
- Touch targets: **min 44x44px**
- Load time: **< 2 сек**

---

**Готов к проведению первого анализа!** 🚀
