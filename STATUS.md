# STATUS: ME

Last updated: 2026-11-10

## Milestone 1: Skeleton (code written, not yet live)

### Done in code
- Vite + React + TypeScript + Tailwind app, with a web app manifest (installable).
- Design tokens (terracotta accent, light mode, Inter) in `src/index.css`. No raw hex in components.
- Magic-link login limited to the one allowed email (`VITE_ALLOWED_EMAIL`), with `shouldCreateUser: false`.
- App shell: left sidebar on desktop (search pinned on top), bottom bar on phone (Home, Search, Boxes, Add).
- Home screen: skeleton loading, an error state with "Try again", and the empty state ("Nothing saved yet. Add a link, image or quote.").
- Placeholder pages for Search, Boxes, Add and Imports (they say which milestone delivers them). Settings shows your email and Sign out.
- `supabase/migrations/0001_me_schema.sql`: the `me` schema, every Phase 1 table, indexes (full-text and vector), and RLS on all tables. It touches nothing outside `me`.
- `netlify.toml` and `.env.example`.

### How it was verified
- `npm run typecheck`, `npm test` (12 tests: allowed-email rule and 4.5:1 contrast for every colour pair) and `npm run build` all pass.
- Login page checked in a real browser at desktop and phone widths. A wrong email shows a clear error.
- Searched the code: no raw hex outside the token file, no em dashes anywhere.
- Database: the migration is applied to the "Porcupine Apps" Supabase project (migrations 0001 and 0002). A check confirmed all 13 `me` tables have RLS turned on and enforced, and the security advisor reports nothing for the `me` schema.
- NOT yet verified: the real login and the empty grid in the browser, because the Netlify site and the Supabase settings below are not done yet.

### Waiting on Daniel (do these one at a time, I will walk you through each)
1. **Expose the `me` schema**: Supabase dashboard, Project Settings, Data API, "Exposed schemas", add `me`.
2. **Create the Netlify site** and connect it to `maskedpoet13/me`. Add these environment variables there: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (the publishable key) and `VITE_ALLOWED_EMAIL`.
3. **Create your user once** in Supabase (Authentication, Users, Add user, using your email), and add your Netlify address to Authentication, URL Configuration, Redirect URLs.

### Decided
- Daniel chose to keep ME in the shared Supabase project ("Porcupine Apps") and keep sign-ups on, because turning them off would affect the other apps. The one-email check is browser-only for now, so Milestone 2 adds a server-side check that only Daniel's email can use ME's data and API.

## Next: Milestone 2 (manual add and item view)
Starts after Milestone 1 is live and you can log in and see the empty state.
