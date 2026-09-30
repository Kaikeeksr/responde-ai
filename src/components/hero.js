import { gsap } from '../lib/vendor.js';
import { h } from '../lib/dom.js';
import { icon } from '../lib/icons.js';

// com `onEdit` (prévia de quem criou), ganha o lápis pra trocar o ícone
export function createHero(visual, { onEdit } = {}) {
  const circle = h('div', { className: 'hero-circle', 'aria-hidden': 'true' });
  const edit = onEdit && h('button', { type: 'button', className: 'icon-btn hero-edit', title: 'Trocar ícone', 'aria-label': 'Trocar ícone' }, icon('edit'));
  const el = h('div', { className: 'hero' }, circle, edit);
  edit?.addEventListener('click', onEdit);

  function set({ icon: src, emoji }) {
    gsap.set([circle, edit].filter(Boolean), { clearProps: 'transform' });
    circle.replaceChildren(src ? h('img', { src, alt: '' }) : h('span', { className: 'hero-emoji', textContent: emoji }));
  }
  set(visual);

  return {
    el,
    set,
    enter(vars) {
      const timeline = gsap.timeline().from(circle, { scale: 0, rotation: -30, duration: 1.1, ease: 'elastic.out(1, 0.6)', ...vars });
      if (edit) timeline.from(edit, { scale: 0, duration: 0.5, ease: 'back.out(3)' }, 0.5);
      return timeline;
    },
    leave() {
      const timeline = gsap.timeline().to(circle, { scale: 0, rotation: 45, duration: 0.4, ease: 'back.in(2)' });
      if (edit) timeline.to(edit, { scale: 0, duration: 0.25, ease: 'power2.in' }, 0);
      return timeline;
    },
    // troca com um pulinho, sem refazer a entrada
    swap(next) {
      set(next);
      return gsap.fromTo(circle, { scale: 0.6, rotation: -15 }, { scale: 1, rotation: 0, duration: 0.7, ease: 'back.out(2.5)' });
    },
  };
}
