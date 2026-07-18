-- Bring existing profiles onto the TMUA 1.0–9.0 scale and add study-plan preferences.

alter table public.profiles
  drop constraint if exists profiles_target_score_check;

alter table public.profiles
  alter column target_score drop default;

alter table public.profiles
  alter column target_score type numeric(2,1)
  using (
    case
      when target_score > 9 then least(9.0, target_score::numeric / 10.0)
      else greatest(1.0, target_score::numeric)
    end
  );

alter table public.profiles
  alter column target_score set default 7.0;

alter table public.profiles
  add constraint profiles_target_score_check
  check (target_score between 1.0 and 9.0);

alter table public.profiles
  add column if not exists study_days smallint[] not null
    default array[1, 3, 5]::smallint[],
  add column if not exists study_time time not null default '18:00',
  add column if not exists study_reminders_enabled boolean not null default false,
  add column if not exists trial_reminder_enabled boolean not null default true;

alter table public.profiles
  drop constraint if exists profiles_study_days_check;

alter table public.profiles
  add constraint profiles_study_days_check
  check (
    cardinality(study_days) between 1 and 7
    and study_days <@ array[1, 2, 3, 4, 5, 6, 7]::smallint[]
  );

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
