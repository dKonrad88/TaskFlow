// copiloto-entrada
// Recebe { texto, area?, aprovar? }, classifica e grava em public.copiloto_itens.
// - area ("hub" | "apto" | "compras") vem do chip do app e fixa o tipo. Sem ela, o texto decide.
// - aprovar === false (preferência do app) deixa um item de compras seguir direto:
//   ele já entra aprovado e vai para a lista do supermercado. Gasto e item do Hub Klain sempre esperam o Diego.
// As linhas continuam marcadas com teste: true enquanto MODO for "teste".
// Não escreve em voice_proposals, apto_propostas nem gastos.
// verify_jwt=false: a própria função confere o Bearer.
// Aceita a COPILOTO_ENTRADA_KEY (Atalho) OU o JWT de um usuário autenticado (PWA).
// A chave do Atalho não vai para o front.
import { createClient } from "npm:@supabase/supabase-js@2";
import { montarEntrada } from "./classificar.mjs";
import { efetivar } from "./criar.ts";

const MODO: "teste" | "vivo" = "teste";
const AREAS = ["hub", "apto", "compras"];

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const j = (s: number, b: unknown) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const aa = enc.encode(a);
  const bb = enc.encode(b);
  if (aa.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < aa.length; i++) diff |= aa[i] ^ bb[i];
  return diff === 0;
}

/** Devolve o id do usuário quando o token é o JWT de alguém logado. */
async function usuarioDoJwt(token: string): Promise<string | null> {
  if (token.split(".").length !== 3) return null;
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const anon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  if (!url || !anon) return null;
  const sb = createClient(url, anon, { auth: { persistSession: false } });
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data?.user) return null;
  const role = String(data.user.role ?? (data.user.app_metadata as { role?: string } | undefined)?.role ?? "");
  if (role === "anon" || role === "service_role") return null;
  return data.user.id;
}

async function autorizar(req: Request, adm: ReturnType<typeof createClient>): Promise<{ ok: boolean; userId: string | null }> {
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return { ok: false, userId: null };
  const envKey = Deno.env.get("COPILOTO_ENTRADA_KEY") ?? "";
  if (envKey && timingSafeEqual(token, envKey)) return { ok: true, userId: null };
  const userId = await usuarioDoJwt(token);
  if (userId) return { ok: true, userId };
  if (MODO !== "teste") return { ok: false, userId: null };
  const hash = await sha256Hex(token);
  const { data, error } = await adm.rpc("copiloto_entrada_token_ok", { p_hash: hash });
  if (error) return { ok: false, userId: null };
  return { ok: data === true, userId: null };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return j(405, { ok: false, erro: "Use POST." });

  const URL_ = Deno.env.get("SUPABASE_URL")!;
  const adm = createClient(URL_, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

  const quem = await autorizar(req, adm);
  if (!quem.ok) {
    return j(401, { ok: false, erro: "Não autorizado. Entre de novo ou use a chave do Atalho." });
  }

  let body: { texto?: string; origem?: string; area?: string; aprovar?: boolean } = {};
  try { body = await req.json(); } catch { /* vazio */ }
  const texto = String(body.texto ?? "").trim();
  if (!texto) return j(400, { ok: false, erro: "Envie { texto }." });
  const origem = String(body.origem ?? (MODO === "teste" ? "teste" : "atalho")).slice(0, 40);
  const area = AREAS.includes(String(body.area ?? "")) ? String(body.area) : undefined;

  const r = montarEntrada(texto, new Date(), { area });
  // Só item de compras, e só de quem está logado, pode pular a aprovação.
  const direto = body.aprovar === false && r.tipo === "compras-item" && !!quem.userId;
  const row: Record<string, unknown> = {
    origem,
    tipo: r.tipo,
    transcricao: texto,
    payload: r.payload,
    status: direto ? "aprovado" : r.status,
    teste: MODO === "teste",
  };
  if (direto) row.decidido_em = new Date().toISOString();

  const { data, error } = await adm.from("copiloto_itens").insert(row).select("id, tipo, status, payload, teste, created_at").single();
  if (error) return j(500, { ok: false, erro: "Falha ao gravar na fila." });

  let status = data.status as string;
  let aviso: string | undefined;
  if (direto) {
    const f = await efetivar(adm, data.id, quem.userId, data.tipo, data.payload ?? {});
    status = f.status;
    if (f.status === "erro") aviso = `Entrou na fila, mas ${f.erro}`;
  }

  return j(200, {
    ok: true,
    modo: MODO,
    id: data.id,
    tipo: data.tipo,
    status,
    direto,
    aviso,
    payload: data.payload,
    csmt: data.payload?.csmt,
  });
});
