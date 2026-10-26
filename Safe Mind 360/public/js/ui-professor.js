/* =====================================================================
   SafeMind 360 — APRESENTAÇÃO • Painel do professor
   Casos de uso: acessar o dashboard de insights da turma, receber alertas
   sobre a turma e sugestões de dinâmicas (RN06: só dados consolidados).
   ===================================================================== */
(function () {
  "use strict";
  var SM = window.SafeMind, UI = SM.UI, N = SM.Negocio, IA = SM.MotorIA;
  var $ = UI.$, $$ = UI.$$, esc = UI.esc;
  var sessao, turmaAtual = null;
  var eventosPorTurma = {};

  var ROTULO_TENSAO = { baixa: "Baixa", moderada: "Moderada", elevada: "Elevada", indefinida: "Sem dados suficientes" };

  UI.iniciarPagina({ permissao: "dashboard.turma" }).then(function (r) {
    sessao = r.sessao;
    $("#saudacao").textContent = "Olá, " + sessao.nome.split(" ")[0] + "!";
    var turmas = (sessao.turmas || []).slice().sort(function (a, b) { return a.localeCompare(b, "pt-BR"); });
    if (!turmas.length) {
      $("#sem-turmas").classList.remove("oculto");
      $("#painel-turma").classList.add("oculto");
      return;
    }
    turmaAtual = sessionStorage.getItem("safemind:turma-prof");
    if (turmas.indexOf(turmaAtual) === -1) turmaAtual = turmas[0];
    $("#seletor-turmas").innerHTML = turmas.map(function (t) {
      return '<button type="button" class="chip-turma" data-turma="' + esc(t) + '" aria-pressed="' + (t === turmaAtual) + '">' + UI.icone("school") + "<span>" + esc(t) + "</span></button>";
    }).join("");
    $$("#seletor-turmas button").forEach(function (b) {
      b.onclick = function () {
        turmaAtual = b.dataset.turma;
        sessionStorage.setItem("safemind:turma-prof", turmaAtual);
        $$("#seletor-turmas button").forEach(function (o) { o.setAttribute("aria-pressed", o === b ? "true" : "false"); });
        desenhar();
      };
    });
    var redesenhar = UI.debounce(desenhar, 120);
    /* Uma consulta por turma (as regras do Firestore liberam só as turmas do professor). */
    turmas.forEach(function (t) {
      SM.Dados.observar("insights", { turma: t }, function (lista) {
        eventosPorTurma[t] = lista;
        redesenhar();
        marcarAtualizado();
      });
    });
  }).catch(function (e) { console.warn("[SafeMind]", e.message); });

  function marcarAtualizado() {
    $("#ao-vivo span").textContent = "Atualizado às " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }

  function kpi(titulo, valor, detalhe, classe) {
    return '<div class="kpi"><small>' + esc(titulo) + "</small><b>" + esc(valor) + "</b><span" + (classe ? ' class="' + classe + '"' : "") + ">" + esc(detalhe) + "</span></div>";
  }

  function desenhar() {
    var eventos = eventosPorTurma[turmaAtual] || [];
    var p = IA.padroesTurma(eventos, { kMinimo: SM.Config.kMinimo });
    var aviso = $("#aviso-insuficiente");
    if (!p.suficiente) {
      aviso.textContent = "Ainda há poucos registros nesta turma (menos de " + SM.Config.kMinimo + " nos últimos 7 dias). Os indicadores ficam ocultos para não permitir identificar quem respondeu.";
      aviso.classList.remove("oculto");
    } else aviso.classList.add("oculto");

    var variacao = p.variacao == null ? "sem comparação" : (p.variacao > 0 ? "+" : "") + p.variacao + " pontos na semana";
    $("#kpis-turma").innerHTML =
      kpi("Índice de clima", p.indice == null ? "—" : p.indice + "/100", variacao, p.variacao == null ? "" : p.variacao >= 0 ? "alta" : "queda") +
      kpi("Registros em 7 dias", String(p.registros7), "check-ins, questionários e relatos") +
      kpi("Sinais de conflito", p.suficiente ? Math.round(p.proporcoes.CONFLITO * 100) + "%" : "—", "dos registros em 14 dias") +
      kpi("Sinais de exclusão", p.suficiente ? Math.round(p.proporcoes.EXCLUSAO_SOCIAL * 100) + "%" : "—", "dos registros em 14 dias");

    UI.Graficos.linha($("#grafico-clima"), p.suficiente ? p.serie.map(function (s) {
      return { rotulo: s.dia.slice(8, 10) + "/" + s.dia.slice(5, 7), valor: s.valor };
    }) : [], { referencia: 55, descricao: "Índice diário de clima da turma " + turmaAtual + " nos últimos 14 dias." });
    if (!p.suficiente) $("#grafico-clima").innerHTML = '<p class="vazio-grafico">Sem dados suficientes para exibir.</p>';

    UI.Graficos.barrasH($("#temas"), [
      { rotulo: "Conflito ou provocação", valor: p.suficiente ? Math.round(p.proporcoes.CONFLITO * 100) : null, sufixo: "%", classe: "conflito" },
      { rotulo: "Exclusão social", valor: p.suficiente ? Math.round(p.proporcoes.EXCLUSAO_SOCIAL * 100) : null, sufixo: "%", classe: "exclusao" },
      { rotulo: "Sofrimento emocional", valor: p.suficiente ? Math.round(p.proporcoes.SOFRIMENTO_EMOCIONAL * 100) : null, sufixo: "%", classe: "sofrimento" }
    ]);

    $("#alertas-turma").innerHTML = p.alertas.length
      ? p.alertas.map(function (a) {
        return '<li data-nivel="medio">' + UI.icone("campaign") + "<div><b>" + esc(a.titulo) + "</b><span>" + esc(a.texto) + "</span></div></li>";
      }).join("")
      : '<li class="sem-alerta">' + UI.icone("check_circle") + "<div><b>Nenhum alerta para " + esc(turmaAtual) + "</b><span>" +
        (p.suficiente ? "Os indicadores estão dentro do esperado." : "Ainda não há registros suficientes para avaliar.") + "</span></div></li>";

    var dinamicas = N.dinamicasPara(p.dominantes);
    $("#dinamicas").innerHTML = dinamicas.map(function (d) {
      return '<details class="dinamica"><summary><span class="dinamica-titulo">' + esc(d.titulo) + "</span><span class=\"dinamica-meta\">" + esc(d.duracao) + "</span></summary>" +
        "<p>" + esc(d.objetivo) + "</p><ol>" + d.passos.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ol></details>";
    }).join("");

    $("#comparativo").innerHTML = Object.keys(eventosPorTurma).sort(function (a, b) { return a.localeCompare(b, "pt-BR"); }).map(function (t) {
      var q = IA.padroesTurma(eventosPorTurma[t], { kMinimo: SM.Config.kMinimo });
      return "<tr" + (t === turmaAtual ? ' class="linha-ativa"' : "") + '><td data-label="Turma">' + esc(t) + "</td>" +
        '<td data-label="Índice de clima">' + (q.indice == null ? "—" : q.indice + "/100") + "</td>" +
        '<td data-label="Variação na semana">' + (q.variacao == null ? "—" : (q.variacao > 0 ? "+" : "") + q.variacao) + "</td>" +
        '<td data-label="Registros (7 dias)">' + q.registros7 + "</td>" +
        '<td data-label="Atenção"><span class="etiqueta tensao-' + q.tensao + '">' + ROTULO_TENSAO[q.tensao] + "</span></td></tr>";
    }).join("");
  }
})();
