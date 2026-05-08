// Cache estático do PWA. A versão deve mudar quando os arquivos principais mudarem.
const CACHE_NAME = "carteirinha-fesn-v2";

const ARQUIVOS_OFFLINE = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./assets/app-icon.svg",
  "./assets/logo-fesn-short.svg",
  "./assets/logo-dne-color.png",
  "./assets/student-photo.jpg",
  "./assets/qr-code.png",
  "./CIE.html",
  "./CIE_files/fesn.png",
  "./CIE_files/logo.png",
  "./CIE_files/B592LCA2_app",
  "./CIE_files/styles.e2bebc4ec5781c7c.css",
  "./CIE_files/runtime.ca8a5d10f76eba30.js.download",
  "./CIE_files/polyfills.04c14a45e9785ace.js.download",
  "./CIE_files/main.7fd638b3f5f5f9cf.js.download",
  "./CIE_files/v8c78df7c7c0f484497ecbca7046644da1771523124516"
];

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(ARQUIVOS_OFFLINE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((nomes) => Promise.all(
        nomes
          .filter((nome) => nome !== CACHE_NAME)
          .map((nome) => caches.delete(nome))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (evento) => {
  if (evento.request.method !== "GET") {
    return;
  }

  const url = new URL(evento.request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  evento.respondWith(
    caches.match(evento.request).then((respostaEmCache) => {
      if (respostaEmCache) {
        return respostaEmCache;
      }

      return fetch(evento.request)
        .then((respostaDaRede) => {
          if (respostaDaRede && respostaDaRede.status === 200 && respostaDaRede.type === "basic") {
            const copia = respostaDaRede.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(evento.request, copia));
          }

          return respostaDaRede;
        })
        .catch(() => {
          if (evento.request.mode === "navigate") {
            return caches.match("./index.html");
          }

          return caches.match(evento.request);
        });
    })
  );
});
