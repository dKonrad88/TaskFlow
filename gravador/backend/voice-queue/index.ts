import { createClient } from 'npm:@supabase/supabase-js@2';
const URL_ = Deno.env.get('SUPABASE_URL')!, ANON = Deno.env.get('SUPABASE_ANON_KEY')!;
const sb = createClient(URL_, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const DIEGO = 'bede0061-ccfc-443f-ab15-2ef44fe73c4f';
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const j = (b: unknown, s = 200, c = false) => new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json', ...(c ? CORS : {}) } });
function eq(a: string, b: string) { if (a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; }
async function tokenUser(t: string | null): Promise<string | null> {
  if (!t) return null;
  const { data } = await sb.rpc('voice_token_user', { t });
  if (typeof data === 'string' && data) return data;
  const sec = Deno.env.get('QUEUE_TOKEN');
  if (sec && eq(t, sec)) return DIEGO;
  return null;
}
// JWT-authenticated (app) requests: returns {uid, client} or a Response.
async function jwtUser(req: Request) {
  const jwt = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!jwt) return j({ error: 'unauthorized' }, 401, true);
  const { data: u, error: ue } = await sb.auth.getUser(jwt);
  if (ue || !u?.user) return j({ error: 'unauthorized' }, 401, true);
  const client = createClient(URL_, ANON, { global: { headers: { Authorization: `Bearer ${jwt}` } } });
  const { data: allowed } = await client.rpc('voice_user_allowed');
  if (allowed !== true) return j({ error: 'unauthorized' }, 401, true);
  return { uid: u.user.id, client };
}
async function postHook(url: string, key: string | null, body: unknown) {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` }, body: JSON.stringify(body) });
  await r.body?.cancel(); return r;
}
async function trigger(req: Request) {
  const a = await jwtUser(req); if (a instanceof Response) return a;
  const uid = a.uid;
  const { count } = await sb.from('voice_queue').select('id', { count: 'exact', head: true }).eq('status', 'pendente').eq('user_id', uid);
  const { data: c, error: ce } = await sb.rpc('voice_webhook_claim_user', { p_user: uid, min_gap_s: 20 });
  if (ce) return j({ error: 'config' }, 500, true);
  const row = Array.isArray(c) ? c[0] : c;
  if (!row?.configured) return j({ ok: true, webhook: false, pending: count ?? 0 }, 200, true);
  if (!row.url) return j({ ok: true, skipped: true, wait_s: row.wait_s ?? 20, pending: count ?? 0 }, 200, true);
  try { const r = await postHook(row.url, row.key, { source: 'gravador', pending: count ?? 0 });
    return j({ ok: r.ok, webhook_status: r.status, pending: count ?? 0 }, r.ok ? 200 : 502, true);
  } catch (_e) { return j({ ok: false, error: 'webhook unreachable' }, 502, true); }
}
const EDIT = ['tipo', 'titulo', 'descricao', 'responsavel', 'prazo', 'projeto', 'etapa'];
const str = (v: unknown, n = 2000) => v === null || v === undefined ? null : String(v).slice(0, n);
const dateOk = (v: unknown) => v === null || v === undefined || v === '' || /^\d{4}-\d{2}-\d{2}$/.test(String(v));
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// App: requeue one recording the user owns that is in 'erro', then the same webhook as ?action=trigger.
async function retry(req: Request) {
  const a = await jwtUser(req); if (a instanceof Response) return a;
  let b: any; try { b = await req.json(); } catch { return j({ error: 'bad json' }, 400, true); }
  if (!b?.id || !UUID.test(String(b.id))) return j({ error: 'id required' }, 400, true);
  const { data, error } = await sb.from('voice_queue').update({ status: 'pendente', erro: null }).eq('id', b.id).eq('user_id', a.uid).eq('status', 'erro').select('id').maybeSingle();
  if (error) return j({ error: error.message }, 400, true);
  if (!data) return j({ error: 'not found or not in erro' }, 404, true);
  return trigger(req);
}
async function decide(req: Request) {
  const a = await jwtUser(req); if (a instanceof Response) return a;
  let b: any; try { b = await req.json(); } catch { return j({ error: 'bad json' }, 400, true); }
  const decision = b?.decision;
  if (!['aprovado', 'recusado'].includes(decision)) return j({ error: "decision must be 'aprovado' or 'recusado'" }, 400, true);
  const ids: string[] = Array.isArray(b.ids) ? b.ids : (b.id ? [b.id] : []);
  if (!ids.length || ids.length > 50) return j({ error: 'id or ids required' }, 400, true);
  let edited: any = null;
  if (b.fields && typeof b.fields === 'object' && ids.length === 1) {
    edited = {};
    for (const k of EDIT) if (k in b.fields) edited[k] = k === 'prazo' ? (b.fields[k] || null) : str(b.fields[k]);
    if (!dateOk(edited.prazo)) return j({ error: 'prazo must be YYYY-MM-DD' }, 400, true);
    if (!Object.keys(edited).length) edited = null;
  }
  const upd: any = { status: decision, decided_at: new Date().toISOString() };
  if (edited) upd.edited = edited;
  const { data, error } = await a.client.from('voice_proposals').update(upd).in('id', ids).eq('status', 'pendente').select('id,status');
  if (error) return j({ error: error.message }, 400, true);
  const done = (data || []).map((r: any) => r.id);
  let webhook: any = false;
  if (done.length) {
    const { data: w } = await sb.rpc('voice_webhook_get', { p_user: a.uid });
    const row = Array.isArray(w) ? w[0] : w;
    if (row?.url) {
      try { const r = await postHook(row.url, row.key, { source: 'gravador', event: 'proposal_decided', id: done[0], ids: done, decision });
        webhook = { status: r.status }; } catch (_e) { webhook = { error: 'unreachable' }; }
    }
  }
  return j({ ok: true, updated: done, decision, webhook }, 200, true);
}
const merge = (r: any) => ({ ...r, ...(r.edited || {}), original: Object.fromEntries(EDIT.map(k => [k, r[k]])) });
const ST = ['pendente', 'processando', 'processado', 'erro'];
const PST = ['pendente', 'aprovado', 'recusado', 'criado', 'erro'];
// Missing row or a read error keeps approval ON, so a proposal is never auto-approved by accident.
function approvalRequired(pref: { aprovar_antes?: boolean } | null, readError: boolean) {
  return readError || !pref || pref.aprovar_antes !== false;
}
Deno.serve(async (req) => {
  const u = new URL(req.url);
  const action = u.searchParams.get('action') || (u.pathname.endsWith('/trigger') ? 'trigger' : '');
  if (action === 'trigger' || action === 'decide' || action === 'retry') {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
    if (req.method !== 'POST') return j({ error: 'method' }, 405, true);
    if (action === 'trigger') return trigger(req);
    if (action === 'decide') return decide(req);
    return retry(req);
  }
  const uid = await tokenUser(req.headers.get('x-queue-token'));
  if (!uid) return j({ error: 'unauthorized' }, 401);
  if (action === 'propose') {
    if (req.method !== 'POST') return j({ error: 'method' }, 405);
    let b: any; try { b = await req.json(); } catch { return j({ error: 'bad json' }, 400); }
    if (!b?.titulo) return j({ error: 'titulo required' }, 400);
    if (!dateOk(b.prazo)) return j({ error: 'prazo must be YYYY-MM-DD' }, 400);
    if (b.queue_id) { const { data: q } = await sb.from('voice_queue').select('id').eq('id', b.queue_id).eq('user_id', uid).maybeSingle(); if (!q) return j({ error: 'queue_id not found' }, 404); }
    const { data: pref, error: pe } = await sb.from('voice_prefs').select('aprovar_antes').eq('user_id', uid).maybeSingle();
    const needs = approvalRequired(pref, !!pe);
    const row = { user_id: uid, queue_id: b.queue_id || null, tipo: str(b.tipo, 40), titulo: str(b.titulo, 300), descricao: str(b.descricao, 5000), responsavel: str(b.responsavel, 200), prazo: b.prazo || null, projeto: str(b.projeto, 200), etapa: str(b.etapa, 200), transcricao: str(b.transcricao, 20000), extra: (b.extra && typeof b.extra === 'object') ? b.extra : {}, status: needs ? 'pendente' : 'aprovado', decided_at: needs ? null : new Date().toISOString() };
    const { data, error } = await sb.from('voice_proposals').insert(row).select().single();
    if (error) return j({ error: error.message }, 500);
    return j(data, 201);
  }
  if (action === 'proposals') {
    if (req.method !== 'GET') return j({ error: 'method' }, 405);
    const status = u.searchParams.get('status') || 'aprovado';
    if (!PST.includes(status)) return j({ error: 'bad status' }, 400);
    const { data, error } = await sb.from('voice_proposals').select('*').eq('user_id', uid).eq('status', status).order('created_at').limit(100);
    if (error) return j({ error: error.message }, 500);
    return j(data.map(merge));
  }
  if (action === 'proposal_update') {
    if (req.method !== 'POST') return j({ error: 'method' }, 405);
    let b: any; try { b = await req.json(); } catch { return j({ error: 'bad json' }, 400); }
    if (!b?.id || !['criado', 'erro'].includes(b.status)) return j({ error: "id and status 'criado'|'erro' required" }, 400);
    const upd: any = { status: b.status };
    if (b.hub_ref !== undefined) upd.hub_ref = str(b.hub_ref, 500);
    if (b.erro !== undefined) upd.erro = str(b.erro, 2000);
    const { data, error } = await sb.from('voice_proposals').update(upd).eq('id', b.id).eq('user_id', uid).in('status', ['aprovado', 'erro']).select().maybeSingle();
    if (error) return j({ error: error.message }, 500);
    if (!data) return j({ error: 'not found or not approved' }, 404);
    return j(merge(data));
  }
  if (req.method === 'GET') {
    const status = u.searchParams.get('status') || 'pendente';
    if (!ST.includes(status)) return j({ error: 'bad status' }, 400);
    const { data, error } = await sb.from('voice_queue').select('*').eq('user_id', uid).eq('status', status).order('created_at').limit(100);
    if (error) return j({ error: error.message }, 500);
    const rows = await Promise.all(data.map(async (r) => { const { data: s } = await sb.storage.from('voice-inbox').createSignedUrl(r.audio_path, 600); return { ...r, audio_url: s?.signedUrl ?? null }; }));
    return j(rows);
  }
  if (req.method === 'POST') {
    let b: any; try { b = await req.json(); } catch { return j({ error: 'bad json' }, 400); }
    if (!b?.id || !ST.includes(b.status)) return j({ error: 'id and valid status required' }, 400);
    const upd: any = { status: b.status };
    if (b.transcricao !== undefined) upd.transcricao = b.transcricao;
    if (b.erro !== undefined) upd.erro = b.erro;
    if (b.status === 'processado') upd.processed_at = new Date().toISOString();
    const { data, error } = await sb.from('voice_queue').update(upd).eq('id', b.id).eq('user_id', uid).select().maybeSingle();
    if (error) return j({ error: error.message }, 500);
    if (!data) return j({ error: 'not found' }, 404);
    return j(data);
  }
  return j({ error: 'method' }, 405);
});
