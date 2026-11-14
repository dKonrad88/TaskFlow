import assert from 'node:assert/strict';
import test from 'node:test';
import {
  STATUS, TIPOS, fData, fDataHora, filtrar, montarListaPessoas, normalizarPessoas, payloadCanonico, soCsmt, termosCsmt, tituloFila, chaveProibida,
} from './contrato.js';
import { PESSOAS_EXEMPLO, criarAdaptadorMock, estadoExemplo } from './adaptador-mock.js';
import { exigeAprovacao } from './prefs.js';
import { montarEntrada } from '../supabase/copiloto-entrada/classificar.mjs';
import { readFileSync } from 'node:fs';
import { ativarNaHora, mostrarAvisoDeVersao, recarregarPorVersao, redePrimeiro } from './versao.js';

const AGORA = new Date('2026-11-13T15:00:00-03:00');
const entrada = (texto) => montarEntrada(texto, AGORA);

function disco() {
  let json = null;
  return {
    ler() { return json ? JSON.parse(json) : null; },
    gravar(estado) { json = JSON.stringify(estado); },
  };
}

test('status e tipos são os do banco', () => {
  assert.deepEqual(STATUS, ['aguardando você', 'para o BOSS', 'aprovado', 'recusado', 'criado', 'erro']);
  assert.deepEqual(TIPOS, ['klain-tarefa', 'klain-compromisso', 'apto-gasto', 'compras-item', 'indefinido']);
});

test('data em dd/mm/yyyy', () => {
  assert.equal(fData('2026-11-13'), '13/11/2026');
  assert.equal(fData('2026-11-17'), '17/11/2026');
});

test('compromisso só com data não volta um dia', () => {
  assert.equal(fDataHora('2026-11-17'), '17/11/2026');
  assert.equal(fDataHora('2026-11-17T14:30:00'), '17/11/2026, 14:30');
});

test('item Klain não exibe palavra de casamento', () => {
  const bruto = 'Revisar pesquisa do casamento com o comitê e a noiva';
  const limpo = soCsmt(bruto);
  assert.equal(limpo.includes('CSMT'), true);
  assert.equal(/casamento|noiva|noivo|wedding/i.test(limpo), false);
  assert.deepEqual(termosCsmt(bruto).sort(), ['casamento', 'noiva']);
  const item = estadoExemplo().itens.find((i) => i.id === 'ex-tarefa');
  assert.equal(/casamento|noiva|wedding/i.test(tituloFila(item)), false);
  assert.equal(tituloFila(item).includes('CSMT'), true);
  assert.equal(JSON.stringify(payloadCanonico(item.tipo, item.payload)).includes('casamento'), true);
});

test('payload canônico não ganha campo de fora', () => {
  const p = payloadCanonico('klain-tarefa', {
    titulo: 'casamento',
    descricao: 'ok',
    vencimento: '2026-11-17',
    solicitante: 'Diego',
    projeto: 'não entra',
  });
  assert.deepEqual(Object.keys(p).sort(), ['csmt', 'descricao', 'titulo', 'vencimento']);
  assert.equal(p.titulo, 'CSMT');
  assert.equal(p.csmt.aplicado, true);
  const gasto = payloadCanonico('apto-gasto', { titulo: 'Mercado', valor: 186, data: '2026-11-13', ambiente: 'Cozinha', fornecedor: 'x' });
  assert.deepEqual(Object.keys(gasto).sort(), ['ambiente', 'comodo_incerto', 'data', 'titulo', 'valor']);
  const lista = payloadCanonico('compras-item', { nome: 'Leite', ambiente: 'Cozinha', quantidade: '2 L', valor_estimado: 12, descricao: 'Integral' });
  assert.deepEqual(Object.keys(lista).sort(), ['ambiente', 'comodo_incerto', 'nome', 'quantidade', 'valor_estimado']);
});

test('a primeira decisão vence', async () => {
  const a = criarAdaptadorMock(disco());
  const primeira = await a.decidir('ex-tarefa', 'aprovado', { pessoas: { executor_id: 'p-guilherme' } });
  assert.equal(primeira.ok, true);
  const segunda = await a.decidir('ex-tarefa', 'recusado');
  assert.equal(segunda.ok, false);
  assert.equal(segunda.jaDecidido, true);
  assert.equal(segunda.status, 'aprovado');
  const { itens } = await a.listarItens();
  assert.equal(itens.find((i) => i.id === 'ex-tarefa').status, 'aprovado');
  const edicao = await a.atualizar('ex-tarefa', { payload: { titulo: 'mudou' } });
  assert.equal(edicao.jaDecidido, true);
});

test('para o BOSS entra na fila e precisa de tipo para aprovar', async () => {
  const a = criarAdaptadorMock(disco());
  const { itens } = await a.listarItens();
  const boss = filtrar(itens, { status: 'para o BOSS' });
  assert.equal(boss.length, 1);
  assert.equal(boss[0].status, 'para o BOSS');
  const cedo = await a.decidir('ex-boss', 'aprovado');
  assert.equal(cedo.motivo, 'tipo');
  assert.equal((await a.listarItens()).itens.find((i) => i.id === 'ex-boss').status, 'para o BOSS');
  const ok = await a.decidir('ex-boss', 'aprovado', {
    tipo: 'klain-tarefa',
    payload: { titulo: 'Separar a pesquisa do casamento', descricao: '', vencimento: '2026-11-20' },
  });
  assert.equal(ok.ok, true);
  const item = (await a.listarItens()).itens.find((i) => i.id === 'ex-boss');
  assert.equal(item.tipo, 'klain-tarefa');
  assert.equal(item.payload.titulo.includes('casamento'), false);
  assert.equal(item.payload.titulo.includes('CSMT'), true);
});

test('dropdown de tarefa separa grupo, setor e em cópia', () => {
  const sol = montarListaPessoas(PESSOAS_EXEMPLO, 'solicitante_id', 'p-diego', '');
  assert.equal(sol.ninguem, true);
  assert.equal(sol.ninguemSel, false);
  assert.deepEqual(sol.grupos.map((g) => g.nome), ['Compras', 'PCP', 'Qualidade']);
  assert.equal(sol.setores.find((s) => s.setor === 'Direção').pessoas[0].sel, true);
  assert.equal(sol.setores.some((s) => s.pessoas.some((p) => p.papel === 'grupo')), false);

  const copia = montarListaPessoas(PESSOAS_EXEMPLO, 'em_copia', ['p-tamires', 'p-everaldo', 'p-guilherme'], '');
  assert.equal(copia.ninguem, false);
  assert.equal(copia.grupos.length, 0);
  const marcadas = copia.setores.flatMap((s) => s.pessoas).filter((p) => p.sel).map((p) => p.id);
  assert.deepEqual(marcadas.sort(), ['p-everaldo', 'p-guilherme', 'p-tamires']);

  const busca = montarListaPessoas(PESSOAS_EXEMPLO, 'executor_id', 'p-guilherme', 'hub');
  assert.equal(busca.ninguem, false);
  assert.equal(busca.grupos.length, 0);
  assert.equal(busca.setores.length, 1);
  assert.equal(busca.setores[0].pessoas[0].nome, 'Tamires Hübner');

  const porSetor = montarListaPessoas(PESSOAS_EXEMPLO, 'executor_id', '', 'direcao');
  assert.equal(porSetor.setores[0].setor, 'Direção');
  assert.equal(porSetor.setores[0].pessoas[0].nome, 'Diego Konrad');
});

test('em cópia é array e solicitante/executor são um só', () => {
  const n = normalizarPessoas({
    solicitante: ['p-diego', 'p-outro'],
    executor: 'p-guilherme',
    em_copia: 'p-tamires',
  });
  assert.equal(n.solicitante, 'p-diego');
  assert.equal(n.executor, 'p-guilherme');
  assert.equal(Array.isArray(n.solicitante), false);
  assert.deepEqual(n.em_copia, ['p-tamires']);
  const varios = normalizarPessoas({ em_copia: ['a', 'a', 'b', ''] });
  assert.deepEqual(varios.em_copia, ['a', 'b']);
  assert.equal(varios.solicitante, null);
  assert.equal(varios.executor, null);
});

test('aprovação obrigatória em gasto e Hub, opcional na lista', () => {
  assert.equal(exigeAprovacao('klain-tarefa', { aprovar: false }), true);
  assert.equal(exigeAprovacao('klain-compromisso', { aprovar: false }), true);
  assert.equal(exigeAprovacao('apto-gasto', { aprovar: false }), true);
  assert.equal(exigeAprovacao('indefinido', { aprovar: false }), true);
  assert.equal(exigeAprovacao('compras-item', { aprovar: false }), false);
  assert.equal(exigeAprovacao('compras-item', { aprovar: true }), true);
});

test('chave anon e service_role são recusadas', () => {
  const jwt = (role) => {
    const corpo = Buffer.from(JSON.stringify({ role })).toString('base64url');
    return `eyJhbGciOiJIUzI1NiJ9.${corpo}.x`;
  };
  assert.equal(chaveProibida(jwt('anon')), 'anon');
  assert.equal(chaveProibida(jwt('service_role')), 'service_role');
  assert.equal(chaveProibida('sb_secret_abc'), 'service_role');
  assert.equal(chaveProibida('sb_publishable_exemplo'), null);
});

test('frase de compra vira item da lista', () => {
  const sala = entrada('comprar lâmpadas para a sala');
  assert.equal(sala.tipo, 'compras-item');
  assert.equal(sala.status, 'aguardando você');
  assert.equal(sala.payload.nome, 'lâmpadas');
  assert.equal(sala.payload.quantidade, null);
  assert.equal(sala.payload.ambiente, null);
  assert.equal(sala.payload.comodo_incerto, true);

  const leite = entrada('preciso de 2 litros de leite na cozinha');
  assert.equal(leite.tipo, 'compras-item');
  assert.equal(leite.payload.nome, 'leite');
  assert.equal(leite.payload.quantidade, '2 litros');
  assert.equal(leite.payload.ambiente, 'Cozinha');
  assert.equal(leite.payload.comodo_incerto, false);

  assert.equal(entrada('falta papel higiênico no lavabo').payload.ambiente, 'Lavabo');
  assert.equal(entrada('acabou o café').payload.nome, 'café');
  assert.equal(entrada('adicionar na lista detergente').payload.nome, 'detergente');
  assert.equal(entrada('preciso de duas lâmpadas').payload.quantidade, '2');
  assert.equal(entrada('preciso de duas lâmpadas').payload.nome, 'lâmpadas');
});

test('tarefa, compromisso e gasto em português', () => {
  const tarefa = entrada('criar uma tarefa para revisar o relatório amanhã');
  assert.equal(tarefa.tipo, 'klain-tarefa');
  assert.equal(tarefa.payload.titulo, 'revisar o relatório amanhã');
  assert.equal(tarefa.payload.vencimento, '2026-11-14');

  const lembra = entrada('me lembra de ligar para o Guilherme');
  assert.equal(lembra.tipo, 'klain-tarefa');
  assert.equal(lembra.payload.titulo, 'ligar para o Guilherme');

  const reuniao = entrada('reunião com o João amanhã às 15');
  assert.equal(reuniao.tipo, 'klain-compromisso');
  assert.equal(reuniao.payload.data_hora, '2026-11-14T15:00:00');

  const consulta = entrada('marcar consulta na sexta');
  assert.equal(consulta.tipo, 'klain-compromisso');
  assert.equal(consulta.payload.data_hora, '2026-11-20');
  assert.equal(consulta.payload.local, '');

  const gasto = entrada('gastei 40 reais no mercado hoje');
  assert.equal(gasto.tipo, 'apto-gasto');
  assert.equal(gasto.payload.valor, 40);
  assert.equal(gasto.payload.data, '2026-11-13');
  assert.equal(entrada('paguei o boleto de 120 reais').payload.valor, 120);
  assert.equal(entrada('comprei pão por 8 reais').tipo, 'apto-gasto');

  const csmt = entrada('criar uma tarefa do casamento com a noiva');
  assert.equal(csmt.tipo, 'klain-tarefa');
  assert.equal(/casamento|noiva/i.test(csmt.payload.titulo), false);
  assert.equal(csmt.payload.csmt.aplicado, true);
});

test('aviso de versão espera a gravação acabar', () => {
  assert.equal(mostrarAvisoDeVersao(true, false), true);
  assert.equal(mostrarAvisoDeVersao(true, true), false);
  assert.equal(mostrarAvisoDeVersao(false, false), false);
  assert.equal(recarregarPorVersao(true), false);
  assert.equal(recarregarPorVersao(false), true);
  assert.equal(ativarNaHora(false), true);
  assert.equal(ativarNaHora(true), false);
  assert.equal(redePrimeiro('/TaskFlow/copiloto/js/app.js'), true);
  assert.equal(redePrimeiro('/TaskFlow/copiloto/app.css'), true);
  assert.equal(redePrimeiro('/TaskFlow/copiloto/assets/fundo-familia.webp'), false);
  const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
  const install = sw.slice(sw.indexOf("addEventListener('install'"), sw.indexOf("addEventListener('message'"));
  assert.equal(install.includes('skipWaiting'), false);
  assert.match(sw, /SKIP_WAITING/);
  assert.match(sw, /copiloto-v12/);
});

test('frase solta continua indefinida', () => {
  assert.equal(entrada('oi tudo bem').tipo, 'indefinido');
  assert.equal(entrada('oi tudo bem').status, 'para o BOSS');
  const misturado = entrada('tarefa de comprar leite');
  assert.equal(misturado.tipo, 'indefinido');
  assert.deepEqual(misturado.payload.candidatos, ['klain-tarefa', 'compras-item']);
});
