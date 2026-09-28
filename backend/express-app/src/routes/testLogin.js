const jwt = require("jsonwebtoken");
const app = require("../app");
const pool = require("../config/db");
const { registerUser, TOKEN_EXPIRES_IN } = require("../services/authService");

const password = "login-test-88";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertNoSecrets(payload) {
  const raw = JSON.stringify(payload);
  assert(!raw.includes("password_hash"), "response included password_hash");
  assert(!raw.includes(password), "response included the plaintext password");
  assert(!raw.includes(process.env.JWT_SECRET), "response included the JWT secret");
}

async function postLogin(baseUrl, body) {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json();
  return { status: response.status, body: payload };
}

async function testLogin() {
  const stamp = Date.now();
  const email = `member1.login.${stamp}@example.com`;
  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const user = await registerUser({
      name: "Login User",
      email: `  Member1.Login.${stamp}@Example.com  `,
      password,
    });

    const missing = await postLogin(baseUrl, {});
    assert(missing.status === 400, "malformed login should return 400");
    assert(missing.body.errors.email, "missing email error");
    assert(missing.body.errors.password, "missing password error");
    assertNoSecrets(missing.body);
    console.log("malformed request: 400");

    const invalidEmail = await postLogin(baseUrl, {
      email: "not-an-email",
      password,
    });
    assert(invalidEmail.status === 400, "invalid email should return 400");
    assert(invalidEmail.body.errors.email, "invalid email error");
    assertNoSecrets(invalidEmail.body);
    console.log("invalid email: 400");

    const success = await postLogin(baseUrl, {
      email: `MEMBER1.LOGIN.${stamp}@EXAMPLE.COM`,
      password,
    });
    assert(success.status === 200, "correct credentials should return 200");
    assert(success.body.user.id === user.id, "login returned the wrong user");
    assert(success.body.user.email === email, "login email was not normalized");
    assert(typeof success.body.token === "string" && success.body.token.length > 0, "token missing");
    assertNoSecrets(success.body);
    console.log("correct credentials: 200");

    const payload = jwt.verify(success.body.token, process.env.JWT_SECRET);
    assert(payload.sub === String(user.id), "token subject is not the user id");
    assert(payload.exp - payload.iat === 8 * 60 * 60, "token expiry is not 8 hours");
    assert(!Object.prototype.hasOwnProperty.call(payload, "password"), "token contains a password");
    assert(!Object.prototype.hasOwnProperty.call(payload, "password_hash"), "token contains password_hash");
    assert(!Object.prototype.hasOwnProperty.call(payload, "email"), "token contains email");
    console.log(`token generated: yes (${TOKEN_EXPIRES_IN}, subject is user id)`);

    const wrongPassword = await postLogin(baseUrl, {
      email,
      password: "wrong-password-88",
    });
    const unknownEmail = await postLogin(baseUrl, {
      email: `missing.${stamp}@example.com`,
      password,
    });
    assert(wrongPassword.status === 401, "incorrect password should return 401");
    assert(unknownEmail.status === 401, "nonexistent email should return 401");
    assert(
      wrongPassword.body.message === "Invalid email or password.",
      "incorrect password message changed",
    );
    assert(
      JSON.stringify(wrongPassword.body) === JSON.stringify(unknownEmail.body),
      "unknown email was distinguished from a wrong password",
    );
    assertNoSecrets(wrongPassword.body);
    assertNoSecrets(unknownEmail.body);
    console.log("incorrect password: 401");
    console.log("nonexistent email: 401, same message");
    console.log("Login tests passed.");
  } catch (error) {
    console.error("Login tests failed:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.query("DELETE FROM users WHERE email = ?", [email]);
    await new Promise((resolve) => server.close(resolve));
    await pool.end();
  }
}

testLogin();
