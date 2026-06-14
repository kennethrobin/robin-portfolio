/* ============================================================
   DIRECTION C — Hybrid
   Editorial index → click a work → its image lifts off the page
   as a WebGL plane and travels to a full-bleed spatial view.
   Back returns it to its exact spot in the index.

   The DOM↔WebGL sync: the plane's start and end rectangles are
   both DOM-derived, so the 8pt grid stays in charge throughout.
   ============================================================ */
import '@fontsource-variable/inter';
import './c.css';
import * as THREE from 'three';
import gsap from 'gsap';
import { projects, site, type Project } from '../data/projects';
import { createSmoothScroll, splitLines, reducedMotion, EASE, DUR } from '../shared/motion';
import { makeRenderer, makeWorkPlaneMaterial, loadTexture, syncPlaneToRect, type WorkPlaneUniforms } from '../shared/gl';
import { initWordmark } from '../shared/wordmark';

const lenis = createSmoothScroll();

/* ---- Rōbin wordmark (home button + idle motion) ------------- */
initWordmark(document.querySelector<HTMLElement>('[data-moniker]')!);

/* ---- Populate copy + index ----------------------------------- */
document.querySelector('[data-clients]')!.textContent = site.clients;

const list = document.querySelector<HTMLOListElement>('[data-index]')!;
projects.forEach((p, i) => {
  const li = document.createElement('li');
  li.className = 'card';
  li.innerHTML = `
    <a href="#${p.slug}" data-i="${i}">
      <div class="card__media"><img loading="lazy" src="${p.media[0]}" alt="${p.title} — ${p.client}" /></div>
      <div class="card__meta">
        <span class="card__title">${p.title}</span>
        <span class="caption muted">${p.client} · ${p.year}</span>
      </div>
    </a>`;
  list.appendChild(li);
});

/* ---- WebGL transition layer ----------------------------------- */
const canvas = document.querySelector<HTMLCanvasElement>('[data-stage]')!;
const renderer = makeRenderer(canvas);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 50);
camera.position.z = 10;

const plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 32, 32));
plane.visible = false;
scene.add(plane);

let uniforms: WorkPlaneUniforms | null = null;
const textures = new Map<string, THREE.Texture>();
function textureFor(p: Project) {
  if (!textures.has(p.slug)) textures.set(p.slug, loadTexture(p.media[0]));
  return textures.get(p.slug)!;
}

function resize() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
}
resize();
window.addEventListener('resize', resize);

// render only while the GL layer is doing something — saves the GPU
let glActive = false;
const clock = new THREE.Clock();
gsap.ticker.add(() => {
  if (!glActive) return;
  if (uniforms) uniforms.uTime.value = clock.getElapsedTime();
  renderer.render(scene, camera);
});

/* ---- The open / close choreography ----------------------------- */
const veil = document.querySelector<HTMLDivElement>('[data-veil]')!;
const detail = document.querySelector<HTMLElement>('[data-detail]')!;
const wrap = document.querySelector<HTMLDivElement>('[data-wrap]')!;
const dTitle = document.querySelector('[data-d-title]')!;
const dMeta = document.querySelector('[data-d-meta]')!;
const dBlurb = document.querySelector('[data-d-blurb]')!;

let openIdx = -1;
let sourceCard: HTMLElement | null = null;
let animating = false;

interface RectLike { left: number; top: number; width: number; height: number }
const rect = { left: 0, top: 0, width: 0, height: 0 };   // animated each frame

/** Full-bleed hero rectangle on the 8pt grid: page margins at the
    sides, masthead clearance above, copy block below. */
function heroRect(): RectLike {
  const margin = Math.min(innerWidth * 0.04, 64);
  const top = 64;
  const height = innerHeight * (innerWidth < 760 ? 0.48 : 0.56) - top;
  return { left: margin, top, width: innerWidth - margin * 2, height };
}

function setDetailCopy(p: Project) {
  dTitle.textContent = p.title;
  dMeta.textContent = `${p.client} · ${p.year} · ${p.role}`;
  dBlurb.textContent = p.blurb;
}

function openProject(i: number, card: HTMLElement) {
  if (animating || openIdx !== -1) return;
  animating = true;
  openIdx = i;
  sourceCard = card;
  const p = projects[i];

  // 1. plane takes the thumbnail's exact place
  const img = card.querySelector('img')!;
  const from = img.getBoundingClientRect();
  Object.assign(rect, { left: from.left, top: from.top, width: from.width, height: from.height });

  const mat = makeWorkPlaneMaterial({ texture: textureFor(p), tone: p.tone, drift: 0.012 });
  uniforms = mat.uniforms as WorkPlaneUniforms;
  uniforms.uReveal.value = 1;                       // texture is already on the page
  uniforms.uPlaneAspect.value = from.width / from.height;
  plane.material = mat;
  plane.visible = true;
  glActive = true;
  syncPlaneToRect(plane, rect, camera);
  card.classList.add('is-lifted');                  // hide the DOM twin
  lenis?.stop();
  document.body.classList.add('is-detail');

  // 2. travel: rect tweens to the hero frame while the page recedes
  const to = heroRect();
  setDetailCopy(p);
  const tl = gsap.timeline({
    defaults: { duration: 1.1, ease: EASE },
    onUpdate: () => {
      uniforms!.uPlaneAspect.value = rect.width / rect.height;
      syncPlaneToRect(plane, rect, camera);
    },
    onComplete: () => { animating = false; },
  });
  tl.to(rect, { ...to }, 0)
    // mid-flight tilt = the "dimensional" moment
    .to(plane.rotation, { y: -0.16, duration: 0.55, ease: 'power2.out' }, 0)
    .to(plane.rotation, { y: 0, duration: 0.55, ease: 'power2.in' }, 0.55)
    .to(veil, { opacity: 1, duration: 0.9 }, 0)
    .to(wrap, { scale: 0.97, opacity: 0.25, transformOrigin: '50% 40%', duration: 0.9 }, 0)
    .add(() => { detail.hidden = false; }, 0.45)
    .fromTo('.detail__copy > *',
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, stagger: 0.07, duration: 0.8 }, 0.55)
    .fromTo('.detail__back', { opacity: 0 }, { opacity: 1, duration: 0.6 }, 0.7);
}

function closeProject() {
  if (animating || openIdx === -1 || !sourceCard) return;
  animating = true;
  const card = sourceCard;
  const img = card.querySelector('img')!;
  const to = img.getBoundingClientRect();

  const tl = gsap.timeline({
    defaults: { duration: 0.9, ease: EASE },
    onUpdate: () => {
      uniforms!.uPlaneAspect.value = rect.width / rect.height;
      syncPlaneToRect(plane, rect, camera);
    },
    onComplete: () => {
      plane.visible = false;
      glActive = false;
      card.classList.remove('is-lifted');
      detail.hidden = true;
      document.body.classList.remove('is-detail');
      lenis?.start();
      openIdx = -1;
      sourceCard = null;
      animating = false;
      (card.querySelector('a') as HTMLElement)?.focus();
    },
  });
  tl.to('.detail__copy > *, .detail__back', { opacity: 0, y: 8, duration: 0.35, ease: 'power2.in' }, 0)
    .to(rect, { left: to.left, top: to.top, width: to.width, height: to.height }, 0.1)
    .to(veil, { opacity: 0 }, 0.1)
    .to(wrap, { scale: 1, opacity: 1 }, 0.1);
}

/** Prev/next inside the detail view: dip the plane, swap texture+copy. */
function step(dir: 1 | -1) {
  if (animating || openIdx === -1) return;
  const next = (openIdx + dir + projects.length) % projects.length;
  const p = projects[next];
  openIdx = next;
  // retarget the "return home" card so Back lands on the right row
  sourceCard?.classList.remove('is-lifted');
  sourceCard = list.children[next] as HTMLElement;
  sourceCard.classList.add('is-lifted');

  gsap.timeline()
    .to('.detail__copy > *', { opacity: 0, y: 8, duration: 0.2, ease: 'power2.in' }, 0)
    .to(uniforms!.uAlpha, { value: 0, duration: 0.3, ease: 'power2.in' }, 0)
    .add(() => {
      // swap material: new texture, new tone, fade back up
      const mat = makeWorkPlaneMaterial({ texture: textureFor(p), tone: p.tone, drift: 0.012 });
      uniforms = mat.uniforms as WorkPlaneUniforms;
      uniforms.uReveal.value = 1;
      uniforms.uAlpha.value = 0;
      uniforms.uPlaneAspect.value = rect.width / rect.height;
      plane.material = mat;
      setDetailCopy(p);
      gsap.to(uniforms.uAlpha, { value: 1, duration: 0.6, ease: EASE });
      gsap.fromTo('.detail__copy > *', { opacity: 0, y: 16 }, { opacity: 1, y: 0, stagger: 0.05, duration: 0.5, ease: EASE });
    });
}

/* ---- Wiring ----------------------------------------------------- */
list.addEventListener('click', (e) => {
  const a = (e.target as HTMLElement).closest<HTMLElement>('a[data-i]');
  if (!a) return;
  e.preventDefault();
  if (reducedMotion) {
    // calm path: no flight, straight to the detail state
    const i = Number(a.dataset.i);
    openIdx = i;
    sourceCard = a.parentElement as HTMLElement;
    setDetailCopy(projects[i]);
    veil.style.opacity = '1';
    detail.hidden = false;
    document.body.classList.add('is-detail');
    return;
  }
  openProject(Number(a.dataset.i), a.parentElement as HTMLElement);
});
document.querySelector('[data-back]')!.addEventListener('click', () => {
  if (reducedMotion) {
    veil.style.opacity = '0';
    detail.hidden = true;
    document.body.classList.remove('is-detail');
    openIdx = -1;
    return;
  }
  closeProject();
});
document.querySelector('[data-prev]')!.addEventListener('click', () => step(-1));
document.querySelector('[data-next]')!.addEventListener('click', () => step(1));
window.addEventListener('keydown', (e) => {
  if (openIdx === -1) return;
  if (e.key === 'Escape') closeProject();
  if (e.key === 'ArrowRight') step(1);
  if (e.key === 'ArrowLeft') step(-1);
});

/* ---- Entrance ---------------------------------------------------- */
if (!reducedMotion) {
  const lines = splitLines(document.querySelector('[data-split]')!);
  gsap.from(lines, { yPercent: 110, duration: DUR.slow, ease: EASE, stagger: 0.09, delay: 0.15 });
  gsap.from('.hero__sub', { opacity: 0, y: 16, duration: DUR.base, ease: EASE, delay: 0.7 });
  gsap.from('.card', { opacity: 0, y: 48, duration: DUR.base, ease: EASE, stagger: 0.08, delay: 0.5 });
}
