/* ── Úvodní stránka: ukázka čísel, chat, formulář a pruh 12 chyb ── */

// ── Počítadla v ukázce živého přehledu (data-counter-target="48214") ──
(function initCounters() {
  const els = document.querySelectorAll('[data-counter-target]');
  if (!els.length || !('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  function animate(el) {
    const target = parseInt(el.dataset.counterTarget, 10);
    const suffix = el.dataset.counterSuffix || '';
    if (isNaN(target)) return;
    const duration = 1200;
    const start = performance.now();
    function step(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.floor(target * eased).toLocaleString('cs-CZ') + suffix;
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { animate(e.target); io.unobserve(e.target); } });
  }, { threshold: 0.5 });
  els.forEach((el) => io.observe(el));
})();

// ── Chat s AI asistentem ──
let chatOpen = false;
const chatHistory = [];

function toggleChat() {
  const panel = document.getElementById('chat-panel');
  const bubble = document.getElementById('chat-bubble');
  if (!panel || !bubble) return;
  chatOpen = !chatOpen;
  panel.style.display = chatOpen ? 'flex' : 'none';
  bubble.style.display = chatOpen ? 'none' : '';
  bubble.setAttribute('aria-expanded', String(chatOpen));
  if (chatOpen) document.getElementById('chat-input').focus();
  else bubble.focus();
}

async function sendChat() {
  const input = document.getElementById('chat-input');
  const msg = input.value.trim();
  if (!msg) return;
  input.value = '';
  addChatMsg(msg, 'user');
  chatHistory.push({ role: 'user', content: msg });
  const typing = addChatMsg('Přemýšlím...', 'typing');
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: chatHistory }),
    });
    const data = await res.json();
    typing.remove();
    if (data.reply) {
      addChatMsg(data.reply, 'bot');
      chatHistory.push({ role: 'assistant', content: data.reply });
    } else {
      addChatMsg('Omlouvám se, něco se pokazilo. Zkuste to prosím znovu.', 'bot');
    }
  } catch (e) {
    typing.remove();
    addChatMsg('Omlouvám se, nemohu se připojit. Zkuste to prosím později.', 'bot');
  }
}

function addChatMsg(text, type) {
  const msgs = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = 'chat-msg chat-' + type;
  div.textContent = text;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return div;
}

(function initChat() {
  const bubble = document.getElementById('chat-bubble');
  if (!bubble) return;
  bubble.addEventListener('click', toggleChat);
  document.getElementById('chat-close').addEventListener('click', toggleChat);
  document.getElementById('chat-send').addEventListener('click', sendChat);
  document.getElementById('chat-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') sendChat(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && chatOpen) toggleChat(); });
})();

// ── Kontaktní formulář (jméno, e-mail, zpráva; téma se doplní z odkazů s data-interest) ──
(function initLeadForm() {
  const form = document.getElementById('lead-form');
  if (!form) return;
  const statusEl = document.getElementById('lf-status');
  const submitBtn = document.getElementById('lf-submit');
  const topicEl = document.getElementById('lf-topic');
  const interestEl = document.getElementById('lf-interest');

  function setStatus(kind, text) {
    statusEl.className = 'lf-status' + (kind ? ' lf-status-' + kind : '');
    statusEl.textContent = text;
  }
  function setLoading(on) {
    submitBtn.disabled = on;
    submitBtn.classList.toggle('is-loading', on);
  }

  // odkazy s data-interest předvyplní téma zprávy
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('[data-interest]');
    if (!a || !interestEl) return;
    interestEl.value = a.dataset.interest;
    if (topicEl) { topicEl.textContent = 'Téma: ' + a.dataset.interest; topicEl.hidden = false; }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus('', '');
    const data = {
      name: form.elements.name.value.trim(),
      email: form.elements.email.value.trim(),
      phone: '',
      interest: interestEl ? interestEl.value : '',
      message: form.elements.message.value.trim(),
      website: form.elements.website.value, // honeypot
    };
    if (!data.name || !data.email) { setStatus('err', 'Vyplňte prosím jméno a e-mail.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) { setStatus('err', 'Zkontrolujte prosím tvar e-mailu.'); return; }
    setLoading(true);
    try {
      const r = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await r.json().catch(() => ({}));
      if (!r.ok || !json.ok) {
        setStatus('err', json.error || 'Omlouvám se, něco se pokazilo. Napište prosím přímo na kliment.josef@email.cz.');
      } else if (json.emailed === false) {
        setStatus('err', 'Zprávu se nepodařilo doručit. Napište mi prosím přímo na kliment.josef@email.cz, omlouvám se.');
      } else {
        setStatus('ok', 'Děkuji. Ozvu se vám do druhého dne.');
        if (window.kxTrack) window.kxTrack('generate_lead', { form: 'uvod', interest: data.interest || '' });
        form.reset();
        if (topicEl) topicEl.hidden = true;
      }
    } catch (err) {
      setStatus('err', 'Nepodařilo se odeslat zprávu. Napište prosím přímo na kliment.josef@email.cz.');
    } finally {
      setLoading(false);
    }
  });
})();

// ── Pruh 12 chyb: po zavření se už neukáže, schová se nad formulářem ──
(function initStickyLead() {
  const banner = document.getElementById('sticky-lead');
  if (!banner) return;
  const KEY = 'kx-12chyb-zavreno';
  let dismissed = false;
  try { dismissed = localStorage.getItem(KEY) === '1'; } catch (e) { dismissed = false; }
  if (dismissed) { banner.remove(); return; }

  let formInView = false;
  const contact = document.getElementById('contact');
  if (contact && 'IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      formInView = entries[0].isIntersecting;
      update();
    }, { threshold: 0 }).observe(contact);
  }

  function update() {
    const show = !dismissed && window.scrollY > 700 && !formInView && window.innerWidth >= 768;
    banner.classList.toggle('visible', show);
    document.body.classList.toggle('has-sticky', show);
  }
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);

  const close = banner.querySelector('.sticky-lead-close');
  if (close) close.addEventListener('click', () => {
    dismissed = true;
    try { localStorage.setItem(KEY, '1'); } catch (e) { /* bez úložiště platí zavření jen pro tuto návštěvu */ }
    update();
  });
})();
