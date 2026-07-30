// About page — full-screen menu, work-experience counter, and page transitions.

// ── Home menu → About curtain release ──
(function () {
  var root = document.documentElement;
  var curtain = document.getElementById('about-entry-curtain');
  if (!curtain || !root.classList.contains('from-home-curtain')) return;

  var released = false;

  function release() {
    if (released) return;
    released = true;
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        root.classList.add('is-about-ready');
        document.dispatchEvent(new CustomEvent('porto:about-reveal'));
        window.setTimeout(function () {
          root.classList.remove('from-home-curtain', 'is-about-ready');
        }, 380);
      });
    });
  }

  // The same fonts already render on the homepage, so the cache normally
  // resolves immediately. Keep a short cap for cold loads without making
  // the black handoff feel like a pause.
  if (document.fonts && document.fonts.ready) {
    Promise.race([
      document.fonts.ready,
      new Promise(function (resolve) { window.setTimeout(resolve, 180); })
    ]).then(release, release);
  } else {
    release();
  }

  window.setTimeout(release, 450);
})();

// ── Full-screen menu (same behavior as the homepage) ──
(function () {
  var trigger = document.getElementById('menu-trigger');
  var menu = document.getElementById('site-menu');
  var panel = document.getElementById('site-menu-panel');
  var aboutButton = menu && menu.querySelector('[data-menu-action="about"]');
  var previousFocus = null;
  var closeTimer = null;
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

  trigger.addEventListener('click', function () {
    if (menu.classList.contains('is-open') || menu.classList.contains('is-preparing')) {
      closeMenu(true);
    } else {
      openMenu();
    }
  });
  if (aboutButton) aboutButton.addEventListener('click', function () { closeMenu(true); });

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

  window.addEventListener('pageshow', function () { closeMenu(false); });
  window.addEventListener('resize', function () {
    if (menu.classList.contains('is-open')) updateMorphGeometry();
  }, { passive: true });
})();

// ── Work experience counter: update as each company crosses mid-viewport ──
(function () {
  var counter = document.getElementById('work-counter');
  var items = document.querySelectorAll('.ab-work-item');
  if (!counter || !items.length) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) counter.textContent = e.target.getAttribute('data-index');
    });
  }, { rootMargin: '-45% 0px -45% 0px' }); // fires when the item hits the middle band of the screen
  items.forEach(function (el) { io.observe(el); });
})();

// ── Footer: back-to-homepage glide ──
// The cut-off peek box is a plain black placeholder frame; on click or on
// scrolling past the page end it expands to fill the viewport, then
// navigates. home.js sees the sessionStorage flag and skips its splash.
// ponytail: replaced the JS-built homepage replica (shared element) with a
// plain box — the replica never matched the real page pixel-perfectly and
// caused a blink on arrival.
(function () {
  var peek = document.getElementById('home-peek');
  var link = document.getElementById('back-home');
  if (!peek || !link) return;

  // ── Hold-then-commit ──
  // The box never moves while waiting. The gesture that lands the page at the
  // bottom is fully ignored, momentum tail included — that's the "hold". A
  // NEW scroll gesture after that commits: the box expands fullscreen and
  // navigates. New gesture = the wheel went quiet for a beat, or the deltas
  // spiked back up while a momentum tail was still decaying (scrolled again
  // before the tail finished).
  var PULL_COMMIT = 300; // wheel delta a new gesture must add before committing
  var committed = false;

  function commit() {
    if (committed) return;
    committed = true;
    // FLIP: pin the box where it sits, then transition it to full viewport.
    // position:fixed escapes the overflow:hidden clip of .ab-peek-wrap.
    var r = peek.getBoundingClientRect();
    peek.style.cssText += ';position:fixed;top:' + r.top + 'px;left:' + r.left + 'px;width:' + r.width + 'px;height:' + r.height + 'px;margin:0;z-index:2000;';
    peek.getBoundingClientRect(); // flush layout so the transition has a starting frame
    peek.style.transition = 'top 0.8s cubic-bezier(0.76,0,0.24,1), left 0.8s cubic-bezier(0.76,0,0.24,1), width 0.8s cubic-bezier(0.76,0,0.24,1), height 0.8s cubic-bezier(0.76,0,0.24,1)';
    peek.style.top = '0px';
    peek.style.left = '0px';
    peek.style.width = '100vw';
    peek.style.height = '100vh';
    setTimeout(function () {
      try { sessionStorage.setItem('porto-skip-splash', '1'); } catch (e) {}
      // Came from the homepage → go BACK instead of forward: a bfcache
      // restore is an instant single-frame swap (no navigation blank) in
      // every browser, unlike a fresh load which blinks where cross-document
      // view transitions don't run. The homepage's pageshow handler snaps it
      // to fold 0 while still covered by the expanded box. If bfcache
      // misses, the traversal becomes a normal load and the skip-splash
      // flag covers it.
      if (/(index\.html|\/)$/.test(document.referrer) && history.length > 1) history.back();
      else window.location.href = 'index.html';
    }, 820);
  }

  link.addEventListener('click', function (e) { e.preventDefault(); commit(); });
  peek.addEventListener('click', commit);
  peek.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); commit(); }
  });

  var armed = false, pull = 0, prevT = 0, prevDy = 0;
  window.addEventListener('wheel', function (e) {
    if (committed) return;
    var now = performance.now();
    var gap = now - prevT;
    var dy  = e.deltaY;
    // Deliberate new gesture: quiet period, or a delta spike against a
    // decaying momentum tail (trackpad tails only ever shrink).
    var newGesture = gap > 250 || (dy > 80 && dy > prevDy * 1.8);
    prevT = now; prevDy = dy;
    var atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    if (!atBottom || dy <= 0) { armed = false; pull = 0; return; }
    if (!armed) {
      if (!newGesture) return; // still the ride-down gesture — hold, box stays put
      armed = true; pull = 0;
    }
    if (gap > 600) pull = 0; // stale remainder from an older armed gesture
    pull += dy;
    if (pull >= PULL_COMMIT) commit();
  }, { passive: true });

  // Back-forward cache: reset if the user navigates back
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) {
      committed = false;
      armed = false; pull = 0;
      peek.style.cssText = '';
    }
  });
})();

// ── Whisper-fade text reveal (docs/superpowers/plans/2026-07-07-whisper-fade-text-motion.md) ──
(function () {
  if (typeof Motion === 'undefined') return;

  // Split the hero headline into lines so it fades line-by-line.
  document.querySelectorAll('[data-reveal-lines]').forEach(function (el) {
    Motion.splitLines(el);
  });

  // Entrance: hero fades in top→bottom. On the menu-curtain route, start it
  // exactly when the destination cover begins to clear.
  var hero = document.querySelector('.ab-hero');
  if (document.documentElement.classList.contains('from-home-curtain')) {
    document.addEventListener('porto:about-reveal', function () {
      Motion.enter(hero);
    }, { once: true });
  } else {
    Motion.enter(hero);
  }

  // Below-the-fold: fade each marked block in on scroll.
  Motion.observe(document);

  // Plain menu links (no structural transition) → whisper the page out first.
  document.querySelectorAll('.site-menu-nav a[href]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var href = a.getAttribute('href');
      if (!href || href.charAt(0) === '#') return;    // skip in-page/placeholder
      if (href.indexOf('index.html') !== -1) return;  // Work → home uses peek glide path elsewhere
      e.preventDefault();
      Motion.exit(function () { window.location.href = href; });
    });
  });
})();
