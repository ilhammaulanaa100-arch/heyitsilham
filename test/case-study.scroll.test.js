const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const caseStudySource = fs.readFileSync(path.join(projectRoot, 'case-study.js'), 'utf8');
const caseStudyStyles = fs.readFileSync(path.join(projectRoot, 'case-study.css'), 'utf8');

assert.match(
  caseStudySource,
  /navigator\.maxTouchPoints > 0/,
  'touch-capable devices must be detected before Lenis takes ownership'
);
assert.match(
  caseStudySource,
  /if \(window\.Lenis && !usesTouchScrolling\)/,
  'Lenis must not lock the scroll wrapper on touch devices'
);
assert.match(
  caseStudyStyles,
  /\.cs-right\s*\{[^}]*overflow-y:\s*auto;[^}]*-webkit-overflow-scrolling:\s*touch;[^}]*touch-action:\s*pan-y;/s,
  'the case-study panel must preserve native vertical momentum scrolling'
);

console.log('OK case-study touch scroll');
