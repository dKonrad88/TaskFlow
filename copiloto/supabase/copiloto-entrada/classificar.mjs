/**
 * Classificador do copiloto-entrada. Puro: sem Deno, sem rede.
 * O index.ts da função importa daqui. Os testes também.
 * MODO TESTE: isto só decide tipo e payload. Quem grava é a função, e só em copiloto_itens.
 */

const TERMOS_CSMT = [
  'casamento', 'casamentos', 'casar', 'casou', 'casaremos', 'casorio',
  'noiva', 'noivas', 'noivo', 'noivos', 'noivado', 'noivados',
  'matrimonio', 'matrimonial', 'cerimonialista', 'cerimonialistas',
  'padrinho', 'padrinhos', 'madrinha', 'madrinhas', 'nupcial', 'nupcias',
  'lua de mel', 'wedding', 'weddings', 'bride', 'bridal', 'groom',
];

const COMODOS = [
  { nome: 'Apartamento', aliases: ['apartamento', 'apartamento geral', 'casa toda', 'casa inteligente', 'geral'] },
  { nome: 'Hall de Entrada', aliases: ['hall de entrada', 'hall', 'entrada'] },
  { nome: 'Sala de Estar', aliases: ['sala de estar', 'estar'] },
  { nome: 'Sala de Jantar', aliases: ['sala de jantar', 'jantar', 'mesa', 'cristaleira', 'mesa cristaleira'] },
  { nome: 'Cozinha', aliases: ['cozinha'] },
  { nome: 'Área de Serviço', aliases: ['area de servico', 'área de serviço', 'lavanderia'] },
  { nome: 'Lavabo', aliases: ['lavabo'] },
  { nome: 'Escada', aliases: ['escada'] },
  { nome: 'Mezanino', aliases: ['mezanino'] },
  { nome: 'Sala Gamer', aliases: ['sala gamer', 'gamer'] },
  { nome: 'Suíte Master', aliases: ['suite master', 'suíte master', 'suite', 'suíte'] },
  { nome: 'Banho Master', aliases: ['banho master', 'banheiro da suite', 'banheiro da suíte', 'banho da suite', 'banho da suíte'] },
  { nome: 'Closet Master', aliases: ['closet master', 'closet'] },
  { nome: 'Quarto Visita', aliases: ['quarto visita', 'quarto de visita', 'quarto de hospede', 'quarto de hóspede'] },
  { nome: 'Banho Visita', aliases: ['banho visita', 'banheiro de visita', 'banho de visita'] },
  { nome: 'Adega', aliases: ['adega'] },
  { nome: 'Imóvel', aliases: ['imovel', 'imóvel'] },
];

const PALAVRAS_QTD = [
  ['duas', '2'], ['dois', '2'], ['três', '3'], ['tres', '3'], ['quatro', '4'], ['cinco', '5'],
  ['uma', '1'], ['um', '1'],
];

function normalizar(texto) {
  return String(texto || '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function classeLetra(ch) {
  const base = ch.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
  const mapa = { a: 'aáàâãAÁÀÂÃ', e: 'eéêEÉÊ', i: 'iíIÍ', o: 'oóôõOÓÔÕ', u: 'uúüUÚÜ', c: 'cçCÇ' };
  if (mapa[base]) return `[${mapa[base]}]`;
  return escapeRe(ch);
}

function corpoFlex(termo) {
  return [...termo].map(classeLetra).join('');
}

function regexPalavra(termo, flags = 'iu') {
  return new RegExp(`(?<!\\p{L})${corpoFlex(termo)}(?!\\p{L})`, flags);
}

function temPalavra(hay, termo) {
  return regexPalavra(termo, 'iu').test(normalizar(hay));
}

function algum(hay, termos) {
  return termos.some((t) => temPalavra(hay, t));
}

function dataSP(agora) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(agora);
}

function addDaysISO(base, days) {
  const [y, m, d] = base.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

function proximoDiaSemana(hoje, alvo) {
  const [y, m, d] = hoje.split('-').map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  let delta = (alvo - dow + 7) % 7;
  if (delta === 0) delta = 7;
  return addDaysISO(hoje, delta);
}

function extrairData(texto, agora) {
  const hay = normalizar(texto);
  const hoje = dataSP(agora);
  if (/(?<!\p{L})hoje(?!\p{L})/u.test(hay)) return hoje;
  if (/(?<!\p{L})amanha(?!\p{L})/u.test(hay)) return addDaysISO(hoje, 1);
  if (/(?<!\p{L})ontem(?!\p{L})/u.test(hay)) return addDaysISO(hoje, -1);
  const dias = { domingo: 0, segunda: 1, terca: 2, quarta: 3, quinta: 4, sexta: 5, sabado: 6 };
  for (const [nome, n] of Object.entries(dias)) {
    if (temPalavra(hay, nome)) return proximoDiaSemana(hoje, n);
  }
  const dmy = texto.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/);
  if (dmy) {
    const dd = dmy[1].padStart(2, '0');
    const mm = dmy[2].padStart(2, '0');
    const yy = dmy[3] ? (dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3]) : hoje.slice(0, 4);
    return `${yy}-${mm}-${dd}`;
  }
  return null;
}

function extrairHora(texto) {
  const m = normalizar(texto).match(/(?:as|às)\s*(\d{1,2})(?:[:h](\d{2}))?h?|(?<!\w)(\d{1,2}):(\d{2})(?!\w)/);
  if (!m) return null;
  const hh = Number(m[1] ?? m[3]);
  const min = Number(m[2] ?? m[4] ?? 0);
  if (hh > 23 || min > 59) return null;
  return `${String(hh).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function extrairValor(texto) {
  const t = texto.replace(/\u00a0/g, ' ');
  const r1 = /r\$\s*(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:,\d{1,2})?)/i.exec(t);
  const r2 = /(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:,\d{1,2})?)\s*(?:reais|real)/i.exec(t);
  const raw = r1?.[1] ?? r2?.[1];
  if (!raw) return null;
  const n = Number(raw.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

function pertoDeDinheiroOuHora(hay, indice, tamanho) {
  const around = hay.slice(Math.max(0, indice - 10), indice + tamanho + 10);
  return /r\$|reais|real|boleto|pix|as |às |:/.test(around);
}

function extrairQuantidade(texto) {
  const original = String(texto || '');
  const hay = normalizar(original);
  for (const [palavra, numero] of PALAVRAS_QTD) {
    const re = regexPalavra(palavra, 'iu');
    const m = re.exec(hay);
    if (!m) continue;
    const depois = hay.slice(m.index + m[0].length);
    const un = /^\s*(kg|kilos?|litros?|unidades?|rolos?|caixas?|pacotes?|pacote|l)(?!\p{L})/iu.exec(depois);
    if (un) return `${numero} ${un[1]}`;
    if (palavra === 'um' || palavra === 'uma') {
      const pacote = /^\s+(pacote|caixa|rolo|unidade|litro|kg|kilo)\b/i.exec(depois);
      if (pacote) return `${numero} ${pacote[1]}`;
      continue;
    }
    return numero;
  }
  const reNum = /(?<!\p{L})(\d+(?:[.,]\d+)?)\s*(kg|kilos?|litros?|unidades?|rolos?|caixas?|pacotes?|pacote|l)?(?!\p{L})/giu;
  let m = reNum.exec(hay);
  while (m) {
    if (!pertoDeDinheiroOuHora(hay, m.index, m[0].length)) {
      const unidade = m[2] ? ` ${m[2]}` : '';
      return `${m[1].replace(',', '.')}${unidade}`.trim();
    }
    m = reNum.exec(hay);
  }
  return null;
}

function acharComodo(texto) {
  const hay = normalizar(texto);
  const hits = [];
  for (const c of COMODOS) {
    const aliases = [...c.aliases].sort((a, b) => b.length - a.length);
    for (const a of aliases) {
      if (temPalavra(hay, a)) {
        hits.push(c.nome);
        break;
      }
    }
  }
  const uniq = [...new Set(hits)];
  const salaSolta = /(?<!\p{L})sala(?!\p{L})/u.test(hay)
    && !uniq.includes('Sala de Estar') && !uniq.includes('Sala de Jantar') && !uniq.includes('Sala Gamer');
  if (salaSolta) return { ambiente: null, ambiguo: true };
  if (uniq.length === 1) return { ambiente: uniq[0], ambiguo: false };
  if (uniq.length > 1) return { ambiente: null, ambiguo: true };
  return { ambiente: null, ambiguo: false };
}

function limparEspaco(texto) {
  return String(texto || '').replace(/\s{2,}/g, ' ').replace(/^[\s,.:;-]+|[\s,.:;-]+$/g, '').trim();
}

function tirarComandoLista(texto) {
  let s = texto.trim();
  const re = /^(?:por favor[, ]+)?(?:quero |vamos |pode )?(?:comprar|preciso de|precisamos de|falta(?:m|ou)?|acab(?:ou|aram)|adicionar(?: na lista)?|adiciona(?:r)?(?: na lista)?|adicione(?: na lista)?|colocar(?: na lista)?|coloca(?: na lista)?|p[oõ]e(?: na lista)?|botar(?: na lista)?|bota(?: na lista)?|anotar(?: na lista)?|anota(?: na lista)?|incluir(?: na lista)?|inclui(?: na lista)?|na lista(?: de compras)?|lista de compras)\s+/i;
  for (let i = 0; i < 4; i += 1) {
    const n = s.replace(re, '');
    if (n === s) break;
    s = n.trim();
  }
  return s;
}

function tirarQuantidade(texto, qtd) {
  if (!qtd) return texto;
  let s = texto;
  s = s.replace(/(?<!\p{L})(?:um|uma|dois|duas|tr[eê]s|quatro|cinco)\s+(?:kg|kilos?|litros?|unidades?|rolos?|caixas?|pacotes?|pacote|l)(?!\p{L})/giu, ' ');
  s = s.replace(/(?<!\p{L})(?:dois|duas|tr[eê]s|quatro|cinco)(?!\p{L})/giu, ' ');
  const num = qtd.match(/\d+(?:[.,]\d+)?/);
  if (num) {
    const n = escapeRe(num[0]);
    s = s.replace(new RegExp(`(?<!\\p{L})${n}\\s*(?:kg|kilos?|litros?|unidades?|rolos?|caixas?|pacotes?|pacote|l)?(?!\\p{L})`, 'giu'), ' ');
  }
  return limparEspaco(s);
}

function tirarComodo(texto) {
  let s = texto;
  const aliases = COMODOS.flatMap((c) => c.aliases).sort((a, b) => b.length - a.length);
  for (const alias of aliases) {
    const re = new RegExp(`(?:para a|para o|para|na|no|da|do|em|de)\\s+${corpoFlex(alias)}`, 'giu');
    s = s.replace(re, ' ');
  }
  s = s.replace(/(?:para a|para o|para|na|no|da|do)\s+sala(?!\s+de\s|\s+gamer)/giu, ' ');
  return limparEspaco(s);
}

function nomeDoItem(texto, qtd) {
  let nome = tirarComandoLista(texto);
  nome = tirarQuantidade(nome, qtd);
  nome = tirarComodo(nome);
  nome = nome
    .replace(/\b(?:uns|umas|cerca de)\s+/giu, '')
    .replace(/\b(?:r\$\s*)?\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?\s*(?:reais|real)?\b/giu, '')
    .replace(/^(?:de|do|da|o|a|os|as)\s+/i, '');
  nome = limparEspaco(nome);
  if (!nome) nome = texto.trim().slice(0, 80);
  return nome.slice(0, 80);
}

function localDe(texto) {
  const m = texto.match(/\b(?:no|na|em)\s+([^,.]{3,40})/i);
  if (!m) return '';
  const local = m[1].trim();
  if (/^(hoje|amanh[ãa]|ontem|segunda|ter[cç]a|quarta|quinta|sexta|s[aá]bado|domingo)\b/i.test(local)) return '';
  return local;
}

function tituloTarefa(texto) {
  const limpo = texto
    .replace(/^(?:por favor[, ]+)?(?:me\s+)?(?:lembrete|lembra(?:r)?(?:\s+de)?|n[aã]o\s+esquecer(?:\s+de)?|tenho\s+que|preciso\s+fazer|cria(?:r)?(?:\s+uma)?\s+tarefa(?:\s+para)?|abre(?:\s+a[ií])?(?:\s+uma)?\s+tarefa)\s*/i, '')
    .replace(/^(?:de|do|da|para|pra)\s+/i, '')
    .trim();
  return (limpo || texto.trim()).slice(0, 120);
}

function encontrarCsmt(texto) {
  const hay = normalizar(texto);
  const achados = [];
  for (const termo of TERMOS_CSMT) {
    if (temPalavra(hay, termo)) achados.push(termo);
  }
  return [...new Set(achados)];
}

function reescreverCsmt(texto) {
  if (!texto) return texto;
  let out = texto;
  const termos = [...TERMOS_CSMT].sort((a, b) => b.length - a.length);
  for (const termo of termos) {
    out = out.replace(regexPalavra(termo, 'giu'), 'CSMT');
  }
  return out;
}

function aplicarCsmt(payload) {
  const titulo = String(payload.titulo ?? '');
  const descricao = String(payload.descricao ?? '');
  const local = String(payload.local ?? '');
  const termos = [...new Set([...encontrarCsmt(titulo), ...encontrarCsmt(descricao), ...encontrarCsmt(local)])];
  if (!termos.length) return { ...payload, csmt: { aplicado: false, termos: [] } };
  return {
    ...payload,
    titulo: reescreverCsmt(titulo),
    descricao: reescreverCsmt(descricao),
    ...(payload.local != null ? { local: reescreverCsmt(local) } : {}),
    csmt: { aplicado: true, termos },
  };
}

/**
 * @param {string} texto
 * @param {Date} [agora]
 */
export function classificar(texto, agora = new Date()) {
  const bruto = String(texto || '').trim();
  const hay = normalizar(bruto);
  const valor = extrairValor(bruto);
  const data = extrairData(bruto, agora);
  const hora = extrairHora(bruto);
  const qtd = extrairQuantidade(bruto);
  const { ambiente, ambiguo } = acharComodo(bruto);

  const eLista = algum(hay, [
    'lista de compras', 'lista', 'adicionar', 'adiciona', 'adicionar na lista',
    'colocar', 'coloca', 'poe', 'põe', 'botar', 'bota', 'anotar', 'anota',
    'incluir', 'inclui', 'na lista', 'preciso de', 'precisamos de', 'preciso comprar',
    'compra de', 'comprar', 'falta', 'faltam', 'faltou', 'acabou', 'acabaram',
  ]);
  const verboGasto = algum(hay, [
    'gastei', 'gastamos', 'paguei', 'pagamos', 'custou', 'despesa', 'nota fiscal',
    'comprei', 'compramos', 'boleto', 'pix', 'debitou', 'no cartão', 'no cartao',
  ]);
  const eGasto = verboGasto || (valor !== null && !eLista);
  const eCompromisso = algum(hay, [
    'compromisso', 'reunião', 'reuniao', 'pauta', 'agenda', 'agendar', 'agendei',
    'encontro', 'horário', 'horario', 'marcar', 'consulta', 'dentista', 'médico', 'medico',
    'videochamada',
  ]) || (hora !== null && algum(hay, ['com o', 'com a', 'no escritório', 'no escritorio', 'na sede']));
  const eTarefa = algum(hay, [
    'tarefa', 'prazo', 'lembrete', 'lembrar', 'lembra', 'não esquecer', 'nao esquecer',
    'tenho que', 'preciso fazer', 'pendência', 'pendencia', 'a fazer',
    'criar uma tarefa', 'cria uma tarefa', 'abre uma tarefa',
  ]);

  const sinais = [eGasto, eLista, eCompromisso, eTarefa].filter(Boolean);
  if (sinais.length > 1) {
    const candidatos = [];
    if (eTarefa) candidatos.push('klain-tarefa');
    if (eCompromisso) candidatos.push('klain-compromisso');
    if (eGasto) candidatos.push('apto-gasto');
    if (eLista) candidatos.push('compras-item');
    return {
      tipo: 'indefinido',
      status: 'para o BOSS',
      payload: { motivo: 'A fala combina mais de um tipo.', candidatos },
    };
  }
  if (sinais.length === 0) {
    return {
      tipo: 'indefinido',
      status: 'para o BOSS',
      payload: { motivo: 'Não deu para classificar com segurança.', candidatos: [] },
    };
  }

  if (eGasto) {
    return {
      tipo: 'apto-gasto',
      status: 'aguardando você',
      payload: {
        titulo: bruto.slice(0, 120),
        valor,
        data: data ?? dataSP(agora),
        ambiente,
        comodo_incerto: ambiguo || !ambiente,
      },
    };
  }

  if (eLista) {
    return {
      tipo: 'compras-item',
      status: 'aguardando você',
      payload: {
        nome: nomeDoItem(bruto, qtd),
        ambiente,
        quantidade: qtd,
        valor_estimado: valor,
        comodo_incerto: ambiguo || !ambiente,
      },
    };
  }

  if (eCompromisso) {
    const quando = data ? (hora ? `${data}T${hora}:00` : data) : (hora ? `${dataSP(agora)}T${hora}:00` : null);
    return {
      tipo: 'klain-compromisso',
      status: 'aguardando você',
      payload: {
        titulo: bruto.slice(0, 120),
        descricao: bruto,
        data_hora: quando,
        local: localDe(bruto),
      },
    };
  }

  return {
    tipo: 'klain-tarefa',
    status: 'aguardando você',
    payload: {
      titulo: tituloTarefa(bruto),
      descricao: bruto,
      vencimento: data,
    },
  };
}

/** Classifica e, em item do Hub, troca palavra de casamento pela sigla. */
export function montarEntrada(texto, agora = new Date()) {
  const r = classificar(texto, agora);
  if (r.tipo === 'klain-tarefa' || r.tipo === 'klain-compromisso') {
    return { ...r, payload: aplicarCsmt(r.payload) };
  }
  return r;
}
