-- Резервная копия структуры базы Supabase проекта TazaNiyet (снимок 2026-10-31).
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

-- ===== Индексы =====
CREATE UNIQUE INDEX one_pending_per_task ON public.submissions USING btree (user_id, task_id) WHERE (status = 'pending'::text);
CREATE UNIQUE INDEX profiles_nickname_unique ON public.profiles USING btree (lower(nickname)) WHERE (nickname IS NOT NULL);
CREATE INDEX reports_author_idx ON public.reports USING btree (author_id, created_at DESC);
CREATE INDEX reports_status_idx ON public.reports USING btree (status, created_at);
CREATE INDEX spot_tasks_assignee_idx ON public.spot_tasks USING btree (assignee_id, status);
CREATE INDEX spot_tasks_status_idx ON public.spot_tasks USING btree (status);

-- ===== Функции =====
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

CREATE OR REPLACE FUNCTION public.update_appearance(p_nickname text, p_emoji text, p_color text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  n text := nullif(trim(p_nickname), '');
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

  update profiles
    set nickname = n, avatar_emoji = p_emoji, avatar_color = p_color
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

-- ===== Права на функции =====
revoke all on function approve_submission(bigint) from public, anon, authenticated;
revoke all on function cancel_spot_task(bigint,text) from public, anon, authenticated;
grant execute on function cancel_spot_task(bigint,text) to authenticated;
revoke all on function check_can_act(uuid) from public, anon, authenticated;
revoke all on function check_safety_before_submit() from public, anon, authenticated;
grant execute on function check_safety_before_submit() to authenticated;
grant execute on function check_safety_before_submit() to anon;
revoke all on function check_submission_limits() from public, anon, authenticated;
grant execute on function check_submission_limits() to authenticated;
grant execute on function check_submission_limits() to anon;
revoke all on function claim_task(bigint) from public, anon, authenticated;
grant execute on function claim_task(bigint) to authenticated;
revoke all on function confirm_parent_consent(text) from public, anon, authenticated;
grant execute on function confirm_parent_consent(text) to authenticated;
revoke all on function count_nearby_reports(double precision,double precision,double precision) from public, anon, authenticated;
grant execute on function count_nearby_reports(double precision,double precision,double precision) to authenticated;
revoke all on function delete_my_account() from public, anon, authenticated;
grant execute on function delete_my_account() to authenticated;
revoke all on function geo_distance_m(double precision,double precision,double precision,double precision) from public, anon, authenticated;
grant execute on function geo_distance_m(double precision,double precision,double precision,double precision) to authenticated;
grant execute on function geo_distance_m(double precision,double precision,double precision,double precision) to anon;
revoke all on function get_community_stats() from public, anon, authenticated;
grant execute on function get_community_stats() to authenticated;
revoke all on function get_leaderboard() from public, anon, authenticated;
grant execute on function get_leaderboard() to authenticated;
revoke all on function get_map_tasks() from public, anon, authenticated;
grant execute on function get_map_tasks() to authenticated;
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
revoke all on function handle_new_user() from public, anon, authenticated;
grant execute on function handle_new_user() to authenticated;
grant execute on function handle_new_user() to anon;
revoke all on function is_moderator() from public, anon, authenticated;
grant execute on function is_moderator() to authenticated;
grant execute on function is_moderator() to anon;
revoke all on function is_visible_task_photo(text) from public, anon, authenticated;
grant execute on function is_visible_task_photo(text) to authenticated;
revoke all on function penalize_submission(bigint,integer) from public, anon, authenticated;
grant execute on function penalize_submission(bigint,integer) to authenticated;
revoke all on function public_name(uuid) from public, anon, authenticated;
revoke all on function release_expired_claims() from public, anon, authenticated;
revoke all on function release_task(bigint) from public, anon, authenticated;
grant execute on function release_task(bigint) to authenticated;
revoke all on function review_report(bigint,boolean,text,text,text,integer,integer) from public, anon, authenticated;
grant execute on function review_report(bigint,boolean,text,text,text,integer,integer) to authenticated;
revoke all on function review_submission(bigint,boolean,text) from public, anon, authenticated;
grant execute on function review_submission(bigint,boolean,text) to authenticated;
revoke all on function review_task_result(bigint,boolean,text,integer) from public, anon, authenticated;
grant execute on function review_task_result(bigint,boolean,text,integer) to authenticated;
revoke all on function save_safety_info(integer,text,text) from public, anon, authenticated;
grant execute on function save_safety_info(integer,text,text) to authenticated;
revoke all on function submit_report(text,text,text[],double precision,double precision,real,text) from public, anon, authenticated;
grant execute on function submit_report(text,text,text[],double precision,double precision,real,text) to authenticated;
revoke all on function submit_task_result(bigint,text,double precision,double precision) from public, anon, authenticated;
grant execute on function submit_task_result(bigint,text,double precision,double precision) to authenticated;
revoke all on function update_appearance(text,text,text) from public, anon, authenticated;
grant execute on function update_appearance(text,text,text) to authenticated;

-- ===== Политики доступа (RLS) =====
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
create policy "Delete own photos" on storage.objects as PERMISSIVE for DELETE to authenticated using (((bucket_id = 'submissions'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
create policy "Moderators read all photos" on storage.objects as PERMISSIVE for SELECT to authenticated using (((bucket_id = 'submissions'::text) AND is_moderator()));
create policy "Moderators read report photos" on storage.objects as PERMISSIVE for SELECT to authenticated using (((bucket_id = 'reports'::text) AND is_moderator()));
create policy "Read own photos" on storage.objects as PERMISSIVE for SELECT to authenticated using (((bucket_id = 'submissions'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
create policy "Read own report photos" on storage.objects as PERMISSIVE for SELECT to authenticated using (((bucket_id = 'reports'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
create policy "Read task photos" on storage.objects as PERMISSIVE for SELECT to authenticated using (((bucket_id = 'reports'::text) AND is_visible_task_photo(name)));
create policy "Upload own photos" on storage.objects as PERMISSIVE for INSERT to authenticated with check (((bucket_id = 'submissions'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
create policy "Upload own report photos" on storage.objects as PERMISSIVE for INSERT to authenticated with check (((bucket_id = 'reports'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

-- ===== Триггеры =====
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();
CREATE TRIGGER submissions_limits BEFORE INSERT ON public.submissions FOR EACH ROW EXECUTE FUNCTION check_submission_limits();
CREATE TRIGGER submissions_safety BEFORE INSERT ON public.submissions FOR EACH ROW EXECUTE FUNCTION check_safety_before_submit();

-- ===== Хранилище (бакеты) =====
insert into storage.buckets (id, name, public) values ('reports', 'reports', f) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('submissions', 'submissions', f) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('uni-photos', 'uni-photos', t) on conflict (id) do nothing;

-- ===== Справочные данные: повседневные задания =====
insert into public.tasks (id, emoji, title, description, place_type, points, category) overriding system value values
  (1, '🧹', 'Уборка у своего двора', 'Соберите мусор рядом с домом (примерно 50 метров). Работайте в перчатках, не трогайте стекло и шприцы. Сфотографируйте место до и после, с мешками мусора.', 'any', 20, 'clean'),
  (2, '🌳', 'Посади дерево или саженец', 'Посадите дерево во дворе, у школы или на улице с разрешения владельца или администрации. Полейте его. Фото до (ямка) и после (саженец).', 'any', 80, 'trees'),
  (3, '♻️', 'Сдай пластик или макулатуру', 'Соберите дома или в школе пластик, бумагу или батарейки и сдайте в пункт приёма. Фото сданного материала.', 'any', 40, 'recycle'),
  (4, '💧', 'Неделя экономии воды', '7 дней закрывайте кран при чистке зубов и мытье посуды. Фото показаний счётчика (или записи в блокноте) в начале и в конце недели.', 'any', 30, 'water'),
  (5, '🛍', 'Неделя без пакетов', '7 дней ходите в магазин с многоразовой сумкой. Фото сумки в магазине и ваша заметка за каждый день.', 'any', 30, 'recycle'),
  (6, '🐦', 'Сделай кормушку для птиц', 'Сделайте кормушку из бутылки или коробки и повесьте во дворе. Фото процесса и готовой кормушки на месте.', 'any', 40, 'animals'),
  (7, '📚', 'Эко-урок для семьи или класса', 'Проведите 15-минутный рассказ о сортировке мусора или экономии воды для младших или родных. Фото с занятия (без лиц детей, если нет разрешения).', 'any', 60, 'edu'),
  (8, '🏫', 'Озеленение школьного двора', 'Вместе с классом и учителем посадите цветы или кусты на территории школы. Нужно разрешение школы. Фото до и после.', 'any', 100, 'trees'),
  (9, '🗑', 'Найди пункт раздельного сбора', 'Найдите в своём городе контейнеры или пункт приёма вторсырья и сфотографируйте их с табличкой или адресом. Расскажите об этом в классе.', 'city', 50, 'recycle'),
  (10, '🚏', 'Уборка остановки или детской площадки', 'Уберите мусор вокруг остановки или площадки рядом с домом. Не трогайте острые предметы. Фото до и после.', 'city', 40, 'clean'),
  (11, '🔋', 'Сдай батарейки', 'Соберите старые батарейки и сдайте в пункт приёма. Хранить дома лучше в закрытой банке. Фото сдачи.', 'city', 50, 'recycle'),
  (12, '🌾', 'Уборка вдоль арыка или пруда', 'Уберите мусор на берегу, не заходя в воду. Обязательно с взрослыми. Фото до и после.', 'village', 100, 'clean'),
  (13, '🐑', 'Сбор пластика у дороги или на пастбище', 'Соберите бутылки и пакеты возле дороги или пастбища (в стороне от трассы). Фото мешков с мусором.', 'village', 60, 'clean'),
  (14, '🏘', 'Уборка у школы, клуба или остановки', 'Организуйте уборку общественного места в вашем ауле вместе с друзьями или соседями. Фото до и после.', 'village', 50, 'clean'),
  (15, '🔥', 'Не сжигай мусор: расскажи соседям', 'Подготовьте короткую памятку, почему нельзя жечь пластик и мусор, и расскажите 5 семьям. Фото памятки и вашей беседы.', 'village', 50, 'edu'),
  (16, '🌱', 'Посади деревья вдоль улицы', 'Посадите 3 саженца у дома или вдоль улицы и договоритесь, кто будет их поливать. Фото до и после.', 'village', 90, 'trees')
on conflict (id) do nothing;

-- ===== Справочные данные: вузы =====
insert into public.universities (id, name, city, type, website, description, programs, checked_at, photo_url, requirements, photo_credit) overriding system value values
  (1, 'Назарбаев Университет', 'Астана', 'university', 'https://nu.edu.kz', 'Автономный исследовательский университет, обучение на английском языке.', 'Инженерия и цифровые науки, Естественные и гуманитарные науки, Медицина, Горное дело и геонауки', '2026-10-30', 'https://enttuyexvsioismfjnhe.supabase.co/storage/v1/object/public/uni-photos/Nazarbayev_University_2.jpg', 'Собственный отбор, ЕНТ не используется. Нужны результаты IELTS (от 5.5) или TOEFL и вступительный экзамен NUET (математика, критическое мышление); вместо NUET принимаются SAT, IB Diploma, A-level и некоторые другие сертификаты. Правила и сроки — на apply.nu.edu.kz.', NULL),
  (2, 'Евразийский национальный университет им. Л.Н. Гумилёва', 'Астана', 'university', 'https://enu.kz', 'Крупный классический университет столицы.', 'Естественные науки, Информационные технологии, Право, Международные отношения, Филология, Журналистика', '2026-10-30', 'https://enttuyexvsioismfjnhe.supabase.co/storage/v1/object/public/uni-photos/L.N.Gumilyov_Eurasian_National_University.JPG', 'Приём по результатам ЕНТ. Порог для национальных вузов — 65 баллов; для педагогических и юридических программ — 75. Минимум по предметам: 5 баллов по истории Казахстана и профильным предметам, 3 — по грамотности чтения и математической грамотности. Пороги — на 2025/2026 учебный год; проходной балл на грант определяется конкурсом. Точные условия по программам и сроки — на сайте вуза.', NULL),
  (3, 'Казахский национальный университет им. аль-Фараби', 'Алматы', 'university', 'https://kaznu.kz', 'Один из крупнейших университетов страны.', 'Естественные науки, Информационные технологии, Право, Экономика, Международные отношения, Журналистика', '2026-10-30', 'https://enttuyexvsioismfjnhe.supabase.co/storage/v1/object/public/uni-photos/orig.jpg', 'Приём по результатам ЕНТ. Порог для национальных вузов — 65 баллов; для педагогических и юридических программ — 75, для медицинских — 70. Минимум по предметам: 5 баллов по истории Казахстана и профильным предметам, 3 — по грамотности чтения и математической грамотности. Пороги — на 2025/2026 учебный год; проходной балл на грант определяется конкурсом. Точные условия по программам и сроки — на сайте вуза.', NULL),
  (4, 'Satbayev University', 'Алматы', 'university', 'https://satbayev.university', 'Технический университет: горное дело, нефть и газ, IT, инженерия.', 'Горное дело, Нефть и газ, Информационные технологии, Инженерия', '2026-10-30', 'https://enttuyexvsioismfjnhe.supabase.co/storage/v1/object/public/uni-photos/Satbayev_University_2.jpg', 'Приём по результатам ЕНТ. Порог для национальных вузов — 65 баллов. Минимум по предметам: 5 баллов по истории Казахстана и профильным предметам, 3 — по грамотности чтения и математической грамотности. Пороги — на 2025/2026 учебный год; проходной балл на грант определяется конкурсом. Точные условия по программам и сроки — на сайте вуза.', NULL),
  (5, 'КБТУ', 'Алматы', 'university', 'https://kbtu.kz', 'Казахстанско-Британский технический университет.', 'Нефтегазовое дело, Информационные технологии, Бизнес, Энергетика', '2026-10-30', 'https://enttuyexvsioismfjnhe.supabase.co/storage/v1/object/public/uni-photos/KBTU%20University.jpg', 'Приём по результатам ЕНТ. Порог ЕНТ — 50 баллов. Минимум по предметам: 5 баллов по истории Казахстана и профильным предметам, 3 — по грамотности чтения и математической грамотности. Пороги — на 2025/2026 учебный год; проходной балл на грант определяется конкурсом. Точные условия по программам и сроки — на сайте вуза.', NULL),
  (6, 'Актюбинский региональный университет им. К. Жубанова', 'Актобе', 'university', 'https://arsu.kz', 'Главный государственный университет Актобе.', 'Педагогика, Естественные науки, Филология, Экономика', '2026-10-30', 'https://enttuyexvsioismfjnhe.supabase.co/storage/v1/object/public/uni-photos/3_nzAdz5R.jpg', 'Приём по результатам ЕНТ. Порог ЕНТ — 50 баллов; для педагогических и юридических программ — 75. Минимум по предметам: 5 баллов по истории Казахстана и профильным предметам, 3 — по грамотности чтения и математической грамотности. Пороги — на 2025/2026 учебный год; проходной балл на грант определяется конкурсом. Точные условия по программам и сроки — на сайте вуза.', NULL),
  (7, 'Казахский национальный медицинский университет им. С.Д. Асфендиярова', 'Алматы', 'university', 'https://kaznmu.edu.kz', 'Ведущий медицинский вуз Казахстана, открыт в 1931 году.', 'Общая медицина, Стоматология, Фармация, Общественное здравоохранение, Сестринское дело', '2026-10-30', NULL, 'Приём по результатам ЕНТ. Порог для медицинских программ — 70 баллов. Минимум по предметам: 5 баллов по истории Казахстана и профильным предметам, 3 — по грамотности чтения и математической грамотности. Пороги — на 2025/2026 учебный год; проходной балл на грант определяется конкурсом. Точные условия по программам и сроки — на сайте вуза.', NULL),
  (8, 'Almaty Management University (AlmaU)', 'Алматы', 'university', 'https://almau.edu.kz', 'Один из первых бизнес-вузов Казахстана: бакалавриат, магистратура, MBA и DBA.', 'Менеджмент, Экономика, Бизнес-администрирование', '2026-10-30', NULL, 'Приём по результатам ЕНТ. Порог ЕНТ — 50 баллов. Минимум по предметам: 5 баллов по истории Казахстана и профильным предметам, 3 — по грамотности чтения и математической грамотности. Пороги — на 2025/2026 учебный год; проходной балл на грант определяется конкурсом. Точные условия по программам и сроки — на сайте вуза.', NULL),
  (9, 'Университет Нархоз', 'Алматы', 'university', 'https://narxoz.kz', 'Основан в 1963 году как Алматинский институт народного хозяйства, нынешнее название — с 2016 года.', 'Экономика, Бизнес, Финансы, Право', '2026-10-30', NULL, 'Приём по результатам ЕНТ. Порог ЕНТ — 50 баллов; для юридических программ — 75. Минимум по предметам: 5 баллов по истории Казахстана и профильным предметам, 3 — по грамотности чтения и математической грамотности. Пороги — на 2025/2026 учебный год; проходной балл на грант определяется конкурсом. Точные условия по программам и сроки — на сайте вуза.', 'Narxoz University, CC BY-SA 4.0, Wikimedia Commons'),
  (10, 'Карагандинский университет им. Е.А. Букетова', 'Караганда', 'university', 'https://buketov.edu.kz', 'Основан в 1972 году как Карагандинский государственный университет. Имеет статус национального университета.', 'Педагогика, Естественные науки, Право, Экономика, Филология', '2026-10-30', NULL, 'Приём по результатам ЕНТ. Порог для национальных вузов — 65 баллов; для педагогических и юридических программ — 75. Минимум по предметам: 5 баллов по истории Казахстана и профильным предметам, 3 — по грамотности чтения и математической грамотности. Пороги — на 2025/2026 учебный год; проходной балл на грант определяется конкурсом. Точные условия по программам и сроки — на сайте вуза.', 'Nikolay Olkhovoy, CC BY 3.0, Wikimedia Commons'),
  (11, 'Международный университет информационных технологий (МУИТ)', 'Алматы', 'university', 'https://iitu.edu.kz', 'IT-университет, основан в 2009 году в Алматы.', 'Информационные технологии, Программная инженерия, Кибербезопасность, Телекоммуникации', '2026-10-30', NULL, 'Приём по результатам ЕНТ. Порог ЕНТ — 50 баллов. Минимум по предметам: 5 баллов по истории Казахстана и профильным предметам, 3 — по грамотности чтения и математической грамотности. Пороги — на 2025/2026 учебный год; проходной балл на грант определяется конкурсом. Точные условия по программам и сроки — на сайте вуза.', 'МаратД, CC BY-SA 4.0, Wikimedia Commons'),
  (12, 'Медицинский университет Астана', 'Астана', 'university', 'http://www.amu.kz', 'Основан в 1964 году как Целиноградский государственный медицинский институт, нынешнее название — с 2009 года.', 'Общая медицина, Стоматология, Сестринское дело, Общественное здравоохранение, Фармация', '2026-10-30', NULL, 'Приём по результатам ЕНТ. Порог для медицинских программ — 70 баллов. Минимум по предметам: 5 баллов по истории Казахстана и профильным предметам, 3 — по грамотности чтения и математической грамотности. Пороги — на 2025/2026 учебный год; проходной балл на грант определяется конкурсом. Точные условия по программам и сроки — на сайте вуза.', NULL),
  (13, 'Западно-Казахстанский медицинский университет им. Марата Оспанова', 'Актобе', 'university', 'https://ospanov.university', 'Медицинский университет, основан в 1957 году как Актюбинский государственный медицинский институт. Имя Марата Оспанова — с 2009 года.', 'Общая медицина, Стоматология, Фармация, Сестринское дело, Общественное здравоохранение', '2026-10-30', NULL, 'Приём по результатам ЕНТ. Порог для медицинских программ — 70 баллов. Минимум по предметам: 5 баллов по истории Казахстана и профильным предметам, 3 — по грамотности чтения и математической грамотности. Пороги — на 2025/2026 учебный год; проходной балл на грант определяется конкурсом. Точные условия по программам и сроки — на сайте вуза.', NULL),
  (14, 'SDU University', 'Каскелен', 'university', 'https://sdu.edu.kz', 'Частный международный университет, основан в 1996 году (Университет имени Сулеймана Демиреля). Кампус — в Каскелене, Алматинская область.', 'Инженерия и естественные науки, Бизнес, Право и социальные науки, Педагогика и гуманитарные науки', '2026-10-30', NULL, 'Приём по результатам ЕНТ. Порог ЕНТ — 50 баллов; для педагогических и юридических программ — 75. Минимум по предметам: 5 баллов по истории Казахстана и профильным предметам, 3 — по грамотности чтения и математической грамотности. Пороги — на 2025/2026 учебный год; проходной балл на грант определяется конкурсом. Точные условия по программам и сроки — на сайте вуза.', 'Suleyman Demirel University, CC BY-SA 3.0, Wikimedia Commons'),
  (15, 'Южно-Казахстанский университет им. М. Ауэзова', 'Шымкент', 'university', 'https://auezov.edu.kz', 'Государственный университет в Шымкенте, основан в 1943 году. Нынешнее название — с 1998 года.', 'Инженерия и технологии, Строительство, Педагогика, Экономика, Право', '2026-10-30', NULL, 'Приём по результатам ЕНТ. Порог ЕНТ — 50 баллов; для педагогических и юридических программ — 75. Минимум по предметам: 5 баллов по истории Казахстана и профильным предметам, 3 — по грамотности чтения и математической грамотности. Пороги — на 2025/2026 учебный год; проходной балл на грант определяется конкурсом. Точные условия по программам и сроки — на сайте вуза.', 'TheGreatSteppe, CC BY-SA 4.0, Wikimedia Commons'),
  (16, 'Казахский национальный педагогический университет им. Абая', 'Алматы', 'university', 'https://abai.university', 'Первый вуз Казахстана, основан в 1928 году. Ведущий педагогический университет страны.', 'Педагогика и психология, Математика и информатика, Естественные науки, Филология, История, Искусство', '2026-10-30', NULL, 'Приём по результатам ЕНТ. Порог для педагогических программ — 75 баллов, для остальных программ национального вуза — 65. Минимум по предметам: 5 баллов по истории Казахстана и профильным предметам, 3 — по грамотности чтения и математической грамотности. Пороги — на 2025/2026 учебный год; проходной балл на грант определяется конкурсом. Точные условия по программам и сроки — на сайте вуза.', 'Mheidegger, общественное достояние, Wikimedia Commons'),
  (17, 'Торайгыров университет', 'Павлодар', 'university', 'https://tou.edu.kz', 'Университет в Павлодаре, начинался как Павлодарский индустриальный институт. 9 факультетов.', 'Инженерия, Энергетика, Педагогика, Экономика, Право', '2026-10-30', NULL, 'Приём по результатам ЕНТ. Порог ЕНТ — 50 баллов; для педагогических и юридических программ — 75. Минимум по предметам: 5 баллов по истории Казахстана и профильным предметам, 3 — по грамотности чтения и математической грамотности. Пороги — на 2025/2026 учебный год; проходной балл на грант определяется конкурсом. Точные условия по программам и сроки — на сайте вуза.', NULL),
  (18, 'Astana IT University', 'Астана', 'university', 'https://astanait.edu.kz', 'IT-университет, открыт в 2019 году в рамках госпрограммы «Цифровой Казахстан». Кампус находится на территории бывшей выставки EXPO.', 'Информационные технологии, Программная инженерия, Кибербезопасность', '2026-10-30', NULL, 'Приём по результатам ЕНТ. Порог ЕНТ — 50 баллов. Минимум по предметам: 5 баллов по истории Казахстана и профильным предметам, 3 — по грамотности чтения и математической грамотности. Пороги — на 2025/2026 учебный год; проходной балл на грант определяется конкурсом. Точные условия по программам и сроки — на сайте вуза.', 'ZhamilyaYeshen, CC BY-SA 4.0, Wikimedia Commons'),
  (19, 'KIMEP University', 'Алматы', 'university', 'https://kimep.kz', 'Частный университет, основан в 1992 году. Обучение ведётся на английском языке.', 'Бизнес, Экономика, Право, Международные отношения, Журналистика', '2026-10-30', NULL, 'Собственные требования: сертификат по английскому (IELTS, TOEFL, Duolingo и др.) или внутренний тест KEPT; минимальные баллы зависят от категории поступающего. Для программы Computer Science — тест по математике. Приём заявок открывается 15 октября. Подробности — на kimep.kz.', 'KIMEP, CC BY-SA 3.0, Wikimedia Commons')
on conflict (id) do nothing;

-- счётчики id после вставки данных с явными id
select setval(pg_get_serial_sequence('public.tasks', 'id'), (select max(id) from public.tasks));
select setval(pg_get_serial_sequence('public.universities', 'id'), (select max(id) from public.universities));
