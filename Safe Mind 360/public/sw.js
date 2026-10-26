/* SafeMind 360 — service worker (RNF04 / RNF06)
   Permite instalar o sistema como aplicativo no Android, iOS e computador.
   Estratégia "rede primeiro": sempre busca a versão mais nova e usa a cópia
   guardada só quando não há conexão. Dados (Firebase) nunca são guardados aqui. */
var VERSAO = "safemind-v2.0.0";
var ARQUIVOS = [
  "./", "index.html", "aluno.html", "professor.html", "admin.html", "estilo.css", "manifest.webmanifest",
  "js/config.js", "js/dados.js", "js/motor-ia.js", "js/negocio.js", "js/dados-demo.js",
  "js/ui-comum.js", "js/ui-login.js", "js/ui-aluno.js", "js/ui-professor.js", "js/ui-coordenacao.js",
  "icones/icone.svg", "icones/icone-192.png", "icones/icone-512.png", "icones/apple-touch-icon.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(VERSAO).then(function (c) { return c.addAll(ARQUIVOS); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (chaves) {
    return Promise.all(chaves.filter(function (k) { return k !== VERSAO; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return; /* Firebase, fontes etc. seguem direto pela rede */
  e.respondWith(
    fetch(req).then(function (resp) {
      if (resp.ok) {
        var copia = resp.clone();
        caches.open(VERSAO).then(function (c) { c.put(req, copia); });
      }
      return resp;
    }).catch(function () {
      return caches.match(req, { ignoreSearch: true }).then(function (r) {
        return r || (req.mode === "navigate" ? caches.match("index.html") : Response.error());
      });
    })
  );
});
