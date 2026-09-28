import { gsap, confetti } from './vendor.js';
import { h, center, cssList } from './dom.js';

export const HEART = 'M12 20s-7.2-4.4-9.6-8.9C0.6 7.6 2.3 4.4 5.6 3.9c2-0.3 3.8 0.7 6.4 3.2 2.6-2.5 4.4-3.5 6.4-3.2 3.3 0.5 5 3.7 3.2 7.2C19.2 15.6 12 20 12 20Z';
const heartShape = confetti.shapeFromPath({ path: HEART, matrix: [0.8, 0, 0, 0.8, -9.6, -9.6] });
const emojiShapes = {};

// emoji sai maior e sem girar em 3D; as bolinhas coloridas vêm num disparo à parte
export function burst(el, reaction) {
  const { x, y } = center(el);
  const fire = options => confetti({
    spread: 80, startVelocity: 28, gravity: 0.9, ticks: 170, disableForReducedMotion: true,
    colors: cssList('--confetti'), origin: { x: x / innerWidth, y: y / innerHeight }, ...options,
  });
  if (!reaction) return fire({ particleCount: 40, scalar: 1.2, shapes: [heartShape, heartShape, 'circle'] });
  emojiShapes[reaction] ??= confetti.shapeFromText({ text: reaction, scalar: 2 });
  fire({ particleCount: 16, scalar: 2, flat: true, shapes: [emojiShapes[reaction]] });
  fire({ particleCount: 24, scalar: 1.2, shapes: ['circle'] });
}

export function ripple(el, delay = 0) {
  const { x, y } = center(el);
  const ring = h('div', { className: 'ripple' });
  document.body.append(ring);
  gsap.set(ring, { left: x, top: y, xPercent: -50, yPercent: -50 });
  gsap.fromTo(ring, { scale: 0.25, opacity: 0.8 },
    { scale: 1, opacity: 0, duration: 1.3, delay, ease: 'expo.out', onComplete: () => ring.remove() });
}

// o iPhone não tem navigator.vibrate; no iOS 18+ clicar num <input switch> faz o Taptic Engine vibrar
export function vibrate(pattern) {
  if (navigator.vibrate) return navigator.vibrate(pattern);
  const tick = () => {
    const label = h('label', { style: 'display:none', innerHTML: '<input type="checkbox" switch>' });
    document.head.append(label);
    label.click();
    label.remove();
  };
  tick();
  for (let i = 1; i < Math.ceil(pattern.length / 2); i++) setTimeout(tick, i * 110);
}
