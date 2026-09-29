// fixada no carregamento: a navegação troca a URL, mas os arquivos continuam aqui
export const ROOT = new URL('./', document.baseURI);

const scenes = new Map();

export async function loadHome() {
  const home = await fetchJSON('assets/home.json');
  return { ...home, scenes: await Promise.all(home.scenes.map(loadScene)) };
}

export function loadScene(name) {
  if (!scenes.has(name)) scenes.set(name, fetchJSON(`assets/${name}/scene.json`).then(scene => ({ name, ...scene })));
  return scenes.get(name);
}

// no ar, o build põe a versão do deploy no src do main.js (?v=…): o JSON vai com ela na URL, fica em cache
// e não revalida a cada abertura (e bate com os <link rel="preload"> que o build põe no HTML).
// em dev (sem versão), sempre confere com o servidor, pra edição no JSON aparecer na hora
const VERSION = new URL(import.meta.url).searchParams.get('v');
const versioned = VERSION && VERSION !== 'dev';

// caminhos que começam com "./" ou "../" são relativos à pasta do json
async function fetchJSON(path) {
  const url = new URL(path, ROOT);
  if (versioned) url.searchParams.set('v', VERSION);
  const res = await fetch(url, versioned ? {} : { cache: 'no-cache' });
  if (!res.ok) throw new Error(`${path} não encontrado (${res.status})`);
  return JSON.parse(await res.text(), (_, value) =>
    typeof value === 'string' && /^\.\.?\//.test(value) ? new URL(value, url).href : value);
}
