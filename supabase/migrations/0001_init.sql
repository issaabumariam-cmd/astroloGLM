-- Astrolo — Database Schema
-- Run this in your Supabase SQL editor

-- Enable extensions
create extension if not exists "pgvector";

-- Profiles (extends auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  locale text default 'en',
  birth_date date,
  birth_time time,
  birth_place text,
  birth_lat numeric,
  birth_lng numeric,
  zodiac_sign text,
  subscription_status text default 'free',
  subscription_ends_at timestamptz,
  ai_questions_used int default 0,
  ai_questions_limit int default 3,
  ai_questions_reset_at timestamptz,
  created_at timestamptz default now()
);

-- Book content
create table if not exists book_chapters (
  id serial primary key,
  chapter_num int unique,
  title text,
  summary text,
  content text,
  locale text default 'en'
);

create table if not exists book_sections (
  id serial primary key,
  chapter_id int references book_chapters(id) on delete cascade,
  section_num int,
  title text,
  content text,
  page_start int,
  page_end int
);

-- RAG embeddings (pgvector)
create table if not exists book_embeddings (
  id bigserial primary key,
  chapter_id int,
  section_id int,
  chunk_text text,
  embedding vector(768),
  page_num int
);

-- Create vector index for similarity search
create index if not exists book_embeddings_embedding_idx
  on book_embeddings using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Horoscopes (pre-generated, cached)
create table if not exists horoscopes (
  id bigserial primary key,
  sign text,
  scope text,
  date date,
  locale text,
  content text,
  mood int,
  lucky_number int,
  lucky_color text,
  created_at timestamptz default now(),
  unique(sign, scope, date, locale)
);

-- AI chat history
create table if not exists chat_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  topic text,
  created_at timestamptz default now()
);

create table if not exists chat_messages (
  id bigserial primary key,
  thread_id uuid references chat_threads(id) on delete cascade,
  role text,
  content text,
  retrieved_chunks int[],
  tokens_used int,
  created_at timestamptz default now()
);

-- Usage tracking
create table if not exists ai_usage (
  id bigserial primary key,
  user_id uuid,
  feature text,
  tokens_in int,
  tokens_out int,
  cost_estimate numeric,
  created_at timestamptz default now()
);

-- Compatibility reports (cached)
create table if not exists compatibility_reports (
  id bigserial primary key,
  sign1 text,
  sign2 text,
  locale text,
  content text,
  love_score int,
  communication_score int,
  trust_score int,
  emotion_score int,
  created_at timestamptz default now(),
  unique(sign1, sign2, locale)
);

-- Transits / astrological events
create table if not exists astro_events (
  id bigserial primary key,
  event_type text,
  date date,
  end_date date,
  description text,
  significance text
);

-- Subscriptions (mirror Stripe)
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text,
  status text,
  current_period_end timestamptz,
  created_at timestamptz default now()
);

-- Content translations (for multi-language)
create table if not exists content_translations (
  id bigserial primary key,
  entity_type text,
  entity_id text,
  locale text,
  field text,
  value text
);

-- Geo-pricing
create table if not exists pricing_tiers (
  id serial primary key,
  country_code text unique,
  monthly_price numeric,
  annual_price numeric,
  report_price numeric,
  currency text
);

-- Row Level Security
alter table profiles enable row level security;
alter table chat_threads enable row level security;
alter table chat_messages enable row level security;
alter table ai_usage enable row level security;
alter table subscriptions enable row level security;

-- Profiles: users can see and update their own profile
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

-- Chat threads: users can only see their own
create policy "Users can view own threads" on chat_threads for select using (auth.uid() = user_id);
create policy "Users can insert own threads" on chat_threads for insert with check (auth.uid() = user_id);
create policy "Users can delete own threads" on chat_threads for delete using (auth.uid() = user_id);

-- Chat messages: through thread ownership
create policy "Users can view own messages" on chat_messages for select using (
  exists (select 1 from chat_threads where chat_threads.id = chat_messages.thread_id and chat_threads.user_id = auth.uid())
);
create policy "Users can insert own messages" on chat_messages for insert with check (
  exists (select 1 from chat_threads where chat_threads.id = chat_messages.thread_id and chat_threads.user_id = auth.uid())
);

-- AI usage: users can only see their own
create policy "Users can view own usage" on ai_usage for select using (auth.uid() = user_id);
create policy "Users can insert own usage" on ai_usage for insert with check (auth.uid() = user_id);

-- Subscriptions: users can only see their own
create policy "Users can view own subscription" on subscriptions for select using (auth.uid() = user_id);

-- Public read access for content tables
alter table horoscopes enable row level security;
create policy "Anyone can read horoscopes" on horoscopes for select using (true);

alter table compatibility_reports enable row level security;
create policy "Anyone can read compatibility" on compatibility_reports for select using (true);

alter table astro_events enable row level security;
create policy "Anyone can read events" on astro_events for select using (true);

alter table book_chapters enable row level security;
create policy "Anyone can read chapters" on book_chapters for select using (true);

alter table book_sections enable row level security;
create policy "Anyone can read sections" on book_sections for select using (true);

alter table content_translations enable row level security;
create policy "Anyone can read translations" on content_translations for select using (true);

alter table pricing_tiers enable row level security;
create policy "Anyone can read pricing" on pricing_tiers for select using (true);

-- Auto-create profile when user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();