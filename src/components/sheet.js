import { gsap } from '../lib/vendor.js';
import { h, play } from '../lib/dom.js';

// painel que sobe de baixo no celular e vira janela no centro em tela maior (GIF, emoji e cor usam o mesmo)
// `onDismiss`: fundo, Esc ou o navegador fechando; quem usa decide o que fazer e chama close()
export function createSheet({ className, label, onDismiss }, ...children) {
  const sheet = h('div', { className: `sheet ${className}` }, ...children);
  const backdrop = h('div', { className: 'sheet-backdrop' });
  const dialog = h('dialog', { className: 'sheet-dialog', 'aria-label': label }, backdrop, sheet);
  let closed = false;

  backdrop.addEventListener('click', () => onDismiss());
  dialog.addEventListener('cancel', e => {
    e.preventDefault();
    onDismiss();
  });
  dialog.addEventListener('close', () => onDismiss()); // o navegador pode fechar sem passar pelo cancel

  return {
    sheet,
    open() {
      document.body.append(dialog);
      dialog.showModal();
      play(gsap.timeline({ defaults: { ease: 'expo.out' } })
        .from(backdrop, { opacity: 0, duration: 0.35, ease: 'power1.out' })
        .from(sheet, { yPercent: 25, opacity: 0, duration: 0.6 }, 0));
    },
    // true só na primeira vez: dá pra chamar de vários caminhos sem fechar duas vezes
    close() {
      if (closed) return false;
      closed = true;
      play(gsap.timeline({ onComplete: () => dialog.remove() })
        .to(sheet, { yPercent: 12, opacity: 0, duration: 0.3, ease: 'power2.in' })
        .to(backdrop, { opacity: 0, duration: 0.3 }, 0)
        .call(() => dialog.open && dialog.close()));
      return true;
    },
  };
}
