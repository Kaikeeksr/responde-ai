import { gsap } from '../lib/vendor.js';
import { h, applyTheme, decoded, play } from '../lib/dom.js';
import { loadScene } from '../content.js';
import { createBackdrop } from '../components/backdrop.js';
import { createToolbar } from '../components/toolbar.js';
import { createHero } from '../components/hero.js';
import { createTitle } from '../components/title.js';
import { createChoices } from '../components/choices.js';
import { createReward } from '../components/reward.js';

const { body } = document;

export async function createScene(name, { onExit }) {
  const { background, question, answer, reaction, theme } = await loadScene(name);
  const stage = h('main', { className: 'stage' });
  const backdrop = createBackdrop(background);
  const toolbar = createToolbar({ onBack: back });
  const hero = createHero(question);
  const title = createTitle(question.title);
  const choices = createChoices({ yes: question.yes, no: question.no, reaction, onAccept: accept });
  const reward = createReward({ ...answer, reaction });
  let current, resetTheme;

  stage.append(hero.el, title.el, choices.el, reward.el);
  await decoded(backdrop.el, hero.el);

  const answering = () => body.dataset.phase === 'answer';
  const visibleParts = () => (answering() ? [toolbar.share, reward, hero, title] : [choices, hero, title]);

  function ask() {
    body.dataset.phase = 'question';
    current = play(gsap.timeline()
      .add(hero.enter())
      .add(title.enter({ rotation: 'random(-20, 20)' }), '-=0.8')
      .add(choices.enter(), '-=0.3'));
  }

  function accept() {
    current.progress(1);
    current = play(gsap.timeline({ onComplete: reveal }).add(visibleParts().map(part => part.leave())));
  }

  function reveal() {
    body.dataset.phase = 'answer';
    hero.set(answer);
    title.set(answer.title);
    current = play(gsap.timeline()
      .add(hero.enter({ rotation: -60, duration: 1, ease: 'elastic.out(1, 0.5)' }))
      .add(title.enter({ y: 30, scale: 0.6, stagger: 0.025, ease: 'back.out(2.5)' }), 0.1)
      .add(reward.enter(), 0.25)
      .add(toolbar.share.enter(), 0.6)
      .call(reward.celebrate, [], 1.5));
  }

  // da resposta volta pra pergunta; da pergunta sai da cena
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

  return {
    enter() {
      resetTheme = applyTheme(theme);
      body.append(backdrop.el, toolbar.el, stage);
      play(gsap.timeline()
        .from(backdrop.el, { autoAlpha: 0, duration: 0.6, ease: 'power1.out' })
        .add(toolbar.back.enter(), 0.3));
      ask();
    },
    async leave() {
      current.kill();
      await play(gsap.timeline()
        .add([...visibleParts(), toolbar.back].map(part => part.leave()))
        .to(backdrop.el, { autoAlpha: 0, duration: 0.45, ease: 'power1.in' }, 0.1));
      for (const el of [backdrop.el, toolbar.el, stage]) el.remove();
      delete body.dataset.phase;
      resetTheme();
    },
  };
}
