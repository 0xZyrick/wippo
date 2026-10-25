# Wippo production setup — all Neon + PostHog

## Stack

| Concern | Service |
|---------|---------|
| Database | Neon Postgres (`DATABASE_URL` / `DATABASE_URL_POOLED`) + Prisma |
| Auth | Neon Managed Better Auth (`NEON_AUTH_BASE_URL`) |
| Storage | Neon Object Storage (S3 API keys) |
| Analytics | PostHog |
| Host | Vercel |

## 1. Neon database

1. Neon Console → connection string (use **pooled** for Vercel).
2. Set `DATABASE_URL` and `DATABASE_URL_POOLED`.
3. `npx prisma generate && npx prisma db push`

App tables: `User`, `Project`, `ProjectUpdate`, `ProjectEmailSubscriber`.  
Auth users/sessions are managed by Neon Auth in your branch.

## 2. Neon Auth

1. Project → Branch → **Auth** → Enable Better Auth.
2. Copy **Auth URL** → `NEON_AUTH_BASE_URL`.
3. Generate cookie secret: `openssl rand -base64 32` → `NEON_AUTH_COOKIE_SECRET` and `SESSION_SECRET`.
4. Enable **Email OTP** (and/or email+password) in the Auth configuration if you use the OTP UI.
5. App routes: `app/api/auth/[...path]` proxies to Neon Auth.

Sign-in UI: `/auth` (email OTP + password modes).

After sign-in, `getSessionUser()` maps the Neon Auth email into the Prisma `User` row (handle for public URLs).

## 3. Neon Object Storage

1. Enable Object Storage on the branch; create bucket (e.g. `media`).
2. Create credentials → set:

```
AWS_ENDPOINT_URL_S3=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
S3_BUCKET=media
```

3. Uploads go through `POST /api/upload` (auth required). Dashboard falls back to data URLs if storage is missing.

## 4. PostHog

1. Create a project at posthog.com.
2. Set `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` (e.g. `https://us.i.posthog.com`).
3. Client provider captures pageviews; auth page captures sign-in events.

## 5. Vercel env checklist

- `DATABASE_URL` / `DATABASE_URL_POOLED`
- `NEON_AUTH_BASE_URL`
- `NEON_AUTH_COOKIE_SECRET` (and `SESSION_SECRET`)
- `AWS_ENDPOINT_URL_S3`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`

Deploy → HTTPS domain → test sign-in → create project → upload media → public `/{handle}/{slug}`.
