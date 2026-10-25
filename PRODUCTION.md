# Wippo — production setup

## What each service does

| Service | Role in Wippo |
|--------|----------------|
| **Neon** | Postgres database only: users, projects, updates, OTP rows, followers. Not auth UI. Not file storage. |
| **This app** | Auth: email one-time codes stored in Neon (`OtpChallenge`). Session cookie = user id. |
| **Supabase Storage** (optional) | Images/videos for updates. App stores the returned **URL** in Neon `mediaUrl`. |
| **Resend** (optional) | Sends the OTP email in production. |

Neon has **no** product called “Neon Auth” for email login. Auth is already in this repo + Neon tables.

Neon also has **no** object storage. Files need Supabase Storage, S3, or Cloudflare R2.

---

## 1. Reset Neon and apply this schema (keep same project / keys)

If the old Wippo tables are in the way:

1. Neon console → your project → **SQL Editor**
2. Drop old tables (destructive — all data gone):

```sql
DROP TABLE IF EXISTS "ProjectEmailSubscriber" CASCADE;
DROP TABLE IF EXISTS "ProjectUpdate" CASCADE;
DROP TABLE IF EXISTS "Project" CASCADE;
DROP TABLE IF EXISTS "OtpChallenge" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;
-- also drop any leftover old-wippo tables by name if they exist
```

3. Or: create a **new branch / new database** in the same Neon project and use that connection string.

4. Locally:

```bash
# .env
DATABASE_URL="postgresql://...@neon.../neondb?sslmode=require"

npx prisma generate
npx prisma db push
```

Same Neon project credentials work; you’re only replacing tables.

---

## 2. Auth (already built)

Flow:

1. `POST /api/auth/request` → creates OTP in Neon (10 min)
2. User enters code → `POST /api/auth/verify` → creates/finds `User` → sets `wippo_session` cookie
3. Dashboard uses cookie → `getSessionUser()`

**Development:** response includes `demoCode` so you can log in without email.

**Production:** set `RESEND_API_KEY` and wire send in `app/api/auth/request/route.ts` (stub comment is there). Until email is wired, production logins cannot receive codes.

Cookie is `httpOnly`, `sameSite=lax`, `secure` in production.

---

## 3. Storage

**Option A — launch without Storage**  
Media is saved as data URLs in `ProjectUpdate.mediaUrl` (works, heavy for large video).

**Option B — Supabase Storage**  
1. Supabase project → Storage → bucket `wippo-media` (public read if public pages need images)  
2. Env: `NEXT_PUBLIC_SUPABASE_URL`, keys, bucket name  
3. Upload API later: client/server uploads file → public URL → save URL on update  

Neon is still the database; Supabase only holds files.

---

## 4. Deploy (e.g. Vercel)

1. Push repo  
2. Vercel project → Environment variables: at least `DATABASE_URL`  
3. Build: `prisma generate` runs on `postinstall`  
4. After first deploy, run `db push` once from CI or local against production URL  

```bash
DATABASE_URL="production-neon-url" npx prisma db push
```

5. Custom domain → HTTPS (required for secure cookies)

---

## 5. Launch checklist

- [ ] Neon schema pushed (this `schema.prisma`)
- [ ] `DATABASE_URL` on host
- [ ] HTTPS domain
- [ ] OTP email sender (Resend) for real users
- [ ] (Optional) Supabase Storage for media
- [ ] Test: sign-in → create project → add update → open public `/{handle}/{slug}`

