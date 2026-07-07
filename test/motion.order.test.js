const assert = require('assert');

// Load motion.js in a minimal global shim (no DOM needed for orderByTop).
global.window = { matchMedia: () => ({ matches: false }) };
require('../motion.js');
const Motion = global.window.Motion;

// orderByTop sorts ascending by .top, treating plain objects with a .top field.
const items = [{ top: 30 }, { top: 10 }, { top: 20 }];
const sorted = Motion.orderByTop(items);
assert.deepStrictEqual(sorted.map(i => i.top), [10, 20, 30], 'must sort ascending by top');
// input array must not be mutated
assert.deepStrictEqual(items.map(i => i.top), [30, 10, 20], 'must not mutate input');
console.log('OK motion.order');
