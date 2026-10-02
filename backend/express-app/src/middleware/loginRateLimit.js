const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const attempts = new Map();

function clientKey(req) {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const ip = req.ip || req.socket?.remoteAddress || "unknown";
  return `${ip}\n${email}`;
}

function pruneExpired(now) {
  if (attempts.size < 1000) return;
  for (const [key, entry] of attempts) {
    if (now - entry.start >= WINDOW_MS) attempts.delete(key);
  }
}

function recordFailure(key) {
  const now = Date.now();
  pruneExpired(now);
  const current = attempts.get(key);
  if (!current || now - current.start >= WINDOW_MS) {
    attempts.set(key, { start: now, count: 1 });
    return;
  }
  current.count += 1;
}

function loginRateLimit(req, res, next) {
  const key = clientKey(req);
  const current = attempts.get(key);
  const now = Date.now();
  if (current && now - current.start < WINDOW_MS && current.count >= MAX_FAILURES) {
    const retryAfter = Math.ceil((WINDOW_MS - (now - current.start)) / 1000);
    res.setHeader("Retry-After", String(retryAfter));
    return res.status(429).json({ message: "Too many login attempts. Try again later." });
  }

  res.on("finish", () => {
    if (res.statusCode === 401) recordFailure(key);
    else if (res.statusCode >= 200 && res.statusCode < 300) attempts.delete(key);
  });

  return next();
}

module.exports = {
  loginRateLimit,
  MAX_FAILURES,
  WINDOW_MS,
};
