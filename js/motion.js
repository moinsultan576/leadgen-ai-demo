/* LeadGen AI — premium motion layer (GSAP). Tune all durations/eases in M.cfg. */
(function () {
  const g = window.gsap;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const M = {
    on: !!g && !reduce,
    cfg: {
      pillLead: 0.36, pillLeadEase: 'power3.out', pillTrail: 0.55, pillTrailEase: 'power3.inOut',
      pageIn: 0.5, pageEase: 'power3.out', stagger: 0.06, cardY: 26,
      count: 1.1, countEase: 'power2.out', chart: 0.9, chartEase: 'power3.out',
      drop: 0.7, dropEase: 'elastic.out(1, 0.45)', magnet: 0.35, magnetPull: 0.28,
      lampOn: 0.7, revealBlur: 10,
    },
  };

  /* ---------- liquid sidebar pill ---------- */
  let lastPill = null;
  M.pill = function () {
    const nav = document.querySelector('.side nav'); if (!nav) return;
    const target = nav.querySelector(':scope > a.on, :scope > .navg.on'); let pill = nav.querySelector('.pill-liquid');
    if (!pill) { pill = document.createElement('span'); pill.className = 'pill-liquid'; pill.setAttribute('aria-hidden', 'true'); nav.prepend(pill); }
    if (!target) { pill.style.opacity = 0; return; }
    const nr = nav.getBoundingClientRect(), tr = target.getBoundingClientRect();
    const to = { top: tr.top - nr.top + nav.scrollTop, bottom: tr.bottom - nr.top + nav.scrollTop, left: tr.left - nr.left, width: tr.width };
    pill.style.left = to.left + 'px'; pill.style.width = to.width + 'px'; pill.style.opacity = 1;
    const set = (t, b) => { pill.style.top = t + 'px'; pill.style.height = Math.max(4, b - t) + 'px'; };
    if (!M.on || !lastPill || Math.abs(lastPill.top - to.top) < 1) { set(to.top, to.bottom); lastPill = to; return; }
    const st = { t: lastPill.top, b: lastPill.bottom }, down = to.top > lastPill.top; lastPill = to;
    set(st.t, st.b);
    // leading edge moves first, trailing edge catches up → stretch then settle
    g.to(st, { [down ? 'b' : 't']: down ? to.bottom : to.top, duration: M.cfg.pillLead, ease: M.cfg.pillLeadEase, onUpdate: () => set(st.t, st.b) });
    g.to(st, { [down ? 't' : 'b']: down ? to.top : to.bottom, duration: M.cfg.pillTrail, ease: M.cfg.pillTrailEase, onUpdate: () => set(st.t, st.b) });
  };

  /* ---------- page enter: stagger, counters, charts ---------- */
  function countUp(el) {
    const src = el.textContent; const m = src.match(/\d[\d,]*(\.\d+)?/); if (!m) return;
    const end = parseFloat(m[0].replace(/,/g, '')), dec = (m[1] || '').length - (m[1] ? 1 : 0), fmt = new Intl.NumberFormat('en-US', { minimumFractionDigits: Math.max(0, dec), maximumFractionDigits: Math.max(0, dec) });
    const o = { v: 0 }; const pre = src.slice(0, m.index), post = src.slice(m.index + m[0].length);
    el.textContent = pre + fmt.format(0) + post;
    g.to(o, { v: end, duration: M.cfg.count, ease: M.cfg.countEase, onUpdate: () => { el.textContent = pre + fmt.format(dec ? o.v : Math.round(o.v)) + post; }, onComplete: () => { el.textContent = src; } });
  }
  function drawCharts(root) {
    root.querySelectorAll('.chart path[stroke]:not([fill="url(#ml0)"])').forEach(p => { if (!p.getTotalLength) return; const L = p.getTotalLength(); if (!L) return; g.fromTo(p, { strokeDasharray: L, strokeDashoffset: L }, { strokeDashoffset: 0, duration: M.cfg.chart * 1.4, ease: 'power2.inOut', onComplete: () => p.style.strokeDasharray = 'none' }); });
    root.querySelectorAll('.chart path[fill^="url"]').forEach(p => g.from(p, { opacity: 0, duration: M.cfg.chart, delay: .4 }));
    root.querySelectorAll('.chart rect').forEach((r, i) => g.from(r, { scaleY: 0, transformOrigin: '50% 100%', duration: M.cfg.chart, ease: M.cfg.chartEase, delay: i * 0.03 }));
    root.querySelectorAll('.chart.donut circle[stroke-dasharray]').forEach((c, i) => { const d = c.getAttribute('stroke-dasharray'); g.fromTo(c, { attr: { 'stroke-dasharray': '0 999' } }, { attr: { 'stroke-dasharray': d }, duration: M.cfg.chart, ease: M.cfg.chartEase, delay: 0.1 + i * 0.08 }); });
    root.querySelectorAll('.fshape').forEach((f, i) => g.from(f, { scaleX: 0, duration: M.cfg.chart, ease: M.cfg.chartEase, delay: 0.1 + i * 0.08 }));
    root.querySelectorAll('.hb i, .pbar i').forEach((b, i) => g.from(b, { width: 0, duration: M.cfg.chart, ease: M.cfg.chartEase, delay: 0.1 + i * 0.05 }));
    root.querySelectorAll('.chart circle:not([stroke-dasharray])').forEach(c => g.from(c, { scale: 0, transformOrigin: 'center', transformBox: 'fill-box', duration: .4, delay: M.cfg.chart, ease: 'back.out(2)' }));
  }
  M.pageIn = function (root) {
    if (!M.on || !root) return;
    const blocks = root.querySelectorAll(':scope > .phead, :scope > .kpis > *, :scope > .card, :scope > .grid2 > *, :scope > .grid3 > *, :scope > .cgrid > *, :scope > .apdays > *, :scope > .kanban > .kcol, :scope > .tabs, :scope > .hint');
    g.from(blocks, { y: M.cfg.cardY, opacity: 0, duration: M.cfg.pageIn, ease: M.cfg.pageEase, stagger: M.cfg.stagger, clearProps: 'transform,opacity' });
    root.querySelectorAll('.kpi b').forEach(countUp);
    root.querySelectorAll('.kanban .kcard').forEach((c, i) => g.from(c, { y: 14, opacity: 0, duration: .45, delay: .25 + (i % 6) * 0.05, ease: 'power2.out', clearProps: 'transform,opacity' }));
    drawCharts(root);
  };
  M.swap = function (el) { if (M.on && el) g.from(el, { opacity: 0, y: 10, duration: .35, ease: 'power2.out', clearProps: 'all' }); };
  M.drop = function (card) { if (!M.on || !card) return; g.fromTo(card, { scale: 0.86, rotate: -2 }, { scale: 1, rotate: 0, duration: M.cfg.drop, ease: M.cfg.dropEase, clearProps: 'transform' }); g.fromTo(card, { boxShadow: '0 0 0 2px rgba(168,85,247,.9), 0 0 40px rgba(168,85,247,.6)' }, { boxShadow: '0 0 0 0 rgba(168,85,247,0), 0 8px 30px rgba(0,0,0,.35)', duration: 1.2, clearProps: 'boxShadow' }); };
  M.drawer = function (panel) { if (M.on && panel) g.from(panel.children, { x: document.dir === 'rtl' ? -24 : 24, opacity: 0, duration: .45, stagger: .05, ease: 'power3.out', clearProps: 'all' }); };

  /* ---------- landing: split text, reveal on scroll ---------- */
  M.split = function (el) {
    if (!el || el.dataset.split) return; el.dataset.split = 1;
    const walk = n => { if (n.nodeType === 3) { const frag = document.createDocumentFragment(); n.textContent.split(/(\s+)/).forEach(w => { if (!w) return; if (/^\s+$/.test(w)) frag.appendChild(document.createTextNode(w)); else { const s = document.createElement('span'); s.className = 'w'; s.innerHTML = '<span></span>'; s.firstChild.textContent = w; frag.appendChild(s); } }); n.replaceWith(frag); } else if (n.nodeType === 1 && n.tagName !== 'BR') Array.from(n.childNodes).forEach(walk); };
    Array.from(el.childNodes).forEach(walk);
  };
  M.heroIn = function () {
    const h = document.querySelector('.hero h1'); if (!h) return;
    if (!M.on) return;
    M.split(h);
    const tl = g.timeline();
    tl.from('.hero .badge', { y: 16, opacity: 0, duration: .5, ease: 'power3.out' })
      .from('.hero h1 .w > span', { yPercent: 110, duration: .8, ease: 'power4.out', stagger: .06 }, '-=.2')
      .from('.hero .lead, .hero .hctas > *, .hero .hchecks li', { y: 18, opacity: 0, duration: .6, ease: 'power3.out', stagger: .07, clearProps: 'all' }, '-=.45')
      .from('.hero-vis .hlead, .hero-vis .ficon, .hero-vis .hstat', { scale: .6, opacity: 0, duration: .7, ease: 'back.out(1.7)', stagger: .08, clearProps: 'transform,opacity' }, '-=.6');
  };
  let io;
  M.reveal = function () {
    if (!M.on || !('IntersectionObserver' in window)) return;
    if (io) io.disconnect();
    io = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; io.unobserve(e.target); const kids = e.target.querySelectorAll(':scope > *'); g.from(kids.length && e.target.dataset.rv === 'kids' ? kids : e.target, { y: 40, opacity: 0, duration: .8, ease: 'power3.out', stagger: .08, clearProps: 'transform,opacity' }); }), { rootMargin: '0px 0px -12% 0px' });
    document.querySelectorAll('.stats, .sec-h, .fgrid, .revenue, .steps4, .tour, .plans, .contact').forEach(el => { if (['fgrid', 'steps4', 'plans', 'tour', 'stats'].some(c => el.classList.contains(c))) el.dataset.rv = 'kids'; io.observe(el); });
  };

  /* ---------- preloader ---------- */
  M.preload = function (ready) {
    const el = document.getElementById('preloader'); if (!el) return Promise.resolve();
    if (!M.on || sessionStorage.getItem('lg_pre')) { el.remove(); return Promise.resolve(); }
    sessionStorage.setItem('lg_pre', 1);
    const num = el.querySelector('b'), ring = el.querySelector('circle.fg'), C = 2 * Math.PI * 52;
    ring.style.strokeDasharray = C; const o = { p: 0 }; let target = 0;
    const draw = () => { num.textContent = Math.round(o.p); ring.style.strokeDashoffset = C * (1 - o.p / 100); };
    const step = v => { target = Math.max(target, v); g.to(o, { p: target, duration: .45, ease: 'power1.out', overwrite: true, onUpdate: draw }); };
    step(18);
    const tick = setInterval(() => step(Math.min(target + 7, 88)), 160);
    return Promise.all([ready, document.fonts ? document.fonts.ready : null, new Promise(r => setTimeout(r, 1100))]).then(() => new Promise(res => {
      clearInterval(tick);
      g.to(o, { p: 100, duration: .4, ease: 'power2.out', onUpdate: draw, onComplete: () => g.to(el, { opacity: 0, scale: 1.08, duration: .6, ease: 'power3.inOut', onComplete: () => { el.remove(); res(); } }) });
    }));
  };

  /* ---------- cursor + magnetic buttons (desktop only) ---------- */
  let cur, ring, cx = 0, cy = 0, rx = 0, ry = 0, raf;
  M.cursor = function (enable) {
    if (!fine || reduce) return;
    if (!enable) { if (cur) { cur.remove(); ring.remove(); cur = ring = null; cancelAnimationFrame(raf); document.documentElement.classList.remove('has-cursor'); } return; }
    if (cur) return;
    cur = document.createElement('div'); cur.className = 'cur-dot'; ring = document.createElement('div'); ring.className = 'cur-ring';
    document.body.append(cur, ring); document.documentElement.classList.add('has-cursor');
    const loop = () => { rx += (cx - rx) * 0.18; ry += (cy - ry) * 0.18; cur.style.transform = `translate(${cx}px,${cy}px)`; ring.style.transform = `translate(${rx}px,${ry}px)`; raf = requestAnimationFrame(loop); }; loop();
  };
  document.addEventListener('pointermove', e => {
    cx = e.clientX; cy = e.clientY;
    if (ring) ring.classList.toggle('big', !!e.target.closest('a,button,[data-act],input,select,textarea,.kcard'));
    if (!M.on || !fine) return;
    const m = e.target.closest('.magnetic');
    document.querySelectorAll('.magnetic.pulled').forEach(b => { if (b !== m) { b.classList.remove('pulled'); g.to(b, { x: 0, y: 0, duration: M.cfg.magnet, ease: 'elastic.out(1,.4)' }); } });
    if (m) { const r = m.getBoundingClientRect(); m.classList.add('pulled'); g.to(m, { x: (e.clientX - r.left - r.width / 2) * M.cfg.magnetPull, y: (e.clientY - r.top - r.height / 2) * M.cfg.magnetPull, duration: M.cfg.magnet, ease: 'power3.out' }); }
  }, { passive: true });

  /* ---------- lamp ---------- */
  M.lampOn = function (scene, on) {
    if (!scene) return; scene.classList.toggle('lit', on);
    if (!M.on) return;
    const card = scene.querySelector('.lamp-card');
    if (on) { g.fromTo(scene.querySelector('.beam'), { opacity: 0, scaleY: .6 }, { opacity: 1, scaleY: 1, duration: M.cfg.lampOn, ease: 'power2.out', transformOrigin: '50% 0%' }); g.fromTo(card, { opacity: 0, y: 30, filter: `blur(${M.cfg.revealBlur}px)` }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: .8, delay: .15, ease: 'power3.out' }); }
    else { g.to(card, { opacity: 0, y: 20, filter: `blur(${M.cfg.revealBlur}px)`, duration: .4 }); }
  };
  M.cordSpring = function (handle) { if (M.on) g.fromTo(handle, { y: 60 }, { y: 0, duration: 1.1, ease: 'elastic.out(1, 0.3)' }); };
  let actx;
  M.hum = function (enabled) {
    if (!enabled) return;
    try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); const o = actx.createOscillator(), gn = actx.createGain(); o.type = 'sine'; o.frequency.value = 120; gn.gain.value = 0; o.connect(gn).connect(actx.destination); o.start(); gn.gain.linearRampToValueAtTime(0.05, actx.currentTime + 0.15); gn.gain.linearRampToValueAtTime(0, actx.currentTime + 0.9); o.stop(actx.currentTime + 1); } catch (e) {}
  };
  window.M = M;
})();
