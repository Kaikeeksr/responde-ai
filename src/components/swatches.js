import { h } from '../lib/dom.js';

export function createSwatches({ className, label, options, value, onChange }) {
  const buttons = new Map(options.map(({ id, name, fill, image }) => {
    const button = h('button', { type: 'button', className: 'swatch', title: name, 'aria-label': name, style: `--fill:${fill}` },
      image && h('img', { src: image, alt: '', decoding: 'async' }));
    button.addEventListener('click', () => {
      set(id);
      onChange?.(id);
    });
    return [id, button];
  }));
  const el = h('div', { className: `swatches ${className}`, role: 'group', 'aria-label': label }, ...buttons.values());

  function set(id) {
    value = id;
    for (const [key, button] of buttons) button.ariaPressed = key === id;
  }
  set(value);

  return { el, set, get value() { return value; } };
}
