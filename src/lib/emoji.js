const graphemes = new Intl.Segmenter();
const EMOJI = /\p{Extended_Pictographic}|\p{Regional_Indicator}|⃣/u; // ⃣: teclas tipo 1️⃣

export const lastEmoji = text =>
  [...graphemes.segment(text)].map(({ segment }) => segment).findLast(segment => EMOJI.test(segment));
