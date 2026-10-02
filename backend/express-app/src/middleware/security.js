const DEFAULT_ORIGINS = ["http://127.0.0.1:5173", "http://localhost:5173"];

function allowedOrigins() {
  const configured = process.env.FRONTEND_ORIGIN;
  if (typeof configured !== "string" || configured.trim() === "") return DEFAULT_ORIGINS;
  return configured
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function securityHeaders(_req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-DNS-Prefetch-Control", "off");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");
  next();
}

function restrictCors(req, res, next) {
  const origin = req.headers.origin;
  if (typeof origin === "string" && allowedOrigins().includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }

  if (req.method === "OPTIONS") {
    const allowed = typeof origin === "string" && allowedOrigins().includes(origin);
    return res.sendStatus(allowed ? 204 : 403);
  }

  return next();
}

module.exports = {
  securityHeaders,
  restrictCors,
};
