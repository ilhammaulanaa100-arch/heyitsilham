(function () {
  'use strict';

  var gsap = window.gsap;
  if (!gsap) {
    document.getElementById('lab-current').textContent = 'GSAP failed to load';
    return;
  }

  var VARIANTS = {
    film:  { label: 'Film Dissolve' },
    focus: { label: 'Rack Focus' },
    bloom: { label: 'Luminance Bloom' }
  };

  var currentVariant = 'film';
  var timeline = null;
  var progressRaf = 0;
  var runToken = 0;
  var noiseThresholds = null;
  var noiseImage = null;

  var homeFrame = document.getElementById('lab-home');
  var homeLayer = document.getElementById('lab-home-layer');
  var splash = document.getElementById('lab-splash');
  var black = document.getElementById('lab-black');
  var noise = document.getElementById('lab-noise');
  var bloom = document.getElementById('lab-bloom');
  var exposure = document.getElementById('lab-exposure');
  var status = document.getElementById('lab-status');
  var logo = document.getElementById('lab-logo-media');
  var video = document.getElementById('lab-logo-video');
  var counter = document.getElementById('lab-counter');
  var currentLabel = document.getElementById('lab-current');
  var variantButtons = Array.prototype.slice.call(document.querySelectorAll('[data-variant]'));

  function seededRandom(seed) {
    var value = seed >>> 0;
    return function () {
      value += 0x6D2B79F5;
      var t = value;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function resizeNoise() {
    var width = Math.max(180, Math.ceil(window.innerWidth / 3));
    var height = Math.max(120, Math.ceil(window.innerHeight / 3));
    if (noise.width === width && noise.height === height && noiseThresholds) return;

    noise.width = width;
    noise.height = height;
    noiseThresholds = new Float32Array(width * height);
    noiseImage = noise.getContext('2d').createImageData(width, height);
    var random = seededRandom(72617325);
    for (var i = 0; i < noiseThresholds.length; i++) noiseThresholds[i] = random();
  }

  function drawDissolve(progress) {
    resizeNoise();
    var data = noiseImage.data;
    var feather = 0.085;
    for (var i = 0; i < noiseThresholds.length; i++) {
      var alpha = Math.max(0, Math.min(1, (noiseThresholds[i] - progress) / feather));
      var offset = i * 4;
      data[offset] = 0;
      data[offset + 1] = 0;
      data[offset + 2] = 0;
      data[offset + 3] = Math.round(alpha * 255);
    }
    noise.getContext('2d').putImageData(noiseImage, 0, 0);
  }

  function killRun() {
    runToken++;
    cancelAnimationFrame(progressRaf);
    if (timeline) timeline.kill();
    timeline = null;
    video.pause();
    gsap.killTweensOf([homeLayer, splash, black, noise, bloom, exposure, status, logo, counter]);
  }

  function resetVisuals() {
    splash.style.display = 'block';
    gsap.set(splash, { opacity: 1 });
    gsap.set(status, { opacity: 1, filter: 'none' });
    gsap.set(logo, { opacity: 1, scale: 1, filter: 'none' });
    gsap.set(counter, { opacity: 1, x: 0, filter: 'none' });
    gsap.set(bloom, { opacity: 0, filter: 'blur(28px) saturate(130%)' });
    gsap.set(exposure, { opacity: 0 });
    gsap.set(homeLayer, { opacity: 1, scale: 1, filter: 'none' });

    if (currentVariant === 'film') {
      gsap.set(black, { opacity: 0 });
      gsap.set(noise, { display: 'block', opacity: 1 });
      gsap.set(homeLayer, { filter: 'brightness(0.84) contrast(1.05)' });
      drawDissolve(-0.09);
    } else if (currentVariant === 'focus') {
      gsap.set(black, { opacity: 1 });
      gsap.set(noise, { display: 'none', opacity: 0 });
      gsap.set(homeLayer, { scale: 1.018, filter: 'blur(13px) brightness(0.56)' });
    } else {
      gsap.set(black, { opacity: 1 });
      gsap.set(noise, { display: 'none', opacity: 0 });
      gsap.set(homeLayer, { scale: 1.006, filter: 'brightness(0.48) saturate(0.72) contrast(1.08)' });
    }
  }

  function transitionFilm() {
    var dissolve = { progress: -0.09 };
    timeline = gsap.timeline({
      onComplete: function () {
        splash.style.display = 'none';
        gsap.set(homeLayer, { clearProps: 'filter,transform' });
      }
    });
    timeline
      .to(status, { opacity: 0, duration: 0.36, ease: 'sine.in' }, 0)
      .to(dissolve, {
        progress: 1.09,
        duration: 0.96,
        ease: 'sine.inOut',
        onUpdate: function () { drawDissolve(dissolve.progress); }
      }, 0.08)
      .to(homeLayer, { filter: 'brightness(1) contrast(1)', duration: 0.9, ease: 'sine.inOut' }, 0.08);
  }

  function transitionFocus() {
    timeline = gsap.timeline({
      onComplete: function () {
        splash.style.display = 'none';
        gsap.set(homeLayer, { clearProps: 'filter,transform' });
      }
    });
    timeline
      .to(status, { opacity: 0, filter: 'blur(10px)', duration: 0.5, ease: 'sine.in' }, 0)
      .to(black, { opacity: 0, duration: 0.88, ease: 'sine.inOut' }, 0.08)
      .to(homeLayer, {
        scale: 1,
        filter: 'blur(0px) brightness(1)',
        duration: 1.05,
        ease: 'sine.inOut'
      }, 0.04);
  }

  function transitionBloom() {
    timeline = gsap.timeline({
      onComplete: function () {
        splash.style.display = 'none';
        gsap.set(homeLayer, { clearProps: 'filter,transform' });
      }
    });
    timeline
      .to(counter, { opacity: 0, duration: 0.28, ease: 'sine.in' }, 0)
      .to(logo, {
        opacity: 0,
        scale: 1.025,
        filter: 'brightness(2.1) saturate(1.35) drop-shadow(0 0 18px rgba(82,237,226,.55))',
        duration: 0.5,
        ease: 'sine.inOut'
      }, 0)
      .to(bloom, { opacity: 0.7, filter: 'blur(20px) saturate(145%)', duration: 0.38, ease: 'sine.out' }, 0.04)
      .to(exposure, { opacity: 0.42, duration: 0.28, ease: 'sine.out' }, 0.12)
      .to(black, { opacity: 0, duration: 0.82, ease: 'sine.inOut' }, 0.16)
      .to(homeLayer, {
        scale: 1,
        filter: 'brightness(1) saturate(1) contrast(1)',
        duration: 0.92,
        ease: 'sine.inOut'
      }, 0.14)
      .to(exposure, { opacity: 0, duration: 0.48, ease: 'sine.inOut' }, 0.38)
      .to(bloom, { opacity: 0, filter: 'blur(44px) saturate(100%)', duration: 0.62, ease: 'sine.inOut' }, 0.36);
  }

  function startTransition(token) {
    if (token !== runToken) return;
    counter.textContent = '100%';
    if (currentVariant === 'film') transitionFilm();
    else if (currentVariant === 'focus') transitionFocus();
    else transitionBloom();
  }

  function playRun(mode) {
    killRun();
    var token = runToken;
    resetVisuals();
    var startProgress = mode === 'full' ? 0 : 0.68;
    counter.textContent = Math.floor(startProgress * 100) + '%';

    function begin() {
      if (token !== runToken) return;
      var duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 2.083;
      var targetTime = duration * startProgress;
      var clockDuration = Math.max(240, duration * (1 - startProgress) * 1000);
      var hasStarted = false;

      function startPlayback() {
        if (hasStarted || token !== runToken) return;
        hasStarted = true;
        var playPromise = video.play();
        if (playPromise && playPromise.catch) playPromise.catch(function () {});
        var startedAt = performance.now();

        function tick(now) {
          if (token !== runToken) return;
          var elapsedProgress = Math.min(1, (now - startedAt) / clockDuration);
          var progress = startProgress + elapsedProgress * (1 - startProgress);
          counter.textContent = Math.floor(progress * 100) + '%';
          if (elapsedProgress >= 1) {
            startTransition(token);
            return;
          }
          progressRaf = requestAnimationFrame(tick);
        }
        progressRaf = requestAnimationFrame(tick);
      }

      video.pause();
      if (Math.abs(video.currentTime - targetTime) > 0.025) {
        video.addEventListener('seeked', startPlayback, { once: true });
        video.currentTime = targetTime;
        window.setTimeout(startPlayback, 180);
      } else {
        startPlayback();
      }
    }

    if (video.readyState >= 1) begin();
    else video.addEventListener('loadedmetadata', begin, { once: true });
  }

  function selectVariant(name, shouldPlay) {
    if (!VARIANTS[name]) return;
    currentVariant = name;
    currentLabel.textContent = VARIANTS[name].label;
    variantButtons.forEach(function (button) {
      var active = button.getAttribute('data-variant') === name;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    if (shouldPlay !== false) playRun('quick');
  }

  variantButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      selectVariant(button.getAttribute('data-variant'));
    });
  });

  document.getElementById('lab-replay').addEventListener('click', function () { playRun('quick'); });
  document.getElementById('lab-full-run').addEventListener('click', function () { playRun('full'); });
  window.addEventListener('resize', function () {
    noiseThresholds = null;
    noiseImage = null;
    if (currentVariant === 'film' && splash.style.display !== 'none') drawDissolve(-0.09);
  }, { passive: true });

  document.addEventListener('keydown', function (event) {
    if (event.key === '1') selectVariant('film');
    else if (event.key === '2') selectVariant('focus');
    else if (event.key === '3') selectVariant('bloom');
    else if (event.code === 'Space') {
      event.preventDefault();
      playRun('quick');
    }
  });

  selectVariant('film', false);

  var initialRunStarted = false;
  function prepareHomeFrame() {
    try {
      var frameDocument = homeFrame.contentDocument;
      var frameSplash = frameDocument && frameDocument.getElementById('splash');
      var framePortfolio = frameDocument && frameDocument.querySelector('.porto');
      if (frameSplash) frameSplash.style.display = 'none';
      if (framePortfolio) framePortfolio.style.opacity = '1';
    } catch (error) {}
  }

  function startInitialRun() {
    prepareHomeFrame();
    if (initialRunStarted) return;
    initialRunStarted = true;
    window.setTimeout(function () { playRun('full'); }, 250);
  }

  homeFrame.addEventListener('load', startInitialRun, { once: true });
  if (homeFrame.contentDocument && homeFrame.contentDocument.readyState === 'complete') startInitialRun();
})();
