import {
  COMODOS, DECISOES, TIPOS, emAberto, normalizarPessoas, payloadCanonico, soCsmt,
} from './contrato.js';
import { exigeAprovacao, gravarPrefs, lerPrefs } from './prefs.js';

const CHAVE = 'copiloto_mock_v3';

const QUANDO = '2026-11-01T12:00:00-03:00';

export const PESSOAS_EXEMPLO = [
  { id: 'g-compras', nome: 'Compras', papel: 'grupo', usos: ['solicitante', 'executor'], padrao: false, ativo: true, created_at: QUANDO, updated_at: QUANDO },
  { id: 'g-pcp', nome: 'PCP', papel: 'grupo', usos: ['solicitante', 'executor'], padrao: false, ativo: true, created_at: QUANDO, updated_at: QUANDO },
  { id: 'g-qualidade', nome: 'Qualidade', papel: 'grupo', usos: ['solicitante', 'executor'], padrao: false, ativo: true, created_at: QUANDO, updated_at: QUANDO },
  { id: 'p-everaldo', nome: 'Everaldo Oliveira', papel: 'Comercial', usos: null, padrao: false, ativo: true, created_at: QUANDO, updated_at: QUANDO },
  { id: 'p-diego', nome: 'Diego Konrad', papel: 'Direção', usos: null, padrao: true, ativo: true, created_at: QUANDO, updated_at: QUANDO },
  { id: 'p-tamires', nome: 'Tamires Hübner', papel: 'Qualidade', usos: null, padrao: false, ativo: true, created_at: QUANDO, updated_at: QUANDO },
  { id: 'p-guilherme', nome: 'Guilherme Rex', papel: 'T.I.', usos: null, padrao: false, ativo: true, created_at: QUANDO, updated_at: QUANDO },
];

function itemBase(parcial) {
  return {
    origem: 'exemplo',
    teste: true,
    decidido_em: null,
    ref_tabela: null,
    ref_id: null,
    pessoas: {},
    notas: '',
    ...parcial,
  };
}

export function estadoExemplo() {
  return {
    itens: [
      itemBase({
        id: 'ex-gasto',
        tipo: 'apto-gasto',
        transcricao: 'Gasto 186 no mercado',
        status: 'aguardando você',
        created_at: '2026-11-13T09:14:00-03:00',
        payload: payloadCanonico('apto-gasto', {
          titulo: 'Mercado do mês',
          valor: 186,
          data: '2026-11-13',
          ambiente: 'Cozinha',
          comodo_incerto: false,
        }),
      }),
      itemBase({
        id: 'ex-tarefa',
        tipo: 'klain-tarefa',
        transcricao: 'Revisar pesquisa do casamento com o comitê',
        status: 'aguardando você',
        created_at: '2026-11-13T08:40:00-03:00',
        pessoas: {
          solicitante: 'p-diego',
          executor: 'p-guilherme',
          em_copia: ['p-tamires', 'p-everaldo', 'p-guilherme'],
        },
        payload: payloadCanonico('klain-tarefa', {
          titulo: 'Revisar a pesquisa do CSMT com o comitê',
          descricao: 'Levar os preços e gramagens para a reunião.',
          vencimento: '2026-11-17',
          csmt: { aplicado: true, termos: ['casamento'] },
        }),
      }),
      itemBase({
        id: 'ex-boss',
        tipo: 'indefinido',
        transcricao: 'Compra e tarefa ao mesmo tempo (exemplo)',
        status: 'para o BOSS',
        created_at: '2026-11-13T08:30:00-03:00',
        payload: payloadCanonico('indefinido', {
          motivo: 'A fala combina mais de um tipo.',
          candidatos: ['klain-tarefa', 'compras-item'],
        }),
      }),
      itemBase({
        id: 'ex-leite',
        tipo: 'compras-item',
        transcricao: 'Leite e pão na lista',
        status: 'aguardando você',
        created_at: '2026-11-13T08:12:00-03:00',
        notas: 'Integral',
        payload: payloadCanonico('compras-item', {
          nome: 'Leite',
          ambiente: 'Laticínios e frios',
          quantidade: '2 L',
          valor_estimado: 12,
          comodo_incerto: false,
        }),
      }),
      itemBase({
        id: 'ex-compromisso',
        tipo: 'klain-compromisso',
        transcricao: 'Alinhamento com o comitê do CSMT',
        status: 'aguardando você',
        created_at: '2026-11-13T08:05:00-03:00',
        pessoas: { participantes: ['p-diego', 'p-guilherme'] },
        payload: payloadCanonico('klain-compromisso', {
          titulo: 'Alinhamento com o comitê do CSMT',
          descricao: 'Revisar os pontos da pauta e os prazos.',
          data_hora: '2026-11-13T14:00:00',
          local: 'Sala de reuniões',
          csmt: { aplicado: false, termos: [] },
        }),
      }),
      itemBase({
        id: 'ex-aprovado',
        tipo: 'compras-item',
        transcricao: 'Pão na lista',
        status: 'aprovado',
        created_at: '2026-11-12T18:22:00-03:00',
        decidido_em: '2026-11-12T18:40:00-03:00',
        payload: payloadCanonico('compras-item', {
          nome: 'Pão',
          ambiente: 'Padaria',
          quantidade: null,
          valor_estimado: null,
          comodo_incerto: false,
        }),
      }),
      itemBase({
        id: 'ex-criado',
        tipo: 'apto-gasto',
        transcricao: 'Almoço',
        status: 'criado',
        created_at: '2026-11-12T13:05:00-03:00',
        decidido_em: '2026-11-12T13:20:00-03:00',
        ref_tabela: 'apto_propostas',
        payload: payloadCanonico('apto-gasto', {
          titulo: 'Almoço',
          valor: 48.9,
          data: '2026-11-12',
          ambiente: 'Apartamento',
          comodo_incerto: false,
        }),
      }),
      itemBase({
        id: 'ex-recusado',
        tipo: 'apto-gasto',
        transcricao: 'Agendar medição da cortina',
        status: 'recusado',
        created_at: '2026-11-11T10:02:00-03:00',
        decidido_em: '2026-11-11T10:15:00-03:00',
        payload: payloadCanonico('apto-gasto', {
          titulo: 'Agendar medição da cortina',
          valor: null,
          data: '2026-11-11',
          ambiente: 'Sala de Estar',
          comodo_incerto: false,
        }),
      }),
      itemBase({
        id: 'ex-erro',
        tipo: 'klain-tarefa',
        transcricao: 'Não entendi o áudio (exemplo)',
        status: 'erro',
        created_at: '2026-11-10T09:00:00-03:00',
        decidido_em: '2026-11-10T09:05:00-03:00',
        payload: payloadCanonico('klain-tarefa', {
          titulo: 'Não entendi o áudio (exemplo)',
          descricao: 'A transcrição veio vazia.',
          vencimento: null,
          csmt: { aplicado: false, termos: [] },
        }),
      }),
    ],
    compras: [
      { id: 'c-leite', lista_id: 'lista-exemplo', nome: 'Leite', ambiente: 'Laticínios e frios', quantidade: '2 L', valor_estimado: 12, descricao: 'Integral', comprado: false, ordem: 0, created_at: '2026-11-13T08:12:00-03:00' },
      { id: 'c-pao', lista_id: 'lista-exemplo', nome: 'Pão', ambiente: 'Padaria', quantidade: null, valor_estimado: null, descricao: '', comprado: false, ordem: 1, created_at: '2026-11-13T08:12:00-03:00' },
      { id: 'c-lamp', lista_id: 'lista-exemplo', nome: 'Detergente', ambiente: 'Limpeza', quantidade: null, valor_estimado: null, descricao: '', comprado: false, ordem: 0, created_at: '2026-11-12T11:00:00-03:00' },
      { id: 'c-sabao', lista_id: 'lista-exemplo', nome: 'Sabão em pó', ambiente: 'Limpeza', quantidade: null, valor_estimado: null, descricao: '', comprado: true, ordem: 0, created_at: '2026-11-11T09:00:00-03:00' },
    ],
  };
}

function memoria() {
  const caixa = { json: null };
  return {
    ler() {
      return caixa.json ? JSON.parse(caixa.json) : null;
    },
    gravar(estado) {
      caixa.json = JSON.stringify(estado);
    },
  };
}

function navegador() {
  return {
    ler() {
      try {
        const cru = localStorage.getItem(CHAVE);
        return cru ? JSON.parse(cru) : null;
      } catch {
        return null;
      }
    },
    gravar(estado) {
      localStorage.setItem(CHAVE, JSON.stringify(estado));
    },
  };
}

function aplicarPatch(item, patch) {
  const tipo = patch.tipo && TIPOS.includes(patch.tipo) ? patch.tipo : item.tipo;
  if (tipo !== item.tipo) {
    const base = {
      titulo: item.payload?.titulo || soCsmt(item.transcricao || ''),
      nome: item.payload?.nome || soCsmt(item.transcricao || ''),
      descricao: item.transcricao || '',
      ...item.payload,
      ...(patch.payload || {}),
    };
    item.tipo = tipo;
    item.payload = payloadCanonico(tipo, base);
  } else if (patch.payload) {
    item.payload = payloadCanonico(item.tipo, { ...item.payload, ...patch.payload });
  }
  if (patch.pessoas) item.pessoas = normalizarPessoas({ ...(item.pessoas || {}), ...patch.pessoas });
  if (Object.prototype.hasOwnProperty.call(patch, 'notas')) item.notas = patch.notas || '';
}

function porNaLista(estado, item) {
  const p = item.payload || {};
  const nome = (p.nome || '').trim();
  if (!nome) return;
  const ambiente = p.ambiente || 'Outros';
  const ja = estado.compras.some((c) => c.nome.toLocaleLowerCase('pt-BR') === nome.toLocaleLowerCase('pt-BR') && c.ambiente === ambiente && !c.comprado);
  if (ja) return;
  estado.compras.push({
    id: `c-${item.id}`,
    lista_id: 'lista-exemplo',
    nome,
    ambiente,
    quantidade: p.quantidade || null,
    valor_estimado: p.valor_estimado,
    descricao: item.notas || '',
    comprado: false,
    ordem: estado.compras.filter((c) => c.ambiente === ambiente).length,
    created_at: new Date().toISOString(),
  });
}

export function criarAdaptadorMock(persistencia) {
  const disco = persistencia || (typeof localStorage === 'undefined' ? memoria() : navegador());

  function ler() {
    const atual = disco.ler();
    if (!atual || !Array.isArray(atual.itens) || !Array.isArray(atual.compras)) {
      const novo = estadoExemplo();
      disco.gravar(novo);
      return novo;
    }
    return atual;
  }

  function gravar(estado) {
    disco.gravar(estado);
  }

  return {
    nome: 'mock',
    exemplo: true,
    comodos: COMODOS,

    async sessao() {
      return { exemplo: true };
    },

    async listarItens() {
      return { itens: ler().itens, erro: null };
    },

    async listarPessoas() {
      return { pessoas: PESSOAS_EXEMPLO.filter((p) => p.ativo), erro: null, exemplo: true };
    },

    async listarCompras() {
      return { compras: ler().compras, erro: null };
    },

    async atualizar(id, patch) {
      const estado = ler();
      const item = estado.itens.find((i) => i.id === id);
      if (!item) return { ok: false, motivo: 'sumiu' };
      if (!emAberto(item.status)) return { ok: false, jaDecidido: true, status: item.status };
      aplicarPatch(item, patch || {});
      gravar(estado);
      return { ok: true, item };
    },

    async decidir(id, decisao, patch) {
      if (!DECISOES.includes(decisao)) return { ok: false, motivo: 'decisao' };
      const estado = ler();
      const item = estado.itens.find((i) => i.id === id);
      if (!item) return { ok: false, motivo: 'sumiu' };
      if (!emAberto(item.status)) return { ok: false, jaDecidido: true, status: item.status };
      if (patch) aplicarPatch(item, patch);
      if (decisao === 'aprovado' && item.tipo === 'indefinido') {
        gravar(estado);
        return { ok: false, motivo: 'tipo' };
      }
      item.status = decisao;
      item.decidido_em = new Date().toISOString();
      if (decisao === 'aprovado' && item.tipo === 'compras-item') porNaLista(estado, item);
      gravar(estado);
      return { ok: true, status: decisao };
    },

    async adicionarCompra({ nome, ambiente }) {
      const texto = String(nome || '').trim();
      if (!texto) return { ok: false, motivo: 'vazio' };
      const estado = ler();
      estado.compras.push({
        id: `c-${Date.now()}`,
        lista_id: 'lista-exemplo',
        nome: texto,
        ambiente: ambiente || 'Outros',
        quantidade: null,
        valor_estimado: null,
        descricao: '',
        comprado: false,
        ordem: estado.compras.filter((c) => c.ambiente === ambiente).length,
        created_at: new Date().toISOString(),
      });
      gravar(estado);
      return { ok: true };
    },

    async alternarCompra(id) {
      const estado = ler();
      const item = estado.compras.find((c) => c.id === id);
      if (!item) return { ok: false };
      item.comprado = !item.comprado;
      gravar(estado);
      return { ok: true, comprado: item.comprado };
    },

    prefs() { return lerPrefs(); },
    definirPrefs(parcial) { return gravarPrefs(parcial); },
    exigeAprovacao(tipo) { return exigeAprovacao(tipo, lerPrefs()); },

    /** Simula a chegada de um item. Não chama a rede: o Atalho é quem posta. */
    async simularChegada(transcricao) {
      const estado = ler();
      const prefs = lerPrefs();
      const texto = (transcricao || 'Lembrete de voz (exemplo)').trim();
      const area = prefs.area;
      let tipo = 'indefinido';
      let payload = payloadCanonico('indefinido', {
        motivo: 'Exemplo local. No iPhone, quem envia é o Atalho.',
        candidatos: [],
      });
      if (area === 'hub') {
        tipo = 'klain-tarefa';
        payload = payloadCanonico('klain-tarefa', { titulo: texto, descricao: texto, vencimento: null });
      } else if (area === 'apto') {
        tipo = 'apto-gasto';
        payload = payloadCanonico('apto-gasto', { titulo: texto, valor: null, data: null, ambiente: null, comodo_incerto: true });
      } else if (area === 'compras') {
        tipo = 'compras-item';
        payload = payloadCanonico('compras-item', { nome: texto, ambiente: null, quantidade: null, valor_estimado: null, comodo_incerto: true });
      }
      const espera = exigeAprovacao(tipo, prefs);
      const id = `voz-${Date.now()}`;
      const item = itemBase({
        id,
        tipo,
        transcricao: texto,
        status: espera ? (tipo === 'indefinido' ? 'para o BOSS' : 'aguardando você') : 'aprovado',
        decidido_em: espera ? null : new Date().toISOString(),
        created_at: new Date().toISOString(),
        payload,
      });
      estado.itens.push(item);
      if (!espera && tipo === 'compras-item') porNaLista(estado, item);
      gravar(estado);
      return { ok: true, id, status: item.status };
    },

    async restaurar() {
      disco.gravar(estadoExemplo());
      return { ok: true };
    },
  };
}
