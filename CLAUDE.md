# TaskFlow — Memória do Projeto (CLAUDE.md)

> **Memória compartilhada** entre as máquinas (PC da Empresa e Mac de casa).
> O Claude Code lê este arquivo automaticamente ao abrir o projeto. Os dois chats
> NÃO compartilham histórico — a ÚNICA coisa compartilhada é o repositório git.
> Mantenha este arquivo atualizado, principalmente o **Log de handoff** no fim.

## Visão do projeto
**TaskFlow** ("Gerenciador de Tarefas — Klain"): app pessoal **single-file**
(`index.html`, com HTML + CSS + JS tudo num arquivo só). Gerencia tarefas, projetos
(com fases, setores e cronograma), reuniões, rotinas, notas, agenda e qualidade
(análise sensorial), entre outros.

## ⭐ PAPEL DESTE REPO — é um PROTÓTIPO (LEIA E PARE DE RE-DISCUTIR)
Confirmado pelo Diego (jun/2026): este `index.html` é **protótipo de TELAS, visual e
LÓGICA / REGRA DE NEGÓCIO**. Serve para **passar a ideia de UX e as regras** para o
**Guilherme**, que está montando o sistema **de verdade dentro do banco de dados e do
servidor da Empresa**.
- O HUB que a **turma piloto (7 pessoas)** usa/testa é a build do **Guilherme no servidor
  da Empresa** — **NÃO é este git**. Telas que aparecem nos prints da turma e não existem
  aqui (ou vice-versa) são ESPERADAS: são sistemas diferentes. **Não tentar "reconciliar
  código" nem achar que falta algo** — aqui se prototipa, lá se implementa de verdade.
- **Identidade real** dos usuários = **login da Empresa no PC** (cada um usa o próprio
  login corporativo; o sistema do Guilherme sabe quem é). Aqui no protótipo a identidade é
  **simulada** (usuário "logado" fake p/ demonstrar a regra).
- **Dados aqui são DESCARTÁVEIS** (localStorage), como no sensorial. Recursos multiusuário
  reais (votação compartilhada, votos de várias pessoas, notificações de verdade) são
  responsabilidade do **backend do Guilherme** — aqui só se demonstra o FORMATO e as REGRAS.

## Onde vivem as coisas (LEIA ANTES DE MEXER)
- **Código / layout** → `index.html`, versionado no **git** e publicado via **GitHub Pages**.
  - Repositório GitHub: https://github.com/dKonrad88/TaskFlow  (**PÚBLICO** · conta dKonrad88)
  - GitHub Pages: **publicado** → https://dkonrad88.github.io/TaskFlow/ (serve o `index.html`; ~1min p/ buildar após cada push).
  - Repo foi tornado público para habilitar o Pages grátis. A chave *publishable* do Supabase no código
    é segura (RLS protege os dados). ⚠️ Depois de criar sua conta no app, **trancar novos cadastros**
    no Supabase: Authentication → Sign In/Providers → Email → desligar "Allow new users to sign up".
- **Dados do usuário** (tarefas, pessoas, projetos, reuniões, etc.):
  - **ESTADO ATUAL → `localStorage` do navegador** (chaves `LS_*`, gravadas via `safeSetItem`).
    - ✅ NÃO estão no git — o git **nunca** toca nos dados.
    - ⚠️ NÃO sincronizam entre PC e Mac, e **somem se limpar o navegador / recriar o Codespace**.
      Hoje **cada máquina tem seus próprios dados locais**.
  - **ESTADO ALVO (em montagem) → Supabase** (sync na nuvem, dentro do app). Quando a
    persistência migrar para o Supabase, aí sim vale de verdade "código no git / dados
    na nuvem, que não podem ser perdidos".
    - Projeto Supabase: **TaskFlow** · ref `gigkrjetrtbtdmdnqoof` · região `sa-east-1` · org "Konrad Diego".
    - URL: `https://gigkrjetrtbtdmdnqoof.supabase.co`
    - Chave pública (publishable, segura no cliente c/ RLS): `sb_publishable_-i-ZD2z9kbfTCLWu7K7eiQ_10bXjE4c`
    - **Schema (backend já criado):** tabela `public.app_state(user_id uuid, key text, value jsonb, updated_at)`,
      PK `(user_id,key)`, FK → `auth.users`, **RLS ligado** (cada usuário só lê/grava o próprio). 0 alertas de segurança.
    - **Arquitetura decidida:** espelho **chave-valor** do localStorage + **login e-mail/senha** (senha, não link mágico,
      porque o app roda como arquivo local e link mágico depende de redirect).
    - **Design de sync seguro:** localStorage continua a fonte primária (app funciona offline/igual).
      `auto-push` (debounce) manda cada chave salva pra nuvem; `pull` é **manual** ("Baixar da nuvem", com
      backup local antes + confirmação) — evita sobrescrever sem querer. Disciplina = a do git: enviar ao
      sair, baixar ao começar na outra máquina.
    - **Status:** backend PRONTO **e** sync IMPLEMENTADO no `index.html`. Botão **☁️ (Nuvem)** no cabeçalho:
      login e-mail/senha, "Enviar deste aparelho → nuvem", "Baixar da nuvem → este aparelho". Push é automático
      ao salvar (debounce 1,2s) quando logado; ao logar com a nuvem vazia, sobe tudo automaticamente.
      Pull faz backup local em `taskflow__backup_pre_pull` antes de sobrescrever, e recarrega.
      Chaves sincronizadas = todas com prefixo `taskflow`. Cliente via CDN `@supabase/supabase-js@2`.
    - **Ação manual 1x no painel Supabase:** Authentication → Sign In/Providers → Email → desligar
      "Confirm email" (pra o 1º cadastro/login funcionar na hora, sem e-mail de confirmação).
    - NÃO confundir com os outros projetos da conta: "Habit Tracker" (HUB) e "Tarefas" (antigo, pausado) — não mexer.

## Fluxo de trabalho (VÁRIAS máquinas, 1 repositório)
- Máquinas em uso: **Mac de casa**, **PC da Empresa**, **PC da Produção** (e o Diego já citou uma "3ª máquina").
  Não é mais "2 máquinas" — trate como **N**.
- Os chats do Claude Code são separados; o que sincroniza é **só o git**.
- ⚠️ **O tráfego é INTENSO e simultâneo.** Em 15/07 chegaram **17+ commits de outras máquinas entre um `fetch` e
  um `push`** — e numa ocasião a outra máquina refatorou a MESMA área (a OS) enquanto eu editava, obrigando a
  reescrever a feature na base nova. Um `index.html` de ~33k linhas editado por N máquinas é pólvora: se duas
  mexerem na mesma função, o merge dói. **Por isso a regra abaixo não é burocracia.**

### Ao COMEÇAR a sessão (quando o Diego disser "tô no PC" ou "tô no Mac")
1. `git pull` (trazer o código mais recente).
2. Ler este `CLAUDE.md` (em especial o Log de handoff).

### SEMPRE, antes de editar E antes de commitar
`git fetch` + conferir `git rev-list --count HEAD..origin/main`. Se ≠ 0, **parar e analisar** (regra 3) antes de
qualquer coisa. Receita que funcionou p/ divergência com trabalho local não commitado:
`git stash` → `git pull --ff-only` → `git stash pop` (conferir conflito) → validar → commitar.

### Ao TERMINAR a sessão
1. `git add -A && git commit && git push`.
2. Atualizar o **Log de handoff** (entrada nova no topo): data, máquina, o que mudou, pendências.

## Regras de segurança (NÃO IGNORAR — já houve risco de perder dados em outro projeto)
1. **Git só versiona CÓDIGO.** Nunca subir um estado vazio/parcial por cima dos dados.
   Mudança de dados é só dentro do app; mudança de código vai pelo git.
2. **Backup antes de git destrutivo.** Antes de qualquer `reset`/`checkout` que sobrescreva
   arquivos, copiar o `index.html` para `backups/` primeiro.
3. **Divergência local × remoto = NÃO fazer push/pull cego.** Clonar o remoto numa pasta
   SEPARADA, comparar (tamanho, marcadores de funcionalidades) e mostrar as diferenças
   ANTES de decidir o que manter. Nunca sobrescrever trabalho sem o Diego confirmar.
4. **Commit + push são AUTÔNOMOS** (Diego autorizou em 15/07/2026 — não ficar pedindo "posso commitar?" a
   cada mudança; só commitar e avisar o que foi feito). **MAS continua obrigatório:** `git fetch` ANTES de
   editar/commitar, e **divergência local × remoto exige análise + confirmação** (regra 3) — nunca pull/merge
   cego, nunca force-push. Edição que SOBRESCREVA arquivo alheio também exige confirmação.
5. Commits terminam com:
   `Co-Authored-By: Claude <noreply@anthropic.com>`
6. `backups/` e `.claude/` ficam **fora do git** (ver `.gitignore`).

## Log de handoff (mais recente no topo)

### 2026-07-18 (g) — PC da Empresa — Anotações: Enter continua a lista · pauta entra no CURSOR · AUTOR da pauta editável (commits `bb58992`,`695ba66`)
- **Coluna reservada p/ INDICADORES** (`bb58992`): aviso **neutro e discreto** (sem card/borda/fundo/negrito, `--text3`) naquele vazio à esquerda dos
  cards — "Espaço reservado para os indicadores desta reunião". Grid do painel foi de **3 p/ 4 colunas** (`.reun-col-kpi`, `order:0`); o `max-width`
  do modo foco subiu **1400→1580** p/ as 3 colunas existentes NÃO encolherem; abaixo de **1280px** a coluna some e o grid volta a 3.
  - 🐛 **FIX de brinde:** o `@media(max-width:1040px)` estava **ANTES** de `body.reun-focus .reun-grid4` — mesma especificidade, regra posterior vence
    → **no modo foco o painel não colapsava** em tela estreita. Movido p/ depois das regras do foco (duplicata removida, motivo comentado no lugar).
- **ENTER numa linha com check → cria OUTRO check** (continua a lista). Linha do check **vazia** → Enter **SAI** da lista (senão fica preso criando
  checks vazios). ⚠️ O "vazio" **troca `&nbsp;` por espaço antes do `trim()`** — `trim()` NÃO remove nbsp e a linha do check sempre tem um; sem isso a
  saída da lista nunca dispararia. (O regex tem o nbsp **literal**; há comentário no código explicando — se um editor normalizar o caractere, quebra.)
- **Assunto da pauta entra ONDE O CURSOR ESTIVER** nas Anotações (antes ia sempre pro fim). Como clicar no ícone tira o foco do editor, o último range
  válido é guardado em `keyup`/`mouseup` (**`_anotSaveRange`**, mesma ideia do `nmoSaveRange` das Notas) e usado quando a seleção ao vivo não serve;
  sem cursor prévio, cai no fim como antes. O scroll agora vai até a **linha inserida**, não até o fim do editor.
- ⭐ **AUTOR DA PAUTA agora é ESCOLHÍVEL** (era sempre `CURRENT_USER_ID`, sem UI — o Diego perguntou "como faço para colocar um autor?"):
  - **Na criação:** select **"Quem trouxe:"** na linha de novo assunto (default = eu). **Mantém o valor entre um assunto e outro** — a linha de add
    vive **FORA** do `#pauta-view`, então o re-render não a recria → dá p/ lançar vários da mesma pessoa em sequência.
  - **Em item existente:** **ícone de pessoa** na linha abre um `<select>` invisível sobre o botão e dispara o dropdown nativo (mesmo truque do
    `abrirDatePickerTarefa`), com opção **"— sem autor —"**. Ao escolher, salva e `_pautaRefresh` reagrupa.
- Refatorado: `_anotNovoCheckEl`/`_anotCursorNoFim`/`_anotBlocoDoCursor` extraídos (posicionar cursor estava duplicado).
- ⚠️ NÃO testado em navegador. Balanço idêntico ao HEAD.

### 2026-07-18 (f) — PC da Empresa — Ícone na pauta que joga o assunto p/ as Anotações (commit `f3a0607`)
- Pedido do Diego: **sem poluir o card da Pauta** com campo de texto — um **ícone discreto por assunto** (`ti-note`, cinza, azul no hover) que
  "pula" pro bloco de Anotações. Clicar acrescenta no fim: **`☐ Assunto: `** com o **cursor já no fim**, pronto p/ sair digitando.
  Está na linha de cada assunto **e na pauta principal** (`_pautaParaAnotacao` + wrappers `_pautaItemParaAnotacao`/`_pautaPrincParaAnotacao`).
- ⚠️ **3 detalhes que não são óbvios** (se mexer aqui, preservar): (1) monta via **DOM, não `innerHTML+=`** — recriar o innerHTML apagaria o estado
  dos checks já marcados e o cursor de quem estivesse digitando; (2) o `<b>` leva **só o título** e o espaço vem **depois dele num nó de texto solto**,
  senão o que a pessoa digitar sai em negrito; (3) o HTML passa o **ÍNDICE**, nunca o texto — assunto com apóstrofo ("Análise d'água") quebraria o
  `onclick` inline.
- Salva por `_anotSalvar` → `saveMeeting_db`, que **só persiste** (não re-renderiza) → foco e cursor sobrevivem.
- ⚠️ NÃO testado em navegador. Balanço idêntico ao HEAD.

### 2026-07-18 (e) — PC da Empresa — Pauta com AUTOR (quem trouxe o assunto) + card de ANOTAÇÕES no painel (commit `e9028f9`)
- **AUTOR DO ASSUNTO DA PAUTA:** cada item registra quem o trouxe; a lista fica **ordenada por nome**, com uma **cabecinha por pessoa** (não repete
  o nome em toda linha). Itens antigos (sem autor) caem num grupo **"sem autor"** no fim.
  - ⚠️ **DECISÃO DE MODELO (importante):** guardado como **MAPA POR TEXTO** — `m.pautaAutor={texto:pessoaId}` — e **NÃO como array paralelo**.
    Motivo: `m.pauta`/`m.pautaDone` já são 2 arrays alinhados por índice e são mexidos em **~9 pontos** do código (add, splice, modelo, PLAUD,
    tarefa→pauta, 2 caminhos de carry-over, import, nova ocorrência); um terceiro array desalinharia **em silêncio** — o autor apareceria no assunto
    errado. Por texto, o vínculo é imune a splice/reordenação. Custo aceito: 2 assuntos com texto idêntico na mesma reunião compartilham autor.
  - ⚠️ A **ordenação é só da EXIBIÇÃO**: o **índice ORIGINAL** continua indo nos handlers (`togglePautaItem`/`removerPautaItem`), senão marcar/remover
    atingiria o assunto errado. Mesmo padrão do `.reverse()` do Histórico.
  - Autor gravado em **todos os caminhos que criam item**: add manual (`pautaConfirmarAdd`), modelo (`_pautaAplicarModelo` — refaz o mapa, autor = quem
    aplicou), PLAUD (`_plaudLinhaPara`) e tarefa→pauta. **Preservado nos 2 caminhos de carry-over** (série materializada + `_recNovaOcorrencia`),
    e **só copia quando havia autor** — sem essa guarda, item antigo seria atribuído a quem encerrou a reunião.
- **CARD "ANOTAÇÕES"** no painel, **abaixo da Pauta** (coluna esquerda): bloco de notas `contenteditable` + `execCommand` (mesmo padrão do editor de
  Notas do HUB). Barra: **negrito · Título/Subtítulo/Texto · lista numerada · item com check · 5 cores · limpar formatação**. Guarda HTML em
  **`m.anotacoes`**; não aparece na reunião "rápida". Funções: `_reunAnotacoesHTML`/`_anotSalvar`/`_anotSalvarDeb`/`_anotCmd`/`_anotCheck` + CSS `.anot-*`.
  - O **check** usa `toggleAttribute('checked')` — sem isso o estado marcado não sobreviveria ao salvamento (o clique não altera o atributo no HTML).
  - ⚠️ **O painel re-renderiza inteiro** em várias ações (marcar pauta, concluir tarefa, add decisão) → o que não estiver salvo se perde. Por isso:
    **debounce curto (500ms)** no `oninput` + **flush no blur** + **flush ao trocar de sub-aba** (`_reunSetSubView`, junto do flush da ATA que já existia).
    **NUNCA chamar `openReuniaoView` no save** — re-render a cada tecla mataria foco e cursor. Se ainda assim perder os últimos caracteres em algum
    caso, reduzir o debounce.
  - Os botões da barra usam `onmousedown="event.preventDefault()"` p/ não roubar o foco/seleção do editor (senão o `execCommand` não tem onde aplicar).
- `Object.assign(m,obj)` do `saveReuniao` **preserva** `pautaAutor` e `anotacoes` ao editar a reunião (conferido).
- ⚠️ NÃO testado em navegador. Balanço idêntico ao HEAD (backticks +6 = os 3 templates novos).

### 2026-07-18 (d) — PC da Empresa — FIX de REGRESSÃO: voltar da série sumia no modo foco + botões de Decisões padronizados (commit `caae671`)
- 🔴 **REGRESSÃO MINHA (do `5ea40b8`, entrada (a) de hoje):** ao mover o "Voltar" p/ a topbar, o **voltar da SÉRIE foi junto** — e no modo foco
  **a topbar inteira é escondida por CSS** (`body.reun-focus .topbar{display:none}`). Resultado: o Diego abriu uma reunião anterior pelo card
  "Decisões anteriores" **dentro do modo foco** e ficou **SEM SAÍDA** (o botão "Sair" só desliga o foco, não desempilha a série).
  - **Fix:** o nome da reunião anterior passa a ser calculado 1× (**`_serieAnteriorNome`**) e alimenta **2 botões**: o da topbar (modo normal,
    como estava) e um **DISCRETO no canto superior esquerdo da `.reun-focus-bar`** (**`_voltarSerieFoco`** — ícone + "Voltar", nome completo no tooltip).
- ⚠️ **LIÇÃO (vale p/ qualquer máquina):** **tudo que for movido p/ a topbar SOME no modo foco.** Antes de mover algo pra lá, conferir se precisa
  de equivalente na `.reun-focus-bar` ou na trilha lateral. O mesmo vale p/ o Painel de Projeto (`body.proj-focus`).
- **Botões de "Decisões tomadas" padronizados:** estavam `[Adicionar][Cancelar]` à esquerda, contra `[Cancelar][+ Adicionar]` à direita em Pauta e
  Tarefas. Agora seguem o mesmo padrão dos outros 2 cards (`justify-content:flex-end`, `.btn-modal-cancel` + `.btn-modal-save` com ícone `+`).
- ⚠️ NÃO testado em navegador. Balanço idêntico ao HEAD (backticks +2 = o template novo, paridade mantida).

### 2026-07-18 (c) — PC da Empresa — Reunião: aba PESSOAS em 2 colunas + data da tarefa EDITÁVEL (commit `b448628`)
- ⭐ **ABA PESSOAS REDESENHADA** (`_reunPessoasInlineHTML` reescrita) — o layout antigo era **um grid só** onde o mesmo card misturava
  "está selecionado?" e "compareceu?", o que confundia. Agora são **2 CARDS lado a lado**:
  - **Esquerda "Disponíveis"** — quem ainda não participa, **SEM checkbox**: o clique na pessoa **já é a ação**, ela pula pro card da direita
    (seta → aparece no hover). Quem participa com frequência (2+ reuniões, via `_reunFreqMap`) sobe ao topo, com estrela.
  - **Direita "Participantes"** — agrupados por **PAPEL, com título e contador** (Organizador → Editor → Leitor), alfabético dentro do grupo.
    O **check da FRENTE agora é PRESENÇA** (compareceu no dia). Sair da reunião = **botão × no fim da linha**.
  - CSS novo: **`.reun-pessoas-2col`** (colapsa em 1 coluna abaixo de 860px) + `.reun-pessoa-disp`/`.reun-add-seta`.
  - ⚠️ A aba Pessoas do **PROJETO** (`renderProjectProPessoas`, ~27040) **NÃO foi mexida** — segue no layout antigo (grid único com check).
    Se o Diego gostar deste, vale espelhar lá p/ ficarem iguais.
- 🐛 **BUG LATENTE corrigido junto:** tirar alguém da reunião **não limpava** `facilitador`/`organizador`/`papeis`/`presencas` → a aba Info seguia
  mostrando **"Conduz: Fulano" com o Fulano fora da reunião**. Era pré-existente, mas o × dedicado tornou fácil de alcançar → `_toggleParticipanteReuniao`
  agora limpa os 4 campos ao remover.
- **DATA DA TAREFA EDITÁVEL** (pedido: "algumas coisas podem mudar no meio do caminho"): clicar na data abre o **date picker nativo**, reusando o
  caminho do resto do HUB (`abrirDatePickerTarefa(id, this)` → `changeDate` → `refreshUI`, que reabre o painel). Vale p/ tarefas **novas E herdadas**
  da reunião anterior. Sem data, aparece um **ícone de calendário clicável** no lugar do vazio.
- **Tarefas "da reunião anterior": título da reunião REMOVIDO** (é sempre a mesma série → ruído). **Mantida só a DATA** — é o que distingue de qual
  ocorrência a tarefa veio (no teste do Diego havia tarefas de 16/jul e 17/jul juntas). ⚠️ Isso REVERTE em parte o `cabe0df` (16/07 g), que tinha
  ADICIONADO o nome; a informação útil (a data) ficou.
- ⚠️ **NÃO testado em navegador.** Balanço de delimitadores idêntico ao HEAD; conferido que as 7 funções referenciadas existem e que não sobrou
  resquício das vars da função reescrita (os `_ppl`/`gridRows` que o grep acha são de `renderProjectProPessoas` e do modal `abrirPresencaReuniao` [SUPERSEDED]).

### 2026-07-18 (b) — PC da Empresa — Painel de Reunião: respiros, decisões sem duplicar, histórico invertido, ORDEM DOS ÍCONES (commit `b84ab7b`)
- Leva de 8 ajustes do Diego testando o Painel no Pages (continuação da entrada (a) abaixo):
- **Subtítulo removido**: "Pauta, tarefas, decisões e registro do encontro" era só explicativo. ⚠️ O `#tab-sub` é **compartilhado** por todas as telas —
  quem **devolve** o subtítulo ao sair é o próprio **`_tabBackSet('')`** (já chamado em toda saída do painel). Quem esconde de propósito
  (`renderProjetosPro`) roda DEPOIS e volta a esconder. Se criar tela nova que esconda o subtítulo, lembrar dessa interação.
- **ESPAÇOS** (4 ajustes): vão **acima** do header reduzido (`.reun-panel-wrap` padding-top **22→6** — sobrava desde que o "Voltar" subiu p/ a topbar);
  respiro **header→cards** aumentado (sub-navbar margin-bottom **18→28** no normal; `.reun-focus-bar` margin-bottom **16→26** no foco, que não tem
  sub-navbar); **gap entre as 3 colunas 14→20** ("levemente"); separação **"Da reunião anterior" × "Novas tarefas" 26→40**.
- **Card "Decisões anteriores"**: tirado o **nome da reunião** (redundante — já estamos no painel dela) e a data virou **dd/mm/aaaa + nowrap**
  (a longa "16 de jul. de 2026" quebrava em 2 linhas na coluna de 320px).
- **Histórico da série INVERTIDO** (mais recente primeiro): `.reverse()` **só na exibição** — o número do círculo continua sendo o `i+1` original,
  ou seja, a **posição cronológica** (1 = a primeira reunião da série). Subtítulo do card ajustado p/ "da mais nova à mais antiga".
- ⭐ **ORDEM DOS ÍCONES redesenhada** (o Diego perguntou se a sequência fazia sentido) — agora por **momento de uso**, e **idêntica** na trilha do
  foco e na sub-navbar: **TRABALHO** (Painel · Pessoas) → **REGISTRO** (ATA · Anexos) → **CONSULTA da série** (Decisões · Histórico) →
  **REFERÊNCIA/CONFIG** (Info · Editar). **Info desceu da 3ª p/ a 7ª** (é dado fixo, consultado raramente, e ocupava lugar nobre); ATA/Anexos subiram;
  Decisões antes de Histórico (decisão é mais acionável que a lista de reuniões). **Se mexer numa lista, mexer na outra** (conferi por grep que batem).
- ⚠️ **NÃO testado em navegador.** Balanço de parênteses/chaves/backticks/divs **idêntico ao HEAD**; ordem das abas conferida batendo nos 2 lugares.

### 2026-07-18 — PC da Empresa — Painel de Reunião: cabeçalho enxuto (infos só na aba Info, Voltar na topbar, ações reagrupadas) (commit `5ea40b8`)
- 3 ajustes que o Diego pediu olhando o print do Painel:
- **1) Linha de data/hora/sala/conduz sob o título REMOVIDA** — "não precisa, pois tem na aba Info já". Saíram junto as consts que só serviam a ela
  (`dateLabel`/`horaTxt`/`localTxt`/`facilitadorObj`) — conferido por varredura no range da função: nenhum outro uso dentro de `openReuniaoView`
  (os hits que sobram no arquivo são de OUTRAS funções, que declaram as suas).
- **2) "Voltar às reuniões" subiu p/ a TOPBAR, ACIMA do título "Painel de Reunião"** (antes ficava dentro do painel, abaixo do título).
  Novo **`<div id="tab-back">`** na `.topbar-left` (antes do `<h2 id="tab-title">`) + helper **`_tabBackSet(html)`** (html vazio ESCONDE).
  Injetado em `openReuniaoView` junto do título; **limpo** no `render()` (cobre navegação por aba/área), no `renderReunioes()` (o próprio botão
  chama essa função direto, sem passar pelo render) e em **Ajuda/Configurações** (as 2 telas que trocam o header sem passar pelo render).
  O "Voltar para \<reunião\>" da série sobe junto, na mesma linha. ⚠️ Se criar outra tela que troque o header por fora do `render()`, chamar `_tabBackSet('')` lá.
- **3) Ações da direita reagrupadas** ("tá meio jogado ali, e o expandir tá perdido no meio dos 3"):
  - **Iniciar/Pausar + cronômetro viraram UM bloco** (moldura única com divisor no meio). Quando a reunião **não começou** não há cronômetro →
    o botão "▶ Iniciar" **é** o bloco (sem moldura em volta, senão sobrava uma borda cinza inútil no botão azul).
  - **⛶ tela cheia desceu p/ a ponta direita da SUB-NAVBAR**, discreto (ícone fantasma, classe `.reun-focus-toggle`) — é ação de **VISUALIZAÇÃO**,
    então mora junto das abas de view, não disputando espaço com Iniciar/Finalizar. Sub-navbar ganhou wrapper **`.reun-subtabs-wrap`**
    (abas com `flex:1` rolam; o botão fica fixo na ponta) — **adicionado à regra CSS que esconde no modo foco**.
  - Cabeçalho agora tem só **2 blocos à direita: controle de tempo | Finalizar**.
- ⚠️ **Contrato do cronômetro preservado** (o `tick` de `iniciarCronometroReuniao` depende disso): `#reun-cronometro-<id>` continua contendo o
  `[data-inicio]` e tendo o **ícone do relógio como primeiro `<i class="ti">`** (o tick troca por `alert-triangle` ao estourar) — **por isso o play
  ficou FORA desse id**, só compartilhando a moldura. Se um dia mexer aqui, manter essa separação.
- **Limpeza:** `_icoActive` removido (órfão desde que os ícones do cabeçalho viraram sub-navbar no `67e26cd`).
- ⚠️ **NÃO testado em navegador.** Tentei o Browser pane desta vez (o arquivo chegou a aparecer no painel), mas `file://` abre só como **snapshot
  estático** — o JS não roda, então não dá pra validar comportamento. Verificação estática: balanço de **parênteses/chaves/divs idêntico ao HEAD**
  e delta de backticks **−6**, exatamente os 3 ternários da linha de infos removida (conferido no diff: 17 removidos × 11 adicionados).
- **Diego confere no Pages (Ctrl+Shift+R):** abrir uma reunião → "Voltar às reuniões" aparece ACIMA de "Painel de Reunião" e **some** ao sair
  (testar sair pela aba e pelo próprio botão); sem a linha de data/hora sob o título; Iniciar+cronômetro como bloco único; ⛶ na ponta direita da
  sub-navbar; entrar/sair do modo foco (⛶ some no foco, trilha lateral assume); cronômetro **estourado** ainda fica vermelho e pulsando.

### 2026-07-17 (d) — PC da Empresa — Equipe destravada + papel por 3 ícones + sub-navbar na Reunião (commits `07d8e49`,`67e26cd`, PUSHADOS)
- **BUG (Diego não conseguia adicionar pessoas):** `_toggleParticipanteProjeto`/`_setPapelProjeto` checavam `_ppPodeGerenciar` — o Diego
  (identidade SIMULADA) virou **Leitor** ao ciclar papéis e perdeu a permissão → travou. Removidas as checagens dessas 2 (protótipo; a regra
  dono/coordenador vale no backend do Guilherme). Documentado no código.
- **PAPEL por 3 ÍCONES** (em vez do chip que ciclava): card da pessoa participante agora = **✓** (tira da equipe) + nome + [presença, só reunião] +
  **3 botões de papel** sempre visíveis, o ativo destacado; clicar num define. Projeto: Dono/Coordenador/Leitor (`_setPapelProjeto`). Reunião:
  Organizador/Editor/Leitor (`_setPapelReuniao`). Grid alargado (proj 270 / reun 300). `_ciclarPapelProjeto`/`_ciclarPapelReuniao` ficaram órfãos (inócuos).
- **SUB-NAVBAR horizontal no Painel de Reunião** (Diego gostou da dos Projetos): os ícones de VIEW viraram abas horizontais `.reun-subtabs`
  (Painel · Pessoas · Info · ATA · Anexos · Histórico · Decisões · Editar — ícone+texto, sublinhado azul na ativa, chamam `_reunSetSubView`).
  O cabeçalho normal ficou só com as **AÇÕES** à direita (play/pausar · cronômetro · foco · Finalizar/PDF). No modo foco a sub-navbar some
  (CSS `body.reun-focus .reun-subtabs{display:none}`) e a trilha lateral assume. Projetos já tinham esse padrão — mantidos.
- ⚠️ NÃO testado em navegador; balanço idêntico ao HEAD. **Diego confere no Pages.**

### 2026-07-17 (c) — PC da Empresa — Projetos: Painel vira ferramenta de PLANEJAMENTO (dependência+dias+previsão+projeção) + respiro (commit `15e8119`, PUSHADO)
- Pedido do Diego (vai usar o Painel pra planejar): ver a dependência entre tarefas, definir dias, e a projeção de conclusão.
- **Largura/respiro:** coluna do detalhe (tarefas) com **max-width 660** (não estica ponta-a-ponta); `gap` 16→**26**; comentários com
  `margin-left:auto` (empurra p/ a direita → espaço vazio de respiro no meio). Col de fases mais estreita (244).
- **Dependência visível na linha da tarefa** (`_tarefaLinha` enriquecida): badge da **ETAPA** (`_ppNumHier`: "1","2","2.1"…) — a próxima só
  começa quando a anterior conclui; **cadeado** quando bloqueada. Legenda no topo do detalhe. Ordem/paralelas seguem na aba Tarefas (tem drag).
- **Dias editáveis** na própria linha (input→`_ppSetDias`) + **conclusão prevista por tarefa** (`_ppProjecao` — cascata etapa×dias úteis).
- **Projeção do PROJETO:** faixa no topo do detalhe ("Conclusão prevista: DD/MM · Xd de folga/após o prazo", compara `p.prazoFim`), atualiza
  conforme muda os dias. `_projE=_ppProjecao(_ordE,_etE,_anchorE)` computado no topo do `renderProjectProVisao`.
- ⚠️ NÃO testado em navegador; balanço idêntico ao HEAD. **Diego confere no Pages.**

### 2026-07-17 (b) — PC da Empresa — Projetos: Painel em 3 COLUNAS master-detail (commit `562e4ae`, PUSHADO)
- Pedido do Diego: a fase não deve abrir em **acordeão pra baixo**; clicar na fase abre setores+tarefas na **coluna do lado** (a do meio,
  que estava vazia). E dividir o Painel em **3 colunas**.
- `renderProjectProVisao` reescrita: **col 1** = "Acontecendo agora" + **lista de fases clicáveis** (Estrutura, master); **col 2** =
  **detalhe da fase selecionada** (setores+tarefas, "+ Tarefa"/"+ Setor" — reusa `_setorBloco`/`_tarefaLinha`); **col 3** = Comentários (fina).
- Estado `window._ppFaseSelId` (fase ativa; persiste, auto-seleciona a 1ª se a atual não é deste projeto). `_ppTogglePainelFase`→
  **`_ppSelecionarFase`** (alias antigo mantido); `window._ppPainelFaseAberta` (acordeão) **aposentado** (0 usos). Grids do comando viraram
  `1fr` (col estreita — cards empilham sem vazar). Placeholder no detalhe quando nada selecionado.
- ⚠️ NÃO testado em navegador; balanço idêntico ao HEAD. **Diego confere no Pages (Ctrl+Shift+R):** clicar fase à esquerda → setores/tarefas
  aparecem no meio (não mais embaixo); 3 colunas; em tela estreita empilha.

### 2026-07-17 — PC da Empresa — REVISÃO GERAL Reuniões+Projetos (pedido do Diego): redesign do Painel do projeto + 30 fixes (commits `981cd06`,`c929214`,`32767ac`, PUSHADOS)
- **Pedido do Diego (autônomo, ele longe do PC):** revisar as abas Reuniões e Projetos inteiras (bugs/regra de negócio/duplicação/layout),
  painéis com a MESMA lógica, tela leve; no Painel do projeto: infos estáticas saem da área de trabalho, comentários em coluna FINA com input discreto.
- **REDESIGN DO PAINEL DO PROJETO (`981cd06`+`c929214`):** Painel = SÓ trabalho ("Acontecendo agora" + Estrutura + Comentários). O bloco "Resumo"
  (tipo/datas/dono + status + stats + progresso) virou a **nova aba "Info"** (`renderProjectProInfo`, mesma lógica do Info da Reunião; status
  clicável mantido — `pp-status-badge`/`abrirMenuStatusProjeto`). **Comentários**: coluna direita agora `flex:0 0 300px` (era 1fr, crescia demais)
  e o **input virou 1 linha discreta** (pill + botão-ícone; **Enter envia**; @menção mantida — `enviarProComment`/`_ppCheckMencao` leem
  `.value`/`.selectionStart`, compatível com `<input>`; ⚠️ perdeu multi-linha — trade-off aceito pelo pedido "discreto"). **Progresso** virou pill
  compacta no header (substitui o `progressoBloco` morto). **Sub-abas** ganharam Pessoas+Info e "Visão geral"→**"Painel"** (mesmo nome da trilha);
  trilha na MESMA ordem das abas; ícone "Participantes" (modal `abrirModalEquipe`) saiu do header → `[SUPERSEDED]`; `_exitProjFocus` não reseta
  mais 'pessoas'. Limpou morto: `pessoasHeader`/`progressoBloco`/`proximaFase`/`col1/col2/fasesBloco`/`coms/listaComs`(rodavam getProComments
  por render)/`_ts`/`me/meIni`; resizer do painel inerte (chamada removida). Sub-aba "Comentários (N)" com contador discreto.
- **REVISÃO: 2 subagentes (Reuniões 30 achados / Projetos 24), cada fix re-verificado no código antes de aplicar. LOTE de ~30 fixes (`32767ac`):**
  - 🔴 **BUG #6 DO DIEGO RESOLVIDO**: era `_reunAtualizarDataVencida` (banner "reunião recorrente vencida → Atualizar") — avançava a data da
    MESMA reunião sem resetar nada → abria "continuação" com **pautas já feitas e data de hoje**. Agora zera pautaDone/principalDone/presenças/
    timer (ATA/decisões ficam — são registro). Gatilho: `frequencia` legada ≠ 'unica' (registros antigos).
  - 🔴 Painel do projeto: **checkbox de concluir tarefa não fazia NADA** (`toggle('${t.id}')` string × id numérico, `===` nunca achava) →
    `toggle(${t.id})`; linha da tarefa agora abre `openEdit` (como no resto do HUB).
  - 🟠 Reuniões: "Agendar próxima e levar assuntos" em série MATERIALIZADA não encerrava nem levava nada → merge de pendências na próxima + encerra;
    `editingReuniaoId` órfão (sair do painel pela aba Editar → "+ Nova reunião" abria EDITANDO a anterior; salvar SOBRESCREVIA) → resets;
    editar reunião e ligar "Repetir" agora **materializa** a série; `toggleReunSerie` quebrava com apóstrofo no título (XSS latente) → escapado.
  - 🟠 Projetos: "Excluir projeto" do modal Editar pulava confirmação+permissão → `confirmExcluirProjectPro`; quick-add "+ Tarefa": "— Nenhum —"
    não desvinculava e trocar de projeto herdava fase/setor do ANTERIOR (dataset) → select manda, dataset só no mesmo projeto/fase; drag entre
    fases não limpava `grupo.tarefaIds` (tarefa fantasma no setor velho); `preFecharProjetoPro` tinha aviso de pendências NUNCA exibido → confirmModal.
  - 🟡 Médios/baixos: continuações herdam sala 3-modos + papéis; timer com `data-planned` no pill normal (estouro usava 60min fixos) e nasce
    vermelho se estourado; "Acontecendo agora" inclui status 'andamento' (era excluído!); `deleteReuniao` religa a cadeia `continuacaoDe`;
    `_reunProximaDaSerie` não sugere encerrada; histórico usa `duracaoSeg` (3 pontos); sala/tipo legados viram option (edição não apaga);
    `salvarAta` só grava se mudou; `createdAt` preservado; status fantasma 'continuacao' fora do select; executor como fallback na linha;
    `_pautaPrincEd` zerado ao trocar; PDF usa `_reunLocalLabel`; subtarefa de modelo `{text}`→`title` (renderizava "undefined"); notif de
    @menção grava `paraId`; `_ppSincronizarLiberacao` grava 1× (era N×120KB); filtros do Painel com `projectProId`; `_ppExcluirComment` valida
    autor; @menção só destaca pessoa existente; cor de import validada; consts mortas removidas (`partsHTML/projHTML/proxDataTxt/contLabel` etc.).
- **NÃO FEITO (anotado, decisão/reescrita):** dupla definição de "Atrasada" (t.date × esteira — decisão já aberta do Mac); dupla fonte
  `g.tarefaIds`×`t.projectPro*` viva em `renderFaseExpandida`/`salvarProjetoComoTemplate` (perde tarefas sem setor); permissões pela metade
  (adicionarFase/editarFase/_ppSetDias/salvarEdicaoProjectPro sem `_ppPodeGerenciar` — e coordenador pode se auto-promover a Dono via chip);
  aba Editar inline da reunião perde texto digitado se re-render no meio (play/pausa/tema); ~15 toasts com `escapeHTML` (dupla escapagem
  cosmética: "P&amp;D"); comentários órfãos em `taskflow_pro_comments` após purge da lixeira; write-on-render de datas na aba Tarefas
  (by-design da esteira, mas só naquela aba); memoização de `_ppTarefasOrdenadas` na lista (o `_ppOrdCache` existe e não é usado lá);
  "Histórico" = 2 telas diferentes com o mesmo nome (aba do painel × sub-navbar da lista); `_sugEncerrarSerie` não encerra passadas.
- ⚠️ **NÃO testado em navegador** (máquina sem preview). Balanço do arquivo **idêntico ao HEAD do Mac** (parênteses/chaves/divs/backticks) após
  cada lote. **Diego confere no Pages (Ctrl+Shift+R)** — roteiro no chat da sessão.

> ▶ **RETOMAR AMANHÃ (PC da Empresa) — deixado 16/07 à noite pelo Mac.** Hoje o foco foi a aba **Projetos**
> (Projetos Pro): entreguei o **modo foco / tela cheia espelhando o Painel de Reunião** (trilha lateral de ícones,
> barra-header no topo), o **Painel COMPLETO** (a Visão geral virou a tela onde se vê E faz tudo: criar fase/setor/
> tarefa em acordeão inline, concluir no checkbox, comentar), a **visão de comando** ("Acontecendo agora" = tarefas
> da etapa atual) e uma **leva de 8 refinamentos** (aba Pessoas com card de papel Dono/Coordenador/Leitor igual à
> Reunião, comentários fixos à direita, título "Projeto —"/"Reunião —", etc.). **Tudo no Pages, último commit `4e6be74`
> — working tree limpo.**
> **Pra retomar / decisões abertas:** (1) conferir no Pages com um projeto REAL (Ctrl+Shift+R); (2) **DECIDIR:** o card
> lateral "Atrasadas" conta por `t.date`, mas o "Acontecendo agora" usa o deadline do cronograma de etapas
> (`ppLiberadaEm`+`ppDias`) — podem divergir; unificar? (mexe em `_calcularProgressoProjeto`); (3) agora o sistema põe
> "Projeto —"/"Reunião —" sozinho no título — **não precisa mais digitar** o prefixo ao criar; (4) sobrou código morto
> inócuo no Painel (`col2`/`fasesBloco`, `_initPpColResizer`) p/ a limpeza dedicada. Detalhe técnico nas entradas
> **(9)(8)(7)** logo abaixo. Estado do modelo: papéis do projeto = `p.dono`/`p.coordenador`/`p.coordenador2`; acordeão
> do Painel usa `window._ppPainelFaseAberta` (≠ `activeFaseId`, que é o zoom da aba Fases).

### 2026-07-16 (9) — Mac de casa — Projetos: leva de refinamentos do Diego (pós-teste no Pages)
- 8 ajustes pedidos pelo Diego depois de testar o Painel completo:
- **Aba Pessoas do projeto = card de papel igual ao da Reunião** (`renderProjectProPessoas` reescrita espelhando
  `_reunPessoasInlineHTML`): grid de cards, card colorido pelo papel, chip que **cicla Leitor → Coordenador → Dono**.
  Novos: `PROJ_PAPEL` (Dono=coroa âmbar · Coordenador=user-star azul · Leitor=olho cinza), `_ciclarPapelProjeto`,
  `_setPapelProjeto` (Dono é único; Coordenador ocupa `coordenador`→`coordenador2`), `_toggleParticipanteProjeto`,
  `_papelDaPessoaProjeto`. SEM "presença" (não se aplica a projeto). Legenda no rodapé.
- **Modo foco do projeto ganhou a MESMA barra-header da Reunião:** `.proj-focus-bar` (sticky, título + status +
  progresso) espelha `.reun-focus-bar`. No foco, o header normal (ícones + "Marcar como concluído") some
  (`body.proj-focus .proj-normal-header{display:none}`) — a trilha assume; no modo normal ele volta.
- **Título com prefixo:** projeto → "Projeto — <nome>" (header + barra de foco). Reunião → "Reunião — <nome>" com
  GUARDA `/^\s*reuni/i` p/ não duplicar em reuniões já nomeadas com "Reuni..." (barra de foco + normal-header).
- **"Acontecendo agora" mais discreto:** removido o container âmbar; virou só um título pequeno cinza + ícone laranja
  + os cards. **Largura total + respiro:** `_bodyMax` da 'visao' subiu p/ 1320; no foco `.proj-body{max-width:none}`;
  gaps maiores.
- **Comentários na COLUNA DIREITA** (acompanhamento em tempo real): `renderProjectProVisao` virou 2 colunas —
  principal (comando + resumo + estrutura) | comentários (`renderProjectProAnotacoes`) fixos (`position:sticky`).
  Removido o "Últimos comentários" duplicado do bloco de comando.
- **Reuniões — repetição de período:** quando o período selecionado (sub-navbar) tem só UM grupo com reuniões, o
  cabeçalho do grupo repetia o nome → agora escondido (`_umGrupoSo` em `renderReunioes`). Vários grupos = mantém.
- **VERIFICADO no navegador:** modo foco (barra "Projeto —", header sumido, 2 colunas, acontecendo discreto),
  aba Pessoas (cards coloridos + ciclo Leitor→Coord→Dono, coord2 ok), modo normal (header volta), Reuniões período
  Amanhã sem cabeçalho repetido. 0 erros de console. Sintaxe 0 erros (jsc). Commit: o deste push.

### 2026-07-16 (8) — Mac de casa — Projetos: PAINEL COMPLETO (ver + fazer tudo numa tela)
- Correção de CONCEITO do Diego (testando no Pages): o **Painel NÃO é um resumo** — é a tela onde se **VÊ e FAZ tudo**
  (criar fase, criar setor, criar tarefa, concluir, ler/escrever comentários) sem trocar de aba. Os ícones da trilha
  são só pra **FOCAR numa coisa só**. (Na (7) eu tinha feito o Painel = Visão geral só-leitura; faltava o operacional.)
- **`renderProjectProVisao` (o "Painel") reescrito** como tela VERTICAL completa, na ordem:
  1. **Acontecendo agora** (comando, da (7)) · 2. **Resumo** (infos/dono/prazo + status clicável + progresso) ·
  3. ⭐ **Estrutura do projeto** (novo) · 4. **Comentários** (feed + campo — reusa `renderProjectProAnotacoes`).
- **Estrutura = ACORDEÃO INLINE** (decisão do Diego: acordeão + lista simples de tarefas): **"+ Nova fase"**
  (`adicionarFase`); cada fase é um acordeão via `_ppTogglePainelFase` + estado `window._ppPainelFaseAberta`
  (INDEPENDENTE do `activeFaseId`, que é o zoom da aba Fases). Fase aberta mostra os **setores**, cada um com
  **"+ Tarefa"** (`window._ppQuickCtx={projectId,faseId,grupoId};toggleForm()` → modal pré-vinculado) e as **tarefas
  em lista simples** (checkbox `toggle(id)` + título + executor + status `_ppStatus`: Em andamento/Atrasada/Aguardando/
  Concluída); **"+ Adicionar setor"** (`adicionarGrupo`); tarefas da fase sem setor caem num bloco "Sem setor". Reuso
  TOTAL dos CRUDs existentes — nenhuma lógica de dados nova.
- **VERIFICADO no navegador** (foco e normal): estrutura com 3 fases (acordeão), setores Suprimentos/Engenharia com
  tarefas nos 3 estados, comentários (feed+campo). Testado: expandir fase ✓, concluir tarefa (checkbox→toggle) ✓,
  "+ Tarefa" abre modal vinculado a proj+fase+setor ✓, "+ Nova fase" (pm-overlay) ✓, "+ Adicionar setor"
  (pp-modal-grupo) ✓. 0 erros de console. Sintaxe 0 erros (jsc). Commit: o deste push.
- Painel agora é VERTICAL: saíram as 2 colunas redimensionáveis (`.pp-visao-2col`/resizer). As consts `col2`/
  `fasesBloco` seguem computadas mas SEM uso (código morto inócuo — limpeza dedicada depois); `_initPpColResizer`
  fica inerte (não acha o elemento). ⚠️ NOTA "Atrasadas" (da (7)) segue em aberto p/ o Diego decidir.

### 2026-07-16 (7) — Mac de casa — Projetos: MODO FOCO / tela cheia + trilha lateral + VISÃO DE COMANDO (2 commits)
- Pedido do Diego (gostou do modo foco do Painel de Reunião): trazer o mesmo padrão p/ a aba Projetos — trilha
  lateral de ícones, tudo inline, EXCETO "Finalizar projeto" que abre em modal. Aprovou via MOCKUP antes de codar.
- ⭐ ACHADO: a tela de projeto (`renderProjectProView`) JÁ é inline com 5 sub-abas (Visão/Fases/Tarefas/Análise/
  Comentários) + ícones `.reun-ico` no header + Finalizar já em modal. O trabalho foi VESTIR essa tela com o modo
  foco, reusando `activeProjectProTab` como estado (sem inventar variável de sub-view).
- **Como ficou (espelha 1:1 o Reunião):** `body.proj-focus` (cópia do `body.reun-focus`) esconde header/sidebar/
  topbar/FAB, põe `#task-container` fullscreen (fixed, z-500) e desloca `.proj-panel-wrap` em `margin-left:74px`.
  Trilha `.proj-focus-rail` (74px fixa) por `_projFocusRailHTML(p)`, só visível no foco; abas horizontais
  (`.proj-subtabs`) somem no foco. Botão ⛶ (`_toggleProjFocus`) no header.
- **Trilha:** Sair · | · Painel · Fases · Tarefas · Comentários · Pessoas · Análise · Editar · (espaço) · **Finalizar**
  (rodapé, verde). Abas chamam `setProjectProTab`; ativo destacado por `_projRailActive`. **Pessoas** REVIVIDA
  (`renderProjectProPessoas` já existia, só estava fora do menu). **Editar**=`editarProjectPro` (modal).
  **Finalizar**=`_selecionarStatusProjeto(id,'concluido')` (reusa permissão: dono→modal `pp-modal-fechar`; coord→pré-fecha).
- **Salvaguardas (espelham reun):** guard no `render()` desliga o foco se saiu de projetos; reset no `setTab` e no
  `voltarParaProjetosPro`; `Esc` sai (handler 1x); `_exitProjFocus` volta a aba p/ 'visao' se estava em 'pessoas'.
- **VERIFICADO no navegador** (preview HTTP + projeto de teste 3 fases/6 tarefas): ⛶ liga o foco (rail flex 74px
  fixed, subtabs none, task-container fixed z500, wrap margin-left 74px, header/sidebar none); trilha com os 9 botões;
  navegar Pessoas/Tarefas mantém foco e destaca só o ativo; modal Finalizar por cima (z 9100>500) sem sair do foco;
  Esc sai. 0 erros (jsc new Function).
- **COMMIT 2/2 — VISÃO DE COMANDO** (no TOPO da Visão geral; vale no foco E no modo normal): bloco **"Acontecendo
  agora"** = tarefas da ETAPA ATUAL da esteira (pendentes de menor etapa — mesma lógica de `_ppNotificarLiberacao`),
  cada uma com numeração hierárquica (`_ppNumHier`), executor, setor e status via `_ppStatus` (laranja "Em andamento ·
  até <data>" / vermelho "Atrasada · venceu <data>", card com borda vermelha). Abaixo: **"Próximas a liberar"** (etapa
  seguinte, cadeado) + **"Últimos comentários"** (2 últimos via `getProComments`). Aditivo — as 2 colunas existentes
  (infos/status/stats | progresso/fases) seguem abaixo. Cards de "agora" são clicáveis → aba Tarefas.
- **VERIFICADO no navegador** (preview HTTP): etapa atual = 2 tarefas paralelas (3 "até 20 jul" no prazo, 3.1 "venceu
  02 jul" atrasada c/ borda vermelha), 2 próximas com cadeado, 2 comentários; idêntico no foco e no normal; 0 erros de
  console. Sintaxe 0 erros (jsc). Commits: `05d353b` (foco) + o deste push.
- ⚠️ NOTA (decisão do Diego): o stat "Atrasadas" (card da col1) conta por `t.date`; já o "Acontecendo agora" usa o
  DEADLINE do cronograma de etapas (`ppLiberadaEm`+`ppDias`). Podem DIVERGIR (no teste: card "Atrasada" mas stat
  Atrasadas=0). São 2 definições distintas e PRÉ-EXISTENTES; unificar mexe em `_calcularProgressoProjeto` — não fiz.

### 2026-07-16 (6) — Mac de casa — Painel: ícones Histórico + Decisões da série (inline)
- 2 ícones novos na barra/trilha do painel: **Histórico** (ti-history) lista TODAS as reuniões da série
  (`_reunSerieCompleta` = cadeia continuacaoDe p/ os 2 lados + mesmo serieId, ordenada por data; clicáveis via
  `_reunAbrirDaSerie` c/ botão Voltar) e **Decisões** (ti-gavel) mostra TODAS as decisões da série agrupadas por
  reunião (mais recentes 1º). Despacho em `_reunSubViewHTML` (views "historico"/"decisoes"). A pauta segue só as
  últimas 3; estes ícones mostram tudo. Verificado: série de 3 → Histórico lista 3, Decisões soma 6. 0 erros.

### 2026-07-16 (5) — Mac de casa — Painel de Reunião: aba Pessoas (papel por chip+cor), voltar da série, tarefas concluídas riscadas
- **Aba Pessoas unificada** (`_reunPessoasInlineHTML`): removida a seção duplicada "Papéis e presença" de baixo.
  Agora cada PARTICIPANTE no grid "Quem participa" tem: card **colorido pelo papel**, um **chip de papel** que
  **cicla** Organizador→Editor→Leitor (`_ciclarPapelReuniao` → `_setPapelReuniao`), e um **check de presença** discreto
  (`togglePresencaModal`). Cores: `REUN_PAPEL` = Organizador azul (ti-microphone) · Editor âmbar (ti-pencil) ·
  Leitor cinza/neutro (ti-eye). Não-participantes ficam com card simples (clique adiciona). Legenda no rodapé.
- **Voltar da reunião anterior** (pedido do Diego): abrir uma reunião passada pelo card "Decisões anteriores" agora
  usa `_reunAbrirDaSerie(fromId,toId)` (empilha em `window._reunNavStack`) e o painel mostra
  **"← Voltar para <reunião>"** (`_reunVoltarSerie`). `openReuniaoView(id,_opts)` só zera a pilha ao abrir OUTRA
  reunião por fora (não em re-render nem em navegação `_opts.serie`). "Voltar às reuniões" limpa a pilha.
- **Tarefas concluídas na reunião** aparecem **riscadas** num grupo "✓ Concluídas nesta reunião" no fim da coluna
  (`reunTarefasHTML`: antes filtrava `!t.done` e sumiam; agora `tarefasFeitas` renderiza com o line-through que a
  linha já tinha). Só as concluídas DESTA reunião (as anteriores da série seguem só pendentes).
- **Verificado no browser:** Pessoas com Débora=Editor(âmbar)/Diego=Organizador(azul)/Mauro=Leitor(cinza), presença
  ok, sem lista duplicada; abrir R_ANT pela série → botão "Voltar para R_ATUAL" → volta (pilha certa); T_feita
  riscada no grupo Concluídas. 0 erros de sintaxe/console.

### 2026-07-16 (4) — Mac de casa — .nojekyll (Pages travado) + Sala em modo-primeiro (3 opções)
- ⚠️ **BUG DE INFRA resolvido:** o GitHub Pages vinha **falhando o build de forma intermitente** ("Page build
  failed") porque **faltava `.nojekyll`** → o Pages processava o index.html de 33k linhas pelo Jekyll. O site
  ficou preso no último build bom (`379091c`), sem as mudanças de hoje ("tá tudo lá ainda"). **Fix:** adicionado
  `.nojekyll` (commit `2588c5c`) → Pages copia o arquivo cru. Build passou e confirmei via `curl` o conteúdo
  servido. **LIÇÃO (já na memória): depois de push no Pages, verificar o site servido (curl/gh api pages/builds),
  não só o push.** `gh api repos/dKonrad88/TaskFlow/pages/builds/latest --jq .status`.
- **Sala virou "modo primeiro, valor depois"** (o dropdown único tinha virado uma lista gigante de 25+ itens).
  Agora: select `#reun-sala-modo` com 3 opções (Sala de reunião / Sala de uma pessoa / Outro lugar). Cada modo
  revela seu sub-controle: `#reun-sala` (salas, +/excluir voltaram a valor simples, sem prefixo), `#reun-sala-pessoa`
  (pessoas, "Minha sala"↔"Sala de <Nome>", com nota explicando a regra p/ o Guilherme), `#reun-sala-livre` (texto).
  `_reunSalaModo(v)` troca o sub-controle; `_reunColetaSala()` lê pelo modo. Modelo de dados `salaTipo`/`salaPessoaId`/
  `sala`/`localExterno` inalterado; `_reunLocalLabel` idem.
- **Verificado:** 3 opções no topo; salvar em cada modo → "Sala Reunião" / "Sala de Débora" / texto livre; 0 erros.
- ⚠️ Nota: aparece "Sala de Minhas Tarefas" na lista de pessoas → há um registro-fantasma chamado "Minhas Tarefas"
  em `people`. Não filtrei (é dado, não código). Vale o Diego checar/limpar em Pessoas.

### 2026-07-16 (2) — Mac de casa — Modal de reunião: tira Tipo/Status/Quem-conduz da criação + Sala em 3 modos
- **Tipo, Status, Quem conduz** saíram da **criação** (modal fica só Título/Data/Hora/Sala/Repetir). Continuam no
  **Editar** (o form é o mesmo — envolvi o grid em `${editingReuniaoId ? ... : ''}`). Removida a obrigatoriedade
  de "Quem conduz" no `saveReuniao`. Na criação entram com defaults (status 'agendada', tipo 'Operacional',
  facilitador vazio) e se ajustam no Editar. ⚠️ NÃO virou aba Info (que é só leitura) — a edição desses 3 campos é
  pelo **Editar** mesmo, como a outra máquina desenhou.
- **Sala reformada em 3 modos** (pedido do Diego):
  - `salaTipo`: `'sala'` (sala de reunião, lista `salas`) · `'pessoa'` (guarda `salaPessoaId`) · `'livre'` (texto
    em `localExterno`). Campos antigos `m.sala`/`m.localExterno` reaproveitados (compat com registros antigos).
  - Select com optgroups: "Salas de reunião" + "Sala de uma pessoa" (21 pessoas) + "📍 Outro lugar (digitar)".
  - **"Minha sala" ↔ "Sala de <Nome>"**: quem é a própria pessoa vê "Minha sala"; todos os outros veem "Sala de
    Fulano". No protótipo o "eu" é `CURRENT_USER_ID`; no sistema real do Guilherme é o login de cada um (regra
    demonstrada). Usei **"Sala de <Nome>"** (neutro, sem gênero — não tem esse dado).
  - Helper `_reunLocalLabel(m)` centraliza a exibição (substituiu 3 cópias de `m.sala?'Sala '+m.sala:localExterno`).
    Coleta no save via `_reunColetaSala()`. `_reunSalaSelChange()` mostra/esconde o campo livre. `confirmarNovaSala`/
    `excluirSalaSelecionada` adaptados ao valor prefixado (`sala:` / `pessoa:` / `livre`). `_recNovaOcorrencia`
    carrega `salaTipo`/`salaPessoaId`/`localExterno` → séries mantêm a sala.
- **Verificado no browser:** criação sem os 3 campos; sala com os 3 modos; salvou pessoa=Débora com facilitador
  vazio e status 'agendada'; "Sala de Débora" p/ quem olha e "Minha sala" quando é a própria; campo livre salva o
  texto; Editar traz os 3 campos + sala pré-selecionada; recorrência (3x) carregou a sala. 0 erros sintaxe/console.

### 2026-07-16 — Mac de casa — Recorrência: nº de ocorrências volta a aparecer nos PRESETS
- A outra máquina (commit `35ba705`) tinha escondido TODOS os controles nos presets (Semanal/Quinzenal/Mensal),
  deixando só o resumo — então o nº de ocorrências só dava p/ mudar em "Personalizado". Diego quer poder definir
  quantas ocorrências em QUALQUER tipo.
- Fix cirúrgico em `_recBoxHTML`: o controle **"Termina"** (nunca / após N ocorrências / até data) subiu p/ aparecer
  também nos presets; só os controles de **dias/intervalo** ficam no "Personalizado". Mudar o término NÃO troca o
  preset (`_recPresetAtual` só olha unidade/dias/intervalo). `gTermina` agora é definido antes do branch e reusado.
- Verificado no browser: preset Semanal mostra "Termina após [N] ocorrências"; mudar 8→12 gera 12 no total e
  segue classificado como Semanal; dias continuam só no Personalizado. 0 erros.

### 2026-07-16 (g) — PC da Empresa — Reuniões: pauta principal azul de novo, modelos só em nova, origem da tarefa, remove banners (commit `cabe0df`, PUSHADO)
- Mais uma leva de ajustes do Diego (testando continuações no Pages):
- **Pauta principal VOLTA a ser AZUL** (revert do `e685518`). Em vez dela, **removida a borda/linha azul do CARD "Decisões tomadas"** (agora igual aos outros cards).
- **Modelos ("Começar de um modelo") só em reunião NOVA** — `+ !m.continuacaoDe` na condição em `reunPautaHTML`. **Isto também corrige o bug do Diego**
  "criar pauta principal apagava as demais": `_pautaAplicarModelo` (grep confirmou: ÚNICO ponto que faz `m.pauta=[...]`) sobrescreve a pauta; aplicar um
  modelo numa continuação apagava as pautas carregadas. Sem modelos na continuação, não acontece.
- **Tarefa "da reunião anterior" mostra DE QUAL reunião** veio, entre () com a data — auto quando `t.meetingId!==m.id` (`fromMeeting`/`fromStr` em `tarefaRow`).
- **Removidos 2 banners do topo do painel**: "Continuação de: X" (`contLabel` — uso removido, const fica morta e inofensiva) e o resumo "Da reunião
  anterior X/Y concluídas" (IIFE de accountability removida). A lista acionável segue no card Tarefas, agora com a origem por tarefa.
- ⚠️ **BUG #6 EM ABERTO (não reproduzi no código)**: continuação abrindo com **pautas marcadas como feitas / data de hoje**. Os 2 caminhos de carry
  (`reagendarProxima`, `_gerarProximaRecorrente`) só levam pautas PENDENTES e recriam DESMARCADAS (`pautaDone.map(()=>false)`); materialização
  (`_recNovaOcorrencia`) nasce com `pauta:[]`. Nenhum caminho gera pauta feita numa nova ocorrência. **Suspeita: dado antigo/emaranhado de testes.**
  Precisa do Diego reproduzir passo-a-passo (qual reunião, o que clicou) — evitei guess-fix em lógica de dados pra não arriscar perda.
- NÃO testado em navegador; balanço idêntico ao HEAD.

### 2026-07-16 (f) — PC da Empresa — Painel de Reunião: polimentos pós-teste (commits `e685518`, `61c2acb`, PUSHADOS)
- Lote de ajustes finos que o Diego pediu testando no Pages:
- **Pauta principal sem destaque azul** (`e685518`): o item da pauta principal tinha fundo azul + borda-esquerda azul + texto azul/negrito;
  virou item comum (`padding:8px 0;border-bottom`, checkbox borda cinza quando não-feito, texto padrão). Estrela mantida como marcador **cinza** (`var(--text3)`).
- **Timer vermelho ao ESTOURAR** (`61c2acb`, `iniciarCronometroReuniao`): quando `diff > _reunPlannedMin*60`, o cronômetro fica vermelho + chamativo
  (pulsa): pill normal com fundo/borda/texto `--danger` + ícone `alert-triangle` + sufixo `+Xmin`; no foco, `.rft-elapsed` vermelho/negrito + barra e
  ícone vermelhos. Classe **`.reun-timer-over`** + `@keyframes reunTimerPulse`. Só aplica quando estoura (tempo é monotônico; não reseta).
- **Tarefa ATRASADA** (`reunTarefasHTML`/`tarefaRow`): linha mostra **"⚠ atrasada · \<data>"** em vermelho quando `!done && t.date < today`.
- **Pill "criada"** (📅 hoje/Nd atrás) **removida** da linha da tarefa (grid 6→5 colunas).
- **BUG Data corrigido**: `input[type=date]` da nova tarefa tinha `width:130px` numa coluna de `120px` → vazava do fundo bege. Agora
  `width:100%;box-sizing:border-box;min-width:0` + coluna `132px` (nos 2 grids: header de labels e inputs).
- **Botão "Próxima" REMOVIDO** da trilha e do cabeçalho: o modal de Finalizar já tem "Agendar próxima e levar assuntos" (linha ~32185) → era
  informação repetida (o Diego confirmou que essa era a confusão). `abrirProximaReuniaoModal` **continua existindo** (usado pelo modal de encerramento).
- ⚠️ NÃO testado em navegador; balanço do arquivo idêntico ao HEAD (parênteses/chaves/divs). **Diego confere no Pages (Ctrl+Shift+R).**

### 2026-07-16 (e) — PC da Empresa — Painel de Reunião: visão padrão em 3 COLUNAS (commit `0fc5a9f`, PUSHADO)
- Pedido do Diego: dividir o Painel (visão padrão) em **3 colunas: Pauta | Tarefas (maior, no meio) | Decisões**.
- A coluna esquerda antiga (Pauta+Decisões empilhadas) foi **dividida em 2 colunas** (`.reun-col-pauta` + `.reun-col-dec`); Tarefas
  (`.reun-col-tarefas`) foi pro **meio** com `1fr` (o maior; encolheu vs. o `2fr` anterior). **Ordem visual via CSS `order` (1/2/3)** —
  não movi fisicamente o bloco grande de Decisões (baixo risco); DOM fica Pauta→Decisões→Tarefas, `order` renderiza Pauta→Tarefas→Decisões.
- CSS: `.reun-grid4` base virou `grid-template-columns:minmax(0,300px) minmax(0,1fr) minmax(0,320px)`; foco idem (320/1fr/340, max-width
  1400 centrado). **Separador arrastável (`.reun-col-rz`) removido do HTML** + regras de flex/resizer do foco apagadas; o JS do resizer
  (`_initReunColResizer`/`_loadReunColW`) fica **inerte** (retorna cedo, não acha o elemento). Rápida: esconde Pauta+Decisões, Tarefas full.
  Responsivo: `@media(max-width:1040px)` empilha (Pauta > Tarefas > Decisões).
- ⚠️ NÃO testado em navegador. Balanço do arquivo **idêntico ao HEAD** (parênteses/chaves/**divs**/backticks). **Diego confere no Pages:**
  3 colunas com Tarefas maior no meio; em tela estreita empilha; rápida só mostra Tarefas.

### 2026-07-16 (d) — PC da Empresa — Reuniões: Editar vira aba INLINE; Info=só detalhes; Pessoas=participantes+papéis+presença; Próxima desce (commit `ca66829`, PUSHADO)
- Ajustes que o Diego pediu depois de testar a entrada (c) no Pages (funcionou — abas inline OK):
- **Editar agora é aba INLINE** (não mais modal): `_reunSetSubView('editar')` → `_reunEditarInlineHTML(m)` renderiza o **MESMO** form
  (`renderNovaReuniaoForm`) num container detached e captura o HTML (espelha o truque do `openReuniaoModal`). `_reunSetSubView` prepara o
  estado ao ENTRAR (`editingReuniaoId=id; _reunRec=null; ...`) e limpa ao SAIR. **Cancelar** volta pro Painel (`fecharReuniaoModal` ganhou
  ramo inline quando não há overlay); **Salvar** idem (`saveReuniao` reseta `window._reunSubView='painel'` antes de reabrir). ⚠️ O modal de
  `editReuniao` **continua** para criar/editar pela **LISTA** de reuniões (cards kanban ~29683/29839) — lá não há painel aberto. Coexistem.
- **Info = SÓ detalhes** (data/hora/sala/conduz/tipo). Presença e papéis saíram de lá.
- **Pessoas = tudo de gente:** seção 1 "Quem participa" (grid de checkbox) + seção 2 "Papéis e presença" (só participantes: dropdown
  **Organizador/Editor/Leitor** + presença clicando no nome). **"Organizador" = quem conduz** (`m.facilitador`; `m.organizador` nunca foi
  escrito pelo form — confirmado por grep). `_setPapelReuniao` passou a tratar `'organizador'` (reassina `facilitador`/`organizador`, só 1;
  rebaixar limpa). `togglePresencaModal`/`_toggleParticipanteReuniao`/`_setPapelReuniao` re-renderizam via `openReuniaoView` (sub-aba Pessoas persiste).
- **Trilha do foco:** Editar entrou no grupo das ABAS (após Anexos, com destaque ativo); **Próxima desceu** p/ logo acima de Finalizar (depois
  do `flex:1`) — era o "não seria junto com finalizar?" do Diego. Cabeçalho normal: Editar idem virou aba; Próxima já estava perto de Finalizar.
- ⚠️ **NÃO testado em navegador.** Balanço do arquivo **idêntico ao HEAD** (parênteses/chaves) + backticks par. **Risco maior = o form de Editar
  INLINE** (wiring do drum-picker/recorrência nunca rodou nesse contexto; mas espelha o modal, que funciona). **Diego confere no Pages
  (Ctrl+Shift+R):** aba Editar abre o form no painel → mudar título/hora/sala/recorrência → **Salvar** volta pro Painel com as mudanças; **Cancelar**
  volta sem mudar; testar drum-picker de hora e a caixa Repetir DENTRO da aba; Info só mostra detalhes; Pessoas permite marcar participante,
  promover a Organizador (Conduz muda), Editor/Leitor e presença; na trilha, Próxima fica logo acima de Finalizar.

### 2026-07-16 (c) — PC da Empresa — Painel de Reunião: ícones viram ABAS INLINE + novo ícone "Painel" (commit `f80000e`, PUSHADO)
- **Pedido do Diego (print do modo foco):** cada ícone da trilha (Pessoas/Info/ATA/Anexos) abria um **MODAL** — pra ver outro
  painel tinha que fechar o atual (perde tempo). Pediu que o conteúdo venha na **ÁREA PRINCIPAL**, alternando conforme o ícone
  (inline, estilo Fellow), + um **novo ícone "Painel"** pra voltar à visão padrão (Pauta/Decisões/Tarefas).
- **Como ficou:** novo estado `window._reunSubView` (`painel|pessoas|info|ata|anexos`); **reset p/ 'painel' ao TROCAR de reunião**
  (`if(window._activeReuniaoId!==id)` no topo de `openReuniaoView`), persiste em re-renders da MESMA reunião. O conteúdo do painel
  (banners + grid Pauta/Decisões/Tarefas) foi envolvido num **`#reun-main-<id>`** com ternário `_sv==='painel' ? <painel> :
  _reunSubViewHTML(m)` — **2 edições nas pontas** (linhas ~30718 e ~30917), nada no meio se moveu (baixo risco no arquivo de 33k linhas).
- **Novas funções** (logo após `openReuniaoView`): `_reunSetSubView(id,view)` (seta o estado + chama `openReuniaoView`; faz **FLUSH da
  ATA** ao sair da aba p/ não perder texto não-salvo; `scrollTop=0`), `_reunSubViewHTML(m)` (dispatch) e **4 construtores inline**
  `_reunPessoasInlineHTML`/`_reunInfoInlineHTML`/`_reunAtaInlineHTML`/`_reunAnexosInlineHTML` (adaptados dos modais, sem overlay;
  **mantêm os MESMOS ids** — `ata-view-<id>`, `ata-plaud-resumo/link-<id>`, `anexo-input-<id>`, `anexos-view-<id>` — então
  `salvarAta`/`_reunComporAta`/`_reunPlaudExtrair`/`_reunSetPlaud`/`adicionarAnexos`/`renderAnexos` seguem funcionando sem tocar).
- **Trilha do foco + cabeçalho normal:** ambos ganharam o botão **"Painel"** (`ti-layout-dashboard`) no início das abas; a aba ativa
  fica **destacada** (`_railActive`/`_icoActive`). Divisores separam ações (Sair/Pausar · Editar/Próxima/Finalizar) das 5 abas de conteúdo.
- **Toggles internos** (`_toggleParticipanteReuniao`/`togglePresencaModal`/`_setPapelReuniao`) agora re-renderizam o painel inline via
  `openReuniaoView(mid)` (o `_reunSubView` persiste → a aba certa continua ativa) em vez de reabrir modal.
- **"Editar" CONTINUA modal** (é o **form de config** com drum-pickers/recorrência — inline seria alto risco e não é o "quick-switch"
  que incomodava). **Próxima/Finalizar/Sair/Pausar** seguem ações.
- **Código morto:** os 4 modais antigos `abrir{Presenca,Info,Ata,Anexos}Reuniao` + `fecharPresencaReuniao` ficaram **sem caller vivo**
  (grep confirmou) — marcados `[SUPERSEDED jul/2026]`, mantidos por segurança (deletar ~250 linhas não-contíguas, intercaladas com
  funções vivas — `_reunComporAta`/`_reunPlaudExtrair` etc. — às cegas é arriscado; fica p/ a limpeza dedicada).
- ⚠️ **NÃO testado em navegador** (máquina sem preview; Browser pane não carrega `file://` — policy check travado). Verificação estática:
  releitura de cada edição + wrapper `#reun-main` conferido (abre 30718/fecha 30917) + **backticks +38 (par), parênteses 225/225,
  chaves 100/100** no diff. **Diego confere no Pages (Ctrl+Shift+R):** abrir reunião → clicar Pessoas/Info/ATA/Anexos troca o conteúdo
  na tela **sem modal**; "Painel" volta pra Pauta/Decisões/Tarefas; aba ativa destacada; funciona igual no foco (⛶) e no painel normal;
  marcar participante/presença/papel mantém a aba; digitar na ATA e trocar de aba **não perde** o texto.

### 2026-07-16 (b) — PC da Empresa — Reuniões: BACKFILL da leva `db335f0`→`49c4934` (não estava no handoff)
> As entradas abaixo (a partir de "MODO FOCO") param em `a218584`/`57cc2fc`. Esta entrada documenta os 8 commits seguintes.
- `db335f0`,`9b13fe4`: **modal de criar/editar reunião compactado ~60%** (780→600px; Tipo+Status+Quem conduz numa linha só; padding/gaps
  menores). **Participantes SAÍRAM do modal** (agora só no Painel); `saveReuniao` preserva `window._reunSelParts` e auto-adiciona o facilitador.
- `9b13fe4`,`35ba705`: **recorrência (Repetir) enxuta** — controles (a cada N / dias / término) só no **"Personalizado"**; presets
  (Semanal/Quinzenal/Mensal) mostram só um resumo de 1 linha. Flag `rec._custom` (setada em `_recPreset`, lida em `_recPresetAtual`)
  distingue a escolha EXPLÍCITA de Personalizado da forma do dado.
- `63a9d2d`,`49c4934`: **modo foco — ícones viram TRILHA LATERAL** (estilo Fellow, coluna vertical 74px à esquerda). A barra superior do
  foco ficou só com título+status+cronômetro+presença. ⚠️ Isso **substitui** os ícones no topo descritos na entrada MODO FOCO (`90753dd`).
  Fix `49c4934`: `.reun-panel-wrap` tem `margin:0 auto` inline que vencia o deslocamento → `margin-left:74px!important`.
- `6ebfee4`: **timer com PLAY/PAUSA/RETOMAR** (`_toggleReunTimer`): `m.tempoAcumulado` (seg) + `m.inicioReal` (início do trecho atual,
  null quando pausada) + `m.pausadoReuniao`. Cronômetro (normal+foco) soma o acumulado via `data-acumulado`; ao finalizar guarda
  `m.duracaoSeg`. Tarefas no foco limitadas a `max-width:1400px` centrado.
- `0c7c71d`: **modal de Participantes = SELETOR RÁPIDO** (grid 2-3 col com checkbox; frequentes de 2+ reuniões ganham ⭐ e sobem ao topo,
  via `_reunFreqMap`). Pill só p/ Organizador/Editor; Leitor = nada. **Novo ícone "Info"** (`abrirInfoReuniao`) = detalhes gerais +
  presença + papéis. ⚠️ **Hoje (entrada `c` acima) esses modais viraram ABAS INLINE.**
- `8b32c78`: **tema "Biscoito Klain"** (`data-theme="klain"`): base creme + acentos caramelo (header usa `--blue-*` → vira marrom) +
  fundo com padrão SVG de biscoitos. Registrado no array `TEMAS`; escolher em Configurações → Tema.

### 2026-07-16 — PC da Empresa — Painel de Reuniões: MODO FOCO (tela cheia) + varredura do módulo + 5 mockups
- **Contexto:** o Diego baixou o **Fellow** e gostou do painel ocupar a tela toda (foco na reunião). Pediu (a) modo tela cheia
  no Painel de Reunião, (b) varredura total do módulo de reuniões (bugs/robustez/performance), (c) 5 mockups de ideias novas.
  Autorizou fazer tudo autônomo (ele foi almoçar). ⚠️ **NADA testado em navegador** (máquina sem preview/Node) — Diego confere no
  Pages (Ctrl+Shift+R).
- **MODO FOCO / TELA CHEIA (commit `90753dd`)** — baseado no Mockup 1 aprovado + itens dos outros mockups:
  - Botão **⛶** (`ti-arrows-maximize`) no cabeçalho do Painel → `_toggleReunFocus()` liga `body.reun-focus` e re-abre o painel.
    `Esc` ou botão sai (`_exitReunFocus`). CSS `body.reun-focus`: esconde `.hdr/.sidebar/#sidebar-resizer/.topbar/.fab-create/.fab-menu`
    e põe `#task-container{position:fixed;inset:0;z-index:500}` (fullscreen). z-index dos flutuantes (FAB/toast/modais) é >500 → aparecem por cima, ok.
  - **Barra de foco sticky** no topo (`.reun-focus-bar`, só visível no foco): título+status, **cronômetro com CONTAGEM**
    (decorrido / planejado + barra que vai verde→âmbar→vermelho conforme passa do tempo), presença X/Y, Iniciar/Finalizar.
    Duração planejada vem de `_reunPlannedMin(m)` (horaInicio/horaFim, default 60). O `tick` do cronômetro (`iniciarCronometroReuniao`)
    foi estendido p/ atualizar `#reun-focus-timer-<id>` (`.rft-elapsed` + `.rft-fill`).
  - **Colunas AJUSTÁVEIS:** separador arrastável `#reun-col-rz` entre esquerda (Pauta+Decisões) e direita (Tarefas). Só aparece no
    foco (`display:none` fora → não quebra o grid normal de 2 colunas). `--reun-col1-w` (240–680px), persiste em `LS_REUN_COL1_W`,
    dbl-clique reseta. Funções `_applyReunColW`/`_loadReunColW`/`_initReunColResizer`. A pauta principal já tem destaque no topo
    (reunPautaHTML) e o "Da reunião anterior" já vem titulado no card de Tarefas (reunTarefasHTML) — os 2 pedidos já existiam.
  - **Salvaguardas:** limpa `reun-focus` no Voltar, Esc, `setTab`, e um **guard no `render()`** (se saiu do painel por qualquer
    caminho, desliga o fullscreen). O Painel NORMAL fica 100% inalterado fora do foco.
- **VARREDURA do módulo de reuniões (2 subagentes) → LOTE de fixes (commit `57cc2fc`):**
  - 🟠 **ALTO — `reunFiltroTipo` preso:** o filtro de TIPO foi removido da UI (07-15) mas o valor seguia lido do localStorage no boot
    (e a chave sincroniza pela nuvem). Um `'compromisso'` velho escondia TODAS as reuniões sem saída (armadilha do allView/reunView).
    Fix: `let reunFiltroTipo='todos'` + limpa o LS no boot.
  - 🟡 **`_recRegenerarFuturas` estourava o `fimN`** ao editar ocorrência do meio (gerava fimN + nº de anteriores). Reescrita: desconta
    as anteriores do teto (série mantém exatamente fimN); corrige tb o `serieIdx=1` errado que o `_recMaterializar` setava.
  - 🟡 **"Termina: em" sem data → 60 reuniões** de uma vez. Guard em `_recGerarDatas` (sem fimData → REC_ROLL, não REC_MAX_HARD).
  - 🟡 **`renderHistoricoReunioes` crashava** se alguma reunião não tinha `date`/`title` → guards `(a.date||'')`/`(m.title||'')`.
  - 🟢 id de tarefa por SOMA colidia → `Date.now()*1000+random` (numérico, sem colisão entre ms — mantido numérico p/ não quebrar
    `onclick="toggle(${id})"` sem aspas). `proximaDataReuniao` usava `toISOString` (UTC) → `_isoLocal`.
  - **Perf:** `_recMaterializar`/`_serieTopUp`/`_serieContinuar` gravavam o array `meetings` INTEIRO por ocorrência (até 60
    serializações) → agora `push` + **1** `safeSetItem` no fim. Toggle de tarefa "da reunião anterior" (cadeia 2+ níveis) caía em
    `render()` global → update pontual via `_reunAncestraisIds`.
  - **Modo foco preso:** `_serieContinuar`/`_sugAplicarProxima`/`_sugEncerrarSerie` voltavam à lista sem sair do foco → limpam
    `reun-focus`+`_activeReuniaoId`.
  - **NÃO feito (baixo/decisão):** `reagendarProxima` não copia `rec`/`serieId` na última da série (limítrofe "by design"); ordenar
    só os grupos visíveis em `renderReunioes` (perf baixa, N pequeno). Áreas auditadas e OK: duplicata ao encerrar, migração das
    rápidas, cronômetro (sem vazamento), `saveReuniao` (preserva pauta/serieId, valida Fim≥Início), XSS (tudo escapado), resizer
    (listeners balanceados), z-index do foco.
- **5 MOCKUPS de ideias novas** (via show_widget, só visuais — NÃO codados): **A** Modo Apresentação/TV (fontes grandes p/ TV da sala);
  **B** Kanban de ações (a fazer/fazendo/feito, com carry-over marcado); **C** Timeline da série (ocorrências passadas→agora→futuras,
  o que herdou); **D** 1:1 focado (pauta dos 2 lados, check-in, histórico da pessoa); **E** Recap pós-reunião (auto-recap + "enviar aos
  participantes" + PDF + próxima já montada). Recomendei **E** e **B** como maior ganho de eficiência. **Aguardando o Diego escolher** se
  algum vira feature.
- **CONFERIR no Pages (Ctrl+Shift+R):** abrir uma reunião → botão ⛶ → tela cheia (some sidebar/header); cronômetro contando (só conta se
  status='andamento'); arrastar o separador entre as colunas; Esc sai. Lista de Reuniões não pode estar vazia (fix do reunFiltroTipo).
- **EM ABERTO (herdado):** decisão do `<title>` da aba (Hub Klain), chip "3ª de 8" dentro da reunião, limpeza de código morto (bastante,
  ver resumo do Mac 07-15); Histórico/Lembretes (contradiz remoção do Lembrete — precisa Diego definir); XSS do corpo de Nota (backend Guilherme).

### ⭐ 2026-07-15 — RESUMO DA SESSÃO (Mac) — LEIA ISTO PRIMEIRO
Sessão longa, toda em **Reuniões/Recorrência** + alguns fixes. Tudo commitado e pushado (último: `271e1c2`).
O Diego **validou tudo** ("tudo ok") e testou no navegador. As entradas (2)…(8) abaixo têm o detalhe técnico.

**O que mudou hoje (8 commits):**
| Commit | O quê |
|---|---|
| `43d10cf` | Mural de Ideias: sugestões **anônimas** (autor oculto; `autorId` segue gravado só p/ notificar o autor e impedir voto duplo) |
| `7db3e13` | **FIX**: usuário preso no Kanban mesmo após remover Painel/Cartões (boot ressuscitava `'painel'` do localStorage) |
| `b66da82` | Header vira **"Hub Klain"** + regra 4: commit/push **autônomos** |
| `c21221c` | **Recorrência personalizada + ocorrências materializadas** (o grande) |
| `21fd0a9` | Encerrar **sugere a próxima** da série + botão "Nova reunião" na Agenda |
| `fb31ea7` | Série **"sem fim"** (janela rolante de 8), **"Continuar +8"**, **"Só esta / Esta e as futuras"** |
| `f171309` | **Modal de reunião enxuto** — pauta e modelos foram p/ o Painel |
| `271e1c2` | Aba Reuniões: **sub-navbar por período**; saem filtro de tipo, ⋮ e Mural |

**Como a recorrência funciona agora (resumo p/ não reler tudo):**
`meeting.rec` é a regra; as ocorrências são **materializadas** (reuniões reais já agendadas → aparecem na Agenda,
que era a dor do Diego: planejar semanas à frente). Cada ocorrência é **independente** (mudar dia/hora de uma não
afeta as outras). `serieId` + `continuacaoDe` ligam a série; a guarda `continuacaoDe` impede duplicata ao encerrar.
Editar uma ocorrência oferece **"Só esta" / "Esta e as futuras"** (regenera). "Termina: nunca" mantém ~8 à frente.

**PENDÊNCIAS (nada urgente, nada quebrado):**
1. **Decisão do Diego em aberto:** o `<title>` da aba do navegador ainda é "Gerenciador de Tarefas — Diego Konrad"
   (o header já é "Hub Klain"). Trocar? (O item de sidebar "Gerenciador de Tarefas" deve FICAR — é o nome da área.)
2. **Oferecido e não respondido:** chip **"3ª de 8"** dentro da reunião aberta (hoje só aparece no modal de
   encerramento) e **"regenerar futuras"** a partir do painel.
3. **Código morto acumulado** (não remove nada sem querer — só listando p/ uma limpeza dedicada futura):
   `renderPainel` + branch do Kanban (`allView==='painel'`) e seção "Estilo do painel" nas configs;
   `reunFiltroTipo`/`setReuniaoFiltro`; `toggleReuniaoConfig`/`_fecharReuniaoConfig`; `setReuniaoView` e o branch
   `reunView==='mural'`; `_reunAplicarModelo`/`_reunRebuildPautaList`/`pautaAddItem`/`pautaUpdate`/`pautaRemove`;
   `REUN_FREQ`/`proximaDataReuniao` (substituídos por `rec`/`_recGerarDatas`, mantidos p/ compat).
4. `_reuniaoSemPauta` alerta **"Sem pauta"** com mais frequência (a pauta agora se define no Painel). É um nudge
   correto, mas se incomodar o Diego, revisar.
5. **Mural de Ideias:** "Excluir" é **definitivo** (não vai p/ a Lixeira) — simplificação de protótipo.

**LIÇÃO QUE SE REPETIU 2× HOJE (não caia nela):** ao remover uma opção de visualização, **não basta tirar o botão**
— se o valor ficar salvo no localStorage e for lido no boot, o usuário fica **preso sem como sair**. Aconteceu com
`allView` ('painel' → Kanban) e eu quase repeti com `reunView` ('mural'). **Force o valor e ignore/limpe o LS.**

### 2026-07-15 (8) — Mac de casa — Aba Reuniões: sub-navbar por PERÍODO; saem filtro de tipo, ⋮ e Mural
- **Sub-navbar por período** (centralizada, onde ficava a lista): **Hoje · Amanhã · Essa semana · Próxima semana ·
  Mais adiante · Histórico**, com contadores. `REUN_PERIODOS` + `reunPeriodo` (LS `taskflow_reun_periodo`) +
  `setReunPeriodo` + `_reunSubnavHTML(grupos)`. Reaproveita os **grupos que já existiam** (cascata exclusiva):
  cada período declara `keys` dos grupos que exibe — mudança contida, sem reescrever a normalização das 3 fontes
  (meetings / _reunioesRapidas / compromissos).
  - Semântica: **"Essa semana" INCLUI hoje/amanhã** (como em Minhas Tarefas); **"Pendentes"** (vencidas não
    encerradas) entram em **Hoje**, porque pedem ação; "antigas/encerradas" só no Histórico.
- **Removidos** do header (`_atualizarTabHeaderActions`): o filtro de TIPO (`Todas|Reuniões|Compromissos`) e o
  botão **⋮**. Sobrou só "+ Novo". `setReuniaoFiltro`/`reunFiltroTipo` e `toggleReuniaoConfig` viraram código morto.
- **Mural removido** (só Lista): `reunView` agora é `let reunView='lista'` **sem ler do localStorage** — quem
  tivesse 'mural' salvo ficaria preso sem botão p/ sair (é EXATAMENTE o bug do Kanban/allView, ver handoff (2)).
- ⚠️ **2 bugs meus, achados no teste antes de subir:** (1) `renderHistoricoReunioes` **ignorava** o `subNav` →
  ao entrar no Histórico a sub-navbar sumia e o Diego ficava sem navegação (o botão "Voltar" antigo foi removido
  e substituído pela sub-navbar). (2) Ao sair do Histórico por `setReuniaoTab('reunioes')`, `reunPeriodo` ficava
  em `'historico'` (keys vazias) → lista vazia "Nada em histórico"; adicionada guarda que reseta p/ 'hoje'.
- **Layout:** sub-navbar vai FORA do wrapper de 720px (num container de 940px) — dentro dele as 6 abas não cabiam
  e `justify-content:center` + `overflow-x` **cortava as pontas** ("je…" / "His…"). Padding/fonte das abas
  reduzidos (12.5px / 9px 10px).
- **Respiro** (pedido do Diego): `padding-top:22px` na lista de Reuniões, no Histórico e **dentro do Painel**
  (`openReuniaoView`), afastando do título.
- **FAB:** reunião / reunião rápida / compromisso agora ficam numa **seção própria** (divisor antes e depois);
  tarefa e nota subiram p/ o primeiro grupo.
- **Verificado no browser:** 6 abas com contadores (Hoje 1 · Amanhã 2 · Essa semana 3 · Próxima 5 · Mais adiante
  29 · Histórico), header sem filtro/⋮, `reunView==='lista'`, ida e volta do Histórico com sub-navbar, guarda
  funcionando, FAB na ordem nova. 0 erros de sintaxe/console.

### 2026-07-15 (7) — Mac de casa — Modal de reunião ENXUTO: pauta e modelos foram p/ o Painel
- Pedido do Diego: o modal de criar/editar reunião deve ter só o **essencial** (título, data, hora, tipo, status,
  sala, **recorrência**, quem conduz, participantes). **Pauta principal, Itens da pauta e "Começar de um modelo"
  saíram do modal** e agora são feitos **dentro do Painel**. (Criar e editar usam o MESMO form, então os dois
  ficaram enxutos de uma vez.)
- ⚠️ **Bloqueador que existia** (mapeado antes de mexer): o Painel só EXIBIA a pauta principal (checkbox de done);
  não havia como criar/editar o texto. Tirar do modal a deixaria **inalcançável**. Por isso o editor veio ANTES.
- **Novo no Painel** (em `reunPautaHTML`): quando não há pauta principal → botão tracejado **"Definir pauta
  principal"**; quando há → **lápis** p/ editar inline. Funções `_pautaPrincEditar/_pautaPrincSalvar/
  _pautaPrincCancelar` + `_pautaRefresh(mId)` (re-renderiza só `#pauta-view-<id>`, padrão do `pautaConfirmarAdd`).
  Estado de edição em `window._pautaPrincEd`.
- **Modelos no Painel**: chips aparecem só quando a pauta está TOTALMENTE vazia. `_pautaAplicarModelo(mId,modId)`
  é uma variante nova que escreve direto em `m.pautaPrincipal`/`m.pauta` + `saveMeeting_db` — o antigo
  `_reunAplicarModelo` escrevia em inputs do DOM e mexia em título/tipo (não faz sentido pós-criação).
- ⚠️ **RISCO DE PERDA DE DADOS corrigido**: `saveReuniao` lia `#reun-pauta-principal` e `#pauta-list .pauta-inp`.
  Sem esses inputs, **toda edição zeraria a pauta salva**. Agora usa `_reunAnt` (a reunião existente) e
  **preserva** `pautaPrincipal`/`pauta`/`pautaDone` ao editar; nasce vazia ao criar.
- Removida a obrigatoriedade "⚠️ Defina a pauta principal" do save. Modal virou **coluna única** (o grid 2col e um
  `<style>` com CSS morto — `.reun-form-2col` nunca era aplicada — saíram junto).
- Código morto remanescente (NÃO removido, sem uso): `_reunAplicarModelo`, `_reunRebuildPautaList`, `pautaAddItem`,
  `pautaUpdate`, `pautaRemove`. `_reuniaoSemPauta` agora alerta "Sem pauta" com mais frequência — é um nudge
  correto (a pauta se define no painel), mas se incomodar, revisar.
- **Verificado no browser:** modal sem pauta/modelos; criar sem pauta passa; painel oferece "Definir" + modelos;
  modelo aplicou principal + 5 itens; editar a principal no painel funciona; **editar a reunião preservou a pauta**
  (5 itens + principal intactos). 0 erros de sintaxe/console.
- **Pendente (pedido do Diego, não feito ainda):** sub-navbar por período na aba Reuniões (Hoje/Amanhã/Essa
  semana/Próxima semana/Mais adiante), **remover** a sub-nav de tipo (`reunFiltroTipo` — "Todas|Reuniões|
  Compromissos"), sub-navbar **centralizada** onde hoje fica a lista, e **respiro** (afastar a lista do título)
  — também dentro do Painel de reuniões.

### 2026-07-15 (6) — Mac de casa — RECORRÊNCIA etapa 3: "sem fim" (janela rolante), continuar série, regenerar futuras
- **"Termina: nunca"** (`rec.fimTipo='nunca'`) — p/ reunião fixa (ex.: sensorial toda quinta) não precisar
  escolher número. Materializa `REC_ROLL=8` à frente e **repõe sozinha**: `_serieTopUp(m)` (chamado por
  `_reunProximaDaSerie`, i.e. ao encerrar) garante sempre ~8 futuras não encerradas. Nunca acaba, nem enche a
  agenda de 200 reuniões.
- **"Continuar +8"** — se a série tem fim finito e o Diego encerra a ÚLTIMA, `_abrirFimDeSerie(id)` oferece
  continuar em vez de morrer; `_serieContinuar(id)` gera +REC_ROLL a partir da última e sobe o `fimN` de toda a
  série. (Antes ele ficaria preso em "10 de 10" e teria de recriar tudo.)
- **"Só esta / Esta e as futuras"** (padrão Google Calendar) — ao EDITAR uma ocorrência que tem futuras, aparece
  o seletor de escopo no topo da caixa de Repetir (`window._reunEscopo`). "futuras" → `_recRegenerarFuturas(m)`:
  manda as futuras não encerradas p/ a **Lixeira** e re-materializa a partir desta com a regra/dia/hora novos.
  Caso real do Diego: reunião sempre na quarta → mudou p/ quinta de vez, mas às vezes faz noutro dia (= "só esta").
  ⚠️ `Object.assign(m,obj)` no saveReuniao preservaria `serieId` sobrescrito → guardei e restaurei explicitamente.
- Helper `_recNovaOcorrencia(base,iso,rec,anteriorId,idx)` extraído — usado por `_recMaterializar`, `_serieTopUp`
  e `_serieContinuar` (evita 3 cópias do objeto de reunião).
- **Verificado no browser:** "sem fim" nasce com 9 (1+8) e ao encerrar repõe mantendo 8 à frente (todas na
  quarta, sem duplicata); série finita de 2 → encerrou as 2 → ofereceu "Última da série" → Continuar gerou +8
  (total 10); editar quarta 09:00 → quinta 11:00 com escopo "futuras" regenerou as 5 p/ quinta 11:00 sem
  duplicar. 19/19 testes do motor seguem passando. 0 erros de sintaxe/console.

### 2026-07-15 (5) — Mac de casa — RECORRÊNCIA etapa 2: encerrar sugere a próxima + "Nova reunião" na Agenda
- **Encerrar → sugestão automática da próxima** (pedido explícito do Diego). `_encerrarReuniaoFinal` agora chama
  `_reunProximaDaSerie(m)` (era `_gerarProximaRecorrente`): pega a próxima JÁ materializada via `continuacaoDe`
  e, se for a última, gera pela regra (respeitando o fim). Depois abre `_abrirSugestaoProxima(id)` — modal
  "Próxima da série" mostrando a regra + "2ª de 4" + data/hora **editáveis**.
  - `_sugAplicarProxima(id)`: aplica data/hora **só naquela ocorrência** (as outras não mudam).
  - `_sugEncerrarSerie(id)`: manda ESTA e as futuras não encerradas da série p/ a **Lixeira** (`moveToTrash('meeting')`).
  - "Manter" só fecha o modal (a próxima segue agendada como está).
- **Agenda: botão "Nova reunião"** na navBar (`novaReuniaoNaData(iso)`), abre já na data da semana vista (hoje se
  a semana atual). O clique no dia/slot CONTINUA indo direto p/ Compromisso (fluxo mais usado, não mexido).
  `openReuniaoModal(data,hora)` agora aceita pré-preenchimento via `window._preReunData/_preReunHora` (molde do
  `_preCompData` dos compromissos); form usa esses defaults em `reun-date` e `reun-hora-inicio`.
- **Verificado no browser:** criar série (4 quintas) → encerrar a 1ª → **0 duplicatas**, modal sugere 23/07
  ("2ª de 4"); ajustar p/ 24/07 16h mudou **só ela** (as outras 3 seguiram qui 14h); botão da Agenda presente e
  pré-preenche a data. 0 erros de sintaxe/console.
- **Pendente (opcional):** chip "3ª de 8" dentro da reunião aberta e "regenerar futuras" ao mudar a regra.

### 2026-07-15 (4) — Mac de casa — RECORRÊNCIA DE REUNIÕES (etapa 1: regra personalizada + materialização)
- **Contexto/diagnóstico:** o motor de recorrência existia inteiro (REUN_FREQ, `proximaDataReuniao`,
  `_gerarProximaRecorrente`, banner de data vencida) MAS o campo da UI tinha sido removido em mai/2026 →
  `saveReuniao` lia um `reun-freq` inexistente e **toda reunião nascia `frequencia:'unica'`**: a recorrência
  NUNCA disparava. `atualizarProximaData` também apontava p/ 3 elementos inexistentes (código morto).
- **Problema real do Diego:** a próxima só nascia ao ENCERRAR a atual → a agenda nunca mostrava o futuro e ele
  não conseguia planejar 2-3 semanas à frente.
- **Solução (etapa 1):** regra personalizada + **ocorrências MATERIALIZADAS** (viram reuniões reais já agendadas
  → aparecem na Agenda de imediato, que já lê `meetings` por data via `getEventosDia`).
  - Novo modelo `meeting.rec` = `{ativo,unidade:'semana'|'mes',intervalo,dias:[0..6],mensalModo:'dia'|'nth',
    mensalDia,mensalNth,mensalDow,fimTipo:'apos'|'ate',fimN,fimData}` + `serieId`/`serieIdx`/`serieTotal`.
    `frequencia` fica só p/ compat ('custom'|'unica'). `_recFromLegacy` migra registros antigos.
  - Motor: `_recGerarDatas` (gera as datas SEGUINTES; a reunião criada é a #1), `_recNthWeekday`, `_recDescricao`,
    `_isoLocal` (evita bug de fuso do toISOString). Teto `REC_MAX_HARD=60`.
  - UI no form (onde o campo tinha sido removido, ~"Frequência removida"): `_recBoxHTML`/`_recPreset`/`_recSet`/
    `_recToggleDia`/`_recRedraw` — presets (Não repete/Semanal/Quinzenal/Mensal/Personalizado) + "a cada N
    semanas/meses" + chips de dias da semana + mensal por dia OU "1ª/última Qui" + término após N/até data +
    **preview ao vivo das próximas datas**. `atualizarProximaData()` virou só `_recRedraw()`.
  - `_recMaterializar(m)` cria as seguintes, encadeadas por `continuacaoDe`, todas com `rec` e mesmo `serieId`.
  - `_gerarProximaRecorrente` reescrito p/ usar `rec`. **A guarda `continuacaoDe` impede duplicata ao encerrar**
    (a próxima já existe); só a ÚLTIMA poderia estender, e há guarda p/ respeitar `fimTipo:'apos'`.
- **Cada ocorrência é independente**: mudar dia/hora de UMA não afeta as outras (é registro real).
- **Verificado:** 19/19 testes do motor no jsc (semanal, quinzenal, Ter+Qui, mensal dia 31 **sem drift**
  → 28/02 → 31/03, 1ª/última quinta, término por data/contagem, teto) + no browser: form renderiza, salvar
  materializou 4 quintas (16→23→30/07→06/08) encadeadas com serieId único, **aparecem na Agenda**, encerrar a 1ª
  NÃO duplica, a última respeita "após 4". 0 erros de sintaxe/console.
- **Nota p/ o Guilherme:** materializar é escolha de PROTÓTIPO (comunica a regra com pouco código). No backend
  real o certo é **RRULE + exceções (ocorrências virtuais)**, senão editar a série vira update em massa.
- **Etapa 2 (FEITA — ver entrada (5) acima):** encerrar → sugere a próxima; botão "Nova reunião" na Agenda.

### 2026-07-15 (3) — Mac de casa — Header renomeado p/ "Hub Klain"
- Título do header (span ~linha 2208) passou de "Gerenciador de Tarefas — Diego Konrad" → **"Hub Klain"**.
- **NÃO alterados** (de propósito, aguardando decisão do Diego): `<title>` da aba (linha 4, ainda "Gerenciador
  de Tarefas — Diego Konrad") e o texto da Ajuda (~10514). O item de sidebar "Gerenciador de Tarefas" (~9866)
  deve MESMO ficar — ali é o nome da ÁREA dentro do Hub (convive com Manutenção/Produção/Qualidade/Marketing).
- ⚠️ Regra de trabalho atualizada (Diego, 15/07): **commit + push são AUTÔNOMOS** — não pedir aprovação a cada
  mudança. Ver "Regras de segurança" nº 4.

### 2026-07-15 (2) — Mac de casa — FIX: preso no Kanban mesmo com "só Lista"
- Diego reportou: removeu Painel/Cartões (só quer Lista), mas "Minhas Tarefas" ainda abria em **Kanban**.
- **Causa:** remoção incompleta. O boot (linha ~32029) fazia `allView=safeLSGet(LS_ALLVIEW)||'painel'`,
  sobrescrevendo o `allView='list'` forçado na declaração (~10154). Com LS vazio OU com 'painel' salvo de
  antes, `allView` virava 'painel' → linha ~16285 `if(allView==='painel') renderPainel();return;` desenhava o
  Kanban. E o botão que gravaria 'list' (`setAllView`) está ESCONDIDO (toggle removido) → usuário sem saída pela UI.
- **Fix (1 linha, 32029):** `allView='list'; try{ safeSetItem(LS_ALLVIEW,'list'); }catch(e){}` — força Lista no
  boot E limpa o 'painel' velho do localStorage (conserta retroativo p/ quem já tinha 'painel' salvo).
- Código morto remanescente (NÃO removido, p/ manter fix mínimo): branch `renderPainel` (16285), seção
  "Estilo do painel" nas configs (~28070). Limpar depois se quiser. Verificado: sintaxe 0 erros (jsc).

### 2026-07-15 — Mac de casa — Mural de Ideias: sugestões ANÔNIMAS
- A pedido do Diego, as sugestões do Mural de Ideias agora são **anônimas** (evita atrito/conflito e encoraja
  franqueza). No `renderMural`/`_ideiaAbrir`: removido o autor do **card** e do **detalhe** (vira "👤 Anônima ·
  data"); **comentários** viram "Anônimo" + avatar genérico; a **notificação de comentário** não cita mais quem
  comentou ("💬 Novo comentário em …"); subtítulo passou a avisar "as sugestões são anônimas".
- ⚠️ O `autorId` continua GRAVADO (invisível na UI) — é usado só p/ (a) o autor receber notificação da própria
  ideia e (b) impedir voto duplo. A mudança de status (só admin) segue notificando o autor. Ver a entrada do
  Mural de Ideias mais abaixo p/ a arquitetura completa (reaproveita `LS_SUGESTOES`, dados descartáveis, protótipo).
- Nota multi-máquina: reconciliei divergência de 17+ commits (PCP/Produção/Orçamentos/Klain Run) — nenhum tocou o
  Mural; stash + pull ff + pop limpo. Verificado: sintaxe 0 erros (jsc); anonimato já validado no preview antes.

### 2026-07-13 (3) — PC da Empresa — Sidebar "Início" + REDESIGN da tela de Projetos (toolbar/menu, cabeçalho, Visão geral em 2 colunas)
- **Contexto:** continuação da sessão (2) abaixo. Diego foi refinando a UI por prints, ao vivo; eu editava + commitava + push a cada ajuste.
  Tudo publicado no Pages. ⚠️ **NADA testado em navegador por mim** (esta máquina não roda preview/Node) — Diego confere no Pages (Ctrl+Shift+R).
  ⚠️ **Cache:** um F5 comum servia versão velha (arquivo ~2MB). Confirmei via `curl` que o Pages estava com o código novo — era cache do
  navegador. **Sempre Ctrl+Shift+R.** (Não há service worker próprio; só cache HTTP.)
- **SIDEBAR (commit `936c6ba`):** o botão do topo (`hubMeuDiaItem`) mudou de rótulo **"Meu dia!" → "Início"** (6 variantes na função; ícone
  `ti-sun` e cor personalizada mantidos; ainda chama `voltarMeuDia`). O **item "Início"** (redundante) foi **removido de dentro do grupo
  Gerenciador** (era o `voltarMeuDia` com `ti-home`, ~10038); **"Meu Dia"** (aba `hoje`) permanece.
- **PROJETOS — toolbar/menu (commits `40d7492` → `e25dd7d`):** Agrupar/Ordenar saíram da barra e viraram um **menu ⋮** (`_ppToggleMenu`/
  `_ppMenuOpen`; popover com backdrop `position:fixed` z190 + painel z200). O ⋮ **vive no header** (`#pp-menu-host`, primeiro filho de
  `#pp-header-actions`, **ao lado do "Importar"**), preenchido por `_ppMenuBtnHTML` no fim de `renderProjetosPro`. **Os 3 chips
  (Atrasados/Ativos/Meus) foram REMOVIDOS** (a filtragem `_ppChips`/`_ppFiltrar` continua no código, sem UI → tudo `false`). Toolbar agora =
  só a busca. Bolinha azul no ⋮ quando `_ppGroup!=='tipo' || _ppSort!=='prioridade'`. `abrirProjectProView` zera `_ppMenuOpen`.
- **PROJETOS — cabeçalho do projeto (`renderProjectProView`, commits `d289edc`, `196556d`, `bae268c`, `395774d`, `e1db895`):**
  - **Breadcrumb** (`← Projetos › nome`) saiu do corpo e foi pra **topbar**: injetado em `#tab-title` (`_tt.innerHTML=breadcrumbHTML`, span
    auto-dimensionado — **NÃO mexer no `font-size` do #tab-title**, senão vaza pras outras telas que usam `textContent`). `#tab-sub` segue hidden.
  - **Sub-navbar (abas):** tirei a **linha separadora de 1px acima**; as abas ficaram **sem fundo no ativo**, só o **sublinhado colorido**
    (`p.cor`) indica a ativa; o **track `border-bottom:1px`** ficou (Diego pediu de volta pra tela não ficar "pelada"). ⚠️ **BUG pego e
    corrigido (`bae268c`):** `overflow-x:auto` força `overflow-y:auto`; um `margin-bottom:-1px` que pus criou 1px de sobra → **scrollbar
    vertical do Windows (setinhas)** apareceu. Fix = tirei o `-1px` e fixei `overflow-y:hidden`.
  - **Descrição do projeto removida do cabeçalho** (a pedido; `p.descricao` continua salva/editável no lápis, só não aparece ali).
  - **"Como começar"** virou **ícone de ajuda** (`ti-help-circle`, classe `reun-ico`) na fileira de ícones do header, **antes de
    Participantes** (`ajudaIconHTML`); clica → painelzinho `#pp-ajuda-panel` (stepper Fases/Setores/Tarefas + botão). Só quando 0 tarefas.
- **PROJETOS — Visão geral em 2 COLUNAS (`renderProjectProVisao`, commit `e1db895`) — mockup aprovado via show_widget:**
  - **Header enxuto:** só título+status+ícones (removi do header a linha tipo/início/prazo e o bloco de %/atrasadas/Dono do canto).
  - **Coluna 1 (`minmax(0,300px)`):** cartão de infos (**tipo · Início · Prazo · Dono**) + **cards empilhados** Tarefas · Atrasadas ·
    **Pessoas** (novo). **Coluna 2 (`1fr`):** **Progresso do projeto** (% + barra + conclusão prevista via `_conclCard`/`_ppAnalise`) +
    **Fases do projeto** (lista leve, `abrirFaseEspecifica`). Classe `.pp-visao-2col` empilha em 1 coluna abaixo de 720px (`<style>` inline no return).
  - Código morto inofensivo deixado: `_linhaPessoas`/`pessoasHeader`/`proximaFase`/`progressoBloco` (definidos, sem uso) e `_ppToggleChip`.
- **Verificação:** edições cirúrgicas + greps de balanceamento/refs órfãs a cada passo (0 dangling). **NÃO testei em navegador.**
- **CONFERIR no Pages (Ctrl+Shift+R):** sidebar botão "Início"; Projetos → ⋮ ao lado de Importar abrindo Agrupar/Ordenar, sem os 3 chips;
  abrir um projeto → breadcrumb no topo, abas limpas c/ track, sem descrição, ícone "?" ao lado de Participantes; Visão geral em 2 colunas.
- **EM ABERTO (mesmo da entrada (2)):** Histórico/Lembretes (precisa Diego definir o que é — contradiz a remoção do "Lembrete"); XSS do
  corpo de Nota (rich-text → backend do Guilherme sanitiza); perf da lista de Projetos; limpar código morto.

### 2026-07-13 (2) — PC da Empresa — Sidebar (largura + grupos sem fundo) + LOTE do backlog (2 críticos, 2 altos, modelos de reunião, XSS toast, a11y)
- **Pedido do Diego:** "faça tudo que está em aberto, pode editar sem permissão" + 2 ajustes de sidebar: (a) tirar o **fundo** dos títulos de
  grupo (deixar só ícone+título, cores mantidas); (b) **regulador de largura** da sidebar (cada um põe na largura que quiser).
- **SIDEBAR — 2 ajustes (commit `6a383f9`):**
  1. `.sbnav-group-header` perdeu `background` e `border-left` (agora `background:transparent`); hover sutil mantido; cores do texto
     intactas (claro e `body.dark`).
  2. **Regulador de largura:** `.sidebar` usa `width:var(--sidebar-w,280px)`. Nova alça `<div id="sidebar-resizer">` (6px, entre sidebar
     e main) — arrastar redimensiona (200–560px), **duplo-clique reseta** (280px), **setas ←/→** movem 16px (a11y, `tabindex=0`).
     Persiste por aparelho em `LS_SIDEBAR_WIDTH='taskflow_sidebar_width'`. JS: `_applySidebarWidth`/`_loadSidebarWidth`/`_initSidebarResizer`
     (chamados no boot perto de `_applySidebarVisibilityState`). ⚠️ **Troquei** os seletores de `.sidebar.sb-hidden + X` (adjacente) para
     `body.sb-collapsed X` — o resizer entrou entre `.sidebar` e `.sidebar-edge-actions` e quebraria o `+`. `toggleSidebarVisibility` e
     `_applySidebarVisibilityState` já alternam `sb-collapsed` no body junto com `sb-hidden`.
- **🔴 CRÍTICO #1 — auto-push cego RESOLVIDO (commit `6a383f9`):** decidi (você mandou fazer) por **portão de sessão + reconciliação por
  `updated_at`** (mais robusto que só a flag). Novo estado `_cloudSyncedThisSession` + carimbo `LS_CLOUD_SYNCED_TS` (`taskflow__cloud_synced_ts`,
  **excluída do sync**). Push automático (`_cloudOnLocalWrite`/`_cloudPushKey`) **só liga** depois que o aparelho reconcilia na sessão
  (`_cloudReconcileOnConnect`): se a nuvem não mudou desde a última sync deste aparelho (maior `updated_at` == carimbo), religa sozinho;
  se outro aparelho mexeu (ou nunca sincronizou aqui, ou erro de rede), fica **pausado** e pede Baixar/Enviar. Guard de conflito por chave
  no `_cloudPushKey`. Baixar/Enviar/auto-seed carimbam e religam. Botão ☁️ mostra `ti-cloud-check` (sincronizado) vs `ti-cloud` (pausado).
  ⚠️ **1º boot pós-deploy:** usuário logado verá "envio pausado" até 1 clique em Baixar OU Enviar (o carimbo ainda não existe) — é a direção
  segura por design; depois fica transparente. **Baixe a nuvem 1× ao abrir** (a regra de ouro agora é reforçada pelo próprio app).
- **🔴 CRÍTICO #2 — cronograma reescrevia t.date RESOLVIDO (commit `6a383f9`):** decisão = **data manual vence**. `renderProjectProTarefas`
  (~26350) só re-projeta datas de tarefa **sem `dateManual`**. `_autoSaveEditField('date')` seta `dateManual` ao definir data à mão. Seed do
  "Implantação do Hub Klain" marca `dateManual` nas tarefas com data (ondas). **Migração 1x** `taskflow_datemanual_migr_v1`: marca tarefas de
  projeto JÁ existentes que têm data (preserva o que está hoje). Trade-off: reordenar não re-flui datas já fixadas — se preferir "esteira
  manda sempre", me avise.
- **🟠 ALTO #3 — restaurar projeto vazio RESOLVIDO (commit `6e617f2`):** `excluirProjectPro` guarda `_linkedTasks` (id+fase+grupo) no item da
  Lixeira; `restoreFromTrash` (ramo projectPro) **religa** as tarefas (se ainda existirem). Não volta mais vazio / tarefas órfãs.
- **🟠 ALTO #4 — pull inseguro RESOLVIDO (commit `6e617f2`):** `_cloudPullAll` **aborta** se o backup pré-pull falhar (não sobrescreve sem
  cópia); aplicação **parcial** (quota no meio) retorna `ok:false` (não afirma sucesso em estado misto). Mantido `setItem` cru no apply
  (não dispara o mirror durante o Baixar).
- **toast() sem XSS (commit `6e617f2`):** mensagem via `textContent` (DOM), não `innerHTML` — fecha o XSS latente quando concatena dados do
  usuário. Botão Desfazer e ícone preservados. (Confirmei: nenhum caller passava HTML de propósito.)
- **a11y painel de reunião (commit `6e617f2`):** checkboxes de pauta principal, itens de pauta e tarefas ganharam `role=checkbox` +
  `tabindex=0` + `aria-checked` + teclado (Espaço/Enter). Placar do topo ao excluir tarefa "da reunião anterior" **já estava** ok
  (`delTarefaReuniao` reabre o painel).
- **🟡 MODELOS DE REUNIÃO (commit `4c3f574`):** `REUNIAO_MODELOS` (fixo no código, espelha os modelos de Projeto): **1:1, Daily, Semanal da
  equipe, Retrospectiva, Kickoff, Planejamento**. Chips "Começar de um modelo" na coluna direita do form da Nova Reunião (**não aparece ao
  editar**). Aplicar preenche pauta principal + tipo + título sugerido + itens da pauta (`_reunAplicarModelo` + `_reunRebuildPautaList`).
- **Verificação:** revisão estática dedicada por subagente sobre todo o diff `d32fe44..HEAD` (7 áreas) = **0 problemas** (sintaxe, refs,
  template literals, CSS×JS da sidebar, resizer sem vazamento, lógica do portão de sync sem trava/sem push cego). ⚠️ **NÃO testado em
  navegador por mim** (esta máquina não roda preview — o `preview_start` travou). **Você confere no Pages (Ctrl+Shift+R).**
- **CONFERIR no Pages:** (1) grupos da sidebar sem fundo; (2) arrastar a borda direita da sidebar p/ redimensionar (dbl-clique reseta);
  (3) ☁️ vai aparecer "pausado" — clique **Baixar** 1× (baixa a nuvem e religa o auto-push); (4) abrir projeto → aba Tarefas NÃO corrompe as
  datas das ondas; (5) excluir projeto → Lixeira → Restaurar → volta COM as tarefas; (6) Nova Reunião → chip de modelo preenche a pauta.
- **AINDA EM ABERTO (não feito — decisão/escopo):**
  - **Histórico e Lembretes (telas):** **NÃO fiz** — "Lembrete/someday" foi **removido** deste protótipo numa sessão anterior (a teu pedido),
    então recriar uma tela "Lembretes" **contradiz** aquela decisão. Preciso que você diga o que "Lembretes" deve ser aqui (é o backlog
    #1078/#1139 do Guilherme? uma tela nova?) antes de eu codar. Histórico idem (definir o que ele mostra).
  - **XSS do corpo de Nota (rich-text):** não corrigido de propósito — Nota guarda HTML real (negrito/listas); escapar quebra a formatação e
    um sanitizador por regex dá falsa segurança. É XSS latente **só no cenário multiusuário** → responsabilidade do **backend do Guilherme**
    (sanitizar no servidor). Mesmo caso do `_notifItemHTML`.
  - Menores latentes: performance da lista de Projetos (memoizar progresso/cronograma + debounce na busca); limpar código morto (restos do
    Lembrete/someday, Kanban/Cartões inertes); `importarDadosJSON` (safeLSClear) desloga do Supabase.

### 2026-07-13 — PC da Empresa — SIDEBAR unificada em acordeão + só Lista (Painel/Cartões removidos)
- **Pedido do Diego (com mockups aprovados via show_widget):** (a) "trazer o Gerenciador pra fora" — sidebar única em **acordeão**:
  grupos **Gerenciador**, **Gestão** e cada **Área** expandindo INLINE (sem "voltar ao início"), com separador **ÁREAS**; remover
  **Pessoas** e **Equipe**. (b) Tirar **Painel/Cartões** de tudo → só **Lista**.
- ⚠️ **Nota de sincronização:** esta sessão (PC da Empresa) começou rotulada 2026-07-10 e o repo reconciliou com trabalho do PC da
  Produção (entrada 2026-07-13 abaixo). Meus commits `207fb35`+`5782451` (sidebar+view) são descendentes lineares do `8b7a91a` e
  coexistem com o trabalho de horário/agenda/reuniões — sem conflito. As entradas 07-10 abaixo são desta mesma sessão.
- **FASE 1 — só Lista (commit `207fb35`):** `allView` fixo em `'list'`; `setAllView` força list; `view-toggle-stack` sempre
  `display:none`; botões Cartões/Painel removidos do HTML. Projetos: `_ppView` fixo em `'lista'`, `setPpView` força, segmento removido.
  Render Kanban/Cartões segue no código, só **inerte**.
- **FASE 2 — sidebar acordeão (commit `5782451`):** `renderSidebar` força `_sbView='taskflow'` → as 5 ramificações por área viram
  **código morto inofensivo**; montagem única: grupo `gerenciador` (Início→`voltarMeuDia`, Meu Dia→`hoje`, Minhas Tarefas, Solicitadas,
  Organizar) + grupo `gestao` (Análise/Projetos/Reuniões[`ti-microphone`]/Notas/Rotinas) + `hubGroupDivider('ÁREAS')` + grupos
  `manutencao`/`marketing`/`producao`/`qualidade` (sub-item chama `setXView`, que já seta hubView+view+renderSidebar+renderX) +
  `_sbLixeiraFooter()` (Mural+Lixeira). Reusa `grupo()`/`toggleSbnavGroup`/`_sbnavColapsados`. **Removidos:** grupo Pessoas + item Equipe.
  - **Chave:** `setTab` já seta `hubView='taskflow'` e os setters de área já setam hubView → só `renderSidebar` mudou. `navSubItem` só
    acende com `hubView==='taskflow'`. **Áreas colapsadas 1×** (flag `taskflow_areas_seed_v1`, na declaração de `_sbnavColapsados` ~5714),
    NÃO a cada render — ⚠️ **bug do colapso-por-render pego pela revisão de subagente e corrigido** antes do commit.
- **Verificação:** revisão estática dedicada por subagente (sintaxe/refs/estado-ativo/navegação = ok). ⚠️ **NÃO testado em navegador**.
  Diego confere no Pages (Ctrl+Shift+R): acordeão; expandir/clicar áreas sem re-colapsar; Início vs Meu Dia; zero Painel/Cartões.
- **Pendências:** Histórico/Lembretes ficaram de fora (não existem no protótipo); person-view some da sidebar (ainda alcançável por
  aba/busca); botão "Lista" solitário no person-view (cosmético).

### 2026-07-13 — PC da Produção — HORÁRIO (duração padrão + pares nativos) + VARREDURA nova (11 bugs) + fixes Agenda/Reuniões
- **Contexto/sandbox:** a sessão anterior rodou numa cópia dessincronizada; o repo real já estava em `462cdc0` (com o fix horário
  `a2020cd`, a varredura de 42 achados, unificação de reuniões, FAB modal completo etc.). Esta sessão trabalha sobre o `462cdc0` real.
- **HORÁRIO — feature turbinada (pedido do Diego "em todo o HUB, Fim segue o Início"):** o drum já fazia Fim=Início quando vazio
  (commit `a2020cd`, **verifiquei no navegador que funciona**). Agreguei: (1) **duração padrão** — ao escolher o Início, o Fim vira
  **Início+60min** (reunião/rápida) ou **+30min** (compromisso) em vez de 0min, via novo `opts.addMin`→`data-propagate-add` em
  `drumFieldHTML` + `_horaAddMin` (clampa 23:59); (2) o Fim agora segue também quando está **antes** do Início (não só vazio), sem
  sobrescrever um Fim válido posterior; (3) os **2 pares NATIVOS** que faltavam ganharam auto-fill via `_horaAutoFim(this,endId,add)`:
  "Agendar próxima reunião" (`prox-ini/fim`, +60) e "Registro de horas" (`aj-inicio/fim`, +60). Verificado no navegador (duração,
  override, preserva Fim válido, clamp, nativo). ⚠️ Se o Diego preferir Fim=Início EXATO (0min), é só zerar os `addMin`.
- **VARREDURA NOVA (workflow 20 agentes, ~1.9M tokens):** 11 bugs confirmados (verificação adversarial), 27 melhorias, 5 pares de horário.
- **FIXES aplicados AGORA (Agenda/Reuniões — autorizado pelo Diego; commit desta entrada), todos verificados no navegador:**
  1. **Card "Próxima reunião" pegava COMPROMISSO** (renderReunioes ~28532) → clique morto/dados vazios. Agora `_proxReuniao` usa
     `grupos[k].reunioes.find(r=>!r._compromisso)`.
  2. **Excluir tarefa "Da reunião anterior" não sumia do painel** (`delTarefaReuniao` ~31527): re-render mirava `tarefas-view-<meetingId>`
     do ancestral (fora do DOM). Agora reabre pelo `window._activeReuniaoId` (atualiza card Tarefas + placar).
  3. **Arrastar compromisso sem Fim → duração negativa** (`calDragStart` ~18673): `durMin` agora cai p/ 30min quando não há Fim>Início.
  4. **`salvarCompromisso` sem validação Fim≥Início** → bloqueia com toast. Mesma validação em **`saveReuniao`**.
  - Melhorias (Reuniões): **facilitador entra como participante** automaticamente; **criar reunião abre o painel** (criar-e-abrir);
    **excluir compromisso na lista** deixou de usar `confirm()` → Lixeira + FAB Desfazer (padrão do HUB).
- **BUGS confirmados NÃO tocados (fora de Agenda/Reuniões — precisam do seu OK):**
  - 🔴 **Auto-push cego sobrescreve a nuvem sem comparar `updated_at`** (`_cloudPushKey` ~4419) — perda de dados entre aparelhos (já é o
    crítico antigo). E `_cloudPullAll` backup/aplicação em catch vazio retorna ok:true; `safeSetItem` quota-fail = perda silenciosa;
    `importarDadosJSON` (safeLSClear) desloga do Supabase e chaves importadas não sobem.
  - **Tarefas:** arrastar p/ Concluído (`dropCard` done_col ~17327) **não grava `doneAt`** → quebra aba Confirmações + KPIs; `getSemana`/
    `getProxSemana` (~5674) sem o guard `(!projectProId||executor)` → seed de projeto vaza p/ Semana/Próxima.
  - **Secundárias:** restaurar projeto excluído devolve projeto **vazio** (tarefas viram órfãs).
  - Melhorias latentes: `toast()` e `_notifItemHTML`/corpo de Nota usam innerHTML sem escape (XSS latente cross-user no backend);
    grade da Agenda esconde eventos fora de 05–23h; layout de colunas estreita eventos sem conflito; PCP/ranking sem debounce.
- ⚠️ **Diego conferir no Pages** (Ctrl+Shift+R): criar reunião/compromisso → escolher Início 15:00 → Fim vira 16:00/15:30; "Agendar
  próxima" e "Registro de horas" idem; excluir tarefa "Da reunião anterior" some na hora; criar reunião cai no painel.

### 2026-07-10 (7) — PC da Empresa — REUNIÕES: fix horário + varredura do painel + ATA turbinada (PLAUD/Compor/Extrair)
- **Pedido do Diego:** (a) no seletor de horário, o **Fim** deveria seguir o **Início** (abria sempre em 08:00); (b) comparar o painel
  de reuniões com Fellow & cia. e **variar bugs/melhorias dentro do painel**; depois "faça na ordem que achar melhor".
- **FIX HORÁRIO (commit `a2020cd`):** `drumFieldHTML` ganhou `opts {fallbackId, propagateToId}` (data-attrs). `openDrumPicker` — se o
  campo abrir vazio, começa no valor do fallback (**Fim começa no Início**). `drumConfirm` — ao confirmar, se o alvo estiver vazio,
  ele recebe o valor (**escolher Início já preenche o Fim**). Aplicado nos 3 pares: Reunião Rápida, Reunião completa, Compromisso.
  **Bônus:** removidos os `<input hidden>`/`type=time` avulsos que **duplicavam o id** de `reun-hora-inicio/fim` e `comp-inicio/fim`
  (getElementById pegava o avulso; o hidden do drum ficava órfão) — agora 1 input por campo.
- **VARREDURA DEDICADA do Painel (commit `8d69ecf`):** 3 bugs corrigidos — (1) `saveNovaTarefaInline` usava `id:Date.now()` puro →
  `+random` (colisão em cliques rápidos) + `_persisted`; (2) `estatisticasPresenca` fazia `.date.localeCompare` sem guard → **crash na
  tela da pessoa** se reunião encerrada sem date → `(b.date||'')`; (3) `cancelNovaTarefaInline` não limpava o executor. **Sem bug crítico
  no painel** (encerramento/carry-over/recorrência sólidos).
- **ATA TURBINADA (commit `c710f06`) — inspirado em Fellow/AI note-takers:**
  - **PLAUD na reunião COMPLETA** (antes só na rápida): resumo+link no modal da ATA (`abrirAtaReuniao`), ids `ata-plaud-*` p/ não colidir.
  - **"Compor rascunho da ATA"** (`_reunComporAta`/`_reunAtaRascunho`): gera a ATA em texto de título/data/participantes+presença/pauta
    (com status)/decisões/ações/resumo PLAUD. Confirma antes de sobrescrever ATA existente.
  - **"Quebrar resumo em itens"** (`_reunPlaudExtrair`/`_plaudLinhaPara`): cada linha do resumo do PLAUD vira **Pauta/Decisão/Tarefa**
    com 1 clique (tarefa nasce sem executor → aparece no painel + Organizar p/ atribuir). ⭐ é o diferencial (usa o device PLAUD).
  - **Decisões com re-render PONTUAL** (`_reunDecisoesListHTML` extraída): add/remove atualiza só a lista (não perde scroll; linha fica
    aberta p/ registrar em série). Antes chamava `openReuniaoView` (re-render total).
  - **Tarefa da reunião** agora tem `solicitante=CURRENT_USER_ID` → entra em **Solicitadas** (loop de cobrança).
- **ANÁLISE (Fellow & cia.) — o que ainda FALTA (não feito):** ⭐ **Modelos de reunião** (1:1/Daily/Semanal/Retrô — pauta pré-pronta,
  reaproveita o motor dos modelos de Projeto); notas/talking-points + dono + time-box por item de pauta; lembrete pré-reunião + recap
  pós (notificar cada um com "suas ações"); nota de efetividade; 1:1 com pauta compartilhada; ligar decisão→tarefa + placar de ações;
  parking lot. Pequenos ainda abertos: excluir tarefa "anterior" não atualiza o placar do topo; checkboxes são `<div>` (sem teclado/a11y).
- ⚠️ **NÃO testado em navegador** (sem preview do index.html aqui). Diego confere no Pages: seletor de horário (Fim segue Início);
  painel → ATA → PLAUD/Compor/Quebrar em itens; adicionar decisão sem perder scroll.

### 2026-07-10 (6) — PC da Empresa — Projetos (modelos/seed/importar) + VARREDURA multi-agente (42 achados) + lote seguro
- ⚠️ **Correção de data:** as duas entradas mais abaixo rotuladas **"2026-07-08" (Projetos MODELOS / Projetos Importar) são desta MESMA
  sessão (2026-07-10, PC da Empresa)** — datei errado. O código delas está no git e íntegro (confirmado: coexiste com o trabalho de
  07-10 do PC da Produção — reuniões/FAB — sem conflito). Só o rótulo de data ficou errado; deixei-as onde estão pra não arriscar mover bloco.
- **Nesta sessão (07-10, PC da Empresa) foram 3 blocos de trabalho:** (a) Projetos "Importar (colar)"; (b) Projetos modelos prontos +
  onboarding + seed "Implantação do Hub Klain"; (c) **VARREDURA** do app. (a) e (b) detalhados nas entradas "2026-07-08" abaixo.
- **VARREDURA (pedido "faça uma varredura atrás de melhorias e bugs"):** workflow ultracode de 8 caçadores paralelos + verificação cética
  → **45 achados, 42 confirmados** (relatório em `scratchpad/wr717iaqm.output`).
- **🔴 CRÍTICO ainda ABERTO (não corrigido — precisa decisão):** **auto-push cego à nuvem** (`_cloudOnLocalWrite`~4413→`_cloudPushKey`~4418):
  toda gravação com sessão logada faz upsert do local por cima da nuvem SEM comparar `updated_at`. Abrir numa máquina com dados velhos
  (sessão reconecta ~1,5s) + editar 1 tarefa = apaga edições da outra máquina. Fix requer decisão: flag `_cloudPulledThisSession` OU
  comparar `updated_at`. Agravante: seeds de demo (Marketing/Manutenção/PCP) sobem à nuvem só de ABRIR a aba.
- **LOTE SEGURO APLICADO (commit `b291990`):** (1) **XSS Notificações** — escapa campos do usuário na FONTE (`cutucar`~13532,
  `responderCutucada`~13572, `_criarNotifMencao`~22721), preservando `<b>` (sink `_notifItemHTML` 22810/22832 segue com markup fixo).
  (2) **Mural "undefined"** — add `mural` aos mapas `titles`/`subs` do `setTab`. (3) **`getTodayTasks`** ganhou guard
  `(!t.projectProId||t.executor)`. (4) **`_pcpParse` get()** — com cabeçalho reconhecido retorna '' p/ coluna ausente (parou de corromper
  Saldo/DDV/Sugestão). (5) **Texto "Enviar p/ nuvem"** — era "SUBSTITUI"; agora diz que atualiza/mescla (é upsert-only). (6) **Backup
  pré-pull fora do sync** (`_isCloudKey` exclui `taskflow__backup_pre_pull`).
- **MANTIDOS EM ESPERA (precisam decisão/cuidado):** cronograma reescreve `t.date` no render da aba Tarefas (⚠️ corromperia as datas do
  seed — **evitar abrir a aba "Tarefas/Planilha" do projeto exemplo até decidir** — I13); excluir projeto→restaurar devolve projeto VAZIO
  (tarefas órfãs); `_cloudPullAll` backup/aplicação parcial retorna ok:true; `toast()`+corpo de Nota (rich-text) XSS latente; perf da lista
  de Projetos (memoizar/índices/debounce) + `_ppTarefasOrdenadas` grava no render + `updateStats` varre 8-9× + `saveTask_db` re-serializa
  120KB; concluir rotina no Painel/Cartões não avança; constantes de data não recalculam à meia-noite; DDV-alvo/filtros PCP não persistem;
  código morto (restos do "Lembrete/someday" + migração destrutiva no boot, `markTaskDoneFromHub`, `_pcpUpdateKPIs`).
- ⚠️ Fixes revisados por grep; **NÃO testados em navegador** (sem preview aqui). Diego confere no Pages.

### 2026-07-10 (5) — PC da Produção — FAB "Nova tarefa" agora abre o MODAL COMPLETO (igual editar)
- **Pedido do Diego:** ao criar tarefa pelo **FAB**, trazer o **modal completo** (todos os campos), como se fosse editar.
- **Contexto:** o HUB tem 2 modais de tarefa — `#task-modal` (quick-add inline, o que o FAB usava via `toggleForm`) e
  `#edit-modal` (completo: descrição, executor, solicitante, projeto/fase, reunião, subtarefas, anexos, comentários, histórico).
  O completo (`openEdit(id)`) é atrelado a uma tarefa existente e **auto-salva por campo** (onblur `_autoSaveEditField`).
- **Solução (convenção do próprio código — criar-em-branco-e-abrir-editor, igual `novoEquipamento`):** nova função
  **`abrirNovaTarefaCompleta()`** cria uma tarefa **rascunho** (`_novaDraft:true`, formato canônico espelhado do quick-add ~21907,
  pré-vínculo a Projeto Pro se estiver num), faz push em `tasks`, e chama `openEdit(id)` + foca o título. `fabAction('tarefa')`
  agora chama essa função (era `toggleForm()`).
- **Descarte seguro:** `closeModalDirect()` ganhou guarda — se fechar (X/fora/etc.) com **título vazio**, remove o rascunho de
  `tasks` (+ `deleteTask_db`), não polui listas nem a nuvem; se tem título, limpa a flag e mantém. Sempre `render()` no fim quando
  havia rascunho (some o vazio, ou aparece a nova tarefa).
- Verificado no navegador: FAB → abre `#edit-modal` completo (Salvar + Executor + título vazio); fechar sem título **descarta**;
  preencher título/prio + fechar **mantém** a tarefa (flag removida); boot limpo, 0 erro.
- Obs.: só o **FAB** mudou. Outros pontos de "nova tarefa" (quick-add do cabeçalho/inline) seguem com o `#task-modal` rápido —
  se o Diego quiser padronizar todos no completo, é trocar as outras chamadas de `toggleForm`.

### 2026-07-10 (4) — PC da Produção — BUG: trocar de tema saía do Painel de Reunião (corrigido) + varredura do HUB
- **Sintoma (Diego):** dentro do Painel de Reunião, ao **mudar de tema**, caía de volta na lista (perdia o painel).
- **Causa:** `aplicarTema()` chama `render()`; o `render()` para `currentTab==='reunioes'` chamava `renderReunioes()` (a LISTA),
  ignorando o painel — que é aberto imperativamente por `openReuniaoView` (guardado em `window._activeReuniaoId`), não relido pelo render.
- **Varredura do HUB (a pedido do Diego):** as OUTRAS telas de detalhe **não** têm o bug porque relêem seu estado no re-render:
  Manutenção (`manutEquipAberto`/`manutOrdemAberto`/`manutOrcamentoAberto`/`manutFornecedorAberto` em `renderManutencao`),
  Produção (`fichaProdutoAberta` + PCP via `producaoView` em `renderProducao`), Projetos (`activeProjectProId` em `renderProjetosPro`),
  Pessoa (`sidebarPersonId`), Qualidade/sensorial (`qualidadeView`). **Só o Painel de Reunião** era imperativo sem guard. 
- **Fix (commit desta entrada):** (1) `render()` no ramo `reunioes` reabre o painel se `window._activeReuniaoId` estiver setado e a
  reunião existir (senão a lista); (2) `setTab()` limpa `window._activeReuniaoId` (navegar por aba fecha o painel → clicar "Reuniões"
  mostra a lista); (3) botão "Voltar às reuniões" limpa `window._activeReuniaoId` antes de `renderReunioes()`. Sem efeito colateral:
  `iniciarCronometroReuniao` já dá `clearInterval` antes de recriar, então reabrir o painel não empilha cronômetro.
- Verificado no navegador: abrir painel → trocar tema (claro↔escuro) **continua no painel**; Voltar → lista; navegar por aba → fecha.
  Boot limpo, 0 erro.

### 2026-07-10 (3) — PC da Produção — BUG: tarefa pendente sumia após 2+ continuações de reunião (corrigido)
- **Sintoma (Diego, testando):** encerrou uma reunião com 2 tarefas em aberto, concluiu 1, e agendou a próxima (continuação).
  A tarefa que sobrou **não veio** pra nova reunião — ficou "Nenhuma tarefa ainda".
- **Causa:** o carry-over (`reunTarefasHTML` + banner "Da reunião anterior") só olhava **1 nível** pra trás
  (`m.continuacaoDe`), mas a tarefa **nunca troca de `meetingId`** — continua na reunião de origem. Numa cadeia
  M1→M2→M3, a M3 procurava tarefas da M2 (que não tem nenhuma própria) e não achava a pendente que ainda pertence à M1.
  Reproduzido no preview (M3 dizia "Nenhuma tarefa"; tarefas com meetingId===M2 = 0).
- **Fix (commit desta entrada):** novo helper **`_reunAncestraisIds(m)`** sobe toda a cadeia `continuacaoDe` (guarda anti-ciclo,
  máx 20). `reunTarefasHTML` agora puxa pendentes de **todas** as reuniões anteriores da cadeia (`!done && anc.includes(meetingId)`);
  o banner de placar soma a cadeia inteira. Verificado no navegador: M3 (2 saltos) mostra a pendente + "1/2 concluídas · 1 pendente";
  M2 (1 salto) sem regressão; a concluída não aparece; boot limpo, 0 erro.
- ⚠️ Nota de design (p/ o Guilherme / futura decisão): tarefas carregadas **não são "re-homeadas"** pra nova reunião — o
  vínculo fica no `meetingId` de origem e o carry-over é por cadeia. Alternativa seria reassinar `meetingId` no encerramento;
  optei por não mexer no dado (menos destrutivo). Decidir qual regra vale no backend.

### 2026-07-10 (2) — PC da Produção — REUNIÕES: unificação IMPLEMENTADA (rápida = estágio; PLAUD; 2 seções)
- Implementado o **modelo decidido** (ver entrada anterior). O preview voltou por outro canal (`Claude_Browser`), então
  **verifiquei tudo no navegador** (migração, view leve, promover, cards, filtro) — 0 erro de console, boot limpo.
- **Estágio 1 — Dados (migração aditiva):** `_migrarRapidasParaReunioes()` (chamada no `load()` logo após carregar
  meetings/rápidas/compromissos). Cada `_reunioesRapidas` vira uma reunião em `meetings` com **`nivel:'rapida'`**, id
  determinístico `'reunrr_'+id` (idempotente, sem duplicar em multi-máquina), `titulo→title`, `data→date`, `obs→plaudResumo`;
  depois esvazia `_reunioesRapidas` e persiste. Testado: migra, mapeia campos, esvazia. ✅
- **Estágio 2 — Painel (view leve + promover):** em `openReuniaoView`, se `m.nivel==='rapida'` mostra
  **`_reunRapidaTopoHTML`** (card roxo PLAUD: **Resumo (textarea)** + **Link da gravação**, salvos on-blur por
  `_reunSetPlaud`) + botão **"Abrir painel completo"** (`_reunPromoverCompleta`: seta `nivel='completa'`, e **se ATA vazia
  copia o resumo do PLAUD pra ATA**). No modo rápida o grid vira 1 coluna e a **coluna esquerda (Pauta+Decisões+Anteriores)
  é escondida** (`display:none`), deixando só **Tarefas full-width** (rápida ainda captura tarefas). Selinho **⚡ rápida** no
  cabeçalho. `saveReuniao` agora marca reunião nova como `nivel:'completa'`; **`salvarReuniaoRapida` REAPONTADA** — cria uma
  reunião `nivel:'rapida'` em `meetings` (não mais no array antigo) e abre o painel leve. Testado: topo PLAUD, promover,
  ATA semeada, esquerda esconde/reaparece. ✅
- **Estágio 3 — Lista (2 seções + selinho):** segmented control de 4→**3** (`Todas · Reuniões · Compromissos`), tira
  "Reunião rápida" (virou estágio); normaliza valor antigo `reunFiltroTipo==='rapida'`→`'reuniao'`. Cards (lista e mural)
  ganham chip **⚡ Rápida**; `_reuniaoSemPauta` retorna `false` p/ rápida (não é pendência). Reuniões nível rápida abrem
  `openReuniaoView` (painel leve), não o editor antigo. Testado: 3 opções, chip, normalização, sem "Sem pauta". ✅
- **Compat/legado:** `_reunioesRapidas` fica vazio; funções antigas (`editarReuniaoRapida`, `duplicarReuniaoRapida`,
  `reunRapida*HTML`) ficam inertes (array vazio) — não removidas p/ não arriscar. Restore da Lixeira tipo `reuniaoRapida`
  ainda funciona (re-migra no próximo load). **Compromisso privado por dono = regra do BACKEND** (Guilherme, RLS); no
  protótipo single-user não filtrei (evita esconder dado).
- ⚠️ **Diego testar no navegador** (Pages ~1min + Ctrl+Shift+R): criar reunião rápida (Novo → Reunião rápida) → cai no painel
  leve com PLAUD → "Abrir painel completo" → vira completa com ATA rascunhada; lista mostra ⚡; filtro só Reuniões/Compromissos.
- **Ainda em aberto (revisão):** código morto no painel (`partsHTML/projHTML/proxDataTxt`), `decisoes` legado, recorrência por
  dias fixos, encerramento automático, anexos base64. E o **layout do painel completo** (proporção Pauta 1/3 × Tarefas 2/3) —
  o Diego pediu Tarefas 2×; reavaliar se quiser reequilibrar.

### 2026-07-10 — PC da Produção — REUNIÕES: revisão a fundo + MODELO DECIDIDO + 5 fixes da revisão
- **Contexto novo (importante):** o HUB de verdade do **Guilherme** já está rodando com **~20 pessoas**, tudo no banco/servidor da Empresa.
  Este TaskFlow é **base de teste de layout/UX/regra**. O **próximo passo do Guilherme = Reuniões**, então o Diego quer afinar o
  Painel de Reuniões aqui com calma antes de virar backend.
- **Revisão (3 subagentes)** do módulo de reuniões — achados-chave: **3 entidades paralelas** (`meetings` com `title/date`,
  `_reunioesRapidas` com `titulo/data`, `compromissos`) forçam código duplicado; campos mortos em `meetings` (`tarefas[]`,
  `localTipo`, `etiquetas[]`, `localExterno` lido mas sem input); dupla fonte de verdade em decisões (`decisoes` × `decisoesItens`);
  `REUN_STATUS.continuacao` declarado e nunca usado; dois conceitos contraditórios de "em andamento"; sem encerramento automático.
- **⭐ MODELO DECIDIDO com o Diego (guia p/ o Guilherme):**
  1. **Reunião = UMA entidade, dois estágios.** Nasce **rápida** (assunto·quando·participantes· **PLAUD: resumo em texto + link da gravação**),
     sem pauta/ATA. Botão **"Abrir painel completo"** promove pra **completa** (pauta/decisões/tarefas/ATA/recorrência) — mesma reunião,
     **nada migrado**; o resumo do PLAUD vira rascunho da ATA. Selinho ⚡ enquanto rápida. → mata a coleção `_reunioesRapidas` separada
     (vira `meetings` com `nivel:'rapida'|'completa'`).
  2. **Compromisso = entidade separada, tempo pessoal/externo** (almoço, corte, treino). Só título·categoria·quando·onde.
  3. **Visibilidade = participantes (regra única, sem toggle de privacidade).** Todo encontro (rápida/completa/compromisso) pode ter
     participantes do HUB e **aparece na agenda de TODOS os envolvidos** (dono + participantes). Compromisso sozinho (corte de cabelo) =
     só o dono vê (privado por consequência); com gente do HUB = aparece pra eles. **No backend (Guilherme): RLS = `dono OU eu ∈ participantes`**
     (o ponto crítico multiusuário) + notificar quem é adicionado + query de agenda = "encontros onde sou dono ou participante".
  4. **Lista com 2 seções** (Reuniões · Compromissos) em vez dos 4 filtros atuais; "rápida" é estágio, não tipo.
- **5 FIXES já aplicados nesta sessão (commit desta entrada):**
  1. **Dedup "Da reunião anterior"** — antes aparecia 2×: banner no topo (com lista) + seção no card Tarefas (mesma lista). Agora o banner
     do topo virou **só o placar** ("X/Y concluídas · N pendentes — veja em Tarefas ↓"); a lista acionável fica só no card Tarefas
     (`openReuniaoView`, IIFE ~29928).
  2. **Bug `executor`** — `saveNovaTarefaInline` (~31390) gravava só `people:[quem]` e **nunca `executor`** → responsável sumia no
     accountability e saía "—" no PDF. Agora grava `executor:quem` também.
  3. **Excluir reunião rápida** (card) → agora **soft-delete p/ Lixeira + FAB Desfazer** (era `confirm()`+delete direto). `excluirReuniaoRapidaConfirm`.
  4. **Excluir compromisso** (card na aba Reuniões) → idem, Lixeira + Desfazer. `excluirCompromissoConfirm`.
  5. **Empty-state** da lista agora conta `compromissos` (antes, lista só com compromissos mostrava "Nenhuma reunião criada ainda").
- ⚠️ **NÃO testado em navegador por mim** — o **preview MCP caiu no meio da sessão**; revisado à mão (edições cirúrgicas em blocos/funções
  fechados). Diego precisa abrir o Pages (~1min pós-push + Ctrl+Shift+R) → aba **Reuniões** e conferir: painel sem a duplicação; criar tarefa
  na reunião e ver o executor no accountability/PDF; excluir rápida/compromisso e usar Desfazer.
- **PRÓXIMO PASSO (grande, ainda NÃO feito):** implementar a **unificação** no protótipo — fundir `_reunioesRapidas` em `meetings`
  (`nivel`), view leve da rápida + botão "Abrir painel completo", campos PLAUD (texto+link), lista em 2 seções, compromisso filtrado por
  dono. É reestruturação; fazer com migração sem perder dados. Outros itens da revisão em aberto: código morto no painel
  (`partsHTML/projHTML/proxDataTxt` ~29843), `decisoes` legado, recorrência por dias fixos, encerramento automático, anexos base64 (cota).

### 2026-07-10 — PC da Empresa — Projetos: MODELOS PRONTOS + onboarding do método + seed do projeto exemplo (rotulado 07-08 por engano; ver entrada 07-10 (6))
- **Pedido do Diego (estava fora, "só faça"):** melhorar a seção **Projetos** ao máximo p/ **40 pessoas** usarem (simples + completo),
  atacando a dor central dele: **não saber pensar/organizar em fases e tarefas**. Criar o projeto "Implantação do Hub Klain" inteiro
  como exemplo, e entregar um **passo a passo** de como montar um projeto do zero. Ultracode ligado → 2 workflows (design + verificação adversarial).
- **Descoberta-chave:** o sistema de **templates de projeto já existia** (`_projTemplates`, `criarProjetoDeTemplate`, `abrirGerenciadorTemplatesProj`)
  mas **nascia VAZIO** — e `criarProjetoDeTemplate` tinha **BUG**: não setava `projectProFaseId`/`projectProGrupoId` → toda tarefa de modelo
  nascia solta e a fase mostrava 0%. Corrigido (espelha o importador `_ppImportarSalvar`).
- **O que entrou (commit `16436f9`):**
  - **`PROJ_MODELOS`** (const fixa no código, logo após `let PP_TIPOS`): **6 modelos prontos** — Implantação de Sistema (bi), Lançamento de
    Novo Produto (produto), Obra/Nova Linha (obra), Campanha (campanha), Evento/Feira (evento), Melhoria PDCA (outro). Cada um com fases +
    setores + tarefas de exemplo. **Não vão pro localStorage** (não poluem sync, evoluem via git). `_projModeloById(id)`.
  - **Galeria "Modelos"** (`abrirGerenciadorTemplatesProj` reescrita) em 2 seções: **Modelos prontos** (Usar/Prévia) + **Meus modelos**
    (Usar/Prévia/Editar/Excluir). Nova **`_ppModeloPreview(id)`** (árvore fases→setores→tarefas antes de instanciar). Botão da topbar renomeado
    "Templates"→**"Modelos"** (ícone `ti-layout-grid`).
  - **`criarProjetoDeTemplate` corrigida**: aceita built-in (`_projModeloById`) + `_projTemplates`; vincula tarefa a fase/setor (ids únicos
    por `base+contador`); `coordenador=CURRENT_USER_ID`.
  - **Estado-vazio da lista** (`renderProjetosPro`) reescrito: ensina o **método** (🎯 Objetivo → 🗂️ Fases → 🏢 Setores → ✅ Tarefas) +
    grid dos modelos + "Criar do zero"/"Importar".
  - **Visão geral**: guia **"Como montar este projeto"** (stepper Fases→Setores→Tarefas) aparece enquanto `prog.total===0`.
  - **Modal Novo projeto**: banner **"Começar de um modelo pronto"**; **`criarProjectPro`: coordenador = dono** por padrão (I8).
  - **`_hint`** em Tipo/Dono/Setor; padroniza **"Setor"** (era "grupo de setor"/"setor / grupo").
  - **Seed 1x** (`LS_IMPL_SEEDED='taskflow_impl_seeded'`, chamado em `load()` após a migração de projetos): cria o projeto real
    **"Implantação do Hub Klain"** (7 fases, 21 tarefas). ⚠️ **Tarefas com `executor=null` de propósito** — a verificação adversarial pegou
    que `executor=Diego` faria as 21 tarefas **vazarem** p/ Meu Dia/Minhas Tarefas/Atrasadas/"Uso da equipe" (esses filtros só excluem
    tarefa de projeto SEM executor). Com `executor=null` o projeto fica completo (progresso/setores certos) mas não polui listas pessoais.
- **Verificação (ultracode):** workflow de 10 subagentes (5 lentes caçadoras + verificação cética). Resultado: **0 erro de sintaxe, 0 ref
  quebrada, 0 XSS, render-shape ok**. 1 bug real confirmado (vazamento do seed) → **corrigido**. Descartados: "seed esconde o estado-vazio"
  (é intencional — o Diego pediu o exemplo; o método também está na galeria/guia/stepper) e "rename re-semeia" (falso: flag é o guard primário).
- **Guia entregue:** Artifact **"Como montar um projeto do zero"** (método Objetivo→Fases→Setores→Tarefas + heurísticas p/ achar fases/tarefas
  + erros comuns + checklist). Fonte em `scratchpad/guia_montar_projeto.html`. É o "passo a passo" que o Diego pediu; serve tb p/ as 40 pessoas.
- ⚠️ **NÃO testado em navegador** (sem preview/Node aqui). **Diego precisa:** abrir o protótipo (Pages, ~1min pós-push + Ctrl+Shift+R) →
  Gestão → **Projetos**. Vai ver o projeto **"Implantação do Hub Klain"** já criado. Testar: abrir o projeto e navegar fases/setores/tarefas;
  botão **Modelos** → Prévia + Usar um modelo pronto (confere se cria projeto com fases/tarefas e progresso certo); "Novo projeto" → banner de modelo.
  Pra ver o **estado-vazio** que ensina o método, teria que ficar sem nenhum projeto (ele só aparece com a lista vazia).
- **Próximos passos possíveis:** (a) decidir se o seed deve rodar p/ todo mundo ou só demo; (b) ligar tarefas do exemplo a pessoas reais se
  quiser o dashboard "Uso da equipe" vivo; (c) botão "Exportar projeto (JSON)"; (d) as melhorias de menor prioridade não feitas (I10 enxugar
  toolbar, I11 memoizar progresso, I12 proteger excluir/Lixeira, I13 não sobrescrever data manual pela projeção do cronograma).

### 2026-07-10 — PC da Empresa — Projetos: "Importar (colar)" + projeto "Implantação do Hub Klain" (dogfooding) (rotulado 07-08 por engano; ver entrada 07-10 (6))
- **Contexto/pedido do Diego:** usar a própria seção **Projetos** (projectsPro) pra planejar a **implantação do Hub Klain** na
  empresa (dogfooding) — e assim entender como a seção Projetos vai se comportar. Ele mandou os prints da build do **Guilherme**
  (`hub.biscoitosklain.com.br` — sidebar Gerenciador: Meu Dia · Minhas Tarefas · Solicitadas · Organizar · Histórico · Lembretes;
  Gestão: Projetos · Reuniões · Notas · Rotinas) + o **cronograma de ondas de pessoas**. ⚠️ Lembrar: aquela build é do Guilherme,
  NÃO este git. O projeto que montei vive no **protótipo** (este `index.html` / Pages), pra demonstrar formato/regras.
- **NOVO "Importar (colar)" no Projetos** (`_ppImportarUI`/`_ppImportarSalvar`, logo após `renderProjetosPro` ~24232; botão
  "Importar" na topbar `pp-header-actions` ~2482, antes de Templates). Cola JSON (1 ou vários projetos) → cria **projectPro**
  (`_novoProjectPro`) + **fases** (`_novaFase`) + **grupos/setores** (`_novoGrupo`) + **tarefas** vinculadas por
  `projectProId`/`projectProFaseId`/`projectProGrupoId` (com `setorManual=true` p/ o setor não ser sobrescrito pela derivação por
  executor). **Aditivo, em-código, NÃO toca na nuvem** (mesmo motivo do Importar de Orçamentos: "Baixar da nuvem" sobrescreveria
  tudo). IDs únicos por `base=Date.now()`+contador. Prio validada contra `PRIO_LABEL` (urgente/alta/media/baixa/trivial→senão media).
  Defaults: `executor`/`dono`/`coordenador` = `CURRENT_USER_ID` (Diego `p1779098505705`) → as tarefas TAMBÉM aparecem em Minhas
  Tarefas/Meu Dia por data. Formato do JSON documentado no comentário acima da função.
- **JSON do projeto pronto** no scratchpad: `projeto_implantacao_hub.json` (validado no PowerShell: **7 fases, 21 tarefas**).
  Estrutura: F1 Fundação & Piloto (concluída, 13 pilotos) · F2 Onda 1 20/07 (8) · F3 Onda 2 27/07 (3) · F4 Onda 3 03/08 (5) ·
  F5 Onda 4 10/08 (4) · F6 Operadores só-celular (a definir, 9 — inclui tarefa "DECIDIR estratégia mobile") · F7 Adoção/Suporte/
  Evolução (contínua: medir adoção, suporte, **backlog do Guilherme** #859/#861/#1107/#1078/#1139, rotinas padrão). Cada onda = 3
  tarefas (Preparar/Treinar/Acompanhar) com datas amarradas. Granularidade escolhida pelo Diego = **por onda (enxuto)**.
- ⚠️ **Ambiguidade a confirmar com o Diego:** "Samuel" apareceu 3× (1 em pilotos + 2 em só-celular) — dedupliquei p/ 1 em só-celular;
  confirmar se são pessoas diferentes. E o grupo só-celular está como decisão aberta (F6) porque ele mesmo marcou "precisamos definir".
- ⚠️ **NÃO testado em navegador por mim** (sem Node/Python/preview nesta máquina, como sempre). Revisado à mão + JSON validado +
  checado 0 redeclaração de função. **Diego precisa:** abrir o **protótipo** (Pages, após ~1min do push + Ctrl+Shift+R) → Gestão →
  **Projetos** → **Importar** → colar o conteúdo do `projeto_implantacao_hub.json` → conferir se o projeto aparece com as 7 fases,
  setores e tarefas, e navegar. Se algo estiver torto, me trazer. Commit `6d9ec20` (push OK na 2ª tentativa; 1ª falhou por rede/firewall da Empresa).
- **Próximos passos possíveis:** transformar em **template de projeto** (reusar p/ próximas implantações); ligar tarefas a **pessoas reais**
  (hoje executor=Diego; poderia criar/associar people p/ o dashboard "Uso da equipe" ficar vivo); botão "Exportar projeto (JSON)" p/
  o caminho de volta; confirmar as ambiguidades acima.

### 2026-07-03 — PC da Empresa — NOVA ÁREA "Marketing" › aba "Influenciadores" (embaixadoras: controle + gamificação)
- **Nova ÁREA de topo "Marketing"** (mesmo padrão de Produção/Manutenção/Qualidade): botão na home (Meu dia), em ordem
  **alfabética entre Manutenção e Produção**. `hubView` ganhou valor `'marketing'`. Funções `switchToMarketing`/`setMarketingView`/
  `renderMarketing` + bloco de sidebar `_sbView==='marketing'` + dispatch em `render()`. Ícone `ti-speakerphone`.
- **Aba "Influenciadores"** (`renderInfluenciadores`, breadcrumb Marketing › Influenciadores) com **6 sub-abas in-screen** (barra
  de tabs `_influSubTabsHTML`, estado `influView` persistido em `LS_INFLU_VIEW='taskflow_influ_view'`):
  1. **Painel** — KPIs (ativas, % do envio, kits, publicaram, conteúdos) + card do envio atual + top-3 do ranking.
  2. **Embaixadoras** — CRUD completo (nome/@/seguidores/nicho/cidade/endereço/status). Excluir → **Lixeira** (`moveToTrash`) + FAB Desfazer.
  3. **Envios & Processo** — 1 envio/mês; ao abrir mostra as **39 ETAPAS (texto do Diego, verbatim)** agrupadas em 5 fases
     (planejamento/kit/expedição/acompanhamento/fechamento) com checkbox + **progresso %** + nota por etapa; **etapa 22 traz a
     observação Luiza↔Robson**. Abaixo, **tabela por embaixadora** (qtd, rastreio, rastreio-enviado, entregue, publicou, avaliação).
  4. **Conteúdos** — registrar story/reel/post + toggle "Repostado no perfil Klain".
  5. **Ranking** — leaderboard com medalhas; **pontos DERIVADOS** (recalculados dos conteúdos+entregas × pesos, nunca persistidos).
  6. **Regras** — editar pesos da gamificação (reel/post/story/repost/entrega/cumpriu/penalidade) em `LS_MKT_CONFIG`.
- **Inspiração:** site **Inside Creator** (insidecreator.com.br — plataforma de EGC/gamificação p/ colaboradores), repaginado
  aqui p/ **embaixadoras** (influenciadoras). Foco duplo pedido pelo Diego: **controle geral** + **gamificação**.
- **Dados:** chaves novas `taskflow_embaixadoras` / `taskflow_envios` / `taskflow_mkt_config` / `taskflow_influ_view` /
  `taskflow_mkt_seeded` (prefixo `taskflow_` → entram no sync da nuvem). Lazy-load `_mktLoad()` (não mexe no `load()` do boot).
  **Seed de demonstração** (5 embaixadoras + 1 "Envio de Julho" em acompanhamento) grava 1x, guardado por flag; pra abrir "vivo"
  na demo do Guilherme. Novos tipos na Lixeira: `embaixadora` + `envio` (labels/icons + `restoreFromTrash` com `_mktLoad()`).
- **Bug pego e corrigido na revisão:** minha função `_meSet` colidia com a do editor de **Equipamentos** (redeclaração de função
  → a minha sobrescrevia e quebraria a edição de equipamentos). Renomeada p/ **`_mktEmbSet`**. Também endureci o link do conteúdo
  (só rende `<a>` se for http/https). Varredura estática (subagente): 0 refs indefinidas, 0 redeclarações, delimitadores balanceados,
  5 hooks corretos, texto de usuário todo escapado (sem XSS em innerHTML/onclick).
- ⚠️ **NÃO testado em navegador por mim** (sem Node nem Python nesta máquina, como nas sessões anteriores). Revisado à mão + varredura.
  **O Diego precisa abrir e clicar:** Meu dia → **Marketing** → **Influenciadores** → passear pelas 6 abas, criar embaixadora,
  abrir o envio e marcar etapas, registrar conteúdo, ver o ranking. Publicado só aparece no Pages **após commit+push** (~1min) + Ctrl+Shift+R.
- **PENDÊNCIAS Marketing (próximos passos):** confirmar com Diego/Luiza o texto final das 39 etapas + o agrupamento em fases;
  decidir se "produtos do envio" viram formulário editável (hoje é seed); campos de data de envio/recebimento por embaixadora
  existem no modelo mas ainda não têm input na tabela; possível "temporada"/reset mensal do ranking; ligar embaixadora↔pessoa se quiser.

### 2026-07-02 — PC da Empresa — PCP editável (modelo vivo) + Ordens de Produção + AUDITORIA/fixes · MOBILE CONGELADO
- 🚫 **MOBILE CONGELADO (decisão do Diego, 02/jul):** o repo `taskflow-mobile` (https://dkonrad88.github.io/taskflow-mobile/)
  foi **só um teste** — **NÃO mexer mais nele** (nem melhorar, nem corrigir) a partir de agora, salvo o Diego pedir explicitamente.
  Guardar só a referência: código em `G:\g_Diego\HTML\taskflow-mobile\index.html` (é o COMBINADO); mockups A/B/COMBINADO em
  `G:\g_Publico\- DIEGO\TaskFlow\`. Se surgir bug lá, **não corrigir** — anotar e seguir.
- **PCP virou "modelo vivo" (Produção › PCP):** colunas **Estoque/Pedido/OP-OC/Maras/MDV editáveis** (inputs inline);
  **Saldo/DDV/DDV S/OP/Sugestão + KPIs recalculam ao vivo**. Helpers novos: `_pcpCalc` (Saldo=Est+OP/OC+Maras−Pedido;
  DDV=Saldo/MDV; DDVs/OP=(Saldo−OP/OC)/MDV; Sugestão=DDV-alvo×MDV−Saldo), `_pcpFmt`, `_pcpSaldoHTML`/`_pcpDdvHTML`/
  `_pcpDdvsopHTML`/`_pcpSugHTML`, `_pcpEdit`→`_pcpUpdateRow`(imediato)+`_pcpSettle`(re-render debounced 500ms que reaplica
  filtro/KPIs e devolve o foco por id `pcp-inp-<idx>-<field>`). Coluna **Sugestão de produção** + campo **DDV-alvo** (padrão 15,
  `pcpDdvAlvo`, NÃO persiste ainda). Botão **"Restaurar colado"** (backup `LS_PCP_ORIG` gravado no colar). Renomeado
  "Planejamento (DDV)" → **PCP**. Visual: KPIs tingidos, chips de DDV, zebra, FILTROS em cinza, campos não-brancos no tema claro.
- **Sub-aba "Ordens de Produção" ATIVADA** (`_pcpProducaoHTML`): sugestões (sug>0) viram lista de OP por linha, ordenadas por
  urgência (menor DDV), com KPIs (itens a produzir/urgentes/volume) e badge RUPTURA/ATENÇÃO. Outras sub-abas seguem "em construção".
- **AUDITORIA (4 agentes) + FIXES aplicados** no `index.html`: `_pcpNum` agora tolera **ponto decimal** na edição (era bug
  crítico — "1000.5"→10005); recálculo único por render (memo)+`Map` de índices (fim do O(n²)); `_pcpEsc` escapa `"`/`<`/`&`
  (fecha XSS no onclick da linha colada); `_pcpParse` casa cabeçalho **por prefixo** ("Vendas (261 dias)"); "Uso da equipe"
  coluna Solicitadas conta só `!done`; simulador de Orçamento aparece ao vivo (0→>0) + guard de "Invalid Date"; mobile `esc()`
  escapa `'` (último toque no mobile antes de congelar). Commits: `06feb85` (app), `0b19022` (mobile).
- ⚠️ **NADA testado em navegador por mim** (preview/Python/Node indisponíveis nesta máquina há várias sessões). Tudo revisado
  à mão. O Diego precisa **abrir o PCP e clicar** (colar SISPRO, editar Estoque/Pedido com vírgula E ponto, ver recálculo+KPIs,
  aba Ordens de Produção). Dados PCP em `LS_PCP='taskflow_pcp_ddv'`; colar via "Colar do SISPRO".
- **PENDÊNCIAS PCP (próximos passos):** (B) **FEFO/validade** — cruzar giro×vencimento, precisa do paste da aba **"Lotes e OP's"**
  do SISPRO (validade/dias em estoque — NÃO vem no Histórico); persistir `pcpDdvAlvo` + repeti-lo na aba Produção; ativar
  sub-abas Resumo/Ordens de Compra; afinar cortes do semáforo. Baixa prio da auditoria: regenerar ids no import de orçamento;
  overflow de fim de mês no cronograma do simulador.
- ⚠️ CRÍTICOS ANTIGOS ainda abertos (da auditoria de 30/jun, não corrigidos): push automático à nuvem pode subir estado parcial
  (`_cloudOnLocalWrite`) + corrida boot×auto-push; XSS nas Notificações (`n.texto` cru); Mural "undefined" no cabeçalho.

### 2026-07-01 — PC da Empresa — NOVO REPO "taskflow-mobile" (protótipo mobile p/ a turma testar)
- **Repo novo, SEPARADO deste:** https://github.com/dKonrad88/taskflow-mobile (público) · Pages:
  **https://dkonrad88.github.io/taskflow-mobile/** . Pasta local: `G:\g_Diego\HTML\taskflow-mobile\` (`index.html` + README).
  ⚠️ NÃO confundir com este repo TaskFlow (protótipo do HUB). O mobile é só a **captura rápida** pra turma testar UX.
- **Origem:** evoluiu do mockup `G:\g_Publico\- DIEGO\TaskFlow\taskflow-mobile-*.html` (original→v2→A/B→COMBINADO).
  O publicado é o **COMBINADO**: Organizar como 1ª aba com caixa "Nova tarefa" inline (Enter salva) + chips Hoje/Amanhã/
  Sem data; FAB ＋ abre captura rápida (tarefa/nota) que **fica aberta** p/ lançar em série; abas Organizar·Atrasadas·
  Hoje·Amanhã·Solicitadas·Notas; Solicitadas c/ sub-abas Solicitadas/Confirmações.
- **Persistência:** localStorage POR APARELHO (`tfm_tasks`/`tfm_notas`/`tfm_uid`), `persist()` em cada render, `loadStore()`
  no boot, `resetStore()` p/ limpar. NÃO é multiusuário (dados não compartilham entre pessoas — isso é backend do Guilherme).
- ⚠️ **NÃO testado em navegador por mim** (preview/Python/Node indisponíveis nesta máquina). Revisado à mão. O Diego
  precisa abrir o Pages e confirmar. Se algo quebrar, é só corrigir o `index.html` do repo taskflow-mobile e `git push`.
- Arquivos de mockup antigos (original/v2/A/B) seguem em `g_Publico` — pode apagar deixando só o COMBINADO (não feito ainda).

### 2026-06-30 — PC da Empresa — Comparativo de 2 orçamentos (pipocas 300×500) + "Importar" em Orçamentos + AUDITORIA
- **Comparou 2 propostas Valmaq** (linha de Pipocas Caramelizadas): `.docx` 300 kg/h (Prop. 0210.26) × `.pdf` 500 kg/h
  (Prop. 0214.26). Extração: docx via PowerShell (zip→document.xml); PDF via **Word COM** (`SaveAs2` wdFormatText) —
  pdftoppm/Python/Node NÃO existem nesta máquina. Resultados-chave: TOTAL R$ 1,9M × R$ 3,2M (+68%); canhões 14×R$30k
  × 25×R$32k; tambores Ø900→Ø1000; pré-secador 1→2 un. Entreguei tabela markdown + comparativo visual (show_widget).
  ⚠️ Doc do 500 tem typo ("300 Kg/hora" no cabeçalho do Item 2) e **sem linha "INVESTIMENTO TOTAL"** (somei 800k+2,4M).
- **Novo "Importar (colar)" no módulo Manutenção › Orçamentos** (`_orcImportarUI`/`_orcImportarSalvar`, logo após
  `novoOrcamento`; botão no cabeçalho de `renderOrcamentos`). Cola JSON (1 ou vários) → **additivo** (push em `orcamentos`,
  `saveOrcamentos`), regenera só o id do orçamento (`_mntId('or')`), preserva campos/cotações. Motivo: o Diego queria o
  comparativo DENTRO do módulo, mas **injetar via nuvem foi DESCARTADO** — pra pegar 1 orçamento ele teria que "Baixar da
  nuvem", que **sobrescreve TODO o local** (risco crítico da auditoria). Importar-colar é em-código, sem tocar em dados.
  JSON pronto do comparativo salvo no scratchpad (`orcamento_pipocas.json`).
- **Orçamentos agora suportam ITENS (quantidade × valor) na comparação** (`_orcComparacaoHTML` reescrito + helpers
  `_moAddItem`/`_moDelItem`/`_moSetItem`/`_moToggleItem`/`_moToggleCot`/`_moSetItemVal`/`_moRecalcTotais`/`_moItemVal`).
  Cada item é uma linha com checkbox (liga/desliga do **Total**) + nome editável; cada cotação tem qtd×valor unitário
  por item; **chips no topo ligam/desligam cotações (colunas)**; linha **"Total (itens marcados)"** recalcula sozinha.
  Quando há itens, a linha "Preço" do quadro de critérios some (o Total assume) e o insight "mais barato" usa o Total.
  **Aditivo** (`b.itens`/`cotacao.itensVals`/`it.off`/`cotacao.off` — undefined = comportamento antigo; sem migração).
  Edição de qtd/valor faz recálculo direcionado por id (`orcsub-*`/`orctot-*`) p/ não perder foco. JSON v2 com itens
  pré-preenchidos (canhões + linha) no scratchpad (`orcamento_pipocas_v2.json`).
- **Simulador de negociação na comparação** (`_simCardHTML`/`_simSet`/`_simPagto`/`_simScheduleHTML`/`_simAddInterval`/
  `_simInpStyle`/`_simLab`, após `_moRecalcTotais`): 1 card por cotação ativa. Campos interligados **Desconto % ↔ Alvo
  R$/kg ↔ Total simulado** (R$/kg usa a Capacidade, pré-preenchida do campo "Capac…"); mostra Economia. **Cronograma de
  pagamento** flexível: Entrada %, Nº parcelas, Intervalo + unidade (dias/meses), data Início → tabela com datas e valores.
  É **client-side, NÃO persiste** (cenário "brincar"); base acompanha o Total dos itens (sincronizada em `_moRecalcTotais`
  via `_simSet(cid,'reset')`). Pedido do Diego: negociar por MATERIAL (itens) e ter alavancas de what-if (desc/R$kg/total).
- ⚠️ **Também NÃO testado em navegador** (preview/python indisponível) — revisado à mão; o Diego precisa clicar e confirmar.
- ⚠️ **NÃO testado em navegador** (preview MCP caiu citando Python; sem Node p/ checar sintaxe). Código revisado à mão,
  espelha padrões do módulo, mas o Diego precisa **clicar e confirmar**. (Honestidade: passo de verificação pulado.)
- **AUDITORIA ampla (4 agentes) — achados em aberto, NÃO corrigidos ainda** (o Diego pediu só a varredura):
  - 🔴 CRÍTICO dados: push automático à nuvem pode subir estado parcial por cima da nuvem (sem a salvaguarda do "Enviar"
    manual) — `_cloudOnLocalWrite` ~4410; e corrida boot×auto-push (`_cloudInit` setTimeout 1500 × migrações do load).
  - 🟠 ALTO: XSS no painel de Notificações (`n.texto` cru em `_notifItemHTML` ~21948 — cross-user com backend);
    `saveTask_db` re-serializa array inteiro (~120KB) a cada toggle; ~15-20 varreduras de `tasks` por clique
    (`updateStats` 2× no toggle); IDs `Date.now()` puro colidem; migração Projetos zera `LS_PROJECTS` 1ª vez sem Lixeira.
  - 🟡 MÉDIO: **Mural de Ideias sem entrada em titles/subs → cabeçalho "undefined" + botões de tarefa indevidos**
    (~14150; fix trivial, espelhar 'solicitadas'); toasts com dados crus; push/pull engolem erro de rede; backup pré-pull
    em catch vazio + 1 slot só; "Enviar" diz "substitui" mas é upsert-only; Supabase script sem `defer`.
  - 🟢 BAIXO: dash "Uso da equipe" conta Solicitadas concluídas (decisão de produto); vários `.find` quentes.
  - **Quick wins recomendados:** Mural "undefined" (M1), escape das notificações (A1), `defer` no Supabase.

### 2026-06-27 — Mac de casa — Mural de Ideias (upvote board) — PROTÓTIPO
- Nova **área global "Mural de Ideias"** (rodapé da sidebar, junto da Lixeira, em todas as áreas):
  `irParaMural()` = `setTab('mural',null)`; roteado em `render()` (`currentTab==='mural'→renderMural()`).
  O botão foi adicionado DENTRO de `_sbLixeiraFooter()` (Mural + Lixeira sob a mesma borda) — 1 edição cobre
  as 4 sidebars. Badge no botão = nº de notificações não lidas do usuário simulado.
- **Reaproveita `LS_SUGESTOES`** (mesma fonte do form "Sugestão e Melhoria" da Ajuda → converge com o gancho
  `/api/sugestoes` do Guilherme). Item estendido: `{id,titulo,descricao,tipo,status,autorId,criadoEm,
  votos:[userId],comentarios:[{id,autorId,texto,data}]}`. Itens legados do form (status `pendente`, sem tipo)
  são normalizados na leitura (`_ideiaNorm`): `pendente→nova`, `categoria→tipo`.
- **Funções** (logo após `enviarSugestaoUI`): `renderMural`, `_ideiaAbrir` (modal detalhe), `_ideiaNova`/
  `_ideiaSalvarNova` (modal criar), `_ideiaVotar` (toggle 1 voto/pessoa), `_ideiaComentar`, `_ideiaSetStatus`
  (só admin), `_ideiaExcluir` (admin ou autor), `_ideiaSetEu` (troca identidade simulada), notificações
  (`_ideiaNotif`/`_ideiaNotifNaoLidas`/`_ideiaToggleNotifs`). Consts `IDEIA_TIPO`/`IDEIA_STATUS`. Chaves novas:
  `LS_IDEIAS_NOTIFS`, `LS_IDEIAS_EU`.
- **Regras de negócio (p/ o Guilherme):** 1 voto por pessoa por ideia (toggle); só **admin** (CURRENT_USER_ID)
  muda status; **autor ou admin** excluem; **comentário e mudança de status notificam o AUTOR** (voto NÃO
  notifica, anti-inundação). Status: Nova→Em análise→Planejada→Feita/Recusada. Ordena por votos (ruído afunda).
- **Identidade SIMULADA** (seletor "Você está como…"). Na Empresa = login corporativo de cada um (Guilherme).
  Dados descartáveis. ⚠️ Excluir é DEFINITIVO aqui (não vai pra Lixeira) — simplificação de protótipo.
- Verificado no preview local: 0 erros (jsc) + console limpo; render, voto toggle, criar, modal detalhe,
  comentário, status, **notificação cross-user** (Débora autora, Mauro comenta, Diego muda status → 2 não lidas
  pra Débora → badge → abrir marca lidas). NÃO testado no Safari real (confirmar pós-push).

### 2026-06-27 — PC da Empresa — Nova aba "Solicitadas" (Solicitadas + Confirmações)
- **Aba "Solicitadas" na sidebar do Gerenciador** (`navItem('solicitadas','ti-send',...)` no `fixosHTML`, entre
  Minhas Tarefas e Organizar), com **badge** = nº de confirmações aguardando o double-check do solicitante.
  Roteada em `render()` (`currentTab==='solicitadas' → renderSolicitadas()`); título/subtítulo nos mapas; tirada
  dos toggles de view/＋tarefa. Estado `_solicView` (`taskflow_solic_view`), `setSolicView`.
- **Sub-aba "Solicitadas"**: tarefas onde `solicitante===CURRENT_USER_ID && executor && executor!==eu && !done`,
  **agrupadas por executor** (reusa `renderTaskTable`). É o que pedi a outros e ainda não foi concluído.
- **Sub-aba "Confirmações"** (o "double-check"): tarefas que pedi, **outro concluiu** e aguardam meu OK. Botões
  **✓ Confirmar** (`confirmarTarefa` → `t.confirmadoSolic=true`) e **↩ Reabrir** (`reabrirTarefa` → `done=false`,
  volta kanban p/ doing). 🔑 **Filtro temporal anti-inundação:** só conta concluídas a partir de `taskflow_confirm_since`
  (gravado = `today` na 1ª vez que a função roda; `_confirmSince()`). Tarefas concluídas ANTES da feature não
  aparecem (senão abriria com todo o histórico). Funções: `_solicPendentes`/`_solicConfirmacoes`/`_solicPendentesHTML`/
  `_solicConfirmacoesHTML`/`renderSolicitadas` (logo após `renderEquipe`).
- Campo novo nas tarefas: `confirmadoSolic` (bool). Sem migração (undefined = não confirmado).
- Verificado no preview com dados injetados: pendentes agrupam por pessoa; confirmações respeitam o filtro temporal
  (concluída hoje aparece, de 2020 não, já confirmada some); Confirmar/Reabrir ok; badge na sidebar conta; 0 erros.
- ⚠️ Lembrete recorrente: o Diego viu "Nada" 2x porque o app publicado só atualiza **após commit+push** + Ctrl+Shift+R
  no Pages (~1min de build). Sempre avisar isso quando ele for testar no navegador.

### 2026-06-27 — PC da Empresa — Remoção do "Lembrete" + nova dash "Equipe › Uso da equipe"
- ⚠️ **DIVERGÊNCIA IMPORTANTE detectada:** o Diego mandou prints de um HUB em teste-piloto (turma de 7 pessoas)
  com abas **Meu Dia, Solicitadas/Confirmações, Sem Prazo/Sem Início e coluna Início/Executor** — NADA disso
  existe neste `index.html` (conferido por grep + branches: só `main`, == origin). Ou seja, **a versão testada
  pela turma vive FORA deste git** (outra máquina/servidor). Trabalhei neste repo assumindo que é o alvo (o Diego
  seguiu pedindo features aqui). **Se um dia aparecer esse outro código, reconciliar.**
- **"Lembrete" (someday) REMOVIDO** deste app (a pedido do Diego): tirado da sidebar, do modal de criar tarefa,
  do modal de editar, e o botão "💤 Lembrete" do Organizar. Desliguei o **envelhecimento automático de 14 dias**
  (que jogava tarefa parada pra Lembrete sozinho). **Migração 1x ao carregar** (`load()`, ~linha 4080, no padrão
  da migração "Cancelado"): toda tarefa `someday=true` volta a `someday=false` (e limpa `inboxAutoMoved`) — **nada
  apagado**; elas reaparecem como tarefa normal sem data ("Sem Prazo"). Os filtros `!t.someday` espalhados ficaram
  inertes (nenhuma tarefa será someday). Verificado: sidebar agora = Hoje·Minhas Tarefas·Organizar·Equipe, 0 erros.
- **Nova sub-aba "Uso da equipe" dentro de Equipe** (`renderEquipe`): seletor no topo **Tarefas | Uso da equipe**
  (`_equipeView`, persistido em `taskflow_equipe_view`; `setEquipeView`). A dash (`_equipeUsoStats`/`_equipeUsoHTML`)
  lista **TODAS as pessoas** (não só a equipe gerenciada) em tabela: **Pessoa | Não concluídas | Solicitadas |
  Atrasadas**. Não concluídas = executor=pessoa & !done; **Solicitadas = tarefas que a PESSOA solicitou**
  (solicitante=pessoa) — ⚠️ *interpretação minha; o Diego não confirmou se queria isso ou "solicitadas A ela"*;
  Atrasadas = não concluídas dela vencidas (vermelho). Ordena por atividade (ativos no topo), inativos (0/0/0)
  **esmaecidos** pra achar quem não usa; resumo "X de Y com atividade". Header de filtros (3 pontos) some na visão
  Uso. Verificado no preview com dados injetados: números batem, ordenação ok, 0 erros.
- **Pendências desta entrada:** (1) confirmar a interpretação de "Solicitadas"; (2) decidir/achar onde vive o HUB
  testado pela turma (divergência acima); (3) a remoção do Lembrete foi assumida como "neste repo mesmo".

### 2026-06-26 — PC da Empresa — Supabase: novos cadastros TRANCADOS ✅ (pendência de segurança resolvida)
- Diego desligou **"Allow new users to sign up"** (Supabase → Authentication → Sign In/Providers → seção **User Signups**,
  no topo) e clicou **Save changes**. Email provider continua **Enabled** (é o método de login; desligar quebraria
  todos os logins). Resultado: contas existentes seguem logando; **ninguém novo se cadastra**.
- Verificado no banco (`select … from auth.users`): **só 1 conta** — `konraddiego@gmail.com` (criada 2026-06-20,
  e-mail confirmado, login ok). Nenhum cadastro indesejado entrou.
- ✅ Encerra a pendência de segurança "travar novos cadastros no Supabase" que vinha desde o início do projeto.
- Sem mudança de código nesta entrada (config no painel Supabase + este handoff).

### 2026-06-25 — PC da Empresa — Paleta do tema claro com mais profundidade + tabela do PCP em card branco
- Diego achou a sidebar/tela "branca e lavada" na tela de Produção (DDV). Causa: no tema claro padrão, `--bg`
  (#f5f5f2) e `--bg2`/sidebar (#ededea) eram quase iguais e cards/inputs eram #fff → nada se separava.
- **Paleta do tema claro padrão (`:root`) refinada** (afeta o app inteiro): `--bg` #f5f5f2→**#e9ebf0** (cinza
  claro frio, casa com o azul do cabeçalho), `--bg2` #ededea→**#dfe2e9** (sidebar/cabeçalhos de grupo agora
  destacam do conteúdo), `--border` #ddd→**#d3d8e0**, textos secundários #555/#6b6b6b→**#4b5563/#6b7280**
  (cinzas mais frios). `--card`/`--bg3` seguem #fff — agora **saltam** sobre o cinza. (Temas areia/brasil/dark
  não foram tocados.)
- **Tabela do PCP (`_pcpCorpoHTML`)**: o wrapper ganhou `background:var(--card)` + estrutura de 2 divs
  (overflow:hidden externo p/ arredondar + overflow-x:auto interno p/ rolagem) — antes a tabela ficava
  transparente sobre o fundo da página, parecendo solta. Linhas de grupo seguem `--bg2`.
- Verificado no preview (estilos computados): sidebar #dfe2e9 vs conteúdo #e9ebf0 (separação clara), tabela/rail
  brancos, 17 linhas semeadas renderizando, 0 erros de console.

### 2026-06-25 — PC da Produção — Setup da máquina + tela PCP (DDV) implementada + Painel de Reunião (Tarefas mais largo)
- **3ª máquina configurada ("PC da Produção", chão de fábrica):** Git já tinha; instalei o **GitHub CLI** via
  `winget` (gh 2.95) e autentiquei (`gh auth login` web + `gh auth setup-git`) — push habilitado (scope `repo`). O
  repo **já estava clonado** em `G:\g_Diego\HTML\HTML - Tarefas`; `git pull` = already up to date. (Detalhe: o `gh`
  fica em `C:\Program Files\GitHub CLI\gh.exe`; terminais já abertos antes da instalação não enxergam no PATH.)
- **Decifrei as siglas/fórmulas do SISPRO** (Diego mandou o print real da aba Histórico), conferidas com os números:
  **Saldo = Estoque + OP/OC + Maras − Pedido**; **DDV = Saldo ÷ MDV** (dias de cobertura); **DDV S/OP = (Saldo −
  OP/OC) ÷ MDV**; **MDV = Vendas ÷ 261 dias úteis** (média diária); MSV/MQV/MMV = média semanal/quinzenal/mensal.
  Semáforo no DDV: verde ≥10 (folga) · âmbar 0–10 (atenção) · vermelho ≤0 (ruptura) + ⚠️ no item.
- **Tela PCP — Planejamento (DDV) IMPLEMENTADA no `index.html`** (Produção › grupo PCP › novo item "Planejamento (DDV)",
  ícone `ti-calendar-stats`). `renderPCP()` + helpers: breadcrumb `Produção › PCP`, 5 sub-abas do SISPRO (só
  **Histórico** funcional; resto "em construção"), rail de filtros completo (Períodos, DDV Sugestão, Redes, Marcas,
  Tipos Produção, Quantidades, Almoxarifados), KPIs (Itens/Ruptura/Atenção/Folga), placeholder do gráfico, e tabela
  de 14 colunas agrupada por Linha com semáforo no DDV. **Origem dos dados = "Colar do SISPRO"** (`_pcpParse` lê o
  cabeçalho, mapeia colunas por nome, agrupa por "Linha XXX") → `localStorage` `taskflow_pcp_ddv` (entra no sync da
  nuvem). **Semeado** com os dados reais do print (Amendoim/Palitinhos/Suspiro). Filtros funcionais: **Pesquisar** e
  **DDV Sugestão** (≤X); os demais espelham o SISPRO (visual). Médias (MSV/MQV/MMV) escondidas por padrão (botão
  "Mostrar médias"). Verificado no preview (DOM/estilos): parser ok, semáforo nas cores certas, busca e sugestão
  filtram, modal de colar importa. **Decisões tomadas por mim (mudar se quiser):** PCP entrou como item dentro do
  grupo PCP (preservando Ordens de Produção/Check list); médias ocultas por padrão.
- **Painel de Reunião — card Tarefas mais largo + layout desacoplado:** (1) container da reunião `max-width` 1040→**1500px**
  (p/ telas bem largas; obs.: o `.main` tem `padding-right:80px` e limita o útil ~1120px num viewport 1520); (2) grid
  `.reun-grid4` de `1fr 1fr` → **`1fr 2fr`** — Tarefas = **2× a Pauta sempre** (proporção fixa, independe da barra
  lateral). Tentei antes `minmax(340,500) 1fr` p/ preservar a Pauta em ~500px, mas nesse espaço a Tarefas mal crescia,
  então voltei p/ `1fr 2fr` (Pauta/Decisões ficam em 1/3 — um pouco mais estreitas, troca aceita pelo Diego);
  (3) **reestruturado em 2 colunas independentes** (`.reun-col`): ESQUERDA = Pauta + Decisões + Decisões anteriores
  empilhadas; DIREITA = Tarefas. Antes
  era grid 2×2 e a altura da Tarefas empurrava a Decisões pra baixo (vão crescente) — agora a Decisões gruda na Pauta
  (gap fixo 14px) independente de quantas tarefas existam. Obs.: "Decisões anteriores" passou pra coluna esquerda
  (sob a Decisões) em vez de sob a Tarefas. Verificado no preview: gap Pauta↔Decisões = 14px, form de nova tarefa
  abre na coluna direita, 0 erros.
- **Pendências:** (1) afinar cortes do semáforo / amarrar ao "DDV Sugestão"; (2) sub-abas Lotes/Resumo/Ordens do PCP
  ainda "em construção"; (3) integração real com o SISPRO (Guilherme) vs colar; (4) **ainda travar novos cadastros no
  Supabase** (Authentication → Email → "Allow new users to sign up"). ⚠️ Lembrete p/ qualquer máquina: **☁️ Baixar da
  nuvem ANTES de editar dados**.

### 2026-06-25 — PC da Empresa — Início da área PRODUÇÃO (mockup da tela DDV) + 3ª máquina (PC da Produção)
- Diego vai trazer o **SISPRO** (sistema da Empresa: produção + um pouco de comercial) pra dentro do HUB, **tela por tela**.
  1ª tela = **"Planejamento de produção (DDV)"** (aba Histórico do SISPRO). Apresentei um **MOCKUP visual** (ainda
  SEM código no index.html) no estilo do HUB: rail de filtros à esquerda, gráfico Vendas/Média/Segunda média, e
  tabela agrupada por **Linha** (Amendoim, Palitinhos, Suspiro…) com **DDV colorido** (verde=folga, âmbar=atenção,
  vermelho+⚠️=ruptura). Abas do SISPRO: Histórico · Lotes e OP's · Resumo · Ordens de compra · Ordens de produção.
- **DECISÕES PENDENTES antes de codar** (esperando OK do Diego): (1) **densidade** — fiel/denso vs mais arejado
  (colunas extras escondidas em "Colunas visíveis"); (2) **confirmar siglas** p/ rotular + tooltips ⓘ: DDV=dias de
  venda (cobertura)? DDV s/OP=idem sem OP/OC? MDV/MSV/MQV/MMV=média diária/semanal/quinzenal/mensal de vendas?
  Saldo=estoque+OP/OC−pedido? Maras=2º almoxarifado/marca? (3) **origem dos dados** — começar com dados
  coláveis/importados (recomendado, como na Manutenção) vs integração real com o SISPRO (depende do Guilherme).
- **NOVO: 3ª máquina = "PC da Produção"** (fica no chão de fábrica, dentro da Empresa). Mesma rotina das outras:
  `git pull`+ler CLAUDE.md ao começar; commit/push/atualizar handoff ao sair; **☁️ Baixar da nuvem ANTES de editar dados**.

### 2026-06-22 — Mac de casa — Pré-visualização / PDF da Ordem de Serviço (OS)
- Botão **"Visualizar PDF"** no editor da OS (só OS **já salva**). Abre modal com iframe pré-visualizando o PDF +
  botão "Baixar PDF". Preview via `getBlob`+objectURL (renderiza no Safari); blob revogado ao fechar.
- **`gerarPDFOrdem()`** espelha o padrão de `gerarPDFReuniao` (pdfMake via CDN, A4, cabeçalho Klain, rodapé com
  data/paginação). PDF traz: prioridade (urgente/normal/baixa), solicitante **resolvido a partir da lista de pessoas**,
  e os campos da OS física — data limite, previsão de conclusão, máquina parada, compra necessária, executado — mais
  **bloco de assinaturas** (Solicitante / Manutenção) p/ impressão. Usa `mntOrdBuf` quando é a OS em edição (reflete
  alterações ainda não salvas). Commit `c66edab`.

### 2026-06-22 — PC da Empresa — Transformar tarefa em OS + Solicitante puxa pessoas
- **Transformar tarefa em Ordem de Serviço:** novo botão (ícone `ti-tool`) no cabeçalho do modal da tarefa
  (`_renderModalAcoes`, ao lado de "Transformar em rotina"). Função **`transformarEmOS(taskId)`** (logo após
  `excluirOrdem`): monta uma OS pré-preenchida e abre o editor da Manutenção. Mapeamento: `title→titulo`,
  `desc→descricao`, `prio→prioridade` (alta→urgente, media→normal, baixa/trivial→baixa), `t.solicitante→solicitante`
  (id da pessoa), `t.executor→responsavel` (nome resolvido — ex.: líder da manutenção). Guarda `fromTaskId` como
  rastro. **A tarefa NÃO é apagada.** Navega direto pro editor (hubView='manutencao', manutencaoView='ordens',
  manutOrdemAberto setado, renderSidebar()+render()).
- **Solicitante da OS agora puxa a lista de pessoas:** helper `pessoaSel(lbl,key,ph)` em `renderOrdemEditor`
  (dropdown ordenado por nome, `value`=id da pessoa, mostra "Nome — setor"). Tem fallback: se o valor salvo não
  for um id conhecido (ex.: seeds antigos 'PCM'/'Operação'), mantém como opção selecionada pra não perder o dado.
- **Consistência:** `_pvGerarOS` (gera OS de plano de preventiva) atualizado p/ `prioridade:'normal'` + os 6 campos
  novos da ficha (estava com 'media', inválido após a mudança da OS_PRIO).
- Verificado no preview: solicitante lista 21 pessoas; converter tarefa→OS pré-preenche título/descrição/prioridade
  (alta→urgente)/solicitante (id certo, dropdown pré-selecionado)/responsável (nome do executor) e cai no editor;
  0 erros de console.

### 2026-06-22 — PC da Empresa — Manutenção: "Ordem de Manutenção" → "Ordem de Serviço" + campos da OS física
- Diego mandou foto da **OS física** usada no dia a dia ("MANUTENÇÃO E SERVIÇOS EM GERAL") p/ mesclar com a ordem do app.
- **Renomeado em todo o módulo:** "Ordens de Manutenção" → **"Ordens de Serviço"** (título da tela, breadcrumb,
  item da sidebar da Manutenção, `titulos.ordens`, `TRASH_TYPE_LABELS.ordem`). O nome da ÁREA "Manutenção" ficou.
- **Campos novos no editor de OS** (`renderOrdemEditor`) e no modelo (`novoOrdem`/`_osSeed`): `dataLimite` (Data limite),
  `previsaoConclusao` (Previsão de conclusão), `assinaturaSolicitante` (Assinatura do solicitante), e 3 checkboxes —
  `maquinaParada` (Máquina parada), `compra` (Compra necessária), `executado` (Executado). Helpers locais novos no
  editor: `dataBox` e `chkBox`. A data antiga "Abertura" virou "Data da ordem"; "Conclusão" virou "Conclusão (real)".
- **Prioridade alinhada à ficha:** `OS_PRIO` agora é **Urgente / Normal / Baixa** (era Alta/Média/Baixa). Migração
  automática em `_osLoad` mapeia ordens antigas: alta→urgente, media→normal (qualquer valor inválido→normal), e salva.
  Default de nova OS = `normal`. Fallback do card corrigido p/ `OS_PRIO.normal`. Card mostra chip vermelho
  "Máquina parada" quando marcado.
- Verificado no preview (servidor local): tela renomeada, todos os 6 campos novos renderizam, os 3 checkboxes
  marcam/salvam no buffer, 0 erros de console. (⚠️ cuidado: o servidor de preview cacheia por URL — precisei de
  cache-buster `?nocache=` p/ ver as mudanças; um Ctrl+Shift+R resolve no navegador real.)

### 2026-06-20 — Mac de casa — REGRA DO HUB: excluir no card → lixeira → desfazer + tooltips ⓘ
- **Padrão consolidado em todo o HUB:** todo cadastro tem **excluir no card** (event.stopPropagation),
  **soft-delete → Lixeira única** (LS_TRASH / `moveToTrash(type,item)`), e **FAB Desfazer** (`_mostrarFABDesfazer(label,0)`).
  Áreas no padrão completo: Tarefas, Manutenção (5 telas), Produtos (fichas, tipo `fichaProduto`), Pessoas,
  Notas (card+modal), Rotinas, Reuniões, **Reuniões rápidas** (tipo `reuniaoRapida`), Projetos, Compromissos.
  `restoreFromTrash` + `TRASH_TYPE_LABELS`/`ICONS` cobrem todos esses tipos. rowHTML usa nome via title||nome||
  name||titulo||produto.
- **Tooltips de ajuda:** helper **`_hint('texto')`** + classe `.hint` (CSS) = ⓘ que mostra a explicação ao
  passar o mouse. Substitui parágrafos que poluíam. Aplicado na ficha do equipamento (Criticidade, Situação,
  Placa, Tipo/TBM-UBM, TAG). REGRA: explicação de campo = `_hint`, nunca parágrafo solto. Falta espalhar
  `_hint` em outras telas conforme aparecerem explicações poluindo.

### 2026-06-20 — Mac de casa — Lixeira global na sidebar + áreas em ordem alfabética
- **Lixeira no rodapé de TODAS as áreas:** helper `_sbLixeiraFooter()` + `irParaLixeira()` (= `setTab('lixeira',null)`,
  troca pro Gerenciador e abre a Lixeira). Adicionado ao rodapé das sidebars: Meu dia, Produção, Manutenção,
  Qualidade. A lixeira em si continua única (LS_TRASH) — só o ACESSO virou global. Botão fica realçado quando ativo.
- **Áreas em ordem alfabética** na home (sidebar do Meu dia): Manutenção → Produção → Qualidade. Próximas áreas
  que surgirem devem entrar na ordem alfabética também.
- **FAB Desfazer** após excluir itens da Manutenção (reusa `_mostrarFABDesfazer(label,0)`, igual às tarefas).

### 2026-06-20 — Mac de casa — Manutenção: excluir no card + lixeira integrada
- Cada card das listas da Manutenção (Equipamentos, Ordens, Fornecedores, Orçamentos, Preventivas) ganhou
  um **botão de excluir** (lixeira) com `event.stopPropagation`. Exclusão é rápida (sem confirm).
- **Tudo que é excluído vai pra Lixeira existente** (`moveToTrash(type,item)` / LS_TRASH) — recuperável 30 dias.
  Novos tipos registrados em `restoreFromTrash` + `TRASH_TYPE_LABELS`/`ICONS`: equipamento, ordem, fornecedor,
  orcamento, preventiva (plano — item guarda {plano, equipId} pra voltar ao equipamento certo).
- Funções `excluir*` da Manutenção agora fazem soft-delete (moveToTrash + remove + toast "movido para a Lixeira").
  `_pvExcluirPlano(equipId,planoId)` para planos de preventiva. 0 erros + 10/10 testes (jsc).
- CSS: campos inline (sem classe) com altura fixa 40px; `<select>` com appearance:none + seta SVG (Safari ignora
  height em select nativo). Vários termos em inglês → PT (Dashboard→Painel, etc.). Ficha do equipamento com
  ajudas (criticidade, placa, TAG, TBM/UBM).

### 2026-06-20 — Mac de casa — Manutenção/PCM: Equipamentos (ficha cadastral) — Bloco 1
- Pesquisei boas práticas de PCM (SAP PM, Tractian TBM/UBM, Engeman, ABRAMAN) p/ fundamentar o módulo.
- **Equipamentos** (LS_EQUIPAMENTOS): ficha técnica — TAG, **criticidade ABC**, status, dados de placa,
  **consumíveis** (não peças — peças vêm do ERP do Guilherme) e **vários planos de preventiva por máquina**,
  cada um com frequência própria (TBM por tempo / UBM por uso) + checklist + responsável + duração + parada.
  Lista com busca + filtro de criticidade. Funções: `renderEquipamentos`, `renderEquipamentoEditor`,
  `_eqFiltrar`, `_eqAddPlano`/`_eqAddCons`. Verificado: 0 erros + 12/12 testes (jsc).
- **MÓDULO PCM COMPLETO ✅:** Bloco 1 Equipamentos, Bloco 2 Ordens (OS), Bloco 3 Preventivas, Bloco 4 Painel PCM.
- **Painel PCM** (`renderPCM`, item "Painel PCM" na sidebar): KPIs calculados das OS/equipamentos/planos —
  backlog, % preventiva×corretiva (meta corretiva ≤20%), MTTR (média tempo de parada), aderência ao plano,
  custo (material+MO), OS por tipo/status, equipamentos por criticidade/status, preventivas em dia×atrasadas.
  MTBF e disponibilidade ficam ILUSTRATIVOS (dependem de horas de operação — ERP do Guilherme), marcados como tal.
- Sidebar Manutenção: Painel PCM · Ordens · Equipamentos · Preventivas · (COMPRAS) Fornecedores · Orçamentos.
- **Preventivas:** agrega os planos dos equipamentos por vencimento. `_planoProxima` = ultimaExecucao + período
  (TBM por tempo). Agrupa por urgência (Atrasadas/Esta semana/Este mês/Mais pra frente) + "Por uso" (UBM, sem
  data). Botão `_pvGerarOS` cria OS preventiva preenchida e leva pra Ordens. Plano ganhou campo `ultimaExecucao`.
- **Ordens (LS_ORDENS):** OS vinculada a equipamento, tipo (corretiva/preventiva/preditiva/melhoria),
  status (aberta→planejada→execução→concluída→cancelada), prioridade, custo (material+MO, total calculado),
  tempo de parada, peças=referência (ERP), causa/ação. Numeração `_osNextNum` (OS-0001…). Lista com busca +
  filtro de status. Funções: `renderOrdens`/`renderOrdemEditor`/`_osFiltrar`. 0 erros + 10/10 testes (jsc).

### 2026-06-20 — Mac de casa — Compras: campos personalizados + filtro de fornecedores
- **Orçamentos:** cada orçamento define **campos personalizados** (`campos:[{id,label}]`, ex.: Altura, Material)
  e cada cotação preenche (`cotacao.extra{campoId:valor}`). Viram **linhas extras na tabela de comparação**.
  Funções: `_moAddCampo`/`_moDelCampo`/`_moSetCampo`/`_moSetExtra`.
- **Fornecedores:** ganharam **categoria macro** + **produtos** (tags). Lista com **busca** (nome/produto/categoria,
  acento-insensível) + **chips de filtro por categoria macro** (`_fnFiltrar`/`_fnMacros`/`_fnSetMacro`).
- Verificado: 0 erros sintaxe + 13/13 testes (jsc). Protótipo de UX, dados descartáveis.

### 2026-06-20 — Mac de casa — Projetos: remoção de Marcos/Arquivos + decisão sobre legado
- Removidos **Marcos** e **Arquivos** (features mortas/placeholder) do projectsPro e do editor de templates.
- ⚠️ **Legado NÃO removido (e NÃO deve ser sem migração):** o array `projects[]` legado parecia código morto,
  mas mapeei ~40 usos vivos — **tarefas/rotinas/reuniões/análise** apontam pra ele via `projectId`/`m.projetos`.
  Remover quebraria tudo isso. Só a TELA de lista (renderProjetos) é morta. Removê-lo de verdade = migrar
  cada referência pro Pro + auditar dados reais; projeto à parte, não fazer no escuro.

### 2026-06-20 — Mac de casa — Projetos: auditoria UX + Fase 0 (bug) + Fase 1 (toolbar)
- Rodada auditoria multi-agente da área de Projetos (projectsPro). Achados: busca global quebrada,
  sistema legado morto (renderProjetos ~24249-24578), campos órfãos, e muita proposta duplicada.
- **Fase 0 (feito):** corrigida a busca global (Ctrl+K) — usava `projects[]` legado + `openProjView()`
  inexistente (ReferenceError); agora filtra `projectsPro` e abre via `abrirProjectProView`. Campo órfão
  `anotacoes` removido de `_novoProjectPro`.
- **Fase 1 (feito):** toolbar nova em `renderProjetosPro` — busca local (acento-insensível, `_ppFiltrar`),
  Ordenar por (prioridade/prazo/progresso/recentes, `_ppSort`), chips Atrasados/Ativos/Meus (`_ppChips`),
  grupos colapsáveis (`_ppCollapsed`, persistido), estado-vazio com "Limpar filtros". Render parcial em
  `#pp-grupos` (`_ppGruposHTML`) p/ não perder foco na busca.
- **Fase 2 (feito):** favoritar projeto (grupo "Favoritos" no topo, `_ppToggleFav`/`p.favorito`), progresso
  mais destacado nos cards, breadcrumb no detalhe, e chip de prazo unificado (`_ppChipPrazo`, card+linha).
- **Fase 3 (feito parcial):** "+Tarefa" do setor agora foca o quick-add inline existente (`qa-pro-<gId>`)
  em vez de abrir o modal. O item "Foco só não classificadas" foi DESCARTADO: o Modo Foco foi removido
  (mai/2026), o agente do workflow leu código velho — feature não existe mais.
- **NÃO mexido (precisa OK do Diego):** remover sistema legado (~330 linhas, renderProjetos), refatorar
  `grupo.tarefaIds` (fonte de verdade dupla, ~12 pontos), deletar Marcos/Arquivos (perguntar antes).

### 2026-06-20 — Mac de casa — Manutenção › Compras (fornecedores + orçamentos)
- Novas telas dentro do hub **Manutenção** (sidebar seção COMPRAS): **Fornecedores** (CRUD) e **Orçamentos**.
- Orçamento = título/item + N cotações (fornecedor do cadastro ou avulso, preço, prazo, pagamento, frete,
  garantia, obs) + **tabela de comparação** com destaque do menor preço/prazo, insight "mais barato/mais
  rápido" e botão "Escolher" (marca "Decidido"). Chaves `LS_FORNECEDORES`/`LS_ORCAMENTOS` (descartáveis).
- Protótipo de UX (backend real = Guilherme). Verificado: 0 erros sintaxe + 12/12 testes funcionais (jsc).

### 2026-06-20 — Mac de casa — sensorial: insights + apresentação em 5 telas
- Aba Resultados ganhou seção **"Padrões & insights"** (função `_sensInsights`): preferida geral + margem,
  controle (fórmula atual) × alternativas, líder por atributo, intenção de compra, dulçor/JAR, divergência.
  Tudo calculado das respostas (nada inventado).
- **Modo Apresentação reestruturado p/ 5 telas fixas** (pedido do Diego): capa (só o nome) → o que avaliar →
  amostras (cego, "identidade oculta") → revelação (código→marca) → resultado (mesmo layout da revelação +
  nota de cada amostra ao lado, "★ preferida" no melhor, insights compactos e botão de simular ao vivo).

### 2026-06-20 — Mac de casa — hardening de segurança (feito)
- Token PAT de teste (que tinha sido exposto no chat) **revogado** no GitHub. Auth do git no Mac segue
  via `gh` (token `gho_` no Keychain) — push/pull OK, sem depender daquele PAT.
- Supabase: **"Allow new users to sign up" desligado** (Authentication → Sign In/Providers → Email).
  Cadastros novos trancados; contas existentes continuam logando. ✅ Resolve a pendência de segurança antiga.

### 2026-06-20 — Mac de casa — protótipo de UX da nova Análise Sensorial
- ⚠️ CONTEXTO: este `index.html` é **só protótipo de layout/UX**. O Guilherme está montando o backend
  real no servidor/banco da Empresa; **a base de dados daqui é descartável** (serve pra passar a ideia de
  UX pra ele). No sispro dele cada avaliador entra com o **próprio login** e responde do celular.
- Implementado na seção sensorial do `index.html` (Qualidade › Análise sensorial):
  - **Criação enriquecida:** campos `ideiaTeste`, `oQueMudou`, `atencao` no editor (seção "Contexto da apresentação").
  - **Modo Apresentação** (tela cheia, tipo slides, p/ notebook na TV): por produto, slides
    capa → o que observar → revelação (código→marca) → resultado ao vivo. Navegação setas/botões, Esc sai.
    Funções: `sensApresentar`, `sensApresentarSessao`, `_sensPres*` (overlay `#sens-pres`).
  - **Sessão do dia:** quando a reunião tem vários testes, um menu lista os produtos e a condutora
    escolhe a ordem; ao terminar um, volta ao menu marcando "apresentado".
  - **Responder em 2 modos:** **Comparação** (matriz atual) e **Foco** (código por código, mobile).
    Funções: `_sensMatrizHTML`, `_sensFocoHTML`, `setSensRespModo`, `sensFocoNav`.
  - **Resultado em tempo real (SIMULADO):** `sensSimular`/`sensSimularStop` injetam respostas mockadas
    e atualizam o ranking ao vivo (na aba Resultados e no slide de resultado). É só encenação do UX —
    o tempo real de verdade virá do backend do Guilherme.
- **Verificação (sem navegador — Mac não tem Node e o preview sandbox bloqueou o servidor):** parse dos 4
  blocos `<script>` no JavaScriptCore (`jsc`) = 0 erros de sintaxe + 12 testes funcionais das funções novas
  (foco, matriz, simulação) passando. **NÃO testei visualmente num navegador real** — recomendo o Diego
  abrir e clicar pra confirmar o visual.
- **Pendente:** integrar com o backend do Guilherme (login individual + respostas reais + tempo real de
  verdade); decidir se o backend mantém ou substitui o Supabase atual.

### 2026-06-20 — Mac de casa — ambiente configurado + dados baixados da nuvem
- Mac configurado do zero: repo clonado em `~/Documents/GitHub/TaskFlow` (ao lado de Foco/horas/hubpessoal).
  Git já estava configurado (Diego Konrad / konraddiego@gmail.com).
- **Autenticação do git no Mac = GitHub CLI (`gh`).** Sem Homebrew, instalei o `gh` 2.95 (binário oficial)
  em `~/.local/bin` e adicionei essa pasta ao PATH no `~/.zshrc`. Login via `gh auth login` (fluxo OAuth no
  navegador, sem PAT manual); `gh auth setup-git` configurou a credencial. **Push/pull já funcionam direto**
  nas próximas sessões deste Mac — não precisa de token.
  - (Detalhe: tentei antes via PAT fine-grained; deu 403 por falta de permissão `Contents:write`. Abandonado
    em favor do `gh`. ⚠️ Esse token de teste foi exposto no chat e DEVE ser revogado pelo Diego
    em https://github.com/settings/tokens?type=beta — não é mais usado.)
- Diego abriu o app publicado (Pages) → ☁️ → Entrar → **"Baixar da nuvem"** → projetos/tarefas apareceram.
  localStorage do Mac agora populado a partir da nuvem. ✅ Seguiu a regra de ouro: BAIXAR antes de editar; NÃO clicou "Enviar".
- **Nenhuma mudança de código** nesta sessão — só esta entrada de handoff no `CLAUDE.md`.
- Pendências: (1) Diego gerar o PAT (https://github.com/settings/tokens, escopo `repo`) p/ o push desta sessão;
  (2) ainda trancar novos cadastros no Supabase (Authentication → Email → desligar "Allow new users to sign up").

### 2026-06-20 — PC da Empresa — dados REAIS enviados pra nuvem (recuperação)
- ATENÇÃO p/ entender o modelo: dados ficam no localStorage POR ORIGEM (endereço da página).
- O 1º upload subiu só dados-semente (veio de uma página nova/vazia). Os dados REAIS estavam presos
  ao arquivo antigo `taskflow.html`. Recriei `taskflow.html` no PC; o Diego reabriu por ele, viu os
  projetos e clicou "Enviar" → a nuvem agora tem TUDO.
- Confirmado no banco: **85 chaves** · `taskflow_projects_pro` 7,6KB · `taskflow_tasks` ~120KB · `taskflow_meetings` 3,8KB.
- ⚠️ REGRA (importante): ao começar em QUALQUER máquina/página, clicar **"Baixar da nuvem" ANTES de editar**.
  Isso evita que uma página com estado antigo/vazio sobrescreva a nuvem pelo push automático.
- `taskflow.html` é só cópia LOCAL de recuperação no PC (agora ignorada no git). App canônico = `index.html`.

### 2026-06-20 — PC da Empresa — sync Supabase implementado
- Implementado no `index.html`: cliente supabase-js (CDN), botão ☁️ no cabeçalho, login e-mail/senha,
  push automático ao salvar + "Enviar/Baixar" manuais. localStorage segue sendo a fonte primária.
- **Para os dados irem pra nuvem (precisa do Diego, no PC):** (1) desligar "Confirm email" no painel Supabase;
  (2) abrir o `index.html` LOCAL onde estão os dados → ☁️ → Criar conta/Entrar → sobe automático.
- **No Mac:** abrir o app (Pages ou Codespace) → ☁️ → Entrar (mesma conta) → "Baixar da nuvem".
- Ainda **não testado por mim** (não rodo navegador aqui). Balanceamento de sintaxe conferido. Backup local + git permitem reverter.

### 2026-06-20 — PC da Empresa — repo público + Pages
- Repositório tornado **público** e **GitHub Pages ativado**: https://dkonrad88.github.io/TaskFlow/
- App agora abre por essa URL em qualquer máquina (mas dados ainda são por-navegador até o sync Supabase).
- Lembrete: trancar novos cadastros no Supabase após criar a conta (ver seção de dados).

### 2026-06-20 — PC da Empresa — Supabase backend pronto
- Tabela `app_state` (chave-valor) criada com **RLS por usuário** + trigger `updated_at`; 0 alertas de segurança.
- Definida arquitetura: espelho KV + login e-mail/senha; sync = auto-push + pull manual (com backup). Detalhes na seção "Onde vivem as coisas".
- **Falta:** implementar no `index.html` (cliente supabase-js + login + push/pull) e o Diego TESTAR no PC.
- **Antes de testar o login:** desligar "Confirm email" no painel do Supabase (Authentication → Email).

### 2026-06-20 — PC da Empresa — Supabase (projeto criado)
- Criado o projeto Supabase **TaskFlow** (ref `gigkrjetrtbtdmdnqoof`, `sa-east-1`, org "Konrad Diego"). Custo: free.
- **Pendente:** definir arquitetura (espelho chave-valor é o recomendado) + login/RLS, e então
  implementar a camada de sync no `index.html` — **subindo primeiro o `localStorage` atual** (sem perder dados).

### 2026-06-20 — PC da Empresa — configuração inicial
- Projeto começado **do zero** (nada no GitHub nem no Supabase ainda).
- Feito: `git init` (branch `main`), renomeado `taskflow.html` → `index.html`,
  criados `.gitignore` e este `CLAUDE.md`, primeiro commit local.
- Backup de segurança: `backups/taskflow.backup-2026-06-20.html`.
- Persistência hoje é `localStorage` (Supabase ainda não integrado).
- Repositório criado e enviado: **https://github.com/dKonrad88/TaskFlow** (privado).
- **Pendências:** (1) configurar o Mac/Codespace do zero (abrir/clonar o repo);
  (2) Pages é opcional (privado exige Pro, ou tornar público); (3) migração dos dados
  para o Supabase quando for a hora.
