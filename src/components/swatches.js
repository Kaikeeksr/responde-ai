import { h } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import { isHex, isDark } from '../lib/color.js';

// `custom`: o "+" no fim, que abre o seletor (`pick(corAtual)` resolve com #rrggbb ou nada) e passa a mostrar a cor escolhida
export function createSwatches({ className, label, options, value, onChange, custom }) {
  const choose = id => {
    set(id);
    onChange?.(id);
  };
  const buttons = new Map(options.map(({ id, name, fill, image }) => {
    const button = h('button', { type: 'button', className: 'swatch', title: name, 'aria-label': name, style: `--fill:${fill}` },
      image && h('img', { src: image, alt: '', decoding: 'async' }));
    button.addEventListener('click', () => choose(id));
    return [id, button];
  }));
  const more = custom && h('button', { type: 'button', className: 'swatch swatch-custom', title: custom.name, 'aria-label': custom.name }, icon('plus'));
  const el = h('div', { className: `swatches ${className}`, role: 'group', 'aria-label': label }, ...buttons.values(), more);
  let picked; // a última cor livre, pra reabrir o seletor nela

  more?.addEventListener('click', async () => {
    const hex = await custom.pick(picked ?? custom.start());
    if (hex) choose(hex);
    else set(value); // cancelou: volta a marcação (a prévia ao vivo pode ter mexido)
  });

  function set(id) {
    value = id;
    for (const [key, button] of buttons) button.ariaPressed = key === id;
    if (!more) return;
    const own = isHex(id);
    if (own) {
      picked = id;
      more.style.setProperty('--fill', custom.fill(id));
      more.classList.toggle('is-dark', isDark(id));
    }
    more.classList.toggle('is-filled', Boolean(picked));
    more.ariaPressed = own;
  }
  set(value);

  return { el, set, get value() { return value; } };
}
