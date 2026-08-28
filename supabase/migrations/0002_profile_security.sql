-- Paste in Supabase SQL editor

-- Drop ALL update policies on profiles
drop policy if exists "Users can update own profile" on profiles;
drop policy if exists "Users can update own profile (birth data only)" on profiles;

-- Create a NEW update policy that only allows updating birth-data + display columns
-- This works by checking that sensitive columns haven't changed
create policy "Users can update own profile" on profiles
  for update to authenticated, anon
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- But block sensitive column updates at the column grant level
-- Supabase uses PostgREST which respects column-level grants
revoke update (ai_questions_used, ai_questions_limit, subscription_status, subscription_ends_at, ai_questions_reset_at) on profiles from anon, authenticated;

-- If revoke doesn't work (PostgREST manages grants), use a trigger instead:
-- This trigger rejects updates to sensitive columns from non-service-role users
create or replace function public.block_sensitive_profile_updates()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Only allow service role (uses the admin client) to change sensitive fields
  -- auth.uid() returns the user id; if it's null, it's the service role
  if auth.uid() is not null then
    -- This is a regular user, not service role
    -- Block changes to sensitive columns
    if new.ai_questions_used is distinct from old.ai_questions_used then
      raise exception 'Not allowed to update ai_questions_used';
    end if;
    if new.ai_questions_limit is distinct from old.ai_questions_limit then
      raise exception 'Not allowed to update ai_questions_limit';
    end if;
    if new.subscription_status is distinct from old.subscription_status then
      raise exception 'Not allowed to update subscription_status';
    end if;
    if new.subscription_ends_at is distinct from old.subscription_ends_at then
      raise exception 'Not allowed to update subscription_ends_at';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists block_sensitive_updates on profiles;
create trigger block_sensitive_updates
  before update on profiles
  for each row execute function public.block_sensitive_profile_updates();

-- The safe RPC function (already created, re-create to be sure)
create or replace function public.update_own_birth_data(
  p_birth_date date,
  p_birth_time time,
  p_birth_place text,
  p_birth_lat numeric,
  p_birth_lng numeric,
  p_zodiac_sign text
) returns void
language plpgsql
security definer set search_path = public
as $$
begin
  -- SECURITY DEFINER: runs as the function owner (postgres), not the calling user
  -- auth.uid() returns null inside SECURITY DEFINER functions unless we set it
  -- So we use the token from the request headers via current_setting
  update public.profiles
  set
    birth_date = p_birth_date,
    birth_time = p_birth_time,
    birth_place = p_birth_place,
    birth_lat = p_birth_lat,
    birth_lng = p_birth_lng,
    zodiac_sign = p_zodiac_sign
  where id = auth.uid();
end;
$$;

grant execute on function public.update_own_birth_data(date, time, text, numeric, numeric, text) to authenticated, anon;