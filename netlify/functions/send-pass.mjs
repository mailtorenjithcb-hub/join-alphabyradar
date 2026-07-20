/**
 * ALPHA Communication Engine — transactional send endpoint.
 *
 * The Command Centre calls this to email approval messages with the QR pass
 * attached (PNG, base64). Protected by a shared secret: the caller must send
 * an X-Alpha-Token header equal to the ALPHA_SEND_TOKEN environment variable.
 *
 * Required environment variables:
 *   ALPHA_SEND_TOKEN — any long random string; same value goes into the
 *                      Command Centre → Registrations → Email Setup
 *   BREVO_API_KEY    — API key from app.brevo.com
 *   FROM_EMAIL       — verified sender address in Brevo
 *   FROM_NAME        — optional, defaults to "ALPHA BY RADAR"
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Alpha-Token',
};

const json = (statusCode, body) => ({
  statusCode,
  headers: { ...CORS, 'content-type': 'application/json' },
  body: JSON.stringify(body),
});

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return json(405, { error: 'POST only' });

  const token = process.env.ALPHA_SEND_TOKEN;
  if (!token) return json(503, { error: 'Email engine not configured on the server (ALPHA_SEND_TOKEN missing).' });
  const sent = event.headers['x-alpha-token'] ?? event.headers['X-Alpha-Token'];
  if (sent !== token) return json(401, { error: 'Invalid token.' });

  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.FROM_EMAIL;
  if (!apiKey || !fromEmail) return json(503, { error: 'Email engine not configured on the server (BREVO_API_KEY / FROM_EMAIL missing).' });

  let req;
  try {
    req = JSON.parse(event.body);
  } catch {
    return json(400, { error: 'Invalid JSON body.' });
  }
  const { to, toName, subject, text, attachmentName, attachmentBase64 } = req ?? {};
  if (!to || !subject || !text) return json(400, { error: 'to, subject and text are required.' });

  const message = {
    sender: { name: process.env.FROM_NAME || 'ALPHA BY RADAR', email: fromEmail },
    to: [{ email: String(to), name: toName ? String(toName) : undefined }],
    subject: String(subject),
    textContent: String(text),
  };
  if (attachmentBase64) {
    message.attachment = [{ name: attachmentName || 'ALPHA-PASS.png', content: attachmentBase64 }];
  }

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': apiKey, 'content-type': 'application/json' },
    body: JSON.stringify(message),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error('brevo error', res.status, detail);
    return json(502, { error: `Email provider rejected the message (${res.status}).` });
  }
  return json(200, { ok: true });
};
