-- Aparência do Copiloto sincronizada entre aparelhos: uma linha por usuário.
-- Aplicada no projeto Pessoal em 25/11/2026 (migração copiloto_prefs_aparencia).
-- dados: { rev, fundo: { x, y, z, o }, layout, tema, tela: { w, h } }
-- fundo_img: a foto de fundo já reduzida, como data URL (JPEG). Nula = sem foto própria.
-- Só o celular grava; o computador só lê. Cada conta vê e grava apenas a própria linha.

create table if not exists public.copiloto_prefs (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  dados jsonb not null default '{}'::jsonb,
  fundo_img text,
  updated_at timestamptz not null default now()
);

alter table public.copiloto_prefs enable row level security;

create policy copiloto_prefs_dono
  on public.copiloto_prefs
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

revoke all on public.copiloto_prefs from anon;
grant select, insert, update on public.copiloto_prefs to authenticated;

-- Rollback:
-- drop table if exists public.copiloto_prefs;
