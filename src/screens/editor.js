import { gsap } from '../lib/vendor.js';
import { h, play, usesMouse, applyTheme } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import { vibrate } from '../lib/fx.js';
import { MAX_LENGTH, NO_REACTION, fieldsOf, findOption, loadOptions, readQuery, toQuery } from '../custom.js';
import { createPage } from '../components/page.js';
import { createToolbar } from '../components/toolbar.js';
import { createEmojiField } from '../components/emoji-field.js';
import { createSwatches } from '../components/swatches.js';

const SUGGESTIONS = {
  emoji: ['😁', '🥰', '😍', '🤩', '🥳', '😎'],
  reaction: ['💖', '🍿', '🍕', '🌹', '✨', '🎉'],
};

export async function createEditor(query, { onExit, onPreview }) {
  const { base, backgrounds, colors } = await loadOptions();
  const defaults = fieldsOf(base);
  const values = { ...defaults, title: '', ...readQuery(query) };
  const toolbar = createToolbar({ onBack: onExit });
  // até a pessoa escolher uma cor, ela acompanha a do fundo
  let colorPicked = Boolean(values.color), resetColor;
  values.bg = findOption(backgrounds, values.bg).id;
  if (colorPicked) values.color = findOption(colors, values.color).id;

  const colorOf = backgroundId => findOption(colors, findOption(backgrounds, backgroundId).color).id;
  const input = (name, props) => h('input', {
    className: `input editor-${name}`, name, value: values[name], placeholder: defaults[name],
    maxLength: MAX_LENGTH[name], autocomplete: 'off', ...props,
  });
  const emojiField = (name, label, none) => createEmojiField({ name, label, value: values[name], suggestions: SUGGESTIONS[name], none }).el;

  const title = input('title', { placeholder: 'Jantar hoje?', required: true });
  const buttons = h('div', { className: 'editor-buttons' },
    input('yes', { 'aria-label': 'Texto do botão de sim' }),
    input('no', { 'aria-label': 'Texto do botão de não', 'aria-describedby': 'editor-no-note' }),
    h('small', { id: 'editor-no-note', className: 'editor-note', textContent: '(esse botão se mexe)' }));
  const background = createSwatches({
    className: 'swatches-backgrounds',
    label: 'Fundo',
    value: values.bg,
    options: backgrounds.map(({ id, name, theme, background }) => ({ id, name, fill: theme.bg ?? 'var(--bg)', image: background?.portrait })),
    onChange: id => colorPicked || paint(colorOf(id)),
  });
  const color = createSwatches({
    className: 'swatches-colors',
    label: 'Cor de destaque',
    value: values.color ?? colorOf(values.bg),
    options: colors.map(({ id, name, theme }) => ({ id, name, fill: `linear-gradient(135deg, ${theme['accent-soft']}, ${theme.accent})` })),
    onChange: id => {
      colorPicked = true;
      paint(id);
    },
  });

  const submit = h('button', { type: 'submit', className: 'btn btn-primary editor-submit' }, 'Ver como fica', icon('next'));
  const form = h('form', { className: 'editor-form', noValidate: true },
    h('div', { className: 'editor-group' },
      row('Pergunta', null, title),
      row('Botões', null, buttons),
      row('Resposta', 'aparece quando dizem sim', input('reply', { 'aria-label': 'Texto da resposta' }), emojiField('emoji', 'Emoji da resposta'))),
    h('div', { className: 'editor-group' },
      row('Emoji do cartão', 'sobe quando tocam no cartão', emojiField('reaction', 'Emoji do cartão', NO_REACTION)),
      row('Fundo', null, background.el),
      row('Cor de destaque', 'botão Sim e detalhes', color.el)),
    submit);
  const page = createPage({
    className: 'editor',
    title: 'Sua pergunta, do seu jeito.',
    lead: 'Escreva, escolha o visual e veja como fica antes de mandar o link.',
    content: form,
    items: [...form.querySelectorAll('.editor-row'), submit],
  });

  function paint(id) {
    color.set(id);
    resetColor?.();
    resetColor = applyTheme(findOption(colors, id).theme, buttons);
  }
  paint(color.value);

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!title.value.trim()) return complain(title);
    const filled = { ...defaults, gif: values.gif, bg: background.value, color: colorPicked ? color.value : undefined };
    for (const [name, value] of new FormData(form)) if (value.trim()) filled[name] = value.trim();
    onPreview(toQuery(filled));
  });
  title.addEventListener('input', () => title.removeAttribute('aria-invalid'));

  return {
    enter() {
      document.body.append(toolbar.el);
      page.enter().then(() => usesMouse && title.focus({ preventScroll: true }));
      play(toolbar.back.enter());
    },
    async leave() {
      await Promise.all([page.leave(), play(toolbar.back.leave())]);
      toolbar.el.remove();
    },
  };
}

function row(label, hint, ...controls) {
  const alone = controls.length === 1 && controls[0].tagName === 'INPUT';
  return h(alone ? 'label' : 'div', { className: 'editor-row' },
    h('span', { className: 'editor-label' }, label, hint && h('small', { textContent: hint })),
    ...controls);
}

function complain(input) {
  input.setAttribute('aria-invalid', 'true');
  input.focus();
  vibrate([30, 40, 30]);
  play(gsap.fromTo(input, { x: 0 }, { keyframes: { x: [0, -9, 8, -6, 4, 0] }, duration: 0.45, ease: 'power1.out' }));
}
