# Claude Code — CWI Automation Instructions

> Sub-project: `cwi-automation/` — Business ops toolkit (CWI — Compute With Imagination)
> Stack: PowerShell scripts + Make.com JSON blueprints + standalone HTML tools
> Parent rules: See root `RULES.md` and `CLAUDE.md` for the full standard.

## What's in this directory

| Folder / File | Purpose |
|---------------|---------|
| `blueprints/` | Make.com scenario JSON exports — import via Make.com dashboard |
| `scripts/` | PowerShell (.ps1) — run locally on Windows |
| `docs/` | 80+ standalone HTML tools (metrics-dashboard, proposal-generator, etc.) |
| Integrations | Freshchat, HubSpot, Apollo, Stripe, Google Apps Script |

## NORTH_STAR
**Never miss a customer call.** Every automation, script, and tool in this directory serves this goal.

## Working rules for this sub-project

### PowerShell scripts
- No hardcoded credentials — use environment variables or Windows Credential Manager.
- Always include a `-WhatIf` check before destructive operations.
- Log actions to a file or console with timestamps (`Write-Host "[$(Get-Date -f s)] ..."`).
- Test locally with sample data before pointing at live systems.

### Make.com blueprints
- Version filenames: `blueprint-name-v1.json`, `blueprint-name-v2.json`.
- Keep a comment in the JSON (`notes` field where Make supports it) with: what it does, last tested date, dependencies.
- Never store API keys in blueprint JSON — use Make.com Connection objects instead.

### HTML tools (docs/)
- Standalone — no build step, no dependencies. Open directly in browser.
- Keep vanilla JS only unless a CDN import is necessary.
- Follow §42 (SEO) and §11 (Accessibility) rules from root RULES.md where applicable.

### Integrations
- Freshchat, HubSpot, Apollo, Stripe: all calls go through Make.com scenarios or dedicated PS1 scripts — never inline in HTML.
- Google Apps Script: keep scripts in the relevant Google Workspace file; document the file URL in `docs/` or a README comment.

## Session bootstrap (in addition to root CLAUDE.md steps)
1. Scan `blueprints/`, `scripts/`, and `docs/` for recent changes.
2. Note any new integrations or tools → update root RULES.md §27 if material.
3. Confirm all credentials are in env vars or Make.com Connections — flag any hardcoded values immediately.

## What you must never do here
- Hardcode API keys, tokens, or passwords in any file.
- Auto-trigger a live Make.com scenario without human confirmation.
- Run a PS1 script against live data without confirming `-WhatIf` result first.
- Commit customer data (calls, contacts, billing info) to any file.
