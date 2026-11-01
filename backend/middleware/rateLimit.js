const rateLimit = require("express-rate-limit");

// Per-IP: max 5 OTP requests per 10 minutes
exports.otpRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: {
    message: "Too many OTP requests. Please try again later.",
  },
});

// Per-email: max 3 OTP requests per 10 minutes
// Prevents spamming a specific email from different IPs
const emailOtpTracker = new Map(); // { email -> { count, resetAt } }

exports.emailOtpRateLimiter = (req, res, next) => {
  const email = req.body?.email?.toLowerCase()?.trim();
  if (!email) return next();

  const now = Date.now();
  const windowMs = 10 * 60 * 1000; // 10 min
  const maxPerEmail = 3;

  const record = emailOtpTracker.get(email);

  if (!record || now > record.resetAt) {
    // First request or window expired — reset
    emailOtpTracker.set(email, { count: 1, resetAt: now + windowMs });
    return next();
  }

  if (record.count >= maxPerEmail) {
    const retryAfterSec = Math.ceil((record.resetAt - now) / 1000);
    return res.status(429).json({
      message: `Too many OTP requests for this email. Try again in ${Math.ceil(retryAfterSec / 60)} minute(s).`,
    });
  }

  record.count += 1;
  next();
};
