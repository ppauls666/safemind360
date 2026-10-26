/* Testes do MotorIA (RF04, RN01, RN04, RNF03). Rodar: npm test */
const test = require("node:test");
const assert = require("node:assert/strict");
const { carregar } = require("./ambiente");
const SM = carregar();
const IA = SM.MotorIA;

test("RNF03: métricas no conjunto de validação atendem as metas", () => {
  const r = IA.avaliarModelo();
  assert.ok(r.f1Macro >= 0.8, "F1 macro " + r.f1Macro);
  assert.ok(r.recallRisco >= 0.9, "revocação de risco " + r.recallRisco);
  assert.equal(r.total, 80);
});

test("PLN: normaliza gírias e acentos", () => {
  assert.equal(IA.normalizar("Vc n sabe, tô mt mal"), "voce nao sabe estou muito mal");
});

test("PLN: negação não gera falso sofrimento", () => {
  assert.equal(IA.analisarTexto("não estou triste, foi um dia bom").classe, "NEUTRO");
  assert.equal(IA.analisarTexto("não estou bem hoje").classe, "SOFRIMENTO_EMOCIONAL");
});

test("PLN: palavras dentro de outras não disparam (\"mal\" em \"normal\")", () => {
  assert.equal(IA.analisarTexto("a aula foi normal").classe, "NEUTRO");
});

test("PLN: risco sempre tem prioridade e grau alto", () => {
  const a = IA.analisarTexto("me zoam todo dia e eu queria sumir pra sempre");
  assert.equal(a.classe, "SITUACAO_DE_RISCO");
  assert.equal(a.grauRisco, "alto");
});

test("PLN: repetição reforça bullying", () => {
  const a = IA.analisarTexto("me xingaram de novo no intervalo");
  assert.equal(a.classe, "CONFLITO");
  assert.ok(a.repeticao);
});

test("RN04: relato marcado como Situação de risco é prioritário mesmo sem sinal no texto", () => {
  const r = IA.avaliarRelato({ titulo: "Ajuda", descricao: "Quero conversar com alguém hoje.", nivelPrivacidade: "SITUACAO_DE_RISCO" });
  assert.equal(r.grauRisco, "alto");
  assert.equal(r.prioritario, true);
  assert.equal(r.origemRisco, "estudante");
});

test("RN04: IA identifica risco em relato anônimo", () => {
  const r = IA.avaliarRelato({ titulo: "Saída", descricao: "Disseram que vão me bater amanhã.", nivelPrivacidade: "ANONIMO" });
  assert.equal(r.prioritario, true);
  assert.equal(r.origemRisco, "ia");
});

test("Check-in: padrão de humor baixo gera alerta só quando começa", () => {
  const base = Date.parse("2026-10-01T10:00:00Z");
  const hist = [];
  const alertas = [];
  for (let i = 0; i < 6; i++) {
    const c = { dataHora: new Date(base + i * 86400000).toISOString(), estadoSocioemocional: 2, sentimentoSugerido: "Triste", notas: "" };
    const a = IA.avaliarCheckin(c, hist);
    c.analise = { motivosAtivos: a.motivosAtivos, motivosAlertados: a.gerarAlerta ? a.motivosAlertados : [] };
    hist.push(c);
    if (a.gerarAlerta) alertas.push(i);
  }
  assert.deepEqual(alertas, [2], "alerta apenas no 3º dia baixo, não a cada registro");
});

test("Questionário: provocações frequentes geram alerta de conflito", () => {
  const q = SM.Negocio.QUESTIONARIO_PADRAO;
  const r = IA.avaliarQuestionario(q, { q1: 4, q2: 4, q3: 5, q4: 1, q5: 4, q6: 4 });
  assert.ok(r.categorias.includes("CONFLITO"));
  assert.equal(r.gerarAlerta, true);
  const ok = IA.avaliarQuestionario(q, { q1: 5, q2: 5, q3: 1, q4: 1, q5: 5, q6: 5 });
  assert.equal(ok.indice, 100);
  assert.equal(ok.gerarAlerta, false);
});

test("RN05: turma com poucos registros não mostra indicador", () => {
  const hoje = new Date();
  const eventos = [1, 2, 3].map(() => ({ dia: IA.diaISO(hoje), valor: 50, categorias: [] }));
  const p = IA.padroesTurma(eventos, { kMinimo: 5 });
  assert.equal(p.suficiente, false);
  assert.equal(p.indice, null);
});

test("RF07: eficácia só é julgada após 7 dias", () => {
  const t0 = Date.parse("2026-10-10T12:00:00Z");
  const serie = [-5, -3, 1, 2, 4, 6, 8].map((d) => ({ data: new Date(t0 + d * 86400000).toISOString(), valor: d < 0 ? 40 : 70 }));
  const cedo = IA.medirEficacia({ dataRegistro: new Date(t0).toISOString() }, serie, { agora: new Date(t0 + 5 * 86400000).toISOString() });
  assert.equal(cedo.resultado, "insuficiente");
  const depois = IA.medirEficacia({ dataRegistro: new Date(t0).toISOString() }, serie, { agora: new Date(t0 + 9 * 86400000).toISOString() });
  assert.equal(depois.resultado, "melhora");
  assert.equal(depois.variacao, 30);
});
