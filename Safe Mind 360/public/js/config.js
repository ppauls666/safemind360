/* =====================================================================
   SafeMind 360 — Configuração geral
   Carregado antes das três camadas (Dados, Negócio, Apresentação).
   ===================================================================== */
(function (raiz) {
  "use strict";
  var SM = raiz.SafeMind = raiz.SafeMind || {};

  SM.Config = {
    versao: "2.0.0",

    /* Versão do termo de ciência/consentimento (RNF01 – LGPD).
       Ao mudar o texto do termo, altere a versão para pedir nova ciência. */
    versaoTermo: "2026-10",

    /* Back-end (seção 6.1): Firebase Authentication + Cloud Firestore. */
    firebase: {
      apiKey: "AIzaSyDle7d2VEWW_3Kpbv2bfcHa8XYIZ-4bq4Q",
      authDomain: "domquixotee-6c490.firebaseapp.com",
      projectId: "domquixotee-6c490",
      storageBucket: "domquixotee-6c490.firebasestorage.app",
      messagingSenderId: "654874873259",
      appId: "1:654874873259:web:a77076dc57fc43a8c7d6ee"
    },
    sdkFirebase: "https://www.gstatic.com/firebasejs/10.12.2/",

    /* Contas de demonstração (ambiente local). As senhas só existem
       para a apresentação; no banco local fica apenas o hash (senhaHash). */
    contasDemo: [
      { email: "aluno@safemind.ai",        senha: "safemind123", perfil: "estudante" },
      { email: "professor@safemind.ai",    senha: "safemind123", perfil: "professor" },
      { email: "coordenacao@safemind.ai",  senha: "safemind123", perfil: "coordenacao" },
      { email: "admin@safemind.ai",        senha: "safemind123", perfil: "coordenacao" }
    ],

    turmasPadrao: [
      { id: "7A", nome: "7º Ano A", turno: "Matutino" },
      { id: "7B", nome: "7º Ano B", turno: "Vespertino" },
      { id: "8A", nome: "8º Ano A", turno: "Matutino" },
      { id: "8B", nome: "8º Ano B", turno: "Vespertino" },
      { id: "9A", nome: "9º Ano A", turno: "Matutino" },
      { id: "9C", nome: "9º Ano C", turno: "Vespertino" }
    ],

    /* RN05 – número mínimo de registros para exibir um indicador de turma.
       Abaixo disso o painel oculta o dado para não permitir identificar alguém. */
    kMinimo: 5,

    /* RNF01 – retenção: registros mais antigos que isso são apagados. */
    retencaoDias: 180,

    /* RN02 – em dispositivo institucional, a sessão do estudante
       termina sozinha após este tempo sem uso. */
    inatividadeQuiosqueMs: 3 * 60 * 1000,
    avisoInatividadeMs: 30 * 1000,

    /* Janela usada para medir a eficácia das intervenções (RF07). */
    janelaEficaciaDias: 14,

    /* Política padrão de uso (Lei nº 15.100/2025 – RN02/RNF07). */
    configEscolaPadrao: {
      politicaDispositivo: "avisar", /* desativado | avisar | bloquear */
      horarioInicio: "07:00",
      horarioFim: "17:30",
      diasLetivos: [1, 2, 3, 4, 5]
    },

    /* Metas do RNF03 (confiabilidade do motor de IA). */
    metasIA: { f1Macro: 0.80, recallRisco: 0.90 }
  };
})(typeof window !== "undefined" ? window : globalThis);
