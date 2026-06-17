/* ============================================================
   DIRECTION D — "Rōbin"

   A fullscreen WebGL screen plays Kenneth's films back-to-back in a
   shuffled order, hard-cutting from one clip to the next so a visitor
   sees as much work as possible in the first seconds.

   How the cuts work
   -----------------
   Every film is its own <video> element (muted, preloaded). Two are
   "live" at any moment: the one on screen and the next one, which we
   start playing off-screen a beat before the cut so the hard cut always
   lands on a clip that's already moving. Only two elements ever load, so
   we never download every clip at once.

   Tweakables live in CLIP below.
   ============================================================ */
import './d.css';
import * as THREE from 'three';
import gsap from 'gsap';
import { projects, site, type Project } from '../data/projects';
import { heroClips } from '../data/clips';
import { initWordmark } from '../shared/wordmark';

/* ---- The reel ------------------------------------------------
   A shuffled playlist of full clips. Each clip plays start-to-end, then
   HARD-CUTS to the next; at the end of the list it loops back to the
   first clip played. Only two video elements ever load (the one on
   screen + the one preloading), so we never download every clip at once.

   `warm` is how many seconds before a clip ends we start the next clip
   playing off-screen, so the hard cut always lands on a clip that's
   already moving — never a frozen first frame.                       */
const CLIP = {
  grain: 0.05,  // constant film grain (0 = clean)
  warm: 0.25,   // seconds the incoming clip pre-rolls before the cut
};

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Fisher-Yates shuffle — a fresh random order on every visit. */
function shuffle<T>(arr: readonly T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const playlist = shuffle(heroClips);   // random order; loops from the top
let pos = 0;
const nextPos = () => (pos + 1) % playlist.length;

/* Two reusable video slots: the one on screen + the one preloading. */
interface Slot { el: HTMLVideoElement; tex: THREE.VideoTexture; }
function makeSlot(): Slot {
  const el = document.createElement('video');
  // mobile autoplay policies check the *attributes*, not just the JS props
  el.muted = true; el.setAttribute('muted', '');
  el.playsInline = true; el.setAttribute('playsinline', ''); el.setAttribute('webkit-playsinline', '');
  el.preload = 'auto';
  el.crossOrigin = 'anonymous';
  const tex = new THREE.VideoTexture(el);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  return { el, tex };
}
let cur = makeSlot();
let nxt = makeSlot();

const aspectOf = (s: Slot) => (s.el.videoWidth ? s.el.videoWidth / s.el.videoHeight : 16 / 9);

/** Point a slot at a clip; resolves once a frame is decodable. */
function loadInto(slot: Slot, url: string): Promise<void> {
  return new Promise((resolve) => {
    const done = () => { slot.el.removeEventListener('loadeddata', done); resolve(); };
    slot.el.addEventListener('loadeddata', done);
    slot.el.src = url;
    slot.el.load();
  });
}

/* ---- WebGL screen ----------------------------------------------- */
const canvas = document.querySelector<HTMLCanvasElement>('[data-screen]')!;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

const uniforms = {
  uTex: { value: cur.tex },        // the clip currently on screen
  uAspect: { value: 16 / 9 },      // its native aspect ratio
  uScreen: { value: innerWidth / innerHeight },
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
    uniform sampler2D uTex;
    uniform float uAspect, uScreen, uTime, uGrain;
    varying vec2 vUv;

    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

    // CSS object-fit: cover, in shader form
    vec2 coverUV(vec2 uv, float texAspect, float screenAspect) {
      vec2 d = uv - 0.5;
      if (screenAspect > texAspect) d.y *= texAspect / screenAspect;
      else d.x *= screenAspect / texAspect;
      return d + 0.5;
    }

    void main() {
      vec3 col = texture2D(uTex, coverUV(vUv, uAspect, uScreen)).rgb;
      // constant film grain
      col += (hash(vUv * vec2(1920.0, 1080.0) + fract(uTime) * 60.0) - 0.5) * uGrain;
      gl_FragColor = vec4(col, 1.0);
    }
  `,
});
scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), screenMat));

function resize() {
  // size to the canvas's own box (the CSS hero band), not the full window,
  // so the reel is cover-fit + centered within the visible video area
  const w = canvas.clientWidth || innerWidth;
  const h = canvas.clientHeight || innerHeight;
  renderer.setSize(w, h, false);            // false = leave canvas CSS size alone
  uniforms.uScreen.value = w / h;
}
resize();
window.addEventListener('resize', resize);

// Only render while the hero is on screen — once the solid sections
// cover the video there's nothing to draw, so we save the GPU.
let heroVisible = true;
gsap.ticker.add(() => {
  if (!heroVisible) return;
  uniforms.uTime.value = performance.now() / 1000;
  maybeScheduleCut();
  renderer.render(scene, camera);
});

/* ---- Playback ---------------------------------------------------
   Play each clip start-to-end, then hard-cut to the preloaded next.
   At the end of the shuffled list it loops back to the first clip.  */
const taphint = document.querySelector<HTMLElement>('[data-taphint]')!;
let unlocked = false;
let transitioning = false;
let cutScheduled = false;   // true once a cut has been kicked off for the current clip

/** First touch on phones that block autoplay: start the reel and
    "bless" the next slot so later programmatic play() calls work. */
function unlockPlayback() {
  if (unlocked) return;
  unlocked = true;
  taphint.hidden = true;
  cur.el.play().catch(() => {});
  nxt.el.play().then(() => nxt.el.pause()).catch(() => {});
}
window.addEventListener('pointerdown', unlockPlayback);
window.addEventListener('touchstart', unlockPlayback, { passive: true });

/** Resolve once the video has actually painted a fresh frame, so the
    incoming clip is already moving the instant we cut to it (never a
    frozen first frame). Falls back to a short timeout if rVFC is
    unavailable or playback is blocked. */
function firstFrame(el: HTMLVideoElement, timeout = 200): Promise<void> {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => { if (!done) { done = true; resolve(); } };
    const v = el as unknown as { requestVideoFrameCallback?: (cb: () => void) => number };
    if (typeof v.requestVideoFrameCallback === 'function') v.requestVideoFrameCallback(finish);
    else requestAnimationFrame(finish);
    setTimeout(finish, timeout);   // never stall the reel if no frame arrives
  });
}

/** Clip-end safety net: if the scheduler ever misses the cut (e.g. a
    backgrounded tab throttled the ticker), cut as soon as the clip ends
    so the reel never stalls on a finished video. */
function onEnded() {
  if (!transitioning) advance();
}

/** Run every render frame: a hair BEFORE the current clip ends, kick off
    the cut so we can warm the next clip and hard-cut while the outgoing
    one is still moving (no freeze on either side). */
function maybeScheduleCut() {
  if (reducedMotion || transitioning || cutScheduled) return;
  const el = cur.el;
  const d = el.duration;
  if (el.paused || !isFinite(d) || d <= 0) return;
  const lead = Math.min(CLIP.warm, d * 0.5);
  if (el.currentTime >= d - lead) {
    cutScheduled = true;
    advance();
  }
}

/** Hard-cut to the preloaded next clip, then promote it.
    Triggered by the scheduler above (or the ended safety net). */
async function advance() {
  if (transitioning) return;
  transitioning = true;
  cutScheduled = true;

  // Warm the incoming clip up (playing + one real decoded frame) while the
  // outgoing clip is still on screen, so the cut lands on a moving frame.
  nxt.el.currentTime = 0;
  await nxt.el.play().catch(() => {});
  await firstFrame(nxt.el);

  // the cut: swap the visible texture in a single frame
  uniforms.uTex.value = nxt.tex;
  uniforms.uAspect.value = aspectOf(nxt);

  // promote nxt -> cur; the old slot is freed to preload the next clip
  cur.el.removeEventListener('ended', onEnded);
  cur.el.pause();
  [cur, nxt] = [nxt, cur];
  pos = nextPos();
  cur.el.addEventListener('ended', onEnded);
  transitioning = false;
  cutScheduled = false;

  loadInto(nxt, playlist[nextPos()]);   // queue the clip after this one
}

async function startReel() {
  await loadInto(cur, playlist[pos]);
  uniforms.uTex.value = cur.tex;
  uniforms.uAspect.value = aspectOf(cur);

  if (reducedMotion) {
    // calm fallback: hold one still frame, no playback or cuts
    cur.el.currentTime = Math.min(1.2, (cur.el.duration || 2) * 0.3);
    return;
  }

  await cur.el.play().catch(() => {});
  if (cur.el.paused && !unlocked) taphint.hidden = false;  // autoplay blocked
  cur.el.addEventListener('ended', onEnded);
  loadInto(nxt, playlist[nextPos()]);    // preload the next clip
}
startReel();

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
// Keep the original index in data-i (so hover preview + modal still map
// to projects[i]) while hiding any project flagged hidden.
worklist.innerHTML = projects
  .map((p, i) => ({ p, i }))
  .filter(({ p }) => !p.hidden)
  .map(({ p, i }) => `
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

/* Looping, muted, inline local video (used by case-study lead + blocks). */
const loopVideo = (src: string, cls: string, label: string): string =>
  `<video class="${cls}" src="${src}" autoplay muted loop playsinline preload="metadata" aria-label="${label}"></video>`;

/* Rich studio-style case study (only when project.study is present). */
function renderStudy(p: Project): string {
  const s = p.study!;
  const intro = s.intro.map((para) => `<p>${para}</p>`).join('');
  const blocks = s.blocks.map((b) => {
    switch (b.kind) {
      case 'text':
        return `<div class="case__text">${b.body.map((t) => `<p>${t}</p>`).join('')}</div>`;
      case 'image':
        return `<figure class="case__media"><img loading="lazy" src="${b.src}" alt="${p.title} — ${p.client}" />${b.cap ? `<figcaption class="case__cap caption">${b.cap}</figcaption>` : ''}</figure>`;
      case 'video': {
        // controls:true lets the viewer unmute / scrub; still autoplays muted + loops.
        const ctrl = b.controls ? ' controls' : '';
        const vid = `<video class="case__video" src="${b.src}" autoplay muted loop playsinline preload="metadata"${ctrl} aria-label="${p.title} — ${p.client}"></video>`;
        return `<figure class="case__media">${vid}${b.cap ? `<figcaption class="case__cap caption">${b.cap}</figcaption>` : ''}</figure>`;
      }
      case 'grid':
        return `<div class="case__grid">${b.src.map((src) => `<div class="case__cell"><img loading="lazy" src="${src}" alt="${p.title} detail" /></div>`).join('')}</div>`;
      case 'videogrid': {
        const cells = b.src.map((src) => `<div class="case__vcell">${loopVideo(src, 'case__vcellvid', `${p.title} element`)}</div>`).join('');
        return `<figure class="case__media"><div class="case__vgrid">${cells}</div>${b.cap ? `<figcaption class="case__cap caption">${b.cap}</figcaption>` : ''}</figure>`;
      }
    }
  }).join('');
  const credits = s.credits
    .map((c) => `<div class="case__credit"><dt>${c.role}</dt><dd>${c.name}</dd></div>`)
    .join('');
  // Lead film: a remote embed (Vimeo) plays in an iframe; a local
  // file plays as a muted, looping inline video.
  const lead = /^https?:/.test(s.lead)
    ? `<iframe class="case__lead case__lead--embed" src="${s.lead}?autoplay=1&muted=1&loop=1&title=0&byline=0" allow="autoplay; fullscreen" title="${p.title} — ${p.client}"></iframe>`
    : loopVideo(s.lead, 'case__lead', `${p.title} — ${p.client}`);
  return `
    ${lead}
    <div class="modal__meta caption"><span>${p.client}</span><span>${p.year}</span><span>${p.role}</span></div>
    <h2 class="modal__title">${p.title}</h2>
    <div class="case__intro">${intro}</div>
    ${blocks}
    <dl class="case__credits">${credits}</dl>`;
}

function openModal(p: Project) {
  if (p.study) {
    modalInner.innerHTML = renderStudy(p);
    modal.hidden = false;
    modal.scrollTop = 0;
    document.body.style.overflow = 'hidden';
    lastFocus = document.activeElement as HTMLElement;
    modalClose.focus();
    gsap.fromTo(modal, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' });
    gsap.fromTo(modalInner, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'expo.out', delay: 0.05 });
    return;
  }
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
    if (transitioning) return;       // don't fight an in-flight dissolve
    if (heroVisible) { if (!reducedMotion) cur.el.play().catch(() => {}); }
    else cur.el.pause();
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
