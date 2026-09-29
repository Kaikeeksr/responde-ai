import { gsap } from '../lib/vendor.js';
import { h, svg, calm, cssList, play } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import { HEART, vibrate } from '../lib/fx.js';
import { findGif } from '../lib/giphy.js';
import { pickGif } from './gif-picker.js';

const { random } = gsap.utils;

// `gif` é o id de um GIF do GIPHY; com `onGif`, o cartão ganha o botão de escolher/trocar o GIF;
// `reaction: false` tira as partículas (o cartão só balança)
export function createReward({ photo, alt, gif, reaction, onGif }) {
  let media = photo && h('img', { src: photo, alt, decoding: 'async' });
  const reactions = h('div', { className: 'reactions', 'aria-hidden': 'true' });
  const add = onGif && h('button', { type: 'button', className: 'icon-btn reward-add', 'aria-label': 'Escolher GIF' }, icon('plus'));
  const el = h('div', { className: 'reward shine' }, media, reactions, add);
  let count = 0, requested = 0, taps, gradients;

  if (photo) media.decode().catch(() => {}); // decodifica durante a pergunta, pra foto não engasgar a entrada
  const ready = gif ? findGif(gif).then(showGif, () => {}) : Promise.resolve();

  function showGif({ url, title }) {
    const img = h('img', { src: url, alt: title, decoding: 'async' }), id = ++requested;
    return img.decode().then(() => {
      if (id !== requested) return;
      if (media) media.replaceWith(img);
      else el.prepend(img);
      media = img;
      el.dataset.giphy = '';
      if (el.offsetParent) play(gsap.from(img, { opacity: 0, scale: 1.15, duration: 0.8, ease: 'expo.out' }));
      if (add) {
        add.ariaLabel = 'Trocar GIF';
        add.replaceChildren(icon('edit'));
        play(gsap.from(add, { scale: 0.3, opacity: 0, duration: 0.5, ease: 'back.out(2.5)', clearProps: 'transform,opacity' }));
      }
    }, () => {});
  }

  add?.addEventListener('pointerdown', e => e.stopPropagation());
  add?.addEventListener('click', async e => {
    e.stopPropagation();
    const chosen = await pickGif();
    if (!chosen) return;
    showGif(chosen);
    onGif(chosen);
  });

  function particle(i) {
    if (reaction) return h('span', { className: 'particle', textContent: reaction });
    gradients ??= cssList('--hearts').map(pair => pair.split(/\s+/)); // lido aqui, com o tema da cena já aplicado
    const [top, bottom] = gradients[i % gradients.length];
    const heart = svg('0 0 24 24',
      `<linearGradient id="heart-${i}" x2="0" y2="1"><stop stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>` +
      `<path d="${HEART}" fill="url(#heart-${i})"/>` +
      '<ellipse cx="7.6" cy="7.4" rx="2.3" ry="1.4" transform="rotate(-35 7.6 7.4)" fill="#fff" opacity=".6"/>');
    heart.classList.add('particle');
    return heart;
  }

  function float(x, y) {
    const i = count++, side = i % 2 ? 1 : -1, size = random(22, 42, 1), rise = random(2.4, 3.4);
    const piece = particle(i);
    piece.style.setProperty('--size', `${size}px`);
    reactions.append(piece);

    gsap.set(piece, { x: x - size / 2, y: y - size / 2, rotation: -side * 12, scale: 0.3, opacity: 0 });
    gsap.timeline({ onComplete: () => piece.remove() })
      .to(piece, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(2.5)' })
      .to(piece, { y: `-=${el.offsetHeight * random(0.55, 0.85)}`, duration: rise, ease: 'sine.out' }, 0)
      .to(piece, { x: `+=${side * random(14, 28)}`, rotation: side * 12, duration: rise / 3, ease: 'sine.inOut', yoyo: true, repeat: 2 }, 0)
      .to(piece, { opacity: 0, scale: 0.8, duration: 0.7, ease: 'power1.in' }, rise - 0.7);
  }

  function wave(amount) {
    const width = el.offsetWidth, height = el.offsetHeight;
    for (let i = 0; i < amount; i++)
      gsap.delayedCall(i * 0.16 + random(0, 0.08), float, [width * random(0.14, 0.86), height * random(0.82, 1)]);
  }

  function drizzle() {
    gsap.delayedCall(random(2.8, 4.8), rain);
  }
  function rain() {
    wave(random(1, 2, 1));
    drizzle();
  }

  function reactToTaps() {
    taps = new AbortController();
    const { signal } = taps;
    gsap.set(el, { transformOrigin: '50% 50%' });
    const press = down => gsap.to(el, down
      ? { scale: 0.97, duration: 0.12, ease: 'power2.out', overwrite: 'auto' }
      : { scale: 1, duration: 0.45, ease: 'back.out(2.2)', overwrite: 'auto' });

    el.addEventListener('pointerdown', () => press(true), { signal });
    for (const type of ['pointerup', 'pointercancel', 'pointerleave']) el.addEventListener(type, () => press(false), { signal });
    el.addEventListener('click', e => {
      vibrate([15]);
      const side = random([-1, 1]);
      gsap.to(el, { keyframes: { rotation: [0, 1.2 * side, -0.8 * side, 0.4 * side, 0], easeEach: 'sine.inOut' }, duration: 0.45, overwrite: 'auto' });
      if (reaction === false) return;
      const r = el.getBoundingClientRect();
      for (let i = 0; i < 5; i++)
        gsap.delayedCall(i * 0.08, float, [e.clientX - r.left + random(-16, 16), e.clientY - r.top]);
    }, { signal });
  }

  return {
    el,
    ready,
    enter() {
      gsap.set(media ? [el, media] : el, { clearProps: 'all' });
      // perspectiva fora do .from(): dentro dele ela seria animada até 0 e a foto daria um tranco
      gsap.set(el, { transformPerspective: 900, transformOrigin: '50% 100%' });
      const timeline = gsap.timeline({ defaults: { ease: 'expo.out' } })
        .from(el, { opacity: 0, y: 60, scale: 0.85, rotationX: -35, duration: 1.2 });
      if (media) timeline.from(media, { scale: 1.3, duration: 1.8 }, '<');
      return timeline;
    },
    celebrate() {
      if (calm) return;
      if (reaction !== false) {
        wave(12);
        drizzle();
      }
      reactToTaps();
    },
    leave() {
      taps?.abort();
      gsap.killTweensOf([float, rain]);
      return gsap.to(el, {
        opacity: 0, y: 40, scale: 0.92, duration: 0.4, ease: 'power2.in', overwrite: true,
        onComplete: () => {
          gsap.killTweensOf(reactions.children);
          reactions.replaceChildren();
        },
      });
    },
  };
}
