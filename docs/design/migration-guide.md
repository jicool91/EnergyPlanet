# Design System Migration Guide

Цель: перевести существующие экраны на дизайн-систему Stage E/F без регрессий.

## 1. Подготовка
- Открой `docs/design/DESIGN_SYSTEM_GUIDE.md` и убедись, что токены/компоненты покрывают сценарий.
- Снимите текущие скриншоты (dark/light) и соберите UX-метрики до миграции.
- Создайте ветку `ds/<feature>` и отметьте чеклист в `docs/qa/stage-e-checklist.md`.

## 2. Аудит экрана
1. Выпишите все используемые цвета, размеры, тени — сопоставьте с токенами.
2. Найдите участки с inline Tailwind (`bg-[#...]`, `text-sm`) — переведите на `Text`, `Surface`, `Panel`.
3. Зафиксируйте функциональные состояния: загрузка, пусто, ошибка, success.

## 3. Имплементация
1. Перенесите layout на `Surface`/`Panel`, используйте `flex`/`grid` токены (`gap-sm`, `px-md`).
2. Buttons → `<Button>` с подходящими вариантами; иконки оборачиваем `TouchTarget`.
3. Состояния:
   - Loading → `Skeleton` или `ShopSkeleton`.
   - Empty/Error → карточки с `tone="overlay"` и понятными `aria-live`.
4. Интегрируйте хук `useAppReducedMotion` для анимаций.
5. При необходимости добавьте stories в `webapp/src/components/.../*.stories.tsx`.

## 4. Тестирование
- `npm run lint && npm run typecheck`
- `npm run test:contrast`
- `npm run test:qa -- --grep "<feature>"` (если есть сценарий)
- `npm run test:storybook` (Chromatic photo diff)
- `npm run test:visual` при наличии Playwright визуальных тестов.

## 5. Документация
- Обновите соответствующий раздел в `docs/training/stage-e-faq.md` если появились частые вопросы.
- Обновите `docs/roadmap/migration-plan.md` (статус экрана и дата миграции).
- Если затронут сезонный функционал, добавьте заметку в `docs/release-notes/stage-f.md`.

## 6. PR чеклист
- [ ] Скриншоты dark/light
- [ ] Ссылка на Chromatic build
- [ ] Результат `npm run test:contrast`
- [ ] Краткое описание accessibility изменений
- [ ] Обновлённый пункт в `docs/roadmap/migration-plan.md`
