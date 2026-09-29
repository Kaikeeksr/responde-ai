export const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const usesMouse = matchMedia('(hover: hover) and (pointer: fine)').matches;

// com "reduzir movimento", pula direto pro estado final
export const play = animation => (calm ? animation.progress(1) : animation);

export function applyTheme(theme = {}, el = document.documentElement) {
  const entries = Object.entries(theme);
  for (const [name, value] of entries) el.style.setProperty(`--${name}`, value);
  syncThemeColor();
  return () => {
    for (const [name] of entries) el.style.removeProperty(`--${name}`);
    syncThemeColor();
  };
}

const BASE_BG = '#fbefe9'; // o --bg do base.css

// lê o valor que o tema pediu, não o computado: com o fade do tema o computado ainda é a cor antiga,
// e ler o computado forçaria o navegador a recalcular o estilo da página inteira na hora
function syncThemeColor() {
  document.querySelector('meta[name="theme-color"]').content =
    document.documentElement.style.getPropertyValue('--bg').trim() || BASE_BG;
}

// resolve quando o navegador está ocioso (ou no `timeout`, no máximo); o Safari não tem requestIdleCallback
export const idle = (timeout = 1000) => new Promise(resolve =>
  (window.requestIdleCallback ?? (fn => setTimeout(fn, 16)))(() => resolve(), { timeout }));

// filhos falsy são ignorados
export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key in el) el[key] = value;
    else el.setAttribute(key, value);
  }
  el.append(...children.filter(Boolean));
  return el;
}

export function svg(viewBox, markup) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  el.setAttribute('viewBox', viewBox);
  el.innerHTML = markup;
  return el;
}

export function center(el) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

export const cssList = name =>
  getComputedStyle(document.documentElement).getPropertyValue(name).split(',').map(item => item.trim());

export const decoded = (...els) =>
  Promise.all(els.flatMap(el => [...el.querySelectorAll('img')]).map(img => img.decode().catch(() => {})));
