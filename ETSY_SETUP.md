
# Etsy integration setup

## Environment variables

Copy `.env.example` to `.env.local` and set:

- `ETSY_API_KEY`: Etsy app keystring and shared secret in `keystring:shared_secret` format.
- `ETSY_SHOP_NAME`: defaults to `TheSMStudios` and resolves the numeric shop ID through Etsy.
- `ETSY_SHOP_ID`: optional numeric shop ID if you prefer to pin it explicitly.
- `ETSY_SYNC_SECRET` (optional): a long random secret for trusted scheduled sync requests. The admin dashboard uses its authenticated session instead. Do not put this value in `NEXT_PUBLIC_*` variables or commit it.
- `ETSY_ACCESS_TOKEN` (optional but recommended): OAuth 2.0 access token authorized by the shop owner with `listings_r` scope. It enables owner-only inventory/SKU enrichment where Etsy permits it.
- `ADMIN_USER` and `ADMIN_PASSWORD`: required server-side credentials for the first admin sign-in. After the first successful login, the account and scrypt password hash are stored in the private admin data directory. Use a unique, strong bootstrap password and serve the site over HTTPS.
- `ADMIN_DATA_DIR` (optional): persistent writable directory for the administrator profile, hashed password, sessions, avatar, and activity log. It defaults to `.data/admin` and must remain outside `public/`.

Register/approve an Etsy app in the Etsy Developer Portal. The public active-listings endpoint uses the API key; owner-only inventory details require OAuth approval and `listings_r`. Never commit `.env.local`.

## Sync

Open `/admin/login` and sign in with `ADMIN_USER` and `ADMIN_PASSWORD`; after sign-in, change the bootstrap password from the Security section. The admin area uses short-lived, HTTP-only, same-site session cookies. Profile changes, preferences, session records, avatar, and audit entries are stored privately in `ADMIN_DATA_DIR`. The dashboard sync action uses the signed-in session. A trusted scheduled sync can use `ETSY_SYNC_SECRET` as the `x-etsy-sync-secret` header.

The server fetches active listings in 100-item pages, upserts by Etsy listing ID, refreshes images, and removes listings no longer active. A failed image request does not stop catalog synchronization; the last successful cached image is retained when available. The dashboard reports last synchronization time, listing/product totals, and failed image requests. The data directory must be writable and persistent in production. The file-backed admin store is intended for a single Node.js instance; multi-instance or serverless deployments need a shared database/session store and appropriate object storage. The built-in sign-in attempt limiter is process-local, so public deployments should also enable rate limiting at the hosting proxy.

The storefront uses Etsy-hosted original listing images and links every product to its original Etsy listing for checkout. Website checkout is not enabled, so Etsy remains the merchant of record.

## Important deployment notes

- Set all Etsy environment variables in the hosting provider's server environment.
- Set `ADMIN_USER` and `ADMIN_PASSWORD` before public production deployment, then keep the private admin data directory mounted and backed up. If the account store is unavailable on first sign-in, the login route fails closed.
- The admin session cookie is marked `Secure` in production; serve the site over HTTPS.
- Use a persistent directory and a single Node.js instance, or replace the file-backed admin account/session store and JSON catalog cache with shared database/object storage before deploying to multiple instances or ephemeral/serverless infrastructure.
- The Etsy API's active-listings endpoint returns active listings only. Deactivated listings disappear from the next full sync and therefore from the storefront cache.
