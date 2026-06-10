Here is the complete Website Setup Guide. The file has also been saved to `C:\Users\Brian\Documents\CWI AI\cwi-automation\docs\Website-Setup-Guide.md`.

---
title: Website Setup Guide — CWI AI (cwiai.net)
created: 2026-06-08
tags: [setup, website, deployment, netlify]
status: active
---

# Website Setup Guide — CWI AI (cwiai.net)

> Time to complete: ~30 minutes (plus DNS wait time). The website (cwi-site/) is a static HTML site — no build step, no servers, no database. You deploy it by dragging a folder onto a web page. If you can drag a file into a folder, you can do this.

---

## What You Need Before Starting

- **Access to the `cwi-site/` folder** on your computer. Full path: `C:\Users\Brian\Documents\CWI AI\cwi-site\`. Inside it you should see at least `index.html`.
- **Login to your domain registrar** — the company where you bought `cwiai.net` (e.g. GoDaddy, Namecheap, Google Domains/Squarespace, Cloudflare). You need your username and password to edit DNS records.
- **A Netlify account** (free) — you'll create one in Step 1. No credit card required.
- **The Freshchat widget embed code** — a `<script>...</script>` snippet. You only get this AFTER you finish the App Setup Guide (Part 6 of that guide). You do NOT need it for Steps 1–3 below. Come back and do Step 4 once you have it.

> Tip: Have your domain registrar login ready before you start Step 2 — that's the one place people get stuck.

---

## Step 1 — Deploy to Netlify

**1a. Open the Netlify website.**
Go to **https://app.netlify.com** in your web browser (Chrome, Edge, or Firefox all work).

**1b. Create your free account.**
Click the **Sign up** button. You'll see options: **GitHub**, **GitLab**, **Bitbucket**, or **Email**.
- Easiest path: click **Email**, type `brian@cwiai.net`, create a password, and verify via the confirmation email Netlify sends you.
- (If you already have a Netlify account, click **Log in** instead.)

**What success looks like:** You land on the Netlify dashboard. It's mostly empty with a heading like "Sites" and a large box inviting you to add a new site.

**1c. Start a manual deploy.**
On the dashboard, click the **Add new site** button (top area of the Sites page) → in the dropdown choose **Deploy manually**.

**What success looks like:** A new page appears with a large dashed-outline rectangle in the middle that says something like **"Drag and drop your site output folder here"** or **"Want to deploy a new site without connecting to Git? Drag and drop your site folder here."**

**1d. Open the folder on your computer.**
Open **File Explorer** (the yellow folder icon on your taskbar, or press `Windows key + E`). Navigate to:
`C:\Users\Brian\Documents\CWI AI\`
You should now see the **`cwi-site`** folder.

> IMPORTANT: You want to drag the **whole `cwi-site` folder itself** — not the files inside it, and not the parent "CWI AI" folder. Click the `cwi-site` folder once so it's highlighted.

**1e. Drag the folder onto Netlify.**
Position your File Explorer window and your browser window side by side. Click and hold the **`cwi-site`** folder, drag it on top of the dashed drop zone on the Netlify page, and release.

**What success looks like:** Netlify shows an uploading/processing bar for about 10–20 seconds, then displays **"Your site is deployed"** (or "Site deploy in progress" that turns green). You'll see a random auto-generated URL near the top, something like **`https://sparkling-fox-abc123.netlify.app`**.

**1f. Confirm the site is live.**
Click that `.netlify.app` URL. A new tab opens.

**What success looks like:** The CWI AI website loads — black background, orange accent, the headline, and the "Riley" demo chat widget bubble in the bottom-right corner. Your site is now live on the internet at that temporary address. (We give it the real `cwiai.net` address in the next step.)

> Write down or copy that `.netlify.app` URL — you'll need it in Step 2 for the `www` record.

---

## Step 2 — Connect Your Domain (cwiai.net)

This makes `cwiai.net` point at the site you just deployed. There are two halves: tell Netlify about the domain, then add records at your registrar.

**2a. Open Domain management in Netlify.**
On your site's page in Netlify, click **Site configuration** (or **Site settings**) in the left menu → then click **Domain management** (sometimes labeled **Domains**).

**2b. Add your custom domain.**
Click the **Add a domain** button (may say **Add custom domain**) → in the text box type exactly:
```
cwiai.net
```
→ click **Verify** → then click **Add domain**.

**What success looks like:** Netlify adds `cwiai.net` (and usually `www.cwiai.net`) to a list. Next to it you'll likely see a yellow "Awaiting External DNS" or "Check DNS configuration" notice — that's expected. Netlify will also show you the exact DNS values to enter.

### Choose your DNS approach

There are two ways to point the domain. **You only do ONE of these.**

- **Option A — External DNS (recommended, simplest):** You keep DNS at your current registrar and just add two records pointing to Netlify. This is what the steps below cover and what most people should do.
- **Option B — Netlify DNS:** You hand full DNS control to Netlify by changing your domain's *nameservers* at the registrar. More powerful but more involved. Only do this if Netlify specifically prompts you and you're comfortable changing nameservers. **If unsure, use Option A.**

### Option A — Add records at your registrar (do this one)

**2c. Log in to your domain registrar.**
Open a new tab and go to the site where you bought `cwiai.net` and log in. Find the DNS settings area. It's usually called **DNS**, **DNS Management**, **Manage DNS**, **DNS Records**, or **Advanced DNS** (Namecheap), under your domain.

**2d. Add the A record (points the bare domain).**
Click **Add record** (or **Add new record**). Enter:
- **Type:** `A`
- **Host / Name:** `@`  (the `@` means "the bare domain, cwiai.net itself"; some registrars want you to leave this blank or type `cwiai.net` — both mean the same thing)
- **Value / Points to:** `75.2.60.5`  (this is Netlify's load balancer IP)
- **TTL:** leave default (Auto, or 3600)

Save the record.

**2e. Add the CNAME record (points www).**
Click **Add record** again. Enter:
- **Type:** `CNAME`
- **Host / Name:** `www`
- **Value / Points to / Target:** your Netlify subdomain from Step 1f, **without** `https://` and **with** a trailing dot if your registrar requires it — for example: `sparkling-fox-abc123.netlify.app`
- **TTL:** leave default

Save the record.

> Double-check the A record value is exactly `75.2.60.5`. If Netlify's screen shows a *different* IP than this, use the one Netlify shows you — they occasionally update it.

**2f. Remove conflicting old records.**
If your registrar already has an old `A` record for `@` (pointing somewhere else) or a "parking page" / "forwarding" record, delete it — two A records on `@` will fight each other. Keep only the one pointing to `75.2.60.5`.

**What success looks like (registrar side):** Your DNS records list shows the new `A @ → 75.2.60.5` and `CNAME www → ...netlify.app` entries saved.

**2g. Wait for propagation.**
DNS changes take anywhere from **10 minutes to 48 hours** to spread across the internet (usually under an hour). Back in Netlify's Domain management, you can click **Verify DNS configuration** / **Check DNS** to test.

**What success looks like:** In Netlify, the yellow "Awaiting DNS" warnings turn into green checkmarks / **"Netlify DNS"** or **"External DNS — configured"** next to `cwiai.net` and `www.cwiai.net`.

---

## Step 3 — Enable HTTPS

HTTPS is the padlock in the browser bar. Netlify provisions a free SSL certificate (Let's Encrypt) automatically — but only **after** DNS from Step 2 has propagated.

**3a. Go to the HTTPS section.**
In Netlify: **Site configuration** → **Domain management** → scroll down to the **HTTPS** section.

**3b. Verify and provision.**
- If you see a button **Verify DNS configuration**, click it.
- Once DNS checks pass, Netlify shows **Provision certificate** (or it auto-provisions). If a button is present, click **Provision certificate**.

**What success looks like:** The HTTPS section shows **"Your site has HTTPS enabled"** with a green checkmark and a Let's Encrypt certificate listed. This can take a few minutes after DNS is verified.

**3c. Confirm in the browser.**
Open a new tab and go to **https://cwiai.net**. Look at the address bar.

**What success looks like:** The site loads and there's a **padlock icon** to the left of `cwiai.net`. No "Not Secure" warning.

> If `https://cwiai.net` works but `http://` or `www.` behaves oddly, turn on **Force HTTPS** (a toggle in the same HTTPS section) so all visitors get the secure version automatically.

---

## Step 4 — Wire In the Real Freshchat Widget

The live site currently uses a **scripted, fake "Riley" demo** — it follows a canned script and isn't connected to anything. Once Freshchat is set up (App Setup Guide, Part 6), you replace that demo with the **real** Freshchat widget so visitors talk to your actual bot and agents.

> Do this step ONLY after you have the Freshchat embed snippet in hand. If you don't have it yet, finish the App Setup Guide first, then come back.

**4a. Get the Freshchat embed snippet.**
In Freshchat: **https://web.freshchat.com** → log in → **Admin Settings** (gear icon, top-right) → **Web Messenger** / **Widget** → copy the embed code. It's a block that looks roughly like:
```html
<script>
  function initFreshChat() {
    window.fcWidget.init({ token: "xxxxxxxx", host: "https://wchat.freshchat.com" });
  }
  /* ...more lines... */
</script>
```
Copy the **entire** block.

**4b. Open the website file in a text editor.**
In File Explorer go to `C:\Users\Brian\Documents\CWI AI\cwi-site\`. **Right-click `index.html`** → **Open with** → choose **Notepad** (or Notepad++, VS Code — any plain text editor; do NOT use Word).

**4c. Find the widget placeholder.**
In the editor press **Ctrl + F** to open Find, and search for:
```
FRESHCHAT WIDGET
```
You should land on a comment line that looks like `<!-- FRESHCHAT WIDGET -->`. The placeholder/demo script block sits near it, just above the closing `</body>` tag at the bottom of the file.

> If you can't find that exact comment, instead search for `</body>` — the Freshchat snippet must be pasted on the line **directly above** `</body>`.

**4d. Paste in the real snippet.**
Replace the placeholder script block (or paste directly above `</body>` if there's no placeholder) with the full Freshchat `<script>...</script>` block you copied in 4a. Make sure you don't leave a half-deleted old `<script>` tag behind.

**4e. Save the file.**
Press **Ctrl + S**. (In Notepad, confirm it saves as `index.html`, not `index.html.txt` — if it offers a "Save as type" dropdown, choose **All Files**.)

**4f. Re-deploy to Netlify.**
Go back to **https://app.netlify.com** → open your site → click the **Deploys** tab → drag the **`cwi-site` folder** onto the deploy drop zone again (same drag-and-drop as Step 1e). Netlify publishes the updated version in ~10–20 seconds.

**Alternative (advanced):** if you've connected Netlify CLI, run `netlify deploy --prod` from the `cwi-site` folder instead of dragging.

**What success looks like:** A new deploy appears at the top of the Deploys list marked **Published**. Loading `https://cwiai.net` now shows the **real** Freshchat widget (it may look slightly different from the demo and will connect to a live agent/bot), not the scripted demo.

---

## Step 5 — Verify the Live Site

Open **https://cwiai.net** and run through this checklist. Test on a desktop browser AND on your phone.

- [ ] **Domain loads:** `https://cwiai.net` opens the CWI AI site (not a registrar parking page, not an error).
- [ ] **HTTPS padlock:** A padlock shows in the address bar; no "Not Secure" warning.
- [ ] **`www` works too:** `https://www.cwiai.net` also loads the site (redirects are fine).
- [ ] **Chat widget opens:** Click the chat bubble (bottom-right). It opens. Before Step 4 this is the scripted "Riley" demo; after Step 4 it's the real Freshchat widget.
- [ ] **Nav links work:** Click each top-nav link (Services, Pricing, FAQ) — each scrolls/jumps to the right section.
- [ ] **Buttons work:** "Book a demo" / primary CTA buttons respond.
- [ ] **Mobile view:** On your phone, the layout isn't squished — text is readable, nav collapses to a menu, the chat panel goes full-width, nothing overflows the screen edge.
- [ ] **Contact info correct:** The footer/contact area shows **brian@cwiai.net** and **(734) 812-9971**.

If every box is checked, the website is fully live.

---

## Updating the Site in the Future

Whenever you change anything in `index.html` (copy, prices, the chat snippet, etc.):

**Drag-and-drop method (default):**
1. Edit and save the file(s) in `C:\Users\Brian\Documents\CWI AI\cwi-site\`.
2. Go to **https://app.netlify.com** → your site → **Deploys** tab.
3. Drag the **`cwi-site` folder** onto the deploy drop zone.
4. Wait ~15 seconds for "Published." The live site updates automatically — same `cwiai.net` URL, no DNS changes needed.

**Git method (optional, if you later connect a GitHub repo):**
1. Commit your changes and `git push` to the connected branch.
2. Netlify auto-builds and publishes within a minute. No manual drag needed.

> You never have to touch DNS or the domain again after the initial setup — only re-deploy the folder.

---

## Troubleshooting

**Domain not loading after 48 hours**
- Recheck your registrar DNS: `A` record host `@` must equal `75.2.60.5`, and `CNAME` host `www` must point to your `...netlify.app` address.
- Make sure there's no leftover old `A` record on `@` or a registrar "domain forwarding/parking" setting overriding it — delete those.
- In Netlify → Domain management, click **Verify DNS configuration** and read any error it reports.
- Check propagation with a free tool like https://dnschecker.org (enter `cwiai.net`, type `A`) — it should show `75.2.60.5` worldwide.

**Chat widget not appearing (after Step 4)**
- Confirm the Freshchat `<script>` block is pasted **directly above** the `</body>` tag, and that the whole block (open `<script>` to close `</script>`) is intact.
- Make sure you re-deployed after editing — the change isn't live until you drag the folder to Netlify again.
- Verify the file saved as `index.html`, not `index.html.txt`.
- Hard-refresh the page (**Ctrl + F5**) to clear the cached old version.

**HTTPS not activating**
- Netlify can only issue the SSL certificate **after** DNS is verified. If the HTTPS section says it's waiting, finish/verify Step 2 first, then return and click **Verify DNS configuration** → **Provision certificate**.
- Give it a few minutes after DNS turns green — certificate issuance isn't instant.
- If it's still stuck after an hour with DNS confirmed green, try **Renew certificate** in the HTTPS section.

**Dragged the wrong folder / site looks blank**
- You must drag the **`cwi-site` folder itself** so that `index.html` sits at the top level of the deploy. If you dragged the parent "CWI AI" folder or the loose files, re-deploy with the correct `cwi-site` folder.

---

*Site files: `C:\Users\Brian\Documents\CWI AI\cwi-site\` · Domain: cwiai.net · Host: Netlify (free) · Owner: Brian Kalsic, CWI AI LLC, Southgate MI.*
