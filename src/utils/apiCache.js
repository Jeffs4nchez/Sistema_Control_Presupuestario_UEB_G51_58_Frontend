import axios from 'axios';

const TTL   = 60_000; // 60 segundos
const store = new Map(); // cacheKey → { data, at }

/**
 * Reemplaza fetch() para GETs — devuelve caché si está fresco.
 * Para métodos distintos de GET delega directo a fetch().
 */
export async function cachedFetch(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  if (method !== 'GET') return fetch(url, options);

  const entry = store.get(url);
  if (entry && Date.now() - entry.at < TTL) {
    return { ok: true, status: 200, json: async () => entry.data };
  }

  const res = await fetch(url, options);
  if (res.ok) {
    const data = await res.json();
    store.set(url, { data, at: Date.now() });
    return { ok: true, status: res.status, json: async () => data };
  }
  return res;
}

/**
 * Reemplaza axios.get() — la clave de caché incluye query params.
 */
export async function cachedAxiosGet(url, config = {}) {
  const qs       = config.params ? '?' + new URLSearchParams(config.params).toString() : '';
  const cacheKey = url + qs;

  const entry = store.get(cacheKey);
  if (entry && Date.now() - entry.at < TTL) {
    return { data: entry.data };
  }

  const res = await axios.get(url, config);
  store.set(cacheKey, { data: res.data, at: Date.now() });
  return res;
}

/**
 * Elimina entradas del caché cuya clave contiene alguno de los patrones.
 * Llamar después de cualquier POST / PUT / PATCH / DELETE.
 */
export function invalidateCache(...patterns) {
  for (const pattern of patterns) {
    for (const key of store.keys()) {
      if (key.includes(pattern)) store.delete(key);
    }
  }
}

export function clearCache() {
  store.clear();
}
