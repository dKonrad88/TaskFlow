# Copiloto

PWA de fila e aprovação dos agentes pessoais do Diego, em português. O nome é provisório.

Publicação prevista: `https://dkonrad88.github.io/TaskFlow/copiloto/`.

O app abre no **projeto Pessoal** (`jlouesrrmqeauzlgvrpw`), com a chave publicável e login por e-mail e senha — o mesmo do Hub. Sem sessão, a tela pede o login. O adaptador mock só aparece com `?demo=1`.

## O que a tela faz

- Fila misturada, da mais nova para a mais antiga, agrupada por dia (Hoje, Ontem, data), com os status reais: `aguardando você`, `para o BOSS`, `aprovado`, `recusado`, `criado`, `erro`.
- Na aba Aprovar cada item já vem aberto, com todos os campos e os botões Recusar e Aprovar no próprio card. Pessoas e datas abrem uma folha por cima da lista. A primeira decisão vale.
- Filtro no ícone à esquerda do título (status, período). Os filtros ativos viram chips que se tiram com um toque.
- Um card por tipo da fila: `klain-tarefa`, `klain-compromisso`, `apto-gasto`, `compras-item`, `indefinido`.
- Título, descrição, valor, datas e cômodo editam no próprio card. A tarefa tem Data de início e Vencimento.
- No computador (ponteiro de mouse, ou janela a partir de 700 px) o app aparece dentro de uma moldura do tamanho do celular, que encolhe para caber na janela.
- A foto de fundo, o enquadramento, o layout da tela Gravar e o tema ficam na tabela `copiloto_prefs`, uma linha por usuário. Só o celular grava; o computador só recebe (`supabase/prefs-aparencia.sql`).
- A aba Lista é a lista do supermercado, agrupada por seção (Hortifruti, Açougue e peixaria, Laticínios e frios, Padaria, Mercearia, Bebidas, Limpeza, Higiene, Outros). Um campo único inclui itens; em "Automática" a seção sai do nome. Os comprados ficam recolhidos no fim. Ela não é a lista de compras do apartamento.
- A navegação é a barra inferior do Gravador do Hub: Gravar, Aprovar, Histórico e Lista. Gravar mostra a saudação, a contagem da fila e o botão; ao gravar, a tela é a mesma, com o cronômetro e a fala acima do botão. O chip de área (Automático, Hub Klain, Apto, Compras) fica logo acima da barra. Tema, fundo, conta e "Passar por aprovação" ficam em Ajustes.
- O fundo é uma imagem atrás de todas as telas, nítida em Gravar e desfocada nas outras. Em Ajustes dá para trocar a imagem, mover, mudar o tamanho e a opacidade. A imagem e o enquadramento ficam no aparelho (`localStorage`) e, com login, sincronizam a partir do celular.
- Datas em `dd/mm/yyyy`.

Itens do Hub Klain (`klain-tarefa` e `klain-compromisso`) nunca mostram palavra de casamento. A frase é reescrita para a sigla **CSMT**. O termo original pode ficar dentro de `payload.csmt.termos`, e a tela não o escreve.

Pauta e reunião chegam como `klain-compromisso`: participantes, data/hora e local. Sem solicitante e sem executor.

## Entrada de voz

O botão Gravar transcreve no navegador (Web Speech API, `pt-BR`) quando ele existe. Sem a API, ou se a fala vier vazia, abre um campo de texto. O texto vai para `copiloto-entrada` com o JWT da sessão. A `COPILOTO_ENTRADA_KEY` do Atalho não está no PWA.

```http
POST https://jlouesrrmqeauzlgvrpw.supabase.co/functions/v1/copiloto-entrada
Authorization: Bearer <access_token do usuário>
Content-Type: application/json

{ "texto": "…", "origem": "pwa" }
```

O Atalho continua podendo mandar `Authorization: Bearer <COPILOTO_ENTRADA_KEY>`. A função aceita os dois. Ela grava em `copiloto_itens`, ainda com `teste: true`. Recebe também `area` (o chip do app: `hub`, `apto` ou `compras`), que fixa o tipo, e `aprovar` (a preferência "Passar por aprovação"): com `aprovar: false`, um item de compras já entra aprovado e vai direto para a lista do supermercado (`lista_itens`). O código de `supabase/copiloto-entrada/` é o que está publicado (versão 6, conferido em 14/11/2026).

No `?demo=1`, parar acrescenta um exemplo local e não chama a rede.

## Login

A URL e a chave publicável estão em `js/config.js`, no mesmo formato do Hub (`sb_publishable_…`). O app recusa `service_role` e `sb_secret_`. A sessão é o JWT de `authenticated`. Ajustes mostra o e-mail e o botão Sair.

A leitura depende de RLS. O SQL está em `supabase/rls-leitura.sql` e já foi aplicado (conferido em 14/11/2026). As policies usam `USING (true)`: qualquer conta autenticada do projeto lê a fila e as pessoas.

### O que o adaptador lê

| Tabela | Uso |
|---|---|
| `copiloto_itens` | Fila. Colunas: `id`, `origem`, `tipo`, `transcricao`, `payload`, `status`, `decidido_em`, `ref_tabela`, `ref_id`, `ref_externo`, `teste`, `created_at`. |
| `hub_pessoas` | Dropdown: `id`, `nome`, `papel`, `usos` (text[]), `padrao`, `ativo`, `created_at`, `updated_at`. |
| `lista_itens` | Lista do supermercado: `texto`, `qtd`, `categoria` (a seção), `preco`, `comprado`. |
| `listas` | Acha a lista de tipo `mercado` (a lista "Supermercado"). |

Payload por tipo:

- `klain-tarefa`: `{ titulo, descricao, inicio, vencimento, csmt }`
- `klain-compromisso`: `{ titulo, descricao, data_hora, local, csmt }`
- `apto-gasto`: `{ titulo, valor, data, ambiente, comodo_incerto }`
- `compras-item`: `{ nome, ambiente, quantidade, valor_estimado, comodo_incerto }`. Aqui `ambiente` guarda a seção do mercado, não um cômodo; `comodo_incerto` é verdadeiro quando a seção não foi reconhecida.
- `indefinido`: `{ motivo, candidatos }`

`csmt` é `{ aplicado, termos }`. A tela mostra a sigla, não os termos.

As pessoas do card (solicitante, executor, em cópia, participantes) **não entram no payload**. Vão à parte, no corpo da decisão, porque `hub_pessoas` alimenta o dropdown e o contrato do payload não tem esses campos.

No cadastro, grupo tem `papel = 'grupo'` e `usos = {solicitante, executor}`. Pessoa tem `papel` igual ao setor e `usos` nulo, o que vale para todos os campos (no banco a coluna também pode vir com a lista completa). Solicitante e executor são um valor só: "— Ninguém —", depois os grupos e as pessoas por setor, com busca. O padrão (`padrao`) é o Diego Konrad. Em cópia é um array: só pessoas, sem grupo e sem "Ninguém", com busca, e os escolhidos aparecem como chips removíveis.

### Decisão: a primeira vale

Aprovar e recusar chamam a edge function **`copiloto-decidir`** com o JWT do usuário. A função publicada é a cópia do repositório (`supabase/copiloto-decidir/`, versão 5, conferido em 14/11/2026). Ela aceita as pessoas no formato do PWA (`solicitante`, `executor`, `em_copia`, `participantes`).

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

RLS está ligado. `lista_itens` deixa o membro da lista ler e gravar (`is_membro(lista_id)`). `copiloto_itens` e `hub_pessoas` têm policy de leitura para `authenticated` (`supabase/rls-leitura.sql`, já aplicado).

### Etapa de IA na entrada

Tarefa e compromisso passam por `supabase/copiloto-entrada/ia.ts` antes de entrar na fila: o modelo `claude-haiku-5-5` resume o título, organiza a descrição, reconhece as pessoas citadas (só nomes do cadastro `hub_pessoas`) e as datas. As pessoas entram em `payload.pessoas`, no mesmo formato que a decisão grava.

A chave fica no segredo `ANTHROPIC_API_KEY` das Edge Functions do projeto Pessoal. Sem a chave, ou se a chamada falhar, demorar ou for recusada, o item entra com o que as regras montaram. A resposta da função traz `ia`: `ok`, `sem-chave`, `falhou`, `recusou` ou `nao-se-aplica`.

A fala e os nomes do cadastro de pessoas são enviados à API da Anthropic a cada gravação de tarefa ou compromisso. Item que chega como "para o BOSS" e recebe o tipo depois, no app, não passa pela IA.

### O que a aprovação cria

| Tipo | Ao aprovar |
|---|---|
| `compras-item` | Cria a linha em `lista_itens` (lista de tipo `mercado` da qual o usuário é membro) e o item fica `criado`, com `ref_tabela` e `ref_id`. Se a gravação falhar, fica `erro`. |
| `klain-tarefa`, `klain-compromisso` | Ficam `aprovado` e entram na fila do Hub (`payload.hub_envio`). O agente do Hub cria o item no site e devolve o número: o status passa a `criado`, com `ref_tabela` (`hub_klain_tarefa` ou `hub_klain_compromisso`) e `ref_externo` (o número). `ref_id` fica nulo. Se a validação ou a criação no Hub falhar, o item fica `erro`. |
| `apto-gasto` | Só muda para `aprovado`. Ainda não há destino definido. |

As edições feitas no card antes de decidir são rascunhos guardados no aparelho (`localStorage`: `copiloto_rascunhos`). Elas sobrevivem a recarregar a página, mas não passam para outro aparelho.

A biblioteca do Supabase fica em `vendor/supabase-js-2.119.0.js` e entra no cache do service worker: o app abre sem rede, mostrando o que conseguir ler.

## Envio ao Hub Klain

Aprovar no Copiloto é a autorização do Diego. A partir daí o fluxo é o mesmo do antigo Gravador, neste sentido: o app não grava no Hub; o agente do Hub da conta do Diego cria o item no site pelo navegador e devolve o número.

1. O Diego grava e aprova no Copiloto (`copiloto-decidir`).
2. `efetivar()` (em `criar.ts`, cópia idêntica nas duas funções) valida título, datas, pessoas e o filtro CSMT. Se estiver tudo certo, o item permanece `aprovado` e ganha `payload.hub_envio` (fila, avisos e o pacote já montado). Se falhar, fica `erro` e a função responde `{ ok: false, status: "erro", erro: "Aprovado, mas …" }`.
3. O agente lê a fila em `copiloto-hub`, cria no Hub e devolve o número ou o erro.
4. O item fica `criado` (com `ref_externo`) ou `erro`.

A regra da primeira decisão não muda: o status da aprovação só sai de `aguardando você` ou `para o BOSS`. O caminho de `compras-item` para `lista_itens` também não muda.

### Quem entra na fila

- Só `klain-tarefa` e `klain-compromisso` aprovados **depois** desta mudança, com `payload.hub_envio.fila_em` preenchido. Itens que já estavam `aprovado` sem essa marca **não são reenviados**.
- Só a conta do Diego. Se outra conta autorizada aprovar, o item vai para `erro` com a mensagem "Envio ao Hub só está liberado para a conta do Diego." e não entra na fila.
- Pessoa de `hub_pessoas` é casada com o Hub pelo nome. Sem solicitante ou executor, ou se o id não existir, entra a pessoa padrão (`padrao = true`). Em cópia e participantes sem correspondência, e grupos nesses campos, são omitidos, com aviso em `payload.hub_envio.avisos`.

### Campos que vão ao Hub

Tarefa: título, descrição, início, vencimento, solicitante, executor e em cópia. Início vazio vira o dia de hoje (horário de Brasília). Vencimento vazio fica sem data. Categoria, tipo e prioridade saem em branco; se o formulário do Hub recusar salvar, o agente usa `Pessoal`. Participantes de tarefa não são enviados (aviso).

Compromisso: título, descrição, local, data, hora de início, hora de fim (`início + 1 hora`; se passar da meia-noite, vem também `data_fim`), organizador (a pessoa padrão) e a aba Pessoas (as demais, com papel `Leitora`). Categoria em branco, com o mesmo recuo `Pessoal` se o Hub exigir. Datas no pacote do agente estão em `mm/dd/yyyy`, que é o formato do formulário do Hub.

O pacote do agente **nunca** leva `payload.csmt`, `payload.csmt.termos`, transcrição nem ids internos. Antes de enfileirar, `efetivar()` aplica de novo o filtro CSMT em título, descrição e local (troca o termo por `CSMT`; se ainda sobrar algum, o item fica `erro`).

### Segredos (só os nomes)

No painel do projeto Pessoal, Edge Functions > Secrets. Os valores não vão para o repositório, para o README nem para o chat.

| Nome | Uso |
|---|---|
| `COPILOTO_HUB_KEY` | Chave compartilhada da função `copiloto-hub` com o agente do Hub (header `x-hub-key`). |
| `COPILOTO_HUB_USER_DIEGO` | Id (UUID) da conta do Diego no login do Copiloto, para recusar aprovação de outra conta. |

A função usa também `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` do próprio projeto Pessoal, que já existem.

### Como o agente chama `copiloto-hub`

Função nova, `verify_jwt` desligado: a autenticação é o header `x-hub-key`. Publicação: `supabase/copiloto-hub/` (`index.ts` e `hub-envio.ts`).

```http
GET https://jlouesrrmqeauzlgvrpw.supabase.co/functions/v1/copiloto-hub
x-hub-key: <COPILOTO_HUB_KEY>
```

Resposta: `{ "ok": true, "itens": [ … ] }`. Cada item traz o pacote pronto (nomes, datas no formato do Hub, avisos). Sem `csmt`, transcrição ou ids. Só entram itens `aprovado`, sem `ref_externo`, com `payload.hub_envio`.

```http
GET /functions/v1/copiloto-hub?status=erro
x-hub-key: <COPILOTO_HUB_KEY>
```

Lista os que falharam no Hub (têm `hub_envio`, sem número). Erro de validação (sem `hub_envio`) não aparece aqui.

```http
POST /functions/v1/copiloto-hub
x-hub-key: <COPILOTO_HUB_KEY>
Content-Type: application/json

{ "id": "<uuid do copiloto_itens>", "status": "criado", "numero": "20261", "avisos": [] }
```

Ou `{ "id": "…", "status": "erro", "erro": "mensagem curta em português" }`. O número pode vir com `#`. A mesma chamada com o mesmo número, se o item já estiver `criado`, responde `ok` (idempotente).

Para devolver o item à fila depois de um erro no Hub: `{ "id": "…", "acao": "reenviar" }` (só com status `erro` e sem `ref_externo`).

### Status do item

| Status | Significado |
|---|---|
| `aprovado` com `payload.hub_envio` | Na fila, aguardando o agente criar no Hub. |
| `criado` | Criado no Hub. `ref_tabela` é `hub_klain_tarefa` ou `hub_klain_compromisso`, `ref_externo` é o número, `ref_id` é nulo. |
| `erro` com `hub_envio` | O Hub (ou o agente) falhou; `payload.hub_envio.erro` tem a mensagem. Pode reenviar. |
| `erro` sem `hub_envio` | A validação recusou (conta, título, data, CSMT). Não entra na fila. |

A migration `supabase/migrations/20261125120000_copiloto_itens_ref_externo.sql` cria a coluna `ref_externo`. Aplicar no projeto Pessoal **antes** de publicar as funções.

Ao publicar: `copiloto-entrada` fica com os arquivos do `main` (`index.ts`, `ia.ts`, `classificar.mjs`) mais o `criar.ts` novo e o `hub-envio.ts`; `copiloto-decidir` publica o `index.ts` do `main` mais o `criar.ts` novo e o `hub-envio.ts`; `copiloto-hub` é função nova (`verify_jwt` desligado). As duas cópias de `criar.ts` e as três de `hub-envio.ts` precisam permanecer idênticas.

## PWA no iPhone


`manifest.json` e `sw.js` usam escopo `/TaskFlow/copiloto/`. No Safari: Compartilhar → Adicionar à Tela de Início. O ícone é o botão de gravar na cor do Hub.

## Teste local

Sirva a raiz do repositório num caminho `/TaskFlow/` (o escopo do PWA depende disso) e abra `/TaskFlow/copiloto/`.

```bash
node --test copiloto/js/regras.test.mjs
deno test copiloto/supabase/hub-envio.test.ts
```
