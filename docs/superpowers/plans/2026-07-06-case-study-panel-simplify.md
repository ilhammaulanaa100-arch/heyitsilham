# Simplify Case-Study Panel + Scattered Gallery — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce the case-study right panel to five blocks (title, meta, one summary paragraph, optional video, scattered gallery) and replace the single-column numbered image insets with an editorial scattered gallery that composes for any 3–7 images.

**Architecture:** Pure edit of three existing files — `content.js` (data), `case-study.css` (styles), `case-study.js` (`buildDetail` render). No new files, no libraries, no build step. The gallery is a fixed 7-slot pattern; each project renders `media.grid[0..n-1]` into slots `s1..sn`. Shape (landscape/square) is decided by slot position, not by the image.

**Tech Stack:** Vanilla HTML/CSS/JS, GSAP (already loaded), Lenis (already loaded). No test framework — verification is Playwright visual screenshots using the project's cached `chrome-headless-shell` (see Verification Setup).

## Global Constraints

- **Do NOT modify:** the left carousel (`buildSlider`), the FLIP open/close glide (`home.js`), the `.cs-reveal` IntersectionObserver reveal grammar, the theme system, the homepage, or the grid view.
- **Two shapes only:** `ls` = `aspect-ratio: 580 / 420`; `sq` = `aspect-ratio: 1 / 1`. No other ratios.
- **Slot shape assignment (fixed):** s1 ls, s2 sq, s3 sq, s4 ls, s5 sq, s6 ls, s7 ls.
- **Cap gallery at 7 images** (`.slice(0, 7)`).
- **Gallery reveals as ONE `.cs-reveal` block**, never per-figure (per-figure translate fights the negative-margin interlock).
- **Summary source:** `p_data.summary || (p_data.body && p_data.body[0]) || ''`.
- **Mobile breakpoint:** `@media (max-width: 900px)` — align to the panel's existing breakpoint (NOT 640px as the spec draft said).
- **Dormant data:** leave `body`, `tldr`, `reflections` in `content.js`; stop rendering them, do not delete.
- **`.cs-reveal` initial state (already in CSS):** `opacity: 0; transform: translateY(28px)`.

## Verification Setup (used by every task's screenshot step)

Serve porto and screenshot with the cached headless shell. Run once at session start:

```bash
# Serve porto (kill any stale server on the port first)
lsof -tnP -iTCP:8479 -sTCP:LISTEN | xargs kill 2>/dev/null
cd /Users/aleph/Documents/porto && python3 -m http.server 8479 >/dev/null 2>&1 &
sleep 1 && curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8479/index.html   # expect 200
```

Screenshot helper (save as `/private/tmp/claude-501/-Users-aleph/1b3a1047-b125-48e3-8365-c0415b46b026/scratchpad/shot.js`):

```javascript
const { chromium } = require('playwright-core');
const EXE = process.env.HOME + '/Library/Caches/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-mac-arm64/chrome-headless-shell';
const [ url, out, w = 1440, h = 900 ] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch({ executablePath: EXE });
  const p = await b.newPage({ viewport: { width: +w, height: +h } });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.goto(url, { waitUntil: 'load' });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: out, fullPage: true });
  if (errs.length) console.log('ERRORS:\n' + errs.join('\n')); else console.log('no page errors');
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
```

`playwright-core` is already installed in the scratchpad from prior sessions; if missing, run `cd <scratchpad> && npm i playwright-core --silent`.

The case-study opens directly at `http://localhost:8479/case-study.html?p=byond` (no splash), which is the fastest way to see the panel.

---

### Task 1: Fill data model in `content.js`

**Files:**
- Modify: `/Users/aleph/Documents/porto/content.js`

**Interfaces:**
- Produces: each `PROJECTS[i]` gains `summary` (string) and a filled `media.grid` (array of image-path strings). `buildDetail` (Task 3) consumes both.

- [ ] **Step 1: Add `summary` to the `byond` project and fill its `media.grid` with test images**

In `content.js`, in the `byond` object, add a `summary` field right after `sourceUrl` and replace its `media.grid: []` with seven copies of the existing thumbnail (real images get swapped in later — this only exists so the scatter is visible during verification):

```js
    slug: 'byond',
    category: 'PRODUCT',
    period: '2024',
    sourceUrl: '',
    summary: "BYOND rethinks what Islamic banking can feel like — modern without giving up the trust of its Syariah foundation. I owned the product end-to-end for over a year, from research to developer handoff.",
    subtitle: 'BYOND\nby BSI',
```

And in `byond`'s `media`:

```js
    media: {
      hero: 'assets/projects/byond/byond-thumbnail.png',
      video: 'assets/projects/byond/byond-showcase.mp4',
      fullImage: '',
      grid: [
        'assets/projects/byond/byond-thumbnail.png',
        'assets/projects/byond/byond-thumbnail.png',
        'assets/projects/byond/byond-thumbnail.png',
        'assets/projects/byond/byond-thumbnail.png',
        'assets/projects/byond/byond-thumbnail.png',
        'assets/projects/byond/byond-thumbnail.png',
        'assets/projects/byond/byond-thumbnail.png'
      ]
    },
```

- [ ] **Step 2: Add a `summary` field to every other project**

Add one `summary` line (after each `sourceUrl`) to `porto2026`, `project-03`, `project-04`, `project-05`, `project-06`. Use these:

```js
// porto2026
    summary: "A portfolio built to perform, not just display — cinematic scroll, an editorial grid, and motion that earns its place. Designed and coded end-to-end in vanilla HTML/CSS/JS with GSAP.",
// project-03, project-04, project-05, project-06 (all placeholders)
    summary: "Case study coming soon.",
```

Leave the placeholder projects' `media.grid` as `[]` — they render no gallery, which is correct.

- [ ] **Step 3: Verify the file parses and fields are present**

Start the server (see Verification Setup), then:

```bash
cd /private/tmp/claude-501/-Users-aleph/1b3a1047-b125-48e3-8365-c0415b46b026/scratchpad
node -e "
const { chromium } = require('playwright-core');
const EXE = process.env.HOME + '/Library/Caches/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-mac-arm64/chrome-headless-shell';
(async () => {
  const b = await chromium.launch({ executablePath: EXE });
  const p = await b.newPage();
  await p.goto('http://localhost:8479/case-study.html?p=byond', { waitUntil: 'load' });
  const info = await p.evaluate(() => ({
    hasSummary: typeof PROJECTS[1].summary === 'string' && PROJECTS[1].summary.length > 0,
    gridLen: PROJECTS[1].media.grid.length,
    allSummaries: PROJECTS.every(p => typeof p.summary === 'string')
  }));
  console.log(JSON.stringify(info));
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
"
```

Expected: `{"hasSummary":true,"gridLen":7,"allSummaries":true}`

- [ ] **Step 4: Commit**

```bash
cd /Users/aleph/Documents/porto
git add content.js
git commit -m "Add summary field and fill byond media.grid for case-study gallery"
```

---

### Task 2: Add scattered-gallery styles to `case-study.css`

**Files:**
- Modify: `/Users/aleph/Documents/porto/case-study.css` (replace `.cs-img-inset*` block at lines ~391-453; add mobile rules in the existing `@media (max-width: 900px)` block ~671)

**Interfaces:**
- Produces: CSS classes `.cs-gallery`, `.cs-g-fig`, `.cs-g-img`, `.cs-g-ph`, and slot classes `.s1`–`.s7` with shape classes `.ls` / `.sq`. Task 3's render targets exactly these class names.

- [ ] **Step 1: Replace the `.cs-img-inset*` rules with `.cs-gallery` rules**

In `case-study.css`, delete the block from `.cs-img-inset {` (line ~391) through `.cs-img-inset-ph-label { ... }` (ending ~453) and replace it with:

```css
/* ── Scattered gallery (replaces numbered image insets) ──
   Fixed 7-slot pattern. Two shapes only: landscape (homepage ratio) + square.
   Dense + interlocking: big images with negative margin-top so a right-lane
   image sits BESIDE a shorter left-lane image, killing white space. "Rapih"
   comes from the lane — left images align at ml≈2%, right images hug the right
   edge. Collision-safe: left lane ≤54% / right lane ≥52%. */
.cs-gallery { position: relative; }
.cs-g-fig { margin: 0; position: relative; overflow: hidden; background: #f0f0f0; }
.cs-g-fig.ls { aspect-ratio: 580 / 420; }
.cs-g-fig.sq { aspect-ratio: 1 / 1; }
.cs-g-ph { position: absolute; inset: 0; }
.cs-g-img {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  object-fit: cover; display: block;
}

.s1 { width: 54%; margin-left: 0;    }
.s2 { width: 38%; margin-left: 62%;  margin-top: -140px; }
.s3 { width: 38%; margin-left: 2%;   margin-top: 10px;   }
.s4 { width: 48%; margin-left: 52%;  margin-top: -120px; }
.s5 { width: 40%; margin-left: 2%;   margin-top: -70px;  }
.s6 { width: 46%; margin-left: 54%;  margin-top: -120px; }
.s7 { width: 50%; margin-left: 2%;   margin-top: -70px;  }
```

Note: `.cs-g-fig` sets `aspect-ratio` on the figure itself (not on the img), so the box holds its shape before the image loads and the gradient placeholder shows the scatter immediately.

- [ ] **Step 2: Add mobile scatter rules inside the existing `@media (max-width: 900px)` block**

Find `@media (max-width: 900px) {` (line ~671). It currently contains a `.cs-img-inset-inner { width: 90%; }` rule — delete that line (the class no longer exists). Add these rules inside the same media block:

```css
  .s1 { width: 92%; margin-left: 4%;  margin-top: 0;    }
  .s2 { width: 58%; margin-left: 42%; margin-top: 32px; }
  .s3 { width: 66%; margin-left: 0;   margin-top: 32px; }
  .s4 { width: 88%; margin-left: 12%; margin-top: 40px; }
  .s5 { width: 54%; margin-left: 4%;  margin-top: 32px; }
  .s6 { width: 60%; margin-left: 38%; margin-top: 32px; }
  .s7 { width: 92%; margin-left: 4%;  margin-top: 40px; }
```

- [ ] **Step 3: Remove now-orphaned dark-mode rule for the deleted inset class**

At line ~751-753 there is:

```css
html.dark .cs-img-inset-inner,
html.dark .cs-next-thumb { background: #1c1b1b; }
html.dark .cs-img-inset-num { color: rgba(255, 255, 255, 0.35); }
```

Change it to drop the two `.cs-img-inset*` selectors (keep `.cs-next-thumb` — the What's Next thumb style is harmless dormant CSS) and add a dark placeholder for the gallery figure:

```css
html.dark .cs-next-thumb,
html.dark .cs-g-fig { background: #1c1b1b; }
```

- [ ] **Step 4: Verify the CSS still parses (page loads, no new errors)**

```bash
node /private/tmp/claude-501/-Users-aleph/1b3a1047-b125-48e3-8365-c0415b46b026/scratchpad/shot.js "http://localhost:8479/case-study.html?p=byond" /private/tmp/claude-501/-Users-aleph/1b3a1047-b125-48e3-8365-c0415b46b026/scratchpad/t2-css.png
```

Expected: `no page errors`. (The gallery won't look new yet — Task 3 renders it. This step only confirms the stylesheet is valid and the page still loads.)

- [ ] **Step 5: Commit**

```bash
cd /Users/aleph/Documents/porto
git add case-study.css
git commit -m "Replace numbered image insets with scattered gallery styles"
```

---

### Task 3: Rewrite `buildDetail` in `case-study.js`

**Files:**
- Modify: `/Users/aleph/Documents/porto/case-study.js` (function `buildDetail`, lines ~317-514)

**Interfaces:**
- Consumes: `p_data.summary`, `p_data.body[0]` (fallback), `p_data.media.video`, `p_data.media.grid` (from Task 1); CSS classes `.cs-gallery`, `.cs-g-fig`, `.cs-g-ph`, `.cs-g-img`, `.s1`–`.s7`, `.ls`, `.sq` (from Task 2).
- Produces: a `buildDetail` that renders exactly: headline → meta grid → summary paragraph → optional video → gallery. Nothing else. `render`, `teardown`, `setActiveProject`, `rewireReveals` keep their existing signatures.

- [ ] **Step 1: Replace the body of `buildDetail`**

Replace the entire function `buildDetail` (from `function buildDetail(p_data, detail, exitFn) {` at line ~317 through its closing `} // end buildDetail` at ~514) with the version below. It keeps blocks 2 (headline), 3 (meta grid), and 5 (video) unchanged; replaces block 4 with a single summary paragraph; replaces block 6 with the scattered gallery; and drops blocks 1 (tag row), 7 (TL;DR), 8 (reflections), 9 (What's Next).

```js
  // ── buildDetail ───────────────────────────────────────────────────────────
  function buildDetail(p_data, detail, exitFn) {
    if (!detail) return;

    function mkEl(tag, cls, text) {
      var e = document.createElement(tag);
      if (cls)  e.className = cls;
      if (text !== undefined && text !== null) e.textContent = text;
      return e;
    }
    function div(cls)        { return mkEl('div',  cls); }
    function span(cls, text) { return mkEl('span', cls, text); }
    function p(cls, text)    { return mkEl('p',    cls, text); }

    // ── 1. Headline with char-split ──────────────────────
    var headlineEl = document.createElement('h1');
    headlineEl.className = 'cs-headline cs-reveal';
    var titleText = p_data.title || p_data.subtitle || '';
    titleText.split(/(\s+)/).forEach(function (token) {
      if (token === '') return;
      if (/^\s+$/.test(token)) { headlineEl.appendChild(document.createTextNode(' ')); return; }
      var wordEl = document.createElement('span');
      wordEl.className = 'cs-word';
      token.split('').forEach(function (ch) {
        var charEl = document.createElement('span');
        charEl.className = 'cs-char';
        charEl.textContent = ch;
        wordEl.appendChild(charEl);
      });
      headlineEl.appendChild(wordEl);
    });
    detail.appendChild(headlineEl);
    if (window.gsap) gsap.set(headlineEl.querySelectorAll('.cs-char'), { opacity: 0, yPercent: 60 });

    // ── 2. Meta grid (Timeline / Role / Client / Year) ───
    var metaGrid = div('cs-meta-grid cs-reveal');
    var metaFields = [
      { label: 'Timeline', value: p_data.meta && p_data.meta.timeline ? p_data.meta.timeline : '—' },
      { label: 'Role',     value: p_data.meta && p_data.meta.role     ? p_data.meta.role     : '—' },
      { label: 'Client',   value: p_data.meta && p_data.meta.client   ? p_data.meta.client   : '—' },
      { label: 'Year',     value: p_data.meta && p_data.meta.year     ? p_data.meta.year     : '—' }
    ];
    metaFields.forEach(function (f) {
      var cell = div('cs-meta-cell');
      cell.appendChild(span('cs-meta-cell-label', f.label));
      cell.appendChild(span('cs-meta-cell-value', f.value));
      metaGrid.appendChild(cell);
    });
    detail.appendChild(metaGrid);

    // ── 3. Summary (single short paragraph) ──────────────
    var summaryText = p_data.summary || (p_data.body && p_data.body[0]) || '';
    if (summaryText) {
      var bodyBlock = div('cs-body-block cs-reveal');
      bodyBlock.appendChild(p('cs-body-para', summaryText));
      detail.appendChild(bodyBlock);
    }

    // ── 4. Video showcase (if media.video exists) ────────
    if (p_data.media && p_data.media.video) {
      var videoBlock = div('cs-video-block cs-reveal');
      var vph = div('cs-video-ph');
      vph.appendChild(span('cs-video-ph-label', 'Video Showcase'));
      videoBlock.appendChild(vph);
      var vid = document.createElement('video');
      vid.src = p_data.media.video;
      vid.autoplay = true; vid.muted = true;
      vid.setAttribute('muted', ''); vid.loop = true;
      vid.setAttribute('playsinline', '');
      vid.style.cssText = 'opacity:0;transition:opacity 0.8s ease;';
      vid.addEventListener('canplay', function () {
        vid.style.opacity       = '1';
        vph.style.opacity       = '0';
        vph.style.pointerEvents = 'none';
      }, { once: true });
      videoBlock.appendChild(vid);
      detail.appendChild(videoBlock);
    }

    // ── 5. Scattered gallery from media.grid (3–7 images) ─
    // Shape is decided by SLOT position, not the image (design option B):
    // first image is always the landscape hero. Whole gallery reveals as ONE
    // .cs-reveal block — per-figure reveal fights the negative-margin interlock.
    var SLOTS = ['s1 ls', 's2 sq', 's3 sq', 's4 ls', 's5 sq', 's6 ls', 's7 ls'];
    var gridItems = (p_data.media && p_data.media.grid) ? p_data.media.grid.slice(0, 7) : [];
    if (gridItems.length) {
      var gallery = div('cs-gallery cs-reveal');
      gridItems.forEach(function (item, i) {
        var src = (typeof item === 'string') ? item : (item.src || '');
        var fig = document.createElement('figure');
        fig.className = 'cs-g-fig ' + SLOTS[i];
        // Gradient placeholder behind the image: keeps the scatter visible
        // before/if the image loads, and matches the homepage card grammar.
        var ph = div('cs-g-ph');
        ph.style.background = p_data.color || '#f0f0f0';
        fig.appendChild(ph);
        if (src) {
          var img = document.createElement('img');
          img.className = 'cs-g-img';
          img.src = src;
          img.alt = '';
          img.onerror = function () { this.style.display = 'none'; };
          fig.appendChild(img);
        }
        gallery.appendChild(fig);
      });
      detail.appendChild(gallery);
    }

  } // end buildDetail
```

- [ ] **Step 2: Verify the panel renders the five blocks at 7 images (desktop)**

```bash
node /private/tmp/claude-501/-Users-aleph/1b3a1047-b125-48e3-8365-c0415b46b026/scratchpad/shot.js "http://localhost:8479/case-study.html?p=byond" /private/tmp/claude-501/-Users-aleph/1b3a1047-b125-48e3-8365-c0415b46b026/scratchpad/t3-7img.png
```

Expected: `no page errors`. Open the PNG and confirm, top to bottom: headline → 4 meta boxes → one paragraph → video → scattered gallery (landscape hero, then square/landscape zig-zag, no horizontal collision between pink/yellow-equivalent slots, minimal white space). Confirm there is NO tag pill, NO TL;DR, NO reflections, NO "What's Next".

- [ ] **Step 3: Verify 3-image and 5-image composition**

Temporarily edit `content.js` `byond.media.grid` down to 3 entries, screenshot, then 5 entries, screenshot:

```bash
# after editing grid to 3 items:
node /private/tmp/claude-501/-Users-aleph/1b3a1047-b125-48e3-8365-c0415b46b026/scratchpad/shot.js "http://localhost:8479/case-study.html?p=byond" /private/tmp/claude-501/-Users-aleph/1b3a1047-b125-48e3-8365-c0415b46b026/scratchpad/t3-3img.png
# after editing grid to 5 items:
node /private/tmp/claude-501/-Users-aleph/1b3a1047-b125-48e3-8365-c0415b46b026/scratchpad/shot.js "http://localhost:8479/case-study.html?p=byond" /private/tmp/claude-501/-Users-aleph/1b3a1047-b125-48e3-8365-c0415b46b026/scratchpad/t3-5img.png
```

Expected both: `no page errors`, gallery composes cleanly (hero + zig-zag), no collision. Then restore `byond.media.grid` to the 7 test entries.

- [ ] **Step 4: Verify mobile + dark mode**

```bash
# mobile 390px
node /private/tmp/claude-501/-Users-aleph/1b3a1047-b125-48e3-8365-c0415b46b026/scratchpad/shot.js "http://localhost:8479/case-study.html?p=byond" /private/tmp/claude-501/-Users-aleph/1b3a1047-b125-48e3-8365-c0415b46b026/scratchpad/t3-mobile.png 390 844
```

Expected: `no page errors`; gallery is near-full-width zig-zag, no horizontal page scroll. For dark mode, in the same page set `localStorage.porto-theme='dark'` by visiting `http://localhost:8479/case-study.html?p=byond` after toggling on the homepage, or add `?` and toggle — simplest: screenshot the homepage in dark, then open the case study. Confirm gallery placeholders use the dark `#1c1b1b`, not white.

- [ ] **Step 5: Regression — confirm the FLIP glide and carousel still work**

Open the homepage, click a project card, confirm the card glides into the case-study hero and the panel shows the new five-block layout; use the left-panel arrows to switch projects and confirm the right panel crossfades. Drive it:

```bash
node -e "
const { chromium } = require('playwright-core');
const EXE = process.env.HOME + '/Library/Caches/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-mac-arm64/chrome-headless-shell';
(async () => {
  const b = await chromium.launch({ executablePath: EXE });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8479/index.html', { waitUntil: 'load' });
  await p.waitForTimeout(4000);                       // splash
  await p.click('.page-section.is-active .proj-card');
  await p.waitForTimeout(1500);
  const open = await p.evaluate(() => document.getElementById('cs-overlay').classList.contains('is-open'));
  await p.screenshot({ path: '/private/tmp/claude-501/-Users-aleph/1b3a1047-b125-48e3-8365-c0415b46b026/scratchpad/t3-glide.png' });
  console.log('overlay open:', open, '| errors:', errs.length ? errs.join(';') : 'none');
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
"
```

Expected: `overlay open: true | errors: none`, and the screenshot shows the new panel after the glide.

- [ ] **Step 6: Commit**

```bash
cd /Users/aleph/Documents/porto
git add case-study.js
git commit -m "Simplify case-study panel to five blocks with scattered gallery"
```

---

## Post-implementation notes (for the user, not steps)

- The `byond.media.grid` currently holds 7 copies of the thumbnail as stand-ins. Swap them for the real, ordered gallery images (strongest shot first — it becomes the landscape hero). Other projects render no gallery until their `grid` is filled.
- If the real `#cs-right` panel width differs enough from the ~780px preview that the negative-margin interlock leaves gaps or collides, convert the desktop `margin-top` values to a width-relative unit (e.g. a percentage of the figure or a `clamp()`), then re-run the Task 3 Step 2–3 screenshots. Do not tune blind — verify by screenshot.
- Dormant `body`, `tldr`, `reflections` data remains in `content.js`. A later cleanup pass can delete it and the matching dormant CSS (`.cs-tag-row`, `.cs-tldr-*`, `.cs-reflections-*`, `.cs-next-*`, `.cs-body-*` beyond `.cs-body-para`) if desired.

## Self-Review

- **Spec coverage:** five-block structure (Task 3 Step 1) ✓; removed tag/body-multi/insets/tldr/reflections/whatsnext (Task 3 Step 1) ✓; `summary` field + fallback (Task 1, Task 3) ✓; `media.grid` 3–7 ordered, shape-by-slot (Task 1, Task 3) ✓; two shapes ls/sq (Task 2) ✓; slot pattern exact values incl. pink-overlap fix (Task 2) ✓; gallery reveals as one block (Task 3) ✓; mobile scatter (Task 2) ✓; dormant data left in place (Task 1 note, Task 3) ✓; dark mode (Task 2 Step 3, Task 3 Step 4) ✓; regression on glide/carousel (Task 3 Step 5) ✓; margin-px caveat (Post-impl notes) ✓.
- **Placeholder scan:** no TBD/TODO; every code step shows full code; every verify step shows exact command + expected output.
- **Type/name consistency:** CSS class names `.cs-gallery`/`.cs-g-fig`/`.cs-g-ph`/`.cs-g-img`/`.s1`–`.s7`/`.ls`/`.sq` match between Task 2 (definition) and Task 3 (usage). `SLOTS` array shapes match the Task 2 shape assignment. `summary` field name consistent across Task 1 and Task 3.
