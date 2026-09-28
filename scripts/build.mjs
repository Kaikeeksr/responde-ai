// Monta em _site/ o site que vai pro ar (uso: node scripts/build.mjs [versão]):
// - junta os módulos JS e CSS num arquivo cada
// - carimba a versão nas URLs, senão o cache do GitHub Pages (max-age=600) junta HTML novo com CSS/JS velho
// - gera <cena>.html pra cada cena da home (o Pages serve /<cena> a partir dele), já com o fundo da cena
import { execSync } from 'node:child_process';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';

const out = '_site';
const version = process.argv[2] ?? 'dev';
const readJSON = async path => JSON.parse(await readFile(path, 'utf8'));

await rm(out, { recursive: true, force: true });
await mkdir(out);
await cp('assets', `${out}/assets`, { recursive: true });
execSync(`npx --yes esbuild@0.28.2 src/main.js src/main.css --bundle --minify --format=esm --outbase=. --outdir=${out} --log-level=warning`, { stdio: 'inherit' });

const page = (await readFile('index.html', 'utf8')).replaceAll('?v=dev', `?v=${version}`);
await writeFile(`${out}/index.html`, page);

for (const name of (await readJSON('assets/home.json')).scenes) {
  const { bg } = (await readJSON(`assets/${name}/scene.json`)).theme ?? {};
  // pinta a cor da cena antes do JS carregar, sem passar pela cor da home
  const html = bg ? page.replace('<html', `<html style="--bg:${bg}"`).replace(/(name="theme-color" content=")[^"]*/, `$1${bg}`) : page;
  await writeFile(`${out}/${name}.html`, html);
}
