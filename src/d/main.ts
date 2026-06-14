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
import { projects, site, type Project } from '../data/projects';
import { initWordmark } from '../shared/wordmark';

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

async function firstFrame() {
  const f = films[Math.floor(Math.random() * films.length)];
  await prepare(f);
  current = f;
  uniforms.uFrom.value = f.tex;
  uniforms.uTo.value = f.tex;
  uniforms.uAspectFrom.value = uniforms.uAspectTo.value = aspectOf(f);
}

async function cut() {
  const next = pickNext();
  await prepare(next);

  uniforms.uTo.value = next.tex;
  uniforms.uAspectTo.value = aspectOf(next);
  uniforms.uSeed.value = Math.random() * 100;

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
  // hero is just the reel now — fade in the nav. (The scroll cue keeps
  // its own faint CSS opacity; a gsap.from would clobber that.)
  gsap.from('.bar', {
    opacity: 0,
    y: 12,
    duration: 1.0,
    ease: 'power2.out',
    delay: 0.6,
  });
}

/* ---- Work: clean title list ------------------------------------
   Built from the projects config. Hovering a title shows a still
   that follows the cursor; clicking opens the modal. No copy on
   the scroll — detail lives in the modal only.                   */
const worklist = document.querySelector<HTMLOListElement>('[data-worklist]')!;
worklist.innerHTML = projects.map((p, i) => `
  <li>
    <button class="workrow" data-i="${i}" aria-haspopup="dialog">
      <span class="workrow__title">${p.title}</span>
      <span class="workrow__meta">${p.client} — ${p.year}</span>
    </button>
  </li>`).join('');

/* Cursor-following still preview (desktop hover) */
const preview = document.querySelector<HTMLDivElement>('[data-preview]')!;
const previewImg = preview.querySelector('img')!;
const px = gsap.quickTo(preview, 'x', { duration: 0.5, ease: 'power3.out' });
const py = gsap.quickTo(preview, 'y', { duration: 0.5, ease: 'power3.out' });
if (!reducedMotion) {
  window.addEventListener('pointermove', (e) => {
    px(e.clientX - 150);          // centre the 300px still on the cursor
    py(e.clientY - 94);
  });
}
let shownIdx = -1;
worklist.addEventListener('pointerover', (e) => {
  const row = (e.target as HTMLElement).closest<HTMLElement>('.workrow');
  if (!row) return;
  const i = Number(row.dataset.i);
  if (i === shownIdx) return;
  shownIdx = i;
  previewImg.src = projects[i].media[0];
  gsap.to(preview, { opacity: 1, scale: 1, duration: 0.4, ease: 'power3.out' });
});
worklist.addEventListener('pointerleave', () => {
  shownIdx = -1;
  gsap.to(preview, { opacity: 0, scale: 0.96, duration: 0.4, ease: 'power3.out' });
});

/* ---- Project modal ---------------------------------------------- */
const modal = document.querySelector<HTMLDivElement>('[data-modal]')!;
const modalInner = modal.querySelector<HTMLDivElement>('.modal__inner')!;
const modalClose = modal.querySelector<HTMLButtonElement>('[data-modal-close]')!;
let lastFocus: HTMLElement | null = null;

function openModal(p: Project) {
  const lead = p.video
    ? `<iframe class="modal__video" src="${p.video}?autoplay=1&muted=1&loop=1&title=0&byline=0" allow="autoplay; fullscreen" title="${p.title}"></iframe>`
    : `<div class="modal__media"><img src="${p.media[0]}" alt="${p.title} — ${p.client}" /></div>`;
  const stills = p.media.slice(p.video ? 0 : 1)
    .map((src) => `<div class="modal__media"><img loading="lazy" src="${src}" alt="${p.title} still" /></div>`)
    .join('');
  modalInner.innerHTML = `
    ${lead}
    <div class="modal__meta caption"><span>${p.client}</span><span>${p.year}</span><span>${p.role}</span></div>
    <h2 class="modal__title">${p.title}</h2>
    <p class="modal__blurb">${p.blurb}</p>
    ${stills}`;
  modal.hidden = false;
  modal.scrollTop = 0;
  document.body.style.overflow = 'hidden';
  lastFocus = document.activeElement as HTMLElement;
  modalClose.focus();
  gsap.fromTo(modal, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' });
  gsap.fromTo(modalInner, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'expo.out', delay: 0.05 });
}
function closeModal() {
  modal.hidden = true;
  modalInner.innerHTML = '';       // stops any playing iframe
  document.body.style.overflow = '';
  gsap.to(preview, { opacity: 0, duration: 0.2 });
  shownIdx = -1;
  lastFocus?.focus();
}
worklist.addEventListener('click', (e) => {
  const row = (e.target as HTMLElement).closest<HTMLElement>('.workrow');
  if (!row) return;
  openModal(projects[Number(row.dataset.i)]);
});
modalClose.addEventListener('click', closeModal);
window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

/* ---- Studio + clients copy (single source: projects.ts) --------- */
document.querySelector<HTMLElement>('[data-about]')!.textContent = site.about;
document.querySelector<HTMLElement>('[data-clients]')!.innerHTML =
  site.clients.split(' · ').map((c) => `<li>${c}</li>`).join('');

/* ---- Pause the video once the hero scrolls away -----------------
   Saves GPU + battery: when the hero is off screen we stop drawing
   the WebGL frame and pause the playing film; both resume on return. */
const hero = document.querySelector<HTMLElement>('.hero')!;
new IntersectionObserver(
  ([entry]) => {
    heroVisible = entry.isIntersecting;
    if (!current) return;
    if (heroVisible) { if (unlocked || !reducedMotion) current.el.play().catch(() => {}); }
    else current.el.pause();
  },
  { threshold: 0 },
).observe(hero);

/* ---- Section reveals -------------------------------------------
   CSS-class driven. Each item gets `.reveal`; the hidden state lives
   in CSS behind `.reveal-on` on <html>, so if JS never runs the
   content is simply visible. We add `.is-in` per item as its section
   enters, and unconditionally after a short fail-safe timer — so
   nothing is ever stuck hidden. CSS handles reduced-motion.        */
{
  // Reveal each SECTION as one block (static elements — avoids a quirk
  // where the dynamically-created rows wouldn't take the reveal class).
  const sections = [...document.querySelectorAll<HTMLElement>('[data-reveal], .footer')];
  document.documentElement.classList.add('reveal-on');
  sections.forEach((s) => s.classList.add('reveal'));

  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      obs.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -10% 0px' });
  sections.forEach((s) => io.observe(s));

  // fail-safe: whatever happens, never leave content hidden
  setTimeout(() => sections.forEach((s) => s.classList.add('is-in')), 2500);
}
