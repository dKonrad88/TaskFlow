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

## Fluxo de trabalho (2 máquinas, 1 repositório)
- **Mac de casa (Codespace)** = máquina **canônica** de desenvolvimento.
- **PC da Empresa** = uso ocasional.
- Os chats do Claude Code são separados; o que sincroniza é **só o git**.

### Ao COMEÇAR a sessão (quando o Diego disser "tô no PC" ou "tô no Mac")
1. `git pull` (trazer o código mais recente).
2. Ler este `CLAUDE.md` (em especial o Log de handoff).

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
4. **Confirmar antes** de push/pull ou de qualquer edição que sobrescreva arquivos.
5. Commits terminam com:
   `Co-Authored-By: Claude <noreply@anthropic.com>`
6. `backups/` e `.claude/` ficam **fora do git** (ver `.gitignore`).

## Log de handoff (mais recente no topo)
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
