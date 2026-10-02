const bcrypt = require("bcrypt");
const app = require("../app");
const pool = require("../config/db");
const { registerUser } = require("../services/authService");
const { findUserByEmail } = require("../services/userRepository");
const { findSettingsByUserId } = require("../services/userSettingsRepository");

const password = "Register-test-88";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertNoSecrets(payload) {
  const raw = JSON.stringify(payload);
  assert(!raw.includes("password_hash"), "response included password_hash");
  assert(!raw.includes(password), "response included the plaintext password");
}

async function postRegister(baseUrl, body) {
  const response = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json();
  return { status: response.status, body: payload };
}

async function deleteUserByEmail(email) {
  await pool.query("DELETE FROM users WHERE email = ?", [email]);
}

async function testRegister() {
  const stamp = Date.now();
  const email = `member1.register.${stamp}@example.com`;
  const rollbackEmail = `member1.rollback.${stamp}@example.com`;
  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const missing = await postRegister(baseUrl, {});
    assert(missing.status === 400, "missing fields should return 400");
    assert(missing.body.errors.name, "missing name error");
    assert(missing.body.errors.email, "missing email error");
    assert(missing.body.errors.password, "missing password error");
    assertNoSecrets(missing.body);
    console.log("missing fields: 400");

    const invalidEmail = await postRegister(baseUrl, {
      name: "Ada Lovelace",
      email: "not-an-email",
      password,
    });
    assert(invalidEmail.status === 400, "invalid email should return 400");
    assert(invalidEmail.body.errors.email, "invalid email error");
    assertNoSecrets(invalidEmail.body);
    console.log("invalid email: 400");

    const shortPassword = await postRegister(baseUrl, {
      name: "Ada Lovelace",
      email,
      password: "short1",
    });
    assert(shortPassword.status === 400, "short password should return 400");
    assert(shortPassword.body.errors.password, "short password error");
    assertNoSecrets(shortPassword.body);
    console.log("invalid password: 400");

    const longName = await postRegister(baseUrl, {
      name: "A".repeat(101),
      email,
      password,
    });
    assert(longName.status === 400, "long name should return 400");
    assert(longName.body.errors.name, "long name error");
    console.log("name over 100 characters: 400");

    const created = await postRegister(baseUrl, {
      name: "  Ada Lovelace  ",
      email: `  Member1.Register.${stamp}@Example.com  `,
      password,
    });
    assert(created.status === 201, "valid registration should return 201");
    assert(created.body.user.email === email, "email was not normalized");
    assert(created.body.user.name === "Ada Lovelace", "name was not trimmed");
    assertNoSecrets(created.body);
    console.log("valid registration: 201");

    const stored = await findUserByEmail(email);
    assert(stored, "user row was not created");
    assert(stored.password_hash !== password, "plaintext password was stored");
    assert(stored.password_hash.startsWith("$2"), "password was not bcrypt-hashed");
    assert(await bcrypt.compare(password, stored.password_hash), "bcrypt compare failed");
    console.log("password stored as bcrypt hash: yes");
    console.log("password_hash returned by API: no");

    const settings = await findSettingsByUserId(stored.id);
    assert(settings, "default settings were not created");
    const isOn = (value) => value === 1 || value === true;
    assert(isOn(settings.email_notifications), "email notifications default mismatch");
    assert(isOn(settings.renewal_reminders), "renewal reminders default mismatch");
    assert(settings.renewal_lead_days === 7, "renewal lead days default mismatch");
    assert(isOn(settings.overdue_alerts), "overdue alerts default mismatch");
    assert(isOn(settings.weekly_summary), "weekly summary default mismatch");
    assert(settings.theme === "light", "theme default mismatch");
    assert(settings.currency === "AUD", "currency default mismatch");
    assert(settings.default_status === "active", "default status mismatch");
    assert(settings.date_format === "DD/MM/YYYY", "date format default mismatch");
    console.log("default settings created: yes");

    const duplicate = await postRegister(baseUrl, {
      name: "Ada Lovelace",
      email: `MEMBER1.REGISTER.${stamp}@EXAMPLE.COM`,
      password,
    });
    assert(duplicate.status === 409, "duplicate email should return 409");
    assertNoSecrets(duplicate.body);
    console.log("duplicate email: 409");

    let rollbackThrew = false;
    try {
      await registerUser(
        {
          name: "Rollback User",
          email: rollbackEmail,
          password,
        },
        {
          createDefaultSettings: async () => {
            throw new Error("settings failed");
          },
        },
      );
    } catch (error) {
      rollbackThrew = error.message === "settings failed";
    }
    const rolledBack = await findUserByEmail(rollbackEmail);
    assert(rollbackThrew, "settings failure did not abort registration");
    assert(rolledBack === null, "user row remained after settings failure");
    console.log("settings failure rolled back user: yes");

    await deleteUserByEmail(email);
    const userGone = await findUserByEmail(email);
    const settingsGone = await findSettingsByUserId(stored.id);
    assert(userGone === null, "test user was not deleted");
    assert(settingsGone === null, "test settings were not deleted");
    console.log("test data cleaned up: yes");
    console.log("Registration tests passed.");
  } catch (error) {
    console.error("Registration tests failed:", error.message);
    process.exitCode = 1;
    await deleteUserByEmail(email);
    await deleteUserByEmail(rollbackEmail);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await pool.end();
  }
}

testRegister();
