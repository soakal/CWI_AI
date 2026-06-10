# CWI AI — Logo Design Doc

**Mark:** "The Live Line" (Concept C)
**Brand:** CWI — *Compute With Imagination*
**System:** Black + single electric accent (Signal Orange)
**Status:** Final — approved direction

---

## 1. The idea

CWI sells one thing in plain terms: an AI assistant that **answers and books for local businesses, 24/7**. The logo had to *show that*, not just look like generic AI branding. So the mark is built from three literal pieces:

- **Chat bubble** → conversation. CWI talks to your customers, in chat and on the phone.
- **Voice/pulse waveform** → live, active, always-on. The proof that someone's always there to pick up.
- **Rounded chip-tile frame** → the "Compute" half of the name — the tech under the hood, kept sharp and premium.

Read together: *a conversation that's always live.* That's the product.

The waveform is intentionally a **soundwave with one tall central spike** — it reads as both a voice signal and a heartbeat/pulse, reinforcing "always on."

---

## 2. Color

The whole system runs **~90% black & white, ~10% orange**. The accent only lands on the thing that matters — here, the waveform — so it stays premium instead of loud.

| Token | Hex | Use |
|---|---|---|
| Ink Black | `#0A0A0C` | Primary background, ink strokes |
| Tile Black | `#0E0E11` | The icon's chip-tile fill |
| Signal Orange | `#FF5A1F` | The waveform — the one accent |
| Ember | `#FF8A3D` | Hover / highlight only (same family) |
| Steel | `#85858E` | Muted text, captions |
| Paper | `#F3F1EC` | Warm off-white for light surfaces |

**Rule:** the waveform is Signal Orange on dark and light backgrounds, and switches to **ink** when sitting on the orange brand color (never orange-on-orange).

---

## 3. Typography

- **Display / wordmark:** Sora — ExtraBold (800). Sharp, geometric, premium.
- **Body / UI:** Instrument Sans — Regular / Medium.

Both are free (Google Fonts / SIL Open Font License). The wordmark "CWI" is set in Sora 800 with tight tracking (≈ -0.04em).

---

## 4. Variants (and when to use them)

| Variant | File | When |
|---|---|---|
| Primary (on dark) | `cwi-icon-primary-dark.svg` | Default. Dark sites, slides, avatars. |
| On light | `cwi-icon-light.svg` | White/light backgrounds (ink bubble, orange wave). |
| Reversed (on accent) | `cwi-icon-reversed-orange.svg` | When the background *is* Signal Orange. |
| Mono white | `cwi-icon-mono-white.svg` | One-color use on dark — stamps, embroidery, etched. |
| Mono black | `cwi-icon-mono-black.svg` | One-color use on light — faxes, b/w print. |
| Horizontal lockup | `cwi-lockup-horizontal-dark.svg` | Icon + CWI wordmark — email headers, letterhead. |

---

## 5. Clear space & minimum size

- **Clear space:** keep margin on all sides equal to **¼ of the icon's height**. No text, edges, or other logos inside that zone.
- **Minimum size:** don't render below **24px** on screen. Below that, the waveform muddies — switch to the solid mono version.
- **Favicon:** use `cwi-favicon-64.png` (browsers downscale to 16/32 cleanly).

---

## 6. Usage rules

**Do**
- Keep the waveform Signal Orange (ink on the orange background).
- Use the mono version when only one color is available.
- Maintain the ¼-height clear space.
- Scale proportionally — always keep the square ratio.

**Don't**
- Recolor the wave (no purple, no gradient-of-the-week).
- Put the orange wave on an orange background.
- Stretch, rotate, skew, or add shadows/bevels/glows in print.
- Crowd it with text or shrink below 24px.

---

## 7. File inventory

All files live in the `/logo` folder beside this doc.

**Vector (master — use these wherever possible):**
- `cwi-icon-primary-dark.svg`
- `cwi-icon-light.svg`
- `cwi-icon-reversed-orange.svg`
- `cwi-icon-mono-white.svg`
- `cwi-icon-mono-black.svg`
- `cwi-lockup-horizontal-dark.svg`

**Raster (PNG, transparent where applicable):**
- `cwi-icon-primary-1024.png` · `-512.png` · `-256.png`
- `cwi-favicon-64.png`
- `cwi-icon-reversed-1024.png`
- `cwi-icon-mono-white-1024.png`
- `cwi-lockup-horizontal-2048.png`

**Showcase:** `CWI-Logo-Concept-C.html` — interactive guidelines page (animated "live" mark, all variants, clear space, do/don'ts).

---

## 8. Quick-use cheatsheet

| I need… | Use |
|---|---|
| Website favicon | `cwi-favicon-64.png` |
| Social avatar (Google Business, FB, IG, X) | `cwi-icon-primary-1024.png` |
| Email signature / letterhead | `cwi-lockup-horizontal-dark.svg` (or `-2048.png`) |
| Business card | `cwi-icon-reversed-orange.svg` on black, per brand sheet |
| Anything print, scalable | the matching `.svg` |

---

## 9. Notes for next steps

- **Canva:** upload the PNGs (and SVGs on Pro) under Brand Kit → Logos. Add Signal Orange `#FF5A1F` and Ink `#0A0A0C` as brand colors, and set Sora + Instrument Sans as brand fonts.
- **Favicon on cwiai.net:** drop `cwi-favicon-64.png` in the site root and reference it; consider generating a 16/32/180 set later for full device coverage.
- **Trademark:** the wordmark + mark could be filed together later if you want protection in software/AI classes (009/042) — not urgent at launch.
