# CWI AI — Operations Manual

> **Version:** 1.0 | **Created:** 2026-06-08 | **Owner:** Brian (CWI AI LLC)
> This is your internal playbook. Every section maps to a real stage in the business. Follow it in order.

---

## Capacity Model

Before taking on any client, know your ceiling. At 5 hours/week (~20 hours/month), here is where your time goes:

| Activity | Hours / Client / Month |
|---|---|
| Ongoing maintenance | 1–2 hrs |
| Support tickets | 0.5–1 hr |
| Monthly check-in | 0.5 hr |
| **Total per client** | **2–3.5 hrs/month** |

**Maximum sustainable clients at 5 hrs/week: 5–8 clients.**

Beyond 8 clients without automation or a hire, quality breaks down. The answer is always: automate more first, then hire.

---

## Stage 1 — Client 1: Prove It Works

**Goal:** Deliver a working system, document every step, build reusable templates.
**Time target:** Build complete within 2 weeks of signed contract.

### SOP — Client 1 Onboarding

1. **Complete full onboarding intake form with client.**
   Collect: business name, services offered, hours of operation, top 10 FAQ answers, Google Calendar access credentials, website admin access. Do not begin building until all access is confirmed in writing.

2. **Verify Google Calendar access (test write).**
   Log into the client's Google Calendar via the shared service account. Create a test event titled "CWI AI Test — Delete Me," confirm it appears, then delete it. If write access fails, stop and resolve before proceeding.

3. **Build Freshchat bot flows (use bot-flows.json template).**
   Load the `bot-flows.json` template from the project repo. Customize the greeting, fallback message, business hours response, and appointment booking flow for this client's industry. Save a client-specific copy named `[client-slug]-bot-flows.json`.

4. **Load the knowledge base (minimum 20 Q&As from client).**
   Use the intake form answers plus the client's website FAQ page. Format each entry as a question/answer pair in Freshchat's knowledge base. Minimum 20 entries before go-live. Flag any gaps and get written answers from the client.

5. **Import Make.com Scenario A and Scenario B, configure connections.**
   - Scenario A: Appointment booking trigger → Google Calendar event creation → confirmation message to customer.
   - Scenario B: After-hours message → lead capture form → email notification to client.
   Import both from the saved blueprint files. Update all connection credentials (Freshchat API key, Google Calendar OAuth, client email). Run each scenario once manually to confirm data flows correctly.

6. **Test all 11 items from the testing checklist.**
   Run through every item before any client review. Log pass/fail for each:
   1. Bot greeting fires within 3 seconds of widget load
   2. FAQ questions return correct answers
   3. Appointment booking creates event in Google Calendar
   4. Confirmation message is sent to customer after booking
   5. After-hours message triggers correctly (test outside business hours)
   6. Lead capture form submits and client receives email
   7. Bot handles unrecognized input gracefully (fallback message)
   8. Bot escalates to human correctly when requested
   9. Widget displays correctly on mobile
   10. Widget displays correctly on desktop
   11. All Freshchat analytics events are logging (session start, intent triggered, handoff)

7. **Soft launch: client reviews bot for 48 hours.**
   Enable the widget on a staging page or password-protected URL. Send client a review link and a short feedback form. Give them exactly 48 hours. Collect all feedback, make final adjustments.

8. **Go-live: install widget on client site.**
   Add the Freshchat embed snippet to the client's live website. Confirm the widget appears on all pages. Do a final live test — book a real appointment, confirm it lands in the client's Google Calendar. Notify the client via email that the system is live.

9. **Document everything — every step becomes your SOP template.**
   After go-live, update this SOP with anything that took longer than expected, any access issues encountered, any build steps that were unclear. This document is a living file. Every client makes it sharper.

### Red Flags — Stage 1

| Signal | Action |
|---|---|
| Build exceeding 2 weeks | Scope is too large. Remove one feature, deliver core system first. |
| More than 3 support tickets in first 30 days | Something is broken in delivery. Pause outreach, diagnose and fix before adding clients. |

---

## Stage 2 — Clients 2–3: Systematize

**Goal:** Deliver faster using the templates built in Stage 1. Prove the model repeats.
**Time target:** Full build per client under 1 week from signed contract to go-live.

### SOP — Clients 2 and 3

1. Use the Stage 1 SOP above as your starting checklist for every new client. Do not skip steps.
2. Load the appropriate industry chatbot template (plumber, dentist, accountant) from your template library. Customize rather than build from scratch.
3. Set up a shared client folder in Google Drive for each client: `/Clients/[Client Name]/` containing intake form, bot flows file, testing checklist results, and go-live confirmation.
4. Begin tracking the following metrics monthly for each active client (use the Metrics Dashboard):
   - Total bot sessions
   - Appointments booked via bot
   - Handoffs to human
   - Support tickets received
   - Client satisfaction (ask at 30-day check-in)
5. At 3 active clients, confirm: gross margin is positive, support load is under 3 hours/week total, onboarding is running under 1 week. If any of these fail, fix before taking on client 4.

### Red Flags — Stage 2

| Signal | Action |
|---|---|
| Onboarding still taking more than 2 weeks | The template is not working. Rebuild the template before client 3. |
| Support tickets exceeding 5 per client per month | Delivery issue exists. Identify the root cause before scaling. |

---

## Stage 3 — Clients 4–5: Automate Operations

**Goal:** Remove yourself from as much day-to-day as possible so the business can run without you in the details.

### SOP — Clients 4 and 5

1. **Activate Make.com Scenario C (automated monthly reports).**
   Scenario C pulls Freshchat analytics for each client at the end of the month, formats a summary report (sessions, bookings, handoffs, uptime), and emails it directly to the client. Configure and test this for all existing clients before adding client 4.

2. **Set up Stripe auto-billing.**
   Create a Stripe subscription for each active client. Set billing to auto-charge on the 1st of each month. Remove manual invoicing from your workflow entirely. For clients already on manual invoicing, migrate them with one month's notice.

3. **Automate client check-ins.**
   Replace manual check-in emails with an automated email sequence (via Make.com or your email tool) that sends on day 30 post-go-live, and then monthly thereafter. The email references the client's stats from the monthly report. Only escalate to a personal call if the client responds with a concern.

4. **Consider VA hire at this stage.**
   Evaluate against the trigger conditions below before hiring. Do not hire preemptively.

### When to Hire a VA — Trigger Conditions

Hire when at least two of these are true:

- Support tickets are consuming more than 3 hours/week across all clients
- You have more than 1 client waiting in the onboarding backlog
- You have missed a scheduled check-in or follow-up in the last 30 days
- Revenue is sufficient to cover VA cost ($15–20/hr, 5–10 hrs/week) and still leave positive margin

### VA Delegation List

**Hand off to VA immediately:**

- Responding to client support emails (using the response template library)
- Scheduling onboarding calls and check-in calls
- Sending monthly check-in emails (if not yet automated)
- Following up on late or failed Stripe payments

**Keep for yourself:**

- All sales calls and closing conversations
- All technical builds and system configuration
- Contract review and signing
- Any situation where the client is escalating or unhappy

### Red Flags — Stage 3

| Signal | Action |
|---|---|
| Revenue not covering VA cost + platform costs + margin | Do not hire yet. Automate more first. |
| Churn rate rising as you scale | Slow down. Fix delivery quality before adding clients. |

---

## Stage 4 — 5+ Clients: Scale Revenue

**Goal:** Grow MRR through upsells, new clients, and rate increases simultaneously.

### SOP — 5+ Clients

1. **Upsell Phase 2 services to existing clients.**
   Contact each client at the 90-day mark with a Phase 2 offer: invoicing automation, payment follow-up sequences, or CRM integration. Position it as the next step in their system, not an add-on. Target conversion of at least 30% of existing clients.

2. **Raise rates for all new clients.**
   Market-test rates $50–100 higher per tier than your current pricing. Do not lower rates for existing clients — grandfather them in. New clients pay new rates.

3. **Launch referral program.**
   Send a referral offer to every active client: refer a new client who signs a contract, and receive 1 month free service. Track referrals manually in a spreadsheet until you have more than 10 active clients, then automate referral tracking (Automation Priority 6).

4. **Expand to a second industry vertical.**
   If your primary vertical (e.g., plumbers) is working, add one adjacent vertical (HVAC, retail, chiropractic). Build one industry template, run a 100-email Apollo sequence, evaluate results after 30 days before committing to the vertical.

5. **Evaluate second hire at client 8+.**
   See Hiring Guide below.

### Revenue Targets

| Clients | Avg Monthly Fee | MRR | Your Take (after costs) |
|---|---|---|---|
| 3 | $500 | $1,500 | ~$1,200 |
| 5 | $600 | $3,000 | ~$2,500 |
| 8 | $700 | $5,600 | ~$4,800 |
| 12 | $800 | $9,600 | ~$8,200 |
| 20 | $800 | $16,000 | ~$13,500 |

---

## Automation Build Order

Build automations in this order. Do not skip ahead — over-building early wastes time and creates complexity before you know what you actually need.

| Priority | Automation | Stage Trigger |
|---|---|---|
| 1 | Lead follow-up sequences (Apollo + Make.com) | Before client 1 |
| 2 | Onboarding checklist automation | After client 1 |
| 3 | Automated invoicing (Stripe) | Client 3 |
| 4 | Monthly client reporting (Scenario C) | Client 3–4 |
| 5 | AI tier-1 client support | Client 4 |
| 6 | Referral tracking | Client 5+ |
| 7 | Self-serve client dashboard | Client 8+ |

---

## Hiring Guide

### First Hire — Virtual Assistant (Target: Client 4)

**Role:** Admin and support
**Hours:** 5–10 hrs/week
**Pay:** $15–20/hr
**Where to find:** Upwork, Fiverr, OnlineJobs.ph

The VA's job is to protect your time from repetitive communication and administrative tasks. They do not need technical skills — they need reliability, good written English, and the ability to follow a script.

**What to delegate first:**

- Responding to client support emails using the template library
- Scheduling onboarding calls and monthly check-ins
- Sending check-in emails for clients not yet on automated sequences
- Following up on late Stripe payments with a pre-written email sequence

**What you keep:**

- Sales calls and deal closing
- All technical builds and Make.com configuration
- Contract review and signing
- Handling escalated or unhappy clients directly

**Onboarding the VA:**

Give them read access to this operations manual, the support email template library, and the client folder structure in Google Drive. Run them through one live support ticket together before they handle tickets independently. Review their first five responses before approving them to operate unsupervised.

---

### Second Hire — Part-Time Technical (Target: Client 8+)

**Role:** Build and maintenance support
**Skills required:** Make.com scenario building, Freshchat bot configuration, basic API familiarity, ability to follow an SOP independently
**Hours:** 10–15 hrs/week
**Pay:** $25–40/hr

This hire takes the technical build and maintenance load off you so you can focus on sales, client relationships, and business development. Vet them with a paid test project (e.g., build a bot flow from a template) before committing to ongoing hours.

---

## Weekly and Monthly Routines

### Weekly — 5 Minutes Every Week

These three checks keep you from being surprised.

**Monday — Pipeline check (2 min)**
- Are there any leads in Apollo who haven't been followed up in 5+ days?
- Is there a client in onboarding? What stage are they in?
- Any Stripe payment failures from the weekend?

**Wednesday — At-risk check (2 min)**
- Any client with more than 3 support tickets this month?
- Any client who has not had a check-in in over 35 days?
- Any Make.com scenario that failed in the last 7 days? (Check Make.com execution log.)

**Friday — Activity log (1 min)**
- Log this week's hours by category: sales, builds, support, admin.
- If any category is over its expected threshold, flag it for the monthly review.

---

### Monthly — 1 Hour on the First Monday of the Month

**Step 1 — Dashboard review (20 min)**
Pull the metrics for every active client: bot sessions, bookings, handoffs, support tickets. Compare to prior month. Flag any client where bookings dropped more than 20% month-over-month.

**Step 2 — Bot retraining (15 min)**
Review the unrecognized input log in Freshchat for each client. If any question appears three or more times without a good answer, add it to the knowledge base. Export updated knowledge base and save to the client folder.

**Step 3 — NPS survey (10 min)**
Send a one-question email to each client: "On a scale of 1–10, how likely are you to recommend CWI AI to another business owner?" Log responses. Any score below 7 gets a personal follow-up call within 48 hours.

**Step 4 — Margin check (15 min)**
Calculate: Total MRR minus platform costs (Freshchat, Make.com, Apollo, Stripe fees) minus VA hours (if hired) equals net margin. Compare to prior month. If margin is shrinking, identify whether the cause is rising costs or rising support load and address it before next month.

---

## Risk Checklist by Stage

| Stage | Risk | Mitigation |
|---|---|---|
| Client 1 | Build fails or runs over time | Simplify scope upfront. Use pre-built templates. Hard cap: no feature that cannot be delivered in the agreed timeline. |
| Clients 2–3 | Delivery quality drops with speed | Do not rush. The SOP exists to maintain quality, not just speed. Two weeks late is better than a broken system. |
| Clients 4–5 | Support volume overwhelms capacity | Hire VA before you are overwhelmed, not after. Automate tier-1 support (Automation Priority 5) in parallel. |
| Client 5+ | Churn rising as roster grows | Monthly check-ins and proactive bot retraining are non-negotiable at this stage. Churn kills the math faster than new clients fix it. |
| Scaling | Revenue plateau | Upsell Phase 2 to existing clients first — it is the fastest path to more MRR. Then raise rates for new clients. New verticals are third priority. |
