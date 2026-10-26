/* =====================================================================
   SafeMind 360 — APRESENTAÇÃO • Área do estudante
   Casos de uso: realizar check-in (RF01), responder questionário (RF02),
   enviar relato escolhendo o nível de privacidade (RF03/RN03) e
   receber dicas de bem-estar. Direitos do titular (RNF01).
   ===================================================================== */
(function () {
  "use strict";
  var SM = window.SafeMind, UI = SM.UI, N = SM.Negocio, S = SM.Servicos, IA = SM.MotorIA;
  var $ = UI.$, $$ = UI.$$, esc = UI.esc;
  var sessao, usuario;
  var meusCheckins = [];

  UI.iniciarPagina({ permissao: "checkin.registrar" }).then(function (r) {
    sessao = r.sessao;
    usuario = r.usuario;
    $("#saudacao").textContent = "Olá, " + sessao.nome.split(" ")[0] + "!";
    $("#dias-retencao").textContent = SM.Config.retencaoDias;
    verificarPolitica();
    montarCheckin();
    montarRelato();
    montarChat();
    montarAtividades();
    montarMeusDados();
    carregarQuestionario();
    SM.Dados.observar("checkins", { autorUid: sessao.uid }, function (lista) {
      meusCheckins = lista.sort(function (a, b) { return a.dataHora < b.dataHora ? -1 : 1; });
      desenharSemana();
      atualizarUltimoCheckin();
      atualizarDica();
      atualizarConquistas();
    });
    if (S.precisaConsentimento(usuario) || !sessao.turma) pedirConsentimento();
  }).catch(function (e) { console.warn("[SafeMind]", e.message); });

  /* ---------------- RN02: aviso de uso fora do equipamento da escola ---------------- */
  function verificarPolitica() {
    S.obterConfigEscola().then(function (cfg) {
      var p = SM.Dispositivo.verificarPolitica(cfg);
      var el = $("#aviso-politica");
      el.textContent = p.aviso || "";
      el.classList.toggle("oculto", !p.aviso);
    });
  }

  /* ---------------- RNF01: termo de ciência (LGPD) ---------------- */
  function textoTermo() {
    return '<div class="termo">' +
      "<p>Antes de começar, veja como o SafeMind 360 usa o que você registra.</p>" +
      "<ul>" +
      "<li><b>O que fica guardado:</b> seus check-ins, as respostas dos questionários e os relatos que você enviar com nome.</li>" +
      "<li><b>O que não fica guardado:</b> a conversa com o Assistente Safe. Relatos anônimos não ficam ligados a você.</li>" +
      "<li><b>Quem vê:</b> professores veem só números gerais da turma, sem nomes. A coordenação e a psicologia veem os sinais de atenção e os relatos (os anônimos, sem o seu nome).</li>" +
      "<li><b>A inteligência artificial</b> ajuda a perceber padrões, mas não dá diagnóstico, rótulo ou castigo. Quem decide o que fazer é sempre uma pessoa da equipe.</li>" +
      "<li><b>Seus direitos:</b> você pode ver, baixar e apagar seus check-ins e respostas no quadro “Seus dados”.</li>" +
      "<li><b>Prazo:</b> os registros são apagados automaticamente depois de " + SM.Config.retencaoDias + " dias.</li>" +
      "<li>Como você é menor de idade, a escola também pede a autorização do seu responsável (LGPD, art. 14).</li>" +
      "</ul></div>";
  }

  function pedirConsentimento() {
    var precisaTurma = !sessao.turma;
    S.turmas().then(function (turmas) {
      var campoTurma = precisaTurma
        ? '<label class="campo"><span>Sua turma</span><select id="consent-turma"><option value="">Escolha</option>' +
          turmas.map(function (t) { return '<option value="' + esc(t.nome) + '">' + esc(t.nome) + "</option>"; }).join("") + "</select></label>"
        : "";
      UI.dialogo({
        titulo: "Como usamos seus dados",
        semFechar: true,
        html: textoTermo() + campoTurma +
          '<label class="checkbox"><input type="checkbox" id="consent-ok"><span>Li e entendi como meus dados são usados.</span></label>',
        acoes: [
          { rotulo: "Sair", tipo: "discreto", acao: function () { SM.Sessao.encerrar().then(function () { location.replace("index.html"); }); } },
          { rotulo: "Continuar", tipo: "principal", acao: function (d) {
            if (!$("#consent-ok", d).checked) throw new Error("Marque a caixa para confirmar que você leu.");
            var turma = precisaTurma ? $("#consent-turma", d).value : null;
            if (precisaTurma && !turma) throw new Error("Escolha a sua turma.");
            return S.registrarConsentimento(sessao, turma).then(function () {
              if (turma) sessao = SM.Sessao.atual();
              UI.aviso("Tudo certo. Bem-vindo(a) ao SafeMind 360!");
            });
          } }
        ]
      });
    });
  }

  /* ---------------- RF01: check-in ---------------- */
  var estadoEscolhido = null, sentimentoEscolhido = null;

  function montarCheckin() {
    $("#humores").innerHTML = N.ESTADOS.map(function (e) {
      return '<button type="button" data-valor="' + e.valor + '" aria-pressed="false">' +
        '<span class="material-symbols-outlined" aria-hidden="true">' + e.icone + "</span>" + esc(e.rotulo) + "</button>";
    }).join("");
    $$("#humores button").forEach(function (b) {
      b.onclick = function () {
        $$("#humores button").forEach(function (o) { o.classList.remove("ativo"); o.setAttribute("aria-pressed", "false"); });
        b.classList.add("ativo"); b.setAttribute("aria-pressed", "true");
        estadoEscolhido = Number(b.dataset.valor);
        sentimentoEscolhido = null;
        $("#sentimentos").innerHTML = N.sentimentosPara(estadoEscolhido).map(function (s) {
          return '<button type="button" class="chip" aria-pressed="false" data-sentimento="' + esc(s) + '">' + esc(s) + "</button>";
        }).join("");
        $$("#sentimentos .chip").forEach(function (c) {
          c.onclick = function () {
            var ativo = c.getAttribute("aria-pressed") === "true";
            $$("#sentimentos .chip").forEach(function (o) { o.setAttribute("aria-pressed", "false"); });
            c.setAttribute("aria-pressed", ativo ? "false" : "true");
            sentimentoEscolhido = ativo ? null : c.dataset.sentimento;
          };
        });
        $("#confirmacao").classList.add("oculto");
        $("#checkin-detalhes").classList.remove("oculto");
      };
    });

    $("#cancelar-checkin").onclick = function () {
      estadoEscolhido = null;
      $$("#humores button").forEach(function (o) { o.classList.remove("ativo"); o.setAttribute("aria-pressed", "false"); });
      $("#checkin-detalhes").classList.add("oculto");
      $("#notas").value = "";
    };

    $("#salvar-checkin").onclick = function () {
      var botao = this;
      $("#erro-checkin").classList.add("oculto");
      botao.disabled = true;
      S.registrarCheckin(sessao, { estado: estadoEscolhido, sentimento: sentimentoEscolhido, notas: $("#notas").value })
        .then(function (r) {
          var msg, risco = r.categoria === "SITUACAO_DE_RISCO";
          if (risco) msg = "Seu check-in foi salvo e a equipe de coordenação/psicologia foi avisada para conversar com você. " + N.AJUDA_IMEDIATA;
          else if (estadoEscolhido >= 4) msg = "Que bom! Check-in salvo.";
          else if (estadoEscolhido === 3) msg = "Check-in salvo. Dias assim também contam.";
          else msg = "Check-in salvo. Sinto muito que o dia esteja pesado. Se quiser, escreva um relato ou converse com o assistente. Se precisar de ajuda agora, procure um adulto de confiança na escola.";
          var c = $("#confirmacao");
          c.className = "confirmacao" + (risco ? " urgente" : "");
          c.innerHTML = UI.icone(risco ? "support" : "check_circle") + "<span>" + esc(msg) + "</span>";
          c.focus();
          $("#checkin-detalhes").classList.add("oculto");
          $("#notas").value = "";
          $$("#humores button").forEach(function (o) { o.classList.remove("ativo"); o.setAttribute("aria-pressed", "false"); });
          $("#dica").textContent = r.categoria === "SITUACAO_DE_RISCO" ? N.dicaPara("NEUTRO") : r.dica;
        })
        .catch(function (e) {
          var el = $("#erro-checkin");
          el.textContent = e.message;
          el.classList.remove("oculto");
        })
        .then(function () { botao.disabled = false; });
    };
  }

  function atualizarUltimoCheckin() {
    var ult = meusCheckins[meusCheckins.length - 1];
    $("#ultimo-checkin").textContent = ult ? "Último check-in: " + UI.fmtData(ult.dataHora) + "." : "Você ainda não fez nenhum check-in.";
  }

  /* ---------------- DicaBemEstar ---------------- */
  function atualizarDica() {
    var ult = meusCheckins[meusCheckins.length - 1];
    var cat = "NEUTRO";
    if (ult && ult.analise) {
      cat = ult.analise.categorias && ult.analise.categorias.filter(function (c) { return c !== "SITUACAO_DE_RISCO"; })[0] || (ult.estadoSocioemocional <= 2 ? "SOFRIMENTO_EMOCIONAL" : "NEUTRO");
    }
    if ($("#dica").textContent === "—") $("#dica").textContent = N.dicaPara(cat, new Date().getDate());
  }

  /* ---------------- gráfico da semana e conquistas ---------------- */
  function desenharSemana() {
    var dias = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    var hoje = new Date(), itens = [], soma = 0, contados = 0;
    for (var i = 6; i >= 0; i--) {
      var d = new Date(hoje); d.setDate(hoje.getDate() - i);
      var doDia = meusCheckins.filter(function (r) { return new Date(r.dataHora).toDateString() === d.toDateString(); });
      var media = doDia.length ? doDia.reduce(function (a, r) { return a + r.estadoSocioemocional; }, 0) / doDia.length : 0;
      if (media) { soma += media; contados++; }
      itens.push({ rotulo: dias[d.getDay()], valor: media ? Math.round(media * 10) / 10 : 0, titulo: media ? media.toFixed(1) + " de 5" : "sem registro" });
    }
    UI.Graficos.barras($("#barras"), itens, { max: 5, descricao: "Humor médio por dia nos últimos 7 dias, de 1 a 5." });
    $("#resumo-semana").textContent = contados
      ? "Média da semana: " + (soma / contados).toFixed(1) + " de 5, com " + contados + " dia(s) registrado(s)."
      : "Faça seu check-in para acompanhar.";
  }

  function atualizarConquistas() {
    var limite = Date.now() - 7 * 86400000;
    var diasSemana = {};
    meusCheckins.forEach(function (c) { if (new Date(c.dataHora).getTime() >= limite) diasSemana[new Date(c.dataHora).toDateString()] = 1; });
    var nDias = Object.keys(diasSemana).length;
    SM.Dados.listar("respostas", { autorUid: sessao.uid }).then(function (rs) {
      var lista = [
        { icone: "local_fire_department", texto: "Check-in em 3 dias da semana", ok: nDias >= 3, progresso: Math.min(nDias, 3) + "/3" },
        { icone: "checklist", texto: "Respondeu um questionário", ok: rs.length > 0 },
        { icone: "air", texto: "Fez a respiração 4-7-8", ok: sessionStorage.getItem("safemind:respirou") === "1" }
      ];
      $("#conquistas").innerHTML = lista.map(function (c) {
        return '<li class="' + (c.ok ? "ganha" : "") + '">' + UI.icone(c.ok ? c.icone : "lock") +
          "<span>" + esc(c.texto) + (c.progresso && !c.ok ? " (" + c.progresso + ")" : "") + "</span>" +
          '<span class="somente-leitor">' + (c.ok ? "conquistada" : "ainda não conquistada") + "</span></li>";
      }).join("");
    });
  }

  /* ---------------- RF02: questionário ---------------- */
  function carregarQuestionario() {
    var alvo = $("#questionario-conteudo");
    S.questionarioAtivo().then(function (q) {
      return S.situacaoQuestionario(sessao, q).then(function (sit) {
        if (!sit.disponivel) {
          alvo.innerHTML = '<p class="estado-ok">' + UI.icone("task_alt") + "<span>Você respondeu “" + esc(q.titulo) + "” em " + UI.fmtData(sit.ultima.dataEnvio, false) + ".</span></p>" +
            '<p class="sub">O próximo fica disponível em ' + UI.fmtData(sit.proxima, false) + ". Obrigado por participar!</p>";
          return;
        }
        alvo.innerHTML = "<p><b>" + esc(q.titulo) + "</b></p><p class=\"sub\">" + esc(q.descricao || "") + " " + q.perguntas.length + " perguntas, cerca de " + (function (m) { return m + (m === 1 ? " minuto" : " minutos"); })(Math.max(1, Math.round(q.perguntas.length / 3))) + ".</p>" +
          '<button type="button" class="btn principal pequeno" id="abrir-questionario">' + UI.icone("play_arrow") + "<span>Responder agora</span></button>";
        $("#abrir-questionario").onclick = function () { abrirQuestionario(q); };
      });
    }).catch(function (e) { alvo.innerHTML = '<p class="erro">' + esc(e.message) + "</p>"; });
  }

  function abrirQuestionario(q) {
    var alvo = $("#questionario-conteudo");
    alvo.innerHTML = '<form id="form-questionario" novalidate><p class="sub">Pense nas últimas semanas. Não existe resposta certa.</p>' +
      q.perguntas.map(function (p, i) {
        return '<fieldset class="pergunta"><legend><span class="num-pergunta">' + (i + 1) + "</span>" + esc(p.texto) + "</legend>" +
          '<div class="escala">' + N.ESCALA_FREQUENCIA.map(function (rot, j) {
            var id = "r-" + p.id + "-" + (j + 1);
            return '<input type="radio" name="' + esc(p.id) + '" id="' + id + '" value="' + (j + 1) + '"><label for="' + id + '">' + esc(rot) + "</label>";
          }).join("") + "</div></fieldset>";
      }).join("") +
      '<p class="erro oculto" id="erro-questionario" role="alert"></p>' +
      '<div class="acoes-linha"><button type="submit" class="btn principal pequeno">' + UI.icone("send") + "<span>Enviar respostas</span></button>" +
      '<button type="button" class="btn discreto pequeno" id="fechar-questionario">Responder depois</button></div></form>';
    $("#form-questionario fieldset legend").scrollIntoView({ block: "nearest" });
    $("#fechar-questionario").onclick = carregarQuestionario;
    $("#form-questionario").onsubmit = function (e) {
      e.preventDefault();
      var respostas = {};
      q.perguntas.forEach(function (p) {
        var m = $('input[name="' + p.id + '"]:checked');
        if (m) respostas[p.id] = Number(m.value);
      });
      S.responderQuestionario(sessao, q, respostas).then(function () {
        UI.aviso("Respostas enviadas. Obrigado!");
        carregarQuestionario();
        atualizarConquistas();
        $("#questionario").focus && $("#t-questionario").scrollIntoView({ block: "nearest" });
      }).catch(function (err) {
        var el = $("#erro-questionario");
        el.textContent = err.message;
        el.classList.remove("oculto");
      });
    };
  }

  /* ---------------- RF03 / RN03: relato ---------------- */
  function montarRelato() {
    var niveis = N.NIVEIS_PRIVACIDADE;
    $("#niveis").insertAdjacentHTML("beforeend", Object.keys(niveis).map(function (k) {
      var n = niveis[k];
      return '<label class="nivel nivel-' + k.toLowerCase() + '"><input type="radio" name="nivel" value="' + k + '">' +
        '<span class="nivel-icone">' + UI.icone(n.icone) + "</span>" +
        "<span><b>" + esc(n.rotulo) + "</b><small>" + esc(n.descricao) + "</small></span></label>";
    }).join(""));
    $$('input[name="nivel"]').forEach(function (r) {
      r.onchange = function () { $("#linha-turma").classList.toggle("oculto", r.value !== "ANONIMO"); };
    });

    $("#form-relato").onsubmit = function (e) {
      e.preventDefault();
      var erro = $("#erro-relato");
      erro.classList.add("oculto");
      var marcado = $('input[name="nivel"]:checked');
      var botao = $("#enviar-relato");
      botao.disabled = true;
      S.enviarRelato(sessao, {
        titulo: $("#relato-titulo").value,
        descricao: $("#relato-descricao").value,
        nivelPrivacidade: marcado ? marcado.value : null,
        informarTurma: $("#relato-turma").checked
      }).then(function (r) {
        $("#form-relato").reset();
        $("#linha-turma").classList.add("oculto");
        var el = $("#resposta-relato");
        var urgente = r.analise.grauRisco === "alto";
        el.className = "resposta" + (urgente ? " urgente" : "");
        el.innerHTML = "<p>" + esc(r.mensagem) + "</p>" + (r.dica ? '<p class="dica-curta">' + UI.icone("lightbulb") + "<span>" + esc(r.dica) + "</span></p>" : "") +
          '<button type="button" class="btn discreto pequeno" id="novo-relato">Escrever outro relato</button>';
        $("#form-relato").classList.add("oculto");
        el.focus();
        $("#novo-relato").onclick = function () { el.classList.add("oculto"); $("#form-relato").classList.remove("oculto"); $("#relato-titulo").focus(); };
      }).catch(function (err) {
        erro.textContent = err.message;
        erro.classList.remove("oculto");
      }).then(function () { botao.disabled = false; });
    };
  }

  /* ---------------- Assistente Safe ---------------- */
  var CHAVE_CHAT = "safemind:chat";
  function contextoChat() { try { return JSON.parse(sessionStorage.getItem(CHAVE_CHAT)) || { ultima: "geral", alertados: {} }; } catch (e) { return { ultima: "geral", alertados: {} }; } }
  function salvarContexto(c) { sessionStorage.setItem(CHAVE_CHAT, JSON.stringify(c)); }

  function intencao(texto) {
    var t = IA.normalizar(texto);
    function exato(l) { return l.indexOf(t) !== -1; }
    if (exato(["oi", "ola", "oie", "opa", "hey", "ei", "bom dia", "boa tarde", "boa noite"])) return "saudacao";
    if (exato(["obrigado", "obrigada", "valeu", "vlw", "brigado", "brigada"])) return "agradecimento";
    if (exato(["tchau", "ate mais", "falou", "fui", "vou sair"])) return "despedida";
    if (t.indexOf("quem e voce") !== -1 || t.indexOf("o que voce faz") !== -1) return "identidade";
    if (t.indexOf("tudo bem") !== -1 || t.indexOf("como voce esta") !== -1 || t === "e voce") return "como_esta";
    if (t.indexOf("me ajuda") !== -1 || t.indexOf("pode me ajudar") !== -1 || t.indexOf("preciso conversar") !== -1) return "pedido_ajuda";
    if (t.indexOf("o que eu faco") !== -1 || t.indexOf("o que fazer") !== -1) return "orientacao";
    if (exato(["sim", "aham", "uhum", "isso", "exato"])) return "sim";
    if (exato(["nao", "nao sei", "sei nao", "talvez", "mais ou menos"])) return t === "nao" ? "nao" : "incerto";
    if (exato(["nada", "deixa", "deixa para la", "nao quero falar"])) return "nao_quero";
    if (exato(["bem", "estou bem", "muito bem", "otimo", "legal", "feliz"])) return "bem";
    if (exato(["mal", "estou mal", "ruim", "pessimo", "horrivel"])) return "mal";
    return "conteudo";
  }

  function subtipo(a) {
    if (a.classe === "SITUACAO_DE_RISCO") return "risco";
    if (a.classe === "CONFLITO") return "conflito";
    if (a.classe === "EXCLUSAO_SOCIAL") return "isolamento";
    if (a.classe === "SOFRIMENTO_EMOCIONAL") {
      var t = a.termos.join(" ");
      if (/ansios|ansiedade|nervos|preocup|pressao|panico|medo|cobranca/.test(t)) return "ansiedade";
      if (/cansad|exaust|sem energia|esgotad|sobrecarreg|dormir|insonia/.test(t)) return "cansaco";
      return "tristeza";
    }
    return a.pontos.POSITIVO > 0 ? "positivo" : "geral";
  }

  var PERGUNTAS = {
    conflito: "Isso aconteceu só hoje ou já vem se repetindo?",
    ansiedade: "O que está pesando mais agora: prova, nota, tarefas ou outra coisa?",
    tristeza: "Você sabe dizer o que deixou seu dia mais difícil?",
    isolamento: "Tem alguém na escola com quem você se sente mais à vontade?",
    cansaco: "Esse cansaço parece vir mais do sono, da rotina ou das tarefas?",
    positivo: "O que aconteceu hoje que ajudou você a se sentir assim?",
    geral: "Quer me contar um pouco mais?"
  };

  function responder(texto, a, ctx) {
    var nome = sessao.nome.split(" ")[0];
    var it = intencao(texto), ant = ctx.ultima || "geral", tipo = subtipo(a);
    if (tipo === "risco") {
      return "Obrigado por me contar, " + nome + ". Isso é sério e você não precisa passar por isso sozinho(a). A equipe de coordenação/psicologia foi avisada para conversar com você. " + N.AJUDA_IMEDIATA;
    }
    var r = {
      saudacao: "Oi, " + nome + "! Estou aqui. Como foi seu dia hoje?",
      agradecimento: "Por nada, " + nome + ". Quer conversar sobre mais alguma coisa?",
      despedida: "Tudo bem. Espero que o resto do seu dia seja tranquilo. Quando quiser, é só voltar.",
      identidade: "Eu sou o Assistente Safe, do SafeMind 360. Posso conversar sobre seu dia, escola, amizades e como você está. Não faço diagnóstico e não guardo esta conversa.",
      como_esta: "Estou aqui e pronto para te ouvir. E você, como está agora?",
      pedido_ajuda: "Claro. Pode contar do seu jeito, sem precisar organizar tudo. O que está te incomodando mais agora?",
      nao_quero: "Tudo bem. Você não precisa contar nada que não queira. Podemos falar de outra coisa ou você pode fazer uma das atividades de 5 minutos.",
      bem: "Que bom, " + nome + ". O que deixou seu dia melhor?",
      mal: "Entendi, " + nome + ". Parece que o dia não está fácil. Quer me contar o que aconteceu?",
      incerto: "Tudo bem não saber explicar. Me diz só uma coisa: seu dia está mais leve, mais ou menos ou pesado?",
      nao: "Tudo bem. Quer falar sobre como você está se sentindo agora?"
    };
    if (it === "orientacao") {
      if (ant === "conflito") return "Um próximo passo seguro é contar para um adulto da escola. Você também pode usar o quadro “Contar algo para a escola” e escolher o nível de privacidade. Isso continua acontecendo?";
      if (ant === "ansiedade") return "Vamos por partes. Qual é a próxima coisa que você realmente precisa resolver hoje?";
      if (ant === "tristeza" || ant === "isolamento") return "Um bom primeiro passo é não ficar sozinho(a) com isso. Tem algum adulto de confiança com quem você se sentiria bem para conversar?";
      return "Posso te ajudar a pensar nisso. Me conta primeiro o que aconteceu.";
    }
    if (it === "sim" && ant !== "geral") return "Entendi. " + (PERGUNTAS[ant] || PERGUNTAS.geral);
    if (r[it] && tipo === "geral") return r[it];
    var base = {
      conflito: "Parece que aconteceu uma situação difícil de convivência. Obrigado por me contar.",
      ansiedade: "Parece que tem bastante pressão ao mesmo tempo.",
      tristeza: "Obrigado por me contar. Um dia difícil pode pesar bastante.",
      isolamento: "Sentir-se deixado(a) de lado é bem desconfortável.",
      cansaco: "Parece que sua rotina está puxada.",
      positivo: "Que bom saber disso, " + nome + ".",
      geral: "Entendi, " + nome + "."
    };
    var extra = tipo === "conflito" ? " Se quiser que a escola saiba, use o quadro “Contar algo para a escola”." : "";
    return base[tipo] + " " + PERGUNTAS[tipo] + extra;
  }

  function montarChat() {
    var historico = $("#historico-chat");
    function bolha(classe, texto) {
      var d = document.createElement("div");
      d.className = "mensagem-chat " + classe;
      d.textContent = texto;
      historico.appendChild(d);
      historico.scrollTop = historico.scrollHeight;
      return d;
    }
    function enviar() {
      var campo = $("#mensagem"), texto = campo.value.trim();
      if (texto.length < 2) return;
      campo.value = "";
      bolha("aluno", texto);
      var botao = $("#enviar-mensagem");
      botao.disabled = true;
      var pensando = bolha("assistente digitando", "Pensando…");
      var ctx = contextoChat();
      S.analisarMensagemAssistente(sessao, texto, ctx).then(function (a) {
        return new Promise(function (ok) { setTimeout(function () { ok(a); }, 300 + Math.random() * 400); });
      }).then(function (a) {
        pensando.remove();
        var resposta = responder(texto, a, ctx);
        var tipo = subtipo(a);
        if (tipo !== "geral" && tipo !== "positivo") ctx.ultima = tipo;
        salvarContexto(ctx);
        bolha("assistente" + (tipo === "risco" ? " urgente" : ""), resposta);
      }).catch(function () {
        pensando.remove();
        bolha("assistente", "Não consegui responder agora. Tente de novo em instantes.");
      }).then(function () { botao.disabled = false; campo.focus(); });
    }
    $("#enviar-mensagem").onclick = enviar;
    $("#mensagem").addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); }
    });
  }

  /* ---------------- atividades ---------------- */
  var EXERCICIOS = {
    respiracao: '<b>Respiração 4-7-8</b><div class="circulo" aria-hidden="true"></div>Inspire pelo nariz contando até 4, segure até 7 e solte pela boca até 8. Acompanhe o círculo e repita 4 vezes.',
    gratidao: "<b>Três coisas boas</b><br>Pense em três coisas que deram certo hoje, por menores que sejam: um som de que você gostou, alguém que sorriu para você, uma tarefa que terminou.",
    corpo: "<b>Pausa consciente</b><br>Sem sair do lugar, perceba 5 coisas que você vê, 4 que pode tocar, 3 que ouve, 2 cheiros e 1 sabor. Isso traz a atenção de volta para o agora."
  };
  function montarAtividades() {
    $$("#atividades button").forEach(function (b) {
      b.onclick = function () {
        var el = $("#exercicio");
        el.innerHTML = EXERCICIOS[b.dataset.tipo];
        el.classList.remove("oculto");
        el.focus();
        if (b.dataset.tipo === "respiracao") { sessionStorage.setItem("safemind:respirou", "1"); atualizarConquistas(); }
      };
    });
  }

  /* ---------------- RNF01: seus dados ---------------- */
  function montarMeusDados() {
    function resumo() {
      Promise.all([
        SM.Dados.listar("checkins", { autorUid: sessao.uid }),
        SM.Dados.listar("respostas", { autorUid: sessao.uid }),
        SM.Dados.listar("relatos", { autorUid: sessao.uid })
      ]).then(function (r) {
        $("#resumo-dados").innerHTML =
          "<div><dt>Check-ins</dt><dd>" + r[0].length + "</dd></div>" +
          "<div><dt>Questionários</dt><dd>" + r[1].length + "</dd></div>" +
          "<div><dt>Relatos com nome</dt><dd>" + r[2].length + "</dd></div>";
      });
    }
    resumo();
    SM.Dados.observar("checkins", { autorUid: sessao.uid }, resumo);
    SM.Dados.observar("relatos", { autorUid: sessao.uid }, resumo);

    $("#baixar-dados").onclick = function () {
      S.exportarMeusDados(sessao).then(function (dados) {
        UI.baixarArquivo("safemind-meus-dados.json", JSON.stringify(dados, null, 2), "application/json");
        UI.aviso("Arquivo com seus dados baixado.");
      });
    };
    $("#apagar-dados").onclick = function () {
      UI.confirmar("Apagar seus registros?", "Seus check-ins e respostas de questionário serão apagados para sempre. Relatos enviados ficam com a equipe para que ela possa agir; para pedir a exclusão deles, fale com a coordenação.", "Apagar")
        .then(function (ok) {
          if (!ok) return;
          return S.excluirMeusRegistros(sessao).then(function (r) {
            UI.aviso(r.checkins + " check-in(s) e " + r.respostas + " resposta(s) apagados.");
            resumo();
            carregarQuestionario();
          });
        });
    };
    $("#ver-termo").onclick = function () { UI.dialogo({ titulo: "Como usamos seus dados", html: textoTermo() }); };
  }
})();
