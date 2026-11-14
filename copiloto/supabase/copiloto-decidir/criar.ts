// Criação real a partir de um item aprovado do Copiloto.
// Este arquivo existe igual em copiloto-entrada/ e copiloto-decidir/: cada função publica a sua cópia.
// Hoje só "compras-item" cria algo: uma linha em public.lista_itens, na lista do supermercado
// (public.listas com tipo "mercado"). A lista do apartamento (apto_compras_itens) não é tocada.
// Tarefa, compromisso e gasto continuam só com o status "aprovado" (ainda sem destino definido).

// deno-lint-ignore no-explicit-any
type Adm = any;

type Criado = { ok: true; id: string } | { ok: false; erro: string };

/** Põe o item na lista do supermercado da qual o usuário é membro. */
export async function criarNaLista(adm: Adm, userId: string | null, payload: Record<string, unknown>): Promise<Criado> {
  const nome = String(payload.nome ?? "").trim();
  if (!nome) return { ok: false, erro: "o item está sem nome." };
  if (!userId) return { ok: false, erro: "não há usuário para achar a lista." };

  const { data: listas, error: e1 } = await adm.from("listas").select("id").eq("tipo", "mercado");
  if (e1 || !listas?.length) return { ok: false, erro: "não achei a lista do supermercado." };
  const ids = listas.map((l: { id: string }) => l.id);

  const { data: membro, error: e2 } = await adm.from("lista_membros").select("lista_id").eq("user_id", userId).in("lista_id", ids).limit(1);
  if (e2 || !membro?.length) return { ok: false, erro: "esta conta não é membro da lista do supermercado." };
  const lista_id = membro[0].lista_id as string;

  const valor = payload.valor_estimado === null || payload.valor_estimado === undefined || payload.valor_estimado === ""
    ? null
    : Number(payload.valor_estimado);

  // No payload, "ambiente" guarda a seção do mercado.
  const { data, error } = await adm.from("lista_itens").insert({
    lista_id,
    texto: nome.slice(0, 200),
    qtd: payload.quantidade ? String(payload.quantidade).slice(0, 60) : "",
    categoria: String(payload.ambiente || "Outros").slice(0, 80),
    preco: Number.isFinite(valor) ? valor : null,
    adicionado_por: userId,
  }).select("id").single();
  if (error || !data) return { ok: false, erro: "falhou a gravação na lista do supermercado." };
  return { ok: true, id: data.id as string };
}

/**
 * Depois de aprovado: cria o que o tipo pede e marca o item como "criado" ou "erro".
 * Tipos sem destino ficam em "aprovado".
 */
export async function efetivar(
  adm: Adm,
  itemId: string,
  userId: string | null,
  tipo: string,
  payload: Record<string, unknown>,
): Promise<{ status: "aprovado" | "criado" | "erro"; erro?: string }> {
  if (tipo !== "compras-item") return { status: "aprovado" };
  const r = await criarNaLista(adm, userId, payload);
  if (r.ok) {
    await adm.from("copiloto_itens").update({ status: "criado", ref_tabela: "lista_itens", ref_id: r.id }).eq("id", itemId);
    return { status: "criado" };
  }
  await adm.from("copiloto_itens").update({ status: "erro" }).eq("id", itemId);
  return { status: "erro", erro: r.erro };
}
