// Lead form endpoint pro kliments.cz
// Posila email pres Resend pokud je nastaven RESEND_API_KEY,
// jinak uklada lead jen do Vercel logu (visible pres vercel logs).
// Lead se nikdy neztrati - bud prijde email, nebo zustane v logu.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = req.body || {};
  const name = String(body.name || '').trim().slice(0, 200);
  const email = String(body.email || '').trim().toLowerCase().slice(0, 200);
  const phone = String(body.phone || '').trim().slice(0, 50);
  const interest = String(body.interest || '').trim().slice(0, 100);
  const message = String(body.message || '').trim().slice(0, 5000);
  const honeypot = String(body.website || '').trim();

  // Honeypot: bot ho vyplni, clovek ne
  if (honeypot) {
    console.log('[lead] honeypot triggered, ignoring');
    return res.status(200).json({ ok: true });
  }

  // Zakladni validace
  if (!name || !email) {
    return res.status(400).json({ error: 'Jméno a e-mail jsou povinné.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Neplatný e-mail.' });
  }

  const lead = {
    timestamp: new Date().toISOString(),
    name, email, phone, interest, message,
    ip: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || null,
    ua: req.headers['user-agent']?.slice(0, 300) || null,
  };

  // Vzdy log - lead se neztrati ani bez Resend
  console.log('[lead]', JSON.stringify(lead));

  const RESEND_KEY = process.env.RESEND_API_KEY;
  const TO = process.env.LEAD_EMAIL_TO || 'josef@kliments.cz';
  const FROM = process.env.LEAD_EMAIL_FROM || 'Kliments.cz <onboarding@resend.dev>';

  if (RESEND_KEY) {
    try {
      const subject = `Nový lead z kliments.cz: ${name}` + (interest ? ` — ${interest}` : '');
      const html = `
        <h2 style="font-family:Georgia,serif;color:#1f1a18">Nový lead z kliments.cz</h2>
        <table style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse;margin-top:16px">
          <tr><td style="padding:8px 16px 8px 0;color:#888"><strong>Jméno:</strong></td><td>${escapeHtml(name)}</td></tr>
          <tr><td style="padding:8px 16px 8px 0;color:#888"><strong>E-mail:</strong></td><td><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
          ${phone ? `<tr><td style="padding:8px 16px 8px 0;color:#888"><strong>Telefon:</strong></td><td>${escapeHtml(phone)}</td></tr>` : ''}
          ${interest ? `<tr><td style="padding:8px 16px 8px 0;color:#888"><strong>Zajímá:</strong></td><td>${escapeHtml(interest)}</td></tr>` : ''}
          ${message ? `<tr><td style="padding:8px 16px 8px 0;color:#888;vertical-align:top"><strong>Zpráva:</strong></td><td style="white-space:pre-wrap">${escapeHtml(message)}</td></tr>` : ''}
        </table>
        <p style="font-family:Arial,sans-serif;font-size:12px;color:#aaa;margin-top:24px">
          Odesláno z formuláře na kliments.cz · ${escapeHtml(lead.timestamp)}
        </p>
      `;

      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM,
          to: [TO],
          reply_to: email,
          subject,
          html,
        }),
      });

      if (!r.ok) {
        const errText = await r.text();
        console.error('[lead] Resend error:', r.status, errText);
        // Lead je v logu, vrat success
        return res.status(200).json({ ok: true, emailed: false });
      }
      return res.status(200).json({ ok: true, emailed: true });
    } catch (err) {
      console.error('[lead] Resend exception:', err.message);
      return res.status(200).json({ ok: true, emailed: false });
    }
  }

  // Bez Resend klice - lead je jen v logu
  return res.status(200).json({ ok: true, emailed: false });
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
