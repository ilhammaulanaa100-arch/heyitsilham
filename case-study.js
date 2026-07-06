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

    // ── Arrow nav + counter (bottom centre) ──────────────
    function pad(n) { return String(n).padStart(2, '0'); }

    function mkArrow(label, isPrev) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cs-slider-arrow ' + (isPrev ? 'cs-arrow-prev' : 'cs-arrow-next');
      btn.setAttribute('aria-label', label);
      var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '32'); svg.setAttribute('height', '12');
      svg.setAttribute('viewBox', '0 0 32 12'); svg.setAttribute('fill', 'none');
      var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', isPrev ? 'M32 6H3M3 6L8.5 1.5M3 6L8.5 10.5' : 'M0 6H29M29 6L23.5 1.5M29 6L23.5 10.5');
      path.setAttribute('stroke', '#000');
      path.setAttribute('stroke-width', '1.2');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('stroke-linejoin', 'round');
      svg.appendChild(path);
      btn.appendChild(svg);
      return btn;
    }

    var counterEl = null;
    if (TOTAL > 1) {
      var navEl = document.createElement('div');
      navEl.className = 'cs-slider-nav';
      var prevBtn = mkArrow('Previous project', true);
      var nextBtn = mkArrow('Next project', false);
      counterEl = document.createElement('span');
      counterEl.className = 'cs-slider-counter';
      counterEl.textContent = pad(current + 1) + ' / ' + pad(TOTAL);
      prevBtn.addEventListener('click', function () { if (!animating) goTo((current - 1 + TOTAL) % TOTAL, -1); });
      nextBtn.addEventListener('click', function () { if (!animating) goTo((current + 1) % TOTAL, 1); });
      navEl.appendChild(prevBtn);
      navEl.appendChild(counterEl);
      navEl.appendChild(nextBtn);
      sliderEl.appendChild(navEl);
    }

    // ── Placement: one centred card, the rest parked hidden ──
    // Active slide sits at x:0 full-scale immediately so the FLIP glide can measure it.
    function parkX() { return sliderEl.offsetWidth * 0.45; }
    slideEls.forEach(function (el, i) {
      if (window.gsap) {
        gsap.set(el, i === activeIndex
          ? { x: 0,       scale: 1,    opacity: 1, transformOrigin: 'center center' }
          : { x: parkX(), scale: 0.94, opacity: 0, transformOrigin: 'center center' });
      } else {
        el.style.opacity = i === activeIndex ? '1' : '0';
      }
    });

    // ── Navigate: directional slide (out one way, in from the other) ──
    function goTo(next, dir) {
      if (next === current || animating) return;
      dir = dir || 1;
      animating = true;
      var outEl = slideEls[current];
      var inEl  = slideEls[next];
      current   = next;

      slideEls.forEach(function (el, i) { el.classList.toggle('is-active', i === current); });
      if (counterEl) counterEl.textContent = pad(current + 1) + ' / ' + pad(TOTAL);

      // Crossfade right panel to new project
      setActiveProject(current);

      if (!window.gsap) {
        outEl.style.opacity = '0';
        inEl.style.opacity  = '1';
        animating = false;
        return;
      }

      var X = parkX();
      gsap.set(inEl, { x: dir * X, scale: 0.94, opacity: 0 });
      var tl = gsap.timeline({ onComplete: function () { animating = false; } });
      tl.to(outEl, { x: -dir * X, scale: 0.94, opacity: 0, duration: 0.75, ease: 'expo.inOut' }, 0);
      tl.to(inEl,  { x: 0,        scale: 1,    opacity: 1, duration: 0.75, ease: 'expo.inOut' }, 0);
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
      if (e.key === 'ArrowLeft')  { e.preventDefault(); if (!animating) goTo((current - 1 + TOTAL) % TOTAL, -1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); if (!animating) goTo((current + 1) % TOTAL, 1); }
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
      if (e.deltaY > 0) goTo((current + 1) % TOTAL, 1);
      else              goTo((current - 1 + TOTAL) % TOTAL, -1);
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
      if (animating) return;
      if (dx < 0) goTo((current + 1) % TOTAL, 1);
      else        goTo((current - 1 + TOTAL) % TOTAL, -1);
    };
    sliderEl.addEventListener('touchstart', _onSliderTouchStart, { passive: true });
    sliderEl.addEventListener('touchend',   _onSliderTouchEnd,   { passive: true });

    // ── Reflow on resize ─────────────────────────────────
    // Opacity is intentionally omitted — it is owned by entrance/exit animations and
    // must not be clobbered by a mid-glide relayout rAF or a window resize.
    _onWindowResize = function () {
      if (!window.gsap) return;
      gsap.set(slideEls[current], { x: 0, scale: 1 });
    };
    window.addEventListener('resize', _onWindowResize);

  } // end buildSlider

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

    // ── 5. Editorial scatter gallery from media.grid (3–7 images) ─
    // Shape is decided by SLOT position, not the image (design option B).
    // Geometry measured from the 99¢ reference: pair → solo → pair rhythm,
    // shapes square/landscape/portrait. Whole gallery reveals as ONE
    // .cs-reveal block — per-figure reveal fights the negative-margin offsets.
    var SLOTS = ['s1 sq', 's2 sq', 's3 ls', 's4 pt', 's5 pt', 's6 sq', 's7 ls'];
    var gridItems = (p_data.media && p_data.media.grid) ? p_data.media.grid.slice(0, 7) : [];
    if (gridItems.length) {
      var gallery = div('cs-gallery cs-reveal');
      gridItems.forEach(function (item, i) {
        var src     = (typeof item === 'string') ? item : (item.src     || '');
        var caption = (typeof item === 'string') ? ''   : (item.caption || '');
        var fig = document.createElement('figure');
        fig.className = 'cs-g-fig ' + SLOTS[i];
        var frame = div('cs-g-frame');
        var ph = div('cs-g-ph');
        ph.style.background = p_data.color || '#f0f0f0';
        frame.appendChild(ph);
        if (src) {
          var img = document.createElement('img');
          img.className = 'cs-g-img';
          img.src = src;
          img.alt = caption;
          img.onerror = function () { this.style.display = 'none'; };
          frame.appendChild(img);
        }
        fig.appendChild(frame);
        var cap = div('cs-g-cap');
        cap.appendChild(span('cs-g-cap-num', String(i + 1).padStart(2, '0')));
        cap.appendChild(span('', caption));
        fig.appendChild(cap);
        gallery.appendChild(fig);
      });
      detail.appendChild(gallery);
    }

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
