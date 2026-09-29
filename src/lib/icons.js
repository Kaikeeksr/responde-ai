import { svg } from './dom.js';

const PATHS = {
  back: 'M14.5 5.5 8 12l6.5 6.5',
  next: 'm9.5 6 6 6-6 6',
  share: 'M12 14.5v-11M8 7.5l4-4 4 4M8.5 10H7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-1.5',
  check: 'm5 12.5 4.5 4.5L19 7.5',
  plus: 'M12 5v14M5 12h14',
  edit: 'M4.5 19.5h3.8L18.9 8.9a2.7 2.7 0 0 0-3.8-3.8L4.5 15.7v3.8ZM13.7 6.5l3.8 3.8',
  none: 'M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17ZM6 6l12 12',
};

export const icon = name => svg('0 0 24 24', `<path d="${PATHS[name]}"/>`);
