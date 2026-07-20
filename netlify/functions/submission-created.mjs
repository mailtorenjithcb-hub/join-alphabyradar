/**
 * ALPHA Communication Engine — automatic welcome email.
 *
 * Netlify runs this function automatically for EVERY verified form submission
 * on this site (the special function name "submission-created" wires it up).
 * When the submission is the community `alpha-join` form, the registrant
 * immediately receives the fixed welcome email via Brevo. A venue enquiry
 * gets its own separate auto-reply.
 *
 * Registration data for the Command Centre sync lives in Netlify Forms
 * itself (already the permanent store) — see list-registrations.mjs, which
 * reads it via the Netlify API rather than duplicating it into a second store.
 *
 * Required environment variables (Netlify → Site settings → Environment):
 *   BREVO_API_KEY  — API key from app.brevo.com (SMTP & API → API keys)
 *   FROM_EMAIL     — verified sender address in Brevo (e.g. alphabyradar@gmail.com)
 *   FROM_NAME      — optional, defaults to "ALPHA BY RADAR"
 *
 * Without BREVO_API_KEY the function exits quietly — form storage and the
 * owner-notification emails are not affected.
 */

const WELCOME_SUBJECT = 'Welcome to ALPHA BY RADAR';

const WELCOME_BODY = `Your registration has been received successfully.

Our team is now reviewing your application.

If approved you will receive:

• QR Entry Pass
• Event details
• Future ALPHA invitations

Thank you for joining.

ALPHA BY RADAR`;

const VENUE_SUBJECT = 'Your Venue Analysis Request — ALPHA Intelligence Engine';

const venueBody = (venueName) => `Your venue analysis request${venueName ? ` for ${venueName}` : ''} has been received.

Our team is now reviewing the information you shared.

We reply on WhatsApp or email within 48 hours with the next step.

Every recommendation is evidence based.
No statistics are invented.

One venue in. One consultancy report out.

ALPHA BY RADAR
ALPHA INTELLIGENCE ENGINE · VENUE CONSULTING`;

export const handler = async (event) => {
  let payload;
  try {
    payload = JSON.parse(event.body).payload;
  } catch {
    return { statusCode: 400, body: 'bad payload' };
  }

  const data = payload?.data ?? {};
  const formName = payload?.form_name ?? data['form-name'] ?? '';

  // Two audiences, two separate auto-replies.
  const isJoinForm = formName === 'alpha-join' || (!formName && data.full_name && !data.venue_name);
  const isVenueForm = formName === 'venue-enquiry' || (!formName && data.venue_name);
  if (!isJoinForm && !isVenueForm) return { statusCode: 200, body: 'ignored' };

  const to = (data.email ?? '').trim();
  const toName = (isJoinForm ? data.full_name : data.owner_name ?? '').trim();
  if (!to) return { statusCode: 200, body: 'no email on submission' };

  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.FROM_EMAIL;
  if (!apiKey || !fromEmail) {
    console.log('welcome email skipped — BREVO_API_KEY / FROM_EMAIL not configured');
    return { statusCode: 200, body: 'email not configured' };
  }

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': apiKey, 'content-type': 'application/json' },
    body: JSON.stringify({
      sender: { name: process.env.FROM_NAME || 'ALPHA BY RADAR', email: fromEmail },
      to: [{ email: to, name: toName || undefined }],
      subject: isJoinForm ? WELCOME_SUBJECT : VENUE_SUBJECT,
      textContent: isJoinForm ? WELCOME_BODY : venueBody((data.venue_name ?? '').trim()),
    }),
  });

  if (!res.ok) {
    console.error('brevo error', res.status, await res.text());
    return { statusCode: 200, body: 'send failed (logged)' };
  }
  console.log(`welcome email sent to ${to}`);
  return { statusCode: 200, body: 'sent' };
};
