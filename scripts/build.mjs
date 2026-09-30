// uso: node scripts/build.mjs [versão] → _site/
// a versão vai nas URLs porque o cache do GitHub Pages (max-age=600) juntaria HTML novo com CSS/JS velho
import { execSync } from 'node:child_process';
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { posix } from 'node:path';

const out = '_site';
const version = process.argv[2] ?? 'dev';
const readJSON = async path => JSON.parse(await readFile(path, 'utf8'));
// mesmas rotas do src/custom.js
const EDITOR = 'criar';
const BASE = 'convite';

await rm(out, { recursive: true, force: true });
await mkdir(out);
await cp('assets', `${out}/assets`, { recursive: true });
execSync(`npx --yes esbuild@0.28.2 src/main.js src/main.css --bundle --minify --format=esm --outbase=. --outdir=${out} --log-level=warning`, { stdio: 'inherit' });

// GSAP e confetti servidos daqui, num arquivo só: sem conexão extra com o CDN na primeira visita
// (o cache do navegador é separado por site, então o CDN não traz vantagem de cache)
let page = await readFile('index.html', 'utf8');
const vendors = [...page.matchAll(/<script defer src="(https:\/\/cdn\.jsdelivr\.net\/[^"]+)"><\/script>\r?\n?/g)];
const code = await Promise.all(vendors.map(async ([, url]) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} respondeu ${res.status}`);
  return (await res.text()).replace(/\/\/# sourceMappingURL=.*$/gm, '');
}));
await writeFile(`${out}/vendor.js`, code.join(';\n'));
vendors.forEach(([tag], i) => (page = page.replace(tag, i ? '' : '<script defer src="vendor.js?v=dev"></script>\n')));
page = page.replaceAll('?v=dev', `?v=${version}`);

// o que cada rota vai buscar logo de cara já é pedido pelo HTML, em paralelo, em vez de em cascata pelo JS
// (o ?v= dos JSONs tem que ser o mesmo que o src/content.js põe, senão o preload não é aproveitado)
const scenes = new Map();
for (const entry of await readdir('assets', { withFileTypes: true })) {
  if (entry.isDirectory()) scenes.set(entry.name, await readJSON(`assets/${entry.name}/scene.json`));
}
const home = await readJSON('assets/home.json');
const asset = (scene, path) => posix.join('assets', scene, path);
const json = path => `<link rel="preload" href="${path}?v=${version}" as="fetch" crossorigin>`;
const image = (href, media) => `<link rel="preload" href="${href}" as="image"${media ? ` media="${media}"` : ''}>`;
// o <picture> do fundo usa a paisagem a partir de 1:1 e o retrato abaixo disso (components/backdrop.js)
const backdrop = (name, { portrait, landscape } = {}) => [
  landscape && image(asset(name, landscape), '(min-aspect-ratio: 1/1)'),
  portrait && image(asset(name, portrait), landscape && 'not all and (min-aspect-ratio: 1/1)'),
];
const GIPHY = '<link rel="preconnect" href="https://api.giphy.com" crossorigin>';
const sceneJSON = name => json(`assets/${name}/scene.json`);
// a cena base (convite e editor) carrega também as cenas de onde vêm os fundos
const withBackgrounds = name => [sceneJSON(name), ...(scenes.get(name).backgrounds ?? []).filter(b => b.scene).map(b => sceneJSON(b.scene))];

// `bg`: a cor da cena já vem no HTML, sem passar pela da home
function route(file, links, bg) {
  const head = version === 'dev' ? [] : links.flat().filter(Boolean);
  let html = page.replace('</head>', `${head.join('\n')}${head.length ? '\n' : ''}</head>`);
  if (bg) html = html.replace('<html', `<html style="--bg:${bg}"`).replace(/(name="theme-color" content=")[^"]*/, `$1${bg}`);
  return writeFile(`${out}/${file}`, html);
}

await route('index.html', [
  json('assets/home.json'),
  image('assets/icon.svg'), // a marca no topo da home: ela só entra com as imagens decodificadas
  home.scenes.map(sceneJSON),
  home.scenes.map(name => scenes.get(name).question?.icon && image(asset(name, scenes.get(name).question.icon))),
]);

const firstBackground = scenes.get(BASE).backgrounds?.[0];
await route(`${EDITOR}.html`, [
  withBackgrounds(BASE),
  firstBackground?.scene && backdrop(firstBackground.scene, scenes.get(firstBackground.scene).background),
]);

for (const [name, scene] of scenes) {
  const links = name === BASE
    // o convite é o link que as pessoas recebem: o GIF vem do GIPHY, então a conexão já sai aberta
    ? [withBackgrounds(name), GIPHY]
    : [sceneJSON(name), backdrop(name, scene.background), scene.question?.icon && image(asset(name, scene.question.icon)), scene.answer?.gif && GIPHY];
  await route(`${name}.html`, links, scene.theme?.bg);
}
