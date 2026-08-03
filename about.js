// About page — full-screen menu, work-experience counter, and page transitions.

// ── Full-screen menu (same behavior as the homepage) ──
(function () {
  var trigger = document.getElementById('menu-trigger');
  var menu = document.getElementById('site-menu');
  var panel = document.getElementById('site-menu-panel');
  var aboutButton = menu && menu.querySelector('[data-menu-action="about"]');
  var worksLink = menu && menu.querySelector('.site-menu-nav a[href*="index.html"]');
  var previousFocus = null;
  var closeTimer = null;
  var leavingForWorks = false;
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
    if (leavingForWorks) return;
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
    if (leavingForWorks) return;
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
    if (leavingForWorks) return;
    if (menu.classList.contains('is-open') || menu.classList.contains('is-preparing')) {
      closeMenu(true);
    } else {
      openMenu();
    }
  });
  if (aboutButton) aboutButton.addEventListener('click', function () { closeMenu(true); });

  function navigateToWorks(e) {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (leavingForWorks) return;

    var href = worksLink.getAttribute('href') || 'index.html';
    try { sessionStorage.setItem('porto-skip-splash', '1'); } catch (storageError) {}
    if (reducedMotion) {
      window.location.href = href;
      return;
    }

    leavingForWorks = true;
    worksLink.classList.add('is-route-target');
    worksLink.setAttribute('aria-current', 'page');
    menu.classList.add('is-selecting-works');
    menu.setAttribute('aria-hidden', 'true');
    try { sessionStorage.setItem('porto-home-curtain', '1'); } catch (storageError) {}

    window.setTimeout(function () {
      if (!leavingForWorks) return;
      menu.classList.add('is-navigating-home');
      document.body.classList.add('page-leaving-home');
    }, 80);

    window.setTimeout(function () {
      // Always activate the prepared destination URL. Depending on history.back
      // made the rack-focus entry conditional on browser bfcache behaviour.
      window.location.href = href;
    }, 720);
  }

  if (worksLink) worksLink.addEventListener('click', navigateToWorks);

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
    if (leavingForWorks || menu.classList.contains('is-navigating-home')) {
      leavingForWorks = false;
      menu.classList.add('is-resetting');
      menu.classList.remove('is-selecting-works', 'is-navigating-home', 'is-open', 'is-preparing', 'is-closing');
      document.body.classList.remove('page-leaving-home', 'menu-open');
      trigger.setAttribute('aria-expanded', 'false');
      trigger.setAttribute('aria-label', 'Open menu');
      menu.setAttribute('aria-hidden', 'true');
      if (worksLink) {
        worksLink.classList.remove('is-route-target');
        worksLink.removeAttribute('aria-current');
      }
      window.requestAnimationFrame(function () { menu.classList.remove('is-resetting'); });
      return;
    }
    closeMenu(false);
  });
  window.addEventListener('resize', function () {
    if (menu.classList.contains('is-open')) updateMorphGeometry();
  }, { passive: true });
})();

// ── Scroll choreography: editorial hero handoff → About → Work ──
(function () {
  var root = document.documentElement;
  var heroStage = document.querySelector('.ab-hero-stage');
  var about = document.querySelector('.ab-about');
  var aboutTitle = about && about.querySelector('.ab-split-title');
  var aboutParagraphs = about
    ? [].slice.call(about.querySelectorAll('[data-blur-reveal]'))
    : [];
  var lastAboutParagraph = aboutParagraphs.length
    ? aboutParagraphs[aboutParagraphs.length - 1]
    : null;
  var work = document.querySelector('.ab-work');
  var workItems = [].slice.call(document.querySelectorAll('.ab-work-item'));
  var lastWorkItem = workItems.length
    ? workItems[workItems.length - 1]
    : null;
  var outside = document.querySelector('.ab-outside');
  var reduced = !!(window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var handoffMotion = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: no-preference)')
    : { matches: false };
  var frame = null;
  var aboutPaddingTop = 0;

  if (!about && !workItems.length) return;
  workItems.forEach(function (item, index) {
    item.setAttribute('data-index', String(index + 1));
  });
  if (!reduced) root.classList.add('ab-cinematic-on');

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function smoothStep(value) {
    value = clamp(value, 0, 1);
    return value * value * (3 - 2 * value);
  }

  function phaseProgress(progress, start, end) {
    return smoothStep((progress - start) / Math.max(0.001, end - start));
  }

  function resetHandoff() {
    root.classList.remove(
      'ab-handoff-on',
      'ab-hero-exit-complete',
      'ab-handoff-complete'
    );
    if (heroStage) {
      heroStage.style.removeProperty('--hero-copy-opacity');
      heroStage.style.removeProperty('--hero-copy-blur');
      heroStage.style.removeProperty('--hero-copy-y');
      heroStage.style.removeProperty('--hero-media-opacity');
      heroStage.style.removeProperty('--hero-media-blur');
      heroStage.style.removeProperty('--hero-media-y');
    }
    if (about) {
      about.style.removeProperty('--about-title-opacity');
      about.style.removeProperty('--about-copy-opacity');
      about.style.removeProperty('--about-title-handoff-y');
      about.style.removeProperty('--about-copy-handoff-y');
    }
  }

  function measureHandoff() {
    aboutPaddingTop = about
      ? (parseFloat(window.getComputedStyle(about).paddingTop) || 0)
      : 0;
  }

  function updateHandoff() {
    if (!heroStage || !about || !aboutTitle || !handoffMotion.matches) {
      resetHandoff();
      return;
    }

    // Read the untransformed title position so the entrance movement cannot
    // feed back into its own progress calculation.
    var titleTop = about.getBoundingClientRect().top + aboutPaddingTop;
    var viewportHeight = window.innerHeight;
    var handoffStart = viewportHeight * 1.18;
    var handoffEnd = viewportHeight * 0.66;
    var handoffProgress = clamp(
      (handoffStart - titleTop) / Math.max(1, handoffStart - handoffEnd),
      0,
      1
    );
    var heroExitProgress = phaseProgress(handoffProgress, 0, 0.74);
    var aboutTitleProgress = phaseProgress(handoffProgress, 0.28, 0.74);
    var aboutCopyProgress = phaseProgress(handoffProgress, 0.38, 1);
    var compact = window.innerWidth <= 900;
    var heroExitLift = compact ? 42 : 64;
    var aboutTitleRise = compact ? 28 : 36;
    var aboutCopyRise = compact ? 36 : 52;

    root.classList.add('ab-handoff-on');
    root.classList.toggle('ab-hero-exit-complete', heroExitProgress >= 0.999);
    root.classList.toggle('ab-handoff-complete', aboutCopyProgress >= 0.999);
    heroStage.style.setProperty('--hero-copy-opacity', String(1 - heroExitProgress));
    heroStage.style.setProperty('--hero-copy-blur', String(3.5 * heroExitProgress) + 'px');
    heroStage.style.setProperty('--hero-copy-y', String(-heroExitLift * heroExitProgress) + 'px');
    heroStage.style.setProperty('--hero-media-opacity', String(1 - heroExitProgress));
    heroStage.style.setProperty('--hero-media-blur', String(3.5 * heroExitProgress) + 'px');
    heroStage.style.setProperty('--hero-media-y', String(-heroExitLift * heroExitProgress) + 'px');
    about.style.setProperty('--about-title-opacity', String(aboutTitleProgress));
    about.style.setProperty('--about-copy-opacity', String(aboutCopyProgress));
    about.style.setProperty(
      '--about-title-handoff-y',
      String(aboutTitleRise * (1 - aboutTitleProgress)) + 'px'
    );
    about.style.setProperty(
      '--about-copy-handoff-y',
      String(aboutCopyRise * (1 - aboutCopyProgress)) + 'px'
    );
  }

  function updateSectionExit(section, anchor) {
    if (!section || !anchor || reduced) return;

    var viewportHeight = window.innerHeight;
    var anchorBottom = anchor.getBoundingClientRect().bottom;
    // The final section has less document below it than About and Work. Start
    // its identical exit curve earlier so it can finish as the footer enters,
    // without introducing extra blank scroll space after the gallery.
    var finalSection = section === outside;
    var exitStart = viewportHeight * (finalSection ? 0.72 : 0.46);
    var exitEnd = viewportHeight * (
      finalSection
        ? (window.innerWidth <= 900 ? 0.43 : 0.42)
        : 0.14
    );
    var exitProgress = smoothStep(
      (exitStart - anchorBottom) / Math.max(1, exitStart - exitEnd)
    );
    var sectionLift = window.innerWidth <= 900 ? 24 : 32;

    section.style.setProperty(
      '--ab-section-exit-opacity',
      String(1 - exitProgress)
    );
    section.style.setProperty(
      '--ab-section-exit-blur',
      String(3 * exitProgress) + 'px'
    );
    section.style.setProperty(
      '--ab-section-exit-y',
      String(-sectionLift * exitProgress) + 'px'
    );
  }

  function updateSectionExits() {
    updateSectionExit(about, lastAboutParagraph);
    updateSectionExit(work, lastWorkItem);
  }

  function render() {
    frame = null;
    updateHandoff();
    updateSectionExits();
  }

  function requestRender() {
    if (frame !== null) return;
    frame = window.requestAnimationFrame(render);
  }

  function handleResize() {
    measureHandoff();
    requestRender();
  }

  window.addEventListener('scroll', requestRender, { passive: true });
  window.addEventListener('resize', handleResize, { passive: true });
  window.addEventListener('orientationchange', handleResize, { passive: true });
  window.addEventListener('pageshow', function () {
    measureHandoff();
    requestRender();
  });
  if (handoffMotion.addEventListener) {
    handoffMotion.addEventListener('change', handleResize);
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      measureHandoff();
      requestRender();
    });
  }

  measureHandoff();
  render();
})();

// ── Shared scrubbed reveal: About, Work, and Outside Design ──
// Adapted from Codrops' character-level blur reveal. The original demo uses
// GSAP + ScrollTrigger; this version keeps the page dependency-free and
// smooths native scroll progress with a damped requestAnimationFrame loop.
(function () {
  var root = document.documentElement;
  var scenes = [].slice.call(document.querySelectorAll('[data-blur-reveal]'));
  var blocks = [].slice.call(document.querySelectorAll('[data-blur-block]'));
  var reduced = !!(window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var states = [];
  var frame = null;
  var needsMeasure = true;
  var lastTime = 0;
  // Keep the smoothed visual close to its real scroll position. Without this
  // bound, a large wheel/trackpad jump can move a paragraph through the
  // viewport while its characters are still easing from progress 0.
  var maxProgressLag = 0.08;

  if ((!scenes.length && !blocks.length) || reduced) return;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function splitScene(scene) {
    var rawText = scene.textContent.replace(/\s+/g, ' ').trim();
    var content = document.createElement('span');
    var visual = document.createElement('span');
    var words = [];

    content.className = 'ab-blur-content';
    content.setAttribute('aria-label', rawText);
    visual.className = 'ab-blur-visual';
    visual.setAttribute('aria-hidden', 'true');

    rawText.split(/(\s+)/).forEach(function (token) {
      if (!token) return;
      if (/^\s+$/.test(token)) {
        visual.appendChild(document.createTextNode(token));
        return;
      }

      var word = document.createElement('span');
      word.className = 'ab-blur-word';
      word.textContent = token;
      words.push(word);
      visual.appendChild(word);
    });

    var lastIndex = Math.max(1, words.length - 1);
    words.forEach(function (word, index) {
      var order = index / lastIndex;
      word.style.setProperty(
        '--ab-word-opacity-threshold',
        (order * 0.74).toFixed(4)
      );
    });

    content.appendChild(visual);
    scene.textContent = '';
    scene.appendChild(content);
    return content;
  }

  scenes.forEach(function (scene) {
    states.push({
      type: 'text',
      scene: scene,
      content: splitScene(scene),
      current: 0,
      target: 0
    });
  });
  blocks.forEach(function (block) {
    states.push({
      type: 'block',
      scene: block,
      content: block,
      current: 0,
      target: 0
    });
  });
  root.classList.add('ab-blur-on');

  function measureTargets() {
    var viewportHeight = window.innerHeight;
    var start = viewportHeight * 0.88;

    states.forEach(function (state) {
      var rect = state.content.getBoundingClientRect();
      var end = viewportHeight * 0.62 - rect.height;
      var distance = Math.max(viewportHeight * 0.28, start - end);
      state.target = clamp((start - rect.top) / distance, 0, 1);
    });
    needsMeasure = false;
  }

  function applyProgress(state) {
    var riseProgress = clamp(state.current / 0.72, 0, 1);
    riseProgress = riseProgress * riseProgress * (3 - 2 * riseProgress);
    if (state.type === 'block') {
      state.content.style.setProperty(
        '--ab-block-y',
        (7 * (1 - riseProgress)).toFixed(3) + 'px'
      );
      state.content.style.setProperty(
        '--ab-block-opacity',
        (state.current * 1.76).toFixed(4)
      );
      return;
    }
    state.content.style.setProperty(
      '--ab-scene-y',
      (7 * (1 - riseProgress)).toFixed(3) + 'px'
    );
    state.content.style.setProperty(
      '--ab-blur-opacity',
      (state.current * 1.76).toFixed(4)
    );
  }

  function render(time) {
    frame = null;
    if (needsMeasure) measureTargets();

    var delta = lastTime ? Math.min(48, time - lastTime) : 16.67;
    var ease = 1 - Math.exp(-delta / 70);
    var settled = true;
    lastTime = time;

    states.forEach(function (state) {
      var difference = state.target - state.current;
      if (Math.abs(difference) > maxProgressLag) {
        state.current = state.target -
          (difference > 0 ? maxProgressLag : -maxProgressLag);
        difference = state.target - state.current;
      }
      if (Math.abs(difference) > 0.0004) {
        state.current += difference * ease;
        settled = false;
      } else {
        state.current = state.target;
      }
      applyProgress(state);
    });

    if (!settled) frame = window.requestAnimationFrame(render);
  }

  function requestRender() {
    needsMeasure = true;
    if (frame === null) frame = window.requestAnimationFrame(render);
  }

  function snapToCurrentScroll() {
    measureTargets();
    states.forEach(function (state) {
      state.current = state.target;
      applyProgress(state);
    });
  }

  window.addEventListener('scroll', requestRender, { passive: true });
  window.addEventListener('resize', requestRender, { passive: true });
  window.addEventListener('orientationchange', requestRender, { passive: true });
  window.addEventListener('pageshow', function () {
    lastTime = 0;
    snapToCurrentScroll();
  });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      lastTime = 0;
      snapToCurrentScroll();
    });
  }

  snapToCurrentScroll();
})();

// ── Outside Design: pointer-following 3D card tilt ──
// Tuned to the interaction used by the #the-human reference: rotation eases
// toward the pointer while scale enters and returns on a damped spring.
(function () {
  if (!window.matchMedia ||
      !window.matchMedia('(hover: hover) and (pointer: fine)').matches ||
      window.matchMedia('(max-width: 734px)').matches ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var cards = document.querySelectorAll('.ab-gallery-card');
  if (!cards.length) return;

  var MAX_TILT = 14;
  var PERSPECTIVE = 800;
  var ROTATION_EASE = 0.22;
  var HOVER_SCALE = 1.035;
  var SPRING_STIFFNESS = 0.14;
  var SPRING_DAMPING = 0.72;
  var REST_THRESHOLD = 0.01;

  Array.prototype.forEach.call(cards, function (card) {
    var frame = null;
    var active = false;
    var pendingPointer = null;
    var cachedRect = null;
    var targetX = 0;
    var targetY = 0;
    var currentX = 0;
    var currentY = 0;
    var targetScale = 1;
    var currentScale = 1;
    var scaleVelocity = 0;

    function readPointer() {
      if (!pendingPointer) return;
      if (!cachedRect) cachedRect = card.getBoundingClientRect();

      var relativeX = (pendingPointer.clientX - cachedRect.left) / cachedRect.width;
      var relativeY = (pendingPointer.clientY - cachedRect.top) / cachedRect.height;
      targetY = (relativeX - 0.5) * MAX_TILT * 2;
      targetX = -(relativeY - 0.5) * MAX_TILT * 2;
      pendingPointer = null;
    }

    function render() {
      readPointer();

      var deltaX = targetX - currentX;
      var deltaY = targetY - currentY;
      currentX += deltaX * ROTATION_EASE;
      currentY += deltaY * ROTATION_EASE;

      scaleVelocity += (targetScale - currentScale) * SPRING_STIFFNESS;
      scaleVelocity *= SPRING_DAMPING;
      currentScale += scaleVelocity;

      card.style.transform =
        'perspective(' + PERSPECTIVE + 'px) ' +
        'rotateX(' + currentX.toFixed(3) + 'deg) ' +
        'rotateY(' + currentY.toFixed(3) + 'deg) ' +
        'scale(' + currentScale.toFixed(4) + ')';

      var rotationSettled =
        Math.abs(deltaX) < REST_THRESHOLD &&
        Math.abs(deltaY) < REST_THRESHOLD;
      var scaleSettled =
        Math.abs(targetScale - currentScale) < 0.0005 &&
        Math.abs(scaleVelocity) < 0.0005;

      if (active || !rotationSettled || !scaleSettled) {
        frame = window.requestAnimationFrame(render);
        return;
      }

      frame = null;
      currentScale = 1;
      scaleVelocity = 0;
      cachedRect = null;
      card.style.transform = '';
    }

    function schedule() {
      if (frame === null) frame = window.requestAnimationFrame(render);
    }

    card.addEventListener('mouseenter', function () {
      active = true;
      targetScale = HOVER_SCALE;
      cachedRect = card.getBoundingClientRect();
      card.classList.add('is-tilting');
      schedule();
    });

    card.addEventListener('mousemove', function (event) {
      pendingPointer = event;
      schedule();
    }, { passive: true });

    card.addEventListener('mouseleave', function () {
      active = false;
      targetX = 0;
      targetY = 0;
      targetScale = 1;
      pendingPointer = null;
      card.classList.remove('is-tilting');
      schedule();
    });
  });
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
  var root = document.documentElement;
  if (root.classList.contains('from-home-curtain') &&
      !root.classList.contains('is-about-ready')) {
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
