import { FUNCAO_DECIDIR, FUNCAO_ENTRADA } from './config.js';
import {
  COMODOS, DECISOES, TIPOS, emAberto, normalizarPessoas, payloadCanonico, chaveProibida,
} from './contrato.js';
import { exigeAprovacao, gravarPrefs, lerPrefs } from './prefs.js';

const COLUNAS_ITEM = 'id, origem, tipo, transcricao, payload, status, decidido_em, ref_tabela, ref_id, teste, created_at';
const COLUNAS_PESSOA = 'id, nome, papel, usos, padrao, ativo, created_at, updated_at';
/** Lista do supermercado: tabela lista_itens, na lista de tipo "mercado". */
const COLUNAS_COMPRA = 'id, lista_id, texto, qtd, categoria, preco, comprado, created_at';

/** A tela usa nome, ambiente (a seção), quantidade e valor_estimado. */
function compraDaLinha(l) {
  return {
    id: l.id,
    lista_id: l.lista_id,
    nome: l.texto,
    ambiente: l.categoria || 'Outros',
    quantidade: l.qtd || null,
    valor_estimado: l.preco ?? null,
    comprado: !!l.comprado,
    created_at: l.created_at,
  };
}
const RASCUNHOS_KEY = 'copiloto_rascunhos';
/** Cópia local da biblioteca: fica no cache do app, que assim abre sem rede. */
const BIBLIOTECA = new URL('../vendor/supabase-js-2.119.0.js', import.meta.url).href;

function urlOk(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && u.hostname.endsWith('.supabase.co');
  } catch {
    return false;
  }
}

function carregarBiblioteca() {
  if (globalThis.supabase?.createClient) return Promise.resolve(globalThis.supabase);
  return new Promise((ok, falha) => {
    const s = document.createElement('script');
    s.src = BIBLIOTECA;
    s.onload = () => {
      if (globalThis.supabase?.createClient) ok(globalThis.supabase);
      else falha(new Error('A biblioteca do Supabase carregou incompleta.'));
    };
    s.onerror = () => falha(new Error('Não deu para carregar a biblioteca do Supabase.'));
    document.head.appendChild(s);
  });
}

function lerRascunhos() {
  try {
    const o = JSON.parse(localStorage.getItem(RASCUNHOS_KEY) || '{}');
    return new Map(Object.entries(o && typeof o === 'object' ? o : {}));
  } catch {
    return new Map();
  }
}

/**
 * Lê como o usuário logado (JWT). Não usa anon nem service_role.
 * Decisão só pela função copiloto-decidir, que confere o JWT.
 * copiloto-entrada recebe o mesmo JWT. A chave do Atalho não sai do servidor.
 */
export async function criarAdaptadorSupabase({ url, key }) {
  const motivo = chaveProibida(key);
  if (motivo) {
    throw new Error(motivo === 'anon' || motivo === 'service_role'
      ? 'Esta chave é anon ou service_role. O Copiloto só aceita a chave publicável, e entra com o login do Diego.'
      : 'A chave não é uma chave publicável (sb_publishable_…). Nada foi conectado.');
  }
  if (!urlOk(url)) throw new Error('A URL do projeto precisa ser https e terminar em .supabase.co.');

  const { createClient } = await carregarBiblioteca();
  const sb = createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  });

  /** Edições feitas antes de decidir. Ficam no aparelho e sobrevivem a recarregar a página. */
  const rascunhos = lerRascunhos();
  /** Última leitura da fila, como veio do banco. Evita uma consulta a cada campo editado. */
  let filaCrua = [];
  let listaId = null;

  function gravarRascunhos() {
    try {
      localStorage.setItem(RASCUNHOS_KEY, JSON.stringify(Object.fromEntries(rascunhos)));
    } catch { /* segue na memória */ }
  }

  function largarRascunho(id) {
    if (rascunhos.delete(id)) gravarRascunhos();
  }

  async function exigirSessao() {
    const { data } = await sb.auth.getSession();
    if (!data.session) {
      const erro = new Error('Entre com a conta do Diego para ler a fila.');
      erro.codigo = 'sem-sessao';
      throw erro;
    }
    return data.session;
  }

  function mesclar(item) {
    const pessoasBanco = (item.payload && item.payload.pessoas) || {};
    const r = rascunhos.get(item.id);
    if (!r || !emAberto(item.status)) return { ...item, pessoas: item.pessoas || pessoasBanco, notas: item.notas || '' };
    const tipo = r.tipo || item.tipo;
    return {
      ...item,
      tipo,
      payload: payloadCanonico(tipo, { ...item.payload, ...(r.payload || {}) }),
      pessoas: r.pessoas ? normalizarPessoas(r.pessoas) : pessoasBanco,
      notas: r.notas ?? item.notas ?? '',
    };
  }

  /** Tira os rascunhos de itens que já foram decididos ou saíram da fila. */
  function podarRascunhos() {
    const abertos = new Set(filaCrua.filter((i) => emAberto(i.status)).map((i) => i.id));
    let mudou = false;
    for (const id of [...rascunhos.keys()]) {
      if (!abertos.has(id)) { rascunhos.delete(id); mudou = true; }
    }
    if (mudou) gravarRascunhos();
  }

  async function idDaLista() {
    if (listaId) return listaId;
    const { data, error } = await sb.from('listas').select('id').eq('tipo', 'mercado').order('created_at').limit(1);
    if (error) throw new Error(error.message);
    const mercado = (data || [])[0];
    if (!mercado) throw new Error('Esta conta não vê a lista do supermercado.');
    listaId = mercado.id;
    return listaId;
  }

  async function corpoDoErro(error) {
    try {
      if (error.context && typeof error.context.json === 'function') return await error.context.json();
    } catch { /* corpo vazio */ }
    return null;
  }

  return {
    nome: 'supabase',
    exemplo: false,
    comodos: COMODOS,
    prefs() { return lerPrefs(); },
    definirPrefs(parcial) { return gravarPrefs(parcial); },
    exigeAprovacao(tipo) { return exigeAprovacao(tipo, lerPrefs()); },

    async sessao() {
      const { data } = await sb.auth.getSession();
      return data.session;
    },

    async entrar(email, senha) {
      const { data, error } = await sb.auth.signInWithPassword({ email: String(email || '').trim(), password: senha || '' });
      if (error) throw new Error(error.message);
      return data.session;
    },

    async sair() {
      await sb.auth.signOut();
      rascunhos.clear();
      gravarRascunhos();
      filaCrua = [];
      listaId = null;
    },

    /** Com { local: true } devolve a última leitura já com os rascunhos, sem ir à rede. */
    async listarItens(opcoes) {
      if (opcoes && opcoes.local) return { itens: filaCrua.map(mesclar), erro: null };
      try {
        await exigirSessao();
      } catch (e) {
        return { itens: [], erro: e.message, codigo: e.codigo || 'auth' };
      }
      const { data, error } = await sb.from('copiloto_itens').select(COLUNAS_ITEM).order('created_at', { ascending: false }).limit(200);
      if (error) {
        return { itens: [], erro: `${error.message} A leitura usa o login, sem chave de serviço. Se a policy ainda não existe, a fila fica fechada.` };
      }
      filaCrua = data || [];
      podarRascunhos();
      return { itens: filaCrua.map(mesclar), erro: null };
    },

    async listarPessoas() {
      try {
        await exigirSessao();
      } catch (e) {
        return { pessoas: [], erro: e.message, exemplo: false };
      }
      const { data, error } = await sb.from('hub_pessoas').select(COLUNAS_PESSOA).eq('ativo', true).order('nome');
      if (error) return { pessoas: [], erro: error.message, exemplo: false };
      return { pessoas: data || [], erro: null, exemplo: false };
    },

    async listarCompras() {
      try {
        await exigirSessao();
        const lista = await idDaLista();
        const { data, error } = await sb.from('lista_itens').select(COLUNAS_COMPRA).eq('lista_id', lista).order('created_at');
        if (error) return { compras: [], erro: error.message };
        return { compras: (data || []).map(compraDaLinha), erro: null };
      } catch (e) {
        return { compras: [], erro: e.message };
      }
    },

    /**
     * Guarda a edição como rascunho, no aparelho. Não vai à rede: quem garante
     * que a primeira decisão vale é a função copiloto-decidir.
     */
    async atualizar(id, patch) {
      let atual = filaCrua.find((i) => i.id === id);
      if (!atual) {
        const { data, error } = await sb.from('copiloto_itens').select(COLUNAS_ITEM).eq('id', id).maybeSingle();
        if (error) return { ok: false, motivo: 'erro', mensagem: error.message };
        if (!data) return { ok: false, motivo: 'sumiu' };
        atual = data;
        filaCrua = [data, ...filaCrua];
      }
      if (!emAberto(atual.status)) {
        largarRascunho(id);
        return { ok: false, jaDecidido: true, status: atual.status };
      }
      const prev = rascunhos.get(id) || {};
      const tipo = patch.tipo && TIPOS.includes(patch.tipo) ? patch.tipo : (prev.tipo || atual.tipo);
      const pessoasBase = prev.pessoas || (atual.payload && atual.payload.pessoas) || {};
      rascunhos.set(id, {
        tipo,
        payload: payloadCanonico(tipo, { ...atual.payload, ...(prev.payload || {}), ...(patch.payload || {}) }),
        pessoas: patch.pessoas ? normalizarPessoas({ ...normalizarPessoas(pessoasBase), ...patch.pessoas }) : prev.pessoas,
        notas: Object.prototype.hasOwnProperty.call(patch, 'notas') ? patch.notas : prev.notas,
      });
      gravarRascunhos();
      return { ok: true };
    },

    async decidir(id, decisao, patch) {
      if (!DECISOES.includes(decisao)) return { ok: false, motivo: 'decisao' };
      let session;
      try {
        session = await exigirSessao();
      } catch (e) {
        return { ok: false, motivo: 'auth', mensagem: e.message };
      }
      const salvo = await this.atualizar(id, patch || {});
      if (!salvo.ok) return salvo;
      const r = rascunhos.get(id) || {};
      if (decisao === 'aprovado' && (r.tipo || patch?.tipo) === 'indefinido') {
        return { ok: false, motivo: 'tipo' };
      }
      const { data, error } = await sb.functions.invoke(FUNCAO_DECIDIR, {
        body: {
          id,
          decisao,
          tipo: r.tipo,
          payload: r.payload,
          pessoas: normalizarPessoas(r.pessoas || {}),
        },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) {
        const corpo = await corpoDoErro(error);
        if (corpo?.jaDecidido) {
          largarRascunho(id);
          return { ok: false, jaDecidido: true, status: corpo.status };
        }
        const detalhe = corpo?.erro || error.message || 'A função copiloto-decidir não respondeu.';
        return { ok: false, motivo: 'funcao', mensagem: `${detalhe} Nada foi gravado direto na tabela.` };
      }
      if (data?.jaDecidido) {
        largarRascunho(id);
        return { ok: false, jaDecidido: true, status: data.status };
      }
      if (data && data.ok === false) {
        if (data.status === 'erro') largarRascunho(id);
        return { ok: false, motivo: 'funcao', mensagem: data.erro || 'A função recusou a decisão.' };
      }
      largarRascunho(id);
      return { ok: true, status: data?.status || decisao };
    },

    async adicionarCompra({ nome, ambiente }) {
      const texto = String(nome || '').trim();
      if (!texto) return { ok: false, motivo: 'vazio' };
      try {
        const session = await exigirSessao();
        const lista = await idDaLista();
        const { data, error } = await sb.from('lista_itens').insert({
          lista_id: lista,
          texto,
          categoria: ambiente || 'Outros',
          adicionado_por: session.user.id,
        }).select(COLUNAS_COMPRA).single();
        if (error) return { ok: false, mensagem: error.message };
        return { ok: true, compra: compraDaLinha(data) };
      } catch (e) {
        return { ok: false, mensagem: e.message };
      }
    },

    /** Quem chama já sabe o estado atual: uma gravação só, sem ler antes. */
    async alternarCompra(id, compradoAgora) {
      try {
        await exigirSessao();
        let atual = compradoAgora;
        if (typeof atual !== 'boolean') {
          const { data, error: leitura } = await sb.from('lista_itens').select('comprado').eq('id', id).maybeSingle();
          if (leitura) return { ok: false, mensagem: leitura.message };
          if (!data) return { ok: false, motivo: 'sumiu' };
          atual = !!data.comprado;
        }
        const { error } = await sb.from('lista_itens').update({ comprado: !atual }).eq('id', id);
        if (error) return { ok: false, mensagem: error.message };
        return { ok: true, comprado: !atual };
      } catch (e) {
        return { ok: false, mensagem: e.message };
      }
    },

    async restaurar() {
      return { ok: false, motivo: 'supabase' };
    },

    /** Manda o texto com a área do chip e a preferência "Passar por aprovação". */
    async enviarTexto(texto) {
      const limpo = String(texto || '').trim();
      if (!limpo) return { ok: false, mensagem: 'Escreva ou fale o que quer enviar.' };
      let session;
      try {
        session = await exigirSessao();
      } catch (e) {
        return { ok: false, mensagem: e.message };
      }
      const prefs = lerPrefs();
      const body = { texto: limpo, origem: 'pwa', aprovar: prefs.aprovar };
      if (prefs.area !== 'auto') body.area = prefs.area;
      const { data, error } = await sb.functions.invoke(FUNCAO_ENTRADA, {
        body,
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) {
        const corpo = await corpoDoErro(error);
        return { ok: false, mensagem: corpo?.erro || error.message || 'A função copiloto-entrada não respondeu.' };
      }
      if (data && data.ok === false) return { ok: false, mensagem: data.erro || 'A função recusou o texto.' };
      return { ok: true, id: data?.id, tipo: data?.tipo, status: data?.status, aviso: data?.aviso };
    },
  };
}
