(function (global) {
  'use strict';

  var _lenis               = null;
  var _lenisRafId          = null;
  var _observer            = null;
  var _sliderEl            = null;
  var _detailEl            = null;
  var _slideEls            = [];
  var _onCsEnteredHeadline = null;
  var _onCsEnteredTagRow   = null;
  var _onSliderKeydown     = null;
  var _onWindowResize      = null;
  var _onSliderTouchStart  = null;
  var _onSliderTouchEnd    = null;
  var _onWheelLeft         = null;
  var _leftPanelEl         = null;
  var _scrollWrapper       = null;
  var _contentEl           = null;
  var _exitFn              = null;

  function slugOf(project, index) {
    return project.slug || String(index + 1);
  }

  // ── resolveProject ────────────────────────────────────────────────────────
  // Given the ?p= value, return the matching project (slug → numeric → first).
  // Applies the field normalizer in-place. Returns null if PROJECTS unavailable.
  function resolveProject(param) {
    if (typeof PROJECTS === 'undefined' || !PROJECTS || !PROJECTS.length) return null;

    var p = PROJECTS.find(function (pr) { return pr.slug === param; });
    if (!p) {
      var idx = parseInt(param, 10);
      p = (idx >= 1 && idx <= PROJECTS.length) ? PROJECTS[idx - 1] : null;
    }
    if (!p) p = PROJECTS[0];

    // Safety normalizer — fills missing fields with safe defaults.
    // Intentionally mutates the shared PROJECTS entry in place; harmless because
    // case-study.html only ever loads one project per page load.
    p.sourceUrl = p.sourceUrl || '';
    p.body      = p.body      || [];
    p.category  = p.category  || '';
    p.period    = p.period    || (p.meta && p.meta.year) || '';
    if (p.media && p.media.grid && p.media.grid.length) {
      p.media.grid = p.media.grid.map(function (item) {
        return (typeof item === 'string') ? { src: item, caption: '' } : item;
      });
    }
    return p;
  }

  // ── render ────────────────────────────────────────────────────────────────
  // Builds left slider + right detail, wires interactions, inits Lenis + reveals.
  // opts = { sliderEl, detailEl, scrollWrapper, contentEl, exitFn }
  // Returns { teardown }.
  function render(project, opts) {
    opts = opts || {};
    var sliderEl      = opts.sliderEl      || document.getElementById('cs-slider');
    var detailEl      = opts.detailEl      || document.getElementById('cs-detail');
    var scrollWrapper = opts.scrollWrapper || document.getElementById('cs-right');
    var contentEl     = opts.contentEl     || document.getElementById('cs-right-content');
    var exitFn        = opts.exitFn        || function (href) { window.location.href = href; };

    _sliderEl      = sliderEl;
    _detailEl      = detailEl;
    _scrollWrapper = scrollWrapper;
    _contentEl     = contentEl;
    _exitFn        = exitFn;

    var activeIndex = (typeof PROJECTS !== 'undefined') ? PROJECTS.indexOf(project) : 0;
    if (activeIndex < 0) activeIndex = 0;
    buildSlider(project, sliderEl, activeIndex);
    buildDetail(project, detailEl, exitFn);
    initScrollAndReveals(scrollWrapper, contentEl);

    return { teardown: teardown };
  }

  // ── teardown ──────────────────────────────────────────────────────────────
  function teardown() {
    if (_onCsEnteredHeadline) { document.removeEventListener('cs-entered', _onCsEnteredHeadline); _onCsEnteredHeadline = null; }
    if (_onCsEnteredTagRow)   { document.removeEventListener('cs-entered', _onCsEnteredTagRow);   _onCsEnteredTagRow   = null; }
    if (_onSliderKeydown)     { document.removeEventListener('keydown',    _onSliderKeydown);      _onSliderKeydown     = null; }
    if (_onWindowResize)      { window.removeEventListener('resize',       _onWindowResize);       _onWindowResize      = null; }
    if (_onSliderTouchStart && _sliderEl)    { _sliderEl.removeEventListener('touchstart', _onSliderTouchStart); _onSliderTouchStart = null; }
    if (_onSliderTouchEnd   && _sliderEl)    { _sliderEl.removeEventListener('touchend',   _onSliderTouchEnd);   _onSliderTouchEnd   = null; }
    if (_onWheelLeft        && _leftPanelEl) { _leftPanelEl.removeEventListener('wheel',   _onWheelLeft);        _onWheelLeft        = null; }
    _leftPanelEl = null;
    if (_lenisRafId) { cancelAnimationFrame(_lenisRafId); _lenisRafId = null; }
    if (_lenis)    { _lenis.destroy(); _lenis = null; if (_scrollWrapper) _scrollWrapper.style.overflowY = ''; }
    if (_observer) { _observer.disconnect(); _observer = null; }
    if (window.gsap) {
      _slideEls.forEach(function (el) { gsap.killTweensOf(el); });
      if (_detailEl) {
        gsap.killTweensOf(_detailEl.querySelectorAll('.cs-reveal'));
        gsap.killTweensOf(_detailEl.querySelectorAll('.cs-char'));
      }
    }
    _slideEls = [];
    if (_sliderEl) _sliderEl.innerHTML = '';
    if (_detailEl) _detailEl.innerHTML = '';
    _sliderEl = null;
    _detailEl = null;
  }

  // ── buildSlider ───────────────────────────────────────────────────────────
  function buildSlider(p_data, sliderEl, activeIndex) {
    // ── Assemble slide data from PROJECTS (one slide per project) ──────────
    var allProjects = (typeof PROJECTS !== 'undefined' && PROJECTS && PROJECTS.length) ? PROJECTS : [p_data];
    activeIndex = (activeIndex >= 0 && activeIndex < allProjects.length) ? activeIndex : 0;

    var slides = allProjects.map(function (pr, i) {
      var src = (pr.media && pr.media.hero) ? pr.media.hero : '';
      var cat = pr.category || '';
      var per = pr.period   || (pr.meta && pr.meta.year) || '';
      var caption = (cat || per)
        ? (cat + (per ? ' (' + per + ')' : ''))
        : (pr.subtitle || '');
      return { src: src, caption: caption, color: pr.color, num: String(i + 1).padStart(2, '0') };
    });

    var TOTAL     = slides.length;
    var current   = activeIndex;
    var animating = false;

    if (!sliderEl) return;

    // ── Build DOM ───────────────────────────────────────
    var slideEls = [];
    _slideEls    = slideEls; // expose for teardown

    slides.forEach(function (slide, i) {
      var wrapper = document.createElement('div');
      wrapper.className = 'cs-slide' + (i === activeIndex ? ' is-active' : '');
      wrapper.setAttribute('data-index', i);

      // Zero-padded project number above card
      var numEl = document.createElement('span');
      numEl.className = 'cs-slide-num';
      numEl.textContent = slide.num;
      wrapper.appendChild(numEl);

      // Card
      var card = document.createElement('div');
      card.className = 'proj-card';

      // Gradient placeholder always present behind the image
      var ph = document.createElement('div');
      ph.className = 'proj-card-ph';
      ph.style.background = slide.color || '#f0f0f0';
      card.appendChild(ph);

      // Cover image (if src exists)
      if (slide.src) {
        var img = document.createElement('img');
        img.src = slide.src;
        img.alt = slide.caption || '';
        img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;z-index:1;';
        img.onerror = function () { this.style.display = 'none'; };
        card.appendChild(img);
      }

      wrapper.appendChild(card);

      // Caption below card
      if (slide.caption) {
        var capEl = document.createElement('span');
        capEl.className = 'cs-slide-caption';
        capEl.textContent = slide.caption;
        wrapper.appendChild(capEl);
      }

      sliderEl.appendChild(wrapper);
      slideEls.push(wrapper);
    });

    // ── Dots ────────────────────────────────────────────
    var dotEls = [];
    if (TOTAL > 1) {
      var dotsEl = document.createElement('div');
      dotsEl.className = 'cs-slider-dots';
      slides.forEach(function (_, i) {
        var dot = document.createElement('div');
        dot.className = 'cs-slider-dot' + (i === activeIndex ? ' is-active' : '');
        dot.addEventListener('click', function () { if (!animating) goTo(i); });
        dotsEl.appendChild(dot);
        dotEls.push(dot);
      });
      sliderEl.appendChild(dotsEl);
    }

    // ── Prev/Next click zones ────────────────────────────
    if (TOTAL > 1) {
      var prevZone = document.createElement('div');
      prevZone.className = 'cs-slider-prev';
      prevZone.addEventListener('click', function () {
        if (!animating) goTo((current - 1 + TOTAL) % TOTAL);
      });
      sliderEl.appendChild(prevZone);

      var nextZone = document.createElement('div');
      nextZone.className = 'cs-slider-next';
      nextZone.addEventListener('click', function () {
        if (!animating) goTo((current + 1) % TOTAL);
      });
      sliderEl.appendChild(nextZone);
    }

    // ── Position helpers ─────────────────────────────────
    // Returns the X offset (px) for slide at `idx` when `cur` is active.
    //   fd=0 → center; fd=1 → peek right; fd=TOTAL-1 → peek left; others → parked off-screen
    function xFor(idx, cur) {
      var W  = sliderEl.offsetWidth;
      var fd = (idx - cur + TOTAL) % TOTAL;
      if (fd === 0)         return 0;
      if (fd === 1)         return  W * 0.61;
      if (fd === TOTAL - 1) return -W * 0.61;
      if (fd === 2)         return  W * 1.3;
      if (fd === TOTAL - 2) return -W * 1.3;
      return fd < TOTAL / 2 ? W * 1.3 : -W * 1.3;
    }

    function scaleFor(idx, cur) {
      return ((idx - cur + TOTAL) % TOTAL === 0) ? 1 : 0.7;
    }

    function opacityFor(idx, cur) {
      var fd = (idx - cur + TOTAL) % TOTAL;
      if (fd === 0)                     return 1;
      if (fd === 1 || fd === TOTAL - 1) return 0.65;
      return 0;
    }

    // ── Initial placement (instant, no animation) ────────
    slideEls.forEach(function (el, i) {
      if (window.gsap) {
        gsap.set(el, {
          x:               xFor(i, activeIndex),
          scale:           scaleFor(i, activeIndex),
          opacity:         opacityFor(i, activeIndex),
          transformOrigin: 'center center'
        });
      } else {
        el.style.transform = 'translate(calc(-50% + ' + xFor(i, activeIndex) + 'px), -50%)';
        el.style.opacity   = String(opacityFor(i, activeIndex));
      }
    });

    // ── Navigate ─────────────────────────────────────────
    function goTo(next) {
      if (next === current || animating) return;
      animating = true;
      current   = next;

      // Update dots and active slide
      dotEls.forEach(function (d, i) {
        d.classList.toggle('is-active', i === current);
      });
      slideEls.forEach(function (el, i) {
        el.classList.toggle('is-active', i === current);
      });

      // Crossfade right panel to new project
      setActiveProject(current);

      if (!window.gsap) {
        slideEls.forEach(function (el, i) {
          el.style.transform = 'translate(calc(-50% + ' + xFor(i, current) + 'px), -50%)';
          el.style.opacity   = String(opacityFor(i, current));
        });
        animating = false;
        return;
      }

      var tl = gsap.timeline({ onComplete: function () { animating = false; } });
      slideEls.forEach(function (el, i) {
        tl.to(el, {
          x:        xFor(i, current),
          scale:    scaleFor(i, current),
          opacity:  opacityFor(i, current),
          duration: 0.75,
          ease:     'expo.inOut'
        }, 0);
      });
    }

    // ── Keyboard: left/right when cursor is over the left panel ──
    var leftHovered = false;
    var leftPanel   = document.getElementById('cs-left');
    if (leftPanel) {
      leftPanel.addEventListener('mouseenter', function () { leftHovered = true;  });
      leftPanel.addEventListener('mouseleave', function () { leftHovered = false; });
    }
    _onSliderKeydown = function (e) {
      if (!leftHovered || TOTAL < 2) return;
      if (e.key === 'ArrowLeft')  { e.preventDefault(); if (!animating) goTo((current - 1 + TOTAL) % TOTAL); }
      if (e.key === 'ArrowRight') { e.preventDefault(); if (!animating) goTo((current + 1) % TOTAL); }
    };
    document.addEventListener('keydown', _onSliderKeydown);

    // ── Wheel on left panel → carousel nav (debounced by time) ──
    _leftPanelEl = leftPanel;
    var _lastWheelNav = 0;
    _onWheelLeft = function (e) {
      if (animating || TOTAL < 2) return;
      var now = Date.now();
      if (now - _lastWheelNav < 600) return;
      if (Math.abs(e.deltaY) < 20) return;
      _lastWheelNav = now;
      goTo(e.deltaY > 0 ? (current + 1) % TOTAL : (current - 1 + TOTAL) % TOTAL);
    };
    if (_leftPanelEl) _leftPanelEl.addEventListener('wheel', _onWheelLeft, { passive: true });

    // ── Swipe (touch) ────────────────────────────────────
    var touchStartX = null;
    _onSliderTouchStart = function (e) {
      touchStartX = e.touches[0].clientX;
    };
    _onSliderTouchEnd = function (e) {
      if (touchStartX === null) return;
      var dx = e.changedTouches[0].clientX - touchStartX;
      touchStartX = null;
      if (Math.abs(dx) < 40) return;
      if (!animating) goTo(dx < 0 ? (current + 1) % TOTAL : (current - 1 + TOTAL) % TOTAL);
    };
    sliderEl.addEventListener('touchstart', _onSliderTouchStart, { passive: true });
    sliderEl.addEventListener('touchend',   _onSliderTouchEnd,   { passive: true });

    // ── Reflow on resize ─────────────────────────────────
    _onWindowResize = function () {
      slideEls.forEach(function (el, i) {
        if (window.gsap) {
          gsap.set(el, { x: xFor(i, current), scale: scaleFor(i, current), opacity: opacityFor(i, current) });
        } else {
          el.style.transform = 'translate(calc(-50% + ' + xFor(i, current) + 'px), -50%)';
        }
      });
    };
    window.addEventListener('resize', _onWindowResize);

  } // end buildSlider

  // ── buildDetail ───────────────────────────────────────────────────────────
  function buildDetail(p_data, detail, exitFn) {
    if (!detail) return;

    // ── Helpers ─────────────────────────────────────────
    function mkEl(tag, cls, text) {
      var e = document.createElement(tag);
      if (cls)  e.className = cls;
      if (text !== undefined && text !== null) e.textContent = text;
      return e;
    }
    function div(cls)        { return mkEl('div',  cls); }
    function span(cls, text) { return mkEl('span', cls, text); }
    function p(cls, text)    { return mkEl('p',    cls, text); }

    // ── 1. Tag row: pill + period ────────────────────────
    var tagRow = div('cs-tag-row cs-reveal');
    var cat = p_data.category || 'CASE STUDY';
    var per = p_data.period   || (p_data.meta && p_data.meta.year) || '';
    tagRow.appendChild(span('cs-tag-pill', cat));
    if (per) tagRow.appendChild(span('cs-tag-period', '( ' + per + ' )'));
    detail.appendChild(tagRow);

    // ── 2. Headline with char-split ──────────────────────
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

    // ── 3. Meta grid (Timeline / Role / Client / Year) ───
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

    // ── 4. Body paragraphs ───────────────────────────────
    var bodyParas = (p_data.body && p_data.body.length)
      ? p_data.body
      : [p_data.tldr && p_data.tldr.intro ? p_data.tldr.intro : ''];

    if (bodyParas.length) {
      var bodyBlock = div('cs-body-block cs-reveal');
      bodyParas.forEach(function (text) {
        if (!text) return;
        bodyBlock.appendChild(p('cs-body-para', text));
      });
      detail.appendChild(bodyBlock);
    }

    // ── 5. Video showcase (if media.video exists) ────────
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

    // ── 6. Numbered image insets from media.grid ─────────
    var gridItems = (p_data.media && p_data.media.grid) ? p_data.media.grid : [];
    gridItems.forEach(function (item, i) {
      var src     = (typeof item === 'string') ? item : (item.src     || '');
      var caption = (typeof item === 'string') ? ''   : (item.caption || '');

      var inset = div('cs-img-inset cs-reveal');
      var inner = div('cs-img-inset-inner');

      // Color placeholder
      var iph = div('cs-img-inset-ph');
      iph.style.background = p_data.color || '#f0f0f0';
      iph.appendChild(span('cs-img-inset-ph-label', caption || 'IMAGE'));
      inner.appendChild(iph);

      // Image
      if (src) {
        var img = document.createElement('img');
        img.src = src; img.alt = caption;
        img.onerror = function () { this.style.display = 'none'; };
        inner.appendChild(img);
      }

      inset.appendChild(inner);
      inset.appendChild(span('cs-img-inset-num', String(i + 1).padStart(2, '0')));
      detail.appendChild(inset);
    });

    // ── 7. TL;DR block ───────────────────────────────────
    if (p_data.tldr && (p_data.tldr.title || (p_data.tldr.bullets && p_data.tldr.bullets.length))) {
      var tldrBlock = div('cs-tldr-block cs-reveal');
      tldrBlock.appendChild(span('cs-tldr-eyebrow', 'TL;DR'));
      if (p_data.tldr.title)
        tldrBlock.appendChild(p('cs-tldr-title', p_data.tldr.title));
      if (p_data.tldr.intro)
        tldrBlock.appendChild(p('cs-tldr-intro', p_data.tldr.intro));
      if (p_data.tldr.bullets && p_data.tldr.bullets.length) {
        var bulletList = div('cs-tldr-bullets');
        p_data.tldr.bullets.forEach(function (b) {
          bulletList.appendChild(p('cs-tldr-bullet', b));
        });
        tldrBlock.appendChild(bulletList);
      }
      detail.appendChild(tldrBlock);
    }

    // ── 8. Reflections ───────────────────────────────────
    if (p_data.reflections && p_data.reflections.items && p_data.reflections.items.length) {
      var reflBlock = div('cs-reflections-block cs-reveal');
      reflBlock.appendChild(span('cs-reflections-eyebrow', 'Reflections'));
      if (p_data.reflections.title)
        reflBlock.appendChild(p('cs-reflections-title', p_data.reflections.title));
      var reflItems = div('cs-refl-items');
      p_data.reflections.items.forEach(function (r) {
        var item = div('cs-refl-item');
        item.appendChild(p('cs-refl-heading', r.heading));
        item.appendChild(p('cs-refl-body',    r.body));
        reflItems.appendChild(item);
      });
      reflBlock.appendChild(reflItems);
      detail.appendChild(reflBlock);
    }

    // ── 9. What's Next ───────────────────────────────────
    var pIdx  = PROJECTS.indexOf(p_data);
    var nextIdx = (pIdx + 1) % PROJECTS.length;
    var nextP = PROJECTS[nextIdx];

    var nextBlock = div('cs-next-block cs-reveal');
    nextBlock.appendChild(span('cs-next-eyebrow', "What's Next"));

    var nextLink = document.createElement('a');
    nextLink.className = 'cs-next-link';
    nextLink.href = 'case-study.html?p=' + slugOf(nextP, nextIdx);
    nextLink.addEventListener('click', function (e) {
      e.preventDefault();
      exitFn('case-study.html?p=' + slugOf(nextP, nextIdx));
    });

    var thumb = div('cs-next-thumb');
    var thumbPh = div('cs-next-thumb-ph');
    thumbPh.style.background = nextP.color;
    thumb.appendChild(thumbPh);
    nextLink.appendChild(thumb);
    nextLink.appendChild(span('cs-next-name', nextP.subtitle));

    var arrowSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    arrowSvg.setAttribute('class',   'cs-next-arrow');
    arrowSvg.setAttribute('width',   '80');
    arrowSvg.setAttribute('height',  '16');
    arrowSvg.setAttribute('viewBox', '0 0 80 16');
    arrowSvg.setAttribute('fill',    'none');
    var arrowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    arrowPath.setAttribute('d',               'M0 8H77M77 8L70 2M77 8L70 14');
    arrowPath.setAttribute('stroke',          '#000');
    arrowPath.setAttribute('stroke-width',    '1.2');
    arrowPath.setAttribute('stroke-linecap',  'round');
    arrowPath.setAttribute('stroke-linejoin', 'round');
    arrowSvg.appendChild(arrowPath);
    nextLink.appendChild(arrowSvg);

    nextBlock.appendChild(nextLink);
    detail.appendChild(nextBlock);

  } // end buildDetail

  // ── rewireReveals ─────────────────────────────────────────────────────────
  // Tears down and re-registers the reveal observer + cs-entered listeners.
  // Called on initial load (via initScrollAndReveals) and on each project swap.
  function rewireReveals(sw) {
    if (_onCsEnteredHeadline) { document.removeEventListener('cs-entered', _onCsEnteredHeadline); _onCsEnteredHeadline = null; }
    if (_onCsEnteredTagRow)   { document.removeEventListener('cs-entered', _onCsEnteredTagRow);   _onCsEnteredTagRow   = null; }
    if (_observer)            { _observer.disconnect(); _observer = null; }

    _onCsEnteredHeadline = function () {
      if (!window.gsap) return;
      var chars = document.querySelectorAll('.cs-headline .cs-char');
      if (!chars.length) return;
      gsap.to(chars, { opacity: 1, yPercent: 0, duration: 0.7, ease: 'power3.out', stagger: { each: 0.018, from: 'start' } });
    };
    document.addEventListener('cs-entered', _onCsEnteredHeadline);

    if (!window.gsap) {
      document.querySelectorAll('.cs-reveal').forEach(function (el) { el.style.opacity = '1'; el.style.transform = 'none'; });
      _onCsEnteredTagRow = function () {};
      document.addEventListener('cs-entered', _onCsEnteredTagRow);
      return;
    }

    var revealEls = Array.from(document.querySelectorAll('.cs-reveal:not(.cs-headline):not(.cs-tag-row)'));
    _observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        gsap.to(entry.target, { opacity: 1, y: 0, duration: 0.7, ease: 'expo.out', delay: 0.04 });
        _observer.unobserve(entry.target);
      });
    }, { root: sw, threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { _observer.observe(el); });

    _onCsEnteredTagRow = function () {
      if (!window.gsap) return;
      var tagRow = document.querySelector('.cs-tag-row');
      if (tagRow) gsap.to(tagRow, { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out' });
    };
    document.addEventListener('cs-entered', _onCsEnteredTagRow);
  }

  // ── setActiveProject ──────────────────────────────────────────────────────
  // Crossfades right panel to the project at `index`. Does NOT move the carousel.
  function setActiveProject(index) {
    if (typeof PROJECTS === 'undefined' || !PROJECTS || index < 0 || index >= PROJECTS.length) return;
    var project = PROJECTS[index];
    if (!_detailEl) return;

    var doSwap = function () {
      var sourceLink = document.getElementById('cs-source');
      if (sourceLink) {
        if (project.sourceUrl && project.sourceUrl.trim()) {
          sourceLink.href = project.sourceUrl;
          sourceLink.removeAttribute('hidden');
        } else {
          sourceLink.href = '';
          sourceLink.setAttribute('hidden', '');
        }
      }

      document.title = (project.subtitle || project.title || 'Case Study') + ' — Ilham';
      history.replaceState({ csOverlay: slugOf(project, index) }, '', '?p=' + slugOf(project, index));

      if (window.gsap) { gsap.killTweensOf(_detailEl.querySelectorAll('.cs-reveal')); gsap.killTweensOf(_detailEl.querySelectorAll('.cs-char')); }
      _detailEl.innerHTML = '';
      buildDetail(project, _detailEl, _exitFn);

      if (_lenis) {
        _lenis.scrollTo(0, { immediate: true });
      } else if (_scrollWrapper) {
        _scrollWrapper.scrollTop = 0;
      }

      rewireReveals(_scrollWrapper);

      if (window.gsap) {
        gsap.to(_detailEl, { opacity: 1, duration: 0.25, ease: 'power1.out',
          onComplete: function () { document.dispatchEvent(new Event('cs-entered')); }
        });
      } else {
        _detailEl.style.opacity = '1';
        document.dispatchEvent(new Event('cs-entered'));
      }
    };

    if (window.gsap) {
      gsap.to(_detailEl, { opacity: 0, duration: 0.25, ease: 'power1.out', onComplete: doSwap });
    } else {
      doSwap();
    }
  }

  // ── initScrollAndReveals ─────────────────────────────────────────────────
  function initScrollAndReveals(scrollWrapper, contentEl) {

    // ── 1. Lenis smooth scroll ────────────────────────────
    // Lenis v2 requires the wrapper to have overflow:hidden so it exclusively
    // owns scrollTop. With overflow-y:auto Lenis intercepts wheel events but
    // never scrolls (v2 conflict). We set it here and restore in teardown.
    if (window.Lenis) {
      scrollWrapper.style.overflowY = 'hidden';
      _lenis = new Lenis({
        wrapper:     scrollWrapper,
        content:     contentEl,
        duration:    1.1,
        easing:      function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
        smoothWheel: true,
        syncTouch:   false
      });
      function lenisRaf(time) {
        if (!_lenis) return;
        _lenis.raf(time);
        _lenisRafId = requestAnimationFrame(lenisRaf);
      }
      _lenisRafId = requestAnimationFrame(lenisRaf);
    }

    // ── 2–4. Reveal observer + entrance events ────────────
    rewireReveals(scrollWrapper);

  } // end initScrollAndReveals

  // ── relayout ──────────────────────────────────────────────────────────────
  function relayout() {
    if (_onWindowResize) _onWindowResize();
    if (_lenis) _lenis.resize();
  }

  // ── Public API ────────────────────────────────────────────────────────────
  global.CaseStudy = {
    resolveProject: resolveProject,
    render:         render,
    teardown:       teardown,
    relayout:       relayout
  };

})(window);
