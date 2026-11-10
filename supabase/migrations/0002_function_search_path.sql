-- ME, migration 0002: pin the search path on the updated_at trigger function
-- (flagged by the Supabase security advisor).
alter function me.touch_updated_at() set search_path = '';
