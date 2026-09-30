import { gsap } from '../lib/vendor.js';
import { h, applyTheme, decoded, play } from '../lib/dom.js';
import { createBackdrop } from '../components/backdrop.js';
import { createToolbar } from '../components/toolbar.js';
import { createActionBar } from '../components/action-bar.js';
import { createHero } from '../components/hero.js';
import { createTitle } from '../components/title.js';
import { createChoices } from '../components/choices.js';
import { createReward } from '../components/reward.js';
import { pickIcon } from '../components/icon-picker.js';

const { body, documentElement: root } = document;
const GIF_WAIT_MS = 2000;

// com `onEdit` é a prévia de quem criou: escolhe o GIF e usa os botões de baixo no lugar dos de cima;
// `published` é a cena logo depois de finalizar, já com o compartilhar à mostra
export async function createScene(scene, { onExit, onHome, onEdit, onPublish, published }) {
  const { background, question, answer, reaction, theme, icons, icon } = await scene;
  let iconId = icon;
  const stage = h('main', { className: 'stage' });
  const backdrop = createBackdrop(background);
  const toolbar = createToolbar({ onBack: !onEdit && back, onHome });
  const actions = onEdit && createActionBar({ className: 'scene-actions', next: 'Finalizar', onBack: onExit, onNext: onPublish });
  const hero = createHero(question, { onEdit: onEdit && icons && chooseIcon });
  const title = createTitle(question.title);
  const choices = createChoices({ yes: question.yes, no: question.no, reaction, onAccept: accept });
  const reward = createReward({ ...answer, reaction, onGif: onEdit && chooseGif });
  const frame = actions ? [toolbar.nav, actions] : published ? [toolbar.nav, toolbar.share] : [toolbar.nav];
  const extras = !onEdit && !published ? [toolbar.share] : [];
  let current, resetTheme, gone;

  if (actions) actions.next.disabled = !answer.gif;
  stage.append(hero.el, title.el, choices.el, reward.el);
  await decoded(backdrop.el, hero.el);

  const answering = () => body.dataset.phase === 'answer';
  const visibleParts = () => (answering() ? [...extras, reward, hero, title] : [choices, hero, title]);

  function ask() {
    body.dataset.phase = 'question';
    current = play(gsap.timeline()
      .add(hero.enter())
      .add(title.enter({ rotation: 'random(-20, 20)' }), '-=0.8')
      .add(choices.enter(), '-=0.3'));
  }

  // o GIF entra como uma foto: a resposta espera ele ficar pronto, até um limite
  function accept() {
    current.progress(1);
    const gifReady = Promise.race([reward.ready, new Promise(done => setTimeout(done, GIF_WAIT_MS))]);
    current = play(gsap.timeline({ onComplete: () => gifReady.then(() => gone || reveal()) })
      .add(visibleParts().map(part => part.leave())));
  }

  function reveal() {
    body.dataset.phase = 'answer';
    hero.set(answer);
    title.set(answer.title);
    current = play(gsap.timeline()
      .add(hero.enter({ rotation: -60, duration: 1, ease: 'elastic.out(1, 0.5)' }))
      .add(title.enter({ y: 30, scale: 0.6, stagger: 0.025, ease: 'back.out(2.5)' }), 0.1)
      .add(reward.enter(), 0.25)
      .add(extras.map(part => part.enter()), 0.6)
      .call(reward.celebrate, [], 1.5));
  }

  function back() {
    if (!answering()) return onExit();
    current.kill();
    current = play(gsap.timeline({ onComplete: restart }).add(visibleParts().map(part => part.leave())));
  }

  function restart() {
    hero.set(question);
    title.set(question.title);
    ask();
  }

  async function chooseIcon() {
    const icon = await pickIcon({ label: 'Ícone do cartão', icons, value: iconId });
    if (!icon || icon.id === iconId) return;
    iconId = icon.id;
    Object.assign(question, { icon: icon.src, emoji: icon.emoji });
    play(hero.swap(question));
    onEdit({ icon: icon.id });
  }

  function chooseGif(gif) {
    onEdit({ gif: gif.id });
    actions.next.disabled = false;
  }

  return {
    enter() {
      resetTheme = applyTheme(theme);
      if (actions) root.dataset.actions = ''; // antes de medir a cena: reserva o espaço dos botões de baixo
      body.append(backdrop.el, toolbar.el, ...(actions ? [actions.el] : []), stage);
      play(gsap.timeline()
        .from(backdrop.el, { autoAlpha: 0, duration: 0.6, ease: 'power1.out' })
        .add(frame.map(part => part.enter()), 0.3));
      ask();
    },
    async leave() {
      gone = true;
      current.kill();
      await play(gsap.timeline()
        .add([...visibleParts(), ...frame].map(part => part.leave()))
        .to(backdrop.el, { autoAlpha: 0, duration: 0.45, ease: 'power1.in' }, 0.1));
      for (const el of [backdrop.el, toolbar.el, actions?.el, stage]) el?.remove();
      delete body.dataset.phase;
      delete root.dataset.actions;
      resetTheme();
    },
  };
}
