gsap.registerPlugin(SplitText);

const $ = id => document.getElementById(id);
const noBtn = $('no'), yesBtn = $('yes'), choices = $('choices'), success = $('success');
const title = $('title'), icon = $('heroIconState'), emoji = $('heroEmojiState');
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
const eyes = [...document.querySelectorAll('.eye')].map(eye => ({
  eye,
  x: gsap.quickTo(eye.firstElementChild, 'x', { duration: 0.3, ease: 'power3' }),
  y: gsap.quickTo(eye.firstElementChild, 'y', { duration: 0.3, ease: 'power3' }),
}));
let split = SplitText.create(title, { type: 'words,chars' });
let dodgeTimer, done = false;

gsap.set('.stage', { opacity: 1 });
updateEyes();
if (!calm) {
  gsap.timeline({ defaults: { duration: 0.6, ease: 'back.out(1.8)' }, onComplete: updateEyes })
    .from(icon, { scale: 0, rotation: -30, duration: 1.1, ease: 'elastic.out(1, 0.6)' })
    .from(split.chars, { y: 28, opacity: 0, rotation: 'random(-20, 20)', stagger: 0.035 }, '-=0.8')
    .from(yesBtn, { y: 24, opacity: 0, clearProps: 'transform,opacity' }, '-=0.3')
    .from(noBtn, { y: 24, opacity: 0 }, '<0.1');
}

function moveNoButton(){
  if (done) return;
  const area = choices.getBoundingClientRect();
  const yes = yesBtn.getBoundingClientRect();
  const w = noBtn.offsetWidth, h = noBtn.offsetHeight;
  const hitsYes = (x, y) =>
    x + w + 14 >= yes.left && x - 14 <= yes.right &&
    y + h + 14 >= yes.top && y - 14 <= yes.bottom;

  let left, top, tries = 0;
  do {
    left = Math.random() * (area.width - w);
    top = Math.random() * (area.height - h);
  } while (hitsYes(area.left + left, area.top + top) && ++tries < 30);

  gsap.to(noBtn, {
    left: left / area.width * 100 + '%', top, x: 0, xPercent: 0, rotation: calm ? 0 : 'random(-12, 12)',
    duration: calm ? 0 : 0.35, ease: 'expo.out', overwrite: 'auto', onUpdate: updateEyes,
  });
  // estica e volta, como se tivesse pulado
  if (!calm) gsap.fromTo(noBtn, { scaleX: 1.2, scaleY: 0.8 }, { scaleX: 1, scaleY: 1, duration: 0.6, ease: 'elastic.out(1, 0.3)', overwrite: 'auto' });

  // depois da primeira fuga, continua fugindo sozinho
  dodgeTimer ??= setInterval(moveNoButton, 220);
}

// pupilas do Sim seguem o Não
function updateEyes(){
  const no = noBtn.getBoundingClientRect();
  for (const { eye, x, y } of eyes) {
    const r = eye.getBoundingClientRect();
    const angle = Math.atan2(no.top + no.height / 2 - (r.top + r.height / 2), no.left + no.width / 2 - (r.left + r.width / 2));
    x(Math.cos(angle) * 3.2);
    y(Math.sin(angle) * 3.2);
  }
}

function proximityCheck(e){
  const p = e.touches ? e.touches[0] : e;
  if (!p) return;
  const btn = noBtn.getBoundingClientRect();
  if (Math.hypot(p.clientX - btn.left - btn.width / 2, p.clientY - btn.top - btn.height / 2) < 140) moveNoButton();
}

['mousemove', 'touchmove', 'touchstart'].forEach(type =>
  document.addEventListener(type, proximityCheck, { passive: true }));

const dodge = e => { e.preventDefault(); moveNoButton(); };
noBtn.addEventListener('pointerenter', moveNoButton);
noBtn.addEventListener('pointerdown', dodge);
noBtn.addEventListener('click', dodge);

window.addEventListener('resize', () => {
  if (noBtn.style.top) moveNoButton();
  updateEyes();
});

yesBtn.addEventListener('click', () => {
  if (done) return;
  done = true;
  clearInterval(dodgeTimer);
  navigator.vibrate?.([25, 40, 25, 40, 60]);
  burst();

  // tudo sai de cena: o Não cai, o ícone encolhe, as letras sobem
  gsap.timeline({ defaults: { duration: 0.4, ease: 'power2.in' }, onComplete: reveal })
    .to(noBtn, { y: '+=260', rotation: 'random(-90, 90)', opacity: 0, duration: 0.5, ease: 'back.in(2)', overwrite: true })
    .to(icon, { scale: 0, rotation: 45, ease: 'back.in(2)' }, 0)
    .to(split.chars, { y: -20, opacity: 0, stagger: 0.015, duration: 0.25 }, 0)
    .to(yesBtn, { scale: 1.1, opacity: 0 }, 0.1);
});

function reveal(){
  icon.hidden = choices.hidden = true;
  emoji.hidden = success.hidden = false;
  split.revert();
  title.textContent = 'sabia que vc não ia recusar';
  split = SplitText.create(title, { type: 'words,chars' });

  gsap.timeline({ defaults: { ease: 'expo.out' } })
    .from(emoji, { scale: 0, rotation: -60, duration: 1, ease: 'elastic.out(1, 0.5)' })
    .from(split.chars, { y: 30, opacity: 0, scale: 0.6, stagger: 0.025, duration: 0.6, ease: 'back.out(2.5)' }, 0.1)
    .from(success, { opacity: 0, y: 60, scale: 0.85, rotationX: -35, transformPerspective: 900, transformOrigin: '50% 100%', duration: 1.2 }, 0.25)
    .from('.success img', { scale: 1.3, duration: 1.8 }, '<')
    .call(cannons, [], 0.6);
}

const heart = confetti.shapeFromPath({
  path: 'M12 20s-7.2-4.4-9.6-8.9C0.6 7.6 2.3 4.4 5.6 3.9c2-0.3 3.8 0.7 6.4 3.2 2.6-2.5 4.4-3.5 6.4-3.2 3.3 0.5 5 3.7 3.2 7.2C19.2 15.6 12 20 12 20Z',
  matrix: [0.8, 0, 0, 0.8, -9.6, -9.6], // centraliza e define o tamanho do coração
});
const party = opts => confetti({
  colors: ['#f4a6b7', '#e7b7bd', '#c8b8dd', '#b9a3e3', '#f6d9c4', '#ffd1dc'],
  shapes: [heart, heart, 'star', 'circle'], scalar: 1.3, disableForReducedMotion: true, ...opts,
});

// explosão saindo do botão Sim
function burst(){
  const r = yesBtn.getBoundingClientRect();
  party({
    particleCount: 80, spread: 90, startVelocity: 35,
    origin: { x: (r.left + r.width / 2) / window.innerWidth, y: (r.top + r.height / 2) / window.innerHeight },
  });
}

// canhões dos dois lados da tela por 1,5s
function cannons(){
  const end = Date.now() + 1500;
  (function frame(){
    party({ particleCount: 2, angle: 60, spread: 55, origin: { x: 0, y: 0.75 } });
    party({ particleCount: 2, angle: 120, spread: 55, origin: { x: 1, y: 0.75 } });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}
