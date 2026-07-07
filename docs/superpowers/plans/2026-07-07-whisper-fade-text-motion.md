# Whisper-Fade Text Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Standardize all text/content reveals across home, about, and detail pages into one "whisper fade" (opacity-only, sequential top→bottom), driven by a single vanilla module.

**Architecture:** New GSAP-free `motion.js` exposes `Motion` (splitLines/enter/observe/exit) built on the Web Animations API + IntersectionObserver. Each page marks its text with `[data-reveal]` / `[data-reveal-scroll]` and calls `Motion`. Every existing structural animation (splash, FLIP glides, page-wipe, peek-box, grid, char-nav) is left byte-for-byte untouched; whisper is a content layer that runs alongside them.

**Tech Stack:** Vanilla JS (Web Animations API, IntersectionObserver), CSS, existing GSAP/Lenis untouched.

## Global Constraints

- `motion.js` is **vanilla, no GSAP dependency** (about.html loads no GSAP).
- Whisper = **opacity only, zero transform.**
- **Do not touch any structural animation** — splash, home FLIP overlay glide, homepage char-nav between sections, `grid.js`, case-study slider image glide + project-swap, case-study close→home page-wipe, about→home peek-box glide, theme toggle circular reveal.
- Tokens (single source of truth in `motion.js`): `DUR = 900` ms, `STEP = 80` ms, `EASE = 'cubic-bezier(0.33, 0, 0.2, 1)'`.
- Hero headlines (home hero title, `.ab-hero-headline`, `.cs-headline`) fade **per line**; all other elements fade **per component**.
- `prefers-reduced-motion: reduce` → everything shown instantly (opacity 1, no stagger, no observers).
- Anti-FOUC: `[data-reveal]`/`[data-reveal-scroll]` hidden only under `html.motion-on` (set synchronously in `<head>`, skipped under reduced-motion); without JS content stays visible.
- Repo: `~/Documents/Porto`, current branch `feat/case-study-gallery`. Commit after each task.

---

### Task 1: Vanilla `motion.js` module

**Files:**
- Create: `motion.js`
- Create: `test/motion.order.test.js` (node assert, no framework)

**Interfaces:**
- Produces (global `Motion`):
  - `Motion.orderByTop(items)` → returns a new array sorted ascending by `items[i].getBoundingClientRect().top` (or `.top` if a plain `{top}` object). Pure, unit-tested.
  - `Motion.splitLines(el)` → replaces `el`'s text with per-line `<span class="m-line">` wrappers (measured via `offsetTop`); returns the NodeList of line spans.
  - `Motion.enter(root, opts?)` → fades in every `[data-reveal]` under `root` (default `document`), opacity 0→1, ordered top→bottom, staggered by `STEP`. `opts.delay` (ms) offsets the whole cascade.
  - `Motion.observe(root?)` → IntersectionObserver fading each `[data-reveal-scroll]` under `root` when it enters the viewport; returns the observer.
  - `Motion.exit(cb?, root?)` → fades all `[data-reveal]` under `root` opacity→0 (top→bottom, half `DUR`); if `cb` given, calls it once after the fade (owns navigation); if omitted, just fades (a structural transition owns navigation).
  - `Motion.reduced` → boolean, true when reduced-motion is on.

- [ ] **Step 1: Write the failing test for ordering**

```js
// test/motion.order.test.js
const assert = require('assert');
const { execSync } = require('child_process');

// Load motion.js in a minimal global shim (no DOM needed for orderByTop).
global.window = { matchMedia: () => ({ matches: false }) };
require('../motion.js');
const Motion = global.window.Motion;

// orderByTop sorts ascending by .top, treating plain objects with a .top field.
const items = [{ top: 30 }, { top: 10 }, { top: 20 }];
const sorted = Motion.orderByTop(items);
assert.deepStrictEqual(sorted.map(i => i.top), [10, 20, 30], 'must sort ascending by top');
// input array must not be mutated
assert.deepStrictEqual(items.map(i => i.top), [30, 10, 20], 'must not mutate input');
console.log('OK motion.order');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd ~/Documents/Porto && node test/motion.order.test.js`
Expected: FAIL — `Cannot find module '../motion.js'` (file not created yet).

- [ ] **Step 3: Write `motion.js`**

```js
// motion.js — vanilla whisper-fade text motion. No GSAP. Opacity only.
// Single source of truth for every text/content reveal across the site.
(function (global) {
  var mq = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)');
  var RM = !!(mq && mq.matches);

  var DUR  = 900;                                // ms, fade per unit
  var STEP = 80;                                 // ms, delay between units
  var EASE = 'cubic-bezier(0.33, 0, 0.2, 1)';

  function show(el) { el.style.opacity = '1'; }

  // Sort ascending by vertical position. Accepts DOM nodes or {top} objects.
  function orderByTop(items) {
    function topOf(x) {
      return (typeof x.getBoundingClientRect === 'function')
        ? x.getBoundingClientRect().top : x.top;
    }
    return Array.prototype.slice.call(items).sort(function (a, b) {
      return topOf(a) - topOf(b);
    });
  }

  function fadeIn(el, delay) {
    if (RM || !el.animate) { show(el); return; }
    el.style.opacity = '0';
    var anim = el.animate([{ opacity: 0 }, { opacity: 1 }],
      { duration: DUR, delay: delay || 0, easing: EASE, fill: 'both' });
    anim.onfinish = function () { el.style.opacity = '1'; };
  }

  // Split element text into per-line spans, measured by wrapping (offsetTop).
  function splitLines(el) {
    var raw = el.textContent;
    el.textContent = '';
    raw.split(/(\s+)/).forEach(function (tok) {
      if (tok === '') return;
      if (/^\s+$/.test(tok)) { el.appendChild(document.createTextNode(' ')); return; }
      var w = document.createElement('span');
      w.className = 'm-word';
      w.style.display = 'inline-block';
      w.textContent = tok;
      el.appendChild(w);
    });
    var words = [].slice.call(el.querySelectorAll('.m-word'));
    var lines = [], cur = null, top = null;
    words.forEach(function (w) {
      var t = w.offsetTop;
      if (t !== top) { cur = []; lines.push(cur); top = t; }
      cur.push(w);
    });
    el.textContent = '';
    lines.forEach(function (group) {
      var line = document.createElement('span');
      line.className = 'm-line';
      line.style.display = 'block';
      group.forEach(function (w, i) {
        w.style.display = 'inline';
        line.appendChild(w);
        if (i < group.length - 1) line.appendChild(document.createTextNode(' '));
      });
      el.appendChild(line);
    });
    return el.querySelectorAll('.m-line');
  }

  var Motion = {
    DUR: DUR, STEP: STEP, EASE: EASE, reduced: RM,
    orderByTop: orderByTop,
    splitLines: splitLines,

    enter: function (root, opts) {
      opts = opts || {};
      var scope = root || document;
      var els = orderByTop(scope.querySelectorAll('[data-reveal]'));
      var base = opts.delay || 0;
      els.forEach(function (el, i) { fadeIn(el, base + i * STEP); });
    },

    observe: function (root) {
      var scope = root || document;
      var els = [].slice.call(scope.querySelectorAll('[data-reveal-scroll]'));
      if (RM || !global.IntersectionObserver) { els.forEach(show); return null; }
      els.forEach(function (el) { el.style.opacity = '0'; });
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          fadeIn(e.target, 0);
          io.unobserve(e.target);
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
      els.forEach(function (el) { io.observe(el); });
      return io;
    },

    exit: function (cb, root) {
      var scope = root || document;
      var els = orderByTop(scope.querySelectorAll('[data-reveal]'));
      if (RM || !els.length || !els[0].animate) { if (cb) cb(); return; }
      els.forEach(function (el, i) {
        el.animate([{ opacity: getComputedStyle(el).opacity }, { opacity: 0 }],
          { duration: DUR * 0.5, delay: i * (STEP * 0.5), easing: EASE, fill: 'forwards' });
      });
      if (cb) setTimeout(cb, DUR * 0.5 + els.length * (STEP * 0.5));
    }
  };

  global.Motion = global.Motion || Motion;
})(typeof window !== 'undefined' ? window : this);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd ~/Documents/Porto && node test/motion.order.test.js`
Expected: `OK motion.order`

- [ ] **Step 5: Commit**

```bash
cd ~/Documents/Porto
git add motion.js test/motion.order.test.js
git commit -m "feat(motion): vanilla whisper-fade module (opacity-only, GSAP-free)"
```

---

### Task 2: Wire whisper fade into the About page

**Files:**
- Modify: `about.html` (add motion-on gate + `motion.js` + reveal attributes)
- Modify: `about.css` (anti-FOUC hidden rule)
- Modify: `about.js:57-141` (add entrance + scroll reveal + nav-link exit; the peek-box block stays)

**Interfaces:**
- Consumes: `Motion.enter`, `Motion.observe`, `Motion.exit`, `Motion.splitLines` from Task 1.

- [ ] **Step 1: Add the anti-FOUC gate and `motion.js` to `about.html`**

In `about.html`, immediately after the theme script on line 9 (`<script>try { if (localStorage.getItem('porto-theme')...`), add:

```html
  <script>try { if (!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) document.documentElement.classList.add('motion-on'); } catch (e) {}</script>
```

Then change the scripts at the bottom (line 167) from:

```html
  <script src="about.js"></script>
```
to:

```html
  <script src="motion.js"></script>
  <script src="about.js"></script>
```

- [ ] **Step 2: Add reveal attributes to About markup**

In `about.html`, edit the hero and content sections to add attributes (keep everything else identical):

```html
    <!-- ── Hero ── -->
    <section class="ab-hero">
      <p class="ab-hero-name" data-reveal>[Ilham]</p>
      <h1 class="ab-hero-headline" data-reveal data-reveal-lines>Designing calm, cinematic products for a loud digital world.</h1>
      <div class="ab-hero-media" data-reveal>
        <img src="assets/images/image-placeholder.png" alt="Ilham — portrait" />
      </div>
    </section>
```

For the two `.ab-split` sections and work items, mark the scroll-revealed blocks:

```html
      <div class="ab-split-right" data-reveal-scroll>
```
(add `data-reveal-scroll` to each `.ab-split-right`, the `.ab-split-title` elements, and each `<article class="ab-work-item" ...>` — one attribute per block that should fade in on scroll.)

- [ ] **Step 3: Add the anti-FOUC CSS rule to `about.css`**

Append to `about.css`:

```css
/* Whisper-fade: reveal targets start hidden only when JS motion is on. */
html.motion-on [data-reveal],
html.motion-on [data-reveal-scroll] { opacity: 0; }
```

- [ ] **Step 4: Add entrance + scroll reveal + nav exit to `about.js`**

At the very end of `about.js` (after the peek-box IIFE closes on line 141), append:

```js
// ── Whisper-fade text reveal (see docs/.../2026-07-07-whisper-fade...) ──
(function () {
  if (typeof Motion === 'undefined') return;

  // Split the hero headline into lines so it fades line-by-line.
  document.querySelectorAll('[data-reveal-lines]').forEach(function (el) {
    Motion.splitLines(el);
  });

  // Entrance: hero fades in top→bottom on load.
  Motion.enter(document.querySelector('.ab-hero'));

  // Below-the-fold: fade each marked block in on scroll.
  Motion.observe(document);

  // Plain nav links (no structural transition) → whisper the page out first.
  document.querySelectorAll('.nav-links a[href]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var href = a.getAttribute('href');
      if (!href || href.charAt(0) === '#') return;    // skip in-page/placeholder
      if (href.indexOf('index.html') !== -1) return;  // Work → home uses peek glide path elsewhere
      e.preventDefault();
      Motion.exit(function () { window.location.href = href; });
    });
  });
})();
```

- [ ] **Step 5: Verify in the browser**

Run: `open ~/Documents/Porto/about.html`
Expected: on load, `[Ilham]` → headline lines → portrait fade in one-by-one top→bottom (opacity only, no movement). Scrolling down fades in About text, then each work item. The peek-box footer glide to home is unchanged. Toggle OS "Reduce motion" → everything appears instantly.

- [ ] **Step 6: Commit**

```bash
cd ~/Documents/Porto
git add about.html about.css about.js
git commit -m "feat(about): whisper-fade entrance, scroll reveal, and nav exit"
```

---

### Task 3: Wire whisper fade into the Case-Study detail (replace char/word reveals)

**Files:**
- Modify: `case-study.html` (add motion-on gate + `motion.js`)
- Modify: `case-study.css:692-760` (reveal states → whisper-compatible; anti-FOUC rule)
- Modify: `case-study.js:290-522` (buildDetail markup, delete split/char reveal, rewire to Motion) and `case-study.js:124-134` (close→home exit fade)

**Interfaces:**
- Consumes: `Motion.enter`, `Motion.observe`, `Motion.exit`, `Motion.splitLines` from Task 1.
- Note: `case-study.js` `render()` runs in TWO contexts — the standalone `case-study.html` and the homepage overlay (`index.html` loads `case-study.js`). Both dispatch the `cs-entered` event; hook the entrance reveal to it so both paths work.

- [ ] **Step 1: Add motion gate + `motion.js` to `case-study.html`**

After the theme script on line 8, add:

```html
  <script>try { if (!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) document.documentElement.classList.add('motion-on'); } catch (e) {}</script>
```

Change line 98 from:

```html
  <script src="case-study.js"></script>
```
to:

```html
  <script src="motion.js"></script>
  <script src="case-study.js"></script>
```

(In `index.html`, `motion.js` is added in Task 4 — it is also needed there because the overlay reuses `case-study.js`.)

- [ ] **Step 2: Simplify `buildDetail` markup — drop char/word splitting, add reveal attrs**

In `case-study.js`, replace the `splitChars` and `splitWords` helper functions (lines 303-333) and their call sites so blocks use plain text with `[data-reveal]`. Concretely:

Delete the `splitChars` (303-320) and `splitWords` (322-333) function definitions.

Replace the headline block (335-341) with:

```js
    // ── 1. Headline (whisper fades per line via Motion.splitLines) ──
    var headlineEl = document.createElement('h1');
    headlineEl.className = 'cs-headline';
    headlineEl.setAttribute('data-reveal', '');
    headlineEl.setAttribute('data-reveal-lines', '');
    headlineEl.textContent = p_data.title || p_data.subtitle || '';
    detail.appendChild(headlineEl);
```

Replace the meta row block (343-361) — remove the `splitChars` calls and the `gsap.set`, add `data-reveal`:

```js
    // ── 2. Meta row (Role / Client / Year) ──
    var metaRow = div('cs-meta-row');
    metaRow.setAttribute('data-reveal', '');
    var metaFields = [
      { label: 'Role',   value: p_data.meta && p_data.meta.role   ? p_data.meta.role   : '—' },
      { label: 'Client', value: p_data.meta && p_data.meta.client ? p_data.meta.client : '—' },
      { label: 'Year',   value: p_data.meta && p_data.meta.year   ? p_data.meta.year   : '—' }
    ];
    metaFields.forEach(function (f) {
      var item = div('cs-meta-item');
      item.appendChild(span('cs-meta-item-label', f.label));
      item.appendChild(span('cs-meta-item-value', f.value));
      metaRow.appendChild(item);
    });
    detail.appendChild(metaRow);
```

For the app link (364-374) add `data-reveal` on `appLink` and remove any `cs-reveal`:

```js
    appLink.className = 'cs-applink';
    appLink.setAttribute('data-reveal', '');
```

For the divider (376), add reveal:

```js
    var divider = div('cs-meta-divider');
    divider.setAttribute('data-reveal', '');
    detail.appendChild(divider);
```

Replace the summary block (378-387) — drop `splitWords`/`gsap.set`, use `data-reveal`:

```js
    // ── 3. Summary ──
    var summaryText = p_data.summary || (p_data.body && p_data.body[0]) || '';
    if (summaryText) {
      var bodyBlock = div('cs-body-block');
      bodyBlock.setAttribute('data-reveal', '');
      bodyBlock.appendChild(p('cs-body-para', summaryText));
      detail.appendChild(bodyBlock);
    }
```

For the video block (391) and gallery (418) — these are below-the-fold; change their class marker to scroll-reveal:

```js
      var videoBlock = div('cs-video-block');
      videoBlock.setAttribute('data-reveal-scroll', '');
```
```js
      var gallery = div('cs-gallery');
      gallery.setAttribute('data-reveal-scroll', '');
```

- [ ] **Step 3: Replace the reveal engine — `playReveal` + `rewireReveals` → Motion**

Replace `playReveal` (448-461) and `rewireReveals` (463-522) with a single Motion-based wiring. Delete both functions and the module-level observer/handler vars they used (`_onCsEnteredHeadline`, `_onCsEnteredTagRow`, `_onCsEnteredAboveFold`, `_observer`) where declared, and replace with:

```js
  // ── rewireReveals ──────────────────────────────────────────────────────────
  // Above-fold text whisper-fades on the `cs-entered` entrance event (fired by
  // both the standalone page and the homepage overlay). Below-fold blocks fade
  // on scroll. Split hero headline into lines first.
  function rewireReveals(sw) {
    if (_onCsEntered) { document.removeEventListener('cs-entered', _onCsEntered); _onCsEntered = null; }
    if (_observer)    { _observer.disconnect(); _observer = null; }
    if (typeof Motion === 'undefined') {
      document.querySelectorAll('[data-reveal],[data-reveal-scroll]').forEach(function (el) { el.style.opacity = '1'; });
      return;
    }

    (_detailEl || document).querySelectorAll('[data-reveal-lines]').forEach(function (el) {
      Motion.splitLines(el);
    });

    _onCsEntered = function () { Motion.enter(_detailEl); };
    document.addEventListener('cs-entered', _onCsEntered);

    _observer = Motion.observe(_detailEl);
  }
```

Add the module-level var near the other privates (replace the four deleted vars with one): `var _onCsEntered = null;` and keep `var _observer = null;`.

Update the swap teardown in `setActiveProject` (line 546) — the GSAP kill referenced `.cs-char`/`.cs-splitword`; simplify to:

```js
      if (window.gsap) { gsap.killTweensOf(_detailEl); }
```

- [ ] **Step 4: Make close→home whisper the panel text out (page-wipe untouched)**

In `case-study.html` `exitPage` (lines 124-134), the GSAP wipe stays exactly as-is. Add a whisper fade of the right-panel content that runs concurrently, before the wipe call. Change:

```js
      function exitPage(href) {
        var wipe = document.getElementById('page-wipe');
        if (window.gsap && wipe) {
          gsap.set(wipe, { display: 'block', autoAlpha: 1, xPercent: 100 });
          gsap.to(wipe, { xPercent: 0, duration: 0.6, ease: 'power4.inOut',
            onComplete: function () { window.location.href = href; }
          });
```
to:

```js
      function exitPage(href) {
        var wipe = document.getElementById('page-wipe');
        if (typeof Motion !== 'undefined') Motion.exit(null, document.getElementById('cs-detail'));
        if (window.gsap && wipe) {
          gsap.set(wipe, { display: 'block', autoAlpha: 1, xPercent: 100 });
          gsap.to(wipe, { xPercent: 0, duration: 0.6, ease: 'power4.inOut',
            onComplete: function () { window.location.href = href; }
          });
```

(`Motion.exit(null, …)` fades the text only; the existing wipe still owns navigation. The centered slider image is outside `#cs-detail`, so its glide is untouched.)

- [ ] **Step 5: Update `case-study.css` reveal states**

In `case-study.css`, replace the reveal block (lines 692-704) and the headline override (741-750) so nothing depends on `cs-char`/`cs-splitword`/`cs-reveal` translateY. Replace lines 692-704 with:

```css
/* ── Whisper-fade: reveal targets start hidden only when JS motion is on. ── */
html.motion-on [data-reveal],
html.motion-on [data-reveal-scroll] { opacity: 0; }
```

Delete the now-dead `.cs-headline.cs-reveal` (741-745) and `.cs-headline .cs-char` (747-750) rules, and the `.m-line`/`.m-word` need no CSS (inlined by `splitLines`).

- [ ] **Step 6: Verify both entry paths in the browser**

Run: `open "~/Documents/Porto/case-study.html?p=<any-slug>"`
Expected: headline lines → meta → app link → divider → summary whisper-fade in top→bottom on load. Scroll: video + gallery fade in. Click Close: right-panel text fades out while the white page-wipe slides in and the centered image keeps gliding — then it lands on home.

Then run: `open ~/Documents/Porto/index.html`, click a project card. Expected: the FLIP overlay glide is unchanged AND the right-panel text whisper-fades in on `cs-entered`.

- [ ] **Step 7: Commit**

```bash
cd ~/Documents/Porto
git add case-study.html case-study.css case-study.js
git commit -m "feat(case-study): whisper-fade reveals + exit; remove char/word split system"
```

---

### Task 4: Wire whisper fade into the Home first paint

**Files:**
- Modify: `index.html` (add motion-on gate + `motion.js` before other app scripts)
- Modify: `home.css` (anti-FOUC rule)
- Modify: `home.js:1105-1113` (replace ONLY the first-paint `revealText` call with a whisper reveal of section 0)

**Interfaces:**
- Consumes: `Motion.enter`, `Motion.splitLines` from Task 1.
- Untouched: `revealText` / `hideText` / `go()` — the section-to-section nav keeps its char-rise. Only the single splash→intro reveal changes.

- [ ] **Step 1: Add motion gate + `motion.js` to `index.html`**

After the theme script on line 12, add:

```html
  <script>try { if (!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) document.documentElement.classList.add('motion-on'); } catch (e) {}</script>
```

Change line 198 (first app script) from:

```html
  <script src="case-study.js"></script>
```
to:

```html
  <script src="motion.js"></script>
  <script src="case-study.js"></script>
```

- [ ] **Step 2: Add the anti-FOUC rule to `home.css`**

Append to `home.css`:

```css
/* Whisper-fade: home first-paint hero targets hidden only when JS motion on.
   Scoped to [data-reveal] so section-nav char reveals are unaffected. */
html.motion-on .page-section:first-child [data-reveal] { opacity: 0; }
```

- [ ] **Step 3: Mark section 0's hero text and swap the first-paint reveal**

In `home.js` `doExitSplash` (lines 1105-1113), the non-skip branch currently ends with `revealText(introTl, sectionText(0))`. Replace that single line so the FIRST paint uses whisper while the splash slide + `.porto` fade (structural) stay:

```js
      var introTl = gsap.timeline({ onComplete: function () { animating = false; } });
      introTl
        .to(splashEl, { yPercent: -105, duration: 1.0, ease: 'expo.inOut' }, 0)
        .to('.porto',  { opacity: 1,    duration: 0.5,  ease: 'power2.out' }, 0.3);
      // First paint = whisper fade (section-nav still uses revealText untouched).
      if (typeof Motion !== 'undefined') {
        var sec0 = document.querySelector('.page-section:first-child');
        if (sec0) {
          // cancel the char-hidden state GSAP set on section 0 so the container fade shows text
          if (window.gsap) gsap.set(sec0.querySelectorAll('.ph-label .char, .ph-title .char'), { opacity: 1, yPercent: 0 });
          sec0.querySelectorAll('.ph-label, .ph-title').forEach(function (el) { el.setAttribute('data-reveal', ''); });
          Motion.enter(sec0, { delay: 500 }); // start after the .porto fade begins
        }
      } else {
        revealText(introTl, sectionText(0));
      }
```

- [ ] **Step 4: Verify home first paint + nav still char-rises**

Run: `open ~/Documents/Porto/index.html`
Expected: splash slides up (unchanged); section 0's label + title whisper-fade in (opacity only, top→bottom) instead of the old char-rise. Then use the section navigator / scroll to change sections — those transitions still use the original char-rise. Opening a project still runs the FLIP glide. Arriving from About (peek glide) still lands instantly with no intro (skip-splash path untouched).

- [ ] **Step 5: Commit**

```bash
cd ~/Documents/Porto
git add index.html home.css home.js
git commit -m "feat(home): whisper-fade first paint; section-nav char-rise untouched"
```

---

## Self-Review Notes

- **Spec coverage:** motion.js module (Task 1) ✓; about entrance/scroll/exit (Task 2) ✓; case-study entrance/scroll/exit + deletions (Task 3) ✓; home first paint + kept nav (Task 4) ✓; reduced-motion + anti-FOUC in every task ✓; structural animations untouched (explicit in each task) ✓.
- **Deletions:** `splitChars`/`splitWords`/`playReveal` (Task 3 Step 2-3), about WAA reveal was actually never a text reveal (only theme/counter) — about had NO prior text reveal, so nothing to delete there, only add.
- **Known tradeoff (from spec):** home first paint whispers while section-nav keeps char-rise — two motion languages on home. Accepted per scope decision; revisit if it reads inconsistent.
