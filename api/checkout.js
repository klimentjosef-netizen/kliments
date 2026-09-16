// Založí platbu Stripe Checkout za Kompletní výsledek kalkulačky.
// GET vrací, jestli jsou platby zapnuté (tlačítko se jinak na webu neukáže).
import engine from '../kalkulacka/hpp-nebo-osvc/engine.js';
import { CENA_KC, PRODUKT, KALK_URL, cleanVstup, vstupDoMetadat, stripe } from './_lib/platby.js';

const hits = new Map();

export default async function handler(req, res) {
  if (req.method === 'GET') return res.status(200).json({ enabled: !!process.env.STRIPE_SECRET_KEY, cena: CENA_KC });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.STRIPE_SECRET_KEY) return res.status(503).json({ error: 'Platby zatím nejsou spuštěné.' });

  const body = req.body || {};
  if (body.souhlas !== true) return res.status(400).json({ error: 'Pro pokračování je potřeba souhlas s obchodními podmínkami.' });

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'x';
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  if (list.length >= 10) return res.status(429).json({ error: 'Příliš mnoho pokusů, zkuste to za chvíli.' });
  list.push(now); hits.set(ip, list);

  const email = String(body.email || '').trim().toLowerCase().slice(0, 200);
  // testovací cena jen pro tajný odkaz (env CENA_TEST_TOKEN), jinak vždy plná cena
  const TOKEN = process.env.CENA_TEST_TOKEN;
  const testCena = !!TOKEN && TOKEN.length >= 16 && body.testToken === TOKEN;
  const castka = testCena ? 15 : CENA_KC;
  const v = cleanVstup(body.vstup);
  const kontrola = engine.zkontroluj(v);
  if (kontrola.chyby.length) return res.status(400).json({ error: kontrola.chyby[0].text });
  const meta = Object.assign(vstupDoMetadat(v), { produkt: PRODUKT, souhlas: new Date().toISOString() }, testCena ? { testovaci_cena: '1' } : {});

  try {
    const s = await stripe('checkout/sessions', {
      method: 'POST',
      params: Object.assign({
        mode: 'payment',
        locale: 'cs',
        success_url: `${KALK_URL}?platba={CHECKOUT_SESSION_ID}`,
        cancel_url: `${KALK_URL}?zruseno=1`,
        line_items: [{
          quantity: 1,
          price_data: {
            currency: 'czk',
            unit_amount: castka * 100,
            product_data: {
              name: 'Kompletní výsledek · kalkulačka HPP, nebo OSVČ',
              description: 'Srovnání všech variant, roční rozpis, dopad na důchod a nemocenskou, postup krok za krokem. Zpřístupněno ihned po zaplacení.',
            },
          },
        }],
        metadata: meta,
        payment_intent_data: { metadata: { produkt: PRODUKT }, description: 'Kompletní výsledek kalkulačky HPP, nebo OSVČ' },
      }, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? { customer_email: email } : {}),
    });
    return res.status(200).json({ url: s.url });
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.status === 503 ? e.message : 'Platbu se nepodařilo založit. Zkuste to prosím znovu.' });
  }
}
