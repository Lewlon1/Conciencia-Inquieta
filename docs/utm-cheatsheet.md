# UTM cheat sheet — for Marie's social links

Every link Marie posts on Instagram, X, TikTok, YouTube, or the secondary
channel (WhatsApp/Telegram) should carry UTM parameters. Plausible and Umami
both read these automatically — no extra code needed — and break down
traffic by source/medium/campaign in the dashboard.

## The convention

```
https://conciencia-inquieta.vercel.app/<path>?utm_source=<platform>&utm_medium=<medium>&utm_campaign=<campaign>
```

| Parameter | What goes here | Fixed values |
|---|---|---|
| `utm_source` | Which platform the click came from | `instagram`, `x`, `tiktok`, `youtube`, `whatsapp`, `telegram`, `newsletter` |
| `utm_medium` | What kind of placement | `social` (a feed post), `bio` (link in bio), `story` (Instagram/TikTok story), `channel` (WhatsApp/Telegram broadcast), `email` (newsletter) |
| `utm_campaign` | The specific thing being promoted — free text, lowercase, hyphenated | article slug (`el-cuidado-como-politica`), or a theme (`lanzamiento`, `unete-otono`) |

Keep `utm_source` and `utm_medium` to the fixed lists above — that's what
keeps the analytics dashboard clean. `utm_campaign` is free text; be
consistent (all lowercase, hyphens not spaces) but it doesn't need
pre-approval.

## Examples

Instagram feed post linking to an article:
```
https://conciencia-inquieta.vercel.app/articulos/el-cuidado-como-politica?utm_source=instagram&utm_medium=social&utm_campaign=el-cuidado-como-politica
```

Instagram bio link (permanent, points at Únete):
```
https://conciencia-inquieta.vercel.app/unete?utm_source=instagram&utm_medium=bio&utm_campaign=bio-link
```

TikTok video promoting the newsletter:
```
https://conciencia-inquieta.vercel.app/unete?utm_source=tiktok&utm_medium=social&utm_campaign=unete-otono
```

WhatsApp Channel broadcast linking to a new article:
```
https://conciencia-inquieta.vercel.app/articulos/memoria-que-incomoda?utm_source=whatsapp&utm_medium=channel&utm_campaign=memoria-que-incomoda
```

## Not needed for

- Internal links (site nav, footer) — never add UTMs to links within the
  site itself, it pollutes the analytics with fake "referrals."
- Search engines — organic search is tracked separately, no UTM involved.
