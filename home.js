/* Homepage — section parallax, splash, and the card→case-study glide transition.
   Loads after content.js (PROJECTS) and case-study.js (CaseStudy). */
(function () {
  'use strict';

  function markHomeReady() {
    if (window.__portoHomeReady) return;
    window.__portoHomeReady = true;
    document.dispatchEvent(new CustomEvent('porto:home-ready'));
  }

  // ── Guard: abort if content.js failed / PROJECTS missing ──
  if (typeof PROJECTS === 'undefined' || !PROJECTS || !PROJECTS.length) {
    console.error('[porto] PROJECTS is undefined — content.js may have failed to load.');
    var splashEl = document.getElementById('splash');
    if (splashEl) splashEl.style.display = 'none';
    var portoEl = document.querySelector('.porto');
    if (portoEl) portoEl.style.opacity = '1';
    markHomeReady();
    return;
  }

  // ── Build sections from PROJECTS ────────────────────────
  (function () {
    function esc(str) {
      return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    var wrap = document.getElementById('sections-wrap');
    PROJECTS.forEach(function (proj, i) {
      var shape  = proj.shape || (i < 2 ? 'is-square' : 'is-landscape');
      var imgTag = (proj.media && proj.media.hero)
        ? '<img src="' + proj.media.hero + '" alt="' + esc(proj.subtitle.replace(/\n/g, ' ')) + '" onerror="this.style.display=\'none\'" />'
        : '';

      wrap.insertAdjacentHTML('beforeend',
        '<div class="page-section page-placeholder" data-slug="' + proj.slug + '">' +
          '<div class="section-inner"><section class="ph-layout">' +
            '<div class="ph-text">' +
              '<p class="ph-label">' + esc(proj.period) + '</p>' +
              '<div class="ph-title">' +
                proj.subtitle.split('\n').map(function (line) {
                  return '<span class="line-mask"><span class="line">' + esc(line) + '</span></span>';
                }).join('') +
              '</div>' +
            '</div>' +
            '<div class="ph-media">' +
              '<div class="proj-card ' + shape + '" style="background:' + proj.color + ';" tabindex="-1" role="link" aria-label="Open case study: ' + esc(proj.subtitle.replace(/\n/g, ' ')) + '">' +
                imgTag +
              '</div>' +
            '</div>' +
            '<div class="ph-spacer"></div>' +
          '</section></div>' +
        '</div>'
      );
    });
  })();

  // ── Full-screen menu ────────────────────────────────────
  (function () {
    var trigger = document.getElementById('menu-trigger');
    var menu = document.getElementById('site-menu');
    var panel = document.getElementById('site-menu-panel');
    var worksButton = menu && menu.querySelector('[data-menu-action="works"]');
    var aboutLink = menu && menu.querySelector('a[href*="about.html"]');
    var previousFocus = null;
    var closeTimer = null;
    var leavingForAbout = false;
    var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!trigger || !menu || !panel) return;

    function focusableItems() {
      return [trigger].concat(Array.prototype.slice.call(
        panel.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')
      ));
    }

    function untransformedTriggerRect() {
      var rect = trigger.getBoundingClientRect();
      var transform = window.getComputedStyle(trigger).transform;
      var translateX = 0;
      var translateY = 0;

      if (transform && transform !== 'none') {
        var matrix = transform.match(/^matrix\((.+)\)$/);
        var matrix3d = transform.match(/^matrix3d\((.+)\)$/);
        if (matrix) {
          var values = matrix[1].split(',').map(parseFloat);
          translateX = values[4] || 0;
          translateY = values[5] || 0;
        } else if (matrix3d) {
          var values3d = matrix3d[1].split(',').map(parseFloat);
          translateX = values3d[12] || 0;
          translateY = values3d[13] || 0;
        }
      }

      return {
        top: rect.top - translateY,
        right: rect.right - translateX,
        width: rect.width,
        height: rect.height
      };
    }

    function updateMorphGeometry() {
      var triggerRect = untransformedTriggerRect();
      var targetLeft = panel.offsetLeft;
      var targetTop = panel.offsetTop;
      var targetWidth = panel.offsetWidth;
      var targetHeight = panel.offsetHeight;
      var targetRight = targetLeft + targetWidth;

      panel.style.setProperty('--menu-morph-x', (triggerRect.right - targetRight) + 'px');
      panel.style.setProperty('--menu-morph-y', (triggerRect.top - targetTop) + 'px');
      panel.style.setProperty('--menu-clip-left', Math.max(0, targetWidth - triggerRect.width) + 'px');
      panel.style.setProperty('--menu-clip-bottom', Math.max(0, targetHeight - triggerRect.height) + 'px');
      panel.style.setProperty('--menu-trigger-width', triggerRect.width + 'px');
      panel.style.setProperty('--menu-trigger-height', triggerRect.height + 'px');
    }

    function openMenu() {
      if (menu.classList.contains('is-open') || menu.classList.contains('is-closing')) return;
      if (closeTimer !== null) {
        window.clearTimeout(closeTimer);
        closeTimer = null;
      }
      previousFocus = document.activeElement;
      updateMorphGeometry();
      menu.classList.add('is-preparing');
      menu.setAttribute('aria-hidden', 'false');
      trigger.setAttribute('aria-expanded', 'true');
      trigger.setAttribute('aria-label', 'Close menu');
      document.body.classList.add('menu-open');
      void menu.offsetWidth;
      window.requestAnimationFrame(function () {
        menu.classList.add('is-open');
        menu.classList.remove('is-preparing');
      });
    }

    function closeMenu(restoreFocus) {
      if (!menu.classList.contains('is-open') && !menu.classList.contains('is-preparing')) return;
      updateMorphGeometry();
      menu.classList.add('is-closing');
      menu.classList.remove('is-open', 'is-preparing');
      trigger.setAttribute('aria-expanded', 'false');
      trigger.setAttribute('aria-label', 'Open menu');
      menu.setAttribute('aria-hidden', 'true');
      if (restoreFocus !== false) {
        var focusTarget = previousFocus && previousFocus !== document.body ? previousFocus : trigger;
        if (focusTarget && focusTarget.focus) focusTarget.focus({ preventScroll: true });
      }
      closeTimer = window.setTimeout(function () {
        menu.classList.remove('is-closing');
        document.body.classList.remove('menu-open');
        closeTimer = null;
      }, reducedMotion ? 0 : 840);
    }

    function resetAboutHandoff() {
      if (!leavingForAbout && !menu.classList.contains('is-navigating-about')) return false;
      leavingForAbout = false;
      menu.classList.add('is-resetting');
      menu.classList.remove('is-selecting-about', 'is-navigating-about', 'is-open', 'is-preparing', 'is-closing');
      document.body.classList.remove('page-leaving-about', 'menu-open');
      trigger.setAttribute('aria-expanded', 'false');
      trigger.setAttribute('aria-label', 'Open menu');
      menu.setAttribute('aria-hidden', 'true');
      if (aboutLink) {
        aboutLink.classList.remove('is-route-target');
        aboutLink.removeAttribute('aria-current');
      }
      void menu.offsetWidth;
      window.requestAnimationFrame(function () { menu.classList.remove('is-resetting'); });
      return true;
    }

    function navigateToAbout(e) {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      if (leavingForAbout) return;

      var href = aboutLink.getAttribute('href') || 'about.html';
      if (reducedMotion) {
        window.location.href = href;
        return;
      }

      leavingForAbout = true;
      // The current fold is already visible behind the menu. Persist that
      // readiness into bfcache so About → Works can reveal it immediately.
      markHomeReady();
      aboutLink.classList.add('is-route-target');
      aboutLink.setAttribute('aria-current', 'page');
      menu.classList.add('is-selecting-about');
      menu.setAttribute('aria-hidden', 'true');

      try { sessionStorage.setItem('porto-about-curtain', '1'); } catch (storageError) {}

      // Let the selected route register, then dissolve the menu as one soft
      // rack-focus frame instead of expanding its panel to the viewport.
      window.setTimeout(function () {
        if (!leavingForAbout) return;
        menu.classList.add('is-navigating-about');
        document.body.classList.add('page-leaving-about');
      }, 80);

      // Navigate when the dissolve reaches solid #020202; the destination
      // starts on the identical frame and resolves its content underneath.
      window.setTimeout(function () {
        window.location.href = href;
      }, 720);
    }

    trigger.addEventListener('click', function () {
      if (leavingForAbout) return;
      if (menu.classList.contains('is-open') || menu.classList.contains('is-preparing')) {
        closeMenu(true);
      } else {
        openMenu();
      }
    });
    if (worksButton) worksButton.addEventListener('click', function () { closeMenu(true); });
    if (aboutLink) aboutLink.addEventListener('click', navigateToAbout);

    menu.addEventListener('click', function (e) {
      if (e.target === menu) closeMenu(true);
    });
    menu.addEventListener('wheel', function (e) {
      e.preventDefault();
      e.stopPropagation();
    }, { passive: false });
    menu.addEventListener('touchmove', function (e) {
      e.preventDefault();
      e.stopPropagation();
    }, { passive: false });

    document.addEventListener('keydown', function (e) {
      if (!menu.classList.contains('is-open')) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        closeMenu(true);
        return;
      }
      if (e.key !== 'Tab') return;

      var items = focusableItems();
      if (!items.length) {
        e.preventDefault();
        panel.focus();
        return;
      }
      var first = items[0];
      var last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });

    window.addEventListener('pageshow', function () {
      if (!resetAboutHandoff()) closeMenu(false);
    });
    window.addEventListener('resize', function () {
      if (menu.classList.contains('is-open')) updateMorphGeometry();
    }, { passive: true });
  })();

  // ── Character split for hero label + title ──────────────
  (function splitChars() {
    document.querySelectorAll('.ph-label, .ph-title .line').forEach(function (el) {
      var text = el.textContent;
      el.textContent = '';
      text.split(/(\s+)/).forEach(function (token) {
        if (token === '') return;
        if (/^\s+$/.test(token)) { el.appendChild(document.createTextNode(' ')); return; }
        var word = document.createElement('span');
        word.className = 'word';
        token.split('').forEach(function (ch) {
          var s = document.createElement('span');
          s.className = 'char';
          s.textContent = ch;
          word.appendChild(s);
        });
        el.appendChild(word);
      });
    });
  })();

  // ── Splash counter & progress bar ───────────────────────
  var splashProgressState = window.__portoSplashProgress || null;
  var splashCounterDone = !!(splashProgressState && splashProgressState.done);
  var doExitSplash      = null;
  if (splashProgressState) {
    splashProgressState.onDone = function () {
      splashCounterDone = true;
      if (doExitSplash) doExitSplash();
    };
  }

  // Arriving via the about-page footer glide — the expanded box already covers
  // the screen, so skip the splash and let the intro reveal run immediately.
  var skipSplash = false;
  try {
    skipSplash = sessionStorage.getItem('porto-skip-splash') === '1';
    if (skipSplash) {
      // Prerendered copy (speculation rules on about.html): consume the flag
      // only when actually shown, else a discarded prerender would eat it and
      // the real navigation would splash-blink again.
      if (document.prerendering) {
        document.addEventListener('prerenderingchange', function () {
          try { sessionStorage.removeItem('porto-skip-splash'); } catch (e) {}
        });
      } else {
        sessionStorage.removeItem('porto-skip-splash');
      }
    }
  } catch (e) {}
  if (skipSplash) {
    if (splashProgressState) splashProgressState.cancel();
    var splashSkipEl = document.getElementById('splash');
    if (splashSkipEl) splashSkipEl.style.display = 'none';
    splashCounterDone = true;
  }

  // ── Section navigator ───────────────────────────────────
  var NAV_TOTAL = PROJECTS.length;
  var navInner  = document.getElementById('nav-inner');
  var navRows   = navInner.querySelectorAll('.nav-row');

  function fillRow(row, idx) {
    row.querySelector('.nav-num').textContent = String(idx + 1).padStart(2, '0');
  }
  function updateNav(cur) {
    fillRow(navRows[0], (cur - 2 + 2 * NAV_TOTAL) % NAV_TOTAL);
    fillRow(navRows[1], (cur - 1 + NAV_TOTAL) % NAV_TOTAL);
    fillRow(navRows[2], cur);
    fillRow(navRows[3], (cur + 1) % NAV_TOTAL);
    fillRow(navRows[4], (cur + 2) % NAV_TOTAL);
  }
  updateNav(0);
  navInner.setAttribute('data-total', String(NAV_TOTAL).padStart(2, '0')); // mobile counter "01 / 06"

  // ── No-GSAP fallback ────────────────────────────────────
  function noGsapFallback() {
    var splashEl = document.getElementById('splash');
    if (splashEl) splashEl.style.display = 'none';
    document.body.style.overflow = 'hidden';
    var porto = document.querySelector('.porto');
    if (porto) porto.style.opacity = '1';
    document.querySelectorAll('.page-section').forEach(function (s, i) {
      s.style.position = '';
      s.style.height = '';
      s.style.transform = 'none';
      s.style.visibility = i === 0 ? 'visible' : 'hidden';
      s.classList.toggle('is-active', i === 0);
      var card = s.querySelector('.proj-card');
      if (card) card.setAttribute('tabindex', i === 0 ? '0' : '-1');
    });
    document.querySelectorAll('.section-inner').forEach(function (s) {
      s.style.transform = ''; s.style.top = '';
    });
    document.querySelectorAll(
      '.proj-card,.page-placeholder .line,.ph-label'
    ).forEach(function (el) { el.style.opacity = '1'; el.style.transform = 'none'; });
    document.documentElement.classList.remove('skip-splash');
    markHomeReady();
  }

  // ── Safety timeout: force-exit splash after 6 s ─────────
  setTimeout(function () {
    var splashEl = document.getElementById('splash');
    if (!splashEl) return;
    if (splashEl.style.display === 'none') return;
    if (splashEl.getBoundingClientRect().bottom <= 0) return;
    console.warn('[porto] Splash safety timeout fired — forcing exit.');
    if (typeof doExitSplash === 'function') doExitSplash();
    else noGsapFallback();
  }, 6000);

  // ══════════════════════════════════════════════════════════
  //  Case-study overlay — open/close with trio FLIP glide
  // ══════════════════════════════════════════════════════════
  var isOverlayOpen    = false;
  var _currentSlug     = null;
  var convObserver     = null;
  var _entranceTl      = null;
  var _entranceClones  = [];  // all FLIP clones in flight (active + peers)
  var _hiddenHomeCards = [];  // homepage cards hidden during entrance glide
  var _sourceCard         = null;
  var _sourceProjectIndex = -1;
  var _gridReturn      = null;  // { rect } — set when the overlay was opened from the grid view
  var _hiddenCellMedia = -1;    // project index whose grid-cell media is blanked during a glide
  var _exitTl          = null;
  var _prevFocus       = null;
  var _trapHandler     = null;
  var _replayHeroReveal = null; // assigned inside load handler once revealText/sectionText/current are live
  var _hideHeroForClose = null;

  var GLIDE_DURATION = 0.75;
  // Card gets its own snappier curve than the panel/fade — expo.inOut reads as
  // one deliberate motion instead of everything easing at the same soft rate.
  var CARD_EASE      = 'expo.inOut';
  var PANEL_DELAY    = 0.1; // let the card commit before the panel/backdrop follow

  // Clones a .proj-card at a fixed position so it can glide between layouts.
  // cloneNode keeps the inline gradient background and any <img>, so projects
  // without a hero image glide exactly like the ones with one.
  // Clones live inside #cs-shell UNDER the white right panel (z-index 3 in CSS),
  // so mid-flight cards get progressively clipped by the sweeping panel edge —
  // same as the reference transition.
  function makeCardClone(cardEl, rect, zIndex) {
    var clone = cardEl.cloneNode(true);
    clone.classList.remove('is-tilting');
    clone.classList.add('glide-clone'); // keep .proj-card etc — child selectors position the inner img/placeholder
    var s = clone.style; // positioning only — the inline background survives
    s.position = 'fixed';
    s.left = rect.left + 'px';
    s.top  = rect.top + 'px';
    s.width  = rect.width + 'px';
    s.height = rect.height + 'px';
    s.transform = 'none';
    s.zIndex = zIndex;
    var img = clone.querySelector('img');
    if (img) img.style.transform = 'none'; // strip any hover-tilt state
    var shell = document.getElementById('cs-shell');
    (shell || document.body).appendChild(clone);
    return clone;
  }

  function removeEl(el) {
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  // Kill any in-flight entrance/exit animation and restore hidden cards.
  function killGlides() {
    if (_entranceTl) { _entranceTl.kill(); _entranceTl = null; }
    if (_exitTl)     { _exitTl.kill();     _exitTl     = null; }
    _entranceClones.forEach(removeEl);
    _entranceClones = [];
    _hiddenHomeCards.forEach(function (c) { if (window.gsap) gsap.set(c, { opacity: 1 }); });
    _hiddenHomeCards = [];
    if (_hiddenCellMedia >= 0 && window.GridView && GridView.setCellMediaHidden) {
      GridView.setCellMediaHidden(_hiddenCellMedia, false);
    }
    _hiddenCellMedia = -1;
  }

  function trapOverlayFocus() {
    var overlay = document.getElementById('cs-overlay');
    if (!overlay) return;
    // Idempotent: a What's-Next navigation re-opens the overlay without closing it.
    // Drop any existing trap before installing a new one, and pin _prevFocus to the
    // ORIGINAL opener so focus restores correctly on the final close.
    if (_trapHandler) { document.removeEventListener('keydown', _trapHandler, true); _trapHandler = null; }
    if (!_prevFocus) _prevFocus = document.activeElement;
    var porto = document.querySelector('.porto');
    if (porto) porto.setAttribute('aria-hidden', 'true');
    var closeBtn = document.getElementById('cs-right-close');
    if (closeBtn) { try { closeBtn.focus({ preventScroll: true }); } catch (e) { closeBtn.focus(); } }
    _trapHandler = function (e) {
      if (e.key === 'Escape') { e.preventDefault(); closeOverlay(); return; }
      if (e.key !== 'Tab') return;
      var nodes = overlay.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
      var list = Array.prototype.filter.call(nodes, function (el) { return el.offsetParent !== null; });
      if (!list.length) return;
      var first = list[0], last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', _trapHandler, true);
  }

  function releaseOverlayFocus() {
    if (_trapHandler) { document.removeEventListener('keydown', _trapHandler, true); _trapHandler = null; }
    var porto = document.querySelector('.porto');
    if (porto) porto.removeAttribute('aria-hidden');
    if (_prevFocus && typeof _prevFocus.focus === 'function') {
      try { _prevFocus.focus({ preventScroll: true }); } catch (e) { _prevFocus.focus(); }
    }
    _prevFocus = null;
  }

  function navigateFromOverlay(href) {
    var match = href && href.match(/[?&]p=([^&]+)/);
    var slug = match && decodeURIComponent(match[1]);
    var nextProject = slug && window.CaseStudy && CaseStudy.resolveProject(slug);
    if (nextProject) {
      showOverlay(nextProject);
      history.pushState({ csOverlay: nextProject.slug }, '', 'case-study.html?p=' + nextProject.slug);
    } else {
      window.location.href = href;
    }
  }

  // Opens the case-study overlay. fromCard (optional) drives the FLIP glide:
  // { card, rect, peers: [{ card, rect, slot }] } — all captured pre-click.
  function showOverlay(rawProject, fromCard) {
    var project = CaseStudy.resolveProject(rawProject.slug);
    if (!project) throw new Error('resolveProject returned null');

    killGlides();

    CaseStudy.teardown();
    isOverlayOpen = true;
    document.body.classList.add('cs-open');
    if (convObserver) convObserver.disable();

    var sourceLink = document.getElementById('cs-source');
    if (sourceLink) {
      if (project.sourceUrl && project.sourceUrl.trim() !== '') {
        sourceLink.href = project.sourceUrl;
        sourceLink.removeAttribute('hidden');
      } else {
        sourceLink.setAttribute('hidden', '');
      }
    }

    CaseStudy.render(project, {
      sliderEl:      document.getElementById('cs-slider'),
      detailEl:      document.getElementById('cs-detail'),
      scrollWrapper: document.getElementById('cs-right'),
      contentEl:     document.getElementById('cs-right-content'),
      exitFn:        navigateFromOverlay
    });

    var overlay = document.getElementById('cs-overlay');
    var shell   = document.getElementById('cs-shell');
    var csRight = document.getElementById('cs-right');
    overlay.classList.add('is-open');
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        if (window.CaseStudy && CaseStudy.relayout) CaseStudy.relayout();
      });
    });
    trapOverlayFocus();
    overlay.setAttribute('aria-hidden', 'false');
    if (shell)   shell.style.opacity = '1';
    if (csRight) csRight.scrollTop   = 0;
    _currentSlug = project.slug;

    var prefersReduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var isMobile       = window.matchMedia && matchMedia('(max-width: 900px)').matches;
    // Mobile: split layout collapses to stacked, so the glide + panel sweep don't apply.
    var useAnim = !!(fromCard && window.gsap && !prefersReduced && !isMobile);

    if (!useAnim) {
      _sourceCard = null; _sourceProjectIndex = -1; // no source card → close stays instant/crossfade, not a mismatched glide
      _gridReturn = null;
      if (window.GridView && GridView.isOpen()) GridView.hide(true); // grid can't sit behind the transparent left panel

      if (isMobile && window.gsap && !prefersReduced) {
        // Simple mobile crossfade (opacity only)
        gsap.set('#cs-right', { xPercent: 0 });
        gsap.set('.cs-slide.is-active .proj-card', { opacity: 1 });
        gsap.fromTo(shell, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out' });
        gsap.to('.porto', { opacity: 0, duration: 0.3, ease: 'power2.out' });
      } else if (window.gsap) {
        gsap.set('.porto', { opacity: 0 });
      } else {
        var pEl = document.querySelector('.porto'); if (pEl) pEl.style.opacity = '0';
      }

      document.dispatchEvent(new Event('cs-glide-start'));
      document.dispatchEvent(new Event('cs-entered'));
      return;
    }

    // ── Animated entrance: single-card FLIP glide ──────────
    // Same grammar from either view: the clicked card grows into the case-study
    // hero while the white panel sweeps in. Only the source rect differs.
    var D      = GLIDE_DURATION;
    var isGrid = !!fromCard.isGrid;

    gsap.set('#cs-right',  { xPercent: 100 });
    gsap.set('.cs-slide.is-active .proj-card', { opacity: 0 });
    gsap.set('#cs-right-close',  { opacity: 0 });

    var destEl   = document.querySelector('.cs-slide.is-active .proj-card');
    var destRect = destEl ? destEl.getBoundingClientRect() : null;

    // Grid passes no DOM card — clone the destination card at the source rect
    // instead (identical media: hero image / gradient placeholder).
    var srcEl = fromCard.card || destEl;
    var clone = null;
    if (srcEl) {
      clone = makeCardClone(srcEl, fromCard.rect, 2);
      clone.style.opacity = '1'; // destEl carries an inline opacity:0 — the clone must not
      // No spawn scale-pop: the clone must sit pixel-exact on the source rect at
      // frame one, or the media underneath (grid canvas / homepage card) peeks
      // out around it and reads as a ghost image.
      _entranceClones.push(clone);
    }
    if (fromCard.card) {
      gsap.set(fromCard.card, { opacity: 0 }); // only the clone is visible during the glide
      _hiddenHomeCards.push(fromCard.card);
    }
    _sourceCard         = fromCard.card || null;
    _gridReturn         = isGrid ? { rect: fromCard.rect, cell: fromCard.cell } : null;
    _sourceProjectIndex = PROJECTS.indexOf(project);

    // The clone now owns the media: blank it out of the grid-cell texture for
    // the whole glide, so the canvas never renders a second copy of the image
    // diverging behind the flying card.
    if (isGrid && window.GridView && GridView.setCellMediaHidden && _sourceProjectIndex >= 0) {
      _hiddenCellMedia = _sourceProjectIndex;
      GridView.setCellMediaHidden(_hiddenCellMedia, true);
    }

    _entranceTl = gsap.timeline({
      onComplete: function () {
        gsap.set('.cs-slide.is-active .proj-card', { opacity: 1 });
        gsap.set('#cs-right', { xPercent: 0 });
        // Safety sweep — per-clone onCompletes normally clear these already
        _entranceClones.forEach(removeEl);
        _entranceClones = [];
        // Restore homepage cards now that .porto is at opacity 0
        _hiddenHomeCards.forEach(function (c) { gsap.set(c, { opacity: 1 }); });
        _hiddenHomeCards = [];
        _entranceTl = null;
        if (isGrid && window.GridView) {
          GridView.hide(true); // fully faded — drop the canvas
          if (_hiddenCellMedia >= 0 && GridView.setCellMediaHidden) {
            GridView.setCellMediaHidden(_hiddenCellMedia, false);
            _hiddenCellMedia = -1;
          }
        }
      }
    });

    var CARD_D = D * 0.75; // card arrives slightly ahead of the panel/backdrop

    _entranceTl.add(function () { document.dispatchEvent(new Event('cs-glide-start')); }, 0);
    if (isGrid) {
      gsap.set('.porto', { opacity: 0 });
      // Real camera move: the grid dollies THROUGH the clicked cell while the
      // card glides — same expo.inOut, same duration, one gesture. grid.js owns
      // the tail cleanup fade.
      _entranceTl.add(function () {
        if (window.GridView && GridView.zoomInto && fromCard.cell) {
          GridView.zoomInto(fromCard.cell.col, fromCard.cell.row, D);
        }
      }, 0);
    } else {
      _entranceTl.to('.porto', { opacity: 0, duration: D * 0.7, ease: 'power2.out' }, PANEL_DELAY);
    }
    _entranceTl.to('#cs-right', { xPercent: 0, duration: D, ease: 'power2.out' }, PANEL_DELAY);

    if (clone && destRect) {
      _entranceTl.to(clone, {
        x: destRect.left - fromCard.rect.left,
        y: destRect.top  - fromCard.rect.top,
        width: destRect.width, height: destRect.height,
        duration: CARD_D, ease: CARD_EASE,
        onComplete: function () {
          gsap.set(destEl, { opacity: 1 });
          removeEl(clone);
        }
      }, 0);
    }

    _entranceTl.add(function () { document.dispatchEvent(new Event('cs-entered')); }, CARD_D * 0.9);
    _entranceTl.to('#cs-right-close', { opacity: 0.7, duration: 0.4, ease: 'power2.out' }, PANEL_DELAY + D * 0.7);
  }

  function closeOverlay() {
    hideOverlay();
    history.replaceState({ csOverlay: null }, '', location.pathname.replace(/case-study\.html.*$/, '') || 'index.html');
  }

  function hideOverlay() {
    releaseOverlayFocus();
    killGlides();
    document.dispatchEvent(new Event('cs-exit')); // whisper the left-panel title + nav out during the glide-back

    var D = GLIDE_DURATION;
    var prefersReduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var canAnimate     = !!(window.gsap && !prefersReduced && (_sourceCard || _gridReturn));

    // Mismatch guard: if the user navigated to a different project inside the
    // overlay, a glide back to the original card would be wrong — plain close.
    if (canAnimate) {
      var activeSlideEl   = document.querySelector('.cs-slide.is-active');
      var activeDataIndex = activeSlideEl ? parseInt(activeSlideEl.getAttribute('data-index'), 10) : -1;
      if (activeDataIndex !== _sourceProjectIndex) canAnimate = false;
    }

    if (!canAnimate) {
      var isMobile = window.matchMedia && matchMedia('(max-width: 900px)').matches;
      var overlay  = document.getElementById('cs-overlay');
      var shell    = document.getElementById('cs-shell');

      var finishClose = function () {
        if (window.gsap) {
          gsap.set('.porto', { opacity: 1 });
          gsap.set('.cs-slide.is-active .proj-card', { opacity: 1 });
          gsap.set('#cs-right', { xPercent: 0 });
          if (_sourceCard) gsap.set(_sourceCard, { opacity: 1 });
        } else {
          var pEl = document.querySelector('.porto'); if (pEl) pEl.style.opacity = '1';
        }
        CaseStudy.teardown();
        overlay.classList.remove('is-open');
        overlay.setAttribute('aria-hidden', 'true');
        if (shell) shell.style.opacity = '0';
        _sourceCard = null;
        _sourceProjectIndex = -1;
        _gridReturn = null;
        if (convObserver) convObserver.enable();
        isOverlayOpen = false;
        document.body.classList.remove('cs-open');
        _currentSlug  = null;
        if (window._resetCursorExplore) window._resetCursorExplore();
        if (!isMobile && _replayHeroReveal) _replayHeroReveal();
        document.dispatchEvent(new Event('cs-closed'));
      };

      if (isMobile && window.gsap && !prefersReduced) {
        // Simple mobile crossfade close (opacity only)
        gsap.to(shell, { opacity: 0, duration: 0.28, ease: 'power2.out' });
        gsap.fromTo('.porto', { opacity: 0 }, { opacity: 1, duration: 0.28, ease: 'power2.out', onComplete: finishClose });
      } else {
        finishClose();
      }
      return;
    }

    // ── Animated reverse close: the card glides back home ──
    // Vertical: back to the source homepage card. Grid: back to its cell on the
    // (flattened) grid canvas, which then relaxes back into the concave lens.
    var wasGrid = !!_gridReturn;
    var realCardEl = document.querySelector('.cs-slide.is-active .proj-card');
    var startRect  = realCardEl ? realCardEl.getBoundingClientRect() : null;

    if (wasGrid) {
      // Reveal the grid (resting curved lens) under the overlay so the card
      // can land on its cell — rect recomputed below through that lens.
      // .porto stays at opacity 0 for now: the grid fades in from 0 during
      // zoomOutFrom, and the homepage must not flash through it. Restored in
      // the exit timeline's onComplete once the grid is opaque again.
      // The landing cell's media is blanked for the whole return glide — the
      // flying clone is the only copy of the image until it lands.
      if (window.GridView && GridView.setCellMediaHidden && _sourceProjectIndex >= 0) {
        _hiddenCellMedia = _sourceProjectIndex;
        GridView.setCellMediaHidden(_hiddenCellMedia, true);
      }
      if (window.GridView) GridView.showInstant();
    } else if (_hideHeroForClose) {
      _hideHeroForClose();
    }

    var destRect = wasGrid
      ? (_gridReturn.cell && window.GridView
          ? GridView.cellScreenRect(_gridReturn.cell.col, _gridReturn.cell.row)
          : _gridReturn.rect)
      : _sourceCard.getBoundingClientRect();

    var clone = null;
    if (realCardEl && startRect) {
      clone = makeCardClone(realCardEl, startRect, 2);
      clone.style.opacity = '1';
      gsap.set(realCardEl, { opacity: 0 });  // only the clone is visible during the glide
      if (_sourceCard) gsap.set(_sourceCard, { opacity: 0 }); // hide the landing spot until the clone arrives
    }

    var capturedSourceCard = _sourceCard; // capture now; _sourceCard nulled in onComplete
    // Track the exit clone in _entranceClones too, so killGlides sweeps it if
    // the close is interrupted (popstate / re-open) — otherwise it stays frozen
    // mid-screen as a leftover image.
    if (clone) _entranceClones.push(clone);

    // Reverse camera move: start deep inside the cell, pull back to resting view.
    // destRect above was measured at the resting lens — the dolly and the card
    // share duration + ease, so both converge on it in the final frame.
    if (wasGrid && _gridReturn.cell && window.GridView && GridView.zoomOutFrom) {
      GridView.zoomOutFrom(_gridReturn.cell.col, _gridReturn.cell.row, D);
    }

    _exitTl = gsap.timeline({
      onComplete: function () {
        if (capturedSourceCard) gsap.set(capturedSourceCard, { opacity: 1 });
        gsap.set('.cs-slide.is-active .proj-card', { opacity: 1 });
        gsap.set('#cs-right', { xPercent: 0 });
        if (wasGrid) gsap.set('.porto', { opacity: 1 }); // grid is opaque again — restore silently under it
        // Land the card INTO its cell: restore the canvas media on the same
        // tick the clone is removed — rects match, so the swap is invisible.
        if (wasGrid && window.GridView && GridView.setCellMediaHidden && _hiddenCellMedia >= 0) {
          GridView.setCellMediaHidden(_hiddenCellMedia, false);
          _hiddenCellMedia = -1;
        }
        _entranceClones.forEach(removeEl);
        _entranceClones = [];
        CaseStudy.teardown();
        var overlay = document.getElementById('cs-overlay');
        var shell   = document.getElementById('cs-shell');
        overlay.classList.remove('is-open');
        overlay.setAttribute('aria-hidden', 'true');
        if (shell) shell.style.opacity = '0';
        if (convObserver) convObserver.enable();
        isOverlayOpen = false;
        document.body.classList.remove('cs-open');
        _currentSlug        = null;
        _sourceCard         = null;
        _sourceProjectIndex = -1;
        _gridReturn         = null;
        _exitTl             = null;
        if (window._resetCursorExplore) window._resetCursorExplore();
        document.dispatchEvent(new Event('cs-closed'));
      }
    });

    if (clone) {
      _exitTl.to(clone, {
        x: destRect.left - startRect.left,
        y: destRect.top  - startRect.top,
        width:  destRect.width,
        height: destRect.height,
        duration: D, ease: CARD_EASE
      }, 0);
    }

    _exitTl.to('#cs-right', { xPercent: 100, duration: D, ease: 'power2.out' }, 0);
    _exitTl.to('#cs-right-close', { opacity:  0,   duration: 0.2 }, 0);
    if (!wasGrid) {
      // Back-loaded: homepage fades in only as the panel nears the end of its
      // slide, so content isn't already fully rendered while the panel is
      // still visibly retracting.
      _exitTl.to('.porto', { opacity: 1, duration: D * 0.45, ease: 'power2.out' }, D * 0.55);
      // Fire hero headline reveal as the white panel nears the end of its retract (~72% through),
      // so the text animates in while the panel is still sliding rather than after a dead pause.
      _exitTl.add(function () { if (_replayHeroReveal) _replayHeroReveal(); }, D * 0.72);
    }
  }

  // ── Main ────────────────────────────────────────────────
  function initHome() {
    if (!window.gsap || !window.Observer) { noGsapFallback(); return; }
    gsap.registerPlugin(Observer);
    history.replaceState({ csOverlay: null }, '', location.href);

    var sections = Array.from(document.querySelectorAll('.page-section'));

    // ── Initial hidden states ──
    sections.forEach(function (sec, i) {
      var label = sec.querySelector('.ph-label');
      if (label) gsap.set(label, { opacity: 1 });
      // Seamless arrival from about: fold 0 is already painted — hiding its
      // chars here just to re-reveal them would be the blink we're avoiding.
      if (skipSplash && i === 0) return;
      gsap.set(sec.querySelectorAll('.ph-label .char, .ph-title .char'), { yPercent: 40, opacity: 0 });
    });

    // ── Scroll parallax system ──
    var TOTAL     = PROJECTS.length;
    var current   = 0;
    var animating = false;
    var VH = window.innerHeight;
    var VW = window.innerWidth;
    // Mobile flow: sections travel horizontally (carousel), desktop vertically
    var mobileFlowMQ = window.matchMedia('(max-width: 900px)');
    function isMobileFlow() { return mobileFlowMQ.matches; }
    // Scan grid: crosshair + focus frame tracking the active proj-card's live rect
    var scanEls = {
      focus: document.getElementById('scan-focus'),
      v1: document.querySelector('.scan-line-v1'),
      v2: document.querySelector('.scan-line-v2'),
      h1: document.querySelector('.scan-line-h1'),
      h2: document.querySelector('.scan-line-h2')
    };

    var SCAN_CORNER_OFFSET = 10; // must match the corner bracket outset in home.css

    function setScanRect(r) {
      gsap.set(scanEls.focus, { left: r.left, top: r.top, width: r.width, height: r.height });
      gsap.set(scanEls.v1, { left: r.left - SCAN_CORNER_OFFSET });
      gsap.set(scanEls.v2, { left: r.left + r.width + SCAN_CORNER_OFFSET });
      gsap.set(scanEls.h1, { top: r.top - SCAN_CORNER_OFFSET });
      gsap.set(scanEls.h2, { top: r.top + r.height + SCAN_CORNER_OFFSET });
    }

    function cardRect(i) {
      var card = sections[i] && sections[i].querySelector('.proj-card');
      return card ? card.getBoundingClientRect() : null;
    }

    // Measures a card's rect as it will sit at rest, even while its section is
    // still parked off-screen (temporarily zeroes the section's y transform).
    function restingCardRect(i) {
      var sec = sections[i];
      var card = sec && sec.querySelector('.proj-card');
      if (!card) return null;
      var savedX = gsap.getProperty(sec, 'x');
      var savedY = gsap.getProperty(sec, 'y');
      gsap.set(sec, { x: 0, y: 0 });
      var r = card.getBoundingClientRect();
      gsap.set(sec, { x: savedX, y: savedY });
      return { left: r.left, top: r.top, width: r.width, height: r.height };
    }

    function scaleRect(r, factor) {
      var w = r.width * factor, h = r.height * factor;
      return { left: r.left - (w - r.width) / 2, top: r.top - (h - r.height) / 2, width: w, height: h };
    }

    function syncScanToActive() {
      var r = cardRect(current);
      if (r) setScanRect(r);
    }

    function tweenScanTo(tl, rect, pos, dur) {
      tl.to(scanEls.focus, { left: rect.left, top: rect.top, width: rect.width, height: rect.height, duration: dur, ease: 'expo.inOut' }, pos)
        .to(scanEls.v1, { left: rect.left - SCAN_CORNER_OFFSET, duration: dur, ease: 'expo.inOut' }, pos)
        .to(scanEls.v2, { left: rect.left + rect.width + SCAN_CORNER_OFFSET, duration: dur, ease: 'expo.inOut' }, pos)
        .to(scanEls.h1, { top: rect.top - SCAN_CORNER_OFFSET, duration: dur, ease: 'expo.inOut' }, pos)
        .to(scanEls.h2, { top: rect.top + rect.height + SCAN_CORNER_OFFSET, duration: dur, ease: 'expo.inOut' }, pos);
    }

    // Desktop vertical: cards are TOP-anchored (.ph-layout top: 181px), so the
    // visible gap to the card peeking below is offset − activeCardHeight, and to
    // the card above it's |offset| − peekCardHeight. Card heights now vary per
    // project (portrait/square/landscape shapes), so the constant is the EDGE
    // GAP, not the section offset — a portrait card never crowds the square
    // next to it. Fractions reproduce the old square-card rhythm
    // (offsets 0.64 / −0.58 · VH with 480px cards).
    var GAP_BELOW = 0.105;   // active bottom edge → next card top edge, of VH
    var GAP_ABOVE = 0.047;   // prev card bottom edge → active top edge, of VH
    var PARK_BELOW = 1.5;    // parked just below the viewport
    var PARK_ABOVE = -1.5;   // parked just above the viewport

    // Mobile carousel: next/prev cards peek in from the sides (0.8·VW offset)
    // ponytail: fixed X offsets kept — peeking cards sit mostly offscreen on
    // phones, so mixed widths only change the sliver; apply the edge-gap
    // treatment here too if that ever reads as uneven.
    var PEEK_NEXT_X = 0.8;
    var PEEK_PREV_X = -0.8;

    var _cardH = []; // per-section card heights — cleared on resize
    function cardH(i) {
      if (_cardH[i] == null) {
        var c = sections[i] && sections[i].querySelector('.proj-card');
        _cardH[i] = c ? c.getBoundingClientRect().height : VH * 0.53;
      }
      return _cardH[i];
    }

    function sectionOffset(i, cur) {
      var fd = (i - cur + TOTAL) % TOTAL;
      var horiz = isMobileFlow();
      var span  = horiz ? VW : VH;
      if (fd === 0)         return 0;
      if (fd === 1)         return horiz ? span * PEEK_NEXT_X : cardH(cur) + VH * GAP_BELOW;
      if (fd === TOTAL - 1) return horiz ? span * PEEK_PREV_X : -(cardH(i) + VH * GAP_ABOVE);
      if (fd === TOTAL - 2) return span * PARK_ABOVE;
      return span * PARK_BELOW;
    }

    // gsap vars for a section's resting spot — always writes both axes so a
    // breakpoint crossing (resize handler) clears the stale one
    function sectionPos(i, cur) {
      var off = sectionOffset(i, cur);
      return isMobileFlow() ? { x: off, y: 0 } : { x: 0, y: off };
    }

    // Only the active section (fd 0) sits above .vignette-radial's z-index:50 —
    // its text/card must stay clear of the edge fade. Peeking neighbours (prev/next)
    // stay below it on purpose, so the fade is visible on them as they scroll in/out.
    function sectionZ(fd) {
      if (fd === 0)         return 70;
      if (fd === 1)         return 30;
      if (fd === TOTAL - 1) return 25;
      return 10;
    }

    // on-screen slots must animate, not snap
    function onScreen(fd) {
      return fd === 0 || fd === 1 || fd === TOTAL - 1;
    }

    // ── Card click → case study ──
    sections.forEach(function (section, i) {
      var card = section.querySelector('.proj-card');
      if (!card) return;
      var slug = PROJECTS[i] && PROJECTS[i].slug;
      if (!slug) return;

      card.addEventListener('click', function () {
        if (animating || !window.CaseStudy) return;

        if (window._resetProjectTilt) window._resetProjectTilt(card, true);
        var imgEl = card.querySelector('img');
        if (imgEl) gsap.set(imgEl, { rotateX: 0, rotateY: 0, scale: 1 });
        var fromCard = { card: card, rect: card.getBoundingClientRect() };

        try {
          showOverlay(PROJECTS[i], fromCard);
          history.pushState({ csOverlay: slug }, '', 'case-study.html?p=' + slug);
        } catch (e) {
          console.error('[porto] showOverlay failed:', e);
          isOverlayOpen = false;
        document.body.classList.remove('cs-open');
          _currentSlug = null;
          if (convObserver) convObserver.enable();
        }
      });

      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
          e.preventDefault();
          card.click();
        }
      });
    });

    sections.forEach(function (el, i) {
      gsap.set(el, sectionPos(i, 0));
      el.style.zIndex = sectionZ((i - 0 + TOTAL) % TOTAL);
    });
    sections[0].classList.add('is-active');
    syncScanToActive();

    function syncActiveCardTab() {
      sections.forEach(function (s) {
        var c = s.querySelector('.proj-card');
        if (!c) return;
        c.setAttribute('tabindex', s.classList.contains('is-active') ? '0' : '-1');
      });
    }
    syncActiveCardTab();

    function sectionText(idx) {
      var sec = sections[idx];
      if (!sec) return { small: null, big: null };
      return {
        small: sec.querySelectorAll('.ph-label .char'),
        big:   sec.querySelectorAll('.ph-title .char')
      };
    }

    function revealText(tl, t) {
      if (t.big   && t.big.length)   tl.fromTo(t.big,   { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.7, ease: 'power3.out', stagger: { each: 0.022, from: 'start' } }, 0.25);
      if (t.small && t.small.length) tl.fromTo(t.small, { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.6, ease: 'power3.out', stagger: { each: 0.016 } }, 0.35);
    }

    function hideText(tl, t) {
      if (t.big   && t.big.length)   tl.to(t.big,   { yPercent: -40, opacity: 0, duration: 0.35, ease: 'power3.in', stagger: { each: 0.008, from: 'end' } }, 0);
      if (t.small && t.small.length) tl.to(t.small, { yPercent: -40, opacity: 0, duration: 0.3,  ease: 'power3.in' }, 0);
    }

    // Expose hero reveal so hideOverlay (outer scope) can replay it on close.
    _hideHeroForClose = function () {
      var t = sectionText(current);
      if (t.big   && t.big.length)   { gsap.killTweensOf(t.big);   gsap.set(t.big,   { yPercent: 40, opacity: 0 }); }
      if (t.small && t.small.length) { gsap.killTweensOf(t.small); gsap.set(t.small, { yPercent: 40, opacity: 0 }); }
    };

    _replayHeroReveal = function () {
      var sec = sections[current];
      // Return-from-case-study reveal = whisper fade (matches home first paint
      // and the case-study panel), NOT the section-nav char-rise.
      if (typeof Motion !== 'undefined' && sec) {
        if (window.gsap) gsap.set(sec.querySelectorAll('.ph-label .char, .ph-title .char'), { opacity: 1, yPercent: 0 });
        sec.querySelectorAll('.ph-label, .ph-title').forEach(function (el) {
          el.setAttribute('data-reveal', '');
          el.style.opacity = '0';
        });
        Motion.enter(sec);
      } else {
        _hideHeroForClose();
        revealText(gsap.timeline(), sectionText(current));
      }
    };

    function go(dir) {
      if (animating) return;
      animating = true;
      if (window._resetProjectTilt) window._resetProjectTilt(null, true);

      var prev = current;

      // Kill any running tweens on the outgoing section to prevent conflicts
      var outgoing = sectionText(prev);
      if (outgoing.big)   gsap.killTweensOf(outgoing.big);
      if (outgoing.small) gsap.killTweensOf(outgoing.small);
      current = (prev + dir + TOTAL) % TOTAL;

      sections.forEach(function (s) { s.classList.remove('is-active'); });
      sections[current].classList.add('is-active');
      syncActiveCardTab();

      sections.forEach(function (el) { el.style.willChange = 'transform'; });

      var tl = gsap.timeline({
        onComplete: function () {
          animating = false;
          sections.forEach(function (el) { el.style.willChange = 'auto'; });
          sections[current].style.zIndex = sectionZ(0); // restore resting layer
        }
      });

      sections.forEach(function (el, i) {
        var fdNew = (i - current + TOTAL) % TOTAL;
        var fdOld = (i - prev    + TOTAL) % TOTAL;
        el.style.zIndex = sectionZ(fdNew);
        if (onScreen(fdNew) || onScreen(fdOld)) {
          tl.to(el, Object.assign({ duration: 1.1, ease: 'expo.inOut' }, sectionPos(i, current)), 0);
        } else {
          gsap.set(el, sectionPos(i, current));
        }
      });

      // lift incoming section above all while it travels to centre,
      // so the outgoing card can't cover it (the scroll-up collision)
      sections[current].style.zIndex = 100;

      // Text reveal / exit
      if (prev !== current) hideText(tl, sectionText(prev));

      // Hard-reset incoming section chars before reveal (prevents stale positions)
      var incoming = sectionText(current);
      if (incoming.big   && incoming.big.length)   gsap.set(incoming.big,   { yPercent: 40, opacity: 0 });
      if (incoming.small && incoming.small.length) gsap.set(incoming.small, { yPercent: 40, opacity: 0 });

      revealText(tl, sectionText(current));

      // Scan grid: scale ~20% larger over the outgoing card mid-transition,
      // then settle back to normal size framing the incoming card.
      if (scanEls.focus) {
        var scanOldRect = cardRect(prev);
        var scanNewRect = restingCardRect(current);
        if (scanOldRect && scanNewRect) {
          tweenScanTo(tl, scaleRect(scanOldRect, 1.2), 0, 0.55);
          tweenScanTo(tl, scanNewRect, 0.55, 0.55);
        }
      }

      // Nav update
      tl.to(navInner, {
        opacity: 0, y: dir > 0 ? -10 : 10, duration: 0.16, ease: 'power2.in',
        onComplete: function () {
          updateNav(current);
          gsap.set(navInner, { y: dir > 0 ? 10 : -10 });
        }
      }, 0.08)
      .to(navInner, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }, 0.3);
    }

    convObserver = Observer.create({
      type: 'wheel,touch',
      onDown: function () { go(1);  },
      onUp:   function () { go(-1); },
      // Mobile carousel: finger-swipe left (Observer onLeft) = next project
      onLeft:  function () { if (isMobileFlow()) go(1);  },
      onRight: function () { if (isMobileFlow()) go(-1); },
      tolerance: 10,
      preventDefault: true
    });

    window.addEventListener('resize', function () {
      VH = window.innerHeight;
      VW = window.innerWidth;
      _cardH = []; // breakpoints resize the cards — re-measure
      sections.forEach(function (el, i) { gsap.set(el, sectionPos(i, current)); });
      if (!animating) syncScanToActive();
    });

    window.addEventListener('keydown', function (e) {
      if (isOverlayOpen) return;
      if (document.body.classList.contains('menu-open')) return;
      if (window.GridView && GridView.isOpen()) return;
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') { go(1);  e.preventDefault(); }
      else if (e.key === 'ArrowUp'   || e.key === 'PageUp')               { go(-1); e.preventDefault(); }
    });

    navRows[1].addEventListener('click', function () { if (!animating && !isOverlayOpen) go(-1); });
    navRows[3].addEventListener('click', function () { if (!animating && !isOverlayOpen) go(1);  });

    // ── View switch: List / Grid ──
    var viewToggle = document.getElementById('view-tabs');
    var returnToGrid = false; // overlay was opened from the grid → restore it on close

    function syncViewTabs(view) {
      if (!viewToggle) return;
      var isGrid = view === 'grid';
      viewToggle.classList.toggle('is-grid', isGrid);
      viewToggle.setAttribute('aria-pressed', isGrid ? 'true' : 'false');
      viewToggle.setAttribute('aria-label', isGrid ? 'Switch to list view' : 'Switch to grid view');
    }

    function setView(view) {
      if (!window.GridView) return;
      var isGrid = view === 'grid';
      syncViewTabs(view);
      if (isGrid === GridView.isOpen()) return;
      if (isGrid) {
        if (window._resetProjectTilt) window._resetProjectTilt(null, true);
        if (convObserver) convObserver.disable();
        GridView.show();
      } else {
        GridView.hide();
        if (convObserver && !isOverlayOpen) convObserver.enable();
      }
    }

    if (viewToggle) {
      viewToggle.addEventListener('click', function () {
        if (!isOverlayOpen && !animating && window.GridView) {
          setView(GridView.isOpen() ? 'vertical' : 'grid');
        }
      });
      syncViewTabs(window.GridView && GridView.isOpen() ? 'grid' : 'vertical');
    }

    // ── bfcache restore ──
    // The about-page footer glide returns here via history.back(): this DOM
    // is restored exactly as the user left it, but the about page promised a
    // landing on fold 0 — snap the whole engine there before the frame paints.
    window.addEventListener('pageshow', function (e) {
      if (!e.persisted) return;
      if (window._resetProjectTilt) window._resetProjectTilt(null, true);
      if (window.GridView && GridView.isOpen()) {
        syncViewTabs('vertical');
        GridView.hide(true);
        if (convObserver && !isOverlayOpen) convObserver.enable();
      }
      animating = false;
      current = 0;
      gsap.killTweensOf('.porto');
      gsap.set('.porto', { opacity: 1 });
      sections.forEach(function (s, i) {
        gsap.killTweensOf(s);
        gsap.set(s, sectionPos(i, 0));
        s.style.zIndex = sectionZ(i % TOTAL);
        s.style.willChange = 'auto';
        s.classList.toggle('is-active', i === 0);
        var t = sectionText(i);
        var vis = i === 0;
        if (t.big && t.big.length)     { gsap.killTweensOf(t.big);   gsap.set(t.big,   { yPercent: vis ? 0 : 40, opacity: vis ? 1 : 0 }); }
        if (t.small && t.small.length) { gsap.killTweensOf(t.small); gsap.set(t.small, { yPercent: vis ? 0 : 40, opacity: vis ? 1 : 0 }); }
      });
      syncActiveCardTab();
      updateNav(0);
      syncScanToActive();
    });

    document.addEventListener('grid-open-project', function (e) {
      if (isOverlayOpen) return;
      var p = PROJECTS[e.detail.index];
      if (!p) return;
      returnToGrid = true;
      try {
        // rect = the clicked cell's media square, measured by grid.js through
        // the curved lens — drives the same single-card FLIP as vertical
        showOverlay(p, e.detail.rect
          ? { card: null, rect: e.detail.rect, isGrid: true, cell: { col: e.detail.col, row: e.detail.row } }
          : null);
        history.pushState({ csOverlay: p.slug }, '', 'case-study.html?p=' + p.slug);
      } catch (err) {
        console.error('[porto] showOverlay from grid failed:', err);
        returnToGrid = false;
        if (!GridView.isOpen()) GridView.show(); // lens never flattened — grid is still intact
      }
    });

    document.addEventListener('cs-closed', function () {
      if (!returnToGrid) return;
      returnToGrid = false;
      if (convObserver) convObserver.disable(); // hideOverlay just re-enabled it
      GridView.show();
    });

    // ── Close button for the in-place overlay ──
    var csCloseBtn = document.getElementById('cs-right-close');
    if (csCloseBtn) {
      csCloseBtn.addEventListener('click', function (e) {
        e.preventDefault();
        closeOverlay();
      });
    }

    // ── History navigation (popstate) ──
    window.addEventListener('popstate', function (e) {
      var target = (e.state && e.state.csOverlay) || null;
      if (target && target !== _currentSlug) {
        var p = CaseStudy.resolveProject(target);
        if (p) {
          if (window.GridView && GridView.isOpen()) { returnToGrid = true; GridView.hide(true); }
          showOverlay(p);
        }
      } else if (!target && _currentSlug) {
        hideOverlay();
      }
    });

    // ── Splash exit → intro ──
    var splashExited = false;
    animating = true;

    doExitSplash = function () {
      if (splashExited) return;
      splashExited = true;
      var splashEl = document.getElementById('splash');
      if (skipSplash) {
        // Seamless arrival: everything is already painted — no intro, no fade.
        if (splashEl) splashEl.style.display = 'none';
        gsap.set('.porto', { opacity: 1 });
        document.documentElement.classList.remove('skip-splash');
        animating = false;
        markHomeReady();
        return;
      }
      var portoEl = document.querySelector('.porto');
      var splashStatusEl = splashEl && splashEl.querySelector('.splash-status');
      var splashMediaEl = splashEl && splashEl.querySelector('.splash-logo-media');
      var splashCounterEl = splashEl && splashEl.querySelector('.splash-counter');
      var firstSectionEl = document.querySelector('.page-section:first-child');
      var heroCardEl = firstSectionEl && firstSectionEl.querySelector('.proj-card');
      var heroLabelEl = firstSectionEl && firstSectionEl.querySelector('.ph-label');
      var heroTitleEl = firstSectionEl && firstSectionEl.querySelector('.ph-title');
      var heroTextEls = [heroLabelEl, heroTitleEl].filter(Boolean);
      var navInnerEl = document.getElementById('nav-inner');
      var scanGridEl = document.querySelector('.scan-grid');
      var navbarEl = document.querySelector('.navbar');
      var viewTabsEl = document.getElementById('view-tabs');
      if (!splashEl || !portoEl) {
        if (splashEl) splashEl.style.display = 'none';
        if (portoEl) gsap.set(portoEl, { opacity: 1 });
        animating = false;
        markHomeReady();
        return;
      }

      // Rack-focus handoff: the homepage is already present underneath the
      // opaque splash, then resolves from a soft, slightly darkened frame.
      // No directional wipe — every part of the viewport develops together.
      gsap.set(portoEl, {
        opacity: 1,
        scale: 1.012,
        filter: 'blur(11px) brightness(0.55)',
        transformOrigin: '50% 50%',
        willChange: 'transform,filter'
      });
      gsap.set(splashEl, { opacity: 1, yPercent: 0, willChange: 'opacity' });
      if (splashStatusEl) gsap.set(splashStatusEl, { willChange: 'opacity' });
      if (splashMediaEl) gsap.set(splashMediaEl, { willChange: 'opacity,filter,transform' });
      if (splashCounterEl) gsap.set(splashCounterEl, { willChange: 'opacity,filter,transform' });

      // First homepage composition: keep the structural stage stationary and
      // give only the content a restrained upward lift. The centre card leads,
      // followed by text and navigation; the grid/UI merely fade into place.
      if (firstSectionEl) {
        gsap.set(firstSectionEl.querySelectorAll('.ph-label .char, .ph-title .char'), {
          opacity: 1,
          yPercent: 0
        });
      }
      if (heroCardEl) gsap.set(heroCardEl, {
        y: 24,
        scale: 0.99,
        opacity: 0.6,
        transformOrigin: '50% 50%',
        willChange: 'transform,opacity'
      });
      if (heroTextEls.length) gsap.set(heroTextEls, {
        y: 16,
        opacity: 0,
        willChange: 'transform,opacity'
      });
      if (navInnerEl) gsap.set(navInnerEl, { y: 10, opacity: 0, willChange: 'transform,opacity' });
      if (scanGridEl) gsap.set(scanGridEl, { opacity: 0, willChange: 'opacity' });
      if (navbarEl) gsap.set(navbarEl, { opacity: 0, willChange: 'opacity' });
      if (viewTabsEl) gsap.set(viewTabsEl, { opacity: 0, willChange: 'opacity' });

      var introTl = gsap.timeline({ onComplete: function () {
        splashEl.style.display = 'none';
        gsap.set(portoEl, { clearProps: 'filter,transform,transformOrigin,willChange' });
        if (splashStatusEl) gsap.set(splashStatusEl, { clearProps: 'opacity,filter,willChange' });
        if (splashMediaEl) gsap.set(splashMediaEl, { clearProps: 'opacity,filter,transform,willChange' });
        if (splashCounterEl) gsap.set(splashCounterEl, { clearProps: 'opacity,filter,transform,willChange' });
        if (heroCardEl) gsap.set(heroCardEl, { clearProps: 'opacity,transform,transformOrigin,willChange' });
        // Keep the final inline opacity: the base anti-FOUC rule intentionally
        // leaves .ph-label at zero until JavaScript has completed its reveal.
        if (heroTextEls.length) gsap.set(heroTextEls, { clearProps: 'transform,willChange' });
        if (navInnerEl) gsap.set(navInnerEl, { clearProps: 'opacity,transform,willChange' });
        if (scanGridEl) gsap.set(scanGridEl, { clearProps: 'opacity,willChange' });
        if (navbarEl) gsap.set(navbarEl, { clearProps: 'opacity,willChange' });
        if (viewTabsEl) gsap.set(viewTabsEl, { clearProps: 'opacity,willChange' });
        gsap.set(splashEl, { clearProps: 'opacity,transform,willChange' });
        animating = false;
        markHomeReady();
      } });
      introTl
        .to(splashCounterEl, {
          opacity: 0,
          y: -8,
          filter: 'blur(5px)',
          duration: 0.28,
          ease: 'sine.in'
        }, 0)
        .to(splashMediaEl, {
          opacity: 0,
          scale: 0.985,
          filter: 'blur(8px)',
          duration: 0.52,
          ease: 'sine.inOut'
        }, 0.08)
        .to(splashEl, { opacity: 0, duration: 0.94, ease: 'sine.inOut' }, 0.16)
        .to(portoEl, {
          scale: 1,
          filter: 'blur(0px) brightness(1)',
          duration: 1.1,
          ease: 'sine.inOut'
        }, 0.12);
      if (heroCardEl) introTl.to(heroCardEl, {
        y: 0,
        scale: 1,
        opacity: 1,
        duration: 0.95,
        ease: 'power3.out'
      }, 0.18);
      if (scanGridEl) introTl.to(scanGridEl, {
        opacity: 1,
        duration: 0.7,
        ease: 'sine.out'
      }, 0.34);
      if (heroLabelEl) introTl.to(heroLabelEl, {
        y: 0,
        opacity: 1,
        duration: 0.78,
        ease: 'power3.out'
      }, 0.3);
      if (heroTitleEl) introTl.to(heroTitleEl, {
        y: 0,
        opacity: 1,
        duration: 0.82,
        ease: 'power3.out'
      }, 0.38);
      if (navInnerEl) introTl.to(navInnerEl, {
        y: 0,
        opacity: 1,
        duration: 0.65,
        ease: 'power3.out'
      }, 0.42);
      if (navbarEl) introTl.to(navbarEl, {
        opacity: 1,
        duration: 0.62,
        ease: 'sine.out'
      }, 0.44);
      if (viewTabsEl) introTl.to(viewTabsEl, {
        opacity: 1,
        duration: 0.62,
        ease: 'sine.out'
      }, 0.48);
    };

    if (splashCounterDone) doExitSplash();
  }

  // All markup exists because this script sits at the end of <body>. Starting
  // on DOMContentLoaded avoids waiting for the portfolio's large image assets;
  // waiting for window.load allowed the 6 s safety fallback to win the race.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHome, { once: true });
  } else {
    initHome();
  }

  // ── Custom proj-card cursor ───────────────────────────
  (function () {
    var cursor = document.getElementById('proj-cursor');
    if (!cursor) return;

    var mouseX = window.innerWidth / 2;
    var mouseY = window.innerHeight / 2;
    var curX = mouseX, curY = mouseY;
    var rafId = null;

    function lerp(a, b, t) { return a + (b - a) * t; }

    function applyTransform() {
      cursor.style.transform = 'translate3d(' + curX + 'px,' + curY + 'px,0)';
    }

    function loop() {
      curX = lerp(curX, mouseX, 0.12);
      curY = lerp(curY, mouseY, 0.12);
      applyTransform();
      if (Math.abs(mouseX - curX) < 0.1 && Math.abs(mouseY - curY) < 0.1) {
        curX = mouseX; curY = mouseY;
        applyTransform();
        rafId = null;
        return;
      }
      rafId = requestAnimationFrame(loop);
    }

    function kick() {
      if (rafId === null) rafId = requestAnimationFrame(loop);
    }

    applyTransform();

    document.addEventListener('mousemove', function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      kick();
    }, { passive: true });

    // Event delegation on document catches all .proj-card hovers
    document.addEventListener('mouseover', function (e) {
      if (e.target.closest('.page-section .proj-card')) {
        cursor.classList.add('is-visible');
        document.body.style.cursor = 'none';
      }
    });

    document.addEventListener('mouseout', function (e) {
      if (e.target.closest('.page-section .proj-card')) {
        var related = e.relatedTarget;
        if (!related || !related.closest('.page-section .proj-card')) {
          cursor.classList.remove('is-visible');
          document.body.style.cursor = '';
        }
      }
    });

    var cursorLabel = cursor.querySelector('span');

    function setCursorClose() {
      cursor.classList.add('is-close');
      if (cursorLabel) cursorLabel.textContent = 'CLOSE';
    }
    function resetCursorExplore() {
      cursor.classList.remove('is-close');
      cursor.classList.remove('is-visible'); // clear stuck cursor when the hovered card vanished without a mouseout
      document.body.style.cursor = '';
      if (cursorLabel) cursorLabel.textContent = '[EXPLORE]';
    }

    // Expose reset so hideOverlay can call it
    window._resetCursorExplore = resetCursorExplore;

    document.addEventListener('mouseover', function (e) {
      if (!isOverlayOpen) return;
      if (e.target.closest('.cs-slide .proj-card')) {
        setCursorClose();
        cursor.classList.add('is-visible');
        document.body.style.cursor = 'none';
      }
    });

    document.addEventListener('mouseout', function (e) {
      if (!isOverlayOpen) return;
      if (e.target.closest('.cs-slide .proj-card')) {
        var related = e.relatedTarget;
        if (!related || !related.closest('.cs-slide .proj-card')) {
          resetCursorExplore();
          cursor.classList.remove('is-visible');
          document.body.style.cursor = '';
        }
      }
    });

    document.addEventListener('click', function (e) {
      if (!isOverlayOpen) return;
      if (e.target.closest('#cs-right-close')) return;
      if (e.target.closest('.cs-slider-nav')) return;
      if (e.target.closest('#cs-left')) {
        closeOverlay();
      }
    });
  })();

  // ── Homepage List: pointer-following 3D card tilt ──────
  // The custom [EXPLORE] cursor above remains independent, so a card hover
  // now produces both interactions at once.
  (function () {
    var cards = document.querySelectorAll('.page-section .proj-card');
    var canTilt = !!(
      window.matchMedia &&
      window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
      !window.matchMedia('(max-width: 734px)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
    var states = new WeakMap();

    var MAX_TILT = 14;
    var PERSPECTIVE = 800;
    var ROTATION_EASE = 0.22;
    var HOVER_SCALE = 1.035;
    var SPRING_STIFFNESS = 0.14;
    var SPRING_DAMPING = 0.72;
    var REST_THRESHOLD = 0.01;

    function schedule(card, state) {
      if (state.frame === null) {
        state.frame = window.requestAnimationFrame(function () {
          render(card, state);
        });
      }
    }

    function readPointer(card, state) {
      if (!state.pendingPointer) return;
      if (!state.rect) state.rect = card.getBoundingClientRect();

      var relativeX = (state.pendingPointer.clientX - state.rect.left) / state.rect.width;
      var relativeY = (state.pendingPointer.clientY - state.rect.top) / state.rect.height;
      state.targetY = (relativeX - 0.5) * MAX_TILT * 2;
      state.targetX = -(relativeY - 0.5) * MAX_TILT * 2;
      state.pendingPointer = null;
    }

    function render(card, state) {
      readPointer(card, state);

      var deltaX = state.targetX - state.currentX;
      var deltaY = state.targetY - state.currentY;
      state.currentX += deltaX * ROTATION_EASE;
      state.currentY += deltaY * ROTATION_EASE;

      state.scaleVelocity += (state.targetScale - state.currentScale) * SPRING_STIFFNESS;
      state.scaleVelocity *= SPRING_DAMPING;
      state.currentScale += state.scaleVelocity;

      card.style.transform =
        'perspective(' + PERSPECTIVE + 'px) ' +
        'rotateX(' + state.currentX.toFixed(3) + 'deg) ' +
        'rotateY(' + state.currentY.toFixed(3) + 'deg) ' +
        'scale(' + state.currentScale.toFixed(4) + ')';

      var rotationSettled =
        Math.abs(deltaX) < REST_THRESHOLD &&
        Math.abs(deltaY) < REST_THRESHOLD;
      var scaleSettled =
        Math.abs(state.targetScale - state.currentScale) < 0.0005 &&
        Math.abs(state.scaleVelocity) < 0.0005;

      if (state.active || !rotationSettled || !scaleSettled) {
        state.frame = window.requestAnimationFrame(function () {
          render(card, state);
        });
        return;
      }

      state.frame = null;
      state.currentScale = 1;
      state.scaleVelocity = 0;
      state.rect = null;
      card.style.transform = '';
    }

    function resetCard(card, immediate) {
      var state = states.get(card);
      if (!state) {
        card.classList.remove('is-tilting');
        card.style.transform = '';
        return;
      }

      state.active = false;
      state.targetX = 0;
      state.targetY = 0;
      state.targetScale = 1;
      state.pendingPointer = null;
      card.classList.remove('is-tilting');

      if (immediate) {
        if (state.frame !== null) window.cancelAnimationFrame(state.frame);
        state.frame = null;
        state.currentX = 0;
        state.currentY = 0;
        state.currentScale = 1;
        state.scaleVelocity = 0;
        state.rect = null;
        card.style.transform = '';
      } else {
        schedule(card, state);
      }
    }

    window._resetProjectTilt = function (card, immediate) {
      if (card) {
        resetCard(card, immediate !== false);
        return;
      }
      Array.prototype.forEach.call(cards, function (item) {
        resetCard(item, immediate !== false);
      });
    };

    if (!canTilt || !cards.length) return;

    Array.prototype.forEach.call(cards, function (card) {
      var state = {
        frame: null,
        active: false,
        pendingPointer: null,
        rect: null,
        targetX: 0,
        targetY: 0,
        currentX: 0,
        currentY: 0,
        targetScale: 1,
        currentScale: 1,
        scaleVelocity: 0
      };
      states.set(card, state);

      card.addEventListener('mouseenter', function () {
        state.active = true;
        state.targetScale = HOVER_SCALE;
        state.rect = card.getBoundingClientRect();
        card.classList.add('is-tilting');
        schedule(card, state);
      });

      card.addEventListener('mousemove', function (event) {
        state.pendingPointer = event;
        schedule(card, state);
      }, { passive: true });

      card.addEventListener('mouseleave', function () {
        resetCard(card, false);
      });
    });
  })();
})();
