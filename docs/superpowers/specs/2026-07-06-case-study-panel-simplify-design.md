# Simplify Case-Study Right Panel + Scattered Gallery

**Date:** 2026-07-06
**Scope:** `case-study.js` (buildDetail), `case-study.css`, `content.js`
**Constraint:** Do NOT change the carousel (left panel), the FLIP glide transition, the
reveal-on-scroll animation grammar, the theme system, or any other existing behavior.

## Goal

Strip the case-study right panel down to five blocks and replace the single-column
numbered image insets with an editorial, scattered gallery (reference:
jasminegunarto.com/break). The gallery must compose cleanly for **any project with
3–7 images**, with no per-project layout work.

## Target structure (top → bottom)

1. **Title** (headline, keeps existing char-split reveal)
2. **4 meta boxes** — Timeline / Role / Client / Year (unchanged)
3. **One short paragraph** — new `summary` field
4. **Video** — optional, only rendered if `media.video` exists (unchanged behavior)
5. **Scattered gallery** — 3–7 images, two shapes only, interlocking layout

### Removed from the current panel
- Tag row (category pill + period)
- Multi-paragraph `body` block → replaced by single `summary`
- Numbered image insets (`.cs-img-inset`) → replaced by scattered gallery
- TL;DR block
- Reflections block
- **What's Next** block (navigation stays available via the left carousel + arrows)

## Data model (`content.js`)

Each project gains a `summary` string and fills the existing `media.grid` slot with an
**ordered list of image paths** (3–7 entries). Captions are dropped.

```js
{
  slug: 'byond',
  // ...existing meta{} unchanged...
  summary: "One ringkas paragraph written for this panel.",   // NEW
  media: {
    hero: 'assets/projects/byond/hero.png',
    video: 'assets/projects/byond/showcase.mp4',              // '' = no video block
    grid: [                                                    // 3–7 ordered paths
      'assets/projects/byond/1.jpg',   // → slot 1 (landscape, hero)
      'assets/projects/byond/2.jpg',   // → slot 2 (square)
      'assets/projects/byond/3.jpg',   // → slot 3 (square)
      'assets/projects/byond/4.jpg'    // → slot 4 (landscape)
    ]
  }
}
```

**Shape is decided by slot position, not by the image** (design option B). Image order =
curation: the first image is always the landscape hero, so put the strongest shot first.
Images are `object-fit: cover` cropped to their slot's aspect ratio.

**Dormant data:** existing `body`, `tldr`, `reflections` fields stay in `content.js` but
are no longer rendered. Not deleted — small diff, easy to revive. `summary` falls back to
`body[0]` if a project hasn't been given a `summary` yet, so nothing breaks mid-migration.

## Slot pattern (the core system)

Two shapes only, matching the homepage vocabulary:
- **`ls` (landscape)** — `aspect-ratio: 580 / 420` (homepage's ratio)
- **`sq` (square)** — `aspect-ratio: 1 / 1`

Seven fixed slots. A project renders `grid[0..n-1]` into slots `s1..sn`; the sequence is
designed so **stopping at any count (3–7) still composes** — hero first, then a left/right
zig-zag. Shape assignment by slot:

| Slot | Shape | Lane |
|------|-------|------|
| s1 | landscape | left, hero |
| s2 | square | right |
| s3 | square | left |
| s4 | landscape | right |
| s5 | square | left |
| s6 | landscape | right |
| s7 | landscape | left, closer |

### Desktop CSS (validated in preview)

```css
.cs-gallery { position: relative; }
.cs-gallery figure { margin: 0; }          /* low specificity — slot classes win */
.cs-gallery .ls .cs-g-img { aspect-ratio: 580 / 420; }
.cs-gallery .sq .cs-g-img { aspect-ratio: 1 / 1; }
.cs-gallery .cs-g-img { width: 100%; object-fit: cover; display: block; }

/* Dense, interlocking, aligned to lanes.
   Big images + negative margin-top so a right-lane image sits BESIDE a shorter
   left-lane image (kills white space). "Rapih" comes from the lane: left images
   align at ml≈2%, right images align to the right edge. Scattered but edges line up.
   Collision-safe: left lane ≤54% / right lane ≥52%; every pulled-up right image sits
   beside a shorter left image, never overlapping horizontally. */
.s1 { width: 54%; margin-left: 0;    }
.s2 { width: 38%; margin-left: 62%;  margin-top: -140px; }
.s3 { width: 38%; margin-left: 2%;   margin-top: 10px;   }
.s4 { width: 48%; margin-left: 52%;  margin-top: -120px; }
.s5 { width: 40%; margin-left: 2%;   margin-top: -70px;  }
.s6 { width: 46%; margin-left: 54%;  margin-top: -120px; }
.s7 { width: 50%; margin-left: 2%;   margin-top: -70px;  }
```

**Note on pixel margins:** the negative `margin-top` values are tuned for the panel's
desktop width. If the real `#cs-right` width differs enough from the preview (~780px
content) that the interlock breaks, convert the vertical offsets to a width-relative unit
(e.g. `margin-top: -18%` of the figure, or a small clamp) during implementation. Verify by
screenshot, not by assumption.

### Mobile CSS (≤640px, or the panel's mobile breakpoint)

Scatter narrows but keeps the zig-zag; images near full width, positive vertical gaps
(no interlock — too tight on a phone). Values from the preview:

```css
.s1 { width: 92%; margin-left: 4%; }
.s2 { width: 58%; margin-left: 42%; margin-top: 32px; }
.s3 { width: 66%; margin-left: 0;   margin-top: 32px; }
.s4 { width: 88%; margin-left: 12%; margin-top: 40px; }
.s5 { width: 54%; margin-left: 4%;  margin-top: 32px; }
.s6 { width: 60%; margin-left: 38%; margin-top: 32px; }
.s7 { width: 92%; margin-left: 4%;  margin-top: 40px; }
```

## `case-study.js` — buildDetail rewrite

Keep the block order and the `.cs-reveal` mechanism. Render only:

1. **Headline** — unchanged (char-split, `cs-entered` reveal).
2. **Meta grid** — unchanged.
3. **Summary paragraph** — `p_data.summary || (p_data.body && p_data.body[0]) || ''`,
   wrapped in one `.cs-reveal` block. Skip if empty.
4. **Video block** — unchanged, gated on `media.video`.
5. **Gallery** — new. Loop `media.grid` (0–7 items, cap at 7):

```js
var SLOTS = ['s1 ls','s2 sq','s3 sq','s4 ls','s5 sq','s6 ls','s7 ls'];
var imgs = (p_data.media && p_data.media.grid) ? p_data.media.grid.slice(0, 7) : [];
if (imgs.length) {
  var gallery = div('cs-gallery cs-reveal');   // whole block reveals as one unit
  imgs.forEach(function (item, i) {
    var src = (typeof item === 'string') ? item : (item.src || '');
    var fig = document.createElement('figure');
    fig.className = SLOTS[i];
    var im = document.createElement('img');
    im.className = 'cs-g-img';
    im.src = src;
    im.alt = '';                                 // decorative; title carries meaning
    im.onerror = function () { this.style.display = 'none'; };
    fig.appendChild(im);
    gallery.appendChild(fig);
  });
  detail.appendChild(gallery);
}
```

**Reveal decision:** the gallery reveals as ONE `.cs-reveal` block (not per-figure),
because per-figure reveal fights the negative-margin interlock (a figure translating up
from `y:20` while sitting at `margin-top:-140px` reads as a jump). One block fade-up is
consistent with the existing grammar and safe. Revisit only if a per-image stagger is
explicitly wanted.

Delete the code for: tag row, multi-para body loop, `.cs-img-inset` loop, TL;DR,
reflections, What's Next. `resolveProject`'s grid-normalizer (string → {src}) can stay; the
new loop tolerates both shapes.

## `case-study.css` — style swap

- Remove/replace `.cs-img-inset*` rules with `.cs-gallery` + slot rules above.
- Leave dormant-block styles (`.cs-tag-row`, `.cs-tldr-*`, `.cs-reflections-*`,
  `.cs-next-*`, `.cs-body-*`) in place or remove — cosmetic, not required for correctness.
  Prefer removing the ones that are now guaranteed-unused to keep the file honest, but this
  is not load-bearing.
- Dark theme: gallery images need no special dark treatment (photos). Ensure any
  placeholder/empty state uses an existing token, not a hardcoded color.

## Known issue already resolved

Earlier iteration had s7 (pink) overlapping s6 (yellow) at 7 images. Fixed by keeping s7
in the left lane (`ml 2%`, width 50% → right edge 52%) clear of s6's right lane (`ml 54%`).
The values above are the fixed set.

## Testing

Serve porto locally, open a case study, verify via Playwright screenshots (cached
chrome-headless-shell, per project convention):
- Desktop panel at 3, 5, 7 images — no collision, dense, lanes aligned.
- A project with `media.video` set — video block renders above gallery.
- Mobile width — scatter reads, no horizontal body scroll.
- Dark mode.
- Confirm the FLIP open/close glide and carousel still work (regression).

## Out of scope
- Homepage, grid view, theme system, carousel behavior.
- Filling real image assets for all projects (data entry, done by user per project).
- Typography finalization (deferred separately).
