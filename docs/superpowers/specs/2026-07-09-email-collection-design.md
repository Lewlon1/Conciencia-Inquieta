# Spec — Direct email collection (defer MailerLite)

Date: 2026-07-09
Status: Approved (design), pending implementation plan

## Motivation

The MVP's goal is to turn visitors into subscribers. The subscribe form currently
hands emails straight to **MailerLite** (`app/api/suscribir/route.ts`), which
sends the double-opt-in email. Marie has **never used MailerLite**, so for now we
want to **collect email addresses ourselves** — store them where Marie can see and
export them — and defer the MailerLite move until she's ready.

This mirrors the existing "land it in Supabase, read it from a lightweight admin
view" pattern already used for `contact_messages` (0005) and `service_bookings`
(0009). No new architecture, no new secrets.

## Decisions (from brainstorming)

- **MailerLite kept dormant, not deleted.** The active path writes to Supabase.
  The MailerLite call stays in the codebase behind a new Lewis-only flag
  (`config/flags.ts` → `mailerliteSync: false`) so re-enabling later is flag + env,
  not code archaeology. (Chosen over "remove entirely" and "dual-write now.")
- **Marie's access = admin page + CSV export.** A new `/admin/suscriptores` list
  (like `/admin/reservas`) plus an "Exportar CSV" button — the CSV is the file she
  imports into MailerLite later. (Chosen over CSV-only and list-only.)
- **Opt-in is deferred, not lost.** [Likely] under RGPD, submitting an email into a
  clearly-labelled newsletter box is valid consent, provided the notice is clear and
  recorded. No confirmation email is sent now; when the list is later imported into
  MailerLite, MailerLite's double opt-in fires at that point.

## Scope / units

### 1. Migration — `supabase/migrations/0011_subscribers.sql`
Applied **by hand** in the CI Supabase SQL editor (`lfyerbxqfwjjftcpjzbv`), same as
0008–0010 (the MCP-in-this-env standing blocker). Mirrors the `service_bookings`
RLS + grants shape (PII-locked).

```sql
CREATE TABLE subscribers (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email      text UNIQUE NOT NULL,   -- lowercased+trimmed before insert → natural dedup
  source     text,                   -- 'unete' | 'home' | 'articulo' | 'sobre-nosotras'
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public: submit subscription"
  ON subscribers FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin: full access to subscribers"
  ON subscribers FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- PII: 0007's ALTER DEFAULT PRIVILEGES auto-grants anon SELECT on future tables —
-- REVOKE it (an email list must not be anon-readable), matching service_bookings.
REVOKE SELECT ON public.subscribers FROM anon;
GRANT INSERT ON public.subscribers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscribers TO authenticated;

NOTIFY pgrst, 'reload schema';
```
No storage bucket. No `is_active` column (YAGNI — to unsubscribe someone, Marie
deletes the row).

### 2. Flag — `config/flags.ts`
Add:
```ts
/** Forward new signups to MailerLite in addition to storing them. OFF until Marie moves to MailerLite. */
mailerliteSync: false,
```

### 3. Route — `app/api/suscribir/route.ts`
- Keep `EMAIL_RE` validation → invalid email returns `ok=0`.
- **Active path:** `email = String(form.get("email")).trim().toLowerCase()`, `source`
  from the hidden field. Insert via `getPublicSupabase().from("subscribers").insert({ email, source })`
  (same client + pattern as `app/api/contacto/route.ts`).
- **Duplicate handling:** a unique-violation (Postgres code `23505`) is treated as
  **success (`ok=1`)** — idempotent, and does not leak "already subscribed." Any
  other insert error → `console.error` + `ok=0`.
- **MailerLite dormant helper:** the existing `fetch` to
  `https://connect.mailerlite.com/api/subscribers` is kept as a helper that runs
  **only when** `FLAGS.mailerliteSync && MAILERLITE_API_KEY && MAILERLITE_GROUP_ID`.
  With the flag off it never runs; a MailerLite failure must never fail the DB write
  (it's best-effort forwarding, logged only).
- Redirect target unchanged: `303 → /unete?ok=1|0&source=…` (the cross-page-redirect
  quirk is explicitly out of scope, see below).

### 4. Success copy — `components/public/SubscribeForm.tsx` + `app/(public)/unete/page.tsx`
- `SubscribeForm` `ok=1` block: replace "Revisa tu correo / doble opt-in" wording with
  a simple confirmation, e.g. heading "¡Ya estás en la lista!" / body "Gracias por
  suscribirte. Te escribiremos pronto." The `window.ciTrack?.("signup", …)` event
  stays.
- `/unete` page: rewrite the "Doble confirmación" info note — no confirmation email is
  sent now. State plainly that leaving the email adds them to the list.
- The `legal` micro-copy ("Un email a la semana… Nunca compartimos tu dirección.")
  stays accurate and unchanged.

### 5. Admin — `app/(admin)/admin/suscriptores/page.tsx` + `components/admin/SubscribersTable.tsx`
- Server page mirrors `app/(admin)/admin/messages/page.tsx`: `createClient()` (cookie
  SSR admin client) → `.from("subscribers").select("*").order("created_at",{ascending:false}).returns<Subscriber[]>()`
  → `<AdminPageHeader>` + card + `<SubscribersTable initialSubscribers={…}>`.
- `SubscribersTable` (client): renders each row as `email · source · date`
  (`formatDate` es-ES like `MessagesTable`), a total count, and an **"Exportar CSV"**
  button. Empty state via `t.subscribers.empty`.
- **CSV export:** built client-side from the loaded rows — columns `email,source,created_at`,
  values quoted/escaped (double-quotes doubled) for safety, `Blob` + object-URL download,
  filename `suscriptores-YYYY-MM-DD.csv` (current date via `new Date()` in the browser).
  No new API endpoint.
  - Tradeoff noted: exports the currently-loaded set. The page loads all rows (no
    pagination in MVP); if pagination is added later, export should move to a server
    route that queries the full table.

### 6. Wiring — nav, dashboard, types, strings
- `components/admin/AdminNav.tsx`: add `{ label: t.nav.subscribers, href: "/admin/suscriptores" }`
  (place after `messages`).
- `app/(admin)/admin/page.tsx`: add a "Suscriptores" count card, mirroring the existing
  services / unread-bookings counts (`select("*", { count: "exact", head: true })`).
- `types/index.ts`: `export interface Subscriber { id: string; email: string; source: string | null; created_at: string; }`.
- `lib/admin/strings.ts`: add `nav.subscribers: "Suscriptores"`, a `subscribers` block
  (`title`, `subtitle`, `empty`, `exportCsv`, `count`), and a `dashboard.subscribers`
  label for the count card.

### 7. Privacy — `app/(public)/privacidad/page.tsx`
Rewrite the "Boletín por email" section to match reality while dormant: email is
stored directly by Conciencia Inquieta (no third-party processor yet), **no
confirmation email is sent**, data retained until the person asks to be removed,
unsubscribe by contacting via `/contacto`. Legal basis stays *consentimiento*. Soften
/ remove the MailerLite line in the processors list until it is actually re-enabled
(restore it when `mailerliteSync` is turned on).

## Data flow

```
Visitor → SubscribeForm (native POST) → /api/suscribir
  → validate email → insert into subscribers (anon + RLS; 23505 == ok)
  → [dormant] forward to MailerLite only if flag+env
  → 303 /unete?ok=1 → "¡Ya estás en la lista!" + signup analytics event

Marie → /admin/suscriptores → view list + count → "Exportar CSV"
  → (later) import CSV into MailerLite → MailerLite double opt-in fires then
```

## Error handling

| Case | Result |
|---|---|
| Invalid email | `ok=0`, inline "no pudimos procesar" error (existing) |
| Duplicate email (`23505`) | `ok=1` (idempotent, no leak) |
| Other DB insert error | `console.error` + `ok=0` |
| MailerLite forward fails (when enabled) | logged only; DB write still succeeds → `ok=1` |
| Env vars missing at request time | DB insert throws → caught → `ok=0` + log |

## Testing / verification

- `npx tsc --noEmit` clean; `next build` compiles (route stays `ƒ` dynamic, `/admin/suscriptores`
  is `ƒ` dynamic, public pages stay static — verify the route table).
- CSV escaping is pure and unit-testable (email/source with a comma or quote).
- **Live DB can't be exercised in this env** (standing Supabase-MCP blocker) — follow the
  established fixture-backed build check used for services, then **Lewis manual smoke test**:
  apply `0011`, submit an email on `/unete` → confirm "¡Ya estás en la lista!" → confirm the
  row appears in `/admin/suscriptores` with correct source → click "Exportar CSV" and confirm
  the file opens with the right columns → resubmit the same email → confirm still `ok=1` and no
  duplicate row.

## Out of scope (noted, not built)

- **Cross-page redirect fix** — subscribing from the home page / an article still redirects to
  `/unete` to show the confirmation. Deliberately unchanged here; separate task if wanted.
- **Unsubscribe column / self-serve unsubscribe** — Marie deletes a row; no email plumbing.
- **Dual-write to MailerLite now** — rejected; that needs MailerLite set up, the thing we're deferring.
- **Pagination on the admin list** — load-all is fine at MVP volume.

## Blockers / dependencies

- Apply `0011_subscribers.sql` by hand (`lfyerbxqfwjjftcpjzbv`) before the feature functions —
  same manual-apply pattern as 0008–0010.
- Reconnect the Supabase MCP to the CI project (long-standing, flagged again) to make future
  DB verification possible in-session.
