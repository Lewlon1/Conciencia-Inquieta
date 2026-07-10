# Conciencia Inquieta — Handover Guide

_Prepared for Marie. A tour of what the site does, how to run it day-to-day, and what's left before launch._

Last updated: 2026-07-09

---

## 1. What this is, in one line

A self-managed, Spanish-language digital magazine. The whole point of the MVP is simple: **turn visitors into subscribers** (build the email list, grow one broadcast channel) — and measure it. There are no reader accounts, no payments, and no shop. Just great articles, an email sign-up, and a way for people to reach you.

You manage everything yourself from a private admin area. Nothing you publish needs a developer.

---

## 2. What's been built — the feature list

### The public website (what readers see)
- **Home page** — the "portada", with a rotating **question ticker** banner, a carousel of the latest articles, and featured content.
- **Articles** — an articles index plus a full reading page for each piece: headline, deck/subtitle, author byline, category, tags, reading time, featured image, and a clean Markdown-formatted body.
- **9 categories** — each with its own page: Derechos humanos · Política internacional · Latinoamérica · Feminismo · Cultura · Medioambiente · Movimientos sociales · Opinión · Música y artes.
- **Servicios** — a showcase of the services you offer, each with an image gallery, an optional price line, a description, and a **booking request form** (visitors leave name / email / phone — you contact them; there is no on-site payment).
- **Sobre nosotras** and **Contacto** — an about page and a contact form.
- **Únete (subscribe)** — email sign-up with double opt-in, wired to your MailerLite list. There's also a "Suscríbete" button in the top bar.
- **Legal pages** — Privacidad, Cookies, Términos.
- **Navigation** — a single slide-out burger menu with a centered logo (El Salto-style masthead), plus a footer with section links and a secondary-channel button (WhatsApp or Telegram).
- **Built for Google** — sitemap, robots file, rich structured data (Organization + article markup), and proper social-share previews, all automatic.
- **Fast** — pages are pre-built and served from a global CDN. A newly published or edited article goes live within about a minute, with no rebuild needed.
- **Analytics + consent** — privacy-friendly analytics and Meta Pixel, gated behind a cookie-consent banner (switched on via configuration).

### Your admin area (what you use) — at `/admin`
- **Secure login** — email + password. Only you can reach it; it's hidden from search engines.
- **Dashboard** — at-a-glance counts (articles, services, unread booking requests, unread messages) and quick "create new" actions.
- **Articles** — create, edit, publish/unpublish, and delete articles. The editor covers title, subtitle/deck, body, featured image, author, category, tags, reading time, and a published toggle.
- **Image positioning tool** — after uploading a featured or cover image, drag and zoom a crop box to control exactly how it's framed, with live previews of how it'll look in each place on the site.
- **Servicios** — create and manage the services shown publicly: title, summary, description, an image gallery (first image = cover), an optional price line, and a publish toggle.
- **Reservas (booking requests)** — every booking request lands here with the person's name, email, phone, and message. Mark them read; click to email or call directly.
- **Mensajes** — contact-form submissions land here the same way.

### Behind the scenes (the plumbing)
- **Supabase** — the database, your admin login, and image storage. This magazine has its **own** Supabase project, separate from any other work.
- **MailerLite** — your email list (double opt-in). This is Conciencia Inquieta's own account — never mixed with anyone else's list.
- **Vercel** — hosting (currently on a `*.vercel.app` address; a custom domain comes later).

---

## 3. A guided tour — explore the admin in 15 minutes

Do these in order the first time. It walks you through the whole loop, from writing to seeing it live.

1. **Log in.** Go to `/admin` and sign in with your email and password.
2. **Look at the dashboard.** Note the four counts across the top and the quick-action buttons.
3. **Publish your first article.**
   - Click **Nuevo artículo** (or **Artículos → nuevo**).
   - Fill in the title, deck, and body (the body uses Markdown — `**bold**`, `## headings`, `- lists`).
   - Upload a **featured image**, then use the **positioning tool**: drag the crop box and use a corner handle to zoom until it's framed well. Watch the small preview tiles update.
   - Pick a **category** and add a few **tags**.
   - Toggle **Publicado** on and save.
   - Open the public site and confirm it appears (give it up to a minute).
4. **Add a service.** **Servicios → nuevo** → title, summary, description, upload a couple of images (the first is the cover — you can promote a different one with "hacer portada"), optionally add a price line like "Desde 50€" or "Consultar", publish. Check `/servicios` and its detail page.
5. **Test the two inboxes.**
   - Submit the **contact form** on the public site, then find it in **Mensajes**.
   - Submit a **booking request** from a service page, then find it in **Reservas**. Click the email/phone links.
6. **Test the sign-up.** Enter an email in **Únete**, then confirm it in MailerLite (you'll get the double-opt-in email — confirm it).

If any of steps 3–6 fail, it's almost certainly one of the "before launch" items in section 5, not a bug in the site.

---

## 4. What the site deliberately does **not** do (so expectations are set)

These are intentional MVP scope decisions — not missing work:
- No reader/end-user accounts, no login for visitors.
- No payments, checkout, or shop. Bookings are lead capture only — you contact the person.
- No membership tier, no on-site search, no Google Ads.

---

## 5. Next steps

- **Review all the text on the site** — read through every page and every article, and send any wording changes to Lewis.
- **Add as many articles as possible** — build the magazine up across the 9 categories so it launches full, not empty.
- **Analytics** — Lewis will add measurement to the platform soon. Nothing needed from you.
- **Plan the launch** — once the content is in and reviewed, think about how you want to launch: the announcement, the first email to your subscribers, and which channels to share it on.

---

_Questions on any of this, or want a Spanish-language version of this guide for day-to-day reference? Ask Lewis._
