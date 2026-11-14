import { abrirDados } from './dados.js';
import { modoDemo } from './config.js';
import { AVISO_VERSAO, VERSAO, ativarNaHora, mostrarAvisoDeVersao, recarregarPorVersao } from './versao.js';
import {
  COMODOS, SECOES_MERCADO, areaDo, emAberto, fData, fDataHora, fHora, fValor, filtrar, idPadrao, montarListaPessoas,
  normalizarPessoas, ordenarFila, pValor, partesSP, rotuloArea, rotuloDia, rotuloStatus, secaoDoMercado, rotuloTipo, soCsmt, tituloFila,
} from './contrato.js';

const TEMAS = ['claro', 'escuro', 'cafe'];
const TEMA_BS = { claro: 'light', escuro: 'dark', cafe: 'cafe' };
const TEMA_NOME = { claro: 'Claro', escuro: 'Escuro', cafe: 'Café' };
let dados = null;
let modo = 'mock';
let erroBoot = '';
let itens = [];
let pessoas = [];
let pessoasExemplo = false;
let compras = [];
let erroFila = '';
let filtrosAba = { aprovar: { status: '', periodo: '' }, historico: { status: '', periodo: '' } };
let filtroAberto = false;
let areaAberta = false;
let editando = false;
let layoutAtivo = 'gravar';
let arrastou = false;
const LAYOUT_KEY = 'copiloto_layout';
const LAYOUT_PADRAO = { gravar: { x: 0.5, y: 0.655, s: 1 }, area: { x: 0.5, y: 0.82, s: 0.85 } };
let layout = carregarLayout();
const ponteiros = new Map();
let gesto = null;
let toast = '';
let toastTimer = 0;
let segundos = 0;
let timer = null;
let aoVivo = false;
let reconhecimento = null;
let textoFala = '';
let textoParcial = '';
let textoBase = '';
let ocupado = false;
let carregando = false;
let ultimaChecagem = 0;
let pedindoTexto = false;
let versaoNova = false;
let recarregarAoAssumir = false;
let recarregarDepois = false;
let registroSw = null;
let primeiraInstalacao = false;
let folha = null;
let buscaMenu = '';
let ultimaTela = '';
let ultimaFolha = '';
let pularSelo = false;
let secaoAdd = '';
let compradosAbertos = false;
let deslize = null;
let ignorarCliqueAte = 0;
let editandoFundo = false;
const FUNDO_KEY = 'copiloto_fundo';
const FUNDO_IMG_KEY = 'copiloto_fundo_img';
const FUNDO_FOTO_PADRAO = 'assets/fundo-familia.webp';
const FUNDO_PADRAO = { x: 0, y: 0, z: 1, o: 1 };
const FUNDO_ZOOM = [0.5, 4];
let fundo = carregarFundo();
const ROTULO_PERIODO = { hoje: 'Hoje', 7: '7 dias', 30: '30 dias' };
const DESC_TIPO = {
  'klain-tarefa': 'Vira uma tarefa no Hub Klain',
  'klain-compromisso': 'Vira um compromisso no Hub Klain',
  'apto-gasto': 'Vira um gasto do apartamento',
  'compras-item': 'Entra na lista do supermercado',
};

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pose = () => new URLSearchParams(location.search).get('pose') === '1';
const temaAtual = () => document.documentElement.getAttribute('data-tema') || 'escuro';

function svg(caminho) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${caminho}</svg>`;
}
const ICO = {
  filtro: svg('<path d="M4 7h16M6.5 12h11M10 17h4"/>'),
  relogio: svg('<circle cx="12" cy="12" r="8"/><path d="M12 8v5l3.5 2"/>'),
  ok: svg('<path d="M5 12.5 10 17.5 19 7"/>'),
  volta: svg('<path d="M14 6 8 12l6 6"/>'),
  lista: svg('<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>'),
  engrenagem: svg('<path d="M4 7h16M4 12h16M4 17h16"/><circle cx="8" cy="7" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="9" cy="17" r="2"/>'),
  mic: svg('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>'),
  tarefa: svg('<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M8.5 12.5l2.5 2.5 4.5-5.5"/>'),
  agenda: svg('<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M4 10h16M8.5 3v4M15.5 3v4"/>'),
  moeda: svg('<circle cx="12" cy="12" r="8.5"/><path d="M14.6 9.3c-.5-.9-1.5-1.3-2.6-1.3-1.5 0-2.7.8-2.7 2s1 1.7 2.7 2 2.8.8 2.8 2-1.3 2-2.8 2c-1.2 0-2.3-.5-2.8-1.4M12 6.3V8M12 16v1.7"/>'),
  sacola: svg('<path d="M5.5 8h13l-1 11.5h-11L5.5 8z"/><path d="M9 8V7a3 3 0 0 1 6 0v1"/>'),
  duvida: svg('<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.6a2.5 2.5 0 1 1 3.6 2.2c-.8.4-1.2 1-1.2 1.9M12 16.6h.01"/>'),
  x: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
};

const DESENHO_VAZIO = '<svg class="desenho" viewBox="0 0 120 90" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="18" y="12" width="84" height="62" rx="14"/><path d="M18 50h22a20 20 0 0 0 40 0h22"/><path d="M49 31l8 8 15-17"/></svg>';

function aplicarTema(nome, gravar) {
  const t = TEMAS.includes(nome) ? nome : 'escuro';
  document.documentElement.setAttribute('data-tema', t);
  document.documentElement.setAttribute('data-bs-theme', TEMA_BS[t]);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = getComputedStyle(document.documentElement).getPropertyValue('--fundo').trim() || '#1c1c24';
  if (gravar) {
    try { localStorage.setItem('copiloto_tema', t); } catch { /* segue na memória */ }
  }
}

function pintarToast() {
  const raiz = document.getElementById('app');
  if (!raiz) return;
  raiz.querySelector('.toast')?.remove();
  if (toast) raiz.insertAdjacentHTML('beforeend', `<div class="toast" role="status">${esc(toast)}</div>`);
}

/** Mostra o aviso sem redesenhar a tela: redesenhar apagava o que estava sendo digitado. */
function mostrar(msg) {
  toast = msg;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast = ''; pintarToast(); }, 3200);
  pintarToast();
}

function rota() {
  const p = (location.hash.replace(/^#/, '') || '/').split('?')[0].split('/').filter(Boolean);
  const [a, b, c, d] = p;
  if (!a || a === 'gravar') return { tela: 'gravar' };
  if (['aprovar', 'historico', 'lista', 'ajustes', 'gravando'].includes(a)) return { tela: a };
  if (a === 'item' && b) return { tela: 'item', id: b, menu: c === 'menu' ? d : '', data: c === 'data' ? d : '' };
  return { tela: 'gravar' };
}

function ir(hash) {
  if (location.hash === hash) desenhar();
  else location.hash = hash;
}

function itemPor(id) {
  return itens.find((i) => i.id === id) || null;
}

function nomePessoa(id) {
  if (!id) return '';
  return pessoas.find((p) => p.id === id)?.nome || '';
}

function pessoasDoItem(item) {
  const cru = item.pessoas || {};
  const pessoasItem = normalizarPessoas(cru);
  if (!('solicitante' in cru) && !('solicitante_id' in cru)) pessoasItem.solicitante = idPadrao(pessoas);
  if (!('executor' in cru) && !('executor_id' in cru)) pessoasItem.executor = idPadrao(pessoas);
  return pessoasItem;
}

function valorPessoa(item, campo) {
  const g = pessoasDoItem(item);
  if (campo === 'participantes' || campo === 'participantes_ids') return g.participantes;
  if (campo === 'em_copia' || campo === 'em_copia_id') return g.em_copia;
  if (campo === 'solicitante' || campo === 'solicitante_id') return g.solicitante || '';
  if (campo === 'executor' || campo === 'executor_id') return g.executor || '';
  return '';
}

function rotuloPessoa(item, campo) {
  const valor = valorPessoa(item, campo);
  if (Array.isArray(valor)) {
    const nomes = valor.map(nomePessoa).filter(Boolean);
    return nomes.length ? nomes.join(', ') : 'Escolher';
  }
  if (!valor) return '— Ninguém —';
  return nomePessoa(valor) || 'Escolher';
}

function campoCopia(item) {
  const ids = valorPessoa(item, 'em_copia');
  const aberto = emAberto(item.status);
  const chips = ids.map((pid) => {
    const nome = nomePessoa(pid) || 'Pessoa';
    const tirar = aberto
      ? `<button type="button" data-acao="tirar-copia" data-id="${esc(item.id)}" data-pessoa="${esc(pid)}" aria-label="Tirar ${esc(nome)} da cópia">×</button>`
      : '';
    return `<span class="chip-pessoa${aberto ? '' : ' fixo'}">${esc(nome)}${tirar}</span>`;
  }).join('');
  const add = aberto
    ? `<button type="button" class="chip-add" data-acao="abrir-menu" data-id="${esc(item.id)}" data-campo="em_copia">Adicionar</button>`
    : '';
  if (!aberto && !ids.length) return '';
  return `<div class="campo"><div class="rot">Em cópia</div><div class="chips-pessoas">${chips}${add}</div></div>`;
}

function klain(item) {
  return item && (item.tipo === 'klain-tarefa' || item.tipo === 'klain-compromisso' || item.tipo === 'indefinido');
}

function textoDe(item, valor) {
  return klain(item) ? soCsmt(valor) : (valor || '');
}

function classeStatus(status) {
  if (status === 'aguardando você') return 'st-aguardando';
  if (status === 'para o BOSS') return 'st-boss';
  if (status === 'aprovado') return 'st-aprovado';
  if (status === 'criado') return 'st-criado';
  if (status === 'recusado') return 'st-recusado';
  return 'st-erro';
}

function aguardando() {
  return itens.filter((item) => emAberto(item.status));
}

function itensDaAba(aba) {
  const base = aba === 'aprovar' ? aguardando() : itens.filter((item) => !emAberto(item.status));
  return ordenarFila(filtrar(base, filtrosAba[aba] || {}));
}

function linhaFila(item, aba) {
  const teste = item.teste ? ' · exemplo' : '';
  const meta = `${fHora(item.created_at)} · ${rotuloArea(item.tipo)}${teste}`;
  const cartao = `<button class="cartao" data-acao="abrir" data-id="${esc(item.id)}">
    <span class="tipo-ico t-${esc(areaDo(item.tipo))}">${iconeTipo(item.tipo)}</span>
    <span class="txt"><span class="t">${esc(tituloFila(item))}</span><span class="m">${esc(meta)}</span></span>
    <span class="pilula ${classeStatus(item.status)}">${esc(rotuloStatus(item.status))}</span>
  </button>`;
  if (aba !== 'aprovar') return cartao;
  return `<div class="desliza" data-desliza="${esc(item.id)}">
    <div class="desliza-fundo" aria-hidden="true"><span class="sim">${ICO.ok} Aprovar</span><span class="nao">Recusar ${ICO.x}</span></div>
    ${cartao}
  </div>`;
}

function olho() {
  return `<p class="olho">Copiloto${modo === 'mock' ? ' · exemplo' : ''}</p>`;
}

function cabeca(titulo, opts = {}) {
  let esq = '<span class="lado esq"></span>';
  if (opts.voltar) esq = `<span class="lado esq"><button class="voltar" data-acao="voltar" aria-label="Voltar">${ICO.volta}</button></span>`;
  if (opts.filtro) {
    const f = filtrosAba[opts.filtro] || {};
    const ativo = !!(f.status || f.periodo);
    esq = `<span class="lado esq"><button class="icone" data-acao="filtro-aba" aria-expanded="${filtroAberto}" aria-label="Filtros">${ICO.filtro}${ativo ? '<i class="ponto"></i>' : ''}</button></span>`;
  }
  let dir = '<span class="lado dir"></span>';
  if (opts.ajustes) dir = `<span class="lado dir"><button class="icone" data-acao="ir" data-hash="#/ajustes" aria-label="Ajustes">${ICO.engrenagem}</button></span>`;
  return `${olho()}<div class="nav centro">${esq}<h1>${esc(titulo)}</h1>${dir}</div>${avisoVersaoHTML()}`;
}

function estrela(obrigatorio) {
  return obrigatorio ? '<span class="estrela"> *</span>' : '';
}

function campoLeitura(rotulo, valor, obrigatorio) {
  return `<div class="campo"><div class="rot">${esc(rotulo)}${estrela(obrigatorio)}</div><div class="leitura">${esc(valor || '—')}</div></div>`;
}

function campoCaixa(rotulo, valor, suf, acao, extra, obrigatorio) {
  return `<div class="campo"><div class="rot">${esc(rotulo)}${estrela(obrigatorio)}</div>
    <button class="caixa" data-acao="${esc(acao)}" ${extra}><span>${esc(valor || 'Escolher')}</span><span class="suf">${esc(suf)}</span></button>
  </div>`;
}

function campoValor(item, chave, rotulo, numero, obrigatorio) {
  const aberto = emAberto(item.status);
  const mostrado = numero === null || numero === undefined || numero === '' ? '' : Number(numero).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (!aberto) return campoLeitura(rotulo, fValor(numero), obrigatorio);
  return `<div class="campo"><div class="rot">${esc(rotulo)}${estrela(obrigatorio)}</div>
    <label class="caixa"><input inputmode="decimal" aria-label="${esc(rotulo)}" data-acao="valor" data-id="${esc(item.id)}" data-chave="${esc(chave)}" value="${esc(mostrado)}"><span class="suf">R$</span></label>
  </div>`;
}

function campoTexto(item, chave, rotulo, valor, obrigatorio) {
  if (!emAberto(item.status)) return campoLeitura(rotulo, textoDe(item, valor), obrigatorio);
  return `<div class="campo"><div class="rot">${esc(rotulo)}${estrela(obrigatorio)}</div>
    <label class="caixa"><input aria-label="${esc(rotulo)}" data-acao="texto" data-id="${esc(item.id)}" data-chave="${esc(chave)}" value="${esc(textoDe(item, valor) || '')}"><span class="suf">alterar</span></label>
  </div>`;
}

function kick(item) {
  const mapa = {
    'klain-tarefa': 'Tarefa · Hub Klain · conta do Diego',
    'klain-compromisso': 'Compromisso · Hub Klain · conta do Diego',
    'apto-gasto': 'Gasto · Pagamento · Apartamento',
    'compras-item': 'Item · Lista do supermercado',
    indefinido: 'Indefinido · para o BOSS',
  };
  return `<div class="kicker">
    <span class="tipo-ico t-${esc(areaDo(item.tipo))}">${iconeTipo(item.tipo)}</span>
    <div class="k">${esc(mapa[item.tipo] || rotuloTipo(item.tipo))}</div>
    <span class="pilula ${classeStatus(item.status)}">${esc(rotuloStatus(item.status))}</span>
  </div>`;
}

function corpoCard(item) {
  const p = item.payload || {};
  const id = esc(item.id);
  if (item.tipo === 'indefinido') {
    const candidatos = (p.candidatos || []).length ? p.candidatos : ['klain-tarefa', 'klain-compromisso', 'apto-gasto', 'compras-item'];
    const cartoes = emAberto(item.status) ? candidatos.map((t) => `<button type="button" class="tipo-card" data-acao="escolher-tipo" data-id="${id}" data-tipo="${esc(t)}">
        <span class="tipo-ico t-${esc(areaDo(t))}">${iconeTipo(t)}</span>
        <span><b>${esc(rotuloTipo(t))}</b><small>${esc(DESC_TIPO[t] || '')}</small></span>
      </button>`).join('') : '';
    return `<h2 class="titulo-item">${esc(textoDe(item, item.transcricao) || 'Sem título')}</h2>
      ${campoLeitura('Por que parou aqui', textoDe(item, p.motivo), false)}
      ${cartoes ? `<div class="campo"><div class="rot">Escolha o tipo<span class="estrela"> *</span></div><div class="tipos">${cartoes}</div></div>
      <p class="dica">Sem tipo não dá para aprovar. Recusar pode.</p>` : ''}`;
  }
  if (item.tipo === 'klain-tarefa') {
    return `${campoTitulo(item, 'titulo', p.titulo)}
      ${campoCaixa('Solicitante', rotuloPessoa(item, 'solicitante'), '▾', 'abrir-menu', `data-id="${id}" data-campo="solicitante"`, false)}
      ${campoCaixa('Executor', rotuloPessoa(item, 'executor'), '▾', 'abrir-menu', `data-id="${id}" data-campo="executor"`, false)}
      ${campoCopia(item)}
      ${campoCaixa('Vencimento', fData(p.vencimento) || 'Escolher', 'alterar', 'abrir-data', `data-id="${id}" data-campo="vencimento"`, false)}
      ${campoDescricao(item, p.descricao)}`;
  }
  if (item.tipo === 'klain-compromisso') {
    return `${campoTitulo(item, 'titulo', p.titulo)}
      ${campoCaixa('Participantes', rotuloPessoa(item, 'participantes'), '▾', 'abrir-menu', `data-id="${id}" data-campo="participantes"`, true)}
      ${campoCaixa('Data e hora', fDataHora(p.data_hora) || 'Escolher', 'alterar', 'abrir-data', `data-id="${id}" data-campo="data_hora"`, true)}
      ${campoTexto(item, 'local', 'Local', p.local, false)}
      ${campoDescricao(item, p.descricao)}`;
  }
  if (item.tipo === 'apto-gasto') {
    const incerto = p.comodo_incerto ? ' · incerto' : '';
    return `${campoTitulo(item, 'titulo', p.titulo)}
      ${campoCaixa('Data', fData(p.data) || 'Escolher', 'alterar', 'abrir-data', `data-id="${id}" data-campo="data"`, false)}
      ${campoValor(item, 'valor', 'Valor', p.valor, false)}
      ${campoCaixa('Cômodo', `${p.ambiente || 'Escolher'}${incerto}`, '▾', 'abrir-menu', `data-id="${id}" data-campo="ambiente"`, false)}`;
  }
  return `${campoTitulo(item, 'nome', p.nome)}
    ${campoCaixa('Seção', p.ambiente || 'Escolher', '▾', 'abrir-menu', `data-id="${id}" data-campo="ambiente"`, true)}
    ${campoTexto(item, 'quantidade', 'Quantidade', p.quantidade, false)}
    ${campoValor(item, 'valor_estimado', 'Valor estimado', p.valor_estimado, false)}
    ${item.notas ? campoLeitura('Descrição', item.notas, false) : ''}`;
}

function acoes(item) {
  if (!emAberto(item.status)) {
    return `<div class="aviso forte">Já foi decidido: ${esc(rotuloStatus(item.status))}. A primeira decisão vale.</div>`;
  }
  return `<div class="acoes fixa vidro">
    <button class="botao nao" data-acao="decidir" data-id="${esc(item.id)}" data-decisao="recusado">Recusar</button>
    <button class="botao sim" data-acao="decidir" data-id="${esc(item.id)}" data-decisao="aprovado">Aprovar</button>
  </div>`;
}

function linhaMenu(item, campo, opcao, multi) {
  return `<button class="mi${opcao.sel ? ' sel' : ''}" data-acao="${multi ? 'toggle-pessoa' : 'escolher'}" data-id="${esc(item.id)}" data-campo="${esc(campo)}" data-valor="${esc(opcao.id)}"><span>${esc(opcao.nome)}</span>${opcao.sel ? '<span>✓</span>' : ''}</button>`;
}

function htmlListaPessoas(item, campo) {
  const multi = campo === 'em_copia' || campo === 'participantes';
  const lista = montarListaPessoas(pessoas, campo, valorPessoa(item, campo), buscaMenu);
  let html = '';
  if (lista.ninguem) html += linhaMenu(item, campo, { id: '', nome: '— Ninguém —', sel: lista.ninguemSel }, false);
  if (lista.grupos.length) {
    html += '<div class="sec">Grupos</div>';
    html += lista.grupos.map((op) => linhaMenu(item, campo, op, multi)).join('');
  }
  for (const bloco of lista.setores) {
    html += `<div class="sec">${esc(bloco.setor)}</div>`;
    html += bloco.pessoas.map((op) => linhaMenu(item, campo, op, multi)).join('');
  }
  if (!lista.ninguem && !lista.grupos.length && !lista.setores.length) html += '<p class="pe">Nada com esse nome.</p>';
  return html;
}

function menuPessoas(item, campo) {
  const multi = campo === 'em_copia' || campo === 'participantes';
  const titulo = { solicitante: 'Solicitante', executor: 'Executor', em_copia: 'Em cópia', participantes: 'Participantes' }[campo] || 'Pessoas';
  const pe = pessoasExemplo
    ? 'Exemplo. Grupos só em solicitante e executor. O padrão é Diego Konrad.'
    : 'Grupos só em solicitante e executor. Pessoa entra em todos os campos.';
  return `<button class="dim" data-acao="fechar" aria-label="Fechar"></button>
    <div class="sheet sheet-lista" role="dialog" aria-label="${esc(titulo)}">
      <div class="sh"><span class="link"></span><b>${esc(titulo)}</b><button class="link forte" data-acao="fechar">${multi ? 'OK' : 'Fechar'}</button></div>
      <div class="busca-wrap"><input class="menu-busca" data-acao="busca-menu" placeholder="Buscar" aria-label="Buscar" value="${esc(buscaMenu)}"></div>
      <div class="lista-pessoas" role="listbox">${htmlListaPessoas(item, campo)}</div>
      <p class="pe">${esc(pe)}</p>
    </div>`;
}

function menuHtml(item, campo) {
  if (campo !== 'ambiente') return menuPessoas(item, campo);
  const doMercado = item.tipo === 'compras-item';
  const titulo = doMercado ? 'Seção' : 'Cômodo';
  const atual = item.payload?.ambiente;
  const nomes = [...(doMercado ? SECOES_MERCADO : COMODOS)];
  if (atual && !nomes.includes(atual)) nomes.unshift(atual);
  const lis = nomes.map((nome) => linhaMenu(item, campo, { id: nome, nome, sel: nome === atual }, false)).join('');
  const pe = doMercado
    ? 'Seção do supermercado. É por ela que a lista fica agrupada.'
    : 'Cômodo do apartamento. Sala sozinha continua ambígua na entrada de voz.';
  return `<button class="dim" data-acao="fechar" aria-label="Fechar"></button>
    <div class="sheet sheet-lista" role="dialog" aria-label="${titulo}">
      <div class="sh"><span class="link"></span><b>${titulo}</b><button class="link forte" data-acao="fechar">Fechar</button></div>
      <div class="lista-pessoas" role="listbox">${lis}</div>
      <p class="pe">${pe}</p>
    </div>`;
}

function hojeSP() {
  const p = partesSP(new Date().toISOString());
  return `${p.year}-${p.month}-${p.day}`;
}

function prepararFolha(valor) {
  const hoje = hojeSP();
  const iso = /^\d{4}-\d{2}-\d{2}/.test(String(valor || '')) ? String(valor).slice(0, 10) : hoje;
  if (!folha || folha.base !== iso) {
    const [y, m, d] = iso.split('-').map(Number);
    folha = { ano: y, mes: m, dia: d, base: iso };
  }
}

function grade(ano, mes) {
  const primeiro = new Date(Date.UTC(ano, mes - 1, 1));
  const vazio = primeiro.getUTCDay();
  const total = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  const celulas = Array(vazio).fill(null);
  for (let d = 1; d <= total; d += 1) celulas.push(d);
  return celulas;
}

function dataHtml(item, campo) {
  const p = item.payload || {};
  const valor = p[campo];
  prepararFolha(valor);
  const nomeMes = new Date(Date.UTC(folha.ano, folha.mes - 1, 1)).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const rotulo = campo === 'vencimento' ? 'Vencimento' : (campo === 'data_hora' ? 'Data e hora' : 'Data');
  const [hy, hm, hd] = hojeSP().split('-').map(Number);
  const mesDeHoje = hy === folha.ano && hm === folha.mes;
  const dias = grade(folha.ano, folha.mes).map((d) => d
    ? `<button class="dia${d === folha.dia ? ' sel' : ''}${mesDeHoje && d === hd ? ' hoje' : ''}" data-acao="dia" data-dia="${d}">${d}</button>`
    : '<span></span>').join('');
  const hora = campo === 'data_hora' ? (String(valor || '').split('T')[1] || '00:00').slice(0, 5) : '';
  const horaHtml = campo === 'data_hora'
    ? `<label class="campo"><div class="rot">Hora</div><input class="texto" type="time" id="hora-data" value="${esc(hora)}"></label>`
    : '';
  const iso = `${folha.ano}-${String(folha.mes).padStart(2, '0')}-${String(folha.dia).padStart(2, '0')}`;
  return `<button class="dim" data-acao="fechar" aria-label="Fechar"></button>
    <div class="sheet" role="dialog" aria-label="${esc(rotulo)}">
      <div class="sh"><button class="link" data-acao="fechar">Cancelar</button><b>${esc(rotulo)}</b><span class="link"></span></div>
      <div class="mes-nav"><button data-acao="mes" data-delta="-1" aria-label="Mês anterior">‹</button><span>${esc(nomeMes)}</span><button data-acao="mes" data-delta="1" aria-label="Próximo mês">›</button></div>
      <div class="sem"><span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span></div>
      <div class="dias">${dias}</div>
      ${horaHtml}
      <button class="ok" data-acao="data-ok" data-id="${esc(item.id)}" data-campo="${esc(campo)}">Usar ${esc(fData(iso))}</button>
    </div>`;
}

const ROTULO_AREA = { auto: 'Automático', hub: 'Hub Klain', apto: 'Apto', compras: 'Compras' };

function prefsAtuais() {
  return dados?.prefs ? dados.prefs() : { aprovar: true, area: 'auto' };
}

function carregarLayout() {
  try {
    const o = JSON.parse(localStorage.getItem(LAYOUT_KEY) || 'null');
    return {
      gravar: { ...LAYOUT_PADRAO.gravar, ...(o && o.gravar) },
      area: { ...LAYOUT_PADRAO.area, ...(o && o.area) },
    };
  } catch {
    return { gravar: { ...LAYOUT_PADRAO.gravar }, area: { ...LAYOUT_PADRAO.area } };
  }
}

function limitarPeca(id) {
  const vw = window.innerWidth || 390;
  const vh = window.innerHeight || 844;
  const nav = document.querySelector('.abas');
  const barra = nav ? vh - nav.getBoundingClientRect().top : 96;
  const p = layout[id];
  const minS = id === 'gravar' ? 0.72 : 0.85;
  const maxS = id === 'gravar' ? 1.55 : 1.35;
  p.s = Math.min(maxS, Math.max(minS, Number(p.s) || 1));
  const w = (id === 'gravar' ? 132 : 180) * p.s;
  const h = (id === 'gravar' ? 132 : 48) * p.s;
  const m = 8;
  p.x = Math.min(1 - (w / 2 + m) / vw, Math.max((w / 2 + m) / vw, p.x));
  p.y = Math.min((vh - barra - h / 2 - m) / vh, Math.max((h / 2 + m) / vh, p.y));
}

function aplicarLayout() {
  limitarPeca('gravar');
  limitarPeca('area');
  const r = document.documentElement;
  r.style.setProperty('--lx', String(layout.gravar.x));
  r.style.setProperty('--ly', String(layout.gravar.y));
  r.style.setProperty('--ls', String(layout.gravar.s));
  r.style.setProperty('--ax', String(layout.area.x));
  r.style.setProperty('--ay', String(layout.area.y));
  r.style.setProperty('--as', String(layout.area.s));
}

function persistirLayout() {
  try { localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout)); } catch { /* segue na memória */ }
}

function atualizarBarraEdicao() {
  const bar = document.querySelector('.barra-edicao');
  if (!bar) return;
  const min = layoutAtivo === 'gravar' ? 0.72 : 0.85;
  const max = layoutAtivo === 'gravar' ? 1.55 : 1.35;
  const nome = layoutAtivo === 'gravar' ? 'botão Gravar' : 'chip de área';
  const label = bar.querySelector('label');
  const input = bar.querySelector('input[type=range]');
  if (label) label.firstChild.textContent = `Tamanho do ${nome}`;
  if (input) {
    input.min = String(min);
    input.max = String(max);
    input.value = String(layout[layoutAtivo].s);
    input.setAttribute('aria-label', `Tamanho do ${nome}`);
  }
}

function barraEdicao() {
  if (!editando) return '';
  const min = layoutAtivo === 'gravar' ? 0.72 : 0.85;
  const max = layoutAtivo === 'gravar' ? 1.55 : 1.35;
  const nome = layoutAtivo === 'gravar' ? 'botão Gravar' : 'chip de área';
  return `<div class="barra-edicao vidro">
    <p>Arraste para mover. Pinça ou o controle muda o tamanho.</p>
    <label>Tamanho do ${nome}<input type="range" min="${min}" max="${max}" step="0.01" value="${layout[layoutAtivo].s}" data-acao="tamanho-layout" aria-label="Tamanho do ${nome}"></label>
    <div class="acoes-edicao">
      <button type="button" class="botao" data-acao="restaurar-layout">Restaurar padrão</button>
      <button type="button" class="botao sim" data-acao="concluir-layout">Concluir</button>
    </div>
  </div>`;
}

function telaGravar(gravando) {
  const ouvido = [textoFala, textoParcial].filter(Boolean).join(' ');
  if (gravando && pedindoTexto && modo !== 'mock') {
    return `${cabeca('Gravar', {})}
      <main class="so-gravar">
        <div class="painel-texto vidro">
          <h2>O que foi dito</h2>
          <p>Este navegador não transcreve, ou a fala veio vazia. Escreva e envie.</p>
          <textarea class="area" id="texto-entrada" aria-label="Texto para enviar" placeholder="Ex.: comprar lâmpadas para a sala">${esc(ouvido)}</textarea>
          <div class="acoes-edicao">
            <button type="button" class="botao" data-acao="cancelar-gravar">Cancelar</button>
            <button type="button" class="botao sim" data-acao="enviar-texto">Enviar</button>
          </div>
        </div>
      </main>`;
  }
  const n = aguardando().length;
  const oi = gravando || editando || editandoFundo ? '' : `<button type="button" class="oi" data-acao="ir" data-hash="#/aprovar">
      <b>${saudacao()}, Diego</b>
      <span>${n ? `${n} aguardando você` : 'Nada esperando você'}</span>
    </button>`;
  const seg = pose() ? 7 : segundos;
  const relogio = `${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, '0')}`;
  const fala = modo === 'mock' ? 'No exemplo, parar acrescenta um item local.' : (ouvido || 'Ouvindo…');
  const painel = gravando ? `<div class="ao-vivo vidro" role="status">
      <div class="ao-vivo-topo"><i class="luz"></i><b class="relogio">${relogio}</b><span>Gravando</span></div>
      <p class="transcricao" id="fala-ao-vivo">${esc(fala)}</p>
      <small>Toque no botão para parar e enviar.</small>
    </div>` : '';
  const miolo = '<span class="mic">' + ICO.mic + '</span><span class="parada" aria-hidden="true"></span><span class="orb" aria-hidden="true"></span><span class="orb b" aria-hidden="true"></span>';
  const botao = gravando
    ? `<button class="gravar vivo" data-acao="parar" aria-label="Parar">${miolo}</button>`
    : `<button class="gravar" data-acao="gravar" data-layout="gravar" aria-label="Gravar">${miolo}</button>`;
  return `${cabeca(gravando ? 'Gravando' : 'Gravar', { ajustes: !gravando })}
    ${barraEdicao()}${barraFundo()}${oi}
    <main class="so-gravar">${painel}${botao}</main>`;
}

function painelFiltro(aba) {
  if (!filtroAberto) return '';
  const f = filtrosAba[aba];
  const statusOpcoes = aba === 'aprovar' ? ['aguardando você', 'para o BOSS'] : ['aprovado', 'recusado', 'criado', 'erro'];
  const chip = (grupo, valor, rotulo, on) => `<button class="chip${on ? ' on' : ''}" data-acao="filtro" data-aba="${aba}" data-grupo="${grupo}" data-valor="${esc(valor)}">${esc(rotulo)}</button>`;
  const status = statusOpcoes.map((s) => chip('status', s, rotuloStatus(s), f.status === s)).join('');
  const pers = [['hoje', 'Hoje'], ['7', '7 dias'], ['30', '30 dias']].map(([v, r]) => chip('periodo', v, r, f.periodo === v)).join('');
  return `<div class="painel-filtro vidro">
    <div class="grupo">Status</div><div class="chips">${status}</div>
    <div class="grupo">Período</div><div class="chips">${pers}</div>
  </div>`;
}

function telaFila(aba, titulo) {
  const f = filtrosAba[aba];
  const lista = itensDaAba(aba);
  const ativos = [
    f.status ? ['status', f.status, rotuloStatus(f.status)] : null,
    f.periodo ? ['periodo', f.periodo, ROTULO_PERIODO[f.periodo] || f.periodo] : null,
  ].filter(Boolean).map(([g, v, r]) => `<button class="chip on" data-acao="filtro" data-aba="${aba}" data-grupo="${g}" data-valor="${esc(v)}" aria-label="Tirar o filtro ${esc(r)}">${esc(r)} <span aria-hidden="true">×</span></button>`).join('');
  let corpo = '';
  let diaAtual = '';
  for (const item of lista) {
    const dia = rotuloDia(item.created_at);
    if (dia !== diaAtual) {
      corpo += `<h2 class="dia-sep">${esc(dia)}</h2>`;
      diaAtual = dia;
    }
    corpo += linhaFila(item, aba);
  }
  if (!lista.length) corpo = vazio(aba, !!ativos);
  const dica = aba === 'aprovar' && lista.length
    ? '<p class="dica centro">Deslize para a direita para aprovar e para a esquerda para recusar.</p>'
    : '';
  return `${cabeca(titulo, { ajustes: true, filtro: aba })}
    <main class="com-abas">
      ${ativos ? `<div class="chips filtros-ativos">${ativos}</div>` : ''}
      ${painelFiltro(aba)}
      ${erroFila ? `<p class="aviso">${esc(erroFila)}</p>` : ''}
      <div class="fila">${corpo}</div>
      ${dica}
    </main>`;
}

function falaDoNavegador() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function telaLista() {
  const linha = (c) => {
    const sub = [c.quantidade, c.valor_estimado != null ? `uns ${fValor(c.valor_estimado)}` : ''].filter(Boolean).join(' · ');
    return `<button class="compra${c.comprado ? ' feita' : ''}" data-acao="compra" data-id="${esc(c.id)}">
      <span class="ck${c.comprado ? ' on' : ''}" aria-hidden="true">${c.comprado ? '✓' : ''}</span>
      <span><span class="n">${esc(c.nome)}</span>${sub ? `<span class="sm">${esc(sub)}</span>` : ''}</span>
    </button>`;
  };
  const abertos = compras.filter((c) => !c.comprado);
  const feitos = compras.filter((c) => c.comprado);
  const grupos = new Map();
  for (const c of abertos) {
    const k = c.ambiente || 'Outros';
    if (!grupos.has(k)) grupos.set(k, []);
    grupos.get(k).push(c);
  }
  // Seções na ordem do mercado; o que não for seção conhecida vai para o fim.
  const ordem = [...grupos.keys()].sort((a, b) => {
    const ia = SECOES_MERCADO.indexOf(a);
    const ib = SECOES_MERCADO.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  let html = '';
  for (const secao of ordem) {
    const lista = grupos.get(secao);
    html += `<h2 class="grp"><span>${esc(secao)}</span><span class="conta">${lista.length}</span></h2>${lista.map(linha).join('')}`;
  }
  if (!compras.length) html = vazio('lista', false);
  else if (!abertos.length) html += '<p class="dica centro">Tudo comprado.</p>';
  if (feitos.length) {
    html += `<button type="button" class="grp dobra" data-acao="comprados" aria-expanded="${compradosAbertos}"><span>Comprados</span><span class="conta">${feitos.length} ${compradosAbertos ? '▾' : '▸'}</span></button>`;
    if (compradosAbertos) html += feitos.map(linha).join('');
  }
  if (secaoAdd && !SECOES_MERCADO.includes(secaoAdd)) secaoAdd = '';
  const chip = (valor, rotulo) => `<button type="button" class="chip${valor === secaoAdd ? ' on' : ''}" data-acao="secao-add" data-secao="${esc(valor)}">${esc(rotulo)}</button>`;
  const chips = chip('', 'Automática') + SECOES_MERCADO.map((s) => chip(s, s)).join('');
  const dica = secaoAdd ? `Adicionar em ${secaoAdd}` : 'Adicionar ao supermercado';
  const barra = `<div class="add-barra vidro">
      <div class="chips rolagem" role="group" aria-label="Seção do item novo">${chips}</div>
      <div class="add-linha">
        <input class="add" id="add-compra" data-acao="add-compra" placeholder="${esc(dica)}" aria-label="${esc(dica)}" enterkeyhint="done" autocomplete="off">
        <button type="button" class="icone mais" data-acao="add-compra-ok" aria-label="Adicionar">+</button>
      </div>
    </div>`;
  return `${cabeca('Lista', { ajustes: true })}<main class="com-abas com-add">${html}</main>${barra}`;
}

function telaItem(r) {
  const item = itemPor(r.id);
  if (!item) return `${cabeca('Aprovar', { voltar: true })}<main>${vazio('item', false)}</main>`;
  const aberto = emAberto(item.status);
  let extra = '';
  if (r.menu && aberto) extra = menuHtml(item, r.menu);
  if (r.data && aberto) extra = dataHtml(item, r.data);
  const ref = item.ref_tabela ? `<p class="dica">Referência: ${esc(item.ref_tabela)}</p>` : '';
  return `${cabeca(aberto ? 'Aprovar' : 'Histórico', { voltar: true })}
    <main class="justa${aberto ? ' com-rodape' : ''}">${kick(item)}${corpoCard(item)}${ref}${aberto ? '' : acoes(item)}</main>${aberto ? acoes(item) : ''}${extra}`;
}

function telaAjustes() {
  const prefs = prefsAtuais();
  const conta = modo === 'supabase' && dados?._sessao?.user
    ? { modo: 'Conectado', login: dados._sessao.user.email || 'Conta autenticada' }
    : { modo: 'Exemplo', login: 'Sem login — dados de exemplo' };
  const temas = TEMAS.map((t) => `<button type="button" class="tema-card${temaAtual() === t ? ' on' : ''}" data-acao="definir-tema" data-tema="${t}" aria-pressed="${temaAtual() === t}">
      <span class="mini" data-tema="${t}" aria-hidden="true"><i class="m-topo"></i><i class="m-card"></i><i class="m-card curto"></i><i class="m-bola"></i></span>
      <b>${esc(TEMA_NOME[t])}</b>
    </button>`).join('');
  return `${cabeca('Ajustes', { voltar: true })}
    <main>
      <div class="grupo">Tema</div>
      <div class="temas">${temas}</div>
      <div class="grupo">Fundo</div>
      <label class="botao cheio rotulo-arquivo">Escolher imagem<input type="file" accept="image/*" data-acao="arquivo-fundo" hidden></label>
      <button type="button" class="botao cheio" data-acao="editar-fundo">Mover, ampliar e opacidade</button>
      ${fundo.proprio ? '<button type="button" class="botao cheio" data-acao="fundo-padrao">Voltar à foto padrão</button>' : ''}
      <p class="dica">A imagem fica guardada só neste aparelho.</p>
      <div class="grupo">Tela de gravar</div>
      <button type="button" class="botao cheio" data-acao="editar-layout">Editar layout</button>
      <p class="dica">Move e redimensiona o botão Gravar e o chip de área.</p>
      <div class="grupo">Aprovação</div>
      <div class="ajuste interruptor">
        <span><b>Passar por aprovação</b><small>Você confirma cada item antes de ele ser criado.</small>
          <details class="saiba"><summary>Saiba mais</summary>Desligada, só o que não é gasto nem item do Hub Klain segue direto — um item da lista, por exemplo. Gastos e itens do Hub Klain sempre passam por você.</details>
        </span>
        <label class="sw"><input type="checkbox" role="switch" data-acao="aprovar-pref" ${prefs.aprovar ? 'checked' : ''} aria-label="Passar por aprovação"><i></i></label>
      </div>
      <div class="grupo">Conta</div>
      <div class="ajuste"><span>Modo</span><b>${esc(conta.modo)}</b></div>
      <div class="ajuste"><span>Login</span><b>${esc(conta.login)}</b></div>
      ${modo === 'supabase' && dados?._sessao ? '<button type="button" class="botao cheio" data-acao="sair">Sair</button>' : ''}
      ${modo === 'mock' ? '<button type="button" class="botao cheio" data-acao="restaurar">Restaurar exemplos</button>' : ''}
      <p class="versao">Copiloto ${esc(VERSAO)}</p>
    </main>`;
}

function chromeAba(tela) {
  if (!['gravar', 'aprovar', 'historico', 'lista'].includes(tela)) return '';
  const n = aguardando().length;
  const aba = (id, icone, rotulo, extra = '') => `<button type="button" role="tab" data-acao="aba" data-aba="${id}" aria-selected="${tela === id}" aria-label="${esc(rotulo)}">${ICONE(icone)}<span>${esc(rotulo)}</span>${extra}</button>`;
  const badge = n ? `<b class="selo-n${pularSelo ? ' pulo' : ''}">${n > 99 ? '99' : n}</b>` : '';
  const area = tela === 'gravar' && !editandoFundo ? chipArea() : '';
  return `${area}<nav class="abas vidro" role="tablist">
    ${aba('gravar', ICO.mic, 'Gravar')}
    ${aba('aprovar', ICO.ok, 'Aprovar', badge)}
    ${aba('historico', ICO.relogio, 'Histórico')}
    ${aba('lista', ICO.lista, 'Lista')}
  </nav>`;
}

function avisoForcado() {
  try { return new URLSearchParams(location.search).get('versao') === '1'; } catch { return false; }
}

function avisoVersaoHTML() {
  if (!mostrarAvisoDeVersao(versaoNova || avisoForcado(), aoVivo)) return '';
  return `<button type="button" class="aviso-versao vidro" data-acao="atualizar-versao">${esc(AVISO_VERSAO)}</button>`;
}

function pintarAvisoVersao() {
  const raiz = document.getElementById('app');
  if (!raiz) return;
  const html = avisoVersaoHTML();
  const ja = raiz.querySelector('.aviso-versao');
  if (!html) {
    ja?.remove();
    return;
  }
  if (ja) return;
  const nav = raiz.querySelector('.nav');
  if (nav) nav.insertAdjacentHTML('afterend', html);
  else raiz.insertAdjacentHTML('afterbegin', html);
}

function marcarVersaoNova() {
  versaoNova = true;
  if (aoVivo) return;
  pintarAvisoVersao();
}

function ICONE(html) { return `<i class="aba-ico">${html}</i>`; }

function chipArea() {
  const prefs = prefsAtuais();
  const opcoes = [['auto', 'Automático'], ['hub', 'Hub Klain'], ['apto', 'Apto'], ['compras', 'Compras']];
  const menu = areaAberta ? `<div class="area-menu vidro" role="menu">${opcoes.map(([v, r]) => `<button type="button" role="menuitemradio" aria-checked="${prefs.area === v}" data-acao="definir-area" data-area="${v}">${esc(r)}${prefs.area === v ? '<span>✓</span>' : ''}</button>`).join('')}</div><button class="dim dim-area" data-acao="fechar-area" aria-label="Fechar áreas"></button>` : '';
  return `<div class="area-wrap">${menu}<button type="button" class="area-chip vidro" data-acao="area-menu" data-layout="area" aria-expanded="${areaAberta}" aria-haspopup="menu">${esc(ROTULO_AREA[prefs.area] || 'Automático')}<span class="car">▲</span></button></div>`;
}

function telaLogin() {
  return `<main class="login-tela">
      <div class="login-cartao vidro">
        <img class="login-ico" src="icon-192.png" alt="" width="72" height="72">
        <h1>Copiloto</h1>
        <p class="dica">Entre com o e-mail e a senha. É o mesmo login do Hub.</p>
        ${erroBoot ? `<p class="aviso">${esc(erroBoot)}</p>` : ''}
        ${erroFila ? `<p class="aviso">${esc(erroFila)}</p>` : ''}
        <form class="login" data-acao="login">
          <input name="email" type="email" autocomplete="username" placeholder="E-mail" required aria-label="E-mail">
          <input name="senha" type="password" autocomplete="current-password" placeholder="Senha" required aria-label="Senha">
          <button class="botao sim" type="submit">Entrar</button>
        </form>
        ${avisoVersaoHTML()}
      </div>
    </main>`;
}

function telaErroBoot() {
  return `<main class="login-tela">
      <div class="login-cartao vidro">
        <img class="login-ico" src="icon-192.png" alt="" width="72" height="72">
        <h1>Copiloto</h1>
        <p class="aviso">${esc(erroBoot)}</p>
        <button class="botao sim cheio" data-acao="recarregar">Tentar de novo</button>
        ${avisoVersaoHTML()}
      </div>
    </main>`;
}

function desenhar() {
  const raiz = document.getElementById('app');
  const fundoEl = document.getElementById('fundo');
  if (!dados && erroBoot) {
    raiz.className = 'app';
    fundoEl?.classList.add('suave');
    raiz.innerHTML = telaErroBoot();
    return;
  }
  if (modo === 'supabase' && dados && !dados._sessao) {
    raiz.className = 'app';
    fundoEl?.classList.add('suave');
    raiz.innerHTML = telaLogin();
    ultimaTela = 'login';
    pintarToast();
    return;
  }
  const r = rota();
  const naFoto = r.tela === 'gravar' || r.tela === 'gravando';
  if (r.tela !== 'gravar') {
    editando = false;
    editandoFundo = false;
  }
  raiz.classList.toggle('com-foto', naFoto);
  raiz.classList.toggle('editando', editando);
  raiz.classList.toggle('editando-fundo', editandoFundo);
  document.documentElement.classList.toggle('fundo-edicao', editandoFundo);
  fundoEl?.classList.toggle('suave', !naFoto);
  aplicarLayout();
  if (!r.data) folha = null;
  let html = '';
  if (r.tela === 'gravar') html = telaGravar(false);
  else if (r.tela === 'gravando') html = telaGravar(true);
  else if (r.tela === 'aprovar') html = telaFila('aprovar', 'Aprovar');
  else if (r.tela === 'historico') html = telaFila('historico', 'Histórico');
  else if (r.tela === 'lista') html = telaLista();
  else if (r.tela === 'ajustes') html = telaAjustes();
  else if (r.tela === 'item') html = telaItem(r);
  raiz.innerHTML = html + chromeAba(r.tela);
  autoAltura();
  const chave = naFoto ? 'gravar' : r.tela;
  if (chave !== ultimaTela && !naFoto) {
    raiz.querySelector('main')?.classList.add(['item', 'ajustes'].includes(r.tela) ? 'entra-lado' : 'entra');
  }
  ultimaTela = chave;
  const chaveFolha = r.menu ? `m${r.menu}` : (r.data ? `d${r.data}` : '');
  if (chaveFolha && chaveFolha !== ultimaFolha) raiz.querySelector('.sheet')?.classList.add('abre');
  ultimaFolha = chaveFolha;
  pintarToast();
}

async function carregar() {
  if (!dados) return;
  const [fila, gente, lista] = await Promise.all([dados.listarItens(), dados.listarPessoas(), dados.listarCompras()]);
  if (modo === 'supabase' && fila.codigo === 'sem-sessao') dados._sessao = null;
  itens = fila.itens || [];
  erroFila = fila.erro || '';
  pessoas = gente.pessoas || [];
  pessoasExemplo = !!gente.exemplo;
  compras = lista.compras || [];
  if (lista.erro && !erroFila) erroFila = lista.erro;
}

/** Busca a fila de novo sem atrapalhar quem está gravando, digitando ou movendo o layout. */
async function atualizarFila() {
  if (carregando || !dados || aoVivo || editando) return;
  if (modo === 'supabase' && !dados._sessao) return;
  const telas = ['gravar', 'aprovar', 'historico', 'lista', 'enviado'];
  if (!telas.includes(rota().tela)) return;
  carregando = true;
  try { await carregar(); } catch { return; } finally { carregando = false; }
  const foco = document.activeElement;
  if (foco && /^(INPUT|TEXTAREA)$/.test(foco.tagName)) return;
  if (telas.includes(rota().tela) && !aoVivo && !editando) desenhar();
}

/** Depois de editar um campo: a edição é um rascunho local, então não há o que reler do banco. */
async function depoisDeEditar() {
  const fila = await dados.listarItens({ local: true });
  itens = fila.itens || [];
  desenhar();
}

async function depoisDeMudar() {
  await carregar();
  desenhar();
}

/** Manda as pessoas inteiras: mandar só um campo fazia os outros voltarem para "Ninguém". */
function patchPessoas(item, campo, valor) {
  return { pessoas: { ...pessoasDoItem(item), [campo]: valor } };
}

function patchDoCampo(item, chave, valor) {
  if (chave === 'solicitante' || chave === 'executor') {
    const unico = Array.isArray(valor) ? valor[0] : valor;
    return patchPessoas(item, chave, unico || null);
  }
  if (chave === 'em_copia' || chave === 'participantes') {
    return patchPessoas(item, chave, Array.isArray(valor) ? valor : []);
  }
  if (chave === 'ambiente') return { payload: { ambiente: valor, comodo_incerto: false } };
  if (chave === 'valor' || chave === 'valor_estimado') {
    return { payload: { [chave]: pValor(valor) } };
  }
  return { payload: { [chave]: valor } };
}

async function salvarCampo(id, chave, valor) {
  const item = itemPor(id);
  if (!item) return;
  const r = await dados.atualizar(id, patchDoCampo(item, chave, valor));
  if (r && r.jaDecidido) {
    mostrar(`Já foi decidido: ${rotuloStatus(r.status)}. A primeira decisão vale.`);
    await depoisDeMudar();
    return;
  }
  await depoisDeEditar();
}

async function aoDecidir(id, decisao) {
  const item = itemPor(id);
  if (!item) return;
  const patch = { payload: item.payload, pessoas: pessoasDoItem(item), tipo: item.tipo };
  const r = await dados.decidir(id, decisao, patch);
  if (r.jaDecidido) {
    mostrar(`Já foi decidido: ${rotuloStatus(r.status)}. A primeira decisão vale.`);
  } else if (r.motivo === 'tipo') {
    mostrar('Escolha o tipo antes de aprovar.');
  } else if (!r.ok) {
    mostrar(r.mensagem || 'Não deu para gravar a decisão.');
  } else {
    if (r.status === 'criado') mostrar('Aprovado. Já está na lista do supermercado.');
    else mostrar(decisao === 'aprovado' ? 'Aprovado.' : 'Recusado.');
    ir('#/aprovar');
  }
  await depoisDeMudar();
}

function pararMic() {
  clearInterval(timer);
  timer = null;
  const estava = aoVivo;
  aoVivo = false;
  if (estava && recarregarDepois && recarregarPorVersao(false)) location.reload();
}

function pintarFala() {
  const el = document.getElementById('fala-ao-vivo');
  if (!el) return;
  const t = [textoFala, textoParcial].filter(Boolean).join(' ');
  el.textContent = t || 'Ouvindo…';
}

function pararReconhecimento() {
  const rec = reconhecimento;
  reconhecimento = null;
  if (!rec) return;
  rec.onresult = null;
  rec.onerror = null;
  rec.onend = null;
  try { rec.stop(); } catch { /* já parado */ }
}

function comecarFala() {
  const SR = falaDoNavegador();
  if (!SR || modo === 'mock') {
    pedindoTexto = modo !== 'mock';
    if (pedindoTexto) {
      clearInterval(timer);
      timer = null;
      aoVivo = false;
    }
    return;
  }
  pedindoTexto = false;
  textoFala = '';
  textoParcial = '';
  textoBase = '';
  const rec = new SR();
  rec.lang = 'pt-BR';
  rec.interimResults = true;
  rec.continuous = true;
  rec.onresult = (ev) => {
    let finais = '';
    let parcial = '';
    for (const res of ev.results) {
      const t = res[0]?.transcript || '';
      if (res.isFinal) finais += `${t} `;
      else parcial += t;
    }
    textoFala = [textoBase, finais.trim()].filter(Boolean).join(' ');
    textoParcial = parcial.trim();
    pintarFala();
  };
  rec.onerror = (ev) => {
    if (!aoVivo) return;
    // Silêncio e reinício não são falha: o onend religa a escuta.
    if (ev?.error === 'no-speech' || ev?.error === 'aborted') return;
    pararReconhecimento();
    clearInterval(timer);
    timer = null;
    aoVivo = false;
    pedindoTexto = true;
    desenhar();
  };
  rec.onend = () => {
    if (reconhecimento === rec && aoVivo) {
      // Cada sessão começa do zero: guarda o que já foi ouvido antes de religar.
      textoBase = [textoFala, textoParcial].filter(Boolean).join(' ').trim();
      textoFala = textoBase;
      textoParcial = '';
      try { rec.start(); } catch { /* o navegador encerrou a sessão */ }
    }
  };
  reconhecimento = rec;
  try { rec.start(); } catch { pedindoTexto = true; }
}

async function comecarGravar() {
  aoVivo = true;
  segundos = 0;
  clearInterval(timer);
  timer = setInterval(() => {
    segundos += 1;
    const el = document.querySelector('.relogio');
    if (el && rota().tela === 'gravando') {
      el.textContent = `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, '0')}`;
    }
  }, 1000);
  comecarFala();
  ir('#/gravando');
}

async function enviarTexto(texto) {
  const limpo = String(texto || '').trim();
  if (!limpo) {
    pedindoTexto = true;
    mostrar('Não ouvi nada. Escreva o que quer enviar.');
    desenhar();
    return;
  }
  const r = await dados.enviarTexto(limpo);
  if (!r?.ok) {
    mostrar(r?.mensagem || 'Não deu para enviar.');
    pedindoTexto = true;
    desenhar();
    return;
  }
  textoFala = '';
  textoParcial = '';
  textoBase = '';
  pedindoTexto = false;
  await carregar();
  if (r.aviso) avisarEnvio(r.aviso);
  else if (r.status === 'criado') avisarEnvio('Enviado. Já entrou na lista do supermercado.');
  else avisarEnvio(r.tipo ? `Enviado. Entrou como ${rotuloTipo(r.tipo)}.` : 'Enviado para a fila.');
}

async function pararGravar() {
  const texto = [textoFala, textoParcial].filter(Boolean).join(' ').trim();
  pararReconhecimento();
  pararMic();
  if (modo === 'mock' && dados?.simularChegada) {
    await dados.simularChegada('Lembrete de voz (exemplo)');
    await carregar();
    avisarEnvio('Enviado. No exemplo, a fila ganhou um item local.');
    return;
  }
  await enviarTexto(texto);
}

async function diaOk(id, campo) {
  const iso = `${folha.ano}-${String(folha.mes).padStart(2, '0')}-${String(folha.dia).padStart(2, '0')}`;
  let valor = iso;
  if (campo === 'data_hora') {
    const hora = document.getElementById('hora-data')?.value || '00:00';
    valor = `${iso}T${hora}:00`;
  }
  folha = null;
  await salvarCampo(id, campo, valor);
  ir(`#/item/${id}`);
}

async function noClique(e) {
  if (arrastou) { arrastou = false; return; }
  if (Date.now() < ignorarCliqueAte) return;
  const el = e.target.closest('[data-acao]');
  if (!el) return;
  const acao = el.dataset.acao;
  if ((editando || editandoFundo) && (acao === 'gravar' || acao === 'area-menu')) return;
  if (acao === 'ir') { ir(el.dataset.hash); return; }
  if (acao === 'voltar') { if (history.length > 1) history.back(); else ir('#/'); return; }
  if (acao === 'aba') { filtroAberto = false; areaAberta = false; ir(el.dataset.aba === 'gravar' ? '#/' : `#/${el.dataset.aba}`); atualizarFila(); return; }
  if (acao === 'filtro-aba') { filtroAberto = !filtroAberto; desenhar(); return; }
  if (acao === 'area-menu') { areaAberta = !areaAberta; desenhar(); return; }
  if (acao === 'editar-layout') { editando = true; editandoFundo = false; areaAberta = false; ir('#/'); return; }
  if (acao === 'editar-fundo') { editandoFundo = true; editando = false; areaAberta = false; ir('#/'); return; }
  if (acao === 'concluir-fundo') { editandoFundo = false; persistirFundo(); desenhar(); return; }
  if (acao === 'fundo-centralizar') { fundo.x = 0; fundo.y = 0; fundo.z = 1; aplicarFundo(); persistirFundo(); desenhar(); return; }
  if (acao === 'fundo-padrao') {
    try { localStorage.removeItem(FUNDO_IMG_KEY); } catch { /* sem armazenamento */ }
    fundo = { ...FUNDO_PADRAO, proprio: false };
    pintarImagemFundo();
    aplicarFundo();
    persistirFundo();
    desenhar();
    mostrar('Voltou a foto padrão.');
    return;
  }
  if (acao === 'limpar-filtros') {
    const f = filtrosAba[el.dataset.aba];
    if (f) { f.status = ''; f.periodo = ''; }
    desenhar();
    return;
  }
  if (acao === 'comprados') { compradosAbertos = !compradosAbertos; desenhar(); return; }
  if (acao === 'secao-add') {
    const digitado = document.getElementById('add-compra')?.value || '';
    secaoAdd = el.dataset.secao || '';
    desenhar();
    const campo = document.getElementById('add-compra');
    if (campo) { campo.value = digitado; campo.focus(); }
    return;
  }
  if (acao === 'add-compra-ok') { await adicionarDaBarra(); return; }
  if (acao === 'cancelar-gravar') { pedindoTexto = false; ir('#/'); return; }
  if (acao === 'concluir-layout') { editando = false; persistirLayout(); desenhar(); return; }
  if (acao === 'restaurar-layout') {
    layout = { gravar: { ...LAYOUT_PADRAO.gravar }, area: { ...LAYOUT_PADRAO.area } };
    persistirLayout();
    aplicarLayout();
    desenhar();
    return;
  }
  if (acao === 'fechar-area') { areaAberta = false; desenhar(); return; }
  if (acao === 'definir-area') { dados?.definirPrefs?.({ area: el.dataset.area }); areaAberta = false; desenhar(); return; }
  if (acao === 'definir-tema') { aplicarTema(el.dataset.tema, true); desenhar(); return; }
  if (acao === 'abrir') { ir(`#/item/${el.dataset.id}`); return; }
  if (acao === 'atualizar-versao') { await aplicarVersao(); return; }
  if (acao === 'gravar') { await comecarGravar(); return; }
  if (acao === 'parar' || acao === 'enviar-texto' || acao === 'decidir') {
    if (ocupado) return;
    ocupado = true;
    try {
      if (acao === 'parar') await pararGravar();
      else if (acao === 'enviar-texto') await enviarTexto(document.getElementById('texto-entrada')?.value || '');
      else await aoDecidir(el.dataset.id, el.dataset.decisao);
    } finally {
      ocupado = false;
    }
    return;
  }
  if (acao === 'sair') {
    pararReconhecimento();
    pararMic();
    await dados?.sair?.();
    if (dados) dados._sessao = null;
    itens = [];
    pessoas = [];
    compras = [];
    ir('#/');
    return;
  }
  if (acao === 'recarregar') { location.reload(); return; }
  if (acao === 'fechar') { folha = null; buscaMenu = ''; if (history.length > 1) history.back(); else ir(`#/item/${rota().id || ''}`); return; }
  if (acao === 'busca-menu') return;
  if (acao === 'filtro') {
    const g = el.dataset.grupo;
    const v = el.dataset.valor;
    const f = filtrosAba[el.dataset.aba];
    if (!f) return;
    if (f[g] === v) f[g] = '';
    else f[g] = v;
    desenhar();
    return;
  }
  if (acao === 'abrir-menu') { buscaMenu = ''; ir(`#/item/${el.dataset.id}/menu/${el.dataset.campo}`); return; }
  if (acao === 'abrir-data') { folha = null; ir(`#/item/${el.dataset.id}/data/${el.dataset.campo}`); return; }
  if (acao === 'dia') { folha.dia = Number(el.dataset.dia); desenhar(); return; }
  if (acao === 'mes') {
    const delta = Number(el.dataset.delta);
    const d = new Date(Date.UTC(folha.ano, folha.mes - 1 + delta, 1));
    folha.ano = d.getUTCFullYear();
    folha.mes = d.getUTCMonth() + 1;
    const ultimo = new Date(Date.UTC(folha.ano, folha.mes, 0)).getUTCDate();
    if (folha.dia > ultimo) folha.dia = ultimo;
    desenhar();
    return;
  }
  if (acao === 'data-ok') { await diaOk(el.dataset.id, el.dataset.campo); return; }
  if (acao === 'escolher') {
    buscaMenu = '';
    await salvarCampo(el.dataset.id, el.dataset.campo, el.dataset.valor);
    ir(`#/item/${el.dataset.id}`);
    return;
  }
  if (acao === 'toggle-pessoa') {
    const item = itemPor(el.dataset.id);
    if (!item) return;
    const campo = el.dataset.campo;
    const ids = new Set(valorPessoa(item, campo));
    if (ids.has(el.dataset.valor)) ids.delete(el.dataset.valor); else ids.add(el.dataset.valor);
    await dados.atualizar(el.dataset.id, patchPessoas(item, campo, [...ids]));
    await depoisDeEditar();
    const busca = document.querySelector('[data-acao="busca-menu"]');
    if (busca) busca.focus();
    return;
  }
  if (acao === 'tirar-copia') {
    const item = itemPor(el.dataset.id);
    if (!item) return;
    const ids = valorPessoa(item, 'em_copia').filter((pid) => pid !== el.dataset.pessoa);
    await dados.atualizar(el.dataset.id, patchPessoas(item, 'em_copia', ids));
    await depoisDeEditar();
    return;
  }
  if (acao === 'escolher-tipo') {
    const item = itemPor(el.dataset.id);
    const frase = soCsmt(item?.transcricao || '');
    const r = await dados.atualizar(el.dataset.id, {
      tipo: el.dataset.tipo,
      payload: { titulo: frase, nome: frase, descricao: frase },
    });
    if (r?.jaDecidido) {
      mostrar(`Já foi decidido: ${rotuloStatus(r.status)}.`);
      await depoisDeMudar();
      return;
    }
    await depoisDeEditar();
    return;
  }
  if (acao === 'compra') {
    const compra = compras.find((c) => c.id === el.dataset.id);
    const r = await dados.alternarCompra(el.dataset.id, compra ? !!compra.comprado : undefined);
    if (r?.ok && compra) {
      compra.comprado = r.comprado;
      desenhar();
    } else {
      if (r && !r.ok && r.mensagem) mostrar(r.mensagem);
      await depoisDeMudar();
    }
    return;
  }
  if (acao === 'restaurar') { await dados.restaurar(); filtrosAba = { aprovar: { status: '', periodo: '' }, historico: { status: '', periodo: '' } }; await depoisDeMudar(); mostrar('Exemplos restaurados.'); return; }
}

function noInput(e) {
  const acao = e.target?.dataset?.acao;
  if (acao === 'tamanho-layout') {
    layout[layoutAtivo].s = Number(e.target.value);
    aplicarLayout();
    e.target.value = String(layout[layoutAtivo].s);
    persistirLayout();
    return;
  }
  if (acao === 'fundo-zoom' || acao === 'fundo-opacidade') {
    if (acao === 'fundo-zoom') fundo.z = Number(e.target.value);
    else fundo.o = Number(e.target.value);
    aplicarFundo();
    persistirFundo();
    return;
  }
  if (e.target?.matches?.('textarea.titulo-item, textarea.auto')) {
    ajustarAltura(e.target);
    return;
  }
  const busca = e.target.closest('[data-acao="busca-menu"]');
  if (busca) {
    buscaMenu = busca.value;
    const r = rota();
    const item = itemPor(r.id);
    const box = document.querySelector('.lista-pessoas');
    if (item && box && r.menu) box.innerHTML = htmlListaPessoas(item, r.menu);
  }
}

async function noChange(e) {
  const acao = e.target?.dataset?.acao;
  if (acao === 'arquivo-fundo') {
    await trocarFundo(e.target.files?.[0]);
    return;
  }
  if (acao === 'aprovar-pref') {
    dados?.definirPrefs?.({ aprovar: e.target.checked });
    return;
  }
  const el = e.target.closest('[data-acao="valor"], [data-acao="texto"]');
  if (!el) return;
  if (el.dataset.obrigatorio && !String(el.value).trim()) {
    mostrar('O título não pode ficar vazio.');
    desenhar();
    return;
  }
  await salvarCampo(el.dataset.id, el.dataset.chave, el.value);
}

async function noSubmit(e) {
  const form = e.target.closest('[data-acao="login"]');
  if (form) {
    e.preventDefault();
    const fd = new FormData(form);
    try {
      await dados.entrar(fd.get('email'), fd.get('senha'));
      dados._sessao = await dados.sessao();
      await carregar();
      desenhar();
    } catch (err) {
      const msg = /invalid login/i.test(err.message) ? 'E-mail ou senha não conferem.' : err.message;
      mostrar(msg);
    }
    return;
  }
}

async function noKey(e) {
  if (e.key === 'Escape') {
    const r = rota();
    if (r.menu || r.data) {
      folha = null;
      buscaMenu = '';
      ir(`#/item/${r.id}`);
    }
  }
  if (e.key === 'Enter' && e.target?.matches?.('textarea.titulo-item')) {
    e.preventDefault();
    e.target.blur();
    return;
  }
  if (e.key === 'Enter' && e.target?.dataset?.acao === 'add-compra') {
    e.preventDefault();
    await adicionarDaBarra();
  }
}

function distPonteiros() {
  const pts = [...ponteiros.values()];
  return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
}

function noPonteiroDown(e) {
  const tela = rota().tela;
  if (editandoFundo && tela === 'gravar') {
    if (e.target.closest('.barra-edicao, .nav, .abas')) return;
    ponteiros.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ponteiros.size === 1) {
      gesto = { id: 'fundo', x: e.clientX, y: e.clientY, ox: fundo.x, oy: fundo.y, s: fundo.z, pinça: 0 };
    } else if (gesto) {
      gesto.pinça = distPonteiros();
      gesto.s = fundo.z;
    }
    e.preventDefault();
    return;
  }
  if (tela === 'aprovar') {
    const caixa = e.isPrimary === false ? null : e.target.closest('[data-desliza]');
    if (caixa) deslize = { id: caixa.dataset.desliza, caixa, el: caixa.querySelector('.cartao'), x: e.clientX, y: e.clientY, dx: 0, ativo: false };
    return;
  }
  if (!editando || tela !== 'gravar') return;
  if (e.target.closest('.area-menu, .barra-edicao')) return;
  const alvo = e.target.closest('[data-layout]');
  if (!alvo) return;
  ponteiros.set(e.pointerId, { x: e.clientX, y: e.clientY });
  const id = alvo.dataset.layout;
  layoutAtivo = id;
  if (ponteiros.size === 1) {
    gesto = { id, x: e.clientX, y: e.clientY, ox: layout[id].x, oy: layout[id].y, s: layout[id].s, pinça: 0 };
    arrastou = false;
  } else if (gesto) {
    gesto.pinça = distPonteiros();
    gesto.s = layout[gesto.id].s;
  }
  alvo.setPointerCapture?.(e.pointerId);
  atualizarBarraEdicao();
  e.preventDefault();
}

function noPonteiroMove(e) {
  if (deslize) {
    const dx = e.clientX - deslize.x;
    const dy = e.clientY - deslize.y;
    if (!deslize.ativo) {
      if (Math.abs(dy) > 14 && Math.abs(dy) > Math.abs(dx)) { deslize = null; return; }
      if (Math.abs(dx) < 12 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      deslize.ativo = true;
      deslize.caixa.classList.add('ativo');
    }
    deslize.dx = dx;
    deslize.el.style.transform = `translateX(${dx}px)`;
    const limiar = Math.min(150, deslize.caixa.offsetWidth * 0.38);
    deslize.caixa.classList.toggle('dir', dx > 0);
    deslize.caixa.classList.toggle('esq', dx < 0);
    deslize.caixa.classList.toggle('passou', Math.abs(dx) >= limiar);
    return;
  }
  if (!ponteiros.has(e.pointerId) || !gesto) return;
  ponteiros.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (gesto.id === 'fundo') {
    if (ponteiros.size >= 2 && gesto.pinça) {
      fundo.z = gesto.s * (distPonteiros() / gesto.pinça);
    } else {
      fundo.x = gesto.ox + (e.clientX - gesto.x) / window.innerWidth;
      fundo.y = gesto.oy + (e.clientY - gesto.y) / window.innerHeight;
    }
    aplicarFundo();
    const zoom = document.querySelector('[data-acao="fundo-zoom"]');
    if (zoom) zoom.value = String(fundo.z);
    e.preventDefault();
    return;
  }
  if (ponteiros.size >= 2 && gesto.pinça) {
    layout[gesto.id].s = gesto.s * (distPonteiros() / gesto.pinça);
    arrastou = true;
  } else {
    const dx = e.clientX - gesto.x;
    const dy = e.clientY - gesto.y;
    if (Math.hypot(dx, dy) > 5) arrastou = true;
    layout[gesto.id].x = gesto.ox + dx / window.innerWidth;
    layout[gesto.id].y = gesto.oy + dy / window.innerHeight;
  }
  aplicarLayout();
  const slider = document.querySelector('[data-acao="tamanho-layout"]');
  if (slider) slider.value = String(layout[layoutAtivo].s);
  e.preventDefault();
}

function noPonteiroUp(e) {
  if (deslize) {
    const d = deslize;
    deslize = null;
    if (!d.ativo) return;
    ignorarCliqueAte = Date.now() + 400;
    const limiar = Math.min(150, d.caixa.offsetWidth * 0.38);
    d.el.style.transform = '';
    d.caixa.classList.remove('ativo', 'dir', 'esq', 'passou');
    if (e.type === 'pointerup' && Math.abs(d.dx) >= limiar) decidirPorDeslize(d.id, d.dx > 0 ? 'aprovado' : 'recusado');
    return;
  }
  if (!ponteiros.has(e.pointerId)) return;
  ponteiros.delete(e.pointerId);
  const doFundo = gesto?.id === 'fundo';
  if (ponteiros.size === 0) {
    if (doFundo) persistirFundo();
    else if (gesto && arrastou) persistirLayout();
    gesto = null;
  } else if (gesto) {
    const p = [...ponteiros.values()][0];
    const alvo = doFundo ? fundo : layout[gesto.id];
    gesto.x = p.x;
    gesto.y = p.y;
    gesto.ox = alvo.x;
    gesto.oy = alvo.y;
    gesto.pinça = 0;
    gesto.s = doFundo ? fundo.z : alvo.s;
  }
}

const ARQUIVOS_VERSAO = ['app.css', 'temas.css', 'js/app.js', 'js/dados.js', 'js/config.js', 'js/prefs.js', 'js/versao.js', 'js/contrato.js', 'js/adaptador-mock.js', 'js/adaptador-supabase.js'];

function assumirSePrimeira() {
  if (!ativarNaHora(!navigator.serviceWorker.controller)) return;
  const w = registroSw?.waiting || registroSw?.installing;
  if (w) w.postMessage('SKIP_WAITING');
}

async function checarVersao() {
  if (!registroSw) return;
  const agora = Date.now();
  if (agora - ultimaChecagem < 60000) return;
  ultimaChecagem = agora;
  try { await registroSw.update(); } catch { /* offline */ }
  await Promise.all(ARQUIVOS_VERSAO.map((p) => fetch(new URL(p, location.href), { cache: 'no-cache' }).catch(() => {})));
  if (registroSw.waiting && navigator.serviceWorker.controller) marcarVersaoNova();
}

async function aplicarVersao() {
  if (aoVivo) return;
  const w = registroSw?.waiting || registroSw?.installing;
  if (w) {
    recarregarAoAssumir = true;
    w.postMessage('SKIP_WAITING');
    return;
  }
  location.reload();
}

function registrarSw() {
  if (!('serviceWorker' in navigator)) return;
  const escopo = '/TaskFlow/copiloto/';
  if (!location.pathname.startsWith(escopo)) return;
  primeiraInstalacao = !navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (primeiraInstalacao) {
      primeiraInstalacao = false;
      return;
    }
    if (!recarregarAoAssumir) return;
    if (!recarregarPorVersao(aoVivo)) {
      recarregarDepois = true;
      return;
    }
    location.reload();
  });
  navigator.serviceWorker.addEventListener('message', (e) => {
    if (e.data?.tipo === 'versao') marcarVersaoNova();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checarVersao();
  });
  navigator.serviceWorker.register(`${escopo}sw.js`, { scope: escopo, updateViaCache: 'none' }).then((reg) => {
    registroSw = reg;
    reg.addEventListener('updatefound', () => {
      const novo = reg.installing;
      if (!novo) return;
      novo.addEventListener('statechange', () => {
        if (novo.state !== 'installed') return;
        if (ativarNaHora(!navigator.serviceWorker.controller)) assumirSePrimeira();
        else marcarVersaoNova();
      });
    });
    if (reg.waiting && navigator.serviceWorker.controller) marcarVersaoNova();
    else assumirSePrimeira();
    checarVersao();
  }).catch(() => {});
}

function carregarFundo() {
  try {
    const o = JSON.parse(localStorage.getItem(FUNDO_KEY) || 'null') || {};
    return { ...FUNDO_PADRAO, ...o, proprio: !!localStorage.getItem(FUNDO_IMG_KEY) };
  } catch {
    return { ...FUNDO_PADRAO, proprio: false };
  }
}

function aplicarFundo() {
  const entre = (v, min, max, padrao) => Math.min(max, Math.max(min, Number.isFinite(Number(v)) ? Number(v) : padrao));
  fundo.x = entre(fundo.x, -1.5, 1.5, 0);
  fundo.y = entre(fundo.y, -1.5, 1.5, 0);
  fundo.z = entre(fundo.z, FUNDO_ZOOM[0], FUNDO_ZOOM[1], 1);
  fundo.o = entre(fundo.o, 0.1, 1, 1);
  const r = document.documentElement;
  r.style.setProperty('--fx', String(fundo.x));
  r.style.setProperty('--fy', String(fundo.y));
  r.style.setProperty('--fz', String(fundo.z));
  r.style.setProperty('--fo', String(fundo.o));
}

function persistirFundo() {
  try {
    localStorage.setItem(FUNDO_KEY, JSON.stringify({ x: fundo.x, y: fundo.y, z: fundo.z, o: fundo.o }));
  } catch { /* segue na memória */ }
}

function pintarImagemFundo() {
  const caixa = document.getElementById('fundo');
  const img = caixa?.querySelector('img');
  if (!img) return;
  let src = null;
  try { src = localStorage.getItem(FUNDO_IMG_KEY); } catch { /* sem armazenamento */ }
  img.src = src || FUNDO_FOTO_PADRAO;
  caixa.classList.toggle('padrao', !src);
  fundo.proprio = !!src;
}

async function trocarFundo(arquivo) {
  if (!arquivo || !/^image\//.test(arquivo.type || '')) {
    mostrar('Escolha um arquivo de imagem.');
    return;
  }
  const url = URL.createObjectURL(arquivo);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    let salvo = false;
    for (const [lado, qualidade] of [[1800, 0.85], [1280, 0.8], [900, 0.72]]) {
      const fator = Math.min(1, lado / Math.max(img.naturalWidth, img.naturalHeight));
      const tela = document.createElement('canvas');
      tela.width = Math.max(1, Math.round(img.naturalWidth * fator));
      tela.height = Math.max(1, Math.round(img.naturalHeight * fator));
      tela.getContext('2d').drawImage(img, 0, 0, tela.width, tela.height);
      try {
        localStorage.setItem(FUNDO_IMG_KEY, tela.toDataURL('image/jpeg', qualidade));
        salvo = true;
        break;
      } catch { /* não coube: tenta menor */ }
    }
    if (!salvo) {
      mostrar('A imagem não coube no aparelho. Tente uma menor.');
      return;
    }
    fundo = { ...fundo, x: 0, y: 0, z: 1 };
    persistirFundo();
    pintarImagemFundo();
    aplicarFundo();
    editandoFundo = true;
    editando = false;
    ir('#/');
    mostrar('Imagem trocada. Ajuste o enquadramento.');
  } catch {
    mostrar('Não deu para abrir essa imagem.');
  } finally {
    URL.revokeObjectURL(url);
  }
}

function barraFundo() {
  if (!editandoFundo) return '';
  return `<div class="barra-edicao vidro">
    <p>Arraste a imagem para mover. Pinça ou o controle muda o tamanho.</p>
    <label>Tamanho<input type="range" min="${FUNDO_ZOOM[0]}" max="${FUNDO_ZOOM[1]}" step="0.01" value="${fundo.z}" data-acao="fundo-zoom" aria-label="Tamanho da imagem"></label>
    <label>Opacidade<input type="range" min="0.1" max="1" step="0.01" value="${fundo.o}" data-acao="fundo-opacidade" aria-label="Opacidade da imagem"></label>
    <div class="acoes-edicao">
      <button type="button" class="botao" data-acao="fundo-centralizar">Centralizar</button>
      <button type="button" class="botao sim" data-acao="concluir-fundo">Concluir</button>
    </div>
  </div>`;
}

function iconeTipo(tipo) {
  return {
    'klain-tarefa': ICO.tarefa,
    'klain-compromisso': ICO.agenda,
    'apto-gasto': ICO.moeda,
    'compras-item': ICO.sacola,
  }[tipo] || ICO.duvida;
}

function ajustarAltura(el) {
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
}

function autoAltura() {
  for (const el of document.querySelectorAll('textarea.titulo-item, textarea.auto')) ajustarAltura(el);
}

function saudacao() {
  const h = Number(partesSP(new Date().toISOString())?.hour ?? 12);
  if (h < 5) return 'Boa noite';
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function vazio(qual, filtrado) {
  const textos = {
    aprovar: ['Nada esperando você', 'O que você gravar aparece aqui para conferir.'],
    historico: ['Ainda sem histórico', 'Os itens aprovados e recusados ficam aqui.'],
    lista: ['A lista está vazia', 'Escreva o primeiro item no campo abaixo.'],
    item: ['Este item não está na fila', 'Ele pode ter sido decidido em outro aparelho.'],
  };
  const [titulo, sub] = filtrado ? ['Nada nesta combinação', 'Tire um filtro para ver mais itens.'] : (textos[qual] || textos.item);
  const limpar = filtrado ? `<button type="button" class="fantasma" data-acao="limpar-filtros" data-aba="${esc(qual)}">Limpar filtros</button>` : '';
  return `<div class="vazio">${DESENHO_VAZIO}<b>${esc(titulo)}</b><span>${esc(sub)}</span>${limpar}</div>`;
}

function campoTitulo(item, chave, valor) {
  const texto = textoDe(item, valor) || '';
  if (!emAberto(item.status)) return `<h2 class="titulo-item">${esc(texto || 'Sem título')}</h2>`;
  return `<textarea class="titulo-item" rows="1" aria-label="Título" placeholder="Título" enterkeyhint="done" data-acao="texto" data-obrigatorio="1" data-id="${esc(item.id)}" data-chave="${esc(chave)}">${esc(texto)}</textarea>`;
}

function campoDescricao(item, valor) {
  const texto = textoDe(item, valor) || '';
  if (!emAberto(item.status)) return texto ? campoLeitura('Descrição', texto, false) : '';
  return `<div class="campo"><div class="rot">Descrição</div>
    <textarea class="area auto" rows="2" aria-label="Descrição" placeholder="Sem descrição" data-acao="texto" data-id="${esc(item.id)}" data-chave="descricao">${esc(texto)}</textarea>
  </div>`;
}

function avisarEnvio(msg) {
  pularSelo = true;
  setTimeout(() => { pularSelo = false; }, 900);
  ir('#/');
  mostrar(msg);
}

async function adicionarDaBarra() {
  const campo = document.getElementById('add-compra');
  const nome = campo?.value || '';
  if (!nome.trim()) {
    campo?.focus();
    return;
  }
  // Em "Automática" a seção sai do nome; sem palpite, vai para Outros.
  const ambiente = secaoAdd || secaoDoMercado(nome) || 'Outros';
  const r = await dados.adicionarCompra({ nome, ambiente });
  if (!r.ok) {
    mostrar(r.mensagem || 'Não deu para incluir.');
    return;
  }
  if (r.compra) {
    compras = [...compras, r.compra];
    desenhar();
  } else {
    await depoisDeMudar();
  }
  document.getElementById('add-compra')?.focus();
}

async function decidirPorDeslize(id, decisao) {
  if (ocupado) return;
  ocupado = true;
  try {
    await aoDecidir(id, decisao);
  } catch (err) {
    mostrar(err.message);
  } finally {
    ocupado = false;
  }
}

function noRoda(e) {
  if (!editandoFundo || rota().tela !== 'gravar') return;
  if (e.target.closest?.('.barra-edicao')) return;
  fundo.z *= Math.exp(-e.deltaY * 0.0015);
  aplicarFundo();
  persistirFundo();
  const zoom = document.querySelector('[data-acao="fundo-zoom"]');
  if (zoom) zoom.value = String(fundo.z);
  e.preventDefault();
}

async function iniciar() {
  aplicarTema(temaAtual(), false);
  pintarImagemFundo();
  aplicarFundo();
  const aberto = await abrirDados();
  modo = aberto.modo;
  erroBoot = aberto.erro || '';
  dados = aberto.adaptador;
  if (dados && modo === 'supabase') dados._sessao = await dados.sessao();
  if (dados && (modo === 'mock' || dados._sessao)) await carregar();
  const raiz = document.getElementById('app');
  raiz.addEventListener('click', (e) => { noClique(e).catch((err) => mostrar(err.message)); });
  raiz.addEventListener('input', noInput);
  raiz.addEventListener('change', (e) => { noChange(e).catch((err) => mostrar(err.message)); });
  raiz.addEventListener('submit', (e) => { noSubmit(e).catch((err) => mostrar(err.message)); });
  document.addEventListener('keydown', (e) => { noKey(e).catch((err) => mostrar(err.message)); });
  document.addEventListener('pointerdown', noPonteiroDown, { passive: false });
  document.addEventListener('pointermove', noPonteiroMove, { passive: false });
  document.addEventListener('pointerup', noPonteiroUp);
  document.addEventListener('pointercancel', noPonteiroUp);
  window.addEventListener('resize', aplicarLayout);
  document.addEventListener('wheel', noRoda, { passive: false });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') atualizarFila();
  });
  window.addEventListener('hashchange', () => {
    if (rota().tela !== 'gravando') {
      pararReconhecimento();
      pararMic();
    }
    desenhar();
  });
  if (pose() && rota().tela === 'gravando') segundos = 7;
  else if (rota().tela === 'gravando') history.replaceState(null, '', `${location.pathname}${location.search}#/`);
  desenhar();
  registrarSw();
  if (modoDemo()) document.documentElement.dataset.adaptador = 'mock';
}

iniciar();
