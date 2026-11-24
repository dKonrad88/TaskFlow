# PCP › Contagem — Blueprint (v2)

v1 em 24/11/2026; **v2 no mesmo dia, com as decisões do Diego**. Nada implementado ainda.
Página para ler: https://claude.ai/artifact/QMsEtpRHvbiFBNusrGQiM8 (privada; compartilhar pelo Share).

> **Marcações:** **[mercado]** = prática consolidada, com fonte · **[proposta]** = ideia minha, sem fonte
> que valide a fórmula · **[decidido]** = resposta do Diego em 24/11.

---

## 1. O modelo de hoje

**Contagem cíclica** **[mercado]**. **20 slots** = 4 semanas × 5 noites (domingo a quinta); a frequência
vive no cadastro do item (`domingo1`…`quinta4`); quem conta escolhe o slot e recebe a lista. Semanal
ocupa 4 slots, quinzenal 2, mensal 1. O mercado chama de *count calendar* — **o desenho já é o certo**;
o que falta é medir o que sai dele.

## 2. Decisões tomadas **[decidido]**

| pergunta | resposta | consequência |
|---|---|---|
| Saldo do sistema entra? | **Sim** | acuracidade é possível |
| A contagem ajusta o ERP? | **Não, só registra** | ⚠️ muda a matemática — seção 3 |
| A aba registra contagem? | **Não. Só análise** | a lista da noite fica no ERP; a aba **nunca escreve** |
| Contagem cega? | **Preparar, não usar** | configuração desligada |
| Tolerância | **Por classe** | o export precisa trazer a classe |
| Origem dos itens e slots | **ERP** | ⭐ o histórico já existe |
| Quem conta é identificado? | **Sim** | acuracidade por contador |
| Cruzar com movimentações? | **Sim** | ⭐ compensação vira conclusão, não suspeita |
| Contagem de Marcas Próprias | **Vira espelho** | resumo só-leitura, para não abrir a aba inteira a quem não deve |
| Onde moram os indicadores | **Aqui na Contagem** | `PCP › Indicadores` segue zerada por enquanto |
| O export traz contagem antiga? | **Sim** | ⭐ a aba nasce com histórico; não há fase de juntar dado |

⭐ **Consequência boa:** como o dado vem do ERP, **o histórico já existe**. Cai o aviso da v1 de que o
painel começaria vazio: se o export trouxer os últimos meses, **a aba nasce cheia**.

## 3. ⚠️ A matemática muda porque o ERP não ajusta

`gap = contado − sistema`. Como ninguém ajusta o saldo, **o gap não some sozinho** — fica até que um
lançamento o feche. A série do gap passa a contar uma história direta:

| a série do gap | significado |
|---|---|
| `−40 → 0` fecha sozinho | ⭐ **lançamento atrasado entrou.** Ninguém mexeu no saldo, então é a única explicação. **Timing, não perda** |
| `−12 → −12 → −12` parado | **dívida antiga**: um erro só, nunca corrigido. Não é sangria |
| `−12 → −20 → −31` crescendo | **sangria ativa**: perda ou consumo não apontado, agora |
| `−40 → +35 → −20` oscilando | **método ou cadastro**: unidade, fator de conversão, item difícil |

⚠️ **A armadilha deste modelo: é proibido somar os gaps.** Um gap de −12 parado por 4 contagens soma
−48, mas a perda é **12**. O mesmo erro contado 4 vezes infla o relatório de perdas.

```
ERRADO:  perda do período = Σ gap
CERTO:   perda do período = Σ (gap de hoje − gap da contagem anterior)
```

O gap é **estado**; a variação do gap é o **fato novo**. O índice de compensação da v1 continua valendo,
mas **sobre a variação**:

```
índice = | soma das VARIAÇÕES com sinal | ÷ soma das variações em módulo
    perto de 0 → o que abre, fecha. Corte e lançamento.
    perto de 1 → tudo para o mesmo lado. Perda real.

taxa de fechamento = % dos gaps que voltaram a zero na contagem seguinte
```

## 4. Anatomia da divergência

**Quatro lentes para o tamanho:** quantidade (`contado − sistema`) · % do saldo · R$ (`|gap| × custo`) ·
**dias de consumo** (`gap ÷ consumo diário`) **[proposta]**, que é a linguagem que o PCP já fala e que a
Cobertura já calcula.

**Mapa de calor item × contagem.** Linhas = itens, colunas = últimas contagens, célula = **o gap**.
Verde bateu · vermelho falta · roxo sobra · hachura não contado · intensidade = tamanho.

⚠️ **Duas linhas que a v1 leria errado:**
- **Oito células vermelhas iguais** (`−12` repetido) parece a pior linha e é a mais inofensiva: um único
  erro parado. Somar dá 96 kg de perda que não existem.
- **Números crescendo** (`−8, −14, −21, −29…`) é a que sangra — e a cor sozinha não distingue as duas.
  **Por isso o número não pode sair de dentro da célula**, e a aba precisa mostrar a variação ao lado do gap.

**Perfis [proposta]:** 🟢 Limpo (zeros seguidos → contar menos) · 🔵 Fecha sozinho (abre e volta → corte e
apontamento, **não é perda**) · 🟣 Dívida parada (mesmo valor repetido → achar o dia de origem e acertar
a ficha) · 🔴 Sangrando (módulo crescendo → investigar agora) · 🟠 Caótico (amplitude grande, sinais
trocados → unidade e fator de conversão no cadastro) · ⚫ Mal coberto (muitas noites sem contagem →
aderência, não acuracidade).

**Causa raiz:** campo fechado (recebimento · apontamento · baixa não lançada · perda/quebra · erro de
unidade · erro de contagem · transferência · outro). Com o cruzamento de movimentações liberado, a aba
pode **sugerir** a causa: se o gap fechou e há um lançamento daquele item entre as duas contagens, o
candidato se escreve sozinho.

## 5. A visão por grupo (pedido do Diego)

Todos os itens em tabela, agrupados por **matéria-prima, embalagem, produto acabado, marketing** e o que
mais existir no ERP. Colunas: Item · Classe (A/B/C) · Contagens · Certas · Divergentes · Não feitas ·
**% divergência** (ordena a tela) · **Importância** (% do valor do estoque do grupo) · Gap atual (qtd e
R$) · Variação no período · Perfil · Última contagem e quem contou.

⭐ **As duas colunas de % valem mais cruzadas:**

| | erra muito | erra pouco |
|---|---|---|
| **importante** | 🔴 ataca primeiro — é onde está o dinheiro | 🟢 sob controle, não mexer |
| **pouco importante** | 🟠 barato de errar mas gasta noite: contar menos ou arrumar cadastro | ⚪ reduzir frequência sem dó |

O quadrante de baixo à direita **devolve noites de trabalho**; o de cima à esquerda justifica a aba.

## 6. Modo investigação (pedido do Diego)

O Diego já faz na mão: item semanal ou quinzenal que deu erro passa a ser contado **todo dia** até achar
onde o lançamento se perde. O primo disso no mercado é o **grupo de controle** **[mercado]**.

⭐ **Por que funciona:** com contagem semanal cabem dezenas de lançamentos entre duas noites e achar o
culpado é garimpo. **Com contagem diária a janela é de um dia** e a lista de movimentações é curta o
bastante para o erro saltar aos olhos. Encurtar o intervalo não melhora a contagem — **melhora a
investigação**.

Na tela: marcar o item como **em investigação** (data e motivo) · ele entra em todas as noites por uma
**lista paralela**, sem tocar no cadastro de slots do ERP (respeita a regra de nunca escrever lá) · a
série diária do gap lado a lado com **as movimentações daquele dia** · saída sugerida após N dias limpos ·
histórico de quantas vezes o item já entrou e o que resolveu da última vez.

## 7. Outros indicadores

Acuracidade (IRA) por classe **[mercado]** (alvo 95–99%; classe A 99,5%+ — número de fornecedor, bússola
e não meta) · aderência ao calendário · cobertura do ciclo (itens **e valor**) · **itens sem slot** (nunca
contados, hoje invisíveis — o achado mais barato) · carga por slot (20 barras; quase sempre
desequilibrado) · ~~dívida total da ficha~~ **[proposta RECUSADA]**: era a soma dos gaps *abertos hoje*
em R$ — ⚠️ **o Diego tirou esse cartão da tela em 24/11, não recolocar sem ele pedir** (o valor por item,
`gapRS`, continua calculado, para a coluna de gap em R$) · acuracidade por contador, família e
almoxarifado · taxa de recontagem ·
dias desde a última contagem.

## 8. Por onde começar

Sem fase de "juntar dado", porque o histórico vem do ERP:

1. **Importar o export e entregar a visão por grupo** — a tela pedida, já nascendo cheia.
2. **Gap, variação, perfis e mapa de calor** — o diagnóstico, sobre o mesmo dado.
3. **Modo investigação** com as movimentações do dia — transforma diagnóstico em causa achada.
4. Espelho em Marcas Próprias · contagem cega preparada · sugestão de frequência.

**O export** (confirmado pelo Diego): o ERP traz as contagens antigas, então a aba começa com histórico.
Por linha contada o arquivo precisa ter: item, grupo, classe, slot, data, **saldo do sistema daquele
instante**, quantidade contada, quem contou, unidade e custo. O único campo a conferir ao abrir o arquivo
é o **saldo histórico** — se vier só o saldo de hoje, o gap de uma contagem antiga não dá para recalcular
e a seção 3 perde o retrospecto. É uma olhada no cabeçalho, não um impedimento.

## 9. Em aberto

- **O espelho em Marcas Próprias**: definir quais itens aparecem lá e quem enxerga o quê.
- **O formato do export**: colunas e nomes de campo, para a importação casar de primeira.

## 10. Fontes

Guias de fornecedor, documentação de ERP e TCCs: convergem nas definições, divergem nos números.
O índice de compensação, os perfis, a dívida da ficha e a frequência dinâmica para baixo são
**propostas, não padrões**.

[NetSuite](https://www.netsuite.com/portal/resource/articles/inventory-management/using-inventory-control-software-for-cycle-counting.shtml) ·
[Infios](https://www.infios.com/en/knowledge-center/glossary/wms-inventory-accuracy) ·
[Shopify](https://www.shopify.com/blog/cycle-count) ·
[Oracle Cycle Count Classes](https://docs.oracle.com/cd/A60725_05/html/comnls/us/inv/ccclass.htm) ·
[Oracle Variance Processing](https://docs.oracle.com/en/industries/retail/retail-xstore-point-of-service/21.0/rpxsg/automatic-variance-processing.htm) ·
[Infor](https://docs.infor.com/sxe/2021.x/en-us/sxolh/jyy1503926132934.html) ·
[Uphance](https://uphance.com/blog/blind-inventory-counting/) ·
[Global Spec](https://www.globalspec.com/reference/21784/203279/chapter-5-day-5-45-control-groups-and-root-cause-analysis) ·
[AccountingTools](https://accountingtools.com/articles/how-many-accounting-periods-does-an-inventory-error-affect.html) ·
[TCC UFRB](https://ri.ufrb.edu.br/bitstream/123456789/2768/1/Implantacao_Indicador_Acuracidade_TCC_2022.pdf)
