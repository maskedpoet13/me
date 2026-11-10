-- ME, migration 0001: the `me` schema, Phase 1 tables, and row-level security.
--
-- IMPORTANT: this project is SHARED with other apps. This file only creates and
-- touches objects inside the `me` schema (plus the pgvector extension, which is
-- created only if missing). It never alters tables in any other schema.

create schema if not exists me;
create extension if not exists vector with schema extensions;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function me.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Items (type is an open text column on purpose: notes and videos come later)
-- ---------------------------------------------------------------------------
create table me.items (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type              text not null,
  source            text not null,
  url               text,
  canonical_url     text,
  title             text,
  site_name         text,
  creator           text,
  year              int,
  external_id       text,
  note              text,
  quote_text        text,
  readable_html     text,
  readable_text     text,
  image_path        text,
  thumb_path        text,
  image_description text,
  copy_status       text not null default 'pending' check (copy_status in ('pending', 'ok', 'failed')),
  ai_status         text not null default 'pending' check (ai_status in ('pending', 'queued_budget', 'done', 'failed')),
  visibility        text not null default 'private',
  is_own_writing    boolean not null default false,
  parent_item_id    uuid references me.items (id) on delete set null,
  embedding         extensions.vector(384),
  search_tsv        tsvector generated always as (
    to_tsvector(
      'english',
      coalesce(title, '') || ' ' || coalesce(creator, '') || ' ' || coalesce(note, '') || ' ' ||
      coalesce(quote_text, '') || ' ' || coalesce(image_description, '') || ' ' ||
      left(coalesce(readable_text, ''), 50000)
    )
  ) stored,
  created_at        timestamptz not null default now(),
  saved_at          timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index items_user_saved_idx on me.items (user_id, saved_at desc);
create index items_parent_idx on me.items (parent_item_id);
create index items_canonical_url_idx on me.items (user_id, canonical_url);
create index items_search_tsv_idx on me.items using gin (search_tsv);
create index items_embedding_idx on me.items using hnsw (embedding extensions.vector_cosine_ops);
create trigger items_touch_updated_at before update on me.items
  for each row execute function me.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Moods and topics (each stored once, linked to items)
-- ---------------------------------------------------------------------------
create table me.moods (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  label      text not null,
  created_at timestamptz not null default now(),
  unique (user_id, label)
);
create table me.item_moods (
  item_id    uuid not null references me.items (id) on delete cascade,
  mood_id    uuid not null references me.moods (id) on delete cascade,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (item_id, mood_id)
);
create table me.topics (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  label      text not null,
  created_at timestamptz not null default now(),
  unique (user_id, label)
);
create table me.item_topics (
  item_id    uuid not null references me.items (id) on delete cascade,
  topic_id   uuid not null references me.topics (id) on delete cascade,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (item_id, topic_id)
);

-- ---------------------------------------------------------------------------
-- Boxes (many-to-many with items; an item is stored once)
-- ---------------------------------------------------------------------------
create table me.boxes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null,
  description text,
  visibility  text not null default 'private',
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);
create table me.item_boxes (
  item_id    uuid not null references me.items (id) on delete cascade,
  box_id     uuid not null references me.boxes (id) on delete cascade,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  added_at   timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (item_id, box_id)
);

-- ---------------------------------------------------------------------------
-- Background fetch log, imports
-- ---------------------------------------------------------------------------
create table me.fetch_attempts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  item_id      uuid not null references me.items (id) on delete cascade,
  attempt_no   int not null,
  status       text not null,
  error        text,
  attempted_at timestamptz not null default now(),
  created_at   timestamptz not null default now()
);
create index fetch_attempts_item_idx on me.fetch_attempts (item_id, attempt_no);

create table me.imports (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind       text not null,
  status     text not null default 'parsing',
  counts     jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create table me.import_rows (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  import_id    uuid not null references me.imports (id) on delete cascade,
  raw          jsonb not null,
  link_status  text,
  duplicate_of uuid references me.items (id) on delete set null,
  selected     boolean not null default true,
  item_id      uuid references me.items (id) on delete set null,
  created_at   timestamptz not null default now()
);
create index import_rows_import_idx on me.import_rows (import_id);

-- ---------------------------------------------------------------------------
-- AI usage (the $5 cap), API tokens, settings
-- ---------------------------------------------------------------------------
create table me.ai_usage (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  purpose       text not null,
  model         text not null,
  input_tokens  int not null default 0,
  output_tokens int not null default 0,
  cost_usd      numeric(10, 6) not null default 0,
  created_at    timestamptz not null default now()
);
create index ai_usage_user_month_idx on me.ai_usage (user_id, created_at);

create table me.api_tokens (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name         text not null,
  token_hash   text not null unique,
  scope        text not null default 'create_items',
  last_used_at timestamptz,
  revoked_at   timestamptz,
  created_at   timestamptz not null default now()
);

create table me.settings (
  user_id            uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  monthly_ai_cap_usd numeric(8, 2) not null default 5.00,
  preferences        jsonb not null default '{}'::jsonb,
  created_at         timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row-level security: every row belongs to exactly one user.
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'items', 'moods', 'item_moods', 'topics', 'item_topics', 'boxes', 'item_boxes',
    'fetch_attempts', 'imports', 'import_rows', 'ai_usage', 'api_tokens', 'settings'
  ]
  loop
    execute format('alter table me.%I enable row level security', t);
    execute format('alter table me.%I force row level security', t);
  end loop;

  -- Full read/write on the user's own rows.
  foreach t in array array[
    'items', 'moods', 'item_moods', 'topics', 'item_topics', 'boxes', 'item_boxes',
    'fetch_attempts', 'imports', 'import_rows', 'settings'
  ]
  loop
    execute format(
      'create policy %I on me.%I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())',
      t || '_own', t
    );
  end loop;
end
$$;

-- Read-only from the browser. Writes happen in server functions (service role).
-- ai_usage: the Settings meter only reads. api_tokens: created and revoked server side.
create policy ai_usage_read_own on me.ai_usage for select to authenticated using (user_id = auth.uid());
create policy api_tokens_read_own on me.api_tokens for select to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Privileges. RLS above decides which rows; grants decide which verbs.
-- The anon role gets nothing in this schema.
-- ---------------------------------------------------------------------------
grant usage on schema me to authenticated, service_role;
grant select, insert, update, delete on
  me.items, me.moods, me.item_moods, me.topics, me.item_topics, me.boxes, me.item_boxes,
  me.fetch_attempts, me.imports, me.import_rows, me.settings
  to authenticated;
grant select on me.ai_usage, me.api_tokens to authenticated;
grant all on all tables in schema me to service_role;
grant execute on all functions in schema me to service_role;
