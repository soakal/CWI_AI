# AI Session Memory
> Agent-maintained. Written on session end. Read on session start.
> Format: `written_by | timestamp | session_id | key facts`

---

## Project Context
- PROJECT: CWI — Compute With Imagination (legal: CWI AI LLC)
- NORTH_STAR: Never miss a customer call
- STACK: Static HTML5/CSS/JS (cwi-site/ → Netlify) + PowerShell + Make.com (cwi-automation/)
- GIT: Active — branch `master`, remote: https://github.com/soakal/CWI_AI
- NO package.json, no Node.js, no TypeScript compiler, no database
- NOTIFICATIONS: Resend email only — NO SMS, NO Twilio

## Sub-projects
- `cwi-site/`: Static website. Files: site.js, partials.js, cwi.css, tweaks-app.jsx, tweaks-panel.jsx. Fonts: Sora + Instrument Sans.
- `cwi-automation/`: Business ops toolkit. PowerShell scripts, Make.com JSON blueprints (a–at = 40+ scenarios), 80+ dark-branded HTML tools in docs/. Integrations: Freshchat, HubSpot, Apollo, Stripe, Resend, Calendly, Google Calendar, Google Apps Script.

## Key Decisions (permanent)
- Notifications are **email only via Resend** — no SMS/Twilio integration exists or is planned
- Confirmed active integrations: Freshchat, HubSpot, Apollo, Stripe, Resend, Calendly, Google Calendar
- Removed from website (not offered): Square, Acuity, Jobber, Housecall Pro, Salesforce, Twilio
- All `cwi-automation/docs/` HTML tools use CWI dark brand (dark #0A0A0C bg, Sora/Instrument Sans, #FF5A1F accent) as of 2026-06-10
- Nav/footer are managed via `partials.js` — edit there, not per-page

## Session History
| Date | Agent | Session ID | What happened | Next task |
|------|-------|------------|---------------|-----------|
| 2026-06-09 | Sonnet 4.6 (Writer) | 1d577438 | Opus planner analyzed RULES.md + CLAUDE.md. Found fictional stack (Next.js/React/Prisma). Verified model IDs. Produced 20-task update plan. Writer executed ALL 20 tasks. | All tasks complete |
| 2026-06-10 | Sonnet 4.6 (Writer) | 721a7e47 | Fixed stale git notes in RULES.md/CLAUDE.md/ai-memory.md. Committed all untracked files + pushed. Full code review on cwi-site/ (9 findings applied). Ran comprehensive audit of cwi-automation/. Applied all 5 user decisions. | All tasks complete — see below |

## Completed Tasks (session 2026-06-10)
- ✅ Fixed stale "no git repo" notes in RULES.md, CLAUDE.md, docs/ai-memory.md
- ✅ Committed all untracked cwi-automation/ files + pushed to origin/master
- ✅ Code review on cwi-site/ — 9 findings: XSS fix (addConfirm), nav/footer to partials.js, favicon path, demo.html URLs, webhook warning, btn-secondary→btn-ghost, footer link label, transcript null guard
- ✅ Removed unimplemented integrations from cwi-site/how-it-works.html (Square, Acuity, Jobber, Housecall Pro, Salesforce, Twilio)
- ✅ Changed "text/SMS" copy to "email" across index.html, pricing.html, how-it-works.html
- ✅ Built 7 new industry Make.com scenarios: scenario-an (last-minute opening), ao (emergency callback), ap (waitlist manager), aq (trades intake), ar (vehicle status), as (patient intake), at (catering inquiry)
- ✅ Rebuilt 12 stub HTML files in cwi-automation/docs/ with real functional CWI-branded content
- ✅ Brand-fixed 35 off-brand HTML tools in cwi-automation/docs/ (dark theme, correct fonts)
- ✅ All changes committed in 3 logical commits and pushed to origin/master

## Remaining / Deferred
- Root README.md: Low priority; skip unless user asks
- docs/decisions/ directory: create when first ADR is needed
- Calendly account `calendly.com/cwiai/15min` — verify this is live before launch (demo.html TODO comment)
- Make webhook URL in free-audit.html — blank until configured (console.warn guard in place)

---
_written_by: claude-sonnet-4-6 | timestamp: 2026-06-10 | session_id: 721a7e47_
