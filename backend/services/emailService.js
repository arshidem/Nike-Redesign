const { randomUUID } = require("node:crypto");

const TIMEOUT_MS = 4000;
const SAFE_CODE = /^[a-zA-Z0-9_.-]{1,100}$/;
class EmailDeliveryError extends Error {
  constructor(code, status, reason) {
    super("Email sending is temporarily unavailable. Please try again later.");
    this.name = "EmailDeliveryError";
    this.code = code;
    this.status = status;
    this.reason = reason;
  }
}
function failureReason(status, code, message = "") {
  const detail = `${code} ${message}`.toLowerCase();
  if (/quota|credit|daily_limit|monthly_limit/.test(detail))
    return "sending_limit";
  if (/api.?key|unauthorized/.test(detail) || status === 401)
    return "check_api_key";
  if (/domain|sender/.test(detail)) return "check_verified_sender";
  if (status === 403) return "check_account_permissions";
  if (status === 429) return "rate_limited";
  if (status >= 500) return "provider_unavailable";
  return "provider_rejected_request";
}

/** Shared HTTPS transport; no SMTP ports, credentials in URLs, or provider SDKs. */
function createEmailService({
  env = process.env,
  fetchImpl = globalThis.fetch,
  logger = console,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
} = {}) {
  return {
    async sendEmail({
      to,
      subject,
      html,
      text,
      kind = "transactional",
      idempotencyKey = randomUUID(),
    }) {
      const provider = (env.EMAIL_PROVIDER || "smtp2go").trim().toLowerCase();
      if (!["smtp2go", "resend"].includes(provider))
        throw new EmailDeliveryError(
          "email_provider_invalid",
          503,
          "choose_smtp2go_or_resend",
        );
      const keyName =
        provider === "smtp2go" ? "SMTP2GO_API_KEY" : "RESEND_API_KEY";
      const apiKey = env[keyName]?.trim();
      const from = (env.EMAIL_FROM || env.SENDER_EMAIL)?.trim();
      const replyTo = env.EMAIL_REPLY_TO?.trim();
      if (!apiKey || !from) {
        logger.error("email_configuration_error", {
          provider,
          missing: [!apiKey && keyName, !from && "EMAIL_FROM"].filter(Boolean),
        });
        throw new EmailDeliveryError(
          "email_configuration_missing",
          503,
          "configure_render_environment",
        );
      }
      if (typeof fetchImpl !== "function")
        throw new EmailDeliveryError(
          "email_runtime_unsupported",
          503,
          "use_node_22_or_newer",
        );
      if (
        !to ||
        typeof to !== "string" ||
        /[\r\n]/.test(to + from + subject + (replyTo || "")) ||
        !subject ||
        !html ||
        !text
      ) {
        throw new EmailDeliveryError(
          "email_payload_invalid",
          400,
          "check_email_payload",
        );
      }
      const resend = provider === "resend";
      const url = resend
        ? "https://api.resend.com/emails"
        : "https://api.smtp2go.com/v3/email/send";
      const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };
      let payload;
      if (resend) {
        headers.Authorization = `Bearer ${apiKey}`;
        headers["Idempotency-Key"] = idempotencyKey;
        payload = {
          from,
          to: [to],
          subject,
          html,
          text,
          tags: [{ name: "kind", value: kind }],
        };
        if (replyTo) payload.reply_to = replyTo;
      } else {
        headers["X-Smtp2go-Api-Key"] = apiKey;
        payload = {
          sender: from,
          to: [to],
          subject,
          html_body: html,
          text_body: text,
          fastaccept: false,
        };
        if (replyTo)
          payload.custom_headers = [{ header: "Reply-To", value: replyTo }];
      }
      let lastError;
      // SMTP2GO has no documented idempotency contract. Do not retry ambiguous sends.
      const attempts = resend ? 2 : 1;
      for (let attempt = 0; attempt < attempts; attempt++) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
        let retry = false;
        try {
          const response = await fetchImpl(url, {
            method: "POST",
            signal: controller.signal,
            headers,
            body: JSON.stringify(payload),
          });
          const data = await response.json().catch(() => ({}));
          const accepted = resend
            ? response.ok && typeof data.id === "string" && data.id
            : response.ok &&
              data.data?.succeeded === 1 &&
              data.data?.failed === 0 &&
              data.data?.email_id;
          if (accepted) {
            const id = resend ? data.id : data.data.email_id;
            logger.info("email_accepted", { provider, kind, messageId: id });
            return { provider, id };
          }
          const rawCode = resend
            ? data.name
            : data.data?.error_code || data.error_code;
          const code =
            typeof rawCode === "string" && SAFE_CODE.test(rawCode)
              ? rawCode
              : "email_provider_error";
          const detail = resend
            ? data.message
            : data.data?.error ||
              data.error ||
              JSON.stringify(data.data?.failures || []);
          lastError = new EmailDeliveryError(
            code,
            response.status,
            failureReason(response.status, code, detail),
          );
          retry = response.status >= 500;
        } catch {
          // Never retain raw request errors; they may contain API keys, recipient data, or OTPs.
          lastError = new EmailDeliveryError(
            "email_network_error",
            503,
            "provider_connection_or_timeout",
          );
          retry = true;
        } finally {
          clearTimeout(timer);
        }
        if (!retry || attempt === attempts - 1) break;
        await sleep(250);
      }
      logger.error("email_failed", {
        provider,
        kind,
        status: lastError.status,
        code: lastError.code,
        reason: lastError.reason,
      });
      throw lastError;
    },
  };
}
const service = createEmailService();
module.exports = {
  createEmailService,
  EmailDeliveryError,
  sendEmail: (message) => service.sendEmail(message),
};
