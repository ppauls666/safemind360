/* Prepara um "navegador" mínimo para rodar as camadas no Node. */
function criarStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    clear: () => m.clear(),
    key: (i) => [...m.keys()][i],
    get length() { return m.size; },
    _mapa: m
  };
}
function proxyStorage(s) {
  /* Object.keys(localStorage) precisa listar as chaves, como no navegador. */
  return new Proxy(s, {
    ownKeys: () => [...s._mapa.keys()],
    getOwnPropertyDescriptor: (t, k) => (s._mapa.has(k) ? { enumerable: true, configurable: true, value: s._mapa.get(k) } : Object.getOwnPropertyDescriptor(t, k))
  });
}
function carregar() {
  for (const k of Object.keys(require.cache)) if (k.includes("/public/js/")) delete require.cache[k];
  delete globalThis.SafeMind;
  globalThis.localStorage = proxyStorage(criarStorage());
  globalThis.sessionStorage = proxyStorage(criarStorage());
  for (const f of ["config", "dados", "motor-ia", "negocio", "dados-demo"]) require("../public/js/" + f + ".js");
  return globalThis.SafeMind;
}
module.exports = { carregar };
