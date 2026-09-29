// uso: node scripts/build.mjs [versão] → _site/
// a versão vai nas URLs porque o cache do GitHub Pages (max-age=600) juntaria HTML novo com CSS/JS velho
import { execSync } from 'node:child_process';
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';

const out = '_site';
const version = process.argv[2] ?? 'dev';
const readJSON = async path => JSON.parse(await readFile(path, 'utf8'));

await rm(out, { recursive: true, force: true });
await mkdir(out);
await cp('assets', `${out}/assets`, { recursive: true });
execSync(`npx --yes esbuild@0.28.2 src/main.js src/main.css --bundle --minify --format=esm --outbase=. --outdir=${out} --log-level=warning`, { stdio: 'inherit' });

const page = (await readFile('index.html', 'utf8')).replaceAll('?v=dev', `?v=${version}`);
await writeFile(`${out}/index.html`, page);
await writeFile(`${out}/criar.html`, page);

const scenes = (await readdir('assets', { withFileTypes: true })).filter(entry => entry.isDirectory()).map(entry => entry.name);
for (const name of scenes) {
  const { bg } = (await readJSON(`assets/${name}/scene.json`)).theme ?? {};
  // a cor da cena já vem no HTML, sem passar pela da home
  const html = bg ? page.replace('<html', `<html style="--bg:${bg}"`).replace(/(name="theme-color" content=")[^"]*/, `$1${bg}`) : page;
  await writeFile(`${out}/${name}.html`, html);
}
