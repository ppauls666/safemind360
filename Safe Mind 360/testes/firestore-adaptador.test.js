/* Testa o adaptador do Cloud Firestore com um Firebase simulado em memória.
   (Valida a montagem das consultas e conversões; as regras de segurança
   reais devem ser testadas no Firebase Emulator — ver README.) */
const test = require("node:test");
const assert = require("node:assert/strict");
const { carregar } = require("./ambiente");

function firebaseFalso() {
  const banco = {};
  const consultas = [];
  let seq = 0;
  class Ts { constructor(d) { this.d = d; } toDate() { return this.d; } }
  function colecao(nome, filtros = []) {
    banco[nome] = banco[nome] || new Map();
    const casa = (d) => filtros.every(([c, op, v]) => op === "==" ? d[c] === v : op === "in" ? v.includes(d[c]) : op === ">=" ? d[c] >= v : true);
    const snap = () => ({ docs: [...banco[nome].entries()].filter(([, d]) => casa(d)).map(([id, d]) => ({ id, data: () => d, exists: true })) });
    return {
      doc: (id = "auto" + ++seq) => ({
        id,
        set: async (d) => { banco[nome].set(id, Object.fromEntries(Object.entries(d).map(([k, v]) => [k, v instanceof Date ? new Ts(v) : v]))); },
        update: async (p) => { banco[nome].set(id, { ...banco[nome].get(id), ...p }); },
        get: async () => ({ id, exists: banco[nome].has(id), data: () => banco[nome].get(id) }),
        delete: async () => banco[nome].delete(id)
      }),
      where: (c, op, v) => { consultas.push([nome, c, op, v]); return colecao(nome, [...filtros, [c, op, v]]); },
      get: async () => snap(),
      onSnapshot: (ok) => { ok(snap()); return () => {}; }
    };
  }
  return { fb: { firestore: () => ({ collection: (n) => colecao(n) }) }, banco, consultas };
}

test("Adaptador Firestore: grava, consulta com filtros e converte datas", async () => {
  const SM = carregar();
  const { fb, consultas } = firebaseFalso();
  globalThis.firebase = fb;
  SM.Dados.usar("firebase");
  const doc = await SM.Dados.adicionar("checkins", { autorUid: "u1", dataHora: "2026-10-20T10:00:00.000Z", expiraEm: "2027-04-18T10:00:00.000Z", nada: undefined });
  await SM.Dados.adicionar("checkins", { autorUid: "u2", dataHora: "2026-10-21T10:00:00.000Z" });
  const meus = await SM.Dados.listar("checkins", { autorUid: "u1" });
  assert.equal(meus.length, 1);
  assert.equal(meus[0].id, doc.id);
  assert.equal(meus[0].expiraEm, "2027-04-18T10:00:00.000Z", "Timestamp convertido de volta para texto");
  assert.ok(!("nada" in meus[0]), "campos undefined não são enviados");
  assert.deepEqual(consultas.at(-1), ["checkins", "autorUid", "==", "u1"]);
  const vazio = await SM.Dados.listar("checkins", { turma: [] });
  assert.deepEqual(vazio, [], "'in' com lista vazia não consulta o servidor");
  const recentes = await SM.Dados.listar("checkins", { dataHora: { op: ">=", valor: "2026-10-21" } });
  assert.equal(recentes.length, 1);
  let recebidos = null;
  SM.Dados.observar("checkins", null, (l) => { recebidos = l; });
  assert.equal(recebidos.length, 2);
  const atualizado = await SM.Dados.atualizar("checkins", doc.id, { lido: true });
  assert.equal(atualizado.lido, true);
  delete globalThis.firebase;
});
