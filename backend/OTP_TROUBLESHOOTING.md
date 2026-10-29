# OTP troubleshooting

The old `OTP sending failed` error came from the previous Brevo integration. The migrated backend uses a shared SMTP2GO/Resend HTTPS email service. It does not use the Triode Studio website's EmailJS settings.

For setup and known authentication limitations, read [EMAIL_SETUP.md](EMAIL_SETUP.md).

1. Open the Vercel project and select the relevant deployment.
2. Open its Runtime Logs and make one controlled sign-in attempt.
3. Look for `email_configuration_error` or `email_failed`.
4. Read only the safe `provider`, `status`, `code`, and `reason` fields. Never share API keys, OTPs, recipient details, or raw HTTP request objects.

| Logged reason | What to check |
| --- | --- |
| `configure_render_environment` | The selected provider's private API key and `EMAIL_FROM` in Vercel. |
| `check_api_key` | Key validity, API permissions, and whether the key is disabled. An SMTP password is not an API key. |
| `check_verified_sender` | Single-sender verification for SMTP2GO or owned-domain verification for Resend. |
| `check_account_permissions` | Provider account activation, restrictions, and API permissions. |
| `sending_limit` / `rate_limited` | Hourly/daily/monthly allowance and provider account limits. |
| `provider_connection_or_timeout` / `provider_unavailable` | Provider status and connectivity from the Vercel Function. |

If an `email_accepted` entry exists but nothing arrives, use its message ID in the provider's activity view to inspect delivery, bounce, or queue status. Acceptance is not inbox delivery. If the browser instead reports a network/CORS error, check that the browser is calling the same-origin `/api` route; that is a different failure point.
