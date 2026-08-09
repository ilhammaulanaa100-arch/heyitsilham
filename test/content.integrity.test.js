const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const projectRoot = path.resolve(__dirname, '..');
const contentSource = fs.readFileSync(path.join(projectRoot, 'content.js'), 'utf8');
const context = {};
vm.runInNewContext(`${contentSource}\nglobalThis.__projects = PROJECTS;`, context);

const projects = context.__projects;
const allowedShapes = new Set(['is-portrait', 'is-square', 'is-landscape']);
const allowedLayouts = new Set(['full', 'split-square-left', 'split-square-right']);

assert.ok(Array.isArray(projects) && projects.length > 0, 'PROJECTS must be a non-empty array');
assert.equal(new Set(projects.map((project) => project.slug)).size, projects.length, 'project slugs must be unique');

for (const project of projects) {
  assert.match(project.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, `invalid slug: ${project.slug}`);
  assert.ok(project.period && project.subtitle && project.title, `${project.slug} is missing display copy`);
  assert.ok(allowedShapes.has(project.shape), `${project.slug} has an unsupported shape`);
  assert.ok(project.media && project.media.hero, `${project.slug} is missing its hero image`);
  assert.ok(fs.existsSync(path.join(projectRoot, project.media.hero)), `${project.slug} hero image does not exist`);

  if (project.sourceUrl) {
    const sourceUrl = new URL(project.sourceUrl);
    assert.equal(sourceUrl.protocol, 'https:', `${project.slug} source URL must use HTTPS`);
  }

  for (const section of project.media.gallery || []) {
    assert.ok(allowedLayouts.has(section.layout), `${project.slug} has an unsupported gallery layout`);
    const requiredItems = section.layout === 'full' ? 1 : 2;
    assert.equal(section.items.length, requiredItems, `${project.slug} gallery layout has the wrong item count`);
    for (const item of section.items) {
      assert.ok(item.src && item.alt, `${project.slug} gallery items require src and alt text`);
      assert.ok(fs.existsSync(path.join(projectRoot, item.src)), `${project.slug} gallery asset does not exist: ${item.src}`);
    }
  }

  for (const videoField of ['video', 'videoAfterGallery']) {
    const videoPath = project.media[videoField];
    if (videoPath) {
      assert.ok(fs.existsSync(path.join(projectRoot, videoPath)), `${project.slug} video does not exist: ${videoPath}`);
    }
  }
}
