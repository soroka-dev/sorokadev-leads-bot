# SorokaDev — приём заявок

Cloudflare Worker принимает заявку с [сайта SorokaDev](https://soroka-dev.github.io/) и пересылает её владельцу в личный чат Telegram. Код открыт, но токен бота и ID чата хранятся только в секретах Cloudflare.

## Подключение

1. Разверните Worker из этого репозитория в Cloudflare Workers.
2. Напишите своему боту `/start`.
3. Узнайте свой числовой `chat_id` (например, через метод Telegram Bot API `getUpdates` после `/start`).
4. В настройках Worker → **Variables and Secrets** добавьте два секрета: `TELEGRAM_BOT_TOKEN` (токен от BotFather) и `TELEGRAM_CHAT_ID` (ваш числовой ID чата). Затем разверните новую версию Worker.
5. Укажите URL `https://<worker>.workers.dev/lead` на сайте в `script.js`.

Секреты не добавляйте в GitHub и не вставляйте в код сайта. Бот не сохраняет заявки в базе данных. Перед публичным запуском рекомендуется включить защиту формы от спама (например, Cloudflare Turnstile).
