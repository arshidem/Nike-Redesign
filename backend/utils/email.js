const SibApiV3Sdk = require("@sendinblue/client");

// Both OTPs and order confirmations call this backend-only sender.
const sendEmail = async ({ to, subject, html }) => {
  const { BREVO_API_KEY, SENDER_EMAIL } = process.env;
  if (!BREVO_API_KEY || !SENDER_EMAIL) {
    throw new Error("Email configuration missing: set BREVO_API_KEY and SENDER_EMAIL");
  }

  const client = new SibApiV3Sdk.TransactionalEmailsApi();
  client.setApiKey(
    SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey,
    BREVO_API_KEY
  );

  return client.sendTransacEmail({
    sender: { name: "Nike Redesign", email: SENDER_EMAIL },
    to: [{ email: to }],
    subject,
    htmlContent: html,
  });
};

module.exports = { sendEmail };
