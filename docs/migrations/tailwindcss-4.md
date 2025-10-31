# Миграция `tailwindcss` 3.4.18 → 4.x

## Ключевые изменения в Tailwind 4

- Полная переработка ядра: конфигурация стала опциональной, стили генерируются на лету, вместо `@tailwind base/components/utilities` можно использовать предсобранный `tailwind.css`.
- Введён новый PostCSS-плагин `@tailwindcss/postcss` (заменяет `tailwindcss` в списке плагинов). CLI работает только в режиме "configless" — при использовании кастомного конфига нужно подключать Tailwind через PostCSS.
- Изменился формат `tailwind.config.*`: теперь используют `export default { theme: { extend: {} } }` или `defineConfig`. Поля `content` заменены на `files` / `safelist`, классы интерпретируются по-новому (поддержка `@apply` осталась, но требует включённого PostCSS).
- Добавлены новые токены (в т. ч. safe alignment), обновлена палитра, типографика и т.д.

## Что нужно поменять в проекте

Наша сборка (`vite + postcss`) использует классическую схему:
- в `webapp/postcss.config.js` Tailwind подключён как `require('tailwindcss')`;
- конфигурация (`webapp/tailwind.config.js`) массово расширяет `extend.colors`, `extend.spacing`, `fontSize`, `boxShadow`, `animation`, `plugins` и т.д.;
- глобальный CSS (`webapp/src/index.css`) содержит директивы `@tailwind base;` / `components;` / `utilities;` и собственные токены.

Для перехода на 4.x придётся:
1. **Заменить PostCSS-плагин.** В `postcss.config.js` вместо `require('tailwindcss')` и `require('autoprefixer')` использовать `require('@tailwindcss/postcss')`. Если нужен Autoprefixer — он теперь встроен.
2. **Переписать конфиг.** Создать `tailwind.config.ts` с `import { defineConfig } from 'tailwindcss'` и перенести настройки:
   ```ts
   import { defineConfig } from 'tailwindcss';

   export default defineConfig({
     content: ['./index.html', './src/**/*.{ts,tsx}'],
     theme: {
       extend: {
         colors: { ... },
         spacing: { ... },
         fontSize: { ... },
         boxShadow: { ... },
         animation: { ... },
       },
     },
     plugins: [],
   });
   ```
   Tailwind 4 допускает старое поле `content`, поэтому можно сохранить текущие пути; главное — экспортировать конфиг в новом формате (CommonJS больше не работает).
3. **Перенести кастомные токены.** Наш файл `src/styles/tokens.css` останется в силе, но нужно проверить, не дублируем ли значения с обновлёнными встроенными токенами (Tailwind 4 добавил поддержку CSS custom properties из коробки). Возможно, часть цветов и spacing можно удалить из `extend` и заменить переменными.
4. **Проверить плагины.** Tailwind 4 не использует старые utility-плагины из CommonJS. У нас кастомных плагинов нет, но в `tailwind.config.js` был inline-плагин (добавляли `.will-animate`, `.glow`). Нужно переписать его в формате `plugin(({ addUtilities }) => { ... })` и импортировать из `tailwindcss/plugin` в новом конфиге.
5. **Обновить скрипты.** В `package.json` команда `npm run build` уже вызывает Vite, дополнительных изменений не нужно. На всякий случай проверить, что `vite` использует PostCSS-конфиг.
6. **Smoke-тест:** прогнать `npm run dev` и просмотр панелей (основные токены — цвета, spacing, safe-area). Tailwind 4 немного изменил named-кастомные классы (например, `shadow-card`), убедиться, что утилиты собираются.

## Чек-лист

- [ ] Установлен `tailwindcss@^4` и `@tailwindcss/postcss`.
- [ ] Конфиг переписан на `tailwind.config.ts` / `defineConfig`, кастомные utilities и токены перенесены.
- [ ] Inline-плагин с `will-animate`/`will-opacity` работает в новом формате.
- [ ] dev и prod сборка проходят, классы `px-md`, `gap-sm-plus`, `shadow-card` и т.д. генерируются корректно.
- [ ] Документация (`docs/ui-architecture/Design-Tokens.md`) обновлена, если изменятся названия токенов.
