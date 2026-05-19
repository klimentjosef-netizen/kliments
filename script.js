// ── Custom cursor ──
const cur = document.getElementById('cur');
const curR = document.getElementById('cur-r');
let mx = 0, my = 0, rx = 0, ry = 0;

document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  cur.style.left = mx + 'px';
  cur.style.top = my + 'px';
});

(function loop() {
  rx += (mx - rx) * 0.1;
  ry += (my - ry) * 0.1;
  curR.style.left = rx + 'px';
  curR.style.top = ry + 'px';
  requestAnimationFrame(loop);
})();

document.querySelectorAll('a, button, .prod-card, .mini-card, .profile-card, .p-skill, .hero-card').forEach(el => {
  el.addEventListener('mouseenter', () => {
    cur.style.width = '20px'; cur.style.height = '20px';
    curR.style.width = '60px'; curR.style.height = '60px';
  });
  el.addEventListener('mouseleave', () => {
    cur.style.width = '12px'; cur.style.height = '12px';
    curR.style.width = '40px'; curR.style.height = '40px';
  });
});

// ── Scroll reveal ──
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// ── Animated counters (data-counter-target="565800") ──
function animateCounter(el) {
  const target = parseInt(el.dataset.counterTarget, 10);
  const suffix = el.dataset.counterSuffix || '';
  if (isNaN(target)) return;
  const duration = 1400; // ms
  const start = performance.now();
  function step(now) {
    const t = Math.min(1, (now - start) / duration);
    // ease-out cubic
    const eased = 1 - Math.pow(1 - t, 3);
    const val = Math.floor(target * eased);
    el.textContent = val.toLocaleString('cs-CZ') + suffix;
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

const counterIo = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      animateCounter(e.target);
      counterIo.unobserve(e.target);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('[data-counter-target]').forEach(el => counterIo.observe(el));


// ── Chat widget ──
let chatOpen = false;
let chatHistory = [];

function toggleChat() {
  chatOpen = !chatOpen;
  document.getElementById('chat-panel').style.display = chatOpen ? 'flex' : 'none';
  document.getElementById('chat-bubble').style.display = chatOpen ? 'none' : 'flex';
  if (chatOpen) document.getElementById('chat-input').focus();
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

// ── Projects grid + lightbox ──
const PROJ_DATA = [
  {
    id: 1, title: 'M&Ai', role: 'Zakladatel',
    badge: 'M&A PORADENSTVÍ', url: 'mnai-nine.vercel.app',
    link: 'https://mnai-nine.vercel.app',
    desc: 'M&A poradenství s pomocí moderních technologií. Nákup, prodej a oceňování firem od startupů po velké korporace. Ocenění firem v rozsahu 20M až 2 miliard Kč.',
    metrics: [['20M až 2Mrd','Rozsah ocenění'],['60+','Klientů'],['12+','Let praxe'],['DCF','Hlavní metoda']],
    bars: [40,55,70,85,95,100],
    tags: ['Valuace','M&A','AI technologie'],
    chips: ['60+ klientů','2Mrd max','AI'],
  },
  {
    id: 2, title: 'Firsen', role: 'Zakladatel',
    badge: 'ÚČETNICTVÍ & FINANCE', url: 'firsen.cz',
    link: 'https://www.firsen.cz',
    desc: 'Komplexní účetní a finanční služby pro firmy všech velikostí. Vedení účetnictví, daňové poradenství a finanční řízení pod jednou střechou.',
    metrics: [['60+','Aktivních klientů'],['100 %','Online agenda'],['12+','Let praxe'],['CZ','Celá republika']],
    bars: [30,45,55,65,80,90],
    tags: ['Účetnictví','Daně','Finanční řízení'],
    chips: ['60+ klientů','Online','CZ'],
  },
  {
    id: 3, title: 'WebByKliment', role: 'Zakladatel',
    badge: 'WEB DEVELOPMENT', url: 'webbykliment.com',
    link: 'https://www.webbykliment.com',
    desc: 'Tvorba webů, micrositů, kalkulaček a webových aplikací na míru. Desítky realizovaných projektů pro firmy z ČR i zahraničí.',
    metrics: [['30+','Projektů'],['React','Technologie'],['Next.js','Framework'],['Vercel','Deployment']],
    bars: [20,35,50,70,85,100],
    tags: ['Weby na míru','React','Kalkulačky'],
    chips: ['30+ projektů','Next.js','React'],
  },
  {
    id: 4, title: 'Dárkee', role: 'Zakladatel',
    badge: 'AI STARTUP', url: 'darkee.cz',
    link: 'https://www.darkee.cz',
    desc: 'AI dárkový asistent. 8 otázek, 60 sekund, 5 personalizovaných tipů na dárek. Startup využívající generativní AI pro každodenní rozhodování.',
    metrics: [['8','Otázek'],['60s','Do výsledku'],['5','Tipů'],['AI','Powered']],
    bars: [10,30,55,70,80,95],
    tags: ['AI','Startup','Generativní AI'],
    chips: ['AI','60 sekund','Startup'],
  },
  {
    id: 5, title: 'Kliments', role: 'Zakladatel',
    badge: 'FINANČNÍ ŘÍZENÍ', url: 'kliments.cz',
    link: 'https://www.kliments.cz',
    desc: 'Externí finanční ředitel pro české firmy. CFO na volné noze, valuace, firemní audit, startup kit. Zlepšuji fungování firem od první faktury po případný prodej.',
    metrics: [['4','Hlavní služby'],['14 900 Kč','Vstupní cena'],['CZ','Celá republika'],['Online','i osobně']],
    bars: [50,60,70,80,90,100],
    tags: ['CFO','Valuace','Mentoring'],
    chips: ['CFO','Valuace','M&A'],
  },
  {
    id: 6, title: 'Chlumecký dvůr', role: 'Spolumajitel',
    badge: 'UBYTOVÁNÍ & SPORT', url: 'chlumeckydvur.cz',
    link: 'https://www.chlumeckydvur.cz',
    desc: 'Zemědělská usedlost s ubytováním a sportem na Vysočině. Aktivní správa marketingu a online rezervací penzionu.',
    metrics: [['Vysočina','Lokalita'],['Sport','Aktivity'],['Penzion','Ubytování'],['Online','Rezervace']],
    bars: [40,50,65,75,85,80],
    tags: ['Ubytování','Sport','Vysočina'],
    chips: ['Vysočina','Sport','Penzion'],
  },
];

(function initProjects() {
  const grid = document.getElementById('proj-grid');
  if (!grid) return;
  grid.innerHTML = PROJ_DATA.map(p => `
    <div class="proj-card reveal" onclick="openProjLb(${p.id})">
      <div class="proj-preview">
        <div class="proj-preview-bar"></div>
        <div class="proj-preview-title">${p.title}</div>
        <div class="proj-preview-role">${p.role}</div>
        <div class="proj-preview-chips">
          ${p.chips.map(c=>`<span class="proj-chip">${c}</span>`).join('')}
        </div>
        <div class="proj-mini-chart">
          ${miniProjBars(p.bars)}
        </div>
      </div>
      <div class="proj-card-body">
        <div class="proj-card-name">${p.title}</div>
        <div class="proj-card-sub">${p.role}</div>
        <div class="proj-card-tags">
          ${p.tags.map(t=>`<span class="proj-tag">${t}</span>`).join('')}
        </div>
        <button class="proj-btn" onclick="event.stopPropagation();openProjLb(${p.id})">Zobrazit projekt →</button>
      </div>
    </div>
  `).join('');
  document.querySelectorAll('#proj-grid .reveal').forEach(el => io.observe(el));
})();

function miniProjBars(bars) {
  const max = Math.max(...bars.map(Math.abs));
  return bars.map(v => {
    const h = Math.round(Math.abs(v) / max * 100);
    const col = v >= 0 ? '#c97b84' : '#e8c5c9';
    return `<div class="proj-mini-bar" style="height:${h}%;background:${col}"></div>`;
  }).join('');
}

function openProjLb(id) {
  const p = PROJ_DATA.find(x => x.id === id);
  document.getElementById('proj-lb-title').textContent = p.title;
  document.getElementById('proj-lb-role').textContent = p.role + ' · ' + p.url;
  document.getElementById('proj-lb-badge').textContent = p.badge;
  document.getElementById('proj-lb-main-title').textContent = p.title;
  document.getElementById('proj-lb-desc').textContent = p.desc;
  document.getElementById('proj-lb-metrics').innerHTML = p.metrics.map(([v,l]) => `
    <div class="proj-lb-metric">
      <div class="proj-lb-metric-val">${v}</div>
      <div class="proj-lb-metric-lbl">${l}</div>
    </div>
  `).join('');
  const max = Math.max(...p.bars.map(Math.abs));
  document.getElementById('proj-lb-chart').innerHTML = p.bars.map(v => {
    const h = Math.round(Math.abs(v) / max * 100);
    const col = v >= 0 ? '#c97b84' : '#e8c5c9';
    return `<div class="proj-lb-bar" style="height:${h}%;background:${col}"></div>`;
  }).join('');
  document.getElementById('proj-lb-url').textContent = p.url;
  document.getElementById('proj-lb-btn').href = p.link;
  document.getElementById('proj-lb').classList.add('open');
}

function closeProjLb() {
  document.getElementById('proj-lb').classList.remove('open');
}

/* ── LEAD FORM ── */
(function initLeadForm() {
  const form = document.getElementById('lead-form');
  if (!form) return;

  const statusEl = document.getElementById('lf-status');
  const submitBtn = document.getElementById('lf-submit');

  function setStatus(kind, text) {
    if (!statusEl) return;
    statusEl.className = 'lf-status lf-status-' + kind;
    statusEl.textContent = text;
  }

  function setLoading(on) {
    if (!submitBtn) return;
    submitBtn.disabled = on;
    submitBtn.classList.toggle('is-loading', on);
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    setStatus('', '');

    const data = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim(),
      interest: form.interest.value,
      message: form.message.value.trim(),
      website: form.website.value, // honeypot
    };

    if (!data.name || !data.email) {
      setStatus('err', 'Vyplňte prosím jméno a e-mail.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      setStatus('err', 'Zkontrolujte prosím tvar e-mailu.');
      return;
    }

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
      } else {
        setStatus('ok', 'Děkuji. Ozvu se vám do 24 hodin.');
        form.reset();
      }
    } catch (err) {
      setStatus('err', 'Nepodařilo se odeslat zprávu. Napište prosím přímo na kliment.josef@email.cz.');
    } finally {
      setLoading(false);
    }
  });
})();

/* ── Social proof testimonial rotation ── */
(function initProofRotation() {
  const testimonials = document.querySelectorAll('.proof-testimonial');
  const dots = document.querySelectorAll('.proof-dot');
  if (testimonials.length === 0) return;

  let current = 0;
  let timer;

  function show(idx) {
    testimonials.forEach(t => t.classList.remove('active'));
    dots.forEach(d => d.classList.remove('active'));
    testimonials[idx].classList.add('active');
    dots[idx].classList.add('active');
    current = idx;
  }

  function next() {
    show((current + 1) % testimonials.length);
  }

  function startTimer() {
    clearInterval(timer);
    timer = setInterval(next, 5000);
  }

  dots.forEach(d => {
    d.addEventListener('click', () => {
      show(parseInt(d.dataset.proof));
      startTimer();
    });
  });

  startTimer();
})();

/* ── Sticky lead magnet banner ── */
(function initStickyLead() {
  const banner = document.getElementById('sticky-lead');
  if (!banner) return;

  let dismissed = false;

  window.addEventListener('scroll', function() {
    if (dismissed) return;
    if (window.scrollY > 600) {
      banner.classList.add('visible');
    } else {
      banner.classList.remove('visible');
    }
  });

  window.dismissStickyLead = function() {
    dismissed = true;
    banner.classList.remove('visible');
  };
})();