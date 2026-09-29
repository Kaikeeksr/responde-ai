import { gsap } from '../lib/vendor.js';
import { h, play } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import { lastEmoji } from '../lib/emoji.js';
import { pickEmoji } from './emoji-picker.js';

// com `none`, ganha a opção "Nenhum" (que manda esse valor); o que vai pro formulário é o campo escondido
export function createEmojiField({ name, label, value, suggestions, none }) {
  // o Safari do iPhone não centraliza emoji dentro de <input>: ele só recebe a digitação e o emoji aparece no <span>
  const input = h('input', { className: 'emoji-typing', autocomplete: 'off', spellcheck: false, 'aria-label': `${label} (toque para digitar outro)` });
  const glyph = h('span', { className: 'emoji-glyph', ariaHidden: 'true' });
  const circle = h('span', { className: 'emoji-input' }, input, glyph);
  const field = h('input', { type: 'hidden', name });
  const chips = [
    none && h('button', { type: 'button', className: 'emoji-chip emoji-none', value: none, title: 'Nenhum', 'aria-label': 'Nenhum' }, icon('none')),
    ...suggestions.map(emoji => h('button', { type: 'button', className: 'emoji-chip', value: emoji, textContent: emoji })),
  ].filter(Boolean);
  // o "+" abre o catálogo inteiro; fica marcado quando o emoji escolhido não é uma das sugestões
  const more = h('button', { type: 'button', className: 'emoji-chip emoji-more', title: 'Mais emojis', 'aria-label': 'Mais emojis' }, icon('plus'));
  const el = h('div', { className: 'emoji-field' }, circle, field,
    h('div', { className: 'emoji-chips', role: 'group', 'aria-label': 'Sugestões' }, ...chips, more));
  const shown = () => (value === none ? '' : value);

  function pick(next) {
    field.value = value = next;
    input.value = glyph.textContent = shown();
    for (const chip of chips) chip.ariaPressed = chip.value === next;
    more.ariaPressed = !chips.some(chip => chip.value === next);
  }
  pick(value);

  const change = next => {
    pick(next);
    play(gsap.fromTo(glyph, { scale: 0.5, rotation: -20 }, { scale: 1, rotation: 0, duration: 0.6, ease: 'back.out(3)', overwrite: true }));
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
  more.addEventListener('click', async () => {
    const emoji = await pickEmoji({ label });
    if (emoji) change(emoji);
  });

  return { el };
}
