import { h, usesMouse } from '../lib/dom.js';
import { hexToRgb, rgbToHex, rgbToHsv, hsvToRgb, parseHex } from '../lib/color.js';
import { createActionBar } from './action-bar.js';
import { createSheet } from './sheet.js';

// 2 fileiras de 8: tons claros em cima, fortes embaixo
const PALETTE = [
  '#ffd6e0', '#ffe0c7', '#fff3b8', '#d9f5d0', '#c9f0ec', '#d4e6ff', '#e3d9ff', '#f2f2f2',
  '#e8577b', '#f07f3c', '#f2c230', '#4fbf7a', '#2fa8a0', '#3f7fe0', '#8a5cf0', '#2b2a31',
];

// `onInput` recebe cada cor enquanto a pessoa mexe (a página atrás já mostra); resolve com a cor escolhida ou nada
export function pickColor({ label, value, onInput }) {
  return new Promise(resolve => {
    let hsv = rgbToHsv(hexToRgb(value)), hex = value;

    const thumb = h('span', { className: 'color-thumb' });
    const area = h('div', {
      className: 'color-area', tabIndex: 0, role: 'slider',
      'aria-label': 'Saturação e brilho (setas mudam)', 'aria-valuemin': 0, 'aria-valuemax': 100,
    }, thumb);
    const hue = h('input', { type: 'range', className: 'color-hue', min: 0, max: 359, step: 1, 'aria-label': 'Matiz' });
    const hexInput = h('input', {
      className: 'input color-hex', maxLength: 7, autocomplete: 'off', spellcheck: false,
      autocapitalize: 'off', enterKeyHint: 'done', 'aria-label': 'Código hexadecimal',
    });
    const channels = ['R', 'G', 'B'].map(name => h('input', {
      type: 'number', className: 'input color-channel', min: 0, max: 255, inputMode: 'numeric', enterKeyHint: 'done',
      'aria-label': { R: 'Vermelho', G: 'Verde', B: 'Azul' }[name],
    }));
    const field = (input, text) => h('label', { className: 'color-field' }, input, h('span', { textContent: text }));
    const dot = h('span', { className: 'color-dot', ariaHidden: 'true' });
    const swatches = PALETTE.map(color => h('button', {
      type: 'button', className: 'color-preset', value: color, style: `--fill:${color}`, 'aria-label': color,
    }));
    const actions = createActionBar({ className: 'color-actions', next: 'Usar cor', onBack: () => finish(), onNext: () => finish(hex) });
    const sheet = createSheet({ className: 'color-sheet', label, onDismiss: () => finish() },
      h('h2', { className: 'sheet-title', textContent: label }),
      area,
      hue,
      h('div', { className: 'color-fields' },
        h('label', { className: 'color-field color-field-hex' }, h('span', { className: 'color-hex-box' }, dot, hexInput), h('span', { textContent: 'Hex' })),
        ...channels.map((input, i) => field(input, 'RGB'[i]))),
      h('div', { className: 'color-palette', role: 'group', 'aria-label': 'Paleta' }, ...swatches),
      actions.el);

    // o dedo manda até 120 eventos por segundo, mas a tela só muda 60 vezes: o arraste e a prévia ao vivo
    // (que repinta a página inteira) rodam no máximo uma vez por quadro, com o último valor
    let size = [0, 0], pressed, pointer, dragFrame, previewFrame;

    const preview = () => {
      previewFrame ||= requestAnimationFrame(() => {
        previewFrame = 0;
        onInput?.(hex);
      });
    };

    // a bolinha anda por translate (em px do tamanho guardado), sem mexer no layout a cada movimento
    const placeThumb = () => (thumb.style.translate = `${hsv[1] * size[0]}px ${(1 - hsv[2]) * size[1]}px`);
    const resize = new ResizeObserver(([entry]) => {
      size = [entry.contentRect.width, entry.contentRect.height];
      placeThumb();
    });

    // `from` diz qual controle mudou, pra não reescrever o campo que a pessoa está digitando
    function update(from) {
      const rgb = hsvToRgb(hsv);
      hex = rgbToHex(rgb);
      sheet.sheet.style.setProperty('--hue', rgbToHex(hsvToRgb([hsv[0], 1, 1])));
      sheet.sheet.style.setProperty('--picked', hex);
      placeThumb();
      area.ariaValueText = `saturação ${Math.round(hsv[1] * 100)}%, brilho ${Math.round(hsv[2] * 100)}%`;
      if (from !== 'hue') hue.value = Math.round(hsv[0]);
      if (from !== 'hex') hexInput.value = hex;
      if (from !== 'rgb') channels.forEach((input, i) => (input.value = Math.round(rgb[i])));
      const match = swatches.find(swatch => swatch.value === hex);
      if (match !== pressed) {
        if (pressed) pressed.ariaPressed = false;
        if (match) match.ariaPressed = true;
        pressed = match;
      }
      preview();
    }

    function fromHex(next, from) {
      const [h0, s, v] = rgbToHsv(hexToRgb(next));
      hsv = [s ? h0 : hsv[0], s, v]; // cinza não tem matiz: mantém a da faixa
      update(from);
    }

    function dragArea() {
      dragFrame = 0;
      const r = area.getBoundingClientRect();
      const clamp = v => Math.min(1, Math.max(0, v));
      hsv = [hsv[0], clamp((pointer.x - r.left) / r.width), 1 - clamp((pointer.y - r.top) / r.height)];
      update();
    }
    const follow = e => {
      pointer = { x: e.clientX, y: e.clientY };
      dragFrame ||= requestAnimationFrame(dragArea);
    };
    area.addEventListener('pointerdown', e => {
      area.setPointerCapture(e.pointerId);
      follow(e);
    });
    area.addEventListener('pointermove', e => area.hasPointerCapture(e.pointerId) && follow(e));
    area.addEventListener('keydown', e => {
      const step = e.shiftKey ? 0.1 : 0.02;
      const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
      if (!moves[e.key]) return;
      e.preventDefault();
      const clamp = v => Math.min(1, Math.max(0, v));
      hsv = [hsv[0], clamp(hsv[1] + moves[e.key][0]), clamp(hsv[2] + moves[e.key][1])];
      update();
    });

    hue.addEventListener('input', () => {
      hsv = [Number(hue.value), hsv[1], hsv[2]];
      update('hue');
    });
    hexInput.addEventListener('input', () => {
      const next = parseHex(hexInput.value);
      hexInput.toggleAttribute('aria-invalid', !next);
      if (next) fromHex(next, 'hex');
    });
    hexInput.addEventListener('blur', () => {
      hexInput.removeAttribute('aria-invalid');
      hexInput.value = hex;
    });
    for (const input of channels) {
      input.addEventListener('input', () => {
        if (channels.some(c => c.value === '')) return;
        fromHex(rgbToHex(channels.map(c => Number(c.value))), 'rgb');
      });
      input.addEventListener('blur', () => update());
    }
    for (const input of [hexInput, ...channels]) {
      input.addEventListener('keydown', e => e.key === 'Enter' && input.blur());
    }
    for (const swatch of swatches) swatch.addEventListener('click', () => fromHex(swatch.value));

    function finish(picked) {
      if (!sheet.close()) return;
      // uma prévia pendente pintaria por cima do tema que o editor restaura ao cancelar
      cancelAnimationFrame(previewFrame);
      cancelAnimationFrame(dragFrame);
      resize.disconnect();
      resolve(picked);
    }

    actions.next.autofocus = !usesMouse;
    update();
    sheet.open();
    resize.observe(area);
  });
}
