# Wippo Ledger

Private dashboard for project updates + a public timeline URL.

## Flow

```
Landing (/)
  ├── Sign in → /auth → /dashboard   (session cookie)
  └── Guest → /{handle}/{slug}       (public ledger; follow by email)
```

## Run locally

```bash
npm install
cp .env.example .env   # optional: set DATABASE_URL for Neon
npm run dev
```

Without `DATABASE_URL`, the app uses an in-memory store:

- Example public page: http://localhost:3000/alex/orbit-mesh  
- Admin: any email → use the shown dev OTP → dashboard  

## Production

See [PRODUCTION.md](./PRODUCTION.md) for Neon, Resend, and Vercel setup.
