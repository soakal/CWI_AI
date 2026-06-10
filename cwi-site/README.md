# CWI — Marketing Website

The official site for **CWI · Compute With Imagination** — an always-on AI receptionist
that answers calls & chats, books appointments, and follows up for local businesses, 24/7.

This is **production-ready static HTML/CSS/JS** — no build step, no framework, no server
required. Open any `.html` file in a browser and it works. You can deploy this folder
as-is to Netlify, Vercel, GitHub Pages, Cloudflare Pages, or any static host.

---

## Run it locally

No install needed. Either:

- **Double-click `index.html`**, or
- Serve the folder (better — lets the shared JS files load cleanly):
  ```bash
  # Python (already on most Macs/Linux)
  python3 -m http.server 8000
  # then open http://localhost:8000

  # or Node
  npx serve .
  ```

---

## File structure

```
.
├── index.html            # Home — hero + live demo widget, features, industries, proof, CTA
├── how-it-works.html     # 3-step flow, integrations, FAQ
├── industries.html       # Per-trade cards + a "booked from the field" call scenario
├── pricing.html          # 3 tiers, monthly/annual toggle, comparison table
├── demo.html             # "Book a demo" — validated form + success state
│
├── cwi.css               # Shared design system: tokens, nav, footer, buttons, cards
├── partials.js           # Injects the shared <nav> + <footer> into every page
├── site.js               # Scroll-reveal, active nav link, the live call/chat demo engine
│
├── tweaks-panel.jsx      # (Home only) React tweak-panel shell — optional, design-time only
├── tweaks-app.jsx        # (Home only) Wires accent/font/radius/glow tweaks to CSS vars
│
└── assets/               # Brand marks (favicon, app icon, horizontal lockup)
```

> **Note on the two `.jsx` files:** they power an optional in-page "Tweaks" panel used to
> experiment with accent color and typography during design. They are NOT required for the
> site to run and can be deleted along with the React `<script>` tags at the bottom of
> `index.html` if you don't want them in production.

---

## Design system (do not drift from this)

Everything follows the CWI brand: **~90% black & white, ~10% Signal Orange.** The accent
only lands on the one thing that matters in a given view.

**Colors** (defined as CSS custom properties at the top of `cwi.css`):

| Token            | Hex        | Use                                  |
|------------------|------------|--------------------------------------|
| `--ink`          | `#0A0A0C`  | Primary background, ink strokes      |
| `--ink-2`        | `#0E0E11`  | Tile black / raised panels           |
| `--surface`      | `#141418`  | Cards                                |
| `--accent`       | `#FF5A1F`  | Signal Orange — the one accent       |
| `--ember`        | `#FF8A3D`  | Hover / highlight only               |
| `--steel`        | `#85858E`  | Muted text                           |
| `--paper`        | `#F3F1EC`  | Warm off-white light surface         |
| `--text`         | `#F4F4F6`  | Body text on dark                    |

**Type:** Sora ExtraBold (800), ~-0.035em tracking for display/headings · Instrument Sans
for body & UI. Both loaded from Google Fonts in each page's `<head>`.

**The mark:** "The Live Line" — chat bubble + central-spike waveform + chip-tile frame.
Rules that are honored throughout and must stay honored:
- Waveform is Signal Orange on dark/light, and flips to **ink** when on the orange brand
  color (never orange-on-orange).
- Never recolor the wave, never stretch/rotate, keep ¼-height clear space, never below 24px.

---

## How the shared chrome works

The `<nav>` and `<footer>` are **not** copy-pasted into each page. Each page has
`<div data-cwi-nav></div>` and `<div data-cwi-footer></div>` placeholders, and
`partials.js` replaces them on load and sets the active nav link. Edit the nav/footer
once in `partials.js` and it updates everywhere.

`index.html` currently carries its own static nav/footer (it's the primary asset); the
sub-pages use the injected version. Both render identical markup.

---

## The live demo widget (home page)

`site.js` → `window.CWIDemo()` drives the call/chat transcript in the hero. It renders every
line as the visible base state, staggers them in, holds, then replays. The phone/chat tabs
switch scripts. The transcript content is pre-rendered as static HTML inside the widget so it
still shows with JS disabled.

---

## What's placeholder (replace before launch)

- Phone number `(888) 555-0199`, email `hello@cwiai.net`, domain `cwiai.net`
- All testimonials and the owner names/quotes
- Pricing ($149 / $349 / Custom) and plan contents
- The demo form and pricing toggle are **front-end only** — no backend is wired. Point the
  form `submit` handler in `demo.html` at your CRM / email / form endpoint.

---

## If you'd rather rebuild this in a framework

These files are a faithful, final reference for the look, copy, and interactions. To port
into React/Vue/Svelte/etc., map `cwi.css` tokens to your theme, turn each page section into a
component, and reuse the copy verbatim. But for a marketing site, deploying this static
bundle directly is the fastest path.
