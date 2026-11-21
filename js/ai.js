/* LeadGen AI — /api/chat (Gemini → Groq). Returns null on failure; app.js supplies rule-based fallbacks. */
(function () {
  const AI = { live: null };
  async function post(body) {
    const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), 22000);
    try {
      const r = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: ctrl.signal });
      if (!r.ok) throw new Error('http'); const j = await r.json(); if (!j || j.fallback || !j.data) throw new Error('fallback');
      AI.live = true; return j.data;
    } finally { clearTimeout(to); }
  }
  const safe = fn => async (...a) => { try { return await fn(...a); } catch (e) { return null; } };
  AI.health = async () => { try { const j = await (await fetch('/api/health')).json(); AI.live = !!j.ai; } catch (e) { AI.live = false; } return AI.live; };
  AI.finder = safe(async (info, lang, agency) => (await post({ mode: 'finder', lang, agency, info })).leads);
  AI.outreach = safe(async (info, lang, agency) => (await post({ mode: 'outreach', lang, agency, info })).message);
  AI.score = safe(async (info, lang, agency) => await post({ mode: 'score', lang, agency, info }));
  AI.assistant = safe(async (history, info, lang, agency) => (await post({ mode: 'assistant', lang, agency, info, messages: history })).reply);
  AI.toLatin = s => String(s).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
  window.AI = AI;
})();
