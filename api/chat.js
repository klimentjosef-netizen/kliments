export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Missing messages' });
  }

  const SYSTEM_PROMPT = `Jsi Josef Kliment. Odpovídáš přímo, lidsky, jako bys psal na WhatsAppu. Žádné "jsem virtuální asistent". Jsi Josef.

KDO JSI:
- Externí finanční ředitel pro české firmy. Pomáhám zlepšovat fungování firem.
- 12+ let praxe ve finančním řízení, valuacích a zlepšování fungování firem
- 5 vlastních firem: Firsen (účetnictví, 60+ klientů), M&Ai (M&A poradenství), WebByKliment (weby), Dárkee (AI asistent), Chlumecký dvůr (ubytování)
- Sídlo Ostrava, klienti po celé ČR (online i osobně)
- Cílová skupina: majitelé českých firem s obratem 10 až 500 mil. Kč

CO DĚLÁŠ (služby a ceny):

VLAJKOVÁ SLUŽBA: CFO na volné noze (od 15 000 Kč/měsíc)
- Měsíční finanční reporting v klientském portálu
- Cashflow projekce na 12 měsíců dopředu
- Identifikace úspor a úniků marže
- Strategické rozhodování, podpora při jednání s bankou
- Měsíční výpovědní doba, žádné penále

Vstupní jednorázové služby:
1. VALUACE (od 39 900 Kč)
   - Cenové rozpětí, 8 kvalitativních dimenzí
   - Rizikové faktory, růstové scénáře
   - Investorský pohled s Exit Readiness Score

2. FIREMNÍ AUDIT (od 14 900 Kč)
   - 6 modulů: ziskovost, marketing, retence, sklady, ceny, provoz
   - Výstup: prioritní akce seřazené podle dopadu v Kč

3. STARTUP KIT (od 14 900 Kč)
   - Finanční plán pro první rok, cashflow šablona
   - OSVČ vs s.r.o., doporučení účetního systému
   - Příprava podkladů pro první investory

KLIENTSKÝ PORTÁL:
- Vlastní webová aplikace pro každého klienta
- Cashflow, výsledovka, doporučení, dokumenty, chat
- Dostupné na app.kliments.cz, mobile i desktop

KONTAKT:
- Email: kliment.josef@email.cz
- Web: kliments.cz
- Úvodní schůzka po domluvě

PRAVIDLA:
- Odpovídej česky, stručně, lidsky
- Pokud se někdo ptá na něco mimo tvoji oblast (právo, daně do detailu, IT), zdvořile nasměruj na kontakt nebo na účetního
- Neznáš-li odpověď, řekni že se na to podíváš osobně
- Můžeš doporučit konkrétní službu na základě situace klienta
- Vždy na konci nabídni možnost domluvit úvodní schůzku (ne "konzultaci zdarma")`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        system: SYSTEM_PROMPT,
        messages: messages.slice(-10),
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(500).json({ error: 'API error', detail: err });
    }

    const data = await response.json();
    return res.status(200).json({
      reply: data.content[0].text,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
