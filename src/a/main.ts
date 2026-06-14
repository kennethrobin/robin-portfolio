/* ============================================================
   DIRECTION A — Editorial / interface-forward
   - persistent masthead, labeled index, visible grid
   - cursor-following media preview on row hover
   - quick-view sheet per project (hero media + meta)
   ============================================================ */
import '@fontsource-variable/inter';
import './a.css';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { projects, site, type Project } from '../data/projects';
import { createSmoothScroll, splitLines, reducedMotion, EASE, DUR } from '../shared/motion';
import { initWordmark } from '../shared/wordmark';

gsap.registerPlugin(ScrollTrigger);
createSmoothScroll();

/* ---- Rōbin wordmark (home button + idle motion) ------------- */
initWordmark(document.querySelector<HTMLElement>('[data-moniker]')!);

/* ---- LA clock in the masthead ------------------------------- */
const clockEl = document.querySelector('[data-clock]')!;
const tick = () => {
  clockEl.textContent = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Los_Angeles',
  }).format(new Date());
};
tick();
setInterval(tick, 30_000);

/* ---- Populate copy ------------------------------------------ */
document.querySelector('[data-clients]')!.textContent = site.clients;
document.querySelector('[data-bio]')!.textContent = site.about;

/* ---- Build the index ---------------------------------------- */
const list = document.querySelector<HTMLOListElement>('[data-index]')!;
projects.forEach((p, i) => {
  const li = document.createElement('li');
  li.innerHTML = `
    <a class="index__row" href="#${p.slug}" data-i="${i}">
      <span class="index__no">${String(i + 1).padStart(2, '0')}</span>
      <span class="index__title">${p.title}</span>
      <span class="index__client">${p.client}</span>
      <span class="index__year">${p.year}</span>
      <span class="index__role">${p.role}</span>
    </a>`;
  list.appendChild(li);
});

/* ---- Cursor-following preview -------------------------------
   One fixed element; GSAP quickTo gives it the lagging, weighty
   follow. Image swaps per row with a tiny crossfade.            */
const preview = document.querySelector<HTMLDivElement>('[data-preview]')!;
const previewImg = preview.querySelector('img')!;
const px = gsap.quickTo(preview, 'x', { duration: 0.5, ease: 'power3.out' });
const py = gsap.quickTo(preview, 'y', { duration: 0.5, ease: 'power3.out' });

if (!reducedMotion) {
  window.addEventListener('pointermove', (e) => {
    px(e.clientX - 160);          // centre the 320px card on the cursor x
    py(e.clientY - 100);
  });
}

let shownIdx = -1;
list.addEventListener('pointerover', (e) => {
  const row = (e.target as HTMLElement).closest<HTMLElement>('.index__row');
  if (!row) return;
  const i = Number(row.dataset.i);
  if (i === shownIdx) return;
  shownIdx = i;
  previewImg.src = projects[i].media[0];
  gsap.to(preview, { opacity: 1, scale: 1, duration: DUR.fast, ease: EASE });
});
list.addEventListener('pointerleave', () => {
  shownIdx = -1;
  gsap.to(preview, { opacity: 0, scale: 0.96, duration: DUR.fast, ease: EASE });
});

/* ---- Quick-view sheet ---------------------------------------- */
const sheet = document.querySelector<HTMLDivElement>('[data-sheet]')!;
const sheetInner = sheet.querySelector<HTMLDivElement>('.sheet__inner')!;
const sheetClose = sheet.querySelector<HTMLButtonElement>('[data-sheet-close]')!;
let lastFocus: HTMLElement | null = null;

function openSheet(p: Project) {
  const media = p.video
    ? `<iframe class="sheet__video" src="${p.video}?autoplay=1&muted=1&loop=1&title=0&byline=0" allow="autoplay; fullscreen" title="${p.title} — video"></iframe>`
    : `<div class="sheet__media"><img src="${p.media[0]}" alt="${p.title} — ${p.client}" /></div>`;
  const stills = p.media.slice(p.video ? 0 : 1).map(
    (src) => `<div class="sheet__media"><img loading="lazy" src="${src}" alt="${p.title} still" /></div>`,
  ).join('');
  sheetInner.innerHTML = `
    ${media}
    <div class="sheet__meta caption">
      <span>${p.client}</span><span>${p.year}</span><span>${p.role}</span>
    </div>
    <h2 class="h2">${p.title}</h2>
    <p class="sheet__blurb">${p.blurb}</p>
    ${stills}`;
  sheet.hidden = false;
  document.body.style.overflow = 'hidden';
  lastFocus = document.activeElement as HTMLElement;
  sheetClose.focus();
  gsap.fromTo(sheet, { yPercent: 4, opacity: 0 }, { yPercent: 0, opacity: 1, duration: DUR.fast, ease: EASE });
}
function closeSheet() {
  sheet.hidden = true;
  sheetInner.innerHTML = '';      // stops any playing iframe
  document.body.style.overflow = '';
  lastFocus?.focus();
}
list.addEventListener('click', (e) => {
  const row = (e.target as HTMLElement).closest<HTMLElement>('.index__row');
  if (!row) return;
  e.preventDefault();
  openSheet(projects[Number(row.dataset.i)]);
});
sheetClose.addEventListener('click', closeSheet);
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !sheet.hidden) closeSheet();
});

/* ---- Entrance choreography ----------------------------------- */
if (!reducedMotion) {
  // statement: masked line-by-line rise
  const lines = splitLines(document.querySelector('[data-split]')!);
  gsap.from(lines, {
    yPercent: 110,
    duration: DUR.slow,
    ease: EASE,
    stagger: 0.09,
    delay: 0.15,
  });
  gsap.from('.hero__clients, .hero__cue', {
    opacity: 0, y: 16, duration: DUR.base, ease: EASE, delay: 0.7,
  });
  // index rows rise in as they enter the viewport
  gsap.utils.toArray<HTMLElement>('.index__row').forEach((row) => {
    gsap.from(row, {
      opacity: 0,
      y: 32,
      duration: DUR.base,
      ease: EASE,
      scrollTrigger: { trigger: row, start: 'top 92%' },
    });
  });
}
