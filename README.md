# Nike storefront — Next.js full-stack application

One Next.js 16 application hosts the storefront and Node.js API on the same origin. No separately deployed Render backend is required. Existing MongoDB collections and the homepage design are retained. The pending privacy/terms and transactional-email updates are included in this migration branch.

## Run locally

Use Node 22.8+ (Node 24 recommended).

```sh
npm ci
cp .env.example .env.local
# Fill in the variables locally. Never commit secret values.
npm run dev
```

Open http://localhost:3000. Run `npm test` for backend and frontend interaction tests, `npm run build` for the production build, and `npm start` to run that build.

## Deploy to Vercel

1. Import this GitHub repository or edit its existing Vercel project.
2. Change **Root Directory** from `nike` to the repository root (`.` / leave blank).
3. Select **Next.js** as the framework. Build is `npm run build`, install is `npm ci`, and output directory uses the framework default. Remove any old `dist` output override and Vite build override.
4. Copy the existing private backend settings into the Vercel project's environment variables: `MONGO_URI`, `JWT_SECRET`, Razorpay server keys, Cloudinary keys, and email provider settings. Reuse the same MongoDB database; no schema/data migration is required for existing records.
5. Replace the old frontend `VITE_RAZORPAY_KEY_ID` with `NEXT_PUBLIC_RAZORPAY_KEY_ID` (the Razorpay public key ID). It must correspond to the server's Razorpay account. Public variables are embedded at build time, so rebuild after setting them.
6. `VITE_BACKEND_URL`, `FRONTEND_URL`, `FRONTEND_URL_HOST`, `PORT`, and a Render URL are not needed. Browser API requests use `/api/...` on the same host.
7. Deploy the preview, check `/api/health`, and test authenticated catalogue/admin, image uploads, OTP receipt, and a payment test transaction before promoting to production. A health response confirms the app process, not database or provider credentials.
8. Retire Render only after checking its disk for uploads and completing the legacy-media steps below.

Do not put database URLs, JWT secrets, payment secrets, email API keys, or Cloudinary secrets into `NEXT_PUBLIC_` variables. Configure MongoDB Atlas network access for the Vercel deployment using an appropriate network-access policy for your account; do not assume Render's allowlist applies.

## Architecture

- `pages/`: native Next.js file routes for every customer, auth, legal, and admin screen. The existing interactive screens remain client-rendered to preserve their browser/local-storage behavior; this is not a React Server Components rewrite.
- `pages/api/[...path].js`: a Node.js API Route, with raw request access for the Express-compatible router.
- `backend/app.js`: existing authenticated API routers and controllers, without `listen()`, a separate server, CORS dependency, or Render URL.
- `backend/config/db.js`: cached MongoDB connections suitable for warm serverless invocations. It does not terminate the process on a connection failure.
- `nike/src/`: retained UI components and business-facing hooks. `lib/navigation.jsx` delegates links/history/params to Next.js rather than running React Router in production.
- `public/`: images/fonts plus a legacy `/uploads` archive copied from the repository. The old Vite service worker is unregistered on client startup to prevent stale page bundles; the install manifest is retained, but the old offline-cache implementation is not.

All admin pages use the existing role guard; backend middleware remains the authoritative access check. The product best-sellers path and the previously unmounted interests router are wired into the combined API. The unused Socket.io client scaffold is retired; this repository had no active Socket.io server to migrate.

## Durable uploads and existing media

Vercel Functions do not provide a persistent writable uploads disk, and their request body limit is 4.5 MB. Product/review images now upload directly from the browser to Cloudinary, using a short-lived server signature. Only the admin can request product upload signatures; authenticated reviewers can request review signatures. The final product/review request is small JSON containing image references. The backend verifies Cloudinary's response signatures and ownership and constructs URLs itself, rather than accepting arbitrary supplied image URLs.

Cloudinary configuration is required for **new** uploads. Existing repository images are served from `/uploads` without Cloudinary. Legacy static images are immutable; removing a product removes its references but does not rewrite the public archive. New Cloudinary asset cleanup is best-effort, not a durable media-retention queue.

The media inventory script is read-only with respect to MongoDB. In a shell with `MONGO_URI` set, run:

```sh
npm run media:inventory
```

If referenced files exist only on Render's disk, keep that service online and set `LEGACY_MEDIA_ORIGIN` to its HTTPS origin, then run:

```sh
npm run media:import
```

This copies missing public image files into `public/uploads`, updates the local media filename index, and never changes database records. Review and commit those downloaded images before deployment. `npm run media:index` rebuilds the index without database access. Archived filenames allow old absolute `/uploads` URLs to resolve on the new host. Images not available in the repository or on the old host cannot be recovered by a code migration.

No live database, Render-only disk, Cloudinary account, email account, or payment account was accessed during development. The remote inventory/import and real delivery/payment checks still require your configuration.

## Email

Both OTPs and paid-order confirmations use the shared HTTPS sender from the preceding email migration. SMTP2GO is the default; Resend is optional with an owned verified domain. See [backend/EMAIL_SETUP.md](backend/EMAIL_SETUP.md). Configure the email variables on **Vercel**, not Render, for this app.

## Existing limitations

This migration preserves the core authentication/checkout logic and does not certify its correctness. The known unknown-email signup verification gap described in `backend/EMAIL_SETUP.md` still needs a registration-proof fix before production identity verification. The legacy `/verify-register-otp` page redirects to the supported `/signin` flow instead of calling missing legacy routes. Paid-order email remains non-critical after the transaction commits, with no durable background mail queue.

Tests mock the database and external providers. Browser visual QA and live identity, media, and payment integration checks were not available. Preserve backups and verify a preview against test provider accounts before switching traffic.
