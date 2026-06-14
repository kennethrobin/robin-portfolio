/* ============================================================
   Shared "Rōbin" wordmark
   Splits the mark into letters, plays a small entrance, then keeps
   it quietly alive with a random tasteful flourish every few seconds.

   Used as the home button on every page — click it to return to the
   landing. Add / tune flourishes in the FLOURISHES list below.
   ============================================================ */
import './wordmark.css';
import gsap from 'gsap';
import { reducedMotion } from './motion';

interface Ctx {
  host: HTMLElement;
  letters: HTMLElement[];
}

/* ---- The idle motion library --------------------------------------
   Each flourish must START and END at the wordmark's resting state
   (transform identity) so they can fire in any order, forever, without
   the mark slowly drifting out of place. Keep them subtle.           */
const FLOURISHES: Array<(c: Ctx) => void> = [
  // 1 · ripple — a wave travels across the letters
  ({ letters }) => {
    gsap.timeline().to(letters, {
      yPercent: -18,
      duration: 0.5,
      ease: 'sine.inOut',
      stagger: { each: 0.05, repeat: 1, yoyo: true },
    });
  },

  // 2 · hop — one random letter jumps and settles
  ({ letters }) => {
    const i = gsap.utils.random(0, letters.length - 1, 1);
    gsap.timeline()
      .to(letters[i], { yPercent: -38, duration: 0.26, ease: 'power2.out' })
      .to(letters[i], { yPercent: 0, duration: 0.75, ease: 'back.out(2.6)' });
  },

  // 3 · breathe — the whole mark swells a touch
  ({ host }) => {
    gsap.timeline({ defaults: { transformOrigin: '0% 50%' } })
      .to(host, { scale: 1.06, duration: 1.1, ease: 'sine.inOut' })
      .to(host, { scale: 1, duration: 1.1, ease: 'sine.inOut' });
  },

  // 4 · tilt — letters lean to random angles, then spring back level
  ({ letters }) => {
    gsap.timeline()
      .to(letters, {
        rotation: () => gsap.utils.random(-7, 7),
        duration: 0.4, ease: 'power1.inOut', stagger: 0.03,
      })
      .to(letters, {
        rotation: 0, duration: 0.9, ease: 'elastic.out(1, 0.6)', stagger: 0.03,
      });
  },

  // 5 · lean — the mark leans like italic, then springs upright
  ({ host }) => {
    gsap.timeline({ defaults: { transformOrigin: '0% 100%' } })
      .to(host, { skewX: -7, duration: 0.45, ease: 'power2.out' })
      .to(host, { skewX: 0, duration: 1.0, ease: 'elastic.out(1, 0.5)' });
  },
];

/** Turn an element's text into the animated Rōbin wordmark. */
export function initWordmark(host: HTMLElement): void {
  const text = host.dataset.word ?? ((host.textContent || '').trim() || 'Rōbin');
  host.textContent = '';
  host.classList.add('wordmark');

  const letters = [...text].map((ch) => {
    const s = document.createElement('span');
    s.className = 'wordmark__ltr';
    s.textContent = ch;
    s.setAttribute('aria-hidden', 'true');
    host.appendChild(s);
    return s;
  });

  if (reducedMotion) return;            // calm: static wordmark, no idle

  // entrance — a quick staggered rise + fade
  gsap.from(letters, {
    yPercent: 60, opacity: 0,
    duration: 1.0, ease: 'expo.out', stagger: 0.06, delay: 0.25,
  });

  // idle — random flourish every few seconds, never the same one twice
  const ctx: Ctx = { host, letters };
  let last = -1;
  const tick = () => {
    let i = gsap.utils.random(0, FLOURISHES.length - 1, 1);
    if (i === last) i = (i + 1) % FLOURISHES.length;
    last = i;
    if (!document.hidden) FLOURISHES[i](ctx);
    gsap.delayedCall(gsap.utils.random(4, 8), tick);   // randomized cadence
  };
  gsap.delayedCall(gsap.utils.random(3, 5), tick);
}
