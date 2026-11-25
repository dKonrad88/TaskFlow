// Etapa de IA da copiloto-entrada: transforma a fala em um card pronto para conferir.
// Só entra em tarefa e compromisso do Hub Klain. Resume o título, organiza a descrição,
// reconhece as pessoas citadas (pelo cadastro hub_pessoas) e as datas.
// Nunca derruba a entrada: sem chave, com erro, recusa ou demora, devolve o payload das regras.
// A chave fica no segredo ANTHROPIC_API_KEY da função. Ela não vai para o front.

const MODELO = "claude-haiku-5-5";

export type Pessoa = { id: string; nome: string; papel: string | null; padrao?: boolean | null };

export type Refino =
  | { estado: "ok"; payload: Record<string, unknown> }
  | { estado: "sem-chave" | "falhou" | "recusou" };

const DATA = /^\d{4}-\d{2}-\d{2}$/;
const DATA_HORA = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/;

function semAcento(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
}

function hojeSP(agora: Date): { data: string; diaSemana: string } {
  const data = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(agora);
  const diaSemana = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "long" }).format(agora);
  return { data, diaSemana };
}

const SISTEMA = `Você prepara cards do Copiloto, um app em que o Diego dita por voz tarefas e compromissos de trabalho. A fala chega transcrita, sem pontuação e às vezes com repetições ou erros de transcrição. O Diego confere o card antes de aprovar, então o seu trabalho é entregar os campos já arrumados para ele só bater o olho.

Como preencher:
- titulo: o que precisa ser feito, em poucas palavras (em geral de 3 a 8), começando pela ação ou pelo assunto. Sem data, sem nomes de quem vai em cópia e sem as palavras "tarefa", "lembrete" ou "compromisso". Não invente assunto que não está na fala.
- descricao: o restante útil da fala em uma ou duas frases claras. Deixe vazia se o título já diz tudo. Não repita datas nem pessoas que já têm campo próprio.
- executor: quem vai fazer. "pra mim", "minha" ou nenhuma indicação querem dizer o próprio Diego: nesses casos devolva null, porque o app já assume ele.
- solicitante: só preencha se a fala disser que outra pessoa pediu. Caso contrário, null.
- em_copia: quem a fala manda pôr em cópia.
- participantes: só para compromisso: quem participa, além do Diego.
- inicio e vencimento (tarefa): datas no formato AAAA-MM-DD. "prazo", "até", "vence" e "entrega" são vencimento. Sem data na fala, null.
- data_hora (compromisso): AAAA-MM-DDTHH:MM. Se houver dia mas não hora, devolva só AAAA-MM-DD. Sem data, null.
- local (compromisso): onde acontece, se a fala disser. Senão, null.

Pessoas: use somente nomes da lista de cadastro que vem na mensagem, escritos exatamente como estão lá. A fala costuma trazer só o primeiro nome ou um apelido; escolha a pessoa da lista quando houver uma única correspondência razoável. Se ninguém da lista corresponder, ou se dois nomes servirem igualmente, deixe de fora: é melhor um campo vazio que o Diego preenche do que a pessoa errada. Grupos só podem ser executor ou solicitante.

Datas relativas ("hoje", "amanhã", "sexta", "daqui a sete dias") contam a partir da data de hoje informada na mensagem. Dia e mês sem ano são do ano corrente.`;

/**
 * Pede ao modelo os campos do card. Devolve o payload das regras com os campos da IA por cima,
 * mais "pessoas" no formato que o app e a copiloto-decidir já entendem.
 */
export async function refinarComIa(
  texto: string,
  tipo: string,
  payload: Record<string, unknown>,
  pessoas: Pessoa[],
  agora: Date,
): Promise<Refino> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
  if (!apiKey) return { estado: "sem-chave" };

  try {
    // Importação tardia: se a biblioteca não carregar, a função continua de pé e cai nas regras.
    const { default: Anthropic } = await import("npm:@anthropic-ai/sdk");
    const { zodOutputFormat } = await import("npm:@anthropic-ai/sdk/helpers/zod");
    const { z } = await import("npm:zod");

    const Saida = z.object({
      titulo: z.string(),
      descricao: z.string(),
      executor: z.string().nullable(),
      solicitante: z.string().nullable(),
      em_copia: z.array(z.string()),
      participantes: z.array(z.string()),
      inicio: z.string().nullable(),
      vencimento: z.string().nullable(),
      data_hora: z.string().nullable(),
      local: z.string().nullable(),
    });

    const { data, diaSemana } = hojeSP(agora);
    const cadastro = pessoas.map((p) => `- ${p.nome}${p.papel === "grupo" ? " (grupo)" : (p.papel ? ` (${p.papel})` : "")}`).join("\n");
    const mensagem = [
      `Tipo do card: ${tipo === "klain-compromisso" ? "compromisso" : "tarefa"}`,
      `Hoje: ${data} (${diaSemana}), fuso de São Paulo`,
      `Cadastro de pessoas:\n${cadastro || "(vazio)"}`,
      `Fala transcrita:\n${texto}`,
    ].join("\n\n");

    // Espera curta e uma única nova tentativa: a gravação não pode ficar presa na IA.
    const client = new Anthropic({ apiKey, timeout: 12_000, maxRetries: 1 });
    const resposta = await client.messages.parse({
      model: MODELO,
      max_tokens: 4000,
      system: SISTEMA,
      messages: [{ role: "user", content: mensagem }],
      output_config: { effort: "low", format: zodOutputFormat(Saida) },
    });

    if (resposta.stop_reason === "refusal") return { estado: "recusou" };
    const s = resposta.parsed_output;
    if (!s) return { estado: "falhou" };

    // Só entram ids de quem está no cadastro, com o nome batendo por inteiro.
    const porNome = new Map(pessoas.map((p) => [semAcento(p.nome), p]));
    const achar = (nome: string | null | undefined) => (nome ? porNome.get(semAcento(nome)) ?? null : null);
    const soPessoas = (nomes: string[]) => {
      const ids: string[] = [];
      for (const nome of nomes) {
        const p = achar(nome);
        if (p && p.papel !== "grupo" && !ids.includes(p.id)) ids.push(p.id);
      }
      return ids;
    };

    const novo: Record<string, unknown> = { ...payload };
    const titulo = s.titulo.trim();
    if (titulo) novo.titulo = titulo.slice(0, 120);
    novo.descricao = s.descricao.trim().slice(0, 1000);

    const gente: Record<string, unknown> = {};
    if (tipo === "klain-tarefa") {
      if (s.inicio && DATA.test(s.inicio)) novo.inicio = s.inicio;
      if (s.vencimento && DATA.test(s.vencimento)) novo.vencimento = s.vencimento;
      const executor = achar(s.executor);
      const solicitante = achar(s.solicitante);
      // Sem a chave, o app assume o Diego como padrão.
      if (executor) gente.executor_id = executor.id;
      if (solicitante) gente.solicitante_id = solicitante.id;
      const copia = soPessoas(s.em_copia);
      if (copia.length) gente.em_copia = copia;
    } else {
      if (s.data_hora && (DATA.test(s.data_hora) || DATA_HORA.test(s.data_hora))) {
        novo.data_hora = DATA_HORA.test(s.data_hora) && s.data_hora.length === 16 ? `${s.data_hora}:00` : s.data_hora;
      }
      if (s.local && s.local.trim()) novo.local = s.local.trim().slice(0, 120);
      const participantes = soPessoas(s.participantes);
      if (participantes.length) gente.participantes_ids = participantes;
    }
    if (Object.keys(gente).length) novo.pessoas = gente;

    return { estado: "ok", payload: novo };
  } catch (erro) {
    // Qualquer falha (rede, limite, chave inválida, biblioteca) vira aviso no log e segue pelas regras.
    const e = erro as { name?: string; status?: number; message?: string };
    console.error(`copiloto-entrada ia: ${e?.name ?? "erro"} ${e?.status ?? ""} ${e?.message ?? String(erro)}`);
    return { estado: "falhou" };
  }
}
