# Copiloto

PWA de fila e aprovação dos agentes pessoais do Diego, em português. O nome é provisório.

Publicação prevista: `https://dkonrad88.github.io/TaskFlow/copiloto/`.

O app abre com o **adaptador mock** (valores de exemplo). O adaptador Supabase existe, aponta para o projeto Pessoal e fica **desligado**.

## O que a tela faz

- Fila misturada, da mais nova para a mais antiga, com os status reais: `aguardando você`, `para o BOSS`, `aprovado`, `recusado`, `criado`, `erro`.
- Filtro só no ícone (área, status, período). O histórico usa o mesmo filtro.
- Um card por tipo da fila: `klain-tarefa`, `klain-compromisso`, `apto-gasto`, `compras-item`, `indefinido`.
- Valor, data e cômodo editam no próprio card. O resto passa pelo lápis.
- Lista de compras agrupada por cômodo, com inclusão no estilo do app Lembretes.
- Temas Claro, Escuro e Café, com a paleta do Hub (`hub-assets/hub-tema-base.css` e `hub-tema.js`). Um ícone no topo direito mostra o tema atual e, a cada toque, segue Claro → Escuro → Café. A escolha fica em `localStorage`. Ao lado, o ícone da lista abre as compras.
- Datas em `dd/mm/yyyy`.

Itens do Hub Klain (`klain-tarefa` e `klain-compromisso`) nunca mostram palavra de casamento. A frase é reescrita para a sigla **CSMT**. O termo original pode ficar dentro de `payload.csmt.termos`, e a tela não o escreve.

Casamento e cartão são só layout (Fase 2). Não entram na fila e não usam os tipos do banco.

Pauta e reunião chegam como `klain-compromisso`: participantes, data/hora e local. Sem solicitante e sem executor.

## Entrada de voz

Quem grava, transcreve e envia é o **Atalho do iOS**, não este PWA.

```http
POST https://jlouesrrmqeauzlgvrpw.supabase.co/functions/v1/copiloto-entrada
Authorization: Bearer <chave do Atalho>
Content-Type: application/json

{ "texto": "…", "origem": "atalho" }
```

A função classifica e grava em `copiloto_itens`. O botão Gravar daqui só mostra o fluxo. No mock, ele acrescenta um exemplo local com status `para o BOSS`. Com o Supabase ligado, o botão não chama a rede.

## Como ligar o adaptador Supabase

O arquivo publicado continua com `adaptador: 'mock'` em `js/config.js`. Não commite chave. No aparelho, no console do PWA:

```js
localStorage.setItem('copiloto_adaptador', 'supabase');
localStorage.setItem('copiloto_supabase', JSON.stringify({
  url: 'https://jlouesrrmqeauzlgvrpw.supabase.co',
  key: 'sb_publishable_…'
}));
location.reload();
```

A `key` tem de ser a chave **publicável** (`sb_publishable_…`). O app recusa JWT com role `anon`, qualquer `service_role` e chave `sb_secret_`. Sem essa chave, nada conecta.

Depois do reload, entre com o e-mail e a senha do Diego. A sessão é o JWT de `authenticated`. Leitura e lista de compras saem com esse login (RLS). Não há fallback para a chave de serviço.

Para voltar aos exemplos: `localStorage.setItem('copiloto_adaptador', 'mock')` e recarregar. O botão "Usar os exemplos" na tela de login faz o mesmo.

### O que o adaptador lê

| Tabela | Uso |
|---|---|
| `copiloto_itens` | Fila. Colunas: `id`, `origem`, `tipo`, `transcricao`, `payload`, `status`, `decidido_em`, `ref_tabela`, `ref_id`, `teste`, `created_at`. |
| `hub_pessoas` | Dropdown: `id`, `nome`, `papel`, `usos` (text[]), `padrao`, `ativo`, `created_at`, `updated_at`. |
| `apto_compras_itens` | Lista, inclusive `quantidade` (text) e `valor_estimado` (numeric). |
| `apto_compras_propostas` | Proposta ligada por `copiloto_item_id`. A decisão não grava aqui direto. |
| `listas` | Acha a lista do apartamento para incluir um item. |

Payload por tipo:

- `klain-tarefa`: `{ titulo, descricao, vencimento, csmt }`
- `klain-compromisso`: `{ titulo, descricao, data_hora, local, csmt }`
- `apto-gasto`: `{ titulo, valor, data, ambiente, comodo_incerto }`
- `compras-item`: `{ nome, ambiente, quantidade, valor_estimado, comodo_incerto }`
- `indefinido`: `{ motivo, candidatos }`

`csmt` é `{ aplicado, termos }`. A tela mostra a sigla, não os termos.

As pessoas do card (solicitante, executor, em cópia, participantes) **não entram no payload**. Vão à parte, no corpo da decisão, porque `hub_pessoas` alimenta o dropdown e o contrato do payload não tem esses campos.

No cadastro, grupo tem `papel = 'grupo'` e `usos = {solicitante, executor}`. Pessoa tem `papel` igual ao setor e `usos` nulo, o que vale para todos os campos (no banco a coluna também pode vir com a lista completa). Solicitante e executor são um valor só: "— Ninguém —", depois os grupos e as pessoas por setor, com busca. O padrão (`padrao`) é o Diego Konrad. Em cópia é um array: só pessoas, sem grupo e sem "Ninguém", com busca, e os escolhidos aparecem como chips removíveis.

### Decisão: a primeira vale

Aprovar e recusar chamam a edge function **`copiloto-decidir`** (ainda não publicada) com o JWT do usuário:

```http
POST /functions/v1/copiloto-decidir
Authorization: Bearer <access_token do Diego>
```

```json
{
  "id": "uuid do copiloto_itens",
  "decisao": "aprovado",
  "tipo": "klain-tarefa",
  "payload": { "titulo": "…", "descricao": "…", "vencimento": "2026-11-17", "csmt": { "aplicado": false, "termos": [] } },
  "pessoas": { "solicitante": null, "executor": null, "em_copia": [], "participantes": [] }
}
```

A função precisa:

1. Validar o JWT (`auth.getUser`). Sem usuário, recusar.
2. Atualizar a linha **só se** `status` ainda for `aguardando você` ou `para o BOSS`.
3. Se nenhuma linha mudar, responder `{ "ok": false, "jaDecidido": true, "status": "<status atual>" }`.
4. Se gravar, responder `{ "ok": true, "status": "aprovado" }` ou `"recusado"`.

O PWA não faz `update` direto em `copiloto_itens` para decidir. Se a função não existir, a tela avisa e não grava por outro caminho.

`para o BOSS` é fila aberta: a pessoa escolhe o tipo e só então aprova. Recusar não exige tipo.

RLS está ligado. `apto_compras_itens` já tem policy para `authenticated`. `copiloto_itens`, `hub_pessoas` e `apto_compras_propostas` ainda não têm policy para esse papel: a leitura autenticada volta vazia ou com erro até essa policy existir. O app não fura isso.

## PWA no iPhone

`manifest.json` e `sw.js` usam escopo `/TaskFlow/copiloto/`. No Safari: Compartilhar → Adicionar à Tela de Início. O ícone é o botão de gravar na cor do Hub.

## Teste local

Sirva a raiz do repositório num caminho `/TaskFlow/` (o escopo do PWA depende disso) e abra `/TaskFlow/copiloto/`.

```bash
node --test copiloto/js/regras.test.mjs
```
