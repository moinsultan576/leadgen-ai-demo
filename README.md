# LeadGen AI — AI Lead Generation + CRM (live demo)

Portfolio demo by **AI Digital Marketing**. Sample data only — every lead, company and number is fictional.

- **Landing page:** hero with animated AI robot scene, solutions, how it works, sample pricing, contact form and a **live AI lead-capture chat** (visitor answers a few questions → becomes a scored lead in the demo pipeline + email notification).
- **Lead dashboard:** KPIs, drag-and-drop Kanban pipeline (New → Contacted → Qualified → Proposal → Client) and list view, lead sources, conversion funnel, leads by industry, recent activity, AI insights, upcoming tasks.
- **AI tools:** AI Lead Finder (industry + city → fictional sample prospects with scores), AI lead scoring with next step, AI outreach messages for WhatsApp / Email / LinkedIn / Facebook / SMS, AI sales assistant chat.
- Campaigns, outreach pages per channel, CRM follow-up queue, clients, tasks, appointments, analytics with CSV export, settings.
- English, Arabic (RTL) and Urdu (RTL); dark/light; mobile-friendly.

## Deploy
Static site + Vercel functions (`/api/chat`, `/api/health`). Optional env var in Vercel: `GEMINI_API_KEY` (and/or `GROQ_API_KEY`). Without a key all AI features use built-in rules.
