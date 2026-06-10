---
title: App Setup Guide — CWI AI Automation System
created: 2026-06-08
tags: [setup, app, automation, make, freshchat, hubspot, critical]
status: active
---

# App Setup Guide — CWI AI Automation System

> Time to complete: 4–6 hours (first time). Follow sections IN ORDER — each section depends on the previous one having real API keys. The project folder on disk is `C:\Users\Brian\Documents\CWI AI\cwi-automation`. This guide covers ONLY the automation app (the `.env`, Make scenarios, HubSpot, Freshchat bot, Google Sheets, webhooks, Apollo, Stripe, email deliverability, and tests). It does NOT cover deploying the marketing website — that is a separate guide.

**Before you touch anything below:** turn on **2-Factor Authentication (2FA)** for every account you create (Google, Make, Freshchat, Apollo, HubSpot, Stripe, OpenRouter) and install **Bitwarden** (https://bitwarden.com) as your password manager. Bitwarden is the ONLY place your API keys should live long-term. Never paste keys into chat, Obsidian, or a backup folder. The `.env` file is git-ignored and must never be committed.

---

## Accounts to Create First (do these before anything else)

Create an account for each service below before starting Part 1. You will collect keys from each one as you go.

| Service | URL | Free Plan? | What it's for |
|---|---|---|---|
| Make.com | https://www.make.com/en/register | Free exists, but **Core (paid, ~$10.59/mo) is required** | Runs all 13 automation scenarios — needs instant webhooks |
| Freshchat | https://www.freshworks.com/live-chat-software/ | Yes (up to 10 agents) | Website chat widget + "Riley" bot + human escalation |
| OpenRouter | https://openrouter.ai | Pay-as-you-go (load $10+) | Backend AI: booking extraction, sentiment, report writing |
| Apollo.io | https://www.apollo.io | Yes, then Basic | Cold email sequences + reply detection |
| HubSpot | https://app.hubspot.com/signup-hubspot/crm | Yes (free forever) | Lead/client pipeline + deal tracking |
| Stripe | https://dashboard.stripe.com/register | Yes (pay 2.9% + 30¢ per charge) | Monthly subscription billing |
| Google Workspace / Gmail | https://workspace.google.com | Free Gmail works (Workspace needed for HIPAA only) | Calendar + Gmail send + OAuth |
| Calendly | https://calendly.com/signup | Yes | Discovery-call booking |

> **Compliance note (read once):** Per the Compliance Guide, start with NON-healthcare clients only (plumbers, HVAC, accountants, auto repair, salons). Do NOT target dentists or medical practices until the HIPAA "Option B" stack (direct Anthropic API + signed BAAs) is in place. OpenRouter does not sign BAAs, so the default stack in this guide is NOT HIPAA-compliant.

---

## Part 1 — Fill In Your .env File

> The `.env` file is the master key store. NOTHING in the rest of this guide works until every required key is filled in. You will leave a few values blank now and come back to fill them in Parts 2–5 (they say so explicitly below).

### Step 1.1 — Copy the Template

**Open PowerShell and copy the template to a live `.env` file.**

- Open PowerShell (press `Win`, type `PowerShell`, press Enter).
- Run this exact command:

```powershell
Copy-Item "C:\Users\Brian\Documents\CWI AI\cwi-automation\.env.template" "C:\Users\Brian\Documents\CWI AI\cwi-automation\.env"
```

- Open the new file in Notepad to edit it:

```powershell
notepad "C:\Users\Brian\Documents\CWI AI\cwi-automation\.env"
```

**Success looks like:** A file named `.env` now exists in the `cwi-automation` folder and is open in Notepad, showing variable names like `OPENROUTER_API_KEY=sk-or-xxxx`. Every value currently ends in `xxxx` — your job is to replace each one.

### Step 1.2 — Get Your OpenRouter Keys

**Create an OpenRouter API key and verify the model strings.**

- Go to: https://openrouter.ai
- Click **Sign In** (top-right) → create an account or log in (Google sign-in is fine).
- Click your **profile icon** (top-right circle) → click **Keys** (also reachable at https://openrouter.ai/keys).
- Click **Create Key** → in the name field type `CWI Automation` → click **Create**.
- Copy the full key (it starts with `sk-or-`). You will not be able to see it again — copy it now.
- In `.env`, replace the line so it reads: `OPENROUTER_API_KEY=sk-or-yourrealkey`
- Leave this line exactly as-is: `OPENROUTER_BASE_URL=https://openrouter.ai/api/v1`
- **Set the primary model:** Go to https://openrouter.ai/models → in the search box type `claude sonnet` → find the current Claude Sonnet entry → click it → copy the exact model ID shown (it is in `provider/model` format, e.g. `anthropic/claude-sonnet-4.6`). Set: `OPENROUTER_PRIMARY_MODEL=anthropic/claude-sonnet-4.6` (use the exact string you copied — the template ships with `anthropic/claude-sonnet-4-5`, which may be outdated).
- **Set the fallback model:** Search `gemini flash` on the same models page → copy the current ID → set: `OPENROUTER_FALLBACK_MODEL=google/gemini-2.5-flash`
- **Load credits:** Click your profile icon → **Credits** → add **$10 or more**. Free models throttle after ~50 requests and will break automations.

> CRITICAL: Never use a raw Anthropic string like `claude-sonnet-4-20250514` — OpenRouter rejects it with "invalid request format" and every AI call fails silently. Always use the `provider/model` format. Re-verify these strings every 3 months; they drift.

**Success looks like:** `OPENROUTER_API_KEY`, `OPENROUTER_PRIMARY_MODEL`, and `OPENROUTER_FALLBACK_MODEL` all hold real values copied from the OpenRouter site, and your Credits balance shows $10+.

### Step 1.3 — Get Your Freshchat Keys

**Get your Freshchat API token, domain, and (later) bot ID.**

- Go to: https://web.freshchat.com → log in.
- **FRESHCHAT_API_KEY:** Click the **gear icon** (Admin Settings, top-right) → under **Integrations / Configure** click **API Tokens** → click **Generate Token** → copy the token → set `FRESHCHAT_API_KEY=yourtoken`.
- **FRESHCHAT_DOMAIN:** Look at your browser's address bar while logged in. It shows your subdomain, e.g. `https://cwiai-12345.freshchat.com`. Paste the **full URL including `https://`** → set `FRESHCHAT_DOMAIN=https://cwiai-12345.freshchat.com` (use your real subdomain, with NO trailing slash).
- **FRESHCHAT_BOT_ID:** Leave this as `xxxx` for now. You will create the bot in Part 6 and fill this in at Step 6.5.

> Known quirk: the verification script (Step 1.10) always reports the Freshchat connection as failed because of a double-`https://` bug in the script. Ignore that one failure — you will test Freshchat manually in Part 6 and Part 9.

**Success looks like:** `FRESHCHAT_API_KEY` and `FRESHCHAT_DOMAIN` hold real values. `FRESHCHAT_BOT_ID` is still `xxxx` (expected at this stage).

### Step 1.4 — Get Your Google OAuth Keys

**Create a Google Cloud project and OAuth credentials for calendar access.**

- Go to: https://console.cloud.google.com
- At the top bar, click the **project dropdown** → **New Project** → name it `CWI Automation` → click **Create**. Wait for it to finish, then select that project from the dropdown.
- In the left menu, go to **APIs & Services** → **Library**. Search `Google Calendar API` → click it → click **Enable**. Go back to Library, search `Gmail API` → click it → click **Enable**.
- Go to **APIs & Services** → **OAuth consent screen** → select **External** → click **Create**. Fill: App name `CWI AI`, User support email `brian@cwiai.net`, Developer contact `brian@cwiai.net` → **Save and Continue** through the steps. On the **Test users** step, click **Add Users** → add `brian@cwiai.net` (and each client's Google email later) → **Save**.
- Go to **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID** → Application type **Web application** → name `CWI Make`.
- Under **Authorized redirect URIs**, click **Add URI** and add: `https://www.make.com/oauth/cb/google` — then add a second URI: `https://www.integromat.com/oauth/cb/google-custom` (Make may use either). Click **Create**.
- A dialog shows your **Client ID** and **Client secret**. Copy each:
  - Set `GOOGLE_CLIENT_ID=` (paste the Client ID, ends in `.apps.googleusercontent.com`).
  - Set `GOOGLE_CLIENT_SECRET=` (paste the Client secret).
- **GOOGLE_CALENDAR_ID:** Go to https://calendar.google.com → on the left, hover the target calendar → click the **⋮ (three dots)** → **Settings and sharing** → scroll to **Integrate calendar** → copy the **Calendar ID** (a shared calendar ends in `@group.calendar.google.com`; a personal calendar is the account email). Set `GOOGLE_CALENDAR_ID=` to that value.

**Success looks like:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_CALENDAR_ID` all hold real values, and both Calendar API and Gmail API show "Enabled" in the Google Cloud Console.

### Step 1.5 — Get Your Apollo Keys

**Get your Apollo API key (the webhook secret comes later).**

- Go to: https://app.apollo.io → log in.
- Click **Settings** (bottom of the left sidebar) → **Integrations** → find **API** → click **Connect** or **Create new key**.
- Copy the key → set `APOLLO_API_KEY=yourkey`.
- **APOLLO_WEBHOOK_SECRET:** Leave as `xxxx` for now. Apollo generates this when you create the webhook in Step 5.2 — you will fill it in then.

**Success looks like:** `APOLLO_API_KEY` holds a real value; `APOLLO_WEBHOOK_SECRET` is still `xxxx` (expected).

### Step 1.6 — Get Your HubSpot Keys

**Create a HubSpot Private App and copy its access token.**

- Go to: https://app.hubspot.com → log in (sign up first at https://app.hubspot.com/signup-hubspot/crm with `brian@cwiai.net`, choosing the **Free CRM** — no credit card).
- Click the **Settings gear** (top-right) → in the left menu go to **Integrations** → **Private Apps** → click **Create a private app**.
- On the **Basic Info** tab, name it `CWI Automation`.
- Click the **Scopes** tab → search and check each of these:
  - `crm.objects.contacts.read`
  - `crm.objects.contacts.write`
  - `crm.objects.deals.read`
  - `crm.objects.deals.write`
  - `crm.objects.companies.read`
  - `crm.objects.companies.write`
  - `crm.schemas.contacts.read`
- Click **Create app** → confirm in the dialog → click **Show token** → copy the token (starts with `pat-`) → set `HUBSPOT_API_KEY=pat-yourtoken`.
- **HUBSPOT_PIPELINE_ID** and the **HUBSPOT_STAGE_*** values: Leave as `xxxx` for now — you get these in Part 2 (Step 2.2) after building the pipeline.

**Success looks like:** `HUBSPOT_API_KEY` holds a real `pat-` token; the pipeline and stage IDs are still `xxxx` (expected).

### Step 1.7 — Get Your Stripe Keys

**Copy your Stripe live secret key (webhook secret comes later).**

- Go to: https://dashboard.stripe.com → log in.
- Complete business activation if prompted (LLC details + bank account) so you can use Live mode.
- Toggle **Test mode** OFF (switch at the top-right) so you are in **Live mode**.
- Go to **Developers** → **API keys** → under **Secret key** click **Reveal live key** → copy the value (starts with `sk_live_`) → set `STRIPE_API_KEY=sk_live_yourkey`.
- **STRIPE_WEBHOOK_SECRET:** Leave as `xxxx` for now — you get it in Step 5.4 after registering the webhook.

> If you are not yet activated for Live mode, you may temporarily use the **Test mode** secret key (`sk_test_...`) for testing, but switch to `sk_live_` before charging real clients.

**Success looks like:** `STRIPE_API_KEY` holds a real `sk_live_` (or `sk_test_`) key; `STRIPE_WEBHOOK_SECRET` is still `xxxx` (expected).

### Step 1.8 — SMTP Settings (Gmail App Password)

**Configure Gmail for automated sending using an App Password (not your login password).**

- The sending account is `brian@cwiai.net`. Leave these lines as-is in `.env`:
  - `SMTP_HOST=smtp.gmail.com`
  - `SMTP_PORT=587`
  - `SMTP_USER=brian@cwiai.net`
- Enable 2FA on that Google account first: go to https://myaccount.google.com/security → **2-Step Verification** → turn it **On** (required before App Passwords appear).
- Go to: https://myaccount.google.com/apppasswords → in the app-name box type `CWI Make SMTP` → click **Create**.
- Copy the 16-character password shown → **remove all spaces** → set `SMTP_PASSWORD=abcd1234efgh5678` (your real 16 characters, no spaces).

**Success looks like:** `SMTP_PASSWORD` holds a 16-character string with no spaces, and the Gmail account shows 2-Step Verification is on.

### Step 1.9 — Alert Email and Calendly

**Set your alert email and Calendly values.**

- **ALERT_EMAIL:** Leave as `ALERT_EMAIL=brian@cwiai.net`. This is where error and escalation alerts go.
- **CALENDLY_API_KEY:** Go to https://calendly.com → click **Account** (bottom-left) → **Integrations & apps** → **API & webhooks** → click **Generate token** (Personal Access Token) → name it `CWI Automation` → copy it → set `CALENDLY_API_KEY=yourtoken`.
- **CALENDLY_EVENT_TYPE_URI:** On the same API page (or by browsing https://api.calendly.com/event_types in your browser while authenticated), find your 20-minute discovery event's `uri` value — it looks like `https://api.calendly.com/event_types/XXXXXXXX`. Set `CALENDLY_EVENT_TYPE_URI=https://api.calendly.com/event_types/XXXXXXXX`.
- **CLIENT_* fields** (`CLIENT_NAME`, `CLIENT_EMAIL`, `CLIENT_PHONE`, `CLIENT_ADDRESS`, `CLIENT_HOURS`, `CLIENT_EMERGENCY_PHONE`): Leave all blank during initial system setup. You fill these per client from the intake form when onboarding.
- Save the file in Notepad (`Ctrl+S`) and close it.

**Success looks like:** `ALERT_EMAIL`, `CALENDLY_API_KEY`, and `CALENDLY_EVENT_TYPE_URI` hold real values; `CLIENT_*` fields are blank; the file is saved.

### Step 1.10 — Run the Verification Script

**Run the setup script to confirm your keys are valid.**

- In PowerShell, run:

```powershell
& "C:\Users\Brian\Documents\CWI AI\cwi-automation\scripts\setup-env.ps1"
```

- Watch the output. Each variable should print a green `[OK]` line, ending with something like `X/4 API connections verified.`

**Known script issues — do NOT panic over these (they are script bugs, not your errors):**
- The script reports `ADMIN_EMAIL` and `MAKE_BOOKING_WEBHOOK_URL` as `[MISSING]`. Those names are wrong in the script — the template uses `ALERT_EMAIL` and has no Make webhook variable. **Ignore both warnings.**
- The script's placeholder check looks for `your_` but the template uses `xxxx`. A leftover `xxxx` value will pass as "OK" but then fail the live API test. **If a connection test fails, double-check you actually replaced every `xxxx` with a real key.**
- The **Freshchat** test always fails (it builds `https://https://...`). **Ignore that one failure** — verify Freshchat manually in Part 6/9.

**Success looks like:** OpenRouter, HubSpot, and the other testable connections show `[OK]`. The only "failures" you see are the three known script bugs above. Any other failure means a real key is wrong or still set to `xxxx` — go back and fix it.

---

## Part 2 — HubSpot CRM Setup

### Step 2.1 — Create the Sales Pipeline

**Build the deal pipeline with all 10 stages in order.**

- Go to: https://app.hubspot.com → in the top nav click **CRM** → **Deals**.
- At the top-left of the board, click the **pipeline name dropdown** → **Manage pipelines**. (Alternate path: **Settings gear** → **Objects** → **Deals** → **Pipelines**.)
- Click **Create pipeline** → name it exactly `AI Automation Sales` → click **Create**.
- Click **+ Add a stage** for each of the following, in this exact order, and set the **Deal probability %** for each:
  1. `New Lead` — 10%
  2. `Replied` — 20%
  3. `Call Booked` — 35%
  4. `Proposal Sent` — 55%
  5. `Negotiating` — 75%
  6. `Closed Won` — 100%
  7. `Closed Lost` — 0%
  8. `Active Client` — 100%
  9. `At Risk` — 90%
  10. `Churned` — 0%
- Click **Save**.

**Success looks like:** The Deals board now shows a pipeline named "AI Automation Sales" with all 10 columns/stages in the order above.

### Step 2.2 — Get the Pipeline ID and Stage IDs

**Retrieve the internal IDs (NOT the display names) via the HubSpot API.**

> The names like "New Lead" are NOT the IDs. The automations need the internal IDs. The reliable way is the API call below.

- In PowerShell, run this (replace the token with your real `pat-` token from Step 1.6):

```powershell
$h = @{ Authorization = "Bearer pat-YOUR-REAL-TOKEN" }
Invoke-RestMethod -Uri "https://api.hubapi.com/crm/v3/pipelines/deals" -Headers $h | ConvertTo-Json -Depth 6
```

- In the JSON output, find the pipeline whose `label` is `AI Automation Sales`. Copy its `id` value → set `HUBSPOT_PIPELINE_ID=` to that value in `.env`.
- Inside that pipeline, each stage object has both a `label` and an `id`. Copy the `id` (not the label) for each stage into the matching `.env` variable:
  - `New Lead`'s id → `HUBSPOT_STAGE_NEW_LEAD=`
  - `Replied`'s id → `HUBSPOT_STAGE_REPLIED=`
  - `Call Booked`'s id → `HUBSPOT_STAGE_CALL_BOOKED=`
  - `Proposal Sent`'s id → `HUBSPOT_STAGE_PROPOSAL_SENT=`
  - `Closed Won`'s id → `HUBSPOT_STAGE_CLOSED_WON=`
  - `Active Client`'s id → `HUBSPOT_STAGE_ACTIVE_CLIENT=`
- Save `.env`.

**Success looks like:** `HUBSPOT_PIPELINE_ID` and all six `HUBSPOT_STAGE_*` variables hold numeric/string IDs copied from the JSON, with no remaining `xxxx` values.

### Step 2.3 — Create Custom Contact Properties

**Add the 13 custom contact properties the system relies on.**

- Go to **Settings gear** → in the left menu **Properties** → set the **Select an object** dropdown to **Contact properties** → click **Create property**.
- For each property below: set **Object type** = Contact, type the **Label** exactly, choose the **Field type**, add the dropdown options where listed, then click **Create**. Repeat for all 13:
  1. `Industry` — Dropdown select — options: `Plumber, HVAC, Dentist, Accountant, Retail, Salon, Other`
  2. `City` — Single-line text
  3. `Monthly Contacts Volume` — Number
  4. `Number of Locations` — Number
  5. `Current Software` — Single-line text
  6. `Pricing Tier` — Dropdown select — options: `Starter, Growth, Pro, Custom`
  7. `Monthly Fee` — Number (set the field to currency format)
  8. `Setup Fee Collected` — Single checkbox
  9. `Go-Live Date` — Date picker
  10. `NPS Score` — Number
  11. `Last Check-In` — Date picker
  12. `Support Tickets This Month` — Number
  13. `Containment Rate` — Number (percentage)

**Success looks like:** All 13 properties appear in the Contact properties list and can be added to a contact record.

### Step 2.4 — Create Custom Company Properties (for Scenario C reports)

**Add the company properties used by the monthly report scenario.**

- Same path: **Settings gear** → **Properties** → set the dropdown to **Company properties** → **Create property**.
- For each below: Object type = Company, type the **Label**, set Field type, click **Create**:
  1. `CWI Last Report Month` — Single-line text
  2. `CWI Total Conversations` — Number
  3. `CWI Bot Resolved` — Number
  4. `CWI Containment Rate` — Number (percentage)
  5. `CWI Escalation Rate` — Number (percentage)
  6. `CWI Appointments Booked` — Number
  7. `CWI Avg Response Time` — Number
  8. `CWI Report Sent Date` — Date picker

**Success looks like:** All 8 CWI company properties appear in the Company properties list. Scenario C will write its monthly numbers into these fields.

### Step 2.5 — Connect Gmail and Google Calendar to HubSpot

**Link your email and calendar so HubSpot can track activity.**

- Go to **Settings gear** → **General** → **Email** tab → **Connect personal email** → choose **Google / Gmail** → authorize `brian@cwiai.net`.
- Go to **Settings gear** → **General** → **Calendar** → **Connect your calendar** → **Google Calendar** → authorize.
- Optional but recommended: install the **HubSpot Sales Chrome extension** (search "HubSpot Sales" in the Chrome Web Store) for email open/click tracking.

**Success looks like:** The Email tab shows your Gmail as "Connected" and the Calendar shows your Google Calendar as connected.

---

## Part 3 — Google Sheets Setup (needed by Scenario C)

### Step 3.1 — Create the ActiveClients Spreadsheet

**Build the spreadsheet Scenario C reads to know which clients to report on.**

- Go to: https://sheets.google.com → click **Blank spreadsheet** (the `+` tile).
- Rename the file: click the title `Untitled spreadsheet` (top-left) → type `CWI Active Clients` → press Enter.
- Rename the first tab: double-click the tab name `Sheet1` (bottom-left) → type `ActiveClients` → press Enter.
- In **row 1**, type these column headers starting at cell A1, one per cell across columns A–G:
  - A1: `client_name`
  - B1: `client_email`
  - C1: `freshchat_account_id`
  - D1: `google_calendar_id`
  - E1: `hubspot_company_id`
  - F1: `industry`
  - G1: `calendly_link`
- Add an example client in row 2 to test against later, e.g.: `Joe's HVAC | joe@joeshvac.com | (your Freshchat account id) | abc@group.calendar.google.com | (HubSpot company id) | HVAC | https://calendly.com/cwiai/20min`

**Success looks like:** A Google Sheet named "CWI Active Clients" with a tab named "ActiveClients" containing the 7 headers in row 1 and at least one example row.

### Step 3.2 — Get the Spreadsheet ID

**Copy the spreadsheet ID for Make to reference.**

- Look at the browser URL while the sheet is open. It reads: `https://docs.google.com/spreadsheets/d/`**`1AbCdEf...XyZ`**`/edit#gid=0`
- Copy the long string between `/d/` and `/edit` — that is the Spreadsheet ID.
- You will paste this ID into the Google Sheets module inside Scenario C in Part 4. (If your `.env` has a `GOOGLE_SHEETS_ID` slot, paste it there too; otherwise keep it noted in Bitwarden.)

**Success looks like:** You have the Spreadsheet ID string copied and saved where you can find it for Part 4.

### Step 3.3 — Share the Sheet (connection access)

**Make sure the account Make uses can read the sheet.**

- If your Make Google Sheets connection uses the same Google account (`brian@cwiai.net`) that owns this sheet, no sharing is needed — skip this step.
- If you use a separate Google **service account** for the Make connection: click **Share** (top-right of the sheet) → paste the service account's email (ends in `...iam.gserviceaccount.com`) → set its access to **Editor** → click **Send**.

**Success looks like:** The account Make authenticates with has at least Editor access to the "CWI Active Clients" sheet.

---

## Part 4 — Make.com Setup

### Step 4.1 — Create Account and Choose Plan

**Sign up for Make and confirm you have instant webhooks.**

- Go to: https://www.make.com/en/register → sign up.
- **Confirm your plan supports INSTANT webhooks.** The Free plan relies on polling, which adds up to a 15-minute delay — fatal for the live booking flow. Upgrade: click your **profile** (bottom-left) → **Subscription** → choose **Core** (~$10.59/mo for 5,000 operations).

**Success looks like:** You are logged into Make on the **Core** plan (or higher), shown under Subscription.

### Step 4.2 — Import All 7 Scenarios

**Import each scenario blueprint from the project folder.**

- For EACH file below, do this: Make dashboard → click **Scenarios** (left menu) → **Create a new scenario** → in the scenario editor click the **⋯ (three dots)** at the bottom-center → **Import Blueprint** → **Choose a file** → browse to `C:\Users\Brian\Documents\CWI AI\cwi-automation\make-scenarios\` → select the JSON → **Save**.
- Import all 7:
  1. `scenario-a-booking-flow.json` — Handles booking requests from Freshchat (Freshchat webhook → OpenRouter extract → Google Calendar → confirm message + email).
  2. `scenario-b-missed-followup.json` — Every 30 min, finds unanswered chats older than 2 hours and drafts a follow-up.
  3. `scenario-c-monthly-report.json` — First Monday 8 AM, builds each client's KPI report, emails it, updates HubSpot.
  4. `scenario-d-apollo-hubspot.json` — Apollo sequence enrollment → create/update HubSpot contact + deal.
  5. `scenario-e-lead-routing.json` — Apollo reply → OpenRouter sentiment → branch to HubSpot/Apollo/email.
  6. `scenario-f-payment-logging.json` — Stripe payment → HubSpot activity + deal update.
  7. `scenario-g-calendly-hubspot.json` — Calendly booking → HubSpot contact (its webhook is an inline object and must be re-created manually after import — see Step 5.5).
  8. `scenario-h-client-onboarding.json` — Client Onboarding: fires on HubSpot Closed Won webhook → provisions the client workspace, sends welcome email, and creates the ActiveClients sheet row.
  9. `scenario-i-payment-failure-dunning.json` — Payment Failure and Dunning: triggered by Stripe `payment_intent.payment_failed` → sends dunning email sequence and flags the deal in HubSpot as At Risk.
  10. `scenario-j-review-request.json` — Review Request: triggered by Calendly `invitee.created` → waits 48 hours after the event, then sends a review-request email to the invitee.
  11. `scenario-k-weekly-digest.json` — Weekly Digest: scheduled trigger every Monday at 8 AM ET → compiles the week's activity from HubSpot and Freshchat and emails a digest to `brian@cwiai.net`.
  12. `scenario-l-no-show-recovery.json` — No-Show Recovery: triggered by Calendly `invitee.canceled` → sends a recovery email offering to rebook and updates the HubSpot deal stage.
  13. `scenario-m-appointment-reminder.json` — Appointment Reminder: triggered by Calendly `invitee.created` → calculates the event start time, waits until 24 hours before the event, then sends a reminder email to the invitee.

**Success looks like:** Thirteen scenarios appear in your Make Scenarios list, each opening in the editor with its modules visible (some modules will show a warning icon until connections are mapped in Step 4.4).

### Step 4.3 — Create Connections

**Create one reusable connection per service.**

- Go to **Connections** (left menu) → **Add** → choose the service → authenticate. Create each:
  - **OpenRouter (HTTP):** These calls use the generic HTTP module, so no stored connection is required — but inside any OpenRouter HTTP module the URL is `https://openrouter.ai/api/v1/chat/completions` with headers `Authorization: Bearer {{OPENROUTER_API_KEY}}` and `Content-Type: application/json`. The request body must use the `provider/model` format (e.g. `anthropic/claude-sonnet-4.6`). NOTE: Scenarios C and E may still contain the old `claude-sonnet-4-20250514` string in their prompt body — open those modules and replace it with your OpenRouter model ID.
  - **Freshchat (HTTP):** Freshchat calls also use the HTTP module with header `Authorization: Bearer {{FRESHCHAT_API_KEY}}` and base URL `https://[your-subdomain].freshchat.com/v2`.
  - **Google Calendar (OAuth2):** Add → **Google Calendar** → **Sign in with Google** → authorize the **client's** Google account (for your own testing, use `brian@cwiai.net`) → grant the scope `https://www.googleapis.com/auth/calendar`. This is manual OAuth — tokens can expire silently, so the weekly test booking in Part 11 is mandatory.
  - **Gmail (OAuth2):** Add → **Gmail** → sign in as `brian@cwiai.net` → grant the Send scope.
  - **HubSpot:** Add → **HubSpot CRM** → choose **Private App Token** → paste your `pat-` token (`HUBSPOT_API_KEY`).
  - **Stripe:** Add → **Stripe** → paste your `sk_live_` key (`STRIPE_API_KEY`).
  - **Apollo (HTTP):** Apollo calls use the HTTP module with header `Authorization: Bearer {{APOLLO_API_KEY}}`.

**Success looks like:** Under Connections you see named entries for Google Calendar, Gmail, HubSpot, and Stripe, each showing a connected/verified state.

### Step 4.4 — Map Connections to Scenarios

**Assign the right connection to every module that needs one.**

- Open each imported scenario. Any module with a broken-connection or warning icon needs a connection assigned.
- Click the module → in its settings find the **Connection** dropdown → select the matching connection you created in Step 4.3 → click **OK**.
- In Scenario C, also set the **Spreadsheet** field of the Google Sheets module to your `CWI Active Clients` sheet (or paste the Spreadsheet ID from Step 3.2) and confirm the tab is `ActiveClients`.
- Do this for all 7 scenarios until no module shows a warning icon (the webhook trigger modules will still need their URLs registered in Part 5 — that's expected).

**Success looks like:** Every non-webhook module in all 7 scenarios shows a valid connection (no broken-connection icons). Webhook trigger modules are the only items still pending (handled in Part 5).

---

## Part 5 — Register Webhooks

> After import, Make generates a unique webhook URL for each webhook trigger module. You copy each URL and register it with the source service so events flow into Make. Leave each scenario OFF until its webhook is registered, then turn it ON at the end.

### Step 5.1 — Scenario A Webhook → Freshchat

**Wire the Freshchat booking webhook into Scenario A.**

- In Make, open **Scenario A** → click the first module (the **Custom Webhook** trigger) → click **Add** → name it `Freshchat Booking` → copy the generated URL (looks like `https://hook.us1.make.com/xxxx`).
- Go to https://web.freshchat.com → **Admin Settings (gear)** → **Webhooks** (may appear under **Marketplace → Webhook**) → paste the URL → set the trigger to fire on **New message** → **Save**.
- If Scenario A references `{{connection.FRESHCHAT_WEBHOOK_ID}}`, paste the copied URL into that connection field.

**Success looks like:** The Scenario A webhook shows a URL, and Freshchat lists an active webhook pointing to that Make URL firing on new messages.

### Step 5.2 — Scenario D Webhook → Apollo (enrollment)

**Register the Apollo enrollment webhook and capture the signing secret.**

- In Make, open **Scenario D** → click the first module (webhook trigger) → copy its URL. (Scenario D's hook may be hardcoded to `1` on import — if so, click **Add** to generate a fresh webhook and re-link the module to it.)
- Go to https://app.apollo.io → **Settings** → **Integrations** → **Webhooks** → **New webhook** → paste the URL → set Event to **`contact.enrolled_in_sequence`** → **Save**.
- Copy the **signing secret** Apollo displays → set `APOLLO_WEBHOOK_SECRET=` in `.env` → save `.env`.

**Success looks like:** Apollo lists an active webhook for `contact.enrolled_in_sequence` pointing to the Make URL, and `APOLLO_WEBHOOK_SECRET` now holds a real value.

### Step 5.3 — Scenario E Webhook → Apollo (reply)

**Register the Apollo reply-detection webhook.**

- In Make, open **Scenario E** → click the first module → copy its webhook URL.
- In Apollo → **Settings** → **Integrations** → **Webhooks** → **New webhook** → paste the URL → set Event to **`email.replied`** (reply detection) → **Save**.

**Success looks like:** Apollo lists a second active webhook for the reply event pointing to the Scenario E URL.

### Step 5.4 — Scenario F Webhook → Stripe

**Register the Stripe payment webhook and capture its signing secret.**

- In Make, open **Scenario F** → click the first module → copy its webhook URL.
- Go to https://dashboard.stripe.com → **Developers** → **Webhooks** → **Add endpoint** → paste the URL into **Endpoint URL** → under **Select events** choose **`payment_intent.succeeded`** → click **Add endpoint**.
- Click the new endpoint → find **Signing secret** → click **Reveal** → copy the value (starts with `whsec_`) → set `STRIPE_WEBHOOK_SECRET=whsec_yourvalue` in `.env` → save.
- (Per client) Create the recurring subscription product: **Products** → **Add product** → set a recurring monthly price for the client's tier.

**Success looks like:** Stripe lists a webhook endpoint for `payment_intent.succeeded` pointing to Make, and `STRIPE_WEBHOOK_SECRET` holds a real `whsec_` value.

### Step 5.5 — Scenario G Webhook → Calendly

**Register the Calendly booking webhook (re-create it manually after import).**

- In Make, open **Scenario G** → click the first module → **Add** a fresh webhook (Scenario G's webhook is an inline object on import and must be re-created) → copy the URL.
- Go to https://calendly.com → **Account** (bottom-left) → **Integrations & apps** → **API & webhooks** → **Webhook subscriptions** → **Create** → paste the URL → set Event to **`invitee.created`** → set Scope to **User** → **Create**.

**Success looks like:** Calendly lists an active webhook subscription for `invitee.created` pointing to the Scenario G URL.

### Step 5.6 — Turn Every Scenario ON

**Activate all scenarios so they listen for events.**

- Open each of the 13 scenarios → at the bottom-left, toggle the switch from **OFF** to **ON** (it will read **Scheduling: ON** for scheduled scenarios B/C/K, and run **Immediately** for webhook scenarios A/D/E/F/G/H/I/J/L/M).

**Success looks like:** All 13 scenarios show an ON/active toggle. Webhook scenarios are "listening"; scheduled scenarios B, C, and K show their next-run time.

---

## Part 6 — Freshchat Bot Setup

> Source of truth for the bot content: `C:\Users\Brian\Documents\CWI AI\cwi-automation\freshchat\bot-flows.json` (welcome message, after-hours message, and 6 flows) and `C:\Users\Brian\Documents\CWI AI\cwi-automation\freshchat\knowledge-base-template.json` (Q&A pairs). Open `bot-flows.json` in Notepad alongside Freshchat as you build.

### Step 6.1 — Create the Bot

**Create the "Riley" bot.**

- Go to https://web.freshchat.com → **Admin Settings (gear)** → **Bots** → **Create Bot** → name it `Riley` → choose a **blank / custom flow** bot → **Create**.

**Success looks like:** A bot named "Riley" exists and opens in the bot editor.

### Step 6.2 — Configure the Welcome and After-Hours Messages

**Paste the welcome message (with AI disclosure) and the after-hours message.**

- In the bot editor → **Settings** → **Welcome Message** field → paste the `welcome_message` value verbatim from `bot-flows.json`:
  *"Hi! I'm Riley, CWI AI's virtual assistant. I can help with booking, pricing, hours, and more. What can I help you with today?"*
- The welcome MUST identify Riley as an AI assistant (compliance requirement). If the welcome line above is used as-is, ensure the fallback flow (Step 6.3) keeps its explicit "I am Riley, the AI assistant for CWI AI" text, OR edit the welcome to add "(an AI assistant)".
- Set the **after-hours message** from the JSON's `after_hours_message`:
  *"Thanks for reaching out! Our team is currently offline, but Riley is always here. Leave your contact info and Brian will follow up first thing in the morning (Mon–Fri, 9 AM ET)."*

**Success looks like:** The bot's welcome message matches the JSON and clearly discloses Riley is an AI; the after-hours message is set.

### Step 6.3 — Add Each Flow

**Build all 6 flows from the JSON.**

- For each of the 6 flows in the `flows` array of `bot-flows.json` — `booking`, `pricing`, `hours`, `emergency`, `fallback`, `human_handoff` — create a flow in the bot editor and configure:
  - Add the **trigger keywords** from that flow's `trigger_keywords` array (the `fallback` flow has no keywords — set it as the default/no-match flow).
  - Add each message bubble in order from `messages[].text`.
  - For any message with `quick_replies`, add those as quick-reply buttons (e.g. pricing flow buttons "Book a free demo" and "See full pricing").
  - Apply each flow's `actions`:
    - `type: label` → add that conversation label (e.g. `booking-request`, `needs-follow-up`).
    - `type: priority`, value `high` → set conversation priority to high (emergency flow).
    - `type: assign_human`, value `true` → enable handoff to a live agent (emergency, fallback, human_handoff).
    - `type: link` → make a button link to `https://cwiai.net/pricing.html` (pricing flow).
- Set **escalation:** 30-minute inactivity → transfer to a human agent.
- Set **business hours:** Mon–Fri 9 AM–6 PM ET.

> Note: the JSON is hardcoded with "Riley", "CWI AI", the phone `(734) 812-9971`, and the CWI pricing link. For a CLIENT bot, replace those with the client's name, phone, and link.

**Success looks like:** Six flows exist in Riley with the correct trigger keywords, message bubbles, quick replies, and actions. Sending a keyword like "book" or "price" routes to the matching flow.

### Step 6.4 — Load the Knowledge Base

**Import the Q&A pairs (20+ pairs).**

- In the bot/Admin area go to **Knowledge Base** / **FAQs**. If an **Import** option exists, choose it and select `C:\Users\Brian\Documents\CWI AI\cwi-automation\freshchat\knowledge-base-template.json`.
- If there is no JSON import, add each pair manually: **Add Article** → put the question as the **title** and the answer as the **body** → repeat for every pair in the template (at least 20).
- For a client bot, every answer must be approved by the client in writing before go-live.

**Success looks like:** The Freshchat Knowledge Base shows 20+ Q&A articles. A question matching one of them returns the correct answer in chat.

### Step 6.5 — Get the Bot ID and Publish

**Publish the bot and record its ID in `.env`.**

- Publish/enable the bot (look for a **Publish** or **Go Live** toggle in the bot editor).
- Open the bot's settings/edit page and look at the browser URL — the Bot ID appears in it (e.g. `.../bots/edit/<BOT_ID>`). Copy that value → set `FRESHCHAT_BOT_ID=` in `.env` → save.

**Success looks like:** `FRESHCHAT_BOT_ID` holds the real ID (no longer `xxxx`), and Riley is published/live.

---

## Part 7 — Apollo.io Outreach Setup

### Step 7.1 — Create Account

**Set up Apollo and connect a sending inbox.**

- Go to https://www.apollo.io → sign up (Free is fine to start).
- Connect your sending Gmail (Apollo will prompt to connect an email account for sequence sending).

**Success looks like:** You are logged into Apollo with a connected sending inbox.

### Step 7.2 — Import Leads

**Import a lead list — non-healthcare industries only.**

- Generate a list with **Outscraper** (https://outscraper.com, free tier) by scraping Google Maps for Southgate / Downriver, MI businesses. **Start with plumbers and HVAC — do NOT import dentists or any healthcare** until the HIPAA stack is in place (Compliance Guide).
- Export the list as a CSV.
- In Apollo: **Search** → **Import** → **Bulk import from CSV** → map columns (Name, Email, Company, Industry, City) → **Import**.

**Success looks like:** Your imported contacts appear in Apollo with names, emails, company, industry, and city populated.

### Step 7.3 — Create Email Sequences

**Build one sequence per industry using the approved templates.**

- Apollo → **Sequences** → **New Sequence** → create one per industry: `Plumber-HVAC` and `Accountant` (skip `Dentist`).
- Add 3 steps: **Touch 1 — Day 0**, **Touch 2 — Day 4**, **Touch 3 — Day 10**.
- Paste the email bodies from `Ai Business model/Outreach-Email-Sequences.md`. Map merge fields to Apollo's format: use `{{first_name}}` and `{{company_name}}` (replace any `[field]` style placeholders).
- Use **plain text only** (no images/heavy HTML) for deliverability.

**Success looks like:** Each industry has a 3-step sequence with merge fields rendering correctly in Apollo's preview.

### Step 7.4 — Set Daily Send Limits and Reply Detection

**Throttle sending and enable reply auto-pause.**

- Apollo → **Settings** → **Email** → set **Daily email limit** to **50/day** to start (increase only after 2 weeks of warm-up).
- Enable **reply detection** so a contact is auto-paused when they reply (this is what feeds Scenario E). Keep bounce rate **under 2%**.

**Success looks like:** Daily limit is 50, reply detection is on, and replies pause the contact automatically.

---

## Part 8 — Email Deliverability (Critical — do before any outreach)

> Use a SEPARATE domain for cold outreach vs. client-facing delivery. If the outreach domain gets flagged, your client email survives. Add the records below at your domain registrar's DNS settings for `cwiai.net` (or your dedicated outreach domain).

### Step 8.1 — Set Up the SPF Record

**Authorize Google to send mail for your domain.**

- At your domain registrar's DNS panel, add a **TXT** record:
  - **Host/Name:** `@`
  - **Value:** `v=spf1 include:_spf.google.com ~all`
- Save.

**Success looks like:** A TXT record on `@` containing the SPF string exists in DNS.

### Step 8.2 — Set Up DKIM

**Generate and publish a DKIM key (Google Workspace).**

- Go to https://admin.google.com → **Apps** → **Google Workspace** → **Gmail** → **Authenticate email** → **Generate new record** → copy the **host** (`google._domainkey`) and the long **value**.
- At your registrar, add a **TXT** record with Host `google._domainkey` and the copied value.
- Return to the Google Admin page and click **Start authentication**.

**Success looks like:** Google Admin shows DKIM authentication as active, and the `google._domainkey` TXT record resolves in DNS.

### Step 8.3 — Set Up DMARC

**Add a DMARC policy record.**

- At your registrar, add a **TXT** record:
  - **Host/Name:** `_dmarc`
  - **Value:** `v=DMARC1; p=quarantine; rua=mailto:brian@cwiai.net; pct=100`
  - (You may start with `p=none` while warming, then move to `p=quarantine`.)
- Save.

**Success looks like:** A TXT record on `_dmarc` with the DMARC policy exists in DNS.

### Step 8.4 — Warm Up the Domain

**Warm the sending inbox for 2–4 weeks before real cold outreach.**

- Use a warm-up tool such as **Lemwarm** (https://lemwarm.com) or **Mailwarm** → connect your sending inbox → let it run for 2–4 weeks before sending real cold campaigns. Keep volume at ≤50/day and bounce rate <2%.

**Success looks like:** The warm-up tool is connected and running; you do not start real cold outreach until warm-up is complete.

---

## Part 9 — End-to-End Testing

### Step 9.1 — Run the Test Suite

**Run the automated file/string checks.**

- In PowerShell, run:

```powershell
& "C:\Users\Brian\Documents\CWI AI\cwi-automation\scripts\test-suite.ps1"
```

- Expected output: `Results: 11/11 tests passed`. These are file-existence and string checks (scenario A–F JSON present, `bot-flows.json` contains "booking", `.env.template` contains `OPENROUTER_API_KEY`, `.env` exists, `setup-env.ps1` exists, `pricing-calculator.html` exists). It does NOT write a report file.

**Success looks like:** `11/11 tests passed`. A lower number means a file is missing from the project folder — find and restore it.

### Step 9.2 — Test Scenario A (Booking Flow)

**Run a real booking end-to-end.**

- Open the page hosting the Freshchat widget in a browser → open the **Riley** chat widget.
- Type: `I'd like to book an appointment`.
- Answer Riley's prompts: service → preferred date/time → phone number.
- In Make, open **Scenario A** → watch the run execute (green checkmarks on each module).
- Open https://calendar.google.com → confirm a new event appears at the requested time.
- Check the `brian@cwiai.net` inbox → confirm a confirmation email arrived, and confirm the in-chat confirmation message.
- **The total flow must complete in under ~8 seconds.** If no calendar event appears within ~30 seconds, open Scenario A's **History** in Make and read the failed module's error.

**Success looks like:** A calendar event is created, an in-chat confirmation appears, a confirmation email arrives, and the whole round trip is under ~8 seconds.

### Step 9.3 — Test Scenario F (Stripe Payment)

**Fire a test payment event and confirm HubSpot logging.**

- Option A (Stripe Dashboard): https://dashboard.stripe.com → **Developers** → **Webhooks** → click your Scenario F endpoint → **Send test webhook** → choose `payment_intent.succeeded` → **Send**.
- Option B (Stripe CLI): install from https://stripe.com/docs/stripe-cli → run `stripe trigger payment_intent.succeeded`.
- In Make, open **Scenario F** → confirm it ran.
- In HubSpot, open the matching contact/deal → confirm a payment **note/activity** was logged and the deal stage updated (within ~10 seconds).

**Success looks like:** Scenario F shows a successful run and a payment activity appears on the HubSpot record.

### Step 9.4 — Test the Bot

**Send 5 messages to Riley and verify each response.**

1. `book an appointment` → starts the booking flow (asks for service/date/phone).
2. `how much does it cost` → shows the pricing tiers (Starter / Growth / Pro / Custom) with quick replies.
3. `what are your hours` → "Riley is available 24/7! Brian is available Mon-Fri 9am-6pm ET..."
4. `my pipe is flooding` → emergency flow: high priority + "call us at (734) 812-9971" + human assigned.
5. `talk to a human` → human handoff: "I am connecting you to Brian now..."
6. (Bonus) `asdfghjkl` → fallback flow asks for name + phone/email.

**Success looks like:** All five (plus the fallback) return the correct flow's messages, with correct labels/priority/handoff applied.

---

## Part 10 — Docs & Tools Reference

All files live in `C:\Users\Brian\Documents\CWI AI\cwi-automation\docs\`.

| File | What It's For | When to Use |
|---|---|---|
| pricing-calculator.html | Compute setup fee + retainer per tier | During sales calls |
| onboarding-form.html | Client intake form (Sections 1–7) | Before any client build |
| generate-google-form.gs | Apps Script to generate the intake form | One-time form setup |
| operations-manual.md | Day-to-day SOPs | Ongoing operations |
| kpi-dashboard.gs | Apps Script KPI tracker | Monthly reporting |
| metrics-dashboard.html | Visual metrics dashboard | Weekly review |
| support-playbook.html | Troubleshooting steps | When something breaks |
| financial-forecast.html | Revenue / cost projections | Planning |
| contract-generator.html | Generate client contracts (use an attorney-reviewed template) | At close |
| risk-register.html | Tracked risks + mitigations | Monthly review |
| sales-call-script.html | Discovery / close script | Every sales call |
| compliance-checklist.html | HIPAA / LLC / insurance checklist | Before first client |
| 90-day-timeline.html | Launch roadmap | Planning |
| crm-setup-guide.html | HubSpot setup reference | During Part 2 |

### New Tools

The following files were added as part of the H–M scenario expansion and site infrastructure work.

| File | What It's For |
|---|---|
| `new-client.ps1` | PowerShell script to provision a new client — creates the HubSpot company, seeds the ActiveClients sheet row, and sends the welcome email (used by Scenario H). |
| `client-portal.html` | Client-facing portal page; links to the client's booking calendar, monthly report archive, and support contact. |
| `sitemap.xml` | XML sitemap for `cwiai.net`; submitted to Google Search Console to ensure all public pages are indexed. |
| `robots.txt` | Crawler directives for `cwiai.net`; blocks admin/internal paths and points crawlers to `sitemap.xml`. |
| `netlify.toml` | Netlify build and redirect configuration; sets security headers, defines redirect rules, and pins the Node version for any CI build steps. |

---

## Part 11 — Weekly & Monthly Maintenance

**Weekly (approx. 15 min):**
- [ ] Run a **test booking** through Scenario A (catches silent Google OAuth token expiry).
- [ ] Check Make execution history for any **red/failed runs**; clear errors.
- [ ] Confirm error-alert emails are arriving at `brian@cwiai.net` (the automated test-booking alert should fire green).
- [ ] Review Apollo: bounce rate <2%, ≤50 emails/day, sequences not stalled.
- [ ] Check OpenRouter credit balance (top up before it hits $0).
- [ ] Review any escalated conversations / support tickets.

**Monthly (approx. 1 hour, first week):**
- [ ] Verify Scenario C (monthly report) fired on the 1st Monday and clients received reports.
- [ ] Reconcile Stripe payments against HubSpot deal stages.
- [ ] Re-run the 30-question bot accuracy test per client; retrain on any wrong/missing answers.
- [ ] Update the metrics dashboard with last month's numbers; send NPS surveys.
- [ ] Back up: re-export all Make scenario blueprints to the client's folder.
- [ ] Confirm gross margin still above 70%.

**Quarterly:**
- [ ] **Re-verify OpenRouter model strings** at https://openrouter.ai/models (update PRIMARY/FALLBACK if changed).
- [ ] **Rotate all API keys** (90-day cycle) and update Bitwarden + `.env`.
- [ ] Verify third-party pricing hasn't changed (Freshchat, Make, Apollo).

---

## Common Setup Problems

| Problem | Most Likely Cause | Fix |
|---|---|---|
| Make scenario not triggering | Webhook not registered, or wrong URL pasted at the source service | Re-copy the webhook URL from the scenario's trigger module and re-register it (Part 5). Confirm the scenario is toggled ON. |
| Booking flow is slow / delayed by minutes | You're on a polling trigger / Free plan | Confirm Make is on **Core** and Scenario A's module 1 is a **Custom Webhook**, not a scheduled trigger. |
| Bot not responding | `FRESHCHAT_API_KEY` wrong, or bot not published | Re-generate the token (Step 1.3), confirm Riley is published (Step 6.5), and send a manual test chat. |
| OpenRouter calls fail (400/404 model error) | Raw Anthropic model string used | Replace with `provider/model` format (e.g. `anthropic/claude-sonnet-4.6`). Check Scenarios C and E prompt bodies for the old `claude-sonnet-4-20250514`. |
| Google Calendar not writing events | OAuth token expired silently | In Make → **Connections** → Google Calendar → **Re-authorize**. Run the weekly test booking to confirm. |
| HubSpot API 400 error | Stage values are labels, not internal IDs | Get the internal IDs via the API call in Step 2.2 and paste those into the `HUBSPOT_STAGE_*` vars. |
| Emails going to spam | SPF/DKIM/DMARC not set, or domain not warmed | Complete all of Part 8 and finish the 2–4 week warm-up before real outreach. |
| `setup-env.ps1` says `ADMIN_EMAIL` / `MAKE_BOOKING_WEBHOOK_URL` missing | Known script name mismatch | Ignore — the template uses `ALERT_EMAIL` and has no Make webhook var. |
| Freshchat connection test fails in `setup-env.ps1` | Known script bug (double `https://`) | Ignore the script result; verify Freshchat manually via a live test chat (Part 9.4). |
| `xxxx` values "pass" but live API fails | Script's placeholder check looks for `your_`, not `xxxx` | Open `.env` and confirm every `xxxx` was replaced with a real key. |

---

*Secrets live ONLY in Bitwarden. Never commit `.env`. Never store keys in Obsidian or backup folders. On every critical scenario, build the error-alert email route FIRST. Start non-healthcare only until the HIPAA stack (direct Anthropic API + signed BAAs) is in place.*
