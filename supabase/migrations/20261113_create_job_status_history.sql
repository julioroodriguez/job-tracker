-- 1. Tabla de historial
create table if not exists public.job_status_history (
  id uuid primary key default gen_random_uuid(),

  job_id uuid not null
    references public.jobs(id) on delete cascade,

  user_id uuid not null
    references auth.users(id) on delete cascade,

  old_status text not null,
  new_status text not null,

  changed_at timestamptz not null default now()
);

-- 2. Índice para las consultas de historial
create index if not exists
  job_status_history_user_job_changed_idx
on public.job_status_history (
  user_id,
  job_id,
  changed_at desc
);

-- 3. Activar Row Level Security
alter table public.job_status_history
enable row level security;

-- 4. Permisos: usuarios autenticados solo pueden leer
revoke all on table public.job_status_history
from anon, authenticated;

grant select on table public.job_status_history
to authenticated;

-- 5. Política de lectura
drop policy if exists "Users read own job history"
on public.job_status_history;

create policy "Users read own job history"
on public.job_status_history
for select
to authenticated
using ((select auth.uid()) = user_id);

-- Esquema privado para la función del trigger
create schema if not exists private;

revoke all on schema private from public;

-- Función que registra cambios de estado
create or replace function private.log_job_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status is distinct from new.status then

    insert into public.job_status_history (
      job_id,
      user_id,
      old_status,
      new_status
    )
    values (
      new.id,
      new.user_id,
      old.status,
      new.status
    );

  end if;

  return new;
end;
$$;

-- Impedir llamadas directas desde los roles de la API
revoke all on function private.log_job_status_change()
from public, anon, authenticated;

-- Evitar duplicar el trigger si repetimos el SQL
drop trigger if exists
  trigger_job_status_change
on public.jobs;

-- Ejecutar la función después de cambiar status
create trigger trigger_job_status_change
after update of status
on public.jobs
for each row
execute function private.log_job_status_change();