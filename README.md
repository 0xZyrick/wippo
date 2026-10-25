# Wippo Ledger

Standalone app: private dashboard for project updates + public timeline URL.

## Flow

```
Landing (/)
  ├── Admin → /auth → /dashboard   (session cookie; no re-auth while signed in)
  └── Guest → /{handle}/{slug}     (no account; follow by email)
```

## Run

```bash
npm install
npm run dev
```

Demo without database:
- Guest: http://localhost:3000/alex/orbit-mesh
- Admin: any email → use the shown demo OTP → dashboard
