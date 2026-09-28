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

// caminhos que começam com "./" são relativos à pasta do json
async function fetchJSON(path) {
  const url = new URL(path, ROOT);
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`${path} não encontrado (${res.status})`);
  return JSON.parse(await res.text(), (_, value) =>
    typeof value === 'string' && value.startsWith('./') ? new URL(value, url).href : value);
}
