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

// ── Pricing calculator ──
const CALC_SERVICES = [
  { id:'rozjed', name:'Rozjeď to správně', desc:'Finanční plán, cashflow, rozpočet', price:24900, monthly:false,
    details: [
      'Sestavení finančního plánu na míru',
      'Nastavení cashflow sledování',
      'Rozpočet a jeho hlídání',
      'OSVČ vs. s.r.o., kdy a jak přejít',
      'Příprava pro první investory'
    ]},
  { id:'cfo', name:'CFO na volné noze', desc:'Měsíční finanční řízení a reporting', price:15000, monthly:true,
    details: [
      'Měsíční finanční reporting',
      'Cashflow management a plánování',
      'Identifikace úspor a rizik',
      'Podpora při jednání s bankami',
      'Strategické finanční plánování'
    ]},
  { id:'prodej', name:'Prodej za maximum', desc:'Valuace DCF, M&A poradenství', price:59900, monthly:false,
    details: [
      'Ocenění metodami DCF a srovnávací analýzy',
      'Analýza co hodnotu snižuje a zvyšuje',
      'M&A poradenství při prodeji',
      'Písemná zpráva + konzultace výsledků'
    ]},
  { id:'audit', name:'Firemní finanční audit', desc:'Jednorázová analýza zdraví firmy', price:9900, monthly:false,
    details: [
      'Kompletní analýza finančního zdraví',
      'Kde firma ztrácí a kde vydělává',
      'Konkrétní akční plán pro zlepšení',
      'Porovnání s oborovým průměrem'
    ]},
  { id:'kit', name:'Startup finanční kit', desc:'Rychlé nastavení financí', price:14900, monthly:false,
    details: [
      'Jednorázové nastavení financí',
      'Finanční plán pro první rok',
      'Šablona cashflow tabulky',
      'Doporučení účetního systému'
    ]},
  { id:'investor', name:'Příprava na investora', desc:'Finanční podklady pro fundraising', price:24900, monthly:false,
    details: [
      'Finanční model a projekce',
      'Unit economics a KPI metriky',
      'Pitch deck podklady (čísla)',
      'Reálné projekce, ne wishful thinking'
    ]},
];
const CALC_PRESETS = {
  start: ['rozjed','kit'],
  running: ['cfo','audit'],
  sell: ['prodej','investor'],
};
let calcSelected = new Set();
let calcMultiplier = 1;

function selectSituation(s) {
  document.querySelectorAll('.calc-sit-btn').forEach(b => b.classList.remove('selected'));
  document.getElementById('sit-' + s).classList.add('selected');
  calcSelected = new Set(CALC_PRESETS[s]);
  const btn = document.getElementById('btn1');
  btn.style.opacity = '1';
  btn.style.pointerEvents = 'auto';
}

function renderCalcServices() {
  const list = document.getElementById('calc-services-list');
  list.innerHTML = '';
  CALC_SERVICES.forEach(svc => {
    const checked = calcSelected.has(svc.id);
    const wrap = document.createElement('div');
    wrap.className = 'calc-svc-wrap';

    const row = document.createElement('div');
    row.className = 'calc-svc-row' + (checked ? ' checked' : '');
    row.innerHTML = `
      <div class="calc-svc-check"><span class="calc-svc-checkmark">✓</span></div>
      <div class="calc-svc-info">
        <div class="calc-svc-name">${svc.name}${svc.monthly ? '<span class="calc-monthly-tag">měsíční</span>' : ''}</div>
        <div class="calc-svc-desc">${svc.desc}</div>
      </div>
      <div class="calc-svc-price">od ${svc.price.toLocaleString('cs-CZ')} Kč</div>
      <button class="calc-info-btn" title="Co se řeší">i</button>`;

    row.querySelector('.calc-svc-check').onclick = (e) => {
      e.stopPropagation();
      if (calcSelected.has(svc.id)) calcSelected.delete(svc.id);
      else calcSelected.add(svc.id);
      renderCalcServices();
    };
    row.querySelector('.calc-svc-info').onclick = (e) => {
      e.stopPropagation();
      if (calcSelected.has(svc.id)) calcSelected.delete(svc.id);
      else calcSelected.add(svc.id);
      renderCalcServices();
    };
    row.querySelector('.calc-svc-price').onclick = (e) => {
      e.stopPropagation();
      if (calcSelected.has(svc.id)) calcSelected.delete(svc.id);
      else calcSelected.add(svc.id);
      renderCalcServices();
    };

    const infoBtn = row.querySelector('.calc-info-btn');
    const detail = document.createElement('div');
    detail.className = 'calc-svc-detail';
    detail.innerHTML = '<ul>' + svc.details.map(d => '<li>' + d + '</li>').join('') + '</ul>';

    infoBtn.onclick = (e) => {
      e.stopPropagation();
      detail.classList.toggle('open');
      infoBtn.classList.toggle('open');
    };

    wrap.appendChild(row);
    wrap.appendChild(detail);
    list.appendChild(wrap);
  });
}

function selectSize(mult, el) {
  document.querySelectorAll('.calc-size-btn').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
  calcMultiplier = mult;
  const btn = document.getElementById('btn3');
  btn.style.opacity = '1';
  btn.style.pointerEvents = 'auto';
}

function renderCalcResult() {
  const chosen = CALC_SERVICES.filter(s => calcSelected.has(s.id));
  const result = document.getElementById('calc-result');

  if (chosen.length === 0) {
    result.innerHTML = '<p style="color:var(--mid);font-size:0.88rem">Vyberte prosím alespoň jednu službu.</p>';
    return;
  }

  if (calcMultiplier === 0) {
    result.innerHTML = `
      <div style="text-align:center;padding:1rem">
        <p style="font-family:Lora,Georgia,serif;font-size:1.4rem;font-weight:300;color:var(--ink);margin-bottom:8px">Individuální kalkulace</p>
        <p style="font-size:0.85rem;color:var(--mid)">Pro firmy nad 50 zaměstnanců připravím nabídku na míru po úvodní konzultaci.</p>
      </div>`;
    return;
  }

  const discount = chosen.length >= 3 ? 0.15 : chosen.length >= 2 ? 0.10 : 0;
  const oneTime = chosen.filter(s => !s.monthly);
  const monthly = chosen.filter(s => s.monthly);

  let html = '';
  chosen.forEach(s => {
    const price = Math.round(s.price * calcMultiplier * (1 - discount));
    html += `<div class="calc-result-row">
      <span class="calc-result-label">${s.name}</span>
      <span class="calc-result-val">od ${price.toLocaleString('cs-CZ')} Kč${s.monthly ? '/měs' : ''}</span>
    </div>`;
  });

  if (discount > 0) {
    const saved = Math.round(chosen.reduce((a, s) => a + s.price * calcMultiplier, 0) * discount);
    html += `<div class="calc-result-row calc-discount">
      <span>Sleva za kombinaci (${Math.round(discount*100)}%)</span>
      <span>-${saved.toLocaleString('cs-CZ')} Kč</span>
    </div>`;
  }

  const oneTimeTotal = Math.round(oneTime.reduce((a, s) => a + s.price * calcMultiplier, 0) * (1 - discount));
  const monthlyTotal = Math.round(monthly.reduce((a, s) => a + s.price * calcMultiplier, 0) * (1 - discount));

  const totalStr = oneTimeTotal > 0 && monthlyTotal > 0
    ? `od ${oneTimeTotal.toLocaleString('cs-CZ')} Kč + ${monthlyTotal.toLocaleString('cs-CZ')} Kč/měs`
    : monthlyTotal > 0
    ? `od ${monthlyTotal.toLocaleString('cs-CZ')} Kč/měs`
    : `od ${oneTimeTotal.toLocaleString('cs-CZ')} Kč`;

  html += `<div class="calc-result-total">
    <span class="calc-result-total-label">Celkem odhadem</span>
    <span class="calc-result-total-num">${totalStr}</span>
  </div>`;

  result.innerHTML = html;
}

function calcGoStep(n) {
  document.querySelectorAll('.calc-step').forEach((s, i) => s.classList.toggle('active', i === n - 1));
  document.querySelectorAll('.calc-dot').forEach((d, i) => d.classList.toggle('active', i < n));
  if (n === 2) renderCalcServices();
  if (n === 4) renderCalcResult();
}

function openCalcModal() {
  document.getElementById('calc-modal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
  calcGoStep(1);
}
function closeCalcModal() {
  document.getElementById('calc-modal').style.display = 'none';
  document.body.style.overflow = '';
}

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
    metrics: [['20M–2Mrd','Rozsah ocenění'],['60+','Klientů'],['12+','Let praxe'],['DCF','Hlavní metoda']],
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
    badge: 'FINANČNÍ PORADENSTVÍ', url: 'kliments.cz',
    link: 'https://www.kliments.cz',
    desc: 'Byznys architektura a finanční řízení pro firmy a zakladatele. Od první faktury po prodej firmy. CFO na volné noze, valuace, M&A a mentoring.',
    metrics: [['6','Služeb'],['4 900 Kč','Vstupní cena'],['CZ','Celá republika'],['Online','i osobně']],
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