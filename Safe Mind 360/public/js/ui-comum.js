/* =====================================================================
   SafeMind 360 — CAMADA DE APRESENTAÇÃO • componentes comuns
   Acessibilidade (RNF02), gráficos, diálogos, avisos, PWA (RNF04/RNF06),
   modo quiosque em equipamento da escola (RN02) e proteção de páginas (RF08).
   ===================================================================== */
(function (raiz) {
  "use strict";
  var SM = raiz.SafeMind = raiz.SafeMind || {};

  function $(s, el) { return (el || document).querySelector(s); }
  function $$(s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); }
  function esc(t) {
    return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function iniciais(nome) {
    return String(nome || "?").split(" ").filter(Boolean).slice(0, 2).map(function (p) { return p[0]; }).join("").toUpperCase();
  }
  function fmtData(iso, comHora) {
    if (!iso) return "—";
    var d = new Date(iso);
    var txt = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    return comHora === false ? txt : txt + " às " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }
  function quando(iso) {
    var min = Math.round((Date.now() - new Date(iso)) / 60000);
    if (min < 1) return "agora";
    if (min < 60) return "há " + min + " min";
    if (min < 1440) return "há " + Math.round(min / 60) + " h";
    var dias = Math.round(min / 1440);
    return dias === 1 ? "ontem" : "há " + dias + " dias";
  }
  function debounce(fn, ms) {
    var t;
    return function () { var a = arguments, s = this; clearTimeout(t); t = setTimeout(function () { fn.apply(s, a); }, ms || 80); };
  }
  function icone(nome) { return '<span class="material-symbols-outlined" aria-hidden="true">' + nome + "</span>"; }
  function baixarArquivo(nome, conteudo, tipo) {
    var url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
    var a = document.createElement("a");
    a.href = url; a.download = nome; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  /* ---------------- RNF02: acessibilidade ---------------- */
  function configurarAcessibilidade() {
    var prefs;
    try { prefs = JSON.parse(localStorage.getItem("safemind:a11y")) || { tamanho: 0, contraste: false }; }
    catch (e) { prefs = { tamanho: 0, contraste: false }; }
    function aplicar() {
      document.documentElement.classList.toggle("texto-grande", prefs.tamanho === 1);
      document.documentElement.classList.toggle("texto-maior", prefs.tamanho >= 2);
      document.body.classList.toggle("alto-contraste", !!prefs.contraste);
      $$('[data-a11y="contraste"]').forEach(function (b) { b.setAttribute("aria-pressed", prefs.contraste ? "true" : "false"); });
      try { localStorage.setItem("safemind:a11y", JSON.stringify(prefs)); } catch (e) { /* sem armazenamento */ }
    }
    $$("[data-a11y]").forEach(function (b) {
      b.addEventListener("click", function () {
        var acao = b.dataset.a11y;
        if (acao === "aumentar") prefs.tamanho = Math.min(2, prefs.tamanho + 1);
        if (acao === "diminuir") prefs.tamanho = Math.max(0, prefs.tamanho - 1);
        if (acao === "contraste") prefs.contraste = !prefs.contraste;
        aplicar();
      });
    });
    aplicar();
  }

  /* ---------------- avisos (toast acessível) ---------------- */
  function aviso(msg, tipo) {
    var area = $("#area-avisos");
    if (!area) {
      area = document.createElement("div");
      area.id = "area-avisos";
      area.className = "area-avisos";
      area.setAttribute("role", "status");
      area.setAttribute("aria-live", "polite");
      document.body.appendChild(area);
    }
    var el = document.createElement("div");
    el.className = "aviso-flutuante " + (tipo || "ok");
    el.innerHTML = icone(tipo === "erro" ? "error" : tipo === "alerta" ? "priority_high" : "check_circle") + "<span>" + esc(msg) + "</span>";
    area.appendChild(el);
    setTimeout(function () { el.classList.add("saindo"); }, 4200);
    setTimeout(function () { el.remove(); }, 4700);
  }

  /* ---------------- diálogo modal (<dialog> nativo) ---------------- */
  function dialogo(op) {
    var d = document.createElement("dialog");
    d.className = "dialogo" + (op.largo ? " largo" : "");
    var idTitulo = "dlg-" + Date.now();
    d.setAttribute("aria-labelledby", idTitulo);
    d.innerHTML =
      '<form method="dialog" class="dialogo-corpo" novalidate>' +
      '<header class="dialogo-topo"><h2 id="' + idTitulo + '">' + esc(op.titulo) + "</h2>" +
      (op.semFechar ? "" : '<button type="button" class="btn-icone" data-fechar aria-label="Fechar">' + icone("close") + "</button>") +
      "</header>" +
      '<div class="dialogo-conteudo">' + (op.html || "") + "</div>" +
      '<p class="erro oculto" data-erro role="alert"></p>' +
      '<footer class="dialogo-acoes"></footer></form>';
    var rodape = $(".dialogo-acoes", d);
    (op.acoes || [{ rotulo: "Fechar", tipo: "discreto" }]).forEach(function (a) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "btn " + (a.tipo || "discreto") + " pequeno";
      b.innerHTML = (a.icone ? icone(a.icone) : "") + "<span>" + esc(a.rotulo) + "</span>";
      b.onclick = function () {
        var erro = $("[data-erro]", d);
        erro.classList.add("oculto");
        if (!a.acao) return fechar();
        b.disabled = true;
        Promise.resolve().then(function () { return a.acao(d); }).then(function (r) {
          b.disabled = false;
          if (r !== false) fechar();
        }).catch(function (e) {
          b.disabled = false;
          erro.textContent = e.message || String(e);
          erro.classList.remove("oculto");
        });
      };
      rodape.appendChild(b);
    });
    function fechar() { d.close(); }
    d.addEventListener("close", function () { d.remove(); if (op.aoFechar) op.aoFechar(); });
    if (op.semFechar) d.addEventListener("cancel", function (e) { e.preventDefault(); });
    $$("[data-fechar]", d).forEach(function (b) { b.onclick = fechar; });
    document.body.appendChild(d);
    d.showModal();
    if (op.aoAbrir) op.aoAbrir(d);
    return d;
  }
  function confirmar(titulo, texto, rotuloOk) {
    return new Promise(function (ok) {
      var respondeu = false;
      dialogo({
        titulo: titulo, html: "<p>" + esc(texto) + "</p>",
        acoes: [
          { rotulo: "Cancelar", tipo: "discreto" },
          { rotulo: rotuloOk || "Confirmar", tipo: "perigo", acao: function () { respondeu = true; } }
        ],
        aoFechar: function () { ok(respondeu); }
      });
    });
  }

  /* ---------------- gráficos (sem bibliotecas externas) ---------------- */
  var Graficos = {
    /* Barras verticais. itens: [{rotulo, valor, max, titulo, classe}] */
    barras: function (el, itens, op) {
      op = op || {};
      var max = op.max || Math.max.apply(null, itens.map(function (i) { return i.valor || 0; }).concat([1]));
      el.innerHTML = itens.map(function (i) {
        var h = i.valor ? Math.max(4, i.valor / max * 100) : 3;
        return '<div class="' + (i.classe || "") + (i.valor ? "" : " sem-dado") + '" style="height:' + h + '%" title="' + esc(i.titulo || "") + '">' +
          (op.mostrarValor && i.valor ? '<b class="valor-barra">' + i.valor + "</b>" : "") +
          "<small>" + esc(i.rotulo) + "</small></div>";
      }).join("");
      if (op.descricao) { el.setAttribute("role", "img"); el.setAttribute("aria-label", op.descricao); }
    },

    /* Linha em SVG com lacunas para dias sem dado suficiente. pontos: [{rotulo, valor|null}] */
    linha: function (el, pontos, op) {
      op = op || {};
      var L = 640, A = op.altura || 190, mx = 34, my = 14, base = A - 26;
      var min = op.min == null ? 0 : op.min, max = op.max == null ? 100 : op.max;
      var passo = pontos.length > 1 ? (L - mx - 10) / (pontos.length - 1) : 0;
      function x(i) { return mx + i * passo; }
      function y(v) { return my + (1 - (v - min) / (max - min)) * (base - my); }
      var grade = [0, 25, 50, 75, 100].filter(function (g) { return g >= min && g <= max; }).map(function (g) {
        return '<line x1="' + mx + '" x2="' + (L - 6) + '" y1="' + y(g) + '" y2="' + y(g) + '" class="grade-linha"/>' +
          '<text x="' + (mx - 8) + '" y="' + (y(g) + 4) + '" class="eixo" text-anchor="end">' + g + "</text>";
      }).join("");
      var segmentos = [], atual = [];
      pontos.forEach(function (p, i) {
        if (typeof p.valor === "number") atual.push(x(i) + "," + y(p.valor));
        else if (atual.length) { segmentos.push(atual); atual = []; }
      });
      if (atual.length) segmentos.push(atual);
      var area = segmentos.map(function (s) {
        if (s.length < 2) return "";
        var primeiro = s[0].split(","), ultimo = s[s.length - 1].split(",");
        return '<polygon class="area-linha" points="' + primeiro[0] + "," + base + " " + s.join(" ") + " " + ultimo[0] + "," + base + '"/>';
      }).join("");
      var linhas = segmentos.map(function (s) { return '<polyline class="traco-linha" points="' + s.join(" ") + '"/>'; }).join("");
      var marcas = pontos.map(function (p, i) {
        return typeof p.valor === "number" ? '<circle cx="' + x(i) + '" cy="' + y(p.valor) + '" r="3.5" class="ponto-linha"><title>' + esc(p.rotulo + ": " + p.valor) + "</title></circle>" : "";
      }).join("");
      var rotulos = pontos.map(function (p, i) {
        var mostrar = pontos.length <= 8 || i % Math.ceil(pontos.length / 7) === 0 || i === pontos.length - 1;
        return mostrar ? '<text x="' + x(i) + '" y="' + (A - 6) + '" class="eixo" text-anchor="middle">' + esc(p.rotulo) + "</text>" : "";
      }).join("");
      var linhaRef = op.referencia != null ? '<line x1="' + mx + '" x2="' + (L - 6) + '" y1="' + y(op.referencia) + '" y2="' + y(op.referencia) + '" class="linha-referencia"/>' : "";
      var validos = pontos.filter(function (p) { return typeof p.valor === "number"; });
      var desc = op.descricao || (validos.length ? "Gráfico de linha de " + validos[0].rotulo + " a " + validos[validos.length - 1].rotulo + ", valores entre " +
        Math.min.apply(null, validos.map(function (p) { return p.valor; })) + " e " + Math.max.apply(null, validos.map(function (p) { return p.valor; })) + "." : "Sem dados suficientes.");
      el.innerHTML = '<svg viewBox="0 0 ' + L + " " + A + '" class="grafico-linha" role="img" aria-label="' + esc(desc) + '" preserveAspectRatio="none">' +
        grade + linhaRef + area + linhas + marcas + rotulos + "</svg>";
    },

    /* Rosca. partes: [{rotulo, valor, cor}] */
    rosca: function (el, partes, centro) {
      var total = partes.reduce(function (s, p) { return s + p.valor; }, 0) || 1;
      var acum = 0;
      var faixas = partes.map(function (p) {
        var ini = acum / total * 100; acum += p.valor;
        return p.cor + " " + ini + "% " + (acum / total * 100) + "%";
      }).join(",");
      el.style.background = "conic-gradient(" + faixas + ")";
      el.setAttribute("role", "img");
      el.setAttribute("aria-label", partes.map(function (p) { return p.rotulo + ": " + p.valor; }).join(", "));
      el.innerHTML = '<div class="rosca-centro"><b>' + esc(centro.valor) + "</b><small>" + esc(centro.rotulo) + "</small></div>";
    },

    /* Barras horizontais. itens: [{rotulo, valor, max, sufixo, classe}] */
    barrasH: function (el, itens) {
      el.innerHTML = itens.map(function (i) {
        var largura = !i.valor ? 0 : Math.max(2, Math.min(100, i.valor / (i.max || 100) * 100));
        return '<div class="barra-h"><span class="barra-h-rotulo">' + esc(i.rotulo) + "</span>" +
          '<span class="barra-h-trilho"><i class="' + (i.classe || "") + '" style="width:' + largura + '%"></i></span>' +
          '<b class="barra-h-valor">' + (i.valor == null ? "—" : esc(i.valor + (i.sufixo || ""))) + "</b></div>";
      }).join("");
    }
  };

  /* ---------------- RNF04 / RNF06: PWA ---------------- */
  var eventoInstalar = null;
  function configurarPWA() {
    if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
      navigator.serviceWorker.register("sw.js").catch(function (e) { console.warn("[SafeMind] Service worker não registrado:", e.message); });
    }
    var ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !raiz.MSStream;
    var instalado = raiz.matchMedia && raiz.matchMedia("(display-mode: standalone)").matches;
    raiz.addEventListener("beforeinstallprompt", function (e) {
      e.preventDefault();
      eventoInstalar = e;
      $$("[data-instalar]").forEach(function (b) { b.classList.remove("oculto"); });
    });
    if (ios && !instalado) $$("[data-instalar]").forEach(function (b) { b.classList.remove("oculto"); });
    $$("[data-instalar]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (eventoInstalar) {
          eventoInstalar.prompt();
          eventoInstalar.userChoice.then(function () { eventoInstalar = null; b.classList.add("oculto"); });
        } else {
          dialogo({
            titulo: "Instalar no iPhone ou iPad",
            html: "<p>No Safari, toque em <b>Compartilhar</b> e depois em <b>Adicionar à Tela de Início</b>. O SafeMind 360 abre como um aplicativo.</p>"
          });
        }
      });
    });
  }

  /* ---------------- RN04: notificação do navegador ---------------- */
  function notificar(titulo, corpo) {
    if (!("Notification" in raiz) || Notification.permission !== "granted") return;
    try { new Notification(titulo, { body: corpo, tag: "safemind-prioritario" }); } catch (e) { /* alguns navegadores exigem service worker */ }
  }

  /* ---------------- RN02: modo quiosque (equipamento da escola) ---------------- */
  function modoQuiosque() {
    var Config = SM.Config;
    var tempo, avisoTempo, dlg = null;
    function sair() {
      SM.Sessao.encerrar().then(function () { location.replace("index.html?motivo=inatividade"); });
    }
    function reiniciar() {
      clearTimeout(tempo); clearTimeout(avisoTempo);
      if (dlg) return;
      avisoTempo = setTimeout(function () {
        dlg = dialogo({
          titulo: "Você ainda está aí?",
          html: "<p>Este é um equipamento da escola. Para proteger seus dados, a sessão vai terminar em alguns segundos.</p>",
          acoes: [{ rotulo: "Sair agora", tipo: "discreto", acao: sair }, { rotulo: "Continuar usando", tipo: "principal" }],
          aoFechar: function () { dlg = null; reiniciar(); }
        });
      }, Config.inatividadeQuiosqueMs - Config.avisoInatividadeMs);
      tempo = setTimeout(sair, Config.inatividadeQuiosqueMs);
    }
    ["pointerdown", "keydown", "scroll", "touchstart"].forEach(function (ev) {
      document.addEventListener(ev, debounce(reiniciar, 400), { passive: true });
    });
    reiniciar();
  }

  /* ---------------- proteção de páginas (RF08 / RN06) ---------------- */
  function iniciarPagina(op) {
    configurarAcessibilidade();
    configurarPWA();
    var sessao = SM.Sessao.atual();
    if (!sessao) { location.replace("index.html"); return Promise.reject(new Error("sem sessão")); }
    SM.Dados.usar(sessao.ambiente);

    var preparo;
    if (sessao.ambiente === "local") {
      SM.Semente.garantir();
      SM.Dados.aplicarRetencaoLocal(SM.Config.retencaoDias);
      preparo = Promise.resolve(true);
    } else {
      preparo = SM.Dados.aguardarAutenticacao().then(function (u) { return !!u && u.uid === sessao.uid; });
    }
    return preparo.then(function (ok) {
      if (!ok) throw new Error("sessão expirada");
      return SM.Dados.obter("usuarios", sessao.uid);
    }).then(function (u) {
      if (!u || u.ativo === false) throw new Error("acesso desativado");
      /* Mudanças de perfil feitas pela coordenação valem no próximo carregamento. */
      sessao = SM.Sessao.atualizar({ nome: u.nome, perfil: u.perfil, turma: u.turma || null, turmas: u.turmas || [] });
      if (!SM.Negocio.pode(sessao.perfil, op.permissao)) {
        location.replace(SM.Sessao.paginaDoPerfil(sessao.perfil));
        throw new Error("sem permissão");
      }
      $$("[data-usuario]").forEach(function (el) { el.textContent = sessao.nome; });
      $$("[data-perfil]").forEach(function (el) { el.textContent = SM.Negocio.PERFIS[sessao.perfil].rotulo; });
      $$("[data-ambiente]").forEach(function (el) {
        el.textContent = sessao.ambiente === "local" ? "Demonstração" : "Firebase";
        el.title = sessao.ambiente === "local" ? "Dados de demonstração guardados neste navegador" : "Dados no Cloud Firestore";
      });
      function sair() { SM.Sessao.encerrar().then(function () { location.replace("index.html"); }); }
      $$("[data-sair]").forEach(function (b) { b.onclick = sair; });
      if (SM.Dispositivo.atual()) {
        $$("[data-dispositivo]").forEach(function (el) {
          el.classList.remove("oculto");
          el.querySelector("[data-dispositivo-nome]").textContent = SM.Dispositivo.atual().nome;
        });
        if (sessao.perfil === "estudante") modoQuiosque();
      }
      return { sessao: sessao, usuario: u };
    }).catch(function (e) {
      if (e.message !== "sem permissão") {
        SM.Sessao.encerrar().then(function () { location.replace("index.html"); });
      }
      throw e;
    });
  }

  /* Abas acessíveis (padrão WAI-ARIA tabs). */
  function configurarAbas(lista, aoTrocar) {
    var abas = $$('[role="tab"]', lista);
    function ativar(aba, foco) {
      abas.forEach(function (a) {
        var sel = a === aba;
        a.setAttribute("aria-selected", sel ? "true" : "false");
        a.tabIndex = sel ? 0 : -1;
        var painel = document.getElementById(a.getAttribute("aria-controls"));
        if (painel) painel.hidden = !sel;
      });
      if (foco) aba.focus();
      var id = aba.getAttribute("aria-controls");
      if (history.replaceState) history.replaceState(null, "", "#" + id.replace("painel-", ""));
      if (aoTrocar) aoTrocar(id);
    }
    abas.forEach(function (a, i) {
      a.addEventListener("click", function () { ativar(a); });
      a.addEventListener("keydown", function (e) {
        var alvo = null;
        if (e.key === "ArrowRight") alvo = abas[(i + 1) % abas.length];
        if (e.key === "ArrowLeft") alvo = abas[(i - 1 + abas.length) % abas.length];
        if (e.key === "Home") alvo = abas[0];
        if (e.key === "End") alvo = abas[abas.length - 1];
        if (alvo) { e.preventDefault(); ativar(alvo, true); }
      });
    });
    var inicial = abas.filter(function (a) { return "#" + a.getAttribute("aria-controls").replace("painel-", "") === location.hash; })[0] || abas[0];
    ativar(inicial);
    return { ativar: function (id) { var a = abas.filter(function (x) { return x.getAttribute("aria-controls") === id; })[0]; if (a) ativar(a, true); } };
  }

  SM.UI = {
    $: $, $$: $$, esc: esc, iniciais: iniciais, fmtData: fmtData, quando: quando, debounce: debounce,
    icone: icone, baixarArquivo: baixarArquivo, aviso: aviso, dialogo: dialogo, confirmar: confirmar,
    Graficos: Graficos, notificar: notificar, configurarAcessibilidade: configurarAcessibilidade,
    configurarPWA: configurarPWA, iniciarPagina: iniciarPagina, configurarAbas: configurarAbas
  };
})(window);
