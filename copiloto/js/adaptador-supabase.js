import { FUNCAO_DECIDIR, FUNCAO_ENTRADA } from './config.js';
import {
  COMODOS, DECISOES, TIPOS, emAberto, normalizarPessoas, payloadCanonico, chaveProibida,
} from './contrato.js';
import { exigeAprovacao, gravarPrefs, lerPrefs } from './prefs.js';

const COLUNAS_ITEM = 'id, origem, tipo, transcricao, payload, status, decidido_em, ref_tabela, ref_id, teste, created_at';
const COLUNAS_PESSOA = 'id, nome, papel, usos, padrao, ativo, created_at, updated_at';
const COLUNAS_PROPOSTA = 'id, lista_id, nome, ambiente, quantidade, valor_estimado, descricao, transcricao, status, copiloto_item_id, item_id, decidido_em, created_at';
const COLUNAS_COMPRA = 'id, lista_id, nome, ambiente, quantidade, valor_estimado, descricao, comprado, ordem, created_at';

function urlOk(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && u.hostname.endsWith('.supabase.co');
  } catch {
    return false;
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

  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.0/+esm');
  const sb = createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  });

  const rascunhos = new Map();
  let listaId = null;

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
    const pessoasBanco = item.payload && item.payload.pessoas;
    const r = rascunhos.get(item.id);
    if (!r || !emAberto(item.status)) return { ...item, pessoas: item.pessoas || pessoasBanco || {}, notas: item.notas || '' };
    return {
      ...item,
      tipo: r.tipo || item.tipo,
      payload: payloadCanonico(r.tipo || item.tipo, { ...item.payload, ...(r.payload || {}) }),
      pessoas: normalizarPessoas({ ...(item.pessoas || {}), ...(r.pessoas || {}) }),
      notas: r.notas ?? item.notas ?? '',
    };
  }

  async function idDaLista() {
    if (listaId) return listaId;
    const { data, error } = await sb.from('listas').select('id, nome, tipo').limit(20);
    if (error) throw new Error(error.message);
    const linhas = data || [];
    const apto = linhas.find((l) => /apto|compra|apart/i.test(`${l.nome || ''} ${l.tipo || ''}`)) || linhas[0];
    if (!apto) throw new Error('Nenhuma lista visível para esta conta.');
    listaId = apto.id;
    return listaId;
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
    },

    async listarItens() {
      try {
        await exigirSessao();
      } catch (e) {
        return { itens: [], erro: e.message, codigo: e.codigo || 'auth' };
      }
      const { data, error } = await sb.from('copiloto_itens').select(COLUNAS_ITEM).order('created_at', { ascending: false }).limit(200);
      if (error) {
        return { itens: [], erro: `${error.message} A leitura usa o login, sem chave de serviço. Se a policy ainda não existe, a fila fica fechada.` };
      }
      return { itens: (data || []).map(mesclar), erro: null };
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
        const { data, error } = await sb.from('apto_compras_itens').select(COLUNAS_COMPRA).eq('lista_id', lista).order('ordem');
        if (error) return { compras: [], erro: error.message };
        return { compras: data || [], erro: null };
      } catch (e) {
        return { compras: [], erro: e.message };
      }
    },

    async atualizar(id, patch) {
      const { data: atual, error } = await sb.from('copiloto_itens').select('id, status, tipo, payload').eq('id', id).maybeSingle();
      if (error) return { ok: false, motivo: 'erro', mensagem: error.message };
      if (!atual) return { ok: false, motivo: 'sumiu' };
      if (!emAberto(atual.status)) {
        rascunhos.delete(id);
        return { ok: false, jaDecidido: true, status: atual.status };
      }
      const prev = rascunhos.get(id) || {};
      const tipo = patch.tipo && TIPOS.includes(patch.tipo) ? patch.tipo : (prev.tipo || atual.tipo);
      rascunhos.set(id, {
        tipo,
        payload: payloadCanonico(tipo, { ...atual.payload, ...(prev.payload || {}), ...(patch.payload || {}) }),
        pessoas: normalizarPessoas({ ...(atual.pessoas || {}), ...(prev.pessoas || {}), ...(patch.pessoas || {}) }),
        notas: Object.prototype.hasOwnProperty.call(patch, 'notas') ? patch.notas : prev.notas,
      });
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
        let detalhe = error.message || 'A função copiloto-decidir não respondeu.';
        try {
          if (error.context && typeof error.context.json === 'function') {
            const corpo = await error.context.json();
            if (corpo?.jaDecidido) {
              rascunhos.delete(id);
              return { ok: false, jaDecidido: true, status: corpo.status };
            }
            if (corpo?.erro) detalhe = corpo.erro;
          }
        } catch { /* corpo vazio */ }
        return { ok: false, motivo: 'funcao', mensagem: `${detalhe} Nada foi gravado direto na tabela.` };
      }
      if (data?.jaDecidido) {
        rascunhos.delete(id);
        return { ok: false, jaDecidido: true, status: data.status };
      }
      if (data && data.ok === false) {
        return { ok: false, motivo: 'funcao', mensagem: data.erro || 'A função recusou a decisão.' };
      }
      rascunhos.delete(id);
      return { ok: true, status: data?.status || decisao };
    },

    async adicionarCompra({ nome, ambiente }) {
      const texto = String(nome || '').trim();
      if (!texto) return { ok: false, motivo: 'vazio' };
      try {
        await exigirSessao();
        const lista = await idDaLista();
        const { error } = await sb.from('apto_compras_itens').insert({
          lista_id: lista,
          nome: texto,
          ambiente: ambiente || 'Apartamento',
        });
        if (error) return { ok: false, mensagem: error.message };
        return { ok: true };
      } catch (e) {
        return { ok: false, mensagem: e.message };
      }
    },

    async alternarCompra(id) {
      try {
        await exigirSessao();
        const { data, error: leitura } = await sb.from('apto_compras_itens').select('comprado').eq('id', id).maybeSingle();
        if (leitura) return { ok: false, mensagem: leitura.message };
        if (!data) return { ok: false, motivo: 'sumiu' };
        const { error } = await sb.from('apto_compras_itens').update({ comprado: !data.comprado }).eq('id', id);
        if (error) return { ok: false, mensagem: error.message };
        return { ok: true, comprado: !data.comprado };
      } catch (e) {
        return { ok: false, mensagem: e.message };
      }
    },

    async propostasDoItem(id) {
      const { data, error } = await sb.from('apto_compras_propostas').select(COLUNAS_PROPOSTA).eq('copiloto_item_id', id);
      if (error) return { propostas: [], erro: error.message };
      return { propostas: data || [], erro: null };
    },

    async restaurar() {
      return { ok: false, motivo: 'supabase' };
    },

    async enviarTexto(texto) {
      const limpo = String(texto || '').trim();
      if (!limpo) return { ok: false, mensagem: 'Escreva ou fale o que quer enviar.' };
      let session;
      try {
        session = await exigirSessao();
      } catch (e) {
        return { ok: false, mensagem: e.message };
      }
      const { data, error } = await sb.functions.invoke(FUNCAO_ENTRADA, {
        body: { texto: limpo, origem: 'pwa' },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) {
        let detalhe = error.message || 'A função copiloto-entrada não respondeu.';
        try {
          if (error.context && typeof error.context.json === 'function') {
            const corpo = await error.context.json();
            if (corpo?.erro) detalhe = corpo.erro;
          }
        } catch { /* corpo vazio */ }
        return { ok: false, mensagem: detalhe };
      }
      if (data && data.ok === false) return { ok: false, mensagem: data.erro || 'A função recusou o texto.' };
      return { ok: true, id: data?.id, tipo: data?.tipo, status: data?.status };
    },
  };
}
