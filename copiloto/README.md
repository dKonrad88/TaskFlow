# Copiloto

PWA de fila e aprovação dos agentes pessoais do Diego, em português. O nome é provisório.

Publicação prevista: `https://dkonrad88.github.io/TaskFlow/copiloto/`.

O app abre no **projeto Pessoal** (`jlouesrrmqeauzlgvrpw`), com a chave publicável e login por e-mail e senha — o mesmo do Hub. Sem sessão, a tela pede o login. O adaptador mock só aparece com `?demo=1`.

## O que a tela faz

- Fila misturada, da mais nova para a mais antiga, agrupada por dia (Hoje, Ontem, data), com os status reais: `aguardando você`, `para o BOSS`, `aprovado`, `recusado`, `criado`, `erro`.
- Na aba Aprovar, deslizar o card para a direita aprova e para a esquerda recusa. A primeira decisão vale, então não há desfazer.
- Filtro no ícone à esquerda do título (status, período). Os filtros ativos viram chips que se tiram com um toque.
- Um card por tipo da fila: `klain-tarefa`, `klain-compromisso`, `apto-gasto`, `compras-item`, `indefinido`.
- Título, descrição, valor, data e cômodo editam no próprio card. Não há mais tela de edição.
- Lista de compras agrupada por cômodo, com um campo único de inclusão e o cômodo escolhido por chip. Os comprados ficam recolhidos no fim.
- A navegação é a barra inferior do Gravador do Hub: Gravar, Aprovar, Histórico e Lista. Gravar mostra a saudação, a contagem da fila e o botão; ao gravar, a tela é a mesma, com o cronômetro e a fala acima do botão. O chip de área (Automático, Hub Klain, Apto, Compras) fica logo acima da barra. Tema, fundo, conta e "Passar por aprovação" ficam em Ajustes.
- O fundo é uma imagem atrás de todas as telas, nítida em Gravar e desfocada nas outras. Em Ajustes dá para trocar a imagem, mover, mudar o tamanho e a opacidade. A imagem e o enquadramento ficam só no aparelho (`localStorage`: `copiloto_fundo_img` e `copiloto_fundo`).
- Datas em `dd/mm/yyyy`.

Itens do Hub Klain (`klain-tarefa` e `klain-compromisso`) nunca mostram palavra de casamento. A frase é reescrita para a sigla **CSMT**. O termo original pode ficar dentro de `payload.csmt.termos`, e a tela não o escreve.

Casamento e cartão são só layout (Fase 2). Não entram na fila e não usam os tipos do banco.

Pauta e reunião chegam como `klain-compromisso`: participantes, data/hora e local. Sem solicitante e sem executor.

## Entrada de voz

O botão Gravar transcreve no navegador (Web Speech API, `pt-BR`) quando ele existe. Sem a API, ou se a fala vier vazia, abre um campo de texto. O texto vai para `copiloto-entrada` com o JWT da sessão. A `COPILOTO_ENTRADA_KEY` do Atalho não está no PWA.

```http
POST https://jlouesrrmqeauzlgvrpw.supabase.co/functions/v1/copiloto-entrada
Authorization: Bearer <access_token do usuário>
Content-Type: application/json

{ "texto": "…", "origem": "pwa" }
```

O Atalho continua podendo mandar `Authorization: Bearer <COPILOTO_ENTRADA_KEY>`. A função aceita os dois. Ela ainda está em **modo teste**: grava só em `copiloto_itens`, com `teste: true`. O código de `supabase/copiloto-entrada/` é o que está publicado (versão 6, conferido em 14/11/2026).

No `?demo=1`, parar acrescenta um exemplo local e não chama a rede.

## Login

A URL e a chave publicável estão em `js/config.js`, no mesmo formato do Hub (`sb_publishable_…`). O app recusa `service_role` e `sb_secret_`. A sessão é o JWT de `authenticated`. Ajustes mostra o e-mail e o botão Sair.

A leitura depende de RLS. O SQL está em `supabase/rls-leitura.sql` e já foi aplicado (conferido em 14/11/2026). As policies usam `USING (true)`: qualquer conta autenticada do projeto lê a fila e as pessoas.

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

Aprovar e recusar chamam a edge function **`copiloto-decidir`** com o JWT do usuário. A função publicada está em modo teste e é a cópia do repositório (`supabase/copiloto-decidir/`, versão 5, conferido em 14/11/2026). Ela aceita as pessoas no formato do PWA (`solicitante`, `executor`, `em_copia`, `participantes`).

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

RLS está ligado. `apto_compras_itens` já deixa o membro da lista ler (`apto_ci_all`). `copiloto_itens` e `hub_pessoas` têm policy de leitura para `authenticated` (`supabase/rls-leitura.sql`, já aplicado).

## PWA no iPhone

`manifest.json` e `sw.js` usam escopo `/TaskFlow/copiloto/`. No Safari: Compartilhar → Adicionar à Tela de Início. O ícone é o botão de gravar na cor do Hub.

## Teste local

Sirva a raiz do repositório num caminho `/TaskFlow/` (o escopo do PWA depende disso) e abra `/TaskFlow/copiloto/`.

```bash
node --test copiloto/js/regras.test.mjs
```
