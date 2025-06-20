const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 10000, // 1000 req/ip in 15 min
  message: {
    status: 429,
    message: "Too many requests from this IP, please try again after 15 minutes",
  },
});

module.exports = limiter;