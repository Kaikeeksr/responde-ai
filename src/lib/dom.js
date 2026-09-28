export const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const usesMouse = matchMedia('(hover: hover) and (pointer: fine)').matches;

// com "reduzir movimento" ligado, pula direto pro estado final
export const play = animation => (calm ? animation.progress(1) : animation);

// { "accent": "#e7b7bd" } → --accent no elemento; devolve a função que desfaz
export function applyTheme(theme = {}, el = document.documentElement) {
  const entries = Object.entries(theme);
  for (const [name, value] of entries) el.style.setProperty(`--${name}`, value);
  syncThemeColor();
  return () => {
    for (const [name] of entries) el.style.removeProperty(`--${name}`);
    syncThemeColor();
  };
}

// a barra do navegador no celular acompanha o fundo
function syncThemeColor() {
  document.querySelector('meta[name="theme-color"]').content =
    getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
}

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

// imagem que falhar não trava nada
export const decoded = (...els) =>
  Promise.all(els.flatMap(el => [...el.querySelectorAll('img')]).map(img => img.decode().catch(() => {})));
