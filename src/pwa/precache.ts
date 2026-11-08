export interface BuildAsset { path: string; digest: string }

/** Dosya sırası değişse de aynı içerik aynı önbellek sürümünü üretir. */
export function precacheManifest(assets: readonly BuildAsset[]) {
  const sorted = assets.filter(asset => asset.path !== 'sw.js').slice()
    .sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
  let hash = 2166136261;
  for (const char of JSON.stringify(sorted)) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
  return { version: hash.toString(16).padStart(8, '0'), urls: sorted.map(asset => `./${asset.path}`) };
}

export function serviceWorkerSource(manifest: ReturnType<typeof precacheManifest>): string {
  return `const PREFIX = 'graphcalc-' + self.registration.scope + '-';
const CACHE = PREFIX + ${JSON.stringify(manifest.version)};
const URLS = ${JSON.stringify(manifest.urls)};
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(URLS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || !request.url.startsWith(self.registration.scope)) return;
  event.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(request, { ignoreSearch: request.mode === 'navigate' });
    if (cached) return cached;
    if (request.mode === 'navigate') {
      const index = await cache.match(new URL('./index.html', self.registration.scope));
      if (index) return index;
    }
    return fetch(request);
  }));
});
`;
}
