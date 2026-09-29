import './lib/viewport.js';
import { ROOT, loadScene } from './content.js';
import { EDITOR, BASE, loadCustom, reviseQuery } from './custom.js';
import { createHome } from './screens/home.js';
import { createEditor } from './screens/editor.js';
import { createScene } from './screens/scene.js';

// no ar, cada rota é um <rota>.html gerado pelo build a partir deste index.html
const routeOf = ({ pathname }) => pathname.slice(ROOT.pathname.length).replace(/(^index)?\.html$/, '');
const { documentElement: root } = document;
let screen, draft, queue = Promise.resolve();

addEventListener('popstate', render);
render();

function go(path, state) {
  const url = new URL(path, ROOT);
  if (url.href === location.href) return;
  history.pushState({ inApp: true, ...state }, '', url);
  render();
}

function exitScene() {
  if (history.state?.inApp) history.back();
  else go('');
}

// o rascunho fica na URL do editor; o que muda na prévia (o GIF) volta pra ele pelo `draft`
function preview(query) {
  history.replaceState(history.state, '', query);
  go(BASE + query, { fromEditor: true });
}

function revise(changes) {
  draft = reviseQuery(location.search, changes);
  history.replaceState(history.state, '', draft);
}

// mesmo link, agora como convite pronto; voltar retorna pra prévia
function publish() {
  history.pushState({ inApp: true, published: true }, '', location.href);
  render();
}

function render() {
  const route = routeOf(location);
  if (route === EDITOR && draft) history.replaceState(history.state, '', draft);
  if (route !== BASE) draft = undefined;
  const query = location.search, state = history.state ?? {};
  queue = queue
    .then(async () => {
      const next = screenFor(route, query, state);
      const first = !screen;
      await screen?.leave();
      screen = await next;
      if (first) root.style.transition = 'none';
      screen.enter();
      // a primeira tela já abre com a cor dela; o fade do tema é só pra troca entre telas
      if (first) {
        void getComputedStyle(root).getPropertyValue('--bg');
        root.style.removeProperty('transition');
      }
    })
    .catch(console.error);
}

function screenFor(route, query, { fromEditor, published }) {
  if (!route) return createHome({ onOpen: go });
  if (route === EDITOR) return createEditor(query, { onExit: exitScene, onPreview: preview });
  if (route === BASE) {
    const options = fromEditor ? { onEdit: revise, onPublish: publish } : { published };
    return createScene(loadCustom(query), { onExit: exitScene, ...options });
  }
  return createScene(loadScene(route), { onExit: exitScene });
}
