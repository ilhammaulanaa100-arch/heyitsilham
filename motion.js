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
