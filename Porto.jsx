/**
 * Porto.jsx — scroll-driven editorial section transition (Hero ⇄ BYOND)
 * ---------------------------------------------------------------------------
 * Setup:
 *   npm i gsap @gsap/react
 *
 * Tailwind: standard v3.3+ JIT (uses arbitrary values + gradient stop
 * positions). No custom config required.
 *
 * Fonts + the BYOND phone asset live outside this component:
 *   • Put these in your index.html <head>:
 *       <link href="https://api.fontshare.com/v2/css?f[]=recoleta@300&display=swap" rel="stylesheet" />
 *       <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,300&display=swap" rel="stylesheet" />
 *       <style>
 *         @font-face{font-family:'ITC Garamond Std';font-style:italic;font-weight:300;
 *           src:local('ITC Garamond Std Light Narrow Italic'),local('ITCGaramondStd-LtNarrIt'),local('ITC Garamond Std Light Italic');}
 *       </style>
 *   • Place phone-byond.png next to this file (or adjust the import below).
 */

import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { Observer } from 'gsap/Observer';
import { useGSAP } from '@gsap/react';
import phoneByond from './phone-byond.png';

gsap.registerPlugin(useGSAP, Observer);

/* ── Assets (Figma MCP URLs — swap for hosted copies in production) ── */
const LOGO     = 'https://www.figma.com/api/mcp/asset/6de044ef-633b-4511-9871-bc22e86a731c';
const FLYNN    = 'https://www.figma.com/api/mcp/asset/7a707c93-73ac-4cfd-9678-e4d28da1b16f';
const BTN_BG   = 'https://www.figma.com/api/mcp/asset/507e7b18-685e-453d-9f4e-9ee4956ed1ac';
const BTN_ICON = 'https://www.figma.com/api/mcp/asset/16eaf009-21a4-49af-8d5e-4af571fd0e3e';

/* ── Font helpers (Tailwind arbitrary font-family; _ → space) ── */
const FONT_BODY    = "[font-family:'Recoleta',_Georgia,_serif]";
const FONT_DISPLAY = "italic [font-family:'ITC_Garamond_Std',_'Cormorant_Garamond',_Georgia,_serif]";

/* ── Slider geometry (1:1 with Figma) ── */
const LINE_REST_X  = 18;
const TICK_X       = 12;
const TICK_LEN     = 12;
const TICK_STEP    = 8;
const TICK_Y0      = 0.5;
const TICK_PEAK    = 20;
const TICK_R       = 44;
const THUMB_OFFSET = 24;
const TOP_01       = 96;

/* Reusable line-mask: overflow-hidden clip + padding (cancelled by margin)
   so italic ascenders/descenders aren't clipped at rest. */
const LINE_MASK = 'block overflow-hidden [padding-block:0.14em] [margin-block:-0.14em]';

export default function Porto() {
  const root        = useRef(null);
  const timeRef     = useRef(null);
  const controlsRef = useRef(null);
  const curveRef    = useRef(null);
  const ticksRef    = useRef(null);
  const flynnRef    = useRef(null);
  const phoneRef    = useRef(null);
  const numTrackRef = useRef(null);

  // Mutable engine state kept in refs (never triggers React re-renders).
  const stateRef = useRef({ current: 0, animating: false, targetApexY: 0, renderApexY: 0 });
  const goRef    = useRef(() => {});
  const dragRef  = useRef(null);

  /* ── Real-time Jakarta clock (writes textContent, no re-render) ── */
  useEffect(() => {
    const tick = () => {
      const t = new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Jakarta'
      }).format(new Date());
      if (timeRef.current) timeRef.current.textContent = 'based in Jakarta, ' + t + ' WIB';
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  /* ── Right-side slider graphics: build ticks + rAF curve loop ── */
  useEffect(() => {
    const TRACK_H = window.innerHeight || 900;
    const NS = 'http://www.w3.org/2000/svg';
    const g = ticksRef.current;
    const curve = curveRef.current;
    const st = stateRef.current;

    const ticks = [];
    for (let i = 0, y = TICK_Y0; y <= TRACK_H; i++, y = TICK_Y0 + i * TICK_STEP) {
      const ln = document.createElementNS(NS, 'line');
      ln.setAttribute('y1', y);
      ln.setAttribute('y2', y);
      ln.setAttribute('stroke', (i % 5 === 0 && i !== 0) ? '#8AD103' : '#CACACA');
      ln.setAttribute('stroke-width', '1');
      g.appendChild(ln);
      ticks.push({ el: ln, y });
    }

    const bell = (d, R) => {
      const a = Math.abs(d);
      return a >= R ? 0 : 0.5 * (1 + Math.cos((Math.PI * d) / R));
    };

    const render = (apexY) => {
      const r = LINE_REST_X;
      const d = [
        'M ' + r + ' 0',
        'L ' + r + ' ' + (apexY - 39.558),
        'C ' + r + ' ' + (apexY - 24.817) + ' ' +
              (r + 16.490) + ' ' + (apexY - 14.666) + ' ' +
              (r + 17.970) + ' ' + apexY,
        'C ' + (r + 19.748) + ' ' + (apexY + 17.629) + ' ' +
               r + ' ' + (apexY + 31.525) + ' ' +
               r + ' ' + (apexY + 49.243),
        'L ' + r + ' ' + TRACK_H,
      ].join(' ');
      curve.setAttribute('d', d);

      for (let k = 0; k < ticks.length; k++) {
        const t = ticks[k];
        const shift = TICK_PEAK * bell(t.y - apexY, TICK_R);
        t.el.setAttribute('x1', TICK_X + shift);
        t.el.setAttribute('x2', TICK_X + TICK_LEN + shift);
      }
    };

    st.targetApexY = TOP_01 + THUMB_OFFSET;
    st.renderApexY = st.targetApexY;

    let raf;
    const loop = () => {
      st.renderApexY += (st.targetApexY - st.renderApexY) * 0.18;
      if (Math.abs(st.targetApexY - st.renderApexY) < 0.05) st.renderApexY = st.targetApexY;
      render(st.renderApexY);
      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      while (g.firstChild) g.removeChild(g.firstChild);
    };
  }, []);

  /* ── Master timeline + Observer (auto-reverted by useGSAP's context) ── */
  useGSAP(() => {
    const st = stateRef.current;
    const TOP_02 = Math.round(window.innerHeight * 0.34);
    const proxy = { sliderTop: TOP_01 };

    // Section 02 starts fully off-stage and hidden.
    gsap.set(phoneRef.current, { yPercent: 150, scale: 0.85, opacity: 0, transformOrigin: '50% 50%' });
    gsap.set(flynnRef.current, { transformOrigin: '50% 50%' });
    gsap.set('.byond-line', { y: 40, opacity: 0 });

    const tl = gsap.timeline({
      paused: true,
      defaults: { ease: 'power4.out' },
      onComplete:        () => { st.animating = false; },
      onReverseComplete: () => { st.animating = false; },
    });

    tl
      // ① Flynn chases UP and fully exits the mask (clipped before the nav)
      .to(flynnRef.current, { yPercent: -150, scale: 0.85, opacity: 0, duration: 1.0, ease: 'power3.in' }, 0)
      .to('.hero-line',     { yPercent: -125, opacity: 0, duration: 0.7, ease: 'power3.in', stagger: 0.09 }, 0)
      .to('.hero-subtitle', { y: -40, opacity: 0, duration: 0.5, ease: 'power2.in' }, 0)

      // ② iPhone rises from below the viewport into centre, scaling up
      .to(phoneRef.current, { yPercent: 0, scale: 1, opacity: 1, duration: 1.25, ease: 'power4.out' }, 0.1)

      // ③ BYOND copy lifts in from a small offset, rapid stagger
      .to('.byond-line',    { y: 0, opacity: 1, duration: 0.9, ease: 'expo.out', stagger: 0.08 }, 0.55)

      // ④ Side indicator: number swaps + thumb / curve glide down in sync
      .to(numTrackRef.current, { yPercent: -50, duration: 0.9, ease: 'power3.inOut' }, 0.25)
      .to(proxy, {
        sliderTop: TOP_02, duration: 1.1, ease: 'power3.inOut',
        onUpdate: () => {
          if (controlsRef.current) controlsRef.current.style.top = proxy.sliderTop + 'px';
          st.targetApexY = proxy.sliderTop + THUMB_OFFSET;
        },
      }, 0);

    // State machine — ignores intent while animating or already at target,
    // so rapid wheel/trackpad input can't stack overlapping timelines.
    const go = (dir) => {
      if (st.animating) return;
      if (dir > 0 && st.current === 0)      { st.animating = true; st.current = 1; tl.play(); }
      else if (dir < 0 && st.current === 1) { st.animating = true; st.current = 0; tl.reverse(); }
    };
    goRef.current = go;

    // wheelSpeed:-1 routes a wheel-down (or touch swipe-up) to onUp → next.
    Observer.create({
      type: 'wheel,touch',
      onUp:   () => go(1),
      onDown: () => go(-1),
      tolerance: 10,
      wheelSpeed: -1,
      preventDefault: true,
    });
  }, { scope: root });

  /* ── Keyboard navigation ── */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') { goRef.current(1); e.preventDefault(); }
      else if (e.key === 'ArrowUp' || e.key === 'PageUp')                 { goRef.current(-1); e.preventDefault(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* ── Thumb drag also drives the section change ── */
  const onPointerDown = (e) => { dragRef.current = e.clientY; e.currentTarget.setPointerCapture(e.pointerId); };
  const onPointerMove = (e) => {
    if (dragRef.current == null) return;
    const dy = e.clientY - dragRef.current;
    if (dy > 44)       { goRef.current(1);  dragRef.current = null; }
    else if (dy < -44) { goRef.current(-1); dragRef.current = null; }
  };
  const endDrag = () => { dragRef.current = null; };

  const navItem = `flex items-center justify-center px-6 py-3 rounded-full text-[20px] leading-[1.3] tracking-[-0.2px] text-black font-light cursor-pointer whitespace-nowrap transition-colors ${FONT_BODY}`;

  return (
    <div ref={root} className="fixed inset-0 overflow-hidden bg-white">

      {/* ── Section 01 text (left, vertically centred) ── */}
      <div className="absolute left-[56px] top-1/2 -translate-y-1/2 w-[480px] flex flex-col gap-2">
        <p className={`hero-subtitle w-[229px] text-[20px] leading-[1.3] tracking-[-0.2px] text-black font-light ${FONT_BODY}`}>
          Welcome to my house.
        </p>
        <div className={`text-[100px] leading-[1.1] tracking-[-1px] text-black font-light ${FONT_DISPLAY}`}>
          <span className={LINE_MASK}><span className="hero-line block whitespace-nowrap will-change-transform">Heyy,</span></span>
          <span className={LINE_MASK}><span className="hero-line block whitespace-nowrap will-change-transform">its Ilham</span></span>
        </div>
      </div>

      {/* ── Section 02 text (left, overlapping) ── */}
      <div className="absolute left-[88px] top-1/2 -translate-y-1/2">
        <div className={`text-[100px] leading-[1.1] tracking-[-1px] text-black font-light ${FONT_DISPLAY}`}>
          <span className={LINE_MASK}><span className="byond-line block whitespace-nowrap will-change-transform">BYOND</span></span>
          <span className={LINE_MASK}><span className="byond-line block whitespace-nowrap will-change-transform">by BSI</span></span>
        </div>
      </div>

      {/* ── Shared media mask (the chase happens here) ──
           overflow-hidden + top below the nav → Flynn is clipped clean
           before it can reach the menu; phone is clipped below the fold. */}
      <div className="absolute left-[600px] top-[88px] bottom-0 w-[440px] overflow-hidden">
        {/* Flynn layer — flex-centred so GSAP fully owns its transform */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div ref={flynnRef} className="relative w-[418px] h-[437px] will-change-transform">
            <div className="absolute inset-0 bg-gradient-to-b from-[#9f4bed] to-[#7b49a9]" />
            <img src={FLYNN} alt="Ilham" className="absolute top-[66px] left-[18px] w-[400px] h-[370.558px] object-cover" />
          </div>
        </div>
        {/* iPhone layer */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div ref={phoneRef} className="relative w-[338px] h-[679px] will-change-transform">
            <img
              src={phoneByond}
              alt="BYOND by BSI app"
              className="w-full h-full object-contain block [filter:drop-shadow(0_36px_60px_rgba(0,0,0,0.18))]"
            />
          </div>
        </div>
      </div>

      {/* ── Navbar ── */}
      <nav className="fixed top-4 left-10 w-[841px] flex items-center justify-between z-[1000]">
        <div className="relative w-[87px] h-[87px] bg-white shrink-0">
          <img src={LOGO} alt="Ilham logo" className="absolute left-[6px] top-[8.49px] w-[73.179px] h-[69.506px] block" />
        </div>
        <div className="flex items-center bg-[#f5f5f5] rounded-full p-1 shrink-0">
          <div className={`${navItem} bg-white`}>Work</div>
          <div className={navItem}>About</div>
          <div className={navItem}>Contact</div>
        </div>
      </nav>

      {/* ── Right-side slider ── */}
      <div className="fixed right-0 top-0 w-[177px] h-screen z-[100]">
        <svg className="absolute left-[81px] top-0 w-[80px] h-screen overflow-visible pointer-events-none">
          <path ref={curveRef} fill="none" stroke="#8AD103" strokeWidth="1" />
          <g ref={ticksRef} />
        </svg>

        <div
          ref={controlsRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className="absolute left-0 top-[96px] flex items-center gap-4 cursor-grab select-none touch-none"
        >
          <div className="h-[44px] overflow-hidden">
            <div ref={numTrackRef} className="flex flex-col will-change-transform">
              <span className={`block h-[44px] leading-[44px] text-[40px] tracking-[-0.4px] text-black font-light whitespace-nowrap ${FONT_BODY}`}>01</span>
              <span className={`block h-[44px] leading-[44px] text-[40px] tracking-[-0.4px] text-black font-light whitespace-nowrap ${FONT_BODY}`}>02</span>
            </div>
          </div>
          <div className="relative w-[40px] h-[40px] shrink-0 overflow-visible">
            <div className="absolute [top:-6.62%] [right:-16.91%] [bottom:-27.21%] [left:-16.91%]">
              <img src={BTN_BG} alt="" className="w-full h-full block" />
            </div>
            <div className="absolute [top:29.26%] [right:42.5%] [bottom:33.24%] [left:42.5%]">
              <img src={BTN_ICON} alt="" className="absolute inset-0 w-full h-full block" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Soft edge fades ── */}
      <div className="fixed left-0 top-0 w-full h-[180px] pointer-events-none z-[50] bg-gradient-to-b from-white from-[16%] to-transparent" />
      <div className="fixed left-0 bottom-0 w-full h-[180px] pointer-events-none z-[50] bg-gradient-to-t from-white from-[16%] to-transparent" />

      {/* ── Footer ── */}
      <div className="fixed left-0 bottom-0 flex items-center px-14 py-6 z-[1000]">
        <p ref={timeRef} className={`text-[16px] leading-[1.3] tracking-[-0.16px] text-black font-light whitespace-nowrap ${FONT_BODY}`}>
          based in Jakarta, 14:30 WIB
        </p>
      </div>
    </div>
  );
}
