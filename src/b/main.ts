/* ============================================================
   DIRECTION B — Dimensional space
   The work hangs as planes in depth. Scroll = a weighty camera
   dolly through them. Labels live in the DOM and crossfade as
   the nearest work changes. UI fades while travelling.

   Tweakables are grouped in CONFIG below.
   ============================================================ */
import '@fontsource-variable/inter';
import './b.css';
import * as THREE from 'three';
import gsap from 'gsap';
import Lenis from 'lenis';
import { projects, type Project } from '../data/projects';
import { reducedMotion, EASE, DUR } from '../shared/motion';
import { makeRenderer, makeWorkPlaneMaterial, loadTexture, type WorkPlaneUniforms } from '../shared/gl';
import { initWordmark } from '../shared/wordmark';

/* ---- CONFIG — play with these ------------------------------- */
const CONFIG = {
  planeW: 4.2,          // plane width in world units
  planeAspect: 16 / 10, // plane shape
  gapZ: 6,              // distance between works along the travel axis
  lateral: 1.25,        // how far planes alternate left/right
  vertical: 0.4,        // slight up/down rhythm
  camStart: 5,          // camera rest position before the first work
  focusDist: 5,         // how far from a plane the camera "presents" it
  scrollPerWork: 90,    // vh of scroll per project — higher = slower travel
  fadeNear: 2.0,        // planes closer than this fade out (camera passes through)
  fadeFar: 16,          // planes further than this are dim
};

/* ---- Rōbin wordmark (home button + idle motion) -------------
   Init before the fallback bail-out so the home button always works. */
initWordmark(document.querySelector<HTMLElement>('[data-moniker]')!);

/* ---- Fallback path (reduced motion / no WebGL) --------------- */
const canvas = document.querySelector<HTMLCanvasElement>('[data-stage]')!;
const gl2 = canvas.getContext('webgl2');
if (reducedMotion || !gl2) {
  document.body.classList.add('is-fallback');
  const ol = document.querySelector('[data-fallback] ol')!;
  projects.forEach((p) => {
    const li = document.createElement('li');
    li.innerHTML = `<a href="${p.media[0]}" target="_blank" rel="noreferrer">
      <span><img loading="lazy" src="${p.media[0]}" alt="${p.title} — ${p.client}" />
      <span class="h2">${p.title}</span></span>
      <span class="caption muted">${p.client} · ${p.year}</span></a>`;
    ol.appendChild(li);
  });
  throw new Error('static fallback'); // stop the WebGL path entirely
}

/* ---- Scene ---------------------------------------------------- */
const renderer = makeRenderer(canvas);
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x0c0c0e, CONFIG.fadeNear, CONFIG.fadeFar); // depth haze (fog only affects fog-aware materials; we fade alpha manually too)
const camera = new THREE.PerspectiveCamera(46, innerWidth / innerHeight, 0.1, 60);
camera.position.set(0, 0, CONFIG.camStart);

interface Work {
  mesh: THREE.Mesh;
  uniforms: WorkPlaneUniforms;
  z: number;
  project: Project;
}

const planeGeo = new THREE.PlaneGeometry(1, 1);
const works: Work[] = projects.map((p, i) => {
  const mat = makeWorkPlaneMaterial({ texture: loadTexture(p.media[0]), tone: p.tone });
  const uniforms = mat.uniforms as WorkPlaneUniforms;
  uniforms.uPlaneAspect.value = CONFIG.planeAspect;
  const mesh = new THREE.Mesh(planeGeo, mat);
  const z = -i * CONFIG.gapZ;
  // alternate left / right, with a gentle vertical rhythm
  const side = i % 2 === 0 ? -1 : 1;
  mesh.position.set(side * CONFIG.lateral, ((i % 3) - 1) * CONFIG.vertical, z);
  mesh.scale.set(CONFIG.planeW, CONFIG.planeW / CONFIG.planeAspect, 1);
  scene.add(mesh);
  return { mesh, uniforms, z, project: p };
});

/* ---- Scroll → camera travel ----------------------------------
   The page body gets a tall spacer; Lenis smooths the scroll and
   we map progress onto the camera's z position.                  */
const spacer = document.createElement('div');
spacer.style.height = `${(projects.length * CONFIG.scrollPerWork) + 100}vh`;
spacer.style.pointerEvents = 'none';
document.body.appendChild(spacer);

const lenis = new Lenis({ duration: 1.35, smoothWheel: true });
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);

// start the camera a touch further back so the opening frame
// settles forward with the same weight as the scroll itself
const travel = { z: CONFIG.camStart + 4 };
const lastZ = works[works.length - 1].z;
let progress = 0;
lenis.on('scroll', ({ progress: pr }: { progress: number }) => { progress = pr; });

/* ---- UI: counter, label crossfade, travel fading -------------- */
const counterEl = document.querySelector('[data-counter]')!;
const labelTitle = document.querySelector('[data-label-title]')!;
const labelMeta = document.querySelector('[data-label-meta]')!;
const labelWrap = document.querySelector('.ui--label')!;
const uis = document.querySelectorAll('.ui');
let currentIdx = -1;
let settleTimer: ReturnType<typeof setTimeout> | undefined;

function setLabel(i: number) {
  if (i === currentIdx) return;
  currentIdx = i;
  const p = projects[i];
  gsap.timeline()
    .to(labelWrap, { opacity: 0, y: 8, duration: 0.25, ease: 'power2.in' })
    .add(() => {
      labelTitle.textContent = p.title;
      labelMeta.textContent = `${p.client} · ${p.year} · ${p.role}`;
      counterEl.textContent = `${String(i + 1).padStart(2, '0')} / ${String(projects.length).padStart(2, '0')}`;
    })
    .to(labelWrap, { opacity: 1, y: 0, duration: DUR.fast, ease: EASE });
}
setLabel(0);

// hide chrome while moving, bring it back when the camera settles
function markTravelling() {
  uis.forEach((u) => u.classList.add('is-travelling'));
  clearTimeout(settleTimer);
  settleTimer = setTimeout(
    () => uis.forEach((u) => u.classList.remove('is-travelling')),
    450,
  );
}
window.addEventListener('wheel', markTravelling, { passive: true });
window.addEventListener('touchmove', markTravelling, { passive: true });

/* ---- Hover: raycast + eased uHover ---------------------------- */
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2(-2, -2);
let hovered: Work | null = null;
window.addEventListener('pointermove', (e) => {
  pointer.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
});

/* ---- Click the focused plane → quick view --------------------- */
const sheet = document.querySelector<HTMLDivElement>('[data-sheet]')!;
const sheetInner = sheet.querySelector<HTMLDivElement>('.sheet__inner')!;
const sheetClose = sheet.querySelector<HTMLButtonElement>('[data-sheet-close]')!;
function openSheet(p: Project) {
  const media = p.video
    ? `<iframe class="sheet__video" src="${p.video}?autoplay=1&muted=1&loop=1&title=0&byline=0" allow="autoplay; fullscreen" title="${p.title} — video"></iframe>`
    : `<div class="sheet__media"><img src="${p.media[0]}" alt="${p.title} — ${p.client}" /></div>`;
  const stills = p.media.slice(p.video ? 0 : 1).map(
    (src) => `<div class="sheet__media"><img loading="lazy" src="${src}" alt="${p.title} still" /></div>`,
  ).join('');
  sheetInner.innerHTML = `${media}
    <div class="sheet__meta caption"><span>${p.client}</span><span>${p.year}</span><span>${p.role}</span></div>
    <h2 class="h2">${p.title}</h2>
    <p class="sheet__blurb">${p.blurb}</p>${stills}`;
  sheet.hidden = false;
  lenis.stop();
  sheetClose.focus();
  gsap.fromTo(sheet, { opacity: 0 }, { opacity: 1, duration: DUR.fast, ease: EASE });
}
function closeSheet() {
  sheet.hidden = true;
  sheetInner.innerHTML = '';
  lenis.start();
}
sheetClose.addEventListener('click', closeSheet);
window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !sheet.hidden) closeSheet(); });
canvas.addEventListener('click', () => { if (hovered) openSheet(hovered.project); });

/* ---- Resize ---------------------------------------------------- */
function resize() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
}
resize();
window.addEventListener('resize', resize);

/* ---- Render loop ----------------------------------------------
   Paused automatically when the tab is hidden (rAF throttles),
   and skipped entirely when the quick-view sheet is open.        */
const clock = new THREE.Clock();
gsap.ticker.add(() => {
  if (!sheet.hidden) return;
  const t = clock.getElapsedTime();

  // camera: ease toward the scroll target — the "weight"
  const targetZ = CONFIG.camStart + progress * (lastZ + CONFIG.focusDist - CONFIG.camStart);
  travel.z += (targetZ - travel.z) * 0.06;          // lower = heavier camera
  camera.position.z = travel.z;
  // subtle parallax drift from the pointer
  camera.position.x += (pointer.x * 0.25 - camera.position.x) * 0.04;
  camera.position.y += (pointer.y * 0.15 - camera.position.y) * 0.04;
  camera.lookAt(0, 0, travel.z - CONFIG.focusDist);

  // nearest work drives the DOM label
  const idx = THREE.MathUtils.clamp(
    Math.round((travel.z - CONFIG.camStart) / (lastZ + CONFIG.focusDist - CONFIG.camStart) * (projects.length - 1)),
    0, projects.length - 1,
  );
  setLabel(idx);

  // hover raycast
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(works.map((w) => w.mesh))[0];
  const target = hit ? works.find((w) => w.mesh === hit.object)! : null;
  if (target !== hovered) {
    if (hovered) gsap.to(hovered.uniforms.uHover, { value: 0, duration: 0.6, ease: EASE });
    if (target) gsap.to(target.uniforms.uHover, { value: 1, duration: 0.6, ease: EASE });
    hovered = target;
    document.body.style.cursor = target ? 'pointer' : '';
  }

  // per-plane: time + depth-based fade (pass-through + distance haze)
  for (const w of works) {
    w.uniforms.uTime.value = t;
    const d = travel.z - w.z;     // distance camera→plane along travel axis
    let a = 1;
    if (d < CONFIG.fadeNear) a = THREE.MathUtils.clamp(d / CONFIG.fadeNear, 0, 1);
    else if (d > CONFIG.fadeFar) a = THREE.MathUtils.clamp(1 - (d - CONFIG.fadeFar) / 6, 0, 1);
    w.uniforms.uAlpha.value = a * (w.uniforms.uReveal.value * 0.9 + 0.1);
  }

  renderer.render(scene, camera);
});

/* ---- Entrance ---------------------------------------------------
   The .ui elements own a CSS opacity transition (used for the
   travel fade), so the entrance uses the same mechanism instead of
   a GSAP tween — two systems animating one property would fight.  */
uis.forEach((u) => u.classList.add('is-travelling'));
setTimeout(() => uis.forEach((u) => u.classList.remove('is-travelling')), 700);
