// Po návratu z platby ověří u Stripe, že je zaplaceno, a vrátí zadání,
// pro které byl Kompletní výsledek koupen. Při prvním ověření pošle e-maily.
import { PRODUKT, stripe, vstupZMetadat, dorucOdemceni } from './_lib/platby.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const id = String(req.query?.session || '');
  if (!/^cs_(test|live)_[A-Za-z0-9]{10,200}$/.test(id)) return res.status(400).json({ error: 'Neplatný odkaz.' });

  try {
    const s = await stripe(`checkout/sessions/${id}`, { params: { 'expand[0]': 'payment_intent' } });
    if (s.metadata?.produkt !== PRODUKT) return res.status(404).json({ error: 'Platba nepatří k této kalkulačce.' });
    if (s.payment_status !== 'paid') return res.status(402).json({ error: 'Platba zatím není dokončená.' });

    try { await dorucOdemceni(s); } catch (e) { console.error('[vysledek] doruceni', e.message); }

    res.setHeader('Cache-Control', 'private, no-store');
    return res.status(200).json({ ok: true, vstup: vstupZMetadat(s.metadata), test: id.startsWith('cs_test_') });
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.status === 503 ? e.message : 'Platbu se nepodařilo ověřit.' });
  }
}
