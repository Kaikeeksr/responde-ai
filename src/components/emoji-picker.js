import { h, calm, idle, usesMouse } from '../lib/dom.js';
import { createSheet } from './sheet.js';

// catálogo com nomes em português; versão 15 = emojis que iPhone e Android atuais já desenham
const CATALOG = 'https://cdn.jsdelivr.net/npm/emojibase-data@15/pt/compact.json';
// grupos do emojibase (o 2, de tons de pele e afins, fica de fora); "recent" é local, dos últimos escolhidos
const GROUPS = [
  ['recent', 'Recentes', '🕘'],
  [0, 'Carinhas', '😀'],
  [1, 'Pessoas', '👋'],
  [3, 'Bichos e natureza', '🐻'],
  [4, 'Comidas', '🍕'],
  [5, 'Viagens e lugares', '✈️'],
  [6, 'Atividades', '🎉'],
  [7, 'Objetos', '💡'],
  [8, 'Símbolos', '💖'],
  [9, 'Bandeiras', '🏳️'],
];
const RECENT_KEY = 'responde-ai:emojis';
const RECENT_MAX = 16;
const CELL_REM = 2.6; // mesmo mínimo do grid no CSS: é com ele que a altura das seções é estimada
const CHUNK = 96; // resultado de busca vai em blocos, pra só os visíveis serem desenhados

// catálogo baixado e seções montadas uma vez só, aos poucos e com a tela ociosa;
// depois disso, abrir o seletor é só encaixar as seções prontas
let prepared, ready;

// o editor chama isso ao abrir: quando a pessoa tocar no "+", já está tudo pronto
export function preloadEmojis() {
  idle().then(prepare).catch(() => {});
}

function prepare() {
  prepared ??= (async () => {
    const res = await fetch(CATALOG);
    if (!res.ok) throw new Error(res.status);
    const list = await res.json();
    await idle(500);
    const items = list
      .filter(({ group }) => GROUPS.some(([id]) => id === group))
      .sort((a, b) => a.order - b.order)
      .map(({ unicode, label, tags = [], group }) => ({ emoji: unicode, group, label, words: plain([label, ...tags].join(' ')) }));
    const sections = [];
    for (const [id, name] of GROUPS) {
      if (id === 'recent') continue;
      await idle(500); // um grupo por vez, sem travar a tela
      sections.push(section(id, name, items.filter(item => item.group === id)));
    }
    return (ready = { items, sections, byEmoji: new Map(items.map(item => [item.emoji, item])) });
  })().catch(error => {
    prepared = undefined; // na próxima abertura tenta de novo
    throw error;
  });
  return prepared;
}

const plain = text => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

const cell = ({ emoji, label }) =>
  h('button', { type: 'button', className: 'emoji-cell', title: label, 'aria-label': label, value: emoji, textContent: emoji });

function section(id, name, members) {
  const el = h('section', { className: 'emoji-section', 'aria-label': name },
    h('h3', { className: 'emoji-heading', textContent: name }),
    h('div', { className: 'emoji-grid' }, ...members.map(cell)));
  Object.assign(el.dataset, { id, count: members.length });
  return el;
}

function chunks(items) {
  const blocks = [];
  for (let i = 0; i < items.length; i += CHUNK) {
    const block = h('div', { className: 'emoji-grid emoji-chunk' }, ...items.slice(i, i + CHUNK).map(cell));
    block.dataset.count = Math.min(CHUNK, items.length - i);
    blocks.push(block);
  }
  return blocks;
}

// os recentes são só conveniência: sem storage (aba anônima etc.), a seção some
function readRecent() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY)) ?? [];
  } catch {
    return [];
  }
}
function saveRecent(emoji) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify([emoji, ...readRecent().filter(e => e !== emoji)].slice(0, RECENT_MAX)));
  } catch {}
}

export function pickEmoji({ label }) {
  return new Promise(resolve => {
    const search = h('input', {
      type: 'search', className: 'input emoji-search', placeholder: 'Buscar emoji', 'aria-label': 'Buscar emoji',
      enterKeyHint: 'search', autocomplete: 'off', autofocus: usesMouse,
    });
    const recent = readRecent();
    const groups = GROUPS.filter(([id]) => id !== 'recent' || recent.length);
    const tabs = groups.map(([id, name, emoji]) =>
      h('button', { type: 'button', className: 'emoji-tab', title: name, 'aria-label': name, value: id, textContent: emoji }));
    const mark = h('span', { className: 'emoji-tab-mark', ariaHidden: 'true' });
    const nav = h('nav', { className: 'emoji-tabs', 'aria-label': 'Categorias', style: `--tabs:${tabs.length}` }, mark, ...tabs);
    const list = h('div', { className: 'emoji-list' });
    const status = h('p', { className: 'emoji-status', role: 'status', textContent: 'Carregando…' });
    const results = h('div', { className: 'emoji-results' }, status, list);
    const close = h('button', { type: 'button', className: 'btn btn-secondary emoji-close' }, 'Voltar');
    const sheet = createSheet({ className: 'emoji-sheet', label, onDismiss: () => finish() },
      h('h2', { className: 'sheet-title', textContent: label }), search, nav, results, h('div', { className: 'emoji-footer' }, close));
    const resize = new ResizeObserver(() => measure());
    let catalog, grouped, sections = new Map(), head = 36, typing, jumping, jumpTimer, ticking;

    function show(data) {
      catalog = data;
      status.textContent = '';
      const mine = recent.length && section('recent', 'Recentes', recent.map(emoji => data.byEmoji.get(emoji) ?? { emoji, label: emoji }));
      grouped = [mine, ...data.sections].filter(Boolean);
      find();
    }

    function render(blocks, isGrouped) {
      list.replaceChildren(...blocks);
      list.classList.toggle('is-flat', !isGrouped);
      sections = new Map(isGrouped ? blocks.map(block => [block.dataset.id, block]) : []);
      nav.classList.toggle('is-searching', !isGrouped);
      results.scrollTop = 0;
      measure();
      follow();
    }

    // o que está fora da tela não é desenhado (content-visibility); a altura estimada de cada bloco
    // é a certa (linhas × tamanho da célula), pra rolagem e salto pelas abas caírem no lugar
    function measure() {
      const width = list.clientWidth;
      if (!width) return;
      const heading = list.querySelector('.emoji-heading');
      if (heading?.offsetHeight) head = heading.offsetHeight;
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
      const columns = Math.max(1, Math.floor(width / (rem * CELL_REM)));
      const size = width / columns;
      for (const block of list.children) {
        const height = Math.ceil(block.dataset.count / columns) * size + (block.tagName === 'SECTION' ? head : 0);
        block.style.containIntrinsicSize = `auto ${height}px`;
      }
    }

    // o marcador desliza até a aba da categoria que está no topo da lista
    function select(id) {
      const index = tabs.findIndex(tab => tab.value === id);
      for (const tab of tabs) tab.ariaPressed = tab.value === id;
      mark.style.setProperty('--at', Math.max(0, index));
      mark.hidden = index < 0;
    }

    function follow() {
      ticking = false;
      // durante o salto, a aba clicada já está marcada: não passa pelas do meio; acaba quando a seção chega no topo
      const bottom = results.scrollTop >= results.scrollHeight - results.clientHeight - 2;
      if (jumping && Math.abs(jumping.offsetTop - results.scrollTop) > 2 && !bottom) return;
      const target = jumping;
      land();
      if (!sections.size) return select(undefined);
      // no fim da lista as últimas seções (curtas) nunca chegam ao topo: vale a clicada, ou a última
      if (bottom) return select(target?.dataset.id ?? [...sections.keys()].at(-1));
      const top = results.getBoundingClientRect().top + 8;
      let current = sections.keys().next().value;
      for (const [id, block] of sections) if (block.getBoundingClientRect().top <= top) current = id;
      select(current);
    }

    function jump(id) {
      if (!catalog) return;
      if (search.value) {
        search.value = '';
        find();
      }
      const target = sections.get(id);
      if (!target) return;
      select(id);
      jumping = target;
      clearTimeout(jumpTimer);
      jumpTimer = setTimeout(land, 1500); // segurança, se a rolagem for interrompida sem aviso
      results.scrollTo({ top: target.offsetTop, behavior: calm ? 'auto' : 'smooth' });
    }
    function land() {
      clearTimeout(jumpTimer);
      jumping = undefined;
    }

    function find() {
      if (!catalog) return;
      const term = plain(search.value.trim());
      if (!term) {
        status.textContent = '';
        return render(grouped, true);
      }
      const words = term.split(/\s+/);
      const found = catalog.items.filter(item => words.every(word => item.words.includes(word)));
      render(chunks(found), false);
      status.textContent = found.length ? '' : `Nenhum emoji pra “${search.value.trim()}”.`;
    }

    function finish(emoji) {
      if (!sheet.close()) return;
      clearTimeout(typing);
      clearTimeout(jumpTimer);
      resize.disconnect();
      if (emoji) saveRecent(emoji);
      resolve(emoji);
    }

    // setas andam pela grade como num teclado de emojis; ↓ na busca entra na grade
    function move(from, key) {
      const cells = [...list.querySelectorAll('.emoji-cell')];
      const i = cells.indexOf(from);
      const columns = Math.max(1, Math.round(from.parentElement.clientWidth / from.offsetWidth));
      const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -columns, ArrowDown: columns }[key];
      const next = cells[i + step] ?? (key === 'ArrowUp' ? search : undefined);
      next?.focus();
      if (next !== search) next?.scrollIntoView({ block: 'nearest' });
    }

    list.addEventListener('click', e => {
      const target = e.target.closest('.emoji-cell');
      if (target) finish(target.value);
    });
    list.addEventListener('keydown', e => {
      if (!e.target.matches('.emoji-cell') || !e.key.startsWith('Arrow')) return;
      e.preventDefault();
      move(e.target, e.key);
    });
    nav.addEventListener('click', e => {
      const tab = e.target.closest('.emoji-tab');
      if (tab) jump(tab.value);
    });
    results.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(follow);
    }, { passive: true });
    // se a pessoa rola no meio do salto, a marcação volta a seguir a lista
    for (const type of ['wheel', 'touchstart']) results.addEventListener(type, land, { passive: true });
    search.addEventListener('input', () => {
      clearTimeout(typing);
      typing = setTimeout(find, 120);
    });
    search.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        list.querySelector('.emoji-cell')?.focus();
      }
      if (e.key !== 'Enter') return;
      // Enter escolhe o primeiro resultado da busca
      clearTimeout(typing);
      find();
      const first = search.value.trim() && list.querySelector('.emoji-cell');
      if (first) finish(first.value);
      else if (!usesMouse) search.blur();
    });
    close.addEventListener('click', () => finish());

    close.autofocus = !usesMouse;
    select(undefined);
    sheet.open();
    resize.observe(results);
    // já preparado: encaixa antes do primeiro quadro da animação, não no meio dela
    if (ready) show(ready);
    else {
      prepare().then(show, () => {
        status.textContent = 'Não deu pra carregar os emojis. Dá pra digitar um no círculo, pelo teclado.';
      });
    }
  });
}
