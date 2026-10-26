# TaskFlow HUB — Spec & Arquitetura

> Documento de **referência técnica** — anexar em **Arquivos** do projeto.
> Contém só o que é **estável**. O HTML completo NÃO deve ser anexado (muda a cada versão).
> Última base: `taskflow_36_hub_32.html`.

---

## 1. Visão geral

O **TaskFlow HUB** é uma plataforma interna única (arquivo HTML/CSS/JS vanilla, localStorage-first) que reúne quatro módulos sob um mesmo header e uma mesma sidebar:

- **Meu dia!** — painel-raiz de início, com abas por setor.
- **Gerenciador de Tarefas (TaskFlow)** — tarefas, projetos, reuniões, notas, rotinas, análise.
- **Produção** — produtos e PCP (ordens, check lists).
- **Manutenção** — setor de manutenção (em estruturação).

O protótipo é a **especificação** para a TI reimplementar no banco. O valor está na **lógica, nas regras e nos formatos de dados** abaixo.

---

## 2. Estados globais & navegação

- `hubView`: `'meudia' | 'taskflow' | 'producao' | 'manutencao'` — boot abre em `'meudia'`.
- `currentTab` (dentro do TaskFlow): `'hoje' | 'minhas-tarefas' | 'entrada' | 'someday' | 'equipe' | 'analise' | 'projetos-pro' | 'reunioes' | 'anotacoes' | 'rotinas' | 'agenda' | 'lixeira'` (+ auxiliares).
- `CURRENT_USER_ID = 'p1779098505705'` (Diego) — hardcoded até a migração multiusuário.
- `today` — string `YYYY-MM-DD` do dia corrente (base de todos os cálculos de prazo).

**Roteamento:** `render()` e `renderSidebar()` decidem o que mostrar a partir de `hubView`; dentro do TaskFlow, `setTab(tab)` troca `currentTab` e `render()` despacha para o renderizador de cada aba. O **header funciona de qualquer tela** (ao acionar uma aba fora do Gerenciador, ele volta para `hubView='taskflow'`).

**Helpers de navegação permanentes:** controles fixos no topo da sidebar, item **"← Meu dia!"** fixo (volta à raiz), **breadcrumb clicável** (Grupo › Subgrupo › Item) no topo do conteúdo, e divisória forte com o rótulo do grupo. Aplicar em todo módulo/grupo novo.

**Gestão / equipe:** `getSetoresGerenciados(personId)` e `getEquipeGerenciada(personId)` definem quem cada pessoa gerencia (por cargo, via `LS_SETORES_GESTAO`). Por seed, Diego é diretor de todos os cargos de Produção e Administrativo.

---

## 3. Módulos

### Meu dia!
Painel-raiz com abas por setor (ex.: Geral / Produção / Comercial). Ponto de partida diário.

### Gerenciador de Tarefas (TaskFlow)
- **Fixos:** Hoje, Minhas Tarefas, Entrada (sem executor), Lembrete (someday), Equipe.
- **Grupo Gestão (roxo, `var(--purple)`):** Análise, Projetos, Reuniões, Notas, Rotinas.
- **Pessoas** (por departamento) e **Lixeira** (recuperável 30 dias).
- Visões de tarefa: lista, painel (kanban), tabela/planilha. Conclusão de tarefa marca `doneAt`.

### Produção
Produtos + PCP (ordens de produção, check lists). Telas em detalhamento.

### Manutenção
Setor da manutenção (ordens/equipamentos/preventivas) — placeholder em estruturação.

---

## 4. Schemas dos objetos (o que vira tabelas)

> Campos confirmados no código. Datas em `YYYY-MM-DD`. IDs string.

### Task
```
{
  id, title,
  prio: 'alta' | 'media' | 'baixa',
  date: 'YYYY-MM-DD' | null,        // prazo atual (replanejável)
  prazoBase: 'YYYY-MM-DD' | null,   // baseline congelado na 1ª vez que teve prazo (nunca sobrescreve)
  someday: bool,                    // sem data, "lembrete"
  done: bool,
  doneAt: 'YYYY-MM-DD' | null,      // data de conclusão (base do cálculo de atraso)
  escopo: 'klain' | 'pessoal',
  executor: personId,               // quem faz
  solicitante: personId,            // quem pediu
  people: [personId],               // envolvidos
  createdAt: 'YYYY-MM-DD',
  kanbanCol: 'todo' | 'doing' | 'waiting' | 'done_col',
  meetingId,                        // se nasceu de uma reunião
  projectProId, projectProFaseId,   // vínculo a projeto/fase
  subtasks: [{ id, title, done, subsubs:[...] }],
  desc
}
```
Atraso de uma tarefa = `doneAt − prazoBase` (positivo = atrasada). Tarefa sem `prazoBase` fica fora das métricas de pontualidade.

### ProjectPro (projeto com fases)
```
{
  id, nome, tipo, cor,
  dono, coordenador, coordenador2, pessoas:[personId],
  status, prioridade,
  prazoInicio, prazoFim,
  descricao,
  fases: [{ id, nome, ordem, prazoFase, grupos:[{ id, setor, tarefaIds:[] }] }],
  marcos: [{ id, nome, dataAlvo, status }]
}
```
Progresso calculado a partir das tarefas vinculadas (via `tarefaIds` nos grupos das fases).

### Meeting (reunião)
```
{
  id, title, date, horaInicio, horaFim,
  tipo: 'Liderança'|'Operacional'|'1:1'|'Comercial'|'Estratégica'|'Outra',
  status: 'agendada'|'andamento'|'encerrada'|'continuacao',
  sala, facilitador,
  frequencia: 'unica'|'semanal'|'quinzenal'|'mensal'|'bimestral'|'trimestral',
  participantes:[personId], projetos:[projectProId],
  pauta:[texto], pautaDone:[bool], pautaPrincipal, pautaPrincipalDone,
  ata, decisoesItens:[...],
  presencas:{ personId: bool },
  continuacaoDe,                    // id da reunião anterior na série (encadeamento)
  tarefas:[...], createdAt, inicioReal, fimReal
}
```
**Série** = cadeia de reuniões ligadas por `continuacaoDe` (ou, como fallback, mesmo nome). Frequências em `REUN_FREQ` (dias: semanal=7, quinzenal=14, mensal=30, bimestral=60, trimestral=90).

### Compromisso
```
{ id, titulo, categoria, data, horaInicio, horaFim, local, obs, criadoEm }
```
Categorias: klain / externa / viagem / treino / ligação / almoço / outro.

### Note (anotação)
```
{ id, title, body /*HTML*/, category, color, pinned, noteTags:[], created, updated }
```
Cores: none / blue / teal / green / amber / red / purple / gray.

### Person *(campos observados)*
`{ id, name, setor, macroSetor, ... }` — `macroSetor` agrupa por departamento na sidebar.

### Rotina *(campos observados)*
`{ id, title, recorrencia /*ou rec*/, dias:[], active, prio, people:[], tags:[] }` — gera tarefas recorrentes conforme a frequência/dias.

### TesteSensorial *(Qualidade › Análise sensorial)*
```
{
  id, titulo, data:'YYYY-MM-DD', produtoBase, tipoTeste,
  status: 'rascunho'|'aberto'|'encerrado',
  revelado: bool,                                  // resultados mostram identidade real?
  amostras:  [{ id, codigo, identidadeReal }],     // identidadeReal oculta até "revelar" (teste cego)
  perguntas: [{ id, texto, escala, obrigatoria }], // escala = chave de SENS_ESCALAS
  respostas: [{ id, avaliador /*personId*/, createdAt,
               valores: { [amostraId]: { [perguntaId]: 'opção'|texto } } }]
}
```
Teste cego de comparação: avaliador prova e responde **todas as amostras numa tela** (matriz — atributos nas linhas, códigos nas colunas). **Escalas** (`SENS_ESCALAS`): `hedonica` (5 pts, gostei→desgostei), `jar_dulcor` (ponto ideal), `textura_desc` (descritiva), `intencao_compra` (5 pts), `comentario` (texto). **Melhor amostra** = maior média hedônica (Aparência/Sabor/Aceitação textura); mapas 1–5 em `SENS_NUM`. Intenção de compra reportada como **top-2-box** (% "certamente/provavelmente compraria"); dulçor e textura como **distribuição**.

> **Protótipo = quiosque** (1 aparelho, o avaliador se identifica e passa adiante). No sispro, cada avaliador responde do **próprio celular** → 1 registro em `respostas` por pessoa. Mesma estrutura de dados.

---

## 5. Persistência

- **localStorage-first.** Chaves no padrão `LS_*` (ex.: `LS_TASKS='taskflow_tasks'`, `LS_PROJECTS_PRO='taskflow_projects_pro'`, `LS_MEETINGS='taskflow_meetings'`, `LS_COMPROMISSOS='taskflow_compromissos'`, `LS_NOTES='taskflow_notes'`, `LS_SETORES_GESTAO='taskflow_setores_gestao'`, …).
- **Camada de dados** = funções `*_db` (`saveTask_db`, `saveMeeting_db`, …). É o **ponto único de troca** para API/banco quando a TI migrar — a UI chama essas funções, não o localStorage diretamente.
- Leitura: `safeJSON(chave, fallback)`. Escrita: `safeSetItem(chave, valor)`.
- O **botão "Exportar HTML"** salva o `outerHTML` da página — **não** embute o localStorage. Dados não viajam junto do arquivo; em outra máquina o seed regenera.

---

## 6. Design system

- **Cores (vars válidas):** `--blue-dark:#0d3d6b`, `--blue-mid:#185FA5`, `--blue-teal:#1a7a8a`; texto `--text/--text2/--text3`; superfícies `--card --bg --bg2 --bg3`; `--border`; semânticas `--success --danger --amber` (+ `--success-bg --danger-bg`); grupo Gestão `--purple`.
- **NÃO existem** `--blue`, `--warning`, `--card2` → usar `--blue-mid` + `color-mix(in srgb, var(--blue-mid) X%, transparent)`.
- **Header:** gradiente `#0d3d6b → #185FA5 → #1a7a8a`, full-width.
- **Tipografia/ícones:** Manrope + Tabler Icons (outline).
- **Layout:** dark mode default, conteúdo `max-width:1200px`, menu/sidebar sticky full-width, cards com gradiente suave, seções de fundo neutro, toasts, botão Exportar HTML.

---

## 7. Convenções permanentes

- **Navegação:** controles fixos no topo da sidebar + "← Meu dia!" + breadcrumb clicável + divisória forte com rótulo — em todo grupo/módulo novo.
- **Formulários:** obrigatórios com `*` vermelho (`var(--danger)`) e salvar bloqueado se vazio; opcionais com "(Opcional)"; defaults sem marcador. Exceções: **Entrada** e **Notas** (captura livre).
- **Safari/eventos:** para HTML inserido dinamicamente, usar **delegação de eventos** com `data-*` (onclick inline em nós novos é instável no Safari).

---

## 8. Funcionalidades-chave já implementadas

- **Análise de prazos com `prazoBase`** — baseline congelado; mede atraso real (`doneAt − prazoBase`) sem ser enganado por replanejamentos.
- **Aba Análise (Gestão)** — três painéis: **Pessoal** (no prazo %, atraso médio, tendência por semana, padrão por prioridade), **Equipe** (ordenada por carga, com heurística "precisa de apoio?") e **Reuniões** (follow-through das decisões). Seletor de período 30/90/tudo.
- **Carry-over de reuniões** — pendências mostram "N reuniões seguidas", contando as reuniões da mesma série ocorridas enquanto a pendência seguia aberta.
- **Encadeamento automático de recorrência** — ao **encerrar** uma reunião recorrente, a próxima ocorrência nasce sozinha, encadeada (`continuacaoDe`), na data da frequência; guarda anti-duplicação; pauta nasce limpa (levar assuntos = ação explícita).
- **Projetos Pro** — fases → grupos (por setor) → tarefas vinculadas, marcos, e análise de cronograma planejado × realizado.

---

## 9. Limitações conhecidas / em aberto

- **`prazoBase` só é honesto daqui pra frente** — tarefas antigas receberam `prazoBase = date` retroativo (não recuperam replanejamentos já ocorridos).
- **"Motivo do atraso" não é capturado** — o painel de Equipe não distingue atraso por dependência externa, prazo mal definido por quem pediu, ou repriorização. Exigiria um campo no fechamento da tarefa.
- **Carry-over depende de séries** — reuniões avulsas (sem `continuacaoDe` e com nomes diferentes) não acumulam contagem; nesse caso mostra-se só "há X dias aberta".
- **Ordens de Produção e módulo Manutenção** — pendentes de detalhamento de telas e schemas.

---

*Manter este documento enxuto: ao mudar uma regra estável, esquema ou paleta, atualizar aqui. O que muda toda semana (o HTML, listas de funções) NÃO entra — viraria desatualização.*
