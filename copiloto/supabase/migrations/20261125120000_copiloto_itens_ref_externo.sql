-- Copiloto: número do item criado no Hub Klain (tarefa ou compromisso).
-- Aplicar no projeto Pessoal ANTES de publicar as funções novas.
-- ref_id continua uuid e fica nulo nos itens do Hub; o número oficial vai em ref_externo.
-- Não guarda segredo. Não muda RLS: vale a policy de leitura já existente.

alter table public.copiloto_itens
  add column if not exists ref_externo text;

comment on column public.copiloto_itens.ref_externo is
  'Número do item no Hub Klain (tarefa ou compromisso), quando o envio conclui. ref_id fica nulo nesses casos.';
