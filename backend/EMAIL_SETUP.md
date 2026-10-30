# Email setup (OTP and order confirmations)

Both email flows use Mailjet's HTTPS Send API from the backend. Customer IP addresses are never sent as the API caller. The previous Brevo integration for order confirmations has been removed.

1. Create a Mailjet account and check its current free-plan sending limits and approval requirements. Free sending is limited, not unlimited.
2. Add and verify an individual sender email address in Mailjet. A custom domain is not required for individual sender verification, but delivery with a free-mail sender may be less reliable. Account restrictions still apply.
3. In your backend hosting environment (for example Render), set:
   - MAILJET_API_KEY: your Mailjet API key
   - MAILJET_SECRET_KEY: your Mailjet secret key
   - SENDER_EMAIL: the exact verified sender email address
4. Redeploy/restart the backend after saving the variables. Never put these credentials in frontend/VITE variables or commit them.
5. Request an OTP using your own recipient address and check Mailjet activity and the inbox/spam folder. Then test an order confirmation using your payment test environment.

The frontend already calls the backend for OTPs. Do not add customer IPs to any provider allowlist. Brevo settings cannot be changed through this repository; once this update is deployed, these two email flows no longer use Brevo.

The Send API accepting a message does not guarantee inbox delivery. Check Mailjet activity for bounces, sender restrictions, or daily quota exhaustion. Order confirmation failures remain non-critical and do not reverse a successful order.
