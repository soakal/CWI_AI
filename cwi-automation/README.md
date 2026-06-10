# CWI Automation — Operator Handbook

**Version:** 1.0 | **Contact:** brian@cwiai.net | (734) 812-9971

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Critical Architecture Decision — Path A vs Path B](#3-critical-architecture-decision)
4. [File Structure](#4-file-structure)
5. [Quick Start](#5-quick-start)
6. [Make Scenario Import](#6-make-scenario-import)
7. [Freshchat Setup](#7-freshchat-setup)
8. [Per-Client Deployment Checklist](#8-per-client-deployment-checklist)
9. [Testing](#9-testing)
10. [Monitoring](#10-monitoring)
11. [Rollback Procedures](#11-rollback-procedures)
12. [Cost Math](#12-cost-math)
13. [Support](#13-support)

---

## 1. Overview

The CWI Automation system turns a local service business's website chat widget into a fully automated sales and operations engine. Once deployed, the system:

- **Answers common questions instantly** — pricing, hours, service area, FAQs — without any human touching the keyboard.
- **Books appointments automatically** — collects the customer's preferred day and time, checks Google Calendar for open slots, creates the event, and sends a confirmation message and email.
- **Follows up on missed leads** — detects conversations that went quiet and sends a follow-up message every 30 minutes until the customer responds or is marked handled.
- **Enriches and routes leads** — pulls prospect company data from Apollo.io, scores the lead by sentiment (positive / negative / neutral), and pushes a deal record into HubSpot CRM with the correct pipeline stage.
- **Sends monthly reports** — compiles bookings, revenue, and lead stats on the first Monday of each month and emails the report to the client.
- **Logs payments** — listens for Stripe payment events and writes invoice records to HubSpot for the client's billing history.

A single CWI operator can manage multiple clients from one Make.com account and one Freshchat workspace by cloning and configuring scenarios per client. The target is **zero daily manual work** for routine inbound inquiries.

---

## 2. Architecture

```
Customer visits client's website
         |
         v
   Freshchat Widget  (chat bubble on client's site)
         |
         |  Webhook POST (every message)
         v
   Make.com  (the automation hub — all logic lives here)
    |   |   |   |   |   |
    |   |   |   |   |   +-- Stripe  (payment event webhooks --> HubSpot log)
    |   |   |   |   |
    |   |   |   |   +------ Apollo.io  (lead enrichment --> HubSpot deal)
    |   |   |   |
    |   |   |   +---------- HubSpot CRM  (contacts, deals, pipeline stages)
    |   |   |
    |   |   +-------------- Google Calendar  (availability check + event creation)
    |   |
    |   +------------------ OpenRouter / Claude  (AI response generation -- Path B)
    |
    +---------------------- Freshchat API  (send reply back to customer)
         |
         v
   Customer sees reply in chat widget
```

**Data flow summary:**

1. Customer types a message in the chat widget.
2. Freshchat fires a webhook to Make.com.
3. Make checks the message for keywords (booking, pricing, etc.).
4. Depending on intent, Make calls Google Calendar to find a slot, calls OpenRouter to generate a plain-language reply, creates or updates a HubSpot deal, or triggers a follow-up sequence.
5. Make sends the response back to Freshchat so the customer sees it instantly.
6. All deal movements, bookings, and payments are logged in HubSpot for the client's records.

---

## 3. Critical Architecture Decision

### Path A — Freshchat Freddy AI (Recommended Starting Point)

**Freshchat has its own built-in AI bot called Freddy.** For straightforward FAQ answers (pricing, hours, service area), Freddy handles the response entirely inside Freshchat — no webhook to Make, no OpenRouter call, no extra API cost.

**Start with Path A.** Configure Freddy to answer the top 10–15 questions using `knowledge-base-template.json` as your source material. Only escalate to Make (and OpenRouter) for tasks Freddy cannot handle: real-time calendar booking, payment webhooks, CRM updates, and custom multi-step flows.

**Why Path A first:**

- No per-token AI cost for FAQ traffic.
- Faster response (no round-trip to Make and OpenRouter).
- Simpler to maintain — edit answers directly in the Freshchat knowledge base.
- Freddy can escalate to a live agent or trigger a webhook when it cannot answer.

### Path B — OpenRouter via Make (Use for Complex Flows)

When a customer message requires reasoning beyond a simple FAQ lookup — interpreting a vague scheduling request, composing a personalized follow-up, or routing based on sentiment — Make calls OpenRouter, which routes the request to Claude (primary model) or Gemini Flash (fallback). The AI reply is sent back through Make to Freshchat.

**When to use Path B:**

- Booking intent that requires parsing natural language dates and times.
- Missed follow-up messages that need a personalized, context-aware nudge.
- Lead sentiment scoring in Scenario E.
- Any response where a canned answer would feel robotic.

**The practical split:** Freddy handles roughly 70% of volume (FAQs). Make and OpenRouter handle the remaining 30% (bookings, follow-ups, routing). This keeps costs low and response quality high.

**Important: Do not disable Freddy in favor of routing every message through OpenRouter. That will increase your per-client API cost significantly and slow response times.**

---

## 4. File Structure

```
cwi-automation/
|
|-- .env.template              # Master list of all 47 environment variables.
|                              # Copy to .env and fill in real values before running anything.
|
|-- .gitignore                 # Ensures .env (with real secrets) is never committed to git.
|
|-- README.md                  # This file.
|
|-- SETUP.md                   # Step-by-step first-run setup guide.
|
|-- clients/
|   |-- clients-log.txt        # Running log of active clients and their key IDs.
|
|-- docs/                      # HTML operator tools and reference docs (90+ files).
|
|-- freshchat/
|   |-- bot-flows.json         # Freshchat bot conversation flows (6 flows + 1 fallback).
|   |                          # Import into Freshchat Admin > Bots > Import.
|   |-- knowledge-base-template.json
|                              # FAQ articles for Freddy AI (Path A).
|                              # Import into Freshchat Admin > Knowledge Base.
|
|-- make-scenarios/            # 39 Make.com blueprint JSON files (scenario-a through scenario-am).
|   |-- scenario-a-booking-flow.json
|   |                          # Triggered by Freshchat webhook. Detects booking keywords,
|   |                          # checks Google Calendar, creates event, sends confirmation.
|   |
|   |-- scenario-b-missed-followup.json
|   |                          # Runs every 30 minutes. Finds unanswered chats and sends
|   |                          # a follow-up message to each idle conversation.
|   |
|   |-- scenario-c-monthly-report.json
|   |                          # Runs on the first Monday of each month at 8:00 AM.
|   |                          # Compiles booking, revenue, and lead stats and emails the report.
|   |
|   |-- scenario-d-apollo-hubspot.json
|   |                          # Triggered by new lead events. Enriches contact via Apollo,
|   |                          # then creates or updates a HubSpot deal with lead data.
|   |
|   |-- scenario-e-lead-routing.json
|   |                          # Scores lead sentiment (positive / negative / neutral) via
|   |                          # OpenRouter and routes to the correct HubSpot pipeline stage.
|   |
|   |-- scenario-f-payment-logging.json
|   |                          # Listens for Stripe payment webhooks. Logs each successful
|   |                          # payment as a note on the matching HubSpot contact or deal.
|   |
|   |-- scenario-g through scenario-am ...
|                              # 33 additional scenarios covering Calendly sync, client
|                              # onboarding, payment retry, review requests, NPS, upsell,
|                              # deal velocity, referrals, and more. See make-scenarios/ for
|                              # the full list.
|
|-- scripts/
    |-- setup-env.ps1          # Environment loader: copies .env.template to .env if missing,
    |                          # loads variables into the current shell session, validates
    |                          # 10 required variables, and runs live connection tests for
    |                          # OpenRouter, Freshchat, HubSpot, and Stripe (4 services).
    |                          # Non-interactive — does not prompt and does not write files.
    |                          # Run this first after setting up for a new client.
    |
    |-- test-suite.ps1         # Runs 11 automated checks against all project files.
    |                          # Validates JSON, checks required fields, tests OpenRouter live.
    |                          # Writes results to scripts/test-report.json.
    |
    |-- verify-connections.ps1 # Full-coverage connection tester: checks 8 services
    |                          # (OpenRouter, Freshchat, Apollo, HubSpot, Stripe, Calendly,
    |                          # Google Calendar, Resend) and writes verify-report.json.
    |                          # Use after rotating API keys to confirm nothing is broken.
    |
    |-- test-report.json       # Auto-generated after each test-suite.ps1 run. Do not edit.
    |
    |-- verify-report.json     # Auto-generated after each verify-connections.ps1 run.
```

---

## 5. Quick Start

Follow these steps in order. Do not skip steps.

### Step 1 — Fill in .env.template

Open `.env.template` in any text editor. You will see 47 variables grouped by service. **Do not edit .env.template directly.** Instead, copy it to `.env`:

```powershell
Copy-Item .env.template .env
```

Then open `.env` and replace every `xxxx` placeholder with a real value. See the comment above each variable for where to find the key. The most critical variables to fill first:

- `OPENROUTER_API_KEY` — from https://openrouter.ai/keys
- `FRESHCHAT_API_KEY`, `FRESHCHAT_DOMAIN`, `FRESHCHAT_BOT_ID` — from Freshchat Admin
- `HUBSPOT_API_KEY` — from HubSpot Settings > Integrations > Private Apps
- `STRIPE_API_KEY` — from https://dashboard.stripe.com/apikeys
- `RESEND_API_KEY` and `RESEND_FROM_ADDRESS` — from https://resend.com (Resend is the email provider; RESEND_FROM_ADDRESS must be a verified sender domain)

**The `.env` file contains live API keys and payment credentials. Never share it, never email it, and never commit it to git.**

### Step 2 — Run setup-env.ps1

Open PowerShell 7 (not Windows PowerShell 5). Navigate to the `cwi-automation` folder and run:

```powershell
pwsh -File scripts\setup-env.ps1
```

The script is non-interactive — it does not prompt for input. It will:

1. Copy `.env.template` to `.env` if `.env` does not already exist (with a warning to fill in values).
2. Load all variables from `.env` into the current shell session.
3. Check 10 required variables and print OK or MISSING for each.
4. Test four API connections live (OpenRouter, Freshchat, HubSpot, Stripe) and print PASS / FAIL / SKIP for each service.

**Fix every FAIL before moving on.** A failed connection means that Make scenario will break in production. Common causes: wrong API key, wrong domain format, key not yet activated by the vendor.

For broader connection coverage (8 services including Apollo, Calendly, Google Calendar, and Resend), run `verify-connections.ps1` instead — see Step below.

### Step 3 — Import Make Scenarios

Import the Make scenario JSON files into Make.com. See [Section 6](#6-make-scenario-import) for the exact steps. Start with the six core scenarios (A through F); the remaining 33 extended scenarios can be imported as your workflow expands.

After import, open each scenario and update the connections (the colored service icons) to point to your client's credentials — they will show a warning icon until you do this.

### Step 4 — Configure Freshchat

Load the bot flows and knowledge base into Freshchat. See [Section 7](#7-freshchat-setup) for the exact steps.

After loading, update every `{{PLACEHOLDER}}` in the bot flows to the real values for this client:

- `{{BOT_NAME}}` — name of the bot (for example, "Riley")
- `{{CLIENT_NAME}}` — client's business name
- `{{MAKE_WEBHOOK_SCENARIO_A}}` — the webhook URL Make generated when you activated Scenario A

**The webhook URL is unique per Make scenario. Copy it from Make (Scenario A > first module > Copy address) and paste it into the Freshchat bot flow.**

### Step 5 — Run test-suite.ps1

```powershell
pwsh -File scripts\test-suite.ps1
```

This runs 11 automated checks. You need all 11 to pass (or show SKIP for tests that require a live API key you have not yet configured). Results are printed to the console and saved to `scripts\test-report.json`.

See [Section 9](#9-testing) for how to interpret the results and fix failures.

### Step 6 — Go Live

1. In Make.com, turn on each scenario using the toggle in the top-right corner of the scenario editor. Start with Scenario A, then B, then the rest.
2. In Freshchat, publish the bot flows (Bots > your bot > Publish).
3. Send a test message through the live chat widget on the client's website.
4. Confirm the reply arrives within 10 seconds, a calendar event is created (for a booking test), and a HubSpot deal appears.

**Do a full end-to-end test before telling the client the system is live.** Use a real phone or a private browser session — do not test from a session that is already logged in as an agent, as that can bypass the bot.

---

## 6. Make Scenario Import

Each `.json` file in `make-scenarios/` is a Make.com blueprint — a complete snapshot of a scenario that can be imported with one click.

### How to Import

1. Log in to Make.com at https://make.com.
2. Open the team workspace for this client (or create one).
3. In the left sidebar, click **Scenarios**.
4. Click **Create a new scenario**.
5. In the scenario editor, click the **three-dot menu** (top right) > **Import Blueprint**.
6. Click **Choose File** and select the `.json` file from `make-scenarios/`.
7. Click **Save**. The scenario loads with all modules pre-configured.
8. You will see warning icons on any module that needs a connection set up — click each one and select or create the connection for this client.

Repeat for all 39 scenario files. Import the core scenarios (A through F) first, then add the remaining scenarios as needed. Importing in alphabetical order makes troubleshooting easier.

### After Import — Set Webhook URLs

Scenario A uses a Freshchat webhook trigger. After importing:

1. Open Scenario A.
2. Click the first module (the webhook receiver — it looks like a globe icon).
3. Click **Copy address to clipboard**. This is the URL Freshchat will POST to.
4. Paste this URL into `freshchat/bot-flows.json` as the value for `{{MAKE_WEBHOOK_SCENARIO_A}}`, then re-import the bot flows (or update it directly in Freshchat Admin).

### Activating Scenarios

Scenarios are **off by default** after import. Turn each one on using the toggle switch in the top-right corner of the scenario editor. **Do not activate until verify-connections.ps1 and test-suite.ps1 both pass.**

### Scheduling

- **Scenario A** — event-driven (fires when Freshchat sends a webhook, no schedule needed).
- **Scenario B** — runs every 30 minutes automatically.
- **Scenario C** — runs on the first Monday of each month at 8:00 AM.
- **Scenario D** — event-driven (fires when Apollo sends a webhook).
- **Scenario E** — event-driven (fires as part of the lead routing chain from Scenario D).
- **Scenario F** — event-driven (fires when Stripe sends a payment webhook).

---

## 7. Freshchat Setup

### Loading the Bot Flows

The file `freshchat/bot-flows.json` contains six conversation flows:

| Flow | Trigger Keywords | What It Does |
|------|-----------------|--------------|
| Booking Intent | book, schedule, appointment, available, availability, come out, visit | Collects preferred day and time, fires Make Scenario A |
| Pricing Inquiry | price, cost, how much, fee, quote | Delivers pricing info, offers to book a call |
| Hours Inquiry | hours, open, close, when, today | States business hours, offers after-hours callback |
| Service Area | area, location, travel, service, zip | Confirms service area coverage |
| Emergency Contact | emergency, urgent, broken, flooding | Delivers emergency phone number immediately |
| Fallback | (anything not matched above) | Offers to connect with a live agent |

To import:

1. Go to Freshchat Admin > **Bots** > select your bot (or create one).
2. Click **Import** (or look for an "Import flows" option in the bot editor).
3. Upload `freshchat/bot-flows.json`.
4. After import, search for every `{{PLACEHOLDER}}` and replace with real values.
5. Click **Publish** to make the flows live.

**After publishing, send a test message from a real device (not the Freshchat admin preview) to confirm the bot responds correctly.**

### Loading the Knowledge Base

The file `freshchat/knowledge-base-template.json` contains pre-written FAQ articles for Freddy AI (Path A). To load:

1. Go to Freshchat Admin > **Knowledge Base**.
2. Click **Import** and select `freshchat/knowledge-base-template.json`.
3. Review each article — replace the template placeholder text (marked with brackets like `[INSERT CLIENT HOURS]`) with the client's real information.
4. Publish the knowledge base.
5. In Freddy AI settings, point Freddy to this knowledge base so it uses these articles for automated answers.

### Freddy AI Configuration (Path A)

1. Go to Freshchat Admin > **Freddy AI** (or **Bots** depending on your plan).
2. Enable Freddy and link it to the knowledge base you just published.
3. Set the escalation behavior: when Freddy cannot find an answer, it should trigger the Fallback bot flow (which offers a live agent or collects contact info).
4. Test Freddy by typing 5–6 FAQ questions in the preview pane. Confirm it answers from the knowledge base articles.

**Freshchat Freddy bot requires a paid Freshchat plan.** Confirm your plan includes Freddy Bot before importing `bot-flows.json`. If your plan does not include it, the bot flows will import but Freddy AI routing will not work.

---

## 8. Per-Client Deployment Checklist

Use this checklist for every new client. The full process takes approximately three weeks.

### Week 1 — Discovery and Setup

- [ ] Collect client information: business name, hours, service area, pricing, emergency contact, after-hours policy.
- [ ] Fill in the `CLIENT_*` section of `.env` with this information.
- [ ] Obtain API keys from all required platforms (see `.env.template` for the list and where to get each one).
- [ ] Run `setup-env.ps1` to load variables, then run `verify-connections.ps1` and confirm all configured services PASS.
- [ ] Import all six Make scenarios and configure connections.
- [ ] Customize `knowledge-base-template.json` with client-specific FAQ content.
- [ ] Customize `bot-flows.json` with client name, bot name, and Make webhook URL.
- [ ] Load both files into Freshchat and publish.

### Week 2 — Testing and Refinement

- [ ] Run `test-suite.ps1` and confirm all 11 tests pass.
- [ ] Send a test booking request through the live widget — confirm a calendar event is created and a confirmation email is received.
- [ ] Test the follow-up flow by leaving a conversation idle for 35 minutes — confirm Scenario B sends a follow-up.
- [ ] Test payment logging by processing a $1 test charge in Stripe — confirm a HubSpot note appears.
- [ ] Review Freddy AI answers for accuracy — correct any wrong or missing knowledge base articles.
- [ ] Brief the client on what the bot will and will not handle, and how to escalate to a live agent.

### Week 3 — Go Live and Handoff

- [ ] Install the Freshchat widget on the client's website (client's web developer or CWI installs the embed code).
- [ ] Activate all Make scenarios.
- [ ] Monitor Make scenario run history for 48 hours — check for any errors.
- [ ] Walk the client through the HubSpot pipeline so they can see their leads and bookings.
- [ ] Deliver the first monthly report template (Scenario C will automate future reports).
- [ ] Confirm billing is set up for the client.
- [ ] Hand off the monitoring checklist (Section 10) to whoever will do the weekly check-ins.

---

## 9. Testing

### Running the Test Suite

Open PowerShell 7 from the `cwi-automation` folder and run:

```powershell
pwsh -File scripts\test-suite.ps1
```

The suite runs 11 tests and takes about 10–30 seconds (longer if the OpenRouter live test runs). Results are printed in color and saved to `scripts\test-report.json`.

### What Each Test Checks

| Test | What It Checks | Common Failure Cause |
|------|---------------|---------------------|
| 1. JSON Validation | All 6 scenario files are valid JSON with a `flow` array | Editing a scenario file by hand and introducing a syntax error |
| 2. Required Fields | Each scenario has `name`, `flow`, `metadata`, and a scheduling or webhook trigger | Incomplete scenario import |
| 3. Freshchat Config | `bot-flows.json` has at least 6 flows, each with trigger keywords | Missing or malformed flow after manual editing |
| 4. Env Template | `.env.template` contains all required variable names | Template was accidentally modified |
| 5. OpenRouter API Live | A real API call to OpenRouter returns HTTP 200 | Wrong API key, expired key, or key not yet funded |
| 6. Scenario A Flow Count | Scenario A has at least 7 modules (including nested routes) | Incomplete import or accidental deletion of a module |
| 7. Scenario B Scheduling | Scenario B has a schedule trigger with a roughly 30-minute interval | Schedule was changed in Make and re-exported incorrectly |
| 8. Scenario E Sentiment | Scenario E router has 3 branches: positive, negative, neutral | Branch was deleted or renamed |
| 9. File Completeness | All 8 required files exist on disk | A file was moved or renamed |
| 10. Scenario Module Chain | Each scenario's modules have sequential IDs starting at 1 | Blueprint corruption during export or import |
| 11. Env Vars Security | No real API keys are hardcoded in any scenario JSON | Accidentally saving a key to a scenario instead of using a connection variable |

### Interpreting Results

- **[PASS]** — green. No action needed.
- **[SKIP]** — yellow. The test requires a live API key that is not yet configured. Fill in `.env` and re-run.
- **[FAIL]** — red. The specific failure message tells you what went wrong. Fix it, then re-run the suite.

**Do not deploy to a client until all tests show PASS or SKIP. A FAIL in production means a broken customer experience.**

### Reading test-report.json

The file `scripts/test-report.json` is overwritten on every run. It contains:

- `generated` — timestamp of the run.
- `summary.passed` / `summary.failed` / `summary.skipped` — counts.
- `tests` — array of each test with its name, status, and detail message.

You can open this file in any text editor or JSON viewer. Share it with support (brian@cwiai.net) when reporting a problem.

---

## 10. Monitoring

### Weekly Check (15 minutes, every Monday)

1. **Make.com run history** — Open each scenario and click History. Look for any red (failed) runs in the past 7 days. A failed run means a customer got no response or a booking was not created. Click the run to see the exact error.

2. **HubSpot pipeline** — Open the Deals board for this client. Confirm new leads from the past week appear in the correct stage. Deals stuck in "New Lead" for more than 48 hours with no activity may indicate a routing failure.

3. **Freshchat conversations** — Spot-check 3–5 recent chat transcripts. Confirm the bot answered correctly, the booking flow completed, and no conversation ended with an unanswered message.

4. **OpenRouter usage** — Log in at https://openrouter.ai and check your credit balance. **If the balance is below $10, top it up before it hits zero.** When OpenRouter credits run out, all AI-powered responses stop.

5. **Stripe** — Confirm any expected payments from the past week appear in the Stripe dashboard and have corresponding HubSpot notes (via Scenario F).

### Monthly Check (1 hour, first Tuesday of the month)

1. **Review the automated report** — Scenario C sends a report on the first Monday. Review it for accuracy. If the numbers look wrong, check Make scenario run history for Scenario C errors.

2. **API key rotation audit** — Check whether any API keys are approaching their expiration date. Freshchat tokens and HubSpot private app tokens can expire. Rotate early and re-run `verify-connections.ps1` to confirm the new keys work across all 8 integrated services.

3. **Knowledge base review** — Open Freshchat's knowledge base and update any article that references pricing, hours, or services that have changed for the client.

4. **Make operations count** — Log in to Make.com and check your monthly operation count. Each module execution in a scenario counts as one operation. If you are close to your plan limit, either upgrade the plan or optimize high-volume scenarios.

5. **HubSpot data hygiene** — Archive any deals that have been in a terminal stage (Closed Won or lost) for more than 30 days. This keeps the pipeline board readable.

6. **Client satisfaction check-in** — Send the client a brief email: anything broken, any new questions coming in that the bot is not handling, any changes to their services or hours?

---

## 11. Rollback Procedures

### Chatbot Is Giving Wrong Answers

**Symptoms:** Customers report incorrect pricing, wrong hours, or confusing responses from the bot.

**Immediate fix for Freddy or knowledge base answers:**

1. Go to Freshchat Admin > Knowledge Base.
2. Find the article with the wrong information.
3. Click Edit, correct the text, and click Publish.
4. The fix is live immediately — no re-import required.

**Immediate fix for bot flow answers:**

1. Go to Freshchat Admin > Bots > select the bot.
2. Find the step that sends the wrong message.
3. Edit the message text and click Publish.

**If the wrong answer is coming from OpenRouter (a Make scenario):**

1. In Make, open the relevant scenario and click Edit.
2. Find the OpenRouter (HTTP) module and review the prompt text.
3. Correct the prompt, save, and test by sending a message through the widget.

**Last resort — disable the bot:**

1. In Freshchat Admin > Bots, toggle the bot off.
2. This puts all conversations into the agent queue for human handling.
3. **Notify the client immediately if you disable the bot — they will need to staff the chat queue.**
4. Fix the issue, test thoroughly, then re-enable the bot.

### Make Scenario Failure (Scenarios Stopping)

**Symptoms:** Bookings are not being created, follow-ups are not sending, HubSpot deals are not appearing.

**Step 1 — Identify which scenario failed:**

1. In Make.com, open each scenario and check the History tab.
2. Look for red rows. Click a failed run to see the exact error.

**Step 2 — Common fixes:**

| Error Message | Fix |
|--------------|-----|
| "Connection is invalid" or "401 Unauthorized" | The API key for that service has expired or been rotated. Update the connection in Make and re-run `verify-connections.ps1` to confirm the new key works. |
| "Quota exceeded" or "429 Too Many Requests" | You have hit the API rate limit. Wait 60 seconds and re-run. For recurring issues, reduce the scenario frequency. |
| "OpenRouter credit balance low" | Top up credits at https://openrouter.ai. The scenario will resume automatically. |
| "Google Calendar: invalid_grant" | The Google OAuth token has expired. See the Calendar Auth Break section below. |
| "Stripe webhook signature invalid" | The `STRIPE_WEBHOOK_SECRET` in `.env` does not match the secret in the Stripe dashboard. Rotate and update. |

**Step 3 — Test after fixing:**

Run `pwsh -File scripts\verify-connections.ps1` to confirm all connections are live, then trigger the scenario manually in Make (click Run once) and watch the execution.

### Google Calendar Auth Break

**Symptoms:** Scenario A stops creating calendar events. The error in Make says "invalid_grant" or "Token has been expired or revoked."

Google OAuth tokens expire after a period of inactivity or when the user revokes access.

**Fix:**

1. Go to https://console.cloud.google.com > APIs & Services > Credentials.
2. Find the OAuth 2.0 Client ID for this client.
3. Open Make.com > Connections > find the Google Calendar connection for this client.
4. Click **Reconnect** (or delete and recreate the connection).
5. Follow the browser OAuth prompt — you will be redirected to Google's login, then back to Make.
6. Once reconnected, open Scenario A and confirm the Google Calendar module shows a green connection indicator.
7. Test with a manual run.

**Prevention:** Google tokens stay valid as long as Scenario A runs at least once every 6 months. The weekly monitoring check ensures the scenario stays active.

---

## 12. Cost Math

### Platform Costs Per Client (Monthly)

| Platform | Plan or Usage | Monthly Cost |
|----------|--------------|-------------|
| Make.com | Core plan (10,000 operations) | ~$10 |
| Freshchat | Growth plan (up to 2,000 conversations) | ~$19 |
| OpenRouter (Claude / Gemini) | $5–15 depending on chat volume | ~$10 |
| HubSpot | Starter CRM | ~$20 |
| Apollo.io | Basic (shared across clients) | ~$5 allocated |
| Stripe | Per-transaction fees (passed to client) | $0 (client pays) |
| Google Calendar | Free tier | $0 |
| Resend (email sending) | Pro plan (~$20/mo, shared across all clients) | ~$2–5 allocated |
| **Total platform cost** | | **~$64–70/month** |

Add a buffer for overages (extra Make operations, higher chat volume in a busy month): **target $75–100/month** all-in platform cost per client.

### Revenue and Margin

| Tier | Client Retainer | Platform Cost | Gross Margin |
|------|----------------|--------------|-------------|
| Starter | $400/month | $75–100 | ~75% |
| Growth | $600/month | $85–110 | ~83% |
| Full Service | $900/month | $95–125 | ~87% |

**Target margin: 75–85%.** Stay inside this band by keeping OpenRouter usage efficient (Freddy handles FAQs so OpenRouter only fires for complex tasks), staying on appropriate Make and Freshchat plan tiers, and avoiding per-client Apollo accounts where possible (share one account across multiple clients).

**Important: Do not underestimate Make operations.** Every module in a scenario execution counts as one operation. Scenario B (missed follow-up, runs every 30 minutes) can consume 1,440 or more operations per day if there are many open conversations. Monitor your operation count in the first week for each new client and upgrade the Make plan before hitting the limit, or scenarios will pause until the next billing cycle.

---

## 13. Support

**Primary contact:**

Brian — CWI AI
Email: brian@cwiai.net
Phone: (734) 812-9971

For non-urgent questions, email is preferred. Include the client name, which scenario or platform is affected, and a copy of `scripts/test-report.json` or a screenshot of the Make error.

For production outages (bot completely down, no bookings being created): call directly.

**Vendor support links:**

- Make.com support: https://www.make.com/en/help
- Freshchat support: https://support.freshchat.com
- OpenRouter status: https://status.openrouter.ai
- HubSpot support: https://help.hubspot.com
- Stripe support: https://support.stripe.com
- Apollo.io support: https://knowledge.apollo.io

---

*CWI AI — Automation for local service businesses.*
*brian@cwiai.net | (734) 812-9971*
