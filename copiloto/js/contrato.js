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

export function semAcento(texto) {
  return String(texto ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

export function ehGrupo(pessoa) {
  return pessoa?.papel === 'grupo';
}

/** usos nulo (ou ausente) vale para todos os campos. */
export function usoLiberado(pessoa, uso) {
  if (!pessoa || pessoa.ativo === false) return false;
  if (pessoa.usos == null) return true;
  return Array.isArray(pessoa.usos) && pessoa.usos.includes(uso);
}

export function idPadrao(lista) {
  const pessoa = (lista || []).find((p) => p.padrao && p.ativo !== false && !ehGrupo(p));
  return pessoa ? pessoa.id : null;
}

const USO_DO_CAMPO = {
  solicitante: 'solicitante',
  solicitante_id: 'solicitante',
  executor: 'executor',
  executor_id: 'executor',
  em_copia: 'em_copia',
  em_copia_id: 'em_copia',
  participantes: 'participantes',
  participantes_ids: 'participantes',
};

function umSo(valor) {
  const item = Array.isArray(valor) ? valor[0] : valor;
  if (item === undefined || item === null || item === '') return null;
  return String(item);
}

function varios(valor) {
  const lista = Array.isArray(valor) ? valor : (valor ? [valor] : []);
  const ids = [];
  for (const item of lista) {
    const id = umSo(item);
    if (id && !ids.includes(id)) ids.push(id);
  }
  return ids;
}

/** solicitante e executor são um id ou null. em_copia é sempre um array. */
export function normalizarPessoas(bruto) {
  const p = bruto && typeof bruto === 'object' ? bruto : {};
  return {
    solicitante: umSo(p.solicitante ?? p.solicitante_id),
    executor: umSo(p.executor ?? p.executor_id),
    em_copia: varios(p.em_copia ?? p.em_copia_id),
    participantes: varios(p.participantes ?? p.participantes_ids),
  };
}

function porNome(a, b) {
  return String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR');
}

/**
 * Solicitante e executor: Ninguém, grupos, pessoas por setor.
 * Em cópia e participantes: só pessoas, sem Ninguém.
 */
export function montarListaPessoas(lista, campo, selecionado, busca) {
  const uso = USO_DO_CAMPO[campo];
  const q = semAcento(busca).trim();
  const casa = (texto) => !q || semAcento(texto).includes(q);
  const comNinguem = campo === 'solicitante' || campo === 'executor' || campo === 'solicitante_id' || campo === 'executor_id';
  const soPessoas = campo === 'em_copia' || campo === 'em_copia_id' || campo === 'participantes' || campo === 'participantes_ids';
  const base = (lista || []).filter((p) => usoLiberado(p, uso));
  const grupos = soPessoas ? [] : base.filter(ehGrupo).filter((p) => casa(p.nome)).sort(porNome);
  const gente = base.filter((p) => !ehGrupo(p)).filter((p) => casa(p.nome) || casa(p.papel));
  const porSetor = new Map();
  for (const pessoa of gente) {
    const setor = pessoa.papel || 'Sem setor';
    if (!porSetor.has(setor)) porSetor.set(setor, []);
    porSetor.get(setor).push(pessoa);
  }
  const setores = [...porSetor.keys()].sort((a, b) => a.localeCompare(b, 'pt-BR')).map((setor) => ({
    setor,
    pessoas: porSetor.get(setor).sort(porNome),
  }));
  const escolhidos = Array.isArray(selecionado) ? selecionado : null;
  const selId = escolhidos ? '' : (selecionado || '');
  return {
    ninguem: comNinguem && (!q || casa('ninguém')),
    ninguemSel: comNinguem && !escolhidos && !selId,
    grupos: grupos.map((p) => ({ ...p, sel: escolhidos ? escolhidos.includes(p.id) : p.id === selId })),
    setores: setores.map((bloco) => ({
      setor: bloco.setor,
      pessoas: bloco.pessoas.map((p) => ({ ...p, sel: escolhidos ? escolhidos.includes(p.id) : p.id === selId })),
    })),
  };
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
  // Só a data, sem hora: não passa por fuso, senão o dia volta um.
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return fData(s);
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

/** Cabeçalho do dia na fila: Hoje, Ontem ou a data em dd/mm/yyyy (fuso de São Paulo). */
export function rotuloDia(iso, agora = new Date()) {
  const p = partesSP(iso);
  const h = partesSP(agora.toISOString());
  if (!p || !h) return '';
  const dia = `${p.year}-${p.month}-${p.day}`;
  const hoje = `${h.year}-${h.month}-${h.day}`;
  if (dia === hoje) return 'Hoje';
  const ontem = new Date(Date.parse(`${hoje}T12:00:00Z`) - 86400000).toISOString().slice(0, 10);
  if (dia === ontem) return 'Ontem';
  return `${p.day}/${p.month}/${p.year}`;
}

/** Seções da lista do supermercado, na ordem em que aparecem na aba Lista. */
export const SECOES_MERCADO = [
  'Hortifruti', 'Açougue e peixaria', 'Laticínios e frios', 'Padaria', 'Mercearia',
  'Bebidas', 'Limpeza', 'Higiene', 'Outros',
];

/** Palavras sem acento que entregam a seção. A mais longa que casar vence. */
const PALAVRAS_SECAO = {
  Hortifruti: [
    'banana', 'bananas', 'maca', 'macas', 'laranja', 'laranjas', 'limao', 'limoes', 'tomate', 'tomates',
    'cebola', 'cebolas', 'alho', 'batata', 'batatas', 'cenoura', 'cenouras', 'alface', 'rucula', 'couve',
    'brocolis', 'abobrinha', 'pepino', 'pimentao', 'mamao', 'melancia', 'melao', 'uva', 'uvas', 'morango',
    'morangos', 'abacate', 'abacaxi', 'manga', 'mangas', 'fruta', 'frutas', 'verdura', 'verduras',
    'legume', 'legumes', 'salsinha', 'cebolinha', 'cheiro verde', 'gengibre', 'mandioca',
  ],
  'Açougue e peixaria': [
    'carne', 'carnes', 'carne moida', 'frango', 'peito de frango', 'coxa', 'sobrecoxa', 'picanha', 'alcatra',
    'patinho', 'linguica', 'bacon', 'costela', 'peixe', 'tilapia', 'salmao', 'camarao', 'bife', 'hamburguer',
  ],
  'Laticínios e frios': [
    'leite', 'queijo', 'queijos', 'mussarela', 'presunto', 'iogurte', 'iogurtes', 'manteiga', 'margarina',
    'requeijao', 'creme de leite', 'nata', 'ricota', 'peito de peru', 'salame', 'mortadela', 'cream cheese',
  ],
  Padaria: [
    'pao', 'paes', 'pao de forma', 'pao frances', 'pao de queijo', 'bolo', 'torrada', 'torradas',
    'bisnaguinha', 'croissant',
  ],
  Mercearia: [
    'arroz', 'feijao', 'macarrao', 'acucar', 'sal', 'cafe', 'oleo', 'azeite', 'farinha', 'molho de tomate',
    'extrato de tomate', 'biscoito', 'biscoitos', 'bolacha', 'bolachas', 'salgadinho', 'chocolate', 'cereal',
    'granola', 'aveia', 'ovo', 'ovos', 'vinagre', 'maionese', 'ketchup', 'mostarda', 'milho', 'ervilha',
    'atum', 'sardinha', 'leite condensado', 'leite de coco', 'tempero', 'temperos', 'pimenta', 'fermento',
    'achocolatado', 'mel', 'geleia',
  ],
  Bebidas: [
    'agua', 'agua com gas', 'agua de coco', 'refrigerante', 'refrigerantes', 'coca', 'coca cola', 'suco',
    'sucos', 'cerveja', 'cervejas', 'vinho', 'vinhos', 'energetico', 'cha', 'espumante', 'whisky', 'vodka', 'gin',
  ],
  Limpeza: [
    'detergente', 'sabao', 'sabao em po', 'amaciante', 'agua sanitaria', 'desinfetante', 'alvejante',
    'esponja', 'esponjas', 'saco de lixo', 'sacos de lixo', 'papel toalha', 'multiuso', 'limpa vidro',
    'vassoura', 'rodo', 'pano de chao', 'guardanapo', 'guardanapos', 'papel aluminio', 'filme plastico',
  ],
  Higiene: [
    'papel higienico', 'sabonete', 'sabonetes', 'shampoo', 'xampu', 'condicionador', 'creme dental',
    'pasta de dente', 'escova de dente', 'fio dental', 'desodorante', 'absorvente', 'absorventes', 'fralda',
    'fraldas', 'cotonete', 'cotonetes', 'barbeador', 'protetor solar', 'lenco umedecido',
  ],
};

const TERMOS_SECAO = Object.entries(PALAVRAS_SECAO)
  .flatMap(([secao, palavras]) => palavras.map((palavra) => [palavra, secao]))
  .sort((a, b) => b[0].length - a[0].length);

/** Adivinha a seção do mercado pelo nome do item. Sem palpite, devolve null. */
export function secaoDoMercado(texto) {
  const limpo = String(texto ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ');
  const hay = ` ${limpo} `;
  for (const [palavra, secao] of TERMOS_SECAO) {
    if (hay.includes(` ${palavra} `)) return secao;
  }
  return null;
}
