const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const projectRoot = path.resolve(__dirname, '..');
const analyticsSource = fs.readFileSync(path.join(projectRoot, 'analytics.js'), 'utf8');

function eventTarget(initial = {}) {
  const listeners = new Map();
  return Object.assign(initial, {
    addEventListener(type, listener) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(listener);
    },
    removeEventListener(type, listener) {
      const list = listeners.get(type) || [];
      listeners.set(type, list.filter((candidate) => candidate !== listener));
    },
    dispatch(type, event = {}) {
      (listeners.get(type) || []).slice().forEach((listener) => listener(event));
    }
  });
}

function createEnvironment(options = {}) {
  const appendedScripts = [];
  const timeouts = [];
  const intervals = new Map();
  const stored = new Map();
  let nextTimer = 1;

  const document = eventTarget({
    prerendering: Boolean(options.prerendering),
    visibilityState: 'visible',
    head: {
      appendChild(script) { appendedScripts.push(script); }
    },
    createElement(tagName) {
      const attributes = new Map();
      return eventTarget({
        tagName: tagName.toUpperCase(),
        setAttribute(name, value) { attributes.set(name, String(value)); },
        getAttribute(name) { return attributes.get(name) || null; }
      });
    }
  });

  const window = {
    document,
    location: {
      hostname: options.hostname || 'heyitsilham.com',
      search: options.search || '',
      href: 'https://' + (options.hostname || 'heyitsilham.com') + '/'
    },
    navigator: { doNotTrack: options.doNotTrack || '0', msDoNotTrack: '0' },
    sessionStorage: {
      getItem(key) { return stored.has(key) ? stored.get(key) : null; },
      setItem(key, value) { stored.set(key, String(value)); }
    },
    setTimeout(callback) { timeouts.push(callback); return nextTimer++; },
    clearTimeout() {},
    setInterval(callback) {
      const id = nextTimer++;
      intervals.set(id, callback);
      return id;
    },
    clearInterval(id) { intervals.delete(id); }
  };

  const context = {
    window,
    document,
    location: window.location,
    navigator: window.navigator,
    URLSearchParams,
    Object
  };
  vm.runInNewContext(analyticsSource, context, { filename: 'analytics.js' });

  return {
    window,
    document,
    appendedScripts,
    timeouts,
    intervals,
    runTimeouts() {
      while (timeouts.length) timeouts.shift()();
    }
  };
}

{
  const env = createEnvironment({ hostname: 'localhost' });
  assert.equal(env.window.PortoAnalytics.enabled(), false);
  assert.equal(env.appendedScripts.length, 0, 'localhost must not load Umami');
  assert.equal(env.window.PortoAnalytics.track('test'), false, 'localhost must not queue events');
}

{
  const env = createEnvironment();
  assert.equal(env.window.PortoAnalytics.enabled(), true);
  assert.equal(env.appendedScripts.length, 1, 'production must load Umami once');
  const script = env.appendedScripts[0];
  assert.equal(script.src, 'https://cloud.umami.is/script.js');
  assert.equal(script.getAttribute('data-website-id'), 'e51e11a7-e1ed-4005-ba71-878afc3c2739');
  assert.equal(script.getAttribute('data-domains'), 'heyitsilham.com,www.heyitsilham.com');
  assert.equal(script.getAttribute('data-do-not-track'), 'true');

  const sent = [];
  env.window.PortoAnalytics.track('queued_event', { source: 'test' });
  env.window.umami = { track(...args) { sent.push(args); } };
  script.dispatch('load');
  assert.deepEqual(sent, [['queued_event', { source: 'test' }]], 'events must flush after Umami loads');
}

{
  const env = createEnvironment({ prerendering: true });
  assert.equal(env.appendedScripts.length, 0, 'prerender must not load Umami');
  env.document.prerendering = false;
  env.document.dispatch('prerenderingchange');
  assert.equal(env.appendedScripts.length, 1, 'activation must load Umami');
}

{
  const env = createEnvironment({ doNotTrack: '1' });
  assert.equal(env.window.PortoAnalytics.enabled(), false);
  assert.equal(env.appendedScripts.length, 0, 'Do Not Track must prevent collection');
}

{
  const env = createEnvironment();
  const sent = [];
  env.window.umami = { track(...args) { sent.push(args); } };
  env.appendedScripts[0].dispatch('load');

  const scrollEl = eventTarget({ scrollHeight: 1000, clientHeight: 500, scrollTop: 250 });
  env.window.PortoAnalytics.projectOpened('byond', 'grid', scrollEl);
  env.runTimeouts();
  assert.equal(
    JSON.stringify(sent[0]),
    JSON.stringify(['project_open', { project: 'byond', source: 'grid' }])
  );

  for (let second = 0; second < 15; second += 1) {
    const timer = Array.from(env.intervals.values())[0];
    assert.ok(timer, 'engagement timer must remain active until the threshold');
    timer();
  }
  assert.equal(
    JSON.stringify(sent[1]),
    JSON.stringify(['project_engaged', { project: 'byond' }])
  );
  assert.equal(env.intervals.size, 0, 'engagement must stop after it is recorded');

  env.window.PortoAnalytics.projectOpened('byond', 'list', scrollEl);
  env.runTimeouts();
  assert.equal(sent.length, 2, 'project events must be deduplicated per session');
}

for (const htmlFile of ['index.html', 'about.html', 'case-study.html']) {
  const html = fs.readFileSync(path.join(projectRoot, htmlFile), 'utf8');
  assert.match(html, /<script src="analytics\.js\?v=1"><\/script>/, `${htmlFile} must load analytics.js`);
}

console.log('OK analytics');
