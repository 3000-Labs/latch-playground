# Vercel + Neon + WebAuthn — deploy handoff

This app uses **Prisma** against **Neon Postgres**. Database access is **server-only** (API routes); never put `DATABASE_URL` in `NEXT_PUBLIC_*` variables.

## 1. Environment variables (Vercel → Project → Settings → Environment Variables)

Set for **Production**, **Preview**, and **Development** as appropriate.

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Neon **pooled** connection string (host usually contains `-pooler`). Must include `pgbouncer=true` and `connection_limit=1` in the query string (e.g. `...?sslmode=require&pgbouncer=true&connection_limit=1`). |
| `DIRECT_URL` | Neon **direct** connection string (same user/database, host **without** `-pooler`). Used only by `prisma migrate`. Do **not** add `pgbouncer=true` here. |
| `WEBAUTHN_RP_ID` | Relying Party ID: hostname only, no scheme/port (e.g. `yourdomain.com` in production). |
| `WEBAUTHN_ORIGIN` | Full origin with scheme (e.g. `https://yourdomain.com`). Must match the URL users use in the browser. |
| `WEBAUTHN_EXTENSION_IDS` | Optional comma-separated Chrome extension IDs. Required if the extension sends `chromeExtensionId` on WebAuthn begin routes. |
| `API_CORS_ALLOWED_ORIGINS` | Optional comma-separated exact origins for credentialed CORS on `/api/*` (e.g. `https://yourdomain.com,chrome-extension://<id>`). Needed for extension `fetch` with `credentials: "include"`. |
| `NEXT_PUBLIC_RPC_URL` | Soroban RPC URL |
| `NEXT_PUBLIC_NETWORK_PASSPHRASE` | Stellar network passphrase |
| `NEXT_PUBLIC_FACTORY_ADDRESS` | Factory contract address |
| `BUNDLER_SECRET` | Server-only secret for deployment (never expose to client) |

### WebAuthn production gotcha

Production sets session cookies with `SameSite=None; Secure` so cross-origin extension requests can keep a session. Restrict who can call your API via `API_CORS_ALLOWED_ORIGINS` (exact origins only; never use `*` with credentials).

If `WEBAUTHN_RP_ID` or `WEBAUTHN_ORIGIN` does not match the deployed site, passkeys will fail verification (wrong RP ID / origin). Common mistakes:

- Using `localhost` in production.
- `WEBAUTHN_ORIGIN` is `https://www.example.com` but users hit `https://example.com` (or vice versa) — pick one canonical URL and set env vars to match.

### Passwords in connection URLs

If the Neon password contains `@`, `:`, `/`, `?`, `#`, etc., **URL-encode** the password segment in both `DATABASE_URL` and `DIRECT_URL`.

## 2. Build

The `build` script runs `prisma generate` before `next build`, so the Prisma client is generated on Vercel automatically.

**Schema migrations:** the initial migration lives in `prisma/migrations/`. For new schema changes, run `npx prisma migrate dev` locally (or in CI), commit the new migration folder, then either:

- Run `npx prisma migrate deploy` in CI before deploy, or
- Add `prisma migrate deploy &&` before `next build` in `package.json` when you want Vercel to apply migrations on every build (team decision).

## 3. Runtime

API routes that use Prisma declare `export const runtime = "nodejs"`. Do not switch these routes to Edge runtime — Prisma’s default client targets Node.

## 4. Optional local verification

- `npx prisma migrate status` — confirm DB is in sync.
- `npx prisma studio` — browse tables after a passkey flow.

See also [.env.example](../.env.example) for placeholder URLs.
