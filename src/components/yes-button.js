import { gsap } from '../lib/vendor.js';
import { h, center, calm } from '../lib/dom.js';
import { burst, prepareBurst, ripple, vibrate } from '../lib/fx.js';

const GAZE = 3.2; // px que as pupilas andam na direção do alvo

export function createYesButton(label, { reaction, onClick }) {
  const eyes = [0, 1].map(() => h('span', { className: 'eye' }, h('span', { className: 'pupil' })));
  const el = h('button', { type: 'button', className: 'btn yes shine' }, h('span', { className: 'eyes' }, ...eyes), label);
  const pupils = eyes.map(eye => ({
    eye,
    x: gsap.quickTo(eye.firstChild, 'x', { duration: 0.3, ease: 'power3' }),
    y: gsap.quickTo(eye.firstChild, 'y', { duration: 0.3, ease: 'power3' }),
  }));
  // o centro de cada olho, medido uma vez: o Sim fica parado e o olhar é recalculado a cada quadro da fuga do Não
  let eyesAt;

  function accept() {
    onClick();
    vibrate([25, 40, 25, 40, 60]);
    burst(el, reaction);
    if (!calm) [0, 0.18].forEach(delay => ripple(el, delay));
  }

  return {
    el,
    lookAt(target) {
      const to = center(target);
      eyesAt ??= pupils.map(({ eye }) => center(eye));
      pupils.forEach(({ x, y }, i) => {
        const from = eyesAt[i], angle = Math.atan2(to.y - from.y, to.x - from.x);
        x(Math.cos(angle) * GAZE);
        y(Math.sin(angle) * GAZE);
      });
    },
    // chamado quando o Sim termina de entrar e quando a tela muda de tamanho
    remeasure() {
      eyesAt = undefined;
    },
    enter(signal) {
      eyesAt = undefined;
      prepareBurst(reaction);
      el.addEventListener('click', accept, { once: true, signal });
      gsap.set(el, { clearProps: 'all' });
      return gsap.from(el, { y: 24, opacity: 0, duration: 0.6, ease: 'back.out(1.8)', clearProps: 'transform,opacity' });
    },
    leave: () => gsap.to(el, { scale: 1.1, opacity: 0, duration: 0.4, ease: 'power2.in' }),
  };
}
