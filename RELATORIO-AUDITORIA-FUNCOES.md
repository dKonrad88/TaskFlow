# Relatório de Auditoria de Funções JavaScript — TaskFlow

**Arquivo analisado:** `taskflow.html` (1.6 MB, ~26.500 linhas, JS inline)
**Data:** 2026-06-15
**Escopo:** Mapear todas as funções definidas e identificar candidatas a código morto (nunca chamadas).

---

## Resumo executivo

| Métrica | Valor |
|---|---|
| Nomes de função definidos | **997** |
| Funções **comprovadamente mortas** (remoção recomendada) | **2** |
| Falsos positivos descartados (IIFE / callbacks / chamada dinâmica) | 28 |

> Apesar de 997 definições, a esmagadora maioria está em uso. O TaskFlow chama muitas funções de **forma dinâmica** (handlers `onclick="..."` montados em strings de template, callbacks em `.map(fn)`, listeners `addEventListener`). Por isso, contagem ingênua de `nome(` gera falsos positivos — a análise abaixo trata cada caso.

---

## Metodologia

1. Extração de todas as definições via regex, cobrindo 4 formas:
   - `function nome(...)`
   - `const/let/var nome = function`
   - `const/let/var nome = (args) => ...`
   - `const/let/var nome = arg => ...`
2. Para cada nome, contagem no arquivo inteiro de:
   - **Ocorrências totais** do identificador (palavra inteira) — pega até menções em strings de `onclick` e comentários.
   - **Call sites reais** (`nome(`) fora da linha de definição.
   - **Referências** fora da linha de definição (callbacks passados sem parênteses).
3. Classificação:
   - `Ocorrências == 1` → aparece só na definição → **morta** (impossível ser chamada por nome).
   - `Call sites == 0` mas `Referências ≥ 1` → revisão manual (callback / handler / chamada dinâmica).
4. Inspeção manual de cada candidata para descartar IIFEs e despacho dinâmico.

**Limitação conhecida:** análise estática de texto não constrói grafo de chamadas com escopo. Funções *locais* homônimas (ex.: vários `_render`, `escHandler`, `onUp` definidos dentro de funções diferentes) não podem ser avaliadas individualmente por este método e foram consideradas vivas. Código morto *transitivo* (vivo só porque é chamado por outra função morta) foi verificado manualmente para as 2 candidatas e não há cadeia adicional.

---

## ✅ Funções mortas — remoção recomendada

### 1. `_aNome(id)` — linha **11923**

```js
function _aNome(id){const p=people.find(x=>x.id===id);return p?p.name:'Sem executor';}
```

- **Ocorrências no arquivo inteiro: 1** (somente a definição).
- Está num bloco de helpers de análise (`_aIso`, `_aDe`, `_aInic`...). Os irmãos são usados; este não.
- Provavelmente **substituído** por outro resolvedor de nome de pessoa (ex.: o padrão `people.find(...).name` usado diretamente em vários pontos).
- **Sugestão:** remover a linha 11923 inteira. Risco: nenhum (sem referências).

### 2. `openQuickEntry()` — linhas **5963–5980**

```js
function openQuickEntry(){
  const title = prompt('Título da tarefa:');
  if(!title) return;
  const t = { id: ..., title: title.trim(), date: today, done: false,
              executor: CURRENT_USER_ID, escopo: 'klain', createdAt: today };
  tasks.push(t);
  saveTask_db(t);
  renderMeuDia();
  updateStats();
  toast('✅ Tarefa criada');
}
```

- **Ocorrências no arquivo inteiro: 1** (somente a definição).
- Funcionalidade de "entrada rápida de tarefa" via `prompt()`, **nunca conectada** a botão, atalho de teclado ou menu.
- Parece um recurso iniciado e não finalizado/ligado à UI.
- **Sugestão:** remover as linhas 5963–5980. As funções que ela chama (`saveTask_db`, `renderMeuDia`, `updateStats`, `toast`) são usadas em outros lugares — **não** remover.
- **Antes de remover, decidir:** se a "entrada rápida" ainda é desejada, o correto é *ligá-la* à UI em vez de removê-la. Caso contrário, remover.

---

## ⚠️ Falsos positivos analisados (NÃO remover)

Apareceram como "sem call site", mas a inspeção confirmou que **estão em uso**:

| Função | Linha | Por que está viva |
|---|---|---|
| `_showPersonViewControls` | 23309 | **IIFE** — `(function _showPersonViewControls(){...})()`; executa imediatamente |
| `setEquipeAgrupar`, `setEquipeOrdenar` | 11858–11859 | Chamadas dinamicamente via `_radioRow('setEquipeAgrupar', ...)` que monta o `onclick` |
| `_cardProduto`, `campoHTML`, `itemPendenteHTML`, `itemConcluidaHTML`, `itemAtrasadaHTML`, `noteCardHTML`, `noteListRowHTML`, `projectProCardHTML`, `renderTaskRow`, `tarefaNode` | várias | Passadas como callback em `.map(fn)` |
| `escHandler`, `onUp`, `onMove`, `_ddOutsideClick`, `_ttDropdownOutsideClick` | várias | Registradas/removidas como listeners (`addEventListener`/`removeEventListener`) por referência |
| `_undo`, `_undoToggle`, `_executarDesfazer`, `_close`, `_doEmptyTrash`, `_aindaVale`, `_thFor`, `fmtISO`, `esc`, `getPersonStatus`, `pulsar` | várias | Atribuídas a `onclick`/timeout ou referenciadas como callback (call site indireto) |

---

## Recomendações finais

1. **Remover** `_aNome` (linha 11923) e `openQuickEntry` (linhas 5963–5980) — economia direta, risco zero. *(Para `openQuickEntry`, decidir antes se a entrada rápida deve ser religada à UI.)*
2. **Não confiar** em busca textual simples para "código morto" neste arquivo: o padrão de `onclick` em strings e `.map(callback)` exige verificação por referência, não só por `nome(`.
3. **Melhoria estrutural (opcional):** o arquivo concentra ~1.000 funções num único HTML de 1.6 MB. Modularizar (separar JS em arquivos + bundler) habilitaria ferramentas reais de *tree-shaking*/lint (ESLint `no-unused-vars`), que detectam morte transitiva e de escopo automaticamente — algo fora do alcance de análise textual.

---

*Auditoria estática de texto. Para garantia total, recomenda-se complementar com ESLint após modularização.*
