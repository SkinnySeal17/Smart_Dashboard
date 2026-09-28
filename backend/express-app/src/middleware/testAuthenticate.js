const path = require("path");
const express = require("express");
const jwt = require("jsonwebtoken");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const authenticate = require("./authenticate");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function testApp() {
  const app = express();
  app.get("/protected", authenticate, (req, res) => {
    res.status(200).json({ id: req.user.id });
  });
  return app;
}

async function getProtected(baseUrl, authorization) {
  const headers = {};
  if (authorization !== undefined) headers.Authorization = authorization;
  const response = await fetch(`${baseUrl}/protected?userId=999`, { headers });
  const body = await response.json();
  return { status: response.status, body };
}

async function testAuthenticate() {
  const secret = process.env.JWT_SECRET;
  assert(secret, "JWT_SECRET is missing");

  const app = testApp();
  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;
  const validToken = jwt.sign({ sub: "5" }, secret, { expiresIn: "8h" });

  try {
    const missing = await getProtected(baseUrl);
    assert(missing.status === 401, "missing token should return 401");
    assert(missing.body.id === undefined, "missing token used a client user id");
    console.log("missing token: 401");

    const malformed = await getProtected(baseUrl, "Basic abc");
    assert(malformed.status === 401, "malformed header should return 401");
    assert(malformed.body.message === "Authentication required.", "malformed header message changed");
    console.log("malformed token: 401");

    const invalid = await getProtected(
      baseUrl,
      `Bearer ${jwt.sign({ sub: "5" }, "wrong-secret", { expiresIn: "8h" })}`,
    );
    assert(invalid.status === 401, "invalid token should return 401");
    assert(invalid.body.message === "Invalid or expired token.", "invalid token message changed");
    console.log("invalid token: 401");

    const expiredToken = jwt.sign(
      { sub: "5", exp: Math.floor(Date.now() / 1000) - 60 },
      secret,
    );
    const expired = await getProtected(baseUrl, `Bearer ${expiredToken}`);
    assert(expired.status === 401, "expired token should return 401");
    assert(expired.body.message === "Invalid or expired token.", "expired token message changed");
    console.log("expired token: 401");

    const valid = await getProtected(baseUrl, `Bearer ${validToken}`);
    assert(valid.status === 200, "valid token should return 200");
    assert(valid.body.id === 5, "req.user.id did not come from the token");
    console.log("valid token: 200, req.user.id comes from the token");
    console.log("client userId query ignored: yes");
    console.log("Authentication middleware tests passed.");
  } catch (error) {
    console.error("Authentication middleware tests failed:", error.message);
    process.exitCode = 1;
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

testAuthenticate();
