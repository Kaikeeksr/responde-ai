import { gsap } from '../lib/vendor.js';
import { h } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import { shareLink } from '../lib/share.js';

export function createToolbar({ onBack }) {
  const back = createButton('back', 'Voltar', onBack);
  const share = createButton('share', 'Compartilhar', shareScene);
  const el = h('header', { className: 'toolbar' }, back.el, share.el);
  let restore;

  async function shareScene() {
    if (await shareLink() !== 'copied') return;
    restore?.kill();
    share.el.replaceChildren(icon('check'));
    gsap.from(share.el.firstChild, { scale: 0.4, duration: 0.4, ease: 'back.out(3)' });
    restore = gsap.delayedCall(1.6, () => share.el.replaceChildren(icon('share')));
  }

  return { el, back, share };
}

function createButton(name, label, onClick) {
  const el = h('button', { type: 'button', className: 'icon-btn', 'aria-label': label }, icon(name));
  let active;
  return {
    el,
    enter() {
      active = new AbortController();
      el.addEventListener('click', onClick, { signal: active.signal });
      return gsap.fromTo(el, { autoAlpha: 0, y: -12 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'back.out(2)', clearProps: 'transform' });
    },
    leave() {
      active?.abort();
      return gsap.to(el, { autoAlpha: 0, y: -12, duration: 0.3, ease: 'power2.in' });
    },
  };
}
