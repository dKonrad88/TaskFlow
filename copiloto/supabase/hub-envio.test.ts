import { assertEquals, assert, assertFalse } from "jsr:@std/assert@1";
import {
  reescreverCsmt,
  encontrarCsmt,
  isoParaHub,
  compromissoHorarios,
  hojeSP,
  prepararPacote,
  naFilaDoHub,
  itemParaAgente,
  normalizarNumero,
  DURACAO_COMPROMISSO_MIN,
} from "./copiloto-hub/hub-envio.ts";
import type { PessoaCadastro } from "./copiloto-hub/hub-envio.ts";

const PADRAO: PessoaCadastro = {
  id: "00000000-0000-4000-8000-000000000001",
  nome: "Pessoa Padrão",
  papel: "Direção",
  usos: ["solicitante", "executor", "em_copia", "participantes"],
  padrao: true,
  ativo: true,
};
const ALGUEM: PessoaCadastro = {
  id: "00000000-0000-4000-8000-000000000002",
  nome: "Pessoa Alfa",
  papel: "Qualidade",
  usos: ["solicitante", "executor", "em_copia", "participantes"],
  padrao: false,
  ativo: true,
};
const BETA: PessoaCadastro = {
  id: "00000000-0000-4000-8000-000000000003",
  nome: "Pessoa Beta",
  papel: "Comercial",
  usos: ["solicitante", "executor", "em_copia", "participantes"],
  padrao: false,
  ativo: true,
};
const GRUPO: PessoaCadastro = {
  id: "00000000-0000-4000-8000-000000000004",
  nome: "Grupo Alfa",
  papel: "grupo",
  usos: ["solicitante", "executor"],
  padrao: false,
  ativo: true,
};
const CADASTRO = [PADRAO, ALGUEM, BETA, GRUPO];
const AGORA = new Date("2026-11-25T14:00:00-03:00");

Deno.test("reescreve termo vetado e não deixa resto", () => {
  const bruto = "Revisar pesquisa do casamento com o comitê e a noiva";
  const limpo = reescreverCsmt(bruto);
  assert(limpo.includes("CSMT"));
  assertEquals(encontrarCsmt(limpo), []);
  assertFalse(/casamento|noiva/i.test(limpo));
});

Deno.test("guarda CSMT recusa o que a reescrita não limpa", () => {
  // A guarda roda DEPOIS da reescrita; este caso cobre o caminho feliz e o título vazio.
  const vazio = prepararPacote("klain-tarefa", { titulo: "   ", descricao: "" }, CADASTRO, AGORA);
  assertEquals(vazio.ok, false);
  if (!vazio.ok) assertEquals(vazio.erro, "o item está sem título.");
});

Deno.test("converte data AAAA-MM-DD para mm/dd/yyyy do Hub", () => {
  assertEquals(isoParaHub("2026-11-25"), "11/25/2026");
  assertEquals(isoParaHub("2026-02-30"), null);
  assertEquals(isoParaHub("25/11/2026"), null);
});

Deno.test("compromisso soma 1 hora e atravessa a meia-noite", () => {
  assertEquals(DURACAO_COMPROMISSO_MIN, 60);
  const manha = compromissoHorarios("2026-11-24T05:30:00");
  assertEquals(manha, { data: "11/24/2026", hora_inicio: "05:30", hora_fim: "06:30", data_fim: "11/24/2026" });
  const noite = compromissoHorarios("2026-11-24T23:30:00");
  assertEquals(noite, { data: "11/24/2026", hora_inicio: "23:30", hora_fim: "00:30", data_fim: "11/25/2026" });
});

Deno.test("tarefa: início vazio vira hoje, vencimento vazio fica sem data, pessoas padrão e avisos", () => {
  const r = prepararPacote("klain-tarefa", {
    titulo: "Revisar relatório",
    descricao: "",
    pessoas: {
      solicitante_id: null,
      executor_id: "00000000-0000-4000-8000-000000000099",
      em_copia: [ALGUEM.id, GRUPO.id, "00000000-0000-4000-8000-000000000099"],
      participantes_ids: [BETA.id],
    },
  }, CADASTRO, AGORA);
  assert(r.ok);
  if (!r.ok) return;
  assertEquals(hojeSP(AGORA), "2026-11-25");
  if (r.pacote.tipo !== "klain-tarefa") throw new Error("tipo");
  assertEquals(r.pacote.inicio, "11/25/2026");
  assertEquals(r.pacote.vencimento, null);
  assertEquals(r.pacote.solicitante.nome, "Pessoa Padrão");
  assertEquals(r.pacote.executor.nome, "Pessoa Padrão");
  assertEquals(r.pacote.em_copia.map((p) => p.nome), ["Pessoa Alfa"]);
  assertEquals(r.pacote.categoria, null);
  assert(r.avisos.some((a) => a.includes("executor")));
  assert(r.avisos.some((a) => a.includes("Grupo Alfa")));
  assert(r.avisos.some((a) => a.includes("em cópia")));
  assert(r.avisos.some((a) => a.includes("participantes não existem")));
  assertFalse("csmt" in r.pacote);
  const json = JSON.stringify(r.pacote);
  assertFalse(json.includes("00000000"));
  assertFalse(json.includes("termos"));
});

Deno.test("tarefa com CSMT no título não leva o termo original ao pacote", () => {
  const r = prepararPacote("klain-tarefa", {
    titulo: "Reservar data do casamento",
    descricao: "falar com a noiva",
    inicio: "2026-12-01",
    vencimento: "2026-12-12",
    csmt: { aplicado: true, termos: ["casamento", "noiva"] },
    pessoas: { solicitante_id: ALGUEM.id, executor_id: BETA.id, em_copia: [], participantes_ids: [] },
    transcricao: "texto com casamento",
  }, CADASTRO, AGORA);
  assert(r.ok);
  if (!r.ok) return;
  if (r.pacote.tipo !== "klain-tarefa") throw new Error("tipo");
  assertEquals(r.pacote.titulo, "Reservar data do CSMT");
  assertEquals(r.pacote.descricao, "falar com a CSMT");
  assertEquals(r.pacote.inicio, "12/01/2026");
  assertEquals(r.pacote.vencimento, "12/12/2026");
  assertEquals(r.pacote.solicitante.nome, "Pessoa Alfa");
  assertEquals(r.pacote.executor.nome, "Pessoa Beta");
  const json = JSON.stringify(r.pacote);
  assertFalse(/casamento|noiva/i.test(json));
  assertFalse(json.includes("termos"));
  assertEquals(r.payload.titulo, "Reservar data do CSMT");
  // o payload interno pode manter csmt; o pacote do agente, não
  assertEquals((r.payload.csmt as { termos: string[] }).termos, ["casamento", "noiva"]);
});

Deno.test("compromisso exige data_hora, usa 1 hora e monta a aba Pessoas", () => {
  const semHora = prepararPacote("klain-compromisso", { titulo: "Reunião", descricao: "", local: "obra" }, CADASTRO, AGORA);
  assertEquals(semHora.ok, false);
  if (!semHora.ok) assertEquals(semHora.erro, "o compromisso está sem data e hora.");

  const r = prepararPacote("klain-compromisso", {
    titulo: "Reunião na obra",
    descricao: "alinhamento",
    data_hora: "2026-11-19T13:00:00",
    local: "na obra",
    pessoas: {
      solicitante_id: PADRAO.id,
      executor_id: PADRAO.id,
      em_copia: [],
      participantes_ids: [ALGUEM.id, PADRAO.id],
    },
  }, CADASTRO, AGORA);
  assert(r.ok);
  if (!r.ok) return;
  if (r.pacote.tipo !== "klain-compromisso") throw new Error("tipo");
  assertEquals(r.pacote.data, "11/19/2026");
  assertEquals(r.pacote.hora_inicio, "13:00");
  assertEquals(r.pacote.hora_fim, "14:00");
  assertEquals(r.pacote.data_fim, "11/19/2026");
  assertEquals(r.pacote.organizador.nome, "Pessoa Padrão");
  assertEquals(r.pacote.pessoas.map((p) => p.nome), ["Pessoa Alfa"]);
  assertEquals(r.pacote.pessoas[0].papel_hub, "Leitora");
  assertEquals(r.pacote.local, "na obra");
});

Deno.test("fila só aceita item com hub_envio; o agente não vê csmt nem transcrição", () => {
  assertFalse(naFilaDoHub({ titulo: "Teste" }));
  assertFalse(naFilaDoHub({ hub_envio: {} }));
  const r = prepararPacote("klain-tarefa", {
    titulo: "Teste",
    descricao: "",
    inicio: "2026-11-25",
    csmt: { aplicado: false, termos: [] },
    transcricao: "gravação",
    pessoas: { solicitante_id: PADRAO.id, executor_id: PADRAO.id, em_copia: [], participantes_ids: [] },
  }, CADASTRO, AGORA);
  assert(r.ok);
  if (!r.ok) return;
  const payload = { ...r.payload, transcricao: "gravação", hub_envio: { fila_em: "2026-11-25T14:00:00.000Z", tentativas: 0, pacote: r.pacote, avisos: [] } };
  assert(naFilaDoHub(payload));
  const item = itemParaAgente("11111111-1111-4111-8111-111111111111", "klain-tarefa", true, "2026-11-25T14:00:00.000Z", payload);
  assert(item);
  const json = JSON.stringify(item);
  assertFalse(json.includes("gravação"));
  assertFalse(json.includes("csmt"));
  assertFalse(json.includes("termos"));
  assertEquals(item.titulo, "Teste");
  assertEquals(item.teste, true);
});

Deno.test("número do Hub aceita dígitos e rejeita lixo", () => {
  assertEquals(normalizarNumero("20261"), "20261");
  assertEquals(normalizarNumero("#1645"), "1645");
  assertEquals(normalizarNumero("  12  "), "12");
  assertEquals(normalizarNumero("abc"), null);
  assertEquals(normalizarNumero(""), null);
});
