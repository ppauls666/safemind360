/* =====================================================================
   SafeMind 360 — APRESENTAÇÃO • Painel da coordenação/psicologia
   Casos de uso: acessar o dashboard (RF05), gerenciar alertas (RN01/RN04),
   ler relatos (RF03), registrar intervenções (RF06/RN07), medir eficácia
   (RF07), gerenciar acessos (RF08), questionários (RF02) e configurações
   de IA (RNF03), privacidade (RNF01) e dispositivos (RN02/RNF07).
   ===================================================================== */
(function () {
  "use strict";
  var SM = window.SafeMind, UI = SM.UI, N = SM.Negocio, S = SM.Servicos, IA = SM.MotorIA, Config = SM.Config;
  var $ = UI.$, $$ = UI.$$, esc = UI.esc, icone = UI.icone;
  var sessao, abas;
  var E = { alertas: [], relatos: [], intervencoes: [], insights: [], checkins: [], respostas: [], usuarios: [], questionarios: [], turmas: [] };
  var carregados = {};
  var alertasConhecidos = null;
  var filtroTurmaEstudantes = "";

  var ROTULO_GRAU = { alto: "Alto", moderado: "Moderado", baixo: "Baixo" };
  var ROTULO_TENSAO = { baixa: "Baixa", moderada: "Moderada", elevada: "Elevada", indefinida: "Poucos registros" };
  var ROTULO_RESULTADO = { melhora: "Melhora", estavel: "Estável", piora: "Piora", insuficiente: "Em observação" };

  UI.iniciarPagina({ permissao: "dashboard.escola" }).then(function (r) {
    sessao = r.sessao;
    abas = UI.configurarAbas($("#abas"));
    $$("[data-ir-aba]").forEach(function (b) { b.onclick = function () { abas.ativar(b.dataset.irAba); window.scrollTo(0, 0); }; });
    $$(".k-minimo").forEach(function (el) { el.textContent = Config.kMinimo; });
    configurarFiltros();
    configurarConfiguracoes();
    var redesenhar = UI.debounce(renderizar, 100);
    Object.keys(E).forEach(function (c) {
      SM.Dados.observar(c, null, function (lista) {
        E[c] = lista;
        carregados[c] = true;
        if (c === "alertas") verificarNovosPrioritarios();
        redesenhar();
      });
    });
    if (sessao.ambiente === "local") {
      var idade = SM.Semente.idadeDias();
      if (idade >= 2) {
        var av = $("#aviso-semente");
        av.textContent = "Os dados de demonstração foram gerados há " + idade + " dias, então as datas estão defasadas. Para atualizar, use “Gerar dados de demonstração de novo” em IA e privacidade.";
        av.classList.remove("oculto");
      }
    }
  }).catch(function (e) { console.warn("[SafeMind]", e.message); });

  /* ---------------- utilidades ---------------- */
  function estudantes() { return E.usuarios.filter(function (u) { return u.perfil === "estudante" && u.ativo !== false; }); }
  function turmasNomes() {
    var lista = E.turmas.length ? E.turmas : Config.turmasPadrao;
    return lista.map(function (t) { return t.nome; }).sort(function (a, b) { return a.localeCompare(b, "pt-BR"); });
  }
  function contexto() { return { checkins: E.checkins, respostas: E.respostas, insights: E.insights }; }
  function abertos() { return E.alertas.filter(function (a) { return a.status !== "resolvido"; }); }
  function etiqueta(classe, texto) { return '<span class="etiqueta ' + classe + '">' + esc(texto) + "</span>"; }
  function kpi(titulo, valor, detalhe, classe) {
    return '<div class="kpi"><small>' + esc(titulo) + "</small><b>" + esc(valor) + "</b><span" + (classe ? ' class="' + classe + '"' : "") + ">" + esc(detalhe) + "</span></div>";
  }
  function serieEscola(dias) {
    var hoje = new Date(), pts = [];
    for (var i = dias - 1; i >= 0; i--) {
      var d = new Date(hoje); d.setDate(d.getDate() - i);
      var dia = IA.diaISO(d);
      var v = E.insights.filter(function (e) { return e.dia === dia && typeof e.valor === "number"; }).map(function (e) { return e.valor; });
      pts.push({ rotulo: dia.slice(8, 10) + "/" + dia.slice(5, 7), valor: v.length >= 3 ? Math.round(IA.media(v)) : null });
    }
    return pts;
  }

  function renderizar() {
    if (!carregados.alertas || !carregados.usuarios) return;
    renderBanner();
    renderGeral();
    renderAlertas();
    renderRelatos();
    renderIntervencoes();
    renderTurmas();
    renderQuestionarios();
    renderAcessos();
    $("#ao-vivo span").textContent = "Atualizado às " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }

  /* ---------------- RN04: alerta prioritário ---------------- */
  function prioritariosPendentes() {
    return E.alertas.filter(function (a) { return a.prioritario && a.status === "novo"; })
      .sort(function (a, b) { return a.criadoEm < b.criadoEm ? 1 : -1; });
  }
  function renderBanner() {
    var lista = prioritariosPendentes();
    var b = $("#banner-prioritario");
    b.classList.toggle("oculto", !lista.length);
    document.title = (lista.length ? "(" + lista.length + ") " : "") + "SafeMind 360 — Coordenação e psicologia";
    if (!lista.length) return;
    var a = lista[0];
    $("#banner-titulo").textContent = lista.length === 1 ? "1 alerta prioritário aguardando ação" : lista.length + " alertas prioritários aguardando ação";
    $("#banner-texto").textContent = a.motivo + " — " + (a.estudanteNome || "estudante anônimo") + (a.turma ? ", " + a.turma : "") + ", " + UI.quando(a.criadoEm) + ".";
    $("#banner-ver").onclick = function () { abrirAlerta(a); };
    var novos = E.alertas.filter(function (x) { return x.status === "novo"; }).length;
    var contA = $("#cont-alertas");
    contA.textContent = novos; contA.classList.toggle("oculto", !novos);
  }
  function verificarNovosPrioritarios() {
    var ids = {};
    E.alertas.forEach(function (a) { ids[a.id] = true; });
    if (alertasConhecidos) {
      E.alertas.filter(function (a) { return !alertasConhecidos[a.id] && a.prioritario; }).forEach(function (a) {
        UI.aviso("Novo alerta prioritário: " + a.motivo, "alerta");
        UI.notificar("SafeMind 360: alerta prioritário", a.motivo + (a.turma ? " (" + a.turma + ")" : ""));
      });
    }
    alertasConhecidos = ids;
  }

  /* ---------------- RF05: visão geral ---------------- */
  function renderGeral() {
    var alunos = estudantes();
    var limite7 = new Date(Date.now() - 7 * 86400000).toISOString();
    var ativos = {};
    E.checkins.forEach(function (c) { if (c.dataHora >= limite7) ativos[c.autorUid] = true; });
    var participacao = alunos.length ? Math.round(alunos.filter(function (u) { return ativos[u.id]; }).length / alunos.length * 100) : 0;
    var d7 = IA.diaISO(new Date(Date.now() - 6 * 86400000)), d14 = IA.diaISO(new Date(Date.now() - 13 * 86400000));
    function mediaDias(ini, fim) {
      var v = E.insights.filter(function (e) { return e.dia >= ini && (!fim || e.dia < fim) && typeof e.valor === "number"; }).map(function (e) { return e.valor; });
      return v.length ? Math.round(IA.media(v)) : null;
    }
    var clima = mediaDias(d7), climaAnt = mediaDias(d14, d7);
    var var7 = clima != null && climaAnt != null ? clima - climaAnt : null;
    var ab = abertos();
    var prio = ab.filter(function (a) { return a.prioritario; }).length;
    var ivAnd = E.intervencoes.filter(function (i) { return i.status !== "concluida"; }).length;
    var mes = new Date(); mes.setDate(1); mes.setHours(0, 0, 0, 0);
    var ivMes = E.intervencoes.filter(function (i) { return i.status === "concluida" && i.dataRegistro >= mes.toISOString(); }).length;
    var ef = S.eficacia(E.intervencoes, contexto());
    var turmasCom = {};
    alunos.forEach(function (u) { if (u.turma) turmasCom[u.turma] = 1; });

    $("#kpis").innerHTML =
      kpi("Estudantes acompanhados", String(alunos.length), "em " + Object.keys(turmasCom).length + " turmas") +
      kpi("Participação na semana", participacao + "%", "fizeram check-in nos últimos 7 dias") +
      kpi("Clima da escola", clima == null ? "—" : clima + "/100", var7 == null ? "sem comparação" : (var7 > 0 ? "+" : "") + var7 + " pontos na semana", var7 == null ? "" : var7 >= 0 ? "alta" : "queda") +
      kpi("Alertas abertos", String(ab.length), prio + " prioritário(s)", prio ? "queda" : "") +
      kpi("Intervenções em andamento", String(ivAnd), ivMes + " concluída(s) neste mês") +
      kpi("Melhora após intervenção", ef.avaliadas ? Math.round(ef.melhora / ef.avaliadas * 100) + "%" : "—", "de " + ef.avaliadas + " intervenção(ões) avaliada(s)");

    UI.Graficos.linha($("#grafico-clima-escola"), serieEscola(14), { referencia: 55, descricao: "Índice diário de clima da escola nos últimos 14 dias." });

    var cont = { alto: 0, moderado: 0, baixo: 0 };
    alunos.forEach(function (u) { cont[N.Indicadores.situacaoEstudante(u.id, E.alertas)]++; });
    UI.Graficos.rosca($("#rosca"), [
      { rotulo: "Sem alerta aberto", valor: cont.baixo, cor: "var(--low)" },
      { rotulo: "Atenção moderada", valor: cont.moderado, cor: "var(--medium)" },
      { rotulo: "Atenção alta", valor: cont.alto, cor: "var(--high)" }
    ], { valor: alunos.length, rotulo: "estudantes" });
    function pct(n) { return alunos.length ? Math.round(n / alunos.length * 100) + "%" : "0%"; }
    $("#legenda-rosca").innerHTML =
      '<li><i class="ponto baixo"></i>Sem alerta aberto <b>' + cont.baixo + " (" + pct(cont.baixo) + ")</b></li>" +
      '<li><i class="ponto medio"></i>Atenção moderada <b>' + cont.moderado + " (" + pct(cont.moderado) + ")</b></li>" +
      '<li><i class="ponto alto"></i>Atenção alta <b>' + cont.alto + " (" + pct(cont.alto) + ")</b></li>";

    var dias = [], hoje = new Date(), total = 0;
    for (var i = 13; i >= 0; i--) {
      var d = new Date(hoje); d.setDate(d.getDate() - i);
      var dia = IA.diaISO(d);
      var n = E.alertas.filter(function (a) { return IA.diaISO(a.criadoEm) === dia; }).length;
      total += n;
      dias.push({ rotulo: dia.slice(8, 10), valor: n, titulo: n + " alerta(s) em " + dia.slice(8, 10) + "/" + dia.slice(5, 7) });
    }
    UI.Graficos.barras($("#barras-alertas"), dias, { mostrarValor: true, descricao: "Alertas gerados por dia nos últimos 14 dias, total " + total + "." });
    $("#resumo-alertas-dia").textContent = total + " alerta(s) gerado(s) nos últimos 14 dias.";

    var ranking = turmasNomes().map(function (t) {
      return { turma: t, p: IA.padroesTurma(E.insights.filter(function (e) { return e.turma === t; }), { kMinimo: Config.kMinimo }) };
    });
    var peso = { elevada: 0, moderada: 1, baixa: 2, indefinida: 3 };
    ranking.sort(function (a, b) { return peso[a.p.tensao] - peso[b.p.tensao] || (a.p.indice || 100) - (b.p.indice || 100); });
    $("#lista-tensao").innerHTML = ranking.map(function (r) {
      return '<li><button type="button" class="linha-turma" data-turma="' + esc(r.turma) + '">' +
        '<span class="lt-nome">' + esc(r.turma) + "</span>" +
        '<span class="lt-indice">' + (r.p.indice == null ? "—" : r.p.indice + "/100") + "</span>" +
        etiqueta("tensao-" + r.p.tensao, ROTULO_TENSAO[r.p.tensao]) +
        '<span class="lt-motivo">' + esc(r.p.alertas.map(function (a) { return a.titulo; }).join("; ") || "Sem alerta de turma") + "</span></button></li>";
    }).join("");
    $$("#lista-tensao [data-turma]").forEach(function (b) {
      b.onclick = function () { filtroTurmaEstudantes = b.dataset.turma; $("#filtro-turma").value = b.dataset.turma; renderTurmas(); abas.ativar("painel-turmas"); };
    });
  }

  /* ---------------- alertas ---------------- */
  function configurarFiltros() {
    ["#filtro-status", "#filtro-grau", "#filtro-origem"].forEach(function (s) { $(s).onchange = renderAlertas; });
    $("#filtro-nivel").onchange = renderRelatos;
    $("#filtro-turma").onchange = function () { filtroTurmaEstudantes = this.value; renderTurmas(); };
    $("#busca-aluno").oninput = UI.debounce(renderTurmas, 150);
    $("#filtro-turma-q").onchange = renderQuestionarios;
    $("#filtro-perfil").onchange = renderAcessos;
    $("#nova-intervencao").onclick = function () { dialogoIntervencao(null); };
    $("#exportar-relatorio").onclick = exportarRelatorio;
    $("#novo-questionario").onclick = dialogoQuestionario;
    $("#nova-conta").onclick = dialogoNovaConta;
    $("#nova-turma").onclick = dialogoNovaTurma;
  }

  function itemAlerta(a) {
    var anon = !a.estudanteUid;
    return '<li data-nivel="' + (a.grauRisco === "alto" ? "alto" : "medio") + '" class="' + (a.lido ? "" : "nao-lido") + '">' +
      '<span class="avatar">' + (anon ? icone("visibility_off") : esc(UI.iniciais(a.estudanteNome))) + "</span>" +
      '<div class="alerta-corpo"><div class="quem">' + esc(anon ? "Estudante anônimo" : a.estudanteNome) + " " +
      etiqueta(a.grauRisco === "alto" ? "alto" : "medio", ROTULO_GRAU[a.grauRisco]) +
      (a.prioritario ? ' <span class="etiqueta prioritario">' + icone("emergency") + "Prioritário</span>" : "") +
      (a.lido ? "" : ' <span class="etiqueta novo-item">Não lido</span>') + "</div>" +
      '<div class="detalhe">' + esc(a.motivo) + "</div>" +
      '<div class="meta">' + esc(N.ORIGENS[a.origem] || a.origem) + (a.turma ? ", " + esc(a.turma) : "") + ", " + UI.quando(a.criadoEm) + " " +
      etiqueta("status-" + a.status, N.STATUS_ALERTA[a.status]) + "</div></div>" +
      '<div class="alerta-acoes"><button type="button" class="btn discreto pequeno" data-ver="' + a.id + '">' + icone("visibility") + "<span>Detalhes</span></button>" +
      (a.status !== "resolvido" ? '<button type="button" class="btn principal pequeno" data-agir="' + a.id + '">' + icone("handshake") + "<span>Registrar ação</span></button>" : "") +
      "</div></li>";
  }

  function renderAlertas() {
    var st = $("#filtro-status").value, gr = $("#filtro-grau").value, org = $("#filtro-origem").value;
    var lista = E.alertas.filter(function (a) {
      var porStatus = !st || (st === "abertos" ? a.status !== "resolvido" : a.status === st);
      return porStatus && (!gr || a.grauRisco === gr) && (!org || a.origem === org);
    }).sort(function (a, b) {
      var pa = a.prioritario && a.status === "novo" ? 1 : 0, pb = b.prioritario && b.status === "novo" ? 1 : 0;
      return pb - pa || (a.criadoEm < b.criadoEm ? 1 : -1);
    });
    $("#lista-alertas").innerHTML = lista.length ? lista.map(itemAlerta).join("") : '<li class="vazio">Nenhum alerta com esses filtros.</li>';
    $$("#lista-alertas [data-ver]").forEach(function (b) { b.onclick = function () { abrirAlerta(porId(E.alertas, b.dataset.ver)); }; });
    $$("#lista-alertas [data-agir]").forEach(function (b) { b.onclick = function () { dialogoIntervencao(porId(E.alertas, b.dataset.agir)); }; });
  }
  function porId(lista, id) { return lista.filter(function (x) { return x.id === id; })[0]; }

  function detalheOrigem(a) {
    if (a.origem === "relato") {
      var r = porId(E.relatos, a.referenciaId);
      if (!r) return "<p class=\"sub\">Relato não encontrado (pode ter sido apagado pela política de retenção).</p>";
      if (!r.lido) S.marcarRelatoLido(sessao, r);
      return '<div class="bloco-relato"><p class="rel-nivel">' + icone(N.NIVEIS_PRIVACIDADE[r.nivelPrivacidade].icone) + esc(N.NIVEIS_PRIVACIDADE[r.nivelPrivacidade].rotulo) + "</p>" +
        "<h3>" + esc(r.titulo) + "</h3><p class=\"texto-relato\">" + esc(r.descricao) + "</p></div>";
    }
    if (a.origem === "checkin") {
      var c = porId(E.checkins, a.referenciaId);
      if (!c) return "";
      var est = N.ESTADOS.filter(function (x) { return x.valor === c.estadoSocioemocional; })[0];
      return '<dl class="dl-linhas"><div><dt>Como estava</dt><dd>' + esc(est ? est.rotulo : c.estadoSocioemocional) + "</dd></div>" +
        "<div><dt>Palavra escolhida</dt><dd>" + esc(c.sentimentoSugerido || "—") + "</dd></div>" +
        "<div><dt>Anotação</dt><dd>" + esc(c.notas || "Sem anotação") + "</dd></div></dl>";
    }
    if (a.origem === "questionario") {
      var q = porId(E.respostas, a.referenciaId);
      if (!q) return "";
      return '<dl class="dl-linhas"><div><dt>Índice de convivência</dt><dd>' + q.indice + "/100</dd></div>" +
        Object.keys(q.dimensoes || {}).map(function (d) { return "<div><dt>" + esc(N.DIMENSOES[d] || d) + "</dt><dd>" + q.dimensoes[d] + "/100</dd></div>"; }).join("") + "</dl>";
    }
    if (a.origem === "assistente") return '<p class="sub">O texto da conversa não é armazenado (minimização de dados). Converse com o estudante para entender o contexto.</p>';
    return "";
  }

  function abrirAlerta(a) {
    if (!a) return;
    S.marcarAlertaLido(sessao, a);
    var hist = (a.historico || []).map(function (h) {
      var iv = porId(E.intervencoes, h.intervencaoId);
      return "<li>" + UI.fmtData(h.data) + ": " + esc(N.STATUS_ALERTA[h.de] || h.de) + " → " + esc(N.STATUS_ALERTA[h.para] || h.para) + ", por " + esc(h.por) + (iv ? " (" + esc(iv.tipo) + ")" : "") + "</li>";
    }).join("");
    UI.dialogo({
      titulo: a.estudanteNome || "Estudante anônimo",
      largo: true,
      html:
        '<p class="nota-ia">' + icone("info") + "<span>Sinal automático para triagem. Não é diagnóstico: confirme com escuta antes de qualquer decisão.</span></p>" +
        '<dl class="dl-grade"><div><dt>Turma</dt><dd>' + esc(a.turma || "não informada") + "</dd></div>" +
        "<div><dt>Origem</dt><dd>" + esc(N.ORIGENS[a.origem] || a.origem) + "</dd></div>" +
        "<div><dt>Grau</dt><dd>" + etiqueta(a.grauRisco === "alto" ? "alto" : "medio", ROTULO_GRAU[a.grauRisco]) + (a.prioritario ? " " + etiqueta("prioritario", "Prioritário") : "") + "</dd></div>" +
        "<div><dt>Gerado</dt><dd>" + UI.fmtData(a.criadoEm) + "</dd></div>" +
        "<div><dt>Status</dt><dd>" + etiqueta("status-" + a.status, N.STATUS_ALERTA[a.status]) + "</dd></div>" +
        "<div><dt>Revisão humana</dt><dd>" + (a.revisaoHumana === "realizada" ? "Realizada" : "Pendente") + "</dd></div></dl>" +
        "<h3 class=\"mini-titulo\">Motivo</h3><p>" + esc(a.motivo) + "</p>" +
        (a.categorias && a.categorias.length ? '<p class="chips-linha">' + a.categorias.map(function (c) { return etiqueta("cat", IA.ROTULOS[c] || c); }).join(" ") + "</p>" : "") +
        detalheOrigem(a) +
        (hist ? '<h3 class="mini-titulo">Histórico</h3><ul class="historico">' + hist + "</ul>" : ""),
      acoes: a.status === "resolvido"
        ? [{ rotulo: "Fechar", tipo: "discreto" }]
        : [{ rotulo: "Fechar", tipo: "discreto" }, { rotulo: "Registrar ação", tipo: "principal", icone: "handshake", acao: function () { setTimeout(function () { dialogoIntervencao(a); }, 50); } }]
    });
  }

  /* ---------------- RF06 / RN07: registrar intervenção ---------------- */
  function dialogoIntervencao(alerta) {
    var alunos = estudantes().sort(function (a, b) { return a.nome.localeCompare(b.nome, "pt-BR"); });
    var turmas = turmasNomes();
    var anon = alerta && !alerta.estudanteUid;
    var dinamicas = N.dinamicasPara(alerta ? alerta.categorias.filter(function (c) { return c !== "SITUACAO_DE_RISCO"; }) : []);
    var html =
      (alerta ? '<p class="resumo-alerta">' + icone("notifications") + "<span><b>" + esc(alerta.estudanteNome || "Estudante anônimo") + "</b>: " + esc(alerta.motivo) + "</span></p>" : "") +
      '<fieldset class="opcoes-linha"><legend>Para quem é a ação?</legend>' +
      '<label class="radio"><input type="radio" name="alvo" value="estudante"' + (anon ? " disabled" : " checked") + "><span>Estudante</span></label>" +
      '<label class="radio"><input type="radio" name="alvo" value="turma"' + (anon ? " checked" : "") + "><span>Turma inteira</span></label></fieldset>" +
      (anon ? '<p class="sub">Alerta anônimo: a ação só pode ser registrada para a turma.</p>' : "") +
      '<div class="linha-campos">' +
      '<label class="campo" data-campo-estudante><span>Estudante</span><select id="iv-estudante"' + (alerta && !anon ? " disabled" : "") + '><option value="">Escolha</option>' +
      alunos.map(function (u) { return '<option value="' + u.id + '"' + (alerta && alerta.estudanteUid === u.id ? " selected" : "") + ">" + esc(u.nome + " (" + (u.turma || "sem turma") + ")") + "</option>"; }).join("") + "</select></label>" +
      '<label class="campo" data-campo-turma><span>Turma</span><select id="iv-turma"><option value="">Escolha</option>' +
      turmas.map(function (t) { return '<option' + (alerta && alerta.turma === t ? " selected" : "") + ">" + esc(t) + "</option>"; }).join("") + "</select></label></div>" +
      '<div class="linha-campos"><label class="campo"><span>Tipo de ação</span><select id="iv-tipo"><option value="">Escolha</option>' +
      N.TIPOS_INTERVENCAO.map(function (t) { return "<option>" + esc(t) + "</option>"; }).join("") + "</select></label>" +
      '<label class="campo"><span>Dinâmica usada <small>(opcional)</small></span><select id="iv-dinamica"><option value="">Nenhuma</option>' +
      dinamicas.map(function (d) { return '<option value="' + d.id + '">' + esc(d.titulo) + "</option>"; }).join("") + "</select></label></div>" +
      '<label class="campo"><span>O que foi feito</span><textarea id="iv-descricao" rows="3" maxlength="1000" placeholder="Ex.: conversa individual, combinados com a turma, contato com a família…"></textarea></label>' +
      '<div class="linha-campos"><label class="campo"><span>Situação da intervenção</span><select id="iv-status">' +
      Object.keys(N.STATUS_INTERVENCAO).map(function (k) { return '<option value="' + k + '"' + (k === "em_andamento" ? " selected" : "") + ">" + N.STATUS_INTERVENCAO[k] + "</option>"; }).join("") + "</select></label>" +
      (alerta ? '<label class="campo"><span>Novo status do alerta</span><select id="iv-status-alerta">' +
        '<option value="em_acompanhamento">Em acompanhamento</option><option value="resolvido">Resolvido</option><option value="">Manter como está</option></select></label>' : "") +
      "</div>";

    UI.dialogo({
      titulo: "Registrar intervenção",
      largo: true,
      html: html,
      aoAbrir: function (d) {
        function alternar() {
          var alvo = $('input[name="alvo"]:checked', d).value;
          $("[data-campo-estudante]", d).classList.toggle("oculto", alvo !== "estudante");
        }
        $$('input[name="alvo"]', d).forEach(function (r) { r.onchange = alternar; });
        $("#iv-estudante", d).onchange = function () {
          var u = porId(alunos, this.value);
          if (u && u.turma) $("#iv-turma", d).value = u.turma;
        };
        alternar();
      },
      acoes: [
        { rotulo: "Cancelar", tipo: "discreto" },
        { rotulo: "Salvar intervenção", tipo: "principal", icone: "check", acao: function (d) {
          var alvo = $('input[name="alvo"]:checked', d).value;
          var uid = $("#iv-estudante", d).value;
          var u = porId(alunos, uid);
          return S.registrarIntervencao(sessao, {
            alertaId: alerta ? alerta.id : null,
            novoStatusAlerta: alerta ? $("#iv-status-alerta", d).value : null,
            alvoTipo: alvo,
            estudanteUid: alvo === "estudante" ? uid : null,
            estudanteNome: alvo === "estudante" && u ? u.nome : null,
            turma: $("#iv-turma", d).value || (u && u.turma) || null,
            tipo: $("#iv-tipo", d).value,
            dinamicaId: $("#iv-dinamica", d).value || null,
            descricao: $("#iv-descricao", d).value,
            status: $("#iv-status", d).value
          }, contexto()).then(function () { UI.aviso("Intervenção registrada."); });
        } }
      ]
    });
  }

  /* ---------------- relatos ---------------- */
  function renderRelatos() {
    var nivel = $("#filtro-nivel").value;
    var lista = E.relatos.filter(function (r) { return !nivel || r.nivelPrivacidade === nivel; })
      .sort(function (a, b) { return a.dataEnvio < b.dataEnvio ? 1 : -1; });
    var naoLidos = E.relatos.filter(function (r) { return !r.lido; }).length;
    var cont = $("#cont-relatos");
    cont.textContent = naoLidos; cont.classList.toggle("oculto", !naoLidos);
    $("#lista-relatos").innerHTML = lista.length ? lista.map(function (r) {
      var n = N.NIVEIS_PRIVACIDADE[r.nivelPrivacidade];
      var an = r.analise || {};
      return '<li class="relato-item nivel-' + r.nivelPrivacidade.toLowerCase() + (r.lido ? "" : " nao-lido") + '">' +
        '<span class="relato-nivel">' + icone(n.icone) + esc(n.rotulo) + "</span>" +
        '<div class="relato-corpo"><b>' + esc(r.titulo) + "</b>" +
        '<span class="meta">' + esc(r.autorNome || "Anônimo") + (r.turma ? ", " + esc(r.turma) : "") + ", " + UI.quando(r.dataEnvio) + "</span>" +
        '<span class="chips-linha">' + etiqueta("cat", IA.ROTULOS[an.classe] || "—") + " " +
        (an.grauRisco && an.grauRisco !== "baixo" ? etiqueta(an.grauRisco === "alto" ? "alto" : "medio", ROTULO_GRAU[an.grauRisco]) : "") +
        (r.lido ? "" : ' <span class="etiqueta novo-item">Não lido</span>') + "</span></div>" +
        '<button type="button" class="btn discreto pequeno" data-ler="' + r.id + '">' + icone("menu_book") + "<span>Ler</span></button></li>";
    }).join("") : '<li class="vazio">Nenhum relato.</li>';
    $$("#lista-relatos [data-ler]").forEach(function (b) { b.onclick = function () { abrirRelato(porId(E.relatos, b.dataset.ler)); }; });
  }

  function abrirRelato(r) {
    S.marcarRelatoLido(sessao, r);
    var n = N.NIVEIS_PRIVACIDADE[r.nivelPrivacidade];
    var an = r.analise || {};
    var alerta = E.alertas.filter(function (a) { return a.referenciaId === r.id; })[0];
    UI.dialogo({
      titulo: r.titulo,
      largo: true,
      html: '<dl class="dl-grade"><div><dt>Nível</dt><dd>' + icone(n.icone) + " " + esc(n.rotulo) + "</dd></div>" +
        "<div><dt>Quem enviou</dt><dd>" + esc(r.autorNome || "Anônimo") + "</dd></div>" +
        "<div><dt>Turma</dt><dd>" + esc(r.turma || "não informada") + "</dd></div>" +
        "<div><dt>Enviado</dt><dd>" + (r.nivelPrivacidade === "ANONIMO" ? "por volta de " : "") + UI.fmtData(r.dataEnvio) + "</dd></div></dl>" +
        '<p class="texto-relato">' + esc(r.descricao) + "</p>" +
        '<p class="nota-ia">' + icone("smart_toy") + "<span>Leitura da IA: " + esc(IA.ROTULOS[an.classe] || "—") +
        (an.origemRisco === "ia" ? ", com sinais de situação de risco" : "") + " (confiança estimada " + (an.confianca || 0) + "%). " +
        (an.termos && an.termos.length ? "Expressões que pesaram: " + esc(an.termos.join(", ")) + ". " : "") + "É uma triagem, não um diagnóstico.</span></p>",
      acoes: alerta && alerta.status !== "resolvido"
        ? [{ rotulo: "Fechar", tipo: "discreto" }, { rotulo: "Registrar ação", tipo: "principal", icone: "handshake", acao: function () { setTimeout(function () { dialogoIntervencao(alerta); }, 50); } }]
        : [{ rotulo: "Fechar", tipo: "discreto" }]
    });
  }

  /* ---------------- RF07: eficácia e lista de intervenções ---------------- */
  function renderIntervencoes() {
    var ef = S.eficacia(E.intervencoes, contexto());
    $("#metodo-eficacia").textContent = "Compara o bem-estar médio (0 a 100) do estudante ou da turma nos " + Config.janelaEficaciaDias +
      " dias antes da ação com os dias seguintes. A avaliação só acontece depois de 7 dias e com pelo menos 2 registros em cada período. Melhora: +5 pontos ou mais; piora: −5 ou menos.";
    var emObs = ef.itens.length - ef.avaliadas;
    $("#kpis-eficacia").innerHTML =
      kpi("Intervenções avaliadas", String(ef.avaliadas), emObs + " em observação") +
      kpi("Com melhora", ef.avaliadas ? Math.round(ef.melhora / ef.avaliadas * 100) + "%" : "—", ef.melhora + " de " + ef.avaliadas, "alta") +
      kpi("Variação média", ef.variacaoMedia == null ? "—" : (ef.variacaoMedia > 0 ? "+" : "") + ef.variacaoMedia + " pts", "no índice de bem-estar") +
      kpi("Estável ou piora", String(ef.estavel + ef.piora), ef.estavel + " estável, " + ef.piora + " piora");

    $("#eficacia-tipos").innerHTML = ef.porTipo.length ? ef.porTipo.map(function (t) {
      var v = Math.max(-50, Math.min(50, t.variacaoMedia));
      var largura = Math.abs(v) / 50 * 50;
      return '<div class="barra-div"><span class="barra-h-rotulo">' + esc(t.tipo) + " <small>(" + t.n + ")</small></span>" +
        '<span class="barra-div-trilho"><i class="' + (v >= 0 ? "pos" : "neg") + '" style="width:' + largura + "%;" + (v >= 0 ? "left:50%" : "right:50%") + '"></i></span>' +
        '<b class="barra-h-valor">' + (t.variacaoMedia > 0 ? "+" : "") + t.variacaoMedia + "</b></div>";
    }).join("") : '<p class="sub">Ainda não há intervenções com tempo suficiente para avaliação.</p>';

    var medidas = {};
    ef.itens.forEach(function (x) { medidas[x.intervencao.id] = x.medida; });
    var lista = E.intervencoes.slice().sort(function (a, b) { return a.dataRegistro < b.dataRegistro ? 1 : -1; });
    $("#tabela-intervencoes").innerHTML = lista.length ? lista.map(function (iv) {
      var m = medidas[iv.id] || {};
      return '<tr><td data-label="Data">' + UI.fmtData(iv.dataRegistro, false) + "</td>" +
        '<td data-label="Ação"><b>' + esc(iv.tipo) + '</b><br><small class="descricao-curta" title="' + esc(iv.descricao) + '">' + esc(iv.descricao) + "</small></td>" +
        '<td data-label="Para">' + esc(iv.alvoTipo === "estudante" ? iv.estudanteNome : "Turma " + iv.turma) + "</td>" +
        '<td data-label="Responsável">' + esc(iv.responsavel) + "</td>" +
        '<td data-label="Status">' + etiqueta("iv-" + iv.status, N.STATUS_INTERVENCAO[iv.status]) + "</td>" +
        '<td data-label="Antes → depois">' + (m.antes == null ? "—" : m.antes) + " → " + (m.depois == null ? "—" : m.depois) + "</td>" +
        '<td data-label="Resultado">' + etiqueta("res-" + (m.resultado || "insuficiente"), ROTULO_RESULTADO[m.resultado || "insuficiente"]) + "</td>" +
        '<td data-label="Ações"><button type="button" class="btn discreto pequeno" data-iv="' + iv.id + '">' + icone("edit") + "<span>Atualizar</span></button></td></tr>";
    }).join("") : '<tr><td colspan="8" class="vazio">Nenhuma intervenção registrada.</td></tr>';
    $$("#tabela-intervencoes [data-iv]").forEach(function (b) { b.onclick = function () { dialogoStatusIntervencao(porId(E.intervencoes, b.dataset.iv)); }; });
  }

  function dialogoStatusIntervencao(iv) {
    var hist = (iv.historico || []).map(function (h) { return "<li>" + UI.fmtData(h.data) + ": " + esc(N.STATUS_INTERVENCAO[h.status] || h.status) + ", " + esc(h.por) + (h.nota ? ". " + esc(h.nota) : "") + "</li>"; }).join("");
    UI.dialogo({
      titulo: iv.tipo,
      html: "<p>" + esc(iv.descricao) + "</p>" +
        '<label class="campo"><span>Situação</span><select id="nv-status">' +
        Object.keys(N.STATUS_INTERVENCAO).map(function (k) { return '<option value="' + k + '"' + (k === iv.status ? " selected" : "") + ">" + N.STATUS_INTERVENCAO[k] + "</option>"; }).join("") + "</select></label>" +
        '<label class="campo"><span>Observação <small>(opcional)</small></span><input type="text" id="nv-nota" maxlength="300"></label>' +
        (hist ? '<h3 class="mini-titulo">Histórico</h3><ul class="historico">' + hist + "</ul>" : ""),
      acoes: [
        { rotulo: "Cancelar", tipo: "discreto" },
        { rotulo: "Salvar", tipo: "principal", acao: function (d) {
          return S.atualizarIntervencao(sessao, iv, $("#nv-status", d).value, $("#nv-nota", d).value).then(function () { UI.aviso("Intervenção atualizada."); });
        } }
      ]
    });
  }

  /* ---------------- turmas e estudantes ---------------- */
  function renderTurmas() {
    var turmas = turmasNomes();
    var sel = $("#filtro-turma");
    if (sel.options.length !== turmas.length + 1) {
      sel.innerHTML = '<option value="">Todas as turmas</option>' + turmas.map(function (t) { return "<option>" + esc(t) + "</option>"; }).join("");
      $("#filtro-turma-q").innerHTML = '<option value="">Escola toda</option>' + turmas.map(function (t) { return "<option>" + esc(t) + "</option>"; }).join("");
    }
    sel.value = filtroTurmaEstudantes;
    var profs = E.usuarios.filter(function (u) { return u.perfil === "professor"; });
    $("#cards-turmas").innerHTML = turmas.map(function (t) {
      var p = IA.padroesTurma(E.insights.filter(function (e) { return e.turma === t; }), { kMinimo: Config.kMinimo });
      var nomesProf = profs.filter(function (u) { return (u.turmas || []).indexOf(t) !== -1; }).map(function (u) { return u.nome; });
      var nAlunos = estudantes().filter(function (u) { return u.turma === t; }).length;
      return '<button type="button" class="turma-card' + (filtroTurmaEstudantes === t ? " ativo" : "") + '" data-turma="' + esc(t) + '" aria-pressed="' + (filtroTurmaEstudantes === t) + '">' +
        '<span class="turma-icone material-symbols-outlined" aria-hidden="true">school</span>' +
        '<span class="turma-nome">' + esc(t) + "</span>" +
        '<span class="turma-meta">' + esc(nomesProf.join(", ") || "Sem professor vinculado") + "</span>" +
        '<span class="turma-numeros"><b>' + nAlunos + "</b> estudantes, <b>" + p.registros7 + "</b> registros em 7 dias</span>" +
        '<span class="turma-bem">Clima <b>' + (p.indice == null ? "—" : p.indice + "/100") + "</b>" + etiqueta("tensao-" + p.tensao, ROTULO_TENSAO[p.tensao]) + "</span></button>";
    }).join("");
    $$("#cards-turmas .turma-card").forEach(function (b) {
      b.onclick = function () {
        filtroTurmaEstudantes = filtroTurmaEstudantes === b.dataset.turma ? "" : b.dataset.turma;
        renderTurmas();
      };
    });

    var busca = $("#busca-aluno").value.trim().toLowerCase();
    var lista = estudantes().filter(function (u) {
      return (!filtroTurmaEstudantes || u.turma === filtroTurmaEstudantes) && (!busca || (u.nome + " " + u.email).toLowerCase().indexOf(busca) !== -1);
    }).map(function (u) {
      var serie = N.Indicadores.serieEstudante(u.id, E.checkins, E.respostas);
      var bem = N.Indicadores.mediaRecente(serie, 14);
      var ult = E.checkins.filter(function (c) { return c.autorUid === u.id; }).sort(function (a, b) { return a.dataHora < b.dataHora ? 1 : -1; })[0];
      return { u: u, bem: bem.media, ult: ult, sit: N.Indicadores.situacaoEstudante(u.id, E.alertas) };
    }).sort(function (a, b) {
      var p = { alto: 0, moderado: 1, baixo: 2 };
      return p[a.sit] - p[b.sit] || (a.bem == null ? 101 : a.bem) - (b.bem == null ? 101 : b.bem);
    });
    $("#resumo-estudantes").textContent = lista.length + " estudante(s)" + (filtroTurmaEstudantes ? " em " + filtroTurmaEstudantes : "") + ". Ordenado por quem precisa de mais atenção.";
    var ROT_SIT = { alto: "Atenção alta", moderado: "Atenção moderada", baixo: "Sem alerta aberto" };
    $("#tabela-estudantes").innerHTML = lista.map(function (x) {
      return '<tr><td data-label="Estudante"><span class="avatar">' + esc(UI.iniciais(x.u.nome)) + "</span>" + esc(x.u.nome) + "</td>" +
        '<td data-label="Turma">' + esc(x.u.turma || "—") + "</td>" +
        '<td data-label="Último check-in">' + (x.ult ? UI.quando(x.ult.dataHora) : "Nenhum") + "</td>" +
        '<td data-label="Bem-estar (14 dias)">' + (x.bem == null ? "—" : '<div class="bem-linha"><span>' + x.bem + '/100</span><span class="barra-mini"><i style="width:' + x.bem + '%"></i></span></div>') + "</td>" +
        '<td data-label="Situação">' + etiqueta(x.sit === "alto" ? "alto" : x.sit === "moderado" ? "medio" : "baixo", ROT_SIT[x.sit]) + "</td>" +
        '<td data-label="Ações"><button type="button" class="btn discreto pequeno" data-hist="' + x.u.id + '">' + icone("timeline") + "<span>Histórico</span></button></td></tr>";
    }).join("") || '<tr><td colspan="6" class="vazio">Nenhum estudante encontrado.</td></tr>';
    $$("#tabela-estudantes [data-hist]").forEach(function (b) { b.onclick = function () { abrirHistorico(porId(E.usuarios, b.dataset.hist)); }; });
  }

  function abrirHistorico(u) {
    var serie = N.Indicadores.serieEstudante(u.id, E.checkins, E.respostas);
    var hoje = new Date(), pts = [];
    for (var i = 27; i >= 0; i--) {
      var d = new Date(hoje); d.setDate(d.getDate() - i);
      var dia = IA.diaISO(d);
      var v = serie.filter(function (p) { return IA.diaISO(p.data) === dia; }).map(function (p) { return p.valor; });
      pts.push({ rotulo: dia.slice(8, 10) + "/" + dia.slice(5, 7), valor: v.length ? Math.round(IA.media(v)) : null });
    }
    var alertas = E.alertas.filter(function (a) { return a.estudanteUid === u.id; }).sort(function (a, b) { return a.criadoEm < b.criadoEm ? 1 : -1; });
    var ivs = E.intervencoes.filter(function (i) { return i.estudanteUid === u.id; });
    UI.dialogo({
      titulo: u.nome,
      largo: true,
      html: '<p class="sub">' + esc(u.turma || "") + (u.matricula ? ", matrícula " + esc(u.matricula) : "") + ". Bem-estar (0 a 100) nos últimos 28 dias.</p>" +
        '<div id="hist-grafico" class="area-grafico"></div>' +
        '<h3 class="mini-titulo">Alertas</h3><ul class="historico">' + (alertas.map(function (a) {
          return "<li>" + UI.fmtData(a.criadoEm, false) + ": " + esc(a.motivo) + " " + etiqueta("status-" + a.status, N.STATUS_ALERTA[a.status]) + "</li>";
        }).join("") || "<li>Nenhum alerta.</li>") + "</ul>" +
        '<h3 class="mini-titulo">Intervenções</h3><ul class="historico">' + (ivs.map(function (i) {
          return "<li>" + UI.fmtData(i.dataRegistro, false) + ": " + esc(i.tipo) + " " + etiqueta("iv-" + i.status, N.STATUS_INTERVENCAO[i.status]) + "</li>";
        }).join("") || "<li>Nenhuma intervenção.</li>") + "</ul>",
      aoAbrir: function (d) {
        var marcas = ivs.map(function (i) { return IA.diaISO(i.dataRegistro); });
        UI.Graficos.linha($("#hist-grafico", d), pts, { referencia: 50, descricao: "Bem-estar diário de " + u.nome + " nos últimos 28 dias." + (marcas.length ? " Intervenções em " + marcas.join(", ") + "." : "") });
      },
      acoes: [{ rotulo: "Fechar", tipo: "discreto" }, { rotulo: "Registrar ação", tipo: "principal", icone: "handshake", acao: function () {
        setTimeout(function () { dialogoIntervencao(null); setTimeout(function () { var s = $("#iv-estudante"); if (s) { s.value = u.id; s.onchange && s.onchange(); } }, 30); }, 50);
      } }]
    });
  }

  /* RN05: relatório geral anonimizado por turma */
  function exportarRelatorio() {
    var linhas = [["Turma", "Registros (14 dias)", "Índice de clima (7 dias)", "Variação na semana", "Conflito (%)", "Exclusão (%)", "Sofrimento (%)", "Atenção"]];
    turmasNomes().forEach(function (t) {
      var p = IA.padroesTurma(E.insights.filter(function (e) { return e.turma === t; }), { kMinimo: Config.kMinimo });
      if (!p.suficiente) { linhas.push([t, p.registros14, "dados insuficientes", "", "", "", "", ROTULO_TENSAO[p.tensao]]); return; }
      linhas.push([t, p.registros14, p.indice, p.variacao == null ? "" : p.variacao,
        Math.round(p.proporcoes.CONFLITO * 100), Math.round(p.proporcoes.EXCLUSAO_SOCIAL * 100), Math.round(p.proporcoes.SOFRIMENTO_EMOCIONAL * 100), ROTULO_TENSAO[p.tensao]]);
    });
    var csv = linhas.map(function (l) { return l.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(";"); }).join("\n");
    UI.baixarArquivo("safemind-relatorio-turmas-" + IA.diaISO(new Date()) + ".csv", "\ufeff" + csv, "text/csv;charset=utf-8");
    UI.aviso("Relatório por turma baixado (sem nomes de estudantes).");
  }

  /* ---------------- RF02: questionários ---------------- */
  function renderQuestionarios() {
    var ativo = E.questionarios.filter(function (q) { return q.ativo; })[0] || N.QUESTIONARIO_PADRAO;
    var turma = $("#filtro-turma-q").value;
    var limite = new Date(Date.now() - 30 * 86400000).toISOString();
    var rs = E.respostas.filter(function (r) { return r.questionarioId === ativo.id && r.dataEnvio >= limite && (!turma || r.turma === turma); });
    $("#t-resultado-q").textContent = "Resultados: " + ativo.titulo;
    $("#sub-resultado-q").textContent = rs.length + " resposta(s) nos últimos 30 dias" + (turma ? " em " + turma : "") +
      ". Quanto maior, melhor a convivência (perguntas sobre algo ruim têm a escala invertida).";
    if (rs.length < Config.kMinimo) {
      $("#resultado-questionario").innerHTML = '<p class="sub">Menos de ' + Config.kMinimo + " respostas: resultado oculto para preservar o anonimato.</p>";
    } else {
      UI.Graficos.barrasH($("#resultado-questionario"), ativo.perguntas.map(function (p) {
        var v = rs.map(function (r) { return r.respostas[p.id]; }).filter(Boolean).map(function (x) { return ((p.invertida ? 6 - x : x) - 1) / 4 * 100; });
        var m = v.length ? Math.round(IA.media(v)) : null;
        return { rotulo: p.texto, valor: m, sufixo: "/100", classe: m == null ? "" : m < 50 ? "conflito" : m < 70 ? "sofrimento" : "ok" };
      }));
    }
    var lista = E.questionarios.length ? E.questionarios : [N.QUESTIONARIO_PADRAO];
    $("#lista-questionarios").innerHTML = lista.map(function (q) {
      return '<li><details><summary><b>' + esc(q.titulo) + "</b> " + (q.ativo ? etiqueta("status-ativo", "Ativo") : "") +
        '<span class="meta">' + esc(q.periodicidade) + ", " + q.perguntas.length + " pergunta(s)</span></summary><ol>" +
        q.perguntas.map(function (p) { return "<li>" + esc(p.texto) + " <small>(" + esc(N.DIMENSOES[p.dimensao] || p.dimensao) + (p.invertida ? ", escala invertida" : "") + ")</small></li>"; }).join("") +
        "</ol></details>" + (q.ativo || !q.criadoEm ? "" : '<button type="button" class="btn discreto pequeno" data-ativar="' + q.id + '">Ativar</button>') + "</li>";
    }).join("");
    $$("#lista-questionarios [data-ativar]").forEach(function (b) {
      b.onclick = function () { S.ativarQuestionario(sessao, b.dataset.ativar).then(function () { UI.aviso("Questionário ativado."); }); };
    });
  }

  function dialogoQuestionario() {
    var dims = Object.keys(N.DIMENSOES);
    function linha() {
      return '<div class="linha-pergunta"><input type="text" class="qp-texto" maxlength="160" placeholder="Texto da pergunta" aria-label="Texto da pergunta">' +
        '<select class="qp-dim" aria-label="Tema da pergunta">' + dims.map(function (d) { return '<option value="' + d + '">' + esc(N.DIMENSOES[d]) + "</option>"; }).join("") + "</select>" +
        '<label class="checkbox"><input type="checkbox" class="qp-inv"><span>Descreve algo ruim</span></label></div>';
    }
    UI.dialogo({
      titulo: "Novo questionário",
      largo: true,
      html: '<label class="campo"><span>Título</span><input type="text" id="q-titulo" maxlength="80"></label>' +
        '<label class="campo"><span>Orientação para o estudante</span><input type="text" id="q-desc" maxlength="160"></label>' +
        '<label class="campo"><span>Periodicidade</span><select id="q-per"><option value="semanal">Semanal</option><option value="quinzenal">Quinzenal</option><option value="mensal">Mensal</option></select></label>' +
        '<fieldset class="perguntas-editor"><legend>Perguntas (escala: Nunca, Raramente, Às vezes, Quase sempre, Sempre)</legend><div id="q-linhas">' + linha() + linha() + "</div>" +
        '<button type="button" class="btn discreto pequeno" id="q-add">' + icone("add") + "<span>Adicionar pergunta</span></button></fieldset>" +
        '<p class="sub">Marque “Descreve algo ruim” em perguntas como “Fui provocado(a)”, para que “Sempre” conte como sinal de atenção.</p>',
      aoAbrir: function (d) { $("#q-add", d).onclick = function () { $("#q-linhas", d).insertAdjacentHTML("beforeend", linha()); }; },
      acoes: [
        { rotulo: "Cancelar", tipo: "discreto" },
        { rotulo: "Salvar questionário", tipo: "principal", acao: function (d) {
          return S.salvarQuestionario(sessao, {
            titulo: $("#q-titulo", d).value, descricao: $("#q-desc", d).value, periodicidade: $("#q-per", d).value,
            perguntas: $$(".linha-pergunta", d).map(function (l) { return { texto: $(".qp-texto", l).value, dimensao: $(".qp-dim", l).value, invertida: $(".qp-inv", l).checked }; })
          }).then(function () { UI.aviso("Questionário salvo. Use “Ativar” para liberar aos estudantes."); });
        } }
      ]
    });
  }

  /* ---------------- RF08: acessos ---------------- */
  function renderAcessos() {
    $("#matriz-permissoes").innerHTML = N.PERMISSOES.map(function (p) {
      return '<tr><th scope="row">' + esc(p.descricao) + "</th>" + ["estudante", "professor", "coordenacao"].map(function (perf) {
        var ok = p.perfis.indexOf(perf) !== -1;
        return '<td class="' + (ok ? "permitido" : "negado") + '">' + icone(ok ? "check" : "remove") + '<span class="somente-leitor">' + (ok ? "permitido" : "não permitido") + "</span></td>";
      }).join("") + "</tr>";
    }).join("");
    var filtro = $("#filtro-perfil").value;
    var lista = E.usuarios.filter(function (u) { return !filtro || u.perfil === filtro; })
      .sort(function (a, b) { return a.perfil.localeCompare(b.perfil) || a.nome.localeCompare(b.nome, "pt-BR"); });
    $("#tabela-usuarios").innerHTML = lista.map(function (u) {
      var turmas = u.perfil === "estudante" ? (u.turma || "—") : u.perfil === "professor" ? ((u.turmas || []).join(", ") || "—") : "Todas";
      return '<tr><td data-label="Nome">' + esc(u.nome) + (u.id === sessao.uid ? " <small>(você)</small>" : "") + "</td>" +
        '<td data-label="E-mail">' + esc(u.email) + "</td>" +
        '<td data-label="Perfil">' + esc(N.PERFIS[u.perfil] ? N.PERFIS[u.perfil].rotulo : u.perfil) + "</td>" +
        '<td data-label="Turma(s)">' + esc(turmas) + "</td>" +
        '<td data-label="Acesso">' + (u.ativo === false ? etiqueta("alto", "Desativado") : etiqueta("baixo", "Ativo")) + "</td>" +
        '<td data-label="Ações"><button type="button" class="btn discreto pequeno" data-editar="' + u.id + '">' + icone("manage_accounts") + "<span>Editar</span></button></td></tr>";
    }).join("");
    $$("#tabela-usuarios [data-editar]").forEach(function (b) { b.onclick = function () { dialogoUsuario(porId(E.usuarios, b.dataset.editar)); }; });
  }

  function checkboxesTurmas(marcadas, prefixo) {
    return '<div class="grade-checks">' + turmasNomes().map(function (t, i) {
      return '<label class="checkbox"><input type="checkbox" class="' + prefixo + '" value="' + esc(t) + '"' + (marcadas.indexOf(t) !== -1 ? " checked" : "") + ' id="' + prefixo + i + '"><span>' + esc(t) + "</span></label>";
    }).join("") + "</div>";
  }

  function dialogoUsuario(u) {
    UI.dialogo({
      titulo: "Editar acesso de " + u.nome,
      html: '<label class="campo"><span>Perfil</span><select id="ed-perfil">' +
        Object.keys(N.PERFIS).map(function (k) { return '<option value="' + k + '"' + (k === u.perfil ? " selected" : "") + ">" + N.PERFIS[k].rotulo + "</option>"; }).join("") + "</select></label>" +
        '<label class="campo" data-ed="estudante"><span>Turma</span><select id="ed-turma"><option value="">Sem turma</option>' +
        turmasNomes().map(function (t) { return "<option" + (u.turma === t ? " selected" : "") + ">" + esc(t) + "</option>"; }).join("") + "</select></label>" +
        '<fieldset data-ed="professor"><legend>Turmas do professor</legend>' + checkboxesTurmas(u.turmas || [], "ed-t") + "</fieldset>" +
        '<label class="checkbox"><input type="checkbox" id="ed-ativo"' + (u.ativo === false ? "" : " checked") + "><span>Acesso ativo</span></label>",
      aoAbrir: function (d) {
        function alternar() {
          var p = $("#ed-perfil", d).value;
          $$("[data-ed]", d).forEach(function (el) { el.classList.toggle("oculto", el.dataset.ed !== p); });
        }
        $("#ed-perfil", d).onchange = alternar;
        alternar();
      },
      acoes: [
        { rotulo: "Cancelar", tipo: "discreto" },
        { rotulo: "Salvar", tipo: "principal", acao: function (d) {
          var perfil = $("#ed-perfil", d).value;
          return S.atualizarUsuario(sessao, u.id, {
            perfil: perfil,
            turma: perfil === "estudante" ? ($("#ed-turma", d).value || null) : null,
            turmas: perfil === "professor" ? $$(".ed-t:checked", d).map(function (c) { return c.value; }) : [],
            ativo: $("#ed-ativo", d).checked
          }).then(function () { UI.aviso("Acesso de " + u.nome + " atualizado."); });
        } }
      ]
    });
  }

  function dialogoNovaConta() {
    UI.dialogo({
      titulo: "Nova conta da equipe",
      html: '<label class="campo"><span>Nome completo</span><input type="text" id="nc-nome"></label>' +
        '<label class="campo"><span>E-mail</span><input type="email" id="nc-email" autocomplete="off"></label>' +
        '<label class="campo"><span>Senha inicial</span><input type="text" id="nc-senha" autocomplete="off" minlength="6"></label>' +
        '<label class="campo"><span>Perfil</span><select id="nc-perfil"><option value="professor">Professor(a)</option><option value="coordenacao">Coordenação/Psicologia</option></select></label>' +
        '<div data-nc="professor"><label class="campo"><span>Disciplina <small>(opcional)</small></span><input type="text" id="nc-esp"></label>' +
        '<fieldset><legend>Turmas</legend>' + checkboxesTurmas([], "nc-t") + "</fieldset></div>" +
        '<label class="campo oculto" data-nc="coordenacao"><span>Cargo</span><input type="text" id="nc-cargo" placeholder="Ex.: Psicóloga escolar"></label>',
      aoAbrir: function (d) {
        $("#nc-perfil", d).onchange = function () {
          var p = this.value;
          $$("[data-nc]", d).forEach(function (el) { el.classList.toggle("oculto", el.dataset.nc !== p); });
        };
      },
      acoes: [
        { rotulo: "Cancelar", tipo: "discreto" },
        { rotulo: "Criar conta", tipo: "principal", acao: function (d) {
          return S.criarContaEquipe(sessao, {
            nome: $("#nc-nome", d).value, email: $("#nc-email", d).value, senha: $("#nc-senha", d).value,
            perfil: $("#nc-perfil", d).value, turmas: $$(".nc-t:checked", d).map(function (c) { return c.value; }),
            especializacao: $("#nc-esp", d).value, cargo: $("#nc-cargo", d).value
          }).then(function () { UI.aviso("Conta criada. Entregue a senha inicial à pessoa por um canal seguro."); });
        } }
      ]
    });
  }

  function dialogoNovaTurma() {
    UI.dialogo({
      titulo: "Nova turma",
      html: '<label class="campo"><span>Nome</span><input type="text" id="nt-nome" placeholder="Ex.: 6º Ano B"></label>' +
        '<label class="campo"><span>Turno</span><select id="nt-turno"><option>Matutino</option><option>Vespertino</option><option>Noturno</option><option>Integral</option></select></label>',
      acoes: [
        { rotulo: "Cancelar", tipo: "discreto" },
        { rotulo: "Criar turma", tipo: "principal", acao: function (d) {
          return Promise.resolve(S.criarTurma(sessao, $("#nt-nome", d).value, $("#nt-turno", d).value)).then(function () { UI.aviso("Turma criada."); });
        } }
      ]
    });
  }

  /* ---------------- RNF03, RN02, RNF01 ---------------- */
  function pct(v) { return (v * 100).toFixed(0) + "%"; }
  function dec(v) { return v.toFixed(2).replace(".", ","); }

  function configurarConfiguracoes() {
    /* RNF03 */
    var m = IA.avaliarModelo();
    $("#nota-ia").textContent = "Avaliação feita agora sobre um conjunto de validação sintético com " + m.total +
      " frases, escrito pela equipe do projeto. Como o mesmo grupo escreveu as frases e o léxico, o resultado tende a ser otimista: a meta do RNF03 só fica comprovada com relatos reais anotados por profissionais.";
    $("#kpis-ia").innerHTML =
      kpi("F1 macro", dec(m.f1Macro), "meta ≥ " + dec(m.metas.f1Macro) + (m.atendeF1 ? ", atendida" : ", não atendida"), m.atendeF1 ? "alta" : "queda") +
      kpi("Revocação em “Situação de risco”", dec(m.recallRisco), "meta ≥ " + dec(m.metas.recallRisco) + (m.atendeRecall ? ", atendida" : ", não atendida"), m.atendeRecall ? "alta" : "queda") +
      kpi("Acurácia balanceada", dec(m.acuraciaBalanceada), "métrica complementar") +
      kpi("Falsos negativos de risco", String(m.falsosNegativosRisco), "casos de risco não detectados", m.falsosNegativosRisco ? "queda" : "alta");
    $("#tabela-classes").innerHTML = m.classes.map(function (c) {
      var p = m.porClasse[c];
      return '<tr><th scope="row">' + esc(m.rotulos[c]) + "</th><td>" + pct(p.precisao) + "</td><td>" + pct(p.revocacao) + "</td><td>" + dec(p.f1) + "</td><td>" + p.suporte + "</td></tr>";
    }).join("");
    var abrev = { SITUACAO_DE_RISCO: "Risco", CONFLITO: "Conflito", EXCLUSAO_SOCIAL: "Exclusão", SOFRIMENTO_EMOCIONAL: "Sofrimento", NEUTRO: "Sem sinal" };
    $("#matriz-confusao").innerHTML = '<caption class="somente-leitor">Linhas: classe esperada. Colunas: classe prevista.</caption><thead><tr><th scope="col">Esperado ↓ / Previsto →</th>' +
      m.classes.map(function (c) { return '<th scope="col">' + abrev[c] + "</th>"; }).join("") + "</tr></thead><tbody>" +
      m.classes.map(function (r) {
        return '<tr><th scope="row">' + abrev[r] + "</th>" + m.classes.map(function (p) {
          var v = m.matriz[r][p];
          return '<td class="' + (r === p ? "diagonal" : v ? "erro-celula" : "") + '">' + v + "</td>";
        }).join("") + "</tr>";
      }).join("") + "</tbody>";
    $("#resumo-erros").textContent = m.erros.length + " frase(s) classificada(s) de forma diferente do esperado";
    $("#lista-erros").innerHTML = m.erros.map(function (e) {
      return "<li>“" + esc(e.texto) + "”: esperado " + esc(m.rotulos[e.esperado]) + ", previsto " + esc(m.rotulos[e.previsto]) + "</li>";
    }).join("");
    $("#testar-frase").onclick = function () {
      var t = $("#frase-teste").value.trim();
      if (!t) return;
      var a = IA.analisarTexto(t);
      $("#resultado-teste").innerHTML = "Classe: <b>" + esc(a.rotulo) + "</b>. Grau: <b>" + esc(ROTULO_GRAU[a.grauRisco]) + "</b>. Confiança estimada: " + a.confianca + "%." +
        (a.termos.length ? " Expressões: " + esc(a.termos.join(", ")) + "." : "");
    };
    $("#frase-teste").onkeydown = function (e) { if (e.key === "Enter") { e.preventDefault(); $("#testar-frase").click(); } };

    /* RN02 – equipamento */
    function desenharDispositivo() {
      var d = SM.Dispositivo.atual();
      var alvo = $("#estado-dispositivo");
      if (d) {
        alvo.innerHTML = '<p class="estado-ok">' + icone("verified") + "<span>Este navegador está registrado como <b>" + esc(d.nome) + "</b>, por " + esc(d.registradoPor) + " em " + UI.fmtData(d.registradoEm, false) + ".</span></p>" +
          '<button type="button" class="btn discreto pequeno" id="remover-dispositivo">Remover registro</button>';
        $("#remover-dispositivo").onclick = function () { SM.Dispositivo.remover(sessao); desenharDispositivo(); UI.aviso("Registro removido."); };
      } else {
        alvo.innerHTML = '<label class="campo"><span>Nome do equipamento</span><input type="text" id="nome-equip" placeholder="Ex.: Laboratório 1 – PC 04" maxlength="60"></label>' +
          '<p class="erro oculto" id="erro-equip" role="alert"></p>' +
          '<button type="button" class="btn principal pequeno" id="registrar-equip">' + icone("computer") + "<span>Registrar este equipamento</span></button>";
        $("#registrar-equip").onclick = function () {
          try { SM.Dispositivo.registrar(sessao, $("#nome-equip").value); desenharDispositivo(); UI.aviso("Equipamento registrado."); }
          catch (e) { var el = $("#erro-equip"); el.textContent = e.message; el.classList.remove("oculto"); }
        };
      }
    }
    desenharDispositivo();

    /* RNF07 – política */
    S.obterConfigEscola().then(function (cfg) {
      var r = $('input[name="politica"][value="' + cfg.politicaDispositivo + '"]');
      if (r) r.checked = true;
      $("#hora-inicio").value = cfg.horarioInicio;
      $("#hora-fim").value = cfg.horarioFim;
    });
    $("#form-politica").onsubmit = function (e) {
      e.preventDefault();
      var erro = $("#erro-politica");
      erro.classList.add("oculto");
      var marcado = $('input[name="politica"]:checked');
      Promise.resolve().then(function () {
        return S.salvarConfigEscola(sessao, {
          politicaDispositivo: marcado ? marcado.value : "", horarioInicio: $("#hora-inicio").value, horarioFim: $("#hora-fim").value,
          diasLetivos: Config.configEscolaPadrao.diasLetivos
        });
      }).then(function () { UI.aviso("Política salva."); }).catch(function (err) { erro.textContent = err.message; erro.classList.remove("oculto"); });
    };

    /* RNF01 */
    $("#cfg-retencao").textContent = Config.retencaoDias;

    /* RN04 – notificações */
    var botaoNotif = $("#ativar-notificacoes");
    function estadoNotif() {
      if (!("Notification" in window)) { botaoNotif.disabled = true; botaoNotif.lastChild.textContent = "Navegador sem suporte a notificações"; return; }
      if (Notification.permission === "granted") { botaoNotif.disabled = true; botaoNotif.lastChild.textContent = "Notificações ativadas"; }
      if (Notification.permission === "denied") { botaoNotif.disabled = true; botaoNotif.lastChild.textContent = "Notificações bloqueadas no navegador"; }
    }
    botaoNotif.onclick = function () { Notification.requestPermission().then(estadoNotif); };
    estadoNotif();

    if (sessao.ambiente === "local") {
      $("#bloco-demo").classList.remove("oculto");
      var idade = SM.Semente.idadeDias();
      $("#info-demo").textContent = "Gerados " + (idade === 0 ? "hoje" : "há " + idade + " dia(s)") + ". Gerar de novo apaga o que foi registrado neste navegador e cria 4 semanas de dados fictícios até hoje.";
      $("#restaurar-demo").onclick = function () {
        UI.confirmar("Gerar dados de demonstração de novo?", "Tudo o que foi registrado no ambiente de demonstração deste navegador será substituído.", "Gerar de novo").then(function (ok) {
          if (!ok) return;
          var s = SM.Sessao.atual();
          SM.Semente.aplicar();
          var u = SM.Dados.Local;
          u.listar("usuarios", { email: s.email }).then(function (l) {
            if (l[0]) SM.Sessao.atualizar({ uid: l[0].id });
            location.reload();
          });
        });
      };
    }
  }
})();
