// Sdílené funkce pro placený Kompletní výsledek (Stripe bez SDK, bez databáze).
import engine from '../../kalkulacka/hpp-nebo-osvc/engine.js';

export const CENA_KC = 990;
export const PRODUKT = 'hpp-osvc-kompletni';
export const SITE = process.env.SITE_URL || 'https://www.kliments.cz';
export const KALK_URL = `${SITE}/kalkulacka/hpp-nebo-osvc/`;

export const kc = (n) => Math.round(n).toLocaleString('cs-CZ') + ' Kč';
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// jen známé vstupy, čísla oříznutá do rozumných mezí
export function cleanVstup(vstup) {
  const out = {};
  for (const [k, def] of Object.entries(engine.DEFAULTS)) {
    const v = vstup ? vstup[k] : undefined;
    if (typeof def === 'boolean') out[k] = v === true || v === 'true' || v === '1';
    else {
      const n = Number(v);
      out[k] = Number.isFinite(n) ? Math.min(Math.max(n, 0), 100000000) : def;
    }
  }
  if (![40, 60, 80].includes(out.pausal)) out.pausal = 60;
  if (![80000, 150000].includes(out.limitUroku)) out.limitUroku = 80000;
  out.soukromePct = Math.min(out.soukromePct, 100);
  if (![1, 0.5, 0.25].includes(out.pridaneniPct)) out.pridaneniPct = 1;
  return out;
}

// vstup do metadat Stripe (každá hodnota jako řetězec, klíče s prefixem)
export function vstupDoMetadat(v) {
  const m = {};
  for (const [k, val] of Object.entries(v)) m[`v_${k}`] = typeof val === 'boolean' ? (val ? '1' : '0') : String(val);
  return m;
}
export function vstupZMetadat(meta) {
  const raw = {};
  for (const [k, val] of Object.entries(meta || {})) if (k.startsWith('v_')) raw[k.slice(2)] = val;
  return cleanVstup(raw);
}

export async function stripe(path, { method = 'GET', params } = {}) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw Object.assign(new Error('Platby nejsou nastavené.'), { status: 503 });
  let url = `https://api.stripe.com/v1/${path}`;
  const opt = { method, headers: { Authorization: `Bearer ${key}` } };
  if (params) {
    const body = new URLSearchParams();
    const add = (prefix, val) => {
      if (val === undefined || val === null) return;
      if (typeof val === 'object' && !Array.isArray(val)) Object.entries(val).forEach(([k, v]) => add(`${prefix}[${k}]`, v));
      else if (Array.isArray(val)) val.forEach((v, i) => add(`${prefix}[${i}]`, v));
      else body.append(prefix, String(val));
    };
    Object.entries(params).forEach(([k, v]) => add(k, v));
    if (method === 'GET') url += '?' + body.toString();
    else { opt.body = body.toString(); opt.headers['Content-Type'] = 'application/x-www-form-urlencoded'; }
  }
  const r = await fetch(url, opt);
  const j = await r.json();
  if (!r.ok) {
    console.error('[stripe]', path, r.status, j?.error?.message);
    throw Object.assign(new Error('Chyba platební brány.'), { status: 502 });
  }
  return j;
}

async function posliEmail(payload) {
  const KEY = process.env.RESEND_API_KEY;
  if (!KEY) return false;
  const FROM = process.env.LEAD_EMAIL_FROM || 'Kliments.cz <onboarding@resend.dev>';
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(Object.assign({ from: FROM }, payload)),
  });
  if (!r.ok) console.error('[platby] Resend', r.status, await r.text());
  return r.ok;
}

// Pošle zákazníkovi odkaz a výsledek, Josefovi oznámení. Jednou za platbu
// (příznak se ukládá do metadat PaymentIntentu, databáze není potřeba).
export async function dorucOdemceni(session) {
  const pi = session.payment_intent;
  if (!pi || typeof pi !== 'object') return;
  if (pi.metadata && pi.metadata.dodano === '1') return;

  const v = vstupZMetadat(session.metadata);
  const r = engine.spocitej(v);
  const email = session.customer_details && session.customer_details.email;
  const odkaz = `${KALK_URL}?platba=${encodeURIComponent(session.id)}`;
  const TO = process.env.LEAD_EMAIL_TO || 'kliment.josef@email.cz';

  const rows = r.varianty.map((x) => `<tr${x.id === r.vitez ? ' style="background:#f5e6e8"' : ''}><td style="padding:6px 16px 6px 0">${esc(x.nazev)}</td><td style="text-align:right;padding:6px 0">${x.dostupna ? kc(x.cisteMesic) : 'nelze'}</td></tr>`).join('');
  const tabulka = `<table style="border-collapse:collapse;font-size:14px;margin:12px 0">${rows}</table>`;

  let zakaznik = false;
  if (email) {
    zakaznik = await posliEmail({
      to: [email], reply_to: TO,
      subject: 'Váš kompletní výsledek: HPP, nebo faktura',
      html: `<div style="font-family:Arial,sans-serif;color:#1f1a18;max-width:560px">
        <h2 style="font-family:Georgia,serif;font-weight:400">Děkuji, kompletní výsledek je odemčený</h2>
        <p>Zadání: HPP za ${kc(v.hrubaMzda)} hrubého, nebo faktura ${kc(v.faktura)} měsíčně.</p>
        <p>Čistě měsíčně v jednotlivých variantách:</p>${tabulka}
        <p>Celý výsledek včetně ročního rozpisu, dopadu na důchod, nemocenské a postupu krok za krokem najdete tady:</p>
        <p><a href="${odkaz}" style="display:inline-block;background:#c97b84;color:#fff;padding:12px 22px;border-radius:30px;text-decoration:none">Otevřít kompletní výsledek</a></p>
        <p>Odkaz si uschovejte, funguje i později. Pokud budete chtít řešení na míru s konzultací, cenu ${CENA_KC} Kč vám odečtu z projektu.</p>
        <p style="color:#999;font-size:12px;margin-top:28px">Josef Kliment · business architekt a finanční ředitel · kliments.cz<br>Orientační výpočet podle pravidel pro rok 2026, nejde o daňové ani právní poradenství.</p>
      </div>`,
    });
  }
  await posliEmail({
    to: [TO], reply_to: email || TO,
    subject: `Prodej: kompletní výsledek ${CENA_KC} Kč · ${email || 'bez e-mailu'}${email && !zakaznik ? ' (e-mail zákazníkovi NEODEŠEL)' : ''}`,
    html: `<div style="font-family:Arial,sans-serif;font-size:14px">
      <h2 style="font-family:Georgia,serif">Zaplacený kompletní výsledek</h2>
      <p><strong>Zákazník:</strong> ${esc(email || 'neuveden')} · platba ${esc(session.id)}</p>
      <p><strong>Vstup:</strong> HPP ${kc(v.hrubaMzda)}, faktura ${kc(v.faktura)}, činnost ${v.pausal} %, auto ${v.maAuto ? 'ano' : 'ne'}, vlastní s.r.o. ${v.maSro ? 'ano' : 'ne'}</p>
      ${tabulka}
      <p><a href="${odkaz}">Odkaz, který dostal zákazník</a></p>
    </div>`,
  });

  try {
    await stripe(`payment_intents/${pi.id}`, { method: 'POST', params: { metadata: { dodano: '1' } } });
  } catch (e) { /* příznak se nepodařilo uložit, nevadí */ }
}
