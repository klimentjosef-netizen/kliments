/* ── Společná hlavička, menu, patička a odhalování obsahu ── */

(function shared() {
  const path = location.pathname.replace(/index\.html$/, '');
  const isHome = path === '/';
  const isKontakt = path === '/kontakt/';
  const ctaHref = isHome ? '#contact' : (isKontakt ? '#lead-form' : '/kontakt/');
  const MAIL = 'kliment.josef@email.cz';

  const links = [
    { href: '/#sluzby', label: 'Služby' },
    { href: '/klientsky-portal/', label: 'Portál', long: 'Klientský portál' },
    { href: '/o-mne/', label: 'O mně' },
    { href: '/blog/', label: 'Blog', menuOnly: true },
    { href: '/kontakt/', label: 'Kontakt' },
  ];
  const current = (href) => (href === path ? ' aria-current="page"' : '');

  // HLAVIČKA (podstránky; úvodní stránka ji má přímo v HTML)
  const navEl = document.getElementById('shared-nav');
  if (navEl) {
    navEl.outerHTML = `
    <a class="skip-link" href="#main">Přeskočit na obsah</a>
    <header class="site-header">
      <nav class="nav" aria-label="Hlavní navigace">
        <a class="nav-logo" href="/" aria-label="Kliments, úvodní stránka">Kliments<span class="nav-logo-dot">.</span></a>
        <ul class="nav-links">
          ${links.filter((l) => !l.menuOnly).map((l) => `<li><a href="${l.href}"${current(l.href)}>${l.label}</a></li>`).join('')}
        </ul>
        <div class="nav-actions">
          <a class="nav-login" href="/portal">Přihlásit do portálu</a>
          <a class="btn-rose btn-sm nav-cta" href="${ctaHref}">Domluvit schůzku</a>
          <button class="nav-burger" type="button" aria-expanded="false" aria-controls="nav-menu" aria-label="Otevřít menu"><span></span><span></span></button>
        </div>
      </nav>
      <div class="nav-menu" id="nav-menu" hidden>
        <ul>
          ${links.map((l) => `<li><a href="${l.href}"${current(l.href)}>${l.long || l.label}</a></li>`).join('')}
        </ul>
        <div class="nav-menu-foot">
          <a class="btn-rose" href="${ctaHref}">Domluvit schůzku</a>
          <a href="/portal">Přihlásit do klientského portálu</a>
          <a href="mailto:${MAIL}">${MAIL}</a>
        </div>
      </div>
    </header>`;
  }

  // první obsahový blok dostane id="main" pro odkaz „Přeskočit na obsah“
  if (!document.getElementById('main')) {
    const first = document.querySelector('.site-header ~ main, .site-header ~ section, .site-header ~ article');
    if (first) first.id = 'main';
  }

  // MENU NA MOBILU
  const burger = document.querySelector('.nav-burger');
  const menu = document.getElementById('nav-menu');
  if (burger && menu) {
    const setOpen = (open) => {
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Zavřít menu' : 'Otevřít menu');
      menu.hidden = !open;
      document.documentElement.classList.toggle('menu-open', open);
      if (open) { const f = menu.querySelector('a'); if (f) f.focus({ preventScroll: true }); }
    };
    burger.addEventListener('click', () => setOpen(menu.hidden));
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !menu.hidden) { setOpen(false); burger.focus(); }
    });
    window.addEventListener('resize', () => { if (window.innerWidth > 900 && !menu.hidden) setOpen(false); });
  }

  // PATIČKA (podstránky)
  const footerEl = document.getElementById('shared-footer');
  if (footerEl) {
    footerEl.outerHTML = `
    <footer class="footer">
      <div class="container">
        <div class="footer-top">
          <div class="footer-brand">
            <a class="footer-logo" href="/">Kliments<span class="footer-logo-dot">.</span></a>
            <p class="footer-tagline">Účetnictví a finanční řízení pro malé a střední firmy. Ostrava a celá ČR.</p>
          </div>
          <div class="footer-cols">
            <div class="footer-col footer-col-wide">
              <p class="footer-col-h">Služby</p>
              <ul>
                <li><a href="/sluzby/ucetnictvi/">Účetnictví</a></li>
                <li><a href="/sluzby/cfo-na-volne-noze/">CFO na volné noze</a></li>
                <li><a href="/sluzby/valuace/">Valuace</a></li>
                <li><a href="/sluzby/firemni-audit/">Firemní audit</a></li>
                <li><a href="/sluzby/priprava-na-prodej/">Příprava na prodej</a></li>
                <li><a href="/sluzby/startup-kit/">Startup kit</a></li>
                <li><a href="/sluzby/projekt/">Projekt za 4 990 Kč</a></li>
                <li><a href="/#business-architektura">Struktura firmy</a></li>
              </ul>
            </div>
            <div class="footer-col">
              <p class="footer-col-h">Nástroje a čtení</p>
              <ul>
                <li><a href="/kalkulacka/hpp-nebo-osvc/">Kalkulačka HPP, nebo OSVČ</a></li>
                <li><a href="/klientsky-portal/">Klientský portál</a></li>
                <li><a href="/blog/">Blog</a></li>
                <li><a href="/12-chyb/">12 chyb (PDF zdarma)</a></li>
              </ul>
            </div>
            <div class="footer-col">
              <p class="footer-col-h">Kontakt</p>
              <ul>
                <li><a href="/o-mne/">Josef Kliment</a></li>
                <li><a href="mailto:${MAIL}">${MAIL}</a></li>
                <li>Ostrava a celá ČR</li>
                <li><a href="/portal">Přihlásit do portálu</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          <p class="footer-copy">&copy; 2026 Ing. Josef Kliment, IČO 05408091</p>
          <ul class="footer-links">
            <li><a href="https://instagram.com/kliments.cz" target="_blank" rel="noopener">Instagram</a></li>
            <li><a href="/obchodni-podminky/">Obchodní podmínky</a></li>
            <li hidden><button type="button" data-cookies>Nastavení cookies</button></li>
            <li><a href="/kontakt/">Kontakt</a></li>
          </ul>
        </div>
      </div>
    </footer>`;
  }

  // ODHALOVÁNÍ OBSAHU PŘI ROLOVÁNÍ (bez JS nebo s omezeným pohybem je vše hned vidět)
  const els = document.querySelectorAll('.reveal');
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!('IntersectionObserver' in window) || reduce) {
    els.forEach((el) => el.classList.add('visible'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.01 });
    els.forEach((el) => io.observe(el));
  }
})();
