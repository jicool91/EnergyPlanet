# Storybook & Chromatic Setup

## Установка
```bash
cd webapp
npm install
```

## Локальный запуск
```bash
npm run storybook
```
Откроется на `http://localhost:6006`. Используйте для ручной проверки состояний и `useAppReducedMotion`.

## Публикация снапшотов
```bash
npm run test:storybook
```
- Команда собирает Storybook (`npm run build-storybook`) и отправляет снапшоты в Chromatic.
- По умолчанию используется проект-токен `chpt_d186b1e8c7c83fe`. Переопределить можно `CHROMATIC_PROJECT_TOKEN`.
- Результат будет в консоли (ссылка вида `https://<id>.chromatic.com`).

## CI (опционально)
Пример GitHub Actions:
```yaml
- name: Chromatic
  working-directory: webapp
  run: |
    npm ci
    npm run test:storybook
  env:
    CHROMATIC_PROJECT_TOKEN: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
```

## Структура stories
- `src/components/*.stories.tsx` — базовые атомы (Button, Card, ModalBase).
- `src/visual/previews/*` — сценарии экранов (Friends, Tap, Exchange, LevelUp).
- Новые stories должны покрывать:
  - Dark/light тему (`args: { theme: 'light' }`).
  - Edge cases (empty/error).
  - Accessibility: проверьте контраст и фокус.

## Debug
- Если Chromatic падает из-за размера бандла, проверьте `npm run build-storybook` локально.
- Для визуальных диффов используйте панель Chromatic → Accept/Reject.
- Журнал публикаций храните в PR описании.
