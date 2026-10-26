/* =====================================================================
   SafeMind 360 — Dados de demonstração (ambiente local)
   Gera 4 semanas de registros fictícios, sempre iguais (semente fixa),
   passando pelo mesmo MotorIA usado no sistema. Assim os alertas,
   indicadores e a eficácia das intervenções são calculados de verdade.
   Todos os nomes são fictícios.
   ===================================================================== */
(function (raiz) {
  "use strict";
  var SM = raiz.SafeMind = raiz.SafeMind || {};
  var VERSAO = "2.0.0-demo-5";

  function gerador(semente) {
    return function () {
      semente |= 0; semente = semente + 0x6D2B79F5 | 0;
      var t = Math.imul(semente ^ semente >>> 15, 1 | semente);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  var ALUNOS = [
    ["7º Ano A", ["Pedro Henrique", "Laura Santos", "Enzo Barbosa", "Manuela Dias", "Theo Cardoso"]],
    ["7º Ano B", ["Gabriel Rocha", "Miguel Araújo", "Alice Pereira", "Heitor Mendes", "Valentina Cruz"]],
    ["8º Ano A", ["Julia Ribeiro", "Davi Carvalho", "Lívia Monteiro", "Arthur Nogueira", "Cecília Pinto"]],
    ["8º Ano B", ["Lucas Martins", "Ravi Oliveira", "Helena Teixeira", "Bernardo Lopes", "Lara Freitas", "Samuel Correia"]],
    ["9º Ano A", ["Ana Silva", "Ana Clara Souza", "Bruno Ferreira", "Sofia Nascimento", "Rafael Duarte"]],
    ["9º Ano C", ["Mariana Lima", "Isabela Gomes", "Lorenzo Batista", "Clara Moreira", "Matheus Vieira"]]
  ];

  var NOTAS = {
    conflito: ["me empurraram de novo no corredor", "ficam me xingando no intervalo", "riram de mim na aula de novo", "colocaram apelido em mim"],
    isolamento: ["me sinto sozinha", "chorei hoje", "ninguém fala comigo no intervalo", "tô muito triste"],
    exclusao: ["ninguém quis fazer trabalho comigo", "me deixaram de fora do grupo de novo", "fiquei sozinho no recreio e ninguém fala comigo"],
    ansiedade: ["muito ansiosa com a prova", "não consigo dormir direito", "nervosa com as notas"],
    desanimo: ["desanimada com tudo", "sem vontade de vir pra escola"],
    oscilacao: ["dia ruim", "com raiva de tudo"],
    baixo: ["cansado", "dia pesado", "triste hoje"],
    alto: ["hoje foi legal", "gostei da aula", "joguei bola no intervalo", "fiz uma amiga nova"]
  };

  /* Perfis fictícios: base de humor (1–5), efeitos de intervenção [dias atrás, ganho]. */
  var ESPECIAIS = {
    "Lucas Martins": { base: 2.2, efeitos: [[12, 1.3]], notas: "conflito", conflitoAte: 12, sentimentos: ["Sozinho(a)", "Com medo", "Triste"] },
    "Ana Clara Souza": { base: 2.8, tendencia: -0.04, efeitos: [[5, 0.4]], notas: "isolamento", exclusaoAte: 0, sentimentos: ["Sozinho(a)", "Triste"] },
    "Alice Pereira": { base: 3.7, quedaDesde: 10, queda: -1.4, notas: "exclusao", exclusaoDesde: 10, sentimentos: ["Excluído(a)", "Sozinho(a)"] },
    "Heitor Mendes": { base: 3.5, quedaDesde: 9, queda: -1.2, notas: "exclusao", exclusaoDesde: 9, sentimentos: ["Excluído(a)", "Sozinho(a)", "Triste"] },
    "Mariana Lima": { base: 2.8, notas: "ansiedade", sentimentos: ["Ansioso(a)", "Preocupado(a)"] },
    "Julia Ribeiro": { base: 2.9, notas: "desanimo", sentimentos: ["Triste", "Cansado(a)"] },
    "Pedro Henrique": { base: 3.0, ruido: 1.1, efeitos: [[9, 0.7]], notas: "oscilacao", sentimentos: ["Com raiva", "Triste"] },
    "Ana Silva": { base: 3.9, semHoje: true }
  };
  var TURMAS_EFEITO = {
    "8º Ano B": { base: -0.5, efeitos: [[18, 0.8]] },
    "9º Ano C": { quedaDesde: 10, queda: -0.5, efeitos: [[7, 0.45]], notas: "ansiedade" },
    "7º Ano B": { quedaDesde: 10, queda: -0.3 }
  };

  function slug(nome) {
    return nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z ]/g, "").trim().split(/\s+/).join(".");
  }

  function gerar(agoraRef) {
    var IA = SM.MotorIA, N = SM.Negocio, Config = SM.Config;
    var rnd = gerador(360);
    var agora = agoraRef ? new Date(agoraRef) : new Date();
    var seq = 0;
    function id(p) { seq++; return p + "-" + seq.toString(36) + "-" + Math.floor(rnd() * 1e6).toString(36); }
    function escolher(l) { return l[Math.floor(rnd() * l.length)]; }
    function gauss() { var u = 1 - rnd(), v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
    function diaAtras(d, turno) {
      var x = new Date(agora);
      x.setDate(x.getDate() - d);
      var h = turno === "Vespertino" ? 13.5 + rnd() * 3.5 : 7.3 + rnd() * 4;
      x.setHours(Math.floor(h), Math.floor((h % 1) * 60), Math.floor(rnd() * 60), 0);
      if (x > agora) x = new Date(agora.getTime() - (20 + rnd() * 90) * 60000);
      return x;
    }
    function fimDeSemana(d) { var x = new Date(agora); x.setDate(x.getDate() - d); return x.getDay() === 0 || x.getDay() === 6; }

    var turmas = Config.turmasPadrao.map(function (t) { return Object.assign({}, t); });
    var turnoDe = {};
    turmas.forEach(function (t) { turnoDe[t.nome] = t.turno; });

    var col = { turmas: turmas, usuarios: [], checkins: [], respostas: [], relatos: [], alertas: [], intervencoes: [], insights: [], questionarios: [], configuracoes: [] };
    var consent = { versao: Config.versaoTermo, data: new Date(agora.getTime() - 30 * 86400000).toISOString() };

    /* ---- equipe ---- */
    function equipe(email, nome, perfil, extra) {
      var demo = Config.contasDemo.filter(function (c) { return c.email === email; })[0];
      col.usuarios.push(Object.assign({
        id: id("u"), nome: nome, email: email, perfil: perfil, ativo: true, criadoEm: consent.data,
        senhaHash: demo ? N.hashSenha(email, demo.senha) : null, turma: null, turmas: [], consentimento: consent
      }, extra));
    }
    equipe("admin@safemind.ai", "Paulo Cesar", "coordenacao", { cargo: "Coordenação pedagógica" });
    equipe("coordenacao@safemind.ai", "Marina Prado", "coordenacao", { cargo: "Psicóloga escolar" });
    equipe("professor@safemind.ai", "Helena Rocha", "professor", { turmas: ["9º Ano A", "8º Ano B", "7º Ano B"], especializacao: "Língua Portuguesa" });
    equipe("rafael.lima@escola.demo", "Rafael Lima", "professor", { turmas: ["7º Ano A", "7º Ano B"], especializacao: "Matemática" });
    equipe("beatriz.alves@escola.demo", "Beatriz Alves", "professor", { turmas: ["8º Ano A", "8º Ano B"], especializacao: "Ciências" });
    equipe("andre.martins@escola.demo", "André Martins", "professor", { turmas: ["9º Ano C", "9º Ano A"], especializacao: "História" });

    /* ---- estudantes ---- */
    var estudantes = [];
    var matricula = 202600;
    ALUNOS.forEach(function (par) {
      par[1].forEach(function (nome) {
        matricula++;
        var ehDemo = nome === "Ana Silva";
        var u = {
          id: id("u"), nome: nome, email: ehDemo ? "aluno@safemind.ai" : slug(nome) + "@escola.demo",
          perfil: "estudante", turma: par[0], turmas: [], matricula: String(matricula), ativo: true,
          criadoEm: consent.data, consentimento: ehDemo ? null : consent,
          senhaHash: ehDemo ? N.hashSenha("aluno@safemind.ai", "safemind123") : null
        };
        col.usuarios.push(u);
        var esp = ESPECIAIS[nome] || {};
        estudantes.push({ u: u, esp: esp, base: esp.base || (3.4 + rnd() * 1.0), tur: TURMAS_EFEITO[par[0]] || {} });
      });
    });

    function baseNoDia(e, d) {
      var b = e.base + (e.tur.base || 0) + (e.esp.tendencia ? e.esp.tendencia * (27 - d) : 0);
      if (e.esp.quedaDesde !== undefined && d < e.esp.quedaDesde) b += e.esp.queda;
      if (e.tur.quedaDesde !== undefined && d < e.tur.quedaDesde) b += e.tur.queda;
      (e.esp.efeitos || []).concat(e.tur.efeitos || []).forEach(function (ef) { if (d < ef[0]) b += ef[1]; });
      return b;
    }
    function emConflito(e, d) { return e.esp.conflitoAte !== undefined && d >= e.esp.conflitoAte; }
    function emExclusao(e, d) {
      return (e.esp.exclusaoAte !== undefined && d >= e.esp.exclusaoAte) || (e.esp.exclusaoDesde !== undefined && d < e.esp.exclusaoDesde);
    }

    var Q = N.QUESTIONARIO_PADRAO;
    col.questionarios.push(Object.assign({}, Q, { criadoEm: new Date(agora.getTime() - 40 * 86400000).toISOString(), criadoPor: "Paulo Cesar" }));

    function alertaDe(dados) {
      var a = {
        id: id("a"), grauRisco: dados.grauRisco, prioritario: dados.grauRisco === "alto" || !!dados.prioritario,
        origem: dados.origem, referenciaId: dados.referenciaId || null,
        estudanteUid: dados.estudanteUid || null, estudanteNome: dados.estudanteNome || null, turma: dados.turma || null,
        motivo: dados.motivo, categorias: dados.categorias || [], lido: false, status: "novo", revisaoHumana: "pendente",
        ultimaIntervencaoId: null, historico: [], criadoEm: dados.criadoEm, expiraEm: N.expiraEm(dados.criadoEm)
      };
      col.alertas.push(a);
      return a;
    }
    function insight(turma, data, tipo, valor, categorias, grau) {
      var dia = IA.diaISO(data);
      col.insights.push({ id: id("i"), turma: turma, dia: dia, tipo: tipo, valor: valor, categorias: categorias || [], grauRisco: grau || "baixo", expiraEm: N.expiraEm(dia + "T12:00:00.000Z") });
    }

    /* ---- check-ins e questionários (4 semanas, dias letivos) ---- */
    estudantes.forEach(function (e) {
      var historico = [];
      var turno = turnoDe[e.u.turma];
      var diaQuestionario = {};
      for (var semana = 0; semana < 4; semana++) diaQuestionario[semana] = 1 + Math.floor(rnd() * 5) + semana * 7;

      for (var d = 27; d >= 0; d--) {
        if (fimDeSemana(d)) continue;
        if (d === 0 && e.esp.semHoje) continue;
        if (rnd() > (d === 0 ? 0.55 : 0.82)) continue;
        var b = baseNoDia(e, d);
        var estado = Math.max(1, Math.min(5, Math.round(b + gauss() * (e.esp.ruido || 0.6))));
        var data = diaAtras(d, turno);
        var sentimento = estado <= 2 && e.esp.sentimentos ? escolher(e.esp.sentimentos) : escolher(N.sentimentosPara(estado));
        var notas = "";
        var temaBaixo = e.esp.notas || (e.tur.notas && d < (e.tur.quedaDesde || 0) ? e.tur.notas : null);
        if (estado <= 2 && rnd() < 0.4) notas = escolher(NOTAS[temaBaixo || "baixo"]);
        else if (estado === 3 && temaBaixo && rnd() < 0.2) notas = escolher(NOTAS[temaBaixo]);
        else if (estado >= 4 && rnd() < 0.08) notas = escolher(NOTAS.alto);
        if (emConflito(e, d) && !notas && rnd() < 0.3) notas = escolher(NOTAS.conflito);

        var c = {
          id: id("c"), autorUid: e.u.id, turma: e.u.turma, dataHora: data.toISOString(),
          estadoSocioemocional: estado, sentimentoSugerido: sentimento, notas: notas
        };
        var an = IA.avaliarCheckin(c, historico);
        c.analise = { grauRisco: an.grauRisco, classe: an.classe, categorias: an.categorias, motivosAtivos: an.motivosAtivos, motivosAlertados: an.gerarAlerta ? an.motivosAlertados : [] };
        c.expiraEm = N.expiraEm(c.dataHora);
        col.checkins.push(c);
        historico.push(c);
        insight(e.u.turma, data, "checkin", an.valor, an.categorias, an.grauRisco);
        if (an.gerarAlerta) {
          alertaDe({
            origem: "checkin", referenciaId: c.id, estudanteUid: e.u.id, estudanteNome: e.u.nome, turma: e.u.turma,
            grauRisco: an.grauRisco, categorias: an.categorias, criadoEm: new Date(data.getTime() + 2000).toISOString(),
            motivo: an.motivos.filter(function (m) { return an.motivosAlertados.indexOf(m.codigo) !== -1; }).map(function (m) { return m.texto; }).join("; ")
          });
        }

        /* questionário semanal */
        var semanaAtual = Math.floor((27 - d) / 7);
        if (27 - d === diaQuestionario[semanaAtual] && rnd() < 0.85 && !(e.esp.semHoje && d < 7)) {
          var bq = Math.max(1, Math.min(5, b));
          function freq(v) { return Math.max(1, Math.min(5, Math.round(v + gauss() * 0.6))); }
          var resp = {
            q1: freq(bq + 0.2),
            q2: emExclusao(e, d) ? 1 + Math.floor(rnd() * 2) : freq(bq + 0.3),
            q3: emConflito(e, d) ? 4 + Math.floor(rnd() * 2) : freq(1.3),
            q4: emExclusao(e, d) ? 4 + Math.floor(rnd() * 2) : freq(1.4),
            q5: freq(bq + 0.4),
            q6: freq(bq + 0.3)
          };
          var aq = IA.avaliarQuestionario(Q, resp);
          var dq = new Date(data.getTime() + 5 * 60000);
          var r = {
            id: id("r"), questionarioId: Q.id, autorUid: e.u.id, turma: e.u.turma, dataEnvio: dq.toISOString(),
            respostas: resp, indice: aq.indice, dimensoes: aq.dimensoes,
            analise: { grauRisco: aq.grauRisco, categorias: aq.categorias }, expiraEm: N.expiraEm(dq.toISOString())
          };
          col.respostas.push(r);
          insight(e.u.turma, dq, "questionario", aq.indice, aq.categorias, aq.grauRisco);
          if (aq.gerarAlerta) {
            alertaDe({
              origem: "questionario", referenciaId: r.id, estudanteUid: e.u.id, estudanteNome: e.u.nome, turma: e.u.turma,
              grauRisco: aq.grauRisco, categorias: aq.categorias, criadoEm: new Date(dq.getTime() + 2000).toISOString(),
              motivo: aq.motivos.map(function (m) { return m.texto; }).join("; ")
            });
          }
        }
      }
    });

    /* ---- relatos voluntários ---- */
    function usuarioPorNome(nome) { return col.usuarios.filter(function (u) { return u.nome === nome; })[0]; }
    function relato(diasAtras, horas, nivel, nome, turma, titulo, descricao) {
      var u = nome ? usuarioPorNome(nome) : null;
      var data = new Date(agora.getTime() - diasAtras * 86400000 - horas * 3600000);
      if (nivel === "ANONIMO") data.setMinutes(0, 0, 0);
      var r = {
        id: id("rel"), titulo: titulo, descricao: descricao, dataEnvio: data.toISOString(), nivelPrivacidade: nivel,
        autorUid: u ? u.id : null, autorNome: u ? u.nome : null, turma: turma, lido: diasAtras > 1, status: "novo"
      };
      var an = IA.avaliarRelato(r);
      r.analise = { grauRisco: an.grauRisco, classe: an.classe, categorias: an.categorias, prioritario: an.prioritario, origemRisco: an.origemRisco, termos: an.termos, confianca: an.confianca };
      r.expiraEm = N.expiraEm(r.dataEnvio);
      col.relatos.push(r);
      if (turma) insight(turma, data, "relato", null, an.categorias, an.grauRisco);
      var alerta = null;
      if (an.gerarAlerta) {
        alerta = alertaDe({
          origem: "relato", referenciaId: r.id, estudanteUid: r.autorUid, estudanteNome: r.autorNome, turma: turma,
          grauRisco: an.grauRisco, prioritario: an.prioritario, categorias: an.categorias,
          criadoEm: new Date(data.getTime() + 2000).toISOString(),
          motivo: an.origemRisco === "estudante" ? "Estudante marcou o relato como Situação de risco"
            : an.origemRisco === "ia" ? "Relato com sinais de situação de risco identificados pela IA"
              : "Relato com sinal de " + IA.ROTULOS[an.classe].toLowerCase()
        });
      }
      return { relato: r, alerta: alerta };
    }

    var rel1 = relato(20, 3, "ANONIMO", null, "8º Ano B", "Provocações no intervalo",
      "Tem um grupo da sala que fica colocando apelido em um colega e rindo dele todo dia no intervalo. Ninguém faz nada.");
    var rel2 = relato(13, 2, "CONFIDENCIAL", "Lucas Martins", "8º Ano B", "Não quero mais ir para o intervalo",
      "Desde o começo do mês me empurram e me chamam de nomes no corredor. Eu fico sozinho no recreio para evitar.");
    var rel3 = relato(6, 4, "SITUACAO_DE_RISCO", "Ana Clara Souza", "9º Ano A", "Preciso de ajuda",
      "Estou me sentindo muito sozinha e triste, não consigo parar de chorar e não quero contar para minha família.");
    relato(3, 5, "CONFIDENCIAL", "Mariana Lima", "9º Ano C", "Ansiedade com as provas",
      "Fico muito nervosa e ansiosa antes das provas e não consigo dormir direito.");
    relato(1, 2, "ANONIMO", null, "7º Ano B", "Duas colegas sempre de fora",
      "Na hora do trabalho em grupo sempre deixam duas colegas de fora e ninguém quer fazer dupla com elas.");
    relato(0, 2, "ANONIMO", null, null, "Ameaça na saída",
      "Um aluno mais velho disse que vai me bater na saída da escola amanhã.");

    /* ---- intervenções (RF06) e efeito nos alertas (RN07) ---- */
    var contexto = { checkins: col.checkins, respostas: col.respostas, insights: col.insights };
    function intervencao(diasAtras, alvo, tipo, status, descricao, dinamicaId, alertasAlvo, statusAlerta) {
      var data = new Date(agora.getTime() - diasAtras * 86400000 - 3 * 3600000);
      var serie = alvo.uid ? N.Indicadores.serieEstudante(alvo.uid, contexto.checkins, contexto.respostas) : N.Indicadores.serieTurma(alvo.turma, contexto.insights);
      var antes = N.Indicadores.mediaRecente(serie, Config.janelaEficaciaDias, data.toISOString());
      var resp = diasAtras > 10 ? "Paulo Cesar" : "Marina Prado";
      var iv = {
        id: id("iv"), alertaId: alertasAlvo[0] ? alertasAlvo[0].id : null,
        alvoTipo: alvo.uid ? "estudante" : "turma", estudanteUid: alvo.uid || null, estudanteNome: alvo.nome || null,
        turma: alvo.turma, tipo: tipo, descricao: descricao, dinamicaId: dinamicaId || null,
        responsavel: resp, responsavelUid: null, dataRegistro: data.toISOString(), status: status,
        metricasAssociadas: { indicadorAntes: antes.media, registrosAntes: antes.n, janelaDias: Config.janelaEficaciaDias },
        historico: [{ data: data.toISOString(), status: status === "concluida" ? "em_andamento" : status, por: resp, nota: "Intervenção registrada" }]
      };
      if (status === "concluida") iv.historico.push({ data: new Date(data.getTime() + 4 * 86400000).toISOString(), status: "concluida", por: resp, nota: "Acompanhamento encerrado" });
      col.intervencoes.push(iv);
      alertasAlvo.forEach(function (a) {
        if (!a || a.criadoEm > data.toISOString()) return;
        a.lido = true; a.status = statusAlerta; a.revisaoHumana = "realizada"; a.ultimaIntervencaoId = iv.id;
        a.historico = [{ data: data.toISOString(), de: "novo", para: statusAlerta, intervencaoId: iv.id, por: resp }];
      });
      return iv;
    }
    function alertasDe(uid, ate) {
      return col.alertas.filter(function (a) { return a.estudanteUid === uid && a.criadoEm <= ate; });
    }
    var lucas = usuarioPorNome("Lucas Martins"), anaClara = usuarioPorNome("Ana Clara Souza"), pedro = usuarioPorNome("Pedro Henrique");
    var t18 = new Date(agora.getTime() - 18 * 86400000).toISOString();
    var t12 = new Date(agora.getTime() - 12 * 86400000).toISOString();
    var t9 = new Date(agora.getTime() - 9 * 86400000).toISOString();
    var t5 = new Date(agora.getTime() - 5 * 86400000).toISOString();

    intervencao(18, { turma: "8º Ano B" }, "Roda de conversa", "concluida",
      "Roda de conversa com a turma sobre apelidos e respeito. A turma definiu três acordos de convivência, que ficaram no mural da sala.",
      "circulo-dialogo", [rel1.alerta], "resolvido");
    intervencao(12, { uid: lucas.id, nome: lucas.nome, turma: lucas.turma }, "Mediação individual", "concluida",
      "Conversa individual com o estudante e mediação com os colegas envolvidos. Combinado acompanhamento no intervalo por duas semanas.",
      null, [rel2.alerta].concat(alertasDe(lucas.id, t12)), "resolvido");
    intervencao(9, { uid: pedro.id, nome: pedro.nome, turma: pedro.turma }, "Contato com a família", "concluida",
      "Reunião com a responsável para alinhar a rotina de sono e combinar sinais de atenção em casa e na escola.",
      null, alertasDe(pedro.id, t9), "resolvido");
    intervencao(7, { turma: "9º Ano C" }, "Dinâmica em sala", "concluida",
      "Prática de respiração no início das aulas na semana de provas e montagem de um plano de estudos em partes com a turma.",
      "respiracao-inicio", [], "resolvido");
    intervencao(5, { uid: anaClara.id, nome: anaClara.nome, turma: anaClara.turma }, "Atendimento psicológico", "em_andamento",
      "Acolhimento com a psicóloga escolar. Encontros semanais combinados e contato com a família autorizado pela estudante.",
      null, [rel3.alerta].concat(alertasDe(anaClara.id, t5)), "em_acompanhamento");

    /* Alertas mais antigos sem intervenção já foram lidos, mas seguem aguardando ação. */
    var limiteLido = new Date(agora.getTime() - 2 * 86400000).toISOString();
    col.alertas.forEach(function (a) { if (a.status === "novo" && a.criadoEm < limiteLido) a.lido = true; });
    void t18;

    col.configuracoes.push(Object.assign({ id: "escola" }, Config.configEscolaPadrao));
    return col;
  }

  SM.Semente = {
    versao: VERSAO,
    gerar: gerar,
    aplicar: function () {
      var c = gerar();
      SM.Dados.Local.limparTudo();
      SM.Dados.Local.gravarColecoes(c);
      SM.Dados.marcarVersaoLocal(VERSAO + "|" + new Date().toISOString());
      return c;
    },
    garantir: function () {
      var v = SM.Dados.versaoLocal();
      if (!v || v.split("|")[0] !== VERSAO) SM.Semente.aplicar();
    },
    idadeDias: function () {
      var v = SM.Dados.versaoLocal();
      if (!v) return null;
      return Math.floor((Date.now() - new Date(v.split("|")[1]).getTime()) / 86400000);
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
