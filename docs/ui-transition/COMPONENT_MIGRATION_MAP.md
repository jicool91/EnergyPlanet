# Карта миграции компонентов

Документ обновляется по мере прогресса. Колонка «Статус» принимает значения `План`, `В работе`, `Готово`, либо конкретные комментарии (например, `Готово — без drag-свайпа`).

## Layout и навигация
| Компонент | Файл/папка | Ключевые действия | Зависимости | Статус |
| --- | --- | --- | --- | --- |
| AppLayout | `webapp/src/components/layout/AppLayout.tsx` (создать) | Контейнер `max-w-xl`, поддержка safe-area через `env(safe-area-inset-*)`, использование `motion-safe`/`motion-reduce` классов Tailwind и `useEffectEvent` для событий resize.[^telegram-viewport][^tailwind-best][^react-best] | React 19, Tailwind токены, `useSafeArea` | План |
| BottomNavigation | `webapp/src/components/layout/BottomNavigation.tsx` (адаптация `TabBar`) | Фиксированное позиционирование, пять вкладок, `aria-current`, `aria-label`, поддержка клавиатурной навигации и `startTransition` при переключении.[^react192] | `useSafeArea`, `framer-motion`, Tailwind | План |
| Header | `webapp/src/components/layout/Header.tsx` (создать) | Варианты для Tap/Exchange/Friends/Earn/Airdrop, отображение профиля, CTA, адаптивные размеры текста, анимации появления (Framer Motion + `prefers-reduced-motion`). | `useGameStore`, `useAuthStore`, `OptimizedImage` | План |
| Router Shell | `webapp/src/App.tsx` | Настроить `Routes`, `React.lazy` и `Suspense` на уровне экранов, feature flag `uiStore.isNextUiEnabled`, передавать `location` через `startTransition`. | `react-router-dom@6.30`, `uiStore` | План |

## UI-кирпичики
| Компонент | Файл/папка | Ключевые действия | Зависимости | Статус |
| --- | --- | --- | --- | --- |
| Button | `webapp/src/components/Button.tsx` | Обновить систему вариаций (primary/secondary/ghost), размеры, `data-loading`, `aria-pressed`, унифицировать цвета из токенов. | Tailwind, `class-variance-authority` | Есть (нужен рефактор) |
| Card | `webapp/src/components/Card.tsx` | Применить новые радиусы/тени, добавить интерактивные состояния, поддержку header/footer слотов. | Tailwind, CSS vars | Есть (нужен рефактор) |
| ModalBase | `webapp/src/components/ModalBase.tsx` | Унифицировать оверлей, transition, фокус-ловушку, обработку `Escape`, `prefers-reduced-motion`. | `framer-motion@12`, Tailwind | Есть (нужен рефактор) |
| Toast / Notifications | `webapp/src/components/notifications/*` | Перевести на стек уведомлений с `aria-live="polite"`, автоматическим закрытием и темing-токенами. | `useNotification`, Tailwind | План |
| ProgressBar | `webapp/src/components/LevelBar.tsx` → `components/ui/ProgressBar.tsx` | Универсальный прогресс-бар с поддержкой градиента, меток и анимаций. | Tailwind | План |
| Tabs | `webapp/src/components/TabBar.tsx` | Расширить под контентные вкладки (Earn/Airdrop), добавить swipe-gesture (по возможности), синхронизировать с маршрутизатором. | `useSafeArea`, `framer-motion` | План |
| Typography | `webapp/src/components/ui/Text.tsx` (создать) | Реализовать компонент текстовых стилей (Display/H1–H6, Body, Caption) на базе токенов; обеспечить `as`-prop. | Tailwind токены | План |

## Game-specific компоненты
| Компонент | Файл/папка | Ключевые действия | Зависимости | Статус |
| --- | --- | --- | --- | --- |
| TapCircle | `webapp/src/components/TapSection.tsx` → `components/common/TapCircle.tsx` | Выделить круг планеты, состояния tap/boost/cooldown, анимация импульса, хаптик. | `framer-motion`, `useHaptic` | План |
| DailyTasksBar | `DailyRewardBanner.tsx` + `BoostHub.tsx` | Объединить ежедневные задания, бусты, streak, добавить CTA на Earn. | `useGameStore`, `useCatalogStore` | План |
| StatsSummary | `HomePanel.tsx` → `components/common/StatsSummary.tsx` | Сводные данные по энергии, доходу, престижу, использование `AnimatedNumber`. | `useGameStore`, `AnimatedNumber` | План |
| BuildingsGrid | `BuildingsPanel.tsx` | Обновить карточки под токены, добавить виртуализацию секций `react-virtuoso`, Suspense загрузку. | React.lazy, Zustand | Есть (нужен рефактор) |
| FriendsList | `ProfilePanel.tsx` → `components/common/FriendsList.tsx` | Список друзей, CTA share, отображение прогресса рефералов. | `useGameStore`, Friends API | План |
| TasksBoard | `BoostHub.tsx` → `components/common/EarnTasksBoard.tsx` | Фильтры по задачам, прогресс, состояния выполнения, CTA. | `useGameStore`, telemetry | План |
| SeasonTimeline | `components/common/AirdropTimeline.tsx` (новый) | Таймлайн сезонов и ивентов, адаптивная шкала времени, подсвеченные активные события. | Tailwind, дата-утилиты | TBD |

## Инфраструктура и вспомогательные слои
| Объект | Файл/папка | Ключевые действия | Зависимости | Статус |
| --- | --- | --- | --- | --- |
| Цветовые токены | `src/styles/tokens.css`, `tailwind.config.js` | Синхронизировать с `COLOR_SCHEMES.md`, вынести градиенты/тени в CSS переменные, настроить `@layer base`. | Tailwind 3.4.18 | План |
| UI Store | `src/store/uiStore.ts` | Фичефлаги, активная вкладка, глобальные модалки, persisted state, `useEffectEvent` для подписок. | Zustand 5, React 19 | План |
| Telegram Hooks | `src/hooks/useSafeArea.ts`, `useTelegram.ts` | Перепроверить расчёт safe-area, внедрить обработку изменения viewport и `themeParams`. | `@tma.js/sdk-react` | План |
| Notifications | `src/hooks/useNotification.ts` | Добавить очередь, поддержку `aria-live`, лимит одновременных тостов. | React 19 | План |
| Тесты | `tests/performance/tap-loop.spec.ts` + новые | Добавить smoke для каждого экрана, проверить переходы, использовать `page.waitForFunction` для Suspense. | Playwright 1.45.2 | План |
| Observability | `src/services/telemetry.ts` | Обновить события для новых экранов, добавить данные о переходах. | Telemetry API | План |

[^react192]: React Team. “React 19.2.” *React.dev Blog*, October 1, 2025. https://react.dev/blog/2025/10/01/react-19-2.
[^react-best]: Jay Sarvaiya. “React 19 Best Practices.” *DEV Community*, October 2025. https://dev.to/jay_sarvaiya_reactjs/react-19-best-practices-write-clean-modern-and-efficient-react-code-1beb.
[^tailwind-best]: Steve Kinney. “Tailwind Best Practices.” *stevekinney.com*, 2025. https://stevekinney.com/courses/tailwind/tailwind-best-practices.
[^tailwind-tokens]: Nadia Nicol. “Integrating Design Tokens with Tailwind CSS.” *Nicolabs Portfolio*, April 2025. https://portfolio.nicolabs.co.uk/integrating-design-tokens-with-tailwind-css/.
[^telegram-viewport]: Telegram. “Viewport.” *Telegram Mini Apps Docs*, October 2025. https://docs.telegram-mini-apps.com/platform/viewport.
