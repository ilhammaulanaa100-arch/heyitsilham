(function (global) {
  'use strict';

  var _lenis               = null;
  var _lenisRafId          = null;
  var _observer            = null;
  var _sliderEl            = null;
  var _detailEl            = null;
  var _slideEls            = [];
  var _onCsEntered         = null;
  var _onCsEnteredLeft     = null;
  var _onCsExitLeft        = null;
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
    p.period    = p.period    || (p.meta && p.meta.year) || '';
    if (p.media && Array.isArray(p.media.gallery)) {
      p.media.gallery = p.media.gallery.map(function (section) {
        if (!section || !Array.isArray(section.items)) return section;
        section.items = section.items.map(function (item) {
          return (typeof item === 'string') ? { src: item } : item;
        });
        return section;
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
    if (_onCsEntered)          { document.removeEventListener('cs-entered', _onCsEntered);           _onCsEntered          = null; }
    if (_onCsEnteredLeft)      { document.removeEventListener('cs-entered', _onCsEnteredLeft);       _onCsEnteredLeft      = null; }
    if (_onCsExitLeft)         { document.removeEventListener('cs-exit',    _onCsExitLeft);          _onCsExitLeft         = null; }
    if (_onSliderKeydown)      { document.removeEventListener('keydown',    _onSliderKeydown);       _onSliderKeydown      = null; }
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
      if (_detailEl) { gsap.killTweensOf(_detailEl); }
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
      var per = pr.period   || (pr.meta && pr.meta.year) || '';
      var caption = per || pr.subtitle || '';
      return { src: src, caption: caption, color: pr.color, name: pr.subtitle || pr.title || '',
               shape: pr.shape || 'is-square' }; // same field that sizes the homepage card
    });

    var TOTAL     = slides.length;
    var current   = activeIndex;
    var animating = false;

    if (!sliderEl) return;

    // ── Build DOM ───────────────────────────────────────
    var slideEls = [];
    _slideEls    = slideEls; // expose for teardown

    slides.forEach(function (slide, i) {
      // shape class on the wrapper drives the centring margins, on the card its size
      var wrapper = document.createElement('div');
      wrapper.className = 'cs-slide ' + slide.shape + (i === activeIndex ? ' is-active' : '');
      wrapper.setAttribute('data-index', i);

      // Project name above card (Figma left-panel title)
      var titleEl = document.createElement('span');
      titleEl.className = 'cs-slide-title';
      titleEl.textContent = slide.name;
      wrapper.appendChild(titleEl);

      // Card
      var card = document.createElement('div');
      card.className = 'proj-card ' + slide.shape;

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
      // Solid arrow-right (Figma); the prev button rotates it 180° via CSS.
      btn.innerHTML =
        '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">' +
        '<path d="M10.6607 4.33926C10.3353 4.01382 10.3353 3.48618 10.6607 3.16074C10.9862 2.83531 11.5138 2.83531 11.8393 3.16074L18.0893 9.41074C18.4147 9.73618 18.4147 10.2638 18.0893 10.5893L11.8393 16.8393C11.5138 17.1647 10.9862 17.1647 10.6607 16.8393C10.3353 16.5138 10.3353 15.9862 10.6607 15.6607L15.4882 10.8333H2.5C2.03976 10.8333 1.66667 10.4602 1.66667 10C1.66667 9.53976 2.03976 9.16667 2.5 9.16667H15.4882L10.6607 4.33926Z" fill="currentColor"/>' +
        '</svg>';
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
      counterEl.textContent = pad(current + 1) + '/' + pad(TOTAL);
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
      if (counterEl) counterEl.textContent = pad(current + 1) + '/' + pad(TOTAL);

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

    // ── Whisper-fade the left-panel title + nav on entrance/exit ──
    // Consistent with the right panel. Slide-to-slide nav is a structural
    // crossfade that owns the title's opacity during goTo, so we whisper the
    // left panel ONLY on the initial entrance (once) and on exit — never per swap.
    if (typeof Motion !== 'undefined' && !Motion.reduced) {
      var leftEls = function () {
        var arr = [];
        var t = slideEls[current] && slideEls[current].querySelector('.cs-slide-title');
        if (t) arr.push(t);
        if (navEl) arr.push(navEl);
        return arr;
      };
      var activeTitle = slideEls[activeIndex] && slideEls[activeIndex].querySelector('.cs-slide-title');
      if (activeTitle) activeTitle.style.opacity = '0';
      if (navEl) navEl.style.opacity = '0';

      _onCsEnteredLeft = function () { Motion.reveal(leftEls()); };
      document.addEventListener('cs-entered', _onCsEnteredLeft, { once: true });

      // Exit: the left panel leads — fade out fast and first so it's gone
      // before the wipe/glide sweeps across, instead of lagging behind it.
      _onCsExitLeft = function () { Motion.hide(leftEls(), { duration: 280, stagger: 40 }); };
      document.addEventListener('cs-exit', _onCsExitLeft);
    }

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

    // ── 1. Headline (whisper fades per line via Motion.splitLines) ──
    var headlineEl = document.createElement('h1');
    headlineEl.className = 'cs-headline';
    headlineEl.setAttribute('data-reveal', '');
    headlineEl.setAttribute('data-reveal-lines', '');
    headlineEl.textContent = p_data.title || p_data.subtitle || '';
    detail.appendChild(headlineEl);

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

    // ── App link — "Link Apps →" (Figma), between meta row and divider ──
    var appLink = document.createElement('a');
    appLink.className = 'cs-applink';
    appLink.setAttribute('data-reveal', '');
    appLink.href = p_data.sourceUrl || '#';
    appLink.target = '_blank';
    appLink.rel = 'noopener noreferrer';
    appLink.appendChild(span('cs-applink-text', 'Link Apps'));
    appLink.insertAdjacentHTML('beforeend',
      '<svg class="cs-applink-arrow" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">' +
      '<path d="M10.6607 4.33926C10.3353 4.01382 10.3353 3.48618 10.6607 3.16074C10.9862 2.83531 11.5138 2.83531 11.8393 3.16074L18.0893 9.41074C18.4147 9.73618 18.4147 10.2638 18.0893 10.5893L11.8393 16.8393C11.5138 17.1647 10.9862 17.1647 10.6607 16.8393C10.3353 16.5138 10.3353 15.9862 10.6607 15.6607L15.4882 10.8333H2.5C2.03976 10.8333 1.66667 10.4602 1.66667 10C1.66667 9.53976 2.03976 9.16667 2.5 9.16667H15.4882L10.6607 4.33926Z" fill="currentColor"/>' +
      '</svg>');
    detail.appendChild(appLink);

    var divider = div('cs-meta-divider');
    divider.setAttribute('data-reveal', '');
    detail.appendChild(divider);

    // ── 3. Summary ──
    var summaryText = p_data.summary || '';
    if (summaryText) {
      var bodyBlock = div('cs-body-block');
      bodyBlock.setAttribute('data-reveal', '');
      summaryText.split(/\n\s*\n/).forEach(function (paragraph) {
        if (paragraph.trim()) bodyBlock.appendChild(p('cs-body-para', paragraph.trim()));
      });
      detail.appendChild(bodyBlock);
    }

    // ── 4. Video showcase (if media.video exists) ────────
    if (p_data.media && p_data.media.video) {
      var videoBlock = div('cs-video-block');
      videoBlock.setAttribute('data-reveal-scroll', '');
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

    // ── 5. Section-based gallery ─────────────────────────
    // content.js owns the composition. Adding/reordering a section there does
    // not require a JS or CSS change. Split items are left-to-right.
    var gallerySections = (p_data.media && Array.isArray(p_data.media.gallery))
      ? p_data.media.gallery
      : [];
    if (gallerySections.length) {
      var gallery = div('cs-gallery');
      gallery.setAttribute('data-reveal-scroll', '');
      gallerySections.forEach(function (section) {
        if (!section) return;
        var allowedLayouts = ['full', 'split-square-left', 'split-square-right'];
        var layout = allowedLayouts.indexOf(section.layout) > -1 ? section.layout : 'full';
        var items = Array.isArray(section.items) ? section.items : [];
        var requiredItems = layout === 'full' ? 1 : 2;
        items = items.slice(0, requiredItems);
        if (!items.length) return;

        var row = div('cs-gallery-section cs-gallery-section--' + layout);
        if (section.background) row.style.setProperty('--section-bg', section.background);
        if (section.gap) row.style.setProperty('--section-gap', section.gap);

        items.forEach(function (item) {
          item = (typeof item === 'string') ? { src: item } : (item || {});
          var caption = item.caption || '';
          var fig = document.createElement('figure');
          fig.className = 'cs-g-fig';

          var frame = div('cs-g-frame');
          var ph = div('cs-g-ph');
          ph.style.background = item.background || section.background || p_data.color || '#f0f0f0';
          frame.appendChild(ph);

          if (item.src) {
            var img = document.createElement('img');
            img.className = 'cs-g-img';
            img.src = item.src;
            img.alt = item.alt || caption;
            img.loading = 'lazy';
            img.decoding = 'async';
            if (item.fit === 'contain') img.classList.add('is-contain');
            img.onerror = function () { this.style.display = 'none'; };
            frame.appendChild(img);
          }

          fig.appendChild(frame);
          row.appendChild(fig);
        });
        gallery.appendChild(row);
      });
      detail.appendChild(gallery);
    }

  } // end buildDetail

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

      if (window.gsap) { gsap.killTweensOf(_detailEl); }
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
