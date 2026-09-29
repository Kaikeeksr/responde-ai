import { gsap, SplitText } from '../lib/vendor.js';
import { h, play } from '../lib/dom.js';

export function createPage({ className, before, title, lead, content, items }) {
  const heading = h('h1', { className: 'page-title', textContent: title });
  const paragraph = h('p', { className: 'page-lead', textContent: lead });
  const intro = h('div', { className: 'page-intro' }, before, heading, paragraph);
  const el = h('main', { className: `page ${className}` }, intro, content);
  let entrance;

  return {
    el,
    enter() {
      document.body.append(el);
      const lines = SplitText.create(heading, { type: 'lines', mask: 'lines' });
      // folga na máscara pra não cortar acento nem a perna do p/g/j, compensada numa margem só embaixo:
      // margens de cima e de baixo entre linhas colapsariam e o título mudaria de altura no fim
      gsap.set(lines.masks, { top: '-0.15em', paddingTop: '0.15em', paddingBottom: '0.25em', marginBottom: '-0.4em' });
      entrance = gsap.timeline({ defaults: { duration: 0.8, ease: 'expo.out' }, onComplete: () => lines.revert() })
        .from(lines.lines, { yPercent: 160, stagger: 0.08 }, 0.05)
        .from(paragraph, { autoAlpha: 0, y: 10 }, 0.3)
        // o transform que o GSAP deixa inline travaria o hover/toque do CSS
        .from(items, { autoAlpha: 0, y: 16, stagger: 0.07, clearProps: 'transform,opacity,visibility' }, 0.4);
      if (before) entrance.from(before, { autoAlpha: 0, y: 8 }, 0);
      return play(entrance);
    },
    leave() {
      entrance.kill();
      el.inert = true;
      return play(gsap.to([intro, ...items], { autoAlpha: 0, y: -12, duration: 0.3, ease: 'power2.in', stagger: 0.05 }))
        .then(() => el.remove());
    },
  };
}
