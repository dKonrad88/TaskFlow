// copiloto-hub
// Fila de envio ao Hub Klain, para o agente da conta do Diego.
// Autenticação: header x-hub-key igual ao segredo COPILOTO_HUB_KEY.
// verify_jwt fica desligado: a chave é o segredo, não o JWT do usuário.
// Não lê nem devolve transcrição, payload.csmt nem ids internos de pessoas.
// Itens aprovados antes desta função (sem payload.hub_envio) não entram na fila.
import { createClient } from "npm:@supabase/supabase-js@2";
import { itemParaAgente, naFilaDoHub, normalizarNumero } from "./hub-envio.ts";
import type { HubEnvio } from "./hub-envio.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-hub-key",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
const j = (s: number, b: unknown) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

const TIPOS_HUB = ["klain-tarefa", "klain-compromisso"] as const;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function chaveOk(enviada: string, esperada: string): boolean {
  if (!enviada || !esperada || enviada.length !== esperada.length) return false;
  const a = new TextEncoder().encode(enviada);
  const b = new TextEncoder().encode(esperada);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

function autorizar(req: Request): boolean {
  const esperada = (Deno.env.get("COPILOTO_HUB_KEY") ?? "").trim();
  const enviada = (req.headers.get("x-hub-key") ?? "").trim();
  return chaveOk(enviada, esperada);
}

function refTabela(tipo: string): "hub_klain_tarefa" | "hub_klain_compromisso" {
  return tipo === "klain-compromisso" ? "hub_klain_compromisso" : "hub_klain_tarefa";
}

function envioDe(payload: unknown): HubEnvio | null {
  if (!payload || typeof payload !== "object") return null;
  const e = (payload as { hub_envio?: unknown }).hub_envio;
  if (!e || typeof e !== "object") return null;
  return e as HubEnvio;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (!autorizar(req)) return j(401, { ok: false, erro: "não autorizado." });

  const URL_ = Deno.env.get("SUPABASE_URL")!;
  const adm = createClient(URL_, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const url = new URL(req.url);
  const acao = url.searchParams.get("acao") || "";

  if (req.method === "GET") {
    const status = url.searchParams.get("status") || "aprovado";
    if (status !== "aprovado" && status !== "erro") return j(400, { ok: false, erro: "status deve ser aprovado ou erro." });
    const { data, error } = await adm.from("copiloto_itens")
      .select("id, tipo, payload, status, teste, created_at, ref_externo")
      .in("tipo", TIPOS_HUB)
      .eq("status", status)
      .is("ref_externo", null)
      .order("created_at");
    if (error) return j(500, { ok: false, erro: "falha ao ler a fila." });
    const itens = [];
    for (const row of data ?? []) {
      if (!naFilaDoHub(row.payload)) continue;
      const item = itemParaAgente(row.id, row.tipo, !!row.teste, row.created_at, row.payload);
      if (item) itens.push(item);
    }
    return j(200, { ok: true, itens });
  }

  if (req.method !== "POST") return j(405, { ok: false, erro: "Use GET ou POST." });

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return j(400, { ok: false, erro: "JSON inválido." });
  }
  const id = String(body.id ?? "");
  if (!UUID.test(id)) return j(400, { ok: false, erro: "id inválido." });

  const { data: atual, error: le } = await adm.from("copiloto_itens")
    .select("id, tipo, payload, status, ref_externo, ref_tabela, ref_id")
    .eq("id", id)
    .maybeSingle();
  if (le) return j(500, { ok: false, erro: "falha ao ler o item." });
  if (!atual || !TIPOS_HUB.includes(atual.tipo) || !naFilaDoHub(atual.payload)) {
    return j(404, { ok: false, erro: "item não encontrado na fila do Hub." });
  }

  if (body.acao === "reenviar" || acao === "reenviar") {
    if (atual.status !== "erro" || atual.ref_externo) {
      return j(409, { ok: false, erro: "só é possível reenviar um item com erro, ainda sem número no Hub." });
    }
    const envio = envioDe(atual.payload)!;
    const hub_envio: HubEnvio = {
      ...envio,
      tentativas: (envio.tentativas ?? 0) + 1,
      reenviado_em: new Date().toISOString(),
    };
    delete hub_envio.erro;
    const { error: upErr } = await adm.from("copiloto_itens")
      .update({ status: "aprovado", payload: { ...(atual.payload as object), hub_envio } })
      .eq("id", id)
      .eq("status", "erro")
      .is("ref_externo", null);
    if (upErr) return j(500, { ok: false, erro: "falha ao reenviar." });
    return j(200, { ok: true, status: "aprovado" });
  }

  const decisao = String(body.status ?? "");
  if (decisao !== "criado" && decisao !== "erro") {
    return j(400, { ok: false, erro: "status deve ser criado ou erro." });
  }

  if (atual.status === "criado" && atual.ref_externo) {
    const numero = normalizarNumero(body.numero);
    if (decisao === "criado" && numero && numero === atual.ref_externo) {
      return j(200, { ok: true, status: "criado", ref_externo: atual.ref_externo, jaCriado: true });
    }
    return j(409, { ok: false, erro: "este item já foi criado no Hub.", status: "criado", ref_externo: atual.ref_externo });
  }
  if (atual.status !== "aprovado" && atual.status !== "erro") {
    return j(409, { ok: false, erro: "este item não está na fila do Hub.", status: atual.status });
  }

  const envio = envioDe(atual.payload)!;
  const avisosChegada = Array.isArray(body.avisos) ? body.avisos.map((a) => String(a).slice(0, 300)) : [];
  const avisos = [...(envio.avisos ?? []), ...avisosChegada].slice(0, 40);

  if (decisao === "erro") {
    const msg = String(body.erro ?? "falhou a criação no Hub.").slice(0, 500);
    const hub_envio: HubEnvio = { ...envio, avisos, erro: msg };
    const { error: upErr } = await adm.from("copiloto_itens")
      .update({ status: "erro", payload: { ...(atual.payload as object), hub_envio } })
      .eq("id", id)
      .in("status", ["aprovado", "erro"])
      .is("ref_externo", null);
    if (upErr) return j(500, { ok: false, erro: "falha ao gravar o erro." });
    return j(200, { ok: true, status: "erro" });
  }

  const numero = normalizarNumero(body.numero);
  if (!numero) return j(400, { ok: false, erro: "informe o número gerado no Hub." });
  const hub_envio: HubEnvio = { ...envio, avisos, numero, criado_em: new Date().toISOString() };
  delete hub_envio.erro;
  const { data: upd, error: upErr } = await adm.from("copiloto_itens")
    .update({
      status: "criado",
      ref_tabela: refTabela(atual.tipo),
      ref_id: null,
      ref_externo: numero,
      payload: { ...(atual.payload as object), hub_envio },
    })
    .eq("id", id)
    .in("status", ["aprovado", "erro"])
    .is("ref_externo", null)
    .select("id, status, ref_tabela, ref_externo")
    .maybeSingle();
  if (upErr) return j(500, { ok: false, erro: "falha ao gravar o número do Hub." });
  if (!upd) {
    const { data: depois } = await adm.from("copiloto_itens").select("status, ref_externo").eq("id", id).maybeSingle();
    if (depois?.status === "criado" && depois.ref_externo === numero) {
      return j(200, { ok: true, status: "criado", ref_externo: numero, jaCriado: true });
    }
    return j(409, { ok: false, erro: "este item já foi criado no Hub.", status: depois?.status ?? atual.status });
  }
  return j(200, { ok: true, status: "criado", ref_tabela: upd.ref_tabela, ref_externo: upd.ref_externo });
});
