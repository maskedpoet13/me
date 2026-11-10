# ME: Product Spec

Owner: Daniel Parker
Spec date: 2026-11-10
Status: Aligned, ready for Phase 1 build

## 1. What ME is

ME builds "multiples" of a person: a talkable AI twin made from what they save, read, write, and say about themselves. Eventually anyone can build their own twin and share it with the public, friends, and family, and take it with them as an export.

**Right now it is a personal tool for Daniel only.** It is built so that more users can be added later without a rewrite (every row has a `user_id`, and row-level security is on from day one), but Phase 1 has exactly one account and sign-ups are disabled.

### Lessons from Pika AI Self (what ME must beat)

Daniel stopped using Pika because it **didn't work reliably**, was **expensive**, and had **bad customer service**. So:

1. **Reliability over flash.** Ship fewer features that always work. Every background job retries and logs its failures; nothing fails silently.
2. **Cheap by design.** There is a hard $5/month cap on AI spending (Section 7).
3. **No lock-in.** A weekly full backup to Drive from Phase 1 on, and a full export later.

## 2. Phase roadmap

| Phase | What | Status |
|---|---|---|
| **1** | **Saving layer:** save, auto-moods, Boxes, search, imports, backup | **Build now** |
| 2 | Private chat with the twin (first person, with sources), editable profile, chat corrections | Designed at a high level (Section 10) |
| 3 | Interviews: one question a day | Designed at a high level |
| Later | Sharing with access levels (public / friends / family), voice, a "take your twin with you" export, multi-user product | Parked; architecture must allow these |

Build Phase 1 in the milestone order in Section 9. Finish and verify each milestone before starting the next.

## 3. Stack (decided)

- **Frontend:** React + TypeScript + Vite + Tailwind CSS, installable as a PWA.
- **Hosting:** Netlify, on the free `*.netlify.app` address (for example `me-parker.netlify.app`). Server work runs in Netlify Functions, with Netlify Scheduled Functions for background jobs.
- **Database / auth / storage:** Daniel's **existing shared free Supabase project**. ME lives in its own Postgres schema, `me`, so it never touches the other apps' tables (Daily Crony, BookKoko, FSU Plan). Add `me` to the project's exposed API schemas. Turn on the pgvector extension if it isn't on already.
- **AI:** Claude via the Anthropic API. Use the cheapest current Haiku model for tagging and image descriptions, and check the current model ID in Anthropic's docs instead of hard-coding an old one.
- **Embeddings:** Supabase's built-in `gte-small` model, run in a Supabase Edge Function (384 dimensions). It's free and doesn't count against the AI cap.
- **Code:** a GitHub repo `me` on account `maskedpoet13`.
- **Secrets:** kept only in Netlify and Supabase environment variables. Never committed to the repo.

### Free-tier limits to respect

- Supabase free tier gives about 500 MB of database and about 1 GB of file storage, **shared with Daniel's other apps**. ME should show its own usage on the Settings page and warn when it has used 600 MB of storage.
- Images are stored compressed only (Section 5.3).

## 4. Users and auth (Phase 1)

- Supabase Auth with an email magic link. Exactly one allowed email, set in an env var. Sign-ups are disabled.
- **API tokens** for the Chrome extension and the email/webhook pipeline. Each is a long random token you create and revoke on the Settings page. Store only a hash of it, and scope it to "create items" only.
- RLS on every `me.*` table: `user_id = auth.uid()`. Service-role access is limited to server functions.

## 5. Phase 1 features

### 5.1 Ways to save

1. **Chrome extension** (Manifest V3), for Daniel's Windows laptop:
   - Toolbar button or keyboard shortcut: saves the current page.
   - Right-click on an image: "Save image to ME."
   - Right-click on selected text: "Save quote to ME" (keeps the source URL and title).
   - A small popup after saving: a "Saved" confirmation, an **optional** note box, and an optional Box picker. It closes on its own after a few seconds if you don't touch it.
   - It authenticates with an API token pasted into the extension's options page once.
2. **Phone share button** (PWA with the Web Share Target API). Daniel's phone is a **Samsung Galaxy S25 Ultra with Chrome on Android, which supports this.** Install ME to the home screen, and "ME" then appears in the Android share sheet for links, text, and images.
3. **Email as a backup.** Daniel emails or forwards a link, note, or photo to a dedicated address, and it lands in ME.
   - Recommended setup: a Gmail filter applies a label (for example "ME") to mail sent to a plus-address. A **Make.com** scenario (Daniel already pays for Make) watches that label and POSTs the subject, body, links, and image attachments to ME's token-protected `/api/ingest` endpoint.
   - Pick a simpler path only if it is equally reliable.
4. **Manual add** in the web app: paste a URL, upload an image, type a quote, or search for a book, film, or album.

**All save paths are one tap.** The note is always optional. A save must return a success message within about 1 second. Everything slow (fetching the page, the readable copy, compression, AI tagging, embedding) runs in the background afterward.

### 5.2 Item types (all four on day one)

| Type | What's stored |
|---|---|
| **Article / web page** | URL, title, site name, favicon, preview image, a **clean readable copy** (Mozilla Readability, stored as sanitized HTML plus plain text), word count |
| **Image** | A compressed copy (Section 5.3), the source URL or page if known, and an AI description (so "the blue kitchen" is findable) |
| **Quote / highlight** | The quoted text, plus the source URL, title, and author if known. It links to the article item if that page is also saved |
| **Book / film / music** | Title, creator (author, director, artist), year, cover image, and an external ID. Metadata lookup: Open Library (books), TMDB (films; needs a free API key), MusicBrainz plus Cover Art Archive (music). The user confirms the match from a short list |

Own notes and videos are **not** in Phase 1. Leave room for them in the data model (`type` is an open enum).

### 5.3 Images

- Compress to WebP, longest side at most 1600 px, aiming for roughly 100 to 200 KB. Also make a small thumbnail (about 400 px) for the grid.
- Store both in a Supabase Storage bucket `me-images` (private, served through signed URLs).
- Don't keep the original files.

### 5.4 When a save partly fails (decided: save now, retry quietly, then flag)

- The item is always created right away with whatever is available (URL, title, highlighted text).
- If the readable copy or page metadata fails (paywall, login wall, blocked site, timeout), a background job **retries about 3 more times over roughly 24 hours**, with growing gaps between tries.
- If every retry fails, the item gets a quiet "no copy" marker (an icon plus a text label, not just a color). Moods are made from whatever ME could see.
- **Never interrupt Daniel with a prompt.** Log each attempt in `fetch_attempts`, and add a "Retry now" button in the item panel.

### 5.5 Moods (auto) and Boxes (manual)

- **Moods** are poetic and free-form, in the Moodshelf style ("rainy window," "late-night thinking," "golden hour"). Claude assigns 1 to 3 per item. **There is no fixed list.** Store each mood once in `moods` and link it to items, so filtering and counting work. Also store 2 to 5 plain **topics** per item (for example "institutions," "architecture") to help search.
- **Boxes** are Daniel's name for shelves or collections. He creates, renames, and deletes them. **An item can be in any number of Boxes, and it is stored once.** Its note, moods, and so on look the same in every Box.
- Boxes are private in Phase 1. Give them a `visibility` field now (default `private`) so sharing can be added later.

### 5.6 Search (decided: results plus a short answer)

- Use hybrid search: Postgres full-text search plus vector similarity (gte-small embeddings of the title, readable text excerpt, image description, note, moods, and topics).
- The results grid appears first and fast.
- Then a **short plain-language answer** of 1 to 2 sentences, generated by Haiku from the top results. For example: "You saved three things like that, mostly in October: two essays on..." It comes **from saved items only**, with no outside recommendations.
- The answer is skipped (and the results still appear) when the AI cap is hit.
- Filters: type, mood, Box, date range.

### 5.7 Imports (all reviewed before AI tagging)

1. **Porcupine Press essays** from Beehiiv: the published posts via the Beehiiv API, with title, date, URL, and full text. These are tagged `source = own_writing`, because Daniel's own writing is the most important material for the twin's voice later.
2. **Chrome bookmarks** from the exported `bookmarks.html` file. Folder names are offered as optional Boxes.
3. **Goodreads** from its CSV export (read and rated books, with rating, shelf, and review), and **Kindle highlights** (from "My Clippings.txt" or a Kindle notebook export). Highlights become Quote items linked to their Book item.

Every import follows the same three steps:

1. **Upload or connect**, then ME parses the file into `import_rows` and checks each link (live, dead, redirected, or duplicate of an existing item).
2. **Review screen**: counts (new, duplicate, dead), with "keep all live," "drop dead," "drop duplicates," and per-row checkboxes. **No AI calls happen before this step.**
3. **Commit**: the chosen rows become items. AI tagging then runs in the background at a pace that respects the $5 cap (Section 7). If the import is larger than the month's remaining budget, untagged items wait in a queue for next month, and the Settings page says so.

### 5.8 Weekly backup to Google Drive

- Once a week, a full export goes into a **"ME Backups"** folder in Daniel's Google Drive.
- The export is a zip with JSON for all tables (items, moods, Boxes, links, notes, imports metadata), the readable copies, and the compressed images.
- Recommended setup: ME has a token-protected `/api/export` endpoint, and a weekly **Make.com** scenario calls it and saves the file to Drive. (A Google service account won't work here, because those accounts have no storage space in a personal Drive.)
- Keep the last 8 backups.
- This export format is the start of the later "take your twin with you" export, so document it in `docs/export-format.md`.

## 6. Data model (starting point; Claude Code may refine it)

All tables live in schema `me`. Every table has `user_id uuid` and `created_at`, and RLS is on everywhere.

- `items`
  - Fields: `id`, `user_id`, `type` (article | image | quote | book | film | music, open to more later), `source` (extension | share | email | manual | import_beehiiv | import_bookmarks | import_goodreads | import_kindle), `url`, `canonical_url`, `title`, `site_name`, `creator`, `year`, `external_id`, `note`, `quote_text`, `readable_html`, `readable_text`, `image_path`, `thumb_path`, `image_description`, `copy_status` (pending | ok | failed), `ai_status` (pending | queued_budget | done | failed), `visibility` (default private), `is_own_writing` bool, `embedding vector(384)`, `saved_at`, `updated_at`
  - `parent_item_id` is nullable (it links a quote to its source item)
  - Full-text `tsvector` column plus GIN index, and a vector index on the embedding
- `moods`: `id`, `user_id`, `label` (unique per user)
- `item_moods`: `item_id`, `mood_id`
- `topics` and `item_topics`: same shape as moods
- `boxes`: `id`, `user_id`, `name`, `description`, `visibility` (default private), `sort_order`
- `item_boxes`: `item_id`, `box_id`, `added_at` (many-to-many)
- `fetch_attempts`: `id`, `item_id`, `attempt_no`, `status`, `error`, `attempted_at`
- `imports`: `id`, `user_id`, `kind`, `status`, `counts jsonb`, `created_at`
- `import_rows`: `id`, `import_id`, `raw jsonb`, `link_status`, `duplicate_of`, `selected` bool, `item_id`
- `ai_usage`: `id`, `user_id`, `purpose` (tag | describe_image | search_answer | ...), `model`, `input_tokens`, `output_tokens`, `cost_usd`, `created_at`
- `api_tokens`: `id`, `user_id`, `name`, `token_hash`, `scope`, `last_used_at`, `revoked_at`
- `settings`: `user_id`, `monthly_ai_cap_usd` (default 5.00), plus other preferences

**Leave room for later phases; don't build these yet:** `profile_facts`, `chat_sessions`, `chat_messages`, `corrections`, `interview_questions`, `interview_answers`, `share_links`, `audiences`.

## 7. Cost control: hard $5/month AI cap

- Every Anthropic call goes through one server helper. Before the call, it checks this month's `SUM(ai_usage.cost_usd)` against the cap. After the call, it records the actual tokens and cost.
- **When the cap is reached:** all AI features pause until the 1st of next month. Saving, readable copies, image compression, embeddings (free), browsing, and plain search keep working. New items get `ai_status = queued_budget` and are tagged automatically when the month rolls over.
- A banner says this plainly: "AI tagging is paused until Dec 1 (monthly $5 limit reached). Saving still works."
- The Settings page shows a meter for this month's spend versus the cap.
- **Backstop:** also set a monthly spend limit in the Anthropic Console. Put this in the setup checklist for Daniel.
- Make AI calls cheap: use Haiku, short prompts, and capped output lengths. Tag and describe an item in a single call where possible, and batch items during imports.

## 8. Design (decided in the design round)

- **Style:** clean modern tool (in the spirit of Linear or Notion). Crisp and efficient.
- **Color:** a white and light-gray base, with **warm terracotta** as the single accent (primary buttons, selected states, mood chips, focus rings). Define it as a semantic color token in Tailwind config (`accent`, `accent-hover`, `accent-muted`) and never as raw hex in components. Check that accent text and buttons meet 4.5:1 contrast. Use a darker terracotta for text-on-white if needed.
- **Theme:** **light mode only** for now. Keep colors as tokens so dark mode can be added later.
- **Type:** **all sans-serif**, one family (Inter or similar via `font-display: swap`). Body text 16px minimum, line-height about 1.5. Readable article copies use the same family at a comfortable width (about 65 to 75 characters per line).
- **Main screen:** a **visual masonry grid** of **minimal cards**. Image items show the image. Text items (articles, quotes) show the title or quote text on a plain card, and books, films, and music show the cover. Moods, source, and note appear **on hover on desktop**. On the phone they appear when the card is tapped open (there's no hover).
- **Navigation:**
  - Desktop: a **left sidebar** with search pinned at the top, then Home, Boxes (listed), Imports, and Settings.
  - Phone: a **bottom bar** with Home, Search, Boxes, and Add (4 items, icon plus label).
- **Item view:** clicking a card opens a **side panel** from the right on desktop, with the grid still visible behind it. The panel shows the image or summary, note (editable inline), moods, Boxes (add or remove), source link, copy status, and "Retry now" when relevant. Arrow keys move to the next or previous item. An **"Expand" button** turns it into a full reading page for the readable copy. On the phone the item opens full screen, and Back returns you to the same scroll position in the grid.
- **Icons:** one SVG icon set (Lucide). No emoji as icons.
- **Basics:** touch targets of at least 44 px, visible focus states, alt text that uses the AI image description, empty states with a clear next action, skeleton loading on the grid, a "Saved" toast with Undo, a confirmation before deleting, and `prefers-reduced-motion` respected.
- **Copy rule:** no em dashes anywhere in interface text. Use commas, parentheses, or separate sentences.

## 9. Phase 1 milestones (build in order; verify each before moving on)

1. **Skeleton:** repo, Vite/React/Tailwind, Netlify deploy, Supabase `me` schema plus RLS, magic-link login for the one allowed email, the empty grid, and the design tokens.
   - *Done when:* Daniel can log in at the netlify.app address and sees an empty state.
2. **Manual add + item view:** add a URL, image, quote, or book/film/music by hand. Background fetch of the readable copy plus the retry job. Image compression. The side panel and full-page reader. Boxes (create, add, remove, many-to-many).
   - *Done when:* each type can be saved, opened, given a note, and put into two Boxes, and a paywalled URL ends up flagged "no copy" after the retries.
3. **AI moods + search:** the tag-and-describe pipeline, embeddings, the `ai_usage` table plus the cap helper and banner, hybrid search with filters, and the short answer.
   - *Done when:* items get moods automatically, "something quiet" style searches return sensible results, and setting the cap to $0.01 pauses AI cleanly while saving still works.
4. **Chrome extension:** save the page, an image, or a quote. The note/Box popup. Token auth.
   - *Done when:* all three save actions work from a normal site and show up in ME within seconds.
5. **Phone + email saving:** the PWA manifest with `share_target`, the install prompt, the `/api/ingest` endpoint, and a Make.com setup guide.
   - *Done when:* sharing a link and a photo from the Galaxy's share sheet works, and an email with a link lands as an item.
6. **Imports:** Beehiiv, bookmarks.html, Goodreads CSV, and Kindle, using the shared parse, check, review, and commit flow, with budget-aware background tagging.
   - *Done when:* each import shows a review screen and makes no AI calls before Commit.
7. **Backup:** the `/api/export` zip, the export-format doc, and a Make.com weekly-to-Drive guide.
   - *Done when:* a backup file appears in Drive and can be opened.

After each milestone, update `STATUS.md` (what's done, what's next, any setup steps waiting on Daniel).

## 10. Later phases (high-level, for architecture only)

- **Phase 2: chat with the twin (private).**
  - The twin speaks **as Daniel, in first person**.
  - Each answer **always shows its sources**, meaning links to the essays, saves, and notes it drew on. It uses retrieval over the same embeddings, and Porcupine essays are weighted heavily for voice.
  - On topics with no evidence it **guesses but says so plainly** ("I haven't written about this, but given what I keep, I'd probably...").
  - There's an **editable profile** (values, tastes, opinions, voice notes) that Daniel can review, edit, and delete lines from.
  - **Chat corrections:** Daniel can mark an answer wrong and say what he'd actually say, and those corrections feed back into the profile.
  - Chat uses the same $5 cap (which may need raising then).
- **Phase 3: interviews.** One question a day, shown on the home screen (and maybe by email). Answer in a few sentences or skip. Answers feed the profile.
- **Later:**
  - Sharing with audiences (public, friends, family; how access works is still undecided)
  - Everything **private by default** until marked shareable
  - Voice (text first, voice layered on later)
  - A full "take your twin with you" export
  - Multi-user sign-up, and possibly selling ME as a product
  - Moving to a dedicated Supabase project and a real domain if it grows

## 11. Out of scope for Phase 1

- Own notes and videos as item types
- Social or explore features
- Outside recommendations in search
- Dark mode
- Sharing
- Twin chat
- Interviews
- Payments
- Native mobile apps
- Any other browser besides Chrome

## 12. Setup steps that need Daniel (collect these in STATUS.md as they come up)

- Supabase: confirm which shared project to use, add `me` to the exposed schemas, provide keys.
- Anthropic API key, plus setting a monthly spend limit in the Anthropic Console.
- A Beehiiv API key and publication ID.
- A TMDB API key (free).
- Netlify site creation and connecting it to the GitHub repo.
- Building the Make.com scenarios (email ingest, weekly backup) by following the guides Claude Code writes.
- Installing the unpacked Chrome extension, and installing the PWA on the Galaxy.
