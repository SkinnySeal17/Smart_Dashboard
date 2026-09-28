const jwt = require("jsonwebtoken");
const app = require("../app");
const pool = require("../config/db");
const { registerUser } = require("../services/authService");

const password = "me-test-88";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertNoSecrets(payload) {
  const raw = JSON.stringify(payload);
  assert(!raw.includes("password_hash"), "response included password_hash");
  assert(!raw.includes(password), "response included the plaintext password");
  assert(!raw.includes(process.env.JWT_SECRET), "response included the JWT secret");
}

async function getMe(baseUrl, authorization) {
  const headers = {};
  if (authorization !== undefined) headers.Authorization = authorization;
  const response = await fetch(`${baseUrl}/api/auth/me?userId=999999999`, { headers });
  const body = await response.json();
  return { status: response.status, body };
}

async function testMe() {
  const stamp = Date.now();
  const email = `member1.me.${stamp}@example.com`;
  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const user = await registerUser({
      name: "Me User",
      email,
      password,
    });
    const token = jwt.sign({ sub: String(user.id) }, process.env.JWT_SECRET, {
      expiresIn: "8h",
    });

    const valid = await getMe(baseUrl, `Bearer ${token}`);
    assert(valid.status === 200, "valid token should return 200");
    assert(valid.body.user.id === user.id, "me returned the wrong user");
    assert(valid.body.user.email === email, "me returned the wrong email");
    assert(valid.body.user.name === "Me User", "me returned the wrong name");
    assert(valid.body.user.id !== 999999999, "me trusted the query user id");
    assertNoSecrets(valid.body);
    console.log("valid token: 200");

    const missing = await getMe(baseUrl);
    assert(missing.status === 401, "missing token should return 401");
    assert(missing.body.user === undefined, "missing token returned a user");
    console.log("missing token: 401");

    const invalid = await getMe(
      baseUrl,
      `Bearer ${jwt.sign({ sub: String(user.id) }, "wrong-secret", { expiresIn: "8h" })}`,
    );
    assert(invalid.status === 401, "invalid token should return 401");
    assert(invalid.body.message === "Invalid or expired token.", "invalid token message changed");
    console.log("invalid token: 401");

    const expiredToken = jwt.sign(
      { sub: String(user.id), exp: Math.floor(Date.now() / 1000) - 60 },
      process.env.JWT_SECRET,
    );
    const expired = await getMe(baseUrl, `Bearer ${expiredToken}`);
    assert(expired.status === 401, "expired token should return 401");
    assert(expired.body.message === "Invalid or expired token.", "expired token message changed");
    console.log("expired token: 401");

    const unknownToken = jwt.sign({ sub: "999999999" }, process.env.JWT_SECRET, {
      expiresIn: "8h",
    });
    const unknown = await getMe(baseUrl, `Bearer ${unknownToken}`);
    assert(unknown.status === 401, "nonexistent user should return 401");
    assert(unknown.body.user === undefined, "nonexistent user returned a profile");
    assertNoSecrets(unknown.body);
    console.log("nonexistent user: 401");
    console.log("Current user tests passed.");
  } catch (error) {
    console.error("Current user tests failed:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.query("DELETE FROM users WHERE email = ?", [email]);
    await new Promise((resolve) => server.close(resolve));
    await pool.end();
  }
}

testMe();
