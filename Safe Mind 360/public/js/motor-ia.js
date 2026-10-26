/* =====================================================================
   SafeMind 360 — CAMADA DE NEGÓCIO • MotorIA
   RF04  Processar dados para identificar padrões de conflito e exclusão social.
   RN01  Atuação auxiliar: o motor só faz triagem e sinaliza. Ele NÃO emite
         diagnóstico, rótulo ou punição — toda saída é revisada por pessoas.
   RNF03 Métricas de confiabilidade: F1 macro e revocação da classe
         "Situação de Risco" calculadas por avaliarModelo().

   Técnica: Processamento de Linguagem Natural baseado em léxico, com
   normalização de gírias/abreviações, tratamento de negação e marcadores
   de repetição (característica central do bullying). Funções puras, sem
   acesso a dados — por isso também rodam em Node (pasta /testes).
   ===================================================================== */
(function (raiz) {
  "use strict";
  var SM = raiz.SafeMind = raiz.SafeMind || {};

  var CLASSES = ["SITUACAO_DE_RISCO", "CONFLITO", "EXCLUSAO_SOCIAL", "SOFRIMENTO_EMOCIONAL", "NEUTRO"];
  var ROTULOS = {
    SITUACAO_DE_RISCO: "Situação de risco",
    CONFLITO: "Conflito / bullying",
    EXCLUSAO_SOCIAL: "Exclusão social",
    SOFRIMENTO_EMOCIONAL: "Sofrimento emocional",
    NEUTRO: "Sem sinal"
  };
  var ORDEM_GRAU = { baixo: 0, moderado: 1, alto: 2 };

  /* ---------------- Normalização ---------------- */
  var GIRIAS = {
    vc: "voce", vcs: "voces", pq: "porque", q: "que", n: "nao", nn: "nao", naum: "nao",
    mt: "muito", mto: "muito", mta: "muita", tbm: "tambem", tb: "tambem", tmb: "tambem",
    ngm: "ninguem", td: "tudo", tds: "todos", hj: "hoje", agr: "agora", cmg: "comigo",
    msm: "mesmo", dms: "demais", nd: "nada", to: "estou", ta: "esta", tava: "estava",
    tao: "estao", pra: "para", pro: "para o", p: "para", qnd: "quando", qdo: "quando",
    oq: "o que", sla: "sei la", vdd: "verdade", mds: "meu deus", fds: "fim de semana"
  };

  function normalizar(texto) {
    var t = String(texto || "").toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
    return t.split(" ").map(function (p) { return GIRIAS.hasOwnProperty(p) ? GIRIAS[p] : p; }).join(" ");
  }

  /* ---------------- Léxico ----------------
     Padrões casam no início de palavra (radicais: "humilh" casa "humilharam").
     Padrão terminado em espaço exige palavra inteira ("mal " não casa "malha"). */
  var LEXICO = {
    SITUACAO_DE_RISCO: [
      ["quero morrer", 5], ["queria morrer", 5], ["vontade de morrer", 5], ["penso em morrer", 5],
      ["pensando em morrer", 5], ["me matar", 5], ["se matar", 5], ["suicid", 5],
      ["tirar minha vida", 5], ["tirar a minha vida", 5], ["acabar com minha vida", 5], ["acabar com a minha vida", 5],
      ["nao quero mais viver", 5], ["nao quero viver", 5], ["sem vontade de viver", 5], ["nao aguento mais viver", 5],
      ["se eu nao existisse", 5], ["melhor sem mim", 5], ["sumir pra sempre", 5], ["desaparecer pra sempre", 5],
      ["quero desaparecer", 5], ["queria desaparecer", 5], ["querer desaparecer", 5], ["quero sumir", 4], ["queria sumir", 4],
      ["me cortar", 5], ["me corto", 5], ["me cortei", 5], ["me machucar", 5], ["me machuco", 5], ["automutil", 5], ["me ferir", 5],
      ["me ameac", 5], ["ameacou", 5], ["ameacaram", 5], ["ameacando", 5], ["ameaca de", 4],
      ["vao me bater", 5], ["vai me bater", 5], ["vou apanhar", 5], ["me bateram", 5], ["me bate ", 5], ["me bateu", 5],
      ["apanhei", 5], ["me espanc", 5], ["me agred", 5], ["agredid", 5], ["agrediram", 5], ["agressao", 4],
      ["arma ", 5], ["armas ", 5], ["faca ", 5], ["revolver", 5],
      ["abuso", 5], ["abusou", 5], ["abusaram", 5], ["assedi", 5], ["me tocou", 4], ["tocou no meu corpo", 5],
      ["me forcou", 5], ["pediu segredo", 4], ["segredo entre nos", 4], ["pediu para eu nao contar", 4],
      ["em perigo", 5], ["nao estou seguro", 5], ["nao estou segura", 5],
      ["medo de voltar para casa", 5], ["medo de ir para casa", 5], ["preciso de ajuda agora", 5], ["socorro", 4]
    ],
    CONFLITO: [
      ["bullying", 3], ["bulin", 3], ["sofro bul", 3],
      ["zoam", 2], ["zoaram", 2], ["zoando", 2], ["zoacao", 2], ["zoou", 2], ["me zoar", 2],
      ["tiram sarro", 2], ["tiraram sarro", 2], ["tirando sarro", 2], ["sarro de mim", 2],
      ["apelido", 2], ["me chamam de", 2], ["me chamaram de", 2], ["me chama de", 2],
      ["riem de mim", 2], ["riram de mim", 2], ["rindo de mim", 2], ["ri de mim", 2],
      ["debocha", 2], ["deboch", 2], ["humilh", 3], ["xing", 2], ["provoc", 2],
      ["empurr", 2], ["me chut", 2], ["chutaram", 2], ["puxaram meu", 2], ["puxou meu", 2],
      ["briga", 2], ["brigaram", 2], ["brigando", 2], ["discussao", 1],
      ["pegaram minhas coisas", 2], ["pegaram meu", 2], ["pegaram minha", 2], ["esconderam", 2], ["rasgaram", 2],
      ["fofoca", 2], ["espalharam", 2], ["espalhou", 2], ["inventaram", 2], ["mentira sobre mim", 2], ["mentiras sobre mim", 2],
      ["meme", 2], ["figurinha", 1], ["postaram", 1], ["print", 1], ["grupo da sala", 1], ["grupo da turma", 1],
      ["me expus", 2], ["expuseram", 2], ["intimid", 2], ["persegu", 2], ["implicam", 2], ["implica comigo", 2],
      ["pegam no meu pe", 2], ["pegando no meu pe", 2], ["racis", 3], ["preconceito", 2], ["homofob", 3]
    ],
    EXCLUSAO_SOCIAL: [
      ["sozinh", 1], ["solidao", 2], ["ninguem fala comigo", 3], ["ninguem conversa comigo", 3],
      ["ninguem gosta de mim", 3], ["ninguem me", 2], ["ninguem senta", 3], ["ninguem quer", 2],
      ["me exclu", 2], ["exclusao", 2], ["excluid", 2], ["excluem", 2],
      ["deixam de lado", 2], ["deixaram de lado", 2], ["deixam de fora", 2], ["deixaram de fora", 2],
      ["fico de fora", 2], ["fiquei de fora", 2], ["nao tenho amigo", 3], ["nao tenho nenhum amigo", 3],
      ["sem amigo", 3], ["perdi meus amigos", 3], ["isolad", 2], ["me isol", 2],
      ["ignoram", 2], ["me ignor", 2], ["nao me chamam", 2], ["nunca me cham", 2], ["nao me convid", 2],
      ["invisivel", 2], ["nao me encaixo", 2], ["nao pertenco", 2], ["nao faco parte", 2],
      ["me evitam", 2], ["rejeit", 2]
    ],
    SOFRIMENTO_EMOCIONAL: [
      ["triste", 2], ["tristeza", 2], ["chor", 2], ["desanim", 2], ["desmotiv", 2], ["sem vontade", 2],
      ["sem animo", 2], ["deprimid", 2], ["depressao", 2], ["vazio", 1], ["ansios", 2], ["ansiedade", 2],
      ["nervos", 2], ["preocup", 1], ["angusti", 2], ["panico", 2], ["crise", 1], ["medo", 1],
      ["estress", 2], ["pressao", 1], ["cobranca", 1], ["nao consigo dormir", 2], ["insonia", 2],
      ["cansad", 1], ["exaust", 2], ["sobrecarreg", 2], ["esgotad", 2], ["sem energia", 2],
      ["mal ", 1], ["pessimo", 2], ["horrivel", 2], ["dia pesado", 2], ["dia ruim", 2], ["dia dificil", 2],
      ["raiva", 2], ["irritad", 1], ["frustrad", 2], ["culpa", 1], ["inutil", 2], ["fracass", 2],
      ["me odeio", 3], ["odeio minha vida", 3], ["nao aguento mais", 3], ["aperto no peito", 2],
      ["nada tem graca", 2], ["perdi a vontade", 2]
    ],
    POSITIVO: [
      ["feliz", 2], ["alegre", 2], ["animad", 2], ["tranquil", 1], ["bem ", 1], ["otimo", 2], ["legal", 1],
      ["massa", 1], ["consegui", 1], ["orgulh", 2], ["gostei", 2], ["amei", 2], ["divertid", 2],
      ["dia bom", 2], ["foi bom", 2], ["me ajudou", 1], ["fiz amigos", 2], ["fiz um amigo", 2], ["fiz uma amiga", 2],
      ["ganhou", 1], ["ganhamos", 1]
    ]
  };

  var REPETICAO = ["sempre", "todo dia", "todos os dias", "toda hora", "toda vez", "de novo", "outra vez",
    "toda semana", "continuam", "nao param", "vive me", "vivem me", "desde o", "desde a", "faz tempo"];
  var NEGADORES = ["nao", "nunca", "nem", "jamais", "sem"];

  /* Pré-normaliza o léxico (ex.: "pra" → "para") preservando o espaço final. */
  function prepararPadrao(p) {
    var inteiro = p.charAt(p.length - 1) === " ";
    return normalizar(p) + (inteiro ? " " : "");
  }
  Object.keys(LEXICO).forEach(function (c) {
    LEXICO[c] = LEXICO[c].map(function (par) { return [prepararPadrao(par[0]), par[1]]; });
  });
  REPETICAO = REPETICAO.map(prepararPadrao);

  function negado(textoAntes) {
    var ultimas = textoAntes.trim().split(" ").slice(-2);
    return ultimas.some(function (p) { return NEGADORES.indexOf(p) !== -1; });
  }

  /* ---------------- PLN: análise de um texto ---------------- */
  function analisarTexto(texto) {
    var norm = normalizar(texto);
    var alvo = " " + norm + " ";
    var pontos = { SITUACAO_DE_RISCO: 0, CONFLITO: 0, EXCLUSAO_SOCIAL: 0, SOFRIMENTO_EMOCIONAL: 0, POSITIVO: 0 };
    var termos = [];

    Object.keys(LEXICO).forEach(function (classe) {
      LEXICO[classe].forEach(function (par) {
        var padrao = par[0], peso = par[1];
        var pos = alvo.indexOf(" " + padrao);
        if (pos === -1) return;
        var comecaNegando = NEGADORES.indexOf(padrao.split(" ")[0]) !== -1;
        var ehNegado = !comecaNegando && negado(alvo.slice(0, pos));
        if (classe === "POSITIVO") {
          /* "não estou bem" → sinal de sofrimento */
          if (ehNegado) { pontos.SOFRIMENTO_EMOCIONAL += Math.max(2, peso); termos.push("não " + padrao.trim()); }
          else pontos.POSITIVO += peso;
          return;
        }
        if (classe === "SOFRIMENTO_EMOCIONAL" && ehNegado) return; /* "não estou triste" */
        pontos[classe] += peso;
        termos.push(padrao.trim());
      });
    });

    var repeticao = REPETICAO.some(function (r) { return alvo.indexOf(" " + r) !== -1; });
    if (repeticao) {
      pontos.CONFLITO *= 1.5;
      pontos.EXCLUSAO_SOCIAL *= 1.5;
    }

    /* Classificação — prioriza a revocação de "Situação de Risco" (RNF03). */
    var classe = "NEUTRO";
    if (pontos.SITUACAO_DE_RISCO > 0) {
      classe = "SITUACAO_DE_RISCO";
    } else {
      var candidatos = [
        ["CONFLITO", pontos.CONFLITO, 2],
        ["EXCLUSAO_SOCIAL", pontos.EXCLUSAO_SOCIAL, 2],
        ["SOFRIMENTO_EMOCIONAL", pontos.SOFRIMENTO_EMOCIONAL, 2]
      ].filter(function (c) { return c[1] >= c[2]; });
      candidatos.sort(function (a, b) { return b[1] - a[1]; }); /* empate mantém a ordem acima */
      if (candidatos.length) classe = candidatos[0][0];
      if (classe === "SOFRIMENTO_EMOCIONAL" && pontos.POSITIVO > pontos.SOFRIMENTO_EMOCIONAL) classe = "NEUTRO";
    }

    var grauRisco = "baixo";
    if (classe === "SITUACAO_DE_RISCO") grauRisco = "alto";
    else if (classe === "CONFLITO") grauRisco = "moderado";
    else if (classe === "EXCLUSAO_SOCIAL" && pontos.EXCLUSAO_SOCIAL >= 2) grauRisco = "moderado";
    else if (classe === "SOFRIMENTO_EMOCIONAL" && pontos.SOFRIMENTO_EMOCIONAL >= 4) grauRisco = "moderado";

    var categorias = ["SITUACAO_DE_RISCO", "CONFLITO", "EXCLUSAO_SOCIAL", "SOFRIMENTO_EMOCIONAL"]
      .filter(function (c) { return pontos[c] >= (c === "SITUACAO_DE_RISCO" ? 1 : 2); });

    var valores = [pontos.SITUACAO_DE_RISCO, pontos.CONFLITO, pontos.EXCLUSAO_SOCIAL, pontos.SOFRIMENTO_EMOCIONAL].sort(function (a, b) { return b - a; });
    var margem = classe === "NEUTRO" ? 0 : valores[0] - valores[1];
    var confianca = classe === "SITUACAO_DE_RISCO" ? 92 : classe === "NEUTRO" ? 60 : Math.min(95, 55 + margem * 8);

    var negativos = pontos.SITUACAO_DE_RISCO * 2 + pontos.CONFLITO + pontos.EXCLUSAO_SOCIAL + pontos.SOFRIMENTO_EMOCIONAL;
    var sentimento = Math.max(-1, Math.min(1, (pontos.POSITIVO - negativos) / (pontos.POSITIVO + negativos + 1)));

    return {
      classe: classe,
      rotulo: ROTULOS[classe],
      grauRisco: grauRisco,
      categorias: categorias,
      pontos: pontos,
      repeticao: repeticao,
      sentimento: Math.round(sentimento * 100) / 100,
      confianca: Math.round(confianca),
      termos: termos.slice(0, 5)
    };
  }

  function maiorGrau(a, b) { return ORDEM_GRAU[a] >= ORDEM_GRAU[b] ? a : b; }

  /* ---------------- Check-in socioemocional ----------------
     anteriores: check-ins do próprio estudante, em ordem cronológica.
     Alertas por padrão são "de borda": só disparam quando o padrão aparece,
     e não a cada novo registro enquanto ele continua (evita alerta repetido). */
  var SENTIMENTO_CATEGORIA = {
    "Sozinho(a)": "EXCLUSAO_SOCIAL", "Excluído(a)": "EXCLUSAO_SOCIAL",
    "Triste": "SOFRIMENTO_EMOCIONAL", "Ansioso(a)": "SOFRIMENTO_EMOCIONAL", "Com raiva": "SOFRIMENTO_EMOCIONAL",
    "Com medo": "SOFRIMENTO_EMOCIONAL", "Preocupado(a)": "SOFRIMENTO_EMOCIONAL"
  };

  function media(lista) {
    return lista.length ? lista.reduce(function (s, v) { return s + v; }, 0) / lista.length : null;
  }

  function avaliarCheckin(checkin, anteriores) {
    anteriores = (anteriores || []).slice().sort(function (a, b) { return a.dataHora < b.dataHora ? -1 : 1; });
    var estado = checkin.estadoSocioemocional;
    var texto = analisarTexto(checkin.notas || "");
    var motivos = [];
    var categorias = texto.categorias.slice();
    var catSent = SENTIMENTO_CATEGORIA[checkin.sentimentoSugerido];
    if (catSent && estado <= 3 && categorias.indexOf(catSent) === -1) categorias.push(catSent);

    if (estado === 1) motivos.push({ codigo: "humor_muito_baixo", grau: "moderado", texto: "Registro de humor \"Muito mal\"" });

    var ultimos = anteriores.slice(-4).concat([checkin]);
    var baixos = ultimos.filter(function (c) { return c.estadoSocioemocional <= 2; }).length;
    if (baixos >= 3) motivos.push({ codigo: "humor_baixo_persistente", grau: "moderado", texto: "Humor baixo em " + baixos + " dos últimos " + ultimos.length + " check-ins" });

    var todos = anteriores.concat([checkin]);
    var recentes = todos.slice(-3).map(function (c) { return c.estadoSocioemocional; });
    var base = todos.slice(-10, -3).map(function (c) { return c.estadoSocioemocional; });
    if (base.length >= 4 && media(recentes) <= media(base) - 1.5) {
      motivos.push({ codigo: "queda_acentuada", grau: "moderado", texto: "Queda acentuada de bem-estar em relação aos dias anteriores" });
    }

    if (texto.grauRisco !== "baixo") {
      motivos.push({ codigo: "texto_" + texto.classe.toLowerCase(), grau: texto.grauRisco, texto: "Anotação com sinal de " + texto.rotulo.toLowerCase() });
    }

    var grau = motivos.reduce(function (g, m) { return maiorGrau(g, m.grau); }, "baixo");

    /* Disparo "de borda":
       • risco alto → sempre alerta;
       • sinal no texto → alerta se não houve o mesmo sinal nas últimas 72 h;
       • padrão de humor → alerta quando o padrão começa (não estava ativo no
         check-in anterior) e não foi alertado nos últimos 7 dias. */
    var t = new Date(checkin.dataHora).getTime();
    var lim72 = new Date(t - 72 * 3600000).toISOString();
    var lim7d = new Date(t - 7 * 86400000).toISOString();
    var alertado72 = {}, alertado7d = {};
    anteriores.forEach(function (c) {
      var cods = (c.analise && c.analise.motivosAlertados) || [];
      cods.forEach(function (cod) {
        if (c.dataHora >= lim72) alertado72[cod] = true;
        if (c.dataHora >= lim7d) alertado7d[cod] = true;
      });
    });
    var anterior = anteriores[anteriores.length - 1];
    var ativosAntes = (anterior && anterior.analise && anterior.analise.motivosAtivos) || [];
    var paraAlertar = motivos.filter(function (m) {
      if (m.grau === "alto") return true;
      if (m.codigo.indexOf("texto_") === 0) return !alertado72[m.codigo];
      return ativosAntes.indexOf(m.codigo) === -1 && !alertado7d[m.codigo];
    });

    return {
      grauRisco: grau,
      classe: texto.classe,
      categorias: categorias,
      motivos: motivos,
      motivosAtivos: motivos.map(function (m) { return m.codigo; }),
      motivosAlertados: paraAlertar.map(function (m) { return m.codigo; }),
      gerarAlerta: paraAlertar.length > 0 && grau !== "baixo",
      termos: texto.termos,
      valor: Math.round((estado - 1) * 25)
    };
  }

  /* ---------------- Questionário periódico ----------------
     Escala de frequência 1..5 (Nunca … Sempre).
     Perguntas "invertidas" descrevem algo ruim (ex.: sofrer provocações). */
  function avaliarQuestionario(questionario, respostas) {
    var porDimensao = {};
    var valores = [];
    var motivos = [];
    var categorias = [];
    (questionario.perguntas || []).forEach(function (p) {
      var v = Number(respostas[p.id]);
      if (!v) return;
      var positivo = p.invertida ? 6 - v : v;
      var norm = (positivo - 1) / 4 * 100;
      valores.push(norm);
      (porDimensao[p.dimensao] = porDimensao[p.dimensao] || []).push(norm);
      if (p.dimensao === "conflito" && positivo <= 2) {
        motivos.push({ codigo: "q_conflito", grau: "moderado", texto: "Relata provocações ou apelidos com frequência" });
        categorias.push("CONFLITO");
      }
      if (p.dimensao === "exclusao" && positivo <= 2) {
        motivos.push({ codigo: "q_exclusao", grau: "moderado", texto: "Relata sentir-se deixado(a) de lado com frequência" });
        categorias.push("EXCLUSAO_SOCIAL");
      }
      if (p.dimensao === "pertencimento" && positivo <= 2) categorias.push("EXCLUSAO_SOCIAL");
      if (p.dimensao === "seguranca" && positivo === 1) {
        motivos.push({ codigo: "q_inseguranca", grau: "moderado", texto: "Diz nunca se sentir seguro(a) na escola" });
      }
    });
    var indice = valores.length ? Math.round(media(valores)) : null;
    if (indice !== null && indice < 40) motivos.push({ codigo: "q_indice_baixo", grau: "moderado", texto: "Índice de convivência baixo (" + indice + "/100)" });
    var dimensoes = {};
    Object.keys(porDimensao).forEach(function (d) { dimensoes[d] = Math.round(media(porDimensao[d])); });
    var grau = motivos.reduce(function (g, m) { return maiorGrau(g, m.grau); }, "baixo");
    return {
      indice: indice,
      dimensoes: dimensoes,
      grauRisco: grau,
      categorias: categorias.filter(function (c, i) { return categorias.indexOf(c) === i; }),
      motivos: motivos,
      gerarAlerta: grau !== "baixo"
    };
  }

  /* ---------------- Relato voluntário ----------------
     RN04: escolhido pelo estudante OU identificado pela IA como risco → alerta prioritário. */
  function avaliarRelato(relato) {
    var t = analisarTexto((relato.titulo || "") + ". " + (relato.descricao || ""));
    var grau = t.grauRisco;
    var origemRisco = null;
    if (relato.nivelPrivacidade === "SITUACAO_DE_RISCO") { grau = "alto"; origemRisco = "estudante"; }
    else if (t.classe === "SITUACAO_DE_RISCO") { origemRisco = "ia"; }
    return Object.assign({}, t, {
      grauRisco: grau,
      prioritario: grau === "alto",
      origemRisco: origemRisco,
      gerarAlerta: grau !== "baixo"
    });
  }

  /* ---------------- Padrões por turma (DashboardInsights) ----------------
     eventos: registros anônimos da turma ({dia, valor, categorias, grauRisco}). */
  function diaISO(d) {
    var x = new Date(d);
    return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0");
  }
  function somarDias(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }

  function padroesTurma(eventos, opcoes) {
    opcoes = opcoes || {};
    var hoje = opcoes.hoje ? new Date(opcoes.hoje) : new Date();
    var k = opcoes.kMinimo || 5;
    var d7 = diaISO(somarDias(hoje, -6)), d14 = diaISO(somarDias(hoje, -13));
    var ult7 = eventos.filter(function (e) { return e.dia >= d7; });
    var ant7 = eventos.filter(function (e) { return e.dia >= d14 && e.dia < d7; });
    var j14 = eventos.filter(function (e) { return e.dia >= d14; });
    function valoresDe(lista) { return lista.filter(function (e) { return typeof e.valor === "number"; }).map(function (e) { return e.valor; }); }
    var v7 = valoresDe(ult7), vAnt = valoresDe(ant7);
    var indice = v7.length ? Math.round(media(v7)) : null;
    var indiceAnterior = vAnt.length ? Math.round(media(vAnt)) : null;
    var variacao = indice !== null && indiceAnterior !== null && vAnt.length >= k ? indice - indiceAnterior : null;

    function proporcao(cat) {
      return j14.length ? j14.filter(function (e) { return (e.categorias || []).indexOf(cat) !== -1; }).length / j14.length : 0;
    }
    var proporcoes = {
      CONFLITO: proporcao("CONFLITO"),
      EXCLUSAO_SOCIAL: proporcao("EXCLUSAO_SOCIAL"),
      SOFRIMENTO_EMOCIONAL: proporcao("SOFRIMENTO_EMOCIONAL")
    };

    /* Série diária (14 dias). Dias com poucos registros ficam vazios (RN05). */
    var serie = [];
    for (var i = 13; i >= 0; i--) {
      var dia = diaISO(somarDias(hoje, -i));
      var doDia = valoresDe(eventos.filter(function (e) { return e.dia === dia; }));
      serie.push({ dia: dia, valor: doDia.length >= 3 ? Math.round(media(doDia)) : null, n: doDia.length });
    }

    var suficiente = v7.length >= k;
    var alertas = [];
    if (suficiente) {
      if (indice < 55) alertas.push({ codigo: "clima_baixo", grau: "moderado", titulo: "Clima da turma abaixo do esperado", texto: "Índice de clima em " + indice + "/100 nos últimos 7 dias." });
      if (variacao !== null && variacao <= -10) alertas.push({ codigo: "queda_clima", grau: "moderado", titulo: "Queda no clima da turma", texto: variacao + " pontos em relação à semana anterior." });
      if (j14.length >= k && proporcoes.CONFLITO >= 0.15) alertas.push({ codigo: "conflito_recorrente", grau: "moderado", titulo: "Sinais de conflito recorrentes", texto: Math.round(proporcoes.CONFLITO * 100) + "% dos registros dos últimos 14 dias trazem sinais de conflito ou provocação." });
      if (j14.length >= k && proporcoes.EXCLUSAO_SOCIAL >= 0.12) alertas.push({ codigo: "exclusao_recorrente", grau: "moderado", titulo: "Sinais de exclusão social", texto: Math.round(proporcoes.EXCLUSAO_SOCIAL * 100) + "% dos registros dos últimos 14 dias indicam isolamento ou exclusão." });
    }
    var tensao = !suficiente ? "indefinida" : (alertas.length >= 2 || proporcoes.CONFLITO >= 0.25) ? "elevada" : alertas.length === 1 ? "moderada" : "baixa";
    var dominantes = Object.keys(proporcoes).filter(function (c) { return proporcoes[c] >= 0.08; })
      .sort(function (a, b) { return proporcoes[b] - proporcoes[a]; });

    return {
      suficiente: suficiente,
      registros7: ult7.length,
      registros14: j14.length,
      indice: suficiente ? indice : null,
      indiceAnterior: indiceAnterior,
      variacao: suficiente ? variacao : null,
      proporcoes: proporcoes,
      dominantes: dominantes,
      serie: serie,
      alertas: alertas,
      tensao: tensao
    };
  }

  /* ---------------- RF07: eficácia de uma intervenção ----------------
     serie: [{data: ISO, valor: 0..100, sinal: bool}] do alvo (estudante ou turma). */
  function medirEficacia(intervencao, serie, opcoes) {
    opcoes = opcoes || {};
    var janela = (opcoes.janelaDias || 14) * 86400000;
    var t0 = new Date(intervencao.dataRegistro).getTime();
    var agora = opcoes.agora ? new Date(opcoes.agora).getTime() : Date.now();
    var antes = serie.filter(function (p) { var t = new Date(p.data).getTime(); return t >= t0 - janela && t < t0; });
    var depois = serie.filter(function (p) { var t = new Date(p.data).getTime(); return t > t0 && t <= Math.min(t0 + janela, agora); });
    var vAntes = antes.filter(function (p) { return typeof p.valor === "number"; }).map(function (p) { return p.valor; });
    var vDepois = depois.filter(function (p) { return typeof p.valor === "number"; }).map(function (p) { return p.valor; });
    var diasDepois = Math.max(0, Math.floor((Math.min(t0 + janela, agora) - t0) / 86400000));
    var r = {
      antes: vAntes.length ? Math.round(media(vAntes)) : null,
      depois: vDepois.length ? Math.round(media(vDepois)) : null,
      nAntes: vAntes.length, nDepois: vDepois.length,
      sinaisAntes: antes.filter(function (p) { return p.sinal; }).length,
      sinaisDepois: depois.filter(function (p) { return p.sinal; }).length,
      diasObservados: diasDepois,
      variacao: null,
      resultado: "insuficiente"
    };
    /* Só julga depois de pelo menos 7 dias e 2 registros em cada lado. */
    if (vAntes.length >= 2 && vDepois.length >= 2 && diasDepois >= 7) {
      r.variacao = r.depois - r.antes;
      r.resultado = r.variacao >= 5 ? "melhora" : r.variacao <= -5 ? "piora" : "estavel";
    }
    return r;
  }

  /* ---------------- RNF03: avaliação do motor ----------------
     Conjunto rotulado de frases curtas no estilo dos relatos de estudantes.
     ATENÇÃO: é um conjunto SINTÉTICO, escrito pela equipe do projeto para
     verificar o protótipo. A meta do RNF03 só é comprovada com dados reais
     anotados por profissionais (psicologia/coordenação). */
  var CONJUNTO_VALIDACAO = [
    ["não aguento mais, às vezes penso em morrer", "SITUACAO_DE_RISCO"],
    ["eu queria sumir pra sempre, ninguém ia sentir falta", "SITUACAO_DE_RISCO"],
    ["tô pensando em me machucar de novo", "SITUACAO_DE_RISCO"],
    ["um menino da outra sala disse que vai me bater na saída", "SITUACAO_DE_RISCO"],
    ["eles me ameaçaram no banheiro e eu tô com medo", "SITUACAO_DE_RISCO"],
    ["meu padrasto me bate quando bebe", "SITUACAO_DE_RISCO"],
    ["não quero mais viver", "SITUACAO_DE_RISCO"],
    ["tenho medo de voltar pra casa hoje", "SITUACAO_DE_RISCO"],
    ["um adulto mexeu comigo de um jeito estranho e pediu segredo", "SITUACAO_DE_RISCO"],
    ["levaram uma faca pra escola e mostraram pra mim", "SITUACAO_DE_RISCO"],
    ["me cortei ontem de noite", "SITUACAO_DE_RISCO"],
    ["às vezes acho que seria melhor se eu não existisse", "SITUACAO_DE_RISCO"],
    ["fui agredido no ônibus da escola", "SITUACAO_DE_RISCO"],
    ["preciso de ajuda agora, por favor", "SITUACAO_DE_RISCO"],
    ["tô me sentindo em perigo em casa", "SITUACAO_DE_RISCO"],
    ["vc n sabe o q é querer desaparecer de tudo", "SITUACAO_DE_RISCO"],

    ["eles me zoam todo dia por causa do meu cabelo", "CONFLITO"],
    ["colocaram um apelido em mim e a sala toda ri", "CONFLITO"],
    ["postaram uma foto minha no grupo da sala pra me zoar", "CONFLITO"],
    ["o Pedro vive me empurrando no corredor", "CONFLITO"],
    ["me xingaram de novo no intervalo", "CONFLITO"],
    ["tiram sarro de mim porque eu gaguejo", "CONFLITO"],
    ["brigaram comigo por causa de um jogo e agora ficam me provocando", "CONFLITO"],
    ["espalharam uma mentira sobre mim pra turma", "CONFLITO"],
    ["pegaram meu estojo e jogaram no lixo", "CONFLITO"],
    ["riem de mim quando eu respondo na aula", "CONFLITO"],
    ["sofro bullying desde o sexto ano", "CONFLITO"],
    ["fizeram um meme comigo e todo mundo compartilhou", "CONFLITO"],
    ["a menina me chama de gorda na frente de todo mundo", "CONFLITO"],
    ["um grupo fica me perseguindo depois da aula", "CONFLITO"],
    ["debocham do meu sotaque", "CONFLITO"],
    ["teve uma discussão feia com meu colega e ele me humilhou", "CONFLITO"],

    ["ninguém quer fazer trabalho em grupo comigo", "EXCLUSAO_SOCIAL"],
    ["no recreio eu fico sozinho, ninguém fala comigo", "EXCLUSAO_SOCIAL"],
    ["me deixaram de fora do grupo da sala", "EXCLUSAO_SOCIAL"],
    ["não tenho amigos na escola nova", "EXCLUSAO_SOCIAL"],
    ["sinto que sou invisível pra minha turma", "EXCLUSAO_SOCIAL"],
    ["eles combinam as coisas e nunca me chamam", "EXCLUSAO_SOCIAL"],
    ["na hora do lanche todo mundo sai e eu fico de fora", "EXCLUSAO_SOCIAL"],
    ["me ignoram quando eu tento conversar", "EXCLUSAO_SOCIAL"],
    ["não me encaixo em nenhum grupo", "EXCLUSAO_SOCIAL"],
    ["perdi meus amigos depois que mudei de sala", "EXCLUSAO_SOCIAL"],
    ["ngm senta comigo no ônibus", "EXCLUSAO_SOCIAL"],
    ["me sinto excluída das conversas", "EXCLUSAO_SOCIAL"],
    ["ninguém me convidou pro aniversário, só eu", "EXCLUSAO_SOCIAL"],
    ["parece que ninguém gosta de mim aqui", "EXCLUSAO_SOCIAL"],
    ["fico isolado no canto da sala", "EXCLUSAO_SOCIAL"],
    ["as meninas me evitam desde a briga", "EXCLUSAO_SOCIAL"],

    ["tô muito ansioso com a prova de matemática", "SOFRIMENTO_EMOCIONAL"],
    ["chorei a noite toda e não sei bem por quê", "SOFRIMENTO_EMOCIONAL"],
    ["ando muito cansada, não consigo dormir direito", "SOFRIMENTO_EMOCIONAL"],
    ["minha cabeça tá cheia, muita pressão dos meus pais com nota", "SOFRIMENTO_EMOCIONAL"],
    ["me sinto triste quase todo dia", "SOFRIMENTO_EMOCIONAL"],
    ["fico nervoso quando tenho que apresentar trabalho", "SOFRIMENTO_EMOCIONAL"],
    ["estou desanimado com tudo", "SOFRIMENTO_EMOCIONAL"],
    ["sinto um aperto no peito antes da aula", "SOFRIMENTO_EMOCIONAL"],
    ["tô estressado com tanta tarefa", "SOFRIMENTO_EMOCIONAL"],
    ["hoje foi um dia pesado", "SOFRIMENTO_EMOCIONAL"],
    ["me sinto um fracasso", "SOFRIMENTO_EMOCIONAL"],
    ["não tô bem hoje", "SOFRIMENTO_EMOCIONAL"],
    ["fico com raiva de tudo e não sei explicar", "SOFRIMENTO_EMOCIONAL"],
    ["tô com medo de reprovar", "SOFRIMENTO_EMOCIONAL"],
    ["ultimamente nada tem graça", "SOFRIMENTO_EMOCIONAL"],
    ["me sinto sem energia pra fazer as coisas", "SOFRIMENTO_EMOCIONAL"],

    ["hoje foi tranquilo, joguei bola no intervalo", "NEUTRO"],
    ["gostei muito da aula de ciências", "NEUTRO"],
    ["tirei nota boa na prova!", "NEUTRO"],
    ["meus amigos e eu fizemos um trabalho legal", "NEUTRO"],
    ["tô bem, só com um pouco de sono", "NEUTRO"],
    ["amanhã tem passeio da escola, tô animado", "NEUTRO"],
    ["não estou triste, só cansado da educação física", "NEUTRO"],
    ["fiz uma amiga nova hoje", "NEUTRO"],
    ["a aula foi normal", "NEUTRO"],
    ["quero saber quando é a feira de ciências", "NEUTRO"],
    ["consegui terminar meu projeto, tô orgulhoso", "NEUTRO"],
    ["o lanche hoje tava bom", "NEUTRO"],
    ["não tenho nada pra reclamar hoje", "NEUTRO"],
    ["meu time ganhou o campeonato do interclasse", "NEUTRO"],
    ["fiquei um pouco preocupado com a prova mas estudei bastante", "NEUTRO"],
    ["a professora brigou com a sala porque ninguém fez a lição", "NEUTRO"]
  ];

  function avaliarModelo(conjunto) {
    conjunto = conjunto || CONJUNTO_VALIDACAO;
    var matriz = {};
    CLASSES.forEach(function (r) { matriz[r] = {}; CLASSES.forEach(function (p) { matriz[r][p] = 0; }); });
    var erros = [];
    conjunto.forEach(function (par) {
      var previsto = analisarTexto(par[0]).classe;
      matriz[par[1]][previsto]++;
      if (previsto !== par[1]) erros.push({ texto: par[0], esperado: par[1], previsto: previsto });
    });
    var porClasse = {};
    CLASSES.forEach(function (c) {
      var tp = matriz[c][c];
      var fp = CLASSES.reduce(function (s, r) { return s + (r !== c ? matriz[r][c] : 0); }, 0);
      var fn = CLASSES.reduce(function (s, p) { return s + (p !== c ? matriz[c][p] : 0); }, 0);
      var precisao = tp + fp ? tp / (tp + fp) : 0;
      var revocacao = tp + fn ? tp / (tp + fn) : 0;
      var f1 = precisao + revocacao ? 2 * precisao * revocacao / (precisao + revocacao) : 0;
      porClasse[c] = { precisao: precisao, revocacao: revocacao, f1: f1, suporte: tp + fn };
    });
    var f1Macro = media(CLASSES.map(function (c) { return porClasse[c].f1; }));
    var acuraciaBalanceada = media(CLASSES.map(function (c) { return porClasse[c].revocacao; }));
    var acertos = CLASSES.reduce(function (s, c) { return s + matriz[c][c]; }, 0);
    var metas = (SM.Config && SM.Config.metasIA) || { f1Macro: 0.8, recallRisco: 0.9 };
    var recallRisco = porClasse.SITUACAO_DE_RISCO.revocacao;
    return {
      total: conjunto.length,
      classes: CLASSES,
      rotulos: ROTULOS,
      matriz: matriz,
      porClasse: porClasse,
      f1Macro: f1Macro,
      recallRisco: recallRisco,
      acuraciaBalanceada: acuraciaBalanceada,
      acuracia: acertos / conjunto.length,
      falsosNegativosRisco: porClasse.SITUACAO_DE_RISCO.suporte - matriz.SITUACAO_DE_RISCO.SITUACAO_DE_RISCO,
      atendeF1: f1Macro >= metas.f1Macro,
      atendeRecall: recallRisco >= metas.recallRisco,
      metas: metas,
      erros: erros
    };
  }

  SM.MotorIA = {
    CLASSES: CLASSES,
    ROTULOS: ROTULOS,
    CONJUNTO_VALIDACAO: CONJUNTO_VALIDACAO,
    normalizar: normalizar,
    analisarTexto: analisarTexto,
    avaliarCheckin: avaliarCheckin,
    avaliarQuestionario: avaliarQuestionario,
    avaliarRelato: avaliarRelato,
    padroesTurma: padroesTurma,
    medirEficacia: medirEficacia,
    avaliarModelo: avaliarModelo,
    maiorGrau: maiorGrau,
    diaISO: diaISO,
    media: media
  };

  if (typeof module !== "undefined" && module.exports) module.exports = SM.MotorIA;
})(typeof window !== "undefined" ? window : globalThis);
