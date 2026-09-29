// cor livre (#rrggbb) vira o mesmo tipo de tema que as opções prontas do scene.json
export const isHex = value => /^#[0-9a-f]{6}$/i.test(value ?? '');

export function parseHex(text) {
  let hex = text.trim().replace(/^#/, '').toLowerCase();
  if (/^[0-9a-f]{3}$/.test(hex)) hex = [...hex].map(c => c + c).join('');
  return /^[0-9a-f]{6}$/.test(hex) ? `#${hex}` : undefined;
}

export const hexToRgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
export const rgbToHex = rgb => `#${rgb.map(v => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('')}`;

export function rgbToHsv([r, g, b]) {
  [r, g, b] = [r / 255, g / 255, b / 255];
  const max = Math.max(r, g, b), d = max - Math.min(r, g, b);
  const h = !d ? 0 : max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [(h * 60 + 360) % 360, max ? d / max : 0, max];
}

export function hsvToRgb([h, s, v]) {
  const f = n => {
    const k = (n + h / 60) % 6;
    return (v - v * s * Math.max(0, Math.min(k, 4 - k, 1))) * 255;
  };
  return [f(5), f(3), f(1)];
}

function rgbToHsl(rgb) {
  const [h, s, v] = rgbToHsv(rgb);
  const l = v * (1 - s / 2);
  return [h, l && l < 1 ? (v - l) / Math.min(l, 1 - l) : 0, l];
}

function hsl(h, s, l) {
  s = clamp(s, 0, 1);
  l = clamp(l, 0, 1);
  const v = l + s * Math.min(l, 1 - l);
  return rgbToHex(hsvToRgb([h, v ? 2 * (1 - l / v) : 0, v]));
}

// luminância relativa (WCAG), pra saber se o texto vai claro ou escuro
export function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export const isDark = hex => luminance(hex) < 0.22;

export function backgroundTheme(bg) {
  const [h, s, l] = rgbToHsl(hexToRgb(bg));
  if (isDark(bg)) {
    const raised = hsl(h, s * 0.9, l + 0.07), border = hsl(h, s * 0.8, l + 0.14);
    return {
      bg, ink: hsl(h, 0.35, 0.95), muted: hsl(h, 0.2, 0.8),
      'hero-bg': raised, 'hero-border': border, 'muted-bg': raised, 'muted-border': border, shadow: '#000000',
    };
  }
  return {
    bg, ink: hsl(h, Math.min(s, 0.25), 0.26),
    'hero-bg': hsl(h, s, l - 0.05), 'hero-border': hsl(h, s * 0.85, l - 0.12),
    'muted-bg': hsl(h, s, Math.min(0.97, l + 0.08)), 'muted-border': hsl(h, s * 0.85, l - 0.08),
    muted: hsl(h, Math.min(s, 0.12), 0.5), shadow: hsl(h, Math.min(s, 0.45), 0.32),
  };
}

export function accentTheme(accent) {
  const [h, s, l] = rgbToHsl(hexToRgb(accent));
  const dark = isDark(accent);
  return {
    accent,
    'accent-soft': hsl(h, s, dark ? l + 0.12 : l + (1 - l) * 0.4),
    'accent-ink': dark ? '#ffffff' : hsl(h, Math.min(s, 0.55), 0.18),
    confetti: [hsl(h, s, l + (1 - l) * 0.4), accent, hsl(h, s, 0.93), hsl(h, s, l * 0.82), hsl(h + 25, s, l)].join(', '),
  };
}

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
