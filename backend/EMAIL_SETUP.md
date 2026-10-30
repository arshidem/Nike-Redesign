# Email setup (OTP and order confirmations)

Both email flows use Brevo's transactional email API from the backend.

1. Add and verify your sender email in Brevo and ensure transactional sending is enabled for your account.
2. Set these variables in your backend hosting environment:
   - BREVO_API_KEY: your Brevo API key (not an SMTP password)
   - SENDER_EMAIL: the exact verified sender email address
3. Redeploy/restart the backend after saving the variables. Never put API keys in frontend/VITE variables or commit them.
4. Request an OTP and check Brevo's transactional logs and your inbox/spam folder. Test order confirmations using your payment test environment.

## Unauthorized IP errors

Brevo sees your backend's outgoing IP address, not the customer's IP. In Brevo's API security/authorized IP settings, authorize your backend's outbound IPs. If the host changes outbound IPs, use stable outbound IPs or, if your account offers it, adjust unauthorized-IP blocking to suit that hosting setup. Keep the API key private. Repository changes cannot change this account setting.

Mailjet credentials are no longer used by these email flows. Brevo's current plan limits, sender requirements and account restrictions apply. API acceptance does not guarantee inbox delivery. Order confirmation failures remain non-critical and do not reverse a successful order.
