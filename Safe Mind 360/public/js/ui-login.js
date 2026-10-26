/* =====================================================================
   SafeMind 360 — APRESENTAÇÃO • Login e cadastro de estudante
   ===================================================================== */
(function () {
  "use strict";
  var SM = window.SafeMind, UI = SM.UI, $ = UI.$, $$ = UI.$$;

  UI.configurarAcessibilidade();
  UI.configurarPWA();

  var sessao = SM.Sessao.atual();
  if (sessao) { location.replace(SM.Sessao.paginaDoPerfil(sessao.perfil)); return; }

  var aba = "estudante";
  var modo = "entrar";
  var ambiente = localStorage.getItem("safemind:ambiente") || "local";

  /* Motivo de saída (ex.: inatividade em equipamento da escola) */
  var motivo = new URLSearchParams(location.search).get("motivo");
  if (motivo === "inatividade") {
    var el = $("#aviso-sessao");
    el.textContent = "Sua sessão terminou por falta de uso, para proteger seus dados neste equipamento.";
    el.classList.remove("oculto");
  }

  /* RN02: identificação do equipamento institucional */
  var dispositivo = SM.Dispositivo.atual();
  if (dispositivo) {
    $("#selo-dispositivo").classList.remove("oculto");
    $("#nome-dispositivo").textContent = dispositivo.nome;
    /* Em equipamento compartilhado o navegador não deve sugerir e-mails de outras pessoas. */
    $("#email").setAttribute("autocomplete", "off");
    $("#senha").setAttribute("autocomplete", "off");
  }

  function prepararAmbiente() {
    SM.Dados.usar(ambiente);
    if (ambiente === "local") SM.Semente.garantir();
    $$("[data-ambiente-opcao]").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.ambienteOpcao === ambiente ? "true" : "false"); });
    $("#botao-google").classList.toggle("oculto", ambiente !== "firebase");
    $("#contas-demo").classList.toggle("oculto", ambiente !== "local");
    carregarTurmas();
    verificarPolitica();
  }

  function carregarTurmas() {
    var preparo = ambiente === "firebase" ? SM.Dados.carregarFirebase() : Promise.resolve();
    preparo.then(function () { return SM.Servicos.turmas(); }).catch(function () { return SM.Config.turmasPadrao; }).then(function (lista) {
      $("#turma").innerHTML = '<option value="">Escolha</option>' + lista.map(function (t) {
        return '<option value="' + UI.esc(t.nome) + '">' + UI.esc(t.nome) + "</option>";
      }).join("");
    });
  }

  /* RN02 / RNF07: política de uso durante o horário escolar */
  function verificarPolitica() {
    var el = $("#aviso-politica");
    if (aba !== "estudante") { el.classList.add("oculto"); $("#botao-enviar").disabled = false; return; }
    var preparo = ambiente === "firebase" ? SM.Dados.carregarFirebase() : Promise.resolve();
    preparo.then(function () { return SM.Servicos.obterConfigEscola(); }).catch(function () { return SM.Config.configEscolaPadrao; }).then(function (cfg) {
      var p = SM.Dispositivo.verificarPolitica(cfg);
      el.textContent = p.aviso || "";
      el.classList.toggle("oculto", !p.aviso);
      el.classList.toggle("bloqueio", !p.permitido);
      $("#botao-enviar").disabled = !p.permitido;
    });
  }

  function atualizarTela() {
    var cadastrando = modo === "cadastrar";
    $$("[data-cadastro]").forEach(function (el) { el.classList.toggle("oculto", !cadastrando); });
    $("#titulo-form").textContent = cadastrando ? "Criar conta de estudante" : aba === "estudante" ? "Bem-vindo de volta" : "Acesso da equipe escolar";
    $("#sub-form").textContent = cadastrando
      ? "Use o e-mail que a escola te passou."
      : aba === "estudante" ? "Entre para fazer seu check-in." : "Professores, coordenação e psicologia entram com a conta criada pela escola.";
    $("#botao-enviar").innerHTML = cadastrando
      ? UI.icone("person_add") + "<span>Criar minha conta</span>"
      : UI.icone("login") + "<span>Entrar</span>";
    $("#senha").setAttribute("autocomplete", dispositivo ? "off" : cadastrando ? "new-password" : "current-password");
    $("#texto-alternar").textContent = aba === "equipe" ? "Contas da equipe são criadas pela coordenação." : cadastrando ? "Já tem conta?" : "Ainda não tem conta?";
    $("#alternar").classList.toggle("oculto", aba === "equipe");
    $("#alternar").textContent = cadastrando ? "Entrar" : "Cadastre-se";
    $("#erro").classList.add("oculto");
  }

  $$(".perfil").forEach(function (b) {
    b.onclick = function () {
      $$(".perfil").forEach(function (o) { o.classList.remove("ativo"); o.setAttribute("aria-pressed", "false"); });
      b.classList.add("ativo"); b.setAttribute("aria-pressed", "true");
      aba = b.dataset.aba;
      if (aba === "equipe") modo = "entrar";
      atualizarTela();
      verificarPolitica();
    };
  });

  $("#alternar").onclick = function (e) {
    e.preventDefault();
    modo = modo === "entrar" ? "cadastrar" : "entrar";
    atualizarTela();
  };

  $$("[data-ambiente-opcao]").forEach(function (b) {
    b.onclick = function () {
      ambiente = b.dataset.ambienteOpcao;
      localStorage.setItem("safemind:ambiente", ambiente);
      prepararAmbiente();
    };
  });

  $$("[data-demo]").forEach(function (b) {
    b.onclick = function () {
      var alvo = $('.perfil[data-aba="' + b.dataset.demoAba + '"]');
      if (alvo && aba !== b.dataset.demoAba) alvo.click();
      if (modo === "cadastrar") { modo = "entrar"; atualizarTela(); }
      $("#email").value = b.dataset.demo;
      $("#senha").value = "safemind123";
      $("#botao-enviar").focus();
    };
  });

  var botaoSenha = $("#mostrar-senha");
  botaoSenha.onclick = function () {
    var campo = $("#senha");
    var mostrar = campo.type === "password";
    campo.type = mostrar ? "text" : "password";
    botaoSenha.textContent = mostrar ? "Ocultar" : "Mostrar";
    botaoSenha.setAttribute("aria-pressed", mostrar ? "true" : "false");
  };

  function mostrarErro(msg) {
    var el = $("#erro");
    el.textContent = msg;
    el.classList.remove("oculto");
  }

  function traduzir(erro) {
    var codigos = {
      "auth/invalid-email": "E-mail inválido.",
      "auth/user-not-found": "Não encontramos uma conta com esse e-mail.",
      "auth/wrong-password": "Senha incorreta.",
      "auth/invalid-credential": "E-mail ou senha incorretos.",
      "auth/invalid-login-credentials": "E-mail ou senha incorretos.",
      "auth/email-already-in-use": "Já existe uma conta com esse e-mail.",
      "auth/weak-password": "Escolha uma senha mais forte (6 caracteres ou mais).",
      "auth/too-many-requests": "Muitas tentativas. Aguarde um instante e tente de novo.",
      "auth/popup-closed-by-user": "A janela do Google foi fechada antes de terminar.",
      "auth/network-request-failed": "Sem conexão com o Firebase. Verifique a internet ou use o ambiente Demonstração.",
      "permission-denied": "O Firebase recusou o acesso. Confira se as regras do Firestore foram publicadas."
    };
    return codigos[erro && erro.code] || (erro && erro.message) || "Não foi possível concluir.";
  }

  function irPara(s) { location.replace(SM.Sessao.paginaDoPerfil(s.perfil)); }

  $("#formulario").onsubmit = function (e) {
    e.preventDefault();
    $("#erro").classList.add("oculto");
    var email = $("#email").value.trim();
    var senha = $("#senha").value;
    if (!email || !senha) return mostrarErro("Preencha e-mail e senha.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return mostrarErro("Confira o e-mail digitado.");
    if (senha.length < 6) return mostrarErro("A senha precisa de pelo menos 6 caracteres.");

    var botao = $("#botao-enviar");
    botao.disabled = true;
    botao.setAttribute("aria-busy", "true");
    var acao = modo === "cadastrar"
      ? SM.Autenticacao.cadastrarEstudante({ nome: $("#nome").value, email: email, senha: senha, turma: $("#turma").value, matricula: $("#matricula").value }, ambiente)
      : SM.Autenticacao.entrar(email, senha, ambiente, aba);
    acao.then(irPara).catch(function (erro) {
      botao.disabled = false;
      botao.removeAttribute("aria-busy");
      mostrarErro(traduzir(erro));
    });
  };

  $("#botao-google").onclick = function () {
    SM.Autenticacao.google(aba).then(irPara).catch(function (erro) { mostrarErro(traduzir(erro)); });
  };

  atualizarTela();
  prepararAmbiente();
})();
