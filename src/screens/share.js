import { gsap } from '../lib/vendor.js';
import { h, applyTheme, decoded, play, usesMouse } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import { findGif } from '../lib/giphy.js';
import { createPage } from '../components/page.js';
import { createBackdrop } from '../components/backdrop.js';
import { createToolbar } from '../components/toolbar.js';

export async function createShare(scene, { url = location.href, onExit, onHome, onView, onNew }) {
  const { background, question, answer, theme } = await scene;
  const native = Boolean(navigator.share) && !usesMouse;
  const backdrop = createBackdrop(background);
  const toolbar = createToolbar({ onBack: onExit, onHome });
  const status = h('p', { className: 'share-status', role: 'status' });
  const card = createCard(question, answer);

  const copy = h('button', { type: 'button', className: 'btn btn-primary share-copy' }, icon('copy'), 'Copiar');
  const field = h('input', { className: 'input share-url', value: url, readOnly: true, 'aria-label': 'Link do convite' });
  const main = native
    ? h('button', { type: 'button', className: 'btn btn-primary share-main' }, icon('share'), 'Compartilhar')
    : h('div', { className: 'share-field' }, field, copy);
  const secondary = native && h('button', { type: 'button', className: 'btn btn-secondary share-alt' }, icon('copy'), 'Copiar link');
  const view = h('button', { type: 'button', className: 'share-link' }, 'Ver como a pessoa recebe', icon('next'));
  const again = h('button', { type: 'button', className: 'share-link share-again' }, icon('plus'), 'Criar outra pergunta');
  const links = h('div', { className: 'share-links' }, view, again);
  const items = [card, main, secondary, status, links].filter(Boolean);

  const page = createPage({
    className: 'share',
    title: 'Pronto! Agora é só mandar.',
    lead: native
      ? 'Mande o link pra quem vai responder. A pergunta só aparece quando abrirem.'
      : 'Cole o link na conversa com quem vai responder. A pergunta só aparece quando abrirem.',
    content: h('div', { className: 'share-content' }, ...items),
    items,
  });
  let restore;

  async function copyLink({ quiet } = {}) {
    const copied = await navigator.clipboard?.writeText(url).then(() => true, () => false);
    if (!copied) {
      if (quiet) return;
      field.select();
      return say('Selecionei o link: é só copiar.');
    }
    say('Link copiado! Agora é só colar.');
    if (native) return;
    restore?.kill();
    copy.replaceChildren(icon('check'), 'Copiado');
    copy.classList.add('is-done');
    play(gsap.from(copy.firstChild, { scale: 0.4, duration: 0.4, ease: 'back.out(3)' }));
    restore = gsap.delayedCall(2.4, () => {
      copy.replaceChildren(icon('copy'), 'Copiar');
      copy.classList.remove('is-done');
    });
  }

  function say(text) {
    status.textContent = text;
    play(gsap.fromTo(status, { autoAlpha: 0, y: 4 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power2.out' }));
  }

  if (native) {
    main.addEventListener('click', () => navigator.share({ title: document.title, url }).catch(() => {}));
    secondary.addEventListener('click', () => copyLink());
  } else {
    copy.addEventListener('click', () => copyLink());
    field.addEventListener('focus', () => field.select());
  }
  view.addEventListener('click', onView);
  again.addEventListener('click', onNew);

  await decoded(backdrop.el);
  let resetTheme;

  return {
    enter() {
      resetTheme = applyTheme(theme);
      document.body.prepend(backdrop.el);
      document.body.append(toolbar.el);
      play(gsap.from(backdrop.el, { autoAlpha: 0, duration: 0.6, ease: 'power1.out' }));
      play(toolbar.nav.enter());
      page.enter().then(() => native || copyLink({ quiet: true }));
    },
    async leave() {
      restore?.kill();
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

function createCard(question, answer) {
  const thumb = h('span', { className: 'share-thumb' }, question.icon ? h('img', { src: question.icon, alt: '' }) : question.emoji);
  if (answer.gif) findGif(answer.gif).then(({ thumb: { url }, title }) => {
    const img = h('img', { src: url, alt: title, decoding: 'async' });
    img.decode().then(() => thumb.replaceChildren(img), () => {});
  }, () => {});
  return h('div', { className: 'share-card' },
    thumb,
    h('span', { className: 'share-text' },
      h('span', { className: 'share-question', textContent: question.title }),
      h('span', { className: 'share-buttons' },
        h('span', { className: 'share-yes', textContent: question.yes }),
        h('span', { className: 'share-no', textContent: question.no }))));
}
