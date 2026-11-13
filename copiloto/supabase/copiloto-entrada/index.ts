// copiloto-entrada — MODO TESTE.
// Recebe { texto }, classifica e grava SÓ em public.copiloto_itens.
// Não escreve em Hub, voice_proposals, apto_propostas nem gastos.
// verify_jwt=false: a própria função confere o Bearer.
// Aceita a COPILOTO_ENTRADA_KEY (Atalho) OU o JWT de um usuário autenticado (PWA).
// A chave do Atalho não vai para o front.
import { createClient } from "npm:@supabase/supabase-js@2";
import { montarEntrada } from "./classificar.mjs";

const MODO: "teste" | "vivo" = "teste";

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

async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const aa = enc.encode(a);
  const bb = enc.encode(b);
  if (aa.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < aa.length; i++) diff |= aa[i] ^ bb[i];
  return diff === 0;
}

async function jwtDeUsuario(token: string): Promise<boolean> {
  if (token.split(".").length !== 3) return false;
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const anon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  if (!url || !anon) return false;
  const sb = createClient(url, anon, { auth: { persistSession: false } });
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data?.user) return false;
  const role = String(data.user.role ?? (data.user.app_metadata as { role?: string } | undefined)?.role ?? "");
  return role !== "anon" && role !== "service_role";
}

async function autorizar(req: Request, adm: ReturnType<typeof createClient>): Promise<boolean> {
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return false;
  const envKey = Deno.env.get("COPILOTO_ENTRADA_KEY") ?? "";
  if (envKey && await timingSafeEqual(token, envKey)) return true;
  if (await jwtDeUsuario(token)) return true;
  if (MODO !== "teste") return false;
  const hash = await sha256Hex(token);
  const { data, error } = await adm.rpc("copiloto_entrada_token_ok", { p_hash: hash });
  if (error) return false;
  return data === true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return j(405, { ok: false, erro: "Use POST." });

  const URL_ = Deno.env.get("SUPABASE_URL")!;
  const adm = createClient(URL_, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

  if (!(await autorizar(req, adm))) {
    return j(401, { ok: false, erro: "Não autorizado. Entre de novo ou use a chave do Atalho." });
  }

  let body: { texto?: string; origem?: string } = {};
  try { body = await req.json(); } catch { /* vazio */ }
  const texto = String(body.texto ?? "").trim();
  if (!texto) return j(400, { ok: false, erro: "Envie { texto }." });
  const origem = String(body.origem ?? (MODO === "teste" ? "teste" : "atalho")).slice(0, 40);

  const r = montarEntrada(texto);
  const row = {
    origem,
    tipo: r.tipo,
    transcricao: texto,
    payload: r.payload,
    status: r.status,
    teste: MODO === "teste",
  };

  const { data, error } = await adm.from("copiloto_itens").insert(row).select("id, tipo, status, payload, teste, created_at").single();
  if (error) return j(500, { ok: false, erro: "Falha ao gravar na fila." });

  return j(200, {
    ok: true,
    modo: MODO,
    id: data.id,
    tipo: data.tipo,
    status: data.status,
    payload: data.payload,
    csmt: data.payload?.csmt,
  });
});
