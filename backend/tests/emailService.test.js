const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  createEmailService,
  EmailDeliveryError,
} = require("../services/emailService");
const message = {
  to: "recipient@example.test",
  subject: "Test",
  html: "<p>123456</p>",
  text: "123456",
  kind: "otp",
};
const smtpEnv = {
  EMAIL_PROVIDER: "smtp2go",
  SMTP2GO_API_KEY: "test-private-key",
  EMAIL_FROM: "Sender <sender@example.test>",
};
const resendEnv = {
  EMAIL_PROVIDER: "resend",
  RESEND_API_KEY: "test-private-key",
  EMAIL_FROM: "Sender <sender@example.test>",
};
const response = (status, data) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => data,
});
function setup(env, responses) {
  const calls = [],
    logs = [];
  const service = createEmailService({
    env,
    fetchImpl: async (...args) => {
      calls.push(args);
      const next = responses.shift();
      if (next instanceof Error) throw next;
      return next;
    },
    logger: {
      info: (...args) => logs.push(args),
      error: (...args) => logs.push(args),
    },
    sleep: async () => {},
  });
  return { ...service, calls, logs };
}
test("SMTP2GO uses HTTPS, both body formats, and verified sender configuration", async () => {
  const service = setup(
    { ...smtpEnv, EMAIL_REPLY_TO: "support@example.test" },
    [response(200, { data: { succeeded: 1, failed: 0, email_id: "mail-1" } })],
  );
  assert.deepEqual(await service.sendEmail(message), {
    provider: "smtp2go",
    id: "mail-1",
  });
  const [url, request] = service.calls[0],
    payload = JSON.parse(request.body);
  assert.equal(url, "https://api.smtp2go.com/v3/email/send");
  assert.equal(request.headers["X-Smtp2go-Api-Key"], smtpEnv.SMTP2GO_API_KEY);
  assert.equal(payload.html_body, message.html);
  assert.equal(payload.text_body, message.text);
  assert.deepEqual(payload.to, [message.to]);
  assert.equal(payload.sender, smtpEnv.EMAIL_FROM);
  assert.deepEqual(payload.custom_headers, [
    { header: "Reply-To", value: "support@example.test" },
  ]);
});
test("SMTP2GO HTTP 200 with recipient failures is not reported as success", async () => {
  const service = setup(smtpEnv, [
    response(200, {
      data: { succeeded: 0, failed: 1, failures: ["Sender not verified"] },
    }),
  ]);
  await assert.rejects(
    service.sendEmail(message),
    (error) =>
      error instanceof EmailDeliveryError &&
      error.reason === "check_verified_sender",
  );
  assert.equal(service.calls.length, 1);
});
test("missing configuration fails before any request", async () => {
  const service = setup({}, []);
  await assert.rejects(service.sendEmail(message), {
    code: "email_configuration_missing",
  });
  assert.equal(service.calls.length, 0);
});
test("invalid or quota-limited credentials are not repeatedly retried or leaked", async () => {
  const service = setup(resendEnv, [
    response(429, {
      name: "daily_quota_exceeded",
      message: "recipient@example.test 123456 test-private-key quota reached",
    }),
  ]);
  await assert.rejects(service.sendEmail(message), {
    code: "daily_quota_exceeded",
    reason: "sending_limit",
  });
  assert.equal(service.calls.length, 1);
  for (const secret of ["123456", "test-private-key", "recipient@example.test"])
    assert.ok(!JSON.stringify(service.logs).includes(secret));
});
test("Resend retry keeps the same idempotency key and payload", async () => {
  const service = setup(resendEnv, [
    response(503, { name: "service_unavailable" }),
    response(200, { id: "mail-2" }),
  ]);
  await service.sendEmail({
    ...message,
    idempotencyKey: "order-confirmation-123",
  });
  assert.equal(service.calls.length, 2);
  assert.equal(
    service.calls[0][1].headers["Idempotency-Key"],
    "order-confirmation-123",
  );
  assert.equal(
    service.calls[1][1].headers["Idempotency-Key"],
    "order-confirmation-123",
  );
  assert.equal(service.calls[0][1].body, service.calls[1][1].body);
});
test("SMTP2GO does not retry ambiguous network sends without idempotency support", async () => {
  const service = setup(smtpEnv, [
    new Error("raw request with test-private-key and 123456"),
  ]);
  await assert.rejects(service.sendEmail(message), {
    code: "email_network_error",
  });
  assert.equal(service.calls.length, 1);
  assert.ok(!JSON.stringify(service.logs).includes("test-private-key"));
});
test("invalid provider and header injection are rejected without sending", async () => {
  const service = setup({ ...smtpEnv, EMAIL_PROVIDER: "unknown" }, []);
  await assert.rejects(service.sendEmail(message), {
    code: "email_provider_invalid",
  });
  const valid = setup(smtpEnv, []);
  await assert.rejects(
    valid.sendEmail({ ...message, subject: "bad\r\nBcc: other@example.test" }),
    { code: "email_payload_invalid" },
  );
  assert.equal(valid.calls.length, 0);
});
