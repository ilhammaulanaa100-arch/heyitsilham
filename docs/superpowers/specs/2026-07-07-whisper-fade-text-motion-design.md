# Whisper-Fade Text Motion — Site-Wide Standardization

**Date:** 2026-07-07
**Status:** Approved design, ready for implementation plan

## Goal

Unify all **text/content reveal** motion across the portfolio into one identity —
**"whisper fade"**: opacity-only fade, no transform, elements appearing
sequentially top→bottom. Applied on page entrance, on scroll (below-the-fold),
and on exit. One shared source of truth replaces three drifted implementations.

## The two-layer principle (non-negotiable)

There are two distinct motion layers. This project touches **only Layer B**.

- **Layer A — Structural / transition animations. DO NOT TOUCH, anywhere.**
  Splash, home FLIP overlay glide (home→case-study), homepage char-nav between
  sections, homepage vertical/grid transitions (`grid.js`), case-study slider
  image glide, case-study close→home page-wipe, about→home peek-box glide, theme
  toggle circular reveal. All remain byte-for-byte as they are.

- **Layer B — Text/content reveal. This is what we standardize.**
  Whisper fade is a **content layer that runs alongside** Layer A, never
  replacing it. On exit it fades the text out *concurrently* with the existing
  structural transition (e.g. as the white page-wipe slides in, the right-panel
  text whisper-fades out while the centered image keeps gliding).

The old text-reveal motions (case-study char-rise/word-rise, about's manual WAA
reveals) ARE replaced — they are Layer B and are the thing being unified.

## Architecture: one vanilla module `motion.js`

New file `motion.js`, **no GSAP dependency** (about.html loads no GSAP; whisper
is opacity-only, so native Web Animations API + IntersectionObserver suffice).
Loaded before `home.js` / `about.js` / `case-study.js` on all three pages.

Exposes a global `Motion`:

### Tokens (single source of truth)
```
DUR   = 900   // ms, fade duration per unit
STEP  = 80    // ms, delay between consecutive units (the "one-by-one" feel)
EASE  = 'cubic-bezier(0.33, 0, 0.2, 1)'   // soft power1-ish out
```

### API
| Function | Purpose |
|----------|---------|
| `Motion.splitLines(el)` | Split a headline into per-line spans so lines can fade sequentially. Measures wrapping via `offsetTop`. |
| `Motion.enter(root)` | Whisper fade-in every `[data-reveal]` inside `root`, opacity only, ordered top→bottom by vertical position, staggered by `STEP`. |
| `Motion.observe(root)` | IntersectionObserver; whisper fade-in each `[data-reveal-scroll]` when it enters the viewport. |
| `Motion.exit(cb)` | Reverse whisper fade-out of currently-visible `[data-reveal]` content, then run `cb` (navigation). Runs concurrently with any Layer-A exit transition already firing. |

### Rules
- Whisper = **opacity only, zero transform.**
- **Hero headlines** (home hero title, `.ab-hero-headline`, `.cs-headline`) fade
  **per line** via `splitLines`. All other elements fade **per component**.
- Ordering is always top→bottom (sort targets by bounding-rect top).
- **Reduced motion:** if `prefers-reduced-motion: reduce`, everything is shown
  instantly (opacity 1, no stagger, no observers).
- **Anti-FOUC:** `[data-reveal]` starts at `opacity:0` only under a
  `html.motion-on` class set synchronously in `<head>`; without JS the content
  stays visible and readable.

## Per-page rewiring

### `about.js` — biggest gain (currently has no hero reveal)
- **Entrance:** on load, `Motion.enter` the hero — `.ab-hero-name`,
  `.ab-hero-headline` (per line), `.ab-hero-media` — top→bottom.
- **Scroll:** `Motion.observe` for `.ab-split`, `.ab-lead`, `.ab-work-item`.
  Replaces the manual WAA reveal. The work-counter IntersectionObserver stays.
- **Exit:** peek-box glide to home is Layer A — untouched. Plain nav links
  (Work / Contact) get `Motion.exit` before navigating.

### `case-study.js`
- **Entrance:** above-fold blocks (`.cs-headline` per line, `.cs-meta-row`,
  `.cs-body-block` summary) → `Motion.enter`. **Delete** `splitChars`,
  `splitWords`, and the char/word `playReveal` motion.
- **Scroll:** existing per-block IntersectionObserver reveal → `Motion.observe`.
- **Exit (close→home):** page-wipe slide is Layer A — **untouched**. Add
  `Motion.exit` so the right-panel text whisper-fades out concurrently while the
  wipe slides and the centered image keeps gliding. Whisper timing tuned to
  finish at/before the wipe covers the panel.
- Slider image glide + project-swap glide are Layer A — untouched.

### `home.js`
- **Entrance:** after splash completes, `Motion.enter` the initial active
  section (label + title lines).
- **Internal section nav** (char-rise between sections) is an internal
  interaction — **kept as-is**.
  - *Known tradeoff:* entrance uses whisper while section-nav still uses
    char-rise → two text-motion languages on the homepage. Acceptable per scope
    decision; revisit later if it reads inconsistent.
- **Exit:** FLIP overlay to case-study is Layer A — untouched.
- `grid.js` transitions are Layer A — untouched.

## Deletions (the unify win)
- `splitChars` / `splitWords` in `case-study.js`
- char/word `playReveal` reveal system in `case-study.js`
- manual Web Animations reveal in `about.js`

## Out of scope
- Any Layer-A structural animation (see the list above).
- Homepage section-to-section nav motion.
- Adding new visual effects beyond whisper fade.

## Success criteria
- Opening home (after splash), about, and detail all reveal text with the same
  whisper fade, top→bottom.
- Below-the-fold text on about and case-study whisper-fades in on scroll.
- On case-study close→home, right-panel text visibly fades out while the wipe
  and image-glide play unchanged.
- Every Layer-A animation behaves exactly as before.
- `prefers-reduced-motion` shows all content instantly.
- No new runtime dependency; `motion.js` is vanilla and GSAP-free.
