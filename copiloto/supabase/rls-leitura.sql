-- Leitura do Copiloto para o papel authenticated.
-- NÃO foi aplicada. O Diego cola no SQL Editor do projeto Pessoal quando quiser.
-- A função continua em modo teste e grava com service_role; isto só libera a leitura do PWA.

-- copiloto_itens: RLS ligado, sem policy e sem GRANT para authenticated.
grant select on public.copiloto_itens to authenticated;
create policy copiloto_itens_select_authenticated
  on public.copiloto_itens
  for select
  to authenticated
  using (true);

-- hub_pessoas: cadastro compartilhado do Hub, sem user_id. RLS ligado, sem policy e sem GRANT.
grant select on public.hub_pessoas to authenticated;
create policy hub_pessoas_select_authenticated
  on public.hub_pessoas
  for select
  to authenticated
  using (true);

-- apto_compras_itens: NÃO criar policy nova.
-- Já existe apto_ci_all, FOR ALL, TO authenticated, USING (is_membro(lista_id)) WITH CHECK (is_membro(lista_id)).
-- O GRANT SELECT para authenticated também já existe.
-- Uma policy USING (true) abriria a lista de outras contas. A leitura vale para quem é membro da lista.

-- Rollback (só o que este arquivo cria):
-- drop policy if exists copiloto_itens_select_authenticated on public.copiloto_itens;
-- revoke select on public.copiloto_itens from authenticated;
-- drop policy if exists hub_pessoas_select_authenticated on public.hub_pessoas;
-- revoke select on public.hub_pessoas from authenticated;
