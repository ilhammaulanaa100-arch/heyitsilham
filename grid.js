/* Grid view — phantom.land-style infinite curved grid, WebGL (three.js).
   The grid is rendered flat into a render target, then a fullscreen fisheye
   pass bends the whole frame concave (centre magnified, edges curving away),
   so the warp is continuous — it bends inside the images too.
   Loads after content.js (PROJECTS). Exposes window.GridView { show, hide, isOpen }.
   Emits 'grid-open-project' (detail: { index }) when a cell is clicked. */
window.GridView = (function () {
  'use strict';

  // ── Tuning knobs ──
  var DISTORTION = 0.10;  // resting concave strength — gentle cinematic curve
  var ZOOM       = 1.12;  // camera zoom-out (1.12 ≈ view at ~90%)
  var VIGNETTE   = 0.95;  // edge fade strength, matches vertical view's .vignette-radial alpha
  var HOLD_ZOOM  = 0.7;   // camera zoom while click is held (~30% further out)
  var THRU_ZOOM  = 1.7;   // dolly depth for the open/close camera move — deeper blows the
                          // 512px cell texture up blurry-huge; the fade tail hides the rest
  var HOVER_LERP = 0.16;  // hover tint ease speed
  var LERP       = 0.10;  // scroll smoothing (direct catch-up)
  var FRICTION   = 0.955; // drag momentum decay (long, weighty glide on release)

  // Reactive lens: rests at DISTORTION, bulges toward LENS_ACTIVE while the grid
  // is moving, relaxes back at rest. _busy gates it (and parallax) off while an
  // open/close transition owns uStrength — otherwise the two fight every frame.
  var LENS_ACTIVE = 0.20;
  var _lensNow = DISTORTION;
  var _busy = false;

  // Depth of field: centre stays sharp, periphery softens. Deliberately gentle.
  var DOF = 0.1;

  // Cursor parallax (desktop pointers only): images ease toward the pointer side.
  var PARALLAX = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var PMAG = 30;              // max parallax offset (px)
  var parX = 0, parY = 0;     // eased parallax offset, applied at render + click/glide

  // PROJECTS tiled as PCOLS × PROWS, repeated infinitely both axes
  var PCOLS = 3, PROWS = 2;

  // Media square sits this fraction of the cell height above centre,
  // leaving room for the name/year lines under it
  var MEDIA_Y_SHIFT = 0.026;

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
      ? { bg: '#0B0B0B', line: 'rgba(255,255,255,0.07)', text: '#fff', dim: 'rgba(255,255,255,0.8)' }
      : { bg: '#ffffff', line: 'rgba(34,32,32,0.07)',    text: '#000', dim: 'rgba(0,0,0,0.8)' };
  }

  // ── Cell texture (canvas): scan-line outline, media, name + year ──
  function gradColors(str) {
    var m = String(str).match(/#[0-9a-fA-F]{3,8}/g) || [];
    return [m[0] || '#333', m[1] || m[0] || '#111'];
  }

  function drawCell(ctx, p, W, H, img, blankMedia) {
    var MONO = "500 13px 'SF Mono', Menlo, 'Courier New', monospace";
    var th = theme();

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = th.bg;
    ctx.fillRect(0, 0, W, H);

    // Cell border — cells tile edge-to-edge, so these strokes form the grid
    // lines between projects (no gaps, no empty boxes)
    ctx.strokeStyle = th.line;
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);

    // Media — centred square, nudged up (MEDIA_Y_SHIFT) to make room for the
    // name/year lines below. cellScreenRect() mirrors this rect for the glide.
    var mw = Math.round(W * 0.74);
    var mx = (W - mw) / 2, my = (H - mw) / 2 - Math.round(H * MEDIA_Y_SHIFT);
    if (blankMedia) {
      // media square intentionally left empty — the DOM glide clone owns the
      // media while a card is in flight to/from this cell
    } else if (img) {
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

    // Below the media: project name + year, nothing else
    ctx.font = MONO;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillStyle = th.text;
    ctx.fillText(String(p.title || '').toUpperCase(), mx, my + mw + 18);
    ctx.fillStyle = th.dim;
    ctx.fillText(String(p.period || '').toUpperCase(), mx, my + mw + 40);
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
    var cell = { p: p, ctx: ctx, tex: tex, img: null, hideMedia: false };
    if (p.media && p.media.hero) {
      var img = new Image();
      img.onload = function () {
        cell.img = img;
        if (!cell.hideMedia) { drawCell(ctx, p, W, H, img); tex.needsUpdate = true; }
      };
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
      drawCell(c.ctx, c.p, c.ctx.canvas.width, c.ctx.canvas.height, c.img, c.hideMedia);
      c.tex.needsUpdate = true;
    });
  }

  // Hide/restore one project's media square in its cell texture. Used while a
  // card FLIP-glides to/from the case study: the DOM clone owns the media, so
  // the canvas must never show a duplicate of it. Affects every tiled repeat
  // of the project — acceptable for the glide's duration.
  function setCellMediaHidden(pIdx, hidden) {
    var c = cells[pIdx];
    if (!c) return;
    hidden = !!hidden;
    if (c.hideMedia === hidden) return;
    c.hideMedia = hidden;
    drawCell(c.ctx, c.p, c.ctx.canvas.width, c.ctx.canvas.height, c.img, hidden);
    c.tex.needsUpdate = true;
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
    'uniform float uDof;',      // depth-of-field blur strength toward the edges
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
    '  float d = r2 / rMax2;',
    '  vec4 c = texture2D(tDiffuse, duv);',
    // DOF: centre sharp, periphery softens — 8-tap ring, radius grows with d
    '  float blur = uDof * smoothstep(0.12, 0.9, d);',
    '  if (blur > 0.001) {',
    '    vec2 e = vec2(blur) * 0.03;',
    '    vec4 a = c;',
    '    a += texture2D(tDiffuse, duv + vec2( e.x, 0.0));',
    '    a += texture2D(tDiffuse, duv + vec2(-e.x, 0.0));',
    '    a += texture2D(tDiffuse, duv + vec2(0.0,  e.y));',
    '    a += texture2D(tDiffuse, duv + vec2(0.0, -e.y));',
    '    a += texture2D(tDiffuse, duv + e * 0.7);',
    '    a += texture2D(tDiffuse, duv - e * 0.7);',
    '    a += texture2D(tDiffuse, duv + vec2(e.x, -e.y) * 0.7);',
    '    a += texture2D(tDiffuse, duv + vec2(-e.x, e.y) * 0.7);',
    '    c = a / 9.0;',
    '  }',
    '  c.rgb = mix(c.rgb, uBg, uVignette * smoothstep(0.6, 1.0, d));',
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
    var k = postMat ? postMat.uniforms.uStrength.value : DISTORTION;
    var f = Math.max(1 - k * r2, 0.05);
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
  // Fitted to the EDGE MIDPOINTS, not the corners: the lens bows the square's
  // sides, and corners sit at a larger radius (stronger distortion), so a
  // corner fit overshoots the visible edges by several px (measured ~7px at
  // DISTORTION 0.25). Edge midpoints track what the eye reads as the border.
  function cellScreenRect(col, row) {
    var mw = CELL_W * 0.74; // matches the media size drawn in the cell texture
    // parallax offset is baked into the rendered position — include it so the
    // measured rect matches where the cell actually sits on screen
    var x0 = col * CELL_W - (sx + parX) + (CELL_W - mw) / 2;
    var y0 = row * CELL_H - (sy + parY) + (CELL_H - mw) / 2 - CELL_H * MEDIA_Y_SHIFT;
    var xc = x0 + mw / 2, yc = y0 + mw / 2;
    var L = gridToScreen(x0, yc).x;
    var R = gridToScreen(x0 + mw, yc).x;
    var T = gridToScreen(xc, y0).y;
    var B = gridToScreen(xc, y0 + mw).y;
    return { left: L, top: T, width: R - L, height: B - T };
  }

  // ── Zoom-through dolly (open/close camera move) ──
  // Tweens camera.zoom zFrom→zTo while sliding sx/sy so the clicked cell's
  // centre stays pinned on screen — the camera pushes through the cell instead
  // of the grid dissolving. zRef = the zoom at which the CURRENT sx/sy are the
  // truth for the pin (open: live zoom; close: the resting zoom we end on).
  var _dollyTween = null;
  function killDolly() {
    if (_dollyTween) { _dollyTween.kill(); _dollyTween = null; }
    if (window.gsap && viewEl) gsap.killTweensOf(viewEl);
  }
  function dolly(col, row, zFrom, zTo, zRef, duration) {
    var gx = col * CELL_W + CELL_W / 2;
    var gy = row * CELL_H + CELL_H / 2;
    var cx = (gx - sx - GW / 2) * zRef;
    var cy = (gy - sy - GH / 2) * zRef;
    var proxy = { z: zFrom };
    var apply = function () {
      camera.zoom = proxy.z;
      camera.updateProjectionMatrix();
      sx = tx = gx - GW / 2 - cx / proxy.z;
      sy = ty = gy - GH / 2 - cy / proxy.z;
    };
    apply();
    // power2, NOT expo: expo.inOut sits nearly still for half the tween then
    // slams the zoom in a few frames — on a fullscreen camera that reads as a
    // glitch flash, not a push. The card can be snappy; the world cannot.
    _dollyTween = gsap.to(proxy, {
      z: zTo, duration: duration, ease: 'power2.inOut',
      onUpdate: apply,
      onComplete: function () { _dollyTween = null; }
    });
  }

  // Open: camera dollies INTO the clicked cell while the card FLIP-glides.
  // The tail opacity fade is cleanup (grid is committed/covered by then),
  // not the transition itself.
  function zoomInto(col, row, duration) {
    if (!built || !window.gsap) return;
    _busy = true; // transition owns uStrength + freezes parallax
    killDolly();
    gsap.killTweensOf(camera);
    gsap.killTweensOf(postMat.uniforms.uStrength);
    dragging = false; vx = vy = 0;
    dolly(col, row, camera.zoom, THRU_ZOOM, camera.zoom, duration);
    // lens bulges as we push through it
    gsap.to(postMat.uniforms.uStrength, { value: DISTORTION * 1.9, duration: duration, ease: 'power2.inOut' });
    // Fade starts almost immediately: the DOM clone owns the media from frame
    // one, and the canvas copy diverges from it as the dolly pins the cell —
    // any lingering means a ghost image left behind mid-screen.
    gsap.to(viewEl, { opacity: 0, duration: duration * 0.5, delay: duration * 0.08, ease: 'power1.out' });
  }

  // Close: reverse — start deep inside the cell, pull back to the resting view.
  // Call AFTER showInstant() + after the close glide measured its destination
  // rect (the rect is for the resting lens; both tweens converge on it).
  function zoomOutFrom(col, row, duration) {
    if (!built || !window.gsap) return;
    _busy = true;
    killDolly();
    gsap.killTweensOf(camera);
    gsap.killTweensOf(postMat.uniforms.uStrength);
    dolly(col, row, THRU_ZOOM, 1, 1, duration);
    gsap.fromTo(postMat.uniforms.uStrength, { value: DISTORTION * 1.9 },
      { value: DISTORTION, duration: duration, ease: 'power2.inOut',
        onComplete: function () { _lensNow = DISTORTION; _busy = false; } });
    // Never show the deep-zoom frame (giant blurry cell) at full opacity —
    // the grid materialises quickly while the camera pulls back. The target
    // cell's media is hidden by home.js for the whole glide, so the grid can
    // be fully opaque early without ever doubling the flying card.
    gsap.fromTo(viewEl, { opacity: 0 },
      { opacity: 1, duration: duration * 0.35, ease: 'power1.out' });
  }

  // ── Layout / mesh pool ──
  function layout() {
    vw = window.innerWidth;
    vh = window.innerHeight;
    GW = vw * ZOOM;  // the camera sees a zoomed-out (larger) slice of the grid
    GH = vh * ZOOM;
    // phones: 320px min would show barely one cell — size to ~72% of the screen
    CELL_W = vw < 700 ? Math.round(vw * 0.72) : Math.max(320, Math.round(vw / 3.5));
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

    // Reactive lens: distance still to travel ≈ current speed → bulge the curve
    // between the resting depth and LENS_ACTIVE. Off while a transition owns it.
    if (!_busy && postMat) {
      var speed = Math.min(1, (Math.abs(tx - sx) + Math.abs(ty - sy)) / 90);
      var target = DISTORTION + (LENS_ACTIVE - DISTORTION) * speed;
      _lensNow += (target - _lensNow) * 0.12;
      postMat.uniforms.uStrength.value = _lensNow;
    }

    // Cursor parallax: ease a bounded offset toward the pointer's side. Frozen
    // during transitions so the pinned cell stays aligned with the flying card.
    if (!_busy) {
      var ptX = 0, ptY = 0;
      if (PARALLAX && pX >= 0) {
        ptX = -(pX / vw - 0.5) * 2 * PMAG;
        ptY = -(pY / vh - 0.5) * 2 * PMAG;
      }
      parX += (ptX - parX) * 0.06;
      parY += (ptY - parY) * 0.06;
    }
    var sxE = sx + parX, syE = sy + parY;

    // hold-zoom shows extra world on every side — pad the virtualisation window
    var padX = (GW / camera.zoom - GW) / 2;
    var padY = (GH / camera.zoom - GH) / 2;
    var firstCol = Math.floor((sxE - padX) / CELL_W) - 1;
    var firstRow = Math.floor((syE - padY) / CELL_H) - 1;

    // Cell under the pointer (hover tint target); none while dragging
    var hCol = null, hRow = null;
    if (!dragging && pX >= 0) {
      var gpt = screenToGrid(pX, pY);
      hCol = Math.floor((gpt.x + sxE) / CELL_W);
      hRow = Math.floor((gpt.y + syE) / CELL_H);
    }

    for (var i = 0; i < meshes.length; i++) {
      var col = firstCol + (i % NX);
      var row = firstRow + Math.floor(i / NX);
      var m = meshes[i];
      var pIdx = mod(row, PROWS) * PCOLS + mod(col, PCOLS);
      if (m._key !== pIdx) { m._key = pIdx; m.material.map = textures[pIdx]; }
      // grid px (y down) → world (y up, origin centre)
      m.position.x = col * CELL_W - sxE + CELL_W / 2 - GW / 2;
      m.position.y = -(row * CELL_H - syE + CELL_H / 2 - GH / 2);
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
    var col = Math.floor((g.x + sx + parX) / CELL_W);
    var row = Math.floor((g.y + sy + parY) / CELL_H);
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
        uDof:      { value: DOF },
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
    killDolly();
    // A glide interrupted mid-flight can leave a cell's media hidden — never
    // enter the grid with blank cells.
    cells.forEach(function (c, i) { if (c.hideMedia) setCellMediaHidden(i, false); });
    document.body.classList.add('grid-mode');
    viewEl.style.display = 'block';
    viewEl.setAttribute('aria-hidden', 'false');
    window.addEventListener('wheel', onWheel, { passive: false });
    _busy = true; parX = parY = 0; _lensNow = DISTORTION;
    if (window.gsap) {
      gsap.fromTo(viewEl, { opacity: 0 }, { opacity: 1, duration: 0.55, ease: 'power2.out' });
      // settle the bowl: start deeper, relax to resting depth — then hand the
      // lens over to the reactive loop
      gsap.fromTo(postMat.uniforms.uStrength, { value: DISTORTION * 1.6 },
        { value: DISTORTION, duration: 1.1, ease: 'power3.out',
          onComplete: function () { _lensNow = DISTORTION; _busy = false; } });
    } else {
      viewEl.style.opacity = '1';
      _busy = false;
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
    killDolly();
    // close-glide runs on top: freeze parallax/lens at rest so the measured
    // return rect matches the rendered cell exactly
    _busy = true; parX = parY = 0; _lensNow = DISTORTION;
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
    _busy = false; parX = parY = 0; _lensNow = DISTORTION;
    document.body.classList.remove('grid-mode');
    window.removeEventListener('wheel', onWheel);
    dragging = false;
    killDolly();
    if (camera) {
      if (window.gsap) gsap.killTweensOf(camera);
      if (postMat && window.gsap) gsap.killTweensOf(postMat.uniforms.uStrength);
      if (postMat) postMat.uniforms.uStrength.value = DISTORTION;
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
    zoomInto: zoomInto,
    zoomOutFrom: zoomOutFrom,
    cellScreenRect: cellScreenRect,
    setCellMediaHidden: setCellMediaHidden,
    setTheme: setTheme,
    hide: hide,
    isOpen: function () { return open; }
  };
})();
