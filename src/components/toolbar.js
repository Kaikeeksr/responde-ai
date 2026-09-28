import { gsap } from '../lib/vendor.js';
import { h, svg } from '../lib/dom.js';

const ICONS = {
  back: 'M14.5 5.5 8 12l6.5 6.5',
  share: 'M12 14.5v-11M8 7.5l4-4 4 4M8.5 10H7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-1.5',
  check: 'm5 12.5 4.5 4.5L19 7.5',
};
const icon = name => svg('0 0 24 24', `<path d="${ICONS[name]}"/>`);

// cada botão entra e sai por conta própria: o voltar fica a cena toda, o compartilhar só na resposta
export function createToolbar({ onBack }) {
  const back = createButton('back', 'Voltar', onBack);
  const share = createButton('share', 'Compartilhar', shareLink);
  const el = h('header', { className: 'toolbar' }, back.el, share.el);

  // sem folha de compartilhar (ex.: Firefox no PC), copia o link e mostra um ✓
  async function shareLink() {
    const data = { title: document.title, url: location.href };
    if (navigator.share) return navigator.share(data).catch(() => {}); // fechar a folha também rejeita
    const copied = await navigator.clipboard?.writeText(data.url).then(() => true, () => false);
    if (!copied) return prompt('Copie o link:', data.url);
    share.el.replaceChildren(icon('check'));
    gsap.from(share.el.firstChild, { scale: 0.4, duration: 0.4, ease: 'back.out(3)' });
    gsap.delayedCall(1.6, () => share.el.replaceChildren(icon('share')));
  }

  return { el, back, share };
}

function createButton(name, label, onClick) {
  const el = h('button', { type: 'button', 'aria-label': label }, icon(name));
  let active;
  return {
    el,
    enter() {
      active = new AbortController();
      el.addEventListener('click', onClick, { signal: active.signal });
      return gsap.fromTo(el, { autoAlpha: 0, y: -12 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'back.out(2)', clearProps: 'transform' });
    },
    leave() {
      active?.abort();
      return gsap.to(el, { autoAlpha: 0, y: -12, duration: 0.3, ease: 'power2.in' });
    },
  };
}
