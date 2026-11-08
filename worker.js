const SITE_ORIGIN = 'https://soroka-dev.github.io';
const PROJECT_TYPES = {
  website: 'Сайт',
  'web-app': 'Веб-приложение',
  app: 'Приложение',
  'telegram-bot': 'Telegram-бот',
  'telegram-mini-app': 'Мини-приложение в Telegram',
  other: 'Другое',
};

function response(status, message, origin = '') {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    Vary: 'Origin',
  };
  if (origin === SITE_ORIGIN) {
    headers['Access-Control-Allow-Origin'] = SITE_ORIGIN;
    headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type';
  }
  return new Response(JSON.stringify({ message }), { status, headers });
}

function clean(value, maxLength) {
  if (typeof value !== 'string') return null;
  const text = value.trim().replace(/\s+/g, ' ');
  return text.length > 0 && text.length <= maxLength ? text : null;
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const path = new URL(request.url).pathname;

    if (path !== '/lead') return response(404, 'Не найдено.', origin);
    if (origin !== SITE_ORIGIN) return response(403, 'Недоступно.');
    if (request.method === 'OPTIONS') return response(200, 'OK', origin);
    if (request.method !== 'POST') return response(405, 'Метод не поддерживается.', origin);
    if (!request.headers.get('Content-Type')?.startsWith('application/json')) {
      return response(415, 'Неверный формат заявки.', origin);
    }

    const bodyText = await request.text();
    if (bodyText.length > 8000) return response(413, 'Заявка слишком большая.', origin);

    let body;
    try {
      body = JSON.parse(bodyText);
    } catch {
      return response(400, 'Проверьте заполнение формы.', origin);
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return response(400, 'Проверьте заполнение формы.', origin);
    }

    // Invisible field: bots often fill every input on a page.
    if (body.website) return response(200, 'Заявка отправлена.', origin);

    const name = clean(body.name, 80);
    const contact = clean(body.contact, 200);
    const details = clean(body.details, 3000);
    const projectType = Object.hasOwn(PROJECT_TYPES, body.project_type)
      ? PROJECT_TYPES[body.project_type]
      : null;
    if (!name || !contact || !details || !projectType) {
      return response(400, 'Проверьте заполнение формы.', origin);
    }

    if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
      return response(503, 'Приём заявок временно недоступен.', origin);
    }

    const message = [
      '<b>Новая заявка с сайта SorokaDev</b>',
      '',
      `<b>Имя:</b> ${escapeHtml(name)}`,
      `<b>Контакт:</b> ${escapeHtml(contact)}`,
      `<b>Проект:</b> ${escapeHtml(projectType)}`,
      `<b>Задача:</b> ${escapeHtml(details)}`,
    ].join('\n');

    try {
      const telegram = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: env.TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'HTML',
          link_preview_options: { is_disabled: true },
        }),
        signal: AbortSignal.timeout(8000),
      });
      if (!telegram.ok) return response(502, 'Не удалось отправить заявку. Попробуйте позже.', origin);
    } catch {
      return response(502, 'Не удалось отправить заявку. Попробуйте позже.', origin);
    }

    return response(200, 'Заявка отправлена. Скоро свяжемся с вами.', origin);
  },
};
