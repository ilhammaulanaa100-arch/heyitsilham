const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const caseStudySource = fs.readFileSync(path.join(projectRoot, 'case-study.js'), 'utf8');
const caseStudyStyles = fs.readFileSync(path.join(projectRoot, 'case-study.css'), 'utf8');
const homeHtml = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
const standaloneHtml = fs.readFileSync(path.join(projectRoot, 'case-study.html'), 'utf8');

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
assert.match(
  caseStudyStyles,
  /@media \(max-width: 900px\)[\s\S]*?\.cs-right-close\s*\{\s*display:\s*none;\s*\}[\s\S]*?\.cs-mobile-close\s*\{[\s\S]*?display:\s*inline-flex;/,
  'mobile must use the close control outside the native scroll container'
);
for (const [name, html] of [['homepage overlay', homeHtml], ['standalone case study', standaloneHtml]]) {
  assert.match(html, /id="cs-mobile-close"/, `${name} must render a viewport-level mobile close control`);
}

console.log('OK case-study touch scroll');
