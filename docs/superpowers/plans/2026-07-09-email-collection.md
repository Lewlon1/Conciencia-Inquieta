# Direct Email Collection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Collect newsletter signups directly into Supabase (viewable + CSV-exportable in the admin) and keep MailerLite dormant behind a flag until Marie is ready to move to it.

**Architecture:** A new PII-locked `subscribers` table mirrors the existing `contact_messages`/`service_bookings` capture pattern (public INSERT via anon key + RLS, admin-only SELECT). The `/api/suscribir` route writes to it and treats duplicate emails as success; MailerLite forwarding is kept in-file behind `FLAGS.mailerliteSync` (off). Marie reads/exports the list from a new `/admin/suscriptores` page.

**Tech Stack:** Next.js 14 App Router, TypeScript, Supabase (`@supabase/supabase-js`), Tailwind (admin only).

---

## Verification model (read first)

This repo has **no unit-test runner** (no vitest/jest — confirmed in `package.json`). Its established verification pattern (see `lessons.md`) is:
- `npx tsc --noEmit` — type safety
- `npm run build` — route table + compile validity
- `npm run lint` — lint
- **Manual smoke test by Lewis** for anything touching the live DB — the Supabase MCP in the dev env resolves to the wrong project (long-standing blocker), so live-DB behavior cannot be exercised in-session.

The one pure, branching unit (CSV escaping) gets a real executable check via `npx tsx` (temporary script, deleted after — no permanent dependency added). Everything else follows the model above.

**All commits** end with the trailer:
`Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`

**Migration note:** `0011` is applied **by hand** in the CI Supabase SQL editor (`lfyerbxqfwjjftcpjzbv`), exactly like `0008`–`0010`. Because no *public/build-time* code reads `subscribers` (only dynamic admin routes + the dynamic `/api/suscribir` route do), `npm run build` stays green **before** the migration is applied — the feature simply returns empty lists / a 0 count until `0011` runs.

---

## File Structure

**Create:**
- `supabase/migrations/0011_subscribers.sql` — the table, RLS, grants
- `lib/csv.ts` — pure CSV serializer for admin exports
- `components/admin/SubscribersTable.tsx` — client list + CSV export button
- `app/(admin)/admin/suscriptores/page.tsx` — admin server page

**Modify:**
- `types/index.ts` — add `Subscriber`
- `config/flags.ts` — add `mailerliteSync`
- `app/api/suscribir/route.ts` — DB insert + dormant MailerLite
- `lib/admin/strings.ts` — nav/dashboard/subscribers copy
- `components/admin/AdminNav.tsx` — nav link
- `app/(admin)/admin/page.tsx` — dashboard count
- `components/public/SubscribeForm.tsx` — success copy
- `app/(public)/unete/page.tsx` — info note copy
- `app/(public)/privacidad/page.tsx` — privacy copy
- `lessons.md` — session log (final task)

---

### Task 1: Backend contract — migration, type, flag

**Files:**
- Create: `supabase/migrations/0011_subscribers.sql`
- Modify: `types/index.ts` (append after `ServiceBooking`)
- Modify: `config/flags.ts` (add to `FLAGS`)

- [ ] **Step 1: Create the migration**

Create `supabase/migrations/0011_subscribers.sql`:

```sql
-- ============================================
-- Conciencia Inquieta — Newsletter signups collected directly
--
-- Marie has not used MailerLite yet, so for now signups land in Supabase and
-- she views/exports them from /admin/suscriptores. Same "land it in the DB,
-- read from a lightweight admin view" shape as contact_messages (0005) and
-- service_bookings (0009). MailerLite stays dormant behind FLAGS.mailerliteSync
-- (CLAUDE.md golden rules: CI's own audience, never co-mingled).
--
-- Applied BY HAND in the Supabase SQL editor for project ref lfyerbxqfwjjftcpjzbv
-- (same standing MCP blocker as every prior migration). Run once, after 0001-0010.
-- ============================================

CREATE TABLE subscribers (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email      text UNIQUE NOT NULL,   -- lowercased+trimmed before insert => natural dedup
  source     text,                   -- where they signed up: 'unete' | 'home' | 'articulo' | 'sobre-nosotras'
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- Public (anon, from /api/suscribir) may submit, not read.
CREATE POLICY "Public: submit subscription"
  ON subscribers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin: full access to subscribers"
  ON subscribers FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- PII: an email list must NOT be anon-readable. 0007's ALTER DEFAULT PRIVILEGES
-- auto-grants anon SELECT on future tables, so REVOKE it here (matches service_bookings).
REVOKE SELECT ON public.subscribers FROM anon;
GRANT INSERT ON public.subscribers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscribers TO authenticated;

-- Nudge PostgREST to reload its schema cache (harmless if already current).
NOTIFY pgrst, 'reload schema';
```

- [ ] **Step 2: Add the `Subscriber` type**

In `types/index.ts`, append after the `ServiceBooking` interface (end of file):

```ts
/** A newsletter signup captured from the public site. Stored directly (MailerLite deferred). */
export interface Subscriber {
  id: string;
  email: string;
  source: string | null;
  created_at: string;
}
```

- [ ] **Step 3: Add the dormant-MailerLite flag**

In `config/flags.ts`, add inside the `FLAGS` object (after `contentGenerationTools: false,`):

```ts
  /**
   * Forward new newsletter signups to MailerLite in addition to storing them in
   * Supabase. OFF for now — Marie collects addresses directly and exports them
   * from /admin/suscriptores. Flip to true + set MAILERLITE_* env to re-enable.
   */
  mailerliteSync: false,
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0011_subscribers.sql types/index.ts config/flags.ts
git commit -m "feat(subscribers): add subscribers table, Subscriber type, mailerliteSync flag" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Route — write to DB, keep MailerLite dormant

**Files:**
- Modify: `app/api/suscribir/route.ts` (full rewrite)

- [ ] **Step 1: Rewrite the route**

Replace the entire contents of `app/api/suscribir/route.ts` with:

```ts
import { NextResponse, type NextRequest } from "next/server";
import { getPublicSupabase } from "@/lib/supabase/public";
import { FLAGS } from "@/config/flags";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Newsletter signups land in Supabase (subscribers), read/exported from
// /admin/suscriptores. MailerLite is DORMANT: kept here behind FLAGS.mailerliteSync
// so re-enabling later is flag + env, not code archaeology (CLAUDE.md golden rules:
// CI's own audience, never co-mingled). MAILERLITE_* stay server-only (unprefixed).
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const email = String(form.get("email") || "").trim().toLowerCase();
  const source = String(form.get("source") || "unknown").trim();

  const back = (ok: "0" | "1") =>
    NextResponse.redirect(
      new URL(`/unete?ok=${ok}&source=${encodeURIComponent(source)}`, request.url),
      303
    );

  if (!EMAIL_RE.test(email)) return back("0");

  const { error } = await getPublicSupabase()
    .from("subscribers")
    .insert({ email, source });

  // 23505 = unique_violation: already subscribed. Idempotent success, don't leak it.
  if (error && error.code !== "23505") {
    console.error("Subscriber insert failed", error);
    return back("0");
  }

  // Dormant MailerLite forward — only runs once Marie moves to MailerLite.
  if (FLAGS.mailerliteSync) {
    await forwardToMailerLite(email);
  }

  return back("1");
}

// Kept but inert until FLAGS.mailerliteSync is on and MAILERLITE_* are set.
// Best-effort: a failure here must never fail the signup (the DB write already succeeded).
async function forwardToMailerLite(email: string) {
  const apiKey = process.env.MAILERLITE_API_KEY;
  const groupId = process.env.MAILERLITE_GROUP_ID;
  if (!apiKey || !groupId) {
    console.error("mailerliteSync ON but MAILERLITE_API_KEY / MAILERLITE_GROUP_ID not set");
    return;
  }
  try {
    const res = await fetch("https://connect.mailerlite.com/api/subscribers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ email, groups: [groupId] }),
    });
    if (!res.ok) {
      console.error("MailerLite forward failed", res.status, await res.text());
    }
  } catch (err) {
    console.error("MailerLite forward error", err);
  }
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Build and confirm the route stays dynamic**

Run: `npm run build`
Expected: build succeeds; in the route table `/api/suscribir` is marked `ƒ` (Dynamic). Public pages remain `○`/`●` (static/SSG).

- [ ] **Step 4: Commit**

```bash
git add app/api/suscribir/route.ts
git commit -m "feat(subscribers): route signups to Supabase, keep MailerLite dormant behind flag" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: CSV serializer (pure)

**Files:**
- Create: `lib/csv.ts`
- Temp check: `scripts/_check-csv.mts` (created then deleted)

- [ ] **Step 1: Write the failing check**

Create `scripts/_check-csv.mts`:

```ts
import { toCsv } from "../lib/csv";
import assert from "node:assert/strict";

// Commas, quotes, and null must not break columns.
const csv = toCsv(
  [
    { email: "a@b.com", source: "unete" },
    { email: 'weird","x@y.com', source: null as unknown as string },
  ],
  ["email", "source"]
);

assert.equal(
  csv,
  '"email","source"\r\n"a@b.com","unete"\r\n"weird"",""x@y.com",""'
);
console.log("CSV check passed");
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx tsx scripts/_check-csv.mts`
Expected: FAIL — `Cannot find module '../lib/csv'` (file doesn't exist yet).

- [ ] **Step 3: Implement the serializer**

Create `lib/csv.ts`:

```ts
// Minimal CSV serializer for admin exports. Pure + dependency-free.
// Escapes per RFC 4180: wrap every field in double-quotes and double any embedded
// double-quote, so commas / quotes / newlines in values can't break the columns.

function escapeField(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

/**
 * Serialize rows to a CSV string. `headers` are the column keys (and the header row);
 * each row is looked up by those keys. null / undefined become empty strings.
 */
export function toCsv<T extends Record<string, unknown>>(
  rows: T[],
  headers: (keyof T & string)[]
): string {
  const headerLine = headers.map(escapeField).join(",");
  const dataLines = rows.map((row) =>
    headers
      .map((h) => escapeField(row[h] == null ? "" : String(row[h])))
      .join(",")
  );
  return [headerLine, ...dataLines].join("\r\n");
}
```

- [ ] **Step 4: Run the check to verify it passes**

Run: `npx tsx scripts/_check-csv.mts`
Expected: prints `CSV check passed`.

- [ ] **Step 5: Delete the temp check and typecheck**

Run: `rm scripts/_check-csv.mts && npx tsc --noEmit`
Expected: file removed; no type errors. (If `scripts/` is now empty, leave it — git ignores empty dirs.)

- [ ] **Step 6: Commit**

```bash
git add lib/csv.ts
git commit -m "feat(subscribers): add pure CSV serializer for admin exports" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Admin strings + SubscribersTable

**Files:**
- Modify: `lib/admin/strings.ts` (three insertions)
- Create: `components/admin/SubscribersTable.tsx`

- [ ] **Step 1: Add the nav string**

In `lib/admin/strings.ts`, in the `nav:` block, replace:

```ts
    services: "Servicios",
    toggleNavigation: "Alternar navegación",
```

with:

```ts
    services: "Servicios",
    subscribers: "Suscriptores",
    toggleNavigation: "Alternar navegación",
```

- [ ] **Step 2: Add the dashboard count label**

In `lib/admin/strings.ts`, in the `dashboard:` block, replace:

```ts
    services: "Servicios",
    subtitle: "Administración de la revista digital — artículos, categorías y autoras",
```

with:

```ts
    services: "Servicios",
    subscribers: "Suscriptores",
    subtitle: "Administración de la revista digital — artículos, categorías y autoras",
```

- [ ] **Step 3: Add the subscribers strings block**

In `lib/admin/strings.ts`, replace the `messages:` block:

```ts
  messages: {
    empty: "Aún no hay mensajes.",
    subtitle: "Mensajes del formulario de contacto del sitio público",
    title: "Mensajes",
  },
```

with (append a new `subscribers` block right after it):

```ts
  messages: {
    empty: "Aún no hay mensajes.",
    subtitle: "Mensajes del formulario de contacto del sitio público",
    title: "Mensajes",
  },

  subscribers: {
    count: "suscriptores",
    empty: "Aún no hay suscriptores.",
    exportCsv: "Exportar CSV",
    subtitle: "Personas suscritas al boletín desde el sitio público",
    title: "Suscriptores",
  },
```

- [ ] **Step 4: Create the table component**

Create `components/admin/SubscribersTable.tsx`:

```tsx
"use client";

import { t } from "@/lib/admin/strings";
import { toCsv } from "@/lib/csv";
import type { Subscriber } from "@/types";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SubscribersTable({
  initialSubscribers,
}: {
  initialSubscribers: Subscriber[];
}) {
  const subscribers = initialSubscribers;

  function exportCsv() {
    const csv = toCsv(
      subscribers.map((s) => ({
        email: s.email,
        source: s.source ?? "",
        created_at: s.created_at,
      })),
      ["email", "source", "created_at"]
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const today = new Date().toISOString().slice(0, 10);
    const a = document.createElement("a");
    a.href = url;
    a.download = `suscriptores-${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (subscribers.length === 0) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="text-sm text-[#b8b0a4]">{t.subscribers.empty}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#f0ede8]">
        <span className="text-sm text-[#6b6560]">
          {subscribers.length} {t.subscribers.count}
        </span>
        <button
          onClick={exportCsv}
          className="text-sm px-3 py-1.5 rounded-lg bg-[#1a1a18] text-white hover:bg-[#333] transition-colors"
        >
          {t.subscribers.exportCsv}
        </button>
      </div>
      <div className="divide-y divide-[#f0ede8]">
        {subscribers.map((s) => (
          <div
            key={s.id}
            className="px-6 py-3 flex items-center justify-between flex-wrap gap-2"
          >
            <div>
              <span className="text-sm font-medium text-[#1a1a18]">
                {s.email}
              </span>
              {s.source && (
                <span className="text-xs ml-2 px-2 py-0.5 rounded-full bg-[#f5f3ef] text-[#6b6560]">
                  {s.source}
                </span>
              )}
            </div>
            <span className="text-xs text-[#b8b0a4]">
              {formatDate(s.created_at)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add lib/admin/strings.ts components/admin/SubscribersTable.tsx
git commit -m "feat(subscribers): admin strings + SubscribersTable with CSV export" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Admin page + nav link

**Files:**
- Create: `app/(admin)/admin/suscriptores/page.tsx`
- Modify: `components/admin/AdminNav.tsx`

- [ ] **Step 1: Create the admin page**

Create `app/(admin)/admin/suscriptores/page.tsx`:

```tsx
import { createClient } from "@/lib/supabase/server";
import { t } from "@/lib/admin/strings";
import type { Subscriber } from "@/types";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import SubscribersTable from "@/components/admin/SubscribersTable";

export default async function AdminSubscribersPage() {
  const supabase = await createClient();

  const { data: subscribers } = await supabase
    .from("subscribers")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<Subscriber[]>();

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title={t.subscribers.title}
        description={t.subscribers.subtitle}
      />
      <div className="bg-white border border-[#e8e5df] rounded-xl overflow-hidden">
        <SubscribersTable initialSubscribers={subscribers ?? []} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add the nav link**

In `components/admin/AdminNav.tsx`, in the `navLinks` array, replace:

```ts
  { label: t.nav.messages, href: "/admin/messages" },
```

with:

```ts
  { label: t.nav.messages, href: "/admin/messages" },
  { label: t.nav.subscribers, href: "/admin/suscriptores" },
```

- [ ] **Step 3: Typecheck + build**

Run: `npx tsc --noEmit && npm run build`
Expected: no type errors; build succeeds; `/admin/suscriptores` appears in the route table as `ƒ` (Dynamic). Build stays green even though `subscribers` isn't migrated yet (admin routes are dynamic and ignore query errors → empty list).

- [ ] **Step 4: Commit**

```bash
git add "app/(admin)/admin/suscriptores/page.tsx" components/admin/AdminNav.tsx
git commit -m "feat(subscribers): /admin/suscriptores page + nav link" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: Dashboard count

**Files:**
- Modify: `app/(admin)/admin/page.tsx` (two edits)

- [ ] **Step 1: Add the count query**

In `app/(admin)/admin/page.tsx`, replace the destructuring + `Promise.all` block:

```ts
  const [
    { count: totalArticles },
    { count: publishedArticles },
    { count: totalServices },
    { count: unreadBookings },
    { data: recentArticles },
  ] = await Promise.all([
    supabase.from("articles").select("*", { count: "exact", head: true }),
    supabase
      .from("articles")
      .select("*", { count: "exact", head: true })
      .eq("is_published", true),
    supabase.from("services").select("*", { count: "exact", head: true }),
    supabase
      .from("service_bookings")
      .select("*", { count: "exact", head: true })
      .eq("is_read", false),
    supabase
      .from("articles")
      .select("*, category:categories(*), author:authors(*)")
      .order("created_at", { ascending: false })
      .limit(5)
      .returns<ArticleWithRelations[]>(),
  ]);
```

with:

```ts
  const [
    { count: totalArticles },
    { count: publishedArticles },
    { count: totalServices },
    { count: unreadBookings },
    { count: totalSubscribers },
    { data: recentArticles },
  ] = await Promise.all([
    supabase.from("articles").select("*", { count: "exact", head: true }),
    supabase
      .from("articles")
      .select("*", { count: "exact", head: true })
      .eq("is_published", true),
    supabase.from("services").select("*", { count: "exact", head: true }),
    supabase
      .from("service_bookings")
      .select("*", { count: "exact", head: true })
      .eq("is_read", false),
    supabase.from("subscribers").select("*", { count: "exact", head: true }),
    supabase
      .from("articles")
      .select("*, category:categories(*), author:authors(*)")
      .order("created_at", { ascending: false })
      .limit(5)
      .returns<ArticleWithRelations[]>(),
  ]);
```

- [ ] **Step 2: Add the metric card**

In the same file, replace the `metrics` array:

```ts
  const metrics = [
    { label: t.dashboard.totalArticles, value: totalArticles ?? 0 },
    { label: t.dashboard.published, value: publishedArticles ?? 0 },
    { label: t.dashboard.services, value: totalServices ?? 0 },
    { label: t.dashboard.pendingBookings, value: unreadBookings ?? 0 },
  ];
```

with:

```ts
  const metrics = [
    { label: t.dashboard.totalArticles, value: totalArticles ?? 0 },
    { label: t.dashboard.published, value: publishedArticles ?? 0 },
    { label: t.dashboard.services, value: totalServices ?? 0 },
    { label: t.dashboard.pendingBookings, value: unreadBookings ?? 0 },
    { label: t.dashboard.subscribers, value: totalSubscribers ?? 0 },
  ];
```

- [ ] **Step 3: Typecheck + build**

Run: `npx tsc --noEmit && npm run build`
Expected: no errors; build succeeds. (The dashboard is a dynamic admin route; a missing `subscribers` table yields count `0`, not a crash.)

- [ ] **Step 4: Commit**

```bash
git add "app/(admin)/admin/page.tsx"
git commit -m "feat(subscribers): show subscriber count on admin dashboard" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 7: Public copy — success + opt-in note

**Files:**
- Modify: `components/public/SubscribeForm.tsx`
- Modify: `app/(public)/unete/page.tsx`

- [ ] **Step 1: Update the success state**

In `components/public/SubscribeForm.tsx`, replace:

```tsx
        <div className="success">
          <div className="tick">✓</div>
          <h3>Revisa tu correo</h3>
          <p>
            Te hemos enviado un email para confirmar tu suscripción (doble
            opt-in). Sin confirmar, no recibirás nada.
          </p>
        </div>
```

with:

```tsx
        <div className="success">
          <div className="tick">✓</div>
          <h3>¡Ya estás en la lista!</h3>
          <p>
            Gracias por suscribirte. Te escribiremos pronto con lo nuevo de
            Conciencia Inquieta.
          </p>
        </div>
```

- [ ] **Step 2: Update the /unete info note**

In `app/(public)/unete/page.tsx`, replace:

```tsx
          <div>
            <b>Doble confirmación:</b> tras dejar tu email recibirás un mensaje
            para confirmar. Así nos aseguramos de que de verdad quieres estar
            aquí — y de que tu bandeja de entrada no se llena de nada que no hayas
            pedido.
          </div>
```

with:

```tsx
          <div>
            <b>Sin spam:</b> dejando tu email te sumas a la lista de Conciencia
            Inquieta. Un correo a la semana como mucho, y puedes darte de baja
            cuando quieras escribiéndonos.
          </div>
```

- [ ] **Step 3: Typecheck + build**

Run: `npx tsc --noEmit && npm run build`
Expected: no errors; `/unete`, `/`, `/articulos/[slug]`, `/sobre-nosotras` (all users of `SubscribeForm`) still build static/SSG.

- [ ] **Step 4: Commit**

```bash
git add components/public/SubscribeForm.tsx "app/(public)/unete/page.tsx"
git commit -m "feat(subscribers): reword signup success + opt-in note (no confirmation email)" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 8: Privacy copy

**Files:**
- Modify: `app/(public)/privacidad/page.tsx` (three edits)

- [ ] **Step 1: Rewrite the newsletter paragraph**

In `app/(public)/privacidad/page.tsx`, replace:

```tsx
          <p>
            <b>Boletín por email.</b> Si te suscribes en{" "}
            <Link href="/unete">Únete</Link> o en cualquier formulario del sitio,
            tu email se envía a MailerLite (proveedor de email marketing) para
            gestionar el envío del boletín, con doble confirmación (double
            opt-in): no recibirás nada hasta que confirmes desde tu propia bandeja
            de entrada.
          </p>
```

with:

```tsx
          <p>
            <b>Boletín por email.</b> Si te suscribes en{" "}
            <Link href="/unete">Únete</Link> o en cualquier formulario del sitio,
            guardamos tu email en nuestra base de datos (Supabase) para enviarte
            el boletín. Por ahora no usamos ningún proveedor externo de email
            marketing y no se envía un correo de confirmación automático. Puedes
            pedir la baja cuando quieras (ver «Tus derechos»).
          </p>
```

- [ ] **Step 2: Drop the MailerLite processor line**

In the same file, replace:

```tsx
            <li>
              <b>MailerLite</b> — gestión del boletín de email
            </li>
            <li>
              <b>Supabase</b> — base de datos del sitio (contenido editorial y
              mensajes de contacto)
            </li>
```

with:

```tsx
            <li>
              <b>Supabase</b> — base de datos del sitio (contenido editorial,
              mensajes de contacto y suscripciones al boletín)
            </li>
```

- [ ] **Step 3: Fix the unsubscribe instruction**

In the same file, replace:

```tsx
            de baja del boletín en cualquier momento desde el enlace incluido en
            cada email.
```

with:

```tsx
            de baja del boletín en cualquier momento escribiéndonos desde{" "}
            <Link href="/contacto">Contacto</Link>.
```

- [ ] **Step 4: Typecheck + build**

Run: `npx tsc --noEmit && npm run build`
Expected: no errors; `/privacidad` still builds static.

- [ ] **Step 5: Commit**

```bash
git add "app/(public)/privacidad/page.tsx"
git commit -m "docs(privacy): reflect direct email collection (MailerLite deferred)" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 9: Final verification + session log

**Files:**
- Modify: `lessons.md`

- [ ] **Step 1: Full verification sweep**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: all clean. In the route table: `/api/suscribir` and `/admin/suscriptores` are `ƒ`; public pages (`/`, `/unete`, `/articulos/[slug]`, `/sobre-nosotras`, `/privacidad`) stay `○`/`●`.

- [ ] **Step 2: Append the session log**

In `lessons.md`, append at the end:

```markdown

---

## Session 8 — 2026-07-09 — Collect emails directly (MailerLite deferred)

Marie hasn't used MailerLite, so signups now land in Supabase and she views/exports them from `/admin/suscriptores`; MailerLite is kept dormant.

### What changed
- **Migration `0011_subscribers.sql`** (NOT applied — manual, same blocker): `subscribers` (`email` UNIQUE, `source`, `created_at`). RLS mirrors `service_bookings` — public INSERT, admin full, `REVOKE SELECT … FROM anon` (email list is PII). No build-time public read of the table, so `next build` is green before it's applied (unlike the services rollout).
- **`config/flags.ts`**: added `mailerliteSync: false`. **`app/api/suscribir/route.ts`**: active path now inserts into `subscribers` (email lowercased → natural dedup; `23505` treated as success); MailerLite `fetch` kept as an inert helper that only runs when the flag is on + `MAILERLITE_*` set (best-effort, never fails the signup).
- **Admin**: `/admin/suscriptores` (`SubscribersTable`) lists email · source · date with an **Exportar CSV** button (`lib/csv.ts`, RFC-4180 escaping); nav link + dashboard "Suscriptores" count added.
- **Copy**: signup success + `/unete` note no longer promise a confirmation email; **`privacidad`** rewritten (email stored directly, no external processor/opt-in email yet, baja via Contacto), MailerLite removed from the processors list.

### Decisions
- **[Likely]** Single opt-in is lawful consent under RGPD given clear notice; double opt-in is **deferred** to the eventual MailerLite import (import the CSV → MailerLite sends its confirmation then), not lost.
- **[Certain]** No `is_active`/self-serve unsubscribe (Marie deletes a row); no dual-write now.

### Blockers — need Lewis
- Apply `0011_subscribers.sql` by hand (`lfyerbxqfwjjftcpjzbv`) — until then the admin list is empty and signups fail at runtime (build is unaffected).
- Manual smoke test: submit on `/unete` → "¡Ya estás en la lista!" → row in `/admin/suscriptores` (correct source) → Exportar CSV opens correctly → resubmit same email stays `ok=1` with no duplicate.

### Next step
- Re-enable path when Marie's ready: import the CSV into MailerLite, set `mailerliteSync: true` + `MAILERLITE_*`, restore the MailerLite line in `privacidad`.
```

- [ ] **Step 3: Commit**

```bash
git add lessons.md
git commit -m "docs(lessons): log Session 8 — direct email collection" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

- [ ] **Step 4: Hand back to Lewis for the manual smoke test**

The live-DB path can't be exercised in-session (Supabase MCP blocker). Lewis: apply `0011`, then run the smoke test from Task 9 Step 2's "Blockers" note.

---

## Self-Review (completed by plan author)

**Spec coverage:** every spec section maps to a task — migration/RLS → T1; `mailerliteSync` flag → T1/T2; route + dedup + dormant forward → T2; CSV → T3; admin strings/table/CSV → T4; admin page + nav → T5; dashboard count → T6; success + opt-in copy → T7; privacy copy → T8; verification + lessons + smoke checklist → T9. No gaps.

**Placeholder scan:** no TBD/TODO in the plan's own steps (the pre-existing `TODO` markers inside `privacidad/page.tsx` are unrelated legal placeholders left intentionally untouched). Every code step shows complete code; every command has an expected result.

**Type consistency:** `Subscriber { id, email, source: string | null, created_at }` (T1) is used identically in `SubscribersTable` (T4), the admin page's `.returns<Subscriber[]>()` (T5), and nowhere contradicted. `toCsv(rows, headers)` signature (T3) matches its single call site (T4). String keys `t.nav.subscribers`, `t.dashboard.subscribers`, `t.subscribers.{title,subtitle,empty,exportCsv,count}` are all defined in T4 before use in T4/T5.
