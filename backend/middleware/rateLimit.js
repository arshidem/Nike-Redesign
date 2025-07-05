const rateLimit = require("express-rate-limit");

exports.otpRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // Limit each IP to 5 OTP requests per windowMs
  message: {
    message: "Too many OTP requests. Please try again later.",
  },
});
