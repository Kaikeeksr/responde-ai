import { gsap } from '../lib/vendor.js';
import { h } from '../lib/dom.js';
import { createYesButton } from './yes-button.js';
import { createNoButton } from './no-button.js';

export function createChoices({ yes, no, reaction, onAccept }) {
  const el = h('div', { className: 'choices' });
  const yesButton = createYesButton(yes, { reaction, onClick: onAccept });
  const noButton = createNoButton(no, { area: el, avoid: yesButton.el, onMove: follow });
  let round;
  el.append(yesButton.el, noButton.el);

  function follow() {
    yesButton.lookAt(noButton.el);
  }

  return {
    el,
    enter() {
      round = new AbortController();
      addEventListener('resize', follow, { signal: round.signal });
      const timeline = gsap.timeline({ onComplete: follow })
        .add(yesButton.enter(round.signal))
        .add(noButton.enter(round.signal), 0.15);
      follow();
      return timeline;
    },
    leave() {
      round.abort();
      return gsap.timeline()
        .add(noButton.leave())
        .add(yesButton.leave(), 0.1);
    },
  };
}
