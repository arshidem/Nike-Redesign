const Mailjet = require("node-mailjet");

// Keep credentials on the server. Configure a verified sender in Mailjet.
const sendEmail = async ({ to, subject, html }) => {
  const { MAILJET_API_KEY, MAILJET_SECRET_KEY, SENDER_EMAIL } = process.env;
  if (!MAILJET_API_KEY || !MAILJET_SECRET_KEY || !SENDER_EMAIL) {
    throw new Error("Email configuration missing: set MAILJET_API_KEY, MAILJET_SECRET_KEY and SENDER_EMAIL");
  }

  const mailjet = Mailjet.apiConnect(MAILJET_API_KEY, MAILJET_SECRET_KEY);
  const result = await mailjet.post("send", { version: "v3.1" }).request({
    Messages: [{
      From: { Email: SENDER_EMAIL, Name: "Nike Redesign" },
      To: [{ Email: to }],
      Subject: subject,
      HTMLPart: html,
    }],
  });
  // The send endpoint can return HTTP success with an individual message error.
  if (result.body?.Messages?.[0]?.Status !== "success") {
    throw new Error("Email provider did not accept the message");
  }
  return result;
};

module.exports = { sendEmail };
