import { h, usesMouse } from '../lib/dom.js';
import { createSheet } from './sheet.js';

// mesmo painel do seletor de emoji, com os ícones da cena (imagem ou emoji); resolve com o escolhido ou nada
export function pickIcon({ label, icons, value }) {
  return new Promise(resolve => {
    const cells = icons.map(option => h('button', {
      type: 'button', className: 'icon-cell', title: option.name, 'aria-label': option.name,
      ariaPressed: option.id === value, value: option.id,
    }, option.src ? h('img', { src: option.src, alt: '' }) : h('span', { className: 'icon-emoji', textContent: option.emoji })));
    const close = h('button', { type: 'button', className: 'btn btn-secondary emoji-close' }, 'Voltar');
    const sheet = createSheet({ className: 'icon-sheet', label, onDismiss: () => finish() },
      h('h2', { className: 'sheet-title', textContent: label }),
      h('div', { className: 'icon-grid', role: 'group', 'aria-label': 'Ícones' }, ...cells),
      h('div', { className: 'emoji-footer' }, close));

    function finish(option) {
      if (sheet.close()) resolve(option);
    }

    for (const cell of cells) cell.addEventListener('click', () => finish(icons.find(option => option.id === cell.value)));
    close.addEventListener('click', () => finish());
    (cells.find(cell => cell.ariaPressed === 'true') ?? cells[0]).autofocus = usesMouse;
    close.autofocus = !usesMouse;
    sheet.open();
  });
}
