/* Grid view — phantom.land-style infinite curved grid, WebGL (three.js).
   The grid is rendered flat into a render target, then a fullscreen fisheye
   pass bends the whole frame concave (centre magnified, edges curving away),
   so the warp is continuous — it bends inside the images too.
   Loads after content.js (PROJECTS). Exposes window.GridView { show, hide, isOpen }.
   Emits 'grid-open-project' (detail: { index }) when a cell is clicked. */
window.GridView = (function () {
  'use strict';

  // ── Tuning knobs ──
  var DISTORTION = 0.25;  // concave strength (higher = corners stretch/bend away more)
  var ZOOM       = 1.12;  // camera zoom-out (1.12 ≈ view at ~90%)
  var VIGNETTE   = 0.55;  // edge darkening 0..1
  var HOLD_ZOOM  = 0.7;   // camera zoom while click is held (~30% further out)
  var HOVER_LERP = 0.16;  // hover tint ease speed
  var LERP       = 0.085; // scroll smoothing
  var FRICTION   = 0.94;  // drag momentum decay

  // PROJECTS tiled as PCOLS × PROWS, repeated infinitely both axes
  var PCOLS = 3, PROWS = 2;

  var viewEl;
  var built = false, open = false;
  var renderer, gridScene, camera, rt, postScene, postCam, postMat;
  var meshes = [], cells = [], textures = [], hoverColors = [], whiteColor;
  var unitGeo;

  var vw = 0, vh = 0, GW = 0, GH = 0, CELL_W = 0, CELL_H = 0, NX = 0, NY = 0;

  // Scroll state: sx/sy rendered, tx/ty target, vx/vy inertia
  var sx = 0, sy = 0, tx = 0, ty = 0, vx = 0, vy = 0;
  var rafId = null;
  var dragging = false, moved = 0, lastX = 0, lastY = 0;
  var pX = -1, pY = -1; // last pointer position (hover tint); -1 = none yet

  function mod(n, m) { return ((n % m) + m) % m; }

  // Cell palette follows the global theme (html.dark, toggled in home.js)
  function theme() {
    return document.documentElement.classList.contains('dark')
      ? { bg: '#0f0e0e', line: 'rgba(255,255,255,0.18)', text: '#fff', pill: 'rgba(255,255,255,0.35)', dim: 'rgba(255,255,255,0.8)' }
      : { bg: '#ffffff', line: 'rgba(0,0,0,0.18)',       text: '#000', pill: 'rgba(0,0,0,0.35)',       dim: 'rgba(0,0,0,0.8)' };
  }

  // ── Cell texture (canvas): outline, labels, tags, media ──
  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function gradColors(str) {
    var m = String(str).match(/#[0-9a-fA-F]{3,8}/g) || [];
    return [m[0] || '#333', m[1] || m[0] || '#111'];
  }

  function wrapRight(ctx, text, maxW) {
    var words = text.split(' '), lines = [], line = '';
    words.forEach(function (w) {
      var t = line ? line + ' ' + w : w;
      if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; }
      else line = t;
    });
    if (line) lines.push(line);
    return lines;
  }

  function drawCell(ctx, p, W, H, img) {
    var MONO = "500 13px 'SF Mono', Menlo, 'Courier New', monospace";
    var PAD = 26;
    var th = theme();

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = th.bg;
    ctx.fillRect(0, 0, W, H);

    // Cell outline
    ctx.strokeStyle = th.line;
    ctx.lineWidth = 1.5;
    rr(ctx, 6, 6, W - 12, H - 12, 14);
    ctx.stroke();

    // Media — centred square, cover-cropped
    var mw = Math.round(W * 0.58);
    var mx = (W - mw) / 2, my = (H - mw) / 2;
    if (img) {
      var s = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, mx, my, mw, mw);
    } else {
      var g = ctx.createLinearGradient(mx, my, mx + mw, my + mw);
      var cols = gradColors(p.color);
      g.addColorStop(0, cols[0]);
      g.addColorStop(1, cols[1]);
      ctx.fillStyle = g;
      ctx.fillRect(mx, my, mw, mw);
    }

    // Top-left: subtitle
    ctx.font = MONO;
    ctx.fillStyle = th.text;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText(String(p.subtitle || '').toUpperCase(), PAD, PAD);

    // Top-right: title, wrapped + right-aligned
    ctx.textAlign = 'right';
    var lines = wrapRight(ctx, String(p.title || '').toUpperCase(), W * 0.42);
    lines.slice(0, 3).forEach(function (ln, i) {
      ctx.fillText(ln, W - PAD, PAD + i * 19);
    });

    // Bottom-left: tag pills
    ctx.textAlign = 'left';
    ctx.font = "500 12px 'SF Mono', Menlo, 'Courier New', monospace";
    var pillH = 28, py = H - PAD - pillH, px = PAD;
    [p.category, p.meta && p.meta.role].filter(Boolean).forEach(function (t) {
      var label = String(t).toUpperCase();
      var tw = ctx.measureText(label).width;
      var pw = tw + 24;
      ctx.strokeStyle = th.pill;
      ctx.lineWidth = 1;
      rr(ctx, px, py, pw, pillH, pillH / 2);
      ctx.stroke();
      ctx.fillStyle = th.text;
      ctx.fillText(label, px + 12, py + 8);
      px += pw + 8;
    });

    // Bottom-right: year
    ctx.textAlign = 'right';
    ctx.font = MONO;
    ctx.fillStyle = th.dim;
    ctx.fillText(String(p.period || '').toUpperCase(), W - PAD, py + 8);
  }

  function makeTexture(p) {
    var W = 512, H = Math.round(512 * 1.06);
    var cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    var ctx = cv.getContext('2d');
    drawCell(ctx, p, W, H, null);
    var tex = new THREE.CanvasTexture(cv);
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    var cell = { p: p, ctx: ctx, tex: tex, img: null };
    if (p.media && p.media.hero) {
      var img = new Image();
      img.onload = function () { cell.img = img; drawCell(ctx, p, W, H, img); tex.needsUpdate = true; };
      img.src = p.media.hero;
    }
    cells.push(cell);
    return tex;
  }

  // Repaint every cell + scene/vignette colours for the current theme
  function setTheme() {
    if (!built) return;
    var th = theme();
    gridScene.background.set(th.bg);
    postMat.uniforms.uBg.value.set(th.bg);
    cells.forEach(function (c) {
      drawCell(c.ctx, c.p, c.ctx.canvas.width, c.ctx.canvas.height, c.img);
      c.tex.needsUpdate = true;
    });
  }

  // ── Concave (panoramic) post shader ──
  // Pincushion mapping: f = 1 at centre, f < 1 toward the corners, so the
  // corners get stretched outward and read as bending away from the camera —
  // straight rows bow toward the centre mid-screen and flare at the edges.
  var FRAG = [
    'varying vec2 vUv;',
    'uniform sampler2D tDiffuse;',
    'uniform float uStrength;',
    'uniform float uAspect;',
    'uniform float uVignette;',
    'uniform vec3 uBg;',
    'void main() {',
    '  vec2 uv = vUv - 0.5;',
    '  uv.x *= uAspect;',
    '  float rMax2 = 0.25 * (uAspect * uAspect + 1.0);',
    '  float r2 = dot(uv, uv);',
    '  float f = max(1.0 - uStrength * r2, 0.05);',
    '  vec2 duv = uv * f;',
    '  duv.x /= uAspect;',
    '  duv += 0.5;',
    '  vec4 c = texture2D(tDiffuse, duv);',
    '  float d = r2 / rMax2;',
    '  c.rgb = mix(c.rgb, uBg, uVignette * smoothstep(0.15, 1.0, d));',
    '  gl_FragColor = c;',
    '}'
  ].join('\n');

  var VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';

  // Same mapping as the shader, in JS — screen px → flat-grid px (for clicks)
  function screenToGrid(pxX, pxY) {
    var u = pxX / vw - 0.5, v = (1 - pxY / vh) - 0.5;
    var aspect = vw / vh;
    u *= aspect;
    var r2 = u * u + v * v;
    var f = Math.max(1 - DISTORTION * r2, 0.05);
    var du = (u * f) / aspect + 0.5;
    var dv = v * f + 0.5;
    // account for hold-zoom: camera sees a wider world slice around the same centre
    var z = camera ? camera.zoom : 1;
    return {
      x: GW / 2 + (du - 0.5) * GW / z,
      y: GH / 2 + (0.5 - dv) * GH / z
    }; // grid px, y down
  }

  // Inverse of screenToGrid: viewport-relative grid px (y down) → screen px,
  // through the CURRENT lens (uStrength) and camera zoom. Solving t·f(t) = d
  // for the radial pincushion needs a few Newton steps — no closed form.
  function gridToScreen(gx, gy) {
    var z = camera ? camera.zoom : 1;
    var aspect = vw / vh;
    var k = postMat ? postMat.uniforms.uStrength.value : DISTORTION;
    var dx = ((gx - GW / 2) * z / GW) * aspect;
    var dy = -((gy - GH / 2) * z / GH);
    var d = Math.sqrt(dx * dx + dy * dy);
    var t = d;
    for (var i = 0; i < 6; i++) {
      var g = t - k * t * t * t - d;
      var gp = 1 - 3 * k * t * t;
      if (Math.abs(gp) < 1e-6) break;
      t -= g / gp;
    }
    var s = d > 1e-6 ? t / d : 1;
    var u = dx * s, v = dy * s;
    return { x: (u / aspect + 0.5) * vw, y: (1 - (v + 0.5)) * vh };
  }

  // Screen rect of a cell's media square through the current (curved) lens.
  // Radial distortion bends a square slightly non-rectangular; the TL/BR
  // corner fit is within a couple px at DISTORTION 0.25 — fine for a FLIP seed.
  function cellScreenRect(col, row) {
    var mw = CELL_W * 0.58; // matches the media size drawn in the cell texture
    var x0 = col * CELL_W - sx + (CELL_W - mw) / 2;
    var y0 = row * CELL_H - sy + (CELL_H - mw) / 2;
    var tl = gridToScreen(x0, y0);
    var br = gridToScreen(x0 + mw, y0 + mw);
    return { left: tl.x, top: tl.y, width: br.x - tl.x, height: br.y - tl.y };
  }

  // ── Layout / mesh pool ──
  function layout() {
    vw = window.innerWidth;
    vh = window.innerHeight;
    GW = vw * ZOOM;  // the camera sees a zoomed-out (larger) slice of the grid
    GH = vh * ZOOM;
    CELL_W = Math.max(320, Math.round(vw / 3.5));
    CELL_H = Math.round(CELL_W * 1.06);
    // pool sized for the widest view (hold-zoom shows GW / HOLD_ZOOM of world)
    NX = Math.ceil(GW / HOLD_ZOOM / CELL_W) + 3;
    NY = Math.ceil(GH / HOLD_ZOOM / CELL_H) + 3;

    var pr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(pr);
    renderer.setSize(vw, vh);
    camera.left = -GW / 2; camera.right = GW / 2;
    camera.top = GH / 2; camera.bottom = -GH / 2;
    camera.updateProjectionMatrix();

    if (rt) rt.dispose();
    rt = new THREE.WebGLRenderTarget(vw * pr, vh * pr, {
      minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter
    });
    if (renderer.capabilities.isWebGL2) rt.samples = 4;
    postMat.uniforms.tDiffuse.value = rt.texture;
    postMat.uniforms.uAspect.value = vw / vh;

    meshes.forEach(function (m) { gridScene.remove(m); m.material.dispose(); });
    meshes = [];
    for (var i = 0; i < NX * NY; i++) {
      // own material per mesh so a single cell can tint on hover
      var m = new THREE.Mesh(unitGeo, new THREE.MeshBasicMaterial({ map: textures[0] }));
      m.scale.set(CELL_W, CELL_H, 1);
      m._key = -1;
      gridScene.add(m);
      meshes.push(m);
    }
  }

  function frame() {
    rafId = requestAnimationFrame(frame);
    if (!dragging) {
      tx += vx; ty += vy;
      vx *= FRICTION; vy *= FRICTION;
      if (Math.abs(vx) < 0.05) vx = 0;
      if (Math.abs(vy) < 0.05) vy = 0;
    }
    sx += (tx - sx) * LERP;
    sy += (ty - sy) * LERP;

    // hold-zoom shows extra world on every side — pad the virtualisation window
    var padX = (GW / camera.zoom - GW) / 2;
    var padY = (GH / camera.zoom - GH) / 2;
    var firstCol = Math.floor((sx - padX) / CELL_W) - 1;
    var firstRow = Math.floor((sy - padY) / CELL_H) - 1;

    // Cell under the pointer (hover tint target); none while dragging
    var hCol = null, hRow = null;
    if (!dragging && pX >= 0) {
      var gpt = screenToGrid(pX, pY);
      hCol = Math.floor((gpt.x + sx) / CELL_W);
      hRow = Math.floor((gpt.y + sy) / CELL_H);
    }

    for (var i = 0; i < meshes.length; i++) {
      var col = firstCol + (i % NX);
      var row = firstRow + Math.floor(i / NX);
      var m = meshes[i];
      var pIdx = mod(row, PROWS) * PCOLS + mod(col, PCOLS);
      if (m._key !== pIdx) { m._key = pIdx; m.material.map = textures[pIdx]; }
      // grid px (y down) → world (y up, origin centre)
      m.position.x = col * CELL_W - sx + CELL_W / 2 - GW / 2;
      m.position.y = -(row * CELL_H - sy + CELL_H / 2 - GH / 2);
      // ease the tint toward hover colour (or back to white)
      var tint = (col === hCol && row === hRow) ? hoverColors[pIdx] : whiteColor;
      m.material.color.lerp(tint, HOVER_LERP);
    }

    renderer.setRenderTarget(rt);
    renderer.render(gridScene, camera);
    renderer.setRenderTarget(null);
    renderer.render(postScene, postCam);
  }

  // ── Input ──
  function onWheel(e) {
    if (!open) return;
    e.preventDefault();
    tx += e.deltaX;
    ty += e.deltaY;
    vx = vy = 0;
  }
  function animateZoom(z) {
    if (window.gsap) {
      gsap.killTweensOf(camera);
      gsap.to(camera, {
        zoom: z, duration: 0.6, ease: 'power3.out',
        onUpdate: function () { camera.updateProjectionMatrix(); }
      });
    } else {
      camera.zoom = z;
      camera.updateProjectionMatrix();
    }
  }
  function onDown(e) {
    dragging = true; moved = 0;
    lastX = e.clientX; lastY = e.clientY;
    vx = vy = 0;
    viewEl.classList.add('is-dragging');
    animateZoom(HOLD_ZOOM); // hold = pull the camera back
  }
  function onMove(e) {
    pX = e.clientX; pY = e.clientY;
    if (!dragging) return;
    var dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    moved += Math.abs(dx) + Math.abs(dy);
    tx -= dx; ty -= dy;
    vx = -dx; vy = -dy; // last delta becomes release velocity
  }
  function onUp() {
    if (!dragging) return;
    dragging = false;
    viewEl.classList.remove('is-dragging');
    animateZoom(1); // release = settle back in
  }
  function onClick(e) {
    if (moved > 6) return; // it was a drag, not a click
    var g = screenToGrid(e.clientX, e.clientY);
    var col = Math.floor((g.x + sx) / CELL_W);
    var row = Math.floor((g.y + sy) / CELL_H);
    var pIdx = mod(row, PROWS) * PCOLS + mod(col, PCOLS);

    // Keep the lens curved — freeze the grid exactly where it is (scroll +
    // any in-flight zoom tween) and hand the cell's distorted on-screen rect
    // straight to the DOM FLIP glide.
    vx = vy = 0; tx = sx; ty = sy;
    if (window.gsap) gsap.killTweensOf(camera);
    document.dispatchEvent(new CustomEvent('grid-open-project', {
      detail: { index: pIdx, col: col, row: row, rect: cellScreenRect(col, row) }
    }));
  }
  function onResize() {
    if (built && open) layout();
  }

  function build() {
    viewEl = document.getElementById('grid-view');

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.domElement.className = 'gv-canvas';
    viewEl.appendChild(renderer.domElement);

    gridScene = new THREE.Scene();
    gridScene.background = new THREE.Color(theme().bg);
    camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 10);
    unitGeo = new THREE.PlaneGeometry(1, 1);
    textures = PROJECTS.map(makeTexture);
    whiteColor = new THREE.Color(0xffffff);
    // per-project hover tint — set `hoverColor: '#hex'` on a project in content.js
    hoverColors = PROJECTS.map(function (p) {
      return new THREE.Color(p.hoverColor || '#ffffff');
    });

    postScene = new THREE.Scene();
    postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    postMat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        tDiffuse:  { value: null },
        uStrength: { value: DISTORTION },
        uAspect:   { value: 1 },
        uVignette: { value: VIGNETTE },
        uBg:       { value: new THREE.Color(theme().bg) }
      }
    });
    postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMat));

    layout();

    viewEl.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onUp);
    viewEl.addEventListener('click', onClick);
    window.addEventListener('resize', onResize);
    built = true;
  }

  function show() {
    if (open) return;
    if (!window.THREE) { console.error('[porto] three.js missing — grid view disabled.'); return; }
    open = true;
    if (!built) build();
    document.body.classList.add('grid-mode');
    viewEl.style.display = 'block';
    viewEl.setAttribute('aria-hidden', 'false');
    window.addEventListener('wheel', onWheel, { passive: false });
    if (window.gsap) {
      gsap.fromTo(viewEl, { opacity: 0 }, { opacity: 1, duration: 0.55, ease: 'power2.out' });
      // settle the bowl: start deeper, relax to resting depth
      gsap.fromTo(postMat.uniforms.uStrength, { value: DISTORTION * 1.6 },
        { value: DISTORTION, duration: 1.1, ease: 'power3.out' });
    } else {
      viewEl.style.opacity = '1';
    }
    if (rafId === null) rafId = requestAnimationFrame(frame);
  }

  // Show instantly at the resting curved lens (uStrength DISTORTION, zoom 1) —
  // used when the case-study close glide needs the grid visible underneath so
  // the flying card can land pixel-perfect on its (curved) cell.
  function showInstant() {
    if (!window.THREE) return;
    if (!built) build();
    open = true;
    document.body.classList.add('grid-mode');
    if (window.gsap) {
      gsap.killTweensOf(viewEl);
      gsap.set(viewEl, { opacity: 1 });
      gsap.killTweensOf(camera);
      gsap.killTweensOf(postMat.uniforms.uStrength);
    }
    viewEl.style.display = 'block';
    viewEl.style.opacity = '1';
    viewEl.setAttribute('aria-hidden', 'false');
    window.addEventListener('wheel', onWheel, { passive: false });
    postMat.uniforms.uStrength.value = DISTORTION;
    camera.zoom = 1;
    camera.updateProjectionMatrix();
    if (rafId === null) rafId = requestAnimationFrame(frame);
  }

  function hide(instant) {
    if (!open) return;
    open = false;
    document.body.classList.remove('grid-mode');
    window.removeEventListener('wheel', onWheel);
    dragging = false;
    if (camera) {
      if (window.gsap) gsap.killTweensOf(camera);
      camera.zoom = 1;
      camera.updateProjectionMatrix();
    }
    var done = function () {
      viewEl.style.display = 'none';
      viewEl.setAttribute('aria-hidden', 'true');
      if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
    };
    if (!instant && window.gsap) {
      gsap.to(viewEl, { opacity: 0, duration: 0.35, ease: 'power2.in', onComplete: done });
    } else {
      done();
    }
  }

  return {
    show: show,
    showInstant: showInstant,
    cellScreenRect: cellScreenRect,
    setTheme: setTheme,
    hide: hide,
    isOpen: function () { return open; }
  };
})();
