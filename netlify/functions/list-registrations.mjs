/**
 * ALPHA Communication Engine — registration sync endpoint.
 *
 * The Command Centre calls this to pull `alpha-join` registrations straight
 * from Netlify Forms (already the permanent store — nothing is duplicated).
 * Protected by the same shared secret as send-pass.mjs: X-Alpha-Token must
 * equal ALPHA_SEND_TOKEN.
 *
 * Required environment variable:
 *   NETLIFY_API_TOKEN — a Netlify Personal Access Token (User settings →
 *     Applications → New access token) that can read this site's forms.
 *
 * Response: { registrations: [{ id, full_name, phone, email, notes, created_at }, ...] }
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Alpha-Token',
};

const json = (statusCode, body) => ({
  statusCode,
  headers: { ...CORS, 'content-type': 'application/json' },
  body: JSON.stringify(body),
});

const FORM_NAME = 'alpha-join';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (event.httpMethod !== 'GET') return json(405, { error: 'GET only' });

  const token = process.env.ALPHA_SEND_TOKEN;
  if (!token) return json(503, { error: 'Sync not configured on the server (ALPHA_SEND_TOKEN missing).' });
  const sent = event.headers['x-alpha-token'] ?? event.headers['X-Alpha-Token'];
  if (sent !== token) return json(401, { error: 'Invalid token.' });

  const apiToken = process.env.NETLIFY_API_TOKEN;
  const siteId = process.env.SITE_ID || process.env.NETLIFY_SITE_ID;
  if (!apiToken || !siteId) {
    return json(503, { error: 'Sync not configured on the server (NETLIFY_API_TOKEN missing).' });
  }
  const authHeaders = { Authorization: `Bearer ${apiToken}` };

  try {
    const formsRes = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/forms`, { headers: authHeaders });
    if (!formsRes.ok) throw new Error(`forms lookup failed (${formsRes.status})`);
    const forms = await formsRes.json();
    const form = forms.find((f) => f.name === FORM_NAME);
    if (!form) return json(200, { registrations: [] });

    const subsRes = await fetch(`https://api.netlify.com/api/v1/forms/${form.id}/submissions?per_page=200`, { headers: authHeaders });
    if (!subsRes.ok) throw new Error(`submissions fetch failed (${subsRes.status})`);
    const submissions = await subsRes.json();

    const registrations = submissions
      .map((s) => ({
        id: String(s.id),
        full_name: (s.data?.full_name ?? '').trim(),
        phone: (s.data?.phone ?? '').trim(),
        email: (s.data?.email ?? '').trim(),
        notes: (s.data?.notes ?? '').trim(),
        created_at: s.created_at,
      }))
      .filter((r) => r.full_name)
      .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));

    return json(200, { registrations });
  } catch (err) {
    console.error('list-registrations failed', err);
    return json(500, { error: 'Could not read registrations.' });
  }
};
