import { gsap, SplitText } from '../lib/vendor.js';
import { h } from '../lib/dom.js';

export function createTitle(text) {
  const el = h('h1', { className: 'title' });
  let split;

  function set(value) {
    split?.revert();
    el.textContent = value;
    split = SplitText.create(el, { type: 'words,chars' });
  }
  set(text);

  return {
    el,
    set,
    enter: vars => gsap.from(split.chars, { y: 28, opacity: 0, duration: 0.6, ease: 'back.out(1.8)', stagger: 0.035, ...vars }),
    leave: () => gsap.to(split.chars, { y: -20, opacity: 0, duration: 0.25, ease: 'power2.in', stagger: 0.015 }),
  };
}
