import { createRoot } from "react-dom/client";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import type { ChangeEvent, PointerEvent, CSSProperties, KeyboardEvent, ReactNode } from "react";

type Kind = "entrada" | "diretor" | "pesquisador" | "trabalhador" | "supervisor" | "entrega";
interface GNode { id: string; kind: Kind; name: string; x: number; y: number; instr: string; format: string; rounds: number; decision?: string; role?: string; tools?: string; color?: string; rid?: string }
interface GEdge { id: string; from: string; to: string }
interface Lane { id?: string; x: number; y: number; h: number; w?: number; label: string }
interface Note { id: string; x: number; y: number; w: number; h: number; text: string }
interface Graph { objective: string; nodes: GNode[]; edges: GEdge[]; lanes?: Lane[]; notes?: Note[] }
interface Tab { id: string; name: string; graph: Graph }
interface Store { tabs: Tab[]; active: string }
type Sel = { t: "node" | "note" | "lane"; id: string } | null;
interface Drag { mode: "pan" | "node" | "note" | "lane"; id?: string; sx: number; sy: number; ox: number; oy: number; carry?: { id: string; x: number; y: number }[] }

const W = 220; const H = 66; const KEY = "taskflow_fluxogramas"; const OLD_KEY = "fluxograma-agentes-v3";
const LABEL: Record<Kind, string> = { entrada: "Entrada", diretor: "Diretor", pesquisador: "Pesquisador", trabalhador: "Trabalhador", supervisor: "Supervisor", entrega: "Entrega" };
const DESC: Record<Kind, string> = {
  entrada: "O que você cola na hora de rodar. Opcional, no máximo uma.",
  diretor: "Orquestrador: distribui o trabalho, acompanha e decide quando seguir.",
  pesquisador: "Pesquisa e reúne fatos e fontes para as próximas etapas.",
  trabalhador: "Executa uma parte do trabalho, constrói.",
  supervisor: "Crítico cego: julga o que chegou e devolve para refazer.",
  entrega: "Junta vários loops em um artefato que alimenta a próxima fase.",
};
const ROLE_TXT: Record<Kind, string> = {
  entrada: "dado fornecido pelo Diego no início. Peça-o se ainda não foi colado.",
  diretor: "orquestra: distribui o trabalho, acompanha cada etapa e decide quando seguir.",
  pesquisador: "pesquisa e reúne fatos e fontes para as próximas etapas; cite as fontes.",
  trabalhador: "executa e constrói esta parte do trabalho.",
  supervisor: "crítico cego. Avalie só o que recebeu, sem saber como foi feito.",
  entrega: "junta os resultados recebidos em um único artefato final.",
};
const KINDS: Kind[] = ["entrada", "diretor", "pesquisador", "trabalhador", "supervisor", "entrega"];
const STRIPE: Record<Kind, string> = { entrada: "#5eead4", diretor: "#c4b5fd", pesquisador: "#7dd3fc", trabalhador: "#93c5fd", supervisor: "#fdba74", entrega: "#86efac" };
const SWATCHES: string[] = ["", "#93c5fd", "#7dd3fc", "#5eead4", "#86efac", "#fdba74", "#f9a8d4", "#c4b5fd", "#fca5a5", "#d1d5db"];
const uid = (): string => Math.random().toString(36).slice(2, 9);
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x)) as T;
interface Role { id: string; name: string; icon: string; color: string; base: Kind; desc: string; rounds: number }
const ROLE_KEY = "taskflow_fluxo_papeis";
const ROLE_ICONS: string[] = ["✍️", "🔍", "🧠", "🎨", "🧪", "📊", "🛠️", "📣", "⚖️", "🧭", "📝", "💡", "🎯", "🧩", "🛡️", "🚀"];
const ROLE_BASES: [Kind, string][] = [["trabalhador", "Faz"], ["supervisor", "Revisa"], ["pesquisador", "Pesquisa"], ["diretor", "Coordena"], ["entrega", "Entrega"]];
let ROLES: Role[] = [];
const roleOf = (n: GNode): Role | undefined => (n.rid ? ROLES.find((r: Role) => r.id === n.rid) : undefined);
const kindLabel = (n: GNode): string => { const r = roleOf(n); return r ? `${r.name} (base: ${LABEL[n.kind]})` : LABEL[n.kind]; };
const usedRoles = (g: Graph): Role[] => ROLES.filter((r: Role) => g.nodes.some((n: GNode) => n.rid === r.id));
const rolesMd = (g: Graph): string[] => { const u = usedRoles(g); return u.length ? ["", "## Papéis personalizados", ...u.map((r: Role) => `- **${r.icon} ${r.name}** — comportamento base: ${LABEL[r.base]}${r.base === "supervisor" ? ` (até ${r.rounds} rodadas por padrão)` : ""}${r.desc ? `. ${r.desc}` : ""}`)] : []; };
const cleanRole = (r: Role): Role => ({ id: r.id, name: r.name, icon: r.icon || "◆", color: r.color || "#5ee0ff", base: KINDS.indexOf(r.base) >= 0 && r.base !== "entrada" ? r.base : "trabalhador", desc: r.desc || "", rounds: r.rounds || 3 });
function loadRoles(): Role[] { try { const s = window.localStorage.getItem(ROLE_KEY); if (s) { const p = JSON.parse(s) as Role[]; if (Array.isArray(p)) return p.filter((r: Role) => r && r.id && r.name).map(cleanRole); } } catch (_e) { /* ignore */ } return []; }
const FULL = ":root,html,body{margin:0!important;padding:0!important;width:100%;max-width:none!important;height:100%;background:#f9fafb!important;color-scheme:only light!important;color:#1f2937}.kf,.kf *{color-scheme:only light!important}.kf select,.kf textarea,.kf input{background-color:#fff;color:#1f2937}.kf ::-webkit-scrollbar{width:8px;height:8px;background:transparent}.kf ::-webkit-scrollbar-thumb{background:#d1d5db;border-radius:4px}body>div,#root{width:100%;max-width:none!important}";

const EXAMPLE: Graph = {
  objective: "Escrever um artigo curto e revisado sobre o tema colado na entrada.",
  nodes: [
    { id: "e1", kind: "entrada", name: "Tema", x: 40, y: 160, instr: "Tema e público-alvo do artigo, colados na hora.", format: "Texto livre", rounds: 3 },
    { id: "w1", kind: "trabalhador", name: "Escritor", x: 330, y: 160, instr: "Escreva um artigo de 600 palavras sobre o tema recebido, com título, introdução, três seções e conclusão. Se receber críticas do Revisor, reescreva corrigindo cada ponto.", format: "Markdown", rounds: 3 },
    { id: "s1", kind: "supervisor", name: "Revisor", x: 620, y: 160, instr: "Leia o artigo sem saber como foi produzido. Avalie clareza, precisão e aderência ao tema. Se houver problemas, liste-os e devolva ao Escritor; se estiver bom, aprove.", format: "APROVADO ou lista de correções", rounds: 3 },
    { id: "d1", kind: "entrega", name: "Artigo final", x: 910, y: 160, instr: "Consolide a versão aprovada em um único artigo pronto para publicar.", format: "Markdown", rounds: 3 },
  ],
  edges: [
    { id: "a", from: "e1", to: "w1" }, { id: "b", from: "w1", to: "s1" },
    { id: "c", from: "s1", to: "w1" }, { id: "d", from: "s1", to: "d1" },
  ],
};

const MAPA = "https://cursor.com/canvas/store-c0d9cc6f-0595-49c6-a255-501b3cd9cca0/ada1da62-8f7a-4627-aacd-0441b8603368";

const tfSave = (k: string, v: string): void => { const w = window as any; if (w.localStorage.getItem(k) === v) return; if (typeof w.safeSetItem === "function") w.safeSetItem(k, v); else w.localStorage.setItem(k, v); };

function norm(g: Partial<Graph>): Graph {
  return {
    objective: g.objective || "",
    nodes: Array.isArray(g.nodes) ? g.nodes.map((n: GNode) => ({ ...n, kind: (KINDS.indexOf(n.kind) >= 0 ? n.kind : "trabalhador") as Kind, rounds: n.rounds || 3, instr: n.instr || "", format: n.format || "", name: n.name || "Peça" })) : [],
    edges: Array.isArray(g.edges) ? g.edges : [],
    lanes: (g.lanes || []).map((l: Lane, i: number) => ({ ...l, id: l.id || `lane${i}_${uid()}` })),
    notes: Array.isArray(g.notes) ? g.notes : [],
  };
}
const blank = (): Graph => ({ objective: "", nodes: [], edges: [], lanes: [], notes: [] });

function loadStore(): Store {
  try {
    const s = window.localStorage.getItem(KEY);
    if (s) { const p = JSON.parse(s) as Store; if (p && Array.isArray(p.tabs) && p.tabs.length) { const tabs = p.tabs.map((t: Tab) => ({ ...t, graph: norm(t.graph) })); return ({ tabs, active: tabs.some((t: Tab) => t.id === p.active) ? p.active : tabs[0].id }); } }
  } catch (_e) { /* ignore */ }
  const a = uid();
  return { tabs: [{ id: a, name: "Exemplo", graph: norm(clone(EXAMPLE)) }], active: a };
}

function orderBFS(g: Graph): GNode[] {
  const seen = new Set<string>(); const out: GNode[] = [];
  const starts = g.nodes.filter((n: GNode) => n.kind === "entrada" || !g.edges.some((e: GEdge) => e.to === n.id));
  const queue: GNode[] = starts.length ? [...starts] : g.nodes.slice(0, 1);
  while (out.length < g.nodes.length) {
    if (!queue.length) { const rest = g.nodes.find((n: GNode) => !seen.has(n.id)); if (!rest) break; queue.push(rest); }
    const n = queue.shift() as GNode; if (seen.has(n.id)) continue; seen.add(n.id); out.push(n);
    g.edges.filter((e: GEdge) => e.from === n.id).forEach((e: GEdge) => { const t = g.nodes.find((m: GNode) => m.id === e.to); if (t && !seen.has(t.id)) queue.push(t); });
  }
  return out;
}
function order(g: Graph): GNode[] {
  if (g.lanes && g.lanes.length) return [...g.nodes].sort((a: GNode, b: GNode) => a.x - b.x || a.y - b.y);
  return orderBFS(g);
}

function arrange(g: Graph): Graph {
  const ord = orderBFS(g); const pos: Record<string, number> = {}; ord.forEach((n: GNode, i: number) => { pos[n.id] = i; });
  const rank: Record<string, number> = {}; ord.forEach((n: GNode) => { rank[n.id] = 0; });
  ord.forEach((n: GNode) => { g.edges.forEach((e: GEdge) => { if (e.from === n.id && pos[e.to] > pos[n.id]) rank[e.to] = Math.max(rank[e.to], rank[n.id] + 1); }); });
  const cols: Record<number, string[]> = {}; ord.forEach((n: GNode) => { const r = rank[n.id]; (cols[r] = cols[r] || []).push(n.id); });
  const maxN = Math.max(1, ...Object.values(cols).map((c: string[]) => c.length));
  const at: Record<string, { x: number; y: number }> = {};
  Object.keys(cols).forEach((r: string) => { const c = cols[Number(r)]; const top = 80 + ((maxN - c.length) * 120) / 2; c.forEach((id: string, i: number) => { at[id] = { x: 40 + Number(r) * 320, y: top + i * 120 }; }); });
  return { ...g, lanes: [], nodes: g.nodes.map((n: GNode) => ({ ...n, ...(at[n.id] || {}) })) };
}

function steps(g: Graph): { lines: string[]; loops: string[] } {
  const ord = order(g); const pos: Record<string, number> = {}; ord.forEach((n: GNode, i: number) => { pos[n.id] = i; });
  const nm = (id: string): string => { const n = g.nodes.find((m: GNode) => m.id === id); return n ? `${n.name} (${kindLabel(n)})` : id; };
  const L: string[] = [];
  ord.forEach((n: GNode, i: number) => {
    const ins = g.edges.filter((e: GEdge) => e.to === n.id).map((e: GEdge) => nm(e.from));
    const outs = g.edges.filter((e: GEdge) => e.from === n.id);
    L.push("", `### ${i + 1}. ${n.name} — ${kindLabel(n)}`);
    L.push(`Função: ${roleOf(n)?.desc ? `${roleOf(n)?.desc} — ` : ""}${ROLE_TXT[n.kind]}${n.kind === "supervisor" ? ` Máximo de ${n.rounds} rodadas.` : ""}`);
    if (n.role && n.role.trim()) L.push(`Papel: ${n.role.trim()}`);
    if (n.decision) L.push(`**${n.decision}** (pergunte ao Diego antes de concluir esta etapa)`);
    if (n.instr.trim()) L.push(`Instruções: ${n.instr.trim()}`);
    if (n.format.trim()) L.push(`Formato de saída: ${n.format.trim()}`);
    if (n.tools && n.tools.trim()) L.push(`Ferramentas/fontes: ${n.tools.trim()}`);
    if (ins.length) L.push(`Recebe de: ${ins.join(", ")}`);
    if (n.kind === "supervisor") {
      const back = outs.filter((e: GEdge) => (pos[e.to] ?? 0) <= i).map((e: GEdge) => nm(e.to));
      const fwd = outs.filter((e: GEdge) => (pos[e.to] ?? 0) > i).map((e: GEdge) => nm(e.to));
      if (back.length) L.push(`Se reprovar: devolva a crítica para ${back.join(", ")}, que refaz e reenvia (loop, até ${n.rounds} rodadas; na última, aprove a melhor versão).`);
      if (fwd.length) L.push(`Se aprovar: entregue para ${fwd.join(", ")}.`);
    } else if (outs.length) L.push(`Entrega para: ${outs.map((e: GEdge) => nm(e.to)).join(", ")}`);
  });
  const loops = g.nodes.filter((n: GNode) => n.kind === "supervisor").flatMap((s: GNode) => g.edges.filter((e: GEdge) => e.from === s.id && (pos[e.to] ?? 0) <= (pos[s.id] ?? 0)).map((e: GEdge) => `- ${nm(e.to)} ⇄ ${s.name} (até ${s.rounds} rodadas)`));
  return { lines: L, loops };
}
const notesMd = (g: Graph): string[] => { const n = (g.notes || []).map((x: Note) => x.text.trim()).filter((x: string) => x.length > 0); return n.length ? ["", "## Notas do quadro", ...n.map((x: string) => `- ${x.replace(/\n/g, " ")}`)] : []; };

function buildPrompt(name: string, g: Graph): string {
  const s = steps(g); const L: string[] = [];
  L.push(`# Pipeline multiagente — ${name}`, "", "## Objetivo", g.objective || "(sem objetivo definido)", "");
  L.push("## Como executar", "Você vai simular uma equipe de agentes. Execute cada etapa abaixo na ordem, assumindo o papel indicado. Cada agente só vê o que recebe das etapas anteriores. Supervisores são críticos cegos: julgam apenas o resultado que chegou, sem saber como foi feito, e podem devolver o trabalho para ser refeito até o limite de rodadas. Mostre a saída de cada etapa com um cabeçalho com o nome do agente.", "");
  L.push("## Etapas", ...s.lines);
  if (s.loops.length) L.push("", "## Loops de revisão", ...s.loops);
  L.push(...rolesMd(g), ...notesMd(g));
  L.push("", "## Resultado", "Ao final, apresente o artefato da(s) etapa(s) de Entrega e um resumo curto de quantas rodadas cada loop usou.");
  return L.join("\n");
}

function buildBriefing(name: string, g: Graph): string {
  const s = steps(g); const dir = g.nodes.find((n: GNode) => n.kind === "diretor");
  const team = order(g).filter((n: GNode) => n.kind !== "entrada");
  const entrada = g.nodes.find((n: GNode) => n.kind === "entrada");
  const decisions = g.nodes.filter((n: GNode) => n.decision);
  const cell = (x: string): string => x.replace(/\|/g, "/").replace(/\n/g, " ");
  const L: string[] = [];
  L.push(`# Briefing do Diretor — ${name}`, "");
  L.push(`Você é ${dir ? `${dir.name}, o Diretor` : "o Diretor"} deste fluxo. Sua função é executar o fluxograma abaixo do início ao fim, coordenando a equipe, e entregar o resultado ao Diego.`);
  if (dir && dir.instr.trim()) L.push("", `Orientações para você: ${dir.instr.trim()}`);
  L.push("", "## Objetivo", g.objective || "(sem objetivo definido — pergunte ao Diego antes de começar)");
  L.push("", "## Como você executa",
    "1. Você é o único agente permanente. Os outros papéis do fluxo não precisam existir como agentes separados: em cada etapa, faça você mesmo assumindo o papel, ou delegue a um subagente temporário passando o briefing daquela etapa (nome, papel, instruções, formato, ferramentas) e recolha o resultado.",
    "2. Siga a ordem das etapas. Passe a cada etapa só o que ela recebe das anteriores.",
    "3. Supervisores são críticos cegos: entregue a eles só o resultado, nunca o histórico. Se reprovarem, devolva a crítica ao responsável e repita até o limite de rodadas.",
    "4. Itens marcados ⚠ DECISÃO DO DIEGO: pare e pergunte ao Diego antes de seguir. Não decida por ele.",
    "5. Ações externas (enviar mensagens, publicar, comprar, apagar algo) só com aprovação explícita do Diego.",
    "6. Mantenha um registro curto do andamento: etapa atual, rodadas usadas, pendências.",
    "7. Ao final, entregue o artefato da Entrega e um relatório: etapas feitas, rodadas por loop, decisões tomadas e o que ficou pendente.");
  if (entrada) L.push("", "## Entrada", `${entrada.name}: ${entrada.instr.trim() || "peça ao Diego o material de entrada."}`);
  if (team.length) {
    L.push("", "## Equipe", "| # | Agente | Tipo | Papel | Ferramentas/fontes |", "|---|---|---|---|---|");
    team.forEach((n: GNode, i: number) => L.push(`| ${i + 1} | ${cell(n.name)} | ${cell(kindLabel(n))} | ${cell(n.role || roleOf(n)?.desc || ROLE_TXT[n.kind])} | ${cell(n.tools || "—")} |`));
  }
  L.push("", "## Etapas", ...s.lines);
  if (s.loops.length) L.push("", "## Loops de revisão", ...s.loops);
  if (decisions.length) L.push("", "## Decisões da gestão", ...decisions.map((n: GNode) => `- ${n.name}: ${n.decision}`));
  L.push(...rolesMd(g), ...notesMd(g));
  L.push("", "## Checklist do Diretor", "- [ ] Objetivo e entrada confirmados com o Diego", ...order(g).filter((n: GNode) => n.kind !== "entrada").map((n: GNode) => `- [ ] ${n.name}`), "- [ ] Relatório final entregue ao Diego");
  return L.join("\n");
}

const FONT = '-apple-system,"SF Pro Display","SF Pro Text",system-ui,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';
const GSHADOW = "0 4px 18px rgba(0,0,0,.08)";
const SEC = "#6b7280"; const TER = "#9ca3af";
const CSS = `.kf input::placeholder,.kf textarea::placeholder{color:#9ca3af}.kf input:focus,.kf textarea:focus,.kf select:focus{border-color:#185FA5!important;box-shadow:0 0 0 3px rgba(24,95,165,.15)}.kf button{transition:background .12s,filter .12s}.kf button:hover:not(:disabled){filter:brightness(.95)}.kf button:disabled{opacity:.4;cursor:default}.kf option{background:#fff;color:#1f2937}.kf .it:hover:not(:disabled){background:#e8f0fe!important;color:#0d3d6b!important;filter:none}.kf kbd{margin-left:auto;font:11px system-ui;opacity:.6;background:none;border:0;color:inherit}`;
const btn: CSSProperties = { font: "inherit", fontSize: "12.5px", fontWeight: 600, padding: "7px 13px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff", backgroundImage: "linear-gradient(#fff,#fff)", color: "#1f2937", cursor: "pointer", boxShadow: "0 1px 2px rgba(17,24,39,.05)" };
const btnPrimary: CSSProperties = { ...btn, fontSize: "13px", padding: "8px 16px", background: "#185FA5", border: "1px solid #185FA5", color: "#fff", boxShadow: "0 1px 2px rgba(24,95,165,.3)" };
const btnDanger: CSSProperties = { ...btn, background: "#fff", backgroundImage: "linear-gradient(#fff,#fff)", border: "1px solid #fecaca", color: "#dc2626" };
const field: CSSProperties = { font: "inherit", fontSize: "13px", fontWeight: 500, width: "100%", boxSizing: "border-box", padding: "8px 11px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff", backgroundImage: "linear-gradient(#fff,#fff)", color: "#1f2937", outline: "none", transition: "box-shadow .15s, border-color .15s" };
const lab: CSSProperties = { fontSize: "11px", fontWeight: 600, color: TER, textTransform: "uppercase", letterSpacing: "0.06em", margin: "14px 0 6px" };
const panel: CSSProperties = { background: "#fff", backgroundImage: "linear-gradient(#fff,#fff)", border: "1px solid #e5e7eb", boxShadow: GSHADOW, borderRadius: 14, padding: 16, color: "#1f2937", colorScheme: "light" };
const pill: CSSProperties = { position: "absolute", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 4, padding: 6, borderRadius: 14, background: "#fff", backgroundImage: "linear-gradient(#fff,#fff)", border: "1px solid #e5e7eb", boxShadow: GSHADOW };
const isTyping = (el: EventTarget | null): boolean => { const t = el as HTMLElement | null; return !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable); };

function App() {
  const [S, setS] = useState<Store>(loadStore);
  const SRef = useRef<Store>(S); SRef.current = S;
  const hist = useRef<{ past: Store[]; future: Store[]; last: number; tag: string }>({ past: [], future: [], last: 0, tag: "" });
  const [sel, setSel] = useState<Sel>(null);
  const [view, setView] = useState({ x: 20, y: 20, k: 0.6 });
  const [wire, setWire] = useState<{ from: string; x: number; y: number } | null>(null);
  const [modal, setModal] = useState<{ title: string; text: string; file: string } | null>(null);
  const [ask, setAsk] = useState<{ msg: string; label: string; ok: () => void } | null>(null);
  const [copied, setCopied] = useState(false);
  const [q, setQ] = useState("");
  const [editTab, setEditTab] = useState<string | null>(null);
  const [menuTab, setMenuTab] = useState<string | null>(null);
  const [editLane, setEditLane] = useState<string | null>(null);
  const drag = useRef<Drag | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const viewRef = useRef(view); viewRef.current = view;

  const tab = S.tabs.find((x: Tab) => x.id === S.active) || S.tabs[0];
  const g = tab.graph;
  const gRef = useRef<Graph>(g); gRef.current = g;

  const push = (tag: string) => {
    const h = hist.current; const now = Date.now();
    if (tag && tag === h.tag && now - h.last < 900) { h.last = now; return; }
    h.past.push(SRef.current); if (h.past.length > 120) h.past.shift(); h.future = []; h.last = now; h.tag = tag;
  };
  const change = (fn: (s: Store) => Store, tag: string = "") => { push(tag); setS((s: Store) => fn(s)); };
  const onGraph = (fn: (gr: Graph) => Graph) => (s: Store): Store => ({ ...s, tabs: s.tabs.map((t: Tab) => (t.id === s.active ? { ...t, graph: fn(t.graph) } : t)) });
  const setGraph = (fn: (gr: Graph) => Graph, tag: string = "") => change(onGraph(fn), tag);
  const setGraphQuiet = (fn: (gr: Graph) => Graph) => setS(onGraph(fn));
  const undo = () => { const h = hist.current; const p = h.past.pop(); if (!p) return; h.future.push(SRef.current); h.tag = ""; setS(p); setSel(null); };
  const redo = () => { const h = hist.current; const n = h.future.pop(); if (!n) return; h.past.push(SRef.current); h.tag = ""; setS(n); setSel(null); };

  useEffect(() => { try { tfSave(KEY, JSON.stringify(S)); } catch (_e) { /* ignore */ } }, [S]);

  const fit = (gr: Graph) => {
    const el = box.current; if (!el) return; const r = el.getBoundingClientRect();
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    gr.nodes.forEach((n: GNode) => { x0 = Math.min(x0, n.x - 20); y0 = Math.min(y0, n.y - (n.decision ? 60 : 20)); x1 = Math.max(x1, n.x + W + 20); y1 = Math.max(y1, n.y + H + 130); });
    (gr.lanes || []).forEach((l: Lane) => { x0 = Math.min(x0, l.x - 30); y0 = Math.min(y0, l.y - 10); x1 = Math.max(x1, l.x - 16 + (l.w || W + 32) + 10); y1 = Math.max(y1, l.y + l.h + 10); });
    (gr.notes || []).forEach((n: Note) => { x0 = Math.min(x0, n.x - 10); y0 = Math.min(y0, n.y - 10); x1 = Math.max(x1, n.x + n.w + 10); y1 = Math.max(y1, n.y + n.h + 10); });
    if (!isFinite(x0)) { setView({ x: 20, y: 20, k: 1 }); return; }
    const padTop = 70; const padBot = 80; const availH = r.height - padTop - padBot;
    const k = Math.max(0.2, Math.min(1, (r.width - 24) / (x1 - x0), availH / (y1 - y0)));
    setView({ k, x: (r.width - (x1 - x0) * k) / 2 - x0 * k, y: padTop + (availH - (y1 - y0) * k) / 2 - y0 * k });
  };
  useEffect(() => { const id = setTimeout(() => fit(gRef.current), 40); return () => clearTimeout(id); }, [tab.id]);

  const toWorld = useCallback((cx: number, cy: number) => {
    const r = box.current ? box.current.getBoundingClientRect() : { left: 0, top: 0 };
    const v = viewRef.current; return { x: (cx - r.left - v.x) / v.k, y: (cy - r.top - v.y) / v.k };
  }, []);

  useEffect(() => {
    const el = box.current; if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const tg = e.target as HTMLElement | null; if (tg && tg.closest && tg.closest("[data-panel],[data-pop],textarea")) return;
      e.preventDefault(); const r = el.getBoundingClientRect(); const mx = e.clientX - r.left; const my = e.clientY - r.top;
      setView((v) => { const k = Math.min(2.2, Math.max(0.2, v.k * (e.deltaY < 0 ? 1.1 : 0.9))); return { k, x: mx - ((mx - v.x) * k) / v.k, y: my - ((my - v.y) * k) / v.k }; });
    };
    el.addEventListener("wheel", onWheel, { passive: false }); return () => el.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    const move = (e: globalThis.PointerEvent) => {
      const d = drag.current;
      if (d) {
        if (d.mode === "pan") setView((v) => ({ ...v, x: d.ox + e.clientX - d.sx, y: d.oy + e.clientY - d.sy }));
        else {
          const k = viewRef.current.k; const dx = (e.clientX - d.sx) / k; const dy = (e.clientY - d.sy) / k;
          if (d.mode === "node") setGraphQuiet((p: Graph) => ({ ...p, nodes: p.nodes.map((n: GNode) => (n.id === d.id ? { ...n, x: d.ox + dx, y: d.oy + dy } : n)) }));
          if (d.mode === "note") setGraphQuiet((p: Graph) => ({ ...p, notes: (p.notes || []).map((n: Note) => (n.id === d.id ? { ...n, x: d.ox + dx, y: d.oy + dy } : n)) }));
          if (d.mode === "lane") setGraphQuiet((p: Graph) => ({ ...p, lanes: (p.lanes || []).map((l: Lane) => (l.id === d.id ? { ...l, x: d.ox + dx, y: d.oy + dy } : l)), nodes: p.nodes.map((n: GNode) => { const c = (d.carry || []).find((m: { id: string; x: number; y: number }) => m.id === n.id); return c ? { ...n, x: c.x + dx, y: c.y + dy } : n; }) }));
        }
      }
      setWire((w) => { if (!w) return w; const p = toWorld(e.clientX, e.clientY); return { ...w, x: p.x, y: p.y }; });
    };
    const up = () => { drag.current = null; setWire(null); };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, [toWorld]);

  const center = () => { const r = box.current ? box.current.getBoundingClientRect() : { width: 600, height: 400 }; const v = viewRef.current; return { x: (r.width / 2 - v.x) / v.k, y: (r.height / 2 - v.y) / v.k }; };
  const hasEntrada = g.nodes.some((n: GNode) => n.kind === "entrada");
  const addNode = (kind: Kind, r?: Role) => {
    if (kind === "entrada" && hasEntrada) return;
    const c = center(); const count = g.nodes.filter((n: GNode) => n.kind === kind).length + 1;
    const n: GNode = { id: uid(), kind, rid: r ? r.id : undefined, name: r ? `${r.name} ${g.nodes.filter((m: GNode) => m.rid === r.id).length + 1}` : `${LABEL[kind]} ${count}`, x: c.x - W / 2 + (Math.random() * 40 - 20), y: c.y - H / 2 + (Math.random() * 40 - 20), instr: "", format: "", rounds: r && r.base === "supervisor" ? r.rounds : 3, role: "", tools: "" };
    setGraph((p: Graph) => ({ ...p, nodes: [...p.nodes, n] })); setSel({ t: "node", id: n.id });
  };
  const addNote = () => { const c = center(); const n: Note = { id: uid(), x: c.x - 110, y: c.y - 70, w: 220, h: 140, text: "" }; setGraph((p: Graph) => ({ ...p, notes: [...(p.notes || []), n] })); setSel({ t: "note", id: n.id }); };
  const addLane = () => { const c = center(); const l: Lane = { id: uid(), x: c.x - W / 2, y: c.y - 250, h: 500, label: `Grupo ${(g.lanes || []).length + 1}` }; setGraph((p: Graph) => ({ ...p, lanes: [...(p.lanes || []), l] })); setSel({ t: "lane", id: l.id as string }); };
  const removeSel = (s: Sel) => {
    if (!s) return;
    if (s.t === "node") setGraph((p: Graph) => ({ ...p, nodes: p.nodes.filter((n: GNode) => n.id !== s.id), edges: p.edges.filter((e: GEdge) => e.from !== s.id && e.to !== s.id) }));
    if (s.t === "note") setGraph((p: Graph) => ({ ...p, notes: (p.notes || []).filter((n: Note) => n.id !== s.id) }));
    if (s.t === "lane") setGraph((p: Graph) => ({ ...p, lanes: (p.lanes || []).filter((l: Lane) => l.id !== s.id) }));
    setSel(null);
  };
  const dupNode = (id: string) => {
    const o = g.nodes.find((n: GNode) => n.id === id); if (!o || o.kind === "entrada") return;
    const n: GNode = { ...o, id: uid(), name: `${o.name} (cópia)`, x: o.x + 30, y: o.y + 30 };
    setGraph((p: Graph) => ({ ...p, nodes: [...p.nodes, n] })); setSel({ t: "node", id: n.id });
  };
  const upd = (id: string, patch: Partial<GNode>, tag: string) => setGraph((p: Graph) => ({ ...p, nodes: p.nodes.map((n: GNode) => (n.id === id ? { ...n, ...patch } : n)) }), tag);
  const updLane = (id: string, patch: Partial<Lane>, tag: string) => setGraph((p: Graph) => ({ ...p, lanes: (p.lanes || []).map((l: Lane) => (l.id === id ? { ...l, ...patch } : l)) }), tag);
  const updNote = (id: string, patch: Partial<Note>, tag: string) => setGraph((p: Graph) => ({ ...p, notes: (p.notes || []).map((n: Note) => (n.id === id ? { ...n, ...patch } : n)) }), tag);
  const cutEdge = (id: string) => setGraph((p: Graph) => ({ ...p, edges: p.edges.filter((x: GEdge) => x.id !== id) }));

  const connect = (to: string) => {
    if (!wire || wire.from === to) return; const from = wire.from;
    const tn = g.nodes.find((n: GNode) => n.id === to); if (tn && tn.kind === "entrada") return;
    if (g.edges.some((e: GEdge) => e.from === from && e.to === to)) return;
    setGraph((p: Graph) => ({ ...p, edges: [...p.edges, { id: uid(), from, to }] }));
  };

  // Tabs
  const switchTab = (id: string) => { setS((s: Store) => ({ ...s, active: id })); setSel(null); setMenuTab(null); setQ(""); };
  const newTab = () => { const id = uid(); change((s: Store) => ({ tabs: [...s.tabs, { id, name: `Fluxograma ${s.tabs.length + 1}`, graph: blank() }], active: id })); setSel(null); setEditTab(id); };
  const renameTab = (id: string, name: string) => change((s: Store) => ({ ...s, tabs: s.tabs.map((t: Tab) => (t.id === id ? { ...t, name } : t)) }), "tabname" + id);
  const dupTab = (id: string) => { const nid = uid(); change((s: Store) => { const i = s.tabs.findIndex((t: Tab) => t.id === id); const o = s.tabs[i]; const tabs = [...s.tabs]; tabs.splice(i + 1, 0, { id: nid, name: `${o.name} (cópia)`, graph: clone(o.graph) }); return { tabs, active: nid }; }); setMenuTab(null); };
  const moveTab = (id: string, dir: number) => change((s: Store) => { const i = s.tabs.findIndex((t: Tab) => t.id === id); const j = i + dir; if (j < 0 || j >= s.tabs.length) return s; const tabs = [...s.tabs]; const [x] = tabs.splice(i, 1); tabs.splice(j, 0, x); return { ...s, tabs }; });
  const delTab = (id: string) => { const t = S.tabs.find((x: Tab) => x.id === id); setMenuTab(null); setAsk({ msg: `Excluir o fluxograma “${t ? t.name : ""}”? Você pode desfazer com Ctrl+Z.`, label: "Excluir", ok: () => { change((s: Store) => { const i = s.tabs.findIndex((x: Tab) => x.id === id); let tabs = s.tabs.filter((x: Tab) => x.id !== id); if (!tabs.length) tabs = [{ id: uid(), name: "Fluxograma 1", graph: blank() }]; const active = s.active === id ? tabs[Math.max(0, i - 1)].id : s.active; return { tabs, active }; }); setSel(null); } }); };

  useEffect(() => {
    const key = (e: globalThis.KeyboardEvent) => {
      { const r = rootRef.current; if (!r || !r.isConnected || r.offsetParent === null) return; const ae = document.activeElement as HTMLElement | null; if (ae && ae !== document.body && !r.contains(ae)) return; }
      if (e.key === "Escape") { setPop(null); setConnFrom(null); setMenuTab(null); setAsk(null); setModal(null); setEditLane(null); setEditTab(null); return; }
      if (isTyping(e.target)) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && (e.key === "z" || e.key === "Z")) { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
      if (mod && (e.key === "y" || e.key === "Y")) { e.preventDefault(); redo(); return; }
      if (!mod && !e.altKey) { const i = "123456".indexOf(e.key); if (i >= 0) { e.preventDefault(); addAny(KINDS[i]); return; } if (e.key === "g" || e.key === "G") { e.preventDefault(); addAny("grupo"); return; } if (e.key === "n" || e.key === "N") { e.preventDefault(); addAny("nota"); return; } }
      if (!sel) return;
      if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); removeSel(sel); }
      if (mod && (e.key === "d" || e.key === "D") && sel.t === "node") { e.preventDefault(); dupNode(sel.id); }
    };
    window.addEventListener("keydown", key); return () => window.removeEventListener("keydown", key);
  });

  const warnings = useMemo(() => {
    const w: string[] = [];
    if (!g.objective.trim()) w.push("O fluxograma não tem objetivo.");
    if (!g.nodes.length) w.push("O fluxograma não tem peças.");
    g.nodes.forEach((n: GNode) => {
      const ins = g.edges.some((e: GEdge) => e.to === n.id); const outs = g.edges.some((e: GEdge) => e.from === n.id);
      if (n.kind !== "entrada" && !n.instr.trim()) w.push(`“${n.name}” está sem instruções.`);
      if (!ins && !outs) w.push(`“${n.name}” não está conectado a nada.`);
      else if (!outs && n.kind !== "entrega") w.push(`“${n.name}” não entrega para ninguém.`);
      if (n.kind === "entrega" && !ins) w.push(`“${n.name}” não recebe nada.`);
    });
    return w;
  }, [g]);

  const ql = q.trim().toLowerCase();
  const matches = useMemo(() => (ql ? g.nodes.filter((n: GNode) => [n.name, n.role || "", n.instr, n.tools || ""].join(" ").toLowerCase().includes(ql)) : []), [g, ql]);
  const matchSet = new Set<string>(matches.map((n: GNode) => n.id));
  const goTo = (n: GNode) => { const el = box.current; if (!el) return; const r = el.getBoundingClientRect(); setView((v) => { const k = Math.max(v.k, 0.8); return { k, x: r.width / 2 - (n.x + W / 2) * k, y: r.height / 2 - (n.y + H / 2) * k }; }); setSel({ t: "node", id: n.id }); };

  const download = (name: string, text: string, type: string) => {
    const url = URL.createObjectURL(new Blob([text], { type })); const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const slug = (s: string): string => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "fluxograma";
  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0]; if (!f) return; const base = f.name.replace(/\.json$/i, "");
    f.text().then((s: string) => {
      try {
        const p = JSON.parse(s) as Partial<Store> & Partial<Graph> & { name?: string; graph?: Graph };
        let add: Tab[] = [];
        const pr = (p as { roles?: Role[] }).roles; if (Array.isArray(pr)) mergeRoles(pr);
        if (Array.isArray(p.tabs)) add = p.tabs.map((t: Tab) => ({ id: uid(), name: t.name || base, graph: norm(t.graph || {}) }));
        else if (p.graph && Array.isArray(p.graph.nodes)) add = [{ id: uid(), name: p.name || base, graph: norm(p.graph) }];
        else if (Array.isArray(p.nodes)) add = [{ id: uid(), name: base, graph: norm(p) }];
        if (add.length) { change((st: Store) => ({ tabs: [...st.tabs, ...add], active: add[0].id })); setSel(null); }
      } catch (_e) { /* ignore */ }
    });
    e.target.value = "";
  };
  const copy = () => { if (!modal) return; try { navigator.clipboard.writeText(modal.text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }, () => undefined); } catch (_e) { /* ignore */ } };

  const selNode = sel && sel.t === "node" ? g.nodes.find((n: GNode) => n.id === sel.id) || null : null;
  const selLane = sel && sel.t === "lane" ? (g.lanes || []).find((l: Lane) => l.id === sel.id) || null : null;
  const selNote = sel && sel.t === "note" ? (g.notes || []).find((n: Note) => n.id === sel.id) || null : null;
  const nodeById = (id: string) => g.nodes.find((n: GNode) => n.id === id);
  const curve = (x1: number, y1: number, x2: number, y2: number) => { const dx = Math.max(60, Math.abs(x2 - x1) / 2); return `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`; };
  const stripeOf = (n: GNode): string => n.color || roleOf(n)?.color || STRIPE[n.kind];
  const h = hist.current;
  const stop = (e: PointerEvent<HTMLElement>) => e.stopPropagation();

  const [pop, setPop] = useState<string | null>(null);
  const [hov, setHov] = useState<string | null>(null);
  const [pin, setPin] = useState<string | null>(null);
  const hlK: string | null = pop === "roles" ? hov || pin : null;
  const keyOf = (n: GNode): string => (n.rid && ROLES.some((r: Role) => r.id === n.rid) ? "r:" + n.rid : n.kind);
  const rowSt = (k: string): CSSProperties => ({ display: "flex", alignItems: "center", gap: 10, padding: "6px 8px", borderRadius: 9, cursor: "pointer", background: pin === k ? "#e8f0fe" : hov === k ? "#f3f4f6" : "transparent", outline: pin === k ? "1px solid #185FA5" : "none" });
  const rowEv = (k: string) => ({ onMouseEnter: () => setHov(k), onMouseLeave: () => setHov(null), onClick: () => setPin((p: string | null) => (p === k ? null : k)) });
  const [objEdit, setObjEdit] = useState(false);
  const [moreOpts, setMoreOpts] = useState(false);
  const [hidden, setHidden] = useState<string[]>([]);
  const [roles, setRoles] = useState<Role[]>(loadRoles); ROLES = roles;
  useEffect(() => { try { tfSave(ROLE_KEY, JSON.stringify(roles)); } catch (_e) { /* ignore */ } }, [roles]);
  const [roleDlg, setRoleDlg] = useState<Role | null>(null);
  const mergeRoles = (pr: Role[]) => setRoles((p: Role[]) => { const ids = new Set<string>(p.map((r: Role) => r.id)); const add = pr.filter((r: Role) => r && r.id && r.name && !ids.has(r.id)).map(cleanRole); return add.length ? [...p, ...add] : p; });
  const saveRole = () => { if (!roleDlg || !roleDlg.name.trim()) return; const r = cleanRole({ ...roleDlg, name: roleDlg.name.trim() }); const old = roles.find((x: Role) => x.id === r.id); setRoles((p: Role[]) => (p.some((x: Role) => x.id === r.id) ? p.map((x: Role) => (x.id === r.id ? r : x)) : [...p, r])); if (old && old.base !== r.base) change((s: Store) => ({ ...s, tabs: s.tabs.map((t: Tab) => ({ ...t, graph: { ...t.graph, nodes: t.graph.nodes.map((n: GNode) => (n.rid === r.id ? { ...n, kind: r.base } : n)) } })) })); setRoleDlg(null); };
  const delRole = (r: Role) => { setPop(null); setAsk({ msg: `Excluir o papel “${r.name}”? As peças desse papel continuam no quadro e passam a usar o tipo base (${LABEL[r.base]}).`, label: "Excluir", ok: () => setRoles((p: Role[]) => p.filter((x: Role) => x.id !== r.id)) }); };
  const [narrow, setNarrow] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const focusName = useRef(false);
  const [rootH, setRootH] = useState<number>(600);
  useEffect(() => { const el = rootRef.current; if (!el) return; const upd0 = () => { setNarrow(el.clientWidth < 640); setRootH(el.clientHeight || 600); }; upd0(); if (typeof ResizeObserver === "undefined") { window.addEventListener("resize", upd0); return () => window.removeEventListener("resize", upd0); } const ro = new ResizeObserver(upd0); ro.observe(el); return () => ro.disconnect(); }, []);
  useEffect(() => { if (focusName.current && nameRef.current) { focusName.current = false; nameRef.current.focus(); nameRef.current.select(); } });
  const addAny = (k: string) => { setPop(null); if (k === "grupo") addLane(); else if (k === "nota") addNote(); else if (k.indexOf("r:") === 0) { const r = roles.find((x: Role) => x.id === k.slice(2)); if (r) { focusName.current = true; setMoreOpts(false); addNode(r.base, r); } } else { const kk = k as Kind; if (kk === "entrada" && hasEntrada) return; focusName.current = true; setMoreOpts(false); addNode(kk); } };
  const toggleKind = (k: string) => setHidden((p: string[]) => (p.indexOf(k) >= 0 ? p.filter((x: string) => x !== k) : [...p, k]));
  const togglePop = (p: string) => setPop((c: string | null) => (c === p ? null : p));
  const ICON: Record<string, string> = { entrada: "📥", diretor: "🎯", pesquisador: "🔎", trabalhador: "✍️", supervisor: "🧐", entrega: "🚀", grupo: "▭", nota: "✎" };
  const iconBtn: CSSProperties = { ...btn, padding: "6px 10px", minWidth: 32, fontSize: "13px" };
  const primSm: CSSProperties = { ...btnPrimary, fontSize: "12.5px", padding: "7px 14px", boxShadow: "inset 0 1px 0 rgba(255,255,255,.55), 0 6px 16px rgba(24,95,165,.45)" };
  const menuItem: CSSProperties = { ...btn, background: "transparent", border: "none", boxShadow: "none", textAlign: "left", borderRadius: 9, padding: "7px 8px", fontSize: "13.5px", fontWeight: 500, color: "#1f2937", width: "100%", display: "flex", alignItems: "center", gap: 10 };
  const popBox: CSSProperties = { ...panel, position: "absolute", top: "calc(100% + 8px)", right: 0, padding: 10, borderRadius: 14, zIndex: 40, minWidth: 250, background: "#fff", backgroundImage: "linear-gradient(#fff,#fff)", display: "flex", flexDirection: "column", gap: 2 };
  const sep = <div style={{ height: 1, background: "#eef0f3", margin: "5px 6px" }} />;
  const isHidden = (n: GNode | undefined): boolean => !!n && hidden.indexOf(roleOf(n) ? "r:" + n.rid : n.kind) >= 0;
  const newFrom = (name: string, gr: Graph) => { const id = uid(); change((s: Store) => ({ tabs: [...s.tabs, { id, name, graph: norm(clone(gr)) }], active: id })); setSel(null); setPop(null); };

  const [tool, setTool] = useState<"select" | "pan" | "connect">("select");
  const [connFrom, setConnFrom] = useState<string | null>(null);
  const linkNodes = (from: string, to: string) => { if (from === to) return; const tn = g.nodes.find((n: GNode) => n.id === to); if (tn && tn.kind === "entrada") return; if (g.edges.some((e: GEdge) => e.from === from && e.to === to)) return; setGraph((p: Graph) => ({ ...p, edges: [...p.edges, { id: uid(), from, to }] })); };
  useEffect(() => { const onDown = (e: globalThis.PointerEvent) => { const t = e.target as HTMLElement | null; if (!t || !t.closest || !t.closest("[data-pop]")) setPop(null); }; window.addEventListener("pointerdown", onDown); return () => window.removeEventListener("pointerdown", onDown); }, []);
  const rb = (active: boolean, _primary?: boolean): CSSProperties => ({ width: 38, height: 38, borderRadius: 10, border: "none", background: active ? "#185FA5" : "transparent", color: active ? "#fff" : "#374151", fontSize: "17px", cursor: "pointer", display: "grid", placeItems: "center", position: "relative", font: "inherit", padding: 0 });
  const railBtn = (id: string, icon: string, title: string, active: boolean, onClick: () => void, opts?: { primary?: boolean; badge?: number }) => (
    <button key={id} title={title} style={rb(active, opts && opts.primary)} onClick={onClick}>{icon}{opts && opts.badge ? <span style={{ position: "absolute", top: 2, right: 1, minWidth: 15, height: 15, borderRadius: 8, background: "#f59e0b", color: "#fff", fontSize: "9.5px", fontWeight: 700, lineHeight: "15px", padding: "0 3px", boxSizing: "border-box" }}>{opts.badge}</span> : null}</button>
  );
  const side: CSSProperties = { ...popBox, overscrollBehavior: "contain", top: 0, left: "calc(100% + 10px)", right: "auto", maxHeight: Math.max(160, rootH - 90), overflowY: "auto" };
  const chip = (off: boolean): CSSProperties => ({ display: "flex", alignItems: "center", gap: 5, padding: "4px 9px", borderRadius: 8, cursor: "pointer", fontSize: "11.5px", fontWeight: 600, background: off ? "transparent" : "#f3f4f6", color: off ? TER : "#374151", border: "1px solid #eef0f3", opacity: off ? 0.6 : 1 });
  const kIcon = (bg: string, ic: string) => <span style={{ width: 26, height: 26, borderRadius: 7, background: bg, color: "#333", display: "grid", placeItems: "center", fontSize: "14px", flexShrink: 0 }}>{ic}</span>;
  const h4: CSSProperties = { fontSize: "11px", fontWeight: 600, textTransform: "uppercase", opacity: 0.7, margin: "6px 8px", letterSpacing: ".6px", color: "#1f2937" };
  const sub = (t: string) => <small style={{ display: "block", opacity: 0.7, fontSize: "11px" }}>{t}</small>;
  const drawerOpen = !!(selNode || selLane || selNote);
  const closeAll = () => { setPop(null); setMenuTab(null); };
  const fieldSm: CSSProperties = { ...field, fontSize: "13px", padding: "8px 12px" };
  const linkRow = (e: GEdge, other: string) => <div key={e.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, color: SEC, fontSize: "12.5px", marginBottom: 3 }}><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nodeById(other)?.name}</span><span style={{ cursor: "pointer", color: "#dc2626" }} title="Remover ligação" onClick={() => cutEdge(e.id)}>×</span></div>;

  return (
    <div ref={rootRef} className="kf" style={{ position: "relative", width: "100%", maxWidth: "none", height: "100%", minHeight: 420, display: "flex", flexDirection: "column", overflow: "hidden", boxSizing: "border-box", fontFamily: FONT, fontWeight: 500, color: "#1f2937", background: "#f9fafb", colorScheme: "light", fontSize: "13px" }}>
      <style>{CSS}</style>
      <input ref={file} type="file" accept="application/json,.json" style={{ display: "none" }} onChange={onFile} />

      <div style={{ position: "absolute", top: 12, left: 12, right: 12, zIndex: 30, display: "flex", alignItems: "center", gap: 8, pointerEvents: "none" }}>
        <div style={{ ...pill, position: "relative", pointerEvents: "auto", padding: "6px 12px", gap: 10, flexWrap: "nowrap", minWidth: 0, flex: "0 1 auto", maxWidth: narrow ? "calc(100% - 96px)" : 640 }}>
          <div style={{ fontWeight: 700, fontSize: "13.5px", whiteSpace: "nowrap", color: "#111827" }}>{tab.name}</div>
          <div style={{ width: 1, height: 16, background: "#e5e7eb", flexShrink: 0 }} />
          {objEdit ? (
            <input autoFocus style={{ ...fieldSm, width: narrow ? 160 : 380, padding: "4px 8px", fontSize: "12.5px" }} placeholder="Objetivo deste fluxograma" value={g.objective} onChange={(e: ChangeEvent<HTMLInputElement>) => { const v = e.target.value; setGraph((p: Graph) => ({ ...p, objective: v }), "obj"); }} onBlur={() => setObjEdit(false)} onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") setObjEdit(false); }} />
          ) : (
            <div onClick={() => setObjEdit(true)} title={g.objective || "Definir objetivo"} style={{ minWidth: 0, cursor: "text", color: g.objective ? SEC : TER, fontSize: "12.5px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.objective || "＋ Objetivo"}</div>
          )}
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ ...pill, position: "relative", pointerEvents: "auto", padding: 4, gap: 2, flexWrap: "nowrap" }}>
          <button style={rb(false)} disabled={!h.past.length} onClick={undo} title="Desfazer (Ctrl+Z)">↶</button>
          <button style={rb(false)} disabled={!h.future.length} onClick={redo} title="Refazer (Ctrl+Shift+Z)">↷</button>
        </div>
      </div>

      <div data-pop="1" style={{ ...pill, left: 12, top: 64, flexDirection: "column", flexWrap: "nowrap", padding: 5, gap: 2, zIndex: 35 }} onPointerDown={stop}>
        {railBtn("select", "➤", "Selecionar e mover", tool === "select", () => { setTool("select"); setConnFrom(null); setPop(null); })}
        {railBtn("pan", "✋", "Mão: arrastar o quadro", tool === "pan", () => { setTool("pan"); setConnFrom(null); setPop(null); })}
        {railBtn("add", "＋", "Adicionar peça", pop === "add", () => togglePop("add"), { primary: true })}
        {railBtn("grupo", "▢", "Novo grupo", false, () => addAny("grupo"))}
        {railBtn("nota", "✎", "Nova nota", false, () => addAny("nota"))}
        {railBtn("conn", "⤳", "Conectar: clique na origem e depois no destino", tool === "connect", () => { setTool(tool === "connect" ? "select" : "connect"); setConnFrom(null); setPop(null); })}
        <div style={{ height: 1, background: "#eef0f3", margin: "4px 4px" }} />
        {railBtn("search", "🔍", "Buscar e filtrar", pop === "search" || !!ql || hidden.length > 0, () => togglePop("search"))}
        {railBtn("export", "⇪", "Exportar", pop === "export", () => togglePop("export"))}
        {railBtn("warn", "⚠", "Antes de exportar", pop === "warn", () => togglePop("warn"), { badge: warnings.length })}
        {railBtn("help", "?", "Ajuda", pop === "help", () => togglePop("help"))}
        {railBtn("more", "⋯", "Mais opções", pop === "more", () => togglePop("more"))}

        {pop === "add" && (
          <div style={{ ...side, width: 240 }}>
            <div style={{ fontWeight: 600, fontSize: "13px", margin: "6px 8px" }}>Adicionar</div>
            <div style={h4}>Peças</div>
            {KINDS.map((k: Kind, i: number) => <button key={k} className="it" style={menuItem} disabled={k === "entrada" && hasEntrada} title={DESC[k]} onClick={() => addAny(k)}>{kIcon(STRIPE[k], ICON[k])}{LABEL[k]}<kbd>{i + 1}</kbd></button>)}
            {roles.length > 0 && <>{sep}<div style={h4}>Meus papéis</div></>}
            {roles.map((r: Role) => (
              <div key={r.id} style={{ display: "flex", alignItems: "center" }}>
                <button className="it" style={{ ...menuItem, flex: 1, minWidth: 0 }} title={r.desc || `Base: ${LABEL[r.base]}`} onClick={() => addAny("r:" + r.id)}>{kIcon(r.color, r.icon)}<span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</span></button>
                <span title="Editar papel" style={{ cursor: "pointer", padding: "4px 6px", color: SEC }} onClick={() => { setPop(null); setRoleDlg({ ...r }); }}>✎</span>
                <span title="Excluir papel" style={{ cursor: "pointer", padding: "4px 8px 4px 4px", color: "#dc2626" }} onClick={() => delRole(r)}>×</span>
              </div>
            ))}
            <button className="it" style={{ ...menuItem, color: "#185FA5" }} onClick={() => { setPop(null); setRoleDlg({ id: uid(), name: "", icon: ROLE_ICONS[0], color: "#f9a8d4", base: "trabalhador", desc: "", rounds: 3 }); }}>{kIcon("#dbeafe", "＋")}Novo papel</button>
            {sep}
            <button className="it" style={menuItem} onClick={() => addAny("grupo")} title="Caixa para agrupar peças de uma etapa">{kIcon("#d1d5db", "▢")}Grupo<kbd>G</kbd></button>
            <button className="it" style={menuItem} onClick={() => addAny("nota")} title="Post-it no quadro">{kIcon("#fde68a", "✎")}Nota<kbd>N</kbd></button>
          </div>
        )}
        {pop === "search" && (
          <div style={{ ...side, width: 260, padding: 12 }}>
            <input autoFocus style={fieldSm} placeholder="Buscar peça…" value={q} onChange={(e: ChangeEvent<HTMLInputElement>) => setQ(e.target.value)} onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter" && matches.length) goTo(matches[0]); }} />
            {ql && <div style={{ fontSize: "11.5px", color: SEC, margin: "6px 2px" }}>{matches.length} encontrada(s)</div>}
            {matches.slice(0, 6).map((n: GNode) => <button key={n.id} className="it" style={menuItem} onClick={() => goTo(n)}>{kIcon(stripeOf(n), roleOf(n)?.icon || ICON[n.kind])}<span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.name}</span></button>)}
            <div style={{ ...lab, margin: "12px 2px 6px" }}>Filtrar por tipo</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {KINDS.map((k: Kind) => { const off = hidden.indexOf(k) >= 0; return <div key={k} onClick={() => toggleKind(k)} title={DESC[k]} style={chip(off)}><span style={{ width: 7, height: 7, borderRadius: 4, background: STRIPE[k] }} />{LABEL[k]}</div>; })}
              {roles.map((r: Role) => { const off = hidden.indexOf("r:" + r.id) >= 0; return <div key={r.id} onClick={() => toggleKind("r:" + r.id)} title={`Base: ${LABEL[r.base]}`} style={chip(off)}><span style={{ fontSize: "11px" }}>{r.icon}</span>{r.name}</div>; })}
            </div>
          </div>
        )}
        {pop === "export" && (
          <div style={side}>
            <button className="it" style={menuItem} onClick={() => { setPop(null); setModal({ title: "Prompt para a IA", text: buildPrompt(tab.name, g), file: `${slug(tab.name)}-prompt.md` }); }}>{kIcon("#dbeafe", "🤖")}<span>Para IA{sub("Prompt pronto p/ colar")}</span></button>
            <button className="it" style={menuItem} onClick={() => { setPop(null); setModal({ title: "Briefing do Diretor", text: buildBriefing(tab.name, g), file: `${slug(tab.name)}-briefing-diretor.md` }); }}>{kIcon("#ede9fe", "📋")}<span>Briefing do Diretor{sub("Resumo em texto para o Diretor")}</span></button>
            {sep}
            <button className="it" style={menuItem} onClick={() => { setPop(null); download(`${slug(tab.name)}.json`, JSON.stringify({ name: tab.name, graph: g, roles: usedRoles(g) }, null, 2), "application/json"); }}>{kIcon("#f3f4f6", "{ }")}<span>JSON desta aba{sub("Baixar arquivo .json")}</span></button>
            <button className="it" style={menuItem} onClick={() => { setPop(null); download("fluxogramas.json", JSON.stringify({ ...S, roles }, null, 2), "application/json"); }}>{kIcon("#f3f4f6", "🗂")}<span>JSON de tudo{sub("Todas as abas e papéis")}</span></button>
            <button className="it" style={menuItem} onClick={() => { setPop(null); if (file.current) file.current.click(); }}>{kIcon("#f3f4f6", "📂")}<span>Abrir JSON…{sub("Importar fluxogramas e papéis")}</span></button>
          </div>
        )}
        {pop === "warn" && (
          <div style={{ ...side, width: narrow ? 240 : 300, padding: 14, gap: 6 }}>
            <div style={{ fontWeight: 700 }}>Antes de exportar</div>
            {warnings.length ? warnings.map((w: string, i: number) => <div key={i} style={{ display: "flex", gap: 8, lineHeight: 1.4, fontSize: "12.5px" }}><span style={{ color: "#f59e0b" }}>●</span><span>{w}</span></div>) : <div style={{ color: "#16a34a", fontWeight: 600 }}>Tudo certo para exportar.</div>}
          </div>
        )}
        {pop === "help" && (
          <div style={{ ...side, width: narrow ? 240 : 300, padding: 14, gap: 6, fontSize: "12.5px", lineHeight: 1.5, color: SEC }}>
            <div style={{ fontWeight: 700, color: "#1f2937" }}>Como usar</div>
            <div>＋ Adicionar cria uma peça; digite o nome do agente na hora (ex.: Diretora de Marketing).</div>
            <div>Para ligar: arraste da bolinha direita de uma peça até a esquerda de outra, ou use ⤳ Conectar e clique na origem e no destino. Clique num fio para cortar.</div>
            <div>Arraste o fundo (ou use ✋) para mover, role para zoom. Delete remove, Ctrl+D duplica, Ctrl+Z desfaz, Esc fecha menus.</div>
            <div>Grupo é uma caixa para juntar peças de uma mesma etapa ou equipe. Arraste o título do grupo e as peças de dentro vão junto. Serve para organizar o quadro; quem define o fluxo são as ligações.</div>
            <div>＋ Adicionar → Novo papel cria um tipo seu (ex.: Crítico) com ícone, cor e comportamento base. Ele fica salvo para todas as abas.</div>
            <div>Duplo clique no nome da aba ou do grupo para renomear. ⋯ na aba: duplicar, mover, excluir.</div>
            <div>Briefing do Diretor: cole num agente Diretor do Grok; ele executa o fluxo etapa por etapa.</div>
          </div>
        )}
        {pop === "more" && (
          <div style={side}>
            <button className="it" style={menuItem} onClick={() => { setPop(null); setAsk({ msg: "Organizar reposiciona as peças em colunas e remove os grupos desta aba. Dá para desfazer.", label: "Organizar", ok: () => { const ng = arrange(gRef.current); setGraph(() => ng); setTimeout(() => fit(ng), 30); } }); }}>Organizar automaticamente</button>
            <button className="it" style={menuItem} onClick={() => { setPop(null); fit(g); }}>Ajustar à tela</button>
            {sep}
            <div style={{ ...lab, margin: "4px 10px 2px" }}>Novo fluxograma</div>
            <button className="it" style={menuItem} onClick={() => { setPop(null); newTab(); }}>Em branco</button>
            <button className="it" style={menuItem} onClick={() => newFrom("Exemplo", EXAMPLE)}>A partir do modelo Exemplo</button>
            {sep}
            <button className="it" style={{ ...menuItem, color: "#dc2626" }} onClick={() => { setPop(null); setAsk({ msg: `Limpar todas as peças de “${tab.name}”? Dá para desfazer.`, label: "Limpar", ok: () => { setGraph(() => blank()); setSel(null); } }); }}>Limpar esta aba</button>
          </div>
        )}
      </div>

      <div ref={box} onPointerDown={(e: PointerEvent<HTMLDivElement>) => { drag.current = { mode: "pan", sx: e.clientX, sy: e.clientY, ox: view.x, oy: view.y }; setSel(null); setConnFrom(null); closeAll(); }}
        style={{ position: "relative", flex: "1 1 auto", minHeight: 0, overflow: "hidden", backgroundColor: "#f9fafb", backgroundImage: "radial-gradient(rgba(0,0,0,.12) 1px, transparent 1px)", backgroundSize: `${24 * view.k}px ${24 * view.k}px`, backgroundPosition: `${view.x}px ${view.y}px`, cursor: tool === "pan" ? "grab" : tool === "connect" ? "crosshair" : "default", touchAction: "none", userSelect: "none" }}>
        <div style={{ position: "absolute", left: 0, top: 0, transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})`, transformOrigin: "0 0" }}>
          {(g.lanes || []).map((l: Lane) => {
            const on = !!sel && sel.t === "lane" && sel.id === l.id; const lw = l.w || W + 32;
            return (
              <div key={l.id} style={{ position: "absolute", left: l.x - 16, top: l.y, width: lw, height: l.h, boxSizing: "border-box", borderRadius: 24, border: `1.5px ${on ? "solid" : "dashed"} ${on ? "#185FA5" : "#d1d5db"}`, background: "#f3f4f6", backgroundImage: "linear-gradient(#f3f4f6,#f3f4f6)", pointerEvents: "none" }}>
                <div style={{ pointerEvents: "auto", cursor: "move", padding: "10px 14px", fontSize: "14px", fontWeight: 700, color: SEC }}
                  onPointerDown={(e: PointerEvent<HTMLDivElement>) => { e.stopPropagation(); closeAll(); setSel({ t: "lane", id: l.id as string }); push(""); const carry = gRef.current.nodes.filter((n: GNode) => n.x >= l.x - 26 && n.x <= l.x - 16 + lw && n.y >= l.y && n.y <= l.y + l.h).map((n: GNode) => ({ id: n.id, x: n.x, y: n.y })); drag.current = { mode: "lane", id: l.id, sx: e.clientX, sy: e.clientY, ox: l.x, oy: l.y, carry }; }}
                  onDoubleClick={() => setEditLane(l.id as string)}>
                  {editLane === l.id ? <input autoFocus style={{ ...field, padding: "4px 8px", fontSize: "13px" }} value={l.label} onPointerDown={stop} onChange={(e: ChangeEvent<HTMLInputElement>) => updLane(l.id as string, { label: e.target.value }, "lane" + l.id)} onBlur={() => setEditLane(null)} onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") setEditLane(null); }} /> : l.label}
                </div>
              </div>
            );
          })}
          <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} width={1} height={1}>
            <defs>
              <marker id="arA" markerWidth="6" markerHeight="6" refX="5.5" refY="3" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0L6 3L0 6z" fill="#9ca3af" /></marker>
              <marker id="arB" markerWidth="6" markerHeight="6" refX="5.5" refY="3" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0L6 3L0 6z" fill="#f59e0b" /></marker>
            </defs>
            {g.edges.map((e: GEdge) => {
              const a = nodeById(e.from); const b = nodeById(e.to); if (!a || !b) return null;
              const back = b.x < a.x - 1 || (Math.abs(b.x - a.x) <= 1 && b.y < a.y); const d = back ? `M${a.x + W},${a.y + H / 2} C${a.x + W + 80},${a.y + H / 2 + 110} ${b.x - 80},${b.y + H / 2 + 110} ${b.x},${b.y + H / 2}` : curve(a.x + W, a.y + H / 2, b.x, b.y + H / 2);
              const dim = (ql && !(matchSet.has(a.id) || matchSet.has(b.id))) || isHidden(a) || isHidden(b) || (!!hlK && keyOf(a) !== hlK && keyOf(b) !== hlK);
              return (
                <g key={e.id} style={{ cursor: "pointer" }} opacity={dim ? 0.15 : 1} onPointerDown={(ev: PointerEvent<SVGGElement>) => ev.stopPropagation()} onClick={() => cutEdge(e.id)}>
                  <title>Clique para cortar</title>
                  <path d={d} stroke="transparent" strokeWidth={14} fill="none" />
                  {back && <text x={(a.x + W + b.x) / 2 + 6} y={(a.y + b.y) / 2 + H / 2 + 86} fill="#f59e0b" fontSize={11} fontFamily={FONT}>revisão</text>}
                  <path d={d} stroke={back ? "#f59e0b" : "#9ca3af"} strokeWidth={2} markerEnd={back ? "url(#arB)" : "url(#arA)"} strokeDasharray={back ? "6 5" : undefined} fill="none" />
                </g>
              );
            })}
            {wire && (() => { const a = nodeById(wire.from); return a ? <path d={curve(a.x + W, a.y + H / 2, wire.x, wire.y)} stroke="#185FA5" strokeWidth={2} strokeDasharray="4 4" fill="none" /> : null; })()}
          </svg>
          {(g.notes || []).map((n: Note) => {
            const on = !!sel && sel.t === "note" && sel.id === n.id;
            return (
              <div key={n.id} style={{ position: "absolute", left: n.x, top: n.y, width: n.w, height: n.h, boxSizing: "border-box", borderRadius: 18, background: "#fef9c3", backgroundImage: "linear-gradient(#fef9c3,#fef9c3)", border: `1px solid ${on ? "#185FA5" : "#fde68a"}`, boxShadow: "0 2px 8px rgba(17,24,39,.07)", display: "flex", flexDirection: "column" }}>
                <div style={{ height: 22, cursor: "move", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 10px", fontSize: "10px", fontWeight: 700, color: "#a16207", letterSpacing: "0.06em" }}
                  onPointerDown={(e: PointerEvent<HTMLDivElement>) => { e.stopPropagation(); closeAll(); setSel({ t: "note", id: n.id }); push(""); drag.current = { mode: "note", id: n.id, sx: e.clientX, sy: e.clientY, ox: n.x, oy: n.y }; }}>
                  <span>NOTA</span>
                  <span style={{ cursor: "pointer", fontSize: "14px" }} onPointerDown={stop} onClick={() => removeSel({ t: "note", id: n.id })}>×</span>
                </div>
                <textarea value={n.text} placeholder="Escreva uma nota…" onPointerDown={(e: PointerEvent<HTMLTextAreaElement>) => { e.stopPropagation(); setSel({ t: "note", id: n.id }); }} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => updNote(n.id, { text: e.target.value }, "note" + n.id)}
                  style={{ flex: 1, font: "inherit", fontSize: "12.5px", color: "#1f2937", background: "transparent", border: "none", outline: "none", resize: "none", padding: "2px 10px 10px", lineHeight: 1.4 }} />
              </div>
            );
          })}
          {g.nodes.map((n: GNode) => {
            const on = !!sel && sel.t === "node" && sel.id === n.id; const sc = stripeOf(n); const hit = matchSet.has(n.id); const hlOn = !!hlK && keyOf(n) === hlK; const dim = (ql && !hit) || isHidden(n) || (!!hlK && !hlOn);
            const port: CSSProperties = { position: "absolute", top: H / 2 - 6, width: 12, height: 12, borderRadius: 6, background: "#fff", backgroundImage: "linear-gradient(#fff,#fff)", border: `2px solid ${sc}`, boxSizing: "border-box", cursor: "crosshair" };
            return (
              <div key={n.id} onPointerDown={(e: PointerEvent<HTMLDivElement>) => { e.stopPropagation(); closeAll(); if (tool === "pan") { drag.current = { mode: "pan", sx: e.clientX, sy: e.clientY, ox: view.x, oy: view.y }; return; } if (tool === "connect") { if (!connFrom) setConnFrom(n.id); else { linkNodes(connFrom, n.id); setConnFrom(null); } return; } setSel({ t: "node", id: n.id }); push(""); drag.current = { mode: "node", id: n.id, sx: e.clientX, sy: e.clientY, ox: n.x, oy: n.y }; }}
                style={{ position: "absolute", left: n.x, top: n.y, width: W, height: H, boxSizing: "border-box", opacity: dim ? 0.25 : 1, background: "#fff", backgroundImage: "linear-gradient(#fff,#fff)", boxShadow: hlOn ? `0 0 0 4px ${sc}, 0 0 22px ${sc}` : on || connFrom === n.id ? "0 0 0 3px rgba(24,95,165,.22), 0 4px 18px rgba(0,0,0,.08)" : hit ? "0 0 0 3px rgba(245,158,11,.3), 0 4px 18px rgba(0,0,0,.08)" : "0 4px 18px rgba(0,0,0,.08)", border: `1px solid ${n.decision ? "#f59e0b" : on || connFrom === n.id ? "#185FA5" : "#e5e7eb"}`, borderRadius: 14, overflow: "visible", cursor: tool === "connect" ? "crosshair" : tool === "pan" ? "grab" : "move", display: "flex" }}>
                <div style={{ width: 4, background: sc, borderRadius: "13px 0 0 13px", flexShrink: 0 }} />
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", overflow: "hidden", minWidth: 0, flex: 1 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: sc.charAt(0) === "#" && sc.length === 7 ? sc + "55" : "#f3f4f6", display: "grid", placeItems: "center", fontSize: "17px", flexShrink: 0 }}>{roleOf(n)?.icon || ICON[n.kind]}</div>
                  <div style={{ minWidth: 0 }}>
                    <div title={n.name} style={{ fontWeight: 700, fontSize: n.name.length > 40 ? "12px" : "13.5px", lineHeight: 1.25, color: "#1f2937", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{n.name}</div>
                    <div title={n.role || DESC[n.kind]} style={{ fontSize: "11px", color: "#1f2937", opacity: 0.75, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{roleOf(n)?.name || LABEL[n.kind]}{n.kind === "supervisor" ? ` · ${n.rounds}x` : ""}{n.role ? ` · ${n.role}` : ""}</div>
                  </div>
                </div>
                {n.decision && <div title={n.decision} style={{ position: "absolute", left: -1, bottom: H + 6, width: W + 30, boxSizing: "border-box", padding: "4px 8px", borderRadius: 10, background: "#fffbeb", backgroundImage: "linear-gradient(#fffbeb,#fffbeb)", border: "1px solid #f59e0b", color: "#92400e", fontSize: "10.5px", fontWeight: 700, lineHeight: 1.3 }}>{n.decision}</div>}
                {n.kind !== "entrada" && <div style={{ ...port, left: -7 }} onPointerUp={() => connect(n.id)} onPointerDown={stop} />}
                <div style={{ ...port, right: -7, background: sc }} onPointerDown={(e: PointerEvent<HTMLDivElement>) => { e.stopPropagation(); const p = toWorld(e.clientX, e.clientY); setWire({ from: n.id, x: p.x, y: p.y }); }} />
              </div>
            );
          })}
        </div>

        {tool === "connect" && <div style={{ ...pill, left: "50%", top: 64, transform: "translateX(-50%)", padding: "6px 12px", fontSize: "12px", color: SEC, zIndex: 20 }} onPointerDown={stop}>{connFrom ? "Agora clique na peça de destino" : "Conectar: clique na peça de origem"}</div>}

        <div style={{ ...pill, right: 12, top: 64, padding: 4, gap: 2, flexWrap: "nowrap" }} onPointerDown={stop}>
          <button style={rb(false)} onClick={() => setView((v) => ({ ...v, k: Math.max(0.2, v.k / 1.15) }))}>−</button>
          <button style={{ ...iconBtn, border: "none", boxShadow: "none", fontWeight: 500, color: SEC }} onClick={() => setView({ x: 20, y: 20, k: 1 })} title="Voltar a 100%">{Math.round(view.k * 100)}%</button>
          <button style={rb(false)} onClick={() => setView((v) => ({ ...v, k: Math.min(2.2, v.k * 1.15) }))}>+</button>
          <button style={{ ...rb(false), fontSize: "15px" }} onClick={() => fit(g)} title="Ajustar à tela">⤢</button>
        </div>

        {drawerOpen && (
          <div data-panel="1" onPointerDown={stop} onWheel={(e: { stopPropagation: () => void }) => e.stopPropagation()} style={{ ...panel, overscrollBehavior: "contain", maxHeight: "calc(100% - 76px)", position: "absolute", top: 64, right: 12, bottom: narrow ? 104 : 60, width: narrow ? "calc(100% - 20px)" : 320, boxSizing: "border-box", overflowY: "auto", zIndex: 25, background: "#fff", backgroundImage: "linear-gradient(#fff,#fff)", padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              {selNode && <div style={{ width: 10, height: 10, borderRadius: 5, background: stripeOf(selNode), boxShadow: `0 0 8px ${stripeOf(selNode)}` }} />}
              <div style={{ fontWeight: 700, flex: 1 }}>{selNode ? (roleOf(selNode) ? `${roleOf(selNode)?.icon} ${roleOf(selNode)?.name}` : LABEL[selNode.kind]) : selLane ? "Grupo" : "Nota"}</div>
              <button style={{ ...iconBtn, background: "transparent", boxShadow: "none" }} onClick={() => setSel(null)} title="Fechar">×</button>
            </div>
            {selNode && (
              <div>
                {selNode.decision && <div style={{ marginTop: 8, padding: "7px 10px", borderRadius: 14, background: "#fffbeb", backgroundImage: "linear-gradient(#fffbeb,#fffbeb)", color: "#92400e", border: "1px solid #f59e0b", fontWeight: 700, fontSize: "12px", lineHeight: 1.4 }}>{selNode.decision}</div>}
                <div style={lab}>Nome</div>
                <input ref={nameRef} style={fieldSm} placeholder="Ex.: Diretora de Marketing" value={selNode.name} onChange={(e: ChangeEvent<HTMLInputElement>) => upd(selNode.id, { name: e.target.value }, "name" + selNode.id)} onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }} />
                <div style={lab}>Papel</div>
                <input style={fieldSm} placeholder="O que este agente é / faz" value={selNode.role || ""} onChange={(e: ChangeEvent<HTMLInputElement>) => upd(selNode.id, { role: e.target.value }, "role" + selNode.id)} />
                <div style={lab}>{selNode.kind === "entrada" ? "O que será colado" : "Instruções"}</div>
                <textarea style={{ ...fieldSm, minHeight: 110, resize: "vertical", lineHeight: 1.45 }} value={selNode.instr} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => upd(selNode.id, { instr: e.target.value }, "instr" + selNode.id)} />
                <div onClick={() => setMoreOpts(!moreOpts)} style={{ ...lab, cursor: "pointer", marginTop: 16, color: SEC }}>{moreOpts ? "▾" : "▸"} Mais opções</div>
                {moreOpts && (
                  <div>
                    <div style={lab}>Tipo</div>
                    <select style={fieldSm} value={selNode.kind} onChange={(e: ChangeEvent<HTMLSelectElement>) => { const k = e.target.value as Kind; if (k === "entrada" && hasEntrada && selNode.kind !== "entrada") return; upd(selNode.id, { kind: k }, ""); }}>
                      {KINDS.map((k: Kind) => <option key={k} value={k} disabled={k === "entrada" && hasEntrada && selNode.kind !== "entrada"}>{LABEL[k]}</option>)}
                    </select>
                    <div style={lab}>Papel personalizado</div>
                    <select style={fieldSm} value={roleOf(selNode) ? selNode.rid : ""} onChange={(e: ChangeEvent<HTMLSelectElement>) => { const r = roles.find((x: Role) => x.id === e.target.value); upd(selNode.id, r ? { rid: r.id, kind: r.base } : { rid: undefined }, ""); }}>
                      <option value="">— nenhum (tipo padrão) —</option>
                      {roles.map((r: Role) => <option key={r.id} value={r.id}>{r.icon} {r.name}</option>)}
                    </select>
                    <div style={lab}>Formato de saída</div>
                    <input style={fieldSm} placeholder="Ex.: Markdown, lista, JSON" value={selNode.format} onChange={(e: ChangeEvent<HTMLInputElement>) => upd(selNode.id, { format: e.target.value }, "fmt" + selNode.id)} />
                    <div style={lab}>Ferramentas / fontes</div>
                    <input style={fieldSm} placeholder="Ex.: busca na web, Gmail, planilha" value={selNode.tools || ""} onChange={(e: ChangeEvent<HTMLInputElement>) => upd(selNode.id, { tools: e.target.value }, "tools" + selNode.id)} />
                    {selNode.kind === "supervisor" && (<><div style={lab}>Máximo de rodadas</div><input style={fieldSm} type="number" min={1} max={20} value={selNode.rounds} onChange={(e: ChangeEvent<HTMLInputElement>) => upd(selNode.id, { rounds: Math.max(1, Math.min(20, Number(e.target.value) || 1)) }, "rounds" + selNode.id)} /></>)}
                    <div style={lab}>Decisão da gestão</div>
                    <input style={fieldSm} placeholder="⚠ DECISÃO DA GESTÃO: …" value={selNode.decision || ""} onChange={(e: ChangeEvent<HTMLInputElement>) => upd(selNode.id, { decision: e.target.value || undefined }, "dec" + selNode.id)} />
                    <div style={lab}>Cor</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {SWATCHES.map((c: string) => { const cur = (selNode.color || "") === c; return <div key={c || "auto"} title={c ? c : "Cor do tipo"} onClick={() => upd(selNode.id, { color: c || undefined }, "")} style={{ width: 22, height: 22, borderRadius: 11, background: c || STRIPE[selNode.kind], cursor: "pointer", border: cur ? "2px solid #1f2937" : "2px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", color: "#03357a", fontWeight: 700 }}>{c ? "" : "A"}</div>; })}
                    </div>
                    <div style={lab}>Recebe de</div>
                    {g.edges.filter((e: GEdge) => e.to === selNode.id).map((e: GEdge) => linkRow(e, e.from))}
                    {!g.edges.some((e: GEdge) => e.to === selNode.id) && <div style={{ color: TER }}>—</div>}
                    <div style={lab}>Entrega para</div>
                    {g.edges.filter((e: GEdge) => e.from === selNode.id).map((e: GEdge) => linkRow(e, e.to))}
                    {!g.edges.some((e: GEdge) => e.from === selNode.id) && <div style={{ color: TER }}>—</div>}
                  </div>
                )}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
                  {selNode.kind !== "entrada" && <button style={btn} onClick={() => dupNode(selNode.id)}>Duplicar</button>}
                  <button style={btnDanger} onClick={() => removeSel({ t: "node", id: selNode.id })}>Excluir</button>
                </div>
              </div>
            )}
            {selLane && (
              <div>
                <div style={lab}>Nome</div>
                <input style={fieldSm} value={selLane.label} onChange={(e: ChangeEvent<HTMLInputElement>) => updLane(selLane.id as string, { label: e.target.value }, "lane" + selLane.id)} />
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ flex: 1 }}><div style={lab}>Largura</div><input style={fieldSm} type="number" min={120} value={selLane.w || W + 32} onChange={(e: ChangeEvent<HTMLInputElement>) => updLane(selLane.id as string, { w: Math.max(120, Number(e.target.value) || W + 32) }, "lw" + selLane.id)} /></div>
                  <div style={{ flex: 1 }}><div style={lab}>Altura</div><input style={fieldSm} type="number" min={120} value={selLane.h} onChange={(e: ChangeEvent<HTMLInputElement>) => updLane(selLane.id as string, { h: Math.max(120, Number(e.target.value) || 400) }, "lh" + selLane.id)} /></div>
                </div>
                <div style={{ marginTop: 16 }}><button style={btnDanger} onClick={() => removeSel({ t: "lane", id: selLane.id as string })}>Excluir grupo</button></div>
              </div>
            )}
            {selNote && (
              <div>
                <div style={lab}>Texto</div>
                <textarea style={{ ...fieldSm, minHeight: 110, resize: "vertical" }} value={selNote.text} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => updNote(selNote.id, { text: e.target.value }, "note" + selNote.id)} />
                <div style={{ marginTop: 16 }}><button style={btnDanger} onClick={() => removeSel({ t: "note", id: selNote.id })}>Excluir nota</button></div>
              </div>
            )}
          </div>
        )}

        <div data-panel="1" data-pop="1" style={{ position: "absolute", left: 72, bottom: 12, zIndex: 45 }} onPointerDown={stop} onWheel={(e: { stopPropagation: () => void }) => e.stopPropagation()}>
          <div style={{ display: "flex", gap: 8 }}>
            {([["projects", "Projetos", <svg key="p" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 2 7l10 5 10-5-10-5z" /><path d="m2 17 10 5 10-5" /><path d="m2 12 10 5 10-5" /></svg>], ["roles", "Papéis", <svg key="r" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="7" r="4" /><path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /></svg>]] as [string, string, ReactNode][]).map(([id, t, ic]: [string, string, ReactNode]) => (
              <button key={id} title={t} aria-label={t} onClick={() => { setMenuTab(null); togglePop(id); }} style={{ width: 44, height: 44, borderRadius: 22, border: `1px solid ${pop === id ? "#185FA5" : "#e5e7eb"}`, background: pop === id ? "#e8f0fe" : "#fff", boxShadow: GSHADOW, cursor: "pointer", display: "grid", placeItems: "center", padding: 0 }}>{ic}</button>
            ))}
          </div>
          {pop === "projects" && (
            <div style={{ ...popBox, top: "auto", right: "auto", left: 0, bottom: "calc(100% + 10px)", width: narrow ? 270 : 360, maxHeight: Math.max(160, rootH - 140), overflowY: "auto", overscrollBehavior: "contain" }}>
              <div style={h4}>Projetos ({S.tabs.length})</div>
              {S.tabs.map((tb: Tab, i: number) => { const on = tb.id === tab.id; return (
                <div key={tb.id}>
                  {editTab === tb.id ? <input autoFocus style={{ ...fieldSm, margin: "2px 0" }} value={tb.name} onChange={(e: ChangeEvent<HTMLInputElement>) => renameTab(tb.id, e.target.value)} onBlur={() => setEditTab(null)} onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") setEditTab(null); }} /> : (
                  <div style={{ display: "flex", alignItems: "flex-start", borderRadius: 9, background: on ? "#e8f0fe" : "transparent" }}>
                    <button className="it" style={{ ...menuItem, flex: 1, minWidth: 0, alignItems: "flex-start", whiteSpace: "normal", wordBreak: "break-word", lineHeight: 1.35, background: "transparent", color: on ? "#0d3d6b" : "#1f2937", fontWeight: on ? 700 : 500 }} onClick={() => { switchTab(tb.id); setPop(null); }} onDoubleClick={() => setEditTab(tb.id)}><span style={{ flexShrink: 0 }}>{on ? "●" : "○"}</span><span>{tb.name || "Sem nome"}</span></button>
                    <span title="Opções" style={{ cursor: "pointer", padding: "6px 10px", fontWeight: 700, color: SEC }} onClick={() => setMenuTab(menuTab === tb.id ? null : tb.id)}>⋯</span>
                  </div>)}
                  {menuTab === tb.id && (
                    <div style={{ margin: "2px 0 6px 22px", padding: 4, border: "1px solid #eef0f3", borderRadius: 10, display: "flex", flexDirection: "column" }}>
                      <button className="it" style={menuItem} onClick={() => { setEditTab(tb.id); setMenuTab(null); }}>Renomear</button>
                      <button className="it" style={menuItem} onClick={() => dupTab(tb.id)}>Duplicar</button>
                      <button className="it" style={menuItem} disabled={i === 0} onClick={() => moveTab(tb.id, -1)}>↑ Mover para cima</button>
                      <button className="it" style={menuItem} disabled={i === S.tabs.length - 1} onClick={() => moveTab(tb.id, 1)}>↓ Mover para baixo</button>
                      <button className="it" style={menuItem} onClick={() => { download(`${slug(tb.name)}.json`, JSON.stringify({ name: tb.name, graph: tb.graph, roles: usedRoles(tb.graph) }, null, 2), "application/json"); setMenuTab(null); }}>Exportar esta aba</button>
                      <button className="it" style={{ ...menuItem, color: "#dc2626" }} onClick={() => { setPop(null); delTab(tb.id); }}>Excluir fluxograma</button>
                    </div>
                  )}
                </div>); })}
              {sep}
              <button className="it" style={{ ...menuItem, color: "#185FA5" }} onClick={() => { setPop(null); newTab(); }}>＋ Novo fluxograma</button>
            </div>
          )}
          {pop === "roles" && (
            <div style={{ ...popBox, top: "auto", right: "auto", left: 0, bottom: "calc(100% + 10px)", width: narrow ? 270 : 340, maxHeight: Math.max(160, rootH - 140), overflowY: "auto", overscrollBehavior: "contain" }}>
              <div style={h4}>Papéis · {tab.name}</div>
              <div style={{ fontSize: "11px", color: TER, margin: "0 8px 4px" }}>Passe o mouse para destacar no fluxo; clique para fixar.</div>
              {KINDS.map((k: Kind) => <div key={k} style={rowSt(k)} {...rowEv(k)}>{kIcon(STRIPE[k] + "55", ICON[k])}<div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 600 }}>{LABEL[k]}</div><div style={{ fontSize: "11.5px", color: SEC, lineHeight: 1.3 }}>{DESC[k]}</div></div><span style={{ fontWeight: 700, color: SEC }}>{g.nodes.filter((n: GNode) => n.kind === k && !roleOf(n)).length}</span></div>)}
              {roles.length > 0 && <>{sep}<div style={h4}>Meus papéis</div></>}
              {roles.map((r: Role) => <div key={r.id} style={rowSt("r:" + r.id)} {...rowEv("r:" + r.id)}>{kIcon(r.color + "55", r.icon)}<div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 600 }}>{r.name}</div><div style={{ fontSize: "11.5px", color: SEC, lineHeight: 1.3 }}>{r.desc || `Base: ${LABEL[r.base]}`}</div></div><span style={{ fontWeight: 700, color: SEC }}>{g.nodes.filter((n: GNode) => n.rid === r.id).length}</span></div>)}
            </div>
          )}
        </div>

        {false && <div data-panel="1" style={{ ...pill, left: "50%", transform: "translateX(-50%)", bottom: narrow ? 56 : 12, maxWidth: narrow ? "calc(100% - 24px)" : "calc(100% - 340px)", padding: 4, gap: 3, justifyContent: "center", zIndex: 26 }} onPointerDown={stop}>
          {S.tabs.map((tb: Tab, i: number) => {
            const on = tb.id === tab.id;
            return (
              <div key={tb.id} style={{ position: "relative", display: "flex", alignItems: "center" }}>
                {editTab === tb.id ? (
                  <input autoFocus style={{ ...fieldSm, width: 160, padding: "5px 10px", borderRadius: 14 }} value={tb.name} onChange={(e: ChangeEvent<HTMLInputElement>) => renameTab(tb.id, e.target.value)} onBlur={() => setEditTab(null)} onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") setEditTab(null); }} />
                ) : (
                  <div onClick={() => switchTab(tb.id)} onDoubleClick={() => setEditTab(tb.id)} title={`${tb.name} — duplo clique para renomear`}
                    style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 4px 5px 11px", borderRadius: 99, cursor: "pointer", fontWeight: on ? 600 : 500, fontSize: "12px", background: on ? "#185FA5" : "transparent", border: "1px solid transparent", color: on ? "#fff" : SEC, maxWidth: narrow ? 220 : 360 }}>
                    <span style={{ whiteSpace: "normal", wordBreak: "break-word", lineHeight: 1.25 }}>{tb.name || "Sem nome"}</span>
                    <span onClick={(e: { stopPropagation: () => void }) => { e.stopPropagation(); setPop(null); setMenuTab(menuTab === tb.id ? null : tb.id); }} style={{ padding: "0 6px", fontWeight: 700 }} title="Opções">⋯</span>
                  </div>
                )}
                {menuTab === tb.id && (
                  <div style={{ ...popBox, top: "auto", bottom: "calc(100% + 10px)", right: "auto", left: 0, minWidth: 190 }}>
                    <button className="it" style={menuItem} onClick={() => { setEditTab(tb.id); setMenuTab(null); }}>Renomear</button>
                    <button className="it" style={menuItem} onClick={() => dupTab(tb.id)}>Duplicar</button>
                    <button className="it" style={menuItem} disabled={i === 0} onClick={() => moveTab(tb.id, -1)}>← Mover para a esquerda</button>
                    <button className="it" style={menuItem} disabled={i === S.tabs.length - 1} onClick={() => moveTab(tb.id, 1)}>Mover para a direita →</button>
                    <button className="it" style={menuItem} onClick={() => { download(`${slug(tb.name)}.json`, JSON.stringify({ name: tb.name, graph: tb.graph, roles: usedRoles(tb.graph) }, null, 2), "application/json"); setMenuTab(null); }}>Exportar esta aba</button>
                    {sep}
                    <button className="it" style={{ ...menuItem, color: "#dc2626" }} onClick={() => delTab(tb.id)}>Excluir fluxograma</button>
                  </div>
                )}
              </div>
            );
          })}
          <button style={{ ...iconBtn, borderRadius: 14 }} onClick={newTab} title="Novo fluxograma em branco">＋</button>
        </div>}
      </div>

      {modal && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(17,24,39,.25)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: narrow ? 8 : 24, boxSizing: "border-box" }} onClick={() => setModal(null)}>
          <div style={{ ...panel, width: "100%", maxWidth: 760, height: "100%", maxHeight: 640, boxSizing: "border-box", display: "flex", flexDirection: "column", background: "#fff", backgroundImage: "linear-gradient(#fff,#fff)" }} onClick={(e: { stopPropagation: () => void }) => e.stopPropagation()}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{ fontWeight: 700, flex: "1 1 auto" }}>{modal.title} — {tab.name}</div>
              <button style={primSm} onClick={copy}>{copied ? "Copiado" : "Copiar"}</button>
              <button style={btn} onClick={() => download(modal.file, modal.text, "text/markdown")}>Baixar .md</button>
              <button style={iconBtn} onClick={() => setModal(null)}>×</button>
            </div>
            <textarea readOnly value={modal.text} style={{ ...field, flex: 1, minHeight: 0, resize: "none", fontFamily: "ui-monospace,SFMono-Regular,Menlo,monospace", fontSize: "12px", lineHeight: 1.5 }} />
          </div>
        </div>
      )}

      {roleDlg && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(17,24,39,.22)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 55, padding: 12 }} onClick={() => setRoleDlg(null)}>
          <div style={{ ...panel, width: "100%", maxWidth: 400, maxHeight: "100%", overflowY: "auto", boxSizing: "border-box", background: "#fff", backgroundImage: "linear-gradient(#fff,#fff)" }} onClick={(e: { stopPropagation: () => void }) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 12, display: "grid", placeItems: "center", fontSize: "17px", background: "#f3f4f6", border: `2px solid ${roleDlg.color}` }}>{roleDlg.icon}</div>
              <div style={{ fontWeight: 700, flex: 1 }}>{roles.some((x: Role) => x.id === roleDlg.id) ? "Editar papel" : "Novo papel"}</div>
              <button style={{ ...iconBtn, background: "transparent", boxShadow: "none" }} onClick={() => setRoleDlg(null)}>×</button>
            </div>
            <div style={lab}>Nome</div>
            <input autoFocus style={fieldSm} placeholder="Ex.: Crítico, Designer" value={roleDlg.name} onChange={(e: ChangeEvent<HTMLInputElement>) => setRoleDlg({ ...roleDlg, name: e.target.value })} onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") saveRole(); }} />
            <div style={lab}>Ícone</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {ROLE_ICONS.map((ic: string) => <div key={ic} onClick={() => setRoleDlg({ ...roleDlg, icon: ic })} style={{ width: 32, height: 32, borderRadius: 10, display: "grid", placeItems: "center", cursor: "pointer", fontSize: "16px", background: roleDlg.icon === ic ? "#e7f0ff" : "#f3f4f6", border: `1px solid ${roleDlg.icon === ic ? "#185FA5" : "#e5e7eb"}` }}>{ic}</div>)}
            </div>
            <div style={lab}>Cor</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {SWATCHES.filter((c: string) => c).map((c: string) => <div key={c} onClick={() => setRoleDlg({ ...roleDlg, color: c })} style={{ width: 24, height: 24, borderRadius: 12, background: c, cursor: "pointer", border: roleDlg.color === c ? "2px solid #1f2937" : "2px solid #e5e7eb", boxShadow: roleDlg.color === c ? "0 0 0 3px rgba(255,255,255,.25)" : "none" }} />)}
            </div>
            <div style={lab}>Comportamento base</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {ROLE_BASES.map(([k, l]: [Kind, string]) => <div key={k} title={DESC[k]} onClick={() => setRoleDlg({ ...roleDlg, base: k })} style={{ padding: "6px 11px", borderRadius: 12, cursor: "pointer", fontSize: "12px", fontWeight: 600, background: roleDlg.base === k ? "#e7f0ff" : "#f3f4f6", border: `1px solid ${roleDlg.base === k ? "#185FA5" : "#e5e7eb"}` }}>{l} <span style={{ color: TER, fontWeight: 500 }}>· {LABEL[k]}</span></div>)}
            </div>
            {roleDlg.base === "supervisor" && (<><div style={lab}>Rodadas</div><input style={{ ...fieldSm, width: 90 }} type="number" min={1} max={20} value={roleDlg.rounds} onChange={(e: ChangeEvent<HTMLInputElement>) => setRoleDlg({ ...roleDlg, rounds: Math.max(1, Math.min(20, Number(e.target.value) || 1)) })} /></>)}
            <div style={lab}>Descrição curta</div>
            <input style={fieldSm} placeholder="Aparece ao passar o mouse e vai na exportação" value={roleDlg.desc} onChange={(e: ChangeEvent<HTMLInputElement>) => setRoleDlg({ ...roleDlg, desc: e.target.value })} />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
              <button style={btn} onClick={() => setRoleDlg(null)}>Cancelar</button>
              <button style={btnPrimary} disabled={!roleDlg.name.trim()} onClick={saveRole}>Salvar papel</button>
            </div>
          </div>
        </div>
      )}

      {ask && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(17,24,39,.22)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 16 }} onClick={() => setAsk(null)}>
          <div style={{ ...panel, maxWidth: 360, background: "#fff", backgroundImage: "linear-gradient(#fff,#fff)" }} onClick={(e: { stopPropagation: () => void }) => e.stopPropagation()}>
            <div style={{ lineHeight: 1.5, marginBottom: 14 }}>{ask.msg}</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button style={btn} onClick={() => setAsk(null)}>Cancelar</button>
              <button style={ask.label === "Organizar" ? btnPrimary : btnDanger} onClick={() => { const f = ask.ok; setAsk(null); f(); }}>{ask.label}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

let __root: any = null;
(window as any).TFFluxo = {
  mount(el: HTMLElement) { if (__root) { try { __root.unmount(); } catch (_e) { /* */ } } __root = createRoot(el); __root.render(<App />); },
  unmount() { if (__root) { try { __root.unmount(); } catch (_e) { /* */ } __root = null; } },
  createTab(name: string, graph?: Partial<Graph>): string { const st = loadStore(); const id = uid(); const ns = { tabs: [...st.tabs, { id, name, graph: norm(graph || blank()) }], active: id }; tfSave(KEY, JSON.stringify(ns)); return id; },
  activate(id: string): boolean { const st = loadStore(); if (!st.tabs.some((t: Tab) => t.id === id)) return false; tfSave(KEY, JSON.stringify({ ...st, active: id })); return true; },
  hasTab(id: string): boolean { return loadStore().tabs.some((t: Tab) => t.id === id); },
};
