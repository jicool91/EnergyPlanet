# Миграция Vite 5.4.21 → 7.x

## Что нового в Vite 7

- Минимальная версия Node повышена до 20.9 (новый runtime для esbuild/rolldown).
- Обновлён сервер разработки: новый модульный HMR, доработаны настройки `server.allowedHosts`, `fs.deny`, автопривязка `clientPort`.
- Конфигурация перешла на ESM-формат без CommonJS; поддержка `defineConfig` сохранена, но рекомендуется использовать типизированные импорты.
- Плагины обновили API: `@vitejs/plugin-react@5` переключился на Babel 8 / SWC (опционально), добавлены параметры для React 19 (`babel: { plugins: ['react-compiler'] }`).
- Изменены пути вывода в build: по умолчанию имена файлов без хеша (`remove hash from built filenames`), настройка управляется полем `build.rollupOptions.output`.

## Как повлияет на наш проект

- В `webapp/vite.config.ts` уже используется ESM-экспорт (`defineConfig`) — синтаксис совместим.
- Настройки `server.hmr.clientPort` и `allowedHosts` нужно перепроверить: Vite 7 нормализует `clientPort`, а в deny/allow списках пути должны быть без слеша в конце.
- Плагин React придётся обновить до 5.x и проверить, что опция `babel` настроена (нам нужно, чтобы React 19 + compiler работали без предупреждений).
- Наша сборка использует динамический импорт и lazy-панели — нужно убедиться, что Vite 7 обрабатывает `Suspense` без дополнительных настроек.
- PostCSS/Tailwind обновятся отдельно (см. миграцию Tailwind 4) — важно, чтобы Vite подхватил новый `postcss.config.js`.

## План действий

1. Проверить минимальную версию Node на CI / локально (`node -v` >= 20.9). Обновить Docker/CI образы при необходимости.
2. Обновить зависимости:
   ```bash
   npm install vite@^7.1.11 @vitejs/plugin-react@^5.1.0
   ```
3. Просмотреть новые предупреждения сборщика:
   - если Vite удалит хеши из имён файлов, вернуть их через `build.rollupOptions.output = { entryFileNames: 'assets/[name]-[hash].js', ... }`.
   - проверить `server.hmr.clientPort` — возможно, его нужно убрать (Vite 7 сам вычисляет порт при проксировании).
4. Убедиться, что `vite.config.ts` и `tsconfig.json` используют `moduleResolution: "bundler"` или совместимы (React 19 рекомендует bundler-режим).
5. Прогнать `npm run dev` + `npm run build` и smoke-тест панели.

## Чек-лист

- [ ] Node ≥ 20.9 на всех окружениях.
- [ ] `vite` и `@vitejs/plugin-react` обновлены, сборка и линт проходят.
- [ ] Проверены HMR и `server.allowedHosts` (в т. ч. доступ по Cloudflare туннелю).
- [ ] Настройки `build` возвращают привычную структуру файлов (при необходимости).
- [ ] Документация по запуску (`README`, onboarding) обновлена под новые требования Node.
