// Vercel Serverless Function: POST /api/contact
// Validates and forwards the website contact form to osamah@travellerscafe.org via Resend.
// Requires RESEND_API_KEY to be set as an environment variable (never hard-coded here).

const RESEND_API_URL = 'https://api.resend.com/emails';
const TO_EMAIL = 'osamah@travellerscafe.org';
// Resend's shared sandbox sender works without domain verification. Once
// osamahmousa.com is verified in the Resend dashboard, switch this to an
// address on that domain (e.g. "Osamah Mousa Website <contact@osamahmousa.com>")
// for better deliverability/inbox placement.
const FROM_EMAIL = 'Osamah Mousa Website <onboarding@resend.dev>';

const ALLOWED_INTERESTS = [
  'Production & Media',
  'Cultural Collaboration',
  'Strategic Communications',
  'International Production',
  'Speaking & Partnerships',
  'Other'
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_SUBMIT_MS = 2500; // reject/ignore submissions faster than a human could plausibly type
const MAX_LEN = { name: 120, email: 200, organization: 160, message: 5000 };

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_MAX = 5; // per IP, per window
// Best-effort, per-instance only: serverless instances are not guaranteed to
// be warm or shared across regions, so this throttles rapid abuse from a
// single warm instance rather than providing a hard, distributed guarantee.
const submissionLog = new Map();

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket && req.socket.remoteAddress ? req.socket.remoteAddress : 'unknown';
}

function isRateLimited(ip) {
  const now = Date.now();
  const timestamps = (submissionLog.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (timestamps.length >= RATE_LIMIT_MAX) {
    submissionLog.set(ip, timestamps);
    return true;
  }
  timestamps.push(now);
  submissionLog.set(ip, timestamps);
  return false;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }

  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return res.status(429).json({ ok: false, error: 'Too many requests. Please try again later.' });
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim();
  const organization = String(body.organization || '').trim();
  const interest = String(body.interest || '').trim();
  const message = String(body.message || '').trim();
  const honeypot = String(body.company || '').trim(); // hidden field, real visitors never fill this in
  const loadedAt = Number(body.loadedAt) || 0;

  // Spam signals: silently "succeed" without sending, so bots get no useful
  // feedback that they were detected.
  if (honeypot) {
    return res.status(200).json({ ok: true });
  }
  if (loadedAt && Date.now() - loadedAt < MIN_SUBMIT_MS) {
    return res.status(200).json({ ok: true });
  }

  // Server-side validation — never trust the client to have already done this.
  if (!name || !email || !interest || !message) {
    return res.status(400).json({ ok: false, error: 'Please fill in all required fields.' });
  }
  if (
    name.length > MAX_LEN.name ||
    email.length > MAX_LEN.email ||
    organization.length > MAX_LEN.organization ||
    message.length > MAX_LEN.message
  ) {
    return res.status(400).json({ ok: false, error: 'One of the fields is too long.' });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ ok: false, error: 'Please enter a valid email address.' });
  }
  if (!ALLOWED_INTERESTS.includes(interest)) {
    return res.status(400).json({ ok: false, error: 'Please choose a valid option for "What are you interested in?".' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY is not configured.');
    return res.status(500).json({ ok: false, error: 'Email delivery is not configured yet.' });
  }

  const subject = `New Website Inquiry — ${interest}`;
  const text = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Organization: ${organization || '—'}`,
    `Interest: ${interest}`,
    '',
    'Message:',
    message,
    '',
    'Submitted from: osamahmousa.com'
  ].join('\n');
  const html = [
    `<p><strong>Name:</strong> ${escapeHtml(name)}</p>`,
    `<p><strong>Email:</strong> ${escapeHtml(email)}</p>`,
    `<p><strong>Organization:</strong> ${escapeHtml(organization || '—')}</p>`,
    `<p><strong>Interest:</strong> ${escapeHtml(interest)}</p>`,
    `<p><strong>Message:</strong><br>${escapeHtml(message).replace(/\n/g, '<br>')}</p>`,
    `<p style="color:#8a8a8a;font-size:12px;">Submitted from: osamahmousa.com</p>`
  ].join('\n');

  try {
    const resendRes = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [TO_EMAIL],
        reply_to: email,
        subject,
        text,
        html
      })
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.text().catch(() => '');
      console.error('Resend API error:', resendRes.status, errBody);
      return res.status(502).json({
        ok: false,
        error: "We couldn't send your message. Please try again or contact us directly by email."
      });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Contact form send failed:', err);
    return res.status(500).json({
      ok: false,
      error: "We couldn't send your message. Please try again or contact us directly by email."
    });
  }
};
