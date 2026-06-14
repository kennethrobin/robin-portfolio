/* ============================================================
   DIRECTION D — "Rōbin"

   A fullscreen WebGL screen plays random ~3s clips drawn from
   ALL of Kenneth's films, hard-cutting with a glitch pulse so a
   visitor sees as much work as possible in the first seconds.

   How the cuts work
   -----------------
   Every film is its own <video> element (muted, preloaded).
   Two of them are "live" at any moment: the one on screen and
   the next one, already seeked to a random in-point and playing
   silently underneath. On the cut, a shader blends them with a
   sliced RGB-split glitch. Different random in-points every
   time — no two visits look the same.

   Tweakables live in CLIP and the SOURCES list below.
   ============================================================ */
import './d.css';
import * as THREE from 'three';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { projects } from '../data/projects';
import { initWordmark } from '../shared/wordmark';

gsap.registerPlugin(ScrollTrigger);

/* ---- The films ------------------------------------------------ */
const SOURCES = [
  { file: '/media/clips/bbc2.mp4', label: 'BBC Two — Visceral' },
  { file: '/media/clips/reel.mp4', label: 'Reel — Selected Work' },
  { file: '/media/clips/aiga.mp4', label: 'AIGA — Revival' },
  { file: '/media/clips/quickies.mp4', label: 'Experiments' },
];

/* ---- Cut behaviour --------------------------------------------- */
const CLIP = {
  length: 3.0,        // seconds each clip holds
  fade: 0.45,         // crossfade duration
  glitchAmount: 1.0,  // 0 = clean dissolve, 1 = full glitch cut
  margin: 0.06,       // skip the first/last 6% of each film (slates, fades)
  grain: 0.06,        // constant film grain
};

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---- Video elements -------------------------------------------- */
interface Film {
  el: HTMLVideoElement;
  tex: THREE.VideoTexture;
  label: string;
  ready: boolean;
}
// phones: don't pre-download four full films; fetch as needed
const coarsePointer = matchMedia('(pointer: coarse)').matches;

const films: Film[] = SOURCES.map((s) => {
  const el = document.createElement('video');
  el.src = s.file;
  // mobile autoplay policies check the *attributes*, not just the
  // JS properties — set both or iOS refuses to play inline
  el.muted = true;
  el.setAttribute('muted', '');
  el.playsInline = true;
  el.setAttribute('playsinline', '');
  el.setAttribute('webkit-playsinline', '');
  el.preload = coarsePointer ? 'metadata' : 'auto';
  el.crossOrigin = 'anonymous';
  const tex = new THREE.VideoTexture(el);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  const film: Film = { el, tex, label: s.label, ready: false };
  el.addEventListener('loadedmetadata', () => { film.ready = true; });
  return film;
});

/* ---- WebGL screen ----------------------------------------------- */
const canvas = document.querySelector<HTMLCanvasElement>('[data-screen]')!;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

const uniforms = {
  uFrom: { value: films[0].tex },
  uTo: { value: films[0].tex },
  uAspectFrom: { value: 16 / 9 },
  uAspectTo: { value: 16 / 9 },
  uScreen: { value: innerWidth / innerHeight },
  uMix: { value: 0 },
  uGlitch: { value: 0 },
  uSeed: { value: 1 },
  uTime: { value: 0 },
  uGrain: { value: CLIP.grain },
};

const screenMat = new THREE.ShaderMaterial({
  uniforms,
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D uFrom, uTo;
    uniform float uAspectFrom, uAspectTo, uScreen;
    uniform float uMix, uGlitch, uSeed, uTime, uGrain;
    varying vec2 vUv;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    // CSS object-fit: cover, in shader form
    vec2 coverUV(vec2 uv, float texAspect, float screenAspect) {
      vec2 d = uv - 0.5;
      if (screenAspect > texAspect) d.y *= texAspect / screenAspect;
      else d.x *= screenAspect / texAspect;
      return d + 0.5;
    }

    void main() {
      vec2 uv = vUv;

      // punch-zoom during the cut
      uv = 0.5 + (uv - 0.5) * (1.0 - 0.05 * uGlitch);

      // horizontal slice tearing
      float slice = floor(uv.y * 28.0);
      float n = hash(vec2(slice, uSeed));
      uv.x += (n - 0.5) * 0.22 * uGlitch;

      // per-slice ragged blend edge
      float m = clamp(uMix + (n - 0.5) * 0.9 * uGlitch, 0.0, 1.0);

      // RGB split, strongest mid-cut
      float off = 0.014 * uGlitch;
      vec2 uvA = coverUV(uv, uAspectFrom, uScreen);
      vec2 uvB = coverUV(uv, uAspectTo, uScreen);

      vec3 col;
      col.r = mix(texture2D(uFrom, uvA + vec2(off, 0.0)).r, texture2D(uTo, uvB + vec2(off, 0.0)).r, m);
      col.g = mix(texture2D(uFrom, uvA).g, texture2D(uTo, uvB).g, m);
      col.b = mix(texture2D(uFrom, uvA - vec2(off, 0.0)).b, texture2D(uTo, uvB - vec2(off, 0.0)).b, m);

      // constant film grain
      col += (hash(vUv * vec2(1920.0, 1080.0) + fract(uTime) * 60.0) - 0.5) * uGrain;

      gl_FragColor = vec4(col, 1.0);
    }
  `,
});
scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), screenMat));

function resize() {
  renderer.setSize(innerWidth, innerHeight);
  uniforms.uScreen.value = innerWidth / innerHeight;
}
resize();
window.addEventListener('resize', resize);

// Only render while the hero is on screen — once the solid sections
// cover the video there's nothing to draw, so we save the GPU.
let heroVisible = true;
gsap.ticker.add(() => {
  if (!heroVisible) return;
  uniforms.uTime.value = performance.now() / 1000;
  renderer.render(scene, camera);
});

/* ---- The cut scheduler ------------------------------------------ */
const nowPlaying = document.querySelector<HTMLElement>('[data-nowplaying]')!;
let current: Film | null = null;

const aspectOf = (f: Film) =>
  f.el.videoWidth ? f.el.videoWidth / f.el.videoHeight : 16 / 9;

/** Random in-point that leaves room for the clip + crossfade. */
function randomStart(f: Film) {
  const d = f.el.duration;
  const lo = d * CLIP.margin;
  const hi = d * (1 - CLIP.margin) - (CLIP.length + 1);
  return lo + Math.random() * Math.max(hi - lo, 0);
}

/** Seek a film to a random spot and get it playing (hidden). */
function prepare(f: Film): Promise<void> {
  return new Promise((resolve) => {
    const go = () => {
      f.el.currentTime = randomStart(f);
      const onSeeked = () => {
        f.el.removeEventListener('seeked', onSeeked);
        f.el.play().then(resolve).catch(() => resolve());
      };
      f.el.addEventListener('seeked', onSeeked);
    };
    if (f.ready) go();
    else f.el.addEventListener('loadedmetadata', go, { once: true });
  });
}

function pickNext(): Film {
  // any film except the one on screen — maximum variety
  const pool = films.filter((f) => f !== current);
  return pool[Math.floor(Math.random() * pool.length)];
}

function setNowPlaying(label: string) {
  gsap.timeline()
    .to(nowPlaying, { opacity: 0, duration: 0.2, ease: 'power2.in' })
    .add(() => { nowPlaying.textContent = label; })
    .to(nowPlaying, { opacity: 0.75, duration: 0.4, ease: 'power2.out' });
}

async function firstFrame() {
  const f = films[Math.floor(Math.random() * films.length)];
  await prepare(f);
  current = f;
  uniforms.uFrom.value = f.tex;
  uniforms.uTo.value = f.tex;
  uniforms.uAspectFrom.value = uniforms.uAspectTo.value = aspectOf(f);
  setNowPlaying(f.label);
}

async function cut() {
  const next = pickNext();
  await prepare(next);

  uniforms.uTo.value = next.tex;
  uniforms.uAspectTo.value = aspectOf(next);
  uniforms.uSeed.value = Math.random() * 100;
  setNowPlaying(next.label);

  await new Promise<void>((resolve) => {
    gsap.timeline({ onComplete: resolve })
      .to(uniforms.uMix, { value: 1, duration: CLIP.fade, ease: 'power3.inOut' }, 0)
      .to(uniforms.uGlitch, { value: CLIP.glitchAmount, duration: CLIP.fade * 0.4, ease: 'power2.in' }, 0)
      .to(uniforms.uGlitch, { value: 0, duration: CLIP.fade * 0.6, ease: 'power3.out' }, CLIP.fade * 0.4);
  });

  // promote "next" to "current", park the old film
  current?.el.pause();
  current = next;
  uniforms.uFrom.value = next.tex;
  uniforms.uAspectFrom.value = aspectOf(next);
  uniforms.uMix.value = 0;
}

/* ---- Mobile autoplay unlock ------------------------------------
   iOS (notably Low Power Mode) rejects play() until the visitor
   touches the page. First touch: replay the current film and
   "bless" the others with a play/pause so later programmatic
   play() calls are allowed too.                                  */
let unlocked = false;
function unlockPlayback() {
  if (unlocked) return;
  unlocked = true;
  document.querySelector<HTMLElement>('[data-taphint]')!.hidden = true;
  films.forEach((f) => {
    f.el.play()
      .then(() => { if (f !== current) f.el.pause(); })
      .catch(() => {});
  });
}
window.addEventListener('pointerdown', unlockPlayback);
window.addEventListener('touchstart', unlockPlayback, { passive: true });

async function run() {
  await firstFrame();
  // if the browser refused to start the film, ask for a tap
  if (current && current.el.paused && !unlocked) {
    document.querySelector<HTMLElement>('[data-taphint]')!.hidden = false;
  }
  if (reducedMotion) return;        // calm fallback: one film, no cuts
  // steady rhythm of cuts, forever
  // (prepare() inside cut() absorbs seek latency before each fade)
  const loop = async () => {
    await new Promise((r) => setTimeout(r, CLIP.length * 1000));
    // skip cuts while the tab is hidden or the hero is scrolled away
    if (!document.hidden && heroVisible) await cut();
    loop();
  };
  loop();
}
run();

/* ---- Wordmark (home button + idle motion) ----------------------- */
initWordmark(document.querySelector<HTMLElement>('[data-moniker]')!);
if (!reducedMotion) {
  gsap.from('.bar, .nowplaying, .strip', {
    opacity: 0,
    duration: 1.0,
    ease: 'power2.out',
    delay: 0.9,
    stagger: 0.12,
  });
}

/* ---- Filmstrip scroller -------------------------------------------
   Auto-drifts; drag to throw it. The track is duplicated and wrapped
   for an endless loop. (No wheel hijack — the page scrolls now.)    */
const strip = document.querySelector<HTMLElement>('[data-strip]')!;
const track = document.querySelector<HTMLElement>('[data-track]')!;

const itemHTML = projects.map((p) => `
  <a class="strip__item" href="/a.html#${p.slug}">
    <img src="${p.media[0]}" alt="${p.title} — ${p.client}" loading="lazy" />
    <span class="caption">${p.title} · ${p.client}</span>
  </a>`).join('');
track.innerHTML = itemHTML + itemHTML;        // x2 for seamless wrap

const STRIP = {
  drift: reducedMotion ? 0 : 18,  // auto-drift px/s
  wheelFactor: 0.6,               // wheel sensitivity
  ease: 0.08,                     // catch-up lerp (lower = floatier)
};

let stripX = 0;          // rendered position
let stripTarget = 0;     // where input wants it
let half = 0;            // width of one copy, for wrapping
const measure = () => { half = track.scrollWidth / 2; };
window.addEventListener('load', measure);
window.addEventListener('resize', measure);
measure();

// trackpad horizontal swipes still nudge the strip, but vertical
// wheel is left alone so it scrolls the page
window.addEventListener('wheel', (e) => {
  if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) stripTarget -= e.deltaX * STRIP.wheelFactor;
}, { passive: true });

let dragging = false;
let dragStartX = 0;
let dragStartTarget = 0;
strip.addEventListener('pointerdown', (e) => {
  dragging = true;
  dragStartX = e.clientX;
  dragStartTarget = stripTarget;
  strip.classList.add('is-dragging');
  strip.setPointerCapture(e.pointerId);
});
strip.addEventListener('pointermove', (e) => {
  if (dragging) stripTarget = dragStartTarget + (e.clientX - dragStartX);
});
const endDrag = () => { dragging = false; strip.classList.remove('is-dragging'); };
strip.addEventListener('pointerup', endDrag);
strip.addEventListener('pointercancel', endDrag);

gsap.ticker.add((_, delta) => {
  if (!dragging) stripTarget -= STRIP.drift * (delta / 1000);
  stripX += (stripTarget - stripX) * STRIP.ease;
  if (half > 0) {
    // wrap both values together so the loop is invisible
    while (stripX < -half) { stripX += half; stripTarget += half; }
    while (stripX > 0) { stripX -= half; stripTarget -= half; }
  }
  track.style.transform = `translate3d(${stripX}px, 0, 0)`;
});

/* ---- Pause the video once the hero scrolls away -----------------
   Saves GPU + battery: when the hero is off screen we stop drawing
   the WebGL frame and pause the playing film; both resume on return. */
const hero = document.querySelector<HTMLElement>('.hero')!;
new IntersectionObserver(
  ([entry]) => {
    heroVisible = entry.isIntersecting;
    // drive the label opacity through gsap so the cut scheduler and the
    // hide-on-scroll don't fight over inline style
    gsap.to(nowPlaying, { opacity: heroVisible ? 0.75 : 0, duration: 0.4, ease: 'power2.out' });
    if (!current) return;
    if (heroVisible) { if (unlocked || !reducedMotion) current.el.play().catch(() => {}); }
    else current.el.pause();
  },
  { threshold: 0 },
).observe(hero);

/* ---- Section scroll-reveals -------------------------------------
   Each [data-reveal] section's pieces rise + fade in as it enters
   the viewport. Calm, on the house easing. Skipped for reduced motion. */
if (!reducedMotion) {
  gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((section) => {
    const bits = section.querySelectorAll<HTMLElement>(
      '.sec__label, .sec__title, .sec__body, .cap, .clients li',
    );
    gsap.from(bits, {
      y: 40,
      opacity: 0,
      duration: 0.9,
      ease: 'expo.out',
      stagger: 0.06,
      scrollTrigger: { trigger: section, start: 'top 78%' },
    });
  });

  // footer CTA gets its own beat
  gsap.from('.footer__kicker, .footer__mail', {
    y: 40, opacity: 0, duration: 1.0, ease: 'expo.out', stagger: 0.1,
    scrollTrigger: { trigger: '.footer', start: 'top 80%' },
  });

  // Trigger positions are measured at creation — but the web fonts and
  // the first video frame change the layout AFTER that. Recompute once
  // everything has settled so no section gets stuck hidden.
  const refresh = () => ScrollTrigger.refresh();
  window.addEventListener('load', refresh);
  document.fonts?.ready.then(refresh);
  setTimeout(refresh, 1200);
}
