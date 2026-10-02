const app = require("../app");
const pool = require("../config/db");
const { MAX_FAILURES } = require("../middleware/loginRateLimit");

const password = "Secure-test-88";
const nextPassword = "Secure-new-88";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertSafe(payload, extras = []) {
  const raw = JSON.stringify(payload);
  for (const secret of ["password_hash", password, nextPassword, process.env.JWT_SECRET, "ER_", "stack", ...extras]) {
    assert(secret === undefined || !raw.includes(secret), "response included sensitive data");
  }
}

async function request(baseUrl, method, path, { token, body, origin } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  if (origin) headers.Origin = origin;
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch (_error) {
    payload = { raw: text };
  }
  return { status: response.status, body: payload, headers: response.headers, text };
}

async function testSecurity() {
  const stamp = Date.now();
  const emailA = `member1.security.a.${stamp}@example.com`;
  const emailB = `member1.security.b.${stamp}@example.com`;
  const injectionName = "Robert'); DROP TABLE users;--";
  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const weakCases = [
      { password: "short1", label: "short" },
      { password: "alllower1!", label: "missing uppercase" },
      { password: "ALLUPPER1!", label: "missing lowercase" },
      { password: "NoNumber!", label: "missing number" },
      { password: "NoSymbol1a", label: "missing symbol" },
      { password: "Password1!", label: "common" },
    ];
    for (const item of weakCases) {
      const rejected = await request(baseUrl, "POST", "/api/auth/register", {
        body: { name: "Security User", email: emailA, password: item.password },
      });
      assert(rejected.status === 400, `${item.label} password should return 400`);
      assert(rejected.body.errors.password, `${item.label} password error missing`);
      assertSafe(rejected.body, [item.password]);
    }
    console.log("weak passwords: 400");

    const emailPassword = await request(baseUrl, "POST", "/api/auth/register", {
      body: { name: "Security User", email: "Abcd1234!@example.com", password: "Abcd1234!" },
    });
    assert(emailPassword.status === 400, "password matching the email should return 400");
    assertSafe(emailPassword.body, ["Abcd1234!"]);
    console.log("password matching email: 400");

    const createdA = await request(baseUrl, "POST", "/api/auth/register", {
      body: { name: injectionName, email: emailA, password, user_id: 1 },
    });
    assert(createdA.status === 201, "registration with SQL-like name should return 201");
    assert(createdA.body.user.name === injectionName, "SQL-like name was not stored as text");
    assert(!Object.prototype.hasOwnProperty.call(createdA.body.user, "password_hash"), "user included password_hash");
    assertSafe(createdA.body);
    console.log("SQL-like name stored as text: yes");

    const createdB = await request(baseUrl, "POST", "/api/auth/register", {
      body: { name: "Other User", email: emailB, password },
    });
    assert(createdB.status === 201, "second registration failed");

    const injectionLogin = await request(baseUrl, "POST", "/api/auth/login", {
      body: { email: "' OR 1=1 --", password },
    });
    const unknownLogin = await request(baseUrl, "POST", "/api/auth/login", {
      body: { email: `missing.${stamp}@example.com`, password: "Wrong-pass-88" },
    });
    const wrongLogin = await request(baseUrl, "POST", "/api/auth/login", {
      body: { email: emailA, password: "Wrong-pass-88" },
    });
    assert(injectionLogin.status === 400, "SQL-like email should be rejected as invalid input");
    assert(unknownLogin.status === 401, "unknown email should return 401");
    assert(wrongLogin.status === 401, "wrong password should return 401");
    assert(
      JSON.stringify(unknownLogin.body) === JSON.stringify(wrongLogin.body),
      "login errors distinguish unknown emails from wrong passwords",
    );
    assert(unknownLogin.body.message === "Invalid email or password.", "login error is not generic");
    assertSafe(unknownLogin.body, ["Wrong-pass-88", emailA]);
    assertSafe(wrongLogin.body, ["Wrong-pass-88", emailA]);
    assert(!injectionLogin.text.includes("ER_"), "SQL error was returned");
    console.log("generic login errors: yes");

    for (let attempt = 2; attempt <= MAX_FAILURES; attempt += 1) {
      const failed = await request(baseUrl, "POST", "/api/auth/login", {
        body: { email: emailA, password: "Wrong-pass-88" },
      });
      assert(failed.status === 401, `failed login ${attempt} should still return 401`);
    }
    const locked = await request(baseUrl, "POST", "/api/auth/login", {
      body: { email: emailA, password },
    });
    const lockedUnknown = await request(baseUrl, "POST", "/api/auth/login", {
      body: { email: emailA, password: "Wrong-pass-88" },
    });
    assert(locked.status === 429, "repeated failures should return 429");
    assert(locked.body.message === "Too many login attempts. Try again later.", "lockout message changed");
    assert(JSON.stringify(locked.body) === JSON.stringify(lockedUnknown.body), "lockout reveals whether the password was correct");
    assertSafe(locked.body, [emailA]);
    console.log("repeated failed logins: 429");

    const otherLogin = await request(baseUrl, "POST", "/api/auth/login", {
      body: { email: emailB, password },
    });
    assert(otherLogin.status === 200, "lockout blocked a different account");
    assertSafe(otherLogin.body);
    const tokenB = otherLogin.body.token;

    const loginA = await request(baseUrl, "POST", "/api/auth/login", {
      body: { email: `other.${stamp}@example.com`, password },
    });
    assert(loginA.status === 401, "a different email should not reuse the locked counter");
    const freshA = await request(baseUrl, "POST", "/api/auth/login", {
      body: { email: emailA.toUpperCase(), password: "Still-wrong-88" },
    });
    assert(freshA.status === 429, "email case should not bypass the lockout");

    const registeredAgain = await request(baseUrl, "POST", "/api/auth/register", {
      body: { name: "Temp User", email: `member1.security.c.${stamp}@example.com`, password },
    });
    assert(registeredAgain.status === 201, "could not register the unlocked comparison user");
    const tokenALogin = await request(baseUrl, "POST", "/api/auth/login", {
      body: { email: `member1.security.c.${stamp}@example.com`, password },
    });
    assert(tokenALogin.status === 200, "could not log in the comparison user");
    const tokenC = tokenALogin.body.token;

    const profile = await request(baseUrl, "GET", `/api/profile?userId=${createdB.body.user.id}`, {
      token: tokenC,
    });
    assert(profile.status === 200, "profile should return 200");
    assert(profile.body.user.id === registeredAgain.body.user.id, "profile used another user's id");
    assert(profile.body.user.email === `member1.security.c.${stamp}@example.com`, "profile returned another email");
    assertSafe(profile.body);
    console.log("profile ignores another user id: yes");

    const stolen = await request(baseUrl, "PUT", "/api/profile", {
      token: tokenC,
      body: {
        user_id: createdB.body.user.id,
        name: "Hijacked",
        email: emailB,
      },
    });
    assert(stolen.status === 409, "changing to another user's email should return 409");
    const otherProfile = await request(baseUrl, "GET", "/api/profile", { token: tokenB });
    assert(otherProfile.body.user.name === "Other User", "profile update changed the other user");
    assert(otherProfile.body.user.email === emailB, "profile update changed the other email");
    console.log("profile update cannot take another account: yes");

    const badPassword = await request(baseUrl, "PUT", "/api/profile/password", {
      token: tokenC,
      body: { currentPassword: password, newPassword: "weakpass", user_id: createdB.body.user.id },
    });
    assert(badPassword.status === 400, "weak replacement password should return 400");
    assertSafe(badPassword.body, ["weakpass"]);

    const changed = await request(baseUrl, "PUT", "/api/profile/password", {
      token: tokenC,
      body: { currentPassword: password, newPassword: nextPassword, user_id: createdB.body.user.id },
    });
    assert(changed.status === 200, "password change should return 200");
    assertSafe(changed.body);
    const otherStillWorks = await request(baseUrl, "POST", "/api/auth/login", {
      body: { email: emailB, password },
    });
    assert(otherStillWorks.status === 200, "password change affected the other user");
    console.log("password change stays on the signed-in user: yes");

    const injectedSettings = await request(baseUrl, "PUT", "/api/settings", {
      token: tokenC,
      body: {
        user_id: createdB.body.user.id,
        theme: "light' OR '1'='1",
        currency: "' OR 1=1",
        date_format: "DD/MM/YYYY; DROP TABLE users",
      },
    });
    assert(injectedSettings.status === 400, "SQL-like settings should return 400");
    assert(!injectedSettings.text.includes("ER_"), "settings error included a database failure");
    const ownSettings = await request(baseUrl, "GET", `/api/settings?userId=${createdB.body.user.id}`, {
      token: tokenC,
    });
    assert(ownSettings.body.settings.user_id === registeredAgain.body.user.id, "settings used another user's id");
    assert(ownSettings.body.settings.theme === "light", "invalid theme was saved");
    assertSafe(ownSettings.body);
    const untouched = await request(baseUrl, "GET", "/api/settings", { token: tokenB });
    assert(untouched.body.settings.theme === "light", "settings changed the other user");
    assert(untouched.body.settings.user_id === createdB.body.user.id, "other settings row was reassigned");
    console.log("settings stay on the signed-in user: yes");

    const headers = createdA.headers;
    assert(!headers.get("x-powered-by"), "x-powered-by is still present");
    assert(headers.get("x-content-type-options") === "nosniff", "nosniff header missing");
    assert(headers.get("x-frame-options") === "DENY", "frame denial header missing");
    const evil = await request(baseUrl, "GET", "/api/auth/me", { origin: "https://evil.example" });
    assert(evil.headers.get("access-control-allow-origin") !== "https://evil.example", "untrusted origin was allowed");
    const trusted = await request(baseUrl, "POST", "/api/auth/login", {
      origin: "http://127.0.0.1:5173",
      body: { email: emailB, password },
    });
    assert(
      trusted.headers.get("access-control-allow-origin") === "http://127.0.0.1:5173",
      "configured frontend origin was blocked",
    );
    console.log("security headers and CORS: yes");
    console.log("Security tests passed.");
  } catch (error) {
    console.error("Security tests failed:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.query("DELETE FROM users WHERE email IN (?, ?, ?, ?)", [
      emailA,
      emailB,
      "Abcd1234!@example.com",
      `member1.security.c.${stamp}@example.com`,
    ]);
    await new Promise((resolve) => server.close(resolve));
    await pool.end();
  }
}

testSecurity();
