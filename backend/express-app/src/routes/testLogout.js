const jwt = require("jsonwebtoken");
const app = require("../app");
const pool = require("../config/db");
const { registerUser } = require("../services/authService");

const password = "Logout-test-88";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function testLogout() {
  const stamp = Date.now();
  const email = `member1.logout.${stamp}@example.com`;
  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const user = await registerUser({
      name: "Logout User",
      email,
      password,
    });
    const token = jwt.sign({ sub: String(user.id) }, process.env.JWT_SECRET, {
      expiresIn: "8h",
    });

    const missing = await fetch(`${baseUrl}/api/auth/logout`, { method: "POST" });
    assert(missing.status === 401, "logout without a token should return 401");
    console.log("missing token: 401");

    const loggedOut = await fetch(`${baseUrl}/api/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await loggedOut.json();
    assert(loggedOut.status === 200, "logout with a valid token should return 200");
    assert(
      body.message === "Logged out. Discard this token on the client.",
      "logout message changed",
    );
    assert(!JSON.stringify(body).includes("password_hash"), "logout returned password_hash");
    assert(!JSON.stringify(body).includes(token), "logout returned the token");
    console.log("valid token: 200");

    const stillValid = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert(stillValid.status === 200, "logout invalidated the token on the server");
    console.log("token still valid until expiry: yes");
    console.log("Logout tests passed.");
  } catch (error) {
    console.error("Logout tests failed:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.query("DELETE FROM users WHERE email = ?", [email]);
    await new Promise((resolve) => server.close(resolve));
    await pool.end();
  }
}

testLogout();
