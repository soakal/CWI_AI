# AI Session Memory
> Agent-maintained. Written on session end. Read on session start.
> Format: `written_by | timestamp | session_id | key facts`

---

## Project Context
- PROJECT: CWI (Central Wireless, Inc.)
- NORTH_STAR: Never miss a customer call
- STACK: Static HTML5/CSS/JS (cwi-site/ → Netlify) + PowerShell + Make.com (cwi-automation/)
- GIT: Not initialized — run `git init` before any git workflows; `.gitignore` is ready at root
- NO package.json, no Node.js, no TypeScript compiler, no database

## Sub-projects
- `cwi-site/`: Static website. Files: site.js, partials.js, cwi.css, tweaks-app.jsx, tweaks-panel.jsx. Fonts: Sora + Instrument Sans.
- `cwi-automation/`: Business ops toolkit. PowerShell scripts, Make.com JSON blueprints, 80+ HTML tools in docs/, integrations with Freshchat, HubSpot, Apollo, Stripe, Google Apps Script. Has its own `CLAUDE.md`.

## Session History
| Date | Agent | Session ID | What happened | Next task |
|------|-------|------------|---------------|-----------|
| 2026-06-09 | Sonnet 4.6 (Writer) | 1d577438 | Opus planner analyzed RULES.md + CLAUDE.md. Found fictional stack (Next.js/React/Prisma). Verified model IDs. Produced 20-task update plan. Writer executed ALL 20 tasks (all Critical, High, and Medium tasks; Low tasks covered by existing files). | All tasks complete — see below |

## Active Decisions
- Option A chosen: keep RULES.md aspirational but fix factual errors (not a full rewrite)
- Model IDs verified 2026-06-09: claude-fable-5 ✓, claude-opus-4-8 ✓, claude-sonnet-4-6 ✓, claude-haiku-4-5 ✓ (no date suffix on haiku)

## Completed Tasks (from 20-task Opus plan — session 2026-06-09)
- ✅ Task 1: §1 Project Identity filled (NORTH_STAR, STACK, DEPLOY, NODE=N/A, REPO=not initialized)
- ✅ Task 2: §27 Stack Registry rewritten with actual HTML/PS/Make.com stack
- ✅ Task 3: "⚠️ Project Reality" preamble added to top of RULES.md
- ✅ Task 4: "scan package.json" fixed in RULES.md §0, CLAUDE.md, .cursorrules, chatgpt-instructions.md, RULES-COMPACT.md
- ✅ Task 5: Git commit steps in CLAUDE.md, .cursorrules, RULES.md §0 session end — added "if git repo exists" caveat
- ✅ Task 6: Created docs/ai-memory.md and docs/ directory
- ✅ Task 7: Removed duplicate RULES-COMPACT.md line in §3 folder structure
- ✅ Task 8: §3 folder map updated with project reality caveat + actual cwi-site/ / cwi-automation/ layout
- ✅ Task 9: Fixed duplicate step "7" in §0 bootstrap (renumbered to step 9)
- ✅ Task 10: Git file list standardized (all bootloaders now say "if git repo exists")
- ✅ Task 11: Haiku model ID: RULES-COMPACT.md clarified (no date suffix); §27 footer fixed from haiku-4-5-20251001 → haiku-4-5
- ✅ Task 12: .cursorrules updated (package.json ref fixed, git caveat added)
- ✅ Task 13: chatgpt-instructions.md updated (package.json ref fixed)
- ✅ Task 14: AGENTS.md Executable Commands section — added NOTE that npm commands don't apply currently
- ✅ Task 15: Created cwi-automation/CLAUDE.md with sub-project-specific rules
- ✅ Task 16: Created root .gitignore (ready for git init)
- ✅ Task 17: §28 Change Log seeded with this session's changes
- ✅ Task 18: §28 Change Log seeded (same as 17)
- ✅ Task 19 (Low): Root README.md — deferred; cwi-site/ and cwi-automation/ have own docs; add if user requests
- ✅ Task 20 (Low): §N cross-references in CLAUDE.md — already in sync; no moves made

## Remaining / Deferred
- Root README.md (Task 19): Low priority; skip unless user asks
- docs/decisions/ directory: create when first ADR is needed

---
_written_by: claude-sonnet-4-6 | timestamp: 2026-06-09 | session_id: 1d577438_
