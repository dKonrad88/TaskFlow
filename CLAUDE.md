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

## ✅ RESOLVIDO — projeto "Snack Proteico" recuperado (21/07/2026, PC da Empresa)
> **NÃO É MAIS PENDÊNCIA.** O projeto estava na **LIXEIRA do navegador Edge** do PC da Empresa (o Diego
> tinha excluído). Como não estava na nuvem (confirmado via Supabase), não dava p/ achar pelo protótipo/Pages —
> só lendo o disco. Achado assim: li os arquivos **LevelDB do Edge** (`%LOCALAPPDATA%\Microsoft\Edge\User Data\
> Default\Local Storage\leveldb\*.ldb`) via Bash+strings — o valor do `taskflow_trash` estava LEGÍVEL (não
> comprimido) e continha o projeto `pp_1780346878364_648` "Snack Proteico" (tipo produto, 6 fases: Briefing/
> Desenvolvimento & Testes/Aprovações/Produção Piloto/Lançamento, 37 etapas, deletedAt 2026-07-20). O Diego
> **restaurou pela Lixeira** do app (as tarefas religaram sozinhas). Falta ele **sincronizar** (☁️ Enviar no Edge →
> Baixar nas outras) — ele disse que não liga pro que estava na nuvem, então push do Edge por cima é seguro.
> 📌 **Lição:** dá p/ recuperar dado de localStorage do Chromium lendo os `.ldb` do disco com `strings`/`grep`
> quando o bloco não está comprimido (Snappy); o `.log` (WAL) é sempre legível. A seção detalhada abaixo fica
> como histórico da investigação.

## 🚨 (HISTÓRICO) PENDÊNCIA — projeto "Snack Proteico" (rodar no PC da EMPRESA e no da PRODUÇÃO)
> **Instrução do Diego (18/07/2026):** "quando eu estiver no PC da Empresa ou da Produção, tentar
> recuperar o projeto Snack Proteico". **Qualquer sessão que abrir numa dessas 2 máquinas: execute o
> passo 1 abaixo ANTES de qualquer outra coisa** e reporte o resultado. Marcar aqui quando feito.
>
> | Máquina | Verificado? | Resultado |
> |---|---|---|
> | Mac de casa | — | (nuvem já verificada daqui, ver abaixo) |
> | PC da Empresa | ❌ **PENDENTE** | |
> | PC da Produção | ❌ **PENDENTE** | |

### O que JÁ foi apurado (18/07, Mac — lendo a NUVEM via MCP do Supabase, sem tocar em nada)
Consultei `public.app_state` do projeto `gigkrjetrtbtdmdnqoof`. Resultado:
- **`taskflow_projects_pro` (atualizado 18/07 15:17) contém UM ÚNICO projeto: "Implantação do Hub Klain"**
  (`pp_1784160092375_318`, status `ativo`, 3 fases). **Não existe "Snack Proteico" na nuvem.**
- ❌ **Hipótese "está na Lixeira" — DESCARTADA.** A `taskflow_trash` da nuvem **não tem NENHUM item do tipo
  `projectPro`** (só `meeting`, `task` e `compromisso`).
- ❌ **Hipótese "chip Ativos escondeu (status Concluído)" — DESCARTADA.** A string "snack" não aparece em
  lugar nenhum do JSON de `taskflow_projects_pro` — se estivesse só filtrado, apareceria.
- ✅ **"Snack proteico" existe, mas como ASSUNTO de reunião, não como projeto:** item de pauta
  *"Ver sobre sabores dos snack proteico"* na reunião **"Reuniao - Empacotamento Doces"** (`reun1784380128766`,
  19/07). Há também uma reunião excluída na lixeira (`reun1784164330371`, 16/07).

### Hipóteses que sobraram (em ordem de probabilidade)
1. ⭐ **Está no HUB do GUILHERME, não neste protótipo.** É o cenário mais provável e o que explica tudo: o
   CLAUDE.md já avisa que a build do Guilherme e este git são **sistemas diferentes**, e isso vale p/ DADOS
   também. Se o Diego criou/viu o "Snack Proteico" no HUB da turma piloto, ele **nunca esteve aqui** — não há
   o que "recuperar", e sim que confirmar lá.
2. **Está no localStorage de uma máquina que nunca deu push.** A nuvem só tem o que foi enviado. Se foi criado
   no PC da Empresa/Produção e aquela máquina não logou na nuvem, a nuvem não sabe. → é o que o passo 1 testa.
3. Foi excluído há **mais de 30 dias** e já foi purgado (ver ⚠️ abaixo).

### ⚠️ RISCO COM PRAZO — a Lixeira se auto-purga em 30 dias
No boot do app (`~linha 4322`), `trash` é filtrado por `deletedAt > agora-30dias` e **regravado**. Ou seja:
**item com mais de 30 dias some sozinho toda vez que o app abre.** Não dá p/ adiar indefinidamente. Hoje o
item mais antigo da lixeira é de 16/07 — ainda dentro do prazo.

### Passo 1 — script READ-ONLY p/ colar no Console (F12) do Chrome, com o Hub aberto
Não altera nada, só lê e imprime. Rodar em CADA máquina e colar o resultado no chat.
```js
(()=>{const J=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch(e){return null}};
 const hits=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i),v=localStorage.getItem(k)||'';
   if(/snack/i.test(v))hits.push({chave:k,tam:v.length,ocorr:(v.match(/snack/gi)||[]).length});}
 console.log('=== CHAVES COM "SNACK" ===');console.table(hits);
 console.log('=== PROJETOS (TODOS, inclusive concluídos) ===');
 console.table((J('taskflow_projects_pro')||[]).map(p=>({id:p.id,nome:p.nome||p.name,status:p.status})));
 console.log('=== LIXEIRA ===');
 console.table((J('taskflow_trash')||[]).map(t=>({tipo:t.type,excluido:t.deletedAt,
   nome:(t.item&&(t.item.nome||t.item.name||t.item.title))||''})));
 const bk=J('taskflow__backup_pre_pull');
 if(bk&&bk.data){console.log('=== BACKUP PRE-PULL de',bk.ts,'===');
   let bp=[];try{bp=JSON.parse(bk.data['taskflow_projects_pro']||'[]')}catch(e){}
   console.table(bp.map(p=>({nome:p.nome||p.name,status:p.status})));
   console.log('chaves do backup com snack:',Object.entries(bk.data).filter(([k,v])=>/snack/i.test(v||'')).map(([k])=>k));
 }else console.log('(sem backup pre-pull nesta máquina)');})()
```

### Passo 2 — decidir conforme o resultado
- **Achou em `taskflow_projects_pro` local** → o projeto existe SÓ nessa máquina. **NÃO clicar em "Baixar da
  nuvem"** (a nuvem não tem e sobrescreveria). Clicar em **"Enviar deste aparelho → nuvem"** p/ propagar.
- **Achou na Lixeira local** (`type:'projectPro'`) → restaurar pela tela da Lixeira; `_linkedTasks` religa as
  tarefas automaticamente (ver `excluirProjectPro`, ~linha 28234).
- **Achou só no `taskflow__backup_pre_pull`** → o pull sobrescreveu. Extrair dali (o backup guarda o JSON cru
  de cada chave) e reinjetar — me chamar p/ montar o script de restauração com cuidado.
- **Não achou em nenhuma das 3 máquinas** → é a hipótese 1: conferir no **HUB do Guilherme**. Encerrar a busca
  aqui e marcar esta seção como resolvida.

## 🐞 VARREDURA 18/07/2026 (Mac) — bugs confirmados em Reuniões + Projetos
> Auditoria pedida pelo Diego após os 57 commits do PC da Empresa. Método: inventário determinístico
> (grafo de alcançabilidade + CSS morto) + 5 análises semânticas + **validação em navegador**.
> Legenda: 🔬 = comprovado rodando no app · 📖 = comprovado lendo o código.
>
> ✅ **RESOLVIDO EM 21/07/2026 (sessão v7, PC da Empresa) — TODOS os 20 bugs P0/P1/P2/P3 abaixo foram
> corrigidos.** Ver a entrada de handoff **2026-07-21 (c)** no topo do Log (com o mapa commit-por-bug).
> Os checkboxes abaixo seguem `[ ]` porque não reeditei um a um, mas a fila desta varredura está ZERADA.
> **Falta só o CÓDIGO MORTO** (seção 🧟 mais abaixo) — deixado p/ uma limpeza dedicada (risco de deletar
> às cegas num arquivo sem teste local). E o P0 nº1 (`renderProjectProTarefas`) já era de 19/07.

### P0 — corrompe dado ou mente para o usuário
- [x] ✅ **RESOLVIDO 19/07/2026** — **🔬 `renderProjectProTarefas` REESCREVE `t.date` a cada render** (`26989`). Só abrir a aba Tarefas
  do projeto muda a data das tarefas sem `dateManual` e **persiste** via `saveTask_db`. Teste real:
  tarefa com `date=2026-05-01` (78 dias atrasada) virou `2026-08-14` (futuro) sem nenhum clique.
  Pior: tarefa criada SEM data ganha `date` E tem o `prazoBase` congelado com a projeção da máquina
  (`saveTask_db`, `4873`) — a "baseline" que a Análise usa (comentário `27590`) é inventada pelo próprio
  renderizador. Efeito: a esteira pinta "Atrasada" enquanto aba Atrasadas/kanban/card Info dizem "em dia".
  **Um render nunca deveria escrever no banco — a projeção tem que ser calculada e exibida, sem tocar em `t.date`.**
- [ ] **📖 Perda SILENCIOSA por cota, com toast de sucesso** (`saveMeeting_db 4963`, `saveTask_db 4876` e
  todos os `save*_db`). `safeSetItem` retorna `false` em `QuotaExceededError` (o comentário em `4516`
  até documenta isso), mas **nenhum chamador olha o retorno**. Anexar 2 PDFs grandes → falha → aparece
  `📎 2 anexos adicionados`; a partir daí ATA, pauta e presença "salvam" com toast e somem no F5.
  `_quotaAvisado` (`4522`) ainda suprime o aviso por 30s.
- [ ] **📖 `excluirGrupo` MENTE no diálogo** (`26648` × `26655`). Promete "voltam para a triagem do projeto
  (sem setor)" mas executa `t.projectProFaseId=null` — ejeta a tarefa da **fase inteira**. O comentário
  logo acima do código ("só perdem o setor") também está errado.
- [ ] **📖 Encerrar reunião não zera `m.inicioReal`** (`_encerrarReuniaoFinal 33325`). Reabrir a reunião como
  "Em andamento" religa o cronômetro a partir da data ORIGINAL → pílula nasce com ~24h, e Finalizar de novo
  grava `duracaoSeg≈86000s`, contaminando as médias de duração (`29919`, `29997`, `30006`).

### P1 — quebra os fluxos INLINE que acabamos de entregar (entradas y/z/bb)
- [ ] **🔬 Tarefa criada inline numa fase inicial nasce na ÚLTIMA etapa, BLOQUEADA** (`quickAddTaskPro 22524`
  + `_ppTarefasOrdenadas 26697`). Nasce sem `ppOrdem` → recebe `max+1` (fim da ordem GLOBAL), ignorando a
  fase onde foi digitada. Teste real no projeto-semente: tarefa criada na **fase 1** recebeu **etapa 24 de 24**
  e ficou **bloqueada por 21 tarefas** de fases posteriores — com cadeado, sem poder concluir pelo Painel.
- [ ] **🔬 `quickAddSetorPro` não checa duplicata** (`26466`). Teste real: digitei "Compras" 3× → **3 setores
  idênticos**. O caminho por modal checa (`26626`), o inline não. Agravante: `_ppVincularTarefaPorExecutor`
  (`20674`) sempre acha o primeiro → os outros ficam vazios pra sempre, e o **Painel não tem botão de excluir
  setor** (só a aba Fases, `26406`) — o usuário não consegue limpar de onde criou.
- [ ] **📖 Esc para cancelar rename derruba o modo TELA CHEIA** (`25906` + `26124`). O `onkeydown` do input
  cancela mas não chama `stopPropagation()`, então o mesmo Esc chega no listener global e roda `_exitProjFocus`.
  Vale também p/ os 3 campos de criação inline (`qa-fase-* 26144`, `qa-setor-* 26178`, `qa-pp-* 26095`),
  que sequer tratam Esc. (O atalho `N` em `29149` tem a guarda certa — dá pra copiar de lá.)
- [ ] **📖 `_ppSalvarNomeFase` chama `render()` em TODO blur** (`26444`) — inclusive quando nada mudou. O
  `render()` troca o `innerHTML` inteiro (`25894`), o nó que recebeu o `mousedown` é destruído e o `click`
  nunca é despachado: **o primeiro clique fora do rename é engolido**. É o fluxo natural de sair da edição.
- [ ] **📖 Setor chamado "Geral" criado inline é APAGADO silenciosamente** (`20672`) na próxima troca de
  executor — a varredura remove todo grupo "geral" com `tarefaIds` vazio, sem toast, sem confirmação.

### P2 — inconsistência de dados e contagem
- [ ] **📖 DOIS índices concorrentes p/ "tarefa deste setor":** `t.projectProGrupoId` × `g.tarefaIds`. Na MESMA
  tela, o cabeçalho da fase conta por um (`26372`/`26389`) e o corpo lista pelo outro (`26396`) → "o número
  diz 8, eu conto 7". `_setorBloco` da Visão usa o 1º (`26083`), o da fase expandida usa o 2º. Nenhuma exclusão
  de tarefa poda `tarefaIds` (`21020`, `33940`), e a poda de grupos "Geral" decide pelo índice legado, que o
  próprio código declara 2× não ser fonte de verdade (`5161`, `5175`).
- [ ] **📖 `limparOrfaos` é limpeza de TAREFAS disfarçada de limpeza geral** (`10524`: `if(!taskIdsExcluidas.length) return;`).
  Projeto purgado aos 30 dias deixa `taskflow_pro_comments` (`21198`) no localStorage **para sempre**, sem rota
  de leitura nem limpeza — vazamento que só cresce e empurra pro bug de cota acima.
- [ ] **📖 Série de reuniões: `_recRegenerarFuturas` (`32763`) e `_sugEncerrarSerie` (`32900`) apagam ocorrências
  sem religar `continuacaoDe`** (o `deleteReuniao 31207` religa; estas não). Um elo quebrado faz
  `_reunAncestraisIds` dar `break` na 1ª volta → o bloco "Da reunião anterior" some e as tarefas herdadas
  de TODAS as reuniões anteriores desaparecem do painel.
- [ ] **📖 `_pautaAutor` é mapa por TEXTO** (`32122`/`32173`). Dois assuntos com o mesmo nome compartilham autor
  (o 2º sobrescreve o 1º) e `removerPautaItem` (`32321`) nunca limpa a entrada → reusar o texto meses depois
  já nasce atribuído a alguém que ninguém escolheu.
- [ ] **📖 Subtarefas não entram em nenhum agregado** (`_calcularProgressoFase 5179` só conta `t.done`). Tarefa
  com 9 de 10 subtarefas feitas conta 0% — o progresso do projeto subestima o avanço real por construção.
- [ ] **📖 Restaurar projeto da lixeira pode DUPLICAR tarefa em 2 projetos** (`10462`). A guarda `!t.projectProId`
  pula a tarefa realocada, mas o `g.tarefaIds` do projeto restaurado ainda tem o id dela → aparece nos dois.

### P3 — menores (mas reais)
- [ ] 📖 `REUN_FREQ` não tem `'custom'`, e a recorrência NOVA grava `frequencia:'custom'` (`31041`). Dois efeitos:
  "Agendar próxima" sugere **a mesma data de hoje** (`33021`) e o aviso de "recorrente vencida" nunca aparece (`31416`).
- [ ] 📖 `_reunFreqMap` (`32412`) conta ocorrências FUTURAS materializadas → a ⭐ "participa com frequência"
  acende para todo mundo desde a 1ª reunião.
- [ ] 📖 **Anotações da reunião gravam e reinjetam HTML CRU** (`_reunAnotacoesHTML 32112`, `_anotSalvar 31947`
  usa `el.innerHTML`). É o ÚNICO ponto do módulo sem escape (todo o resto usa `escapeHTML`/`escapeAttr`) e não
  há handler de `paste` no arquivo inteiro. Colar HTML de uma página web executa a cada re-render.
- [ ] 📖 `openReuniaoModal` (`30493`) faz snapshot/restore de `innerHTML` → perde o que estava digitado em
  textarea (ATA, nova tarefa, novo assunto) e mata os listeners do separador arrastável.
- [ ] 📖 `toggle` (`20952`): concluir tarefa com o painel numa sub-aba ≠ "painel" não repinta nada (dado salva, tela fica velha).
- [ ] 📖 Vocabulário custom entra sem escape no `placeholder` (`26144`/`26178`/`26112`/`26299`) — `_ppMkRotulo`
  (`25226`) não sanitiza. Impacto cosmético, mas é o único ponto não escapado do bloco novo.

### 🧟 Código morto (medido por grafo de alcançabilidade, não por grep)
**40 funções mortas** no arquivo; **~296 linhas** nos 2 módulos. Morreram em CLUSTERS:
- **Modal Equipe do Projeto** (~150 ln): `abrirModalEquipe 27356` (marcada `[SUPERSEDED]` em `27354`) levou junto
  `_ppTogglePessoa 27434`, `_ppDefinirCoord 27451`, `_ppRemoverCoord 27469`; + `removerPessoaProjPro 27486` e
  `_ciclarPapelProjeto 27258` com ZERO menções. Substituído pela sub-aba Pessoas.
- **Config de Reuniões + Mural** (~90 ln): `toggleReuniaoConfig 28756` → `_fecharReuniaoConfig 28777` →
  `setReuniaoView 29879` → e com ela ficaram inalcançáveis `reunMuralItemHTML 30237`, `reunRapidaMuralHTML 30293`,
  `reunCompromissoMuralHTML 30376`.
- **Modais antigos de Reunião** (~160 ln): `abrirPresencaReuniao`+`fecharPresencaReuniao`, `abrirInfoReuniao`,
  `abrirAtaReuniao`, `abrirAnexosReuniao` → viraram `_reun*InlineHTML`.
- **⚠️ NOVOS (19/07):** ao tirar a sugestão de modelos da pauta (pedido do Diego), `REUNIAO_MODELOS`,
  `_pautaAplicarModelo` e `_reunAplicarModelo` ficaram **sem nenhum caminho vivo na UI**. Mantidos de
  propósito — religar é repor o bloco de botões em `reunPautaHTML`.
- **Avulsos:** `iniciarReuniao 33062`, `_reunAplicarModelo 29232`+`_reunRebuildPautaList 29220`,
  `_ciclarPapelReuniao 31775`, `setReuniaoFiltro 29886`, `removerTarefaDoGrupo 26668`, `_initPpColResizer 25935`,
  `_ppNewTaskId`, `_ppToggleChip`, `_ppTogglePainelFase`, `contOpts 30798`, ramo `'editar'` de `renderReunioes 29588`.
- **`togglePresenca 33051`** = duplicata byte a byte de `togglePresencaModal 32465` (essa viva).
- **CSS:** 15 classes mortas nos módulos (`.reun-side*`, `.reun-top-grid`, `.reun-grid`, `.reun-check`,
  `.reun-pauta-item`, `.reun-badge-papel`, `.proj-view-*`, `.proj-color-*`); 192 no arquivo ≈ **567 linhas**.
- ⚠️ **AO LIMPAR, NÃO REMOVER a linha `3616`** (`reunFiltroTipo='todos'` + grava no localStorage). `setReuniaoFiltro`
  está morta, mas `reunFiltroTipo` ainda é LIDO em `29643`/`29666`/`29679`. Essa linha é a guarda que mata um bug
  já vivido (um `'compromisso'` vindo da nuvem escondia TODAS as reuniões, sem UI pra reverter — ver `3612-3615`).

### ✅ O que foi investigado e NÃO é problema (não gastar tempo de novo)
- **Nenhuma regressão no redesign de Reuniões.** As 5 funções principais têm `[SUPERSEDED jul/2026] … mantido só
  por segurança` escrito pela própria máquina que redesenhou. Foi limpeza consciente; todo recurso tem caminho vivo.
- **`_reunPauta` (14003/18845/29237), `_activeReuniaoId`, `_reunFocus`, `_reunSubView`, `_reunSelParts` NÃO fazem
  shadowing** — são todas `window.*`, não há `let/const/var` competindo. Suspeita levantada e REFUTADA.
- **`_papelDe`/`linhaPart` em `27304`/`31794` NÃO é copy-paste** — são `const` locais de escopos e domínios
  diferentes (papéis de PROJETO × papéis de REUNIÃO). Suspeita levantada e REFUTADA.
- **Cronômetro NÃO vaza `setInterval`** — `_cronometroInterval` é única, sempre com `clearInterval` antes; o tick
  se auto-encerra. O cálculo de pausar/retomar confere. (O problema está em ENCERRAR — ver P0.)
- **`_reunAncestraisIds`/`_reunSerieCompleta` não têm recursão infinita** (guardas `guard<20`/`guard<60` + Set).
- **Escape de HTML está correto** em título/pauta/ATA/decisões/anexos e nos pontos novos do Painel (`escapeHTML`/
  `escapeAttr` em `19997`). Exceções: só as Anotações e o placeholder do vocabulário (ver P3).
- **Sintaxe OK** (jsc, 31.295 linhas de JS) e **zero chamadas a função inexistente** em handlers.
- Colisão de ids, persistência dos quick-adds e a ordem de `_moverFase` foram checadas e estão certas.

## 📌 BACKLOG ACORDADO (aprovado pelo Diego, adiado — NÃO é ideia solta)
> Diferente das "pendências" espalhadas no log: aqui só entra o que o Diego **viu e aprovou**, mas
> decidiu fazer **mais adiante**. Não começar sem ele pedir; ao pedir, o contexto p/ retomar está aqui.

### ⭐⭐ COMPRAS v4 — reestruturação do MENU + "Ficha do Produto 360°" (definido 23/07 → FAZER 24/07)
**Status:** o Diego trouxe no fim do dia 23/07 **uma print (árvore de menu) + um texto detalhado** com o desenho
que ele quer p/ a área Compras. Disse explicitamente: *"são ideias, para continuarmos amanhã"* — **nada foi
implementado**. ⚠️ **A print e o chat NÃO persistem** — o que está transcrito abaixo é a ÚNICA fonte.

#### (A) NOVA ÁRVORE DE MENU proposta (hoje são 8 abas planas; viraria 5 GRUPOS)
```
📁 VISÃO GERAL
   ├ Dashboard de Compras (Geral)
   └ Alertas & Rupturas (itens críticos / abaixo do estoque mínimo)
📦 GESTÃO DE ESTOQUE E INSUMOS
   ├ Catálogo de Insumos (busca / curva ABC)
   ├ Ficha do Produto (a TELA ATUAL — Análise 360°)
   └ Transferências e Ajustes
🛒 OPERAÇÃO DE COMPRAS
   ├ Sugestões de Compra (MRP / ponto de pedido)
   ├ Pedidos de Compra (Abertos, Em Trânsito, Concluídos)
   └ Painel de Cotações & Negociações
🏭 FORNECEDORES
   ├ Cadastro e Desempenho (OTIF)
   └ Histórico de Preços por Fornecedor
⚙️ CONFIGURAÇÕES / ERP
   ├ Parâmetros de Estoque (lead time, estoque de segurança)
   └ Sincronização ERP
```
**Mapa contra o que JÁ EXISTE** (p/ não reconstruir o que está pronto — é mais reorganização que código novo):
| Item novo | Hoje |
|---|---|
| Dashboard de Compras | ✅ = aba **Painel** (cockpit) |
| Alertas & Rupturas | ⚠️ o conteúdo existe **dentro** do Painel (comprar agora / ficar de olho / preço fora da curva / estoque parado) → só **extrair p/ aba própria** |
| Catálogo de Insumos | ✅ ≈ abas **Estoque** + **Insumos** (falta a **curva ABC por item** — a de fornecedor já existe) |
| Ficha do Produto 360° | ✅ é o **painel do item** entregue hoje (tela cheia, views Resumo/Gráfico/Fornecedores) |
| Transferências e Ajustes | ❌ não existe (depende do ERP) |
| Sugestões de Compra | ⚠️ a sugestão foi **substituída pelo simulador** dentro da ficha; como **aba/lista** não existe |
| Pedidos de Compra | ⚠️ **CUIDADO com o nome:** a aba **"Ordens de compra"** de hoje é OUTRA coisa (comparativo última × anterior por item, ordenado por impacto em R$). Decidir: renomear a atual (ex.: "Variação de preços") e criar Pedidos de verdade |
| Cotações & Negociações | ✅ ≈ aba **Orçamentos** (hoje é ponte p/ o módulo da Manutenção) |
| Cadastro e Desempenho (OTIF) | ⚠️ aba **Fornecedores** existe (ABC + o que compramos dele); **OTIF não** |
| Histórico de Preços por Fornecedor | ⚠️ existe **dentro** da ficha do item; não por fornecedor |
| Configurações / ERP | ❌ não existe |
| aba **Notícias** | segue placeholder — decidir se some ou entra em algum grupo |

#### (B) FICHA DO PRODUTO 360° — o que o Diego quer em cada bloco (texto dele, condensado)
- **Cabeçalho/KPIs:** nome, código ERP, categoria/família, almoxarifado, **ABC/XYZ**; saldo físico, **estoque
  disponível (saldo − reservado)**, posição em R$, **ponto de ressuprimento**; **cobertura atual vs. ALVO** e
  **giro**; **preço médio pago (com imposto) × custo médio (sem imposto/contábil) × último preço**;
  **tag dinâmica de status** (Ideal · Crítico · Excesso de estoque · Aguardando entrega).
- **Bloco 1 — Inteligência de estoque & sugestão:** *"em vez de só dizer 'sem necessidade', mostrar o PORQUÊ"* →
  qtde sugerida (com opção de recalcular pelo **lote mínimo** do fornecedor), **data limite p/ emitir o pedido
  sem quebrar o estoque** (usa lead time), e os **parâmetros do ERP visíveis**: estoque mínimo/segurança, lote
  mínimo, múltiplo de compra, lead time médio.
- **Bloco 2 — Consumo e demanda:** consumo histórico (12/24 meses) **vs. previsão** (pedidos de venda / OPs
  abertas do ERP); **sazonalidade** (aviso se os próximos meses historicamente sobem); **em quais produtos
  acabados** o insumo é mais usado.
- **Bloco 3 — Preços & mercado:** evolução do **R$/kg**; comparação com **índice de commodities/agro**; **alerta
  de anomalia** de preço vs. média histórica.
- **Bloco 4 — Fornecedores & cotações:** **curva de participação** por fornecedor; **matriz de performance**
  (OTIF, lead time praticado, qualidade/devolução); **pedidos em aberto / em trânsito** (data prevista, qtde, fornecedor).

#### (C) ⚠️ O NÓ: quase metade disso NÃO SAI dos 3 exports que temos hoje
Os dados embutidos (`_CP_NF` compras, `_CP_EST` estoque, `_CP_CONS` consumo) dão preço, consumo, cobertura e
fornecedor — **e só**. **Antes de codar, decidir de onde vem cada campo abaixo** (senão a tela nasce com "a
cadastrar" em todo lugar, que é a pendência nº 1 herdada de hoje):
1. **Pedidos de compra em ABERTO** (item, fornecedor, qtde, emissão, data prevista, saldo a entregar) → destrava
   "Em trânsito", "Aguardando entrega", estoque disponível e a data-limite do Bloco 1. **É o export que mais falta.**
2. **Parâmetros por item:** estoque mínimo/segurança, ponto de ressuprimento, lote mínimo, múltiplo, **lead time**,
   almoxarifado, categoria/família, curva ABC do ERP (se houver).
3. **Estoque reservado** (p/ o "disponível"). 4. **Data prevista × real de entrega** (histórico) → **OTIF** e lead
   time por fornecedor. 5. **Condição de pagamento**. 6. **Estrutura/BOM** (p/ "em quais produtos acabados").
7. **Pedidos de venda / OPs abertas** (previsão). 8. **Índice de commodities** = fonte EXTERNA (não tem internet
   no protótipo → manual, ou backend do Guilherme).
⭐ **Ponte que já existe na casa:** o **PCP** (Produção › PCP, `LS_PCP`) já recebe do SISPRO **Estoque, Pedido,
OP/OC, Maras e MDV** por item — mas de **produto acabado**, não de insumo. Vale conferir com a TI se o mesmo
relatório sai para insumo: se sair, resolve previsão e ponto de pedido de uma vez.

#### (D) O que dá p/ fazer JÁ 24/07, sem depender da TI (ordem sugerida)
1. **Reagrupar o menu** nos 5 grupos (é layout; as telas já existem) + extrair **Alertas & Rupturas** do Painel.
2. **ABC por item** no Catálogo e **XYZ** (variabilidade do consumo, a partir de `_CP_CONS`) — dá com o dado atual.
3. **Tag dinâmica de status** no cabeçalho da ficha (Ideal/Crítico/Excesso) — deriva da cobertura que já calculamos.
4. **3ª coluna do Resumo** (hoje reservada/vazia — pendência nº 3 de hoje): candidatos naturais = "Parâmetros do
   ERP + status" (Bloco 1) ou "Pedidos em aberto" (Bloco 4). ⚠️ **Os dois dependem do item (C)** → decidir antes.
5. Renomear "Insumos"→"Ficha do item"/"Ficha do Produto" (pendência nº 4) **cai junto** nesta reorganização.

### ⭐ 1:1 focado — variação do Painel de Reunião p/ encontro de 2 pessoas
**Status:** conceito **aprovado em 18/07/2026** ("achei bem legal, porém ainda não irei fazer"). Mockup foi
mostrado no chat (⚠️ chat NÃO persiste entre máquinas — a descrição abaixo é a fonte).
**Por que faz sentido na Klain:** a pauta principal da reunião de teste do Diego chama-se
"Acompanhamento individual" → 1:1 parece ser rotina, não caso raro.

**Os 3 blocos que diferem do painel normal:**
1. **Check-in** (topo, faixa curta): estado da pessoa — carga de trabalho, clima, o que está travando.
   Chips rápidos, não texto livre longo.
2. **Pauta em 2 COLUNAS** — "O que \<pessoa\> trouxe" | "O que eu trouxe", cada lado com seu "+ assunto".
   É o que muda o comportamento: o liderado passa a **trazer** pauta, em vez de só receber.
   (O campo de autor da pauta — `m.pautaAutor`, ver entradas (e)/(g)/(h) — já dá a base p/ separar os lados.)
3. ⭐ **"Combinados com \<pessoa\>"** (rodapé): consolida as tarefas/combinados dos encontros **ANTERIORES**
   da série, com status (feito · atrasado · a fazer) e data. **É o maior valor da tela**: hoje, p/ lembrar o
   que foi combinado com o Carlos em junho, tem que abrir reunião por reunião.

**Esboço de implementação (não decidido, só p/ não começar do zero):** provavelmente um tipo/nível novo
na reunião que troca o LAYOUT do painel (espelhando o que `m.nivel==='rapida'` já faz), reusando pauta/
tarefas/decisões existentes. O bloco "Combinados" pode reusar **`_reunSerieCompleta`** (já usado pelo
Histórico) filtrando as tarefas da cadeia — parecido com o que `reunTarefasHTML` faz com `_reunAncestraisIds`.

### Outros mockups mostrados e AINDA sem decisão
- **Recap pós-reunião (E)** — recomendado por mim; ao Finalizar, monta o resumo e **avisa cada participante**.
  Onde ficaria (já respondido ao Diego em 18/07): **sub-aba "Recap"** no painel (o registro/PDF) + **sino de
  notificações**, que **já existe** no HUB (`LS_NOTIFS='taskflow_notifs'`, `_notifItemHTML`, hoje usado p/
  @menções) → é estender, não criar canal novo. Opcional: card no Meu Dia.
- **Modo TV / Apresentação (A)** — mockup mostrado; o diferencial não é a fonte grande, é o **assunto ATUAL
  destacado com o tempo gasto nele**. Diego não priorizou.
- **Kanban de ações (B)** e **Timeline da série (C)** — nunca detalhados além do mockup original de 16/07.
- **Indicadores do painel de reunião** — a **coluna 0 já existe** reservada com aviso discreto (ver entrada (g)).

## Log de handoff (mais recente no topo)

> ▶ **RETOMAR EM 24/07 (Compras v4) — o Diego deixou o desenho pronto no fim do dia 23/07.** Ele mandou uma
> **print com a nova árvore de menu** (5 grupos no lugar das 8 abas planas) + um **texto detalhado da "Ficha do
> Produto 360°"** (KPIs + 4 blocos), dizendo *"são ideias, para continuarmos amanhã"*. **Nada foi codado.**
> Tudo transcrito na seção **📌 BACKLOG ACORDADO → "COMPRAS v4"** acima — inclusive (C) a lista do que **não sai
> dos exports atuais** (pedidos em aberto, lead time, estoque mínimo/reservado, OTIF, BOM) e (D) o que dá p/
> fazer sem depender da TI. **Começar por (D), e levar (C) pro Diego decidir com a TI.**

### ⭐ 2026-07-23 — PC da Empresa ("Compras v3") — PAINEL DO ITEM (tela cheia) + SIMULADOR DE COMPRA + estoque/consumo reais
Continuação da sessão anterior. **Tudo commitado e pushado; working tree limpo; `main == origin == 0a9d265b` (+ este commit de docs).**
Verificação: **preview local rodando** (`scratchpad/server.ps1` na :8899) — testei clicando/DOM em tudo; 0 erros de
console em todas as levas. ⚠️ **Screenshot segue travando** nesta máquina (renderer + arquivo de 3,7 MB) → validação
é por **DOM/medição**, não por imagem. **O acabamento visual fino não foi verificado por olho — o Diego confere no Pages.**

**⭐ O PAINEL DO ITEM (ficha do insumo) virou o centro da área.** Evoluiu em várias rodadas com o Diego ao vivo:
- **Abre em TELA CHEIA** (estilo Reunião/Projeto): `body.cp-focus` esconde header/sidebar/topbar, `#task-container`
  vira `fixed inset:0`, painel ocupa 100vh. **Rail lateral** colado (Voltar · Resumo · Gráfico · Fornec. · Tela cheia/Reduzir),
  **header próprio** e **corpo com scroll**. Esc ou "Reduzir" saem; Voltar/trocar-aba limpam o foco.
- **View RESUMO em 3 COLUNAS:** (1) **Simulador de compra**, (2) **Últimas 10 compras** (Data · Qtde · Preço ·
  Fornecedor · Prazo), (3) **reservada** (vazia, a definir). KPIs viraram **cards individuais** (7), com a **Cobertura
  mostrando a data de término** do estoque.
- **View GRÁFICO:** 4 gráficos em 2 colunas — consumo/mês e valor/mês em **barras**; **preço médio/kg** e **todas as
  compras** em **LINHA + pontos (SVG)**. **Clicar num mês/ponto filtra a tela** (resumo do mês + tabela).
- **View FORNECEDORES:** quem fornece o item, participação no gasto + tabela (comprado/%/compras/qtde/últ. preço/data);
  clique abre a ficha do fornecedor.

**⭐ SIMULADOR DE COMPRA (o card mais pedido).** 5 modos: **Estoque p/ X dias · Comprar X dias · Até uma data ·
Quantidade (kg/t) · Desconto %**. Campo de preço com default = último preço pago. Resultado ao vivo: quanto comprar,
custo, **ganho vs preço atual**, estoque depois e nova cobertura (dias + data).
Conferido com dado real (Amendoim, ref R$ 5,50): 30 t a R$ 5,10 → economia **R$ 12.000**; 90 t com **7%** → preço
R$ 5,11, economia **R$ 34.650** (bate com 90.000 × 5,50 × 7%). UX: inputs **sem fundo** (só underline, `cp-sim-inp`),
campos numa linha só, e o re-render é só do bloco de resultado (não perde o foco ao digitar).

**DADOS NOVOS (2 exports do ERP):** `_CP_EST` (425 itens, posição 22/07) e `_CP_CONS` (309 itens, consumo jan–jul).
Cruzam com as compras por **código do item** via **`_cpIdx()`** — 236 itens têm as 3 fontes. Deriva valor em estoque,
consumo/dia, **dias de cobertura** e último fornecedor. ⚠️ Cobertura usa **dias CORRIDOS** (consumo/30) — decidir se
vira dias ÚTEIS (o PCP usa 261/ano).

**Outros ajustes:** removido o **modal "revisar tarefas atrasadas"** que abria no boot (gatilho comentado; funções
mantidas p/ o Guilherme); coluna **Data** nas Últimas compras; Ordens de compra passou a ordenar por **impacto em R$**.

📌 **PENDÊNCIAS / DECISÕES p/ o Diego:**
1. **Prazo de pagamento e de entrega NÃO vêm no export do ERP** — a coluna "Prazo" e a ficha do fornecedor estão com
   "a cadastrar". Definir de onde vem esse dado.
2. **Cobertura**: dias corridos (hoje) × dias úteis (padrão do PCP)?
3. **3ª coluna do Resumo** está reservada/vazia — decidir o que entra.
4. Renomear **"Insumos" → "Ficha do item"**?
5. Ideia não implementada (só sugerida): botão **"gerar cotação"** levando a simulação p/ o módulo de Orçamentos.
6. Herdado: **código morto** (29 funções + ~40 classes CSS) mapeado e **não** removido — agora dá p/ limpar COM teste.

### ⭐ 2026-07-22 — PC da Empresa (sessão "Compras v2") — ÁREA COMPRAS COMPLETA com DADO REAL do ERP + perf 22s→0,2s + varredura + bug das datas
Sessão longa e **autônoma na 2ª metade** (Diego saiu, autorizou "faça o que precisar sem me pedir nada").
**Tudo commitado e pushado; working tree limpo; `main == origin == 53ce4be0`.** Último commit desta sessão: `53ce4be0`.
Verificação: **preview rodando (localhost:8899)** — testei clicando/DOM em tudo; 0 erros de console; 34 telas sem erro.

**Contexto que mudou o jogo:** o Diego trouxe **3 exports REAIS do ERP** (Entradas/NFs, Posição de estoque, Consumo mensal).
A área Compras deixou de ser casca e virou **ferramenta de verdade com o dado da Klain**.

**⚡ PERFORMANCE (a mais importante):** embutir dados como **literais de array aninhados** (17 mil linhas) fazia o
parser JS travar — o app abria em **21,9 s** (medido: download 19 ms, parse/JS 21.186 ms). Trocar por **`JSON.parse('...')`**
derrubou pra **~0,2 s (100×+)**. 📌 **REGRA daqui pra frente:** todo dado grande embutido vai como `JSON.parse`, NUNCA como literal.

**🐞 BUG das datas (varredura):** `amanha`/`semanaIni`/`semanaFim`/`proxSemana*` eram `const` (calculadas 1× no load).
Com o app aberto virando o dia, "Amanhã" mostrava o que já era HOJE (`amanha` é lido em ~48 lugares); só F5 corrigia.
Agora `let` + `_recalcDatasDerivadas()` chamada no load e no tick da meia-noite. ⚠️ De quebra eu **quebrei tudo** ao
tornar `_mon/_sun/_proxMon/_proxSun` locais (são lidos no subtítulo "Visão semanal", ~15412) — o próprio teste das 34
telas pegou (`_mon is not defined`) e corrigi (voltaram a globais). **Lição: refatorar var global exige grep de uso ANTES.**

**Varredura estática (sem subagentes, eu mesmo):** 1.490 funções, **0 duplicatas reais**, **0 chamadas órfãs** em handler,
**0 ids duplicados** no DOM. Código morto: **29 funções** + **~40 classes CSS** (mapeadas, NÃO removidas — agora dá p/ limpar COM teste).

**⭐ ÁREA COMPRAS — todas as 8 abas completas com dado real (commits `eb90abb8`→`53ce4be0`):**
- **Dados embutidos** (`JSON.parse`): `_CP_NF` 17.123 linhas de NF (jan/25–jul/26, R$ 69,8 mi), `_CP_EST` 425 itens de
  estoque (posição 22/07), `_CP_CONS` 309 itens com consumo mensal jan–jul. Cruzam por **código do item** — 236 têm os 3.
- **`_cpIdx()`** = índice cruzado (compras × estoque × consumo) que deriva valor, consumo/dia, **dias de cobertura**, últ. fornecedor. Base de tudo.
- **Painel** (cockpit): valor em estoque R$ 5,0 mi, comprar agora, ficar de olho, preço fora da curva (só ≥ R$ 1.000), estoque parado.
- **Estoque**: 425 itens, cobertura semaforizada, filtros, busca, clique → ficha.
- **Insumos → ficha do item**: KPIs + **sugestão de compra** (ponto de reposição p/ 45 dias) + **gráfico de consumo** (7 meses) + quem fornece + histórico de preços.
- **Fornecedores**: **curva ABC real** + ficha "o que compramos dele" por período (tela de reunião). ⚠️ Prazo de pagamento/entrega = "a cadastrar" (não vem no export).
- **Ordens de compra**: última × anterior por item, ordenado por **impacto em R$**, placar economia/custo-extra.
- **Orçamentos**: **ponte** p/ o módulo que já existe na Manutenção (não dupliquei). **Notícias**: segue placeholder.

**🔍 3 problemas do DADO REAL achados e tratados (não eram bug meu):**
1. Alerta de preço com **CMU do ERP** acendia em 84% (CMU = média do estoque, sempre abaixo do preço subindo) → troquei p/ **média das últimas 3 compras** → caiu p/ 8%.
2. **18 itens com estoque NEGATIVO** (consumo lançado antes da NF) → mostrados com aviso; cobertura/sugestão consideram o buraco.
3. **Erro de UNIDADE** nas Ordens (mesmo item comprado em rolo e em metro → variação -99,8%, impacto fantasma -R$ 4 mi) → descarto variação > 80%, com nota (12 itens ocultados).

**Cobertura do dado embutido:** é a **base completa** do export (Diego cobrou 2× "cadê os R$ 69,8 mi" — agora Tudo+Tudo bate ao centavo). `index.html` foi de 2,4 → **3,68 MB** (dado dicionarizado + JSON.parse; carrega em ~0,7 s, ok).

📌 **RETOMAR:** as telas rodam sobre **amostra embutida** (protótipo). No sistema do Guilherme isso vem do banco. **Perguntas p/ o Diego:**
prazo de pagamento/entrega por fornecedor (não vem no export — de onde tiramos?); dias de cobertura = corridos (÷30) ou úteis (como o PCP ÷261)?;
renomear "Insumos"→"Ficha do item"?. E o **código morto** (29 fn + 40 CSS) está pronto p/ uma faxina com teste.

### ⭐ 2026-07-21 (d) — PC da Empresa (sessão paralela à v7, "Compras") — ⭐ PREVIEW RODA AQUI! + CSS morto (256 regras) + NOVA ÁREA "Compras" (blueprint + casca + Estoque)
Sessão em **PARALELO à v7** (que fez o "Painel da Tarefa" — ver bloco no fim). As duas dividem o **MESMO
repo/working tree** nesta máquina, então o HEAD "anda" quando a outra commita (é o "modified on disk" que
aparece no Edit). **Tudo commitado e pushado; working tree limpo; `main == origin == e8611444`.** Nada
pendente pro Mac. Merges conferidos como LIMPOS (meu commit só ADICIONA Compras; o commit da v7 não toca
Compras; app boota 0 erros com os dois juntos).

⭐⭐ **DESCOBERTA QUE MUDA A REGRA: DÁ PRA RODAR O PREVIEW NO PC DA EMPRESA.** A nota repetida "esta máquina
não roda preview" estava **ERRADA**. **Como:** (1) subir um servidor HTTP local em **PowerShell puro** —
`System.Net.HttpListener` (o Windows tem embutido; **não precisa** Python/Node); (2) o **navegador embutido**
(Browser pane) abre `http://localhost:8899` numa boa. O que enganava era o **PROXY corporativo** — mas ele só
atrapalha o `Invoke-WebRequest` (comando de teste de rede); o **NAVEGADOR IGNORA proxy para localhost**.
Servidor pronto em `scratchpad/server.ps1` (serve o dir na :8899, `Cache-Control:no-store` → recarregar pega o
arquivo fresco do disco). **Testei TUDO clicando: 0 erros de console.** ⚠️ **Screenshot ainda TRAVA** (renderer
lento com arquivo de 2.4MB) — verificar por **DOM/JS** (`read_page`/`javascript_tool`), mais preciso que imagem.
→ Agora as **3 máquinas** testam. (E o código morto restante já dá p/ limpar COM teste real.)

**Meus 3 commits (área Compras):**
| Commit | O quê |
|---|---|
| `b85bb1d4` | **CSS morto: 256 regras removidas** (só regras de 1 linha, seletor 100% morto). Método determinístico (classes definidas × usadas fora do CSS) + **guarda contra classe montada dinamicamente** — pegou `proj-status-${status}` e **PRESERVOU** (teria quebrado as cores de status dos projetos). Verificação autoritativa por token de classe: NENHUMA das 193 é aplicada a elemento; balanço `{}` idêntico; app boota 0 erros. **Sobram** regras mortas multi-linha/combinadas + funções JS mortas p/ próxima passada (agora COM teste). |
| `7d9942da` | **NOVA ÁREA "Compras" (casca)** — grupo no acordeão (**1º em ÁREAS**, alfabético) + 8 abas placeholder. Espelha o Marketing: `comprasView` + `switchToCompras`/`setComprasView`/`renderCompras` + `_areaItem('compras',…)` no `areasHTML` (~10008) + dispatch `hubView==='compras'` no `render()` (~16184). Abas: Painel · Estoque · Insumos · Fornecedores · Histórico de compras · Ordens de compra · Orçamentos · Notícias. |
| `feab6b14` | **Aba Estoque DE VERDADE com DADOS DE EXEMPLO** — `_comprasMockInsumos` (4 insumos fictícios EM CÓDIGO, **não persiste**) + `_comprasEstoqueHTML` (tabela qtd/valor/consumo/dias/últ. compra/fornecedor + total). Coluna **Dias** = estoque÷consumo com **semáforo** (verde≥20 / âmbar / vermelho<10 = comprar). Manteiga 4d vermelho; total R$ 51.985. Testado clicando. |

⭐ **CONCEITO da área (definido com o Diego + blueprint visual — Artifact publicado na conta claude.ai dele):**
Compras no HUB **NÃO replica o ERP** (OC/NF seguem no ERP/SISPRO). É a **camada de CONSULTA e DECISÃO** sobre
os dados do ERP: *"o que comprar, quando, de quem, e como está o que já pedi"* — sem entrar no ERP. Mesmo
espírito do PCP. **A ESPINHA** = o **livro de NFs de compra** (a "planilha" que o Diego citou): quase tudo
calcula em cima dela; entra por **import/colar do ERP**. **Duas LENTES:** por **INSUMO** (ficha do item) ×
por **FORNECEDOR** (ficha: ABC de gasto, compras por período p/ reunião, prazo de pagamento, prazo de entrega).
Ferramentas de decisão aprovadas: **sugestão de compra (ponto de reposição)**, curva ABC (insumo+fornecedor),
alerta de preço fora da curva, lead time, prazo de pagamento, placar de economia.

📌 **PLANO acordado (RETOMAR NO MAC):** hoje é só a **CASCA com dados de exemplo** pra "brincar" e acertar o
layout de cada aba; os **valores REAIS entram 22/07 (amanhã) com a TI** (Diego pega o export do ERP). **Próximas
abas a montar com mock** (ordem sugerida): **Insumos** (ficha — clicar no item do Estoque abre) → **Histórico**
(livro de NFs) → **Fornecedores** → resto. **Perguntas ABERTAS p/ o Diego:** colunas do Estoque ok? renomear
"Insumos"→"Ficha do item"? nomes/ordem das abas? ⚠️ **Manutenção › Fornecedores/Orçamentos segue INTACTA** —
reaproveitar na aba Orçamentos (Fase 3), NÃO dupliquei.

━━━ **Trabalho PARALELO da v7** (`local_6039f889-20c2-48ca-beac-d059182ba1a8`) — "Painel da Tarefa" ━━━
A v7 (mesmo repo/máquina) entregou um **"Painel da Tarefa"** (tela cheia/foco de uma tarefa, espelhando o
Painel de Reunião). **3 commits, todos pushados, ORTOGONAIS ao Compras** (não se tocam): `5bbc039b` (foco/tela
cheia v1, reusa o modal 2-col) · `ed75e6fc` (trilha + cards estilo Reunião) · `e8611444` (sem trilha, header
encostado, Anotações + faixas de título). ⚠️ **Eu NÃO testei/validei** essa feature — o detalhe completo está
na **sessão v7** (dá p/ abrir via `mcp__ccd_session_mgmt`). No Mac, quem valida é o Diego (Ctrl+Shift+R).

⚠️ **Preview:** deixei um HttpListener rodando em background nesta sessão (:8899). No Mac, usar o método de lá
(o Mac já rodava preview via HTTP local).

### ⭐ 2026-07-21 (c) — PC da Empresa (sessão "v7") — BACKLOG da varredura 18/07 ZERADO + NOVA varredura do app todo (7 subagentes) + ~20 correções
Sessão **autônoma** (Diego longe do PC, autorizou "faça tudo, sem me pedir nada, de forma detalhada").
Pediu 2 coisas: (1) **fazer o backlog** de bugs da varredura 18/07; (2) **nova varredura no APP TODO** (bugs,
erros, falhas, código morto, melhorias). **11 commits de código**, working tree limpo. **Último commit de
código: `508f08c0`.** ⚠️ **NADA testado em navegador** (esta máquina não roda preview). Verificação = balanço
de `( ) { } ` + backticks **idêntico ao HEAD a cada leva** + grep de refs órfãs + conferência de que os 5
helpers novos têm def+chamadas casando e que as funções reusadas existem. **Quem valida comportamento é o
Diego no Pages (Ctrl+Shift+R).**

**Método:** lancei **7 subagentes de varredura read-only** (sonnet) em paralelo cobrindo os módulos que a
varredura 18/07 NÃO aprofundou (Tarefas core · Agenda/roteamento · Notas/Rotinas · Qualidade/Marketing ·
Manutenção · Produção/PCP · Sync/Cloud+boot). Cada achado sério foi **re-verificado por mim (Opus) lendo o
código** antes de corrigir — vários achados dos scanners estavam **desatualizados** (ex.: diziam que
`toggleKanban` não seta `doneAt`, mas já setava; `_meSet` já não colide). Só corrigi o que confirmei.

**(A) BACKLOG 18/07 — os 20 bugs P0/P1/P2/P3, TODOS corrigidos:**
| Commit | Bugs |
|---|---|
| `f61e809c` | **P0×3**: cota silenciosa (anexos checam `save*_db`, que agora RETORNAM boolean; desfazem + avisam em vez de mentir sucesso) · `excluirGrupo` mantém a fase (só tira o setor) · `_encerrarReuniaoFinal` zera `inicioReal` (sem salto de ~24h ao reabrir) |
| `dd6cab76` | **P1×5**: tarefa inline nasce no fim da PRÓPRIA fase (`_ppOrdemNovaNaFase`, não mais última etapa bloqueada) · `quickAddSetorPro` checa duplicata + bloqueia "Geral" reservado · Esc em campo não sai da tela cheia (guard no listener global + `stopPropagation`) · `_ppSalvarNomeFase` adia render (não engole o 1º clique) |
| `5f159b8a` | **P2×4 (projeto)**: `_calcularProgressoFase` conta subtarefas (crédito fracionário) · restaurar projeto poda `tarefaIds` (tarefa não aparece em 2 projetos) · `limparOrfaos` limpa `taskflow_pro_comments` dos projetos purgados · aba Fases lista por `t.projectProGrupoId` (fim do "diz 8, conto 7") |
| `9337e9ff` | **P2×2 (reunião)**: `_recRegenerarFuturas`/`_sugEncerrarSerie` religam a cadeia `continuacaoDe` (`_reunRelinkAoRemover`) · `removerPautaItem` limpa `pautaAutor[texto]` |
| `f7bd90ef` | **P3×6**: `_reunFreqMap` só conta reuniões que já aconteceram (⭐ não acende p/ todos) · `_reunProxData` delega ao motor `rec` p/ recorrência 'custom' (banner vencida volta) · vocab custom sanitizado em `_ppMkRotulo` · `toggle` repinta em sub-aba ≠ painel · `openReuniaoModal` renderiza em container detached (não apaga o digitado embaixo) · XSS de paste das Anotações (via sanitizador — ver B) |

**(B) NOVA VARREDURA — ~20 achados novos corrigidos:**
| Commit | Correções |
|---|---|
| `5661c19b` | 🔴 **CRASH**: `tableRowHTML` usava `showTags` (nunca declarada) → `ReferenceError` ao EXPANDIR subtarefas, quebrava o render de qualquer tabela · autosave honesto na cota (`_showAutosaveToast(ok)` — o caminho mais quente do app não mente mais "salvo") · `gpDeleteNote` (painel global) → Lixeira+Desfazer · `deleteRotina` confirma a cascata (o `msg` era montado e nunca exibido) · `restoreFromTrash` de preventiva não mente "restaurado" quando o equipamento sumiu |
| `2c58f240` | **XSS** do Importar Orçamento (regenera todos os ids + remapeia referências) · export JSON não vaza o token de sessão do Supabase · nota pós-conversão → Lixeira |
| `967b38b6` | **Sanitizador de paste** (`_onEditorPaste`/`_sanitizeHTMLPaste`) nos 2 editores rich-text (Notas + Anotações de reunião) — colar HTML de página externa era injetado cru · PCP: sem dado de estoque não pinta RUPTURA fantasma (`_pcpCalc` → NaN) · `_historyLabel` lê `projectsPro` (não "nenhum→nenhum") · custo do PCM ignora OS cancelada · ids de compromisso ganham random |
| `fd92b37e` | rotina "Personalizada" exige 1 dia · `confirmarProximaReuniaoModal` valida Fim>Início · `_pcpColarAplicar` confirma antes de substituir · `_moSetCotacao` refaz comparação ao trocar fornecedor |
| `42265102` | **`doneAt`** em `_cutPronto`/`eodConcluir`/`dropCard` (concluir por esses caminhos sumia de Confirmações/Análise/"concluídas hoje") |
| `508f08c0` | sensorial: voto duplo do mesmo avaliador SUBSTITUI (não empilha) · atalhos `N`/`Ctrl+K`/`Ctrl+I` não vazam atrás da apresentação em tela cheia (`#sens-pres`) |

**⚠️ 2 falsos-alarmes do balanço (registro p/ não assustar):** o regex `/javascript:/i` de `style` no sanitizador
e backticks dentro de `//comentários` mudaram a contagem bruta do grep sem quebrar nada — reescrevi o regex e
troquei os backticks por aspas p/ manter a verificação limpa. **No fim, balanço IDÊNTICO ao início da sessão.**

**❗ NÃO corrigido de propósito (documentado p/ decidir/fazer depois — nada disso quebra o app):**
- **CÓDIGO MORTO** (inventário grande, alta confiança dos scanners): subsistema `someday`/Lembrete inteiro;
  `_isRotina`+`toggleRotinaTask` (flag nunca atribuída) — é a raiz de "rotina não avança pelo Kanban";
  `_reunioesRapidas` cluster (migrado, array esvaziado no boot); `renderNovaNotaInline`/`noteRowHTML`/view
  'timeline' de Rotinas/`renderAgendaCompromissos`/`calView`; 4 funções do PCP (`_pcpUpdateKPIs`/`_pcpAgrupar`/
  `_pcpSaveDeb`/`_pcpSugestao`) + campos `saldo/ddv/ddvsop` mortos por item; ~567 ln de CSS morto da 18/07.
  **Não deletei em massa** — risco alto de tirar algo referenciado num arquivo de 35k linhas sem teste local.
  Merece uma sessão dedicada (idealmente numa máquina que rode o preview).
- **`toggleKanban` não avança a rotina** pelo Painel (só a Lista cria a próxima ocorrência). Fiz o `doneAt`
  (acima); a criação da próxima é arquitetural (depende de reviver o subsistema `_isRotina` morto). Decidir.
- **Sensorial — editar uma "Resposta" compartilhada** (biblioteca de opções) recalcula resultados de testes JÁ
  encerrados (casamento por string, sem snapshot por teste). É de design; o fix certo é congelar a escala no
  teste. Por ora, protótipo (dado descartável) — anotado. Um aviso-ao-editar (como o que já existe ao excluir)
  seria o meio-termo barato.
- **Datas globais não recalculam à meia-noite** (`amanha`/`semanaIni` são `const`, só `today` avança no tick) —
  app aberto virando o dia mostra "Amanhã"=hoje até um F5. Fix = transformar em `let`+recomputar no tick.
- **Sync/Cloud (achado B do scanner):** o portão anti-sobrescrita está íntegro p/ o caso que resolve, MAS as
  escritas de BOOT (migrações 1x/seed/purga da Lixeira) rodam antes de `_sbUser` resolver → não entram na fila
  de push; só sobem quando a MESMA chave for reescrita ou no "Enviar" manual. Baixo impacto (chaves quentes se
  auto-corrigem), mas é real.
- **`_num()` (Manutenção)** não parseia formato americano "1,234.56" — mas o Diego usa vírgula decimal (BR), que
  funciona; o fix do scanner (`/g`) não resolvia o caso US de verdade. Deixado como está.
- `reunCompromissoMuralHTML` tem XSS latente (`cat.label` sem escape) — mas é **código morto** (mural desligado).
- IMPROVE menores: filtros do PCP não persistem entre sessões (DDV-alvo volta a 15); grid de Cards de rotina
  fixo em 3 col; monkey-patch por `setTimeout` de `saveRotina`/`converterNotaEmTarefa`.

**Nota de processo:** 11 levas pequenas, cada uma com balanço conferido contra o HEAD antes de commitar (o
padrão que pega meus próprios erros — 2 falsos-alarmes de regex/comentário apareceram e foram limpos). Os
relatórios crus dos 7 scanners não persistem no chat; o essencial está resumido aqui.

### 2026-07-21 (b) — PC da Empresa (sessão "v6") — Título Manrope no Projeto · "Acontecendo agora" em 2 cards · botão de TESTE visual no modo foco da Reunião
Sessão de continuação (nova sessão do Claude Code, a 6ª da série "HTML - Tarefas v1…v6"). Tudo commitado e
pushado, working tree limpo, `main == origin/main`. **Último commit de código: `2a7325c8`.** ⚠️ **NADA testado em
navegador** (esta máquina não roda preview) — verificação = balanço de `( ) { } <div>` / backticks idêntico ao HEAD
+ grep de refs órfãs. **Quem valida comportamento é o Diego no Pages (Ctrl+Shift+R).**

**O que mudou (commits desta sessão, em ordem):**
| Commit | Área | O quê |
|---|---|---|
| `e5836017` | Projeto — títulos | Os 2 títulos do Painel de Projeto (header normal 23px e barra de foco 18px) passaram a usar **`var(--font-title)` (Manrope) + `letter-spacing:-.02em`**, igualando a tipografia modernizada do Painel de Reunião (`6a72ba94`). Só typografia; estrutura/`max-width` do projeto mantidos. |
| `9d069948` | Reunião — modo foco | **Botão de TESTE** na ponta direita da `.reun-focus-bar` (após o timer): cicla 3 estados — 1) header+trilha num tom mais forte · 2) trilha some · 3) normal. `_reunFxTest`/`_reunFxTestReset`; CSS escopado a `body.reun-focus` (inerte fora do foco); limpa ao entrar/sair. **É só teste, não persiste.** |
| `bfea3b3f` | Reunião — modo foco | O estado "tint" do botão passou a usar tom **CARAMELO** = `color-mix(--blue-mid 55%, --bg)` (cor da escrita da Pauta principal), a pedido do Diego — antes era escurecimento neutro. |
| `1d6f8370` + `2a7325c8` | Projeto — "Acontecendo agora" | Saiu o `_ppBloco` **único** que envolvia tudo (`renderProjectProVisao`, ~26166). Agora: header "Acontecendo agora" + nome da fase ficam **soltos**; **"Em andamento"** (TODAS as tarefas da etapa atual, **atrasadas inclusive** com o pill vermelho) e **"Próximas a liberar"** viram **DOIS cards** (`--surface-painel`). Unificado num `rowAgora`. (`2a7325c8` = fix: a atrasada tinha ficado FORA do card; o Diego apontou que "atrasada = em andamento", então voltou pra dentro.) |

**Decisões desta sessão:**
- ⭐ **Formato CARTÕES será aposentado do HUB** (Diego): "não usar mais". **Neste protótipo já estava removido** das telas de tarefas em julho (toggle só-Lista, escondido). O que resta de "cards" aqui é o toggle **Lista·Cards·Frequência** das **Rotinas** — o Diego decidiu **deixar como está**. ⚠️ O toggle `Lista/Cartões` que ele vê nos prints (com "Buscar nesta página" + fundo de corações) é da **build do Guilherme** (servidor), NÃO deste git — remover de verdade é com o Guilherme.
- **Workflow de sessões:** o Diego cria sessão nova ao chegar perto do contexto cheio (por medo de perder info na compactação). Alinhado que **manter é bom hábito** (contexto limpo = melhor/mais barato), mas a "memória de verdade" é **git + handoff + MEMORY.md** — compactar RESUME, não apaga. Frase-padrão que ele vai usar p/ fechar: *"Vou encerrar a sessão. Commita e pusha tudo que falta, e atualiza o Log de handoff…"*; e p/ abrir: *"Tô no PC da Empresa. Roda git pull, lê o handoff e me diz onde paramos."*
- 🆕 **Ferramentas de sessão disponíveis:** dá p/ **listar / buscar / abrir as sessões arquivadas** do Claude Code (via `mcp__ccd_session_mgmt__*`). Ou seja, além do handoff, uma sessão nova consegue **recuperar conteúdo de sessões antigas** sob demanda — o "chats não compartilham histórico" do topo continua o padrão, mas agora há essa ponte. As 5 arquivadas (v1 02/jul · v2 13/jul · v3 16/jul · v4 17/jul · v5 21/jul) foram conferidas: **todas já têm sua entrada no handoff**, nada faltando.

**OPEN — esperando o Diego (nada quebrado):**
- **Botão de TESTE do modo foco é PROVISÓRIO** — decidir se vira feature de verdade (nome/ícone final; 1 botão ciclando × 2 controles; e se o caramelo fica em 55% ou vai a **caramelo cheio com texto creme** no header/trilha — o Diego cogitou).
- 🐞 **Estrelinha ⭐ da aba Pessoas (reunião)** — `_reunFreqMap` conta ocorrências FUTURAS de série → acende p/ quase todo mundo (P3 da varredura).
- **Prioridade nos projetos** — o Diego pediu "agrupar por prioridade" mas ela foi desativada antes; decidir se re-ativa (repor campo no Editar + a aba).
- **Snack Proteico** — falta o Diego clicar ☁️ **Enviar** no Edge (e Baixar nas outras) p/ propagar.
- Herdadas (varredura 18/07): 20 bugs restantes (P0/P1/P2/P3) + dupla def de "Atrasada" + `g.tarefaIds`×`t.projectPro*` + código morto.

### ⭐ 2026-07-21 — RESUMO DA SESSÃO (PC da Empresa) — polimento visual pesado de Reunião + Projeto + recuperação do Snack
Sessão longa de **UX/identidade visual** nos Painéis de Reunião e Projeto, mais a **recuperação do projeto Snack
Proteico** (ver seção ✅ RESOLVIDO no topo do arquivo). Tudo commitado e pushado; working tree limpo. **Último commit
de código: `017a53c6`.** ⚠️ **NADA testado em navegador** (esta máquina não roda preview — `file://` abre só snapshot
estático). Verificação = balanço de `( ) { } <div>`/backticks idêntico ao HEAD + greps de refs órfãs + build do Pages
`built` + `curl` no HTML servido. **Quem valida comportamento é o Diego no Pages (Ctrl+Shift+R).**

**O que mudou (commits desta sessão, em ordem):**
| Área | O quê |
|---|---|
| **Projetos — lista** | Removido o menu **⋮** (Agrupar/Ordenar) `2ae63b13`; depois **subnavbar de agrupamento** discreta (estilo períodos das Reuniões): **Tipo·Status·Setor·Prazo·Sem agrupar** + **lupa** no fim (busca some atrás dela) `c610d9f0`. Setor = pelo setor do DONO. Prioridade ficou de fora (desativada). |
| **Reunião — sala** | "Sala de reunião" não abre mais sub-seletor (só há UMA sala) `45aedbc7` |
| **Reunião — abas** | Nova ordem **Painel·Pessoas·Anexos·Decisões·Histórico·ATA·Info·Editar** (sub-navbar + trilha do foco); ações Sair/Iniciar/Finalizar no rodapé da trilha `1b1cfae6` |
| **Reunião — seletor de pessoas** | O `<select>` nativo (feio) virou **popover do tema** com busca+avatares (`_pessoaPicker`) `b531b831` |
| **Reunião — header** | Fonte **Manrope** (Google Fonts, var `--font-title`) maior/moderna; **"Agendada" removido** do painel; **data** ao lado do título (discreta); **timer** foi p/ a ponta direita depois dos presentes; mais espaço entre grupos da pauta `6a72ba94` |
| **Reunião — cabeçalhos** | "Da reunião anterior"/"Novas tarefas"/data das Decisões anteriores unificados ao estilo do NOME DA PESSOA (11px/700/`--text2`, ícone `--text3`) `017a53c6` |
| **Projeto — abas** | Nova ordem **Painel·Pessoas·Fases·Tarefas·Anexos·Comentários·Análise·Info·Editar**; Editar virou ABA; ícones do fim = buscar·expandir·salvar como modelo `a0aad88a` |

**⚠️ 2 bugs MEUS pegos na verificação (padrão vale p/ o futuro):** (1) `_pessoaPicker` — escape de aspas `\\'` num
ícone fecharia a string JS; (2) na lupa da lista nomeei `_ppBuscaFechar`, que **já existe** (busca do painel) —
duplicado sobrescreveria o outro; renomeei p/ `_ppLista*`. Ambos o balanço NÃO pegaria; foram grep/leitura à mão.

**OPEN — esperando o Diego (nada quebrado):**
- 🐞 **Estrelinha ⭐ da aba Pessoas (reunião)** acende errado: `_reunFreqMap` conta ocorrências FUTURAS de série
  recorrente → acende p/ quase todo mundo. Fix pequeno (P3 da varredura).
- **Prioridade nos projetos:** o Diego pediu "agrupar por prioridade" mas ela foi desativada antes; deixei de fora
  (agruparia tudo em "Média"). Se quiser, re-ativar = repor o campo no Editar + a aba.
- **Snack Proteico:** falta o Diego clicar ☁️ **Enviar** no Edge (e Baixar nas outras) p/ propagar.
- **"Em andamento":** saiu do header junto com o status; se sentir falta de um selo de "ao vivo", repor só p/ esse estado.
- Herdadas (varredura 18/07): 21 bugs (1 P0 já corrigido), dupla def de "Atrasada", `g.tarefaIds`×`t.projectPro*`, código morto.

### 2026-07-20 (yy) — PC da Produção — Proposta A das setas (paralela âmbar / sequencial quieta) + lista de Projetos centralizada
- Diego escolheu a **Proposta A** do debate sobre as setas de dependência (mockup via show_widget). Implementado
  no `_tarefaLinha` (Painel/Visão — vale no modo Lista e no por-setor):
  - **Sequencial QUIETA:** o conector virou um `ti-arrow-narrow-down` (↓) apagado (opacity .5, `--text3`). A
    sequência + a numeração já dizem "vem depois". (Antes era uma ↘ azul destacada.)
  - **Paralela GRITA (âmbar):** badge da etapa âmbar (`color-mix(--amber 16%)`), conector `ti-corner-down-right`
    (└) âmbar apontando p/ a de cima, e faixa esquerda âmbar (`box-shadow:inset 3px`) que agrupa as que rodam
    juntas. `_hl` reescrito: faixa = âmbar se paralela, senão cor do projeto se em andamento; fundo 7% só na
    tarefa em curso. (Antes a paralela era cinza/apagada — a ênfase estava invertida.)
  - Legenda do detalhe atualizada: "…4.1 em âmbar = roda junto (paralela)…".
  - ⚠️ A aba **Tarefas** (planilha, `renderProjectProTarefas` ~27268) AINDA usa as setas antigas (↘/⤨ com
    p.cor) — não aliei p/ manter escopo; alinhar lá é o próximo passo se quiser consistência total.
- **Lista de Projetos centralizada** (`renderProjetosPro` ~24918): a lista COM projetos ocupava a tela toda;
  agora fica num bloco `max-width:940px;margin:0 auto;padding-top:22px` — igual à tela de Reuniões (940/720
  centrado). O estado-vazio já era centrado (1000px). Usei 940 (não 720 como a lista de reuniões) porque a
  linha de projeto tem mais colunas (status/barra/prazo).
- VERIFICADO no navegador (8899): 0 erros; lista de projetos `max-width:940px` centrada; no painel, sequencial =
  `ti-arrow-narrow-down` opacity .5 `--text3`, paralela = `ti-corner-down-right` âmbar + badge âmbar. (DOM.)

### 2026-07-20 (xx) — PC da Produção — Header do projeto: barra de % SUBIU pro cabeçalho + "⚠ atrasadas" removido
- Pedido do Diego (screenshot): mover a barra de % pra cima (do canto da linha de sub-abas pro espaço vazio do
  cabeçalho `.proj-normal-header`, à direita) e tirar o "⚠ 4" (contador de atrasadas).
- `headerProgressoHTML` (barra+%) saiu do grupo de ícones da sub-navbar (`tabsHTML`) e entrou no `headerHTML`
  (após a conclusão + spacer, à direita). O `${prog.atrasadas>0?…}` (ícone `ti-alert-triangle` + número) foi
  removido do `headerProgressoHTML`. Lupa/⛶/template/editar CONTINUAM na linha das abas.
- ⚠️ Só o cabeçalho NORMAL muda — o modo FOCO (`focusBarHTML`) tem a própria barra/% inline (não usa
  `headerProgressoHTML`), então não foi afetado.
- VERIFICADO no navegador: 0 erros de console; barra de % dentro do `.proj-normal-header` (10%); sem
  alert-triangle no topo; sub-abas com lupa/foco/template/editar e SEM a barra. (Screenshot trava; DOM.)

### 2026-07-20 (ww) — PC da Produção — Painel de Projeto: LUPA de busca no header (busca AO VIVO em tudo do projeto)
- Diego pediu uma lupa no header (depois do %) que busca dentro do projeto atual — "qualquer coisa, palavra,
  nome, tudo", com resultados aparecendo à medida que digita.
- **`_ppBuscaBtnHTML(p)`** (botão lupa `.reun-ico`) inserido DEPOIS do % nos dois headers: `focusBarHTML` (foco)
  e a linha de sub-abas (normal, após `headerProgressoHTML`).
- **Popover flutuante** (`_ppBuscaAbrir`/`_ppBuscaFechar`, ancorado por getBoundingClientRect; Esc e clique-fora
  fecham) com input + lista de resultados; `oninput="_ppBuscaInput()"` re-filtra a cada tecla.
- **`_ppBuscaColeta(p,q)`** varre: TAREFAS (título/executor/fase/setor/subtarefa), PESSOAS da equipe (dono/coord/
  membros + papel), FASES, SETORES, COMENTÁRIOS (texto/autor), ANEXOS (nome). Agrupado por tipo. Clique:
  tarefa→`openEdit`, fase/setor→seleciona a fase na Visão, comentário→aba Comentários, anexo→aba Anexos, pessoa→Pessoas.
- **Acento-insensível** na busca E no destaque: `_ppBuscaNorm` (NFD + remove U+0300–U+036F + minúsculo);
  `_ppBuscaMark` destaca por índice no texto normalizado (fold 1:1 em comprimento p/ acentos latinos) → digitar
  "adocao" acha E destaca "adoção". ⚠️ O regex de `_ppBuscaNorm` usa os combining chars LITERAIS `[̀-ͯ]` (não
  o escape `̀-ͯ`) — funciona, mas se um editor normalizar o arquivo pode quebrar; se mexer, trocar pelo escape.
- **VERIFICADO no navegador** (HTTP local 8899): 0 erros de console; lupa nos 2 headers; popover abre/fecha;
  "acesso"→5 tarefas, "guilherme"→tarefa+setor, "adocao"→"adoção" destacado; clicar tarefa = `openEdit(<id>)`.
  (Screenshot trava nesta máquina; verificado por DOM.)

### 2026-07-20 (vv) — PC da Produção — MOBILE ganhou o tema Klain (creme + caramelo) + botão de tema cicla 3 temas
- Diego pediu o tema Klain no mobile também. Repo SEPARADO `taskflow-mobile` (commit `34805d1`).
- Novo `body.klain` com os MESMOS valores do app principal (creme `#e9e0ce`, card `#fbf6ec`, caramelo
  `--blue-mid:#9a6a2e`, texto `#392a18`; cabeçalho vira gradiente marrom `#5c3d1f→#9a6a2e→#b0863f`).
- O botão de tema do cabeçalho virou **ciclo de 3** (claro → Klain → escuro), persistido em
  `localStorage['tfm_theme']`; ícone mostra o tema atual (sol / 🍪 `ti-cookie` / lua). `applyTheme` no boot.
- ⚠️ **FAB fica AZUL fixo também no Klain** (`#185FA5→#1a7a8a`, hardcoded), seguindo a preferência do Diego no
  app principal ("FAB azul independente do tema"). Se quiser o FAB caramelo no mobile, é 1 linha.
- Default segue **claro** (Klain é opção, persiste após escolher). VERIFICADO por DOM: 0 erros de console,
  vars/header/FAB corretos, ciclo ok. (Screenshot trava nesta máquina.)

### 2026-07-20 (uu) — PC da Produção — Painel de Projeto (foco): FAB visível, trilha reorganizada (Status/Sair/Finalizar), toggle Etapas/Lista no Planejamento, GESTÃO no tema
- 6 pedidos do Diego (screenshots do Painel de Projeto em modo FOCO):
  1. **Título do grupo GESTÃO na sidebar → tema.** Era o único com cor FIXA (`var(--purple)` roxo) — destoava no
     Klain (caramelo). Trocado por `var(--blue-mid)` no `grupo('gestao',…)` (~10205). GERENCIADOR já era `--blue-mid`
     e as ÁREAS `--text2` (temáticos). ⚠️ Os cabeçalhos de SETOR do Painel (`_setorBloco`) JÁ seguiam o tema
     (`--bg2`/`--blue-mid`/`--text`) — nada a fazer lá; por isso interpretei "títulos dos grupos" = a sidebar.
  2. **FAB (+) aparece no modo FOCO** de reunião E projeto. As regras que escondiam (`body.reun-focus … .fab-create,
     .fab-menu` linha 1506; `body.proj-focus …` linha 1565) perderam o `.fab-create`/`.fab-menu`. FAB já é azul fixo.
  3. **Planejamento (Visão) ganhou toggle "Por setor/etapa" × "Lista"**, igual à aba Tarefas. Estado por projeto em
     `sessionStorage['pp-plan-lista-<id>']`. Lista = todas as tarefas da fase na ordem da esteira, sem agrupar por
     setor, com "+ Nova tarefa nesta fase" (`quickAddTaskPro(…,faseId,'')` → "Geral" ou sem setor). Agrupado (padrão)
     = como era + "+ Novo setor". Fica no `else` de `detalheBloco` em `renderProjectProVisao`.
  4-6. **Trilha do FOCO (`_projFocusRailHTML`, ~25110) reorganizada:** Sair saiu do TOPO → RODAPÉ (acima de
     Finalizar); o **Status** entrou logo ACIMA do Sair (botão de trilha `_projToggleStatus`, ativo↔pausado, cor/ícone
     do estado). E o status SAIU do cabeçalho de foco (`focusBarHTML` — removido `_projStatusBtnHTML(p,true)`).
     ⚠️ O cabeçalho NORMAL (fora do foco) MANTÉM o status — lá não há trilha, é o único controle.
- **VERIFICADO no navegador** (HTTP local 8899): **0 erros de console**; GESTÃO computa `--blue-mid`; trilha do foco
  sai como Painel→…→Editar→**Em andamento**→**Sair**→**Finalizar**; barra de foco SEM status; FAB `display:flex` em
  proj-focus E reun-focus; toggle do Planejamento alterna agrupado (2 setores + "Novo setor") ↔ lista (0 cabeçalhos
  de setor, lista plana + "add tarefa na fase"); clicar no status da trilha alterna ativo→pausado e o rótulo segue.
  (Screenshot trava nesta máquina — verificado por inspeção do DOM.)

### 2026-07-20 (tt) — PC da Produção — MOBILE reativado: aba Projetos + Participantes/presença na reunião
- ⚠️ **O `taskflow-mobile` estava CONGELADO** (nota de 02/07). O Diego **pediu explicitamente** pra mexer, então a
  exceção da regra foi acionada. **Repo SEPARADO** (`G:\g_Diego\HTML\taskflow-mobile`, ~44KB, localStorage `tfm_*`) —
  NÃO é este git. Publicado em https://dkonrad88.github.io/taskflow-mobile/ . Commit lá: `9ec5946`.
- ⚠️ **Descoberta:** o mobile JÁ tinha ganhado (depois do congelamento, por outra máquina) uma **aba Reuniões**
  (condutor: pauta/tarefas/decisões/ATA) e **menu hambúrguer + drawer** (commits `9420b98`/`6312914`). Dei
  `git pull --ff-only` no repo mobile (estava 2 commits atrás) antes de mexer.
- **Pedido do Diego (2 partes), escopo confirmado por pergunta:** (1) **alinhar Reuniões** → escolheu **Participantes +
  presença** (pauta/tarefas/decisões/ATA já existiam); (2) **aba Projetos** → escolheu **Lista → tarefas do projeto**.
- **Reuniões — Participantes/presença:** modelo ganhou `r.participantes[]` + `r.presentes[]` (seed + normalização no
  `loadStore` + `addReuniao` auto-inclui o criador `ME`). Seção no topo do `renderReunPanel`: lista quem participa,
  `<select>` "+ Adicionar participante", e um check por pessoa = **presença** (rótulo "N/M presentes", concordância
  singular/plural). Funções `reunAddParticipante`/`reunRemoveParticipante`/`reunTogglePresenca`. Card da lista mostra o total.
- **Projetos (aba nova, no drawer entre Amanhã e Reuniões):** `MTABS` ganhou `{id:'projetos'}`; painel `#p-projetos`.
  `projCard` (barra de progresso) → `openProjeto(i)` abre `#psheet` (tela cheia, espelha `#rsheet`) com `renderProjPanel`:
  % + tarefas do projeto (`projTasks` = tasks com `origem.tipo==='projeto'` && nome), concluir inline recalcula o %, e
  `projAddTarefa` cria tarefa no projeto. Projetos = a lista fixa `PROJETOS` (3 nomes do mockup). `closeSheets` fecha o `psheet` também.
- **VERIFICADO no navegador** (HTTP local 8898 — sem Python/Node, HttpListener em PowerShell): **0 erros de console**;
  abrir projeto e concluir tarefa foi **0/1 → 1/1 (100%)**; marcar presença atualizou **"0/3 presentes" → "1/3 presente"**.
  (Screenshot do Browser pane trava nesta máquina — verifiquei por inspeção do DOM.)
- ⚠️ **NÃO fiz CRUD de projeto no mobile** (`PROJETOS` é lista fixa; o Diego pediu "lista → tarefas", não criar projeto).
  Dado do mobile é **por aparelho** (`tfm_*`), não sincroniza com a nuvem nem com o app principal — é protótipo de UX.

### 2026-07-20 (ss) — PC da Produção — Header do projeto: tira "feitas/total" (0/21), mantém barra de %, conclusão prevista vai pro MEIO do header
- Pedido do Diego (screenshot da faixa de progresso do projeto): (1) tirar o "0/21" (`feitas/total`);
  (2) manter a barra de %; (3) mover o "13 de ago. · no prazo/folga" (a conclusão prevista, `_ppConclusaoHeader`)
  para o **meio do header principal** (o `.proj-normal-header`, que tinha só o título "Projeto — nome" à esquerda
  e um monte de espaço vazio no meio).
- **3 edições em `renderProjectProView`:**
  1. `headerProgressoHTML` (~25746, linha das sub-abas): removido o `<span>· feitas/total</span>` e removido o
     `_ppConclusaoHeader` que ficava grudado no fim. Sobrou barra + `%` (+ badge de atrasadas, se houver).
  2. `headerHTML` principal (~25836): a flex row virou **título à esquerda (`flex:1`) · conclusão · spacer
     (`flex:1`)** — a técnica dos dois `flex:1` centraliza a conclusão de verdade. `_ppConclusaoHeader` só
     renderiza quando `prog.total>0`, então projeto sem tarefa não muda em nada.
  3. `focusBarHTML` (~25824, modo foco): tirado o `· feitas/total` também e adicionado um `flex:1` depois da
     conclusão pra centralizá-la — no foco o header principal fica `display:none`, então a conclusão PRECISA
     continuar aparecendo na barra de foco (por isso não removi de lá, só centralizei).
- **VERIFICADO no navegador** (servido via HTTP local — esta máquina não tem Python/Node, subi um HttpListener
  em PowerShell na 8899; `file://` foi bloqueado pelo Browser pane): app bootou com **0 erros de console**
  (sintaxe intacta); abri o projeto-semente e medi a geometria — **`desvioDoCentro:0`** (centro da conclusão =
  centro da linha, centralização perfeita), **nenhum "/21" na página**, barra de % presente, **sem overflow
  horizontal**. Screenshot travou (página ~2MB deixa o renderer lento), mas a medição por bounding box é prova
  mais precisa que a imagem.
- Só layout (template strings) — 6 linhas trocadas em index.html. Sem mudança de dado/lógica.

### 2026-07-19 (rr) — Mac de casa — Removido o título "📋 Painel de Reunião" do topo
- Pedido do Diego (screenshot): tirar o `<h2>` "📋 Painel de Reunião" que ficava no topo do painel,
  abaixo do "← Voltar às reuniões". Redundante — o "Voltar às reuniões" já dá contexto e o próprio painel
  já mostra "Reunião — <nome>" logo abaixo.
- **Como:** o `#tab-title` é COMPARTILHADO por todas as telas. Em vez de esvaziar (deixaria um gap do h2),
  escondi com `display:none` no `openReuniaoView` (`~31853`) e **reexibo** (`display=''`) no
  `renderReunioes` (`~29814`), que é por onde o botão "Voltar" e o re-render passam. Sem o 2º passo o título
  "📅 Reuniões" ficaria preso escondido ao voltar à lista — **testei os dois caminhos no navegador**:
  no painel `tab-title` fica `display:none`/h=0 e `tab-back` visível; ao voltar, `tab-title` volta a
  `block`/"📅 Reuniões". `changeTab` (troca de aba pelo menu) já reexibia sozinho (`15298`), não precisou tocar.
- ⚠️ Armadilha do preview (anotar p/ não cair de novo): ao forçar `hubView='taskflow'` via console, o
  `.topbar` fica com o `display:none` que o BOOT aplica no Meu Dia (`34474`) — o topbar todo some e parece
  que o "Voltar" sumiu. No app real ele está visível. No teste, forçar `.main .topbar{display:''}` antes.
- jsc SYNTAX_OK. 2 linhas trocadas em index.html.

### 2026-07-19 (qq) — Mac de casa — Card "Editar reunião" ganha o header escuro (igual às outras abas) + 3 ideias do Painel de Reunião DESCARTADAS
- Pedido do Diego (com screenshot): "todas as abas têm um fundo mais escuro no título do card, só o Editar
  não; pode fazer igual". Correto — o card **Editar reunião** (`renderNovaReuniaoForm`, `~31044`) usava
  estilo INLINE próprio (`background:var(--card)`, título como texto solto), enquanto Info/ATA/Pessoas/
  Anexos usam a classe **`.reun-card4`** + **`.reun-card4-title`** (`1598`/`1603`), cujo título é uma faixa
  `--bg2` de ponta a ponta (margem negativa + `border-bottom`).
- **Correção:** troquei o `<div>` inline do card pela classe `.reun-card4` e o título por
  `.reun-card4-title`. Ficou **idêntico** por construção (mesma classe), não só parecido — de quebra alinha
  o fundo do corpo (`--surface-painel`) com as outras abas e remove estilo inline duplicado.
- **Testado no navegador (tema Klain):** header do Editar = `rgb(225,213,188)` = `#e1d5bc` = **exatamente**
  o `--bg2` do tema, borda inferior = `--border`. jsc SYNTAX_OK. Print conferido.
- ⚠️ **DECISÃO DO DIEGO:** as 3 ideias do Painel de Reunião — (a) "Ficou de fazer"/combinados pendentes da
  série, (b) assunto da pauta → tarefa/decisão em 1 clique, (c) foco no assunto + tempo gasto — foram
  **DESCARTADAS** ("não irei fazer nenhum"). **NÃO reoferecer.** (As 3 de Projeto já tinham veredito:
  radar reprovado, alerta preditivo aprovado/feito, carga foi p/ a Análise.) O Painel de Reunião está
  fechado do ponto de vista de features novas — resta só a fila de BUGS da varredura.

### 2026-07-19 (pp) — Mac de casa — Análise virou DASHBOARD + carga por pessoa + 🐞 BUG do setAnaliseView
- Pedido do Diego: "transforme a Análise em formato de painel/dashboard, com todos os indicadores
  relevantes ao longo da tela central".
- **Antes:** 4 KPIs + **sub-navegação de 3 abas** (Geral · Planejado × Realizado · Por executor/setor/fase)
  → via-se **1/3 da informação por vez**, numa largura de 1040px.
- **Agora:** tudo na tela, sem sub-abas, em `_bodyMax` de **1600** (era 1040):
  KPIs → linha do tempo → **3 colunas** (Por executor · Por etapa · Por parte) → Onde travou / Onde
  ganhamos → Planejado × Realizado. Grid `repeat(auto-fit,minmax(336px,1fr))`.
  ⚠️ O 336px foi **medido**, não chutado: a `.proj-body` tem ~1094px reais (a sidebar come o resto dos
  1600), então (1094−2×18)/3 ≈ 352px. Com 370px o grid caía p/ 2 colunas.
- ⭐ **CARGA POR PESSOA** (a 3ª ideia de painel, que o Diego pediu p/ ficar aqui e não no Painel):
  o "Por executor" ganhou a coluna **"agora"** — quantas tarefas a pessoa tem LIBERADAS neste momento
  (`_ppStatus` ≠ bloqueada), ao lado do histórico que já existia. Corrige 2 cegueiras: quem está **livre**
  não aparecia (só entrava quem tem tarefa com prazo — agora as pessoas de `p.pessoas` sem tarefa entram
  no fim da lista) e **"sem responsável"** não existia em lugar nenhum.
- 🐞 **BUG REAL encontrado e corrigido de quebra:** existiam **DUAS `setAnaliseView`** no arquivo —
  a de `~15873` (aba **Análise geral** do app: `_analiseView` = pessoal/equipe/reuniões) e a da Análise
  do PROJETO (`activeAnaliseView` = geral/dias/areas). **A segunda sobrescrevia a primeira**, então clicar
  em Pessoal/Equipe/Reuniões na Análise geral setava a variável errada e **a tela não trocava de view**.
  Comprovado no navegador ANTES de mexer (`setAnaliseView('equipe')` deixava `_analiseView='pessoal'`).
  Como o dashboard eliminou a sub-navegação do projeto, a função e a variável dela saíram — e a Análise
  geral voltou a funcionar (testado depois: `_analiseView` passa a receber o valor).
  ⚠️ Era um dos "defs duplicadas" que o inventário da varredura (18/07) tinha listado e eu havia
  descartado como escopo local. **Não era.** Vale reolhar os outros nomes daquela lista.
- Removido junto: `porAreaHTML` (ficou órfão com o novo layout). 0 sobras, jsc SYNTAX_OK, 0 erros.

### 2026-07-19 (oo) — Mac de casa — Painel: ETAPAS (setores) também recolhem
- Pedido do Diego: poder recolher/expandir cada ETAPA na coluna do meio do Painel (com várias etapas
  a coluna fica longa). Feito em `_setorBloco` (dentro de `renderProjectProVisao`).
- ⚠️ **Semântica INVERTIDA em relação aos cards da coluna 1, de propósito:**
  - **Card** ("Acontecendo agora") nasce **FECHADO** → a chave presente em `_ppCardCol` significa ABERTO.
  - **Etapa** nasce **ABERTA** → a chave presente significa RECOLHIDA.
  É o comportamento certo p/ cada um: o card é resumo (só abre quem quer ver), a etapa é o conteúdo de
  trabalho (fechar é a exceção). Mesmo storage `taskflow_pp_card_col`, com prefixo `etapa·` p/ não colidir
  com as chaves `projeto·card`. Funções: `_ppEtapaRecolhida(gid)` / `_ppToggleEtapa(gid)`.
- Recolhida, o cabeçalho mostra **"feitas/total"** (continua informando) e o **campo "Nova tarefa" some**
  junto — digitar dentro de algo fechado não faz sentido.
- VERIFICADO: nasce aberta; clique recolhe e persiste no localStorage; etapas são independentes entre si;
  o `qa-pp-<gid>` da recolhida some do HTML e o da aberta permanece; o "Acontecendo agora" mantém a
  semântica dele (segue nascendo fechado). 0 erros de console, jsc SYNTAX_OK.

### 2026-07-19 (nn) — Mac de casa — ALERTA PREDITIVO DE PRAZO (2ª ideia de painel, esta APROVADA)
- Depois do Radar reprovado (entrada mm), o Diego escolheu esta. **Lição aplicada: nada de bloco novo** —
  o alerta vive DENTRO do chip que o cabeçalho já tem. Projeto em dia: a tela não muda em NADA.
- **O que já existia:** `_ppConclusaoHeader` calcula a previsão (`_ppProjecao`), compara com `p.prazoFim` e
  já pintava "4d de folga" (verde) ou "3d após o prazo" (vermelho). Faltava perceber a VIRADA e dizer a CAUSA.
- **Implementado:**
  - `_ppFimPrevisto(p)` / `_ppFolgaDias(p,fim)` / `_ppPrazoSnap(p)` — helpers de leitura.
  - `_ppChecarVirada(p, antes, causa)` — grava `p.virada` **só quando a folga CRUZA a fronteira** (era ≥0,
    virou <0). Oscilar dentro da folga não é notícia; avisar a cada ajuste faria virar ruído. E quando
    volta p/ dentro do prazo, **apaga `p.virada` sozinho** (testado) — o aviso não fica grudado.
  - Interceptado em `_ppSetDias` e `_ppToggleParalela` (tira uma foto do prazo ANTES, compara DEPOIS).
  - `_ppPorQuePrazo(projectId)` — o modal do "por quê?".
- ⚠️ **Registrado nas AÇÕES, nunca no render.** Render que escreve no banco foi exatamente o bug P0 nº1
  desta base (`renderProjectProTarefas` reescrevendo `t.date`). Não repetir o padrão.
- ⭐ **As DUAS causas são distinguidas** — é o ponto da feature:
  - **(a) alguém mexeu** → `p.virada` tem tarefa, o que mudou, quem e quando.
    Testado: "DECIDIR: estratégia para operadores · duração de 1 para 12 dias · por Diego Konrad".
  - **(b) o tempo passou** → sem `p.virada`, calcula na hora (não persiste): "Ninguém mudou o cronograma.
    'Preparar acessos — Onda 1' está liberada há 9 dias sem concluir — a data foi ficando para trás sozinha."
    Sem essa distinção o aviso apontaria culpado errado, que é pior que não apontar nenhum.
  - **(c) nasce estourado** → nem virada nem parada: "A soma das durações não cabe no prazo final."
- VERIFICADO no navegador nos 3 caminhos + o ciclo completo (estourar → registra e mostra o chip;
  desfazer → limpa a virada e o chip some). 0 erros de console, jsc SYNTAX_OK.
- Campo novo no modelo: **`p.virada`** (um objeto por projeto, sobrescrito; NÃO é histórico).

### 2026-07-19 (mm) — Mac de casa — Radar de travamento REMOVIDO (testado e reprovado) · recolher fica
- ❌ **O "Radar de travamento" da entrada (ll) foi REMOVIDO** — Diego testou no ar e disse "não gostei".
  **NÃO reimplementar** sem ele pedir. A ideia (mostrar o que trava o projeto: quantas tarefas esperam pela
  etapa da vez, há quantos dias está parada, quantas sem responsável) está descrita na entrada (ll) e no
  chat de 19/07 — se um dia voltar, o cálculo está lá; mas o veredito do dono, com a coisa funcionando na
  tela dele, foi negativo. Removido por completo: 0 sobras de `radarBloco`, `RADAR_DIAS_PARADA`, `_travadas`,
  `_semDono`, `_diasDesde` (conferido por grep).
- ✅ **O que FICOU:** o "Acontecendo agora" segue **recolhível**, com o resumo no cabeçalho quando fechado
  ("Etapa 3 de 21 · Preparar acessos — Onda 1"). A infra (`_ppCardCol`/`_ppCardAberto`/`_ppToggleCard`/
  `_ppCardHead`, persistida em `taskflow_pp_card_col`) permanece e é **genérica** — dá p/ tornar qualquer
  card do Painel recolhível chamando `_ppCardHead` com outra chave.
- Lição registrada: a ideia foi validada em mockup, implementada, testada no navegador e **ainda assim
  reprovada no uso real**. Mockup aprova conceito, não aprova utilidade — o teste no ar é que decide.

### 2026-07-19 (ll) — Mac de casa — Painel: RADAR DE TRAVAMENTO + cards recolhíveis
- 1ª das 6 ideias de painel que levantei p/ o Diego (ele escolheu esta p/ testar).
- **Radar de travamento** (`renderProjectProVisao`, junto do `comandoBloco`): responde "por que NÃO anda?",
  que o "Acontecendo agora" (o que ESTÁ liberado) não responde. Três sinais, todos de dado que já existia:
  1. ⭐ **Quantas tarefas esperam pela etapa da vez** — a esteira é sequencial, então tudo em etapa maior
     está parado por causa das da etapa mínima. No projeto-semente: **18 esperando "Preparar acessos — Onda 1"**.
     Mostra também as 3 primeiras que ela segura ("Segura: … +15").
  2. **Há quantos dias está parada** — `hoje − ppLiberadaEm`, limiar em `RADAR_DIAS_PARADA=3` (3 dias engole
     o fim de semana sem acusar todo mundo na segunda).
  3. **Sem responsável no projeto inteiro** — com a nota de que **não entram na aba Atrasadas de ninguém**
     (o `getAtrasadas` termina com `&& (!t.projectProId || t.executor)`, achado na varredura de 18/07).
  O card **só aparece quando há algo a reportar** — projeto em dia não ganha caixa vazia (testado).
- **Cards recolhíveis** (`_ppCardCol`/`_ppCardAberto`/`_ppToggleCard`/`_ppCardHead`, persistidos em
  `taskflow_pp_card_col`): "Acontecendo agora" e "Radar" nascem **RECOLHIDOS**, a pedido do Diego.
  ⚠️ **Por isso o cabeçalho leva um RESUMO** — fechado, ele ainda informa ("Etapa 3 de 21 · Preparar acessos"
  / "18 esperando · 1 parada · 19 sem dono"). Um radar que precisa ser aberto p/ avisar não avisa nada.
  O resumo some quando o card abre (vira eco do conteúdo logo abaixo).
- **2 ajustes feitos DEPOIS de ver na tela** (nenhum apareceu na leitura do código):
  - O cabeçalho em 1 linha quebrava em cascata na coluna 1, que é estreita → virou grid de 2 linhas, com o
    resumo recuado e alinhado ao título, não ao chevron.
  - "1 parada — Preparar acessos" repetia o nome que o destaque já mostrava. **Não era coincidência:** as
    paradas são sempre as tarefas da etapa da vez, ou seja, sempre as do destaque. "Parada há N dias" e
    "sem responsável" viraram QUALIFICADORES dentro do destaque. A linha própria de "parada" só sobrou p/ o
    caso de não haver travadas (última etapa), senão o card ficaria vazio.
- VERIFICADO: recolher/expandir persiste no localStorage; projeto 100% concluído não renderiza o radar;
  com todas as tarefas atribuídas e recém-liberadas, somem os sinais 2 e 3 e fica só o travamento (os três
  são independentes). 0 erros de console, jsc SYNTAX_OK.

### 2026-07-19 (kk) — Mac de casa — Paleta: Projetos e Reuniões passam a seguir o TEMA · FAB sempre azul
- **A mecânica do problema** (vale entender antes de mexer): no tema Klain `--blue-mid` vira `#9a6a2e`
  (caramelo), mas **`p.cor` — a cor escolhida do projeto — tem default `#185FA5`, o azul do tema padrão, e
  NÃO é variável**. Resultado: tudo desenhado com `var(--blue-mid)` ficava marrom e tudo com `p.cor` seguia
  azul, lado a lado na mesma tela. O mesmo com os hexes fixos de `PP_TIPOS_BASE`.
- **REGRA aplicada:** texto/título/chip → **var do tema**; `p.cor` sobrevive só onde é IDENTIDADE do projeto
  (barra de progresso, borda-esquerda 3px, ícone do tipo, avatar, o destaque de 7% da tarefa em andamento e
  o seletor de cor). Assim a cor ainda distingue projetos na lista, sem gritar dentro da tela.
- **Projetos (10):** título de grupo da lista (era `g.color`, hex fixo de `PP_TIPOS_BASE` — o "título em azul"
  mais visível), nome da fase no card de Tarefas, os **3 `%` grandes** (15px/800), os 2 botões primários
  sólidos que usavam `background:${p.cor}`, badges de Etapa, chip de conclusão da fase, dropdowns de
  Fase/Setor e `PP_STATUS.planejamento` (`#888` → `var(--text3)`).
- **Reuniões (9):** pills `.reun-status-agendada` (fundo `#e8f1fa` FIXO com texto temático por cima — no Klain
  dava caramelo sobre azul-bebê) e `.reun-status-encerrada`; card "Próxima reunião"; `REUN_STATUS.encerrada`
  (`#666`); chips do mural; presença baixa; grupo "antigas"; categoria "Outro"; banner "modelo pronto".
- **FAB:** fixado em `linear-gradient(#185FA5,#1a7a8a)` **hex literal de propósito** — usava `var(--blue-mid)`,
  que vira VERDE no tema Brasil e MARROM no Klain. É o único elemento que NÃO acompanha o tema (pedido do
  Diego). O estado `.open` (vermelho) segue temático.
- **Campo Cor** do Editar projeto: era `width:100%;height:38px` (um banner de cor, a coisa mais chamativa do
  modal) → disco de **34px** com a legenda "Identifica o projeto nas listas".
- ⚠️ **REGRESSÃO MINHA, pega e corrigida no teste:** ao trocar as pills por `color-mix`, removi os 4 overrides
  `body.dark` achando que tinham virado redundantes. **Não tinham** — no escuro as vars de acento são tons
  médios pensados p/ fundo claro, e o contraste do texto caiu para **3.11** (ilegível). Repus os overrides,
  mas agora **clareando a própria var** (`color-mix(var(--blue-mid) 45%, #fff)`) em vez dos hexes fixos que
  estavam lá — assim continua temático. Medido nos 5 temas: escuro **6.46**, meia-noite **7.47**, claro 6.52,
  Klain 4.36, Brasil 3.61 (os 2 últimos no limite de AA para bold).
- **2ª passada (mesmo dia):** o `#e8f1fa` (azul-bebê fixo) sobrevivia em **mais 7 componentes** que aparecem
  nessas abas — hover das ações da lista de reuniões (`.kanban-edit-btn`), `.attach-chip`, `.task-due`,
  `.quick-date-btn`, `.rec-opt.active`, `.task-act-btn.edit` e `.proj-status-planejamento` — todos trocados
  pelo mesmo `color-mix`. Mais o pill de contagem do grupo (`${g.color}22`) e o override dark do status.
- VERIFICADO por varredura do DOM renderizado no tema Klain: **sobraram exatamente 2 elementos azuis** no
  conteúdo — o ícone do tipo do projeto e a barra de progresso, que são IDENTIDADE e devem ficar mesmo.
  Títulos de fase saem em `rgb(106,86,55)` = o `--text2` do tema (antes `#185fa5`). jsc SYNTAX_OK, 0 erros.

### 2026-07-19 (jj) — Mac de casa — Fecha o alinhamento + as 4 duplicações que dependiam de decisão
- O Diego delegou as 4 decisões abertas do (ii) ("você decide o que fica melhor"). Critério de cada uma:
  1. **Nome do projeto 2×** → tirei do **breadcrumb**, mantive o título do corpo. Motivo: o corpo tem ícone
     do tipo, botão de status e peso visual; o breadcrumb vira navegação pura ("← Projetos"). E é o padrão
     que o **Painel de Reunião já usava** (topbar = "📋 Painel de Reunião", nome só no corpo) — o Projeto era
     a exceção. Agora as duas telas seguem a mesma regra.
  2. **Aba Info** → saíram os cards **Tarefas** e **Atrasadas**. O "Tarefas" repetia o `feitas/total` do
     `progressoCard` **da própria aba** (duplicação interna, a mais indefensável) e os dois já estão no
     cabeçalho. Ficaram: infoCard, **statusCard**, Pessoas (não existe no cabeçalho) e progressoCard, que
     consolida barra + % + feitas/total + conclusão numa leitura só.
  3. **4 cards do topo da Análise** → **MANTIDOS**. Ali eles formam um conjunto comparativo (Prazo planejado
     × Previsão × Saldo × Progresso); tirar 3 por "repetir o cabeçalho" quebraria a leitura do conjunto.
  4. **Fase selecionada** → tirei `feitas/total` + barra do DETALHE, mantive o `%`. Na coluna Estrutura eles
     ficam, porque lá servem p/ COMPARAR as fases entre si; no detalhe eram eco a 34px de distância.
- **Listas restantes alinhadas:** "Acontecendo agora" + "Próximas a liberar" (mesmo grid `30px 1fr` — o
  número hierárquico "1"/"3.2"/"10.1" e o cadeado tinham larguras diferentes e as 2 listas irmãs não casavam
  entre si); as **3 da aba Análise** com o MESMO badge de 104px; `reunSerieHeaderHTML`; e
  `_reunHistoricoInlineHTML` (o botão "Abrir" não existe na reunião atual → virou `<span></span>`).
- VERIFICADO no navegador: topbar mostra só "Projetos" e o nome sai 1× (no corpo); aba Info sem os 2 cards,
  **com o `pp-status-badge`** e — o teste que importava — **`abrirMenuStatusProjeto` ABRE o menu completo**
  (Planejamento/Em andamento/Pausado/Concluído), que era o risco de mexer ali. 0 erros de console, jsc OK.

### 2026-07-19 (ii) — Mac de casa — Alinhamento em COLUNAS (Projetos + Reuniões) e 4 duplicações removidas
- Continuação do (hh). Duas varreduras mapearam **17 listas desalinhadas** e **8 duplicações**. Aplicado:
- **Alinhadas (grid de colunas fixas):**
  - **Lista de PROJETOS** (`projectProRowHTML`): `minmax(0,1fr) 104px 140px 58px 92px 26px`. O chip de status
    não tinha largura (Planejamento × Em andamento × Concluído empurravam a barra) e o chip de prazo some
    quando o projeto não tem `prazoFim` — agora a célula segura a coluna sozinha.
  - **Lista de REUNIÕES** — ⚠️ são **3 funções que se INTERCALAM na mesma lista**: `reunListItemHTML`,
    `reunCompromissoItemHTML` e `reunRapidaItemHTML`. As 3 receberam o MESMO grid
    `96px 64px minmax(0,1fr) 76px 92px`. O chip "Agora"/"Rápida" só existe na 1ª → nas outras 2 vai
    `<span></span>`; e a 1ª tem 2 botões contra 3 das outras → ganhou espaçador de 28px. **Mexeu numa, mexa
    nas três** (comentário no código).
  - **Decisões tomadas** (`_reunDecisoesListHTML`): a data só existia em algumas e o × some quando encerrada
    → as 2 células agora são sempre emitidas.
  - **Anexos** (reunião `renderAnexos` + projeto `_projAnexosLista`): mesma linha nas duas telas, mesmo grid
    `18px minmax(0,1fr) 62px 22px`. O tamanho vira `''` quando falta e a lixeira encostava no nome.
  - **Form "nova tarefa" da reunião**: usava `18px 1fr 140px 132px` enquanto a lista logo ACIMA dele
    (`tarefaRow`) usa `18px minmax(0,1fr) 112px 96px 26px` — o form ficava torto em relação às linhas que
    ele mesmo cria. Igualado (+ célula da lixeira no header e no corpo).
- **Duplicações removidas (as seguras):**
  - `projecaoBloco` do Painel: "Todas as tarefas concluídas" aparecia **2× na mesma coluna** (o card verde do
    "Acontecendo agora" dispara na mesma condição) — e 3× quando havia `preFecharEm`. Ficou o card.
  - "Fases **do projeto**" → só "Fases" (a sub-aba e o cabeçalho já dizem onde se está).
  - Contagem no card de Anexos do Painel (a sub-aba já mostra "Anexos (N)").
  - ⭐ **`_insightsHTML` MORTO removido (23 linhas)** — erro MEU do commit `2f8e31f`: ao tirar os chips do topo
    eu deixei o bloco sendo montado e escrevi um comentário dizendo que "o modo FOCO ainda usa". **Estava
    errado** — o modo foco usa o mesmo `filtrosHTML`. Comentário corrigido.
- 🚫 **NÃO removidas de propósito (risco real, documentado pela varredura):**
  - **Card de Status da aba Info** — é o único `id="pp-status-badge"` do app e `abrirMenuStatusProjeto` faz
    `if(!badge) return`. Sem ele, **fica impossível voltar o projeto p/ "Planejamento" ou "Arquivado"**.
  - **Os 2 contadores de presença da Reunião** — só coincidem em *modo foco × aba Pessoas*; fora do foco o
    cabeçalho não tem contador, e no foco a aba Pessoas é que não aparece. Cada um é único no seu contexto.
  - **"Conclusão prevista" da Info** quando o projeto está concluído: vira "Concluído em: <data real>", que
    não existe em nenhum outro lugar.
- ⏳ **FALTA (mapeado, não aplicado):** listas de MÉDIA/BAIXA — "Acontecendo agora"/"Próximas a liberar"
  (número hierárquico sem largura), as 3 listas da aba **Análise** (badge deve ter os mesmos 104px nas três),
  `_ppLinha` e os statCards da **Info**, `reunSerieHeaderHTML`, `_reunHistoricoInlineHTML`, "Decisões
  anteriores" e `_reunDecisoesSerieInlineHTML`. E as duplicações que **dependem de decisão do Diego**: nome do
  projeto 2× (breadcrumb × título do corpo), quanto da aba Info enxugar, os 4 cards do topo da Análise, e o
  `feitas/total`+barra repetidos entre a fase selecionada e o detalhe.

### 2026-07-19 (hh) — Mac de casa — Aba Partes/Fases: colunas alinhadas · sem chips de etapa · sem coluna Projeto duplicada
- Diego pediu (1) tirar os chips de ETAPA da linha da parte, (2) alinhar as informações como COLUNAS em
  toda a aba Projetos e toda a aba Reuniões, (3) tirar a coluna com o nome do PROJETO de dentro das etapas
  (já se está dentro do projeto) e (4) revisar as 2 abas atrás de informação duplicada.
- **Feito nesta entrada (itens 1 e 3 + a lista de fases do item 2):**
  - `renderProjectProFases`: a linha era `display:flex;flex-wrap:wrap` → virou **grid de colunas fixas**
    (`_ppFasesCols` = `minmax(0,1fr) 58px 118px 48px [132px]`). A célula do PRAZO é sempre emitida, vazia
    quando a fase não tem prazo — antes ela sumia e empurrava `%` e ações p/ a esquerda só nessas linhas.
    Os botões ↑/↓ ausentes na 1ª/última fase viraram um espaçador de 25px pelo mesmo motivo.
  - Chips com o nome de cada etapa **removidos** da linha (eram de largura variável e empurravam tudo).
  - **`renderTaskTable(taskList, opts)` ganhou `opts.ocultarProjeto`**, propagado p/ `tableRowHTML(t, opts)`.
    `renderFaseExpandida` passa `{ocultarProjeto:true}` → dentro de uma etapa a coluna "Projeto" some.
    Todas as outras chamadas seguem sem `opts` e inalteradas.
- VERIFICADO no navegador: com `fieldPrefs.projeto=true`, a tabela genérica sai com **10 colunas e repete
  "Implantação do Hub Klain"** em toda linha; dentro da etapa sai com **9 colunas e sem o nome**. Na aba
  Fases, as 7 linhas alinham contagem/prazo/% mesmo com 3 fases SEM prazo. jsc SYNTAX_OK.
- ⏳ **Falta**: o resto do item 2 (demais listas das 2 abas) e o item 4 (duplicações) — 2 varreduras rodando.

### 2026-07-19 (gg) — Mac de casa — Painel: destaque da tarefa atual · Comentários sem fundo · Anexos na col 1 · pauta sem modelos
- 4 ajustes de UI pedidos pelo Diego:
  1. **Tarefa QUE ESTÁ SENDO FEITA fica destacada** no card do Painel (`_tarefaLinha`): fundo a 7% +
     faixa de 3px (`box-shadow:inset`) na borda esquerda. Usa a **cor do próprio projeto** (`p.cor`),
     então acompanha o tema — nada fora da paleta. Vermelho (`--danger`) quando está atrasada.
     "Sendo feita" = liberada e não concluída (`_ppStatus` = `hoje`/`atrasada`); bloqueada e concluída
     ficam neutras.
  2. **Comentários (col 3) sem card/fundo**: saiu o `_ppBloco` e o fundo do feed. Agora usa só
     `_ppTituloCol`, igual a "Estrutura" (col 1) e ao título da fase (col 2) → as 3 colunas alinham no topo.
  3. **Campo de novo comentário discreto**: era pill com fundo `--bg2` + botão redondo sólido; virou uma
     linha só (`border-bottom`, fundo transparente) e o botão de enviar ficou fantasma (só o ícone, com
     hover suave). A borda inferior acende com `p.cor` no foco.
  4. **ANEXOS desceu p/ a coluna 1**, logo abaixo de "Acontecendo agora" (era o último bloco da col 3).
  5. **Painel de Reunião: a pauta NÃO sugere mais modelos** — saíram o texto "Começar de um modelo" e os
     chips (1:1, Daily, Semanal, Retrospectiva, Kickoff, Planejamento). A pauta começa em branco.
- VERIFICADO no navegador: destaque aparece na tarefa certa ("Preparar acessos — Onda 1", estado `hoje`);
  ordem no DOM da col 1 conferida por script (Estrutura → Acontecendo agora → Anexos); col 3 só com
  Comentários; comentários criados pelo caminho REAL (`enviarProComment`), não injetados à mão; pauta da
  reunião sem nenhum vestígio de modelo. 0 erros de console, jsc SYNTAX_OK.
- ✅ **Regra de papéis CONFERIDA (nada a mudar):** `_setPapelProjeto` já garante **1 dono** (o anterior cai
  para leitor), **2 coordenadores** (`coordenador` + `coordenador2`) e **leitores sem limite**.
  ⚠️ Detalhe: ao promover um 3º coordenador, ele **substitui o 2º silenciosamente** (`else p.coordenador2=pid`),
  sem avisar. A regra é respeitada, mas o usuário não entende o que aconteceu — candidato a um toast.
  ⚠️ Os botões "1º Coord."/"2º Coord." que aparecem no código (~`27417`) estão dentro de `abrirModalEquipe`,
  que é **função MORTA** — a tela viva é `renderProjectProPessoas`, que usa os 3 ícones de papel.

### 2026-07-19 (ff) — Mac de casa — Aba TAREFAS do projeto: virou CARDS (modelo do Painel) e enxugou
- 6 pedidos do Diego, todos na `renderProjectProTarefas`:
  1. **Topo enxuto:** saíram os chips "N tarefas · M concluída", "Conclusão prevista", "No prazo (+Xd)" e
     "Etapa X de Y" — **já estão no cabeçalho do projeto**, era a mesma info 2× na mesma tela. Sobrou só
     Planilha/Foco. (`_insightsHTML` continua montado: o modo FOCO ainda usa.) O rodapé também perdeu a
     "Conclusão prevista" duplicada; ficou só a legenda de arrastar.
  2. **Flecha de dependência = mesma do Painel:** `ti-arrow-down-right` (depende) / `ti-arrows-split-2`
     (paralela). Antes esta tela usava `ti-arrow-merge`/`-both`, um par diferente p/ a mesma ideia.
  3. **Mini-Gantt removido** da coluna Previsão (a barrinha ao lado da data) — a info já está no "ini → fim".
  4. **"Recolher/Expandir todas" saiu da barra** — agora cada CARD recolhe pelo próprio cabeçalho (chevron).
     `_ppToggleTodasFases` continua existindo (a aba Fases usa).
  5. **Coluna Prioridade removida** da planilha (+ o `const prioMap` que ficou órfão).
  6. **Cards com respiro:** cada fase virou um card independente (borda + cantos + `margin-bottom:10px`),
     no lugar da tabela contínua com header de fase dentro. É o modelo do Painel.
- ⭐ **Regra do Diego p/ as colunas:** no modo **Por fase**, Fase e Setor SAEM da linha (o card já diz a fase,
  o chip diz o setor). No modo **LISTA** elas VOLTAM — lá não há agrupamento que informe isso.
- **2 bugs meus, achados no navegador e corrigidos antes de commitar:**
  - As colunas **não alinhavam entre os cards** (cada `<table>` calculava a própria largura) → `table-layout:fixed`
    + `<colgroup>` **só no modo agrupado**.
  - No modo Lista o `fixed` **espremia a coluna Tarefa** e o texto se sobrepunha à coluna vizinha → lá o layout
    voltou a ser automático; `overflow:hidden`/ellipsis ficaram condicionais ao modo agrupado.
- VERIFICADO no navegador nos 2 modos: recolher/expandir pelo card OK, flecha alterna e volta OK, 7 cards,
  título editável/drag-drop/quick-add intactos, 0 erros de console, jsc SYNTAX_OK.
- ✅ **PRIORIDADE DO PROJETO removida também** (Diego confirmou "tirar tudo", 19/07). Saiu de: agrupamento da
  lista por prioridade, opção "Prioridade" no menu Agrupar E no Ordenar, chip colorido no card, pill no cabeçalho
  do projeto (`prioPill`/`_prioInfo`/`_prioMap`), campo do modal **Editar projeto** (`ppe-prio`) e a leitura em
  `salvarEdicaoProjectPro`. **Padrão de ordenação da lista virou PRAZO** (era prioridade) — coerente com
  "vamos trabalhar com data".
  - ⚠️ **O campo `p.prioridade` CONTINUA no dado de propósito** — projetos existentes e o seed têm; só não é
    mais lido nem escrito por tela nenhuma. Reverter = repor a UI, sem migração de dados.
  - As guardas `if(!_grpDefs.some(...))` / `if(!_sortDefs.some(...))` **migram sozinhas** quem tinha
    `taskflow_pp_sort`/`taskflow_pp_group` salvos como `'prioridade'` → viram `prazo`/`tipo`. TESTADO no navegador.
  - Verificado: modal Editar abre e SALVA sem erro, e o `p.prioridade` do dado é preservado (não zera).

### 2026-07-19 (ee) — Mac de casa — ✅ P0 nº1 CORRIGIDO: o render não reescreve mais `t.date`
- Corrigido o bug nº1 da varredura (entrada dd): `renderProjectProTarefas` (`~26989`) reescrevia `t.date`
  de toda tarefa sem `dateManual` a cada render e persistia via `saveTask_db`.
- **Descoberta que definiu a correção:** o cronograma **NÃO dependia dessa escrita**. O Painel exibe a
  previsão direto de `_prj` (`_statusCell` ~`27055`: `${formatDate(prj.ini)} → ${formatDate(prj.fim)}`) e
  o mini-Gantt idem — tudo recalculado a cada render e nunca persistido. A escrita só servia p/ SEMEAR data
  nas telas gerais (agenda/kanban/Meu Dia). Medido no seed: das 21 tarefas do projeto, 14 tinham `dateManual`
  e as 7 restantes eram exatamente as 7 **sem data nenhuma**.
- **Correção:** semeia `t.date` **só quando está vazia**; **nunca sobrescreve** (manual OU semeada antes).
  Sem campo novo, sem tocar em nenhum consumidor. Comentário longo no código explicando por que NÃO voltar
  a "re-fluir" (`_ppProjecao` ancora em hoje ⇒ a previsão é sempre ≥ hoje ⇒ reescrever tornava
  MATEMATICAMENTE IMPOSSÍVEL uma tarefa de projeto ficar atrasada).
- **VERIFICADO no navegador** (preview 8891), 3 renders seguidos: tarefa com `date=2026-05-01` e sem
  `dateManual` ficou em `2026-05-01` (antes virava futuro no 1º render); tarefa sem data foi semeada com
  `2026-08-17` e permaneceu ESTÁVEL. Integração: aba Atrasadas passou a mostrar, card "Atrasadas" do projeto
  passou a contar — as telas que usam `t.date` voltaram a concordar entre si. jsc SYNTAX_OK, 0 erros de console,
  Painel renderiza igual (screenshot conferido).
- ⚠️ **Não desfaz o passado:** tarefas cuja data já foi empurrada pro futuro continuam com essa data. Não há
  dado perdido (elas nasceram sem prazo), mas se quiser re-semear é só limpar a data delas — o render preenche
  de novo, agora uma vez só.
- Restam os outros 20 bugs da varredura (3 P0, 6 P1, 6 P2, 6 P3) + código morto. Nada mais foi tocado.

### 2026-07-18 (dd) — Mac de casa — VARREDURA completa de Reuniões + Projetos (só diagnóstico, 0 correções)
- Diego pediu auditoria "extremamente detalhada" dos 2 módulos após os 57 commits do PC da Empresa: bugs,
  melhorias, código morto, "se tudo está amarrado". Resultado completo na seção **🐞 VARREDURA** acima.
- **Método:** (1) inventário determinístico por script — grafo de alcançabilidade p/ código morto TRANSITIVO
  (não só grep), CSS morto com tratamento de classe dinâmica, cruzamento def×uso; (2) 5 análises semânticas
  em paralelo; (3) **validação em navegador** (preview em `/tmp/tf_preview`, porta 8891) dos achados graves.
- **21 bugs confirmados** (4 P0, 6 P1, 6 P2, 6 P3) + **40 funções mortas** (~296 ln) + ~567 ln de CSS morto.
- ⭐ **O achado principal — `renderProjectProTarefas` reescreve `t.date` a cada render (`26989`)** e o
  `saveTask_db` congela o `prazoBase` a partir dessa escrita. **Comprovado rodando:** tarefa 78 dias atrasada
  virou data futura só de abrir a aba, e persistiu no localStorage. Isso APAGA o atraso real de todas as telas
  que usam `t.date` enquanto a esteira do projeto continua marcando vermelho — ou seja, a regra de negócio que
  este protótipo passaria pro Guilherme está **errada**. É o P0 nº 1.
- Também comprovado rodando: tarefa criada pelo quick-add inline na **fase 1** nasce na **etapa 24/24 bloqueada**
  por 21 tarefas de fases posteriores; e `quickAddSetorPro` aceita 3 setores com o mesmo nome sem avisar.
- **Honestidade metodológica:** 2 suspeitas minhas viraram FALSO POSITIVO ao serem checadas — o "shadowing" de
  `_reunPauta`/`_activeReuniaoId` e o "copy-paste" de `_papelDe`/`linhaPart`. Ambas registradas como refutadas
  na seção, p/ ninguém reinvestigar.
- Nada foi corrigido e o `index.html` **não foi tocado** — a lista está em formato de checklist p/ marcar.
- ⚠️ Recomendação registrada: a **2ª passada do vocabulário** (72 linhas / ~110 strings) tem custo/benefício
  ruim perto dos P0 — a regra já está demonstrada nos ~30% feitos. Discutir antes de tocar nisso.

### 2026-07-18 (cc) — Mac de casa — Caça ao projeto "Snack Proteico": nuvem verificada, 2 hipóteses DESCARTADAS
- Diego pediu p/ **lembrar de tentar recuperar o "Snack Proteico" quando ele estiver no PC da Empresa ou da
  Produção**. Registrado na seção **🚨 PENDÊNCIA ABERTA** acima (é o único canal que viaja entre máquinas).
- **Não esperei chegar nas outras máquinas:** consultei a NUVEM daqui, via **MCP do Supabase** (`execute_sql`
  read-only em `public.app_state`) — não precisou do Chrome remoto nem tocar nos dados locais.
- **Resultado:** a nuvem tem **1 projeto só, "Implantação do Hub Klain"**. Sem "Snack Proteico". Isso **descarta
  as 2 hipóteses principais** da sessão anterior: não está na **Lixeira** (não há NENHUM item `projectPro` lá) e
  não é o filtro do chip **"Ativos"** (a string "snack" não existe no JSON de `taskflow_projects_pro`).
- **O que "snack" É, na verdade:** item de **pauta** da reunião "Reuniao - Empacotamento Doces" (19/07) —
  *"Ver sobre sabores dos snack proteico"*. Ou seja, o assunto existe; o **projeto**, aqui, nunca existiu.
- **Hipótese nº1 agora é que ele esteja no HUB do GUILHERME** (sistema diferente deste protótipo, como o próprio
  CLAUDE.md avisa — vale p/ dados também), não que tenha sido perdido.
- ⚠️ **Achado com prazo:** a Lixeira **se auto-purga aos 30 dias** no boot (`~4322`) — o que estiver lá some
  sozinho. Não dá p/ adiar a verificação das outras 2 máquinas indefinidamente.
- Só documentação — `index.html` **não foi tocado**.

### 2026-07-18 (bb) — Mac de casa — Painel: título "Estrutura" alinhado + vincular PESSOA direto na linha da tarefa
- **Alinhamento:** o `estruturaBloco` ainda tinha `margin-top:20px` (herança de quando o "Acontecendo agora" vinha
  acima dele) → removido. Agora "Estrutura" (col. 1) alinha com o título da fase (col. 2, ex. "Gerenciador de tarefas").
- **Executor CLICÁVEL na linha da tarefa** (pedido do Diego: "fazer tudo do painel"): a célula do executor em
  `_tarefaLinha` virou um chip que abre o seletor de pessoas JÁ EXISTENTE — **`ttOpenInlineDropdown(id,'executor',this)`**
  (o mesmo da planilha da aba Tarefas). Quando NÃO há responsável, mostra um chip tracejado com `ti-user-plus` (antes
  a célula ficava VAZIA, sem como atribuir). Reuso total, sem lógica nova.
- VERIFICADO no navegador (fluxo real): tarefa criada pelo campo inline da etapa → clique no chip → dropdown lista as
  pessoas do projeto → escolhi "Débora" → salvou, pill na linha, dropdown fechou.
- ⚠️ Investigado e **NÃO é bug**: `_ppVincularTarefaPorExecutor` move a tarefa p/ um setor com o nome do CARGO do
  executor — **mas só quando `t.setorManual` é falso**. Tarefas criadas pelo quick-add DENTRO de uma etapa nascem com
  `setorManual:true` (ver `quickAddTaskPro`), então **permanecem na etapa** ao atribuir alguém (confirmado em teste).
  Só tarefas criadas fora de um grupo é que seriam reclassificadas pelo cargo.

### 2026-07-18 (aa) — Mac de casa — Painel: "Acontecendo agora" desceu p/ o fim da coluna esquerda
- Pedido do Diego: o bloco "Acontecendo agora" saiu do TOPO da coluna 1 (acima da Estrutura) p/ o FIM (abaixo da
  Estrutura — canto inferior esquerdo). Só reordenação no `return` de `renderProjectProVisao` (col1 agora = projeção →
  Estrutura → Acontecendo agora, com `margin-top:18px` quando o bloco existe). Verificado no navegador. Commit `41681d2`.

### 2026-07-18 (z) — Mac de casa — Painel: criar SETOR/ETAPA inline também (sem modal)
- Diego: o "+ Adicionar etapa" (detalhe da fase, coluna do meio) ainda abria o modal `adicionarGrupo` — que tinha
  select de "setor cadastrado" + criar novo + nota Macrosetores, e o corpo dizia "setor" fixo (mesmo o título já sendo
  "etapa"). Trocado por CAMPO INLINE simples: **"Nova <etapa> — Enter para adicionar"** (`qa-setor-<faseId>` →
  **`quickAddSetorPro`**), reabre focado. Sem select, sem modal, sem "setor" fixo.
- Agora TODA criação no Painel é inline: **parte** (col. esquerda) · **etapa** (col. meio) · **tarefa** (dentro da
  etapa). Placeholder com concordância de gênero via `_ppG` ("Nova etapa" / "Novo setor").
- O modal `adicionarGrupo` CONTINUA existindo (a **aba Fases** ainda usa) — 2ª passada trocar os textos "setor" fixos
  dele. VERIFICADO: criei 2 etapas inline num projeto "sistema"; modal não abre; 0 erros; jsc OK.

### 2026-07-18 (y) — Mac de casa — Estrutura do Painel: criar e renomear parte/fase INLINE (sem modal)
- Diego pediu p/ renomear a parte direto no card e criar sem abrir modal — inline. Na coluna **Estrutura** do Painel
  (`renderProjectProVisao`):
  - **RENOMEAR inline:** duplo-clique no nome (ou o lápis, que aparece no hover) → o card vira input `ed-fase-<id>`;
    **Enter salva, Esc cancela** (funções `_ppEditarNomeFase`/`_ppSalvarNomeFase`; estado `window._ppFaseEdit`; a
    guarda `dataset.cancel` distingue Esc de blur). Clique simples segue **selecionando** a parte (master-detail).
  - **CRIAR inline:** o botão "+ Adicionar parte" virou um campo **"Nova <parte> — Enter para adicionar"**
    (`qa-fase-<id>` → **`quickAddFasePro`**), que reabre focado p/ adicionar várias seguidas (espelha o quick-add de
    tarefa dos setores).
  - Lápis só no hover (`.pp-estr-pen` / `.pp-estr-row:hover`) p/ não comprimir o nome. O modal `adicionarFase`
    CONTINUA existindo (a aba Fases ainda usa), mas o **Painel não abre mais modal** p/ criar/renomear.
- VERIFICADO no navegador: criei 2 partes pelo campo (Enter), renomeei a 1ª inline; nomes cabem melhor sem o lápis
  fixo; 0 erros de console; jsc OK.

### 2026-07-18 (x) — Mac de casa — Vocabulário: seletor enxuto (3 opções) + PERSONALIZAR + consistência
- Diego pediu o seletor com só 3 opções, SEM prefixo "Obra/Implantação": **Fases › Setores**, **Partes › Etapas** e
  **Personalizar…** (revela 2 campos: "Nível maior"/"Nível menor").
- `PP_VOCAB` enxugado p/ obra+sistema (tirei dev/genérico e o `label`). Select fixo de 3 opções + `_ppVocabChange`
  (mostra/esconde os campos custom) + **`_ppMkRotulo(n1,n2)`** que deriva plural e gênero por heurística PT-BR
  (Frente→Frentes/f · Nível→Níveis/m · Setor→Setores/m; plural trata ão→ões, m/n→ns, l→is, r/z/s→es). `criarProjectPro`
  trata os 3 casos.
- **Consistência (achado ao testar o custom):** faltavam a ABA na sub-navbar (`label:'Fases'`→`_ppRot(p,1,true)`), a
  **TRILHA do modo foco** (`proj-rail-btn` dizia "Fases"), o painel de ajuda "Como começar" (passos Fases/Setores +
  botão) e o **"sem setores"** na linha da fase. Todos trocados. **VERIFICADO no navegador:** projeto "Frente/Área" →
  aba + trilha + título + ajuda + "sem áreas" dizem Frentes/Áreas; plural/gênero certos; 0 erros; jsc OK.
- 2ª passada (ainda "fase/setor" fixo): planilha da aba **Tarefas** (colunas Fase/Setor + seletor de fase da tarefa),
  **Análise**, toasts, `~20780` "Nenhum setor…", e o seletor no **Editar projeto** (hoje só na criação).

### 2026-07-18 (w) — Mac de casa — Projetos: VOCABULÁRIO por projeto (Fase/Setor ↔ Parte/Etapa) — infra + textos [1/2]
- Pedido do Diego: os 2 níveis de agrupamento às vezes são "Fase/Setor" (obra), às vezes "Parte/Etapa" (implantação
  de sistema — o caso do Hub). A ESTRUTURA é a mesma; só os RÓTULOS mudam. (A ferramenta não tem sub-projeto, então
  o Hub vira 1 projeto com as partes = nível 1 e as etapas = nível 2.)
- **Infra (aditiva, baixo risco):** `PP_VOCAB` (presets `obra`/`sistema`/`dev`/`generico`, cada um com `n1/n1p/n2/n2p`
  + gênero `g1/g2`), campo `p.rotulos` no `_novoProjectPro` (`{n1,n1p,n2,n2p}`; **null = padrão Fase/Setor**), helper
  **`_ppRot(p,nivel,plural,lower)`** (fallback Fase/Setor) e **`_ppG(p,nivel,formaF,formaM)`** (concordância de gênero
  — ex.: "Nenhuma etapa" vs "Nenhum setor", "nesta parte" vs "neste módulo").
- **Textos trocados** pra usar `_ppRot`/`_ppG`: Painel (Estrutura + detalhe da fase: empty states, "Adicionar X",
  "Sem X", "Selecione uma X") e aba Fases (`renderProjectProFases`/`renderFaseExpandida`: "X do projeto", "Voltar
  para X", "Adicionar X", "Nenhuma tarefa nesta X") + modais `adicionarFase`/`adicionarGrupo`. **Projetos sem rótulos
  seguem em Fase/Setor (fallback) — nada muda pra eles.** Sintaxe jsc OK.
- **[2/2 FEITO] SELETOR de vocabulário** no modal de NOVO projeto: campo "Como chamar as divisões" (select `#pp-vocab`
  com os presets, ex. "Implantação de sistema — Partes › Etapas"); `criarProjectPro` grava `novo.rotulos` do preset
  (só se ≠ Fase, senão deixa null=padrão). **VERIFICADO no navegador:** projeto "sistema" → Painel e aba Fases dizem
  "Partes/Etapas" ("Adicionar parte", "Adicionar etapa", "Etapa 2 de 3"); projeto sem rótulos segue "Fases/Setores"
  (fallback); seletor com as 4 opções; 0 erros de console. jsc OK. Commits: `e9fceae` (infra+textos) + o deste push.
- FALTA (2ª passada, quando a área esfriar): trocar os textos SECUNDÁRIOS ainda em "fase/setor" fixo — toasts
  (`Fase criada`/`Setor adicionado`), planilha da aba **Tarefas** (colunas "Fase"/"Setor", seletor de fase da tarefa),
  **Análise** (`porFase`), excluir/renomear fase/setor, e adicionar o seletor no **Editar projeto** (hoje só na criação).
  ⚠️ Área MUITO editada pelo PC da Empresa — fazer com fetch antes e commits pequenos.

### 2026-07-18 (v) — Mac de casa — Tema Klain: removida a textura de biscoitos do fundo (fica liso)
- Diego pediu p/ tirar o padrão SVG de biscoitos (círculos) do fundo do tema Klain. Removido o `background-image`
  (data-URI SVG) do `body[data-theme="klain"]` e o bloco `body[data-theme="klain"] .sidebar` que repetia a textura.
  Mantido o fundo creme (`background-color:var(--bg)`) + os acentos caramelo. Verificado no navegador: tema Klain com
  fundo LISO (`bodyBgImage`/`sidebarBgImage` = `none`). Só CSS; jsc SYNTAX_OK.

### ✅ 2026-07-18 (u) — Mac de casa — VALIDAÇÃO no navegador do redesenho (a)…(t): 6/6 pontos OK, 0 bugs
- O RESUMO abaixo (sessão do PC da Empresa) pediu que o **Mac validasse no navegador** os 6 pontos que "mais
  provavelmente quebraram". Rodei **todos** no preview (cópia servida via HTTP + dados de teste injetados).
  **TODOS passaram — nenhum bug, nada a corrigir.** `index.html` INTACTO (só testei; não editei código). jsc: SYNTAX_OK.
  1. **Cronômetro** da reunião: iniciou e **conta** (00:00→00:11 em tempo real); pausa/retoma ok.
  2. **Anotações**: digitar e, sem sair, marcar item da pauta (`togglePautaItem` → re-render) → o texto **sobrevive** e
     salva em `m.anotacoes` (debounce); check da pauta persiste (`pautaDone`).
  3. **Cascata do tema**: `--surface-painel` é definido no **`body`** (não no `:root` — por isso parecia vazio no
     documentElement). Muda por tema: card cinza-claro no claro, **creme/tostado no klain**, escuro no dark. OK nos 3.
  4. **Anexo do projeto** (`_projAddAnexos`→`_projRefreshAnexos`): anexei no card da coluna 3 → aparece no card **E** na
     aba Anexos sem recarregar (ambos são `[data-proj-anexos="<id>"]`).
  5. **Dependência no Painel** (`_ppToggleParalela`): ícone por tarefa (↘ dependente / ⤨ paralela); togglar **recalcula
     a projeção** (Instalar→2.1 paralela, "Testar" adiantou 24→22 jul). ⚠️ os botões só aparecem na fase **SELECIONADA**
     (master-detail) — por isso um teste inicial contou 0 até eu selecionar a fase certa.
  6. **"Voltar às reuniões"** (`#tab-back` na topbar): aparece dentro da reunião e **some ao sair**.
- 0 erros de console em toda a sessão de teste. Decisões abertas seguem as do RESUMO abaixo (dependência explícita
  entre tarefas, Gantt/carga/caminho-crítico, "Atrasada" dupla). **Próximo:** aguardando o Diego escolher a frente.

### ⭐ 2026-07-18 — RESUMO DA SESSÃO (PC da Empresa) — LEIA ISTO PRIMEIRO, é o estado atual
Sessão inteira em **Painel de Reunião + Painel de Projeto** (UX e identidade visual). **45 commits**, todos
pushados, working tree limpo, `main` == `origin/main`. **Último commit: `a99046fc`.** As 20 entradas
**(a)…(t)** abaixo têm o detalhe técnico — este resumo é o mapa.
⚠️ **NADA foi testado em navegador** (esta máquina não roda preview; `file://` abre só como snapshot estático).
Verificação usada em todos os commits: balanço de `( ) { } <div>` + paridade de backticks **idêntico ao HEAD**,
mais greps de referências órfãs. **Quem valida comportamento é o Diego no Pages (Ctrl+Shift+R).**

**O que mudou, por tema:**
| Tema | O quê |
|---|---|
| **Reunião — cabeçalho** | Infos (data/hora/sala/conduz) saíram do topo → vivem na aba Info · "Voltar" subiu p/ a **topbar** (novo `#tab-back` + `_tabBackSet`) · Iniciar+cronômetro viraram **1 bloco** · Iniciar/Finalizar/⛶ desceram p/ a **linha das abas** |
| **Reunião — pauta** | **Autor por assunto** (`m.pautaAutor`, mapa por TEXTO) + agrupamento por pessoa · ícone que joga o assunto p/ as **Anotações** · seletor de autor discreto (1 ícone) |
| **Reunião — anotações** | **Card novo** com editor (negrito, 3 fontes, lista, check, 5 cores) · Enter continua a lista de checks · texto entra no **cursor** |
| **Reunião — pessoas** | **2 colunas**: Disponíveis → Participantes agrupados por papel; check da frente virou **presença** |
| **Projeto — estrutura** | Painel **3 colunas 25/50/25** (Conclusão+Agora+Estrutura · Planejamento · Comentários+Anexos) · centralizado · conclusão prevista foi p/ o **header** |
| **Projeto — novo** | **Anexos** (não existiam) · **Editar virou aba inline** · status virou **botão play/pausa** · nova tarefa **inline com Enter** |
| **Ambos — visual** | Ordem das abas por **momento de uso** (idêntica trilha × sub-navbar) · header colorido nos cards · **`--surface-painel`** (fundo derivado do tema) · linhas de tarefa em **grid de colunas alinhadas** |

**ROTEIRO DE TESTE NO MAC** (o que mais provavelmente quebrou, em ordem):
1. **Cronômetro da reunião** — iniciar e ver se conta. Movi o bloco de lugar 2× e ele depende de uma estrutura
   específica (`#reun-cronometro-<id>` com o `[data-inicio]` e o ícone do relógio como 1º `<i>`).
2. **Anotações** — digitar e, sem clicar fora, marcar um item da pauta: o texto tem que sobreviver (salva com
   debounce de 500ms). Marcar um check, sair e voltar: tem que continuar marcado.
3. **Trocar de TEMA** (Configurações → Tema) — o fundo dos cards deve mudar junto (creme no areia, tostado no
   klain, escuro no dark). Se ficar igual nos 3, a cascata do `--surface-painel` não pegou.
4. **Anexo do projeto** — anexar pelo card da coluna 3 e conferir se aparece **também** na aba Anexos sem recarregar.
5. **Dependência no Painel do projeto** — clicar no ícone de dependência de uma tarefa do meio e ver se as datas
   previstas seguintes se recalculam.
6. **"Voltar às reuniões"** — tem que aparecer ACIMA do título e **sumir** ao sair (testar pelos 2 caminhos: o
   botão e a aba lateral). No **modo foco**, abrir uma reunião anterior e conferir o "Voltar" na barra do topo.

**DECISÕES ABERTAS (nada quebrado, esperando o Diego):**
- **Dependência explícita** entre tarefas ("A depende da C", pulando as do meio) — hoje é só pela ORDEM da esteira.
  É mudança de MODELO de dados, não de UI. Ver (t).
- As 3 sugestões de mercado p/ Projetos: **Gantt/linha do tempo**, **carga por pessoa**, **caminho crítico**
  (nessa ordem de retorno pelo esforço).
- **Recap pós-reunião** e **1:1 focado** — ver a seção **📌 BACKLOG ACORDADO** acima (o 1:1 já está aprovado e adiado).
- Herdadas: dupla definição de "Atrasada" (`t.date` × esteira) · `g.tarefaIds` × `t.projectPro*` · `<title>` da aba.

**⚠️ Antes de editar DADOS no Mac:** abrir o app → ☁️ → **Baixar da nuvem** (regra de ouro do projeto; o
localStorage é por máquina e o auto-push pode subir estado velho por cima).

**Nota de infra (inofensiva):** todo `git push` daqui termina com `could not write multi-pack-index: Permission
denied` — é a manutenção automática do git local esbarrando em permissão nesta máquina. **Os pushes passaram
normalmente** (conferido no remoto a cada vez). Se incomodar: `git config maintenance.auto false`.

### 2026-07-18 (t) — PC da Empresa — Linhas de tarefa em COLUNAS alinhadas + dependência acionável do Painel (commit `561e33b`)
- **COLUNAS ALINHADAS (projeto + reunião):** as 2 linhas de tarefa passaram de **flex p/ GRID de colunas fixas**. Com flex cada linha se
  ajustava ao próprio conteúdo e **executor/dias/data não casavam entre si**; com grid, alinham verticalmente.
  - Projeto: `[etapa 24][dependência 22][check 18][título 1fr][executor 104][dias 46][previsão 84]`
  - Reunião: `[check 18][título 1fr][executor 112][data 96][lixeira 26]`
  - Executor e data **centralizados** na coluna, gap 8→9.
- **EXECUTOR COM FUNDO no projeto** (chip pill `--bg2` + borda), copiando a Reunião, que já fazia isso. Antes era texto solto.
- O **"d" solto** depois do campo de dias saiu (Diego achou feio) — a unidade vive no `title` do campo.
- ⭐ **DEPENDÊNCIA ACIONÁVEL DO PAINEL** (antes só na aba Tarefas, via drag): nova coluna com ícone que alterna a tarefa entre
  **DEPENDENTE da anterior** (`ti-arrow-down-right`, azul) e **PARALELA/roda junto** (`ti-arrows-split-2`, cinza). Reusa **`_ppToggleParalela`**.
  A 1ª tarefa não tem botão (não há anterior), mas **a COLUNA continua lá** p/ não desalinhar a grade.
  ⚠️ **LIMITE DO MODELO (importante):** a dependência é **pela ORDEM da esteira** — "esta tarefa espera a anterior". **NÃO existe** "tarefa A
  depende da tarefa C específica" (finish-to-start arbitrário). Se o Diego pedir isso, é mudança de MODELO de dados, não de UI — ver a
  sugestão "dependência explícita entre tarefas" na análise de mercado (entrada de 18/07 sobre o que falta no Painel).
- ⚠️ NÃO testado em navegador. Balanço idêntico ao HEAD.

### 2026-07-18 (s) — PC da Empresa — `--surface-painel`: fundo dos cards levemente mais creme, derivado do tema (commit `5e9f02a`)
- Diego: *"dos fundos gostei, poderia ser levemente mais escurinho, mas tipo quase nada, só pra não parecer branco, seria um cremezinho mais forte"*.
- ⭐ **Nova var `--surface-painel`** = o `--card` puxado **30% na direção do `--bg2` do próprio tema**, via `color-mix`.
  **Derivar em vez de fixar um hex por tema**: sai creme no areia/klain, cinza-claro no padrão e escuro no dark, sem manter 5 valores na mão
  (e sem esquecer um quando surgir tema novo).
- Aplicada nos cards dos **DOIS painéis**: `.reun-card4` (16 cards da Reunião), `_ppBloco`, card do setor, cards de fase, estados vazios do
  detalhe e o `infoCard`. **MANTIDO `--card`** onde ele não é superfície e sim o "vazio" de uma **barra de progresso** (o trilho) — ali o que
  importa é o contraste com o preenchimento.
- 🐛 **ARMADILHA DE CSS resolvida ANTES de subir (vale lembrar):** a var estava em `:root`. **Custom property é resolvida no elemento onde é
  DECLARADA** — o `color-mix` usaria o `--bg2`/`--card` do `:root` (tema padrão) e os filhos herdariam o valor **já resolvido**, ou seja,
  o fundo **não mudaria em tema nenhum**. Movida p/ **`body`**, que é onde os temas (`body[data-theme=…]`/`body.dark`) redefinem `--bg2`.
  📌 **Regra:** var de tema que dependa de outra var de tema **tem que ser declarada no mesmo nível em que os temas sobrescrevem** (body).
- ⚠️ NÃO testado em navegador. Balanço idêntico ao HEAD.

### 2026-07-18 (r) — PC da Empresa — Blocos do Painel voltam a ter SUPERFÍCIE, na paleta do tema (commit `3b0265b`)
- Diego: *"acontecendo agora / próximas a liberar não ficou legal, pode ter fundo, porém com a paleta do tema · o fundo dos comentários tbm ·
  o das tarefas tbm"*. Ou seja: tirar os cards deixou o conteúdo **solto direto no `--bg` da página**, sem acabamento.
- ⭐ **Novo `_ppBloco(conteudo, extra)`** — superfície padrão do painel: **`var(--card)` + `var(--border)` + radius**.
  📌 **Por que isso JÁ é "a paleta do tema":** `--card` é **creme** nos temas bege (`#fffdf8` no areia, `#fbf6ec` no klain), **branco** no claro
  e **escuro** no dark. Não existe hex fixo — a superfície acompanha o tema sozinha.
- **"Acontecendo agora" + "Próximas a liberar" = UM bloco só.** Histórico útil: (1) uma caixa por tarefa → pesado; (2) texto solto → sem
  acabamento; (3) **bloco único com as linhas dentro** → o meio-termo que ficou.
- **Comentários e Anexos** ganharam o mesmo bloco, com `gap:14px` na coluna 3. ⚠️ O `margin-top:18px` do card de anexos foi **zerado** — o gap
  do flex já espaça; somados, abriam um vão.
- 🔎 **VARREDURA nos 2 painéis** atrás de cor fixa que ignore o tema: sobraram só **6 `color:#fff`**, todas texto sobre botão colorido
  (verde/azul) — legítimo em qualquer tema. **Nenhum `background:#hex`.**
- ⚠️ NÃO testado em navegador. Balanço idêntico ao HEAD.

### 2026-07-18 (q) — PC da Empresa — Headers na paleta do tema + PROJETO em 3 colunas 25/50/25 (commit `8e5fd2e`)
- ⭐ **HEADERS NA PALETA DO TEMA — achado importante:** o cabeçalho dos cards (Reunião) e do setor (Projeto) usava
  `color-mix(var(--blue-mid) 6%,…)`. Só que **`--blue-mid` só é redefinido nos temas "brasil" (verde) e "klain" (caramelo)** — nos temas
  **claro e AREIA ele continua AZUL**, então sobre o fundo bege o header saía azulado, fora da paleta. Trocado por **`var(--bg2)`**, que é a
  superfície secundária do tema e acompanha **qualquer** um deles.
  📌 **Regra p/ o futuro:** para "cor que segue o tema", `--bg2`/`--bg3`/`--card` são seguros; **`--blue-mid` NÃO é** (fixo no claro/areia).
- **PAINEL DO PROJETO EM 3 COLUNAS** (era 4): a **Estrutura saiu da coluna própria** e foi p/ BAIXO de "Próximas a liberar", na coluna 1
  (`margin-top` 2→20 p/ separar). Ficou: **[Conclusão + Acontecendo agora + Estrutura] · [Planejamento] · [Comentários + Anexos]**.
- **Proporção 25% / 50% / 25%** via **frações (`1fr 2fr 1fr`)** e não porcentagem — fração já desconta o `gap:34px` sozinha; com % o total
  passaria de 100 e a última coluna vazaria. Classe renomeada **`.pp-visao-4col` → `.pp-visao-3col`**; o breakpoint de 1400px caiu (não há
  mais 4ª coluna p/ esconder).
- ⚠️ NÃO testado em navegador. Balanço idêntico ao HEAD; conferido que o grid tem exatamente 3 filhos diretos.

### 2026-07-18 (p) — PC da Empresa — PROJETO: conclusão no header · "acontecendo agora" sem cards · CORES DO TEMA (commit `7b7d6ef`)
- **CONCLUSÃO PREVISTA subiu p/ o CABEÇALHO**, ao lado do % (nos dois: barra de foco e linha das abas). Novo **`_ppConclusaoHeader(p,prog)`** —
  formato curto "24 de jul. · 24d de folga", com o saldo tingido. Na coluna 1 sobrou só o call-to-action **"todas as tarefas concluídas —
  pronto para encerrar"** (é ação, não métrica).
  ⚠️ O helper **RECALCULA a projeção** porque o cabeçalho é montado ANTES do corpo do painel. É O(n) nas tarefas (barato no tamanho real);
  se um dia pesar, calcular 1× em `renderProjectProView` e passar adiante.
- **"ACONTECENDO AGORA" SEM CARDS:** cada tarefa era uma caixa com borda (e "Próximas a liberar" idem) → viraram **linhas de texto**
  (nº da etapa · título · executor/setor · pill de estado). A coluna 1 era a mais "encaixotada" do painel.
- ⭐ **CORES DO TEMA:** no painel, **`p.cor`** (cor livre por projeto) foi trocada por **`var(--blue-mid)`** em TODOS os usos decorativos —
  % de progresso, ícone do tipo, ícone e fundo do setor, barra/borda da fase, sublinhado da aba ativa e badge.
  **Conferido: 0 ocorrências de `p.cor` no range do painel.** 📌 A cor própria do projeto **segue valendo na LISTA de projetos**, onde serve
  p/ distinguir um do outro — a troca foi só DENTRO do painel, que é onde o excesso de cor incomodava.
- ⚠️ NÃO testado em navegador. Balanço idêntico ao HEAD; conferido que `_projE` não ficou órfão ao remover o bloco de projeção.

### 2026-07-18 (o) — PC da Empresa — Header colorido nos cards da REUNIÃO + respiro entre colunas do PROJETO (commit `29be3d2`)
- **REUNIÃO — cada card ganhou CABEÇALHO COM COR** (Pauta · Anotações · Tarefas · Decisões tomadas · Decisões anteriores...).
  Tom baixo de propósito (**6% de azul sobre o card** + `border-bottom`), só p/ separar título de conteúdo — o Diego pediu "nada grotesco".
  - ⚠️ Feito **100% no CSS de `.reun-card4-title`**, sem tocar no HTML dos 16 cards: **margens NEGATIVAS (-14px)** puxam o título até as bordas
    do card (que tem `padding:14px`) e o padding interno recompõe o espaçamento. **Conferido antes: 16 cards × 16 títulos** — o título é sempre o
    primeiro filho; se algum estivesse solto, a margem negativa vazaria.
  - ⚠️ **`border-radius` próprio no título em vez de `overflow:hidden` no card** — o overflow cortaria o **popover de cores das Anotações**,
    que abre dentro do card.
- **PROJETO — gap entre as 4 colunas 22→34px.** Como o gap maior comeria a largura útil, o **teto subiu junto** (grid, `.proj-panel-wrap` e
  `_bodyMax` da 'visao': **1560→1600**) — senão o respiro sairia do bolso da coluna Planejamento. 📌 Se mexer no gap de novo, mexer no teto também.
- ⚠️ NÃO testado em navegador. Balanço idêntico ao HEAD.

### 2026-07-18 (n) — PC da Empresa — PROJETO: títulos padronizados + cor de volta no setor (commit `4fb9616`)
- Feedback do Diego à leva (m): *"agora ficou branco demais · setor pode ter cor · conclusão prevista não precisa ser card ·
  vários títulos, tamanhos diferentes, faz tudo igual"*. Ou seja: na (m) eu **passei do ponto** ao aliviar.
- ⭐ **TÍTULOS PADRONIZADOS:** novo **`_ppTituloCol(icone, texto, sufixo, mb)`** — as **5 seções** do Painel agora saem dele
  (Acontecendo agora · Estrutura · nome da fase · Comentários · Anexos). Antes cada uma tinha o seu (**12,5px/700 · 13px/800 · 16px/800**,
  umas com ícone e outras sem) e as 4 colunas ficavam visivelmente desalinhadas.
  ⚠️ O parâmetro **`mb`** existe porque 2 deles entram DENTRO de uma linha flex que já tem espaçamento — sem zerar a margem, empurravam os irmãos.
  📌 **Se criar seção nova no Painel do Projeto, use `_ppTituloCol`** em vez de escrever outro título à mão.
- **SETOR COM COR de novo, mas outra:** em vez do bege (`--bg2`) que pesava, um tom da **COR DO PROJETO diluído a 7%** no cabeçalho +
  ícone na cor cheia. Identidade sem peso.
- **CONCLUSÃO PREVISTA deixou de ser card** — era caixa colorida com borda no topo da col 1; virou **só a frase**, com ícone e o
  "· folga/atraso" tingidos. Vale também p/ a variante "todas as tarefas concluídas".
- ⚠️ NÃO testado em navegador. Balanço idêntico ao HEAD.

### 2026-07-18 (m) — PC da Empresa — PROJETO: centralizado · status vira ação · Editar INLINE · painel mais leve (commits `b3bde25`,`9a486c8`,`91f170e`)
- **TELAS CENTRALIZADAS** (`b3bde25`): a regra `body.proj-focus .proj-body{max-width:none}` **anulava** o limite de cada aba → Tarefas/Fases/Análise/
  Comentários esticavam de ponta a ponta no modo foco. Removida; agora vale o `_bodyMax` de cada aba + **`margin:0 auto`** no corpo.
- **STATUS VIRA AÇÃO** (`b3bde25`): "Em andamento" era só rótulo; virou **botão que alterna** (planejamento/pausado ↔ ativo), espelhando o
  Iniciar/Pausar da Reunião. `_projToggleStatus` + `_projStatusBtnHTML` (usado na barra de foco **e** no cabeçalho normal, que antes nem mostrava status).
  Concluído/arquivado **não** entram no toggle — sair desses estados é decisão, segue no menu completo da aba Info. **Sem checagem de permissão**
  de propósito (identidade simulada; trava já emperrou o Diego antes). `const status` do render removida (órfã).
- **EDITAR VIROU ABA INLINE** (`9a486c8`): campos extraídos p/ **`_projEditarCamposHTML(p)`** — em vez de duplicar o form entre modal e inline.
  Ids `ppe-*` seguem únicos no DOM (conferido). `salvarEdicaoProjectPro` volta p/ 'visao' quando veio da aba. Ícone do lápis e botão da trilha
  chamam `setProjectProTab('editar')`. ⚠️ **`editarProjectPro` (modal) ficou SEM CALLER** — a lista de projetos não tem botão de editar; marcado
  **[SUPERSEDED]** e mantido (ainda compartilha os campos, é só chamar se a lista precisar).
- **PAINEL MAIS LEVE** (`91f170e`) — Diego: *"o painel de reuniões é mais leve de visualizar, já o projeto parece pesado demais, colorido demais…
  quero que a plataforma seja parecida"*:
  - Cabeçalho do **setor** perdeu o **fundo bege** (`--bg2`) → só `border-bottom`, como os cards da Reunião; card do setor com fundo `--card`. "Sem setor" idem.
  - **Badge da etapa** deixou de ser tingido com a cor do projeto (`color-mix 13%`) → neutro. Era o que mais coloria a lista: um chip colorido por linha.
  - **Nova tarefa INLINE**: o "+ Tarefa" saiu do cabeçalho do setor; agora há um **campo no fim da lista** — digita, Enter, segue pra próxima.
    ⭐ Reusa **`quickAddTaskPro`**, que já existia e faz exatamente isso (cria + re-render + refoca); antes só a aba Tarefas a usava.
  - **"+ Adicionar fase"** desceu do cabeçalho (ícone "+" solto) p/ botão tracejado **abaixo da lista**, mesma gramática do "+ Adicionar setor".
- ⚠️ NÃO testado em navegador. Balanço idêntico ao HEAD em todos os commits.

### 2026-07-18 (l) — PC da Empresa — PROJETO: Painel em 4 COLUNAS + ANEXOS + Pessoas espelhando a Reunião (commit `625cabc`)
- **PAINEL EM 4 COLUNAS** (era 3): **1.** Conclusão prevista + Acontecendo agora · **2.** Estrutura (fases) · **3.** Planejamento (detalhe da fase) ·
  **4.** Comentários + Anexos. A faixa de **conclusão prevista SUBIU** do topo do detalhe (col 3) p/ o topo da col 1.
- **CENTRALIZADO** como o Painel de Reunião: nova classe **`.pp-visao-4col`** (`max-width:1560px;margin:0 auto`) — vale **inclusive no modo foco**,
  onde antes o conteúdo espalhava pela tela toda. `.proj-panel-wrap` **1320→1560** e `_bodyMax` da 'visao' **1320→1560** (senão o grid não caberia).
- ⭐ **ANEXOS DO PROJETO** (não existiam — só a reunião tinha): `_projAnexosLista`/`_projAddAnexos`/`_projDelAnexo`/`_projRefreshAnexos`.
  ⚠️ **Não dá p/ reusar as da reunião** (`adicionarAnexos`/`renderAnexos`/`removerAnexo`): elas buscam em `meetings` e gravam com `saveMeeting_db`.
  ⚠️ A lista aparece em **DOIS lugares ao mesmo tempo** (card da col 4 + aba dedicada) → o refresh usa **`[data-proj-anexos]`**, não id; com id só o
  primeiro atualizaria. Nova **aba/ícone "Anexos"** na sub-navbar e na trilha, com contador. Mesmo limite de 5MB/arquivo (base64 no localStorage).
- **ORDEM das abas por momento de uso, IDÊNTICA na sub-navbar e na trilha:** TRABALHO (Painel·Fases·Tarefas) → EQUIPE (Pessoas) →
  REGISTRO (Comentários·Anexos) → CONSULTA (Análise) → REFERÊNCIA (Info). **Info desceu da 5ª p/ a última.** Espelha o que foi feito na Reunião.
- **ABA PESSOAS = mesmo desenho da Reunião:** 2 cards, "Disponíveis" (clique manda pra equipe) → "Equipe" **agrupada por PAPEL** com título
  (Dono/Coordenador/Leitor) e × p/ tirar. **Sem check de presença** — ninguém "comparece" a um projeto. Reusa as classes `.reun-pessoas-2col`/
  `.reun-pessoa-linha`/`.reun-pessoa-disp`. `_papelOrdProjeto` removido (só servia à lista única antiga).
  ✅ Isso zera a pendência anotada na entrada (c) ("se o Diego gostar deste, vale espelhar lá").
- ⚠️ NÃO testado em navegador. Balanço idêntico ao HEAD; ordem das abas conferida batendo nos 2 lugares.

### 2026-07-18 (k) — PC da Empresa — PROJETO: progresso e ícones descem p/ a linha da sub-navbar (commit `0a4b30a`)
- Diego: o bloco de progresso + ícones ficava **"jogado num canto"** no alto à direita do Painel de Projeto.
- `headerHTML` ficou **só com o ícone do tipo + "Projeto — \<nome\>"** (+ banner de encerramento). Saíram de lá a barra de progresso/%/atrasadas
  e os 4 ícones (foco · ajuda · template · editar).
- `tabsHTML` virou wrapper **`.proj-subtabs-wrap`**: abas à esquerda (`flex:1`+`overflow-x`, rolam em tela estreita) e, à direita alinhado embaixo,
  **[progresso] [⛶] [ajuda] [template] [editar]**.
- ⚠️ CSS: **`.proj-subtabs-wrap` também some no modo foco** — sem isso a borda inferior e os botões ficariam órfãos na tela com as abas
  escondidas (a trilha lateral já cobre essas ações). Mesmo cuidado do `.reun-subtabs-wrap`.
- 📐 **Os 2 painéis agora têm a MESMA anatomia:** título em cima · abas + ações na linha de baixo. Se mexer em um, espelhar no outro.
- ⚠️ NÃO testado em navegador. Balanço idêntico ao HEAD; conferido por grep que progresso/ícones não ficaram duplicados.

### 2026-07-18 (j) — PC da Empresa — Colunas iguais + ações descem p/ a linha das abas (commits `1775705`,`a97e467`)
- **Pauta/Anotações e Tarefas com a MESMA largura** (`1775705`): as 2 colunas passaram a dividir o espaço igualmente (`minmax(0,1fr)` cada).
  Antes a Pauta era FIXA em 300/320px e Tarefas ficava com todo o resto. No foco: Pauta **320→~505px**, Tarefas **690→~505px**.
  Aplicado nos **3 breakpoints** (base · foco · 1280px) — senão a proporção velha voltaria em tela média. Decisões intocada. Anotações
  acompanham sozinhas (vivem na coluna da Pauta). ⚠️ A linha de **nova tarefa** (4 campos) é o ponto que mais sente o estreitamento —
  sobra ~160px p/ a descrição; se apertar, empilhar executor+data numa 2ª linha do form.
- **Iniciar/Finalizar desceram p/ a linha da SUB-NAVBAR** (`a97e467`), à direita das abas: **[⛶] [Iniciar/cronômetro] [Finalizar]**.
  O cabeçalho ficou **só com título + status**. O **⛶ vem ANTES do Iniciar** — os 2 botões de ação juntos, sem o expandir "perdido no meio"
  (a reclamação original de 18/07 (a)). Altura dos botões **34→32px** p/ casar com o ⛶; grupo com `margin-bottom:6px` e o
  `margin-bottom` do `.reun-focus-toggle` **zerado** (senão somariam). Abas seguem `flex:1`+`overflow-x` e o grupo `flex-shrink:0` →
  em tela estreita as abas rolam e as ações ficam visíveis.
- ⚠️ Contrato do cronômetro preservado; conferido por grep que o bloco de ações **não ficou duplicado** (existe 1× na trilha do foco e 1× na sub-navbar).
- ⚠️ NÃO testado em navegador. Balanço idêntico ao HEAD.

### 2026-07-18 (i) — PC da Empresa — Barra das Anotações mais discreta (commit `172e64a`)
- Diego: *"tá chamando atenção demais, as cores principalmente"* (2ª vez que ele pede menos peso visual — ver (h)).
- **As 5 bolinhas coloridas saíram da barra** → **1 ícone de paleta** que abre um popover com as cores (`_anotCorMenu`).
  Escolher aplica e fecha · clicar fora fecha · 2º clique no ícone fecha. Soltas na barra, 5 círculos saturados puxavam mais o olho que o texto.
- **Botões da barra perderam a BORDA** (viravam ~10 caixinhas competindo com o conteúdo): agora são só texto/ícone em `--text3` com fundo sutil no hover.
- ⚠️ O popover usa `onmousedown+preventDefault` (no box, herdado pelos filhos) p/ **não roubar a seleção do editor** — sem isso o `foreColor`
  não teria em que aplicar. Mesma razão do `preventDefault` nos botões da barra.
- Helper `cor` do template removido (órfão); a classe `.anot-cor` segue viva, agora aplicada por JS dentro do popover.
- 📌 **Padrão que o Diego prefere (vale p/ o resto do HUB):** controle discreto = **1 ícone que abre a lista**, não o controle aberto na tela.
  Já aplicado em: papel na pauta (h), cores das anotações (i), autor do assunto.
- ⚠️ NÃO testado em navegador. Balanço idêntico ao HEAD.

### 2026-07-18 (h) — PC da Empresa — "Quem trouxe" vira só um ÍCONE (commit `e93e55a`)
- O Diego achou o bloco **"Quem trouxe: [dropdown]"** chamativo demais na linha de novo assunto. Virou **só um ícone de pessoa** ao lado do campo
  (aperta → abre a lista). O valor foi p/ um **`<input type=hidden>` com o MESMO id** (`pauta-add-autor-<mid>`), então `pautaConfirmarAdd` segue
  lendo `.value` sem alteração e o autor continua persistindo entre um assunto e outro.
- **Feedback silencioso:** o ícone fica **azul quando o autor escolhido NÃO é você** (aviso de que os próximos assuntos vão pra outra pessoa);
  cinza quando é você. Nome completo no tooltip.
- Extraído **`_pessoaPicker(anchor, atual, comVazio, onPick)`** — a criação do `<select>` invisível estava duplicada entre trocar-autor-do-item e
  escolher-autor-do-novo. Nova classe **`.pauta-ico-btn`** nos 3 ícones da pauta (tira o `onmouseover/onmouseout` inline repetido).
  ⚠️ A cor inline setada por JS **vence o `:hover` de propósito** — senão o azul do "autor ≠ eu" se perderia ao passar o mouse.
- ⚠️ NÃO testado em navegador. Balanço idêntico ao HEAD.

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
  - ⚠️ **REATIVADO em 20/07/2026** (Diego pediu explicitamente — a exceção "salvo o Diego pedir" foi acionada): o mobile
    voltou a ser editado (aba **Projetos** + **Participantes/presença** na reunião). Ver handoff **2026-07-20 (tt)** no topo.
    O congelamento **continua valendo por padrão** — só mexer no mobile quando o Diego pedir de novo.
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
