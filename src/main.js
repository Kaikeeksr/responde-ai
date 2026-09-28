import { ROOT } from './content.js';
import { createHome } from './screens/home.js';
import { createScene } from './screens/scene.js';

// "/" é a home e "/<cena>" a cena; no ar, o build gera <cena>.html a partir deste index.html
const routeOf = ({ pathname }) => pathname.slice(ROOT.pathname.length).replace(/(^index)?\.html$/, '');
let screen, queue = Promise.resolve();

addEventListener('popstate', render);
render();

function go(name) {
  const url = new URL(name, ROOT);
  if (url.pathname === location.pathname) return;
  history.pushState({ inApp: true }, '', url);
  render();
}

// quem veio da home volta pelo histórico; quem abriu o link direto vai pra home
function exitScene() {
  if (history.state?.inApp) history.back();
  else go('');
}

// uma troca por vez; a próxima tela já carrega enquanto a atual sai
function render() {
  const route = routeOf(location);
  queue = queue
    .then(async () => {
      const next = route ? createScene(route, { onExit: exitScene }) : createHome({ onOpen: go });
      await screen?.leave();
      screen = await next;
      screen.enter();
    })
    .catch(console.error);
}
