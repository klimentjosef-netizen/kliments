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
  { id:'prohlidka', name:'Finanční diagnóza', desc:'Vstupní, 90 min, ústní zpětná vazba', price:4900, monthly:false,
    details: [
      'Analýza cashflow a výsledovky',
      'Identifikace největších rizik',
      'Konkrétní akční plán',
      '90minutová konzultace výsledků'
    ]},
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
  { id:'investor', name:'Příprava na investora', desc:'Finanční podklady pro fundraising', price:24900, monthly:false,
    details: [
      'Finanční model a projekce',
      'Unit economics a KPI metriky',
      'Pitch deck podklady (čísla)',
      'Reálné projekce, ne wishful thinking'
    ]},
  { id:'mentoring', name:'Mentoring pro zakladatele', desc:'Balíček 3 hodin 1 na 1', price:9900, monthly:false,
    details: [
      '3 hodiny individuálních konzultací',
      'Finanční i byznysové poradenství',
      'Flexibilní rozložení v čase',
      'Pro zakladatele co chtějí poradit'
    ]},
];
const CALC_PRESETS = {
  start: ['prohlidka','rozjed'],
  running: ['cfo','prohlidka'],
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