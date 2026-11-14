// copiloto-decidir
// Aprova ou recusa um item de public.copiloto_itens com o JWT do usuário.
// Primeira decisão vence.
// Item de compras aprovado vira uma linha em lista_itens e fica com status "criado"
// (ou "erro", se a gravação falhar). Tarefa, compromisso e gasto só mudam o status:
// ainda não há destino definido para eles.
// Não grava em voice_proposals, apto_propostas nem no Hub Klain.
import { createClient } from "npm:@supabase/supabase-js@2";
import { efetivar } from "./criar.ts";

const MODO: "teste" | "vivo" = "teste";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const j = (s: number, b: unknown) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

const TIPOS = ["klain-tarefa", "klain-compromisso", "apto-gasto", "compras-item", "indefinido"] as const;
const ABERTOS = ["aguardando você", "para o BOSS"];
const DECISOES = ["aprovado", "recusado"] as const;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const TERMOS_CSMT = [
  "casamento", "casamentos", "casar", "casou", "casaremos", "casorio",
  "noiva", "noivas", "noivo", "noivos", "noivado", "noivados",
  "matrimonio", "matrimonial", "cerimonialista", "cerimonialistas",
  "padrinho", "padrinhos", "madrinha", "madrinhas", "nupcial", "nupcias",
  "lua de mel", "wedding", "weddings", "bride", "bridal", "groom",
];

function normalizar(texto: string): string {
  return (texto || "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

function classe(termo: string): string {
  return [...normalizar(termo)].map((ch) => {
    const map: Record<string, string> = { a: "aáàâã", e: "eéê", i: "ií", o: "oóôõ", u: "uú", c: "cç" };
    const letra = map[ch] ? `[${map[ch]}${ch.toUpperCase()}${map[ch].toUpperCase()}]` : ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return letra;
  }).join("");
}

function encontrarCsmt(texto: string): string[] {
  if (!texto) return [];
  const hay = normalizar(texto);
  return TERMOS_CSMT.filter((termo) => new RegExp(`(?<!\\p{L})${classe(termo)}(?!\\p{L})`, "iu").test(hay));
}

function reescreverCsmt(texto: string): string {
  if (!texto) return texto;
  let out = texto;
  for (const termo of [...TERMOS_CSMT].sort((a, b) => b.length - a.length)) {
    out = out.replace(new RegExp(`(?<!\\p{L})${classe(termo)}(?!\\p{L})`, "giu"), "CSMT");
  }
  return out;
}

function csmtDe(prev: unknown, ...textos: string[]) {
  const termos = [...new Set(textos.flatMap(encontrarCsmt))];
  if (!termos.length) {
    const p = prev && typeof prev === "object" ? prev as { aplicado?: boolean; termos?: string[] } : null;
    return p && p.aplicado ? p : { aplicado: false, termos: [] };
  }
  return { aplicado: true, termos };
}

function payloadCanonico(tipo: string, bruto: unknown): Record<string, unknown> {
  const p = bruto && typeof bruto === "object" ? bruto as Record<string, unknown> : {};
  if (tipo === "klain-tarefa") {
    const titulo = reescreverCsmt(String(p.titulo ?? ""));
    const descricao = reescreverCsmt(String(p.descricao ?? ""));
    return { titulo, descricao, vencimento: p.vencimento ?? null, csmt: csmtDe(p.csmt, String(p.titulo ?? ""), String(p.descricao ?? "")) };
  }
  if (tipo === "klain-compromisso") {
    const titulo = reescreverCsmt(String(p.titulo ?? ""));
    const descricao = reescreverCsmt(String(p.descricao ?? ""));
    const local = reescreverCsmt(String(p.local ?? ""));
    return { titulo, descricao, data_hora: p.data_hora ?? null, local, csmt: csmtDe(p.csmt, `${p.titulo ?? ""} ${p.local ?? ""}`, String(p.descricao ?? "")) };
  }
  if (tipo === "apto-gasto") {
    return {
      titulo: p.titulo ?? "",
      valor: p.valor === "" || p.valor === undefined ? null : p.valor,
      data: p.data ?? null,
      ambiente: p.ambiente ?? null,
      comodo_incerto: !!p.comodo_incerto,
    };
  }
  if (tipo === "compras-item") {
    return {
      nome: p.nome ?? "",
      ambiente: p.ambiente ?? null,
      quantidade: p.quantidade ?? null,
      valor_estimado: p.valor_estimado === "" || p.valor_estimado === undefined ? null : p.valor_estimado,
      comodo_incerto: !!p.comodo_incerto,
    };
  }
  return {
    motivo: p.motivo || "Não deu para classificar com segurança.",
    candidatos: Array.isArray(p.candidatos) ? (p.candidatos as unknown[]).filter((t) => (TIPOS as readonly string[]).includes(String(t)) && t !== "indefinido") : [],
  };
}

function idOuNull(v: unknown) {
  return typeof v === "string" && UUID.test(v) ? v : null;
}

function idsDe(v: unknown): string[] {
  const lista = Array.isArray(v) ? v : (v ? [v] : []);
  const ids: string[] = [];
  for (const item of lista) {
    const id = idOuNull(item);
    if (id && !ids.includes(id)) ids.push(id);
  }
  return ids;
}

/** O PWA manda solicitante/executor/em_copia/participantes. A versão antiga mandava *_id. */
function pessoasCanonico(bruto: unknown): Record<string, unknown> {
  const p = bruto && typeof bruto === "object" ? bruto as Record<string, unknown> : {};
  return {
    solicitante_id: idOuNull(p.solicitante_id ?? p.solicitante),
    executor_id: idOuNull(p.executor_id ?? p.executor),
    em_copia: idsDe(p.em_copia ?? p.em_copia_id),
    participantes_ids: idsDe(p.participantes_ids ?? p.participantes),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return j(405, { ok: false, erro: "Use POST." });

  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return j(401, { ok: false, erro: "Faça login." });

  const URL_ = Deno.env.get("SUPABASE_URL")!;
  const sb = createClient(URL_, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });
  const { data: sess, error: authErr } = await sb.auth.getUser(token);
  if (authErr || !sess?.user) return j(401, { ok: false, erro: "Sessão inválida ou expirada. Entre de novo." });
  const role = String(sess.user.role ?? (sess.user.app_metadata as { role?: string } | undefined)?.role ?? "");
  if (role === "anon" || role === "service_role") return j(401, { ok: false, erro: "Faça login com a conta do Diego." });

  let body: { id?: string; decisao?: string; tipo?: string; payload?: unknown; pessoas?: unknown } = {};
  try { body = await req.json(); } catch { /* vazio */ }

  const id = String(body.id ?? "");
  if (!UUID.test(id)) return j(400, { ok: false, erro: "id inválido." });
  const decisao = String(body.decisao ?? "");
  if (!(DECISOES as readonly string[]).includes(decisao)) {
    return j(400, { ok: false, erro: "decisao precisa ser aprovado ou recusado." });
  }

  const adm = createClient(URL_, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const { data: atual, error: le } = await adm.from("copiloto_itens").select("id, tipo, payload, status, teste").eq("id", id).maybeSingle();
  if (le) return j(500, { ok: false, erro: "Falha ao ler a fila." });
  if (!atual) return j(404, { ok: false, erro: "Item não encontrado." });
  if (!ABERTOS.includes(atual.status)) {
    return j(200, { ok: false, jaDecidido: true, status: atual.status });
  }

  const tipo = (TIPOS as readonly string[]).includes(String(body.tipo ?? "")) ? String(body.tipo) : atual.tipo;
  if (decisao === "aprovado" && tipo === "indefinido") {
    return j(400, { ok: false, erro: "Para aprovar, escolha o tipo." });
  }

  const payload = {
    ...payloadCanonico(tipo, body.payload ?? atual.payload),
    pessoas: pessoasCanonico(body.pessoas),
  };

  const { data: upd, error: upErr } = await adm.from("copiloto_itens")
    .update({
      tipo,
      payload,
      status: decisao,
      decidido_em: new Date().toISOString(),
    })
    .eq("id", id)
    .in("status", ABERTOS)
    .select("id, status, tipo, payload, decidido_em")
    .maybeSingle();
  if (upErr) return j(500, { ok: false, erro: "Falha ao gravar a decisão." });
  if (!upd) {
    const { data: depois } = await adm.from("copiloto_itens").select("status").eq("id", id).maybeSingle();
    return j(200, { ok: false, jaDecidido: true, status: depois?.status ?? atual.status });
  }

  // A criação real vem só depois de a decisão estar gravada. Nunca gravar em voice_proposals.
  if (decisao === "aprovado") {
    const f = await efetivar(adm, id, sess.user.id, tipo, payload);
    if (f.status === "erro") {
      return j(200, { ok: false, status: "erro", erro: `Aprovado, mas ${f.erro}` });
    }
    return j(200, { ok: true, status: f.status, modo: MODO });
  }

  return j(200, { ok: true, status: upd.status, modo: MODO });
});
