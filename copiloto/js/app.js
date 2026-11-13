import { abrirDados } from './dados.js';
import { adaptadorAtivo } from './config.js';
import {
  COMODOS, emAberto, fData, fDataHora, fHora, fValor, filtrar, idPadrao, montarListaPessoas,
  normalizarPessoas, ordenarFila, pValor, payloadCanonico, rotuloArea, rotuloStatus, rotuloTipo, soCsmt, tituloFila,
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
let toast = '';
let toastTimer = 0;
let segundos = 0;
let timer = null;
let mic = null;
let aoVivo = false;
let simulou = false;
let folha = null;
let rascunho = null;
let buscaMenu = '';

const $ = (html) => html;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pose = () => new URLSearchParams(location.search).get('pose') === '1';
const temaAtual = () => document.documentElement.getAttribute('data-tema') || 'escuro';

function svg(caminho) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${caminho}</svg>`;
}
const ICO = {
  filtro: svg('<path d="M4 7h16M6.5 12h11M10 17h4"/>'),
  relogio: svg('<circle cx="12" cy="12" r="8"/><path d="M12 8v5l3.5 2"/>'),
  lapis: svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>'),
  ok: svg('<path d="M5 12.5 10 17.5 19 7"/>'),
  volta: svg('<path d="M14 6 8 12l6 6"/>'),
  sol: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
  lua: svg('<path d="M21 14.5A8.5 8.5 0 1 1 9.5 3a7 7 0 0 0 11.5 11.5z"/>'),
  cafe: svg('<path d="M5 8h10v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8z"/><path d="M15 9h1.5a2.5 2.5 0 0 1 0 5H15"/><path d="M8 3v2M12 3v2"/>'),
  lista: svg('<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>'),
  engrenagem: svg('<path d="M4 7h16M4 12h16M4 17h16"/><circle cx="8" cy="7" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="9" cy="17" r="2"/>'),
  mic: svg('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>'),
  check: svg('<path d="M5 12.5 10 17.5 19 7"/>'),
};

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

function mostrar(msg) {
  toast = msg;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast = ''; desenhar(); }, 3200);
  desenhar();
}

function rota() {
  const p = (location.hash.replace(/^#/, '') || '/').split('?')[0].split('/').filter(Boolean);
  const [a, b, c, d] = p;
  if (!a || a === 'gravar') return { tela: 'gravar' };
  if (['aprovar', 'historico', 'lista', 'ajustes', 'gravando', 'enviado'].includes(a)) return { tela: a };
  if (a === 'fase2' && (b === 'casamento' || b === 'cartao')) return { tela: 'fase2', qual: b };
  if (a === 'item' && b) return { tela: 'item', id: b, menu: c === 'menu' ? d : '', data: c === 'data' ? d : '' };
  if (a === 'editar' && b) return { tela: 'editar', id: b };
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
    return `<span class="chip-pessoa">${esc(nome)}${tirar}</span>`;
  }).join('');
  const add = aberto
    ? `<button type="button" class="chip-add" data-acao="abrir-menu" data-id="${esc(item.id)}" data-campo="em_copia">Adicionar</button>`
    : '';
  return `<div class="campo"><div class="rot">Em cópia<span class="opc"> (Opcional)</span></div><div class="chips-pessoas">${chips}${add}</div></div>`;
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

function metaQuando(item, cheio) {
  const hora = fHora(item.created_at);
  const area = rotuloArea(item.tipo);
  return cheio ? `${fData(item.created_at)}, ${hora} · ${area}` : `${hora} · ${area}`;
}

function linhaFila(item, cheio) {
  const teste = item.teste ? ' · exemplo' : '';
  return `<button class="cartao" data-acao="abrir" data-id="${esc(item.id)}">
    <span><span class="t">${esc(tituloFila(item))}</span><span class="m">${esc(metaQuando(item, cheio) + teste)}</span></span>
    <span class="pilula ${classeStatus(item.status)}">${esc(rotuloStatus(item.status))}</span>
  </button>`;
}

function olho() {
  const nome = TEMA_NOME[temaAtual()];
  const extra = modo === 'mock' ? ' · Valores de exemplo' : '';
  return `<p class="olho">${esc(nome + extra)}</p>`;
}

function cabeca(titulo, opts = {}) {
  const centro = opts.centro ? ' centro' : '';
  let esq = '<span class="lado esq"></span>';
  if (opts.voltar) esq = `<span class="lado esq"><button class="voltar" data-acao="voltar" aria-label="Voltar">${ICO.volta}</button></span>`;
  if (opts.cancelar) esq = `<button class="link" data-acao="cancelar-edicao">Cancelar</button>`;
  let dir = '<span class="lado"></span>';
  if (opts.concluir) dir = `<button class="link forte" data-acao="concluir-edicao" data-id="${esc(opts.id)}">Concluir</button>`;
  else if (opts.ajustes) dir = `<span class="lado"><button class="icone" data-acao="ir" data-hash="#/ajustes" aria-label="Ajustes">${ICO.engrenagem}</button></span>`;
  const h = opts.centro
    ? `<div class="nav${centro}">${esq}<h1>${esc(titulo)}</h1>${dir}</div>`
    : `<div class="nav"><h1>${esc(titulo)}</h1>${dir}</div>`;
  return `${olho()}${h}`;
}

function estrela(obrigatorio) {
  return obrigatorio ? '<span class="estrela"> *</span>' : '<span class="opc"> (Opcional)</span>';
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
    'compras-item': 'Item · Lista de compras · Apartamento',
    indefinido: 'Indefinido · para o BOSS',
  };
  const lapis = emAberto(item.status) && item.tipo !== 'indefinido'
    ? `<button class="lapis" data-acao="ir" data-hash="#/editar/${esc(item.id)}">${ICO.lapis} Editar</button>`
    : '';
  return `<div class="kicker"><div class="k">${esc(mapa[item.tipo] || rotuloTipo(item.tipo))}</div>${lapis}</div>`;
}

function corpoCard(item) {
  const p = item.payload || {};
  const id = esc(item.id);
  if (item.tipo === 'indefinido') {
    const candidatos = (p.candidatos || []).map((t) => `<button class="chip" data-acao="escolher-tipo" data-id="${id}" data-tipo="${esc(t)}">${esc(rotuloTipo(t))}</button>`).join('');
    return `${campoLeitura('Tipo', 'Indefinido', true)}
      ${campoLeitura('Motivo', textoDe(item, p.motivo), true)}
      <div class="campo"><div class="rot">Escolher tipo<span class="estrela"> *</span></div><div class="chips">${candidatos || '<span class="leitura">Sem candidato</span>'}</div></div>
      <p class="dica">Aprovar sem tipo não grava. Recusar pode.</p>`;
  }
  if (item.tipo === 'klain-tarefa') {
    return `${campoLeitura('Tipo', 'Tarefa', true)}
      ${campoLeitura('Título', textoDe(item, p.titulo), true)}
      ${campoCaixa('Solicitante', rotuloPessoa(item, 'solicitante'), '▾', 'abrir-menu', `data-id="${id}" data-campo="solicitante"`, false)}
      ${campoCaixa('Executor', rotuloPessoa(item, 'executor'), '▾', 'abrir-menu', `data-id="${id}" data-campo="executor"`, false)}
      ${campoCopia(item)}
      ${campoCaixa('Vencimento', fData(p.vencimento) || 'Escolher', 'alterar', 'abrir-data', `data-id="${id}" data-campo="vencimento"`, false)}
      ${campoLeitura('Descrição', textoDe(item, p.descricao), false)}`;
  }
  if (item.tipo === 'klain-compromisso') {
    return `${campoLeitura('Tipo', 'Compromisso', true)}
      ${campoLeitura('Título', textoDe(item, p.titulo), true)}
      ${campoCaixa('Participantes', rotuloPessoa(item, 'participantes'), '▾', 'abrir-menu', `data-id="${id}" data-campo="participantes"`, true)}
      ${campoCaixa('Data e hora', fDataHora(p.data_hora) || 'Escolher', 'alterar', 'abrir-data', `data-id="${id}" data-campo="data_hora"`, true)}
      ${campoTexto(item, 'local', 'Local', p.local, false)}
      ${campoLeitura('Descrição', textoDe(item, p.descricao), false)}`;
  }
  if (item.tipo === 'apto-gasto') {
    const incerto = p.comodo_incerto ? ' · incerto' : '';
    return `${campoLeitura('Tipo', 'Gasto · Pagamento', true)}
      ${campoLeitura('Título', p.titulo, true)}
      ${campoCaixa('Data', fData(p.data) || 'Escolher', 'alterar', 'abrir-data', `data-id="${id}" data-campo="data"`, false)}
      ${campoValor(item, 'valor', 'Valor', p.valor, false)}
      ${campoCaixa('Cômodo', `${p.ambiente || 'Escolher'}${incerto}`, '▾', 'abrir-menu', `data-id="${id}" data-campo="ambiente"`, false)}`;
  }
  const incerto = p.comodo_incerto ? ' · incerto' : '';
  return `${campoLeitura('Item', p.nome, true)}
    ${campoCaixa('Cômodo', `${p.ambiente || 'Escolher'}${incerto}`, '▾', 'abrir-menu', `data-id="${id}" data-campo="ambiente"`, true)}
    ${campoTexto(item, 'quantidade', 'Quantidade', p.quantidade, false)}
    ${campoValor(item, 'valor_estimado', 'Valor estimado', p.valor_estimado, false)}
    ${item.notas ? campoLeitura('Descrição', item.notas, false) : ''}`;
}

function acoes(item) {
  if (!emAberto(item.status)) {
    return `<div class="aviso forte">Já foi decidido: ${esc(rotuloStatus(item.status))}. A primeira decisão vale.</div>`;
  }
  return `<div class="acoes">
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
  const pe = pessoasExemplo
    ? 'Exemplo. Grupos só em solicitante e executor. O padrão é Diego Konrad.'
    : 'Grupos só em solicitante e executor. Pessoa entra em todos os campos.';
  const ok = multi ? '<button class="mi" data-acao="fechar"><span>OK</span></button>' : '';
  return `<button class="dim" data-acao="fechar" aria-label="Fechar"></button>
    <div class="menu menu-pessoas" role="listbox">
      <div class="busca-wrap"><input class="menu-busca" data-acao="busca-menu" placeholder="Buscar" aria-label="Buscar" value="${esc(buscaMenu)}"></div>
      <div class="lista-pessoas">${htmlListaPessoas(item, campo)}</div>
      ${ok}<p class="pe">${esc(pe)}</p>
    </div>`;
}

function menuHtml(item, campo) {
  if (campo !== 'ambiente') return menuPessoas(item, campo);
  const atual = item.payload?.ambiente;
  const nomes = [...COMODOS];
  if (atual && !nomes.includes(atual)) nomes.unshift(atual);
  const lis = nomes.map((nome) => linhaMenu(item, campo, { id: nome, nome, sel: nome === atual }, false)).join('');
  return `<button class="dim" data-acao="fechar" aria-label="Fechar"></button>
    <div class="menu" role="listbox">${lis}<p class="pe">Cômodo do apartamento. Sala sozinha continua ambígua na entrada de voz.</p></div>`;
}

function prepararFolha(valor) {
  const iso = String(valor || '2026-11-13').slice(0, 10);
  if (!folha || folha.base !== iso) {
    const [y, m, d] = iso.split('-').map(Number);
    folha = { ano: y || 2026, mes: m || 11, dia: d || 1, base: iso };
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
  const dias = grade(folha.ano, folha.mes).map((d) => d
    ? `<button class="dia${d === folha.dia ? ' sel' : ''}" data-acao="dia" data-dia="${d}">${d}</button>`
    : '<span></span>').join('');
  const hora = campo === 'data_hora' ? (String(valor || '').split('T')[1] || '00:00').slice(0, 5) : '';
  const horaHtml = campo === 'data_hora'
    ? `<label class="campo"><div class="rot">Hora</div><input class="texto" type="time" id="hora-data" value="${esc(hora)}"></label>`
    : '';
  const iso = `${folha.ano}-${String(folha.mes).padStart(2, '0')}-${String(folha.dia).padStart(2, '0')}`;
  return `<button class="dim" data-acao="fechar" aria-label="Fechar"></button>
    <div class="sheet">
      <div class="sh"><button class="link" data-acao="fechar">Cancelar</button><b>${esc(rotulo)}</b><button class="link forte" data-acao="data-ok" data-id="${esc(item.id)}" data-campo="${esc(campo)}">OK</button></div>
      <div class="mes-nav"><button data-acao="mes" data-delta="-1" aria-label="Mês anterior">‹</button><span>${esc(nomeMes)}</span><button data-acao="mes" data-delta="1" aria-label="Próximo mês">›</button></div>
      <div class="sem"><span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span></div>
      <div class="dias">${dias}</div>
      ${horaHtml}
      <button class="ok" data-acao="data-ok" data-id="${esc(item.id)}" data-campo="${esc(campo)}">${esc(campo === 'data_hora' ? `${fData(iso)}, ${hora || '00:00'}` : fData(iso))}</button>
    </div>`;
}

const ROTULO_AREA = { auto: 'Automático', hub: 'Hub Klain', apto: 'Apto', compras: 'Compras' };

function prefsAtuais() {
  return dados?.prefs ? dados.prefs() : { aprovar: true, area: 'auto' };
}

function telaGravar() {
  return `${cabeca('Gravar', { centro: true, ajustes: true })}
    <main class="so-gravar">
      <button class="gravar" data-acao="gravar">Gravar</button>
    </main>`;
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

function telaFila(aba, titulo, cheio) {
  const f = filtrosAba[aba];
  const ativo = !!(f.status || f.periodo);
  const lista = itensDaAba(aba).map((item) => linhaFila(item, cheio)).join('') || '<p class="vazio">Nada nesta combinação.</p>';
  return `${cabeca(titulo, { centro: true, ajustes: true })}
    <main class="com-abas">
      <div class="aba-topo">
        <button class="icone" data-acao="filtro-aba" aria-expanded="${filtroAberto}" aria-label="Filtros desta aba">${ICO.filtro}${ativo ? '<i class="ponto"></i>' : ''}</button>
      </div>
      ${painelFiltro(aba)}
      ${erroFila ? `<p class="aviso">${esc(erroFila)}</p>` : ''}
      <div class="fila">${lista}</div>
    </main>`;
}

function telaGravando() {
  const seg = pose() ? 7 : segundos;
  const mm = String(Math.floor(seg / 60));
  const ss = String(seg % 60).padStart(2, '0');
  return `${cabeca('Copiloto', { centro: true })}
    <main><div class="meio">
      <button class="gravar vivo" data-acao="parar">Parar</button>
      <div class="relogio">${mm}:${ss}</div>
      <h2>Gravando</h2>
      <p>Toque para parar e enviar. A transcrição acontece no iPhone.</p>
      <p class="dica">O PWA não posta o áudio. Quem chama copiloto-entrada é o Atalho.</p>
    </div></main>`;
}

function telaEnviado() {
  return `${cabeca('Copiloto', { centro: true })}
    <main><div class="meio">
      <div class="selo">${ICO.ok}</div>
      <h2>Enviado</h2>
      <p>A proposta deve aparecer na fila em instantes, com o card do tipo, para você conferir.</p>
      <p class="dica">${simulou ? 'No exemplo, a fila ganhou um item local. ' : ''}No iPhone, o Atalho é quem envia.</p>
      <button class="fantasma" data-acao="ir" data-hash="#/aprovar">Ir para aprovar</button>
    </div></main>`;
}

function telaLista() {
  const grupos = new Map();
  for (const c of compras) {
    const k = c.ambiente || 'Sem cômodo';
    if (!grupos.has(k)) grupos.set(k, []);
    grupos.get(k).push(c);
  }
  let html = '<p class="dica">Apartamento · agrupado por cômodo</p>';
  for (const [ambiente, lista] of grupos) {
    html += `<div class="grp">${esc(ambiente)}</div>`;
    for (const c of lista) {
      const sub = [c.quantidade, c.valor_estimado != null ? `uns ${fValor(c.valor_estimado)}` : ''].filter(Boolean).join(' · ');
      html += `<button class="compra${c.comprado ? ' feita' : ''}" data-acao="compra" data-id="${esc(c.id)}">
        <span class="ck${c.comprado ? ' on' : ''}" aria-hidden="true">${c.comprado ? '✓' : ''}</span>
        <span><span class="n">${esc(c.nome)}</span>${sub ? `<span class="sm">${esc(sub)}</span>` : ''}</span>
      </button>`;
    }
    html += `<input class="add" data-acao="add-compra" data-ambiente="${esc(ambiente)}" placeholder="Adicionar em ${esc(ambiente)}" aria-label="Adicionar em ${esc(ambiente)}" enterkeyhint="done">`;
  }
  if (!grupos.size) html += '<p class="vazio">A lista está vazia.</p>';
  return `${cabeca('Lista', { centro: true, ajustes: true })}<main class="com-abas">${html}</main>`;
}

function telaItem(r) {
  const item = itemPor(r.id);
  if (!item) return `${cabeca('Aprovar', { centro: true, voltar: true })}<main><p class="vazio">Este item não está na fila.</p></main>`;
  let extra = '';
  if (r.menu && emAberto(item.status)) extra = menuHtml(item, r.menu);
  if (r.data && emAberto(item.status)) extra = dataHtml(item, r.data);
  const ref = item.ref_tabela ? `<p class="dica">Referência: ${esc(item.ref_tabela)}</p>` : '';
  return `${cabeca('Aprovar', { centro: true, voltar: true })}
    <main class="justa">${kick(item)}${corpoCard(item)}${ref}${acoes(item)}</main>${extra}`;
}

function camposEdicao(item) {
  const p = item.payload || {};
  if (!rascunho || rascunho.id !== item.id) {
    rascunho = {
      id: item.id,
      titulo: textoDe(item, p.titulo || ''),
      descricao: textoDe(item, p.descricao || ''),
      nome: p.nome || '',
    };
  }
  const titulo = item.tipo === 'compras-item'
    ? `<div class="campo"><div class="rot">Item<span class="estrela"> *</span></div><input class="texto" data-rascunho="nome" value="${esc(rascunho.nome)}"></div>`
    : `<div class="campo"><div class="rot">Título<span class="estrela"> *</span></div><input class="texto" data-rascunho="titulo" value="${esc(rascunho.titulo)}"></div>
       <div class="campo"><div class="rot">Descrição<span class="opc"> (Opcional)</span></div><textarea class="area" data-rascunho="descricao">${esc(rascunho.descricao)}</textarea></div>`;
  const nota = item.tipo === 'klain-tarefa'
    ? '<p class="dica">Solicitante, executor, em cópia e a data continuam no card, sem passar por aqui.</p>'
    : '<p class="dica">Valor, data e cômodo continuam no card.</p>';
  return `${campoLeitura('Tipo', rotuloTipo(item.tipo), true)}${titulo}${nota}`;
}

function telaEditar(r) {
  const item = itemPor(r.id);
  if (!item) return `${cabeca('Editar', { centro: true, voltar: true })}<main><p class="vazio">Este item não está na fila.</p></main>`;
  return `${cabeca('Editar', { centro: true, cancelar: true, concluir: true, id: item.id })}
    <main class="justa">
      <p class="dica">${esc(rotuloTipo(item.tipo))} · ${esc(rotuloArea(item.tipo))}. Só os campos que não se editam no card.</p>
      ${camposEdicao(item)}
    </main>`;
}

function telaFase2(qual) {
  const casamento = qual === 'casamento';
  const miolo = casamento ? `
    ${campoLeitura('Tipo', 'Gasto · Pagamento', true)}
    ${campoLeitura('Título', 'Sinal do fotógrafo', true)}
    ${campoCaixa('Solicitante', 'Diego', '▾', 'fase2', '', false)}
    ${campoCaixa('Executor', 'Diego', '▾', 'fase2', '', false)}
    ${campoCaixa('Data', '13/11/2026', 'alterar', 'fase2', '', false)}
    ${campoCaixa('Valor', 'R$ 2.000,00', 'R$', 'fase2', '', false)}
    ${campoLeitura('Fornecedor', 'Fotógrafo', false)}
    ${campoLeitura('Descrição', 'Pagar o sinal via Pix.', false)}`
    : `
    ${campoLeitura('Tipo', 'Gasto · Pagamento', true)}
    ${campoLeitura('Título', 'Almoço', true)}
    ${campoCaixa('Data', '13/11/2026', 'alterar', 'fase2', '', false)}
    ${campoCaixa('Valor', 'R$ 48,90', 'R$', 'fase2', '', true)}
    ${campoCaixa('Forma de pagamento', 'Cartão', '▾', 'fase2', '', true)}
    ${campoCaixa('Categoria', 'Alimentação', '▾', 'fase2', '', true)}`;
  const k = casamento ? 'Gasto · Pagamento · Casamento' : 'Gasto · Pagamento · pessoal / cartão';
  return `${cabeca('Aprovar', { centro: true, voltar: true })}
    <main class="justa">
      <p class="fase">Fase 2 — só layout</p>
      <div class="kicker"><div class="k">${esc(k)}</div></div>
      ${miolo}
      <div class="acoes">
        <button class="botao nao" data-acao="fase2">Recusar</button>
        <button class="botao sim" data-acao="fase2">Aprovar</button>
      </div>
      <p class="dica">Este card não usa os tipos da fila e não grava.</p>
    </main>`;
}

function telaAjustes() {
  const prefs = prefsAtuais();
  const conta = modo === 'supabase' && dados?._sessao?.user
    ? { modo: 'Conectado', login: dados._sessao.user.email || 'Conta autenticada' }
    : { modo: 'Exemplo', login: 'Sem login — dados de exemplo' };
  const temas = TEMAS.map((t) => `<button class="chip${temaAtual() === t ? ' on' : ''}" data-acao="definir-tema" data-tema="${t}">${esc(TEMA_NOME[t])}</button>`).join('');
  return `${cabeca('Ajustes', { centro: true, voltar: true })}
    <main>
      <div class="grupo">Tema</div>
      <div class="chips">${temas}</div>
      <div class="grupo">Conta</div>
      <div class="ajuste"><span>Modo</span><b>${esc(conta.modo)}</b></div>
      <div class="ajuste"><span>Login</span><b>${esc(conta.login)}</b></div>
      <div class="grupo">Aprovação</div>
      <div class="ajuste interruptor">
        <span><b>Passar por aprovação</b><small>Ligada, você confirma cada item. Desligada, só o que não é gasto nem item do Hub Klain segue direto — um item da lista, por exemplo. Gastos e itens do Hub Klain sempre passam por você.</small></span>
        <label class="sw"><input type="checkbox" role="switch" data-acao="aprovar-pref" ${prefs.aprovar ? 'checked' : ''} aria-label="Passar por aprovação"><i></i></label>
      </div>
    </main>`;
}

function chromeAba(tela) {
  if (!['gravar', 'aprovar', 'historico', 'lista'].includes(tela)) return '';
  const n = aguardando().length;
  const aba = (id, icone, rotulo, extra = '') => `<button type="button" role="tab" data-acao="aba" data-aba="${id}" aria-selected="${tela === id}" aria-label="${esc(rotulo)}">${ICONE(icone)}<span>${esc(rotulo)}</span>${extra}</button>`;
  const badge = n ? `<b class="selo-n">${n > 99 ? '99' : n}</b>` : '';
  const area = tela === 'gravar' ? chipArea() : '';
  return `${area}<nav class="abas vidro" role="tablist">
    ${aba('gravar', ICO.mic, 'Gravar')}
    ${aba('aprovar', ICO.check, 'Aprovar', badge)}
    ${aba('historico', ICO.relogio, 'Histórico')}
    ${aba('lista', ICO.lista, 'Lista')}
  </nav>`;
}

function ICONE(html) { return `<i class="aba-ico">${html}</i>`; }

function chipArea() {
  const prefs = prefsAtuais();
  const opcoes = [['auto', 'Automático'], ['hub', 'Hub Klain'], ['apto', 'Apto'], ['compras', 'Compras']];
  const menu = areaAberta ? `<div class="area-menu vidro" role="menu">${opcoes.map(([v, r]) => `<button type="button" role="menuitemradio" aria-checked="${prefs.area === v}" data-acao="definir-area" data-area="${v}">${esc(r)}${prefs.area === v ? '<span>✓</span>' : ''}</button>`).join('')}</div><button class="dim dim-area" data-acao="fechar-area" aria-label="Fechar áreas"></button>` : '';
  return `${menu}<div class="area-wrap"><button type="button" class="area-chip vidro" data-acao="area-menu" aria-expanded="${areaAberta}" aria-haspopup="menu">${esc(ROTULO_AREA[prefs.area] || 'Automático')}<span class="car">▲</span></button></div>`;
}

function telaLogin() {
  return `${olho()}
    <div class="nav centro"><span class="lado esq"></span><h1>Copiloto</h1><span class="lado"></span></div>
    <main>
      <p class="dica">Entre com a conta do Diego. A leitura e a decisão usam esse login. Sem chave anônima e sem service role.</p>
      ${erroBoot ? `<p class="aviso">${esc(erroBoot)}</p>` : ''}
      ${erroFila ? `<p class="aviso">${esc(erroFila)}</p>` : ''}
      <form class="login" data-acao="login">
        <input name="email" type="email" autocomplete="username" placeholder="E-mail" required aria-label="E-mail">
        <input name="senha" type="password" autocomplete="current-password" placeholder="Senha" required aria-label="Senha">
        <button class="botao sim" type="submit">Entrar</button>
      </form>
      <button class="botao cheio" data-acao="voltar-mock">Usar os exemplos</button>
    </main>`;
}

function telaErroBoot() {
  return `${olho()}
    <div class="nav centro"><span class="lado esq"></span><h1>Copiloto</h1><span class="lado"></span></div>
    <main>
      <p class="aviso">${esc(erroBoot)}</p>
      <button class="botao sim cheio" data-acao="voltar-mock">Voltar aos exemplos</button>
    </main>`;
}

function desenhar() {
  const raiz = document.getElementById('app');
  if (!dados && erroBoot) {
    raiz.innerHTML = telaErroBoot();
    return;
  }
  if (modo === 'supabase' && dados && !dados._sessao) {
    raiz.innerHTML = telaLogin();
    if (toast) raiz.insertAdjacentHTML('beforeend', `<div class="toast" role="status">${esc(toast)}</div>`);
    return;
  }
  const r = rota();
  if (!r.data) folha = null;
  let html = '';
  if (r.tela === 'gravar') html = telaGravar();
  else if (r.tela === 'aprovar') html = telaFila('aprovar', 'Aprovar', false);
  else if (r.tela === 'historico') html = telaFila('historico', 'Histórico', true);
  else if (r.tela === 'gravando') html = telaGravando();
  else if (r.tela === 'enviado') html = telaEnviado();
  else if (r.tela === 'lista') html = telaLista();
  else if (r.tela === 'ajustes') html = telaAjustes();
  else if (r.tela === 'item') html = telaItem(r);
  else if (r.tela === 'editar') html = telaEditar(r);
  else if (r.tela === 'fase2') html = telaFase2(r.qual);
  raiz.innerHTML = html + chromeAba(r.tela);
  if (toast) raiz.insertAdjacentHTML('beforeend', `<div class="toast" role="status">${esc(toast)}</div>`);
}

async function carregar() {
  if (!dados) return;
  const [fila, gente, lista] = await Promise.all([dados.listarItens(), dados.listarPessoas(), dados.listarCompras()]);
  itens = fila.itens || [];
  erroFila = fila.erro || '';
  pessoas = gente.pessoas || [];
  pessoasExemplo = !!gente.exemplo;
  compras = lista.compras || [];
  if (lista.erro && !erroFila) erroFila = lista.erro;
}

async function depoisDeMudar() {
  await carregar();
  desenhar();
}

function patchDoCampo(item, chave, valor) {
  if (chave === 'solicitante' || chave === 'executor') {
    const unico = Array.isArray(valor) ? valor[0] : valor;
    return { pessoas: { [chave]: unico || null } };
  }
  if (chave === 'em_copia' || chave === 'participantes') {
    return { pessoas: { [chave]: Array.isArray(valor) ? valor : [] } };
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
  if (r && r.jaDecidido) mostrar(`Já foi decidido: ${rotuloStatus(r.status)}. A primeira decisão vale.`);
  await depoisDeMudar();
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
    mostrar(decisao === 'aprovado' ? 'Aprovado.' : 'Recusado.');
    ir(`#/`);
  }
  await depoisDeMudar();
}

function pararMic() {
  if (mic) {
    for (const trilha of mic.getTracks()) trilha.stop();
    mic = null;
  }
  clearInterval(timer);
  timer = null;
  aoVivo = false;
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
  if (navigator.mediaDevices?.getUserMedia) {
    try { mic = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch { mic = null; }
  }
  ir('#/gravando');
}

async function pararGravar() {
  pararMic();
  if (modo === 'mock' && dados?.simularChegada) {
    await dados.simularChegada('Lembrete de voz (exemplo)');
    simulou = true;
  }
  ir('#/enviado');
}

function lerRascunho() {
  for (const el of document.querySelectorAll('[data-rascunho]')) {
    rascunho[el.dataset.rascunho] = el.value;
  }
}

async function concluirEdicao(id) {
  const item = itemPor(id);
  if (!item || !rascunho) return;
  lerRascunho();
  const payload = item.tipo === 'compras-item'
    ? { nome: rascunho.nome }
    : { titulo: rascunho.titulo, descricao: rascunho.descricao };
  if ((payload.titulo !== undefined && !String(payload.titulo).trim()) || (payload.nome !== undefined && !String(payload.nome).trim())) {
    mostrar('O título não pode ficar vazio.');
    return;
  }
  const r = await dados.atualizar(id, { payload });
  if (r?.jaDecidido) mostrar(`Já foi decidido: ${rotuloStatus(r.status)}. A primeira decisão vale.`);
  rascunho = null;
  ir(`#/item/${id}`);
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
  const el = e.target.closest('[data-acao]');
  if (!el) return;
  const acao = el.dataset.acao;
  if (acao === 'ir') { ir(el.dataset.hash); return; }
  if (acao === 'voltar') { if (history.length > 1) history.back(); else ir('#/'); return; }
  if (acao === 'aba') { filtroAberto = false; areaAberta = false; ir(el.dataset.aba === 'gravar' ? '#/' : `#/${el.dataset.aba}`); return; }
  if (acao === 'filtro-aba') { filtroAberto = !filtroAberto; desenhar(); return; }
  if (acao === 'area-menu') { areaAberta = !areaAberta; desenhar(); return; }
  if (acao === 'fechar-area') { areaAberta = false; desenhar(); return; }
  if (acao === 'definir-area') { dados?.definirPrefs?.({ area: el.dataset.area }); areaAberta = false; desenhar(); return; }
  if (acao === 'definir-tema') { aplicarTema(el.dataset.tema, true); desenhar(); return; }
  if (acao === 'abrir') { ir(`#/item/${el.dataset.id}`); return; }
  if (acao === 'gravar') { await comecarGravar(); return; }
  if (acao === 'parar') { await pararGravar(); return; }
  if (acao === 'fase2') { mostrar('Fase 2: este card ainda não grava.'); return; }
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
    const campo = el.dataset.campo;
    const ids = new Set(valorPessoa(item, campo));
    if (ids.has(el.dataset.valor)) ids.delete(el.dataset.valor); else ids.add(el.dataset.valor);
    await dados.atualizar(el.dataset.id, { pessoas: { [campo]: [...ids] } });
    await carregar();
    desenhar();
    const busca = document.querySelector('[data-acao="busca-menu"]');
    if (busca) busca.focus();
    return;
  }
  if (acao === 'tirar-copia') {
    const item = itemPor(el.dataset.id);
    const ids = valorPessoa(item, 'em_copia').filter((pid) => pid !== el.dataset.pessoa);
    await dados.atualizar(el.dataset.id, { pessoas: { em_copia: ids } });
    await depoisDeMudar();
    return;
  }
  if (acao === 'escolher-tipo') {
    const item = itemPor(el.dataset.id);
    const frase = soCsmt(item?.transcricao || '');
    const r = await dados.atualizar(el.dataset.id, {
      tipo: el.dataset.tipo,
      payload: { titulo: frase, nome: frase, descricao: frase },
    });
    if (r?.jaDecidido) mostrar(`Já foi decidido: ${rotuloStatus(r.status)}.`);
    await depoisDeMudar();
    return;
  }
  if (acao === 'decidir') { await aoDecidir(el.dataset.id, el.dataset.decisao); return; }
  if (acao === 'compra') {
    await dados.alternarCompra(el.dataset.id);
    await depoisDeMudar();
    return;
  }
  if (acao === 'cancelar-edicao') { rascunho = null; history.back(); return; }
  if (acao === 'concluir-edicao') { await concluirEdicao(el.dataset.id); return; }
  if (acao === 'restaurar') { await dados.restaurar(); filtrosAba = { aprovar: { status: '', periodo: '' }, historico: { status: '', periodo: '' } }; await depoisDeMudar(); mostrar('Exemplos restaurados.'); return; }
  if (acao === 'voltar-mock') {
    try {
      localStorage.setItem('copiloto_adaptador', 'mock');
      localStorage.removeItem('copiloto_supabase');
    } catch { /* segue */ }
    location.reload();
  }
}

function noInput(e) {
  const busca = e.target.closest('[data-acao="busca-menu"]');
  if (busca) {
    buscaMenu = busca.value;
    const r = rota();
    const item = itemPor(r.id);
    const box = document.querySelector('.lista-pessoas');
    if (item && box && r.menu) box.innerHTML = htmlListaPessoas(item, r.menu);
    return;
  }
  const el = e.target.closest('[data-rascunho]');
  if (!el || !rascunho) return;
  rascunho[el.dataset.rascunho] = el.value;
}

async function noChange(e) {
  if (e.target?.dataset?.acao === 'aprovar-pref') {
    dados?.definirPrefs?.({ aprovar: e.target.checked });
    return;
  }
  const el = e.target.closest('[data-acao="valor"], [data-acao="texto"]');
  if (!el) return;
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
  if (e.key === 'Enter' && e.target?.dataset?.acao === 'add-compra') {
    e.preventDefault();
    const nome = e.target.value;
    const ambiente = e.target.dataset.ambiente;
    const r = await dados.adicionarCompra({ nome, ambiente });
    if (!r.ok) mostrar(r.mensagem || 'Não deu para incluir.');
    else e.target.value = '';
    await depoisDeMudar();
  }
}

function registrarSw() {
  if (!('serviceWorker' in navigator)) return;
  const escopo = '/TaskFlow/copiloto/';
  if (!location.pathname.startsWith(escopo)) return;
  navigator.serviceWorker.register(`${escopo}sw.js`, { scope: escopo, updateViaCache: 'none' }).catch(() => {});
}

async function iniciar() {
  aplicarTema(temaAtual(), false);
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
  window.addEventListener('hashchange', desenhar);
  if (pose() && rota().tela === 'gravando') segundos = 7;
  desenhar();
  registrarSw();
  if (adaptadorAtivo() === 'mock') document.documentElement.dataset.adaptador = 'mock';
}

iniciar();
