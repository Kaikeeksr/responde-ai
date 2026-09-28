import { gsap } from '../lib/vendor.js';
import { h, center, calm, usesMouse } from '../lib/dom.js';

const { random } = gsap.utils;
const REACH = 140;       // px até o dedo/cursor que já faz o Não fugir
const FAR_ENOUGH = 170;  // px: com cursor, para de procurar quando acha um lugar tão longe assim
const CLEARANCE = 14;    // px de folga até o botão que ele evita
const RESTLESS_MS = 220; // no toque, depois da primeira fuga ele não para mais quieto

export function createNoButton(label, { area, avoid, onMove }) {
  const el = h('button', { type: 'button', className: 'btn no', textContent: label });
  const cursorOf = e => (usesMouse ? { x: e.clientX, y: e.clientY } : undefined);
  let moved, restless;

  // só transform (x/y), nada de left/top: a fuga não recalcula o layout a cada quadro
  function flee(cursor) {
    const [left, top] = pickSpot(area.getBoundingClientRect(), el, avoid.getBoundingClientRect(), cursor);
    moved = true;
    gsap.to(el, {
      x: left - el.offsetLeft, y: top - el.offsetTop, xPercent: 0, rotation: calm ? 0 : 'random(-12, 12)',
      duration: calm ? 0 : 0.35, ease: 'expo.out', overwrite: 'auto', onUpdate: onMove,
    });
    if (!calm) gsap.fromTo(el, { scaleX: 1.2, scaleY: 0.8 }, { scaleX: 1, scaleY: 1, duration: 0.6, ease: 'elastic.out(1, 0.3)', overwrite: 'auto' });
    if (!usesMouse) restless ??= setInterval(flee, RESTLESS_MS);
  }

  const approach = e => {
    const p = e.touches ? e.touches[0] : e;
    const c = center(el);
    if (p && Math.hypot(p.clientX - c.x, p.clientY - c.y) < REACH) flee(cursorOf(p));
  };
  const dodge = e => {
    e.preventDefault();
    flee(cursorOf(e));
  };

  return {
    el,
    // foge até o signal ser abortado; cada entrada recomeça do lugar original
    enter(signal) {
      moved = false;
      for (const type of ['mousemove', 'touchmove', 'touchstart']) document.addEventListener(type, approach, { passive: true, signal });
      el.addEventListener('pointerenter', e => flee(cursorOf(e)), { signal });
      el.addEventListener('pointerdown', dodge, { signal });
      el.addEventListener('click', dodge, { signal });
      addEventListener('resize', () => moved && flee(), { signal });
      signal.addEventListener('abort', () => {
        clearInterval(restless);
        restless = undefined;
      });
      gsap.set(el, { clearProps: 'all' });
      return gsap.from(el, { y: 24, opacity: 0, duration: 0.6, ease: 'back.out(1.8)' });
    },
    leave: () => gsap.to(el, { y: '+=260', rotation: 'random(-90, 90)', opacity: 0, duration: 0.5, ease: 'back.in(2)', overwrite: true }),
  };
}

// lugar livre na área, sem encostar em `avoid`; com cursor, o mais longe dele entre algumas tentativas
function pickSpot(area, { offsetWidth: width, offsetHeight: height }, avoid, cursor) {
  const spot = () => [random(0, area.width - width), random(0, area.height - height)];
  const overlaps = ([left, top]) =>
    area.left + left + width + CLEARANCE >= avoid.left && area.left + left - CLEARANCE <= avoid.right &&
    area.top + top + height + CLEARANCE >= avoid.top && area.top + top - CLEARANCE <= avoid.bottom;
  const distance = ([left, top]) => cursor
    ? Math.hypot(area.left + left + width / 2 - cursor.x, area.top + top + height / 2 - cursor.y)
    : Infinity;

  let best = spot(), bestDistance = -1;
  for (let i = 0; i < 40 && bestDistance < FAR_ENOUGH; i++) {
    const candidate = spot(), d = distance(candidate);
    if (!overlaps(candidate) && d > bestDistance) [best, bestDistance] = [candidate, d];
  }
  return best;
}
