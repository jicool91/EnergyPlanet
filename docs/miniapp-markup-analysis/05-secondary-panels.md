# Secondary Panels (Shop, Buildings, Leaderboard, Profile, Settings)

## Problems
- Магазин и вспомогательные панели продолжают опираться на статичные темные цвета: заголовок магазина (`text-white`) и описание (`text-white/60`) игнорируют тему (`webapp/src/components/ShopPanel.tsx:166-174`). Аналогично — кнопки фильтров в зданиях (`text-[#f8fbff]`) и блоки ошибок (`webapp/src/components/BuildingsPanel.tsx:203-244`).
- Лидерборд и профиль выводят данные с жесткой окраской (`text-white`, `bg-white/10`), что ломает контраст и не адаптируется под светлую палитру (`webapp/src/components/LeaderboardPanel.tsx:95-205`, `webapp/src/components/ProfilePanel.tsx:35-116`).
- Экран настроек использует `text-white`/`bg-dark-tertiary`, поэтому переключение на светлую тему визуально не отражается (`webapp/src/components/settings/SettingsScreen.tsx:93-224`).
- Важные CTA (покупка паков, апгрейд построек, подтверждение настроек) работают через локальные кнопки, без `Telegram.WebApp.MainButton`, хотя хук уже реализован (`webapp/src/hooks/useTelegramMainButton.ts:15`).

## Recommendations
- Привести панели к токенам: заменить классы вроде `text-white/60` на `text-[var(--color-text-secondary)]`, а градиенты — на значения из темы или создать светлые альтернативы.
- Для таблиц/списков лидеров использовать CSS переменные `--color-border-subtle`, `--color-surface-secondary` вместо `border-white/[0.04]`.
- Интегрировать `useTelegramMainButton` в подтверждениях покупки и сохранения настроек: показывать системную кнопку с состояниями enable/disable и прогрессом.
- Для сообщений об ошибках использовать общий компонент `Card` с токенами, чтобы оформление не расходилось между экранами.

## Strengths
- Панели магазина и построек подтягивают `safeArea.content.bottom`, что предотвращает перекрытие таб-баром (`webapp/src/components/ShopPanel.tsx:121-127`, `webapp/src/components/BuildingsPanel.tsx:57-63`).
- Есть skeleton'ы и `ErrorBoundary`, поэтому состояние загрузки/ошибок визуализировано (`webapp/src/components/ShopPanel.tsx:298-301`, `webapp/src/components/BuildingsPanel.tsx:248-251`, `webapp/src/components/LeaderboardPanel.tsx:60-79`).

## Next steps
- Рефакторить цветовые схемы во всех панелях, заменив прямые значения на дизайн-токены.
- Добавить подключение MainButton и проверить UX покупки/настроек в Telegram-клиенте.
