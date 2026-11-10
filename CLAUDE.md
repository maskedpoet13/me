# CLAUDE.md: ME

Read `SPEC.md` first. It's the source of truth for what ME is and every decision made so far. `STATUS.md` tracks progress.

## About the owner

- Daniel Parker. A writer and publisher (The Porcupine Press), not a full-time developer. He's comfortable directing Claude Code.
- Explain things in plain language. When something needs him (an API key, a Make.com step, a setting), give numbered steps that name the exact field or button.
- Lead with what you can do yourself. Only hand him manual steps for things you can't reach.
- Walk through multi-step setup **one step at a time**.

## How to work in this repo

- Build Phase 1 **in the milestone order in SPEC.md Section 9**. Finish and verify each milestone before starting the next.
- After each milestone, update `STATUS.md` with what's done, how it was verified, what's next, and any setup waiting on Daniel.
- **Don't build later-phase features** (twin chat, interviews, sharing, voice). Just keep the data model and code structure ready for them.
- **Don't change decided design choices** (SPEC Section 8) without asking Daniel first. If something in the spec seems wrong or impossible, stop and ask instead of quietly working around it.
- Reliability over flash: background jobs retry, log failures, and never fail silently. A save must always succeed fast, even when everything after it fails.

## Hard rules

- **AI cost cap:** every Anthropic API call goes through the single cost-tracking helper (SPEC Section 7). Never call the API directly from anywhere else. The monthly cap defaults to $5.
- **Shared Supabase project:** ME uses its **own schema `me` only**. Never read, change, or migrate tables in other schemas (they belong to Daniel's other apps).
- **RLS on every table.** The service-role key is used only in server functions, never shipped to the browser or the extension.
- **No secrets in git.** Use env vars in Netlify and Supabase, and keep `.env.example` up to date.
- **No em dashes** in any interface text, docs written for Daniel, or commit messages. Use commas, parentheses, or separate sentences.
- **Interface:** use design tokens (no raw hex in components), Lucide icons (no emoji as icons), touch targets of at least 44 px, visible focus states, and 4.5:1 text contrast.
- Check current model IDs and library versions in the official docs. Don't rely on memory.

## Stack quick reference

- React + TypeScript + Vite + Tailwind, running as a PWA
- Netlify (plus Functions and Scheduled Functions), on the free netlify.app address
- Supabase (Postgres + pgvector, Auth, Storage, and an Edge Function for gte-small embeddings), schema `me`
- Anthropic API (the current Haiku model for tagging, image descriptions, and search answers)
- Chrome extension (Manifest V3) in `/extension`
- GitHub: `maskedpoet13/me`
