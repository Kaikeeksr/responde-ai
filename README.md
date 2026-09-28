# responde-ai
uma bobeirinha

## Como funciona

A raiz é a home, com a lista de convites. Cada convite abre em `/<cena>` (ex.: `/facetime`, `/cinema`):
pergunta → "Sim" → resposta com a foto. O botão de voltar leva da resposta pra pergunta e da pergunta pra home;
o de compartilhar aparece na resposta. A troca de tela acontece sem recarregar a página.

- `assets/home.json`: texto da home e quais cenas aparecem, em ordem
- `assets/<cena>/`: tudo de uma cena, o `scene.json` e as imagens dela

## Criando uma cena

Copie uma pasta de `assets/`, troque as imagens, edite o `scene.json` e coloque o nome da pasta em `home.json`:

```json
{
  "description": "filme, pipoca e você",
  "background": { "portrait": "./background-portrait.svg", "landscape": "./background-landscape.svg" },
  "question": { "title": "Cineminha hoje?", "icon": "./icon.svg", "yes": "Sim", "no": "Não" },
  "answer": { "title": "sabia que você não ia recusar", "emoji": "😁", "photo": "./photo.jpeg", "alt": "…" },
  "reaction": "🍿",
  "theme": { "bg": "#19224b", "ink": "#f6efe2", "accent": "#ef9f5f" }
}
```

- caminhos com `./` são relativos à pasta da cena
- `description` aparece embaixo do título na home
- `landscape` é opcional (entra em telas mais largas que altas)
- o círculo do topo aceita `icon` (imagem quadrada que preenche o círculo) ou `emoji`, nas duas fases
- `reaction` (opcional) troca os corações da foto e do confete por esse emoji
- `theme` (opcional) troca qualquer variável de cor do topo de `src/base.css` (sem os `--`)

## Rodando

Qualquer servidor estático na raiz serve os fontes direto; comece pela home e navegue pelos convites:

```bash
python -m http.server
```

Pra ver o site como vai pro ar (JS/CSS juntos e uma página por cena em `_site/`):

```bash
node scripts/build.mjs && npx serve _site
```

O deploy (GitHub Pages) roda o mesmo build a cada push na `main`.
