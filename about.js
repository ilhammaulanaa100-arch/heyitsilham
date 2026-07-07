// About page — clock, theme switcher (same behavior as home.js), work-experience counter.

// ── Clock ──
function updateTime() {
  var t = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Jakarta'
  }).format(new Date());
  document.getElementById('jakarta-time').textContent = t.replace(/^0/, '');
}
updateTime();
setInterval(updateTime, 1000);

// ── Theme toggle (single icon, circular view-transition reveal) ──
(function () {
  var root = document.documentElement;
  var btn  = document.getElementById('theme-switch');
  if (!btn) return;
  function apply() {
    var dark = root.classList.toggle('dark');
    try { localStorage.setItem('porto-theme', dark ? 'dark' : 'light'); } catch (e) {}
  }
  btn.addEventListener('click', function () {
    if (!document.startViewTransition) { apply(); return; }
    var r = btn.getBoundingClientRect();
    var x = r.left + r.width / 2;
    var y = r.top + r.height / 2;
    var endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );
    document.startViewTransition(apply).ready.then(function () {
      root.animate(
        { clipPath: [
            'circle(0px at ' + x + 'px ' + y + 'px)',
            'circle(' + endRadius + 'px at ' + x + 'px ' + y + 'px)'
          ] },
        { duration: 800, easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          pseudoElement: '::view-transition-new(root)' }
      );
    });
  });
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
