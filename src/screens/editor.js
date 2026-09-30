import { gsap } from '../lib/vendor.js';
import { h, play, usesMouse, applyTheme } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import { vibrate } from '../lib/fx.js';
import { MAX_LENGTH, NO_REACTION, fieldsOf, findOption, findBackground, findColor, loadOptions, readQuery, toQuery } from '../custom.js';
import { isHex, accentTheme } from '../lib/color.js';
import { createPage } from '../components/page.js';
import { createBackdrop } from '../components/backdrop.js';
import { createToolbar } from '../components/toolbar.js';
import { createEmojiField } from '../components/emoji-field.js';
import { createSwatches } from '../components/swatches.js';
import { pickColor } from '../components/color-picker.js';
import { preloadEmojis } from '../components/emoji-picker.js';

const SUGGESTIONS = {
  emoji: ['😁', '🥰', '😍', '🤩', '🥳', '😎'],
  reaction: ['💖', '🍿', '🍕', '🌹', '✨', '🎉'],
};

export async function createEditor(query, { onExit, onHome, onPreview }) {
  const { base, backgrounds, colors } = await loadOptions();
  const defaults = fieldsOf(base);
  const values = { ...defaults, title: '', reply: '', ...readQuery(query) };
  const toolbar = createToolbar({ onBack: onExit, onHome });
  // até a pessoa escolher uma cor, ela acompanha a do fundo
  let colorPicked = Boolean(values.color), resetTheme;
  values.bg = findBackground(backgrounds, values.bg).id;
  if (colorPicked) values.color = findColor(colors, values.color).id;

  // fundo livre não tem cor própria: a de destaque fica como está
  const colorOf = backgroundId => (isHex(backgroundId) ? color.value : findOption(colors, findOption(backgrounds, backgroundId).color).id);
  // todo fundo livre usa o mesmo fundo sem imagem: trocar de cor não refaz o fade
  const backdropKey = id => (isHex(id) ? '#' : id);
  let backdrop = createBackdrop(findBackground(backgrounds, values.bg).background), shownBackground = backdropKey(values.bg);
  const input = (name, props) => h('input', {
    className: `input editor-${name}`, name, value: values[name], placeholder: defaults[name],
    maxLength: MAX_LENGTH[name], autocomplete: 'off', ...props,
  });
  const emojiField = (name, label, none) => createEmojiField({ name, label, value: values[name], suggestions: SUGGESTIONS[name], none }).el;

  const title = input('title', { placeholder: 'Jantar hoje?', required: true });
  const reply = input('reply', { 'aria-label': 'Texto da resposta' });
  const buttons = h('div', { className: 'editor-buttons' },
    input('yes', { 'aria-label': 'Texto do botão de sim' }),
    input('no', { 'aria-label': 'Texto do botão de não', 'aria-describedby': 'editor-no-note' }),
    h('small', { id: 'editor-no-note', className: 'editor-note', textContent: '(esse botão se mexe)' }));
  const background = createSwatches({
    className: 'swatches-backgrounds',
    label: 'Fundo',
    value: values.bg,
    options: backgrounds.filter(option => !option.hidden)
      .map(({ id, name, theme, background }) => ({ id, name, fill: theme.bg ?? 'var(--bg)', image: background?.portrait })),
    onChange: id => {
      if (!colorPicked) color.set(colorOf(id));
      showBackdrop(id);
      paint();
    },
    custom: {
      name: 'Outra cor de fundo',
      fill: hex => hex,
      start: () => findBackground(backgrounds, background.value).theme.bg ?? '#fbefe9',
      pick: value => pickLive({ label: 'Cor do fundo', value }, hex => {
        showBackdrop(hex);
        paint(hex);
      }),
    },
  });
  const color = createSwatches({
    className: 'swatches-colors',
    label: 'Cor de destaque',
    value: values.color ?? colorOf(values.bg),
    options: colors.map(({ id, name, theme }) => ({ id, name, fill: `linear-gradient(135deg, ${theme['accent-soft']}, ${theme.accent})` })),
    onChange: () => {
      colorPicked = true;
      paint();
    },
    custom: {
      name: 'Outra cor de destaque',
      fill: hex => `linear-gradient(135deg, ${accentTheme(hex)['accent-soft']}, ${hex})`,
      start: () => findColor(colors, color.value).theme.accent,
      pick: value => pickLive({ label: 'Cor de destaque', value }, hex => paint(background.value, hex)),
    },
  });

  // enquanto escolhe, a página já mostra a cor (sem o fade do tema, que atrasaria o dedo);
  // cancelando, volta ao que estava, aí sim com fade
  async function pickLive(options, preview) {
    const { dataset } = document.documentElement;
    dataset.live = '';
    const hex = await pickColor({ ...options, onInput: preview });
    delete dataset.live;
    if (!hex) {
      showBackdrop(background.value);
      paint();
    }
    return hex;
  }

  const submit = h('button', { type: 'submit', className: 'btn btn-primary editor-submit' }, 'Ver como fica', icon('next'));
  const form = h('form', { className: 'editor-form', noValidate: true },
    h('div', { className: 'editor-group' },
      row('Pergunta', null, title),
      row('Botões', null, buttons),
      row('Resposta', 'aparece quando dizem sim', reply, emojiField('emoji', 'Emoji da resposta'))),
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

  // a própria página já mostra o fundo e a cor escolhidos
  function paint(bg = background.value, accent = color.value) {
    resetTheme?.();
    resetTheme = applyTheme({ ...findBackground(backgrounds, bg).theme, ...findColor(colors, accent).theme });
  }

  function showBackdrop(id) {
    if (backdropKey(id) === shownBackground) return;
    shownBackground = backdropKey(id);
    const previous = backdrop;
    backdrop = createBackdrop(findBackground(backgrounds, id).background);
    previous.el.after(backdrop.el);
    play(gsap.from(backdrop.el, { autoAlpha: 0, duration: 0.5, ease: 'power1.out' }));
    play(gsap.to(previous.el, { autoAlpha: 0, duration: 0.5, ease: 'power1.out', onComplete: () => previous.el.remove() }));
  }

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
      paint();
      document.body.prepend(backdrop.el);
      document.body.append(toolbar.el);
      page.enter().then(() => {
        if (usesMouse) title.focus({ preventScroll: true });
        preloadEmojis(); // depois da entrada, pra não disputar com a animação
      });
      play(gsap.from(backdrop.el, { autoAlpha: 0, duration: 0.6, ease: 'power1.out' }));
      play(toolbar.nav.enter());
    },
    async leave() {
      await Promise.all([
        page.leave(),
        play(toolbar.nav.leave()),
        play(gsap.to(backdrop.el, { autoAlpha: 0, duration: 0.45, ease: 'power1.in' })),
      ]);
      toolbar.el.remove();
      backdrop.el.remove();
      resetTheme();
    },
  };
}

function row(label, hint, ...controls) {
  // um campo sozinho vira <label>: tocar no título da linha foca o campo
  const alone = controls.length === 1 && controls[0].tagName === 'INPUT';
  // "x/limite" do campo que está sendo digitado, sempre no mesmo lugar: à direita do título da linha.
  // só aparece durante a digitação; o limite de verdade é o maxLength
  const count = h('span', { className: 'editor-count', ariaHidden: 'true' });
  const el = h(alone ? 'label' : 'div', { className: 'editor-row' },
    h('span', { className: 'editor-head' },
      h('span', { className: 'editor-label' }, label, hint && h('small', { textContent: hint })),
      count),
    ...controls);
  const limited = target => target.matches('.input') && target.maxLength > 0;
  const update = ({ value, maxLength }) => {
    count.textContent = `${value.length}/${maxLength}`;
    count.classList.toggle('is-near', value.length >= maxLength * 0.85);
  };
  el.addEventListener('focusin', ({ target }) => {
    if (!limited(target)) return;
    update(target);
    count.classList.add('is-on');
  });
  el.addEventListener('input', ({ target }) => limited(target) && update(target));
  el.addEventListener('focusout', ({ target }) => limited(target) && count.classList.remove('is-on'));
  return el;
}

function complain(input) {
  input.setAttribute('aria-invalid', 'true');
  input.focus();
  vibrate([30, 40, 30]);
  play(gsap.fromTo(input, { x: 0 }, { keyframes: { x: [0, -9, 8, -6, 4, 0] }, duration: 0.45, ease: 'power1.out' }));
}
