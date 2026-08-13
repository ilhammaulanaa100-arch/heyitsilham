const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const projectRoot = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(projectRoot, file), 'utf8');

const vercelConfig = JSON.parse(read('vercel.json'));
assert.equal(vercelConfig.cleanUrls, true, 'Vercel must remove .html extensions');
assert.equal(vercelConfig.trailingSlash, false, 'public routes must not end in a slash');
assert.ok(
  vercelConfig.rewrites.some((route) => route.source === '/our-work/:slug' && route.destination === '/case-study'),
  'project routes must resolve through the standalone case-study template'
);

const routeContext = {
  window: { location: { pathname: '/', search: '' } },
  URLSearchParams,
  encodeURIComponent,
  decodeURIComponent
};
vm.runInNewContext(read('case-study.js'), routeContext, { filename: 'case-study.js' });
const routes = routeContext.window.CaseStudy;

assert.equal(routes.projectPath('byond'), '/our-work/byond');
assert.equal(routes.projectPath('porto2026'), '/our-work/qita-by-bri', 'legacy Qita slug must migrate');
assert.equal(
  routes.projectSlugFromLocation({ pathname: '/our-work/byond', search: '' }),
  'byond'
);
assert.equal(
  routes.projectSlugFromLocation({ pathname: '/case-study', search: '?p=byond' }),
  'byond',
  'legacy query URLs must remain resolvable during migration'
);

const contentContext = {};
vm.runInNewContext(`${read('content.js')}\nglobalThis.__projects = PROJECTS;`, contentContext);
const projectSlugs = contentContext.__projects.map((project) => project.slug);
const sitemap = read('sitemap.xml');

assert.match(sitemap, /<loc>https:\/\/heyitsilham\.com\/about<\/loc>/);
for (const slug of projectSlugs) {
  assert.match(
    sitemap,
    new RegExp(`<loc>https://heyitsilham\\.com/our-work/${slug}</loc>`),
    `sitemap must include the clean URL for ${slug}`
  );
}

const publicMarkup = [read('index.html'), read('about.html'), read('case-study.html')].join('\n');
assert.doesNotMatch(publicMarkup, /href="[^"]*\.html(?:[?#][^"]*)?"/, 'public links must not expose .html');
assert.doesNotMatch(read('home.js'), /case-study\.html\?p=/, 'homepage history must use clean project paths');
