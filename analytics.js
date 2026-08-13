/* Privacy-minded, production-only analytics for heyitsilham.com. */
(function (global) {
  'use strict';

  var WEBSITE_ID = 'e51e11a7-e1ed-4005-ba71-878afc3c2739';
  var TRACKER_URL = 'https://cloud.umami.is/script.js';
  var PRODUCTION_HOSTS = ['heyitsilham.com', 'www.heyitsilham.com'];
  var MAX_QUEUED_EVENTS = 20;
  var ENGAGED_SECONDS = 15;
  var ENGAGED_SCROLL_RATIO = 0.4;

  var queue = [];
  var trackerStarted = false;
  var currentProject = null;

  function isProduction() {
    return PRODUCTION_HOSTS.indexOf(global.location.hostname) !== -1;
  }

  function doNotTrackEnabled() {
    return global.navigator.doNotTrack === '1' ||
      global.doNotTrack === '1' ||
      global.navigator.msDoNotTrack === '1';
  }

  function analyticsEnabled() {
    return isProduction() && !doNotTrackEnabled();
  }

  function sessionHas(key) {
    try { return global.sessionStorage.getItem('porto-analytics:' + key) === '1'; }
    catch (error) { return false; }
  }

  function rememberSession(key) {
    try { global.sessionStorage.setItem('porto-analytics:' + key, '1'); }
    catch (error) {}
  }

  function send(event) {
    if (!global.umami || typeof global.umami.track !== 'function') return false;
    try {
      if (event.data && Object.keys(event.data).length) global.umami.track(event.name, event.data);
      else global.umami.track(event.name);
      return true;
    } catch (error) {
      return false;
    }
  }

  function flushQueue() {
    if (!global.umami || typeof global.umami.track !== 'function') return;
    var pending = queue.slice();
    queue.length = 0;
    pending.forEach(function (event) {
      if (!send(event) && queue.length < MAX_QUEUED_EVENTS) queue.push(event);
    });
  }

  function track(name, data, options) {
    options = options || {};
    if (!analyticsEnabled() || !name) return false;

    if (options.once && sessionHas(options.once)) return false;
    if (options.once) rememberSession(options.once);

    var event = { name: name, data: data || null };
    if (!send(event) && queue.length < MAX_QUEUED_EVENTS) queue.push(event);
    return true;
  }

  function startTracker() {
    if (trackerStarted || !analyticsEnabled()) return;
    trackerStarted = true;

    var script = document.createElement('script');
    script.defer = true;
    script.src = TRACKER_URL;
    script.setAttribute('data-website-id', WEBSITE_ID);
    script.setAttribute('data-domains', PRODUCTION_HOSTS.join(','));
    script.setAttribute('data-do-not-track', 'true');
    script.addEventListener('load', flushQueue, { once: true });
    script.addEventListener('error', function () { queue.length = 0; }, { once: true });
    document.head.appendChild(script);
  }

  function stopProjectEngagement() {
    if (!currentProject) return;
    if (currentProject.timer) global.clearInterval(currentProject.timer);
    if (currentProject.scrollEl && currentProject.onScroll) {
      currentProject.scrollEl.removeEventListener('scroll', currentProject.onScroll);
    }
    currentProject = null;
  }

  function scrollRatio(element) {
    if (!element) return 0;
    if (element.clientHeight <= 0) return 0;
    var maxScroll = Math.max(0, element.scrollHeight - element.clientHeight);
    return maxScroll === 0 ? 1 : Math.min(1, Math.max(0, element.scrollTop / maxScroll));
  }

  function projectOpened(slug, source, scrollEl) {
    if (!slug || !analyticsEnabled()) return;
    stopProjectEngagement();

    // The homepage updates its History API URL immediately after opening the
    // overlay. Defer one task so Umami associates this event with that URL.
    global.setTimeout(function () {
      track('project_open', { project: slug, source: source || 'direct' }, {
        once: 'project-open:' + slug
      });
    }, 0);

    if (sessionHas('project-engaged:' + slug)) return;

    currentProject = {
      slug: slug,
      scrollEl: scrollEl || null,
      activeSeconds: 0,
      depthMet: false,
      timer: null,
      onScroll: null
    };

    function updateDepth() {
      if (!currentProject || currentProject.slug !== slug) return;
      if (scrollRatio(currentProject.scrollEl) >= ENGAGED_SCROLL_RATIO) currentProject.depthMet = true;
    }

    function maybeTrackEngagement() {
      if (!currentProject || currentProject.slug !== slug) return;
      if (document.visibilityState === 'visible' || !document.visibilityState) {
        currentProject.activeSeconds += 1;
      }
      updateDepth();
      if (currentProject.activeSeconds < ENGAGED_SECONDS || !currentProject.depthMet) return;

      track('project_engaged', { project: slug }, { once: 'project-engaged:' + slug });
      stopProjectEngagement();
    }

    currentProject.onScroll = updateDepth;
    if (currentProject.scrollEl) {
      currentProject.scrollEl.addEventListener('scroll', currentProject.onScroll, { passive: true });
    }
    updateDepth();
    currentProject.timer = global.setInterval(maybeTrackEngagement, 1000);
  }

  function closestLink(target) {
    if (!target) return null;
    if (typeof target.closest === 'function') return target.closest('a[href]');
    return null;
  }

  function currentProjectSlug() {
    var match = (global.location.pathname || '').match(/^\/our-work\/([^/]+)\/?$/);
    if (match) {
      try { return decodeURIComponent(match[1]); }
      catch (error) { return match[1]; }
    }
    try { return new URLSearchParams(global.location.search).get('p') || ''; }
    catch (error) { return ''; }
  }

  function installInteractionTracking() {
    document.addEventListener('click', function (event) {
      var link = closestLink(event.target);
      if (!link) return;

      var href = link.getAttribute('href') || '';
      if (href.toLowerCase().indexOf('mailto:') === 0) {
        track('contact_intent', { method: 'email-link' }, { once: 'contact:email-link' });
        return;
      }

      if (link.classList && link.classList.contains('site-menu-social')) {
        var platform = (link.getAttribute('aria-label') || 'social').toLowerCase();
        track('social_click', { platform: platform }, { once: 'social:' + platform });
        return;
      }

      if (link.classList && link.classList.contains('cs-applink')) {
        var slug = currentProjectSlug();
        track('project_link_click', slug ? { project: slug } : null, {
          once: 'project-link:' + (slug || href)
        });
      }
    });
  }

  installInteractionTracking();

  // Speculation Rules prerender the homepage from the About page. Loading only
  // after activation prevents an unseen prerender from becoming a pageview.
  if (document.prerendering) {
    document.addEventListener('prerenderingchange', startTracker, { once: true });
  } else {
    startTracker();
  }

  global.PortoAnalytics = {
    track: track,
    projectOpened: projectOpened,
    projectClosed: stopProjectEngagement,
    enabled: analyticsEnabled
  };
})(window);
