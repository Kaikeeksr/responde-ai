// com o teclado aberto, o iPhone não encolhe a página: ele rola a janela e dá pra arrastar até um vão vazio embaixo.
// aqui o body passa a ter a altura do que sobra acima do teclado e a janela fica sempre no topo; quem rola é a .page
const viewport = window.visualViewport;
const root = document.documentElement;

if (viewport) {
  let keyboard = false;

  const sync = () => {
    // zoom de pinça também encolhe o visualViewport; só conta como teclado sem zoom
    const open = viewport.scale < 1.01 && innerHeight - viewport.height > 120;
    root.style.setProperty('--keyboard-height', `${viewport.height}px`);
    root.toggleAttribute('data-keyboard', open);
    if (open && !keyboard) reveal();
    keyboard = open;
    pin();
  };

  const pin = () => {
    if (scrollY || scrollX) scrollTo(0, 0);
  };

  // com o body já do tamanho novo, traz o campo em foco pra parte visível da .page
  const reveal = () => requestAnimationFrame(() => {
    const field = document.activeElement;
    if (field?.matches('input, textarea')) field.scrollIntoView({ block: 'center' });
  });

  viewport.addEventListener('resize', sync);
  viewport.addEventListener('scroll', pin);
  addEventListener('scroll', pin, { passive: true });
}
