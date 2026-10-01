const jwt = require("jsonwebtoken");

function authenticationRequired(res) {
  return res.status(401).json({ message: "Authentication required." });
}

function invalidToken(res) {
  return res.status(401).json({ message: "Invalid or expired token." });
}

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (typeof header !== "string" || header.trim() === "") {
    return authenticationRequired(res);
  }

  const parts = header.trim().split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer" || parts[1] === "") {
    return authenticationRequired(res);
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ message: "Authentication failed." });
  }

  try {
    const payload = jwt.verify(parts[1], secret, { algorithms: ["HS256"] });
    const userId = Number(payload.sub);
    if (!Number.isInteger(userId) || userId <= 0) {
      return invalidToken(res);
    }

    // Identity comes only from the verified token, not from the request body or query.
    req.user = { id: userId };
    return next();
  } catch (_error) {
    return invalidToken(res);
  }
}

module.exports = authenticate;
