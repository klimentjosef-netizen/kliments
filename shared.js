/* ── Shared nav + footer for subpages ── */

(function renderShared() {
  const root = document.documentElement.dataset.root || '/';

  // NAV
  const navEl = document.getElementById('shared-nav');
  if (navEl) {
    navEl.outerHTML = `
    <nav>
      <a class="nav-logo" href="${root}">Kliments<span class="nav-logo-dot">.</span></a>
      <button class="nav-burger" id="nav-burger" aria-label="Menu" onclick="document.querySelector('.nav-links').classList.toggle('open');this.classList.toggle('open')">
        <span></span><span></span><span></span>
      </button>
      <ul class="nav-links">
        <li><a href="${root}#services">Služby</a></li>
        <li><a href="${root}#projects">Projekty</a></li>
        <li><a href="/blog/">Blog</a></li>
        <li><a href="${root}#faq">FAQ</a></li>
        <li><a href="${root}#contact">Kontakt</a></li>
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
          <div class="footer-logo">Kliments<span class="footer-logo-dot">.</span></div>
          <p class="footer-tagline">Externí finanční ředitel a M&A poradce.<br>Ostrava, celá ČR.</p>
        </div>
        <div class="footer-cols">
          <div class="footer-col">
            <p class="footer-col-h">Služby</p>
            <ul>
              <li><a href="/sluzby/priprava-na-prodej/">Příprava na prodej</a></li>
              <li><a href="/sluzby/cfo-na-volne-noze/">CFO na volné noze</a></li>
              <li><a href="/sluzby/firemni-audit/">Firemní audit</a></li>
              <li><a href="/sluzby/startup-kit/">Startup kit</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <p class="footer-col-h">Vlastní projekty</p>
            <ul>
              <li><a href="https://www.firsen.cz/" target="_blank" rel="noopener">Firsen</a></li>
              <li><a href="https://mnai-nine.vercel.app/" target="_blank" rel="noopener">M&Ai</a></li>
              <li><a href="https://www.webbykliment.com/" target="_blank" rel="noopener">WebByKliment</a></li>
              <li><a href="https://www.darkee.cz/" target="_blank" rel="noopener">Dárkee</a></li>
              <li><a href="https://www.chlumeckydvur.cz/" target="_blank" rel="noopener">Chlumecký dvůr</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <p class="footer-col-h">Kontakt</p>
            <ul>
              <li>Josef Kliment</li>
              <li><a href="mailto:kliment.josef@email.cz">kliment.josef@email.cz</a></li>
              <li>Ostrava, celá ČR</li>
              <li><a href="/portal">Klientský portál &rarr;</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <p class="footer-copy">&copy; 2026 Kliments &middot; Josef Kliment</p>
        <ul class="footer-links">
          <li><a href="https://instagram.com/kliments.cz" target="_blank" rel="noopener">Instagram</a></li>
          <li><a href="#" target="_blank" rel="noopener" aria-label="LinkedIn (brzy)">LinkedIn</a></li>
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
