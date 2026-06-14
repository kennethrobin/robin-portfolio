/* ============================================================
   Shared motion helpers — one easing language for the site.
   ============================================================ */
import gsap from 'gsap';
import Lenis from 'lenis';

/** True when the visitor asked the OS for less motion.
    Every animated feature checks this and falls back calm. */
export const reducedMotion =
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* The house easing — a long decelerating tail. Weighty, never bouncy.
   Tweak here and the entire site changes character. */
export const EASE = 'expo.out';
export const DUR = { fast: 0.5, base: 0.9, slow: 1.4 };

/** Smooth inertial scrolling (Lenis), wired into GSAP's ticker
    so scroll position and animation share one clock. */
export function createSmoothScroll(): Lenis | null {
  if (reducedMotion) return null; // native scroll is the calm fallback
  const lenis = new Lenis({
    duration: 1.1,        // scroll "weight" — higher = heavier glide
    smoothWheel: true,
  });
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

/** Split a heading into per-line spans for staggered reveals.
    Wraps words, measures line breaks, then groups by line. */
export function splitLines(el: HTMLElement): HTMLElement[] {
  const text = el.textContent ?? '';
  el.textContent = '';
  const words = text.split(/\s+/).filter(Boolean);
  // plain inline spans separated by real text-node spaces, so the
  // browser keeps normal word spacing and line wrapping
  const spans = words.map((w) => {
    const s = document.createElement('span');
    s.textContent = w;
    el.appendChild(s);
    el.appendChild(document.createTextNode(' '));
    return s;
  });
  // group words that share an offsetTop into "lines"
  const lines: HTMLElement[][] = [];
  let top: number | null = null;
  for (const s of spans) {
    if (s.offsetTop !== top) {
      lines.push([]);
      top = s.offsetTop;
    }
    lines[lines.length - 1].push(s);
  }
  // wrap each line in a masked container so it can slide up into view
  return lines.map((lineWords) => {
    const mask = document.createElement('span');
    mask.style.cssText = 'display:block;overflow:hidden;';
    const inner = document.createElement('span');
    inner.style.display = 'block';
    el.insertBefore(mask, lineWords[0]);
    lineWords.forEach((w) => {
      const space = w.nextSibling;            // the text-node space
      inner.appendChild(w);
      if (space) inner.appendChild(space);    // keep it with its word
    });
    mask.appendChild(inner);
    return inner;
  });
}
