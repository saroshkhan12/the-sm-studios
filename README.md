
# THE SM STUDIOS

A new Next.js storefront starter for THE SM STUDIOS.

## Requirements
- Node.js 20+
- npm

## Run locally
```bash
npm install
npm run dev
```
Open http://localhost:3000.

## Important catalog note
The storefront intentionally does not invent products, prices, reviews, product photos, or specifications. The supplied Etsy blueprint contains example listings and explicitly says the inventory must be verified. The shop starts with an empty catalog until verified listings and original artwork are imported.

## Included now
- Responsive editorial storefront and navigation
- Brand homepage and six collection worlds
- Instant shop search, category filtering, sorting, and Etsy product detail pages
- Browser-persisted favorites and a shortlist cart that sends purchases to Etsy
- Admin dashboard with Etsy sync, account profile, secure password changes, session revocation, and an audit log
- Announcement bar toggle/content starter
- Contact/newsletter interaction placeholders with honest status messaging

## Before production
The website does not collect payment or create orders; customers complete checkout on Etsy. Before public production deployment:
1. Configure `ADMIN_USER` and `ADMIN_PASSWORD` as the initial admin sign-in credentials and deploy behind HTTPS.
2. Mount a persistent writable directory for `.data` and `ADMIN_DATA_DIR`; the file-backed admin store is intended for a single Node.js instance. Use a shared database/session store before scaling to multiple instances or ephemeral/serverless hosts.
3. Configure secure file storage and signed digital-download URLs if the studio offers direct digital delivery.
4. Review shipping/returns and privacy/legal policies.
5. Configure a newsletter provider and consent handling before enabling newsletter capture.

Never put payment secrets, Etsy credentials, or admin credentials in client-side code.


## Dashboard statistics cards
The admin preview now uses a reusable animated `StatsCard` component at
`src/components/stats-card.tsx`. It uses Framer Motion, Lucide icons, responsive
glass styling, and respects reduced-motion preferences. Customer and revenue
values remain placeholders because the current project does not yet connect
to persistent customer/order data.

After extracting this source export, run `npm install` (not `npm ci`) so npm can
resolve and update the Framer Motion lockfile entries, then run `npm run dev`.
The supplied project export did not include binary/public assets or generated
dependencies.

## Etsy storefront integration

The shop route reads its catalog from the server-side Etsy cache (`.data/etsy-products.json`) and renders interactive listing detail pages at `/shop/[slug]`. Search covers listing titles, descriptions, categories, collections, and tags. Favorites and the selection list persist in localStorage; all final purchases route to the original Etsy listing. Configure the server-side Etsy and admin variables in `.env.local`, then visit `/admin/login` to access the dashboard. The initial admin credentials are converted to a salted scrypt hash after the first successful sign-in; subsequent profile, preference, session, and activity changes persist in the private `ADMIN_DATA_DIR`. See `ETSY_SETUP.md` for API registration, OAuth scope, persistent storage, and deployment notes.
