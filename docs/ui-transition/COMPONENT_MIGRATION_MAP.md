# Карта миграции компонентов

Документ обновляется по мере прогресса. Колонка «Статус» принимает значения `План`, `В работе`, `Готово`, либо конкретные комментарии (например, `Готово — без drag-свайпа`).

## Layout и навигация
| Компонент | Файл/папка | Ключевые действия | Зависимости | Статус |
| --- | --- | --- | --- | --- |
| AppLayout | `webapp/src/components/layout/AppLayout.tsx` | Контейнер `max-w-xl`, поддержка safe-area через `env(safe-area-inset-*)`, использование `motion-safe`/`motion-reduce` классов Tailwind и `useEffectEvent` для событий resize.[^telegram-viewport][^tailwind-best][^react-best] | React 19, Tailwind токены, `useSafeArea` | Готово |
| BottomNavigation | `webapp/src/components/layout/BottomNavigation.tsx` | Фиксированное позиционирование, пять вкладок, `aria-current`, `aria-label`, поддержка клавиатурной навигации и `startTransition` при переключении.[^react192] | `useSafeArea`, `framer-motion`, Tailwind | Готово |
| Header | `webapp/src/components/layout/Header.tsx` (создать) | Варианты для Tap/Exchange/Friends/Earn/Airdrop, отображение профиля, CTA, адаптивные размеры текста, анимации появления (Framer Motion + `prefers-reduced-motion`). | `useGameStore`, `useAuthStore`, `OptimizedImage` | План |
| Router Shell | `webapp/src/App.tsx` | Настроить `Routes`, `React.lazy` и `Suspense` на уровне экранов; ранний feature flag отключён после миграции. | `react-router-dom@6.30`, `uiStore` | Готово — Next UI shell + глобальные модалки |

## UI-кирпичики
| Компонент | Файл/папка | Ключевые действия | Зависимости | Статус |
| --- | --- | --- | --- | --- |
| Button | `webapp/src/components/Button.tsx` | Обновить систему вариаций (primary/secondary/ghost), размеры, `data-loading`, `aria-pressed`, унифицировать цвета из токенов. | Tailwind, `class-variance-authority` | Готово |
| Card | `webapp/src/components/Card.tsx` | Применить новые радиусы/тени, добавить интерактивные состояния, поддержку header/footer слотов. | Tailwind, CSS vars | Готово |
| ModalBase | `webapp/src/components/ModalBase.tsx` | Унифицировать оверлей, transition, фокус-ловушку, обработку `Escape`, `prefers-reduced-motion`. | `framer-motion@12`, Tailwind | Готово |
| Toast / Notifications | `webapp/src/components/notifications/*` | Перевести на стек уведомлений с `aria-live="polite"`, автоматическим закрытием и темing-токенами. | `useNotification`, Tailwind | План |
| ProgressBar | `webapp/src/components/LevelBar.tsx` → `components/ui/ProgressBar.tsx` | Универсальный прогресс-бар с поддержкой градиента, меток и анимаций. | Tailwind | Готово |
| Tabs | `webapp/src/components/TabBar.tsx` | Расширить под контентные вкладки (Earn/Airdrop), добавить swipe-gesture (по возможности), синхронизировать с маршрутизатором. | `useSafeArea`, `framer-motion` | План |
| Typography | `webapp/src/components/ui/Text.tsx` | Реализовать компонент текстовых стилей (Display/H1–H6, Body, Caption) на базе токенов; обеспечить `as`-prop. | Tailwind токены | Готово — базовая реализация (внедрение в экраны в работе) |

## Game-specific компоненты
| Компонент | Файл/папка | Ключевые действия | Зависимости | Статус |
| --- | --- | --- | --- | --- |
| TapCircle | `webapp/src/components/tap/TapCircle.tsx` | Выделить круг планеты, состояния tap/boost/cooldown, анимация импульса, хаптик. | `framer-motion`, `useHaptic` | Готово — базовая реализация в Next UI |
| DailyTasksBar | `webapp/src/components/tap/DailyTasksBar.tsx` | Объединить ежедневные задания, бусты, streak, добавить CTA на Earn. | `useGameStore`, `useCatalogStore` | Готово — CTA и таймер | 
| StatsSummary | `webapp/src/components/tap/StatsSummary.tsx` | Сводные данные по энергии, доходу, престижу, использование `AnimatedNumber`. | `useGameStore`, `AnimatedNumber` | Готово |
| BuildingsGrid | `BuildingsPanel.tsx` | Обновить карточки под токены, добавить виртуализацию секций `react-virtuoso`, Suspense загрузку. | React.lazy, Zustand | Есть (нужен рефактор) |
| FriendsList | `webapp/src/components/friends/FriendsList.tsx` | Список друзей, CTA share, отображение прогресса рефералов. | `useGameStore`, Friends API | Готово — базовая версия |
| TasksBoard | `webapp/src/components/earn/EarnTasksBoard.tsx` | Фильтры по задачам, прогресс, состояния выполнения, CTA. | `useGameStore`, telemetry | Готово — обёртка над BoostHub |
| SeasonTimeline | `webapp/src/components/airdrop/AirdropTimeline.tsx` | Таймлайн сезонов и ивентов, адаптивная шкала времени, подсвеченные активные события. | Tailwind, дата-утилиты | Готово — демо-события |

## Инфраструктура и вспомогательные слои
| Объект | Файл/папка | Ключевые действия | Зависимости | Статус |
| --- | --- | --- | --- | --- |
| Цветовые токены | `src/styles/tokens.css`, `tailwind.config.js` | Синхронизировать с `COLOR_SCHEMES.md`, вынести градиенты/тени в CSS переменные, настроить `@layer base`. | Tailwind 3.4.18 | Готово |
| UI Store | `src/store/uiStore.ts` | Фичефлаги, активная вкладка, глобальные модалки, persisted state, `useEffectEvent` для подписок. | Zustand 5, React 19 | Готово — глобальные модалки/notifications, сохранение темы |
| Telegram Hooks | `src/hooks/useSafeArea.ts`, `useTelegram.ts` | Перепроверить расчёт safe-area, внедрить обработку изменения viewport и `themeParams`. | `@tma.js/sdk-react` | План |
| Notifications | `src/hooks/useNotification.ts` | Добавить очередь, поддержку `aria-live`, лимит одновременных тостов. | React 19 | План |
| Тесты | `tests/performance/tap-loop.spec.ts` + новые | Добавить smoke для каждого экрана, проверить переходы, использовать `page.waitForFunction` для Suspense. | Playwright 1.45.2 | План |
| Observability | `src/services/telemetry.ts` | Обновить события для новых экранов, добавить данные о переходах. | Telemetry API | План |

[^react192]: React Team. “React 19.2.” *React.dev Blog*, October 1, 2025. https://react.dev/blog/2025/10/01/react-19-2.
[^react-best]: Jay Sarvaiya. “React 19 Best Practices.” *DEV Community*, October 2025. https://dev.to/jay_sarvaiya_reactjs/react-19-best-practices-write-clean-modern-and-efficient-react-code-1beb.
[^tailwind-best]: Steve Kinney. “Tailwind Best Practices.” *stevekinney.com*, 2025. https://stevekinney.com/courses/tailwind/tailwind-best-practices.
[^tailwind-tokens]: Nadia Nicol. “Integrating Design Tokens with Tailwind CSS.” *Nicolabs Portfolio*, April 2025. https://portfolio.nicolabs.co.uk/integrating-design-tokens-with-tailwind-css/.
[^telegram-viewport]: Telegram. “Viewport.” *Telegram Mini Apps Docs*, October 2025. https://docs.telegram-mini-apps.com/platform/viewport.
