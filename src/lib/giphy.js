// O GIPHY não deixa guardar nem montar URL de mídia: o link do convite leva só o id,
// o GIF é buscado de novo quando alguém abre e as URLs são usadas como vieram.
const API = 'https://api.giphy.com/v1/gifs';
const known = new Map();

export async function searchGifs(term, { offset = 0, limit = 24, signal } = {}) {
  const params = term ? { q: term, lang: 'pt', offset, limit } : { offset, limit };
  const { data, pagination } = await call(term ? '/search' : '/trending', params, signal);
  return { gifs: data.map(toGif), total: pagination.total_count };
}

export function findGif(id) {
  if (!known.has(id)) {
    known.set(id, call(`/${id}`).then(({ data }) => toGif(data)).catch(error => {
      known.delete(id);
      throw error;
    }));
  }
  return Promise.resolve(known.get(id));
}

async function call(path, params, signal) {
  const key = document.querySelector('meta[name="giphy-key"]')?.content;
  if (!key) throw Object.assign(new Error('falta a chave do GIPHY'), { status: 401 });
  const url = new URL(API + path);
  url.search = new URLSearchParams({ api_key: key, rating: 'pg-13', bundle: 'messaging_non_clips', ...params });
  const res = await fetch(url, { signal });
  if (!res.ok) throw Object.assign(new Error(`GIPHY respondeu ${res.status}`), { status: res.status });
  return res.json();
}

function toGif({ id, title, images: { original, fixed_width: thumb = original } }) {
  const gif = {
    id,
    title,
    url: original.webp || original.url,
    thumb: { url: thumb.webp || thumb.url, width: +thumb.width || 1, height: +thumb.height || 1 },
  };
  known.set(id, gif);
  return gif;
}
