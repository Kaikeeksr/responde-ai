import { gsap } from '../lib/vendor.js';
import { h } from '../lib/dom.js';

export function createHero(visual) {
  const circle = h('div', { className: 'hero-circle' });
  const el = h('div', { className: 'hero', 'aria-hidden': 'true' }, circle);

  function set({ icon, emoji }) {
    gsap.set(circle, { clearProps: 'transform' });
    circle.replaceChildren(icon ? h('img', { src: icon, alt: '' }) : h('span', { className: 'hero-emoji', textContent: emoji }));
  }
  set(visual);

  return {
    el,
    set,
    enter: vars => gsap.from(circle, { scale: 0, rotation: -30, duration: 1.1, ease: 'elastic.out(1, 0.6)', ...vars }),
    leave: () => gsap.to(circle, { scale: 0, rotation: 45, duration: 0.4, ease: 'back.in(2)' }),
  };
}
