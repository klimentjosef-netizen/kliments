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