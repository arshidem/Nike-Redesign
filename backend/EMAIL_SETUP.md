# Transactional email setup

## What was found

Two active outbound-email paths existed:

- `controllers/authController.js`: OTP from `POST /api/auth/request-otp`. The normal verification screen's resend action uses the same endpoint.
- `controllers/orderController.js`: order confirmation after `verifyPayment` has committed the paid order.

Both used Brevo's HTTPS API. Nodemailer was imported but unused. There were no shipping, delivery, cancellation, welcome, or administrator-alert email triggers; this migration does not invent those events.

Both existing paths now call `services/transactionalEmail.js`, which uses `services/emailService.js`. Email provider code is separate from business logic. Database schemas, payment verification, totals, stock updates, and authentication route contracts are unchanged. Order email remains non-critical after the order transaction commits. The receipt uses the actual order total and no longer invents a delivery date five days from sending.

## Recommended now: SMTP2GO HTTPS API

A free `*.vercel.app` address is hosting, not a domain whose DNS you control. Resend requires an owned verified sending domain for normal customer sending. SMTP2GO offers single-sender verification as an alternative, subject to the address's domain/DMARC policy.

1. Create an SMTP2GO account at https://www.smtp2go.com/.
2. Open **Sending → Verified Senders → Single sender emails**. Add an address you control and click the verification link sent to that mailbox.
3. If verification is rejected because the address's domain restricts third-party sending, use an eligible sender or obtain and verify your own domain. Do not try to verify `gmail.com` or `vercel.app` as your own domain.
4. Open **Sending → API Keys** and create a key permitted to use `/email/send`. Use an API key, not an SMTP password.
5. In **Render → backend Web Service → Environment**, configure:

```text
EMAIL_PROVIDER=smtp2go
SMTP2GO_API_KEY=<your private API key>
EMAIL_FROM=Triode Studio <your verified sender address>
EMAIL_REPLY_TO=<optional address for replies>
```

Keep these values on the backend; do not prefix keys with `VITE_` or commit them. `SENDER_EMAIL` is supported as a sender-address fallback when `EMAIL_FROM` is unset. Remove blank optional values rather than entering the example text literally.

6. Use a supported Node runtime: Node 22.8+ or Node 24. Set Render's Node version if an older version is pinned, then save and redeploy.
7. Make one controlled OTP request and confirm receipt. Inspect SMTP2GO Activity for its accepted/delivered/bounced state. Confirm a receipt using a payment test transaction before accepting real orders. No live emails, payment transactions, or provider-account changes were made during development.

SMTP2GO's free plan currently has 1,000 emails/month, 200/day, and a 25/hour cap without a verified sender domain. The free plan has no time limit, but account review, sender rules, quotas, and provider policies still apply. Throttled messages can be queued, which matters for five-minute OTP expiry. For production traffic, use a verified domain and a plan sized for your login/order volume. No provider can promise that an account will never be restricted.

## Optional later: Resend

After obtaining a domain whose DNS you can edit, add and verify it in Resend and configure:

```text
EMAIL_PROVIDER=resend
RESEND_API_KEY=<your private sending key>
EMAIL_FROM=Triode Studio <no-reply@your-verified-domain.example>
EMAIL_REPLY_TO=<optional inbox for replies>
```

Resend's test domain is not a substitute for a verified production sender. Both providers use HTTPS on port 443, avoiding Render free-service SMTP-port restrictions.

## Failure handling and delivery limits

- Missing environment settings fail before a network request.
- Logs use `email_configuration_error`, `email_failed`, and `email_accepted`. They include safe provider/status/reason fields and accepted message IDs, without recipient addresses, OTP bodies, or API keys. Accepted is not the same as delivered; inspect the provider's activity for delivery/bounces.
- SMTP2GO may return HTTP 200 with recipient failures. The service checks the returned success/failure counts and email ID, so these failures are not treated as accepted messages.
- Requests have a four-second timeout. SMTP2GO requests are not automatically retried after ambiguous failures because the API does not document a comparable idempotency guarantee; an automatic retry could duplicate an already-accepted email.
- Resend gets at most one retry for network/5xx failures, using the same idempotency key and body. Auth/quota errors are not retried. Its provider idempotency window is 24 hours, not permanent deduplication.
- There is no durable application queue or automatic receipt-resend job. If receipt sending fails, the paid order remains successful and the safe failure is logged. Do not promise guaranteed eventual delivery without adding a durable retry design.

## Existing authentication limitations found during the audit

These predate the provider migration and were not changed:

- `/verify-register-otp` is a legacy screen calling `/api/auth/register/request-otp` and `/api/auth/register/verify-otp`, but the backend does not define those endpoints. The current sign-in flow uses `/request-otp`, `/verify-otp`, and `/complete-registration`.
- The existing new-user path does not persist an OTP for an unknown email, and `verifyOTP` returns `newUser: true` without checking a stored code when no user exists. Completion is also keyed by a supplied email. A provider change does not repair this verification gap; a separate registration-proof design is needed before relying on this flow for verified new-user identity.

## Tests

From `backend/`, run `npm ci --legacy-peer-deps` and `npm test` on the supported Node runtime. Twelve tests use mocked provider/database/payment boundaries; they do not send real email or create real orders. They cover both transport payloads, provider response failures, configuration errors, retry boundaries, log redaction, templates, OTP endpoint behavior, and preserving a paid order when receipt sending fails.

## Official references

- SMTP2GO API: https://developers.smtp2go.com/docs/send-an-email
- Sender verification: https://support.smtp2go.com/hc/en-gb/articles/115004408567-Verified-Senders
- Free plan limits: https://support.smtp2go.com/hc/en-gb/articles/223087947-Free-Plan
- Resend verified domains: https://resend.com/docs/dashboard/domains/introduction
- Resend API/idempotency: https://resend.com/docs/api-reference/emails/send-email
- Render free service limits: https://render.com/docs/free
