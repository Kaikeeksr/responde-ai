import { h, applyTheme, decoded } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import { ROOT, loadHome } from '../content.js';
import { EDITOR } from '../custom.js';
import { createPage } from '../components/page.js';
import { createBackdrop } from '../components/backdrop.js';

export async function createHome({ onOpen }) {
  const { title, lead, scenes, create } = await loadHome();
  const siteIcon = new URL(document.querySelector('link[rel="icon"]').getAttribute('href'), ROOT).href;
  const items = scenes.map(scene => createSceneItem(scene, onOpen));
  if (create) items.push(createItem({ ...create, route: EDITOR, badge: h('span', { className: 'home-icon home-add' }, icon('plus')) }, onOpen));
  const page = createPage({
    className: 'home',
    before: h('p', { className: 'home-brand' }, h('img', { src: siteIcon, alt: '' }), document.title),
    title,
    lead,
    content: h('nav', { className: 'home-list', 'aria-label': 'Convites' }, ...items),
    items,
  });

  await decoded(page.el);

  return {
    enter() {
      page.enter();
      // adianta os fundos das cenas pra troca de tela não esperar a rede
      for (const scene of scenes) decoded(createBackdrop(scene.background).el);
    },
    leave: page.leave,
  };
}

function createSceneItem({ name, description, question, theme }, onOpen) {
  const badge = h('span', { className: 'home-icon' }, question.icon ? h('img', { src: question.icon, alt: '' }) : question.emoji);
  applyTheme(theme, badge);
  return createItem({ route: name, badge, title: question.title, description }, onOpen);
}

function createItem({ route, badge, title, description }, onOpen) {
  const link = h('a', { className: 'home-item', href: new URL(route, ROOT).href },
    badge,
    h('span', { className: 'home-text' },
      h('span', { className: 'home-name', textContent: title }),
      description && h('span', { className: 'home-desc', textContent: description })),
    icon('next'));

  link.addEventListener('click', e => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return; // nova aba fica com o navegador
    e.preventDefault();
    onOpen(route);
  });
  return link;
}
