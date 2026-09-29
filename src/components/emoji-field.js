import { gsap } from '../lib/vendor.js';
import { h, play } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import { lastEmoji } from '../lib/emoji.js';

// com `none`, ganha a opção "Nenhum" (que manda esse valor); o que vai pro formulário é o campo escondido
export function createEmojiField({ name, label, value, suggestions, none }) {
  const input = h('input', { className: 'emoji-input', autocomplete: 'off', spellcheck: false, 'aria-label': `${label} (toque para digitar outro)` });
  const field = h('input', { type: 'hidden', name });
  const chips = [
    none && h('button', { type: 'button', className: 'emoji-chip emoji-none', value: none, title: 'Nenhum', 'aria-label': 'Nenhum' }, icon('none')),
    ...suggestions.map(emoji => h('button', { type: 'button', className: 'emoji-chip', value: emoji, textContent: emoji })),
  ].filter(Boolean);
  const el = h('div', { className: 'emoji-field' }, input, field, h('div', { className: 'emoji-chips', role: 'group', 'aria-label': 'Sugestões' }, ...chips));
  const shown = () => (value === none ? '' : value);

  function pick(next) {
    field.value = value = next;
    input.value = shown();
    for (const chip of chips) chip.ariaPressed = chip.value === next;
  }
  pick(value);

  const change = next => {
    pick(next);
    play(gsap.fromTo(input, { scale: 0.5, rotation: -20 }, { scale: 1, rotation: 0, duration: 0.6, ease: 'back.out(3)', overwrite: true }));
  };

  const typed = e => {
    if (e.isComposing) return;
    const emoji = lastEmoji(input.value);
    if (emoji && emoji !== value) change(emoji);
    else input.value = shown();
  };
  input.addEventListener('input', typed);
  input.addEventListener('compositionend', typed);
  for (const chip of chips) chip.addEventListener('click', () => change(chip.value));

  return { el };
}
