/* Měření a souhlas s cookies (Google Analytics 4 a Meta Pixel).
   Dokud nejsou vyplněná ID níže, nic se nenačítá a lišta se neukazuje.
   Analytika i reklama se spustí až po souhlasu, volba se ukládá v prohlížeči. */
(function () {
  'use strict';

  const MERENI = {
    ga4: '',        // např. 'G-XXXXXXXXXX'
    metaPixel: '',  // např. '123456789012345'
  };
  const KLIC = 'kx-souhlas';
  const VERZE = 1;
  const zapnuto = !!(MERENI.ga4 || MERENI.metaPixel);

  let souhlas = null;
  try { souhlas = JSON.parse(localStorage.getItem(KLIC) || 'null'); } catch (e) { souhlas = null; }
  if (!souhlas || souhlas.v !== VERZE) souhlas = null;

  let gaNacteno = false, metaNacteno = false;

  function nactiGa() {
    if (gaNacteno || !MERENI.ga4) return;
    gaNacteno = true;
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(MERENI.ga4);
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', MERENI.ga4, { anonymize_ip: true });
  }

  function nactiMeta() {
    if (metaNacteno || !MERENI.metaPixel) return;
    metaNacteno = true;
    /* oficiální zavaděč Meta Pixelu */
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', MERENI.metaPixel);
    window.fbq('track', 'PageView');
  }

  function uplatni() {
    if (!zapnuto || !souhlas) return;
    if (souhlas.analyticke) nactiGa();
    if (souhlas.marketingove) nactiMeta();
  }

  function uloz(analyticke, marketingove) {
    souhlas = { v: VERZE, analyticke: !!analyticke, marketingove: !!marketingove, cas: new Date().toISOString() };
    try { localStorage.setItem(KLIC, JSON.stringify(souhlas)); } catch (e) { /* bez úložiště platí jen pro tuto stránku */ }
    zavri();
    uplatni();
  }

  // Události pro měření trychtýře. Bez souhlasu nebo bez ID nic nedělá.
  const META_UDALOSTI = { generate_lead: 'Lead', begin_checkout: 'InitiateCheckout', purchase: 'Purchase' };
  window.kxTrack = function (nazev, parametry) {
    const p = parametry || {};
    if (gaNacteno && window.gtag) window.gtag('event', nazev, p);
    if (metaNacteno && window.fbq) {
      const std = META_UDALOSTI[nazev];
      const data = p.value != null ? { value: p.value, currency: p.currency || 'CZK' } : {};
      if (std) window.fbq('track', std, data);
      else window.fbq('trackCustom', nazev, data);
    }
  };

  /* ── lišta ── */
  let lista = null;

  function styly() {
    if (document.getElementById('kx-cc-css')) return;
    const css = document.createElement('style');
    css.id = 'kx-cc-css';
    css.textContent = `
.kx-cc { position: fixed; left: 16px; right: 16px; bottom: 16px; z-index: 1000; max-width: 560px; margin: 0 auto;
  background: #1f1a18; color: #faf4ed; border-radius: 18px; padding: 22px 24px; box-shadow: 0 16px 40px rgba(31,26,24,.35);
  font-family: 'Outfit', system-ui, sans-serif; font-size: .88rem; line-height: 1.55; }
.kx-cc h2 { font-family: 'Lora', Georgia, serif; font-weight: 400; font-size: 1.15rem; margin: 0 0 8px; color: #faf4ed; }
.kx-cc p { margin: 0 0 14px; color: rgba(250,244,237,.75); }
.kx-cc a { color: #e8b7bd; }
.kx-cc-volby { display: flex; flex-direction: column; gap: 10px; margin: 0 0 16px; }
.kx-cc-volby label { display: flex; gap: 10px; align-items: flex-start; cursor: pointer; }
.kx-cc-volby input { width: 18px; height: 18px; margin-top: 2px; accent-color: #c97b84; flex-shrink: 0; }
.kx-cc-volby b { display: block; font-weight: 500; color: #faf4ed; }
.kx-cc-volby span span { color: rgba(250,244,237,.6); font-size: .8rem; }
.kx-cc-btns { display: flex; flex-wrap: wrap; gap: 8px; }
.kx-cc-btns button { font: inherit; font-size: .72rem; letter-spacing: .1em; text-transform: uppercase; border-radius: 100px;
  padding: 11px 18px; cursor: pointer; border: 1.5px solid rgba(250,244,237,.25); background: transparent; color: #faf4ed; }
.kx-cc-btns button.hl { background: #c97b84; border-color: #c97b84; color: #fff; }
.kx-cc-btns button:focus-visible, .kx-cc-volby input:focus-visible { outline: 2px solid #e8b7bd; outline-offset: 2px; }
.kx-cc[hidden], .kx-cc [hidden] { display: none !important; }
[data-cookies] { font: inherit; background: none; border: 0; padding: 0; cursor: pointer;
  font-size: 0.65rem; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(250,244,237,0.35); }
[data-cookies]:hover { color: #e8b7bd; }`;
    document.head.appendChild(css);
  }

  function otevri(sNastavenim) {
    if (!zapnuto) return;
    styly();
    if (!lista) {
      lista = document.createElement('div');
      lista.className = 'kx-cc';
      lista.setAttribute('role', 'dialog');
      lista.setAttribute('aria-live', 'polite');
      lista.setAttribute('aria-label', 'Nastavení cookies');
      lista.innerHTML = `
        <h2>Cookies</h2>
        <p>Web potřebuje jen nezbytné cookies. S vaším souhlasem měřím návštěvnost a úspěšnost reklamy, abych věděl, co lidem pomáhá. <a href="/obchodni-podminky/#cookies">Podrobnosti</a></p>
        <div class="kx-cc-volby" data-volby hidden>
          <label><input type="checkbox" checked disabled><span><b>Nezbytné</b><span>Fungování webu a uložení této volby.</span></span></label>
          ${MERENI.ga4 ? '<label><input type="checkbox" data-analyticke><span><b>Analytické</b><span>Google Analytics, anonymní statistiky návštěvnosti.</span></span></label>' : ''}
          ${MERENI.metaPixel ? '<label><input type="checkbox" data-marketingove><span><b>Marketingové</b><span>Meta Pixel, měření a cílení reklamy na Facebooku a Instagramu.</span></span></label>' : ''}
        </div>
        <div class="kx-cc-btns">
          <button type="button" class="hl" data-vse>Přijmout vše</button>
          <button type="button" data-nezbytne>Jen nezbytné</button>
          <button type="button" data-nastaveni>Nastavení</button>
          <button type="button" class="hl" data-ulozit hidden>Uložit volbu</button>
        </div>`;
      document.body.appendChild(lista);
      const q = (s) => lista.querySelector(s);
      q('[data-vse]').addEventListener('click', () => uloz(true, true));
      q('[data-nezbytne]').addEventListener('click', () => uloz(false, false));
      q('[data-nastaveni]').addEventListener('click', () => ukazVolby(true));
      q('[data-ulozit]').addEventListener('click', () => {
        const a = q('[data-analyticke]'), m = q('[data-marketingove]');
        uloz(a ? a.checked : false, m ? m.checked : false);
      });
    }
    const a = lista.querySelector('[data-analyticke]'), m = lista.querySelector('[data-marketingove]');
    if (a) a.checked = !!(souhlas && souhlas.analyticke);
    if (m) m.checked = !!(souhlas && souhlas.marketingove);
    ukazVolby(!!sNastavenim);
    lista.hidden = false;
  }

  function ukazVolby(ano) {
    lista.querySelector('[data-volby]').hidden = !ano;
    lista.querySelector('[data-nastaveni]').hidden = ano;
    lista.querySelector('[data-ulozit]').hidden = !ano;
  }

  function zavri() { if (lista) lista.hidden = true; }

  function start() {
    // odkaz „Nastavení cookies" v patičce dává smysl jen se zapnutým měřením
    document.querySelectorAll('[data-cookies]').forEach((b) => { b.closest('li') ? (b.closest('li').hidden = !zapnuto) : (b.hidden = !zapnuto); });
    document.addEventListener('click', (e) => {
      const b = e.target.closest && e.target.closest('[data-cookies]');
      if (b) { e.preventDefault(); otevri(true); }
    });
    if (zapnuto && !souhlas) otevri(false);
    uplatni();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
