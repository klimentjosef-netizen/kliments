/* ── Shared nav + footer for subpages ── */

(function renderShared() {
  const root = document.documentElement.dataset.root || '/';

  // NAV
  const navEl = document.getElementById('shared-nav');
  if (navEl) {
    navEl.outerHTML = `
    <nav>
      <a class="nav-logo" href="${root}">AkiNow<span class="nav-logo-dot">.</span></a>
      <button class="nav-burger" id="nav-burger" aria-label="Menu" onclick="document.querySelector('.nav-links').classList.toggle('open');this.classList.toggle('open')">
        <span></span><span></span><span></span>
      </button>
      <ul class="nav-links">
        <li><a href="${root}#sluzby">Služby</a></li>
        <li><a href="/klientsky-portal/">Portál</a></li>
        <li><a href="/o-mne/">O mně</a></li>
        <li><a href="/kontakt/">Kontakt</a></li>
        <li><a href="/portal" class="nav-pill">Přístup do portálu &rarr;</a></li>
      </ul>
    </nav>`;
  }

  // FOOTER
  const footerEl = document.getElementById('shared-footer');
  if (footerEl) {
    footerEl.outerHTML = `
    <footer class="footer">
      <div class="footer-top">
        <div class="footer-brand">
          <div class="footer-logo">AkiNow<span class="footer-logo-dot">.</span></div>
          <p class="footer-tagline">Účetnictví, finanční řízení a struktura firmy.<br>Ostrava, celá ČR.</p>
        </div>
        <div class="footer-cols">
          <div class="footer-col">
            <p class="footer-col-h">Služby</p>
            <ul>
              <li><a href="/sluzby/ucetnictvi/">Účetnictví</a></li>
              <li><a href="/sluzby/cfo-na-volne-noze/">CFO na volné noze</a></li>
              <li><a href="/#business-architektura">Struktury firem</a></li>
              <li><a href="/sluzby/projekt/">Projekt za 4 990 Kč</a></li>
              <li><a href="/sluzby/valuace/">Valuace</a></li>
              <li><a href="/sluzby/firemni-audit/">Firemní audit</a></li>
              <li><a href="/sluzby/startup-kit/">Startup kit</a></li>
              <li><a href="/sluzby/priprava-na-prodej/">Příprava na prodej</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <p class="footer-col-h">Nástroje a čtení</p>
            <ul>
              <li><a href="/klientsky-portal/">Klientský portál</a></li>
              <li><a href="/kalkulacka/hpp-nebo-osvc/">Kalkulačka HPP, nebo OSVČ</a></li>
              <li><a href="/blog/">Blog</a></li>
              <li><a href="/12-chyb/">12 chyb (PDF zdarma)</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <p class="footer-col-h">Kontakt</p>
            <ul>
              <li><a href="/o-mne/">Josef Kliment</a></li>
              <li><a href="mailto:kliment.josef@email.cz">kliment.josef@email.cz</a></li>
              <li>Ostrava, celá ČR</li>
              <li><a href="/portal">Klientský portál &rarr;</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <p class="footer-copy">&copy; 2026 AkiNow &middot; Josef Kliment</p>
        <ul class="footer-links">
          <li><a href="https://instagram.com/kliments.cz" target="_blank" rel="noopener">Instagram</a></li>
          <li><a href="/obchodni-podminky/">Obchodní podmínky</a></li>
          <li hidden><button type="button" data-cookies>Nastavení cookies</button></li>
          <li><a href="/kontakt/">Kontakt</a></li>
        </ul>
      </div>
    </footer>`;
  }

  // Scroll reveal for subpages
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
})();
