const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const homeSource = fs.readFileSync(path.resolve(__dirname, '..', 'home.js'), 'utf8');
const hydrateStart = homeSource.indexOf('function hydrateCardImage(');
const hydrateEnd = homeSource.indexOf('\n  function hydrateCardWindow(', hydrateStart);

assert.notEqual(hydrateStart, -1, 'hydrateCardImage must exist');
assert.notEqual(hydrateEnd, -1, 'hydrateCardImage must have a detectable boundary');

const hydrateSource = homeSource.slice(hydrateStart, hydrateEnd);
const assignSourceAt = hydrateSource.indexOf("img.src = img.getAttribute('data-src')");
const trackImageAt = hydrateSource.indexOf('trackCardImage(img, card)');

assert.notEqual(assignSourceAt, -1, 'hydrateCardImage must assign the deferred image source');
assert.notEqual(trackImageAt, -1, 'hydrateCardImage must track image loading');
assert.ok(
  assignSourceAt < trackImageAt,
  'the deferred src must be assigned before trackCardImage checks img.complete'
);
