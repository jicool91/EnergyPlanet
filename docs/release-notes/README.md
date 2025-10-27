# Release Notes Automation Guide

## Goals

- Автоматически повышать версию `webapp` при каждом релизе без ручного вмешательства.
- Публиковать changelog и GitHub Release с заметками, используя Conventional Commits.
- Показывать релиз-ноты внутри Telegram Mini App сразу после обновления и хранить историю в публичном канале.

## Stack Overview

| Задача | Инструмент |
| --- | --- |
| Авто-бамп версии + changelog | [`semantic-release`](https://semantic-release.gitbook.io/semantic-release/) |
| Валидация коммитов | Commit lint с Angular preset (уже в проекте через Conventional Commits) |
| GitHub Release | `@semantic-release/github` |
| Обновление `package.json`, `CHANGELOG.md` | `@semantic-release/changelog` + `@semantic-release/git` |
| Публикация npm (опционально) | `@semantic-release/npm` |
| Отображение версии в приложении | `VITE_APP_VERSION` из CI |
| Релиз-ноты в Telegram | API BotFather + собственный release endpoint |

## CI/CD Flow

1. **Коммиты.** Разработчики используют Conventional Commits (`feat:`, `fix:`, `chore:` и т. д.).
2. **PR Merge.** После мержа в `main` GitHub Action запускает `semantic-release`.
3. **semantic-release делает:**
   - определяет тип релиза (major/minor/patch);
   - обновляет `package.json` (`version` → `0.0.0-semantic-release` рекомендуется заранее);
   - генерирует/обновляет `CHANGELOG.md`;
   - пушит git-тег `vX.Y.Z` и коммит с changelog (через `@semantic-release/git`);
   - создаёт GitHub Release с подробными заметками;
   - (опционально) публикует пакет в npm.
4. **CI экспортирует номер версии.** Перед `npm run build` добавить шаг:
   ```bash
   echo "VITE_APP_VERSION=$NEXT_RELEASE_VERSION" >> $GITHUB_ENV
   ```
   В коде доступно как `import.meta.env.VITE_APP_VERSION`.
5. **Telemetry / UI.** Версию показываем в приложении, пишем в логи, отправляем на сервер.

## Telegram Release Notes UX

### Публичный канал

- В день релиза Action может вызывать `sendMessage` через Bot API и дублировать релиз-ноты в канал.
- Формат сообщения: заголовок, 2–4 ключевых изменения (эмодзи + короткий текст), ссылка на UI-демо.
- Для допуска в Bot API нужно хранить токен релиз-бота в GitHub Secrets (например, `RELEASE_BOT_TOKEN`).

### In-App "Что нового"

1. **Данные релиза.** Храним JSON в `content/releases/vX.Y.Z.json` или отдаём через API `GET /releases/latest`.
2. **Клиентская логика.**
   - Создаём хук `useWhatsNew()`, который сравнивает `VITE_APP_VERSION` с `localStorage`/`CloudStorage` (`last_seen_version`).
   - Если обнаружена новая версия, показываем fullscreen модал/баннер при первом запуске.
   - После закрытия — сохраняем `last_seen_version = текущая версия`.
3. **Дополнительно.** Кнопку "Что нового" кладём в настройки, чтобы пользователь мог перечитать заметки.

### Telegram Best Practices

- В BotFather обновить splash screen (раздел *Configure Splash Screen*) под новый релиз.
- Использовать новый мини-бар (Bot API 9.0) для подсветки обновлений: badge "NEW" поверх иконки до прочтения релиз-нот.
- Убедиться, что при возврате из minimized state отображаем подсказку про новые фичи.

## GitHub Actions Setup (пример)

```yaml
name: Release

on:
  push:
    branches:
      - main

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      issues: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - name: Semantic Release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }} # если публикуем в npm
          TELEGRAM_BOT_TOKEN: ${{ secrets.RELEASE_BOT_TOKEN }} # для отправки сообщений, опционально
        run: npx semantic-release
```

### `.releaserc` (минимальный)

```json
{
  "branches": ["main"],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    ["@semantic-release/changelog", { "changelogFile": "CHANGELOG.md" }],
    "@semantic-release/npm",
    ["@semantic-release/git", { "assets": ["package.json", "package-lock.json", "CHANGELOG.md"] }],
    "@semantic-release/github"
  ]
}
```

## Telegram Message Automation (опционально)

- Добавляем кастомный плагин или shell-скрипт после semantic-release (hook `success`), который POST-ит `text` в `https://api.telegram.org/bot$TOKEN/sendMessage`:
  ```bash
  curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
    -d chat_id="@energy_planet_updates" \
    -d text="🔥 Energy Planet v${NEXT_RELEASE_VERSION}\n- ${RELEASE_NOTES_SUMMARY}"
  ```
- `RELEASE_NOTES_SUMMARY` можно взять из `semantic-release` (hook `success` получает `{ nextRelease: { notes } }`).

## In-App Modal Example

```tsx
// webapp/src/components/WhatsNewModal.tsx
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'last_seen_version';

export function WhatsNewModal({ version, notes }: { version: string; notes: string[] }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== version) {
      setVisible(true);
    }
  }, [version]);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, version);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-backdrop flex items-center justify-center">
      <div className="whats-new-card">
        <h2>Что нового в {version}</h2>
        <ul>
          {notes.map(item => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <button onClick={handleClose}>Понятно</button>
      </div>
    </div>
  );
}
```

## To-Do Checklist

- [ ] Добавить `.releaserc` и action `Release` по примеру выше.
- [ ] Перевести `package.json.version` на `0.0.0-semantic-release` и удалить ручные bump’ы.
- [ ] Создать `content/releases/` + endpoint `GET /releases/latest` (можно статический JSON на CDN).
- [ ] Реализовать `WhatsNewModal` и вызывать его из `App.tsx`, используя `import.meta.env.VITE_APP_VERSION` и данные с backend.
- [ ] Настроить авто-пост релиз-нотов в Telegram канал через release hook.
- [ ] Документировать процесс в onboarding (ссылка на этот файл).

## References

- Telegram Bot API Mini App Updates — [BotNews #96](https://t.me/s/BotNews/96)
- Telegram Mini Apps Compact Bar — [Times of India, июль 2024](https://timesofindia.indiatimes.com/technology/social/telegram-rolls-out-new-update-mini-apps-compact-bar-paid-photos-and-other-features-coming-to-the-app/articleshow/111433385.cms)
- Mini Apps Builder — [Release Notes v1.1.1 пример](https://miniappsbuilder.medium.com/release-notes-v-1-1-1-27153dfbadb4)
- Semantic Release FAQ — [официальная документация](https://semantic-release.gitbook.io/semantic-release/support/faq)
- Автоматическая генерация релиз-нотов из коммитов — [ArXiv:2204.05345](https://arxiv.org/abs/2204.05345)
