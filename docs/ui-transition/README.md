# Energy Planet — переход на новый UI

## Зачем это нужно
- **Текущая проблема.** Legacy-компонент `MainScreen` объединяет Tap, магазин, лидерборд и настройки, из-за чего код трудно сопровождать, загрузка тяжёлая, а UI теряет отзывчивость на устройствах Telegram.
- **Целевая модель.** Модульная структура экранов и компонентов из пакета `UI_*`, которая следует рекомендациям React 19.2 по управлению переходами, Suspense и ленивой загрузке,[^react192][^react-best] а также правилам Telegram Mini Apps по safe-area и отклику интерфейса.[^telegram-viewport][^telegram-rules]
- **Что получим.** Быстрые итерации дизайна, контролируемый UX (анимации, навигация, доступность), упрощённый QA и меньше регрессий благодаря изолированным экранам и чеклисту качества.

## Ключевые принципы миграции
- Используем существующие зависимости (`React 19.2`, `Vite 5`, `Zustand 5`, `Tailwind 3.4.18`) без обновлений. Все несовместимости решаем точечными фикcами внутри текущего стека.
- Сохраняем feature-flag `uiStore.isNextUiEnabled`, чтобы сравнивать новый и старый UI в одном билде Telegram и катить изменения постепенно.
- Применяем `React.lazy`, `Suspense`, транзакции и `useEffectEvent` для сглаживания переходов и снижения TTI, как рекомендует React 19.[^react192]
- Оцифровываем дизайн-токены в Tailwind, чтобы избежать расхождений между макетами и кодом и ускорить поддержку темы.[^tailwind-tokens][^tailwind-best]
- Следуем UX-правилам Telegram: корректный учёт safe-area, отзывчивость <200 мс, читаемость на малых экранах, поддержка жестов.[^telegram-viewport][^telegram-rules]

## Навигация по папке
- `PHASE_PLAN.md` — дорожная карта из пяти фаз с задачами, контрольными точками и ссылками на артефакты.
- `COMPONENT_MIGRATION_MAP.md` — сопоставление целевых компонентов со статусами доработки.
- `QA_CHECKLIST.md` — чеклист качества и UX перед включением нового UI.
- `_evidence/` — место для скриншотов, метрик и записей профилирования.

## Риски и как их контролировать
- **Игровая экономика.** Tap-цикл завязан на `gameStore`; после каждой фазы гоняем smoke через `docker-compose up`, проверяем события `boost_*` в базе.
- **Telegram SDK.** Повторно используем провайдер `@tma.js/sdk-react`, не обращаемся напрямую к `window.Telegram`, логируем отклонения в `COMPONENT_MIGRATION_MAP.md`.
- **Производительность и сеть.** Сохраняем чанк-сплиты тяжёлых панелей, добавляем Suspense и измеряем TTI/TTFB в DevTools Telegram. Результаты складываем в `_evidence`.
- **Доступность.** Применяем `focus-visible`, `motion-safe` и проверяем контраст, соблюдая рекомендации Telegram и WebAIM. Фиксируем выводы в чеклисте.

## Как работаем командой
- Каждая фаза завершается PR-ом со скриншотами Tap + альтернативного экрана, перечислением прогонов `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:perf`.
- Все отклонения от дизайн-документов и best practices документируем в `COMPONENT_MIGRATION_MAP.md` (колонка «Статус») с ссылкой на задачу.
- После финальной валидации включаем feature flag по умолчанию, удаляем legacy-компоненты и описываем изменения в release notes.

[^react192]: React Team. “React 19.2.” *React.dev Blog*, October 1, 2025. https://react.dev/blog/2025/10/01/react-19-2.
[^react-best]: Jay Sarvaiya. “React 19 Best Practices: Write Clean, Modern, and Efficient React Code.” *DEV Community*, October 2025. https://dev.to/jay_sarvaiya_reactjs/react-19-best-practices-write-clean-modern-and-efficient-react-code-1beb.
[^tailwind-tokens]: Nadia Nicol. “Integrating Design Tokens with Tailwind CSS.” *Nicolabs Portfolio*, April 2025. https://portfolio.nicolabs.co.uk/integrating-design-tokens-with-tailwind-css/.
[^tailwind-best]: Steve Kinney. “Tailwind Best Practices.” *stevekinney.com*, 2025. https://stevekinney.com/courses/tailwind/tailwind-best-practices.
[^telegram-viewport]: Telegram. “Viewport.” *Telegram Mini Apps Docs*, October 2025. https://docs.telegram-mini-apps.com/platform/viewport.
[^telegram-rules]: Telegram. “Telegram Apps Center Rules.” *Telegraph*, May 16, 2024. https://telegra.ph/Telegram-Apps-Center-Rules-05-16.
