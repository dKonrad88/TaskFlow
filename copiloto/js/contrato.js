/** Contrato da fila do Copiloto, igual ao check do Postgres (projeto Pessoal). */

export const TIPOS = ['klain-tarefa', 'klain-compromisso', 'apto-gasto', 'compras-item', 'indefinido'];

export const STATUS = ['aguardando você', 'para o BOSS', 'aprovado', 'recusado', 'criado', 'erro'];

/** Ainda dá para decidir. A primeira gravação tira o item daqui. */
export const ABERTOS = ['aguardando você', 'para o BOSS'];

export const DECISOES = ['aprovado', 'recusado'];

/** Cômodos canônicos que a função copiloto-entrada já reconhece. */
export const COMODOS = [
  'Apartamento', 'Hall de Entrada', 'Sala de Estar', 'Sala de Jantar', 'Cozinha',
  'Área de Serviço', 'Lavabo', 'Escada', 'Mezanino', 'Sala Gamer', 'Suíte Master',
  'Banho Master', 'Closet Master', 'Quarto Visita', 'Banho Visita', 'Adega', 'Imóvel',
];

/** Mesma lista da função copiloto-entrada. Itens Klain nunca mostram estas palavras. */
export const TERMOS_CSMT = [
  'casamento', 'casamentos', 'casar', 'casou', 'casaremos', 'casorio',
  'noiva', 'noivas', 'noivo', 'noivos', 'noivado', 'noivados',
  'matrimonio', 'matrimonial', 'cerimonialista', 'cerimonialistas',
  'padrinho', 'padrinhos', 'madrinha', 'madrinhas', 'nupcial', 'nupcias',
  'lua de mel', 'wedding', 'weddings', 'bride', 'bridal', 'groom',
];

const ACENTO = { a: 'aáàâãAÁÀÂÃ', e: 'eéêEÉÊ', i: 'iíIÍ', o: 'oóôõOÓÔÕ', u: 'uúüUÚÜ', c: 'cçCÇ' };

function classeLetra(ch) {
  const base = ch.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
  if (ACENTO[base]) return `[${ACENTO[base]}]`;
  return ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function regexTermo(termo) {
  const corpo = [...termo].map(classeLetra).join('');
  return new RegExp(`(?<!\\p{L})${corpo}(?!\\p{L})`, 'giu');
}

export function termosCsmt(texto) {
  const achados = [];
  const fonte = String(texto ?? '');
  const ordem = [...TERMOS_CSMT].sort((a, b) => b.length - a.length);
  for (const termo of ordem) {
    if (regexTermo(termo).test(fonte)) achados.push(termo);
  }
  return [...new Set(achados)];
}

/** Troca palavra de casamento pela sigla. Não mexe no que já é CSMT. */
export function soCsmt(texto) {
  let out = String(texto ?? '');
  const ordem = [...TERMOS_CSMT].sort((a, b) => b.length - a.length);
  for (const termo of ordem) out = out.replace(regexTermo(termo), 'CSMT');
  return out;
}

export function emAberto(status) {
  return ABERTOS.includes(status);
}

export function areaDo(tipo) {
  if (tipo === 'klain-tarefa' || tipo === 'klain-compromisso') return 'hub';
  if (tipo === 'apto-gasto') return 'apto';
  if (tipo === 'compras-item') return 'compras';
  if (tipo === 'indefinido') return 'indefinido';
  return 'indefinido';
}

export function rotuloTipo(tipo) {
  return {
    'klain-tarefa': 'Tarefa',
    'klain-compromisso': 'Compromisso',
    'apto-gasto': 'Gasto · Pagamento',
    'compras-item': 'Item',
    indefinido: 'Indefinido',
  }[tipo] || tipo;
}

export function rotuloArea(tipo) {
  return {
    hub: 'Hub Klain',
    apto: 'Apto',
    compras: 'Compras',
    indefinido: 'Indefinido',
  }[areaDo(tipo)] || 'Indefinido';
}

export function rotuloStatus(status) {
  if (status === 'para o BOSS') return 'para o BOSS';
  if (status === 'aguardando você') return 'Aguardando você';
  if (!status) return '';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function partesSP(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const p = {};
  for (const parte of fmt.formatToParts(d)) p[parte.type] = parte.value;
  return p;
}

/** Data de calendário, sem hora, em dd/mm/yyyy. */
export function fData(iso) {
  if (!iso) return '';
  const s = String(iso);
  if (/^\d{4}-\d{2}-\d{2}/.test(s) && s.length <= 10) {
    const [y, m, d] = s.slice(0, 10).split('-');
    return `${d}/${m}/${y}`;
  }
  const p = partesSP(s);
  if (!p) return '';
  return `${p.day}/${p.month}/${p.year}`;
}

export function fHora(iso) {
  const p = partesSP(iso);
  if (!p) return '';
  return `${p.hour}:${p.minute}`;
}

export function fDataHora(iso) {
  if (!iso) return '';
  const s = String(iso);
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) {
    const [data, hora] = s.split('T');
    return `${fData(data)}, ${hora.slice(0, 5)}`;
  }
  const p = partesSP(s);
  if (!p) return fData(s);
  return `${p.day}/${p.month}/${p.year}, ${p.hour}:${p.minute}`;
}

export function fValor(n) {
  if (n === null || n === undefined || n === '') return '';
  const v = Number(n);
  if (!Number.isFinite(v)) return '';
  const corpo = v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `R$ ${corpo}`;
}

export function pValor(texto) {
  if (texto === null || texto === undefined || String(texto).trim() === '') return null;
  const t = String(texto).replace(/r\$/ig, '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100) / 100;
}

export function chaveProibida(key) {
  const k = String(key || '').trim();
  if (!k) return 'vazia';
  if (/^sb_secret_/i.test(k) || /service_role/i.test(k)) return 'service_role';
  if (/^sb_publishable_/i.test(k)) return null;
  const partes = k.split('.');
  if (partes.length === 3) {
    try {
      const json = JSON.parse(atob(partes[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (json.role === 'service_role') return 'service_role';
      if (json.role === 'anon') return 'anon';
      return 'jwt';
    } catch {
      return 'desconhecida';
    }
  }
  return 'desconhecida';
}

function csmtDe(prev, titulo, descricao) {
  const bruto = `${titulo || ''} ${descricao || ''}`;
  const termos = termosCsmt(bruto);
  if (!termos.length) {
    return prev && prev.aplicado ? prev : { aplicado: false, termos: [] };
  }
  return { aplicado: true, termos };
}

/** Devolve só as chaves do tipo. O que sobrar não entra no payload. */
export function payloadCanonico(tipo, bruto) {
  const p = bruto && typeof bruto === 'object' ? bruto : {};
  if (tipo === 'klain-tarefa') {
    const titulo = soCsmt(p.titulo || '');
    const descricao = soCsmt(p.descricao || '');
    return {
      titulo,
      descricao,
      vencimento: p.vencimento || null,
      csmt: csmtDe(p.csmt, p.titulo, p.descricao),
    };
  }
  if (tipo === 'klain-compromisso') {
    const titulo = soCsmt(p.titulo || '');
    const descricao = soCsmt(p.descricao || '');
    return {
      titulo,
      descricao,
      data_hora: p.data_hora || null,
      local: soCsmt(p.local || ''),
      csmt: csmtDe(p.csmt, `${p.titulo || ''} ${p.local || ''}`, p.descricao),
    };
  }
  if (tipo === 'apto-gasto') {
    return {
      titulo: p.titulo || '',
      valor: p.valor === '' || p.valor === undefined ? null : p.valor,
      data: p.data || null,
      ambiente: p.ambiente || null,
      comodo_incerto: !!p.comodo_incerto,
    };
  }
  if (tipo === 'compras-item') {
    return {
      nome: p.nome || '',
      ambiente: p.ambiente || null,
      quantidade: p.quantidade || null,
      valor_estimado: p.valor_estimado === '' || p.valor_estimado === undefined ? null : p.valor_estimado,
      comodo_incerto: !!p.comodo_incerto,
    };
  }
  return {
    motivo: p.motivo || 'Não deu para classificar com segurança.',
    candidatos: Array.isArray(p.candidatos) ? p.candidatos.filter((t) => TIPOS.includes(t) && t !== 'indefinido') : [],
  };
}

export function tituloFila(item) {
  const p = item.payload || {};
  const klain = item.tipo === 'klain-tarefa' || item.tipo === 'klain-compromisso' || item.tipo === 'indefinido';
  const bruto = item.transcricao || p.titulo || p.nome || p.motivo || 'Sem título';
  return klain ? soCsmt(bruto) : bruto;
}

export function inicioDoPeriodo(periodo, agora = new Date()) {
  if (periodo === 'hoje') {
    const p = partesSP(agora.toISOString());
    return Date.parse(`${p.year}-${p.month}-${p.day}T00:00:00-03:00`);
  }
  if (periodo === '7') return agora.getTime() - 7 * 86400000;
  if (periodo === '30') return agora.getTime() - 30 * 86400000;
  return null;
}

export function filtrar(itens, filtros, agora = new Date()) {
  const f = filtros || {};
  const corte = f.periodo ? inicioDoPeriodo(f.periodo, agora) : null;
  return (itens || []).filter((item) => {
    if (f.area && f.area !== 'todas' && areaDo(item.tipo) !== f.area) return false;
    if (f.status && item.status !== f.status) return false;
    if (corte !== null && new Date(item.created_at).getTime() < corte) return false;
    return true;
  });
}

export function ordenarFila(itens) {
  return [...(itens || [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}
