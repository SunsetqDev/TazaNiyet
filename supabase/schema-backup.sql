-- Резервная копия структуры базы Supabase проекта TazaNiyet (снимок 2026-11-03, после казахского языка и защиты).
-- Таблицы, индексы, функции (RPC), права, политики RLS, триггеры, бакеты Storage
-- и справочные данные (повседневные задания, вузы).
-- Личных данных пользователей (профили, заявки, фото) здесь НЕТ — они хранятся только в Supabase.
--
-- Как восстановить в новом проекте Supabase: SQL Editor → вставить весь файл → Run.
-- Сначала таблицы, затем функции и права/политики — порядок в файле уже правильный.
-- Таблица profiles ссылается на auth.users, бакеты — на storage: в новом проекте Supabase они уже есть.

-- ===== Таблицы =====
create table if not exists public.profiles (
  id uuid not null,
  name text,
  city text default 'Актобе'::text,
  points integer default 0 not null,
  region text,
  place_name text,
  place_type text,
  is_moderator boolean default false not null,
  birth_year integer,
  privacy_accepted_at timestamp with time zone,
  parent_name text,
  parent_contact text,
  parent_verified boolean default false not null,
  nickname text,
  avatar_emoji text,
  avatar_color text,
  avatar_path text,
  last_active_at timestamp with time zone default now() not null,
  constraint profiles_pkey PRIMARY KEY (id),
  constraint profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);
alter table public.profiles enable row level security;

create table if not exists public.tasks (
  id bigint generated always as identity not null,
  emoji text,
  title text not null,
  description text,
  place_type text default 'any'::text not null,
  points integer not null,
  category text default 'other'::text not null,
  title_kk text,
  description_kk text,
  constraint tasks_pkey PRIMARY KEY (id)
);
alter table public.tasks enable row level security;

create table if not exists public.submissions (
  id bigint generated always as identity not null,
  user_id uuid default auth.uid() not null,
  task_id bigint not null,
  before_path text not null,
  after_path text not null,
  status text default 'pending'::text not null,
  created_at timestamp with time zone default now() not null,
  reject_reason text,
  constraint submissions_pkey PRIMARY KEY (id),
  constraint submissions_task_id_fkey FOREIGN KEY (task_id) REFERENCES tasks(id),
  constraint submissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);
alter table public.submissions enable row level security;

create table if not exists public.universities (
  id bigint generated always as identity not null,
  name text not null,
  city text not null,
  type text default 'university'::text not null,
  website text,
  description text,
  programs text,
  checked_at date,
  photo_url text,
  requirements text,
  photo_credit text,
  constraint universities_pkey PRIMARY KEY (id)
);
alter table public.universities enable row level security;

create table if not exists public.portfolio_links (
  code text default substr(replace((gen_random_uuid())::text, '-'::text, ''::text), 1, 12) not null,
  user_id uuid default auth.uid() not null,
  created_at timestamp with time zone default now() not null,
  constraint portfolio_links_user_id_key UNIQUE (user_id),
  constraint portfolio_links_pkey PRIMARY KEY (code),
  constraint portfolio_links_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);
alter table public.portfolio_links enable row level security;

create table if not exists public.reports (
  id bigint generated always as identity not null,
  author_id uuid default auth.uid() not null,
  category text not null,
  description text not null,
  photo_paths text[] not null,
  lat double precision not null,
  lng double precision not null,
  accuracy_m real,
  address text,
  region text,
  place_name text,
  status text default 'submitted'::text not null,
  reject_reason text,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone default now() not null,
  constraint reports_pkey PRIMARY KEY (id),
  constraint reports_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  constraint reports_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL,
  constraint reports_category_check CHECK ((category = ANY (ARRAY['park'::text, 'dump'::text, 'road'::text, 'river'::text, 'yard'::text, 'other'::text]))),
  constraint reports_description_check CHECK (((char_length(description) >= 5) AND (char_length(description) <= 500))),
  constraint reports_lat_check CHECK (((lat >= (40)::double precision) AND (lat <= (56)::double precision))),
  constraint reports_lng_check CHECK (((lng >= (46)::double precision) AND (lng <= (88)::double precision))),
  constraint reports_photo_paths_check CHECK (((array_length(photo_paths, 1) >= 1) AND (array_length(photo_paths, 1) <= 3))),
  constraint reports_status_check CHECK ((status = ANY (ARRAY['submitted'::text, 'under_review'::text, 'approved'::text, 'rejected'::text])))
);
alter table public.reports enable row level security;

create table if not exists public.spot_tasks (
  id bigint generated always as identity not null,
  report_id bigint,
  author_id uuid,
  title text not null,
  description text not null,
  category text not null,
  difficulty text not null,
  points integer not null,
  lat double precision not null,
  lng double precision not null,
  address text,
  region text,
  place_name text,
  photo_paths text[] not null,
  status text default 'available'::text not null,
  assignee_id uuid,
  claimed_at timestamp with time zone,
  claim_expires_at timestamp with time zone,
  result_photo_path text,
  result_lat double precision,
  result_lng double precision,
  result_distance_m double precision,
  result_submitted_at timestamp with time zone,
  reject_count integer default 0 not null,
  last_reject_reason text,
  reviewed_by uuid,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default now() not null,
  constraint spot_tasks_report_id_key UNIQUE (report_id),
  constraint spot_tasks_pkey PRIMARY KEY (id),
  constraint spot_tasks_assignee_id_fkey FOREIGN KEY (assignee_id) REFERENCES auth.users(id) ON DELETE SET NULL,
  constraint spot_tasks_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE SET NULL,
  constraint spot_tasks_report_id_fkey FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE SET NULL,
  constraint spot_tasks_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL,
  constraint spot_tasks_difficulty_check CHECK ((difficulty = ANY (ARRAY['easy'::text, 'medium'::text, 'hard'::text]))),
  constraint spot_tasks_points_check CHECK (((points >= 10) AND (points <= 300))),
  constraint spot_tasks_status_check CHECK ((status = ANY (ARRAY['available'::text, 'in_progress'::text, 'under_review'::text, 'completed'::text, 'cancelled'::text]))),
  constraint spot_tasks_title_check CHECK (((char_length(title) >= 3) AND (char_length(title) <= 80)))
);
alter table public.spot_tasks enable row level security;

create table if not exists public.banned_words (
  word text not null,
  lang text not null,
  created_at timestamp with time zone default now() not null,
  constraint banned_words_pkey PRIMARY KEY (word),
  constraint banned_words_lang_check CHECK ((lang = ANY (ARRAY['ru'::text, 'en'::text])))
);
alter table public.banned_words enable row level security;

create table if not exists public.penalties (
  id bigint generated always as identity not null,
  user_id uuid not null,
  moderator_id uuid,
  source text not null,
  source_id bigint,
  points integer default 0 not null,
  created_at timestamp with time zone default now() not null,
  constraint penalties_pkey PRIMARY KEY (id),
  constraint penalties_moderator_id_fkey FOREIGN KEY (moderator_id) REFERENCES auth.users(id) ON DELETE SET NULL,
  constraint penalties_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  constraint penalties_source_check CHECK ((source = ANY (ARRAY['submission'::text, 'report'::text, 'spot_result'::text, 'message'::text])))
);
alter table public.penalties enable row level security;

create table if not exists public.account_deletions (
  id bigint generated always as identity not null,
  moderator_id uuid,
  kind text not null,
  reason text,
  penalties integer,
  last_active_at timestamp with time zone,
  deleted_at timestamp with time zone default now() not null,
  constraint account_deletions_pkey PRIMARY KEY (id),
  constraint account_deletions_moderator_id_fkey FOREIGN KEY (moderator_id) REFERENCES auth.users(id) ON DELETE SET NULL,
  constraint account_deletions_kind_check CHECK ((kind = ANY (ARRAY['fraud'::text, 'inactive'::text])))
);
alter table public.account_deletions enable row level security;

create table if not exists public.conversations (
  id bigint generated always as identity not null,
  kind text not null,
  title text,
  direct_key text,
  created_by uuid,
  created_at timestamp with time zone default now() not null,
  last_message_at timestamp with time zone default now() not null,
  constraint conversations_direct_key_key UNIQUE (direct_key),
  constraint conversations_pkey PRIMARY KEY (id),
  constraint conversations_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL,
  constraint conversations_kind_check CHECK ((kind = ANY (ARRAY['direct'::text, 'group'::text]))),
  constraint conversations_title_check CHECK (((title IS NULL) OR (char_length(title) <= 60)))
);
alter table public.conversations enable row level security;

create table if not exists public.conversation_members (
  conversation_id bigint not null,
  user_id uuid not null,
  role text default 'member'::text not null,
  joined_at timestamp with time zone default now() not null,
  last_read_at timestamp with time zone default now() not null,
  constraint conversation_members_pkey PRIMARY KEY (conversation_id, user_id),
  constraint conversation_members_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  constraint conversation_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  constraint conversation_members_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'member'::text])))
);
alter table public.conversation_members enable row level security;

create table if not exists public.messages (
  id bigint generated always as identity not null,
  conversation_id bigint not null,
  sender_id uuid,
  body text not null,
  created_at timestamp with time zone default now() not null,
  deleted_at timestamp with time zone,
  constraint messages_pkey PRIMARY KEY (id),
  constraint messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  constraint messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE SET NULL,
  constraint messages_body_check CHECK ((char_length(body) <= 1000))
);
alter table public.messages enable row level security;

create table if not exists public.user_blocks (
  blocker_id uuid not null,
  blocked_id uuid not null,
  created_at timestamp with time zone default now() not null,
  constraint user_blocks_pkey PRIMARY KEY (blocker_id, blocked_id),
  constraint user_blocks_blocked_id_fkey FOREIGN KEY (blocked_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  constraint user_blocks_blocker_id_fkey FOREIGN KEY (blocker_id) REFERENCES auth.users(id) ON DELETE CASCADE
);
alter table public.user_blocks enable row level security;

create table if not exists public.message_reports (
  id bigint generated always as identity not null,
  message_id bigint not null,
  reporter_id uuid,
  reason text,
  status text default 'open'::text not null,
  created_at timestamp with time zone default now() not null,
  resolved_by uuid,
  resolved_at timestamp with time zone,
  constraint message_reports_message_id_reporter_id_key UNIQUE (message_id, reporter_id),
  constraint message_reports_pkey PRIMARY KEY (id),
  constraint message_reports_message_id_fkey FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
  constraint message_reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES auth.users(id) ON DELETE SET NULL,
  constraint message_reports_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES auth.users(id) ON DELETE SET NULL,
  constraint message_reports_reason_check CHECK (((reason IS NULL) OR (char_length(reason) <= 200))),
  constraint message_reports_status_check CHECK ((status = ANY (ARRAY['open'::text, 'resolved'::text])))
);
alter table public.message_reports enable row level security;

create table if not exists public.rate_limits (
  user_id uuid not null,
  action text not null,
  window_start timestamp with time zone not null,
  hits integer default 0 not null,
  constraint rate_limits_pkey PRIMARY KEY (user_id, action),
  constraint rate_limits_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);
alter table public.rate_limits enable row level security;

-- ===== Индексы =====
CREATE INDEX conversation_members_user ON public.conversation_members USING btree (user_id);
CREATE INDEX messages_conv_id ON public.messages USING btree (conversation_id, id DESC);
CREATE INDEX messages_sender_time ON public.messages USING btree (sender_id, created_at DESC);
CREATE UNIQUE INDEX one_pending_per_task ON public.submissions USING btree (user_id, task_id) WHERE (status = 'pending'::text);
CREATE INDEX penalties_user_time ON public.penalties USING btree (user_id, created_at DESC);
CREATE UNIQUE INDEX profiles_nickname_unique ON public.profiles USING btree (lower(nickname)) WHERE (nickname IS NOT NULL);
CREATE INDEX reports_author_idx ON public.reports USING btree (author_id, created_at DESC);
CREATE INDEX reports_status_idx ON public.reports USING btree (status, created_at);
CREATE INDEX spot_tasks_assignee_idx ON public.spot_tasks USING btree (assignee_id, status);
CREATE INDEX spot_tasks_status_idx ON public.spot_tasks USING btree (status);

-- ===== Функции =====
CREATE OR REPLACE FUNCTION public.account_deletion_kind(p_uid uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select case
    when p.is_moderator then null
    when (select count(*) from penalties x where x.user_id = p.id
            and x.created_at > now() - make_interval(days => r.fraud_days)) >= r.fraud_count then 'fraud'
    when p.last_active_at < now() - make_interval(days => r.inactive_days) then 'inactive'
  end
  from profiles p, moderation_rules() r
  where p.id = p_uid;
$function$
;

CREATE OR REPLACE FUNCTION public.add_group_members(p_conv bigint, p_members uuid[])
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me uuid := auth.uid(); n int;
begin
  perform check_can_act(me);
  perform group_admin_check(p_conv);
  if (select count(*) from conversation_members where conversation_id = p_conv)
     + (select count(distinct x) from unnest(coalesce(p_members, '{}')) x
         where not exists (select 1 from conversation_members m where m.conversation_id = p_conv and m.user_id = x)) > 50 then
    raise exception 'В группе может быть не больше 50 человек';
  end if;
  insert into conversation_members (conversation_id, user_id)
    select distinct p_conv, x from unnest(coalesce(p_members, '{}')) x
     where exists (select 1 from profiles where id = x) and not is_blocked_between(me, x)
  on conflict do nothing;
  get diagnostics n = row_count;
  return n;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.approve_submission(sub_id bigint)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  s submissions%rowtype;
  p int;
begin
  select * into s from submissions where id = sub_id and status = 'pending' for update;
  if not found then
    return 'Заявка не найдена или уже проверена';
  end if;
  select points into p from tasks where id = s.task_id;
  update submissions set status = 'approved' where id = sub_id;
  update profiles set points = points + p where id = s.user_id;
  return 'Готово: начислено ' || p || ' TZ';
end;
$function$
;

CREATE OR REPLACE FUNCTION public.block_user(p_user uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if auth.uid() is null or p_user is null or p_user = auth.uid() then raise exception 'Нельзя заблокировать'; end if;
  insert into user_blocks (blocker_id, blocked_id) values (auth.uid(), p_user) on conflict do nothing;
  return 'ok';
end;
$function$
;

CREATE OR REPLACE FUNCTION public.cancel_spot_task(p_id bigint, p_reason text DEFAULT NULL::text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare t spot_tasks%rowtype;
begin
  if not is_moderator() then return 'Нет доступа'; end if;
  perform release_expired_claims();
  select * into t from spot_tasks where id = p_id for update;
  if not found or t.status = 'cancelled' then return 'Задание не найдено или уже снято'; end if;
  if t.status <> 'available' then
    return 'Снять можно только свободное задание. Сейчас: ' ||
      case t.status when 'in_progress' then 'его выполняет участник' when 'under_review' then 'результат на проверке'
        when 'completed' then 'уже выполнено' else t.status end;
  end if;
  update spot_tasks set status = 'cancelled', last_reject_reason = nullif(trim(p_reason), ''), reviewed_by = auth.uid()
   where id = p_id;
  return 'Задание снято с карты';
end;
$function$
;

CREATE OR REPLACE FUNCTION public.chat_name(p_uid uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select coalesce(
    (select case
       when nullif(trim(p.nickname), '') is not null then trim(p.nickname)
       when p.birth_year is not null and extract(year from now())::int - p.birth_year <= 14 then 'Участник'
       else split_part(coalesce(nullif(trim(p.name), ''), 'Участник'), ' ', 1)
     end from profiles p where p.id = p_uid),
    'Удалённый аккаунт')
$function$
;

CREATE OR REPLACE FUNCTION public.check_account_deletion(p_user_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare k text;
begin
  if not is_moderator() then return 'Нет доступа'; end if;
  if p_user_id = auth.uid() then return 'Нельзя удалить свой аккаунт'; end if;
  if exists (select 1 from profiles where id = p_user_id and is_moderator) then return 'Нельзя удалить модератора'; end if;
  k := account_deletion_kind(p_user_id);
  if k is null then return 'Аккаунт не подходит под правила удаления'; end if;
  return k;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.check_can_act(p_uid uuid)
 RETURNS void
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare p profiles%rowtype;
begin
  if p_uid is null then raise exception 'Нужно войти в аккаунт'; end if;
  select * into p from profiles where id = p_uid;
  if p.birth_year is null then raise exception 'Сначала заполните данные безопасности в приложении'; end if;
  if extract(year from now())::int - p.birth_year <= 14 and not p.parent_verified then
    raise exception 'Нужно подтверждённое согласие родителей. Обратитесь к учителю или проверяющему';
  end if;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.check_nickname(p_nick text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare n text := nullif(trim(p_nick), ''); problem text;
begin
  if auth.uid() is null then return 'Нужно войти в аккаунт'; end if;
  if n is null then return null; end if;
  if not hit_rate('nick', 60, 60) then return 'Слишком много запросов. Подождите минуту'; end if;
  problem := nick_problem(n);
  if problem is not null then return problem; end if;
  if exists (select 1 from profiles where lower(nickname) = lower(n) and id <> auth.uid()) then
    return 'Этот ник уже занят';
  end if;
  return null;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.check_safety_before_submit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  p profiles%rowtype;
begin
  select * into p from profiles where id = new.user_id;
  if p.birth_year is null then
    raise exception 'Сначала заполните данные безопасности в приложении';
  end if;
  if extract(year from now())::int - p.birth_year <= 14 and not p.parent_verified then
    raise exception 'Нужно подтверждённое согласие родителей. Обратитесь к учителю или проверяющему';
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.check_submission_limits()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if (select count(*) from submissions
      where user_id = new.user_id and created_at > now() - interval '24 hours') >= 5 then
    raise exception 'Лимит: не больше 5 заданий в сутки';
  end if;

  if exists (select 1 from submissions
      where user_id = new.user_id and task_id = new.task_id
        and status = 'approved' and created_at > now() - interval '7 days') then
    raise exception 'Это задание уже засчитано. Повторить можно через неделю';
  end if;

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.claim_task(p_id bigint)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare t spot_tasks%rowtype; uid uuid := auth.uid();
begin
  perform check_can_act(uid);
  perform release_expired_claims();
  if (select count(*) from spot_tasks where assignee_id = uid and status in ('in_progress','under_review')) >= 2 then
    raise exception 'Можно выполнять не больше 2 заданий одновременно';
  end if;
  select * into t from spot_tasks where id = p_id for update;
  if not found or t.status = 'cancelled' then raise exception 'Задание не найдено'; end if;
  if t.author_id = uid then raise exception 'Это ваша заявка — её выполнит другой участник'; end if;
  if t.status = 'completed' then raise exception 'Это место уже убрано'; end if;
  if t.assignee_id = uid then raise exception 'Это задание уже за вами'; end if;
  if t.status <> 'available' then raise exception 'Задание уже взял другой участник'; end if;
  update spot_tasks set status = 'in_progress', assignee_id = uid, claimed_at = now(),
         claim_expires_at = now() + interval '48 hours', last_reject_reason = null
   where id = p_id;
  return 'ok';
end;
$function$
;

CREATE OR REPLACE FUNCTION public.confirm_parent_consent(p_email text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not is_moderator() then
    return 'Нет доступа';
  end if;
  update profiles set parent_verified = true
  where id = (select id from auth.users where email = p_email);
  if not found then
    return 'Пользователь не найден';
  end if;
  return 'Согласие подтверждено';
end;
$function$
;

CREATE OR REPLACE FUNCTION public.count_nearby_reports(p_lat double precision, p_lng double precision, p_radius_m double precision DEFAULT 50)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select count(*)::int from reports
  where status in ('submitted','under_review','approved')
    and lat between p_lat - 0.01 and p_lat + 0.01
    and lng between p_lng - 0.015 and p_lng + 0.015
    and geo_distance_m(p_lat, p_lng, lat, lng) <= least(p_radius_m, 500);
$function$
;

CREATE OR REPLACE FUNCTION public.create_group(p_title text, p_members uuid[])
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me uuid := auth.uid(); t text := trim(coalesce(p_title, '')); ids uuid[]; cid bigint;
begin
  perform check_can_act(me);
  if char_length(t) < 1 or char_length(t) > 60 then raise exception 'Название группы — от 1 до 60 символов'; end if;
  if message_problem(t) is not null then raise exception 'В названии есть недопустимое слово'; end if;
  select array_agg(distinct x) into ids from unnest(coalesce(p_members, '{}')) x
   where x <> me and exists (select 1 from profiles where id = x) and not is_blocked_between(me, x);
  if coalesce(array_length(ids, 1), 0) < 1 then raise exception 'Добавьте хотя бы одного участника'; end if;
  if array_length(ids, 1) > 49 then raise exception 'В группе может быть не больше 50 человек'; end if;
  insert into conversations (kind, title, created_by) values ('group', t, me) returning id into cid;
  insert into conversation_members (conversation_id, user_id, role) values (cid, me, 'admin');
  insert into conversation_members (conversation_id, user_id) select cid, x from unnest(ids) x;
  return cid;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.delete_my_account()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  delete from auth.users where id = auth.uid();
  return 'ok';
end;
$function$
;

CREATE OR REPLACE FUNCTION public.geo_distance_m(lat1 double precision, lng1 double precision, lat2 double precision, lng2 double precision)
 RETURNS double precision
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO ''
AS $function$
  select 6371000 * sqrt(
    power(radians(lat2 - lat1), 2) +
    power(radians(lng2 - lng1) * cos(radians((lat1 + lat2) / 2)), 2)
  );
$function$
;

CREATE OR REPLACE FUNCTION public.get_accounts_for_review()
 RETURNS TABLE(user_id uuid, display_name text, place text, points integer, penalties integer, last_penalty_at timestamp with time zone, last_active_at timestamp with time zone, kind text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare r record;
begin
  if not is_moderator() then raise exception 'Нет доступа'; end if;
  select * into r from moderation_rules();
  return query
    select p.id,
           coalesce(nullif(trim(p.nickname), ''), split_part(coalesce(nullif(trim(p.name), ''), 'Участник'), ' ', 1)),
           coalesce(p.place_name, p.region),
           p.points,
           (select count(*)::int from penalties x where x.user_id = p.id
              and x.created_at > now() - make_interval(days => r.fraud_days)),
           (select max(x.created_at) from penalties x where x.user_id = p.id),
           p.last_active_at,
           account_deletion_kind(p.id)
      from profiles p
     where account_deletion_kind(p.id) is not null
     order by account_deletion_kind(p.id) = 'inactive', p.last_active_at;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_blocked_users()
 RETURNS TABLE(id uuid, name text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ select b.blocked_id, chat_name(b.blocked_id) from user_blocks b where b.blocker_id = auth.uid() order by b.created_at desc $function$
;

CREATE OR REPLACE FUNCTION public.get_community_stats()
 RETURNS json
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select json_build_object(
    'done', (select count(*) from submissions where status = 'approved')
            + (select count(*) from spot_tasks where status = 'completed'),
    'people', (select count(*) from profiles)
  );
$function$
;

CREATE OR REPLACE FUNCTION public.get_conversation(p_conv bigint)
 RETURNS json
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me uuid := auth.uid(); c conversations%rowtype; other uuid;
begin
  if not is_member(p_conv) then raise exception 'Чат не найден'; end if;
  select * into c from conversations where id = p_conv;
  if c.kind = 'direct' then
    other := (case when split_part(c.direct_key, ':', 1) = me::text then split_part(c.direct_key, ':', 2) else split_part(c.direct_key, ':', 1) end)::uuid;
  end if;
  return json_build_object(
    'id', c.id,
    'kind', c.kind,
    'title', case when c.kind = 'group' then c.title else chat_name(other) end,
    'other_id', other,
    'my_role', (select role from conversation_members where conversation_id = p_conv and user_id = me),
    'blocked_by_me', other is not null and exists (select 1 from user_blocks where blocker_id = me and blocked_id = other),
    'blocked_me', other is not null and exists (select 1 from user_blocks where blocker_id = other and blocked_id = me),
    'members', coalesce((
      select json_agg(json_build_object('id', m.user_id, 'name', chat_name(m.user_id), 'emoji', p.avatar_emoji,
                                        'color', p.avatar_color, 'role', m.role, 'is_me', m.user_id = me)
                      order by m.role, m.joined_at)
        from conversation_members m left join profiles p on p.id = m.user_id
       where m.conversation_id = p_conv), '[]'::json)
  );
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_conversations()
 RETURNS TABLE(id bigint, kind text, title text, other_id uuid, avatar_emoji text, avatar_color text, last_body text, last_is_mine boolean, last_at timestamp with time zone, unread integer, members integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'Нужно войти в аккаунт'; end if;
  return query
    with mine as (
      select c.*, m.last_read_at,
             case when c.kind = 'direct' then
               (case when split_part(c.direct_key, ':', 1) = me::text then split_part(c.direct_key, ':', 2) else split_part(c.direct_key, ':', 1) end)::uuid
             end as other
        from conversation_members m join conversations c on c.id = m.conversation_id
       where m.user_id = me
    )
    select x.id, x.kind,
           case when x.kind = 'group' then x.title else chat_name(x.other) end,
           x.other,
           case when x.kind = 'direct' then (select p.avatar_emoji from profiles p where p.id = x.other) end,
           case when x.kind = 'direct' then (select p.avatar_color from profiles p where p.id = x.other) end,
           lm.body, lm.sender_id = me, coalesce(lm.created_at, x.created_at),
           (select count(*)::int from messages u where u.conversation_id = x.id and u.created_at > x.last_read_at
              and u.sender_id is distinct from me and u.deleted_at is null),
           (select count(*)::int from conversation_members cm where cm.conversation_id = x.id)
      from mine x
      left join lateral (
        select case when mm.deleted_at is null then mm.body else 'Сообщение удалено' end as body, mm.sender_id, mm.created_at
          from messages mm where mm.conversation_id = x.id order by mm.id desc limit 1
      ) lm on true
     order by coalesce(lm.created_at, x.created_at) desc;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_leaderboard()
 RETURNS TABLE(display_name text, place text, total integer, is_me boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    case when birth_year is not null and extract(year from now())::int - birth_year <= 14
      then 'Участник' else split_part(coalesce(name, 'Друг'), ' ', 1) end,
    case when birth_year is not null and extract(year from now())::int - birth_year <= 14
      then null else place_name end,
    points,
    (id = auth.uid())
  from profiles
  where points > 0
  order by points desc
  limit 20;
$function$
;

CREATE OR REPLACE FUNCTION public.get_map_tasks()
 RETURNS TABLE(id bigint, title text, category text, difficulty text, points integer, lat double precision, lng double precision, address text, status text, photo_path text, is_mine boolean, is_my_report boolean, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if auth.uid() is null then raise exception 'Нужно войти в аккаунт'; end if;
  perform release_expired_claims();
  return query
    select t.id, t.title, t.category, t.difficulty, t.points, t.lat, t.lng, t.address, t.status, t.photo_paths[1],
           coalesce(t.assignee_id = auth.uid(), false), coalesce(t.author_id = auth.uid(), false), t.created_at
      from spot_tasks t
     where t.status in ('available','in_progress') or (t.status = 'under_review' and t.assignee_id = auth.uid())
     order by t.created_at desc;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_message_reports()
 RETURNS TABLE(message_id bigint, sender_id uuid, sender_name text, body text, deleted boolean, sent_at timestamp with time zone, chat_title text, reasons text[], reports integer, context json)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not is_moderator() then raise exception 'Нет доступа'; end if;
  return query
    select m.id, m.sender_id, chat_name(m.sender_id), m.body, m.deleted_at is not null, m.created_at,
           case when c.kind = 'group' then 'Группа «' || c.title || '»' else 'Личный чат' end,
           array_remove(array_agg(r.reason order by r.created_at), null),
           count(*)::int,
           -- три сообщения до жалобы и само сообщение
           (select json_agg(json_build_object('id', x.id, 'name', chat_name(x.sender_id),
                                              'body', case when x.deleted_at is null then x.body else 'Сообщение удалено' end) order by x.id)
              from (select * from messages y where y.conversation_id = m.conversation_id and y.id <= m.id
                     order by y.id desc limit 4) x)
      from message_reports r
      join messages m on m.id = r.message_id
      join conversations c on c.id = m.conversation_id
     where r.status = 'open'
     group by m.id, c.id
     order by min(r.created_at);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_messages(p_conv bigint, p_before bigint DEFAULT NULL::bigint, p_limit integer DEFAULT 50)
 RETURNS TABLE(id bigint, sender_id uuid, sender_name text, body text, deleted boolean, created_at timestamp with time zone, is_mine boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not is_member(p_conv) then raise exception 'Чат не найден'; end if;
  return query
    select m.id, m.sender_id, chat_name(m.sender_id),
           case when m.deleted_at is null then m.body end, m.deleted_at is not null, m.created_at, m.sender_id = auth.uid()
      from messages m
     where m.conversation_id = p_conv and (p_before is null or m.id < p_before)
     order by m.id desc
     limit least(greatest(coalesce(p_limit, 50), 1), 100);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_my_spot_tasks()
 RETURNS TABLE(id bigint, title text, category text, points integer, status text, claim_expires_at timestamp with time zone, completed_at timestamp with time zone, last_reject_reason text, address text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if auth.uid() is null then raise exception 'Нужно войти в аккаунт'; end if;
  perform release_expired_claims();
  return query
    select t.id, t.title, t.category, t.points, t.status, t.claim_expires_at, t.completed_at, t.last_reject_reason, t.address
      from spot_tasks t where t.assignee_id = auth.uid()
     order by case t.status when 'in_progress' then 0 when 'under_review' then 1 else 2 end, coalesce(t.completed_at, t.claimed_at) desc;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_portfolio(p_code text)
 RETURNS json
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  uid uuid;
  result json;
begin
  select user_id into uid from portfolio_links where code = p_code;
  if uid is null then
    return null;
  end if;
  select json_build_object(
    'name', (select split_part(coalesce(name, 'Участник'), ' ', 1) from profiles where id = uid),
    'place', (select coalesce(place_name, region) from profiles where id = uid),
    'points', (select points from profiles where id = uid),
    'tasks', coalesce((
      select json_agg(json_build_object('title', x.title, 'emoji', x.emoji, 'points', x.points, 'date', x.date) order by x.date desc)
      from (
        select t.title, t.emoji, t.points, s.created_at as date
          from submissions s join tasks t on t.id = s.task_id
         where s.user_id = uid and s.status = 'approved'
        union all
        -- уборки мест с карты (эко-система «сообщить → задание»)
        select st.title, '📍', st.points, st.completed_at
          from spot_tasks st
         where st.assignee_id = uid and st.status = 'completed'
      ) x
    ), '[]'::json)
  ) into result;
  return result;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_reports_for_review()
 RETURNS TABLE(id bigint, category text, description text, photo_paths text[], lat double precision, lng double precision, accuracy_m real, address text, region text, place_name text, created_at timestamp with time zone, author_name text, author_rejected integer, nearby_tasks integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not is_moderator() then raise exception 'Нет доступа'; end if;
  update reports set status = 'under_review' where status = 'submitted';
  return query
    select r.id, r.category, r.description, r.photo_paths, r.lat, r.lng, r.accuracy_m, r.address, r.region, r.place_name,
           r.created_at, public_name(r.author_id),
           (select count(*)::int from reports r2 where r2.author_id = r.author_id and r2.status = 'rejected'),
           (select count(*)::int from spot_tasks t where t.status in ('available','in_progress','under_review')
              and geo_distance_m(r.lat, r.lng, t.lat, t.lng) <= 50)
      from reports r where r.status = 'under_review' order by r.created_at;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_spot_task(p_id bigint)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare t spot_tasks%rowtype; uid uuid := auth.uid(); mine boolean;
begin
  if uid is null then raise exception 'Нужно войти в аккаунт'; end if;
  perform release_expired_claims();
  select * into t from spot_tasks where id = p_id and (status <> 'cancelled' or is_moderator());
  if not found then return null; end if;
  mine := coalesce(t.assignee_id = uid, false);
  return json_build_object(
    'id', t.id, 'title', t.title, 'description', t.description, 'category', t.category, 'difficulty', t.difficulty,
    'points', t.points, 'lat', t.lat, 'lng', t.lng, 'address', t.address, 'place_name', t.place_name,
    'photo_paths', t.photo_paths, 'status', t.status, 'created_at', t.created_at, 'completed_at', t.completed_at,
    'author_name', public_name(t.author_id), 'is_my_report', coalesce(t.author_id = uid, false), 'is_mine', mine,
    'claim_expires_at', case when mine then t.claim_expires_at end,
    'last_reject_reason', case when mine then t.last_reject_reason end,
    'can_moderate', is_moderator()
  );
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_task_results_for_review()
 RETURNS TABLE(id bigint, title text, points integer, difficulty text, photo_paths text[], result_photo_path text, result_distance_m double precision, result_submitted_at timestamp with time zone, reject_count integer, assignee_name text, address text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not is_moderator() then raise exception 'Нет доступа'; end if;
  return query
    select t.id, t.title, t.points, t.difficulty, t.photo_paths, t.result_photo_path, t.result_distance_m,
           t.result_submitted_at, t.reject_count, public_name(t.assignee_id), t.address
      from spot_tasks t where t.status = 'under_review' order by t.result_submitted_at;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.group_admin_check(p_conv bigint)
 RETURNS void
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not exists (select 1 from conversations where id = p_conv and kind = 'group') then raise exception 'Группа не найдена'; end if;
  if not exists (select 1 from conversation_members where conversation_id = p_conv and user_id = auth.uid() and role = 'admin') then
    raise exception 'Это может только администратор группы';
  end if;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.profiles (id, name)
  values (new.id, new.raw_user_meta_data->>'name');
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.hit_rate(p_action text, p_max integer, p_seconds integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare uid uuid := auth.uid(); r rate_limits%rowtype;
begin
  if uid is null then return false; end if;
  insert into rate_limits (user_id, action, window_start, hits) values (uid, p_action, now(), 1)
  on conflict (user_id, action) do update
    set hits = case when rate_limits.window_start < now() - make_interval(secs => p_seconds) then 1 else rate_limits.hits + 1 end,
        window_start = case when rate_limits.window_start < now() - make_interval(secs => p_seconds) then now() else rate_limits.window_start end
  returning * into r;
  return r.hits <= p_max;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.is_blocked_between(a uuid, b uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ select exists (select 1 from user_blocks where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a)) $function$
;

CREATE OR REPLACE FUNCTION public.is_member(p_conv bigint)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ select exists (select 1 from conversation_members where conversation_id = p_conv and user_id = auth.uid()) $function$
;

CREATE OR REPLACE FUNCTION public.is_moderator()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select coalesce((select is_moderator from profiles where id = auth.uid()), false);
$function$
;

CREATE OR REPLACE FUNCTION public.is_visible_task_photo(p_name text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (select 1 from spot_tasks where p_name = any(photo_paths) and status <> 'cancelled');
$function$
;

CREATE OR REPLACE FUNCTION public.leave_conversation(p_conv bigint)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me uuid := auth.uid(); was_admin boolean;
begin
  delete from conversation_members where conversation_id = p_conv and user_id = me returning role = 'admin' into was_admin;
  if not found then raise exception 'Чат не найден'; end if;
  if not exists (select 1 from conversation_members where conversation_id = p_conv) then
    delete from conversations where id = p_conv;
  elsif was_admin and not exists (select 1 from conversation_members where conversation_id = p_conv and role = 'admin') then
    update conversation_members set role = 'admin'
     where conversation_id = p_conv
       and user_id = (select user_id from conversation_members where conversation_id = p_conv order by joined_at limit 1);
  end if;
  return 'ok';
end;
$function$
;

CREATE OR REPLACE FUNCTION public.mark_read(p_conv bigint)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ update conversation_members set last_read_at = now() where conversation_id = p_conv and user_id = auth.uid() $function$
;

CREATE OR REPLACE FUNCTION public.message_problem(p_text text)
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare w text;
begin
  foreach w in array regexp_split_to_array(coalesce(p_text, ''), '\s+') loop
    if w <> '' and nick_problem(w) is not null then
      return 'В сообщении есть недопустимое слово';
    end if;
  end loop;
  return null;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.moderation_rules()
 RETURNS TABLE(fraud_count integer, fraud_days integer, inactive_days integer)
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO ''
AS $function$ select 3, 90, 180 $function$
;

CREATE OR REPLACE FUNCTION public.nick_problem(p_nick text)
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  raw text := lower(coalesce(p_nick, ''));
  base text;
  v_look text; v_phon text; v_en text;
begin
  if raw ~ '18\+|\+18|xxx|ххх' then return 'Этот ник нельзя использовать: в нём недопустимое слово'; end if;
  -- цифры и символы, которыми маскируют буквы
  base := translate(raw, '0346@$', 'озчбас');
  base := translate(base, 'ёәғқңөұүһі', 'еагкноуухи');
  -- 1) латинские буквы, похожие на русские (xyй → хуй); остальная латиница — «разрыв», чтобы не склеивать слово из частей имени
  v_look := translate(base, 'aceopxykmthbu', 'асеорхукмтнви');
  v_look := regexp_replace(v_look, '[a-z]', '|', 'g');
  -- 2) латиница «по звучанию»: blyat → блят, suka → сука
  v_phon := base;
  v_phon := replace(replace(replace(replace(replace(v_phon, 'shch', 'щ'), 'sch', 'щ'), 'sh', 'ш'), 'ch', 'ч'), 'zh', 'ж');
  v_phon := replace(replace(replace(replace(replace(replace(v_phon, 'kh', 'х'), 'ts', 'ц'), 'ya', 'я'), 'yu', 'ю'), 'yo', 'е'), 'ye', 'е');
  v_phon := translate(v_phon, 'abvgdezijklmnoprstufhcywqx', 'абвгдезийклмнопрстуфхкйвкх');
  -- только кириллица (и «разрывы»), без ь/ъ и повторов букв (хуууй → хуй)
  v_look := regexp_replace(regexp_replace(translate(v_look, 'ьъ', ''), '[^а-я|]', '', 'g'), '(.)\1+', '\1', 'g');
  v_phon := regexp_replace(regexp_replace(translate(v_phon, 'ьъ', ''), '[^а-я]', '', 'g'), '(.)\1+', '\1', 'g');
  -- 3) английские слова
  v_en := translate(raw, '01345@$7', 'oieasast');
  v_en := regexp_replace(regexp_replace(v_en, '[^a-z]', '', 'g'), '(.)\1+', '\1', 'g');

  if exists (select 1 from banned_words w where
      (w.lang = 'ru' and (strpos(v_look, w.word) > 0 or strpos(v_phon, w.word) > 0))
   or (w.lang = 'en' and strpos(v_en, w.word) > 0)) then
    return 'Этот ник нельзя использовать: в нём недопустимое слово';
  end if;
  return null;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.open_direct(p_user uuid)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me uuid := auth.uid(); k text; cid bigint;
begin
  perform check_can_act(me);
  if p_user is null or p_user = me or not exists (select 1 from profiles where id = p_user) then
    raise exception 'Пользователь не найден';
  end if;
  if is_blocked_between(me, p_user) then raise exception 'Нельзя написать этому пользователю'; end if;
  k := least(me::text, p_user::text) || ':' || greatest(me::text, p_user::text);
  insert into conversations (kind, direct_key, created_by) values ('direct', k, me) on conflict (direct_key) do nothing;
  select id into cid from conversations where direct_key = k;
  insert into conversation_members (conversation_id, user_id) values (cid, me), (cid, p_user) on conflict do nothing;
  return cid;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.penalize_submission(sub_id bigint, penalty integer DEFAULT 0)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  s submissions%rowtype;
begin
  if not is_moderator() then
    return 'Нет доступа';
  end if;
  select * into s from submissions where id = sub_id for update;
  if not found then
    return 'Заявка не найдена';
  end if;
  update submissions set status = 'rejected' where id = sub_id;
  update profiles set points = greatest(0, points - penalty) where id = s.user_id;
  insert into penalties (user_id, moderator_id, source, source_id, points)
  values (s.user_id, auth.uid(), 'submission', sub_id, coalesce(penalty, 0));
  return 'Отклонено, снято ' || penalty || ' TZ';
end;
$function$
;

CREATE OR REPLACE FUNCTION public.public_name(p_uid uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select case
    when p.id is null then 'Участник'
    when p.birth_year is not null and extract(year from now())::int - p.birth_year <= 14 then 'Участник'
    else coalesce(nullif(trim(p.nickname), ''), split_part(coalesce(nullif(trim(p.name), ''), 'Участник'), ' ', 1))
  end
  from (select 1) x left join profiles p on p.id = p_uid;
$function$
;

CREATE OR REPLACE FUNCTION public.release_expired_claims()
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  update spot_tasks
     set status = 'available', assignee_id = null, claimed_at = null, claim_expires_at = null,
         result_photo_path = null, result_lat = null, result_lng = null, result_distance_m = null, result_submitted_at = null
   where (status = 'in_progress' and claim_expires_at < now())
      or (status in ('in_progress','under_review') and assignee_id is null);
$function$
;

CREATE OR REPLACE FUNCTION public.release_task(p_id bigint)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  update spot_tasks set status = 'available', assignee_id = null, claimed_at = null, claim_expires_at = null, last_reject_reason = null
   where id = p_id and assignee_id = auth.uid() and status = 'in_progress';
  if not found then raise exception 'Задание не найдено или уже на проверке'; end if;
  return 'ok';
end;
$function$
;

CREATE OR REPLACE FUNCTION public.remove_group_member(p_conv bigint, p_user uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  perform group_admin_check(p_conv);
  if p_user = auth.uid() then raise exception 'Чтобы выйти, нажмите «Выйти из группы»'; end if;
  delete from conversation_members where conversation_id = p_conv and user_id = p_user;
  return 'ok';
end;
$function$
;

CREATE OR REPLACE FUNCTION public.rename_group(p_conv bigint, p_title text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare t text := trim(coalesce(p_title, ''));
begin
  perform group_admin_check(p_conv);
  if char_length(t) < 1 or char_length(t) > 60 then raise exception 'Название группы — от 1 до 60 символов'; end if;
  if message_problem(t) is not null then raise exception 'В названии есть недопустимое слово'; end if;
  update conversations set title = t where id = p_conv;
  return 'ok';
end;
$function$
;

CREATE OR REPLACE FUNCTION public.report_message(p_message bigint, p_reason text DEFAULT NULL::text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare m messages%rowtype;
begin
  select * into m from messages where id = p_message;
  if not found or not is_member(m.conversation_id) then raise exception 'Сообщение не найдено'; end if;
  if m.sender_id = auth.uid() then raise exception 'Нельзя пожаловаться на своё сообщение'; end if;
  if not hit_rate('report', 20, 3600) then raise exception 'Слишком много жалоб. Попробуйте позже'; end if;
  insert into message_reports (message_id, reporter_id, reason) values (p_message, auth.uid(), left(nullif(trim(p_reason), ''), 200))
  on conflict (message_id, reporter_id) do nothing;
  return 'ok';
end;
$function$
;

CREATE OR REPLACE FUNCTION public.resolve_message_report(p_message bigint, p_delete boolean, p_penalty boolean DEFAULT false)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare m messages%rowtype;
begin
  if not is_moderator() then return 'Нет доступа'; end if;
  select * into m from messages where id = p_message for update;
  if not found then return 'Сообщение не найдено'; end if;
  if p_delete then update messages set body = '', deleted_at = now() where id = p_message; end if;
  if p_penalty and m.sender_id is not null then
    insert into penalties (user_id, moderator_id, source, source_id, points) values (m.sender_id, auth.uid(), 'message', p_message, 0);
  end if;
  update message_reports set status = 'resolved', resolved_by = auth.uid(), resolved_at = now()
   where message_id = p_message and status = 'open';
  return case when p_penalty then 'Сообщение удалено, нарушение записано'
              when p_delete then 'Сообщение удалено'
              else 'Жалоба отклонена' end;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.review_report(p_report_id bigint, p_approve boolean, p_reason text DEFAULT NULL::text, p_title text DEFAULT NULL::text, p_difficulty text DEFAULT 'easy'::text, p_points integer DEFAULT NULL::integer, p_penalty integer DEFAULT 0)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare r reports%rowtype; pts int; new_id bigint;
begin
  if not is_moderator() then return 'Нет доступа'; end if;
  select * into r from reports where id = p_report_id and status in ('submitted','under_review') for update;
  if not found then return 'Заявка не найдена или уже проверена'; end if;
  if p_approve then
    if p_title is null or char_length(trim(p_title)) < 3 then return 'Укажите название задания (от 3 символов)'; end if;
    if p_difficulty not in ('easy','medium','hard') then return 'Неверная сложность'; end if;
    pts := coalesce(p_points, case p_difficulty when 'hard' then 100 when 'medium' then 60 else 30 end);
    pts := greatest(10, least(300, pts));
    insert into spot_tasks (report_id, author_id, title, description, category, difficulty, points, lat, lng, address, region, place_name, photo_paths)
    values (r.id, r.author_id, left(trim(p_title), 80), r.description, r.category, p_difficulty, pts, r.lat, r.lng, r.address, r.region, r.place_name, r.photo_paths)
    returning id into new_id;
    update reports set status = 'approved', reject_reason = null, reviewed_by = auth.uid(), reviewed_at = now() where id = r.id;
    update profiles set points = points + 10 where id = r.author_id;
    return 'Подтверждено: задание №' || new_id || ' на карте, автору +10 TZ';
  else
    update reports set status = 'rejected', reject_reason = nullif(trim(p_reason), ''), reviewed_by = auth.uid(), reviewed_at = now() where id = r.id;
    if coalesce(p_penalty, 0) > 0 then
      update profiles set points = greatest(0, points - p_penalty) where id = r.author_id;
      insert into penalties (user_id, moderator_id, source, source_id, points)
      values (r.author_id, auth.uid(), 'report', r.id, p_penalty);
      return 'Отклонено, снято ' || p_penalty || ' TZ';
    end if;
    return 'Отклонено';
  end if;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.review_submission(sub_id bigint, approve boolean, reason text DEFAULT NULL::text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  s submissions%rowtype;
  p int;
begin
  if not is_moderator() then
    return 'Нет доступа';
  end if;
  select * into s from submissions where id = sub_id and status = 'pending' for update;
  if not found then
    return 'Заявка не найдена или уже проверена';
  end if;
  if approve then
    select points into p from tasks where id = s.task_id;
    update submissions set status = 'approved' where id = sub_id;
    update profiles set points = points + p where id = s.user_id;
    return 'Принято: +' || p || ' TZ';
  else
    update submissions
      set status = 'rejected',
          reject_reason = nullif(trim(reason), '')
      where id = sub_id;
    return 'Отклонено';
  end if;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.review_task_result(p_id bigint, p_approve boolean, p_reason text DEFAULT NULL::text, p_penalty integer DEFAULT 0)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare t spot_tasks%rowtype;
begin
  if not is_moderator() then return 'Нет доступа'; end if;
  select * into t from spot_tasks where id = p_id and status = 'under_review' for update;
  if not found then return 'Результат не найден или уже проверен'; end if;
  if p_approve then
    update spot_tasks set status = 'completed', completed_at = now(), reviewed_by = auth.uid() where id = p_id;
    update profiles set points = points + t.points where id = t.assignee_id;
    return 'Принято: исполнителю +' || t.points || ' TZ';
  elsif coalesce(p_penalty, 0) > 0 then
    update spot_tasks set status = 'available', assignee_id = null, claimed_at = null, claim_expires_at = null,
           result_photo_path = null, result_lat = null, result_lng = null, result_distance_m = null, result_submitted_at = null,
           reject_count = reject_count + 1, last_reject_reason = null, reviewed_by = auth.uid()
     where id = p_id;
    update profiles set points = greatest(0, points - p_penalty) where id = t.assignee_id;
    insert into penalties (user_id, moderator_id, source, source_id, points)
    values (t.assignee_id, auth.uid(), 'spot_result', p_id, p_penalty);
    return 'Отмечено как обман, снято ' || p_penalty || ' TZ; задание снова доступно';
  else
    update spot_tasks set status = 'in_progress', result_photo_path = null, result_submitted_at = null,
           claim_expires_at = greatest(claim_expires_at, now() + interval '24 hours'),
           reject_count = reject_count + 1, last_reject_reason = nullif(trim(p_reason), ''), reviewed_by = auth.uid()
     where id = p_id;
    return 'Отклонено — исполнитель может переснять результат';
  end if;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.save_safety_info(p_birth_year integer, p_parent_name text, p_parent_contact text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  this_year int := extract(year from now())::int;
  existing int;
begin
  if p_birth_year < 1950 or p_birth_year > this_year - 5 then
    return 'Неверный год рождения';
  end if;
  select birth_year into existing from profiles where id = auth.uid();
  if existing is not null then
    return 'Уже указано';
  end if;
  update profiles set
    birth_year = p_birth_year,
    privacy_accepted_at = now(),
    parent_name = p_parent_name,
    parent_contact = p_parent_contact
  where id = auth.uid();
  return 'ok';
end;
$function$
;

CREATE OR REPLACE FUNCTION public.search_users(p_query text)
 RETURNS TABLE(id uuid, name text, avatar_emoji text, avatar_color text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me uuid := auth.uid(); q text := trim(coalesce(p_query, ''));
begin
  if me is null then raise exception 'Нужно войти в аккаунт'; end if;
  if char_length(q) < 2 then return; end if;
  if not hit_rate('search', 60, 60) then raise exception 'Слишком много запросов. Подождите минуту'; end if;
  q := replace(replace(replace(q, '\', '\\'), '%', '\%'), '_', '\_');
  return query
    select p.id, trim(p.nickname), p.avatar_emoji, p.avatar_color
      from profiles p
     where p.nickname ilike q || '%' and p.id <> me and not is_blocked_between(me, p.id)
     order by char_length(p.nickname), p.nickname
     limit 20;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.send_message(p_conv bigint, p_body text)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me uuid := auth.uid(); b text := trim(coalesce(p_body, '')); c conversations%rowtype; other uuid; mid bigint;
begin
  perform check_can_act(me);
  if not is_member(p_conv) then raise exception 'Чат не найден'; end if;
  if char_length(b) < 1 then raise exception 'Пустое сообщение'; end if;
  if char_length(b) > 1000 then raise exception 'Сообщение длиннее 1000 символов'; end if;
  if (select count(*) from messages where sender_id = me and created_at > now() - interval '1 minute') >= 30 then
    raise exception 'Слишком много сообщений. Подождите минуту';
  end if;
  if message_problem(b) is not null then raise exception 'В сообщении есть недопустимое слово'; end if;
  select * into c from conversations where id = p_conv;
  if c.kind = 'direct' then
    other := (select case when split_part(c.direct_key, ':', 1) = me::text then split_part(c.direct_key, ':', 2) else split_part(c.direct_key, ':', 1) end)::uuid;
    if not exists (select 1 from profiles where id = other) then raise exception 'Аккаунт собеседника удалён'; end if;
    if is_blocked_between(me, other) then raise exception 'Нельзя написать этому пользователю'; end if;
    -- собеседник мог удалить чат у себя — возвращаем его, чтобы он увидел сообщение
    insert into conversation_members (conversation_id, user_id) values (p_conv, other) on conflict do nothing;
  end if;
  insert into messages (conversation_id, sender_id, body) values (p_conv, me, b) returning id into mid;
  update conversations set last_message_at = now() where id = p_conv;
  update conversation_members set last_read_at = now() where conversation_id = p_conv and user_id = me;
  return mid;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.submit_report(p_category text, p_description text, p_photo_paths text[], p_lat double precision, p_lng double precision, p_accuracy real DEFAULT NULL::real, p_address text DEFAULT NULL::text)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  uid uuid := auth.uid();
  p profiles%rowtype;
  new_id bigint;
  path text;
begin
  if uid is null then raise exception 'Нужно войти в аккаунт'; end if;
  select * into p from profiles where id = uid;
  if p.birth_year is null then raise exception 'Сначала заполните данные безопасности в приложении'; end if;
  if extract(year from now())::int - p.birth_year <= 14 and not p.parent_verified then
    raise exception 'Нужно подтверждённое согласие родителей. Обратитесь к учителю или проверяющему';
  end if;
  if (select count(*) from reports where author_id = uid and created_at > now() - interval '24 hours') >= 5 then
    raise exception 'Лимит: не больше 5 заявок в сутки';
  end if;
  if p_photo_paths is null or array_length(p_photo_paths, 1) is null then raise exception 'Нужно хотя бы одно фото'; end if;
  foreach path in array p_photo_paths loop
    if split_part(path, '/', 1) <> uid::text then raise exception 'Недопустимое фото'; end if;
  end loop;
  insert into reports (author_id, category, description, photo_paths, lat, lng, accuracy_m, address, region, place_name)
  values (uid, p_category, trim(p_description), p_photo_paths, p_lat, p_lng, p_accuracy,
          nullif(trim(p_address), ''), p.region, p.place_name)
  returning id into new_id;
  return new_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.submit_task_result(p_id bigint, p_photo_path text, p_lat double precision, p_lng double precision)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare t spot_tasks%rowtype; uid uuid := auth.uid(); d double precision;
begin
  if uid is null then raise exception 'Нужно войти в аккаунт'; end if;
  select * into t from spot_tasks where id = p_id for update;
  if not found or t.assignee_id is distinct from uid then raise exception 'Это задание закреплено не за вами'; end if;
  if t.status <> 'in_progress' then raise exception 'Результат уже отправлен или задание закрыто'; end if;
  if t.claim_expires_at < now() then raise exception 'Время на задание вышло — возьмите его заново'; end if;
  if split_part(coalesce(p_photo_path, ''), '/', 1) <> uid::text then raise exception 'Недопустимое фото'; end if;
  d := geo_distance_m(t.lat, t.lng, p_lat, p_lng);
  if d > 200 then
    raise exception 'Вы далеко от места уборки (% м). Подойдите ближе — до 200 м — и сделайте фото там.', round(d);
  end if;
  update spot_tasks set status = 'under_review', result_photo_path = p_photo_path, result_lat = p_lat, result_lng = p_lng,
         result_distance_m = d, result_submitted_at = now()
   where id = p_id;
  return 'ok';
end;
$function$
;

CREATE OR REPLACE FUNCTION public.touch_activity()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare uid uuid := auth.uid(); n int;
begin
  if uid is null then return 0; end if;
  update profiles set last_active_at = now()
   where id = uid and last_active_at < now() - interval '10 minutes';
  select count(*) into n from penalties
   where user_id = uid and created_at > now() - make_interval(days => (select fraud_days from moderation_rules()));
  return n;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.unblock_user(p_user uuid)
 RETURNS text
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ delete from user_blocks where blocker_id = auth.uid() and blocked_id = p_user; select 'ok'::text $function$
;

CREATE OR REPLACE FUNCTION public.unread_total()
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select coalesce(count(*), 0)::int
    from conversation_members cm
    join messages m on m.conversation_id = cm.conversation_id
   where cm.user_id = auth.uid() and m.created_at > cm.last_read_at
     and m.sender_id is distinct from auth.uid() and m.deleted_at is null
$function$
;

CREATE OR REPLACE FUNCTION public.update_appearance(p_nickname text, p_emoji text, p_color text, p_avatar_path text DEFAULT NULL::text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  n text := nullif(trim(p_nickname), '');
  problem text;
begin
  if auth.uid() is null then
    return 'Нужно войти в аккаунт';
  end if;

  if n is not null then
    if char_length(n) < 3 or char_length(n) > 20 then
      return 'Ник: от 3 до 20 символов';
    end if;
    if n !~ '^[A-Za-zА-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі0-9_.-]+$' then
      return 'Ник: только буквы, цифры и символы _ . -';
    end if;
    problem := nick_problem(n);
    if problem is not null then
      return problem;
    end if;
    if exists (select 1 from profiles where lower(nickname) = lower(n) and id <> auth.uid()) then
      return 'Этот ник уже занят';
    end if;
  end if;

  if p_emoji is not null and not (p_emoji = any (array[
    '🐻','🦊','🐼','🐨','🦉','🐸','🐢','🦋','🐝','🐬','🦔','🦦','🐧','🦜','🌻','🌲'
  ])) then
    return 'Недопустимый аватар';
  end if;

  if p_color is not null and p_color !~ '^#[0-9A-Fa-f]{6}$' then
    return 'Недопустимый цвет';
  end if;

  if p_avatar_path is not null and p_avatar_path <> '' and split_part(p_avatar_path, '/', 1) <> auth.uid()::text then
    return 'Недопустимое фото';
  end if;

  update profiles
    set nickname = n, avatar_emoji = p_emoji, avatar_color = p_color,
        avatar_path = case when p_avatar_path is null then avatar_path else nullif(p_avatar_path, '') end
    where id = auth.uid();

  return 'ok';
exception
  when unique_violation then
    return 'Этот ник уже занят';
end;
$function$
;

-- ===== Права на таблицы и колонки =====
revoke all on public.profiles from anon, authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE on public.profiles to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE on public.profiles to anon;
grant UPDATE (name, place_name, place_type, region) on public.profiles to authenticated;
revoke all on public.tasks from anon, authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.tasks to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.tasks to anon;
revoke all on public.submissions from anon, authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.submissions to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.submissions to anon;
revoke all on public.universities from anon, authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.universities to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.universities to anon;
revoke all on public.portfolio_links from anon, authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.portfolio_links to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.portfolio_links to anon;
revoke all on public.reports from anon, authenticated;
grant SELECT on public.reports to authenticated;
revoke all on public.spot_tasks from anon, authenticated;
grant SELECT on public.spot_tasks to authenticated;
revoke all on public.banned_words from anon, authenticated;
revoke all on public.penalties from anon, authenticated;
revoke all on public.account_deletions from anon, authenticated;
revoke all on public.conversations from anon, authenticated;
grant SELECT on public.conversations to authenticated;
revoke all on public.conversation_members from anon, authenticated;
grant SELECT on public.conversation_members to authenticated;
revoke all on public.messages from anon, authenticated;
grant SELECT on public.messages to authenticated;
revoke all on public.user_blocks from anon, authenticated;
revoke all on public.message_reports from anon, authenticated;
revoke all on public.rate_limits from anon, authenticated;

-- ===== Права на функции =====
revoke all on function account_deletion_kind(uuid) from public, anon, authenticated;
revoke all on function add_group_members(bigint,uuid[]) from public, anon, authenticated;
grant execute on function add_group_members(bigint,uuid[]) to authenticated;
revoke all on function approve_submission(bigint) from public, anon, authenticated;
revoke all on function block_user(uuid) from public, anon, authenticated;
grant execute on function block_user(uuid) to authenticated;
revoke all on function cancel_spot_task(bigint,text) from public, anon, authenticated;
grant execute on function cancel_spot_task(bigint,text) to authenticated;
revoke all on function chat_name(uuid) from public, anon, authenticated;
revoke all on function check_account_deletion(uuid) from public, anon, authenticated;
grant execute on function check_account_deletion(uuid) to authenticated;
revoke all on function check_can_act(uuid) from public, anon, authenticated;
revoke all on function check_nickname(text) from public, anon, authenticated;
grant execute on function check_nickname(text) to authenticated;
revoke all on function check_safety_before_submit() from public, anon, authenticated;
revoke all on function check_submission_limits() from public, anon, authenticated;
revoke all on function claim_task(bigint) from public, anon, authenticated;
grant execute on function claim_task(bigint) to authenticated;
revoke all on function confirm_parent_consent(text) from public, anon, authenticated;
grant execute on function confirm_parent_consent(text) to authenticated;
revoke all on function count_nearby_reports(double precision,double precision,double precision) from public, anon, authenticated;
grant execute on function count_nearby_reports(double precision,double precision,double precision) to authenticated;
revoke all on function create_group(text,uuid[]) from public, anon, authenticated;
grant execute on function create_group(text,uuid[]) to authenticated;
revoke all on function delete_my_account() from public, anon, authenticated;
grant execute on function delete_my_account() to authenticated;
revoke all on function geo_distance_m(double precision,double precision,double precision,double precision) from public, anon, authenticated;
grant execute on function geo_distance_m(double precision,double precision,double precision,double precision) to authenticated;
grant execute on function geo_distance_m(double precision,double precision,double precision,double precision) to anon;
revoke all on function get_accounts_for_review() from public, anon, authenticated;
grant execute on function get_accounts_for_review() to authenticated;
revoke all on function get_blocked_users() from public, anon, authenticated;
grant execute on function get_blocked_users() to authenticated;
revoke all on function get_community_stats() from public, anon, authenticated;
grant execute on function get_community_stats() to authenticated;
revoke all on function get_conversation(bigint) from public, anon, authenticated;
grant execute on function get_conversation(bigint) to authenticated;
revoke all on function get_conversations() from public, anon, authenticated;
grant execute on function get_conversations() to authenticated;
revoke all on function get_leaderboard() from public, anon, authenticated;
grant execute on function get_leaderboard() to authenticated;
revoke all on function get_map_tasks() from public, anon, authenticated;
grant execute on function get_map_tasks() to authenticated;
revoke all on function get_message_reports() from public, anon, authenticated;
grant execute on function get_message_reports() to authenticated;
revoke all on function get_messages(bigint,bigint,integer) from public, anon, authenticated;
grant execute on function get_messages(bigint,bigint,integer) to authenticated;
revoke all on function get_my_spot_tasks() from public, anon, authenticated;
grant execute on function get_my_spot_tasks() to authenticated;
revoke all on function get_portfolio(text) from public, anon, authenticated;
grant execute on function get_portfolio(text) to authenticated;
revoke all on function get_reports_for_review() from public, anon, authenticated;
grant execute on function get_reports_for_review() to authenticated;
revoke all on function get_spot_task(bigint) from public, anon, authenticated;
grant execute on function get_spot_task(bigint) to authenticated;
revoke all on function get_task_results_for_review() from public, anon, authenticated;
grant execute on function get_task_results_for_review() to authenticated;
revoke all on function group_admin_check(bigint) from public, anon, authenticated;
revoke all on function handle_new_user() from public, anon, authenticated;
revoke all on function hit_rate(text,integer,integer) from public, anon, authenticated;
revoke all on function is_blocked_between(uuid,uuid) from public, anon, authenticated;
revoke all on function is_member(bigint) from public, anon, authenticated;
grant execute on function is_member(bigint) to authenticated;
revoke all on function is_moderator() from public, anon, authenticated;
grant execute on function is_moderator() to authenticated;
revoke all on function is_visible_task_photo(text) from public, anon, authenticated;
grant execute on function is_visible_task_photo(text) to authenticated;
revoke all on function leave_conversation(bigint) from public, anon, authenticated;
grant execute on function leave_conversation(bigint) to authenticated;
revoke all on function mark_read(bigint) from public, anon, authenticated;
grant execute on function mark_read(bigint) to authenticated;
revoke all on function message_problem(text) from public, anon, authenticated;
revoke all on function moderation_rules() from public, anon, authenticated;
revoke all on function nick_problem(text) from public, anon, authenticated;
revoke all on function open_direct(uuid) from public, anon, authenticated;
grant execute on function open_direct(uuid) to authenticated;
revoke all on function penalize_submission(bigint,integer) from public, anon, authenticated;
grant execute on function penalize_submission(bigint,integer) to authenticated;
revoke all on function public_name(uuid) from public, anon, authenticated;
revoke all on function release_expired_claims() from public, anon, authenticated;
revoke all on function release_task(bigint) from public, anon, authenticated;
grant execute on function release_task(bigint) to authenticated;
revoke all on function remove_group_member(bigint,uuid) from public, anon, authenticated;
grant execute on function remove_group_member(bigint,uuid) to authenticated;
revoke all on function rename_group(bigint,text) from public, anon, authenticated;
grant execute on function rename_group(bigint,text) to authenticated;
revoke all on function report_message(bigint,text) from public, anon, authenticated;
grant execute on function report_message(bigint,text) to authenticated;
revoke all on function resolve_message_report(bigint,boolean,boolean) from public, anon, authenticated;
grant execute on function resolve_message_report(bigint,boolean,boolean) to authenticated;
revoke all on function review_report(bigint,boolean,text,text,text,integer,integer) from public, anon, authenticated;
grant execute on function review_report(bigint,boolean,text,text,text,integer,integer) to authenticated;
revoke all on function review_submission(bigint,boolean,text) from public, anon, authenticated;
grant execute on function review_submission(bigint,boolean,text) to authenticated;
revoke all on function review_task_result(bigint,boolean,text,integer) from public, anon, authenticated;
grant execute on function review_task_result(bigint,boolean,text,integer) to authenticated;
revoke all on function save_safety_info(integer,text,text) from public, anon, authenticated;
grant execute on function save_safety_info(integer,text,text) to authenticated;
revoke all on function search_users(text) from public, anon, authenticated;
grant execute on function search_users(text) to authenticated;
revoke all on function send_message(bigint,text) from public, anon, authenticated;
grant execute on function send_message(bigint,text) to authenticated;
revoke all on function submit_report(text,text,text[],double precision,double precision,real,text) from public, anon, authenticated;
grant execute on function submit_report(text,text,text[],double precision,double precision,real,text) to authenticated;
revoke all on function submit_task_result(bigint,text,double precision,double precision) from public, anon, authenticated;
grant execute on function submit_task_result(bigint,text,double precision,double precision) to authenticated;
revoke all on function touch_activity() from public, anon, authenticated;
grant execute on function touch_activity() to authenticated;
revoke all on function unblock_user(uuid) from public, anon, authenticated;
grant execute on function unblock_user(uuid) to authenticated;
revoke all on function unread_total() from public, anon, authenticated;
grant execute on function unread_total() to authenticated;
revoke all on function update_appearance(text,text,text,text) from public, anon, authenticated;
grant execute on function update_appearance(text,text,text,text) to authenticated;

-- ===== Политики доступа (RLS) =====
create policy "Members read members" on public.conversation_members as PERMISSIVE for SELECT to authenticated using (is_member(conversation_id));
create policy "Members read conversations" on public.conversations as PERMISSIVE for SELECT to authenticated using (is_member(id));
create policy "Members read messages" on public.messages as PERMISSIVE for SELECT to authenticated using (is_member(conversation_id));
create policy "Create own link" on public.portfolio_links as PERMISSIVE for INSERT to authenticated with check ((auth.uid() = user_id));
create policy "Delete own link" on public.portfolio_links as PERMISSIVE for DELETE to authenticated using ((auth.uid() = user_id));
create policy "Read own link" on public.portfolio_links as PERMISSIVE for SELECT to authenticated using ((auth.uid() = user_id));
create policy "Read own profile" on public.profiles as PERMISSIVE for SELECT to public using ((auth.uid() = id));
create policy "Update own profile" on public.profiles as PERMISSIVE for UPDATE to public using ((auth.uid() = id)) with check ((auth.uid() = id));
create policy "Moderators read all reports" on public.reports as PERMISSIVE for SELECT to authenticated using (is_moderator());
create policy "Read own reports" on public.reports as PERMISSIVE for SELECT to authenticated using ((author_id = auth.uid()));
create policy "Assignee reads own spot tasks" on public.spot_tasks as PERMISSIVE for SELECT to authenticated using ((assignee_id = auth.uid()));
create policy "Moderators read spot tasks" on public.spot_tasks as PERMISSIVE for SELECT to authenticated using (is_moderator());
create policy "Insert own submission" on public.submissions as PERMISSIVE for INSERT to authenticated with check (((auth.uid() = user_id) AND (status = 'pending'::text)));
create policy "Moderators read all submissions" on public.submissions as PERMISSIVE for SELECT to authenticated using (is_moderator());
create policy "Read own submissions" on public.submissions as PERMISSIVE for SELECT to authenticated using ((auth.uid() = user_id));
create policy "Tasks are public" on public.tasks as PERMISSIVE for SELECT to public using (true);
create policy "Universities are public" on public.universities as PERMISSIVE for SELECT to public using (true);
create policy "Delete own avatar" on storage.objects as PERMISSIVE for DELETE to authenticated using (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
create policy "Delete own photos" on storage.objects as PERMISSIVE for DELETE to authenticated using (((bucket_id = 'submissions'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
create policy "Moderators read all photos" on storage.objects as PERMISSIVE for SELECT to authenticated using (((bucket_id = 'submissions'::text) AND is_moderator()));
create policy "Moderators read report photos" on storage.objects as PERMISSIVE for SELECT to authenticated using (((bucket_id = 'reports'::text) AND is_moderator()));
create policy "Read own avatar" on storage.objects as PERMISSIVE for SELECT to authenticated using (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
create policy "Read own photos" on storage.objects as PERMISSIVE for SELECT to authenticated using (((bucket_id = 'submissions'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
create policy "Read own report photos" on storage.objects as PERMISSIVE for SELECT to authenticated using (((bucket_id = 'reports'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
create policy "Read task photos" on storage.objects as PERMISSIVE for SELECT to authenticated using (((bucket_id = 'reports'::text) AND is_visible_task_photo(name)));
create policy "Upload own avatar" on storage.objects as PERMISSIVE for INSERT to authenticated with check (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
create policy "Upload own photos" on storage.objects as PERMISSIVE for INSERT to authenticated with check (((bucket_id = 'submissions'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
create policy "Upload own report photos" on storage.objects as PERMISSIVE for INSERT to authenticated with check (((bucket_id = 'reports'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

-- ===== Триггеры =====
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();
CREATE TRIGGER submissions_limits BEFORE INSERT ON public.submissions FOR EACH ROW EXECUTE FUNCTION check_submission_limits();
CREATE TRIGGER submissions_safety BEFORE INSERT ON public.submissions FOR EACH ROW EXECUTE FUNCTION check_safety_before_submit();

-- ===== Хранилище (бакеты) =====
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', false) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('portfolios', 'portfolios', false) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('reports', 'reports', false) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('submissions', 'submissions', false) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('uni-photos', 'uni-photos', true) on conflict (id) do nothing;

-- ===== Realtime: новые сообщения мессенджера =====
alter publication supabase_realtime add table public.messages;

-- ===== Справочные данные: повседневные задания (ru + kk) =====
insert into public.tasks (id, emoji, title, description, place_type, points, category, title_kk, description_kk) overriding system value values
  (1, '🧹', 'Уборка у своего двора', 'Соберите мусор рядом с домом (примерно 50 метров). Работайте в перчатках, не трогайте стекло и шприцы. Сфотографируйте место до и после, с мешками мусора.', 'any', 20, 'clean', 'Өз аулаңды тазала', 'Үйдің жанындағы қоқысты жинаңыз (шамамен 50 метр). Қолғаппен жұмыс істеңіз, шыны мен шприцтерге тиіспеңіз. Жерді тазалауға дейін және кейін, қоқыс қаптарымен бірге суретке түсіріңіз.'),
  (2, '🌳', 'Посади дерево или саженец', 'Посадите дерево во дворе, у школы или на улице с разрешения владельца или администрации. Полейте его. Фото до (ямка) и после (саженец).', 'any', 80, 'trees', 'Ағаш не көшет отырғыз', 'Иесінің немесе әкімшіліктің рұқсатымен ағашты аулаға, мектеп жанына немесе көшеге отырғызыңыз. Оны суарыңыз. Дейінгі (шұңқыр) және кейінгі (көшет) фото.'),
  (3, '♻️', 'Сдай пластик или макулатуру', 'Соберите дома или в школе пластик, бумагу или батарейки и сдайте в пункт приёма. Фото сданного материала.', 'any', 40, 'recycle', 'Пластик не қағаз қалдығын өткіз', 'Үйде немесе мектепте пластик, қағаз не батарейка жинап, қабылдау пунктіне өткізіңіз. Өткізілген материалдың фотосы.'),
  (4, '💧', 'Неделя экономии воды', '7 дней закрывайте кран при чистке зубов и мытье посуды. Фото показаний счётчика (или записи в блокноте) в начале и в конце недели.', 'any', 30, 'water', 'Су үнемдеу аптасы', '7 күн бойы тіс тазалағанда және ыдыс жуғанда кранды жабыңыз. Апта басында және соңында есептегіш көрсеткішінің (немесе дәптердегі жазбаның) фотосы.'),
  (5, '🛍', 'Неделя без пакетов', '7 дней ходите в магазин с многоразовой сумкой. Фото сумки в магазине и ваша заметка за каждый день.', 'any', 30, 'recycle', 'Пакетсіз апта', '7 күн дүкенге көп реттік сөмкемен барыңыз. Дүкендегі сөмкенің фотосы және әр күнгі жазбаңыз.'),
  (6, '🐦', 'Сделай кормушку для птиц', 'Сделайте кормушку из бутылки или коробки и повесьте во дворе. Фото процесса и готовой кормушки на месте.', 'any', 40, 'animals', 'Құстарға жемсауыт жаса', 'Бөтелкеден не қораптан жемсауыт жасап, аулаға іліңіз. Жасау барысының және орнына ілінген жемсауыттың фотосы.'),
  (7, '📚', 'Эко-урок для семьи или класса', 'Проведите 15-минутный рассказ о сортировке мусора или экономии воды для младших или родных. Фото с занятия (без лиц детей, если нет разрешения).', 'any', 60, 'edu', 'Отбасыға не сыныпқа эко-сабақ', 'Кішілерге не туыстарыңызға қоқысты сұрыптау немесе су үнемдеу туралы 15 минуттық әңгіме өткізіңіз. Сабақтан фото (рұқсат болмаса, балалардың бетінсіз).'),
  (8, '🏫', 'Озеленение школьного двора', 'Вместе с классом и учителем посадите цветы или кусты на территории школы. Нужно разрешение школы. Фото до и после.', 'any', 100, 'trees', 'Мектеп ауласын көгалдандыру', 'Сыныппен және мұғаліммен бірге мектеп аумағына гүл не бұта отырғызыңыз. Мектептің рұқсаты керек. Дейін және кейін фото.'),
  (9, '🗑', 'Найди пункт раздельного сбора', 'Найдите в своём городе контейнеры или пункт приёма вторсырья и сфотографируйте их с табличкой или адресом. Расскажите об этом в классе.', 'city', 50, 'recycle', 'Бөлек жинау пунктін тап', 'Қалаңыздан қайталама шикізатқа арналған контейнерлерді не қабылдау пунктін тауып, тақтайшасымен не мекенжайымен суретке түсіріңіз. Бұл туралы сыныпта айтыңыз.'),
  (10, '🚏', 'Уборка остановки или детской площадки', 'Уберите мусор вокруг остановки или площадки рядом с домом. Не трогайте острые предметы. Фото до и после.', 'city', 40, 'clean', 'Аялдаманы не балалар алаңын тазалау', 'Үйдің жанындағы аялдама не алаң маңындағы қоқысты жинаңыз. Өткір заттарға тиіспеңіз. Дейін және кейін фото.'),
  (11, '🔋', 'Сдай батарейки', 'Соберите старые батарейки и сдайте в пункт приёма. Хранить дома лучше в закрытой банке. Фото сдачи.', 'city', 50, 'recycle', 'Батарейкаларды өткіз', 'Ескі батарейкаларды жинап, қабылдау пунктіне өткізіңіз. Үйде жабық банкада сақтаған дұрыс. Өткізу фотосы.'),
  (12, '🌾', 'Уборка вдоль арыка или пруда', 'Уберите мусор на берегу, не заходя в воду. Обязательно с взрослыми. Фото до и после.', 'village', 100, 'clean', 'Арық не тоған бойын тазалау', 'Суға кірмей, жағадағы қоқысты жинаңыз. Міндетті түрде үлкендермен бірге. Дейін және кейін фото.'),
  (13, '🐑', 'Сбор пластика у дороги или на пастбище', 'Соберите бутылки и пакеты возле дороги или пастбища (в стороне от трассы). Фото мешков с мусором.', 'village', 60, 'clean', 'Жол бойынан не жайылымнан пластик жинау', 'Жол не жайылым маңындағы (трассадан алыс) бөтелкелер мен пакеттерді жинаңыз. Қоқыс қаптарының фотосы.'),
  (14, '🏘', 'Уборка у школы, клуба или остановки', 'Организуйте уборку общественного места в вашем ауле вместе с друзьями или соседями. Фото до и после.', 'village', 50, 'clean', 'Мектеп, клуб не аялдама маңын тазалау', 'Ауылыңыздағы қоғамдық орынды достарыңызбен не көршілеріңізбен бірге тазалауды ұйымдастырыңыз. Дейін және кейін фото.'),
  (15, '🔥', 'Не сжигай мусор: расскажи соседям', 'Подготовьте короткую памятку, почему нельзя жечь пластик и мусор, и расскажите 5 семьям. Фото памятки и вашей беседы.', 'village', 50, 'edu', 'Қоқысты өртеме: көршілерге айт', 'Пластик пен қоқысты неге өртеуге болмайтыны туралы қысқа жадынама дайындап, 5 отбасыға айтыңыз. Жадынама мен әңгімеңіздің фотосы.'),
  (16, '🌱', 'Посади деревья вдоль улицы', 'Посадите 3 саженца у дома или вдоль улицы и договоритесь, кто будет их поливать. Фото до и после.', 'village', 90, 'trees', 'Көше бойына ағаш отырғыз', 'Үйдің жанына не көше бойына 3 көшет отырғызып, оларды кім суаратынын келісіңіз. Дейін және кейін фото.')
on conflict (id) do nothing;

-- ===== Справочные данные: вузы =====
insert into public.universities (id, name, city, type, website, description, programs, checked_at, photo_url, requirements, photo_credit) overriding system value values
  (1, 'Назарбаев Университет', 'Астана', 'university', 'https://nu.edu.kz', 'Автономный исследовательский университет, обучение на английском языке.', 'Инженерия и цифровые науки, Естественные и гуманитарные науки, Медицина, Горное дело и геонауки', '2026-10-30', 'https://enttuyexvsioismfjnhe.supabase.co/storage/v1/object/public/uni-photos/Nazarbayev_University_2.jpg', 'Собственный отбор, ЕНТ не используется. Нужны результаты IELTS (от 5.5) или TOEFL и вступительный экзамен NUET (математика, критическое мышление); вместо NUET принимаются SAT, IB Diploma, A-level и некоторые другие сертификаты. Правила и сроки — на apply.nu.edu.kz.', NULL),
  (2, 'Евразийский национальный университет им. Л.Н. Гумилёва', 'Астана', 'university', 'https://enu.kz', 'Крупный классический университет столицы.', 'Естественные науки, Информационные технологии, Право, Международные отношения, Филология, Журналистика', '2026-10-30', 'https://enttuyexvsioismfjnhe.supabase.co/storage/v1/object/public/uni-photos/L.N.Gumilyov_Eurasian_National_University.JPG', 'Приём по результатам ЕНТ. Порог для национальных вузов — 65 баллов; для педагогических и юридических программ — 75. Минимум по предметам: 5 баллов по истории Казахстана и профильным предметам, 3 — по грамотности чтения и математической грамотности. Пороги — на 2025/2026 учебный год; проходной балл на грант определяется конкурсом. Точные условия по программам и сроки — на сайте вуза.', NULL),
  (3, 'Казахский национальный университет им. аль-Фараби', 'Алматы', 'university', 'https://kaznu.kz', 'Один из крупнейших университетов страны.', 'Естественные науки, Информационные технологии, Право, Экономика, Международные отношения, Журналистика', '2026-10-30', 'https://enttuyexvsioismfjnhe.supabase.co/storage/v1/object/public/uni-photos/orig.jpg', 'Приём по результатам ЕНТ. Порог для национальных вузов — 65 баллов; для педагогических и юридических программ — 75, для медицинских — 70. Минимум по предметам: 5 баллов по истории Казахстана и профильным предметам, 3 — по грамотности чтения и математической грамотности. Пороги — на 2025/2026 учебный год; проходной балл на грант определяется конкурсом. Точные условия по программам и сроки — на сайте вуза.', NULL),
  (4, 'Satbayev University', 'Алматы', 'university', 'https://satbayev.university', 'Технический университет: горное дело, нефть и газ, IT, инженерия.', 'Горное дело, Нефть и газ, Информационные технологии, Инженерия', '2026-10-30', 'https://enttuyexvsioismfjnhe.supabase.co/storage/v1/object/public/uni-photos/Satbayev_University_2.jpg', 'Приём по результатам ЕНТ. Порог для национальных вузов — 65 баллов. Минимум по предметам: 5 баллов по истории Казахстана и профильным предметам, 3 — по грамотности чтения и математической грамотности. Пороги — на 2025/2026 учебный год; проходной балл на грант определяется конкурсом. Точные условия по программам и сроки — на сайте вуза.', NULL),
  (5, 'КБТУ', 'Алматы', 'university', 'https://kbtu.kz', 'Казахстанско-Британский технический университет.', 'Нефтегазовое дело, Информационные технологии, Бизнес, Энергетика', '2026-10-30', 'https://enttuyexvsioismfjnhe.supabase.co/storage/v1/object/public/uni-photos/KBTU%20University.jpg', 'Приём по результатам ЕНТ. Порог ЕНТ — 50 баллов. Минимум по предметам: 5 баллов по истории Казахстана и профильным предметам, 3 — по грамотности чтения и математической грамотности. Пороги — на 2025/2026 учебный год; проходной балл на грант определяется конкурсом. Точные условия по программам и сроки — на сайте вуза.', NULL),
  (6, 'Актюбинский региональный университет им. К. Жубанова', 'Актобе', 'university', 'https://arsu.kz', 'Главный государственный университет Актобе.', 'Педагогика, Естественные науки, Филология, Экономика', '2026-10-30', 'https://enttuyexvsioismfjnhe.supabase.co/storage/v1/object/public/uni-photos/3_nzAdz5R.jpg', 'Приём по результатам ЕНТ. Порог ЕНТ — 50 баллов; для педагогических и юридических программ — 75. Минимум по предметам: 5 баллов по истории Казахстана и профильным предметам, 3 — по грамотности чтения и математической грамотности. Пороги — на 2025/2026 учебный год; проходной балл на грант определяется конкурсом. Точные условия по программам и сроки — на сайте вуза.', NULL),
  (7, 'Казахский национальный медицинский университет им. С.Д. Асфендиярова', 'Алматы', 'university', 'https://kaznmu.edu.kz', 'Ведущий медицинский вуз Казахстана, открыт в 1931 году.', 'Общая медицина, Стоматология, Фармация, Общественное здравоохранение, Сестринское дело', '2026-10-30', 'https://enttuyexvsioismfjnhe.supabase.co/storage/v1/object/public/uni-photos/Asfandiyarov.jpg', 'Приём по результатам ЕНТ. Порог для медицинских программ — 70 баллов. Минимум по предметам: 5 баллов по истории Казахстана и профильным предметам, 3 — по грамотности чтения и математической грамотности. Пороги — на 2025/2026 учебный год; проходной балл на грант определяется конкурсом. Точные условия по программам и сроки — на сайте вуза.', NULL),
  (8, 'Almaty Management University (AlmaU)', 'Алматы', 'university', 'https://almau.edu.kz', 'Один из первых бизнес-вузов Казахстана: бакалавриат, магистратура, MBA и DBA.', 'Менеджмент, Экономика, Бизнес-администрирование', '2026-10-30', 'https://enttuyexvsioismfjnhe.supabase.co/storage/v1/object/public/uni-photos/AlmaU.jpg', 'Приём по результатам ЕНТ. Порог ЕНТ — 50 баллов. Минимум по предметам: 5 баллов по истории Казахстана и профильным предметам, 3 — по грамотности чтения и математической грамотности. Пороги — на 2025/2026 учебный год; проходной балл на грант определяется конкурсом. Точные условия по программам и сроки — на сайте вуза.', NULL),
  (9, 'Университет Нархоз', 'Алматы', 'university', 'https://narxoz.kz', 'Основан в 1963 году как Алматинский институт народного хозяйства, нынешнее название — с 2016 года.', 'Экономика, Бизнес, Финансы, Право', '2026-10-30', 'https://enttuyexvsioismfjnhe.supabase.co/storage/v1/object/public/uni-photos/Narxoz.jpg', 'Приём по результатам ЕНТ. Порог ЕНТ — 50 баллов; для юридических программ — 75. Минимум по предметам: 5 баллов по истории Казахстана и профильным предметам, 3 — по грамотности чтения и математической грамотности. Пороги — на 2025/2026 учебный год; проходной балл на грант определяется конкурсом. Точные условия по программам и сроки — на сайте вуза.', 'Narxoz University, CC BY-SA 4.0, Wikimedia Commons'),
  (10, 'Карагандинский университет им. Е.А. Букетова', 'Караганда', 'university', 'https://buketov.edu.kz', 'Основан в 1972 году как Карагандинский государственный университет. Имеет статус национального университета.', 'Педагогика, Естественные науки, Право, Экономика, Филология', '2026-10-30', 'https://enttuyexvsioismfjnhe.supabase.co/storage/v1/object/public/uni-photos/Buketov.jpg', 'Приём по результатам ЕНТ. Порог для национальных вузов — 65 баллов; для педагогических и юридических программ — 75. Минимум по предметам: 5 баллов по истории Казахстана и профильным предметам, 3 — по грамотности чтения и математической грамотности. Пороги — на 2025/2026 учебный год; проходной балл на грант определяется конкурсом. Точные условия по программам и сроки — на сайте вуза.', 'Nikolay Olkhovoy, CC BY 3.0, Wikimedia Commons'),
  (11, 'Международный университет информационных технологий (МУИТ)', 'Алматы', 'university', 'https://iitu.edu.kz', 'IT-университет, основан в 2009 году в Алматы.', 'Информационные технологии, Программная инженерия, Кибербезопасность, Телекоммуникации', '2026-10-30', 'https://enttuyexvsioismfjnhe.supabase.co/storage/v1/object/public/uni-photos/Muit.jpg', 'Приём по результатам ЕНТ. Порог ЕНТ — 50 баллов. Минимум по предметам: 5 баллов по истории Казахстана и профильным предметам, 3 — по грамотности чтения и математической грамотности. Пороги — на 2025/2026 учебный год; проходной балл на грант определяется конкурсом. Точные условия по программам и сроки — на сайте вуза.', 'МаратД, CC BY-SA 4.0, Wikimedia Commons'),
  (12, 'Медицинский университет Астана', 'Астана', 'university', 'http://www.amu.kz', 'Основан в 1964 году как Целиноградский государственный медицинский институт, нынешнее название — с 2009 года.', 'Общая медицина, Стоматология, Сестринское дело, Общественное здравоохранение, Фармация', '2026-10-30', 'https://enttuyexvsioismfjnhe.supabase.co/storage/v1/object/public/uni-photos/Astana%20medicine.jpg', 'Приём по результатам ЕНТ. Порог для медицинских программ — 70 баллов. Минимум по предметам: 5 баллов по истории Казахстана и профильным предметам, 3 — по грамотности чтения и математической грамотности. Пороги — на 2025/2026 учебный год; проходной балл на грант определяется конкурсом. Точные условия по программам и сроки — на сайте вуза.', NULL),
  (13, 'Западно-Казахстанский медицинский университет им. Марата Оспанова', 'Актобе', 'university', 'https://ospanov.university', 'Медицинский университет, основан в 1957 году как Актюбинский государственный медицинский институт. Имя Марата Оспанова — с 2009 года.', 'Общая медицина, Стоматология, Фармация, Сестринское дело, Общественное здравоохранение', '2026-10-30', 'https://enttuyexvsioismfjnhe.supabase.co/storage/v1/object/public/uni-photos/ospanov.jpg', 'Приём по результатам ЕНТ. Порог для медицинских программ — 70 баллов. Минимум по предметам: 5 баллов по истории Казахстана и профильным предметам, 3 — по грамотности чтения и математической грамотности. Пороги — на 2025/2026 учебный год; проходной балл на грант определяется конкурсом. Точные условия по программам и сроки — на сайте вуза.', NULL),
  (14, 'SDU University', 'Каскелен', 'university', 'https://sdu.edu.kz', 'Частный международный университет, основан в 1996 году (Университет имени Сулеймана Демиреля). Кампус — в Каскелене, Алматинская область.', 'Инженерия и естественные науки, Бизнес, Право и социальные науки, Педагогика и гуманитарные науки', '2026-10-30', 'https://enttuyexvsioismfjnhe.supabase.co/storage/v1/object/public/uni-photos/SDU.jpg', 'Приём по результатам ЕНТ. Порог ЕНТ — 50 баллов; для педагогических и юридических программ — 75. Минимум по предметам: 5 баллов по истории Казахстана и профильным предметам, 3 — по грамотности чтения и математической грамотности. Пороги — на 2025/2026 учебный год; проходной балл на грант определяется конкурсом. Точные условия по программам и сроки — на сайте вуза.', 'Suleyman Demirel University, CC BY-SA 3.0, Wikimedia Commons'),
  (15, 'Южно-Казахстанский университет им. М. Ауэзова', 'Шымкент', 'university', 'https://auezov.edu.kz', 'Государственный университет в Шымкенте, основан в 1943 году. Нынешнее название — с 1998 года.', 'Инженерия и технологии, Строительство, Педагогика, Экономика, Право', '2026-10-30', 'https://enttuyexvsioismfjnhe.supabase.co/storage/v1/object/public/uni-photos/Auezov.jpg', 'Приём по результатам ЕНТ. Порог ЕНТ — 50 баллов; для педагогических и юридических программ — 75. Минимум по предметам: 5 баллов по истории Казахстана и профильным предметам, 3 — по грамотности чтения и математической грамотности. Пороги — на 2025/2026 учебный год; проходной балл на грант определяется конкурсом. Точные условия по программам и сроки — на сайте вуза.', 'TheGreatSteppe, CC BY-SA 4.0, Wikimedia Commons'),
  (16, 'Казахский национальный педагогический университет им. Абая', 'Алматы', 'university', 'https://abai.university', 'Первый вуз Казахстана, основан в 1928 году. Ведущий педагогический университет страны.', 'Педагогика и психология, Математика и информатика, Естественные науки, Филология, История, Искусство', '2026-10-30', 'https://enttuyexvsioismfjnhe.supabase.co/storage/v1/object/public/uni-photos/Abai.jpg', 'Приём по результатам ЕНТ. Порог для педагогических программ — 75 баллов, для остальных программ национального вуза — 65. Минимум по предметам: 5 баллов по истории Казахстана и профильным предметам, 3 — по грамотности чтения и математической грамотности. Пороги — на 2025/2026 учебный год; проходной балл на грант определяется конкурсом. Точные условия по программам и сроки — на сайте вуза.', 'Mheidegger, общественное достояние, Wikimedia Commons'),
  (17, 'Торайгыров университет', 'Павлодар', 'university', 'https://tou.edu.kz', 'Университет в Павлодаре, начинался как Павлодарский индустриальный институт. 9 факультетов.', 'Инженерия, Энергетика, Педагогика, Экономика, Право', '2026-10-30', 'https://enttuyexvsioismfjnhe.supabase.co/storage/v1/object/public/uni-photos/TORAIGHYROV.jpg', 'Приём по результатам ЕНТ. Порог ЕНТ — 50 баллов; для педагогических и юридических программ — 75. Минимум по предметам: 5 баллов по истории Казахстана и профильным предметам, 3 — по грамотности чтения и математической грамотности. Пороги — на 2025/2026 учебный год; проходной балл на грант определяется конкурсом. Точные условия по программам и сроки — на сайте вуза.', NULL),
  (18, 'Astana IT University', 'Астана', 'university', 'https://astanait.edu.kz', 'IT-университет, открыт в 2019 году в рамках госпрограммы «Цифровой Казахстан». Кампус находится на территории бывшей выставки EXPO.', 'Информационные технологии, Программная инженерия, Кибербезопасность', '2026-10-30', 'https://enttuyexvsioismfjnhe.supabase.co/storage/v1/object/public/uni-photos/AITU.jpg', 'Приём по результатам ЕНТ. Порог ЕНТ — 50 баллов. Минимум по предметам: 5 баллов по истории Казахстана и профильным предметам, 3 — по грамотности чтения и математической грамотности. Пороги — на 2025/2026 учебный год; проходной балл на грант определяется конкурсом. Точные условия по программам и сроки — на сайте вуза.', 'ZhamilyaYeshen, CC BY-SA 4.0, Wikimedia Commons'),
  (19, 'KIMEP University', 'Алматы', 'university', 'https://kimep.kz', 'Частный университет, основан в 1992 году. Обучение ведётся на английском языке.', 'Бизнес, Экономика, Право, Международные отношения, Журналистика', '2026-10-30', 'https://enttuyexvsioismfjnhe.supabase.co/storage/v1/object/public/uni-photos/Kimep.jpg', 'Собственные требования: сертификат по английскому (IELTS, TOEFL, Duolingo и др.) или внутренний тест KEPT; минимальные баллы зависят от категории поступающего. Для программы Computer Science — тест по математике. Приём заявок открывается 15 октября. Подробности — на kimep.kz.', 'KIMEP, CC BY-SA 3.0, Wikimedia Commons')
on conflict (id) do nothing;

-- ===== Справочные данные: запрещённые слова для ников =====
insert into public.banned_words (word, lang) values
  ('ashole', 'en'),
  ('bastard', 'en'),
  ('bitch', 'en'),
  ('blyat', 'en'),
  ('boob', 'en'),
  ('cock', 'en'),
  ('cunt', 'en'),
  ('dick', 'en'),
  ('ebat', 'en'),
  ('fagot', 'en'),
  ('fck', 'en'),
  ('fuck', 'en'),
  ('fuk', 'en'),
  ('horny', 'en'),
  ('huy', 'en'),
  ('niger', 'en'),
  ('nude', 'en'),
  ('penis', 'en'),
  ('pizd', 'en'),
  ('porn', 'en'),
  ('pusy', 'en'),
  ('sex', 'en'),
  ('shit', 'en'),
  ('slut', 'en'),
  ('suka', 'en'),
  ('tits', 'en'),
  ('whore', 'en'),
  ('аменди', 'ru'),
  ('амын', 'ru'),
  ('бля', 'ru'),
  ('бляд', 'ru'),
  ('блят', 'ru'),
  ('вагин', 'ru'),
  ('выеб', 'ru'),
  ('гавн', 'ru'),
  ('гандон', 'ru'),
  ('говн', 'ru'),
  ('голая', 'ru'),
  ('голые', 'ru'),
  ('гондон', 'ru'),
  ('даун', 'ru'),
  ('дебил', 'ru'),
  ('дермо', 'ru'),
  ('доеб', 'ru'),
  ('долбоеб', 'ru'),
  ('дроч', 'ru'),
  ('ебал', 'ru'),
  ('ебан', 'ru'),
  ('ебат', 'ru'),
  ('еблан', 'ru'),
  ('ебло', 'ru'),
  ('ебну', 'ru'),
  ('ебуч', 'ru'),
  ('жалап', 'ru'),
  ('жопа', 'ru'),
  ('жопу', 'ru'),
  ('жопы', 'ru'),
  ('заеб', 'ru'),
  ('залуп', 'ru'),
  ('засран', 'ru'),
  ('котак', 'ru'),
  ('мандавош', 'ru'),
  ('минет', 'ru'),
  ('мудак', 'ru'),
  ('мудил', 'ru'),
  ('мудоз', 'ru'),
  ('наеб', 'ru'),
  ('обосра', 'ru'),
  ('педер', 'ru'),
  ('педик', 'ru'),
  ('пезд', 'ru'),
  ('пенис', 'ru'),
  ('пидар', 'ru'),
  ('пидор', 'ru'),
  ('пидр', 'ru'),
  ('пизд', 'ru'),
  ('писюн', 'ru'),
  ('поеб', 'ru'),
  ('порев', 'ru'),
  ('порн', 'ru'),
  ('проститу', 'ru'),
  ('разеб', 'ru'),
  ('секс', 'ru'),
  ('сигеин', 'ru'),
  ('сигем', 'ru'),
  ('сиктир', 'ru'),
  ('сиськ', 'ru'),
  ('сука', 'ru'),
  ('суки', 'ru'),
  ('сучар', 'ru'),
  ('сучк', 'ru'),
  ('трахал', 'ru'),
  ('трахат', 'ru'),
  ('трахн', 'ru'),
  ('уеба', 'ru'),
  ('уебо', 'ru'),
  ('хуе', 'ru'),
  ('хуи', 'ru'),
  ('хуй', 'ru'),
  ('хуло', 'ru'),
  ('хуя', 'ru'),
  ('чмо', 'ru'),
  ('шалав', 'ru'),
  ('шешенди', 'ru'),
  ('шлюх', 'ru'),
  ('шлюшк', 'ru'),
  ('эротик', 'ru')
on conflict (word) do nothing;

-- счётчики id после вставки данных с явными id
select setval(pg_get_serial_sequence('public.tasks', 'id'), (select max(id) from public.tasks));
select setval(pg_get_serial_sequence('public.universities', 'id'), (select max(id) from public.universities));
