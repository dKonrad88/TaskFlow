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

## Onde vivem as coisas (LEIA ANTES DE MEXER)
- **Código / layout** → `index.html`, versionado no **git** e publicado via **GitHub Pages**.
  - Repositório GitHub: https://github.com/dKonrad88/TaskFlow  (privado · conta dKonrad88)
  - GitHub Pages: ainda NÃO publicado. Como o repo é **privado**, o Pages grátis não publica
    (precisa GitHub Pro, ou tornar o repo público). O fluxo de código/sync NÃO depende do Pages.
- **Dados do usuário** (tarefas, pessoas, projetos, reuniões, etc.):
  - **ESTADO ATUAL → `localStorage` do navegador** (chaves `LS_*`, gravadas via `safeSetItem`).
    - ✅ NÃO estão no git — o git **nunca** toca nos dados.
    - ⚠️ NÃO sincronizam entre PC e Mac, e **somem se limpar o navegador / recriar o Codespace**.
      Hoje **cada máquina tem seus próprios dados locais**.
  - **ESTADO ALVO (planejado) → Supabase** (sync na nuvem, dentro do app). Quando a
    persistência migrar para o Supabase, aí sim vale de verdade "código no git / dados
    na nuvem, que não podem ser perdidos".

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
