import { gsap } from '../lib/vendor.js';
import { h } from '../lib/dom.js';
import { icon } from '../lib/icons.js';

export function createActionBar({ className, next, onBack, onNext }) {
  const back = h('button', { type: 'button', className: 'btn btn-secondary' }, icon('back'), 'Voltar');
  const forward = h('button', { type: 'button', className: 'btn btn-primary' }, next, icon('next'));
  const el = h('div', { className: `action-bar ${className}` }, back, forward);
  back.addEventListener('click', onBack);
  forward.addEventListener('click', onNext);

  return {
    el,
    back,
    next: forward,
    enter: () => gsap.fromTo(el, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'back.out(2)', clearProps: 'transform' }),
    leave: () => gsap.to(el, { autoAlpha: 0, y: 16, duration: 0.3, ease: 'power2.in' }),
  };
}
