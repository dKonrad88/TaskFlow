import assert from 'node:assert/strict';
import test from 'node:test';
import {
  STATUS, TIPOS, fData, filtrar, montarListaPessoas, payloadCanonico, soCsmt, termosCsmt, tituloFila, chaveProibida,
} from './contrato.js';
import { PESSOAS_EXEMPLO, criarAdaptadorMock, estadoExemplo } from './adaptador-mock.js';

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

  const copia = montarListaPessoas(PESSOAS_EXEMPLO, 'em_copia_id', 'p-tamires', '');
  assert.equal(copia.ninguem, false);
  assert.equal(copia.grupos.length, 0);
  assert.equal(copia.setores.find((s) => s.setor === 'Qualidade').pessoas[0].sel, true);

  const busca = montarListaPessoas(PESSOAS_EXEMPLO, 'executor_id', 'p-guilherme', 'hub');
  assert.equal(busca.ninguem, false);
  assert.equal(busca.grupos.length, 0);
  assert.equal(busca.setores.length, 1);
  assert.equal(busca.setores[0].pessoas[0].nome, 'Tamires Hübner');

  const porSetor = montarListaPessoas(PESSOAS_EXEMPLO, 'executor_id', '', 'direcao');
  assert.equal(porSetor.setores[0].setor, 'Direção');
  assert.equal(porSetor.setores[0].pessoas[0].nome, 'Diego Konrad');
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
