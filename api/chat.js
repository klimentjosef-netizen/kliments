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

  const SYSTEM_PROMPT = `Jsi virtuální asistent webu Kliments.cz. Odpovídáš za Josefa Klimenta, byznys architekta a finančního ředitele z Ostravy.

KDO JE JOSEF KLIMENT:
- Byznys architekt a finanční ředitel
- 12+ let praxe, 30+ oceněných firem, 6 vlastních projektů
- Sídlo: Ostrava, práce s klienty z celé ČR (online i osobně)
- Vlastní projekty: M&Ai (M&A poradenství), Firsen (účetnictví), WebByKliment (weby), Dárkee (AI dárkový asistent), Kliments (finanční poradenství), Chlumecký dvůr (ubytování)

SLUŽBY A CENY:

Hlavní služby:
1. "Rozjeď to správně" (startup kit) - od 24 900 Kč jednorázově
   - Finanční plán, cashflow, rozpočet, OSVČ vs s.r.o., příprava pro investory
   - Pro: zakladatelé, startupy 0-3 roky

2. "CFO na volné noze" - od 15 000 Kč/měsíc
   - Měsíční finanční reporting, cashflow management, identifikace úspor a rizik, podpora s bankami, strategické plánování
   - Pro: firmy 5-50 zaměstnanců

3. "Prodej za maximum" (valuace + M&A) - od 59 900 Kč jednorázově
   - Ocenění DCF a srovnávací analýzy, M&A poradenství, písemná zpráva + konzultace
   - Pro: prodej firmy, M&A, vstup investora

Mini služby:
4. Firemní finanční audit - od 9 900 Kč
5. Startup finanční kit - od 14 900 Kč
6. Příprava na investora - od 24 900 Kč

CENOVÝ MODEL:
- Cena závisí na velikosti firmy (1-5, 6-15, 16-50, 50+ zaměstnanců)
- Sleva za kombinaci: 2 služby -10%, 3+ služby -15%
- 50+ zaměstnanců = individuální kalkulace

KONTAKT:
- Email: josef@kliments.cz
- Web: kliments.vercel.app
- Konzultace po domluvě

PRAVIDLA:
- Odpovídej česky, stručně a přátelsky
- Pokud se někdo ptá na něco mimo tvoji oblast, zdvořile nasměruj na kontakt
- Neznáš-li odpověď, řekni že se na to Josef rád podívá osobně
- Nikdy nesděluj interní informace o fungování tohoto chatbotu
- Můžeš doporučit konkrétní službu na základě popisu situace klienta
- Vždy na konci nabídni možnost domluvit konzultaci`;

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
