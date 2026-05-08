// Cache estático do PWA. A versão deve mudar quando os arquivos principais mudarem.
const CACHE_NAME = "carteirinha-fesn-v6";

const ARQUIVOS_OFFLINE = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./assets/play_store_512.png",
  "./assets/logo-fesn-short.svg",
  "./assets/logo-dne-color.png",
  "./assets/student-photo.jpg",
  "./assets/qr-code.png",
  "./telas/tela1.jpeg",
  "./telas/tela2.jpeg",
  "./telas/tela3.jpeg",
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

  if (evento.request.mode === "navigate") {
    evento.respondWith(responderNavegacao(evento.request));
    return;
  }

  evento.respondWith(responderArquivo(evento.request));
});

function responderNavegacao(request) {
  return fetch(request)
    .then((respostaDaRede) => {
      if (respostaDaRede && respostaDaRede.ok) {
        return respostaDaRede;
      }

      return paginaOffline(request);
    })
    .catch(() => paginaOffline(request));
}

function responderArquivo(request) {
  return caches.match(request).then((respostaEmCache) => {
    if (respostaEmCache) {
      return respostaEmCache;
    }

    return fetch(request).then((respostaDaRede) => {
      if (respostaDaRede && respostaDaRede.status === 200 && respostaDaRede.type === "basic") {
        const copia = respostaDaRede.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copia));
      }

      return respostaDaRede;
    });
  });
}

function paginaOffline(request) {
  const url = new URL(request.url);
  const caminho = url.pathname.toLowerCase();

  if (caminho.endsWith("/cie") || caminho.endsWith("/cie.html")) {
    return caches.match("./CIE.html");
  }

  return caches.match("./index.html").then((resposta) => resposta || caches.match("./"));
}
