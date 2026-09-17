// Souhrn z kalkulačky: pošle výsledek návštěvníkovi a lead Josefovi.
// Výsledek se počítá znovu na serveru ze stejného jádra jako v prohlížeči,
// z prohlížeče se berou jen známé číselné vstupy. E-mail má pevnou šablonu.
import engine from '../kalkulacka/hpp-nebo-osvc/engine.js';

const hits = new Map(); // jednoduchý limit na IP v rámci jedné instance
const LIMIT = 5, OKNO = 60 * 60 * 1000;

function clean(vstup) {
  const d = engine.DEFAULTS;
  const out = {};
  for (const [k, def] of Object.entries(d)) {
    const v = vstup ? vstup[k] : undefined;
    if (typeof def === 'boolean') out[k] = v === true;
    else {
      const n = Number(v);
      out[k] = Number.isFinite(n) ? Math.min(Math.max(n, 0), 100000000) : def;
    }
  }
  if (![40, 60, 80].includes(out.pausal)) out.pausal = 60;
  if (![80000, 150000].includes(out.limitUroku)) out.limitUroku = 80000;
  out.soukromePct = Math.min(out.soukromePct, 100);
  if (![1, 0.5, 0.25].includes(out.pridaneniPct)) out.pridaneniPct = 1;
  out.deti = Math.min(Math.round(out.deti), 10);
  out.situace = Math.min(Math.round(out.situace), 6);
  out.dovolenaDny = Math.min(Math.round(out.dovolenaDny), 250);
  out.nemocDny = Math.min(Math.round(out.nemocDny), 250 - out.dovolenaDny);
  return out;
}

const kc = (n) => Math.round(n).toLocaleString('cs-CZ') + ' Kč';
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const body = req.body || {};
  if (String(body.website || '').trim()) return res.status(200).json({ ok: true, userEmailed: false });

  const email = String(body.email || '').trim().toLowerCase().slice(0, 200);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Neplatný e-mail.' });
  if (body.kalkulacka !== 'hpp-nebo-osvc') return res.status(400).json({ error: 'Neznámá kalkulačka.' });

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'x';
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < OKNO);
  if (list.length >= LIMIT) return res.status(429).json({ error: 'Příliš mnoho pokusů, zkuste to později.' });
  list.push(now); hits.set(ip, list);

  const v = clean(body.vstup);
  const kontrola = engine.zkontroluj(v);
  if (kontrola.chyby.length) return res.status(400).json({ error: kontrola.chyby[0].text });
  const r = engine.spocitej(v);
  const by = Object.fromEntries(r.varianty.map((x) => [x.id, x]));
  const win = by[r.vitez];
  const hpp = by.hpp;

  console.log('[kalkulacka]', JSON.stringify({ t: new Date().toISOString(), email, vitez: r.vitez, vstup: v }));

  const KEY = process.env.RESEND_API_KEY;
  const TO = process.env.LEAD_EMAIL_TO || 'kliment.josef@email.cz';
  const FROM = process.env.LEAD_EMAIL_FROM || 'Kliments.cz <onboarding@resend.dev>';
  if (!KEY) return res.status(200).json({ ok: true, userEmailed: false, leadEmailed: false });

  const send = async (payload) => {
    const rr = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!rr.ok) console.error('[kalkulacka] Resend', rr.status, await rr.text());
    return rr.ok;
  };

  const druha = r.druha ? by[r.druha] : null;
  const vitezText = r.bezHpp
    ? `Nejvýhodnější režim je <strong>${esc(win.nazev)}</strong>${druha ? `, zhruba o ${kc(Math.round(r.rozdilProtiDruhe / 100) * 100)} měsíčně víc než ${esc(druha.nazev)}` : ''}.`
    : r.vitez === 'hpp'
    ? 'Při zadaných číslech vychází nejlépe zůstat na HPP.'
    : `Nejvíc vám zůstane ve variantě <strong>${esc(win.nazev)}</strong>, zhruba o ${kc(Math.round(r.rozdilProtiHpp / 100) * 100)} měsíčně víc než na HPP.`;
  const vyrovnaneText = r.vyrovnane ? `<p style="font-size:15px"><strong>Vychází to prakticky nastejno.</strong> ${esc(engine.textVyrovnane(r))}</p>` : '';
  const projektUrl = 'https://www.kliments.cz/sluzby/projekt/?' + new URLSearchParams({
    oblast: v.bezHpp ? 'Daňový režim na faktuře' : 'HPP, nebo faktura',
    otazka: v.bezHpp ? 'Podnikám nebo začínám. Jaký daňový režim je pro mě nejlepší?' : 'Mám nabídku na HPP, nebo na fakturu. Co se mi vyplatí a jak to nastavit?',
    kontext: `Zadání: ${engine.popisZadani(v)}.`,
  }).toString() + '#objednat';

  const userHtml = `
  <div style="font-family:Arial,sans-serif;color:#1f1a18;max-width:560px">
    <h2 style="font-family:Georgia,serif;font-weight:400">${v.bezHpp ? 'Váš výsledek: daňový režim' : 'Váš výsledek: HPP, nebo faktura'}</h2>
    <p>Zadání: ${engine.popisZadani(v)}.</p>
    <p style="font-size:16px">${vitezText}</p>
    ${vyrovnaneText}
    <table style="border-collapse:collapse;margin:16px 0;font-size:14px">
      ${v.bezHpp
        ? (druha ? `<tr><td style="padding:6px 18px 6px 0;color:#777">Čistě v druhé nejlepší variantě</td><td><strong>${kc(druha.cisteMesic)}</strong> měsíčně</td></tr>` : '')
        : `<tr><td style="padding:6px 18px 6px 0;color:#777">Čistě na HPP</td><td><strong>${kc(hpp.cisteMesic)}</strong> měsíčně</td></tr>`}
      <tr><td style="padding:6px 18px 6px 0;color:#777">Čistě v nejlepší variantě</td><td><strong>${kc(win.cisteMesic)}</strong> měsíčně</td></tr>
    </table>
    <p>${v.bezHpp
      ? 'Kalkulačka neřeší dopad na důchod a nemocenskou, termíny přihlášek ani to, kdy se vyplatí přejít do s.r.o.'
      : 'Kalkulačka nepočítá dopad na důchod a nemocenskou ani to, jak nastavit smlouvu, aby nevypadala jako skrytý pracovní poměr.'} To všechno spočítám a sepíšu v projektu za 4 990 Kč, včetně postupu krok za krokem a hodinové konzultace.</p>
    <p><a href="${projektUrl}" style="display:inline-block;background:#c97b84;color:#fff;padding:12px 22px;border-radius:30px;text-decoration:none">Chci přesné řešení</a></p>
    <p style="color:#999;font-size:12px;margin-top:28px">Josef Kliment · business architekt a finanční ředitel · kliments.cz<br>Orientační výpočet podle pravidel pro rok 2026, nejde o daňové ani právní poradenství.</p>
  </div>`;

  const rows = r.varianty.map((x) => `<tr><td style="padding:4px 14px 4px 0">${esc(x.nazev)}${x.id === r.vitez ? ' ★' : ''}</td><td style="text-align:right">${x.dostupna ? kc(x.cisteMesic) : 'nedostupné'}</td></tr>`).filter((_, i) => !r.varianty[i].skryta).join('');
  const leadHtml = `
  <div style="font-family:Arial,sans-serif;font-size:14px">
    <h2 style="font-family:Georgia,serif">Nový lead z kalkulačky HPP, nebo OSVČ</h2>
    <p><strong>E-mail:</strong> <a href="mailto:${esc(email)}">${esc(email)}</a></p>
    <p><strong>Vstup:</strong> ${v.bezHpp ? 'VÝBĚR REŽIMU' : 'NABÍDKA'}: ${engine.popisZadani(v)}, činnost ${v.pausal} %, situace: ${engine.SITUACE[v.situace]}${v.situace === 1 ? ` (mzda ${kc(v.jinaMzda)})` : ''}, děti ${v.deti}, sleva na manžela/ku ${v.slevaManzel ? 'ano' : 'ne'}, auto: ${v.maAuto ? `ano (leasing ${kc(v.autoSplatka)}, benzín ${kc(v.benzin)}, firma nechá: ${v.firmaNechaAuto ? 'ano' : 'ne'})` : 'ne'}, vlastní s.r.o.: ${v.maSro ? 'ano' : 'ne'}, bonus HPP ${kc(v.bonusHPP)}, bonus faktura ${kc(v.bonusOSVC)}, úroky ${kc(v.uroky)}</p>
    <table style="border-collapse:collapse">${rows}</table>
    <p style="color:#999;font-size:12px">Příjmy pro limit ${kc(r.prijmyLimit)}, pásmo paušální daně ${r.pasmo || 'nelze'}, DPH: ${r.platceDph ? `plátce, odběratelé ${v.odberatelPlatce ? 'plátci' : 'neplátci'}` : 'neplátce'}.</p>
  </div>`;

  let userEmailed = false, leadEmailed = false;
  try {
    userEmailed = await send({ from: FROM, to: [email], reply_to: TO, subject: 'Váš výsledek z kalkulačky HPP, nebo OSVČ', html: userHtml });
    leadEmailed = await send({ from: FROM, to: [TO], reply_to: email, subject: `Lead z kalkulačky: ${email}${userEmailed ? '' : ' (souhrn NEODEŠEL, pošli ručně)'}`, html: leadHtml });
  } catch (e) {
    console.error('[kalkulacka] výjimka', e.message);
  }
  return res.status(200).json({ ok: true, userEmailed, leadEmailed });
}
