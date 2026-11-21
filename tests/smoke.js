// Smoke tests: node tests/smoke.js [baseUrl]
const { chromium } = require('playwright');
const BASE = process.argv[2] || 'http://localhost:4177/';
let pass = 0, fail = 0; const ok = (c, m) => { if (c) { pass++; console.log('  ✓ ' + m); } else { fail++; console.log('  ✗ ' + m); } };
const botDone = (p, n) => p.waitForFunction(n => document.querySelectorAll('#abody .wm.bot:not(.typing)').length >= n, n, { timeout: 30000 });
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1366, height: 860 }, acceptDownloads: true }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  const mails = []; await p.route('https://formsubmit.co/**', r => { mails.push(r.request().postDataJSON()); r.fulfill({ status: 200, body: '{"success":"true"}', contentType: 'application/json' }); });
  await p.goto(BASE); await p.evaluate(() => localStorage.clear()); await p.reload();
  for (const l of ['en', 'ar', 'ur']) { await p.evaluate(l => localStorage.setItem('leadgen_prefs', JSON.stringify({ lang: l })), l); await p.reload(); ok(await p.locator('html').getAttribute('dir') === (l === 'en' ? 'ltr' : 'rtl') && await p.locator('.hero h1').isVisible() && await p.locator('.fcard').count() === 8 && await p.locator('.robot').count() === 1, 'landing renders in ' + l); }
  await p.evaluate(() => localStorage.setItem('leadgen_prefs', JSON.stringify({ lang: 'en' }))); await p.reload();
  // contact form
  await p.click('[data-form=contact] button[type=submit]'); ok(await p.locator('[data-form=contact] .invalid').count() === 2, 'contact form validates');
  await p.fill('[data-form=contact] [name=name]', 'Lead Test'); await p.fill('[data-form=contact] [name=whatsapp]', '0500000000'); await p.click('[data-form=contact] button[type=submit]'); await p.waitForTimeout(300);
  ok(mails.some(m => m.name === 'Lead Test'), 'contact form → email');
  // AI lead capture chat
  await p.click('.capfab'); ok(await p.locator('.wpanel.open').isVisible(), 'capture chat opens');
  const say = async v => { await p.fill('[data-form=cap] input', v); await p.press('[data-form=cap] input', 'Enter'); };
  await say('Faisal Test'); await say('Test Dental Care');
  await p.click('#cchips [data-v=dental]'); await p.click('#cchips [data-v=jeddah]'); await p.click('#cchips [data-v=whatsapp]'); await p.click('#cchips [data-v=b2]'); await p.click('#cchips button');
  await p.waitForSelector('.capsum', { timeout: 30000 });
  ok(await p.evaluate(() => { const l = window.__LG.D.leads[0]; return l.visitor && l.company.en === 'Test Dental Care' && l.industry === 'dental' && l.city === 'jeddah' && l.score > 0; }), 'capture chat creates scored lead');
  ok(mails.some(m => m.business === 'Test Dental Care'), 'captured lead emailed to agency');
  // start gate from capture
  await p.click('[data-act=capDash]'); await p.waitForSelector('[data-form=start]'); ok(await p.inputValue('[data-form=start] [name=name]') === 'Faisal Test', 'start form prefilled from chat');
  ok(!(await p.locator('.lampscene').evaluate(e => e.classList.contains('lit'))), 'lamp login starts dark');
  { const h = await p.locator('.lampscene .handle').boundingBox(); await p.mouse.move(h.x + 9, h.y + 10); await p.mouse.down(); await p.mouse.move(h.x + 9, h.y + 90, { steps: 8 }); await p.mouse.up(); await p.waitForTimeout(900); }
  ok(await p.locator('.lampscene').evaluate(e => e.classList.contains('lit')), 'pulling cord turns lamp on');
  await p.click('[data-act=lampTab][data-v=up]'); await p.waitForTimeout(300); ok(await p.locator('.lampscene').evaluate(e => getComputedStyle(e).getPropertyValue('--lc').trim() === '#f472b6'), 'sign up tab changes light colour');
  ok(await p.inputValue('[data-form=start] [name=name]') === 'Faisal Test', 'name kept across tabs');
  await p.click('[data-act=lampTab][data-v=in]'); await p.waitForTimeout(300);
  await p.click('[data-form=start] button[type=submit]'); ok(await p.locator('[data-form=start] .invalid').count() === 1, 'start gate validates email');
  await p.fill('[data-form=start] [name=email]', 'v@example.com'); await p.click('[data-form=start] button[type=submit]');
  await p.waitForSelector('.kanban'); ok(location => true, ''); ok(await p.locator('.kcol[data-col=new] .pill.you').count() === 1, 'visitor appears in New column as "You"');
  ok(mails.some(m => m.email === 'v@example.com'), 'demo visitor emailed');
  // dashboard
  await p.goto(BASE + '#/app/dashboard'); ok(await p.locator('.kpi').count() === 4 && await p.locator('.kcol').count() === 5 && await p.locator('.funnel .fr').count() === 5 && await p.locator('.chart.donut').count() === 1, 'dashboard KPIs, pipeline, funnel, donut');
  ok(await p.locator('.ins li').count() === 4 && await p.locator('.tklist li').count() > 0, 'AI insights + upcoming tasks');
  await p.click('.tklist [data-act=toggleTask] >> nth=0'); ok(await p.evaluate(() => window.__LG.D.tasks.filter(k => k.done).length === 1), 'tick task');
  // drag new → qualified
  const id = await p.locator('.kcol[data-col=new] .kcard').nth(1).getAttribute('data-id');
  await p.locator(`.kcard[data-id="${id}"]`).scrollIntoViewIfNeeded(); const from = await p.locator(`.kcard[data-id="${id}"] .kmeta`).boundingBox(), to = await p.locator('.kcol[data-col=qualified] header').boundingBox();
  await p.mouse.move(from.x + 10, from.y + 4); await p.mouse.down(); await p.mouse.move(to.x + 60, from.y + 4, { steps: 10 }); await p.mouse.up();
  ok(await p.evaluate(id => window.__LG.D.leads.find(l => l.id === id).stage === 'qualified', id), 'kanban drag New → Qualified');
  await p.click(`.kcard[data-id="${id}"] .kmeta`); ok(await p.locator('.scorebox').isVisible(), 'click card opens lead');
  await p.click('[data-act=rescore]'); await p.waitForSelector('.scorebox', { timeout: 30000 }); ok(true, 'AI re-score');
  await p.click('.chb[data-ch=whatsapp]'); await p.waitForSelector('#outText', { timeout: 30000 }); ok((await p.inputValue('#outText')).length > 30, 'AI WhatsApp outreach draft');
  await p.click('[data-act=markSent]'); ok(await p.evaluate(id => window.__LG.D.leads.find(l => l.id === id).lastCh === 'whatsapp', id), 'mark outreach sent');
  await p.selectOption('[data-act=lstage]', 'proposal'); ok(await p.evaluate(id => window.__LG.D.leads.find(l => l.id === id).stage === 'proposal', id), 'change stage in drawer');
  await p.click('[data-act=book]'); await p.click('[data-form=appt] button[type=submit]'); ok(await p.evaluate(id => window.__LG.D.appts.some(a => a.lid === id), id), 'book appointment');
  // AI lead finder
  const before = await p.evaluate(() => window.__LG.D.leads.length);
  await p.goto(BASE + '#/app/leads'); await p.click('.phead [data-act=finder]'); await p.selectOption('[data-form=finder] [name=industry]', 'realestate'); await p.click('[data-form=finder] button[type=submit]');
  await p.waitForSelector('.fdlist li', { timeout: 30000 }); ok(await p.locator('.fdlist li').count() === 5, 'AI finder returns 5 sample leads');
  await p.click('.fdlist input >> nth=0'); await p.click('[data-act=fdAdd]'); ok(await p.evaluate(b => window.__LG.D.leads.length === b + 4 && window.__LG.D.leads[0].source === 'ai', before), 'add selected finder leads to pipeline');
  // leads page
  await p.goto(BASE + '#/app/leads'); await p.selectOption('[data-act=fs]', 'converted'); ok(await p.locator('.tbl tbody tr').count() === 6, 'filter leads by stage'); await p.selectOption('[data-act=fs]', '');
  await p.click('.phead [data-act=addLead]'); await p.fill('[data-form=lead] [name=name]', 'Manual Lead'); await p.fill('[data-form=lead] [name=company]', 'Manual Co'); await p.click('[data-form=lead] button[type=submit]');
  ok(await p.evaluate(() => window.__LG.D.leads[0].company.en === 'Manual Co'), 'add lead');
  await p.click('[data-act=view][data-v=list]').catch(() => {});
  for (const pg of ['pipeline', 'campaigns', 'outreach/whatsapp', 'outreach/email', 'outreach/linkedin', 'outreach/facebook', 'outreach/sms', 'crm', 'clients', 'tasks', 'appointments', 'analytics', 'ai', 'settings']) { await p.goto(BASE + '#/app/' + pg); ok(await p.locator('.phead h1').isVisible(), 'page ' + pg); }
  await p.goto(BASE + '#/app/pipeline'); await p.click('[data-act=view][data-v=list]'); ok(await p.locator('.tbl tbody tr').count() > 40, 'pipeline list view'); await p.click('[data-act=view][data-v=kanban]');
  await p.goto(BASE + '#/app/campaigns'); await p.click('[data-act=campToggle] >> nth=0'); ok(await p.evaluate(() => window.__LG.D.campaigns[0].status === 'paused'), 'toggle campaign');
  await p.click('.phead [data-act=addCamp]'); await p.fill('[data-form=camp] [name=name]', 'Test Camp'); await p.click('[data-form=camp] button[type=submit]'); ok(await p.evaluate(() => window.__LG.D.campaigns[0].name.en === 'Test Camp'), 'add campaign');
  await p.goto(BASE + '#/app/outreach/email'); await p.click('[data-act=writeOut2]'); await p.waitForSelector('#outText', { timeout: 30000 }); ok((await p.inputValue('#outText')).includes('Subject'), 'email outreach with subject');
  await p.goto(BASE + '#/app/crm'); const t0 = await p.evaluate(() => window.__LG.D.leads.filter(l => Date.now() - l.touched < 5000).length); await p.click('[data-act=touch] >> nth=0'); ok(await p.evaluate(t0 => window.__LG.D.leads.filter(l => Date.now() - l.touched < 8000).length === t0 + 1, t0), 'CRM follow-up logged');
  await p.goto(BASE + '#/app/tasks'); await p.click('.phead [data-act=addTask]'); await p.fill('[data-form=task] [name=text]', 'My test task'); await p.click('[data-form=task] button[type=submit]'); ok(await p.locator('.tklist').textContent().then(x => x.includes('My test task')), 'add task');
  await p.goto(BASE + '#/app/appointments'); await p.click('[data-act=apDone] >> nth=0'); ok(await p.evaluate(() => window.__LG.D.appts.filter(a => a.status === 'done').length === 3), 'mark appointment done');
  await p.goto(BASE + '#/app/analytics'); const dl = p.waitForEvent('download'); await p.click('.phead [data-act=export]'); ok(!!(await dl), 'CSV export');
  await p.goto(BASE + '#/app/ai'); await p.click('#abody .wchips button >> nth=0'); await botDone(p, 2); ok((await p.locator('#abody .wm.bot').nth(1).textContent()).includes('•'), 'AI assistant: who to call');
  await p.fill('[data-form=asst] input', 'summarize my pipeline'); await p.press('[data-form=asst] input', 'Enter'); await botDone(p, 3); ok((await p.locator('#abody .wm.bot').nth(2).textContent()).includes('SAR'), 'AI assistant: pipeline summary');
  await p.fill('.top .search input', 'dental'); ok(await p.locator('#sres.open button').count() > 0, 'global search');
  await p.click('[data-act=theme]'); ok(await p.locator('html').getAttribute('data-theme') === 'light', 'theme toggle'); await p.click('[data-act=theme]');
  await p.click('[data-act=menu][data-id=user]'); await p.click('.ddm [data-act=logout]'); ok(await p.locator('.hero').isVisible(), 'logout');
  for (const w of [360, 390, 768]) for (const l of ['en', 'ar', 'ur']) {
    const m = await b.newContext({ viewport: { width: w, height: 800 } }); const q = await m.newPage(); q.on('pageerror', e => errs.push(e.message));
    await q.goto(BASE); await q.evaluate(l => { localStorage.setItem('leadgen_prefs', JSON.stringify({ lang: l })); localStorage.setItem('leadgen_user', JSON.stringify({ name: 'A Very Long Visitor Name', email: 'a@b.co' })); }, l);
    const bad = [];
    for (const h of ['', '#/app/dashboard', '#/app/leads', '#/app/pipeline', '#/app/campaigns', '#/app/outreach/whatsapp', '#/app/crm', '#/app/clients', '#/app/tasks', '#/app/appointments', '#/app/analytics', '#/app/ai', '#/app/settings']) {
      await q.goto(BASE + h); await q.reload(); await q.waitForTimeout(100); const o = await q.evaluate(() => document.documentElement.scrollWidth - innerWidth); if (o > 0) bad.push(h + ':' + o);
    }
    await q.goto(BASE); await q.reload(); await q.click('.capfab'); const o3 = await q.evaluate(() => document.documentElement.scrollWidth - innerWidth); if (o3 > 0) bad.push('cap:' + o3);
    ok(!bad.length, `no overflow ${w}px ${l} ${bad.join(' ')}`); await m.close();
  }
  ok(!errs.length, 'no JS errors ' + errs.join(' | '));
  console.log(`\n${pass} passed, ${fail} failed`); await b.close(); process.exit(fail ? 1 : 0);
})();
