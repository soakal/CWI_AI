# CLAUDE.md — CWI Website

This is the marketing website for **CWI · Compute With Imagination**, an always-on AI
receptionist for local businesses. It is **static HTML/CSS/JS** — no build step, no framework.
Open `index.html` in a browser or run `python3 -m http.server 8000`.

Read `README.md` for the full file map. Read `brand/CWI-Logo-Design.md` for the brand bible.

## Pages
`index.html` (home + live demo), `how-it-works.html`, `industries.html`, `pricing.html`,
`demo.html`. Shared: `cwi.css` (tokens + components), `partials.js` (injected nav/footer),
`site.js` (scroll reveals + the demo engine).

## Brand rules — do not break
- **90% black & white, 10% Signal Orange.** Accent (`#FF5A1F`) only on what matters.
- Type: **Sora 800** (display) + **Instrument Sans** (body).
- The waveform mark is orange on dark/light and **ink on the orange background** — never
  orange-on-orange. Never recolor/stretch the mark; keep ¼-height clear space; never < 24px.
- All colors live as CSS custom properties at the top of `cwi.css`. Use the tokens; don't
  invent new colors.

## Conventions
- Nav/footer are injected by `partials.js` — edit them there, not per page.
- Keep HTML canonical (explicit closing tags, quoted attributes) for clean diffs.
- The two `.jsx` files power an optional design-time Tweaks panel on the home page only;
  they're not required for production and can be removed with the React `<script>` tags.

## Placeholder content to replace before launch
Phone `(888) 555-0199`, email `hello@cwiai.net`, domain `cwiai.net`, all testimonials,
pricing numbers, and plan contents. The demo form (`demo.html`) and pricing toggle are
front-end only — wire the form `submit` handler to a real CRM/email/form endpoint.
