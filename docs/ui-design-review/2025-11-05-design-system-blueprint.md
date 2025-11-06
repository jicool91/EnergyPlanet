# Energy Planet Mini App — Unified Design System Blueprint (2025-11-05)

## 1. Цели и рамка
- **Выравнивание**: привести все экраны к единому визуальному языку, соответствующему официальным гайдам Telegram Mini Apps (Design Guidelines, Theme & Viewport APIs) и рекомендациям React 19.
- **Масштабируемость**: построить систему токенов, компонентов и UX-паттернов, пригодных для фич 2025 Q4–2026 Q1 (PvP, Events, Premium Shop).
- **Доступность и продуктивность**: обеспечить AA-контраст, поддержку `prefers-reduced-motion`, одинаковые hit-target’ы ≥44 px и снизить время на внедрение новых UI вдвое.

## 2. Стандарт дизайн-системы
### 2.1 Фундаментальные принципы
1. **Telegram-first theming** — любые цвета/фоны и высоты сначала читаем из `Telegram.WebApp.themeParams`, затем накладываем брендовые токены (`services/tma/theme.ts`).
2. **Grid & Safe Area** — layout строим на 8 px-сетке с токенами `--spacing-*`; вертикальные отступы и навигация учитывают safe-area и `viewport` из `@tma.js/sdk`.
3. **Компонентная строгость** — UI-слой использует единые примитивы (`Button`, `Card`, `Surface`, `Text`, `Input`, `ModalBase`). Inline Tailwind классы допустимы только для лэйаута.
4. **Многоуровневая адаптация** — поддерживаем dark/light, `palette_v1` (classic/dual-accent), font scaling (`--tg-text-size-scale`), планшеты и web-preview.
5. **Accessibility by default** — контраст ≥4.5 : 1, видимый фокус, корректные `aria-*`, отключаемые анимации/хаптика, локализация строк.
6. **Telemetry & QA** — любое изменение системного компонента сопровождается e2e визуальными тестами, `npm run test:contrast`, UX-метриками (latency, tap success).

### 2.2 Токены и тема
- **Цвета**: consolidate палитру в `tokens.css` (brand, surfaces, semantic). Любой `rgba(...)`/hex в компонентах мигрируем к токенам. Добавить токены `--surface-glass`, `--surface-critical`, `--border-focus`.
- **Типографика**: все размеры шрифта/интерлиньяж — через CSS-классы `text-*` и vars с учётом `--tg-text-size-scale`. В Tailwind запретить `text-sm`, `text-lg` через lint-плагин.
- **Пространство**: отступы и радиусы только из токенов (`--spacing-*`, `--border-radius-*`). В Tailwind добавить `safex`, `safey` утилиты, чтобы не писать `px-[var(--safe-area-left)]` вручную.
- **Motion**: описать ключевые вариации в `tokens.css` (`--motion-duration-fast`, `--motion-ease-brand`). Все framer-motion компоненты читают настройки через хук `useMotionTokens`.

### 2.3 Компоненты (эталонный набор)
| Категория | Компонент | Статус | Стандартизация |
|-----------|-----------|--------|----------------|
| Actions | `Button`, `IconButton`, `MainButtonBridge` | refactor | Привязать к токенам, единый API для размеров, состояний, иконок, прогресса |
| Inputs | `TextField`, `NumberStepper`, `Toggle` | scaffold | Создать на базе Telegram focus guidelines, цвета состояний через токены |
| Containers | `Card`, `Surface`, `Panel` | refactor | Развести по elevation уровню, добавить пропы `tone`, `interactive` |
| Navigation | `AppLayout`, `BottomNavigation`, `Tabs`, `Drawer` | refine | Учитывать safe-area, планшеты, RTL |
| Feedback | `Toast`, `Modal`, `Skeleton`, `ProgressBar`, `NotificationBadge` | refactor | Skeleton = ARIA live, Toast = стандартиз. цветовые роли, ProgressBar = motion токены |
| Data | `StatTile`, `Chart` (roadmap), `LeaderboardRow` | redesign | Переиспользовать типографику и цветовые роли, адаптировать под light mode |

### 2.4 UX паттерны
- **Economy Dashboards** — `StatsSummary`, `PurchaseInsight`, `LeaderboardPanel`: unify сетку, цветовые роли, масштабы шрифтов.
- **Progress & Rewards** — модальные окна уровней, achievement-панели: единый layout «шапка–контент–CTA», motion только через токены.
- **Shop & Currency** — карточки бустов/покупок используют единый `ProductTile` с полями «icon, title, ROI, price, status».
- **Onboarding/Empty states** — добавить `EmptyState` компонент с иллюстрацией, Copy и CTA.

### 2.5 Документация и QA
- Обновить `docs/design/DESIGN_SYSTEM_GUIDE.md`, расширив разделы tokens/components.
- Завести Storybook/Ladle стенд с токенами и ключевыми компонентами.
- Lint-правила: запрет Tailwind `text-*`, `bg-*` вне whitelist; проверять inline-hex.
- Контрастный скрипт расширить на пары `--surface-glass`, `--surface-critical`.
- Настроить Percy/Playwright визуальные тесты для Tap, Exchange, Friends, Shop, Settings (classic + dual-accent + light).

## 3. План внедрения
### Этап A — Фундамент (1 неделя)
**Статус:** неделя 1 завершена

1. ✅ Token freeze: ревизия `tokens.css`, заведены поверхностные/тематические токены (`--layer-overlay-*`, `--surface-glass*`, `--state-*-pill`, dual-палитра); Tailwind понимает новые цвета/фоны, `Surface`/`Text` обновлены и задокументированы.
2. ✅ Lint & tooling: включён запрет на arbitrary цвета, токенизированы все компоненты и экраны — `npm run lint` проходит без предупреждений; добавлены утилиты (`drop-shadow-glow`, grad tokens) и обновлены skeleton/Shop/nav карточки для соответствия freeze.
3. ✅ Theme runtime: font scale и safe-area поддерживаются (`services/tma/theme.ts`, `Surface`), добавлены light-mode сценарии в visual тестах (`tests/visual/offline-summary.spec.ts`) и переключение `?theme=light` в preview. Покрытие остальных экранов переносим в Этап D.

### Этап B — Компоненты (2 недели)
**Статус:** завершён

1. ✅ Actions: `Button`/`IconButton`/`MainButtonBridge` перешли на общую токенизированную систему (`actionTheme`, shared spinners, tone API).
2. ✅ Containers: `Surface` получил elevation/interactive, `Card` оборачивает `Surface`, добавлен `Panel` как стандартный контейнер.
3. ✅ Feedback: реализованы `Skeleton`/`Loader` с ARIA, обновлены skeletons и Barrel-экспорты.
4. ✅ Typography: классические `text-*` заменены на `Text` + токены, добавлено eslint-правило против legacy размеров.

### Этап C — Паттерны (2 недели)
**Статус:** завершён (готово к старту Stage D)

1. ✅ Economy: `StatsSummary`, `PurchaseInsight`, `LeaderboardPanel` и `ExchangeScreen` собраны на Surface/Panel, actionTheme и Text; осталось пройти QA empty/error-сценариев и зафиксировать метрики.
2. ✅ Shop/Product: введён `ProductTile`, `ShopPanel` и `PurchaseSuccessModal` перешли на Panel/Surface, цены/метрики стандартизированы.
3. ✅ Modals/Feedback: `AchievementsModal`, `OfflineSummaryModal`, `Toast` собраны на ModalBase/Panel, остался аудит второстепенных модалок (`AuthErrorModal`, `LevelUpScreen`) для выравнивания.

**Что осталось после Этапа C**
- QA пустых/ошибочных сценариев Economy и Shop, фиксация метрик перед стартом Stage D.
- Доведённые модалки второго порядка (`AuthErrorModal`, `LevelUpScreen`, `NotificationContainer`) на новую сетку и motion.
- Подготовка пакета Stage D: визуальные регрессии, контрастные проверки, телеметрия UX.

### Этап D — QA и авто-тесты (1 неделя)
**Статус:** не начат  
1. ☐ Storybook snapshot’ы + Chromatic/Percy pipeline.  
2. ☐ Расширенный `npm run test:contrast`, Playwright визуальные тесты (все палитры, light mode).  
3. ☐ UX-телеметрия: измерять render latency, tap-success.

### Этап E — Rollout и обучение (3–4 дня)
**Статус:** не начат  
1. ☐ Обновить документацию (`docs/design/...`, Confluence) и записать walkthrough.  
2. ☐ Провести командный воркшоп, собрать обратную связь.  
3. ☐ Создать Jira epic «Design System Unification» с задачами по этапам.

## 4. Инвентаризация текущих расхождений (snapshot)
- Typography drift: ~90 случаев `text-lg`, `text-sm` в старых навигационных компонентах (BottomNavigation, Drawer) — требуется миграция на `Text` variants.
- Inline colors: `bg-[rgba(...)]`/`border-[rgba(...)]` в Friends/Tap/Shop — перенести в токены.
- Skeleton variance: разные `animate-pulse` без ARIA, нет общего компонента.
- Modals backlog: `AuthErrorModal`, `LevelUpScreen`, `NotificationContainer` ждут обновления layout/motion по новому гайду.
- Light mode coverage: нет визуальных тестов и документации для светлой темы.
- Theme experiments: palette эксперимент не кешируется на пользователя → возможен flicker.

## 5. Метрики успеха
- 0 inline hex/rgba в `src/components` и `src/screens` (lint).
- 100% базовых компонентов покрыты Storybook + visual regression.
- Контраст ≥4.5 : 1 по `npm run test:contrast` во всех палитрах.
- Время разработки нового экрана ≤ 1 спринта; снижение UI-багов ≥30%.
- Пользовательский NPS UI (опрос через Telegram канал) ≥ +20.

## 6. Ссылки на официальные гайды
- Telegram Mini Apps — Platform Design Guidelines (docs.telegram-mini-apps.com/platform/design-guidelines)
- Telegram Mini Apps — Theme & Viewport APIs (core.telegram.org/bots/webapps#theme-params, #safe-areas)
- Telegram Mini Apps — Advanced topics: Main Button, Haptics, Immersive (docs.telegram-mini-apps.com/platform/advanced-topics)
- React 19 — Accessibility & Concurrent Rendering (react.dev/learn, react.dev/reference)

---
Ответственный: продуктовый/UI-дизайнер (в паре с UI engineer). Обновление документа — после окончания этапа B или через 30 дней.
