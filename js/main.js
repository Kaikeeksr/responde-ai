gsap.registerPlugin(SplitText);

const $ = id => document.getElementById(id);
const noBtn = $('no'), yesBtn = $('yes'), choices = $('choices'), success = $('success');
const title = $('title'), icon = $('heroIconState'), emoji = $('heroEmojiState');
const reactions = success.querySelector('.reactions');
const { random } = gsap.utils;
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
// no PC o Não só foge do mouse; no celular, depois da primeira fuga, continua pulando sozinho
const mouse = matchMedia('(hover: hover) and (pointer: fine)').matches;

const HEART = 'M12 20s-7.2-4.4-9.6-8.9C0.6 7.6 2.3 4.4 5.6 3.9c2-0.3 3.8 0.7 6.4 3.2 2.6-2.5 4.4-3.5 6.4-3.2 3.3 0.5 5 3.7 3.2 7.2C19.2 15.6 12 20 12 20Z';
const heartShape = confetti.shapeFromPath({ path: HEART, matrix: [0.8, 0, 0, 0.8, -9.6, -9.6] });

const eyes = [...document.querySelectorAll('.eye')].map(eye => ({
  eye,
  x: gsap.quickTo(eye.firstElementChild, 'x', { duration: 0.3, ease: 'power3' }),
  y: gsap.quickTo(eye.firstElementChild, 'y', { duration: 0.3, ease: 'power3' }),
}));
let split = SplitText.create(title, { type: 'words,chars' });
let intro, dodgeTimer, done = false, hearts = 0;

gsap.set('.stage', { opacity: 1 });
updateEyes();
if (!calm) {
  intro = gsap.timeline({ defaults: { duration: 0.6, ease: 'back.out(1.8)' }, onComplete: updateEyes })
    .from(icon, { scale: 0, rotation: -30, duration: 1.1, ease: 'elastic.out(1, 0.6)' })
    .from(split.chars, { y: 28, opacity: 0, rotation: 'random(-20, 20)', stagger: 0.035 }, '-=0.8')
    .from(yesBtn, { y: 24, opacity: 0, clearProps: 'transform,opacity' }, '-=0.3')
    .from(noBtn, { y: 24, opacity: 0 }, '<0.15');
}

function center(el){
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

function moveNoButton(cursor){
  if (done) return;
  const area = choices.getBoundingClientRect(), yes = yesBtn.getBoundingClientRect();
  const w = noBtn.offsetWidth, h = noBtn.offsetHeight;
  const spot = () => [random(0, area.width - w), random(0, area.height - h)];
  const hitsYes = ([l, t]) =>
    area.left + l + w + 14 >= yes.left && area.left + l - 14 <= yes.right &&
    area.top + t + h + 14 >= yes.top && area.top + t - 14 <= yes.bottom;

  let pos;
  if (cursor) {
    // o primeiro lugar fora do alcance do mouse ou, se não tiver, o mais longe
    let best = -1;
    for (let i = 0; i < 40 && best < 170; i++) {
      const p = spot(), d = Math.hypot(area.left + p[0] + w / 2 - cursor.x, area.top + p[1] + h / 2 - cursor.y);
      if (!hitsYes(p) && d > best) [best, pos] = [d, p];
    }
  } else {
    let tries = 0;
    do pos = spot(); while (hitsYes(pos) && ++tries < 30);
  }

  const [left, top] = pos;
  gsap.to(noBtn, {
    left: left / area.width * 100 + '%', top, x: 0, xPercent: 0, rotation: calm ? 0 : 'random(-12, 12)',
    duration: calm ? 0 : 0.35, ease: 'expo.out', overwrite: 'auto', onUpdate: updateEyes,
  });
  if (!calm) gsap.fromTo(noBtn, { scaleX: 1.2, scaleY: 0.8 }, { scaleX: 1, scaleY: 1, duration: 0.6, ease: 'elastic.out(1, 0.3)', overwrite: 'auto' });
  if (!mouse) dodgeTimer ??= setInterval(moveNoButton, 220);
}

// as pupilas do Sim seguem o Não
function updateEyes(){
  const no = center(noBtn);
  for (const { eye, x, y } of eyes) {
    const e = center(eye), angle = Math.atan2(no.y - e.y, no.x - e.x);
    x(Math.cos(angle) * 3.2);
    y(Math.sin(angle) * 3.2);
  }
}

const cursorOf = e => mouse ? { x: e.clientX, y: e.clientY } : undefined;
const dodge = e => { e.preventDefault(); moveNoButton(cursorOf(e)); };

['mousemove', 'touchmove', 'touchstart'].forEach(type => document.addEventListener(type, e => {
  const p = e.touches ? e.touches[0] : e;
  const no = center(noBtn);
  if (p && Math.hypot(p.clientX - no.x, p.clientY - no.y) < 140) moveNoButton(cursorOf(p));
}, { passive: true }));
noBtn.addEventListener('pointerenter', e => moveNoButton(cursorOf(e)));
noBtn.addEventListener('pointerdown', dodge);
noBtn.addEventListener('click', dodge);
addEventListener('resize', () => {
  if (noBtn.style.top) moveNoButton();
  updateEyes();
});

yesBtn.addEventListener('click', () => {
  if (done) return;
  done = true;
  clearInterval(dodgeTimer);
  intro?.progress(1);
  vibrate([25, 40, 25, 40, 60]);
  burst();

  const exit = gsap.timeline({ defaults: { duration: 0.4, ease: 'power2.in' }, onComplete: reveal })
    .to(noBtn, { y: '+=260', rotation: 'random(-90, 90)', opacity: 0, duration: 0.5, ease: 'back.in(2)', overwrite: true })
    .to(icon, { scale: 0, rotation: 45, ease: 'back.in(2)' }, 0)
    .to(split.chars, { y: -20, opacity: 0, stagger: 0.015, duration: 0.25 }, 0)
    .to(yesBtn, { scale: 1.1, opacity: 0 }, 0.1);
  if (calm) return exit.progress(1);
  ripple(yesBtn, 360);
  ripple(yesBtn, 360, 0.18);
});

function reveal(){
  icon.hidden = choices.hidden = true;
  emoji.hidden = success.hidden = false;
  split.revert();
  title.textContent = 'sabia que vc não ia recusar';
  split = SplitText.create(title, { type: 'words,chars' });
  // perspectiva fora do .from(): dentro dele ela seria animada até 0 e a foto daria um tranco
  gsap.set(success, { transformPerspective: 900, transformOrigin: '50% 100%' });

  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } })
    .from(emoji, { scale: 0, rotation: -60, duration: 1, ease: 'elastic.out(1, 0.5)' })
    .from(split.chars, { y: 30, opacity: 0, scale: 0.6, stagger: 0.025, duration: 0.6, ease: 'back.out(2.5)' }, 0.1)
    .from(success, { opacity: 0, y: 60, scale: 0.85, rotationX: -35, duration: 1.2 }, 0.25)
    .from('.success img', { scale: 1.3, duration: 1.8 }, '<')
    .call(() => { heartWave(12); ambientHearts(); }, [], 1.5);
  if (calm) tl.progress(1, true);
}

success.addEventListener('click', e => {
  if (calm) return;
  vibrate([15]);
  const r = success.getBoundingClientRect();
  for (let i = 0; i < 5; i++)
    gsap.delayedCall(i * 0.08, floatHeart, [e.clientX - r.left + random(-16, 16), e.clientY - r.top]);
});

// o iPhone não tem navigator.vibrate; no iOS 18+ clicar num <input switch> faz o Taptic Engine vibrar
function vibrate(pattern){
  if (navigator.vibrate) return navigator.vibrate(pattern);
  const tick = () => {
    const label = document.createElement('label');
    label.style.display = 'none';
    label.innerHTML = '<input type="checkbox" switch>';
    document.head.append(label);
    label.click();
    label.remove();
  };
  tick();
  for (let i = 1; i < Math.ceil(pattern.length / 2); i++) setTimeout(tick, i * 110);
}

function burst(){
  const { x, y } = center(yesBtn);
  confetti({
    particleCount: 40, spread: 80, startVelocity: 28, gravity: 0.9, ticks: 170, scalar: 1.2,
    colors: ['#f4a6b7', '#e7b7bd', '#c8b8dd', '#b9a3e3', '#ffd1dc'],
    shapes: [heartShape, heartShape, 'circle'], disableForReducedMotion: true,
    origin: { x: x / innerWidth, y: y / innerHeight },
  });
}

function ripple(el, size, delay = 0){
  const { x, y } = center(el);
  const ring = document.createElement('div');
  ring.className = 'ripple';
  Object.assign(ring.style, { width: size + 'px', height: size + 'px', left: x + 'px', top: y + 'px' });
  document.body.append(ring);
  gsap.fromTo(ring, { xPercent: -50, yPercent: -50, scale: 0.25, opacity: 0.8 },
    { scale: 1, opacity: 0, duration: 1.3, delay, ease: 'expo.out', onComplete: () => ring.remove() });
}

// um coração subindo pela chamada, como as reações do FaceTime; o balanço alterna de lado
function floatHeart(x, y){
  const i = hearts++, side = i % 2 ? 1 : -1, size = random(22, 42, 1), rise = random(2.4, 3.4);
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  el.setAttribute('viewBox', '0 0 24 24');
  el.setAttribute('class', 'heart');
  el.style.width = el.style.height = size + 'px';
  el.innerHTML = `<path d="${HEART}" fill="url(#heart${i % 3})"/>` +
    '<ellipse cx="7.6" cy="7.4" rx="2.3" ry="1.4" transform="rotate(-35 7.6 7.4)" fill="#fff" opacity=".6"/>';
  reactions.append(el);

  gsap.set(el, { x: x - size / 2, y: y - size / 2, rotation: -side * 12, scale: 0.3, opacity: 0 });
  gsap.timeline({ onComplete: () => el.remove() })
    .to(el, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(2.5)' })
    .to(el, { y: `-=${success.offsetHeight * random(0.55, 0.85)}`, duration: rise, ease: 'sine.out' }, 0)
    .to(el, { x: `+=${side * random(14, 28)}`, rotation: side * 12, duration: rise / 3, ease: 'sine.inOut', yoyo: true, repeat: 2 }, 0)
    .to(el, { opacity: 0, scale: 0.8, duration: 0.7, ease: 'power1.in' }, rise - 0.7);
}

function heartWave(count){
  const w = success.offsetWidth, h = success.offsetHeight;
  for (let i = 0; i < count; i++)
    gsap.delayedCall(i * 0.16 + random(0, 0.08), floatHeart, [w * random(0.14, 0.86), h * random(0.82, 1)]);
}

// depois da primeira leva, de vez em quando sobe mais um ou dois
function ambientHearts(){
  gsap.delayedCall(random(2.8, 4.8), () => { heartWave(random(1, 2, 1)); ambientHearts(); });
}
