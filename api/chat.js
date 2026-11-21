// LeadGen AI demo — AI endpoint (Gemini first, Groq fallback). Keys come only from Vercel env vars.
const GEMINI_MODELS = ['gemini-3.5-flash', 'gemini-flash-latest', 'gemini-3-flash-preview', 'gemini-2.5-flash-lite'];
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const LANG = { en: 'English', ar: 'Arabic (Saudi-friendly Modern Standard Arabic)', ur: 'Urdu (Urdu script)' };

const hits = new Map();
function limited(ip) {
  const now = Date.now(), win = 10 * 60 * 1000, max = 40;
  const arr = (hits.get(ip) || []).filter(t => now - t < win);
  arr.push(now); hits.set(ip, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > max;
}

function clip(s, n) { return String(s == null ? '' : s).slice(0, n); }

function buildPrompt(body) {
  const lang = LANG[body.lang] ? body.lang : 'en';
  const L = LANG[lang];
  const mode = body.mode;
  const agency = clip(body.agency || 'LeadGen AI', 60);
  const info = clip(JSON.stringify(body.info || {}), 3500);
  if (mode === 'finder') return { sys: `You are the AI lead-research agent of "${agency}", a lead generation service in Saudi Arabia. This is a LIVE DEMO: invent ${'5'} clearly FICTIONAL sample prospects (never real company or person names, no real phone numbers, no URLs) matching the industry and city given, plausible for the Saudi market. For each: company (fictional, short), contact (fictional full name), role, need (one short sentence in ${L} about what they likely need, related to the agency service), score (0-100 buying intent), why (one short sentence in ${L}), next_step (one short sentence in ${L}). Return strict JSON only: {"leads":[{"company":string,"contact":string,"role":string,"need":string,"score":number,"why":string,"next_step":string}]}`, msgs: [{ role: 'user', text: 'Search: ' + info }] };
  if (mode === 'outreach') return { sys: `You write first-touch outreach messages for "${agency}" (AI lead generation & automation services, Saudi Arabia). Write in ${L}. Channel rules: whatsapp = max 55 words, friendly, 1 emoji max, ends with a simple question; email = include a subject line as the first line "Subject: ...", max 110 words; linkedin = max 60 words, professional; facebook = max 50 words, casual; sms = max 30 words, no emoji. Personalize with the lead's name, company, industry, city and need. Never invent results, client names, guarantees or statistics. Return strict JSON only: {"message": string}`, msgs: [{ role: 'user', text: 'Lead and channel: ' + info }] };
  if (mode === 'score') return { sys: `You score B2B leads for "${agency}" (Saudi Arabia). Use only the lead data given (stage, source, need, budget/value, last touch, industry). Write reason and next_step in ${L}, one short sentence each. Return strict JSON only: {"score": number 0-100, "label": "hot"|"warm"|"cold", "reason": string, "next_step": string}`, msgs: [{ role: 'user', text: 'Lead: ' + info }] };
  if (mode === 'assistant') {
    const sys = `You are the AI sales assistant inside the "${agency}" lead dashboard (live demo with sample data, Saudi Arabia, values in SAR). Reply in the same language the user writes in (English, Arabic or Urdu); if unclear use ${L}. Be concise (max 90 words), practical, use short bullet lines when listing leads. Answer ONLY from the pipeline data below; never invent leads, numbers or results. Do not mention JSON or ids.
Pipeline data: ${info}
Return strict JSON only: {"reply": string}`;
    const msgs = (Array.isArray(body.messages) ? body.messages : []).slice(-8).map(m => ({ role: m.role === 'user' ? 'user' : 'model', text: clip(m.text, 500) })).filter(m => m.text);
    return { sys, msgs };
  }
  return null;
}

function parseJSON(txt) {
  if (!txt) return null;
  let t = String(txt).trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  try { return JSON.parse(t); } catch (e) {}
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a >= 0 && b > a) { try { return JSON.parse(t.slice(a, b + 1)); } catch (e) {} }
  return null;
}

async function timed(url, opts, ms) {
  const c = new AbortController(); const id = setTimeout(() => c.abort(), ms);
  try { return await fetch(url, { ...opts, signal: c.signal }); } finally { clearTimeout(id); }
}

async function gemini(p) {
  const key = process.env.GEMINI_API_KEY; if (!key) return null;
  const contents = p.msgs.map(m => ({ role: m.role === 'model' ? 'model' : 'user', parts: [{ text: m.text }] }));
  if (!contents.length || contents[0].role !== 'user') contents.unshift({ role: 'user', parts: [{ text: 'Hello' }] });
  for (const model of GEMINI_MODELS) {
    for (const thinking of [true, false]) {
      const gen = { temperature: 0.5, responseMimeType: 'application/json', maxOutputTokens: 2048 };
      if (thinking) gen.thinkingConfig = { thinkingLevel: 'low' };
      try {
        const r = await timed(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
          body: JSON.stringify({ systemInstruction: { parts: [{ text: p.sys }] }, contents, generationConfig: gen }),
        }, 9000);
        if (r.status === 400 && thinking) continue; // retry same model without thinkingConfig
        if (!r.ok) { console.warn('gemini', model, r.status, (await r.text()).slice(0, 200)); break; } // → next model
        const j = await r.json();
        const txt = (j.candidates?.[0]?.content?.parts || []).filter(x => !x.thought).map(x => x.text || '').join('');
        const data = parseJSON(txt);
        if (data) return { data, provider: 'gemini', model };
        console.warn('gemini', model, 'unparsed', j.candidates?.[0]?.finishReason, txt.slice(0, 200));
        break;
      } catch (e) { console.warn('gemini', model, 'error', e && e.name); break; }
    }
  }
  return null;
}

async function groq(p) {
  const key = process.env.GROQ_API_KEY; if (!key) return null;
  try {
    const messages = [{ role: 'system', content: p.sys }, ...p.msgs.map(m => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.text }))];
    const r = await timed('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
      body: JSON.stringify({ model: GROQ_MODEL, messages, temperature: 0.5, max_tokens: 1200, response_format: { type: 'json_object' } }),
    }, 12000);
    if (!r.ok) return null;
    const j = await r.json();
    const data = parseJSON(j.choices?.[0]?.message?.content);
    return data ? { data, provider: 'groq', model: GROQ_MODEL } : null;
  } catch (e) { return null; }
}

function clean(mode, d) {
  if (mode === 'finder') {
    const leads = (Array.isArray(d.leads) ? d.leads : []).slice(0, 6).map(l => ({ company: clip(l.company, 60), contact: clip(l.contact, 50), role: clip(l.role, 50), need: clip(l.need, 200), score: Math.max(0, Math.min(100, Math.round(+l.score || 50))), why: clip(l.why, 200), next_step: clip(l.next_step, 200) })).filter(l => l.company && l.contact);
    return leads.length ? { leads } : null;
  }
  if (mode === 'score') { const sc = Math.max(0, Math.min(100, Math.round(+d.score))); if (!isFinite(sc)) return null; return { score: sc, label: ['hot', 'warm', 'cold'].includes(d.label) ? d.label : sc >= 70 ? 'hot' : sc >= 45 ? 'warm' : 'cold', reason: clip(d.reason, 300), next_step: clip(d.next_step, 300) }; }
  if (mode === 'assistant') return d.reply ? { reply: clip(d.reply, 1500) } : null;
  return d.message ? { message: clip(d.message, 1600) } : null;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.statusCode = 405; return res.end(JSON.stringify({ error: 'method' })); }
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'x';
  res.setHeader('Content-Type', 'application/json');
  if (limited(ip)) return res.end(JSON.stringify({ fallback: true, reason: 'rate' }));
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  if (!body || typeof body !== 'object') body = {};
  const p = buildPrompt(body);
  if (!p) return res.end(JSON.stringify({ fallback: true, reason: 'mode' }));
  const out = (await gemini(p)) || (await groq(p));
  const data = out && clean(body.mode, out.data);
  if (!data) return res.end(JSON.stringify({ fallback: true }));
  return res.end(JSON.stringify({ data, provider: out.provider }));
};
