var firebaseConfig = {
  apiKey: "AIzaSyDle7d2VEWW_3Kpbv2bfcHa8XYIZ-4bq4Q",
  authDomain: "domquixotee-6c490.firebaseapp.com",
  projectId: "domquixotee-6c490",
  storageBucket: "domquixotee-6c490.firebasestorage.app",
  messagingSenderId: "654874873259",
  appId: "1:654874873259:web:a77076dc57fc43a8c7d6ee"
};

var MODO_DEMO = JSON.stringify(firebaseConfig).indexOf("COLE_AQUI") !== -1;
var SDK = "https://www.gstatic.com/firebasejs/10.12.2/";

/* ---------- utilidades ---------- */

function $(s) { return document.querySelector(s); }
function $$(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }
function guardar(chave, valor) { localStorage.setItem("safemind:" + chave, JSON.stringify(valor)); }
function ler(chave, padrao) {
  try { var v = localStorage.getItem("safemind:" + chave); return v ? JSON.parse(v) : padrao; }
  catch (e) { return padrao; }
}
function iniciais(nome) {
  return nome.split(" ").filter(Boolean).slice(0, 2).map(function (p) { return p[0]; }).join("").toUpperCase();
}
function esc(t) {
  return String(t).replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
  });
}


/* ---------- acessibilidade ---------- */
function configurarAcessibilidade() {
  var prefs = ler("a11y", { tamanho: 0, contraste: false });

  function aplicar() {
    document.documentElement.classList.toggle("texto-grande", prefs.tamanho === 1);
    document.documentElement.classList.toggle("texto-maior", prefs.tamanho >= 2);
    document.body.classList.toggle("alto-contraste", !!prefs.contraste);
    $$('[data-a11y="contraste"]').forEach(function (b) {
      b.setAttribute("aria-pressed", prefs.contraste ? "true" : "false");
    });
    guardar("a11y", prefs);
  }

  $$('[data-a11y]').forEach(function (b) {
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

/* ---------- demonstração ---------- */

var CONTAS_DEMO = [
  { email: "aluno@safemind.ai", senha: "safemind123", nome: "Ana Silva", perfil: "aluno", turma: "9º Ano A" },
  { email: "admin@safemind.ai", senha: "safemind123", nome: "Paulo Cesar", perfil: "profissional", cargo: "Equipe de apoio" }
];

/* ---------- sessão ---------- */

var Sessao = {
  atual: function () { return ler("sessao", null); },

  entrar: function (email, senha, perfil) {
    var emailNormalizado = email.trim().toLowerCase();
    var contaDemo = CONTAS_DEMO.filter(function (c) { return c.email === emailNormalizado; })[0];
    if (contaDemo) {
      if (contaDemo.senha !== senha) return Promise.reject(new Error("Senha incorreta."));
      if (contaDemo.perfil !== perfil) return Promise.reject(new Error("Essa conta é de " + contaDemo.perfil + ". Troque a aba acima."));
      guardar("sessao", {
        nome: contaDemo.nome,
        email: contaDemo.email,
        perfil: contaDemo.perfil,
        turma: contaDemo.turma || "",
        cargo: contaDemo.cargo || "",
        demonstracao: true
      });
      return Promise.resolve(contaDemo);
    }

    if (MODO_DEMO) {
      var criadas = ler("contas", []);
      var conta = criadas.filter(function (c) { return c.email === emailNormalizado; })[0];
      if (!conta) return Promise.reject(new Error("Não encontramos uma conta com esse e-mail."));
      if (conta.senha !== senha) return Promise.reject(new Error("Senha incorreta."));
      if (conta.perfil !== perfil) return Promise.reject(new Error("Essa conta é de " + conta.perfil + ". Troque a aba acima."));
      guardar("sessao", { nome: conta.nome, email: conta.email, perfil: conta.perfil, turma: conta.turma || "", cargo: conta.cargo || "" });
      return Promise.resolve(conta);
    }

    if (!window.firebase || !firebase.auth) {
      return Promise.reject(new Error("O Firebase não foi carregado. Use uma das contas de demonstração ou verifique sua conexão."));
    }

    return firebase.auth().signInWithEmailAndPassword(emailNormalizado, senha).then(function (cred) {
      return firebase.firestore().collection("usuarios").doc(cred.user.uid).get().then(function (doc) {
        var dados = doc.exists ? doc.data() : { nome: cred.user.displayName || email, perfil: perfil };
        guardar("sessao", { uid: cred.user.uid, nome: dados.nome, email: email, perfil: dados.perfil || perfil, turma: dados.turma || "" });
        return dados;
      });
    });
  },

  cadastrar: function (nome, email, senha, perfil) {
    if (perfil === "profissional") return Promise.reject(new Error("Contas profissionais são criadas pela instituição."));
    if (MODO_DEMO) {
      var contas = ler("contas", []);
      var existe = CONTAS_DEMO.concat(contas).some(function (c) { return c.email === email.trim().toLowerCase(); });
      if (existe) return Promise.reject(new Error("Já existe uma conta com esse e-mail."));
      var nova = { nome: nome, email: email.trim().toLowerCase(), senha: senha, perfil: perfil, turma: "9º Ano A" };
      contas.push(nova);
      guardar("contas", contas);
      guardar("sessao", { nome: nova.nome, email: nova.email, perfil: nova.perfil, turma: nova.turma });
      return Promise.resolve(nova);
    }
    return firebase.auth().createUserWithEmailAndPassword(email, senha).then(function (cred) {
      return firebase.firestore().collection("usuarios").doc(cred.user.uid).set({
        uid: cred.user.uid, nome: nome, email: email, perfil: perfil, criadoEm: new Date().toISOString()
      }).then(function () {
        guardar("sessao", { uid: cred.user.uid, nome: nome, email: email, perfil: perfil });
      });
    });
  },

  google: function (perfil) {
    if (MODO_DEMO) return Promise.reject(new Error("O login com Google fica disponível depois de configurar o Firebase."));
    var provedor = new firebase.auth.GoogleAuthProvider();
    return firebase.auth().signInWithPopup(provedor).then(function (cred) {
      guardar("sessao", { uid: cred.user.uid, nome: cred.user.displayName, email: cred.user.email, perfil: perfil });
      return firebase.firestore().collection("usuarios").doc(cred.user.uid).set({
        uid: cred.user.uid, nome: cred.user.displayName, email: cred.user.email, perfil: perfil
      }, { merge: true });
    });
  },

  sair: function () {
    localStorage.removeItem("safemind:sessao");
    if (!MODO_DEMO && window.firebase) firebase.auth().signOut();
    location.href = "index.html";
  },

  proteger: function (perfil) {
    var s = Sessao.atual();
    if (!s) { location.href = "index.html"; return null; }
    if (s.perfil !== perfil) { location.href = s.perfil === "aluno" ? "aluno.html" : "admin.html"; return null; }
    return s;
  }
};

/* ---------- carregar o SDK  ---------- */

function prepararFirebase() {
  if (MODO_DEMO) return Promise.resolve();
  return new Promise(function (ok, falha) {
    var arquivos = ["firebase-app-compat.js", "firebase-auth-compat.js", "firebase-firestore-compat.js"];
    var i = 0;
    (function proximo() {
      if (i === arquivos.length) {
        try { firebase.initializeApp(firebaseConfig); } catch (e) { }
        return ok();
      }
      var s = document.createElement("script");
      s.src = SDK + arquivos[i++];
      s.onload = proximo;
      s.onerror = function () { falha(new Error("Não foi possível carregar o Firebase.")); };
      document.head.appendChild(s);
    })();
  });
}

/* ---------- tela de login ---------- */


function telaLogin() {
  var perfil = "aluno";
  var modo = "entrar";
 

  if (Sessao.atual()) { location.href = Sessao.atual().perfil === "aluno" ? "aluno.html" : "admin.html"; return; }

  $$(".perfil").forEach(function (b) {
    b.onclick = function () {
      $$(".perfil").forEach(function (o) { o.classList.remove("ativo"); o.setAttribute("aria-pressed", "false"); });
      b.classList.add("ativo");
      b.setAttribute("aria-pressed", "true");
      perfil = b.dataset.perfil;
      if (perfil === "profissional" && modo === "cadastrar") {
        modo = "entrar";
        $("#campo-nome").classList.add("oculto");
        $("#titulo-form").textContent = "Acesso profissional";
        $("#botao-enviar").innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">login</span><span>Entrar</span>';
      }
      $("#sub-form").textContent = perfil === "aluno"
        ? "Entre para continuar seu acompanhamento."
        : "Acesse com a conta fornecida pela instituição.";
      $("#email").placeholder = perfil === "aluno" ? "aluno@safemind.ai" : "admin@safemind.ai";
      $("#texto-alternar").textContent = perfil === "profissional" ? "Contas profissionais são gerenciadas pela escola." : "Ainda não tem conta?";
      $("#alternar").style.display = perfil === "profissional" ? "none" : "inline";
    };
  });

  $("#alternar").onclick = function (e) {
    e.preventDefault();
    modo = modo === "entrar" ? "cadastrar" : "entrar";
    var cadastrando = modo === "cadastrar";
    $("#campo-nome").classList.toggle("oculto", !cadastrando);
    $("#titulo-form").textContent = cadastrando ? "Criar conta" : "Bem-vindo de volta";
    $("#botao-enviar").innerHTML = cadastrando ? '<span class="material-symbols-outlined" aria-hidden="true">person_add</span><span>Criar minha conta</span>' : '<span class="material-symbols-outlined" aria-hidden="true">login</span><span>Entrar</span>';
    $("#texto-alternar").textContent = cadastrando ? "Já tem conta?" : "Ainda não tem conta?";
    $("#alternar").textContent = cadastrando ? "Entrar" : "Cadastre-se";
  };

  function mostrarErro(msg) {
    var el = $("#erro");
    el.textContent = msg;
    el.classList.remove("oculto");
    el.focus && el.focus();
  }

  var botaoSenha = $("#mostrar-senha");
  if (botaoSenha) {
    botaoSenha.onclick = function () {
      var campo = $("#senha");
      var mostrar = campo.type === "password";
      campo.type = mostrar ? "text" : "password";
      botaoSenha.textContent = mostrar ? "Ocultar" : "Mostrar";
      botaoSenha.setAttribute("aria-pressed", mostrar ? "true" : "false");
    };
  }

  $("#formulario").onsubmit = function (e) {
    e.preventDefault();
    $("#erro").classList.add("oculto");
    var nome = $("#nome").value.trim();
    var email = $("#email").value.trim();
    var senha = $("#senha").value;

    if (!email || !senha) return mostrarErro("Preencha e-mail e senha.");
    if (senha.length < 6) return mostrarErro("A senha precisa de pelo menos 6 caracteres.");
    if (modo === "cadastrar" && nome.length < 3) return mostrarErro("Digite seu nome completo.");

    $("#botao-enviar").disabled = true;
    var acao = modo === "cadastrar"
      ? Sessao.cadastrar(nome, email, senha, perfil)
      : Sessao.entrar(email, senha, perfil);

    acao.then(function () {
      location.href = perfil === "aluno" ? "aluno.html" : "admin.html";
    }).catch(function (erro) {
      $("#botao-enviar").disabled = false;
      mostrarErro(traduzir(erro));
    });
  };

  $("#botao-google").onclick = function () {
    Sessao.google(perfil)
      .then(function () { location.href = perfil === "aluno" ? "aluno.html" : "admin.html"; })
      .catch(function (erro) { mostrarErro(traduzir(erro)); });
  };
}

function traduzir(erro) {
  var codigos = {
    "auth/invalid-email": "E-mail inválido.",
    "auth/user-not-found": "Não encontramos uma conta com esse e-mail.",
    "auth/wrong-password": "Senha incorreta.",
    "auth/invalid-credential": "E-mail ou senha incorretos.",
    "auth/email-already-in-use": "Já existe uma conta com esse e-mail.",
    "auth/weak-password": "Escolha uma senha mais forte.",
    "auth/too-many-requests": "Muitas tentativas. Aguarde um instante.",
    "auth/popup-closed-by-user": "A janela do Google foi fechada."
  };
  return codigos[erro && erro.code] || (erro && erro.message) || "Não foi possível concluir.";
}

/* ----------painel do aluno ---------- */


var DICAS = [
  "Respirar devagar por um minuto já baixa a frequência cardíaca. Vale tentar antes da prova.",
  "Falar sobre o que sente não é fraqueza — é a forma mais rápida de aliviar o peso.",
  "Dormir bem muda o humor mais do que a maioria das pessoas imagina.",
  "Você não precisa estar bem o tempo todo. Dias ruins fazem parte e passam.",
  "Um passeio curto ao ar livre já melhora o ânimo em poucos minutos."
];

var EXERCICIOS = {
  respiracao: '<b>Respiração 4-7-8</b><div class="circulo"></div>Inspire pelo nariz contando até 4, segure até 7 e solte pela boca até 8. Acompanhe o círculo e repita 4 vezes.',
  gratidao: "<b>Três coisas boas</b><br>Pense em três coisas que deram certo hoje, por menores que sejam: um som que você gostou, alguém que sorriu para você, uma tarefa concluída. Escreva no campo ao lado se quiser guardar.",
  corpo: "<b>Pausa consciente</b><br>Sem mudar de lugar: perceba 5 coisas que você vê, 4 que pode tocar, 3 que ouve, 2 que sente o cheiro e 1 que consegue provar. Isso traz a atenção de volta ao agora."
};

function telaAluno() {
  var s = Sessao.proteger("aluno");
  if (!s) return;

  $("#usuario").textContent = s.nome;
  $("#saudacao").textContent = "Olá, " + s.nome.split(" ")[0] + "!";
  $("#dica").textContent = DICAS[new Date().getDate() % DICAS.length];
  $("#sair").onclick = Sessao.sair;
  $$('[data-mobile-sair]').forEach(function (b) { b.onclick = Sessao.sair; });

  var registros = ler("humores:" + s.email, []);
  desenharSemana();

  $$("#humores button").forEach(function (b) {
    b.onclick = function () {
      $$("#humores button").forEach(function (o) { o.classList.remove("ativo"); o.setAttribute("aria-pressed", "false"); });
      b.classList.add("ativo");
      b.setAttribute("aria-pressed", "true");
      var valor = Number(b.dataset.valor);
      registros.push({ valor: valor, data: new Date().toISOString() });
      registros = registros.slice(-30);
      guardar("humores:" + s.email, registros);
      salvarNoFirestore("humores", { uid: s.uid, valor: valor, data: new Date().toISOString() });

      var msg = valor >= 4
        ? "Que bom saber disso! Registro guardado."
        : valor === 3
          ? "Obrigada por registrar. Dias assim também contam."
          : "Sentimos muito que o dia esteja pesado. Se quiser, escreva aqui do lado. Se precisar de ajuda imediata, procure um adulto de confiança ou um profissional responsável da escola.";
      var c = $("#confirmacao");
      c.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">check_circle</span><span>' + esc(msg) + '</span>';
      c.classList.remove("oculto");

      if (valor <= 2) criarAlerta(s, "Registro de humor baixo", valor === 1 ? "alto" : "medio");
      desenharSemana();
    };
  });

  $$("#atividades li").forEach(function (li) {
    function abrirAtividade() {
      var el = $("#exercicio");
      el.innerHTML = EXERCICIOS[li.dataset.tipo];
      el.classList.remove("oculto");
      el.focus();
    }
    li.onclick = abrirAtividade;
    li.onkeydown = function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); abrirAtividade(); }
    };
  });

  // ========== CHAT LOCAL (SEM ERRO DE SERVIDOR) ==========
  async function enviarMensagemAluno() {
    var texto = $("#mensagem").value.trim();
    if (texto.length < 2) return;
    
    var chatHistorico = $("#historico-chat");
    var btnEnviar = $("#enviar-mensagem");
    
    // 1. balão do Aluno
    chatHistorico.innerHTML += '<div class="mensagem-chat aluno">' + esc(texto) + '</div>';
    
    $("#mensagem").value = "";
    btnEnviar.disabled = true;
    btnEnviar.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">hourglass_top</span><span>Enviando</span>';
    chatHistorico.scrollTop = chatHistorico.scrollHeight;

    // 2. análise semântica 
    var analise = analisarMensagem(texto);
    var nivelRisco = analise.nivel === "baixo" ? null : analise.nivel;
    if (analise.categoria !== "geral") registrarAnalise(s, analise);
    if (nivelRisco) criarAlerta(s, analise.rotulo, nivelRisco);

    // Indicador de "digitando..."
    var idDigitando = "digitando-" + Date.now();
    chatHistorico.innerHTML += '<div id="' + idDigitando + '" class="mensagem-chat assistente digitando">Pensando...</div>';
    chatHistorico.scrollTop = chatHistorico.scrollHeight;

    // 3. processo de resposta
    var respostaIA = await consultarGemini(texto, s.nome, s.email);
    
    // remover indicador
    var elDigitando = $("#" + idDigitando);
    if (elDigitando) elDigitando.remove();

    // 4. Exibe somente a resposta do assistente.
    var corFundo = nivelRisco === "alto" ? "#ffebee" : "#e0d7ff";
    var corTexto = nivelRisco === "alto" ? "#b71c1c" : "#2d1c6a";
    var respostaFormatada = esc(respostaIA).replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

    chatHistorico.innerHTML += '<div class="mensagem-chat assistente" style="background:' + corFundo + ';color:' + corTexto + '">' + respostaFormatada + '</div>';
    
    btnEnviar.disabled = false;
    btnEnviar.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">send</span><span>Enviar</span>';
    chatHistorico.scrollTop = chatHistorico.scrollHeight;
  }

  $("#enviar-mensagem").onclick = enviarMensagemAluno;
  $("#mensagem").addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviarMensagemAluno();
    }
  });

  function desenharSemana() {
    var dias = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    var hoje = new Date();
    var html = "";
    var soma = 0, contados = 0;
    for (var i = 6; i >= 0; i--) {
      var d = new Date(hoje);
      d.setDate(hoje.getDate() - i);
      var doDia = registros.filter(function (r) {
        return new Date(r.data).toDateString() === d.toDateString();
      });
      var media = doDia.length
        ? doDia.reduce(function (a, r) { return a + r.valor; }, 0) / doDia.length
        : 0;
      if (media) { soma += media; contados++; }
      html += '<div style="height:' + (media ? media / 5 * 100 : 4) + '%"><small>' + dias[d.getDay()] + "</small></div>";
    }
    $("#barras").innerHTML = html;
    $("#resumo-semana").textContent = contados
      ? "Média da semana: " + (soma / contados).toFixed(1) + " de 5, com " + contados + " dia(s) registrado(s)."
      : "Registre seu humor para acompanhar.";
  }
}

/* ---------- assistente de semantica  ---------- */

var MAPA_ANALISE = [
  { categoria: "conflito", rotulo: "Conflitos e convivência", peso: 3, termos: ["bullying", "zoaram", "zoando", "brigaram", "briga", "me excluiram", "me excluíram", "apelido", "humilharam", "riram de mim", "me ameaçou", "me ameacou"] },
  { categoria: "ansiedade", rotulo: "Ansiedade e pressão", peso: 2, termos: ["ansios", "nervos", "preocupad", "medo", "pânico", "panico", "prova", "nota", "trabalho", "apresentação", "apresentacao", "não consigo relaxar", "nao consigo relaxar"] },
  { categoria: "tristeza", rotulo: "Tristeza e desânimo", peso: 2, termos: ["triste", "chor", "desanimad", "sem vontade", "dia ruim", "me sinto mal", "péssimo", "pessimo"] },
  { categoria: "isolamento", rotulo: "Solidão e pertencimento", peso: 2, termos: ["sozinh", "ninguém fala", "ninguem fala", "sem amigos", "isolad", "me deixaram de lado", "não tenho amigo", "nao tenho amigo"] },
  { categoria: "cansaco", rotulo: "Cansaço e sobrecarga", peso: 1, termos: ["cansad", "sono", "exaust", "sobrecarregad", "muita coisa", "sem energia"] },
  { categoria: "positivo", rotulo: "Experiência positiva", peso: 1, termos: ["feliz", "bem hoje", "muito bem", "legal", "ótimo", "otimo", "consegui", "orgulh", "animad", "foi bom", "dia bom"] },
  { categoria: "amizade", rotulo: "Amizades e convivência", peso: 1, termos: ["amigo", "amiga", "amizade", "colega", "meu grupo", "minha turma"] }
];

function analisarMensagem(texto) {
  var t = String(texto || "").toLowerCase();
  var resultado = { categoria: "geral", rotulo: "Conversa geral", pontos: 0, nivel: "baixo", confianca: 0, termos: [] };

  // Situações que pedem resposta humana rápida, sem tentar diagnosticar.
  var imediato = ["estou em risco", "não estou seguro", "nao estou seguro", "preciso de ajuda agora", "é urgente", "e urgente", "estão me ameaçando", "estao me ameacando"];
  if (imediato.some(function (p) { return t.indexOf(p) !== -1; })) {
    return { categoria: "apoio_imediato", rotulo: "Necessidade de apoio imediato", pontos: 10, nivel: "alto", confianca: 100, termos: ["sinal de urgência"] };
  }

  var melhor = null;
  MAPA_ANALISE.forEach(function (grupo) {
    var achados = grupo.termos.filter(function (termo) { return t.indexOf(termo) !== -1; });
    var pontos = achados.length * grupo.peso;
    if (!melhor || pontos > melhor.pontos) melhor = { grupo: grupo, pontos: pontos, achados: achados };
  });

  if (melhor && melhor.pontos > 0) {
    resultado.categoria = melhor.grupo.categoria;
    resultado.rotulo = melhor.grupo.rotulo;
    resultado.pontos = melhor.pontos;
    resultado.termos = melhor.achados.slice(0, 3);
    resultado.confianca = Math.min(95, 45 + melhor.pontos * 12);
    if (["conflito", "tristeza", "isolamento"].indexOf(resultado.categoria) !== -1 && melhor.pontos >= 4) resultado.nivel = "medio";
    if (resultado.categoria === "ansiedade" && melhor.pontos >= 6) resultado.nivel = "medio";
  }
  return resultado;
}

/* Mantido para compatibilidade com o restante do protótipo. */
function analisarRisco(texto) { return analisarMensagem(texto).nivel === "baixo" ? null : analisarMensagem(texto).nivel; }

function normalizarTexto(texto) {
  return String(texto || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s?!]/g, " ").replace(/\s+/g, " ").trim();
}

function detectarIntencaoConversa(texto) {
  var t = normalizarTexto(texto);
  var exato = function (lista) { return lista.indexOf(t) !== -1; };

  if (exato(["oi", "ola", "oie", "opa", "hey", "ei", "bom dia", "boa tarde", "boa noite"])) return "saudacao";
  if (exato(["obrigado", "obrigada", "valeu", "vlw", "brigado", "brigada"])) return "agradecimento";
  if (exato(["tchau", "ate mais", "falou", "fui", "vou sair"])) return "despedida";
  if (t.indexOf("quem e voce") !== -1 || t.indexOf("quem voce e") !== -1 || t.indexOf("o que voce faz") !== -1) return "identidade";
  if (t.indexOf("tudo bem") !== -1 || t.indexOf("como voce esta") !== -1 || t.indexOf("como vc ta") !== -1 || t === "e voce" || t === "e vc") return "como_esta";
  if (t.indexOf("me ajuda") !== -1 || t.indexOf("pode me ajudar") !== -1 || t.indexOf("preciso conversar") !== -1) return "pedido_ajuda";
  if (t.indexOf("o que eu faco") !== -1 || t.indexOf("o que fazer") !== -1 || t.indexOf("e agora") !== -1) return "pedido_orientacao";
  if (exato(["sim", "aham", "uhum", "isso", "exato", "com certeza"])) return "sim";
  if (exato(["nao", "nao sei", "sei nao", "talvez", "mais ou menos"])) return t === "nao" ? "nao" : "incerto";
  if (exato(["nada", "deixa", "deixa pra la", "nao quero falar"])) return "nao_quero_falar";
  if (exato(["normal", "foi normal", "mais ou menos normal"])) return "normal";
  if (exato(["bem", "to bem", "estou bem", "muito bem", "otimo", "legal", "feliz"])) return "bem";
  if (exato(["mal", "to mal", "estou mal", "ruim", "pessimo", "horrivel"])) return "mal";
  if (t.length <= 3 && !t) return "vazio";
  return "conteudo";
}

function perguntaContinuidade(categoria) {
  var perguntas = {
    conflito: "Isso aconteceu só hoje ou já vem se repetindo?",
    ansiedade: "O que está pesando mais agora: prova, nota, tarefas ou outra coisa?",
    tristeza: "Você sabe dizer o que deixou seu dia mais difícil?",
    isolamento: "Tem alguém na escola com quem você se sente mais à vontade?",
    cansaco: "Esse cansaço parece vir mais do sono, da rotina ou das tarefas?",
    positivo: "O que aconteceu hoje que ajudou você a se sentir assim?",
    amizade: "Quer me contar o que aconteceu com seus amigos ou colegas?",
    geral: "Quer me contar um pouco mais?"
  };
  return perguntas[categoria] || perguntas.geral;
}

function respostaPorContexto(intencao, analise, nome, contexto) {
  var primeiroNome = (nome || "").split(" ")[0] || "";
  var categoriaAnterior = contexto.ultimaCategoria || "geral";

  if (intencao === "saudacao") {
    return "Oi, " + primeiroNome + "! Estou aqui com você. Como foi seu dia hoje?";
  }
  if (intencao === "agradecimento") {
    return "Por nada, " + primeiroNome + ". Pode continuar falando comigo. Quer conversar sobre mais alguma coisa?";
  }
  if (intencao === "despedida") {
    return "Tudo bem. Espero que o restante do seu dia seja tranquilo. Quando quiser conversar de novo, eu estarei por aqui.";
  }
  if (intencao === "identidade") {
    return "Eu sou o Assistente Safe, do SafeMind 360. Posso conversar com você sobre seu dia, escola, amizades, rotina e como você está se sentindo. Não faço diagnóstico e, quando algo merece atenção, o sistema sinaliza apenas um resumo para a equipe responsável.";
  }
  if (intencao === "como_esta") {
    return "Estou funcionando direitinho e pronto para te ouvir. E você, como está agora?";
  }
  if (intencao === "pedido_ajuda") {
    return "Claro. Pode me contar do seu jeito, sem precisar organizar tudo. O que está te incomodando mais agora?";
  }
  if (intencao === "pedido_orientacao") {
    if (categoriaAnterior === "conflito") return "Podemos pensar em um próximo passo seguro. Primeiro: essa situação continua acontecendo ou já parou?";
    if (categoriaAnterior === "ansiedade") return "Vamos diminuir isso em partes. Qual é a próxima coisa que você realmente precisa resolver hoje?";
    if (categoriaAnterior === "tristeza" || categoriaAnterior === "isolamento") return "Um bom primeiro passo pode ser não ficar sozinho com isso. Tem algum adulto ou pessoa de confiança com quem você se sentiria confortável para conversar?";
    return "Posso te ajudar a pensar nisso. Me conta primeiro o que aconteceu e o que você gostaria que fosse diferente.";
  }
  if (intencao === "nao_quero_falar") {
    return "Tudo bem. Você não precisa contar nada que não queira. Podemos falar de outra coisa, fazer um check-in rápido ou só ficar por aqui por enquanto.";
  }
  if (intencao === "normal") {
    return "Entendi. Quando você diz que foi normal, foi mais um dia tranquilo ou teve alguma coisa que te incomodou um pouco?";
  }
  if (intencao === "bem") {
    return "Que bom saber disso, " + primeiroNome + ". O que deixou seu dia melhor?";
  }
  if (intencao === "mal") {
    return "Entendi, " + primeiroNome + ". Sinto que seu dia não está fácil. Quer me contar o que aconteceu primeiro?";
  }
  if (intencao === "incerto") {
    return "Tudo bem não saber explicar agora. Se ajudar, me diz só uma coisa: seu dia está mais leve, mais ou menos ou pesado?";
  }
  if (intencao === "sim") {
    if (categoriaAnterior === "conflito") return "Entendi. O que aconteceu primeiro nessa situação?";
    if (categoriaAnterior === "ansiedade") return "Entendi. Qual parte disso está ocupando mais sua cabeça agora?";
    if (categoriaAnterior === "tristeza") return "Entendi. Você quer me contar o que aconteceu antes de começar a se sentir assim?";
    if (categoriaAnterior === "isolamento") return "Entendi. Você consegue pensar em alguém com quem se sentiria seguro para conversar?";
    if (categoriaAnterior === "cansaco") return "Entendi. Você conseguiu descansar bem nos últimos dias?";
    return "Entendi. Pode continuar, estou acompanhando. O que aconteceu depois?";
  }
  if (intencao === "nao") {
    return "Tudo bem. A gente pode ir por outro caminho. Quer falar sobre como você está se sentindo agora?";
  }

  if (analise.categoria === "apoio_imediato") {
    return "Entendi, " + primeiroNome + ". Isso parece precisar de atenção agora. Procure um adulto de confiança ou um profissional responsável da escola neste momento. O sistema também registra um sinal de atenção para a equipe acompanhar você.";
  }

  var respostas = {
    conflito: "Parece que aconteceu uma situação difícil de convivência. Obrigado por me contar. " + perguntaContinuidade("conflito"),
    ansiedade: "Parece que tem bastante pressão acontecendo ao mesmo tempo. Vamos por partes. " + perguntaContinuidade("ansiedade"),
    tristeza: "Obrigado por me contar. Um dia difícil pode pesar bastante. " + perguntaContinuidade("tristeza"),
    isolamento: "Entendi. Sentir-se deixado de lado pode ser bem desconfortável. " + perguntaContinuidade("isolamento"),
    cansaco: "Parece que sua rotina está puxada. " + perguntaContinuidade("cansaco"),
    positivo: "Que bom saber disso, " + primeiroNome + ". " + perguntaContinuidade("positivo"),
    amizade: "Entendi. Amizades podem mexer bastante com o nosso dia. " + perguntaContinuidade("amizade"),
    geral: "Entendi, " + primeiroNome + ". Estou acompanhando. " + perguntaContinuidade("geral")
  };
  return respostas[analise.categoria] || respostas.geral;
}

async function consultarGemini(mensagemUsuario, nomeCompleto, email) {
  // Assistente conversacional local para demonstração: responde oi,
  // respostas curtas e temas simples, mantendo contexto entre as mensagens.
  var analise = analisarMensagem(mensagemUsuario);
  var intencao = detectarIntencaoConversa(mensagemUsuario);
  var chave = "chat-contexto:" + (email || "aluno");
  var contexto = ler(chave, { ultimaCategoria: "geral", turnos: 0 });

  await new Promise(function (resolve) { setTimeout(resolve, 350 + Math.random() * 450); });

  var resposta = respostaPorContexto(intencao, analise, nomeCompleto, contexto);
  if (analise.categoria !== "geral" && analise.categoria !== "apoio_imediato") contexto.ultimaCategoria = analise.categoria;
  if (analise.categoria === "apoio_imediato") contexto.ultimaCategoria = "apoio_imediato";
  contexto.turnos = (contexto.turnos || 0) + 1;
  contexto.ultimaIntencao = intencao;
  contexto.ultimaMensagemEm = new Date().toISOString();
  guardar(chave, contexto);
  return resposta;
}

function registrarAnalise(s, analise) {
  var item = {
    uid: s.uid || null,
    aluno: s.nome,
    turma: s.turma || "",
    categoria: analise.categoria,
    rotulo: analise.rotulo,
    nivel: analise.nivel,
    confianca: analise.confianca,
    data: new Date().toISOString()
  };
  var historico = ler("analises:" + s.email, []);
  historico.unshift(item);
  guardar("analises:" + s.email, historico.slice(0, 20));
  salvarNoFirestore("analises", item); // propositalmente sem armazenar o texto bruto
}

function criarAlerta(s, motivo, nivel) {
  var alertas = ler("alertas", []);
  alertas.unshift({
    aluno: s.nome, turma: s.turma || "—", motivo: motivo, nivel: nivel, data: new Date().toISOString()
  });
  guardar("alertas", alertas.slice(0, 30));
  salvarNoFirestore("alertas", {
    uid: s.uid || null, aluno: s.nome, turma: s.turma || "", motivo: motivo,
    nivel: nivel, status: "aberto", data: new Date().toISOString()
  });
}

function salvarNoFirestore(colecao, dados) {
  if (MODO_DEMO || !window.firebase) return;
  firebase.firestore().collection(colecao).add(dados).catch(function (e) { console.warn(e); });
}

/* ---------- painel da equipe  ---------- */


var TURMAS = [
  { id: "7A", nome: "7º Ano A", turno: "Matutino", responsavel: "Prof. Rafael Lima" },
  { id: "7B", nome: "7º Ano B", turno: "Vespertino", responsavel: "Profª. Camila Souza" },
  { id: "8A", nome: "8º Ano A", turno: "Matutino", responsavel: "Profª. Beatriz Alves" },
  { id: "8B", nome: "8º Ano B", turno: "Vespertino", responsavel: "Prof. Daniel Costa" },
  { id: "9A", nome: "9º Ano A", turno: "Matutino", responsavel: "Profª. Helena Rocha" },
  { id: "9C", nome: "9º Ano C", turno: "Vespertino", responsavel: "Prof. André Martins" }
];

var CADASTRADOS = [
  { nome: "Ana Clara Souza", email: "ana.clara@escola.demo", turma: "9º Ano A", risco: "alto", sinal: "Tristeza persistente, isolamento", bem: 42, ultimo: "Hoje, 09:14" },
  { nome: "Bruno Ferreira", email: "bruno.ferreira@escola.demo", turma: "9º Ano A", risco: "baixo", sinal: "Acompanhamento de rotina", bem: 82, ultimo: "Hoje, 08:47" },
  { nome: "Sofia Nascimento", email: "sofia.nascimento@escola.demo", turma: "9º Ano A", risco: "baixo", sinal: "Sem sinais recentes", bem: 88, ultimo: "Ontem, 16:10" },
  { nome: "Lucas Martins", email: "lucas.martins@escola.demo", turma: "8º Ano B", risco: "alto", sinal: "Baixa interação há 12 dias", bem: 45, ultimo: "Hoje, 10:22" },
  { nome: "Ravi Oliveira", email: "ravi.oliveira@escola.demo", turma: "8º Ano B", risco: "baixo", sinal: "Sem sinais recentes", bem: 84, ultimo: "Ontem, 15:32" },
  { nome: "Mariana Lima", email: "mariana.lima@escola.demo", turma: "9º Ano C", risco: "medio", sinal: "Ansiedade antes das provas", bem: 58, ultimo: "Hoje, 07:58" },
  { nome: "Isabela Gomes", email: "isabela.gomes@escola.demo", turma: "9º Ano C", risco: "baixo", sinal: "Sem sinais recentes", bem: 91, ultimo: "Ontem, 14:05" },
  { nome: "Pedro Henrique", email: "pedro.henrique@escola.demo", turma: "7º Ano A", risco: "medio", sinal: "Oscilação de humor", bem: 61, ultimo: "Hoje, 11:02" },
  { nome: "Laura Santos", email: "laura.santos@escola.demo", turma: "7º Ano A", risco: "baixo", sinal: "Acompanhamento de rotina", bem: 86, ultimo: "Ontem, 13:22" },
  { nome: "Gabriel Rocha", email: "gabriel.rocha@escola.demo", turma: "7º Ano B", risco: "baixo", sinal: "Acompanhamento de rotina", bem: 79, ultimo: "Hoje, 08:08" },
  { nome: "Miguel Araújo", email: "miguel.araujo@escola.demo", turma: "7º Ano B", risco: "baixo", sinal: "Sem sinais recentes", bem: 87, ultimo: "Ontem, 10:49" },
  { nome: "Julia Ribeiro", email: "julia.ribeiro@escola.demo", turma: "8º Ano A", risco: "medio", sinal: "Desmotivação relatada", bem: 63, ultimo: "Hoje, 09:41" },
  { nome: "Davi Carvalho", email: "davi.carvalho@escola.demo", turma: "8º Ano A", risco: "baixo", sinal: "Sem sinais recentes", bem: 90, ultimo: "Ontem, 17:02" },
  { nome: "Lívia Monteiro", email: "livia.monteiro@escola.demo", turma: "8º Ano A", risco: "baixo", sinal: "Acompanhamento de rotina", bem: 81, ultimo: "Ontem, 12:34" }
];

var ALUNOS = CADASTRADOS.filter(function (a) { return a.risco !== "baixo"; });

var ALERTAS_DEMO = [
  { aluno: "Ana Clara Souza", turma: "9º Ano A", motivo: "Sinais de tristeza persistente", nivel: "alto", data: horasAtras(1) },
  { aluno: "Lucas Martins", turma: "8º Ano B", motivo: "Isolamento social", nivel: "alto", data: horasAtras(3) },
  { aluno: "Mariana Lima", turma: "9º Ano C", motivo: "Ansiedade elevada", nivel: "medio", data: horasAtras(6) },
  { aluno: "Pedro Henrique", turma: "7º Ano A", motivo: "Mudanças de humor", nivel: "medio", data: horasAtras(26) },
  { aluno: "Julia Ribeiro", turma: "8º Ano A", motivo: "Baixa autoestima", nivel: "medio", data: horasAtras(48) }
];

function horasAtras(h) { return new Date(Date.now() - h * 3600000).toISOString(); }

function quando(iso) {
  var min = Math.round((Date.now() - new Date(iso)) / 60000);
  if (min < 1) return "agora";
  if (min < 60) return "há " + min + " min";
  if (min < 1440) return "há " + Math.round(min / 60) + " h";
  return "há " + Math.round(min / 1440) + " dia(s)";
}

function turmaResumo(nome) {
  var lista = CADASTRADOS.filter(function (a) { return a.turma === nome; });
  var media = lista.length ? Math.round(lista.reduce(function (s, a) { return s + a.bem; }, 0) / lista.length) : 0;
  var atencao = lista.filter(function (a) { return a.risco !== "baixo"; }).length;
  return { total: lista.length, media: media, atencao: atencao };
}

function desenharTurmas() {
  var alvo = $("#cards-turmas");
  if (!alvo) return;
  alvo.innerHTML = TURMAS.map(function (t) {
    var r = turmaResumo(t.nome);
    return '<button type="button" class="turma-card" data-turma="' + esc(t.nome) + '" aria-label="Ver estudantes da turma ' + esc(t.nome) + '">' +
      '<span class="turma-icone material-symbols-outlined" aria-hidden="true">school</span>' +
      '<span class="turma-nome">' + esc(t.nome) + '</span>' +
      '<span class="turma-meta">' + esc(t.turno) + ' · ' + esc(t.responsavel) + '</span>' +
      '<span class="turma-numeros"><b>' + r.total + '</b> cadastrados <i>·</i> <b>' + r.atencao + '</b> em atenção</span>' +
      '<span class="turma-bem">Bem-estar médio <b>' + r.media + '/100</b></span>' +
      '</button>';
  }).join("");

  $$(".turma-card").forEach(function (b) {
    b.onclick = function () {
      var seletor = $("#filtro-turma");
      if (seletor) seletor.value = b.dataset.turma;
      $$(".turma-card").forEach(function (c) { c.classList.toggle("ativo", c === b); });
      desenharCadastrados();
      var secao = $("#cadastrados");
      if (secao) secao.scrollIntoView({ behavior: "smooth", block: "start" });
    };
  });
}

function desenharCadastrados() {
  var tabela = $("#tabela-cadastrados");
  if (!tabela) return;
  var turma = $("#filtro-turma") ? $("#filtro-turma").value : "";
  var busca = $("#busca-aluno") ? $("#busca-aluno").value.trim().toLowerCase() : "";
  var lista = CADASTRADOS.filter(function (a) {
    var porTurma = !turma || a.turma === turma;
    var porBusca = !busca || (a.nome + " " + a.email).toLowerCase().indexOf(busca) !== -1;
    return porTurma && porBusca;
  });
  tabela.innerHTML = lista.map(function (a) {
    return '<tr><td data-label="Aluno"><span class="avatar">' + iniciais(a.nome) + '</span>' + esc(a.nome) + '</td>' +
      '<td data-label="Turma">' + esc(a.turma) + '</td><td data-label="E-mail">' + esc(a.email) + '</td><td data-label="Último check-in">' + esc(a.ultimo) + '</td>' +
      '<td data-label="Situação"><span class="etiqueta ' + a.risco + '">' + (a.risco === "baixo" ? "rotina" : a.risco) + '</span></td>' +
      '<td data-label="Bem-estar"><div class="bem-linha"><span>' + a.bem + '/100</span><span class="barra-mini"><i style="width:' + a.bem + '%"></i></span></div></td></tr>';
  }).join("");
  var resumo = $("#resumo-cadastrados");
  if (resumo) resumo.textContent = lista.length + " estudante(s) exibido(s)" + (turma ? " em " + turma : " nas turmas cadastradas") + ". Dados fictícios para demonstração.";
}

function configurarGestaoTurmas() {
  var seletor = $("#filtro-turma");
  if (!seletor) return;
  seletor.innerHTML = '<option value="">Todas as turmas</option>' + TURMAS.map(function (t) { return '<option value="' + esc(t.nome) + '">' + esc(t.nome) + '</option>'; }).join("");
  seletor.onchange = function () {
    $$(".turma-card").forEach(function (c) { c.classList.toggle("ativo", c.dataset.turma === seletor.value); });
    desenharCadastrados();
  };
  var busca = $("#busca-aluno");
  if (busca) busca.oninput = desenharCadastrados;
  desenharTurmas();
  desenharCadastrados();
}

function telaAdmin() {
  var s = Sessao.proteger("profissional");
  if (!s) return;

  $("#usuario").textContent = s.nome;
  $("#sair").onclick = Sessao.sair;
  $$('[data-mobile-sair]').forEach(function (b) { b.onclick = Sessao.sair; });
  configurarGestaoTurmas();

  var alertas = ler("alertas", []).concat(ALERTAS_DEMO);
  $("#kpi-alertas").textContent = 19 + ler("alertas", []).length;

  $("#alertas").innerHTML = alertas.slice(0, 6).map(function (a) {
    return '<li data-nivel="' + a.nivel + '">' +
      '<span class="avatar">' + iniciais(a.aluno) + "</span>" +
      "<div><div class=\"quem\">" + esc(a.aluno) + '</div><div class="detalhe">' + esc(a.motivo) + " · " + esc(a.turma) + "</div></div>" +
      '<span class="quando">' + quando(a.data) + "</span></li>";
  }).join("");

  $("#tabela-alunos").innerHTML = ALUNOS.map(function (a) {
    return "<tr><td data-label=\"Aluno\"><span class=\"avatar\">" + iniciais(a.nome) + "</span>" + esc(a.nome) + "</td>" +
      "<td data-label=\"Turma\">" + esc(a.turma) + "</td>" +
      '<td data-label="Nível"><span class="etiqueta ' + a.risco + '">' + a.risco + "</span></td>" +
      "<td data-label=\"Sinal detectado\">" + esc(a.sinal) + "</td>" +
      "<td data-label=\"Bem-estar\">" + a.bem + "/100</td>" +
      '<td data-label="Ação"><button class="btn discreto pequeno" aria-label="Acompanhar ' + esc(a.nome) + '"><span class="material-symbols-outlined" aria-hidden="true">person_search</span><span>Acompanhar</span></button></td></tr>';
  }).join("");

  var dias = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  var valores = [8, 12, 9, 15, 11, 6, 5];
  $("#evolucao").innerHTML = valores.map(function (v, i) {
    return '<div style="height:' + (v / 15 * 100) + '%"><small>' + dias[i] + "</small></div>";
  }).join("");

  $("#exportar").onclick = function () {
    var linhas = [["Aluno", "Turma", "Risco", "Sinal", "Bem-estar"]].concat(
      ALUNOS.map(function (a) { return [a.nome, a.turma, a.risco, a.sinal, a.bem]; })
    );
    var csv = linhas.map(function (l) { return l.map(function (c) { return '"' + c + '"'; }).join(","); }).join("\n");
    var url = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
    var a = document.createElement("a");
    a.href = url; a.download = "safemind-alunos.csv"; a.click();
    URL.revokeObjectURL(url);
    var status = $("#status-exportacao");
    if (status) status.textContent = "Arquivo CSV exportado com sucesso.";
  };

  $$(".tabela .btn").forEach(function (b) {
    b.onclick = function () { b.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">task_alt</span><span>Em acompanhamento</span>'; b.disabled = true; b.setAttribute("aria-label", "Aluno marcado como em acompanhamento"); };
  });
}

/* ---------- início ---------- */

configurarAcessibilidade();
var pagina = document.body.dataset.pagina;
if (pagina === "login") telaLogin();
if (pagina === "aluno") telaAluno();
if (pagina === "admin") telaAdmin();

prepararFirebase().catch(function (e) {
  console.warn("Firebase indisponível no momento; o modo de apresentação continua funcionando.", e);
});