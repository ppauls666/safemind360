/* =====================================================================
   SafeMind 360 — CAMADA DE NEGÓCIO
   Entidades (Diagrama de Classes, seção 8.2), regras RN01–RN07,
   permissões por perfil (RF08/RN06) e serviços usados pelas telas.
   ===================================================================== */
(function (raiz) {
  "use strict";
  var SM = raiz.SafeMind = raiz.SafeMind || {};
  var Dados = SM.Dados, IA = SM.MotorIA, Config = SM.Config;

  /* ------------------------------------------------------------------
     Hash de senha para o ambiente local (atributo senhaHash do diagrama).
     No ambiente Firebase a senha é tratada pelo Firebase Authentication.
     ------------------------------------------------------------------ */
  function sha256(texto) {
    var ascii = unescape(encodeURIComponent(texto));
    function rr(v, a) { return (v >>> a) | (v << (32 - a)); }
    var pow = Math.pow, maxWord = pow(2, 32), resultado = "", i, j;
    var words = [], bitLen = ascii.length * 8, hash = [], k = [], primos = 0, composto = {};
    for (var c = 2; primos < 64; c++) {
      if (!composto[c]) {
        for (i = 0; i < 313; i += c) composto[i] = c;
        hash[primos] = (pow(c, 0.5) * maxWord) | 0;
        k[primos++] = (pow(c, 1 / 3) * maxWord) | 0;
      }
    }
    ascii += "\x80";
    while (ascii.length % 64 - 56) ascii += "\x00";
    for (i = 0; i < ascii.length; i++) {
      j = ascii.charCodeAt(i);
      words[i >> 2] |= j << ((3 - i) % 4) * 8;
    }
    words[words.length] = (bitLen / maxWord) | 0;
    words[words.length] = bitLen;
    for (j = 0; j < words.length;) {
      var w = words.slice(j, j += 16), antigo = hash;
      hash = hash.slice(0, 8);
      for (i = 0; i < 64; i++) {
        var w15 = w[i - 15], w2 = w[i - 2], a = hash[0], e = hash[4];
        var t1 = hash[7] + (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25)) + ((e & hash[5]) ^ (~e & hash[6])) + k[i] +
          (w[i] = i < 16 ? w[i] : (w[i - 16] + (rr(w15, 7) ^ rr(w15, 18) ^ (w15 >>> 3)) + w[i - 7] + (rr(w2, 17) ^ rr(w2, 19) ^ (w2 >>> 10))) | 0);
        var t2 = (rr(a, 2) ^ rr(a, 13) ^ rr(a, 22)) + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
        hash = [(t1 + t2) | 0].concat(hash);
        hash[4] = (hash[4] + t1) | 0;
      }
      for (i = 0; i < 8; i++) hash[i] = (hash[i] + antigo[i]) | 0;
    }
    for (i = 0; i < 8; i++) for (j = 3; j + 1; j--) { var b = (hash[i] >> (j * 8)) & 255; resultado += (b < 16 ? "0" : "") + b.toString(16); }
    return resultado;
  }
  function hashSenha(email, senha) { return sha256(String(email).trim().toLowerCase() + ":" + senha + ":safemind360"); }

  /* ------------------------------------------------------------------
     RF08 / RN06 — Perfis e permissões
     ------------------------------------------------------------------ */
  var PERFIS = {
    estudante: { rotulo: "Estudante", pagina: "aluno.html" },
    professor: { rotulo: "Professor(a)", pagina: "professor.html" },
    coordenacao: { rotulo: "Coordenação/Psicologia", pagina: "admin.html" }
  };

  var PERMISSOES = [
    { acao: "checkin.registrar", descricao: "Fazer check-in socioemocional (RF01)", perfis: ["estudante"] },
    { acao: "questionario.responder", descricao: "Responder questionários de convivência (RF02)", perfis: ["estudante"] },
    { acao: "relato.enviar", descricao: "Enviar relato com nível de privacidade (RF03)", perfis: ["estudante"] },
    { acao: "dica.receber", descricao: "Receber dicas de bem-estar", perfis: ["estudante"] },
    { acao: "dados.proprios", descricao: "Consultar, exportar e excluir os próprios dados (LGPD)", perfis: ["estudante"] },
    { acao: "dashboard.turma", descricao: "Ver indicadores consolidados e anônimos da turma", perfis: ["professor", "coordenacao"] },
    { acao: "dinamica.receber", descricao: "Receber sugestões de dinâmicas para a turma", perfis: ["professor", "coordenacao"] },
    { acao: "dashboard.escola", descricao: "Ver o painel geral da escola (RF05)", perfis: ["coordenacao"] },
    { acao: "alerta.gerenciar", descricao: "Ler e acompanhar alertas individuais", perfis: ["coordenacao"] },
    { acao: "relato.ler", descricao: "Ler relatos (anônimos sem identificação)", perfis: ["coordenacao"] },
    { acao: "dados.risco", descricao: "Ver dados individuais de risco e bem-estar", perfis: ["coordenacao"] },
    { acao: "intervencao.registrar", descricao: "Registrar intervenções (RF06)", perfis: ["coordenacao"] },
    { acao: "eficacia.medir", descricao: "Medir a eficácia das intervenções (RF07)", perfis: ["coordenacao"] },
    { acao: "questionario.gerenciar", descricao: "Criar e ativar questionários", perfis: ["coordenacao"] },
    { acao: "usuario.gerenciar", descricao: "Gerenciar perfis e acessos (RF08)", perfis: ["coordenacao"] },
    { acao: "config.gerenciar", descricao: "Configurar dispositivos e política de uso (RN02)", perfis: ["coordenacao"] }
  ];

  function pode(perfil, acao) {
    var p = PERMISSOES.filter(function (x) { return x.acao === acao; })[0];
    return !!p && p.perfis.indexOf(perfil) !== -1;
  }
  function exigir(sessao, acao) {
    if (!sessao || !pode(sessao.perfil, acao)) {
      throw new Error("Seu perfil não tem permissão para esta ação.");
    }
  }

  /* ------------------------------------------------------------------
     Catálogos de conteúdo
     ------------------------------------------------------------------ */
  var ESTADOS = [
    { valor: 5, rotulo: "Muito bem", icone: "sentiment_very_satisfied" },
    { valor: 4, rotulo: "Bem", icone: "sentiment_satisfied" },
    { valor: 3, rotulo: "Mais ou menos", icone: "sentiment_neutral" },
    { valor: 2, rotulo: "Triste", icone: "sentiment_dissatisfied" },
    { valor: 1, rotulo: "Muito mal", icone: "sentiment_very_dissatisfied" }
  ];

  /* sentimentoSugerido: o sistema sugere palavras conforme o estado escolhido. */
  var SENTIMENTOS = {
    alto: ["Feliz", "Animado(a)", "Tranquilo(a)", "Grato(a)", "Confiante"],
    medio: ["Cansado(a)", "Entediado(a)", "Pensativo(a)", "Preocupado(a)"],
    baixo: ["Triste", "Ansioso(a)", "Com raiva", "Sozinho(a)", "Com medo", "Excluído(a)"]
  };
  function sentimentosPara(estado) { return estado >= 4 ? SENTIMENTOS.alto : estado === 3 ? SENTIMENTOS.medio : SENTIMENTOS.baixo; }

  var NIVEIS_PRIVACIDADE = {
    ANONIMO: {
      rotulo: "Anônimo", icone: "visibility_off",
      descricao: "Ninguém da escola fica sabendo que foi você. A equipe lê o relato, mas não consegue te procurar."
    },
    CONFIDENCIAL: {
      rotulo: "Confidencial", icone: "lock",
      descricao: "Só a coordenação e a psicologia veem seu nome. Professores não têm acesso."
    },
    SITUACAO_DE_RISCO: {
      rotulo: "Situação de risco", icone: "emergency",
      descricao: "Para quando você ou alguém está em perigo. A equipe recebe um alerta prioritário com seu nome para ajudar rápido."
    }
  };

  var ESCALA_FREQUENCIA = ["Nunca", "Raramente", "Às vezes", "Quase sempre", "Sempre"];

  var QUESTIONARIO_PADRAO = {
    id: "convivencia-padrao",
    titulo: "Como está a convivência na escola",
    descricao: "Perguntas rápidas sobre as últimas semanas. Não existe resposta certa.",
    periodicidade: "semanal",
    ativo: true,
    perguntas: [
      { id: "q1", texto: "Eu me sinto seguro(a) na escola.", dimensao: "seguranca", invertida: false },
      { id: "q2", texto: "Tenho colegas com quem posso contar.", dimensao: "pertencimento", invertida: false },
      { id: "q3", texto: "Alguém me provocou, colocou apelido ou zoou de um jeito que me incomodou.", dimensao: "conflito", invertida: true },
      { id: "q4", texto: "Me senti deixado(a) de lado pelos colegas.", dimensao: "exclusao", invertida: true },
      { id: "q5", texto: "Professores e funcionários me tratam com respeito.", dimensao: "convivencia", invertida: false },
      { id: "q6", texto: "Sei a quem pedir ajuda se algo ruim acontecer.", dimensao: "apoio", invertida: false }
    ]
  };
  var DIMENSOES = {
    seguranca: "Segurança", pertencimento: "Pertencimento", conflito: "Provocações e conflitos",
    exclusao: "Exclusão", convivencia: "Respeito e convivência", apoio: "Rede de apoio", bemestar: "Bem-estar"
  };
  var PERIODICIDADES = { semanal: 7, quinzenal: 14, mensal: 30 };

  /* DicaBemEstar — conteúdo psicoeducativo para o estudante. */
  var DICAS = {
    SOFRIMENTO_EMOCIONAL: [
      "Quando a cabeça estiver cheia, tente a respiração 4-7-8: inspire contando até 4, segure até 7 e solte até 8.",
      "Escreva num papel o que está te preocupando e separe em duas colunas: o que depende de você e o que não depende.",
      "Dormir bem muda o humor mais do que parece. Que tal deixar o celular longe da cama hoje?",
      "Contar para alguém de confiança como você está já diminui o peso. Você não precisa resolver tudo sozinho(a)."
    ],
    CONFLITO: [
      "Você não tem culpa de ser alvo de provocações. Contar para um adulto da escola é se proteger, não dedurar.",
      "Se acontecer de novo, saia de perto e vá para um lugar com adultos por perto.",
      "Anotar o que aconteceu (dia, lugar, quem viu) ou guardar prints ajuda a escola a agir."
    ],
    EXCLUSAO_SOCIAL: [
      "Clubes, esportes e projetos da escola são bons lugares para conhecer gente com gostos parecidos com os seus.",
      "Puxar conversa sobre algo em comum (um jogo, uma série, a lição) costuma ser mais fácil do que parece.",
      "Sentir-se de fora não diz nada sobre o seu valor. Se estiver pesando, fale com a coordenação."
    ],
    NEUTRO: [
      "Que tal anotar três coisas boas do seu dia, mesmo as pequenas?",
      "Beber água e se mexer um pouco no intervalo ajudam na concentração.",
      "Agradecer alguém hoje faz bem para você e para a outra pessoa.",
      "Respirar devagar por um minuto antes da prova ajuda o corpo a desacelerar."
    ]
  };
  function dicaPara(categoria, semente) {
    var lista = DICAS[categoria] || DICAS.NEUTRO;
    var i = typeof semente === "number" ? semente : Math.floor(Math.random() * lista.length);
    return lista[Math.abs(i) % lista.length];
  }

  var AJUDA_IMEDIATA = "Se você estiver em perigo agora, procure um adulto de confiança na escola. " +
    "Você também pode ligar para o CVV no 188 (gratuito, 24 horas) ou para o SAMU no 192. " +
    "Em caso de violência contra criança ou adolescente, o Disque 100 recebe denúncias.";

  /* SugestaoDinamica — orientação pedagógica para professores. */
  var DINAMICAS = [
    { id: "circulo-dialogo", titulo: "Círculo de diálogo", categorias: ["CONFLITO"], duracao: "30 a 40 min",
      objetivo: "Abrir um espaço seguro para a turma falar sobre respeito e convivência.",
      passos: ["Organize a turma em círculo e combine as regras: um fala por vez, ninguém cita nomes e o que é dito fica no círculo.",
        "Use um objeto da fala e uma pergunta para começar: “O que faz alguém se sentir respeitado aqui?”",
        "Feche com três acordos de convivência escritos pela turma e deixe-os visíveis na sala."] },
    { id: "cnv-duplas", titulo: "Comunicação não violenta em duplas", categorias: ["CONFLITO"], duracao: "20 min",
      objetivo: "Praticar como dizer o que incomoda sem atacar o outro.",
      passos: ["Apresente o modelo: observação, sentimento, necessidade e pedido.",
        "Em duplas, os estudantes reescrevem frases agressivas de situações fictícias usando o modelo.",
        "Socialize alguns exemplos e reforce que provocação não é brincadeira quando só um lado ri."] },
    { id: "duplas-rotativas", titulo: "Duplas rotativas", categorias: ["EXCLUSAO_SOCIAL"], duracao: "15 min",
      objetivo: "Criar contato entre estudantes que não costumam conversar.",
      passos: ["Forme as duplas por sorteio ou critério seu, nunca por escolha livre.",
        "Cada dupla responde três perguntas leves, como “uma coisa que você sabe fazer bem”.",
        "Troque as duplas duas vezes e repita a dinâmica nas semanas seguintes."] },
    { id: "teia-turma", titulo: "Teia da turma", categorias: ["EXCLUSAO_SOCIAL"], duracao: "25 min",
      objetivo: "Fortalecer o sentimento de pertencimento.",
      passos: ["Em círculo, quem segura o novelo diz algo que admira em um colega e passa o fio para ele.",
        "Garanta que todos recebam o fio pelo menos uma vez, conduzindo com discrição.",
        "No fim, mostre a teia: cada pessoa ajuda a sustentar o grupo."] },
    { id: "respiracao-inicio", titulo: "Um minuto de respiração no início da aula", categorias: ["SOFRIMENTO_EMOCIONAL"], duracao: "3 min",
      objetivo: "Reduzir a ansiedade antes de provas e apresentações.",
      passos: ["Peça que todos apoiem os pés no chão e soltem os ombros.",
        "Conduza quatro ciclos: inspirar em 4 segundos, segurar 4 e soltar em 6.",
        "Repita antes de atividades avaliativas."] },
    { id: "plano-partes", titulo: "Plano de estudos em partes", categorias: ["SOFRIMENTO_EMOCIONAL"], duracao: "20 min",
      objetivo: "Diminuir a sensação de sobrecarga.",
      passos: ["Liste com a turma as entregas das próximas duas semanas.",
        "Ajude a dividir cada entrega em passos pequenos, com datas.",
        "Combine um momento semanal para revisar o plano juntos."] },
    { id: "termometro", titulo: "Termômetro anônimo da turma", categorias: ["CONFLITO", "EXCLUSAO_SOCIAL", "SOFRIMENTO_EMOCIONAL"], duracao: "10 min",
      objetivo: "Ouvir a turma sem expor ninguém.",
      passos: ["Cada estudante escreve num papel, sem nome, uma palavra sobre como a turma está.",
        "Leia em voz alta sem identificar ninguém e pergunte o que a turma percebe.",
        "Escolham juntos uma pequena ação para a semana."] },
    { id: "mural", titulo: "Mural de reconhecimento", categorias: ["NEUTRO"], duracao: "15 min",
      objetivo: "Manter o clima positivo da turma.",
      passos: ["Cada estudante escreve um elogio para um colega sorteado.",
        "Monte o mural na sala.",
        "Renove todo mês."] }
  ];
  function dinamicasPara(categorias) {
    var alvo = categorias && categorias.length ? categorias : ["NEUTRO"];
    var escolhidas = DINAMICAS.filter(function (d) { return d.categorias.some(function (c) { return alvo.indexOf(c) !== -1; }); });
    return escolhidas.length ? escolhidas : DINAMICAS.filter(function (d) { return d.id === "mural" || d.id === "termometro"; });
  }

  var TIPOS_INTERVENCAO = ["Roda de conversa", "Mediação individual", "Mediação de conflito entre estudantes",
    "Atendimento psicológico", "Contato com a família", "Dinâmica em sala", "Encaminhamento à rede de proteção"];
  var STATUS_ALERTA = { novo: "Novo", em_acompanhamento: "Em acompanhamento", resolvido: "Resolvido" };
  var STATUS_INTERVENCAO = { planejada: "Planejada", em_andamento: "Em andamento", concluida: "Concluída" };
  var ORIGENS = { checkin: "Check-in", questionario: "Questionário", relato: "Relato", assistente: "Assistente Safe" };

  /* ------------------------------------------------------------------
     Utilidades de data
     ------------------------------------------------------------------ */
  function agoraISO() { return new Date().toISOString(); }
  function expiraEm(dataISO) {
    return new Date(new Date(dataISO).getTime() + Config.retencaoDias * 86400000).toISOString();
  }
  function inicioDaHora(iso) { var d = new Date(iso); d.setMinutes(0, 0, 0); return d.toISOString(); }

  /* ------------------------------------------------------------------
     Sessão (sessionStorage: cada aba tem a sua; some ao fechar — RN02)
     ------------------------------------------------------------------ */
  var CHAVE_SESSAO = "safemind:sessao";
  var Sessao = {
    atual: function () {
      try { return JSON.parse(sessionStorage.getItem(CHAVE_SESSAO)); } catch (e) { return null; }
    },
    iniciar: function (usuario, ambiente) {
      var s = {
        uid: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil,
        turma: usuario.turma || null, turmas: usuario.turmas || [], matricula: usuario.matricula || null,
        cargo: usuario.cargo || null, especializacao: usuario.especializacao || null,
        ambiente: ambiente, iniciadaEm: agoraISO()
      };
      sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify(s));
      return s;
    },
    atualizar: function (parcial) {
      var s = Object.assign({}, Sessao.atual(), parcial);
      sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify(s));
      return s;
    },
    encerrar: function () {
      sessionStorage.removeItem(CHAVE_SESSAO);
      Object.keys(sessionStorage).forEach(function (k) { if (k.indexOf("safemind:") === 0) sessionStorage.removeItem(k); });
      if (Dados.ambiente() === "firebase" && raiz.firebase && raiz.firebase.auth) {
        return raiz.firebase.auth().signOut().catch(function () {});
      }
      return Promise.resolve();
    },
    paginaDoPerfil: function (perfil) { return (PERFIS[perfil] || PERFIS.estudante).pagina; }
  };

  /* ------------------------------------------------------------------
     RN02 / RNF07 — Dispositivo institucional (Lei nº 15.100/2025)
     O registro fica no próprio navegador do equipamento da escola.
     É uma orientação de uso; o controle definitivo depende da gestão
     dos equipamentos pela escola (rede e contas institucionais).
     ------------------------------------------------------------------ */
  var CHAVE_DISPOSITIVO = "safemind:dispositivo";
  var Dispositivo = {
    atual: function () { try { return JSON.parse(localStorage.getItem(CHAVE_DISPOSITIVO)); } catch (e) { return null; } },
    registrar: function (sessao, nome) {
      exigir(sessao, "config.gerenciar");
      if (!nome || nome.trim().length < 3) throw new Error("Dê um nome ao equipamento, por exemplo “Laboratório 1 – PC 04”.");
      var d = { nome: nome.trim(), registradoEm: agoraISO(), registradoPor: sessao.nome };
      localStorage.setItem(CHAVE_DISPOSITIVO, JSON.stringify(d));
      return d;
    },
    remover: function (sessao) { exigir(sessao, "config.gerenciar"); localStorage.removeItem(CHAVE_DISPOSITIVO); },
    dentroDoHorario: function (config, agora) {
      agora = agora || new Date();
      var dias = config.diasLetivos || [1, 2, 3, 4, 5];
      if (dias.indexOf(agora.getDay()) === -1) return false;
      var hm = String(agora.getHours()).padStart(2, "0") + ":" + String(agora.getMinutes()).padStart(2, "0");
      return hm >= (config.horarioInicio || "00:00") && hm <= (config.horarioFim || "23:59");
    },
    verificarPolitica: function (config, agora) {
      config = Object.assign({}, Config.configEscolaPadrao, config || {});
      var institucional = !!Dispositivo.atual();
      if (config.politicaDispositivo === "desativado" || institucional) return { permitido: true, aviso: null, institucional: institucional };
      if (!Dispositivo.dentroDoHorario(config, agora)) return { permitido: true, aviso: null, institucional: false };
      var texto = "Durante o horário escolar, use os computadores ou tablets da escola para acessar o SafeMind 360 (Lei nº 15.100/2025).";
      if (config.politicaDispositivo === "bloquear") return { permitido: false, aviso: texto, institucional: false };
      return { permitido: true, aviso: texto, institucional: false };
    }
  };

  /* ------------------------------------------------------------------
     Autenticação
     ------------------------------------------------------------------ */
  function compativelComAba(perfil, aba) {
    return aba === "estudante" ? perfil === "estudante" : (perfil === "professor" || perfil === "coordenacao");
  }

  var Autenticacao = {
    entrar: function (email, senha, ambiente, aba) {
      var em = String(email).trim().toLowerCase();
      Dados.usar(ambiente);
      if (ambiente === "local") {
        return Dados.listar("usuarios", { email: em }).then(function (lista) {
          var u = lista[0];
          if (!u || !u.senhaHash) throw new Error("Não encontramos uma conta com esse e-mail neste ambiente.");
          if (u.senhaHash !== hashSenha(em, senha)) throw new Error("Senha incorreta.");
          return Autenticacao._validar(u, aba, ambiente);
        });
      }
      return Dados.carregarFirebase().then(function () {
        return raiz.firebase.auth().signInWithEmailAndPassword(em, senha);
      }).then(function (cred) {
        return Dados.obter("usuarios", cred.user.uid);
      }).then(function (u) {
        if (!u) {
          raiz.firebase.auth().signOut();
          throw new Error("Esta conta ainda não tem perfil no SafeMind 360. Peça à coordenação para liberar o acesso.");
        }
        return Autenticacao._validar(u, aba, ambiente);
      });
    },

    _validar: function (u, aba, ambiente) {
      if (u.ativo === false) throw new Error("Este acesso está desativado. Fale com a coordenação da escola.");
      if (!compativelComAba(u.perfil, aba)) {
        throw new Error(u.perfil === "estudante"
          ? "Esta é uma conta de estudante. Use a aba “Sou estudante”."
          : "Esta é uma conta da equipe escolar. Use a aba “Sou da equipe”.");
      }
      if (u.perfil === "estudante") {
        return SM.Servicos.obterConfigEscola().then(function (cfg) {
          var p = Dispositivo.verificarPolitica(cfg);
          if (!p.permitido) {
            if (ambiente === "firebase") raiz.firebase.auth().signOut();
            throw new Error(p.aviso);
          }
          return Sessao.iniciar(u, ambiente);
        });
      }
      return Sessao.iniciar(u, ambiente);
    },

    /* Autocadastro só para estudantes. Contas da equipe são criadas pela coordenação (RF08). */
    cadastrarEstudante: function (dados, ambiente) {
      var nome = String(dados.nome || "").trim();
      var em = String(dados.email || "").trim().toLowerCase();
      if (nome.length < 3) return Promise.reject(new Error("Digite seu nome completo."));
      if (!dados.turma) return Promise.reject(new Error("Escolha a sua turma."));
      if (String(dados.senha || "").length < 6) return Promise.reject(new Error("A senha precisa de pelo menos 6 caracteres."));
      Dados.usar(ambiente);
      var usuario = {
        nome: nome, email: em, perfil: "estudante", turma: dados.turma,
        matricula: dados.matricula ? String(dados.matricula).trim() : null,
        ativo: true, criadoEm: agoraISO(), consentimento: null
      };
      return SM.Servicos.obterConfigEscola().then(function (cfg) {
        var p = Dispositivo.verificarPolitica(cfg);
        if (!p.permitido) throw new Error(p.aviso);
        if (ambiente === "local") {
          return Dados.listar("usuarios", { email: em }).then(function (l) {
            if (l.length) throw new Error("Já existe uma conta com esse e-mail.");
            usuario.senhaHash = hashSenha(em, dados.senha);
            return Dados.adicionar("usuarios", usuario);
          });
        }
        return Dados.carregarFirebase().then(function () {
          return raiz.firebase.auth().createUserWithEmailAndPassword(em, dados.senha);
        }).then(function (cred) {
          return Dados.definir("usuarios", cred.user.uid, usuario);
        });
      }).then(function (u) { return Sessao.iniciar(u, ambiente); });
    },

    google: function (aba) {
      Dados.usar("firebase");
      return Dados.carregarFirebase().then(function () {
        return raiz.firebase.auth().signInWithPopup(new raiz.firebase.auth.GoogleAuthProvider());
      }).then(function (cred) {
        return Dados.obter("usuarios", cred.user.uid).then(function (u) {
          if (u) return u;
          if (aba !== "estudante") {
            raiz.firebase.auth().signOut();
            throw new Error("Esta conta Google não está cadastrada na equipe. Peça acesso à coordenação.");
          }
          return Dados.definir("usuarios", cred.user.uid, {
            nome: cred.user.displayName || cred.user.email, email: cred.user.email, perfil: "estudante",
            turma: null, matricula: null, ativo: true, criadoEm: agoraISO(), consentimento: null
          });
        });
      }).then(function (u) { return Autenticacao._validar(u, aba, "firebase"); });
    }
  };

  /* ------------------------------------------------------------------
     Séries de bem-estar (0–100) usadas por indicadores e pela RF07
     ------------------------------------------------------------------ */
  var Indicadores = {
    valorCheckin: function (c) { return Math.round((c.estadoSocioemocional - 1) * 25); },
    serieEstudante: function (uid, checkins, respostas) {
      var s = checkins.filter(function (c) { return c.autorUid === uid; }).map(function (c) {
        return { data: c.dataHora, valor: Indicadores.valorCheckin(c), sinal: !!(c.analise && c.analise.grauRisco !== "baixo") };
      }).concat(respostas.filter(function (r) { return r.autorUid === uid; }).map(function (r) {
        return { data: r.dataEnvio, valor: r.indice, sinal: !!(r.analise && r.analise.grauRisco !== "baixo") };
      }));
      return s.sort(function (a, b) { return a.data < b.data ? -1 : 1; });
    },
    serieTurma: function (turma, insights) {
      return insights.filter(function (e) { return e.turma === turma; }).map(function (e) {
        return { data: e.dia + "T12:00:00.000Z", valor: typeof e.valor === "number" ? e.valor : null, sinal: e.grauRisco && e.grauRisco !== "baixo" };
      }).sort(function (a, b) { return a.data < b.data ? -1 : 1; });
    },
    mediaRecente: function (serie, dias, ate) {
      var fim = ate ? new Date(ate).getTime() : Date.now();
      var ini = fim - dias * 86400000;
      var v = serie.filter(function (p) { var t = new Date(p.data).getTime(); return t >= ini && t < fim && typeof p.valor === "number"; })
        .map(function (p) { return p.valor; });
      return { media: v.length ? Math.round(IA.media(v)) : null, n: v.length };
    },
    situacaoEstudante: function (uid, alertas) {
      var abertos = alertas.filter(function (a) { return a.estudanteUid === uid && a.status !== "resolvido"; });
      if (abertos.some(function (a) { return a.grauRisco === "alto"; })) return "alto";
      if (abertos.length) return "moderado";
      return "baixo";
    }
  };

  /* ------------------------------------------------------------------
     Serviços (casos de uso do Diagrama de Casos de Uso)
     ------------------------------------------------------------------ */
  function registrarInsight(sessaoOuTurma, dados) {
    /* DashboardInsights — evento anônimo: sem uid, sem nome, só o dia. (RN05) */
    var turma = typeof sessaoOuTurma === "string" ? sessaoOuTurma : sessaoOuTurma.turma;
    if (!turma) return Promise.resolve(null);
    var dia = IA.diaISO(dados.data || new Date());
    return Dados.adicionar("insights", {
      turma: turma, dia: dia, tipo: dados.tipo,
      valor: typeof dados.valor === "number" ? dados.valor : null,
      categorias: dados.categorias || [], grauRisco: dados.grauRisco || "baixo",
      expiraEm: expiraEm(dia + "T12:00:00.000Z")
    });
  }

  function criarAlerta(dados) {
    /* RN01: alerta é um sinal para revisão humana, nunca um diagnóstico. */
    var grau = dados.grauRisco;
    var alerta = {
      grauRisco: grau,
      prioritario: !!dados.prioritario || grau === "alto",  /* RN04 */
      origem: dados.origem,
      referenciaId: dados.referenciaId || null,
      estudanteUid: dados.estudanteUid || null,
      estudanteNome: dados.estudanteNome || null,
      turma: dados.turma || null,
      motivo: dados.motivo,
      categorias: dados.categorias || [],
      lido: false,
      status: "novo",
      revisaoHumana: "pendente",
      ultimaIntervencaoId: null,
      historico: [],
      criadoEm: dados.criadoEm || agoraISO(),
      expiraEm: expiraEm(dados.criadoEm || agoraISO())
    };
    return Dados.adicionar("alertas", alerta);
  }

  var Servicos = {
    /* ---------- configuração da escola ---------- */
    obterConfigEscola: function () {
      return Dados.obter("configuracoes", "escola").catch(function () { return null; }).then(function (c) {
        return Object.assign({}, Config.configEscolaPadrao, c || {});
      });
    },
    salvarConfigEscola: function (sessao, cfg) {
      exigir(sessao, "config.gerenciar");
      if (["desativado", "avisar", "bloquear"].indexOf(cfg.politicaDispositivo) === -1) throw new Error("Política inválida.");
      if (!/^\d{2}:\d{2}$/.test(cfg.horarioInicio) || !/^\d{2}:\d{2}$/.test(cfg.horarioFim)) throw new Error("Informe os horários no formato HH:MM.");
      return Dados.definir("configuracoes", "escola", Object.assign({}, cfg, { atualizadoEm: agoraISO(), atualizadoPor: sessao.nome }), true);
    },

    turmas: function () {
      return Dados.listar("turmas").catch(function () { return []; }).then(function (l) {
        var lista = l.length ? l : Config.turmasPadrao;
        return lista.slice().sort(function (a, b) { return a.nome.localeCompare(b.nome, "pt-BR"); });
      });
    },
    criarTurma: function (sessao, nome, turno) {
      exigir(sessao, "usuario.gerenciar");
      nome = String(nome || "").trim();
      if (nome.length < 2) throw new Error("Informe o nome da turma.");
      return Dados.adicionar("turmas", { nome: nome, turno: turno || "" });
    },

    /* ---------- LGPD (RNF01) ---------- */
    precisaConsentimento: function (usuario) {
      return !usuario || !usuario.consentimento || usuario.consentimento.versao !== Config.versaoTermo;
    },
    registrarConsentimento: function (sessao, turma) {
      var dados = { consentimento: { versao: Config.versaoTermo, data: agoraISO() } };
      if (turma) dados.turma = turma;
      return Dados.atualizar("usuarios", sessao.uid, dados).then(function (u) {
        if (turma) Sessao.atualizar({ turma: turma });
        return u;
      });
    },
    exportarMeusDados: function (sessao) {
      exigir(sessao, "dados.proprios");
      return Promise.all([
        Dados.obter("usuarios", sessao.uid),
        Dados.listar("checkins", { autorUid: sessao.uid }),
        Dados.listar("respostas", { autorUid: sessao.uid }),
        Dados.listar("relatos", { autorUid: sessao.uid })
      ]).then(function (r) {
        var u = Object.assign({}, r[0] || {});
        delete u.senhaHash;
        return {
          geradoEm: agoraISO(),
          observacao: "Dados pessoais tratados pelo SafeMind 360 (LGPD, art. 18). Relatos anônimos não aparecem aqui porque não ficam ligados a você.",
          usuario: u, checkins: r[1], respostasQuestionario: r[2], relatosIdentificados: r[3]
        };
      });
    },
    excluirMeusRegistros: function (sessao) {
      exigir(sessao, "dados.proprios");
      return Promise.all([
        Dados.listar("checkins", { autorUid: sessao.uid }),
        Dados.listar("respostas", { autorUid: sessao.uid })
      ]).then(function (r) {
        var tarefas = r[0].map(function (c) { return Dados.remover("checkins", c.id); })
          .concat(r[1].map(function (x) { return Dados.remover("respostas", x.id); }));
        return Promise.all(tarefas).then(function () { return { checkins: r[0].length, respostas: r[1].length }; });
      });
    },

    /* ---------- RF01: check-in socioemocional ---------- */
    registrarCheckin: function (sessao, entrada) {
      exigir(sessao, "checkin.registrar");
      var estado = Number(entrada.estado);
      if (!(estado >= 1 && estado <= 5)) return Promise.reject(new Error("Escolha como você está se sentindo."));
      var notas = String(entrada.notas || "").trim().slice(0, 500);
      return Dados.listar("checkins", { autorUid: sessao.uid }).then(function (anteriores) {
        var checkin = {
          autorUid: sessao.uid, turma: sessao.turma, dataHora: agoraISO(),
          estadoSocioemocional: estado, sentimentoSugerido: entrada.sentimento || null, notas: notas
        };
        var analise = IA.avaliarCheckin(checkin, anteriores);
        checkin.analise = { grauRisco: analise.grauRisco, classe: analise.classe, categorias: analise.categorias, motivosAtivos: analise.motivosAtivos, motivosAlertados: analise.gerarAlerta ? analise.motivosAlertados : [] };
        checkin.expiraEm = expiraEm(checkin.dataHora);
        return Dados.adicionar("checkins", checkin).then(function (salvo) {
          var tarefas = [registrarInsight(sessao, { tipo: "checkin", valor: analise.valor, categorias: analise.categorias, grauRisco: analise.grauRisco })];
          if (analise.gerarAlerta) {
            tarefas.push(criarAlerta({
              origem: "checkin", referenciaId: salvo.id, estudanteUid: sessao.uid, estudanteNome: sessao.nome, turma: sessao.turma,
              grauRisco: analise.grauRisco, categorias: analise.categorias,
              motivo: analise.motivos.filter(function (m) { return analise.motivosAlertados.indexOf(m.codigo) !== -1; }).map(function (m) { return m.texto; }).join("; ")
            }));
          }
          return Promise.all(tarefas).then(function () {
            var cat = analise.classe === "SITUACAO_DE_RISCO" ? "SITUACAO_DE_RISCO" : (analise.categorias[0] || (estado <= 2 ? "SOFRIMENTO_EMOCIONAL" : "NEUTRO"));
            return { checkin: salvo, analise: analise, categoria: cat, dica: cat === "SITUACAO_DE_RISCO" ? AJUDA_IMEDIATA : dicaPara(cat) };
          });
        });
      });
    },

    /* ---------- RF02: questionários periódicos ---------- */
    questionarioAtivo: function () {
      return Dados.listar("questionarios", { ativo: true }).catch(function () { return []; }).then(function (l) {
        l.sort(function (a, b) { return (b.criadoEm || "") > (a.criadoEm || "") ? 1 : -1; });
        return l[0] || QUESTIONARIO_PADRAO;
      });
    },
    situacaoQuestionario: function (sessao, questionario) {
      return Dados.listar("respostas", { autorUid: sessao.uid }).then(function (rs) {
        var doQ = rs.filter(function (r) { return r.questionarioId === questionario.id; })
          .sort(function (a, b) { return a.dataEnvio < b.dataEnvio ? 1 : -1; });
        var ultima = doQ[0] || null;
        var dias = PERIODICIDADES[questionario.periodicidade] || 7;
        var proxima = ultima ? new Date(new Date(ultima.dataEnvio).getTime() + dias * 86400000) : null;
        return { disponivel: !proxima || proxima <= new Date(), ultima: ultima, proxima: proxima ? proxima.toISOString() : null, historico: doQ };
      });
    },
    responderQuestionario: function (sessao, questionario, respostas) {
      exigir(sessao, "questionario.responder");
      var faltando = questionario.perguntas.filter(function (p) { return !respostas[p.id]; });
      if (faltando.length) return Promise.reject(new Error("Responda todas as perguntas (faltam " + faltando.length + ")."));
      return Servicos.situacaoQuestionario(sessao, questionario).then(function (sit) {
        if (!sit.disponivel) throw new Error("Você já respondeu este questionário. O próximo fica disponível em " + new Date(sit.proxima).toLocaleDateString("pt-BR") + ".");
        var analise = IA.avaliarQuestionario(questionario, respostas);
        var registro = {
          questionarioId: questionario.id, autorUid: sessao.uid, turma: sessao.turma, dataEnvio: agoraISO(),
          respostas: respostas, indice: analise.indice, dimensoes: analise.dimensoes,
          analise: { grauRisco: analise.grauRisco, categorias: analise.categorias }
        };
        registro.expiraEm = expiraEm(registro.dataEnvio);
        return Dados.adicionar("respostas", registro).then(function (salvo) {
          var tarefas = [registrarInsight(sessao, { tipo: "questionario", valor: analise.indice, categorias: analise.categorias, grauRisco: analise.grauRisco })];
          if (analise.gerarAlerta) {
            tarefas.push(criarAlerta({
              origem: "questionario", referenciaId: salvo.id, estudanteUid: sessao.uid, estudanteNome: sessao.nome, turma: sessao.turma,
              grauRisco: analise.grauRisco, categorias: analise.categorias,
              motivo: analise.motivos.map(function (m) { return m.texto; }).join("; ")
            }));
          }
          return Promise.all(tarefas).then(function () { return { resposta: salvo, analise: analise }; });
        });
      });
    },

    /* ---------- RF03 / RN03 / RN04: relato voluntário ---------- */
    enviarRelato: function (sessao, entrada) {
      exigir(sessao, "relato.enviar");
      var nivel = entrada.nivelPrivacidade;
      if (!NIVEIS_PRIVACIDADE[nivel]) return Promise.reject(new Error("Escolha um nível de privacidade antes de enviar (Anônimo, Confidencial ou Situação de risco)."));
      var titulo = String(entrada.titulo || "").trim().slice(0, 80);
      var descricao = String(entrada.descricao || "").trim().slice(0, 2000);
      if (titulo.length < 3) return Promise.reject(new Error("Dê um título curto para o relato."));
      if (descricao.length < 10) return Promise.reject(new Error("Conte um pouco mais sobre o que aconteceu (mínimo de 10 caracteres)."));
      var anonimo = nivel === "ANONIMO";
      var agora = agoraISO();
      var relato = {
        titulo: titulo, descricao: descricao,
        /* Anônimo: sem identificação e com horário arredondado (minimização – RN05). */
        dataEnvio: anonimo ? inicioDaHora(agora) : agora,
        nivelPrivacidade: nivel,
        autorUid: anonimo ? null : sessao.uid,
        autorNome: anonimo ? null : sessao.nome,
        turma: anonimo && !entrada.informarTurma ? null : sessao.turma,
        lido: false, status: "novo"
      };
      var analise = IA.avaliarRelato(relato);
      relato.analise = {
        grauRisco: analise.grauRisco, classe: analise.classe, categorias: analise.categorias,
        prioritario: analise.prioritario, origemRisco: analise.origemRisco, termos: analise.termos, confianca: analise.confianca
      };
      relato.expiraEm = expiraEm(agora);
      return Dados.adicionar("relatos", relato).then(function (salvo) {
        var tarefas = [];
        if (relato.turma) tarefas.push(registrarInsight(relato.turma, { tipo: "relato", valor: null, categorias: analise.categorias, grauRisco: analise.grauRisco }));
        if (analise.gerarAlerta) {
          var motivo = analise.origemRisco === "estudante"
            ? "Estudante marcou o relato como Situação de risco"
            : analise.origemRisco === "ia"
              ? "Relato com sinais de situação de risco identificados pela IA"
              : "Relato com sinal de " + IA.ROTULOS[analise.classe].toLowerCase();
          tarefas.push(criarAlerta({
            origem: "relato", referenciaId: salvo.id, estudanteUid: relato.autorUid, estudanteNome: relato.autorNome,
            turma: relato.turma, grauRisco: analise.grauRisco, prioritario: analise.prioritario,
            categorias: analise.categorias, motivo: motivo
          }));
        }
        return Promise.all(tarefas).then(function () {
          var mensagem;
          if (analise.grauRisco === "alto" && anonimo) {
            mensagem = "Recebemos seu relato. Como ele é anônimo, a equipe não sabe quem você é e não consegue te procurar. Se quiser que alguém fale com você, envie de novo como “Situação de risco”. " + AJUDA_IMEDIATA;
          } else if (analise.grauRisco === "alto") {
            mensagem = "Recebemos seu relato e a equipe de coordenação/psicologia foi avisada com prioridade. Alguém vai te procurar. " + AJUDA_IMEDIATA;
          } else if (anonimo) {
            mensagem = "Recebemos seu relato anônimo. A equipe vai ler e pode agir com a turma sem saber quem escreveu. Obrigado por confiar.";
          } else {
            mensagem = "Recebemos seu relato. Só a coordenação e a psicologia têm acesso ao seu nome. Obrigado por confiar.";
          }
          var cat = analise.classe === "SITUACAO_DE_RISCO" ? "NEUTRO" : analise.classe;
          return { relato: salvo, analise: analise, mensagem: mensagem, dica: analise.grauRisco === "alto" ? null : dicaPara(cat) };
        });
      });
    },

    marcarRelatoLido: function (sessao, relato) {
      exigir(sessao, "relato.ler");
      if (relato.lido) return Promise.resolve(relato);
      return Dados.atualizar("relatos", relato.id, { lido: true });
    },

    /* ---------- Assistente Safe (conversa) ----------
       Minimização: o texto NÃO é armazenado. Só o sinal (categoria/grau) segue. */
    analisarMensagemAssistente: function (sessao, texto, contexto) {
      var a = IA.analisarTexto(texto);
      contexto.alertados = contexto.alertados || {};
      var tarefas = [];
      if (a.classe !== "NEUTRO") {
        tarefas.push(registrarInsight(sessao, { tipo: "assistente", valor: null, categorias: a.categorias, grauRisco: a.grauRisco }));
      }
      var alertar = a.grauRisco === "alto" || (a.grauRisco === "moderado" && !contexto.alertados[a.classe]);
      if (alertar) {
        contexto.alertados[a.classe] = true;
        tarefas.push(criarAlerta({
          origem: "assistente", estudanteUid: sessao.uid, estudanteNome: sessao.nome, turma: sessao.turma,
          grauRisco: a.grauRisco, categorias: a.categorias,
          motivo: "Sinal de " + a.rotulo.toLowerCase() + " na conversa com o Assistente Safe (o texto não é armazenado)"
        }));
      }
      return Promise.all(tarefas).then(function () { return a; });
    },

    /* ---------- Alertas (RN01, RN04, RN07) ---------- */
    marcarAlertaLido: function (sessao, alerta) {
      exigir(sessao, "alerta.gerenciar");
      if (alerta.lido) return Promise.resolve(alerta);
      return Dados.atualizar("alertas", alerta.id, { lido: true, lidoEm: agoraISO(), lidoPor: sessao.nome });
    },
    alterarStatusAlerta: function (sessao, alertaId, novoStatus, intervencaoId) {
      exigir(sessao, "alerta.gerenciar");
      /* RN07: o status só muda com uma intervenção registrada. */
      if (!intervencaoId) return Promise.reject(new Error("Registre a ação realizada (intervenção) antes de alterar o status do alerta."));
      if (!STATUS_ALERTA[novoStatus]) return Promise.reject(new Error("Status inválido."));
      return Dados.obter("alertas", alertaId).then(function (a) {
        if (!a) throw new Error("Alerta não encontrado.");
        var hist = (a.historico || []).concat([{ data: agoraISO(), de: a.status, para: novoStatus, intervencaoId: intervencaoId, por: sessao.nome }]);
        return Dados.atualizar("alertas", alertaId, {
          status: novoStatus, lido: true, revisaoHumana: "realizada", ultimaIntervencaoId: intervencaoId, historico: hist
        });
      });
    },

    /* ---------- RF06: registrar intervenção ---------- */
    registrarIntervencao: function (sessao, entrada, contexto) {
      exigir(sessao, "intervencao.registrar");
      if (TIPOS_INTERVENCAO.indexOf(entrada.tipo) === -1) return Promise.reject(new Error("Escolha o tipo de intervenção."));
      var descricao = String(entrada.descricao || "").trim();
      if (descricao.length < 10) return Promise.reject(new Error("Descreva a ação realizada (mínimo de 10 caracteres)."));
      if (entrada.alvoTipo === "estudante" && !entrada.estudanteUid) return Promise.reject(new Error("Este alerta é anônimo. Registre a intervenção para a turma."));
      if (entrada.alvoTipo === "turma" && !entrada.turma) return Promise.reject(new Error("Escolha a turma."));
      var status = STATUS_INTERVENCAO[entrada.status] ? entrada.status : "em_andamento";
      contexto = contexto || {};
      var serie = entrada.alvoTipo === "estudante"
        ? Indicadores.serieEstudante(entrada.estudanteUid, contexto.checkins || [], contexto.respostas || [])
        : Indicadores.serieTurma(entrada.turma, contexto.insights || []);
      var antes = Indicadores.mediaRecente(serie, Config.janelaEficaciaDias);
      var agora = agoraISO();
      var intervencao = {
        alertaId: entrada.alertaId || null,
        alvoTipo: entrada.alvoTipo,
        estudanteUid: entrada.alvoTipo === "estudante" ? entrada.estudanteUid : null,
        estudanteNome: entrada.alvoTipo === "estudante" ? entrada.estudanteNome : null,
        turma: entrada.turma || null,
        tipo: entrada.tipo,
        descricao: descricao,
        dinamicaId: entrada.dinamicaId || null,
        responsavel: sessao.nome,
        responsavelUid: sessao.uid,
        dataRegistro: agora,
        status: status,
        metricasAssociadas: { indicadorAntes: antes.media, registrosAntes: antes.n, janelaDias: Config.janelaEficaciaDias },
        historico: [{ data: agora, status: status, por: sessao.nome, nota: "Intervenção registrada" }]
      };
      return Dados.adicionar("intervencoes", intervencao).then(function (salva) {
        if (!entrada.alertaId || !entrada.novoStatusAlerta) return salva;
        return Servicos.alterarStatusAlerta(sessao, entrada.alertaId, entrada.novoStatusAlerta, salva.id).then(function () { return salva; });
      });
    },
    atualizarIntervencao: function (sessao, intervencao, novoStatus, nota) {
      exigir(sessao, "intervencao.registrar");
      if (!STATUS_INTERVENCAO[novoStatus]) return Promise.reject(new Error("Status inválido."));
      var hist = (intervencao.historico || []).concat([{ data: agoraISO(), status: novoStatus, por: sessao.nome, nota: nota || "" }]);
      return Dados.atualizar("intervencoes", intervencao.id, { status: novoStatus, historico: hist });
    },

    /* ---------- RF07: eficácia ---------- */
    eficacia: function (intervencoes, contexto) {
      var itens = intervencoes.map(function (iv) {
        var serie = iv.alvoTipo === "estudante"
          ? Indicadores.serieEstudante(iv.estudanteUid, contexto.checkins, contexto.respostas)
          : Indicadores.serieTurma(iv.turma, contexto.insights);
        var m = IA.medirEficacia(iv, serie, { janelaDias: Config.janelaEficaciaDias });
        if (m.antes === null && iv.metricasAssociadas && typeof iv.metricasAssociadas.indicadorAntes === "number") m.antes = iv.metricasAssociadas.indicadorAntes;
        return { intervencao: iv, medida: m };
      });
      var avaliadas = itens.filter(function (x) { return x.medida.resultado !== "insuficiente"; });
      var porTipo = {};
      avaliadas.forEach(function (x) {
        var t = x.intervencao.tipo;
        (porTipo[t] = porTipo[t] || []).push(x.medida.variacao);
      });
      var resumoTipos = Object.keys(porTipo).map(function (t) {
        return { tipo: t, n: porTipo[t].length, variacaoMedia: Math.round(IA.media(porTipo[t])) };
      }).sort(function (a, b) { return b.variacaoMedia - a.variacaoMedia; });
      return {
        itens: itens,
        avaliadas: avaliadas.length,
        melhora: avaliadas.filter(function (x) { return x.medida.resultado === "melhora"; }).length,
        estavel: avaliadas.filter(function (x) { return x.medida.resultado === "estavel"; }).length,
        piora: avaliadas.filter(function (x) { return x.medida.resultado === "piora"; }).length,
        variacaoMedia: avaliadas.length ? Math.round(IA.media(avaliadas.map(function (x) { return x.medida.variacao; }))) : null,
        porTipo: resumoTipos
      };
    },

    /* ---------- RF02 (gestão): questionários ---------- */
    salvarQuestionario: function (sessao, q) {
      exigir(sessao, "questionario.gerenciar");
      var titulo = String(q.titulo || "").trim();
      var perguntas = (q.perguntas || []).filter(function (p) { return String(p.texto || "").trim().length >= 5; });
      if (titulo.length < 3) return Promise.reject(new Error("Dê um título ao questionário."));
      if (!perguntas.length) return Promise.reject(new Error("Inclua pelo menos uma pergunta com 5 caracteres ou mais."));
      if (!PERIODICIDADES[q.periodicidade]) return Promise.reject(new Error("Escolha a periodicidade."));
      var doc = {
        titulo: titulo, descricao: String(q.descricao || "").trim(), periodicidade: q.periodicidade,
        perguntas: perguntas.map(function (p, i) {
          return { id: "p" + (i + 1), texto: p.texto.trim(), dimensao: DIMENSOES[p.dimensao] ? p.dimensao : "bemestar", invertida: !!p.invertida };
        }),
        ativo: false, criadoEm: agoraISO(), criadoPor: sessao.nome
      };
      return Dados.adicionar("questionarios", doc);
    },
    ativarQuestionario: function (sessao, id) {
      exigir(sessao, "questionario.gerenciar");
      return Dados.listar("questionarios").then(function (l) {
        return Promise.all(l.map(function (q) {
          var ativo = q.id === id;
          return q.ativo === ativo ? null : Dados.atualizar("questionarios", q.id, { ativo: ativo });
        }));
      });
    },

    /* ---------- RF08: gestão de acessos ---------- */
    listarUsuarios: function (sessao) {
      exigir(sessao, "usuario.gerenciar");
      return Dados.listar("usuarios");
    },
    atualizarUsuario: function (sessao, uid, alteracoes) {
      exigir(sessao, "usuario.gerenciar");
      if (alteracoes.perfil && !PERFIS[alteracoes.perfil]) return Promise.reject(new Error("Perfil inválido."));
      if (uid === sessao.uid && ((alteracoes.perfil && alteracoes.perfil !== "coordenacao") || alteracoes.ativo === false)) {
        return Promise.reject(new Error("Você não pode remover o seu próprio acesso de coordenação."));
      }
      var dados = { atualizadoEm: agoraISO(), atualizadoPor: sessao.nome };
      ["perfil", "turma", "turmas", "ativo", "cargo", "especializacao"].forEach(function (k) {
        if (alteracoes[k] !== undefined) dados[k] = alteracoes[k];
      });
      if (dados.perfil && dados.perfil !== "estudante") dados.turma = null;
      if (dados.perfil && dados.perfil !== "professor") dados.turmas = [];
      return Dados.atualizar("usuarios", uid, dados);
    },
    criarContaEquipe: function (sessao, entrada) {
      exigir(sessao, "usuario.gerenciar");
      var nome = String(entrada.nome || "").trim();
      var em = String(entrada.email || "").trim().toLowerCase();
      if (nome.length < 3) return Promise.reject(new Error("Informe o nome completo."));
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) return Promise.reject(new Error("Informe um e-mail válido."));
      if (String(entrada.senha || "").length < 6) return Promise.reject(new Error("A senha inicial precisa de pelo menos 6 caracteres."));
      if (["professor", "coordenacao"].indexOf(entrada.perfil) === -1) return Promise.reject(new Error("Escolha o perfil."));
      var usuario = {
        nome: nome, email: em, perfil: entrada.perfil,
        turmas: entrada.perfil === "professor" ? (entrada.turmas || []) : [],
        cargo: entrada.perfil === "coordenacao" ? (entrada.cargo || "Coordenação") : null,
        especializacao: entrada.perfil === "professor" ? (entrada.especializacao || null) : null,
        ativo: true, criadoEm: agoraISO(), criadoPor: sessao.nome
      };
      if (Dados.ambiente() === "local") {
        return Dados.listar("usuarios", { email: em }).then(function (l) {
          if (l.length) throw new Error("Já existe uma conta com esse e-mail.");
          usuario.senhaHash = hashSenha(em, entrada.senha);
          return Dados.adicionar("usuarios", usuario);
        });
      }
      /* Firebase: cria o usuário numa instância secundária para não
         encerrar a sessão de quem está cadastrando. */
      var fb = raiz.firebase;
      var secundaria = fb.initializeApp(Config.firebase, "cadastro-" + Date.now());
      return secundaria.auth().createUserWithEmailAndPassword(em, entrada.senha).then(function (cred) {
        var uid = cred.user.uid;
        return secundaria.auth().signOut().then(function () { return secundaria.delete(); })
          .then(function () { return Dados.definir("usuarios", uid, usuario); });
      }).catch(function (e) { secundaria.delete().catch(function () {}); throw e; });
    }
  };

  /* ------------------------------------------------------------------
     Exportação pública
     ------------------------------------------------------------------ */
  SM.Negocio = {
    sha256: sha256, hashSenha: hashSenha,
    PERFIS: PERFIS, PERMISSOES: PERMISSOES, pode: pode, exigir: exigir,
    ESTADOS: ESTADOS, sentimentosPara: sentimentosPara, NIVEIS_PRIVACIDADE: NIVEIS_PRIVACIDADE,
    ESCALA_FREQUENCIA: ESCALA_FREQUENCIA, QUESTIONARIO_PADRAO: QUESTIONARIO_PADRAO, DIMENSOES: DIMENSOES,
    PERIODICIDADES: PERIODICIDADES, DICAS: DICAS, dicaPara: dicaPara, AJUDA_IMEDIATA: AJUDA_IMEDIATA,
    DINAMICAS: DINAMICAS, dinamicasPara: dinamicasPara, TIPOS_INTERVENCAO: TIPOS_INTERVENCAO,
    STATUS_ALERTA: STATUS_ALERTA, STATUS_INTERVENCAO: STATUS_INTERVENCAO, ORIGENS: ORIGENS,
    expiraEm: expiraEm, Indicadores: Indicadores
  };
  /* Todos os serviços assíncronos devolvem Promise: um erro de permissão ou
     de validação vira uma promessa rejeitada, nunca uma exceção solta. */
  Object.keys(Servicos).forEach(function (nome) {
    if (nome === "eficacia" || nome === "precisaConsentimento") return; /* funções síncronas */
    var original = Servicos[nome];
    Servicos[nome] = function () {
      try { return Promise.resolve(original.apply(Servicos, arguments)); }
      catch (e) { return Promise.reject(e); }
    };
  });

  SM.Sessao = Sessao;
  SM.Dispositivo = Dispositivo;
  SM.Autenticacao = Autenticacao;
  SM.Servicos = Servicos;
})(typeof window !== "undefined" ? window : globalThis);
