-- ACE TMUA MVP account and progress schema
-- Run this entire file in Supabase Dashboard > SQL Editor.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  target_university text not null default '',
  target_score numeric(2,1) not null default 7.0
    check (target_score between 1.0 and 9.0),
  exam_sitting text not null default 'undecided'
    check (exam_sitting in ('october', 'january', 'undecided')),
  study_days smallint[] not null default array[1, 3, 5]::smallint[]
    check (
      cardinality(study_days) between 1 and 7
      and study_days <@ array[1, 2, 3, 4, 5, 6, 7]::smallint[]
    ),
  study_time time not null default '18:00',
  study_reminders_enabled boolean not null default false,
  trial_reminder_enabled boolean not null default true,
  onboarding_completed boolean not null default false,
  premium_interest boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RevenueCat updates this table through the trusted Supabase Edge Function.
-- There are deliberately no client INSERT/UPDATE policies.
create table if not exists public.entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  premium boolean not null default false,
  product_id text,
  expires_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.lesson_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id text not null,
  completed_at timestamptz not null default now(),
  best_correct integer not null default 0,
  best_total integer not null default 0,
  total_sessions integer not null default 1,
  total_seconds integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create table if not exists public.study_activities (
  user_id uuid not null references auth.users(id) on delete cascade,
  client_event_id text not null,
  activity_type text not null check (activity_type in ('lesson', 'practice')),
  reference_id text not null,
  occurred_at timestamptz not null,
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  correct_answers integer not null default 0 check (correct_answers >= 0),
  total_answers integer not null default 0 check (total_answers >= 0),
  created_at timestamptz not null default now(),
  primary key (user_id, client_event_id)
);

create table if not exists public.practice_results (
  user_id uuid not null references auth.users(id) on delete cascade,
  result_id text not null,
  test_id text not null,
  completed_at timestamptz not null,
  score integer not null,
  max_score integer not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  primary key (user_id, result_id)
);

create table if not exists public.practice_sessions (
  user_id uuid not null references auth.users(id) on delete cascade,
  test_id text not null,
  updated_at timestamptz not null,
  payload jsonb not null,
  primary key (user_id, test_id)
);

create index if not exists study_activities_user_date_idx
  on public.study_activities(user_id, occurred_at desc);
create index if not exists practice_results_user_date_idx
  on public.practice_results(user_id, completed_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists entitlements_set_updated_at on public.entitlements;
create trigger entitlements_set_updated_at
before update on public.entitlements
for each row execute procedure public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    display_name,
    target_university,
    target_score,
    exam_sitting,
    study_days,
    study_time,
    study_reminders_enabled,
    trial_reminder_enabled
  ) values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'target_university', ''),
    case
      when new.raw_user_meta_data ->> 'target_score' ~ '^[1-9](\.[0-9])?$'
        and (new.raw_user_meta_data ->> 'target_score')::numeric between 1 and 9
        then (new.raw_user_meta_data ->> 'target_score')::numeric(2,1)
      else 7.0
    end,
    case
      when new.raw_user_meta_data ->> 'exam_sitting' in ('october', 'january', 'undecided')
        then new.raw_user_meta_data ->> 'exam_sitting'
      else 'undecided'
    end,
    case
      when jsonb_typeof(new.raw_user_meta_data -> 'study_days') = 'array'
        and jsonb_array_length(new.raw_user_meta_data -> 'study_days') between 1 and 7
        and not exists (
          select 1
          from jsonb_array_elements_text(new.raw_user_meta_data -> 'study_days') as item(value)
          where item.value !~ '^[1-7]$'
        )
        then array(
          select item.value::smallint
          from jsonb_array_elements_text(new.raw_user_meta_data -> 'study_days') as item(value)
        )
      else array[1, 3, 5]::smallint[]
    end,
    case
      when new.raw_user_meta_data ->> 'study_time' ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
        then (new.raw_user_meta_data ->> 'study_time')::time
      else '18:00'::time
    end,
    new.raw_user_meta_data ->> 'study_reminders_enabled' = 'true',
    coalesce(new.raw_user_meta_data ->> 'trial_reminder_enabled', 'true') = 'true'
  )
  on conflict (id) do nothing;

  insert into public.entitlements (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.roll_up_lesson_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.activity_type = 'lesson' then
    insert into public.lesson_progress (
      user_id,
      lesson_id,
      completed_at,
      best_correct,
      best_total,
      total_sessions,
      total_seconds,
      updated_at
    ) values (
      new.user_id,
      new.reference_id,
      new.occurred_at,
      new.correct_answers,
      new.total_answers,
      1,
      new.duration_seconds,
      now()
    )
    on conflict (user_id, lesson_id) do update set
      completed_at = greatest(public.lesson_progress.completed_at, excluded.completed_at),
      best_correct = greatest(public.lesson_progress.best_correct, excluded.best_correct),
      best_total = greatest(public.lesson_progress.best_total, excluded.best_total),
      total_sessions = public.lesson_progress.total_sessions + 1,
      total_seconds = public.lesson_progress.total_seconds + excluded.total_seconds,
      updated_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists study_activity_roll_up on public.study_activities;
create trigger study_activity_roll_up
after insert on public.study_activities
for each row execute procedure public.roll_up_lesson_activity();

alter table public.profiles enable row level security;
alter table public.entitlements enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.study_activities enable row level security;
alter table public.practice_results enable row level security;
alter table public.practice_sessions enable row level security;

drop policy if exists "Users can read their profile" on public.profiles;
create policy "Users can read their profile"
on public.profiles for select to authenticated
using ((select auth.uid()) = id);

drop policy if exists "Users can create their profile" on public.profiles;
create policy "Users can create their profile"
on public.profiles for insert to authenticated
with check ((select auth.uid()) = id);

drop policy if exists "Users can update their profile" on public.profiles;
create policy "Users can update their profile"
on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "Users can read their entitlement" on public.entitlements;
create policy "Users can read their entitlement"
on public.entitlements for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users manage their lesson progress" on public.lesson_progress;
create policy "Users manage their lesson progress"
on public.lesson_progress for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage their study activity" on public.study_activities;
create policy "Users manage their study activity"
on public.study_activities for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage their practice results" on public.practice_results;
create policy "Users manage their practice results"
on public.practice_results for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage their practice sessions" on public.practice_sessions;
create policy "Users manage their practice sessions"
on public.practice_sessions for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select on public.entitlements to authenticated;
grant select, insert, update, delete on public.lesson_progress to authenticated;
grant select, insert, update, delete on public.study_activities to authenticated;
grant select, insert, update, delete on public.practice_results to authenticated;
grant select, insert, update, delete on public.practice_sessions to authenticated;
