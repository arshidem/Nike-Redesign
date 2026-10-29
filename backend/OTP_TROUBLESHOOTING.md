# OTP delivery on Render

This app sends sign-in codes from the backend through Brevo (`@sendinblue/client`). It does not use the Triode Studio site's EmailJS settings.

The exact response `OTP sending failed` comes from the catch block around Brevo's `sendTransacEmail` call in `controllers/authController.js`. The database lookup happens before this call. The generic response alone cannot identify which Brevo setting or provider condition failed.

## Find the error

1. Open https://dashboard.render.com and select the backend Web Service.
2. Open Logs. Keep this tab open while trying sign-in once in the storefront.
3. Look for `Failed to send OTP` at that time. Inspect the provider response status and message.
4. Share only the status, error code, and message when asking for help. Do not share an entire raw error object: it may contain API request headers, an email address, or the OTP email body.

## Check Render's backend environment

- `BREVO_API_KEY` must be a valid Brevo API key, not an SMTP password. Configure it on the Render backend service, not as a `VITE_` frontend variable.
- `SENDER_EMAIL` must match a verified Brevo sender or authenticated sender domain allowed for that account.
- Apply environment changes using Render's save/redeploy option and wait for the service to become live before retrying.
- In Brevo, review transactional-email access, sender/domain verification, account limits/credits, and any API IP restrictions.

## Interpret the provider message

| Error detail | What to investigate |
| --- | --- |
| `401`, invalid API key, or unauthorized | Missing/wrong/revoked key, wrong key type, or an API access/IP restriction. The provider message distinguishes these. |
| Sender not verified, invalid sender, invalid parameter | `SENDER_EMAIL`, sender verification, domain authentication, or rejected request fields. |
| Credits, quota, or account restriction | Brevo sending allowance, transactional account activation, or provider account restrictions. |
| `429` / too many requests | Provider rate limiting; wait for the indicated retry interval rather than repeatedly requesting codes. |
| Timeout, DNS, or connection error | Connectivity from the Render service to Brevo or an upstream service incident. |
| Provider accepted the email but nothing arrives | Check Brevo's transactional email log for delivery, bounce, suppression, and recipient errors, then check the recipient's spam folder. |

If the browser instead reports a network/CORS error without `OTP sending failed`, also inspect `VITE_BACKEND_URL` and the backend's allowed frontend origins. That is a different failure point. No provider credentials or real delivery status were available during repository inspection.
