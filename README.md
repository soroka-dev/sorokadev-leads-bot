# SorokaDev — приём заявок

Cloudflare Worker принимает заявки с [сайта SorokaDev](https://soroka-dev.github.io/) и пересылает их владельцу в личный чат через `@sorokadevbot`. Рабочий адрес сервиса: `https://sorokadev-leads-bot.soroka-development.workers.dev/lead`. Код открыт, но токен бота и ID чата хранятся только в секретах Cloudflare.

## Как устроено подключение

1. Сайт отправляет данные формы на `/lead` этого Worker.
2. Worker проверяет данные и отправляет сообщение через Telegram Bot API.
3. В настройках Worker → **Variables and Secrets** уже добавлены секреты `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID`. После перевыпуска токена обновите его там.

Worker сейчас развёрнут через редактор Cloudflare. GitHub хранит исходный код; автоматическое развёртывание из репозитория не подключено. При изменении `worker.js` обновите код Worker в Cloudflare.

Секреты не добавляйте в GitHub и не вставляйте в код сайта. Бот не сохраняет заявки в базе данных. Форма ограничивает размер полей и содержит скрытое поле против простых спам-ботов; при росте спама можно добавить Cloudflare Turnstile.
