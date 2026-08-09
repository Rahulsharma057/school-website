// Requires: npm install express-rate-limit
const rateLimit = require("express-rate-limit");

// FIX: the public submit route (and CSV export) had no rate limiting —
// a script could hammer /form-entries and spam a school's admin table,
// or repeatedly trigger CSV export. These are intentionally generous
// (real users, not APIs) but stop scripted abuse.

// 20 submissions per IP per 15 minutes across all forms
const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many submissions, please try again later." },
});

// 10 CSV exports per IP per hour (export is DB/CPU heavy)
const exportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many export requests, please try again later." },
});

module.exports = { submitLimiter, exportLimiter };
