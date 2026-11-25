// Regras do envio ao Hub Klain: filtro CSMT, datas e pessoas.
// Este arquivo existe igual em copiloto-entrada/, copiloto-decidir/ e copiloto-hub/.
// Não lê segredo e não fala com o Hub: só monta o pacote que o agente vai usar.

export const DURACAO_COMPROMISSO_MIN = 60;
export const CONTA_HUB = "diego" as const;

const TERMOS_CSMT = [
  "casamento", "casamentos", "casar", "casou", "casaremos", "casorio",
  "noiva", "noivas", "noivo", "noivos", "noivado", "noivados",
  "matrimonio", "matrimonial", "cerimonialista", "cerimonialistas",
  "padrinho", "padrinhos", "madrinha", "madrinhas", "nupcial", "nupcias",
  "lua de mel", "wedding", "weddings", "bride", "bridal", "groom",
];

export type PessoaCadastro = {
  id: string;
  nome: string;
  papel: string | null;
  usos: string[] | null;
  padrao: boolean;
  ativo: boolean;
};

export type PessoaNome = { nome: string; papel: string | null; grupo: boolean };

export type PacoteTarefa = {
  tipo: "klain-tarefa";
  conta: typeof CONTA_HUB;
  titulo: string;
  descricao: string;
  inicio: string;
  vencimento: string | null;
  solicitante: PessoaNome;
  executor: PessoaNome;
  em_copia: PessoaNome[];
  categoria: null;
  tipo_hub: null;
  prioridade: null;
  avisos: string[];
};

export type PacoteCompromisso = {
  tipo: "klain-compromisso";
  conta: typeof CONTA_HUB;
  titulo: string;
  descricao: string;
  local: string;
  data: string;
  hora_inicio: string;
  hora_fim: string;
  data_fim: string;
  organizador: PessoaNome;
  pessoas: Array<PessoaNome & { papel_hub: "Leitora" }>;
  categoria: null;
  avisos: string[];
};

export type PacoteHub = PacoteTarefa | PacoteCompromisso;

export type HubEnvio = {
  fila_em: string;
  tentativas: number;
  pacote: PacoteHub;
  avisos: string[];
  erro?: string;
  reenviado_em?: string;
  criado_em?: string;
  numero?: string;
};

export type Preparado =
  | { ok: true; payload: Record<string, unknown>; pacote: PacoteHub; avisos: string[] }
  | { ok: false; erro: string };

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

export function encontrarCsmt(texto: string): string[] {
  if (!texto) return [];
  const hay = normalizar(texto);
  return TERMOS_CSMT.filter((termo) => new RegExp(`(?<!\\p{L})${classe(termo)}(?!\\p{L})`, "iu").test(hay));
}

export function reescreverCsmt(texto: string): string {
  if (!texto) return texto;
  let out = texto;
  for (const termo of [...TERMOS_CSMT].sort((a, b) => b.length - a.length)) {
    out = out.replace(new RegExp(`(?<!\\p{L})${classe(termo)}(?!\\p{L})`, "giu"), "CSMT");
  }
  return out;
}

export function hojeSP(agora = new Date()): string {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(agora);
  const v = (t: string) => partes.find((p) => p.type === t)?.value ?? "";
  return `${v("year")}-${v("month")}-${v("day")}`;
}

export function isoParaHub(iso: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return `${m[2]}/${m[3]}/${m[1]}`;
}

export function parseDataHora(valor: string): { y: number; m: number; d: number; hh: number; mm: number; ss: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(valor.trim());
  if (!m) return null;
  const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
  const hh = Number(m[4] ?? "0"), mm = Number(m[5] ?? "0"), ss = Number(m[6] ?? "0");
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || hh > 23 || mm > 59 || ss > 59) return null;
  const dt = new Date(Date.UTC(y, mo - 1, d, hh, mm, ss));
  if (
    dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d ||
    dt.getUTCHours() !== hh || dt.getUTCMinutes() !== mm || dt.getUTCSeconds() !== ss
  ) return null;
  return { y, m: mo, d, hh, mm, ss };
}

function dois(n: number): string {
  return String(n).padStart(2, "0");
}

export function compromissoHorarios(
  dataHora: string,
  duracaoMin = DURACAO_COMPROMISSO_MIN,
): { data: string; hora_inicio: string; hora_fim: string; data_fim: string } | null {
  const p = parseDataHora(dataHora);
  if (!p) return null;
  const inicio = Date.UTC(p.y, p.m - 1, p.d, p.hh, p.mm, p.ss);
  const fim = new Date(inicio + duracaoMin * 60 * 1000);
  return {
    data: `${dois(p.m)}/${dois(p.d)}/${p.y}`,
    hora_inicio: `${dois(p.hh)}:${dois(p.mm)}`,
    hora_fim: `${dois(fim.getUTCHours())}:${dois(fim.getUTCMinutes())}`,
    data_fim: `${dois(fim.getUTCMonth() + 1)}/${dois(fim.getUTCDate())}/${fim.getUTCFullYear()}`,
  };
}

function ehGrupo(p: PessoaCadastro): boolean {
  return (p.papel || "").toLowerCase() === "grupo";
}

function comoNome(p: PessoaCadastro): PessoaNome {
  return { nome: p.nome, papel: p.papel, grupo: ehGrupo(p) };
}

function textoPessoas(p: unknown): Record<string, unknown> {
  return p && typeof p === "object" ? p as Record<string, unknown> : {};
}

function idOuNulo(v: unknown): string | null {
  return typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v) ? v : null;
}

function idsDe(v: unknown): string[] {
  const lista = Array.isArray(v) ? v : (v ? [v] : []);
  const ids: string[] = [];
  for (const item of lista) {
    const id = idOuNulo(item);
    if (id && !ids.includes(id)) ids.push(id);
  }
  return ids;
}

export function resolverPessoas(
  tipo: "klain-tarefa" | "klain-compromisso",
  pessoas: unknown,
  cadastro: PessoaCadastro[],
): { ok: true; solicitante: PessoaNome; executor: PessoaNome; em_copia: PessoaNome[]; participantes: PessoaNome[]; avisos: string[] } | { ok: false; erro: string } {
  const padrao = cadastro.find((p) => p.padrao && p.ativo);
  if (!padrao) return { ok: false, erro: "não consegui montar o envio ao Hub." };
  const porId = new Map(cadastro.map((p) => [p.id, p]));
  const bruto = textoPessoas(pessoas);
  const avisos: string[] = [];

  const resolverUm = (id: string | null, campo: "solicitante" | "executor"): PessoaNome => {
    if (!id) return comoNome(padrao);
    const p = porId.get(id);
    if (!p || !p.ativo) {
      avisos.push(`não achei a pessoa de ${campo} no cadastro; usei o padrão.`);
      return comoNome(padrao);
    }
    if (tipo === "klain-compromisso" && ehGrupo(p)) {
      avisos.push(`o grupo ${p.nome} não entra no compromisso; usei o padrão em ${campo}.`);
      return comoNome(padrao);
    }
    return comoNome(p);
  };

  const lista = (ids: string[], campo: "em cópia" | "participantes"): PessoaNome[] => {
    const out: PessoaNome[] = [];
    for (const id of ids) {
      const p = porId.get(id);
      if (!p || !p.ativo) {
        avisos.push(`não achei alguém de ${campo} no cadastro.`);
        continue;
      }
      if (ehGrupo(p)) {
        avisos.push(`o grupo ${p.nome} não entra em ${campo}.`);
        continue;
      }
      if (!out.some((x) => x.nome === p.nome)) out.push(comoNome(p));
    }
    return out;
  };

  return {
    ok: true,
    solicitante: resolverUm(idOuNulo(bruto.solicitante_id ?? bruto.solicitante), "solicitante"),
    executor: resolverUm(idOuNulo(bruto.executor_id ?? bruto.executor), "executor"),
    em_copia: lista(idsDe(bruto.em_copia ?? bruto.em_copia_id), "em cópia"),
    participantes: lista(idsDe(bruto.participantes_ids ?? bruto.participantes), "participantes"),
    avisos,
  };
}

function guardarTextos(tipo: "klain-tarefa" | "klain-compromisso", payload: Record<string, unknown>): { ok: true; titulo: string; descricao: string; local: string } | { ok: false; erro: string } {
  const titulo = reescreverCsmt(String(payload.titulo ?? "")).trim();
  const descricao = reescreverCsmt(String(payload.descricao ?? ""));
  const local = tipo === "klain-compromisso" ? reescreverCsmt(String(payload.local ?? "")) : "";
  const textos = tipo === "klain-compromisso" ? [titulo, descricao, local] : [titulo, descricao];
  if (textos.some((t) => encontrarCsmt(t).length)) {
    return { ok: false, erro: "ainda tem termo vetado no texto; troque por CSMT." };
  }
  if (!titulo) return { ok: false, erro: "o item está sem título." };
  return { ok: true, titulo, descricao, local };
}

export function prepararPacote(
  tipo: "klain-tarefa" | "klain-compromisso",
  payload: Record<string, unknown>,
  cadastro: PessoaCadastro[],
  agora = new Date(),
): Preparado {
  const textos = guardarTextos(tipo, payload);
  if (!textos.ok) return textos;
  const gente = resolverPessoas(tipo, payload.pessoas, cadastro);
  if (!gente.ok) return gente;

  if (tipo === "klain-tarefa") {
    const inicioIso = payload.inicio == null || payload.inicio === "" ? hojeSP(agora) : String(payload.inicio).trim();
    const inicio = isoParaHub(inicioIso);
    if (!inicio) return { ok: false, erro: "a data de início é inválida." };
    let vencimento: string | null = null;
    if (payload.vencimento != null && payload.vencimento !== "") {
      vencimento = isoParaHub(String(payload.vencimento).trim());
      if (!vencimento) return { ok: false, erro: "a data de vencimento é inválida." };
    }
    const avisos = [...gente.avisos];
    if (gente.participantes.length) avisos.push("participantes não existem em tarefa; não foram enviados.");
    const pacote: PacoteTarefa = {
      tipo: "klain-tarefa",
      conta: CONTA_HUB,
      titulo: textos.titulo,
      descricao: textos.descricao,
      inicio,
      vencimento,
      solicitante: gente.solicitante,
      executor: gente.executor,
      em_copia: gente.em_copia,
      categoria: null,
      tipo_hub: null,
      prioridade: null,
      avisos,
    };
    const novo = {
      ...payload,
      titulo: textos.titulo,
      descricao: textos.descricao,
    };
    return { ok: true, payload: novo, pacote, avisos };
  }

  const brutoHora = payload.data_hora == null || payload.data_hora === "" ? "" : String(payload.data_hora);
  if (!brutoHora.trim()) return { ok: false, erro: "o compromisso está sem data e hora." };
  const horas = compromissoHorarios(brutoHora);
  if (!horas) return { ok: false, erro: "a data e hora do compromisso são inválidas." };

  const visto = new Set<string>();
  const pessoas: Array<PessoaNome & { papel_hub: "Leitora" }> = [];
  const entra = (p: PessoaNome, isOrganizador = false) => {
    if (p.grupo) return;
    if (isOrganizador) return;
    if (visto.has(p.nome)) return;
    visto.add(p.nome);
    pessoas.push({ ...p, papel_hub: "Leitora" });
  };
  const organizador = cadastro.find((p) => p.padrao && p.ativo)!;
  const orgNome = organizador.nome;
  visto.add(orgNome);
  entra(gente.solicitante, gente.solicitante.nome === orgNome);
  entra(gente.executor, gente.executor.nome === orgNome);
  for (const p of gente.em_copia) entra(p);
  for (const p of gente.participantes) entra(p);

  const pacote: PacoteCompromisso = {
    tipo: "klain-compromisso",
    conta: CONTA_HUB,
    titulo: textos.titulo,
    descricao: textos.descricao,
    local: textos.local,
    data: horas.data,
    hora_inicio: horas.hora_inicio,
    hora_fim: horas.hora_fim,
    data_fim: horas.data_fim,
    organizador: comoNome(organizador),
    pessoas,
    categoria: null,
    avisos: gente.avisos,
  };
  const novo = {
    ...payload,
    titulo: textos.titulo,
    descricao: textos.descricao,
    local: textos.local,
  };
  return { ok: true, payload: novo, pacote, avisos: gente.avisos };
}

/** Confere se o item foi colocado na fila por efetivar (itens antigos aprovados ficam de fora). */
export function naFilaDoHub(payload: unknown): boolean {
  if (!payload || typeof payload !== "object") return false;
  const envio = (payload as { hub_envio?: unknown }).hub_envio;
  if (!envio || typeof envio !== "object") return false;
  const e = envio as HubEnvio;
  return typeof e.fila_em === "string" && !!e.fila_em && !!e.pacote && typeof e.pacote === "object";
}

export function pacoteDaFila(payload: unknown): PacoteHub | null {
  if (!naFilaDoHub(payload)) return null;
  return (payload as { hub_envio: HubEnvio }).hub_envio.pacote;
}

export function normalizarNumero(valor: unknown): string | null {
  if (valor == null) return null;
  const s = String(valor).trim().replace(/^#/, "").replace(/\s+/g, "");
  if (!/^\d{1,12}$/.test(s)) return null;
  return s;
}

/** O pacote que o agente recebe nunca leva transcrição, csmt nem ids internos. */
export function itemParaAgente(
  id: string,
  tipo: string,
  teste: boolean,
  created_at: string | null,
  payload: unknown,
): Record<string, unknown> | null {
  const pacote = pacoteDaFila(payload);
  if (!pacote || pacote.tipo !== tipo) return null;
  const { ...campos } = pacote;
  return { id, teste, criado_em: created_at, ...campos };
}
