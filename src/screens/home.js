import { gsap, SplitText } from '../lib/vendor.js';
import { h, svg, applyTheme, decoded, play } from '../lib/dom.js';
import { ROOT, loadHome } from '../content.js';
import { createBackdrop } from '../components/backdrop.js';

// nome e ícone do site vêm do <head>; texto e convites, do assets/home.json
export async function createHome({ onOpen }) {
  const { title, lead, scenes } = await loadHome();
  const icon = new URL(document.querySelector('link[rel="icon"]').getAttribute('href'), ROOT).href;
  const heading = h('h1', { className: 'home-title', textContent: title });
  const intro = h('div', { className: 'home-intro' },
    h('p', { className: 'home-brand' }, h('img', { src: icon, alt: '' }), document.title),
    heading,
    h('p', { className: 'home-lead', textContent: lead }));
  const items = scenes.map(scene => createItem(scene, onOpen));
  const el = h('main', { className: 'home' }, intro, h('nav', { className: 'home-list', 'aria-label': 'Convites' }, ...items));
  let entrance;

  await decoded(el);

  return {
    enter() {
      document.body.append(el);
      const lines = SplitText.create(heading, { type: 'lines', mask: 'lines' });
      entrance = play(gsap.timeline({ defaults: { duration: 0.8, ease: 'expo.out' }, onComplete: () => lines.revert() })
        .from(intro.firstChild, { autoAlpha: 0, y: 8 })
        .from(lines.lines, { yPercent: 105, stagger: 0.08 }, 0.05)
        .from(intro.lastChild, { autoAlpha: 0, y: 10 }, 0.3)
        .from(items, { autoAlpha: 0, y: 16, stagger: 0.07 }, 0.4));
      // adianta os fundos das cenas pra troca de tela não esperar a rede
      for (const scene of scenes) decoded(createBackdrop(scene.background).el);
    },
    leave() {
      entrance.kill();
      el.inert = true;
      return play(gsap.to([intro, ...items], { autoAlpha: 0, y: -12, duration: 0.3, ease: 'power2.in', stagger: 0.05 }))
        .then(() => el.remove());
    },
  };
}

function createItem({ name, description, question, theme }, onOpen) {
  const icon = h('span', { className: 'home-icon' }, question.icon ? h('img', { src: question.icon, alt: '' }) : question.emoji);
  applyTheme(theme, icon);
  const link = h('a', { className: 'home-item', href: new URL(name, ROOT).href },
    icon,
    h('span', { className: 'home-text' },
      h('span', { className: 'home-name', textContent: question.title }),
      description && h('span', { className: 'home-desc', textContent: description })),
    svg('0 0 24 24', '<path d="m9.5 6 6 6-6 6"/>'));

  link.addEventListener('click', e => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return; // nova aba fica com o navegador
    e.preventDefault();
    onOpen(name);
  });
  return link;
}
