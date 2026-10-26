/* =====================================================================
   SafeMind 360 — CAMADA DE DADOS
   Repositório único com dois adaptadores:
     • Local    → localStorage (demonstração, funciona sem internet)
     • Firebase → Cloud Firestore + Firebase Authentication
   As camadas de Negócio e Apresentação só conversam com SafeMind.Dados,
   nunca diretamente com o armazenamento.

   Filtros aceitos em listar/observar:
     { campo: valor }                 igualdade
     { campo: [v1, v2] }              "in"
     { campo: { op: ">=", valor: x } } comparação (>=, <=, >, <)
   ===================================================================== */
(function (raiz) {
  "use strict";
  var SM = raiz.SafeMind = raiz.SafeMind || {};
  var PREFIXO = "safemind:db:";

  function novoId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
  }

  function combina(doc, filtros) {
    if (!filtros) return true;
    return Object.keys(filtros).every(function (campo) {
      var regra = filtros[campo];
      var valor = doc[campo];
      if (Array.isArray(regra)) return regra.indexOf(valor) !== -1;
      if (regra && typeof regra === "object" && regra.op) {
        if (valor === undefined || valor === null) return false;
        if (regra.op === ">=") return valor >= regra.valor;
        if (regra.op === "<=") return valor <= regra.valor;
        if (regra.op === ">") return valor > regra.valor;
        if (regra.op === "<") return valor < regra.valor;
        return false;
      }
      return valor === regra;
    });
  }

  function copiar(o) { return o == null ? o : JSON.parse(JSON.stringify(o)); }

  /* ------------------------------------------------------------------
     Adaptador LOCAL (localStorage)
     Atualização em tempo real (RNF05): o evento "storage" avisa as outras
     abas do mesmo navegador; a própria aba é avisada por notificar().
     ------------------------------------------------------------------ */
  var ouvintes = [];

  function lerColecao(nome) {
    try { return JSON.parse(localStorage.getItem(PREFIXO + nome)) || []; }
    catch (e) { return []; }
  }
  function gravarColecao(nome, itens, silencioso) {
    localStorage.setItem(PREFIXO + nome, JSON.stringify(itens));
    if (!silencioso) notificar(nome);
  }
  function notificar(nome) {
    ouvintes.forEach(function (o) {
      if (o.colecao === nome) {
        o.cb(lerColecao(nome).filter(function (d) { return combina(d, o.filtros); }).map(copiar));
      }
    });
  }
  if (typeof window !== "undefined" && window.addEventListener) {
    window.addEventListener("storage", function (e) {
      if (e.key && e.key.indexOf(PREFIXO) === 0) notificar(e.key.slice(PREFIXO.length));
    });
  }

  var Local = {
    nome: "local",
    adicionar: function (colecao, dados) {
      var doc = Object.assign({}, dados, { id: dados.id || novoId() });
      var itens = lerColecao(colecao);
      itens.push(doc);
      gravarColecao(colecao, itens);
      return Promise.resolve(copiar(doc));
    },
    definir: function (colecao, id, dados, mesclar) {
      var itens = lerColecao(colecao);
      var i = itens.findIndex(function (d) { return d.id === id; });
      var doc = mesclar && i !== -1 ? Object.assign({}, itens[i], dados, { id: id }) : Object.assign({}, dados, { id: id });
      if (i === -1) itens.push(doc); else itens[i] = doc;
      gravarColecao(colecao, itens);
      return Promise.resolve(copiar(doc));
    },
    atualizar: function (colecao, id, parcial) {
      var itens = lerColecao(colecao);
      var i = itens.findIndex(function (d) { return d.id === id; });
      if (i === -1) return Promise.reject(new Error("Registro não encontrado."));
      itens[i] = Object.assign({}, itens[i], parcial);
      gravarColecao(colecao, itens);
      return Promise.resolve(copiar(itens[i]));
    },
    remover: function (colecao, id) {
      gravarColecao(colecao, lerColecao(colecao).filter(function (d) { return d.id !== id; }));
      return Promise.resolve();
    },
    obter: function (colecao, id) {
      var d = lerColecao(colecao).filter(function (x) { return x.id === id; })[0];
      return Promise.resolve(d ? copiar(d) : null);
    },
    listar: function (colecao, filtros) {
      return Promise.resolve(lerColecao(colecao).filter(function (d) { return combina(d, filtros); }).map(copiar));
    },
    observar: function (colecao, filtros, cb) {
      var o = { colecao: colecao, filtros: filtros, cb: cb };
      ouvintes.push(o);
      Local.listar(colecao, filtros).then(cb);
      return function () { ouvintes = ouvintes.filter(function (x) { return x !== o; }); };
    },
    /* Grava várias coleções inteiras de uma vez (usado na carga de demonstração). */
    gravarColecoes: function (mapa) {
      Object.keys(mapa).forEach(function (nome) { gravarColecao(nome, mapa[nome], true); });
      Object.keys(mapa).forEach(notificar);
      return Promise.resolve();
    },
    limparTudo: function () {
      Object.keys(localStorage).forEach(function (k) { if (k.indexOf(PREFIXO) === 0) localStorage.removeItem(k); });
    }
  };

  /* ------------------------------------------------------------------
     Adaptador FIREBASE (Cloud Firestore)
     Atualização em tempo real (RNF05) via onSnapshot.
     ------------------------------------------------------------------ */
  function paraFirestore(dados) {
    var saida = {};
    Object.keys(dados).forEach(function (k) {
      if (dados[k] === undefined) return;
      /* Campo usado pela política de TTL do Firestore (retenção – RNF01). */
      saida[k] = k === "expiraEm" && typeof dados[k] === "string" ? new Date(dados[k]) : dados[k];
    });
    return saida;
  }
  function deFirestore(dados, id) {
    var saida = { id: id };
    Object.keys(dados || {}).forEach(function (k) {
      var v = dados[k];
      saida[k] = v && typeof v.toDate === "function" ? v.toDate().toISOString() : v;
    });
    return saida;
  }

  var Remoto = {
    nome: "firebase",
    db: function () { return raiz.firebase.firestore(); },
    consulta: function (colecao, filtros) {
      var q = this.db().collection(colecao);
      var vazia = false;
      Object.keys(filtros || {}).forEach(function (campo) {
        var regra = filtros[campo];
        if (Array.isArray(regra)) {
          if (!regra.length) vazia = true;
          else q = q.where(campo, "in", regra.slice(0, 30));
        } else if (regra && typeof regra === "object" && regra.op) {
          q = q.where(campo, regra.op, regra.valor);
        } else {
          q = q.where(campo, "==", regra);
        }
      });
      return vazia ? null : q;
    },
    adicionar: function (colecao, dados) {
      var ref = dados.id ? this.db().collection(colecao).doc(dados.id) : this.db().collection(colecao).doc();
      var doc = Object.assign({}, dados, { id: ref.id });
      return ref.set(paraFirestore(doc)).then(function () { return doc; });
    },
    definir: function (colecao, id, dados, mesclar) {
      var doc = Object.assign({}, dados, { id: id });
      return this.db().collection(colecao).doc(id).set(paraFirestore(doc), { merge: !!mesclar })
        .then(function () { return doc; });
    },
    atualizar: function (colecao, id, parcial) {
      var ref = this.db().collection(colecao).doc(id);
      return ref.update(paraFirestore(parcial)).then(function () { return ref.get(); })
        .then(function (d) { return deFirestore(d.data(), d.id); });
    },
    remover: function (colecao, id) { return this.db().collection(colecao).doc(id).delete(); },
    obter: function (colecao, id) {
      return this.db().collection(colecao).doc(id).get().then(function (d) {
        return d.exists ? deFirestore(d.data(), d.id) : null;
      });
    },
    listar: function (colecao, filtros) {
      var q = this.consulta(colecao, filtros);
      if (!q) return Promise.resolve([]);
      return q.get().then(function (s) { return s.docs.map(function (d) { return deFirestore(d.data(), d.id); }); });
    },
    observar: function (colecao, filtros, cb) {
      var q = this.consulta(colecao, filtros);
      if (!q) { cb([]); return function () {}; }
      return q.onSnapshot(function (s) {
        cb(s.docs.map(function (d) { return deFirestore(d.data(), d.id); }));
      }, function (erro) {
        console.warn("[SafeMind] Sem permissão ou falha ao observar " + colecao + ":", erro.message);
        cb([]);
      });
    }
  };

  /* ------------------------------------------------------------------
     Carregamento do SDK do Firebase (sob demanda)
     ------------------------------------------------------------------ */
  var promessaFirebase = null;
  function carregarFirebase() {
    if (promessaFirebase) return promessaFirebase;
    promessaFirebase = new Promise(function (ok, falha) {
      if (raiz.firebase && raiz.firebase.apps) return ok();
      var arquivos = ["firebase-app-compat.js", "firebase-auth-compat.js", "firebase-firestore-compat.js"];
      var i = 0;
      (function proximo() {
        if (i === arquivos.length) return ok();
        var s = document.createElement("script");
        s.src = SM.Config.sdkFirebase + arquivos[i++];
        s.onload = proximo;
        s.onerror = function () { falha(new Error("Não foi possível carregar o Firebase. Verifique a conexão com a internet.")); };
        document.head.appendChild(s);
      })();
    }).then(function () {
      var fb = raiz.firebase;
      if (!fb.apps.length) {
        fb.initializeApp(SM.Config.firebase);
        try { fb.firestore().settings({ ignoreUndefinedProperties: true }); } catch (e) { /* já configurado */ }
      }
      /* RN02: em equipamento compartilhado a sessão não fica salva no aparelho. */
      return fb.auth().setPersistence(fb.auth.Auth.Persistence.SESSION).catch(function () {});
    });
    promessaFirebase.catch(function () { promessaFirebase = null; });
    return promessaFirebase;
  }

  function aguardarAutenticacao() {
    return carregarFirebase().then(function () {
      return new Promise(function (ok) {
        var parar = raiz.firebase.auth().onAuthStateChanged(function (u) { parar(); ok(u); });
      });
    });
  }

  /* ------------------------------------------------------------------
     Fachada pública
     ------------------------------------------------------------------ */
  SM.Dados = {
    adaptador: Local,
    Local: Local,
    Remoto: Remoto,
    usar: function (ambiente) { this.adaptador = ambiente === "firebase" ? Remoto : Local; },
    ambiente: function () { return this.adaptador.nome; },

    adicionar: function (c, d) { return SM.Dados.adaptador.adicionar(c, d); },
    definir: function (c, id, d, m) { return SM.Dados.adaptador.definir(c, id, d, m); },
    atualizar: function (c, id, p) { return SM.Dados.adaptador.atualizar(c, id, p); },
    remover: function (c, id) { return SM.Dados.adaptador.remover(c, id); },
    obter: function (c, id) { return SM.Dados.adaptador.obter(c, id); },
    listar: function (c, f) { return SM.Dados.adaptador.listar(c, f); },
    observar: function (c, f, cb) { return SM.Dados.adaptador.observar(c, f, cb); },

    carregarFirebase: carregarFirebase,
    aguardarAutenticacao: aguardarAutenticacao,

    /* Retenção (RNF01): no modo local apaga registros vencidos.
       No Firestore a mesma regra é feita pela política de TTL no campo expiraEm. */
    aplicarRetencaoLocal: function (dias) {
      var limite = new Date(Date.now() - dias * 86400000).toISOString();
      var campos = { checkins: "dataHora", respostas: "dataEnvio", relatos: "dataEnvio", alertas: "criadoEm" };
      Object.keys(campos).forEach(function (c) {
        var itens = lerColecao(c);
        var mantidos = itens.filter(function (d) { return !d[campos[c]] || d[campos[c]] >= limite; });
        if (mantidos.length !== itens.length) gravarColecao(c, mantidos, true);
      });
      var dia = limite.slice(0, 10);
      var ins = lerColecao("insights");
      var insMantidos = ins.filter(function (d) { return d.dia >= dia; });
      if (insMantidos.length !== ins.length) gravarColecao("insights", insMantidos, true);
    },

    versaoLocal: function () { return localStorage.getItem(PREFIXO + "__versao"); },
    marcarVersaoLocal: function (v) { localStorage.setItem(PREFIXO + "__versao", v); }
  };
})(typeof window !== "undefined" ? window : globalThis);
