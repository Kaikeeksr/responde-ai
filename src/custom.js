import { loadScene } from './content.js';
import { lastEmoji } from './lib/emoji.js';
import { isHex, backgroundTheme, accentTheme } from './lib/color.js';

// o editor (/criar) monta a pergunta em cima da cena assets/convite/ e ela vai inteira no link: /convite?c=…
export const EDITOR = 'criar';
export const BASE = 'convite';
export const MAX_LENGTH = { title: 60, yes: 20, no: 20, reply: 40 };
export const NO_REACTION = '-';

const cut = max => value => value.trim().slice(0, max);
const validId = value => (/^\w{1,40}$/.test(value) ? value : undefined);
// fundo e cor: uma das opções do scene.json ou uma cor livre (#rrggbb)
const validChoice = value => (isHex(value) ? value.toLowerCase() : validId(value));

// a ordem aqui é a ordem dentro do link: campo novo só entra no fim, pra link antigo continuar valendo
const FIELDS = {
  title: cut(MAX_LENGTH.title),
  yes: cut(MAX_LENGTH.yes),
  no: cut(MAX_LENGTH.no),
  emoji: lastEmoji,
  reaction: value => (value === NO_REACTION ? value : lastEmoji(value)),
  gif: validId,
  reply: cut(MAX_LENGTH.reply),
  bg: validChoice,
  color: validChoice,
  icon: validId,
};

export const fieldsOf = ({ question, answer, reaction, backgrounds }) => ({
  title: question.title, yes: question.yes, no: question.no, emoji: answer.emoji,
  reaction, gif: answer.gif, reply: answer.title, bg: backgrounds[0].id,
});

export async function loadOptions() {
  const base = await loadScene(BASE);
  const backgrounds = await Promise.all(base.backgrounds.map(async option => {
    const source = option.scene && await loadScene(option.scene);
    return { ...option, background: source?.background, theme: source?.theme ?? option.theme ?? {} };
  }));
  return { base, backgrounds, colors: base.colors };
}

export const findOption = (options, id) => options.find(option => option.id === id) ?? options[0];

// cor livre vira uma opção montada na hora; o fundo livre não tem imagem e mantém a cor de destaque padrão
export const findBackground = (backgrounds, value) =>
  (isHex(value) ? { id: value, theme: backgroundTheme(value) } : findOption(backgrounds, value));
export const findColor = (colors, value) =>
  (isHex(value) ? { id: value, theme: accentTheme(value) } : findOption(colors, value));

export async function loadCustom(query) {
  const { base, backgrounds, colors } = await loadOptions();
  const values = { ...fieldsOf(base), ...readQuery(query) };
  const backdrop = findBackground(backgrounds, values.bg);
  const color = findColor(colors, values.color ?? backdrop.color);
  const icon = findOption(base.icons, values.icon);
  return {
    background: backdrop.background,
    theme: { ...backdrop.theme, ...color.theme },
    question: { ...base.question, title: values.title, yes: values.yes, no: values.no, icon: icon.src, emoji: icon.emoji },
    answer: { ...base.answer, title: values.reply, emoji: values.emoji, gif: values.gif },
    reaction: values.reaction !== NO_REACTION && values.reaction,
    icons: base.icons,
    icon: icon.id,
  };
}

export const toQuery = values => `?c=${encode(Object.keys(FIELDS).map(key => values[key] ?? '').join('\n'))}`;

export const reviseQuery = (query, changes) => toQuery({ ...readQuery(query), ...changes });

export function readQuery(query) {
  const parts = decode(new URLSearchParams(query).get('c'));
  return Object.fromEntries(Object.entries(FIELDS)
    .map(([key, clean], i) => [key, clean(parts[i] ?? '')])
    .filter(([, value]) => value));
}

// base64url do texto em UTF-8: link curto, sem os %F0%9F… dos emojis e sem entregar a pergunta antes de abrir
function encode(text) {
  const binary = String.fromCharCode(...new TextEncoder().encode(text));
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function decode(code) {
  if (!code) return [];
  try {
    const binary = atob(code.replaceAll('-', '+').replaceAll('_', '/'));
    return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(binary, char => char.charCodeAt(0))).split('\n');
  } catch {
    return [];
  }
}
