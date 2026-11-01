-- Gravador v16 — preferência por usuário: aprovar antes de criar no Hub.
-- Padrão ligado (true). O app lê/grava com o JWT do usuário. A edge function
-- voice-queue lê com service_role na hora do ?action=propose, pelo user_id
-- dono do token. Sem linha = aprovação ligada.
--
-- Aplicar ANTES de publicar a edge function nova.
-- Não guarda segredo.

create table public.voice_prefs (
  user_id uuid primary key references auth.users (id) on delete cascade,
  aprovar_antes boolean not null default true,
  updated_at timestamptz not null default now()
);

comment on table public.voice_prefs is
  'Preferências do Gravador, uma linha por usuário. aprovar_antes ligado (padrão) exige aprovação no app antes de criar no Hub.';
comment on column public.voice_prefs.aprovar_antes is
  'true: propostas nascem pendentes. false: ?action=propose já grava status aprovado.';

alter table public.voice_prefs enable row level security;

revoke all on table public.voice_prefs from public, anon, authenticated;
grant select, insert, update on table public.voice_prefs to authenticated;
grant all on table public.voice_prefs to service_role;

create policy voice_prefs_select on public.voice_prefs
  for select to authenticated
  using (public.voice_user_allowed() and user_id = auth.uid());

create policy voice_prefs_insert on public.voice_prefs
  for insert to authenticated
  with check (public.voice_user_allowed() and user_id = auth.uid());

create policy voice_prefs_update on public.voice_prefs
  for update to authenticated
  using (public.voice_user_allowed() and user_id = auth.uid())
  with check (public.voice_user_allowed() and user_id = auth.uid());

-- Sem policy de DELETE: a linha fica; o usuário só liga e desliga.

create or replace function public.voice_prefs_touch()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is not null and new.user_id is distinct from auth.uid() then
    raise exception 'user_id must be the current user';
  end if;
  if tg_op = 'UPDATE' and new.user_id is distinct from old.user_id then
    raise exception 'user_id is immutable';
  end if;
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

revoke all on function public.voice_prefs_touch() from public, anon;
grant execute on function public.voice_prefs_touch() to authenticated, service_role;

create trigger voice_prefs_touch
  before insert or update on public.voice_prefs
  for each row execute function public.voice_prefs_touch();

notify pgrst, 'reload schema';
