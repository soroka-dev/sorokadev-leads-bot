import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import worker from './worker.js';

const oldFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = oldFetch; });

function request(body, origin = 'https://soroka-dev.github.io') {
  return new Request('https://worker.example/lead', {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const lead = {
  name: 'Никита <тест>',
  contact: '@nikita',
  project_type: 'telegram-bot',
  details: 'Нужен бот для заявок',
};

test('valid lead reaches Telegram with escaped content', async () => {
  let sent;
  globalThis.fetch = async (_url, options) => {
    sent = JSON.parse(options.body);
    return new Response('{"ok":true}', { status: 200 });
  };
  const result = await worker.fetch(request(lead), { TELEGRAM_BOT_TOKEN: 'test', TELEGRAM_CHAT_ID: '123' });
  assert.equal(result.status, 200);
  assert.match(sent.text, /Никита &lt;тест&gt;/);
  assert.equal(sent.chat_id, '123');
});

test('invalid or cross-origin submissions never reach Telegram', async () => {
  globalThis.fetch = () => { throw new Error('unexpected Telegram call'); };
  const env = { TELEGRAM_BOT_TOKEN: 'test', TELEGRAM_CHAT_ID: '123' };
  assert.equal((await worker.fetch(request({ ...lead, details: '' }), env)).status, 400);
  assert.equal((await worker.fetch(request(lead, 'https://other.example'), env)).status, 403);
  assert.equal((await worker.fetch(request({ ...lead, website: 'spam' }), env)).status, 200);
});

test('missing secrets keep the form unavailable', async () => {
  assert.equal((await worker.fetch(request(lead), {})).status, 503);
});
