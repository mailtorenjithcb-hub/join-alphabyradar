# ALPHA Public Registration — Deploy & Run (Case 001: MUSICAL SYNDICATE — Edition 001, Thu 23 July 2026)

**Two paths on this site:** `index.html` = Community (join ALPHA, event registration, form `alpha-join`) · `venues.html` = Consulting (ALPHA Intelligence Engine for venue owners, form `venue-enquiry`). Community builds the movement; consulting generates revenue.

This folder is the **real, running front door** of the AIE v2.2 Content Intelligence System.
It implements: social content → landing page → join ALPHA → registration → (approval → QR pass → check-in) with content attribution.

Page: `index.html` — self-contained, no build step, mobile-first, ALPHA brand (black / chrome silver / deep red).

---

## 1. Deploy (10 minutes, free — same as beatsdubai.org)

1. Go to https://app.netlify.com (your existing Netlify account).
2. "Add new site" → "Deploy manually" → drag the `public-site` folder in.
3. Site name suggestion: `join-alpha` → gives `https://join-alpha.netlify.app` (a custom domain like `join.beatsdubai.org` can be added later in Domain settings).
4. **Forms are automatic.** The form is named `alpha-join` with `data-netlify="true"` — Netlify detects it on deploy. Check: Site → Forms → `alpha-join` appears.
5. Netlify → Forms → Settings → enable **email notification** to mailtorenjithcb@gmail.com so every registration hits your inbox instantly.

**Limit to know:** Netlify free tier = 100 form submissions/month. If the campaign gets hot, upgrade for the month or tell Claude to switch the form to a Google Form backend (page is built so this is a small change).

## 2. Tracked links — one per content asset (AIE v2.2 §5.4)

Never post the plain URL. Every post/reel/story/WhatsApp blast gets its own link:

```
https://<your-site>/?utm_source=instagram&utm_medium=reel&utm_campaign=musical-syndicate&utm_content=founder-reel-01&c=MS-PRE-001
```

- `utm_source` — platform: `instagram`, `facebook`, `whatsapp`, `tiktok`, `dj-groups`
- `utm_medium` — format: `reel`, `story`, `post`, `dm`, `group-share`
- `utm_content` — human name of the asset
- `c` — the Content ID from the content asset record (e.g. `MS-PRE-001`)

Venue-consulting links point to `/venues.html` the same way, e.g. `https://<your-site>/venues.html?utm_source=linkedin&utm_medium=post&c=AIE-POST-01` (venue enquiries arrive in Netlify → Forms → `venue-enquiry`).

The page stores these in the submission (plus first-touch/last-touch). **This is how you will know which content actually filled the room.**

## 3. From registration to the door (the full loop)

1. **Registrations arrive** → Netlify → Forms → `alpha-join` → "Export to CSV".
2. **Open the ALPHA Command Centre** (frontend app) → your MUSICAL SYNDICATE event → **Import** tab → upload the CSV.
   - Columns map automatically: `full_name` → Full name, `phone` → Mobile, `email` → Email, `notes` → Notes (contains Role | Interest | Source | Consent).
   - Duplicates are detected by phone/email — skip or merge.
3. **Issue QR passes** → Passes tab → print sheet or download PNG per guest → send each PNG on WhatsApp (individually — never in a group).
4. **Event night** → Scanner page on your phone → scan QR at the door → live check-in counts.
5. **After the event (within 72h — M8 learning pass)** → export the check-in list, and count per `Source` (in Notes): which content produced registrations, which produced actual attendance. Those numbers go into the AIE Knowledge Base as Case 001 baselines.

## 3b. Communication Engine (automatic emails + registration sync) — one-time setup

Three Netlify functions are live on this site (deployed 2026-07-15):

- `submission-created` — **automatic welcome email** to every `alpha-join` registrant, and a separate auto-reply for `venue-enquiry`.
- `send-pass` — the Command Centre calls this to **email approval + the QR pass attached** when you press Approve.
- `list-registrations` — the Command Centre calls this to **pull new registrations in automatically** (reads Netlify Forms directly — nothing is duplicated). Powers the "Sync From Website" button in Registrations.

All three stay silently OFF until these environment variables are set (Netlify → Site configuration → Environment variables), then redeploy or wait for the next deploy:

1. Create a free account at **brevo.com** (300 emails/day free). Verify `alphabyradar@gmail.com` as a sender (Senders & IP → Add sender → confirm the email Brevo sends you).
2. Create an API key (SMTP & API → API keys) and set it as `BREVO_API_KEY`.
3. Set `FROM_EMAIL = alphabyradar@gmail.com` (and optionally `FROM_NAME = ALPHA BY RADAR`).
4. Set `ALPHA_SEND_TOKEN` to a real random secret — **do not reuse an example string from a chat message**; if that ever happens, treat it as compromised and generate a fresh one immediately, in both places (step 6).
5. **For sync (new, 2026-07-15):** create a Netlify **Personal Access Token** — app.netlify.com → click your avatar (top right) → **User settings** → **Applications** → **Personal access tokens** → **New access token** → name it `ALPHA sync`, no expiry needed → copy it once. Set it as `NETLIFY_API_TOKEN`.
6. In the Command Centre → Guest Tracking → Registrations → **Connection Setup**: paste the same `ALPHA_SEND_TOKEN` value (not the Personal Access Token — that one only lives in Netlify's env vars). Endpoint is pre-filled. This single setup now powers both auto-emailed passes and "Sync From Website."

After that: form registration → instant welcome email; pressing **Approve** → Member ID + approval email with the QR pass attached, automatically. Without the keys, everything still works in manual mode (pass PNG downloads + email drafts open).

## 4. Public wording (fixed — never change)

FREE ENTRY · REGISTRATION REQUIRED · NO REGISTRATION — NO ENTRY

## 5. What is still manual (planned for the platform later)

- Pass delivery is manual WhatsApp (platform Phase 4 automates it).
- CSV export/import is manual (platform Phase 2–3 replaces it with the public registration API).
- Attribution counting is manual from the Notes column (platform Phase 4+ adds `content_assets` / `attribution_touches`).

Manual is fine for Case 001 — the data model is already correct, so nothing collected now is wasted later.
