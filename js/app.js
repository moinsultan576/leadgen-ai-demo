/* LeadGen AI demo — landing + AI lead capture, lead dashboard, pipeline, outreach and AI tools */
(function () {
  'use strict';
  const KEY = 'leadgen_demo_v1', UKEY = 'leadgen_user', PKEY = 'leadgen_prefs';
  const FORM_URL = 'https://formsubmit.co/ajax/moinseoagency@gmail.com', WA_AGENCY = '966546904384';
  const t = (k, v) => I18N.t(k, v), $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const H = 3600000, DAY = 86400000;
  const { STAGES, SOURCES, INDUSTRIES, CITIES, CHANNELS, NEEDS, COMPANIES } = SEED;

  /* ---------- state ---------- */
  function ls(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  let D = ls(KEY, null);
  if (!D || D.v !== 1 || Date.now() - D.seededAt > 12 * H) { D = SEED.seed(); lsSet(KEY, D); }
  let USER = ls(UKEY, null);
  const PREFS = Object.assign({ lang: null, theme: 'dark' }, ls(PKEY, {}));
  const UI = { view: 'kanban', src: '', q: '', fs: '', fi: '', sidebar: false, menus: null, outOpen: true, tf: 'open', finder: null };
  const save = () => lsSet(KEY, D), savePrefs = () => lsSet(PKEY, PREFS);
  (function () { let l = PREFS.lang; if (!l) { const n = (navigator.language || 'en').slice(0, 2); l = n === 'ar' ? 'ar' : n === 'ur' ? 'ur' : 'en'; } I18N.set(l); document.documentElement.dataset.theme = PREFS.theme; })();

  /* ---------- helpers ---------- */
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const L = () => I18N.lang;
  const nm = o => !o ? '' : typeof o === 'string' ? o : (o[L()] || o.en);
  const bdi = s => '<bdi>' + esc(s) + '</bdi>';
  const numF = new Intl.NumberFormat('en-US');
  const sar = n => L() === 'en' ? 'SAR ' + numF.format(Math.round(n)) : numF.format(Math.round(n)) + ' ' + t('c.sar');
  const sarH = n => bdi(sar(n));
  const dateF = (ts, o) => new Intl.DateTimeFormat(I18N.locale(), o || { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(ts));
  const dShort = ts => dateF(ts, { day: 'numeric', month: 'short' });
  const timeF = ts => new Intl.DateTimeFormat(L() === 'en' ? 'en-US' : I18N.locale(), { hour: 'numeric', minute: '2-digit' }).format(new Date(ts));
  const dayF = ts => { const d = new Date(ts), n = new Date(); const diff = Math.round((new Date(d.toDateString()) - new Date(n.toDateString())) / DAY); return diff === 0 ? t('c.today') : diff === 1 ? t('c.tomorrow') : diff === -1 ? t('c.yesterday') : dateF(ts, { weekday: 'short', day: 'numeric', month: 'short' }); };
  function rel(ts) { const rtf = new Intl.RelativeTimeFormat(L() === 'ar' ? 'ar-u-nu-latn' : L() === 'ur' ? 'ur-u-nu-latn' : 'en', { numeric: 'auto' }); const d = (ts - Date.now()) / 1000, a = Math.abs(d); return a < 3600 ? rtf.format(Math.round(d / 60), 'minute') : a < 86400 ? rtf.format(Math.round(d / 3600), 'hour') : rtf.format(Math.round(d / 86400), 'day'); }
  const uid = p => p + Date.now().toString(36).slice(-5) + Math.random().toString(36).slice(2, 5);
  const lead = id => D.leads.find(l => l.id === id);
  const mem = id => D.team.find(m => m.id === id) || D.team[0];
  const userName = () => (USER && USER.name) || 'Guest';
  const agency = () => (USER && USER.company) || 'LeadGen AI';
  const COL = ['#7c3aed', '#2563eb', '#0ea5e9', '#16a34a', '#f59e0b', '#ec4899', '#14b8a6', '#ef4444', '#8b5cf6', '#f97316'];
  function avatar(name, size) { const n = nm(name) || '?'; const p = n.trim().split(/\s+/); const ini = (p[0][0] || '') + (p.length > 1 ? p[p.length - 1][0] : ''); let h = 0; for (const ch of (name && name.en) || n) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return `<span class="av ${size || ''}" style="--c:${COL[h % COL.length]}">${esc(ini.toUpperCase())}</span>`; }
  const SRC_C = { facebook: '#3b82f6', google: '#a855f7', linkedin: '#0ea5e9', whatsapp: '#22c55e', website: '#f59e0b', referral: '#ec4899', ai: '#14b8a6' };
  const CH_IC = { whatsapp: 'whatsapp', email: 'mail', linkedin: 'linkedin', facebook: 'facebook', sms: 'sms' };
  const STG_C = { new: '#3b82f6', contacted: '#64748b', qualified: '#16a34a', proposal: '#8b5cf6', converted: '#10b981' };
  const scoreLbl = s => s >= 70 ? 'hot' : s >= 45 ? 'warm' : 'cold';
  const scoreTag = s => `<span class="score sc-${scoreLbl(s)}" title="${t('ld.score')}">${bdi(s)}</span>`;
  const stgTag = s => `<span class="pill stg-${s}">${t('stg.' + s)}</span>`;
  function toast(msg, kind) { const el = document.createElement('div'); el.className = 'toast ' + (kind || ''); el.innerHTML = icon(kind === 'err' ? 'x' : 'check') + '<span>' + esc(msg) + '</span>'; $('#toasts').appendChild(el); setTimeout(() => el.classList.add('out'), 2600); setTimeout(() => el.remove(), 3000); }
  function sendForm(p) { try { fetch(FORM_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(Object.assign({ _captcha: 'false', _template: 'table' }, p)) }).catch(() => {}); } catch (e) {} }
  function modal(title, body, cls) { const m = $('#modal'); m.innerHTML = `<div class="mback" data-act="closeModal"></div><div class="mbox ${cls || ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="mhead"><h3>${esc(title)}</h3><button class="ibtn" data-act="closeModal" aria-label="${t('c.close')}">${icon('x')}</button></div><div class="mbody">${body}</div></div>`; m.classList.add('open'); document.body.classList.add('noscroll'); const f = m.querySelector('input:not([type=radio]):not([type=checkbox]),select,textarea'); if (f && matchMedia('(pointer:fine)').matches) f.focus(); }
  function closeModal() { const m = $('#modal'); m.classList.remove('open'); m.innerHTML = ''; if (!$('#drawer.open')) document.body.classList.remove('noscroll'); }
  function drawer(html) { const d = $('#drawer'); d.innerHTML = `<div class="mback" data-act="closeDrawer"></div><aside class="dpanel">${html}</aside>`; d.classList.add('open'); document.body.classList.add('noscroll'); }
  function closeDrawer() { const d = $('#drawer'); d.classList.remove('open'); d.innerHTML = ''; document.body.classList.remove('noscroll'); }
  function log(k, v, ic) { D.activity.unshift({ k, v, at: Date.now(), ic }); D.activity = D.activity.slice(0, 40); D.notifs.unshift({ k, v, at: Date.now(), ic, read: false }); D.notifs = D.notifs.slice(0, 30); }
  const actText = a => t(a.k, { n: a.v.n != null ? a.v.n : '', ch: a.v.ch ? t('ch.' + a.v.ch) : '', l: a.v.l && lead(a.v.l) ? nm(lead(a.v.l).company) : (a.v.name || ''), s: a.v.s ? t('stg.' + a.v.s) : '' });
  const logo = () => `<a class="logo" href="#/" aria-label="LeadGen AI"><span class="lmark">${icon('bolt')}</span><b>LeadGen <i>AI</i></b></a>`;
  function langMenu(id) { const names = { en: 'English', ar: 'العربية', ur: 'اردو' }; const open = UI.menus === id; return `<div class="dd ${open ? 'open' : ''}"><button class="langbtn" data-act="menu" data-id="${id}" aria-haspopup="true" aria-expanded="${open}">${icon('globe')}<span>${L().toUpperCase()}</span></button><div class="ddm">${['en', 'ar', 'ur'].map(l => `<button data-act="lang" data-l="${l}" class="${l === L() ? 'on' : ''}">${names[l]}</button>`).join('')}</div></div>`; }
  const qualified = () => D.leads.filter(l => ['qualified', 'proposal', 'converted'].includes(l.stage));

  /* ================= LANDING ================= */
  function landing() {
    const sols = [['target', 's1', '#a855f7'], ['message', 's2', '#3b82f6'], ['funnel', 's3', '#f97316'], ['chart', 's4', '#22c55e'], ['radar', 's5', '#ec4899'], ['robot', 's6', '#14b8a6'], ['calendar', 's7', '#eab308'], ['globe', 's8', '#0ea5e9']];
    return `<header class="lhead"><div class="wrap lhead-in">${logo()}<nav class="lnav" aria-label="main">${[['home', '#top'], ['features', '#features'], ['how', '#how'], ['pricing', '#pricing'], ['tour', '#tour'], ['contact', '#contact']].map(([k, h]) => `<a href="${h}" data-act="scroll">${t('n.' + k)}</a>`).join('')}</nav>
      <div class="lacts">${langMenu('lang-l')}<button class="btn grad hide-sm" data-act="start">${t('n.start')} ${icon('arrowRight', 'flip sm')}</button><button class="ibtn plain show-md" data-act="lnav" aria-label="${t('c.menu')}">${icon('menu')}</button></div></div></header>
    <main id="top"><section class="hero"><div class="wrap hero-in"><div class="hero-txt">
      <span class="badge">${icon('sparkles', 'sm')} ${t('h.badge')}</span>
      <h1>${t('h.t1')}<br>${t('h.t2')}<br><span class="grad-t">${t('h.t3')}</span></h1>
      <p class="lead">${t('h.sub')}</p>
      <div class="hctas"><button class="btn grad lg" data-act="start">${t('h.cta')} ${icon('arrowRight', 'flip')}</button><button class="btn outline lg" data-act="capOpen">${icon('robot')} ${t('h.talk')}</button></div>
      <ul class="hchecks">${[1, 2, 3].map(i => `<li>${icon('check')}${t('h.c' + i)}</li>`).join('')}</ul></div>
      <div class="hero-vis" aria-hidden="true">${heroScene()}</div></div></section>
    <section class="wrap stats">${[['layers', '5', 'st1'], ['globe', '3', 'st2'], ['target', '0–100', 'st3'], ['clock', '24/7', 'st4']].map(([ic, v, k]) => `<div><span class="sic">${icon(ic)}</span><div><b>${bdi(v)}</b><small>${t('st.' + k)}</small></div></div>`).join('')}</section>
    <section class="wrap sec" id="features"><div class="sec-h c"><span class="kick">${t('f.kick')}</span><h2>${t('f.t')}</h2><p class="muted">${t('f.s')}</p></div>
      <div class="fgrid">${sols.map(([ic, k, c]) => `<article class="fcard"><span class="fic" style="--c:${c}">${icon(ic)}</span><h3>${t('f.' + k)}</h3><p>${t('f.' + k + 's')}</p></article>`).join('')}</div></section>
    <section class="wrap"><div class="revenue"><div><h2>${t('rv.t')}</h2><p>${t('rv.s')}</p><ul>${[1, 2, 3, 4, 5].map(i => `<li>${icon('check')}${t('rv.l' + i)}</li>`).join('')}</ul><button class="btn grad lg" data-act="start">${t('rv.cta')} ${icon('arrowRight', 'flip')}</button></div>
      <div class="rv-vis" aria-hidden="true"><div class="growth"><small>${t('rv.card')}</small><b>${t('rv.cardV')}</b>${Charts.spark([3, 5, 4, 7, 6, 9, 8, 12, 11, 15], '#a855f7')}<span>${t('rv.cardS')}</span></div></div></div></section>
    <section class="wrap sec" id="how"><div class="sec-h c"><span class="kick">${t('w.kick')}</span><h2>${t('w.t')}</h2></div><div class="steps4">${[['radar', 1], ['send', 2], ['funnel', 3], ['calendar', 4]].map(([ic, i]) => `<div class="step"><em>${bdi(i)}</em>${icon(ic)}<h3>${t('w.' + i)}</h3><p>${t('w.' + i + 's')}</p></div>`).join('')}</div></section>
    <section class="wrap sec" id="tour"><div class="tour"><article class="tcard"><span class="fic" style="--c:#7c3aed">${icon('chart')}</span><h3>${t('tr.a')}</h3><p>${t('tr.as')}</p><button class="btn grad" data-act="start">${t('tr.ab')} ${icon('arrowRight', 'flip sm')}</button></article><article class="tcard"><span class="fic" style="--c:#22c55e">${icon('robot')}</span><h3>${t('tr.b')}</h3><p>${t('tr.bs')}</p><button class="btn outline" data-act="capOpen">${t('tr.bb')} ${icon('arrowRight', 'flip sm')}</button></article></div></section>
    <section class="wrap sec" id="pricing"><div class="sec-h c"><span class="kick">${t('pr.kick')}</span><h2>${t('pr.t')}</h2><p class="muted">${t('pr.s')}</p></div>
      <div class="plans">${[['p1', 499, 0], ['p2', 1199, 1], ['p3', 2499, 0]].map(([k, price, hot]) => `<article class="plan ${hot ? 'hot' : ''}">${hot ? `<span class="ptag">${t('pr.pop')}</span>` : ''}<h3>${t('pr.' + k)}</h3><p class="muted sm">${t('pr.' + k + 's')}</p><p class="price">${sarH(price)}<small>/${t('pr.mo')}</small></p><ul>${[1, 2, 3, 4].map(i => `<li>${icon('check', 'sm')}${t('pr.' + k + 'f' + i)}</li>`).join('')}</ul><button class="btn ${hot ? 'grad' : 'outline'} block" data-act="start">${t('pr.cta')}</button></article>`).join('')}</div></section>
    <section class="wrap sec" id="contact"><div class="contact"><div><span class="kick">${t('n.contact')}</span><h2>${t('ct.t')}</h2><p class="muted">${t('ct.s')}</p><div class="row-btns"><button class="btn grad" data-act="capOpen">${icon('robot')} ${t('h.talk')}</button><a class="btn wa" href="https://wa.me/${WA_AGENCY}?text=${encodeURIComponent('Hi, I saw the LeadGen AI demo and want a lead generation system like this.')}" target="_blank" rel="noopener">${icon('whatsapp')} ${t('ct.wa')}</a></div></div>
      <form class="card form" data-form="contact" novalidate><div class="row2"><label>${t('ct.name')} *<input name="name" required maxlength="60" autocomplete="name"></label><label>${t('ct.wa2')} *<input name="whatsapp" required maxlength="25" inputmode="tel" autocomplete="tel"></label></div><label>${t('ct.biz')}<input name="business" maxlength="80"></label><label>${t('ct.msg')}<textarea name="message" rows="3" maxlength="600"></textarea></label><p class="err" hidden>${t('c.required')}</p><button class="btn grad" type="submit">${icon('send', 'flip sm')} ${t('ct.send')}</button></form></div></section>
    </main><footer class="lfoot"><div class="wrap lfoot-in">${logo()}<p>${t('ft.by')}<br><small>${t('ft.note')}</small></p><small>© <bdi>2026</bdi> AI Digital Marketing</small></div></footer>${capWidget()}`;
  }
  function heroScene() {
    const cards = [['Sample Lead', 'hc1', 'qualified'], ['Sample Lead', 'hc2', 'hot'], ['Sample Lead', 'hc3', 'contacted']];
    return `<div class="scene"><div class="glow"></div><div class="robot"><div class="r-ant"></div><div class="r-head"><div class="r-face"><i></i><i></i><span></span></div><div class="r-ear l"></div><div class="r-ear r"></div></div><div class="r-body"><div class="r-core"></div></div></div>
      <div class="lap"><div class="lap-s"><div class="bars">${[30, 45, 38, 60, 55, 78, 70, 92].map(v => `<i style="height:${v}%"></i>`).join('')}</div><svg viewBox="0 0 100 40" class="trend"><path d="M2 36 L20 28 L36 31 L52 20 L68 22 L84 10 L98 4" fill="none" stroke="#c4b5fd" stroke-width="2.5"/></svg></div><div class="lap-b"></div></div>
      ${[['linkedin', '#0a66c2', 'i1'], ['facebook', '#1877f2', 'i2'], ['whatsapp', '#22c55e', 'i3'], ['mail', '#ec4899', 'i4']].map(([ic, c, k]) => `<span class="ficon ${k}" style="--c:${c}">${icon(ic)}</span>`).join('')}
      ${cards.map(([, k, tag], i) => `<div class="hlead hl${i + 1}">${avatar({ en: t('h.' + k + 'n') })}<div><b>${t('h.newLead')}</b><small>${t('h.' + k)}</small><small class="mut">${t('h.' + k + 's')}</small><span class="pill ${tag === 'hot' ? 'sc-hot' : 'stg-' + tag}">${tag === 'hot' ? t('sc.hot') : t('stg.' + tag)}</span></div>${icon('dots', 'sm')}</div>`).join('')}
      <div class="hstat"><b>${bdi('5')}</b><small>${t('h.stat')}</small></div></div>`;
  }
  /* AI lead capture chat (landing) */
  const CAP = { open: false, step: 0, data: {}, items: [], busy: false };
  const CAP_STEPS = ['name', 'business', 'industry', 'city', 'need', 'budget', 'phone'];
  function capInit() { if (!CAP.items.length) CAP.items.push({ who: 'bot', text: t('cap.hello'), at: Date.now() }); }
  function capChips() {
    const s = CAP_STEPS[CAP.step]; if (CAP.busy) return '';
    if (s === 'industry') return INDUSTRIES.map(i => `<button data-act="capPick" data-v="${i}" data-l="${esc(t('ind.' + i))}">${t('ind.' + i)}</button>`).join('');
    if (s === 'city') return CITIES.map(c => `<button data-act="capPick" data-v="${c}" data-l="${esc(t('city.' + c))}">${t('city.' + c)}</button>`).join('');
    if (s === 'need') return NEEDS.map(n => `<button data-act="capPick" data-v="${n}" data-l="${esc(t('need.' + n))}">${t('need.' + n)}</button>`).join('');
    if (s === 'budget') return ['b1', 'b2', 'b3', 'b4'].map(b => `<button data-act="capPick" data-v="${b}" data-l="${esc(t('cap.' + b))}">${t('cap.' + b)}</button>`).join('');
    if (s === 'phone') return `<button data-act="capPick" data-v="" data-l="${esc(t('cap.skip'))}">${t('cap.skip')}</button>`;
    return '';
  }
  function capWidget() {
    capInit();
    return `<button class="capfab ${CAP.open ? 'hide' : ''}" data-act="capOpen">${icon('robot')}<span>${t('h.talk')}</span></button>
    <section class="wpanel ${CAP.open ? 'open' : ''}" aria-label="AI"><header><span class="wav">${icon('robot')}</span><div><b>${t('cap.title')}</b><small><i class="live"></i>${t('cap.sub')}</small></div><button class="ibtn ghost-w" data-act="capClose" aria-label="${t('c.close')}">${icon('x')}</button></header>
      <div class="wbody" id="cbody">${capMsgs()}</div><div class="wchips" id="cchips">${capChips()}</div><form class="wcomp" data-form="cap"><input name="q" maxlength="120" autocomplete="off" placeholder="${t('cap.ph')}" aria-label="${t('cap.ph')}"><button class="sendb" type="submit" aria-label="${t('c.send')}">${icon('send', 'flip')}</button></form></section>`;
  }
  function capMsgs() { return CAP.items.map(m => `<div class="wm ${m.who}">${m.live ? `<span class="livebadge">${t('c.live')}</span>` : ''}${m.html || `<p>${esc(m.text)}</p>`}<small class="wt">${bdi(timeF(m.at))}</small></div>`).join('') + (CAP.busy ? '<div class="wm bot typing"><i></i><i></i><i></i></div>' : ''); }
  function capRender() { const b = $('#cbody'); if (!b) return; b.innerHTML = capMsgs(); b.scrollTop = b.scrollHeight; const c = $('#cchips'); if (c) c.innerHTML = capChips(); }
  async function capAnswer(val, label) {
    const s = CAP_STEPS[CAP.step]; if (!s || CAP.busy) return;
    if (['name', 'business'].includes(s) && !String(val).trim()) return;
    CAP.items.push({ who: 'me', text: label || val || t('cap.skip'), at: Date.now() }); CAP.data[s] = String(val).trim();
    CAP.step++;
    if (CAP.step < CAP_STEPS.length) { CAP.items.push({ who: 'bot', text: t('cap.q.' + CAP_STEPS[CAP.step], { n: CAP.data.name.split(' ')[0] }), at: Date.now() }); return capRender(); }
    // finished → create lead, score with AI
    const d = CAP.data; const id = 'L' + (D.seq++);
    const value = { b1: 3000, b2: 8000, b3: 20000, b4: 40000 }[d.budget] || 5000;
    const l = { id, name: { en: d.name, ar: d.name, ur: d.name }, company: { en: d.business, ar: d.business, ur: d.business }, industry: d.industry || 'it', city: d.city || 'riyadh', source: 'website', stage: 'new', score: 60, value, need: d.need || 'leads', owner: 't2', phone: d.phone || '', email: '', created: Date.now(), touched: Date.now(), visitor: true };
    D.leads.unshift(l); log('act.web', { name: d.business }, 'globe'); save();
    sendForm({ _subject: 'LeadGen AI demo — new lead from AI chat: ' + d.business, name: d.name, business: d.business, industry: d.industry, city: d.city, need: d.need, budget: t('cap.' + d.budget), whatsapp: d.phone || '-', language: L() });
    CAP.busy = true; capRender();
    const r = await AI.score(leadInfo(l), L(), agency());
    CAP.busy = false;
    const sc = r || fallbackScore(l); l.score = sc.score; l.ai = { reason: sc.reason, next: sc.next_step }; save();
    CAP.items.push({ who: 'bot', live: !!r, at: Date.now(), html: `<p>${esc(t('cap.done', { n: d.name.split(' ')[0] }))}</p><div class="capsum"><b>${esc(d.business)}</b><span>${t('ind.' + l.industry)} · ${t('city.' + l.city)} · ${t('need.' + l.need)}</span><div class="scrow">${scoreTag(sc.score)}<span class="pill sc-${scoreLbl(sc.score)}">${t('sc.' + scoreLbl(sc.score))}</span></div><small>${esc(sc.reason)}</small><small>➜ ${esc(sc.next_step)}</small></div><button class="btn grad sm" data-act="capDash">${icon('chart', 'sm')} ${t('cap.see')}</button>` });
    capRender();
  }

  /* ================= DASHBOARD SHELL ================= */
  const NAV = [['dashboard', 'home'], ['leads', 'users'], ['pipeline', 'kanban'], ['campaigns', 'megaphone'], ['outreach', 'send'], ['crm', 'layers'], ['clients', 'brief'], ['tasks', 'checkSq'], ['appointments', 'calendar'], ['analytics', 'chart'], ['ai', 'robot'], ['settings', 'settings']];
  function shell(page, sub, content) {
    const unread = D.notifs.filter(n => !n.read).length, tk = D.tasks.filter(k => !k.done).length;
    return `<div class="app ${UI.sidebar ? 'sb-open' : ''}"><aside class="side">${logo()}<nav>${NAV.map(([p, ic]) => p === 'outreach' ? `<button class="navg ${page === p ? 'on' : ''}" data-act="outToggle" aria-expanded="${UI.outOpen}">${icon(ic)}<span>${t('sd.' + p)}</span>${icon('chevDown', 'sm car ' + (UI.outOpen ? 'up' : ''))}</button>${UI.outOpen ? `<div class="subnav">${CHANNELS.map(c => `<a href="#/app/outreach/${c}" class="${page === p && sub === c ? 'on' : ''}" data-act="nav">${icon(CH_IC[c], 'sm')}<span>${t('ch.' + c)}</span></a>`).join('')}</div>` : ''}` : `<a href="#/app/${p}" class="${p === page ? 'on' : ''}" data-act="nav">${icon(ic)}<span>${t('sd.' + p)}</span>${p === 'leads' ? `<em>${bdi(D.leads.length)}</em>` : p === 'tasks' && tk ? `<em class="or">${bdi(tk)}</em>` : ''}</a>`).join('')}</nav>
      <div class="agent"><span class="ag-bot">${icon('robot')}</span><b>${t('ag.t')}</b><small>${t('ag.s')}</small><button class="btn grad block sm" data-act="finder">${t('ag.cta')} ${icon('arrowRight', 'flip sm')}</button></div></aside><div class="sb-back" data-act="sidebar"></div>
      <div class="main"><header class="top"><button class="ibtn show-md" data-act="sidebar" aria-label="${t('c.menu')}">${icon('menu')}</button>
        <div class="search" id="gsearch">${icon('search')}<input type="search" placeholder="${t('top.search')}" data-act="gsearch" aria-label="${t('c.search')}" autocomplete="off"><div class="sres" id="sres"></div></div>
        <span class="chip hide-md">${icon('calendar', 'sm')} ${dateF(new Date(new Date().getFullYear(), new Date().getMonth(), 1))} – ${dateF(Date.now())}</span>
        <div class="tacts">${langMenu('lang-a')}<button class="ibtn" data-act="theme" aria-label="${t('c.theme')}">${icon(PREFS.theme === 'dark' ? 'sun' : 'moon')}</button>
          <div class="dd ${UI.menus === 'notif' ? 'open' : ''}"><button class="ibtn" data-act="menu" data-id="notif" aria-label="${t('top.notif')}">${icon('bell')}${unread ? `<em class="dot">${unread}</em>` : ''}</button><div class="ddm wide"><div class="ddh"><b>${t('top.notif')}</b><button class="link" data-act="markRead">${t('top.markread')}</button></div>${D.notifs.slice(0, 8).map(n => `<div class="nitem ${n.read ? '' : 'unread'}">${icon(n.ic || 'bell')}<div><p>${esc(actText(n))}</p><small>${rel(n.at)}</small></div></div>`).join('')}</div></div>
          <div class="dd ${UI.menus === 'user' ? 'open' : ''}"><button class="ubtn" data-act="menu" data-id="user">${avatar({ en: userName() })}<span class="hide-sm"><b>${bdi(userName())}</b><small>${t('top.role')}</small></span>${icon('chevDown', 'sm')}</button><div class="ddm"><a href="#/app/settings" data-act="nav">${icon('settings')}${t('sd.settings')}</a><a href="#/">${icon('home')}${t('top.site')}</a><button data-act="reset">${icon('refresh')}${t('top.reset')}</button><button data-act="logout">${icon('logout')}${t('top.logout')}</button></div></div></div></header>
        <main class="content" id="content">${content}</main></div></div>`;
  }
  const head = (title, sub, acts) => `<div class="phead"><div><h1>${title}</h1><p class="muted">${sub}</p></div><div class="pacts">${acts || ''}</div></div>`;
  const kpi = (k, v, d, c, ic) => `<div class="kpi card"><span class="kic" style="--c:${c}">${icon(ic)}</span><div><small>${t(k)}</small><b>${v}</b>${d != null ? `<span class="dl ${d < 0 ? 'neg' : ''}">${icon('arrowUp', 'sm')}${bdi((d > 0 ? '+' : '') + d + '%')}</span>` : ''}</div></div>`;
  function leadCard(l) { return `<article class="kcard" data-id="${l.id}"><div class="kc-t">${avatar(l.name)}<div><b>${esc(nm(l.name))}</b><small>${esc(nm(l.company))}</small></div><button class="ibtn sm plain" data-act="lead" data-id="${l.id}" aria-label="${t('c.open')}">${icon('dots', 'sm')}</button></div><small class="kmeta">${t('city.' + l.city)} · ${rel(l.touched)}</small><div class="kc-f">${stgTag(l.stage)}${l.visitor ? `<span class="pill you">${t('ld.you')}</span>` : l.source === 'ai' ? `<span class="pill aisrc">${icon('sparkles', 'sm')} AI</span>` : ''}${scoreTag(l.score)}<span class="grip" aria-hidden="true">${icon('grip', 'sm')}</span></div></article>`; }
  function pipeline(limit) {
    const list = D.leads.filter(l => !UI.src || l.source === UI.src);
    if (UI.view === 'list') return leadTable(list.slice(0, limit ? 10 : 999));
    return `<div class="kanban">${STAGES.map(s => { const ls = list.filter(l => l.stage === s).sort((a, b) => b.touched - a.touched); const show = limit ? ls.slice(0, limit) : ls; return `<section class="kcol" data-col="${s}" style="--c:${STG_C[s]}"><header><b>${t('stg.' + s)}</b><em>${bdi(ls.length)}</em></header><div class="kbody">${show.map(leadCard).join('')}${ls.length > show.length ? `<a class="more" href="#/app/pipeline" data-act="nav">+${bdi(ls.length - show.length)} ${t('c.more')}</a>` : ''}</div></section>`; }).join('')}</div>`;
  }
  const pipeCtl = () => `<select class="chip" data-act="src" aria-label="${t('ld.source')}"><option value="">${t('pp.all')}</option>${SOURCES.concat('ai').map(s => `<option value="${s}" ${UI.src === s ? 'selected' : ''}>${t('src.' + s)}</option>`).join('')}</select><div class="seg"><button class="${UI.view === 'kanban' ? 'on' : ''}" data-act="view" data-v="kanban">${icon('kanban', 'sm')} ${t('pp.kanban')}</button><button class="${UI.view === 'list' ? 'on' : ''}" data-act="view" data-v="list">${icon('list', 'sm')} ${t('pp.list')}</button></div><button class="btn grad" data-act="addLead">${icon('plus')} ${t('ld.add')}</button>`;
  function pgDashboard() {
    const tot = D.leads.length, q = qualified().length, ap = D.appts.length, cl = D.leads.filter(l => l.stage === 'converted').length;
    const bySrc = SOURCES.concat('ai').map(s => ({ s, n: D.leads.filter(l => l.source === s).length })).filter(x => x.n);
    const funnel = [['fn.leads', tot], ['fn.contacted', D.leads.filter(l => l.stage !== 'new').length], ['fn.qualified', q], ['fn.appts', ap], ['fn.clients', cl]];
    const byInd = INDUSTRIES.map(i => ({ i, n: D.leads.filter(l => l.industry === i).length })).sort((a, b) => b.n - a.n), top = byInd.slice(0, 5), other = byInd.slice(5).reduce((a, x) => a + x.n, 0), imax = Math.max(top[0].n, other);
    return head(t('d.t'), t('d.s'), `<select class="chip" aria-label="range"><option>${t('d.month')}</option><option>${t('d.q')}</option></select>`)
      + `<div class="kpis">${kpi('d.k1', bdi(tot), 32, '#7c3aed', 'users')}${kpi('d.k2', bdi(q), 18, '#2563eb', 'checkSq')}${kpi('d.k3', bdi(ap), 24, '#f59e0b', 'calendar')}${kpi('d.k4', bdi(cl), 15, '#16a34a', 'userPlus')}</div>
      <div class="card"><div class="ch wrapc"><h4>${icon('funnel', 'sm')} ${t('d.pipeline')}</h4><div class="pacts">${pipeCtl()}</div></div>${pipeline(3)}</div>
      <div class="grid3"><div class="card"><div class="ch"><h4>${t('d.sources')}</h4></div><div class="donrow">${Charts.donut(bySrc.map(x => ({ value: x.n, color: SRC_C[x.s], label: t('src.' + x.s) })), tot, t('d.total'))}<ul class="dleg">${bySrc.map(x => `<li><i style="--c:${SRC_C[x.s]}"></i>${t('src.' + x.s)}<b>${bdi(Math.round(x.n / tot * 100) + '%')}</b></li>`).join('')}</ul></div></div>
        <div class="card"><div class="ch"><h4>${t('d.funnel')}</h4></div><div class="funnel">${funnel.map(([k, v], i) => `<div class="fr"><span class="fshape" style="--w:${100 - i * 15}%;--c:${['#7c3aed', '#6366f1', '#0ea5e9', '#f472b6', '#ef4444'][i]}"></span><span>${t(k)}</span><b>${bdi(numF.format(v) + ' (' + Math.round(v / tot * 100) + '%)')}</b></div>`).join('')}</div></div>
        <div class="card"><div class="ch"><h4>${t('d.industry')}</h4></div><div class="hbars">${top.map((x, i) => `<div><span>${t('ind.' + x.i)}</span><span class="hb"><i style="width:${x.n / imax * 100}%;--c:${COL[i]}"></i></span><b>${bdi(Math.round(x.n / tot * 100) + '%')}</b></div>`).join('')}<div><span>${t('ind.other')}</span><span class="hb"><i style="width:${other / imax * 100}%;--c:#94a3b8"></i></span><b>${bdi(Math.round(other / tot * 100) + '%')}</b></div></div></div></div>
      <div class="grid3"><div class="card"><div class="ch"><h4>${t('d.activity')}</h4><a class="link" href="#/app/analytics" data-act="nav">${t('c.viewAll')} ${icon('arrowRight', 'flip sm')}</a></div><ul class="alist">${D.activity.slice(0, 5).map(a => `<li><span class="aic" style="--c:${a.ic === 'linkedin' ? '#0a66c2' : a.ic === 'whatsapp' ? '#22c55e' : a.ic === 'mail' ? '#ec4899' : '#6366f1'}">${icon(a.ic || 'bell')}</span><div><p>${esc(actText(a))}</p><small>${rel(a.at)}</small></div></li>`).join('')}</ul></div>
        <div class="card"><div class="ch"><h4>${t('d.insights')}</h4><span class="chip">${t('d.month')}</span></div><ul class="ins">${insights().map(x => `<li><span class="aic" style="--c:${x.c}">${icon(x.ic)}</span><div><small>${x.k}</small><b>${x.v}</b></div><em>${x.d}</em></li>`).join('')}</ul></div>
        <div class="card"><div class="ch"><h4>${t('d.tasks')}</h4><a class="link" href="#/app/tasks" data-act="nav">${t('c.viewAll')} ${icon('arrowRight', 'flip sm')}</a></div><ul class="tklist">${D.tasks.filter(k => !k.done).sort((a, b) => a.due - b.due).slice(0, 5).map(taskRow).join('')}</ul></div></div>`;
  }
  function insights() {
    const hi = D.leads.filter(l => l.score >= 75 && l.stage !== 'converted'), best = D.campaigns.filter(c => c.sent).sort((a, b) => b.replied / b.sent - a.replied / a.sent)[0], likely = D.leads.filter(l => l.stage === 'proposal' && l.score >= 70);
    return [{ ic: 'bolt', c: '#a855f7', k: t('in.hi'), v: bdi(hi.length), d: '' }, { ic: CH_IC[best.channel], c: '#0ea5e9', k: t('in.best'), v: t('ch.' + best.channel), d: bdi(Math.round(best.replied / best.sent * 100) + '% ' + t('in.reply')) }, { ic: 'clock', c: '#f59e0b', k: t('in.time'), v: bdi(timeF(new Date().setHours(10, 0, 0, 0))), d: t('in.sug') }, { ic: 'star', c: '#22c55e', k: t('in.likely'), v: bdi(likely.length), d: sarH(likely.reduce((a, l) => a + l.value, 0)) }];
  }
  function taskTitle(k) { const l = lead(k.lid); return t('tk.' + k.type, { l: l ? nm(l.name).split(' ')[0] : '', c: l ? nm(l.company) : '', n: k.n || '' }) || k.text; }
  const taskRow = k => `<li class="${k.done ? 'done' : ''}"><span class="aic sm" style="--c:${{ call: '#0ea5e9', contract: '#f97316', follow: '#eab308', review: '#22c55e', meeting: '#8b5cf6', proposal: '#ec4899', custom: '#64748b' }[k.type]}">${icon({ call: 'phone', contract: 'edit', follow: 'refresh', review: 'whatsapp', meeting: 'users', proposal: 'pen', custom: 'checkSq' }[k.type])}</span><div><p>${esc(k.type === 'custom' ? k.text : taskTitle(k))}</p><small>${dayF(k.due)}, ${bdi(timeF(k.due))}</small></div><button class="chk" data-act="toggleTask" data-id="${k.id}" aria-label="done">${k.done ? icon('check', 'sm') : ''}</button></li>`;
  /* leads */
  function leadTable(list) {
    return `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>${t('ld.lead')}</th><th class="hide-sm">${t('ld.industry')}</th><th class="hide-md">${t('ld.city')}</th><th class="hide-md">${t('ld.source')}</th><th>${t('ld.stage')}</th><th>${t('ld.score')}</th><th class="hide-sm">${t('ld.value')}</th><th class="hide-md">${t('ld.touched')}</th></tr></thead><tbody>
      ${list.map(l => `<tr data-act="lead" data-id="${l.id}"><td><span class="who">${avatar(l.name, 'sm')}<span><b>${esc(nm(l.name))}</b><small>${esc(nm(l.company))}</small></span></span></td><td class="hide-sm">${t('ind.' + l.industry)}</td><td class="hide-md">${t('city.' + l.city)}</td><td class="hide-md"><span class="srcd" style="--c:${SRC_C[l.source]}"></span>${t('src.' + l.source)}</td><td>${stgTag(l.stage)}</td><td>${scoreTag(l.score)}</td><td class="hide-sm nowrap">${sarH(l.value)}</td><td class="hide-md nowrap">${rel(l.touched)}</td></tr>`).join('')}</tbody></table>${list.length ? '' : `<p class="empty">${t('c.empty')}</p>`}</div>`;
  }
  function pgLeads() {
    const q = UI.q.trim().toLowerCase();
    const list = D.leads.filter(l => (!UI.fs || l.stage === UI.fs) && (!UI.fi || l.industry === UI.fi) && (!UI.src || l.source === UI.src) && (!q || [l.name.en, l.name.ar, l.company.en, l.company.ar, nm(l.company)].join(' ').toLowerCase().includes(q))).sort((a, b) => b.score - a.score);
    return head(t('sd.leads'), t('ld.s'), `<button class="btn outline" data-act="export">${icon('download')} CSV</button><button class="btn outline" data-act="finder">${icon('radar')} ${t('fd.t')}</button><button class="btn grad" data-act="addLead">${icon('plus')} ${t('ld.add')}</button>`)
      + `<div class="card"><div class="filters"><div class="search inline">${icon('search')}<input type="search" value="${esc(UI.q)}" placeholder="${t('ld.searchPh')}" data-act="lq" aria-label="${t('c.search')}"></div><select data-act="fs" aria-label="${t('ld.stage')}"><option value="">${t('ld.allStages')}</option>${STAGES.map(s => `<option value="${s}" ${UI.fs === s ? 'selected' : ''}>${t('stg.' + s)}</option>`).join('')}</select><select data-act="fi" aria-label="${t('ld.industry')}"><option value="">${t('ld.allInd')}</option>${INDUSTRIES.map(i => `<option value="${i}" ${UI.fi === i ? 'selected' : ''}>${t('ind.' + i)}</option>`).join('')}</select><select data-act="src" aria-label="${t('ld.source')}"><option value="">${t('pp.all')}</option>${SOURCES.concat('ai').map(s => `<option value="${s}" ${UI.src === s ? 'selected' : ''}>${t('src.' + s)}</option>`).join('')}</select></div>${leadTable(list)}</div>`;
  }
  function leadInfo(l) { return { name: l.name.en === l.name.ar ? l.name.en : nm(l.name), company: nm(l.company), industry: I18N.dicts.en['ind.' + l.industry], city: I18N.dicts.en['city.' + l.city], source: l.source, stage: l.stage, need: I18N.dicts.en['need.' + l.need], deal_value_sar: l.value, last_touch_days_ago: Math.round((Date.now() - l.touched) / DAY), created_days_ago: Math.round((Date.now() - l.created) / DAY) }; }
  function fallbackScore(l) {
    let s = { new: 40, contacted: 52, qualified: 68, proposal: 78, converted: 92 }[l.stage] + (l.value >= 20000 ? 8 : l.value >= 8000 ? 4 : 0) + (['referral', 'website', 'whatsapp'].includes(l.source) ? 6 : 0) - Math.min(15, Math.round((Date.now() - l.touched) / DAY) * 2);
    s = Math.max(10, Math.min(97, s)); const lb = scoreLbl(s);
    return { score: s, label: lb, reason: t('sc.r.' + lb, { n: t('need.' + l.need), s: t('src.' + l.source) }), next_step: t('sc.n.' + (l.stage === 'new' ? 'new' : lb)) };
  }
  function outreachFallback(l, ch) { const first = nm(l.name).split(' ')[0]; return t('or.fb.' + ch, { n: first, c: nm(l.company), city: t('city.' + l.city), need: t('need.' + l.need), ind: t('ind.' + l.industry), a: agency() }); }
  function leadDrawer(id) {
    const l = lead(id); if (!l) return; const lb = scoreLbl(l.score), ap = D.appts.filter(a => a.lid === id);
    drawer(`<div class="dh">${avatar(l.name, 'lg')}<div><h3>${esc(nm(l.name))}</h3><p class="muted sm">${esc(nm(l.company))} · ${t('ind.' + l.industry)} · ${t('city.' + l.city)}</p></div><button class="ibtn" data-act="closeDrawer" aria-label="${t('c.close')}">${icon('x')}</button></div>
      <div class="dbody"><div class="scorebox"><div class="ring sc-${lb}" style="--p:${l.score}"><b>${bdi(l.score)}</b></div><div><span class="pill sc-${lb}">${t('sc.' + lb)}</span><p class="sm" id="aiwhy">${esc(l.ai ? l.ai.reason : fallbackScore(l).reason)}</p><p class="sm nx">➜ <span id="ainext">${esc(l.ai ? l.ai.next : fallbackScore(l).next_step)}</span></p></div><button class="btn outline sm" data-act="rescore" data-id="${l.id}">${icon('sparkles', 'sm')} ${t('ld.rescore')}</button></div>
      <div class="row2"><label>${t('ld.stage')}<select data-act="lstage" data-id="${l.id}">${STAGES.map(s => `<option value="${s}" ${l.stage === s ? 'selected' : ''}>${t('stg.' + s)}</option>`).join('')}</select></label><label>${t('ld.owner')}<select data-act="lowner" data-id="${l.id}">${D.team.map(m => `<option value="${m.id}" ${l.owner === m.id ? 'selected' : ''}>${esc(nm(m.name))}</option>`).join('')}</select></label></div>
      <div class="stats3"><div><b>${sarH(l.value)}</b><small>${t('ld.value')}</small></div><div><b>${t('src.' + l.source)}</b><small>${t('ld.source')}</small></div><div><b>${t('need.' + l.need)}</b><small>${t('ld.need')}</small></div></div>
      <div class="cbox">${icon('phone', 'sm')}<bdi>${esc(l.phone || '—')}</bdi>${l.email ? ` · ${icon('mail', 'sm')}<bdi>${esc(l.email)}</bdi>` : ''}</div>
      <h4>${icon('sparkles', 'sm')} ${t('or.t')}</h4><div class="chsel">${CHANNELS.map(c => `<button class="chb" data-act="writeOut" data-id="${l.id}" data-ch="${c}" style="--c:${{ whatsapp: '#22c55e', email: '#ec4899', linkedin: '#0a66c2', facebook: '#1877f2', sms: '#f59e0b' }[c]}">${icon(CH_IC[c], 'sm')} ${t('ch.' + c)}</button>`).join('')}</div><div id="outbox"></div>
      <h4>${t('sd.appointments')}</h4>${ap.map(a => `<div class="cbox">${icon('calendar', 'sm')} ${dayF(a.at)}, ${bdi(timeF(a.at))} · ${t('ap.' + a.type)} <span class="pill ${a.status === 'done' ? 'stg-converted' : 'stg-new'}">${t('ap.' + a.status)}</span></div>`).join('') || `<p class="muted sm">${t('ap.none')}</p>`}
      <div class="dacts"><button class="btn outline" data-act="book" data-id="${l.id}">${icon('calendar')} ${t('ap.book')}</button>${l.stage !== 'converted' ? `<button class="btn grn" data-act="convert" data-id="${l.id}">${icon('check')} ${t('ld.convert')}</button>` : ''}<button class="btn danger" data-act="delLead" data-id="${l.id}" aria-label="${t('c.delete')}">${icon('trash')}</button></div>
      <p class="muted sm">${t('ld.created')} ${dateF(l.created)} · ${t('ld.owner')}: ${esc(nm(mem(l.owner).name))}${l.source === 'ai' ? ' · ' + t('fd.sampleNote') : ''}</p></div>`);
  }
  function leadForm() {
    return `<form class="form" data-form="lead" novalidate><div class="row2"><label>${t('ld.name')} *<input name="name" required maxlength="60"></label><label>${t('ld.company')} *<input name="company" required maxlength="60"></label></div>
      <div class="row3"><label>${t('ld.industry')}<select name="industry">${INDUSTRIES.map(i => `<option value="${i}">${t('ind.' + i)}</option>`).join('')}</select></label><label>${t('ld.city')}<select name="city">${CITIES.map(c => `<option value="${c}">${t('city.' + c)}</option>`).join('')}</select></label><label>${t('ld.source')}<select name="source">${SOURCES.map(s => `<option value="${s}">${t('src.' + s)}</option>`).join('')}</select></label></div>
      <div class="row3"><label>${t('ld.need')}<select name="need">${NEEDS.map(n => `<option value="${n}">${t('need.' + n)}</option>`).join('')}</select></label><label>${t('ld.value')} (SAR)<input name="value" type="number" min="0" value="10000"></label><label>WhatsApp<input name="phone" maxlength="20" inputmode="tel"></label></div>
      <div class="mfoot"><button type="button" class="btn outline" data-act="closeModal">${t('c.cancel')}</button><button class="btn grad" type="submit">${t('c.save')}</button></div></form>`;
  }
  /* AI lead finder */
  function finderModal() {
    UI.finder = null;
    modal(t('fd.t'), `<p class="muted">${t('fd.s')}</p><form class="form" data-form="finder" novalidate><div class="row3"><label>${t('ld.industry')}<select name="industry">${INDUSTRIES.map(i => `<option value="${i}" ${i === 'dental' ? 'selected' : ''}>${t('ind.' + i)}</option>`).join('')}</select></label><label>${t('ld.city')}<select name="city">${CITIES.map(c => `<option value="${c}" ${c === 'jeddah' ? 'selected' : ''}>${t('city.' + c)}</option>`).join('')}</select></label><label>${t('fd.service')}<select name="need">${NEEDS.map(n => `<option value="${n}">${t('need.' + n)}</option>`).join('')}</select></label></div>
      <button class="btn grad block" type="submit">${icon('radar')} ${t('fd.run')}</button></form><div id="fdout"></div><p class="muted sm">${icon('shield', 'sm')} ${t('fd.note')}</p>`, 'wide');
  }
  function finderFallback(ind, city, need) {
    const R = (() => { let s = Date.now() % 9973; return () => (s = (s * 9301 + 49297) % 233280) / 233280; })();
    const PEOPLE = [['Rakan Al-Fifi', 'راكان الفيفي', 'راکان الفیفی'], ['Huda Al-Amri', 'هدى العمري', 'ہدیٰ العمری'], ['Mazen Al-Ahmadi', 'مازن الأحمدي', 'مازن الاحمدی'], ['Shahid Nawaz', 'شاهد نواز', 'شاہد نواز'], ['Jana Al-Bishi', 'جنى البيشي', 'جنیٰ البیشی'], ['Talal Al-Qarni', 'طلال القرني', 'طلال القرنی']];
    const pre = { en: ['Sample', 'Demo', 'Test'], ar: ['تجريبي', 'نموذج', 'عرض'], ur: ['سیمپل', 'ڈیمو', 'ٹیسٹ'] };
    return [0, 1, 2, 3, 4].map(i => { const base = COMPANIES[ind][i % COMPANIES[ind].length], p = PEOPLE[(i + Math.floor(R() * 6)) % 6], sc = 50 + Math.floor(R() * 45);
      return { company: { en: base[0] + ' (' + pre.en[i % 3] + ' ' + (i + 1) + ')', ar: base[1] + ' (' + pre.ar[i % 3] + ' ' + (i + 1) + ')', ur: base[2] + ' (' + pre.ur[i % 3] + ' ' + (i + 1) + ')' }, contact: { en: p[0], ar: p[1], ur: p[2] }, role: t('fd.owner'), need: t('fd.needT', { n: t('need.' + need), c: t('city.' + city) }), score: sc, why: t('sc.r.' + scoreLbl(sc), { n: t('need.' + need), s: 'Google Maps' }), next_step: t('sc.n.new') }; });
  }
  function finderResults(list, live) {
    return `${live ? `<span class="livebadge">${t('c.live')}</span>` : ''}<ul class="fdlist">${list.map((x, i) => `<li><label class="fdl"><input type="checkbox" checked data-i="${i}"><span>${avatar(typeof x.contact === 'string' ? { en: x.contact } : x.contact, 'sm')}</span><div><b>${esc(nm(x.company))}</b><small>${esc(nm(x.contact))} · ${esc(x.role || '')}</small><p>${esc(x.need)}</p><small class="mut">${esc(x.why)}</small></div>${scoreTag(x.score)}</label></li>`).join('')}</ul><button class="btn grad block" data-act="fdAdd">${icon('plus')} ${t('fd.add')}</button>`;
  }
  /* pages */
  function pgPipeline() { return head(t('sd.pipeline'), t('pp.s'), pipeCtl()) + `<p class="muted sm hint">${icon('grip', 'sm')} ${t('pp.drag')}</p>${pipeline(0)}`; }
  function pgCampaigns() {
    return head(t('sd.campaigns'), t('cp.s'), `<button class="btn grad" data-act="addCamp">${icon('plus')} ${t('cp.new')}</button>`) + `<div class="cgrid">${D.campaigns.map(campCard).join('')}</div>`;
  }
  function campCard(c) {
    const op = c.sent ? Math.round(c.opened / c.sent * 100) : 0, rp = c.sent ? Math.round(c.replied / c.sent * 100) : 0;
    return `<article class="card camp"><div class="cc-h"><span class="aic" style="--c:${{ whatsapp: '#22c55e', email: '#ec4899', linkedin: '#0a66c2', facebook: '#1877f2', sms: '#f59e0b' }[c.channel]}">${icon(CH_IC[c.channel])}</span><div><b>${esc(nm(c.name))}</b><small>${t('ch.' + c.channel)} · ${dShort(c.start)}</small></div><button class="toggle ${c.status === 'active' ? 'on' : ''}" data-act="campToggle" data-id="${c.id}" aria-label="${t('cp.' + c.status)}"><i></i><span>${t('cp.' + c.status)}</span></button></div>
      <div class="cstats"><div><b>${bdi(numF.format(c.sent))}</b><small>${t('cp.sent')}</small></div><div><b>${bdi(op + '%')}</b><small>${t('cp.open')}</small></div><div><b>${bdi(rp + '%')}</b><small>${t('cp.reply')}</small></div><div><b>${bdi(c.leads)}</b><small>${t('cp.leads')}</small></div></div><div class="pbar"><i style="width:${rp * 3}%"></i></div></article>`;
  }
  function pgOutreach(ch) {
    ch = CHANNELS.includes(ch) ? ch : 'whatsapp';
    const cs = D.campaigns.filter(c => c.channel === ch), sum = k => cs.reduce((a, c) => a + c[k], 0), touched = D.leads.filter(l => l.lastCh === ch);
    const cand = D.leads.filter(l => l.stage !== 'converted').sort((a, b) => b.score - a.score);
    return head(`${icon(CH_IC[ch])} ${t('ch.' + ch)} ${t('or.out')}`, t('or.s.' + ch), `<button class="btn grad" data-act="addCamp" data-ch="${ch}">${icon('plus')} ${t('cp.new')}</button>`)
      + `<div class="kpis">${kpi('cp.sent', bdi(numF.format(sum('sent'))), null, '#7c3aed', 'send')}${kpi('cp.open', bdi(sum('sent') ? Math.round(sum('opened') / sum('sent') * 100) + '%' : '—'), null, '#2563eb', 'eye')}${kpi('cp.reply', bdi(sum('sent') ? Math.round(sum('replied') / sum('sent') * 100) + '%' : '—'), null, '#f59e0b', 'message')}${kpi('cp.leads', bdi(sum('leads')), null, '#16a34a', 'users')}</div>
      <div class="grid2"><div class="card"><div class="ch"><h4>${icon('sparkles', 'sm')} ${t('or.compose')}</h4></div><div class="form"><label>${t('ld.lead')}<select id="orLead">${cand.map(l => `<option value="${l.id}">${esc(nm(l.name))} — ${esc(nm(l.company))} (${l.score})</option>`).join('')}</select></label><button class="btn grad" data-act="writeOut2" data-ch="${ch}">${icon('sparkles')} ${t('or.write')}</button><div id="outbox"></div></div></div>
      <div class="card"><div class="ch"><h4>${t('or.campaigns')}</h4></div>${cs.map(c => `<div class="crow"><div><b>${esc(nm(c.name))}</b><small>${bdi(numF.format(c.sent))} ${t('cp.sent')} · ${bdi(c.replied)} ${t('cp.replies')}</small></div><span class="pill cps-${c.status}">${t('cp.' + c.status)}</span></div>`).join('') || `<p class="empty">${t('c.empty')}</p>`}
        <div class="ch mt"><h4>${t('or.recent')}</h4></div>${touched.slice(0, 5).map(l => `<div class="crow" data-act="lead" data-id="${l.id}">${avatar(l.name, 'sm')}<div><b>${esc(nm(l.name))}</b><small>${esc(nm(l.company))} · ${rel(l.touched)}</small></div>${stgTag(l.stage)}</div>`).join('') || `<p class="muted sm">${t('or.none')}</p>`}</div></div>`;
  }
  function outBox(l, ch, text, live) {
    const phone = (l.phone || '').replace(/\D/g, '');
    const href = ch === 'whatsapp' ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}` : ch === 'email' ? `mailto:${l.email || ''}?body=${encodeURIComponent(text)}` : ch === 'sms' ? `sms:${phone}?body=${encodeURIComponent(text)}` : '';
    return `<div class="draft">${live ? `<span class="livebadge">${t('c.live')}</span>` : ''}<div class="preview pv-${ch}"><small>${icon(CH_IC[ch], 'sm')} ${t('ch.' + ch)} · ${esc(nm(l.name))}</small><textarea id="outText" rows="7" aria-label="draft">${esc(text)}</textarea></div><div class="row-btns"><button class="btn outline sm" data-act="copy">${icon('copy', 'sm')} ${t('c.copy')}</button>${href ? `<a class="btn outline sm" href="${href}" target="_blank" rel="noopener">${icon('send', 'flip sm')} ${t('or.open')}</a>` : ''}<button class="btn grad sm" data-act="markSent" data-id="${l.id}" data-ch="${ch}">${icon('check', 'sm')} ${t('or.sent')}</button></div><p class="muted sm">${t('or.demo')}</p></div>`;
  }
  function pgCRM() {
    const due = D.leads.filter(l => ['contacted', 'qualified', 'proposal'].includes(l.stage)).sort((a, b) => (b.score + (Date.now() - b.touched) / DAY * 2) - (a.score + (Date.now() - a.touched) / DAY * 2));
    return head(t('sd.crm'), t('crm.s'), '') + `<div class="card"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>${t('ld.lead')}</th><th>${t('ld.stage')}</th><th>${t('ld.score')}</th><th class="hide-sm">${t('ld.touched')}</th><th class="hide-md">${t('crm.next')}</th><th></th></tr></thead><tbody>
      ${due.map(l => { const days = Math.round((Date.now() - l.touched) / DAY); return `<tr><td><span class="who" data-act="lead" data-id="${l.id}">${avatar(l.name, 'sm')}<span><b>${esc(nm(l.name))}</b><small>${esc(nm(l.company))}</small></span></span></td><td>${stgTag(l.stage)}</td><td>${scoreTag(l.score)}</td><td class="hide-sm ${days >= 3 ? 'late' : ''}">${rel(l.touched)}</td><td class="hide-md sm">${esc(fallbackScore(l).next_step)}</td><td class="nowrap"><button class="btn outline sm" data-act="lead" data-id="${l.id}">${icon('sparkles', 'sm')} <span class="hide-sm">${t('crm.follow')}</span></button> <button class="ibtn sm" data-act="touch" data-id="${l.id}" aria-label="${t('crm.done')}" title="${t('crm.done')}">${icon('check')}</button></td></tr>`; }).join('')}</tbody></table></div></div>`;
  }
  function pgClients() {
    const cl = D.leads.filter(l => l.stage === 'converted');
    return head(t('sd.clients'), t('cl.s'), `<span class="chip">${t('cl.total')}: ${sarH(cl.reduce((a, l) => a + l.value, 0))}</span>`) + `<div class="cgrid">${cl.map(l => `<article class="card ccard" data-act="lead" data-id="${l.id}"><div class="cc-h">${avatar(l.company, 'lg')}<div><b>${esc(nm(l.company))}</b><small>${esc(nm(l.name))} · ${t('ind.' + l.industry)}</small></div><span class="pill stg-converted">${t('stg.converted')}</span></div><div class="cstats"><div><b>${sarH(l.value)}</b><small>${t('ld.value')}</small></div><div><b>${t('city.' + l.city)}</b><small>${t('ld.city')}</small></div><div><b>${t('src.' + l.source)}</b><small>${t('ld.source')}</small></div></div></article>`).join('') || `<p class="empty">${t('c.empty')}</p>`}</div>`;
  }
  function pgTasks() {
    const list = D.tasks.filter(k => UI.tf === 'done' ? k.done : !k.done).sort((a, b) => a.due - b.due);
    return head(t('sd.tasks'), t('tk.s'), `<button class="btn grad" data-act="addTask">${icon('plus')} ${t('tk.add')}</button>`) + `<div class="tabs">${['open', 'done'].map(k => `<button class="${UI.tf === k ? 'on' : ''}" data-act="tf" data-v="${k}">${t('tk.f.' + k)} <em>${bdi(D.tasks.filter(x => k === 'done' ? x.done : !x.done).length)}</em></button>`).join('')}</div><div class="card"><ul class="tklist big">${list.map(taskRow).join('') || `<p class="empty">${t('c.empty')}</p>`}</ul></div>`;
  }
  function pgAppointments() {
    const days = {}; D.appts.slice().sort((a, b) => a.at - b.at).forEach(a => { const k = new Date(a.at).toDateString(); (days[k] = days[k] || []).push(a); });
    return head(t('sd.appointments'), t('ap.s'), `<button class="btn grad" data-act="book">${icon('plus')} ${t('ap.book')}</button>`) + `<div class="apdays">${Object.values(days).map(list => `<div class="card"><div class="ch"><h4>${dayF(list[0].at)}</h4><span class="chip">${bdi(list.length)}</span></div>${list.map(a => { const l = lead(a.lid); return l ? `<div class="crow"><span class="aptime">${bdi(timeF(a.at))}</span>${avatar(l.name, 'sm')}<div data-act="lead" data-id="${l.id}"><b>${esc(nm(l.name))}</b><small>${esc(nm(l.company))} · ${t('ap.' + a.type)}</small></div>${a.status === 'done' ? `<span class="pill stg-converted">${t('ap.done')}</span>` : `<button class="btn outline sm" data-act="apDone" data-id="${a.id}">${icon('check', 'sm')}</button>`}</div>` : ''; }).join('')}</div>`).join('')}</div>`;
  }
  function pgAnalytics() {
    const labels = [], vals = [], qv = [];
    for (let i = 5; i >= 0; i--) { const e = Date.now() - i * 5 * DAY, s = e - 5 * DAY; labels.push(dShort(e)); vals.push(D.leads.filter(l => l.created >= s && l.created < e).length); qv.push(D.leads.filter(l => l.created >= s && l.created < e && ['qualified', 'proposal', 'converted'].includes(l.stage)).length); }
    const rows = SOURCES.concat('ai').map(s => { const ls = D.leads.filter(l => l.source === s); return { s, n: ls.length, q: ls.filter(l => ['qualified', 'proposal', 'converted'].includes(l.stage)).length, c: ls.filter(l => l.stage === 'converted').length, v: ls.filter(l => l.stage === 'converted').reduce((a, l) => a + l.value, 0) }; }).filter(r => r.n);
    const won = D.leads.filter(l => l.stage === 'converted');
    return head(t('sd.analytics'), t('an.s'), `<button class="btn grad" data-act="export">${icon('download')} ${t('an.export')}</button>`)
      + `<div class="kpis">${kpi('an.k1', bdi(Math.round(qualified().length / D.leads.length * 100) + '%'), 6, '#7c3aed', 'funnel')}${kpi('an.k2', bdi(Math.round(won.length / D.leads.length * 100) + '%'), 4, '#16a34a', 'check')}${kpi('an.k3', sarH(won.reduce((a, l) => a + l.value, 0)), 21, '#f59e0b', 'dollar')}${kpi('an.k4', sarH(D.leads.filter(l => !['converted'].includes(l.stage)).reduce((a, l) => a + l.value, 0)), 12, '#0ea5e9', 'trend')}</div>
      <div class="grid2"><div class="card"><div class="ch"><h4>${t('an.trend')}</h4></div>${Charts.lines([{ vals, color: '#a855f7', name: t('an.new') }, { vals: qv, color: '#22c55e', name: t('an.q') }], labels)}<div class="legend"><span><i style="--c:#a855f7"></i>${t('an.new')}</span><span><i style="--c:#22c55e"></i>${t('an.q')}</span></div></div>
      <div class="card"><div class="ch"><h4>${t('an.src')}</h4></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>${t('ld.source')}</th><th>${t('an.leads')}</th><th>${t('an.qp')}</th><th>${t('an.won')}</th><th class="hide-sm">${t('an.rev')}</th></tr></thead><tbody>${rows.map(r => `<tr><td><span class="srcd" style="--c:${SRC_C[r.s]}"></span>${t('src.' + r.s)}</td><td>${bdi(r.n)}</td><td>${bdi(Math.round(r.q / r.n * 100) + '%')}</td><td>${bdi(r.c)}</td><td class="hide-sm nowrap">${sarH(r.v)}</td></tr>`).join('')}</tbody></table></div></div></div><p class="muted sm">${t('ft.note')}</p>`;
  }
  /* AI assistant */
  const ACHAT = { items: [], hist: [], busy: false };
  function pgAI() {
    if (!ACHAT.items.length) ACHAT.items.push({ who: 'bot', text: t('as.hello', { n: userName().split(' ')[0] }), at: Date.now(), chips: true });
    return head(`${icon('robot')} ${t('sd.ai')}`, t('as.s'), '') + `<div class="card aichat"><div class="wbody" id="abody">${aMsgs()}</div><form class="wcomp" data-form="asst"><input name="q" maxlength="400" autocomplete="off" placeholder="${t('as.ph')}" aria-label="${t('as.ph')}"><button class="sendb" type="submit" aria-label="${t('c.send')}">${icon('send', 'flip')}</button></form></div>`;
  }
  function aMsgs() { const last = ACHAT.items.length - 1; return ACHAT.items.map((m, i) => `<div class="wm ${m.who}">${m.live ? `<span class="livebadge">${t('c.live')}</span>` : ''}<p>${esc(m.text)}</p><small class="wt">${bdi(timeF(m.at))}</small></div>${i === last && m.chips ? `<div class="wchips">${[1, 2, 3, 4].map(k => `<button data-act="asChip" data-txt="${esc(t('as.q' + k))}">${t('as.q' + k)}</button>`).join('')}</div>` : ''}`).join('') + (ACHAT.busy ? '<div class="wm bot typing"><i></i><i></i><i></i></div>' : ''); }
  function aRender() { const b = $('#abody'); if (!b) return; b.innerHTML = aMsgs(); b.scrollTop = b.scrollHeight; }
  function pipeInfo() {
    const open = D.leads.filter(l => l.stage !== 'converted').sort((a, b) => b.score - a.score);
    return { today: new Date().toISOString().slice(0, 10), totals: Object.fromEntries(STAGES.map(s => [s, D.leads.filter(l => l.stage === s).length])), top_open_leads: open.slice(0, 15).map(l => Object.assign({ who: nm(l.name) }, leadInfo(l), { score: l.score })),
      campaigns: D.campaigns.map(c => ({ name: nm(c.name), channel: c.channel, status: c.status, sent: c.sent, replied: c.replied, leads: c.leads })), upcoming_appointments: D.appts.filter(a => a.at > Date.now()).slice(0, 6).map(a => ({ when: new Date(a.at).toISOString().slice(0, 16), lead: nm((lead(a.lid) || { name: '' }).name), type: a.type })), open_tasks: D.tasks.filter(k => !k.done).map(taskTitle) };
  }
  function aRule(q) {
    const s = AI.toLatin(q).toLowerCase(), open = D.leads.filter(l => l.stage !== 'converted').sort((a, b) => b.score - a.score);
    const line = l => `• ${nm(l.name)} — ${nm(l.company)} (${l.score}, ${t('stg.' + l.stage)})`;
    if (/call|today|priorit|اتصل|اليوم|أولوي|کال|آج|ترجیح|فون/.test(s)) return t('as.call', { list: open.filter(l => l.stage !== 'new').slice(0, 5).map(line).join('\n') });
    if (/channel|campaign|best|قناة|حملة|أفضل|چینل|کیمپین|بہترین/.test(s)) { const b = D.campaigns.filter(c => c.sent).sort((a, b) => b.replied / b.sent - a.replied / a.sent)[0]; return t('as.best', { ch: t('ch.' + b.channel), c: nm(b.name), r: Math.round(b.replied / b.sent * 100) }); }
    if (/convert|close|likely|proposal|تحويل|إغلاق|عرض|کنورٹ|بند|پروپوزل/.test(s)) { const ls = D.leads.filter(l => l.stage === 'proposal').sort((a, b) => b.score - a.score); return t('as.likely', { list: ls.map(line).join('\n'), v: sar(ls.reduce((a, l) => a + l.value, 0)) }); }
    if (/summar|pipeline|overview|ملخص|خط|خلاصہ|پائپ/.test(s)) return t('as.sum', Object.assign({ v: sar(open.reduce((a, l) => a + l.value, 0)) }, Object.fromEntries(STAGES.map(x => [x, D.leads.filter(l => l.stage === x).length]))));
    return null;
  }
  async function aAsk(text) {
    if (ACHAT.busy || !text.trim()) return;
    ACHAT.items.push({ who: 'me', text: text.trim(), at: Date.now() }); ACHAT.hist.push({ role: 'user', text: text.trim() }); ACHAT.busy = true; aRender();
    const r = await AI.assistant(ACHAT.hist, pipeInfo(), L(), agency()); ACHAT.busy = false;
    if (r) { ACHAT.items.push({ who: 'bot', text: r, live: true, at: Date.now() }); ACHAT.hist.push({ role: 'model', text: r }); }
    else { const rr = aRule(text); ACHAT.items.push({ who: 'bot', text: rr || t('as.generic'), at: Date.now(), chips: !rr }); }
    aRender();
  }
  function pgSettings() {
    return head(t('sd.settings'), t('se.s'), '') + `<div class="grid2 set"><form class="card form" data-form="profile"><h4>${t('se.profile')}</h4><label>${t('start.name')}<input name="name" maxlength="60" value="${esc(USER.name)}" required></label><label>${t('se.agency')}<input name="company" maxlength="80" value="${esc(USER.company || '')}" placeholder="LeadGen AI"></label><button class="btn grad" type="submit">${t('c.save')}</button></form>
      <div class="card"><h4>${t('se.look')}</h4><div class="seg"><button class="${PREFS.theme === 'dark' ? 'on' : ''}" data-act="setTheme" data-v="dark">${icon('moon')} ${t('se.dark')}</button><button class="${PREFS.theme === 'light' ? 'on' : ''}" data-act="setTheme" data-v="light">${icon('sun')} ${t('se.light')}</button></div>
        <h4>${t('se.lang')}</h4><div class="seg">${[['en', 'English'], ['ar', 'العربية'], ['ur', 'اردو']].map(l => `<button class="${L() === l[0] ? 'on' : ''}" data-act="lang" data-l="${l[0]}">${l[1]}</button>`).join('')}</div>
        <h4>${t('se.ai')}</h4><p class="aistat ${AI.live ? 'on' : ''}"><i></i>${AI.live ? t('se.aiOn') : t('se.aiOff')}</p><h4>${t('se.data')}</h4><p class="muted">${t('se.dataS')}</p><button class="btn danger" data-act="reset">${icon('refresh')} ${t('top.reset')}</button></div></div>`;
  }

  /* ================= ROUTER ================= */
  const PAGES = { dashboard: pgDashboard, leads: pgLeads, pipeline: pgPipeline, campaigns: pgCampaigns, outreach: pgOutreach, crm: pgCRM, clients: pgClients, tasks: pgTasks, appointments: pgAppointments, analytics: pgAnalytics, ai: pgAI, settings: pgSettings };
  function route() { const h = location.hash || '#/'; const m = h.match(/^#\/app\/?([a-z]*)\/?([a-z]*)/); if (m) return { app: true, page: m[1] || 'dashboard', sub: m[2] }; return { app: false }; }
  function render() {
    const r = route(), root = $('#root'), key = r.app ? r.page + r.sub : 'home';
    if (r.app && USER) { const pg = PAGES[r.page] ? r.page : 'dashboard'; root.innerHTML = shell(pg, r.sub, PAGES[pg](r.sub)); document.body.className = 'in-app'; const ab = $('#abody'); if (ab) ab.scrollTop = ab.scrollHeight; }
    else { root.innerHTML = landing(); document.body.className = 'in-land'; if (r.app) setTimeout(startModal, 30); const cb = $('#cbody'); if (cb) cb.scrollTop = cb.scrollHeight; }
    if (render._k !== key) window.scrollTo(0, 0); render._k = key;
  }
  window.addEventListener('hashchange', () => { UI.sidebar = false; UI.menus = null; closeDrawer(); closeModal(); render(); });
  function startModal(pre) {
    modal(t('start.t'), `<p class="muted">${t('start.s')}</p><form class="form" data-form="start" novalidate><label>${t('start.name')} *<input name="name" required maxlength="60" autocomplete="name" value="${esc(pre || '')}"></label><label>${t('start.email')} *<input name="email" type="email" required maxlength="120" autocomplete="email"></label>
      <div class="row2"><label>${t('se.agency')}<input name="company" maxlength="80"></label><label>${t('start.wa')}<input name="whatsapp" type="tel" maxlength="25"></label></div><p class="err" hidden>${t('start.req')}</p>
      <button class="btn grad block lg" type="submit">${t('start.go')} ${icon('arrowRight', 'flip')}</button><p class="muted sm c">${icon('shield', 'sm')} ${t('start.privacy')}</p></form>`, 'narrow');
  }

  /* ================= EVENTS ================= */
  function globalSearch(q) {
    const box = $('#sres'); if (!box) return; q = q.trim().toLowerCase(); if (q.length < 2) { box.classList.remove('open'); return; }
    const ls = D.leads.filter(l => [l.name.en, l.name.ar, l.name.ur, l.company.en, l.company.ar, l.company.ur].join(' ').toLowerCase().includes(q)).slice(0, 6);
    const cs = D.campaigns.filter(c => [c.name.en, c.name.ar, c.name.ur].join(' ').toLowerCase().includes(q)).slice(0, 3);
    box.innerHTML = (ls.map(l => `<button data-act="lead" data-id="${l.id}">${avatar(l.name, 'sm')}<span>${esc(nm(l.name))} · ${esc(nm(l.company))}</span>${scoreTag(l.score)}</button>`).join('') + cs.map(c => `<button data-act="go" data-h="#/app/campaigns">${icon(CH_IC[c.channel])}<span>${esc(nm(c.name))}</span><small>${t('sd.campaigns')}</small></button>`).join('')) || `<p class="empty">${t('c.empty')}</p>`;
    box.classList.add('open');
  }
  const closeMenus = () => { UI.menus = null; $$('.dd.open').forEach(d => d.classList.remove('open')); };
  function moveLead(id, s) { const l = lead(id); if (!l || l.stage === s) return; l.stage = s; l.touched = Date.now(); log(s === 'converted' ? 'act.client' : 'act.stage', { l: id, s }, s === 'converted' ? 'user' : 'kanban'); save(); render(); toast(t('pp.moved', { s: t('stg.' + s) })); }
  document.addEventListener('click', async ev => {
    const a = ev.target.closest('[data-act]');
    if (!a && ev.pointerType && ev.pointerType !== 'mouse') { const kc = ev.target.closest('.kcard'); if (kc) { leadDrawer(kc.dataset.id); return; } }
    if (!a || a.tagName === 'SELECT' || (a.tagName === 'INPUT' && !['checkbox'].includes(a.type))) { if (UI.menus && !ev.target.closest('.dd')) closeMenus(); if (!ev.target.closest('#gsearch')) { const b = $('#sres'); if (b) b.classList.remove('open'); } return; }
    if (a.tagName === 'INPUT') return;
    const act = a.dataset.act, id = a.dataset.id;
    if (!['menu', 'lang'].includes(act) && UI.menus) closeMenus();
    const sres = $('#sres'); if (sres) sres.classList.remove('open');
    switch (act) {
      case 'menu': ev.preventDefault(); UI.menus = UI.menus === id ? null : id; $$('.dd').forEach(d => d.classList.toggle('open', d.contains(a) && !!UI.menus)); break;
      case 'lang': PREFS.lang = a.dataset.l; savePrefs(); I18N.set(a.dataset.l); UI.menus = null; render(); break;
      case 'theme': PREFS.theme = PREFS.theme === 'dark' ? 'light' : 'dark'; savePrefs(); document.documentElement.dataset.theme = PREFS.theme; render(); break;
      case 'setTheme': PREFS.theme = a.dataset.v; savePrefs(); document.documentElement.dataset.theme = PREFS.theme; render(); break;
      case 'start': ev.preventDefault(); closeModal(); if (USER) location.hash = '#/app/dashboard'; else startModal(); break;
      case 'scroll': { ev.preventDefault(); const n = $('.lnav'); if (n) n.classList.remove('open'); const el = $(a.getAttribute('href')); if (el) el.scrollIntoView({ behavior: 'smooth' }); break; }
      case 'lnav': $('.lnav').classList.toggle('open'); break;
      case 'closeModal': closeModal(); break;
      case 'closeDrawer': closeDrawer(); break;
      case 'nav': UI.sidebar = false; break;
      case 'go': location.hash = a.dataset.h; break;
      case 'sidebar': UI.sidebar = !UI.sidebar; $('.app') && $('.app').classList.toggle('sb-open', UI.sidebar); break;
      case 'outToggle': UI.outOpen = !UI.outOpen; if (route().page !== 'outreach') location.hash = '#/app/outreach/whatsapp'; else render(); break;
      case 'logout': USER = null; try { localStorage.removeItem(UKEY); localStorage.removeItem(KEY); } catch (e) {} D = SEED.seed(); save(); Object.assign(CAP, { step: 0, data: {}, items: [] }); ACHAT.items = []; ACHAT.hist = []; location.hash = '#/'; render(); break;
      case 'reset': if (confirm(t('top.reset') + '?')) { D = SEED.seed(); save(); toast(t('se.resetDone')); render(); } break;
      case 'markRead': D.notifs.forEach(n => n.read = true); save(); render(); break;
      // capture chat
      case 'capOpen': CAP.open = true; $('.wpanel') && $('.wpanel').classList.add('open'); $('.capfab') && $('.capfab').classList.add('hide'); capRender(); { const i = $('.wcomp input'); if (i && matchMedia('(pointer:fine)').matches) i.focus(); } break;
      case 'capClose': CAP.open = false; $('.wpanel').classList.remove('open'); $('.capfab').classList.remove('hide'); break;
      case 'capPick': capAnswer(a.dataset.v, a.dataset.l); break;
      case 'capDash': CAP.open = false; if (USER) location.hash = '#/app/pipeline'; else startModal(CAP.data.name); break;
      // leads
      case 'lead': ev.stopPropagation(); closeModal(); leadDrawer(id); break;
      case 'addLead': modal(t('ld.add'), leadForm()); break;
      case 'delLead': if (confirm(t('c.confirmDel'))) { D.leads = D.leads.filter(l => l.id !== id); save(); closeDrawer(); toast(t('c.deleted')); render(); } break;
      case 'convert': { closeDrawer(); moveLead(id, 'converted'); break; }
      case 'view': UI.view = a.dataset.v; render(); break;
      case 'rescore': {
        const l = lead(id); a.disabled = true; a.innerHTML = `<span class="spin"></span> ${t('c.thinking')}`;
        const r = await AI.score(leadInfo(l), L(), agency()); const sc = r || fallbackScore(l);
        l.score = sc.score; l.ai = { reason: sc.reason, next: sc.next_step }; save(); render(); leadDrawer(id); toast(r ? t('ld.scored') : t('ld.scoredRule')); break;
      }
      case 'writeOut': case 'writeOut2': {
        const lid = id || ($('#orLead') || {}).value, l = lead(lid), ch = a.dataset.ch, box = $('#outbox'); if (!l) return;
        box.innerHTML = `<p class="muted sm"><span class="spin"></span> ${t('c.thinking')}</p>`; a.disabled = true;
        const r = await AI.outreach(Object.assign({ channel: ch }, leadInfo(l)), L(), agency()); a.disabled = false;
        box.innerHTML = outBox(l, ch, r || outreachFallback(l, ch), !!r); break;
      }
      case 'copy': { const v = $('#outText').value; try { await navigator.clipboard.writeText(v); } catch (e) {} toast(t('c.copied')); break; }
      case 'markSent': { const l = lead(id), ch = a.dataset.ch; l.touched = Date.now(); l.lastCh = ch; if (l.stage === 'new') l.stage = 'contacted'; const c = D.campaigns.find(x => x.channel === ch && x.status === 'active'); if (c) c.sent++; log('act.sent', { l: id, ch }, CH_IC[ch]); save(); toast(t('or.sentT')); const inDrawer = !!$('#drawer.open'); render(); if (inDrawer) leadDrawer(id); break; }
      case 'finder': closeDrawer(); finderModal(); break;
      case 'fdAdd': {
        const sel = $$('.fdlist input:checked').map(i => UI.finder.list[+i.dataset.i]); if (!sel.length) return;
        sel.forEach(x => { const tr = v => typeof v === 'string' ? { en: v, ar: v, ur: v } : v; D.leads.unshift({ id: 'L' + (D.seq++), name: tr(x.contact), company: tr(x.company), industry: UI.finder.ind, city: UI.finder.city, source: 'ai', stage: 'new', score: x.score, value: 5000 + Math.round(x.score / 10) * 1000, need: UI.finder.need, owner: 't2', phone: '', email: '', created: Date.now(), touched: Date.now(), ai: { reason: x.why, next: x.next_step } }); });
        log('act.found', { n: sel.length, ch: 'ai' }, 'radar'); save(); closeModal(); toast(t('fd.added', { n: sel.length })); location.hash = '#/app/pipeline'; render(); break;
      }
      case 'touch': { const l = lead(id); l.touched = Date.now(); save(); toast(t('crm.doneT')); render(); break; }
      case 'campToggle': { const c = D.campaigns.find(x => x.id === id); c.status = c.status === 'active' ? 'paused' : 'active'; save(); render(); break; }
      case 'addCamp': modal(t('cp.new'), `<form class="form" data-form="camp" novalidate><label>${t('cp.name')} *<input name="name" required maxlength="60"></label><label>${t('cp.channel')}<select name="channel">${CHANNELS.map(c => `<option value="${c}" ${a.dataset.ch === c ? 'selected' : ''}>${t('ch.' + c)}</option>`).join('')}</select></label><div class="mfoot"><button type="button" class="btn outline" data-act="closeModal">${t('c.cancel')}</button><button class="btn grad" type="submit">${t('c.save')}</button></div></form>`, 'narrow'); break;
      case 'toggleTask': { const k = D.tasks.find(x => x.id === id); k.done = !k.done; save(); render(); if (k.done) toast(t('tk.doneT')); break; }
      case 'tf': UI.tf = a.dataset.v; render(); break;
      case 'addTask': modal(t('tk.add'), `<form class="form" data-form="task" novalidate><label>${t('tk.title')} *<input name="text" required maxlength="90"></label><label>${t('ap.when')}<input name="due" type="datetime-local" value="${new Date(Date.now() + DAY - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}"></label><div class="mfoot"><button type="button" class="btn outline" data-act="closeModal">${t('c.cancel')}</button><button class="btn grad" type="submit">${t('c.save')}</button></div></form>`, 'narrow'); break;
      case 'book': modal(t('ap.book'), `<form class="form" data-form="appt" novalidate><label>${t('ld.lead')}<select name="lid">${D.leads.filter(l => l.stage !== 'converted').sort((a, b) => b.score - a.score).map(l => `<option value="${l.id}" ${l.id === id ? 'selected' : ''}>${esc(nm(l.name))} — ${esc(nm(l.company))}</option>`).join('')}</select></label><div class="row2"><label>${t('ap.when')}<input name="at" type="datetime-local" required value="${new Date(Date.now() + DAY - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 13)}:00"></label><label>${t('ap.type')}<select name="type"><option value="call">${t('ap.call')}</option><option value="demo">${t('ap.demo')}</option></select></label></div><div class="mfoot"><button type="button" class="btn outline" data-act="closeModal">${t('c.cancel')}</button><button class="btn grad" type="submit">${t('c.save')}</button></div></form>`, 'narrow'); break;
      case 'apDone': { const ap = D.appts.find(x => x.id === id); ap.status = 'done'; save(); render(); break; }
      case 'export': exportCSV(); break;
      case 'asChip': aAsk(a.dataset.txt); break;
    }
  });
  document.addEventListener('change', ev => {
    const a = ev.target.closest('[data-act]'); if (!a) return; const act = a.dataset.act;
    if (act === 'src') { UI.src = a.value; render(); }
    else if (act === 'fs') { UI.fs = a.value; render(); }
    else if (act === 'fi') { UI.fi = a.value; render(); }
    else if (act === 'lstage') { const id = a.dataset.id; closeDrawer(); moveLead(id, a.value); leadDrawer(id); }
    else if (act === 'lowner') { const l = lead(a.dataset.id); l.owner = a.value; save(); toast(t('c.saved')); }
  });
  let qT;
  document.addEventListener('input', ev => {
    const a = ev.target.closest('[data-act]'); if (!a) return;
    if (a.dataset.act === 'gsearch') globalSearch(a.value);
    if (a.dataset.act === 'lq') { clearTimeout(qT); qT = setTimeout(() => { UI.q = a.value; const pos = a.selectionStart; render(); const n = $('[data-act="lq"]'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) {} } }, 220); }
  });
  document.addEventListener('keydown', ev => { if (ev.key === 'Escape') { if ($('#modal.open')) closeModal(); else if ($('#drawer.open')) closeDrawer(); else if (CAP.open) { CAP.open = false; const w = $('.wpanel'); if (w) { w.classList.remove('open'); $('.capfab').classList.remove('hide'); } } } });
  document.addEventListener('submit', async ev => {
    const f = ev.target.closest('[data-form]'); if (!f) return; ev.preventDefault();
    const fd = Object.fromEntries(new FormData(f).entries()), kind = f.dataset.form;
    if (kind === 'cap') { const v = f.q.value.trim(); if (!v) return; f.q.value = ''; return capAnswer(v); }
    if (kind === 'asst') { const v = f.q.value; f.q.value = ''; return aAsk(v); }
    const bad = $$('[required]', f).filter(i => !String(i.value).trim() || (i.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(i.value)));
    $$('.invalid', f).forEach(i => i.classList.remove('invalid')); bad.forEach(i => i.classList.add('invalid'));
    if (bad.length) { const er = $('.err', f); if (er) er.hidden = false; else toast(t('c.required'), 'err'); bad[0].focus(); return; }
    switch (kind) {
      case 'start': USER = { name: fd.name.trim(), email: fd.email.trim(), company: (fd.company || '').trim(), whatsapp: (fd.whatsapp || '').trim() }; lsSet(UKEY, USER);
        sendForm({ _subject: 'New LeadGen AI demo visitor: ' + USER.name, name: USER.name, email: USER.email, company: USER.company, whatsapp: USER.whatsapp, language: L(), demo: 'LeadGen AI lead generation dashboard' }); closeModal(); CAP.open = false;
        location.hash = CAP.step >= CAP_STEPS.length ? '#/app/pipeline' : '#/app/dashboard'; render(); break;
      case 'contact': sendForm({ _subject: 'LeadGen AI demo — contact form: ' + fd.name, name: fd.name, whatsapp: fd.whatsapp, business: fd.business, message: fd.message, language: L() }); f.reset(); toast(t('ct.sent')); break;
      case 'lead': { const l = { id: 'L' + (D.seq++), name: { en: fd.name.trim(), ar: fd.name.trim(), ur: fd.name.trim() }, company: { en: fd.company.trim(), ar: fd.company.trim(), ur: fd.company.trim() }, industry: fd.industry, city: fd.city, source: fd.source, stage: 'new', score: 50, value: +fd.value || 0, need: fd.need, owner: 't1', phone: fd.phone || '', email: '', created: Date.now(), touched: Date.now() }; l.score = fallbackScore(l).score; D.leads.unshift(l); log('act.added', { l: l.id }, 'userPlus'); save(); closeModal(); toast(t('c.saved')); render(); break; }
      case 'finder': {
        const out = $('#fdout'), btn = f.querySelector('button[type=submit]'); btn.disabled = true;
        UI.finder = { ind: fd.industry, city: fd.city, need: fd.need, list: [] };
        const steps = ['fd.st1', 'fd.st2', 'fd.st3']; let si = 0; out.innerHTML = `<p class="scan"><span class="spin"></span> ${t(steps[0])}</p>`; const tick = setInterval(() => { si = Math.min(si + 1, 2); const p = $('.scan'); if (p) p.innerHTML = `<span class="spin"></span> ${t(steps[si])}`; }, 1300);
        const r = await AI.finder({ industry: I18N.dicts.en['ind.' + fd.industry], city: I18N.dicts.en['city.' + fd.city], service_we_sell: I18N.dicts.en['need.' + fd.need], count: 5 }, L(), agency());
        clearInterval(tick); btn.disabled = false;
        const list = r && r.length ? r : finderFallback(fd.industry, fd.city, fd.need); UI.finder.list = list; out.innerHTML = finderResults(list, !!(r && r.length)); break;
      }
      case 'camp': D.campaigns.unshift({ id: uid('C'), name: { en: fd.name.trim(), ar: fd.name.trim(), ur: fd.name.trim() }, channel: fd.channel, status: 'draft', sent: 0, opened: 0, replied: 0, leads: 0, start: Date.now() }); save(); closeModal(); toast(t('c.saved')); render(); break;
      case 'task': D.tasks.push({ id: uid('k'), type: 'custom', text: fd.text.trim(), lid: null, due: new Date(fd.due).getTime() || Date.now() + DAY, done: false }); save(); closeModal(); toast(t('c.saved')); render(); break;
      case 'appt': { const at = new Date(fd.at).getTime(); D.appts.push({ id: uid('a'), lid: fd.lid, at, type: fd.type, status: 'booked' }); const l = lead(fd.lid); if (l && ['new', 'contacted'].includes(l.stage)) l.stage = 'qualified'; log('act.booked', { n: 1 }, 'calendar'); save(); closeModal(); closeDrawer(); toast(t('ap.bookedT')); render(); break; }
      case 'profile': USER.name = fd.name.trim(); USER.company = (fd.company || '').trim(); lsSet(UKEY, USER); toast(t('c.saved')); render(); break;
    }
  });
  /* kanban drag (mouse anywhere on card, touch via grip) */
  let drag = null;
  document.addEventListener('pointerdown', ev => {
    const card = ev.target.closest('.kcard'); if (!card || ev.target.closest('select,button,a')) return;
    if (ev.pointerType !== 'mouse' && !ev.target.closest('.grip')) return;
    ev.preventDefault(); const r = card.getBoundingClientRect(), sx = ev.clientX, sy = ev.clientY;
    drag = { id: card.dataset.id, card, dx: sx - r.left, dy: sy - r.top, moved: false, ghost: null };
    const mv = e => { if (!drag.moved && Math.hypot(e.clientX - sx, e.clientY - sy) < 6) return; if (!drag.ghost) { drag.ghost = card.cloneNode(true); drag.ghost.classList.add('ghost'); drag.ghost.style.width = r.width + 'px'; document.body.appendChild(drag.ghost); card.classList.add('dragging'); } drag.moved = true; drag.ghost.style.transform = `translate(${e.clientX - drag.dx}px,${e.clientY - drag.dy}px)`; $$('.kcol').forEach(c => c.classList.remove('over')); const el = document.elementFromPoint(e.clientX, e.clientY); const col = el && el.closest('.kcol'); if (col) col.classList.add('over'); };
    const up = e => { document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); const d = drag; drag = null; if (d.ghost) d.ghost.remove(); card.classList.remove('dragging'); $$('.kcol').forEach(c => c.classList.remove('over')); if (!d.moved) { leadDrawer(d.id); return; } const el = document.elementFromPoint(e.clientX, e.clientY); const col = el && el.closest('.kcol'); if (col) moveLead(d.id, col.dataset.col); };
    document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up);
  });
  function exportCSV() {
    const rows = [['Lead', 'Company', 'Industry', 'City', 'Source', 'Stage', 'AI score', 'Value SAR', 'Created']].concat(D.leads.map(l => [l.name.en, l.company.en, l.industry, l.city, l.source, l.stage, l.score, l.value, new Date(l.created).toISOString().slice(0, 10)]));
    const csv = '﻿' + rows.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'leadgen-leads-sample.csv'; document.body.appendChild(a); a.click(); a.remove(); toast(t('an.done'));
  }
  render(); AI.health().then(() => { if (route().page === 'settings') render(); });
  window.__LG = { get D() { return D; }, CAP, ACHAT, render };
})();
