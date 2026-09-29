import { gsap } from '../lib/vendor.js';
import { h, play, usesMouse } from '../lib/dom.js';
import { searchGifs } from '../lib/giphy.js';
import { createActionBar } from './action-bar.js';

const PAGE = 24;
const TYPING_MS = 450; // cada busca gasta do limite por hora da chave
const ERRORS = {
  401: 'Falta a chave do GIPHY (meta giphy-key no index.html) ou ela não vale.',
  403: 'A chave do GIPHY não foi aceita.',
  429: 'Muitas buscas por agora. Tenta de novo daqui a pouco.',
};

export function pickGif() {
  return new Promise(resolve => {
    const search = h('input', {
      type: 'search', className: 'input gif-search', placeholder: 'Buscar no GIPHY', 'aria-label': 'Buscar GIF',
      enterKeyHint: 'search', autocomplete: 'off', autofocus: usesMouse, // no toque, sem abrir o teclado sozinho
    });
    const actions = createActionBar({ className: 'gif-actions', next: 'Avançar', onBack: () => finish(), onNext: () => finish(selected) });
    const grid = h('div', { className: 'gif-grid' });
    const status = h('p', { className: 'gif-status', role: 'status' });
    const sentinel = h('div', { className: 'gif-more' });
    const results = h('div', { className: 'gif-results' }, grid, status, sentinel);
    const sheet = h('div', { className: 'gif-sheet' },
      search,
      results,
      actions.el,
      h('p', { className: 'gif-credit' }, 'Powered by ', h('strong', { textContent: 'GIPHY' })));
    const backdrop = h('div', { className: 'gif-backdrop' });
    const dialog = h('dialog', { className: 'gif-picker', 'aria-label': 'Escolher GIF' }, backdrop, sheet);
    const more = new IntersectionObserver(([entry]) => entry.isIntersecting && !request && offset < total && load(),
      { root: results, rootMargin: '0px 0px 300px' });
    let term = '', offset = 0, total = Infinity, columns, heights, request, typing, selected, done;

    function reset() {
      const count = results.clientWidth >= 440 ? 3 : 2;
      columns = Array.from({ length: count }, () => h('div', { className: 'gif-column' }));
      heights = columns.map(() => 0);
      grid.replaceChildren(...columns);
      results.scrollTop = 0;
      offset = 0;
      total = Infinity;
      select();
    }

    function select(gif, item) {
      grid.querySelector('[aria-pressed="true"]')?.setAttribute('aria-pressed', 'false');
      item?.setAttribute('aria-pressed', 'true');
      selected = gif;
      actions.next.disabled = !gif;
    }

    function append(gifs) {
      const items = gifs.map(gif => {
        const i = heights.indexOf(Math.min(...heights));
        const item = h('button', {
          type: 'button', className: 'gif-item', style: `aspect-ratio:${gif.thumb.width}/${gif.thumb.height}`,
          'aria-label': gif.title || 'GIF', 'aria-pressed': 'false',
        }, h('img', { src: gif.thumb.url, alt: '', loading: 'lazy', decoding: 'async' }));
        item.addEventListener('click', () => (selected === gif ? finish(gif) : select(gif, item)));
        heights[i] += gif.thumb.height / gif.thumb.width;
        columns[i].append(item);
        return item;
      });
      if (items.length) play(gsap.from(items, { opacity: 0, y: 14, duration: 0.45, ease: 'power2.out', stagger: 0.02, clearProps: 'transform,opacity' }));
    }

    async function load() {
      request?.abort();
      const current = request = new AbortController();
      if (!offset) status.textContent = 'Carregando…';
      try {
        const page = await searchGifs(term, { offset, limit: PAGE, signal: current.signal });
        if (current !== request) return;
        request = undefined;
        total = page.total;
        offset += page.gifs.length;
        if (!page.gifs.length) total = offset;
        append(page.gifs);
        status.textContent = offset ? '' : `Nenhum GIF pra “${term}”.`;
        // se a página não encheu a lista, o sentinela continua visível e não avisaria de novo
        more.unobserve(sentinel);
        more.observe(sentinel);
      } catch (error) {
        if (error.name === 'AbortError') return;
        request = undefined;
        total = offset; // senão o sentinela pediria de novo sem parar
        status.textContent = ERRORS[error.status] ?? 'Não deu pra carregar os GIFs. Tenta de novo.';
      }
    }

    function find(value) {
      clearTimeout(typing);
      if (value === term) return;
      term = value;
      reset();
      load();
    }

    function finish(gif) {
      if (done) return;
      done = true;
      clearTimeout(typing);
      request?.abort();
      more.disconnect();
      resolve(gif);
      play(gsap.timeline({ onComplete: () => dialog.remove() })
        .to(sheet, { yPercent: 12, opacity: 0, duration: 0.3, ease: 'power2.in' })
        .to(backdrop, { opacity: 0, duration: 0.3 }, 0)
        .call(() => dialog.open && dialog.close()));
    }

    search.addEventListener('input', () => {
      clearTimeout(typing);
      typing = setTimeout(find, TYPING_MS, search.value.trim());
    });
    search.addEventListener('keydown', e => {
      if (e.key !== 'Enter') return;
      find(search.value.trim());
      if (!usesMouse) search.blur();
    });
    backdrop.addEventListener('click', () => finish());
    dialog.addEventListener('cancel', e => {
      e.preventDefault();
      finish();
    });
    dialog.addEventListener('close', () => finish()); // o navegador pode fechar sem passar pelo cancel

    actions.back.autofocus = !usesMouse;
    document.body.append(dialog);
    dialog.showModal();
    reset();
    load();
    play(gsap.timeline({ defaults: { ease: 'expo.out' } })
      .from(backdrop, { opacity: 0, duration: 0.35, ease: 'power1.out' })
      .from(sheet, { yPercent: 25, opacity: 0, duration: 0.6 }, 0));
  });
}
