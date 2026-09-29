import { h } from '../lib/dom.js';

export function createBackdrop({ portrait, landscape } = {}) {
  const el = h('picture', { className: 'backdrop' },
    landscape && h('source', { media: '(min-aspect-ratio: 1/1)', srcset: landscape }),
    portrait && h('img', { src: portrait, alt: '' }));
  return { el };
}
