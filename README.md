# responde-ai

uma bobeirinha: você faz uma pergunta fofa, manda o link e o botão "Não" foge de quem tenta clicar.

## Como funciona

- Escolha um convite pronto (FaceTime, Cinema, Bitoquinha) ou crie o seu em `/criar`.
- A pergunta personalizada vai inteira no link (`/convite?c=…`), codificada em base64url. Sem servidor e sem banco de dados.
- Quando dizem sim, aparece a resposta com um GIF do GIPHY e confete.

## Tecnologias

- HTML, CSS e JavaScript puros (ES modules), sem framework.
- [GSAP](https://gsap.com) para as animações e [canvas-confetti](https://github.com/catdad/canvas-confetti) para o confete, vindos do CDN.
- API do [GIPHY](https://developers.giphy.com) para buscar os GIFs.
- [esbuild](https://esbuild.github.io) para empacotar, e deploy no GitHub Pages via GitHub Actions.

## Estrutura

```
assets/          cenas: cada pasta tem um scene.json (textos, tema, ícone) e as imagens
  convite/       base da pergunta personalizada: fundos, cores e ícones disponíveis
src/
  main.js        rotas (home, criar, convite, cenas) e troca de telas
  custom.js      monta e lê o link da pergunta personalizada
  screens/       telas: home, editor, cena, compartilhar
  components/    peças da interface: botões, seletores de emoji, GIF, cor e ícone
  lib/           utilitários (DOM, cores, GIPHY, compartilhamento)
scripts/build.mjs  gera o site em _site/
```

## Rodando local

Qualquer servidor estático na raiz serve (abra pela home: rotas como `/criar` só existem como arquivo depois do build):

```bash
npx serve .
```

Para gerar a versão de produção:

```bash
node scripts/build.mjs
```
