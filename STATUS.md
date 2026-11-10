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
- NOT yet verified: the real login and the empty grid against Supabase, because the database is not connected yet. The migration has not been run.

### Waiting on Daniel (do these one at a time, I will walk you through each)
1. **Pick the shared Supabase project** and tell me its name. I will then run the migration.
2. **Expose the `me` schema**: Supabase dashboard, Project Settings, Data API, "Exposed schemas", add `me`.
3. **Add the Supabase URL and anon key** to Netlify (names are in `.env.example`).
4. **Create the Netlify site** and connect it to `maskedpoet13/me`. Set `VITE_ALLOWED_EMAIL` there too.
5. **Create your user once** in Supabase (Authentication, Users, Add user, "Send invite" or create with your email), and add your Netlify address to Authentication, URL Configuration, Redirect URLs.

### Decision needed from Daniel
The Supabase project is shared with your other apps, so its login system is shared too. That means:
- Turning off sign-ups for the whole project (SPEC Section 4) would also stop new sign-ups in your other apps.
- Anyone who already has an account in another app could in theory request a sign-in link for ME. The app only offers one allowed email, and I have set `shouldCreateUser: false`, but this is a browser check only.

Options: (a) keep sign-ups on and rely on RLS plus the one-email check for now, with a stronger server-side check added in Milestone 2; (b) use a separate Supabase project for ME. I have not changed anything yet. Tell me which you prefer.

## Next: Milestone 2 (manual add and item view)
Starts after Milestone 1 is live and you can log in and see the empty state.
