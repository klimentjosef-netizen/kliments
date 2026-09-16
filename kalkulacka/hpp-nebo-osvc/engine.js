/* Kalkulačka HPP, nebo OSVČ · výpočetní jádro
   Parametry platné pro rok 2026. Stejná logika běží v prohlížeči i v testech (Node).
   Všechny částky v Kč, výsledky ročně, pokud není uvedeno jinak. */
(function (root) {
  'use strict';

  const P = {
    rok: 2026,
    prumernaMzda: 48967,
    minimalniMzda: 22400,
    slevaPoplatnik: 30840,
    slevaManzel: 24840,           // jen když manžel/ka pečuje o dítě do 3 let a má příjmy do 68 000 Kč
    zvyhodneniDeti: [15204, 22320, 27840], // 1. dítě, 2. dítě, 3. a každé další
    minBonus: 100,                // daňový bonus pod 100 Kč ročně se nevyplácí
    hranice23: 1762812,           // 36násobek průměrné mzdy
    zam: { soc: 0.071, zdr: 0.045 },
    zamestnavatel: { soc: 0.248, zdr: 0.09 },
    osvc: {
      socSazba: 0.292, socPodil: 0.55,
      zdrSazba: 0.135, zdrPodil: 0.50,
      minSocMesic: 17139,          // 35 % průměrné mzdy
      minZdrMesic: 24484,          // 50 % průměrné mzdy
      maxSocRok: 2350416,          // 48násobek průměrné mzdy
    },
    pausalniDan: { 1: 9162, 2: 16745, 3: 27139 },
    limitPausal: 2000000,
    vydajovePausaly: { 80: 1600000, 60: 1200000, 40: 800000 },
    sro: { dan: 0.21, dividenda: 0.15, dph: 0.21, zdrOSVBP: 3024 },
    limitOdpocetSporeni: 48000,   // penzijní spoření, DIP a životní pojištění dohromady
    duchod: { zakladni: 4900, hranice1: 21546, hranice2: 195868, redukce2: 0.26, procentoRok: 0.01495 },
  };

  const VARIANTY = [
    { id: 'hpp', nazev: 'HPP', kratce: 'Zaměstnanec na HPP' },
    { id: 'pausalniDan', nazev: 'OSVČ · paušální daň', kratce: 'Paušální daň' },
    { id: 'pausal', nazev: 'OSVČ · výdajový paušál', kratce: 'Výdajový paušál' },
    { id: 'skutecne', nazev: 'OSVČ · skutečné výdaje', kratce: 'Skutečné výdaje' },
    { id: 'pausalniDanSro', nazev: 'Paušální daň + náklady v s.r.o.', kratce: 'Paušální daň + s.r.o.', sro: true },
    { id: 'pausalSro', nazev: 'Výdajový paušál + náklady v s.r.o.', kratce: 'Výdajový paušál + s.r.o.', sro: true },
    { id: 'sroFakturuje', nazev: 'Fakturace přes vlastní s.r.o.', kratce: 'S.r.o. fakturuje', sro: true },
  ];

  const bezDph = (x) => x / (1 + P.sro.dph);
  const dolu100 = (x) => Math.floor(x / 100) * 100;
  const dolu1000 = (x) => Math.floor(x / 1000) * 1000;

  function zvyhodneniNaDeti(deti) {
    let s = 0;
    for (let i = 0; i < deti; i++) s += P.zvyhodneniDeti[Math.min(i, 2)];
    return s;
  }

  // Daň po slevách a zvýhodnění na děti. Záporná hodnota = vyplacený daňový bonus.
  // Bonus jen při příjmech ze zaměstnání nebo podnikání aspoň 6× minimální mzda.
  function danFO(zaklad, odpocty, v, prijmyProBonus) {
    const z = dolu100(Math.max(0, zaklad - odpocty));
    const dan = Math.min(z, P.hranice23) * 0.15 + Math.max(0, z - P.hranice23) * 0.23;
    const poSlevach = Math.max(0, dan - P.slevaPoplatnik - (v.slevaManzel ? P.slevaManzel : 0));
    const zvyh = zvyhodneniNaDeti(v.deti);
    if (zvyh <= poSlevach) return poSlevach - zvyh;
    const bonus = zvyh - poSlevach;
    return prijmyProBonus >= 6 * P.minimalniMzda && bonus >= P.minBonus ? -bonus : 0;
  }

  function pojistneOSVC(zisk, mesicu) {
    const socZaklad = Math.min(Math.max(zisk * P.osvc.socPodil, P.osvc.minSocMesic * mesicu), P.osvc.maxSocRok);
    const zdrZaklad = Math.max(zisk * P.osvc.zdrPodil, P.osvc.minZdrMesic * mesicu);
    return {
      soc: socZaklad * P.osvc.socSazba,
      zdr: zdrZaklad * P.osvc.zdrSazba,
      socZakladMesic: socZaklad / mesicu,
    };
  }

  function pasmoPausalniDane(prijmy, pausal) {
    if (prijmy > P.limitPausal) return null;
    if (prijmy <= 1000000 || (prijmy <= 1500000 && pausal >= 60) || pausal === 80) return 1;
    if (prijmy <= 1500000 || pausal >= 60) return 2;
    return 3;
  }

  function redukovanyZaklad(z) {
    const d = P.duchod;
    return Math.min(z, d.hranice1) + Math.max(0, Math.min(z, d.hranice2) - d.hranice1) * d.redukce2;
  }

  /* vstup: viz DEFAULTS níže */
  function spocitej(v) {
    const m = 12;
    const faktura = v.faktura * m;
    const odpocty = Math.min(v.uroky, v.limitUroku) + Math.min(v.zivotni + v.penzijni, P.limitOdpocetSporeni);

    // náklady (měsíčně)
    const autoSDph = v.maAuto ? v.autoSplatka * (1 + P.sro.dph) : 0;
    const benzin = v.maAuto ? v.benzin : 0;
    const autoCelkem = autoSDph + benzin;
    const firmaPlatiAuto = v.maAuto && v.firmaNechaAuto;
    const soukromeAuto = firmaPlatiAuto ? v.soukromePct / 100 * autoCelkem * m : 0; // nepeněžní příjem OSVČ
    const tech = v.technikaRok / m;
    const ostatniDanove = v.telefon + v.cestovani + tech;             // s DPH
    const nakladyOSVC = (firmaPlatiAuto ? 0 : autoCelkem) + ostatniDanove + v.obedy; // co platí sám
    const danoveOSVC = (firmaPlatiAuto ? 0 : autoCelkem * (1 - v.soukromePct / 100)) + ostatniDanove;

    // efektivní náklad přes s.r.o. (plátce DPH, odečte DPH i daň, majitele stojí nižší dividenda)
    const koef = (1 - P.sro.dan) * (1 - P.sro.dividenda);
    const autoPresSro = firmaPlatiAuto ? 0 : (v.maAuto ? (v.autoSplatka + bezDph(v.benzin)) : 0);
    const efektivneSro = (autoPresSro + bezDph(ostatniDanove)) * koef + v.obedy * (1 - P.sro.dividenda);

    const prijmyLimit = faktura + soukromeAuto;
    const out = {};

    // HPP
    {
      const benefit = v.maAuto ? (v.cenaAuta * v.pridaneniPct / 100 + (v.firmaPlatiSoukromyBenzin ? v.soukromePct / 100 * v.benzin : 0)) : 0;
      const zaklad = (v.hrubaMzda + benefit) * m + v.bonusHPP;
      const poj = zaklad * (P.zam.soc + P.zam.zdr);
      const dan = danFO(zaklad, odpocty, v, v.hrubaMzda * m + v.bonusHPP);
      const hotove = v.hrubaMzda * m + v.bonusHPP;
      out.hpp = { pojisteni: poj, dan, naklady: 0, cisteRok: hotove - poj - dan, duchodZaklad: (v.hrubaMzda + benefit) + v.bonusHPP / m, nakladFirmy: (v.hrubaMzda * m + v.bonusHPP) * (1 + P.zamestnavatel.soc + P.zamestnavatel.zdr) };
    }

    const fakturaCelkem = faktura + v.bonusOSVC;
    const prijmyLimitCelkem = prijmyLimit + v.bonusOSVC;

    // paušální daň
    const pasmo = pasmoPausalniDane(prijmyLimitCelkem, v.pausal);
    const pdRok = pasmo ? P.pausalniDan[pasmo] * m : null;
    const pdSocMesic = pasmo ? { 1: 5756, 2: 8191, 3: 12527 }[pasmo] / P.osvc.socSazba : 0;
    out.pausalniDan = pasmo ? { pojisteni: pdRok, dan: 0, naklady: nakladyOSVC * m, cisteRok: fakturaCelkem - pdRok - nakladyOSVC * m, pasmo, duchodZaklad: Math.round(pdSocMesic / 50) * 50 } : { nedostupne: 'Příjmy přesahují 2 mil. Kč, paušální daň nejde použít.' };
    out.pausalniDanSro = pasmo ? { pojisteni: pdRok, dan: 0, naklady: efektivneSro * m, cisteRok: fakturaCelkem - pdRok - efektivneSro * m, pasmo, duchodZaklad: out.pausalniDan.duchodZaklad } : { nedostupne: out.pausalniDan.nedostupne };

    // výdajový paušál
    const vydaje = Math.min(prijmyLimitCelkem * v.pausal / 100, P.vydajovePausaly[v.pausal]);
    const ziskP = prijmyLimitCelkem - vydaje;
    const pojP = pojistneOSVC(ziskP, m);
    const danP = danFO(ziskP, odpocty, v, prijmyLimitCelkem);
    out.pausal = { pojisteni: pojP.soc + pojP.zdr, dan: danP, naklady: nakladyOSVC * m, cisteRok: fakturaCelkem - pojP.soc - pojP.zdr - danP - nakladyOSVC * m, duchodZaklad: pojP.socZakladMesic };
    out.pausalSro = { pojisteni: pojP.soc + pojP.zdr, dan: danP, naklady: efektivneSro * m, cisteRok: fakturaCelkem - pojP.soc - pojP.zdr - danP - efektivneSro * m, duchodZaklad: pojP.socZakladMesic };

    // skutečné výdaje
    const ziskS = prijmyLimitCelkem - danoveOSVC * m;
    const pojS = pojistneOSVC(ziskS, m);
    const danS = danFO(ziskS, odpocty, v, prijmyLimitCelkem);
    out.skutecne = { pojisteni: pojS.soc + pojS.zdr, dan: danS, naklady: nakladyOSVC * m, cisteRok: fakturaCelkem - pojS.soc - pojS.zdr - danS - nakladyOSVC * m, duchodZaklad: pojS.socZakladMesic };

    // s.r.o. fakturuje
    {
      const danoveSro = (autoPresSro + bezDph(ostatniDanove)) * m + bezDph(v.ucetnictviSro) * m;
      const zaklad = fakturaCelkem - danoveSro;
      const dpp = dolu1000(Math.max(0, zaklad)) * P.sro.dan;
      const poDani = zaklad - dpp - v.obedy * m;
      const divDan = Math.max(0, poDani) * P.sro.dividenda;
      const zdr = P.sro.zdrOSVBP * m;
      out.sroFakturuje = { pojisteni: zdr, dan: dpp + divDan, naklady: danoveSro + v.obedy * m, cisteRok: poDani - divDan - zdr, duchodZaklad: 0 };
    }

    // vyhodnocení
    const dostupne = VARIANTY.filter((x) => !(x.sro && !v.maSro) && !out[x.id].nedostupne);
    let vitez = dostupne[0];
    dostupne.forEach((x) => { if (out[x.id].cisteRok > out[vitez.id].cisteRok) vitez = x; });

    const zHpp = redukovanyZaklad(out.hpp.duchodZaklad);
    VARIANTY.forEach((x) => {
      const r = out[x.id];
      if (r.nedostupne) return;
      r.cisteMesic = r.cisteRok / m;
      r.nizsiDuchodZaRok = x.id === 'hpp' ? 0 : Math.max(0, (zHpp - redukovanyZaklad(r.duchodZaklad)) * P.duchod.procentoRok);
    });

    return {
      varianty: VARIANTY.map((x) => Object.assign({ id: x.id, nazev: x.nazev, kratce: x.kratce, dostupna: dostupne.includes(x) }, out[x.id])),
      vitez: vitez.id,
      rozdilProtiHpp: (out[vitez.id].cisteRok - out.hpp.cisteRok) / m,
      prijmyLimit: prijmyLimitCelkem,
      rezervaLimit: P.limitPausal - prijmyLimitCelkem,
      pasmo,
      autoNaIcoMesic: autoCelkem,
      efektivneSroMesic: efektivneSro,
      // slevy na rodinu, o které přijde paušální daň a fakturace přes s.r.o.
      slevyRodinaRok: zvyhodneniNaDeti(v.deti) + (v.slevaManzel ? P.slevaManzel : 0),
    };
  }

  const DEFAULTS = {
    hrubaMzda: 80000, faktura: 120000, bonusHPP: 0, bonusOSVC: 0,
    pausal: 60,
    deti: 0, slevaManzel: false,
    maAuto: false, firmaNechaAuto: false, autoSplatka: 0, benzin: 0, soukromePct: 20,
    cenaAuta: 0, pridaneniPct: 1, firmaPlatiSoukromyBenzin: true,
    telefon: 1000, cestovani: 0, obedy: 0, technikaRok: 10000,
    uroky: 0, limitUroku: 80000, zivotni: 0, penzijni: 0,
    maSro: false, ucetnictviSro: 5000,
  };

  const api = { P, VARIANTY, DEFAULTS, spocitej, pasmoPausalniDane, zvyhodneniNaDeti };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.KalkHppOsvc = api;
})(typeof window !== 'undefined' ? window : this);
