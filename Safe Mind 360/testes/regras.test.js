/* Testes das regras de negócio (RF01–RF08, RN02–RN07, RNF01) no ambiente local. */
const test = require("node:test");
const assert = require("node:assert/strict");
const { carregar } = require("./ambiente");

async function preparar(email) {
  const SM = carregar();
  SM.Dados.usar("local");
  SM.Semente.aplicar();
  const s = await SM.Autenticacao.entrar(email, "safemind123", "local", email.startsWith("aluno") ? "estudante" : "equipe");
  return { SM, s };
}

test("Login: senha guardada só como hash; senha errada é recusada", async () => {
  const { SM } = await preparar("aluno@safemind.ai");
  const [u] = await SM.Dados.listar("usuarios", { email: "aluno@safemind.ai" });
  assert.equal(u.senhaHash.length, 64);
  assert.ok(!JSON.stringify(u).includes("safemind123"));
  await assert.rejects(SM.Autenticacao.entrar("aluno@safemind.ai", "errada1", "local", "estudante"), /Senha incorreta/);
});

test("RF08/RN06: conta da equipe na aba de estudante é recusada", async () => {
  const { SM } = await preparar("aluno@safemind.ai");
  await assert.rejects(SM.Autenticacao.entrar("professor@safemind.ai", "safemind123", "local", "estudante"), /conta da equipe/);
});

test("RF08: acesso desativado não entra", async () => {
  const { SM, s } = await preparar("coordenacao@safemind.ai");
  const [aluno] = await SM.Dados.listar("usuarios", { email: "aluno@safemind.ai" });
  await SM.Servicos.atualizarUsuario(s, aluno.id, { ativo: false });
  await assert.rejects(SM.Autenticacao.entrar("aluno@safemind.ai", "safemind123", "local", "estudante"), /desativado/);
});

test("RF08: professor não registra intervenção nem gerencia acessos", async () => {
  const { SM, s } = await preparar("professor@safemind.ai");
  await assert.rejects(SM.Servicos.registrarIntervencao(s, { tipo: "Roda de conversa", descricao: "teste de permissão", alvoTipo: "turma", turma: "8º Ano B" }), /permissão/);
  await assert.rejects(SM.Servicos.listarUsuarios(s), /permissão/);
});

test("RF01: check-in grava entidade e evento anônimo para o dashboard (RN05)", async () => {
  const { SM, s } = await preparar("aluno@safemind.ai");
  const antes = (await SM.Dados.listar("insights")).length;
  const r = await SM.Servicos.registrarCheckin(s, { estado: 4, sentimento: "Feliz", notas: "gostei da aula" });
  assert.equal(r.checkin.estadoSocioemocional, 4);
  assert.equal(r.checkin.sentimentoSugerido, "Feliz");
  const ins = await SM.Dados.listar("insights");
  assert.equal(ins.length, antes + 1);
  const novo = ins[ins.length - 1];
  assert.equal(novo.turma, "9º Ano A");
  assert.ok(!("autorUid" in novo) && !("nome" in novo), "evento sem identificação");
});

test("RN03: relato sem nível de privacidade é recusado", async () => {
  const { SM, s } = await preparar("aluno@safemind.ai");
  await assert.rejects(SM.Servicos.enviarRelato(s, { titulo: "Teste", descricao: "Aconteceu algo no intervalo hoje." }), /nível de privacidade/);
});

test("RF03: relato anônimo não guarda quem enviou e arredonda o horário", async () => {
  const { SM, s } = await preparar("aluno@safemind.ai");
  const r = await SM.Servicos.enviarRelato(s, { titulo: "Apelidos", descricao: "Colocaram apelido em um colega de novo.", nivelPrivacidade: "ANONIMO", informarTurma: false });
  assert.equal(r.relato.autorUid, null);
  assert.equal(r.relato.autorNome, null);
  assert.equal(r.relato.turma, null);
  assert.match(r.relato.dataEnvio, /T\d\d:00:00\.000Z$/);
  const alerta = (await SM.Dados.listar("alertas", { referenciaId: r.relato.id }))[0];
  assert.equal(alerta.estudanteUid, null);
});

test("RN04: relato de risco cria alerta prioritário com nome", async () => {
  const { SM, s } = await preparar("aluno@safemind.ai");
  const r = await SM.Servicos.enviarRelato(s, { titulo: "Socorro", descricao: "Preciso falar com alguém hoje.", nivelPrivacidade: "SITUACAO_DE_RISCO" });
  const [a] = await SM.Dados.listar("alertas", { referenciaId: r.relato.id });
  assert.equal(a.prioritario, true);
  assert.equal(a.grauRisco, "alto");
  assert.equal(a.estudanteNome, "Ana Silva");
  assert.equal(a.status, "novo");
  assert.equal(a.revisaoHumana, "pendente");
});

test("RN07: status do alerta só muda com intervenção registrada", async () => {
  const { SM, s } = await preparar("coordenacao@safemind.ai");
  const [a] = await SM.Dados.listar("alertas", { status: "novo" });
  await assert.rejects(SM.Servicos.alterarStatusAlerta(s, a.id, "resolvido", null), /Registre a ação/);
  const ctx = { checkins: await SM.Dados.listar("checkins"), respostas: await SM.Dados.listar("respostas"), insights: await SM.Dados.listar("insights") };
  const iv = await SM.Servicos.registrarIntervencao(s, {
    alertaId: a.id, novoStatusAlerta: "em_acompanhamento", alvoTipo: a.estudanteUid ? "estudante" : "turma",
    estudanteUid: a.estudanteUid, estudanteNome: a.estudanteNome, turma: a.turma || "9º Ano A",
    tipo: "Mediação individual", descricao: "Conversa individual com acompanhamento semanal.", status: "em_andamento"
  }, ctx);
  const depois = await SM.Dados.obter("alertas", a.id);
  assert.equal(depois.status, "em_acompanhamento");
  assert.equal(depois.ultimaIntervencaoId, iv.id);
  assert.equal(depois.historico.at(-1).intervencaoId, iv.id);
  assert.ok("indicadorAntes" in iv.metricasAssociadas);
});

test("RF02: questionário respeita a periodicidade", async () => {
  const { SM, s } = await preparar("aluno@safemind.ai");
  const q = await SM.Servicos.questionarioAtivo();
  const resp = Object.fromEntries(q.perguntas.map((p) => [p.id, 3]));
  await SM.Servicos.responderQuestionario(s, q, resp);
  await assert.rejects(SM.Servicos.responderQuestionario(s, q, resp), /já respondeu/);
});

test("RNF01: exportação não inclui hash de senha; exclusão apaga check-ins e respostas", async () => {
  const { SM, s } = await preparar("aluno@safemind.ai");
  const dados = await SM.Servicos.exportarMeusDados(s);
  assert.ok(!("senhaHash" in dados.usuario));
  assert.ok(dados.checkins.length > 0);
  await SM.Servicos.excluirMeusRegistros(s);
  assert.equal((await SM.Dados.listar("checkins", { autorUid: s.uid })).length, 0);
  assert.equal((await SM.Dados.listar("respostas", { autorUid: s.uid })).length, 0);
});

test("RN02/RNF07: política de equipamento institucional", () => {
  const SM = carregar();
  const cfg = { politicaDispositivo: "bloquear", horarioInicio: "07:00", horarioFim: "17:30", diasLetivos: [1, 2, 3, 4, 5] };
  const sextaAula = new Date(2026, 9, 23, 10, 0);
  const sabado = new Date(2026, 9, 24, 10, 0);
  assert.equal(SM.Dispositivo.verificarPolitica(cfg, sextaAula).permitido, false);
  assert.equal(SM.Dispositivo.verificarPolitica(cfg, sabado).permitido, true);
  SM.Dispositivo.registrar({ perfil: "coordenacao", nome: "Coord" }, "Laboratório 1 – PC 04");
  assert.equal(SM.Dispositivo.verificarPolitica(cfg, sextaAula).permitido, true);
  assert.equal(SM.Dispositivo.verificarPolitica({ ...cfg, politicaDispositivo: "avisar" }, sextaAula).permitido, true);
});

test("Retenção (RNF01): registros vencidos são apagados", async () => {
  const SM = carregar();
  SM.Dados.usar("local");
  await SM.Dados.adicionar("checkins", { dataHora: "2020-01-01T10:00:00.000Z", autorUid: "x" });
  await SM.Dados.adicionar("checkins", { dataHora: new Date().toISOString(), autorUid: "x" });
  SM.Dados.aplicarRetencaoLocal(180);
  assert.equal((await SM.Dados.listar("checkins")).length, 1);
});

test("Termo LGPD: pedido no primeiro acesso e não depois de aceito", async () => {
  const { SM, s } = await preparar("aluno@safemind.ai");
  const u = await SM.Dados.obter("usuarios", s.uid);
  assert.equal(SM.Servicos.precisaConsentimento(u), true);
  await SM.Servicos.registrarConsentimento(s);
  assert.equal(SM.Servicos.precisaConsentimento(await SM.Dados.obter("usuarios", s.uid)), false);
});
