const app = require("../app");
const pool = require("../config/db");

const password = "Account-test-88";
const nextPassword = "Account-new-88";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertNoSecrets(payload) {
  const raw = JSON.stringify(payload);
  assert(!raw.includes("password_hash"), "response included password_hash");
  assert(!raw.includes(password), "response included the current password");
  assert(!raw.includes(nextPassword), "response included the new password");
}

async function request(baseUrl, method, path, { token, body } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = await response.json();
  return { status: response.status, body: payload };
}

async function registerAndLogin(baseUrl, name, email) {
  const created = await request(baseUrl, "POST", "/api/auth/register", {
    body: { name, email, password },
  });
  assert(created.status === 201, `could not register ${email}`);
  const loggedIn = await request(baseUrl, "POST", "/api/auth/login", {
    body: { email, password },
  });
  assert(loggedIn.status === 200, `could not log in ${email}`);
  return { id: created.body.user.id, token: loggedIn.body.token };
}

async function testAccount() {
  const stamp = Date.now();
  const emailA = `member1.profile.a.${stamp}@example.com`;
  const emailB = `member1.profile.b.${stamp}@example.com`;
  const renamedEmail = `member1.profile.renamed.${stamp}@example.com`;
  const emails = [emailA, emailB, renamedEmail];
  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const userA = await registerAndLogin(baseUrl, "Account A", emailA);
    const userB = await registerAndLogin(baseUrl, "Account B", emailB);

    const missing = await request(baseUrl, "GET", "/api/profile");
    assert(missing.status === 401, "profile without a token should return 401");
    console.log("profile missing token: 401");

    const profileA = await request(
      baseUrl,
      "GET",
      `/api/profile?userId=${userB.id}`,
      { token: userA.token },
    );
    assert(profileA.status === 200, "profile should return 200");
    assert(profileA.body.user.id === userA.id, "profile used a client user id");
    assert(profileA.body.user.email === emailA, "profile returned the wrong email");
    assertNoSecrets(profileA.body);
    console.log("get profile: 200, own account only");

    const renamed = await request(baseUrl, "PUT", "/api/profile", {
      token: userA.token,
      body: { name: "  Account A Updated  ", email: `  ${renamedEmail.toUpperCase()}  `, user_id: userB.id },
    });
    assert(renamed.status === 200, "profile update should return 200");
    assert(renamed.body.user.id === userA.id, "profile update changed the user id");
    assert(renamed.body.user.name === "Account A Updated", "profile name was not trimmed");
    assert(renamed.body.user.email === renamedEmail, "profile email was not normalized");
    assertNoSecrets(renamed.body);
    console.log("update profile: 200");

    const otherProfile = await request(baseUrl, "GET", "/api/profile", { token: userB.token });
    assert(otherProfile.body.user.email === emailB, "profile update changed the other user");
    console.log("other user's profile unchanged: yes");

    const duplicate = await request(baseUrl, "PUT", "/api/profile", {
      token: userA.token,
      body: { name: "Account A Updated", email: emailB.toUpperCase() },
    });
    assert(duplicate.status === 409, "duplicate profile email should return 409");
    assertNoSecrets(duplicate.body);
    console.log("duplicate profile email: 409");

    const invalidProfile = await request(baseUrl, "PUT", "/api/profile", {
      token: userA.token,
      body: { name: "", email: "not-an-email" },
    });
    assert(invalidProfile.status === 400, "invalid profile should return 400");
    console.log("invalid profile: 400");

    const badPassword = await request(baseUrl, "PUT", "/api/profile/password", {
      token: userA.token,
      body: { currentPassword: "wrong-password-88", newPassword: nextPassword },
    });
    assert(badPassword.status === 401, "wrong current password should return 401");
    assertNoSecrets(badPassword.body);
    console.log("wrong current password: 401");

    const shortPassword = await request(baseUrl, "PUT", "/api/profile/password", {
      token: userA.token,
      body: { currentPassword: password, newPassword: "short1" },
    });
    assert(shortPassword.status === 400, "invalid new password should return 400");
    console.log("invalid new password: 400");

    const changed = await request(baseUrl, "PUT", "/api/profile/password", {
      token: userA.token,
      body: { currentPassword: password, newPassword: nextPassword, user_id: userB.id },
    });
    assert(changed.status === 200, "password change should return 200");
    assert(changed.body.message === "Password updated.", "password message changed");
    assertNoSecrets(changed.body);
    console.log("change password: 200");

    const oldLogin = await request(baseUrl, "POST", "/api/auth/login", {
      body: { email: renamedEmail, password },
    });
    const newLogin = await request(baseUrl, "POST", "/api/auth/login", {
      body: { email: renamedEmail, password: nextPassword },
    });
    const otherLogin = await request(baseUrl, "POST", "/api/auth/login", {
      body: { email: emailB, password },
    });
    assert(oldLogin.status === 401, "old password should no longer work");
    assert(newLogin.status === 200, "new password should work");
    assert(otherLogin.status === 200, "password change affected the other user");
    console.log("password applies only to the signed-in user: yes");

    const settingsA = await request(
      baseUrl,
      "GET",
      `/api/settings?userId=${userB.id}`,
      { token: userA.token },
    );
    assert(settingsA.status === 200, "settings should return 200");
    assert(settingsA.body.settings.user_id === userA.id, "settings used a client user id");
    assert(settingsA.body.settings.email_notifications === true, "email notifications default mismatch");
    assert(settingsA.body.settings.renewal_reminders === true, "renewal reminders default mismatch");
    assert(settingsA.body.settings.renewal_lead_days === 7, "lead days default mismatch");
    assert(settingsA.body.settings.overdue_alerts === true, "overdue alerts default mismatch");
    assert(settingsA.body.settings.weekly_summary === true, "weekly summary default mismatch");
    assert(settingsA.body.settings.theme === "light", "theme default mismatch");
    assert(settingsA.body.settings.currency === "AUD", "currency default mismatch");
    assert(settingsA.body.settings.default_status === "active", "status default mismatch");
    assert(settingsA.body.settings.date_format === "DD/MM/YYYY", "date format default mismatch");
    assertNoSecrets(settingsA.body);
    console.log("get settings: 200, own defaults only");

    const updatedSettings = await request(baseUrl, "PUT", "/api/settings", {
      token: userA.token,
      body: {
        user_id: userB.id,
        weekly_summary: false,
        theme: "dark",
        renewal_lead_days: 14,
        currency: "USD",
        default_status: "inactive",
        date_format: "MM/DD/YYYY",
      },
    });
    assert(updatedSettings.status === 200, "settings update should return 200");
    assert(updatedSettings.body.settings.user_id === userA.id, "settings update changed ownership");
    assert(updatedSettings.body.settings.weekly_summary === false, "weekly summary was not saved");
    assert(updatedSettings.body.settings.theme === "dark", "theme was not saved");
    assert(updatedSettings.body.settings.renewal_lead_days === 14, "lead days were not saved");
    assert(updatedSettings.body.settings.email_notifications === true, "omitted setting was cleared");
    assertNoSecrets(updatedSettings.body);
    console.log("update settings: 200");

    const settingsB = await request(baseUrl, "GET", "/api/settings", { token: userB.token });
    assert(settingsB.body.settings.theme === "light", "settings update changed the other user");
    assert(settingsB.body.settings.user_id === userB.id, "other settings row belongs to the wrong user");
    console.log("other user's settings unchanged: yes");

    const badSettings = await request(baseUrl, "PUT", "/api/settings", {
      token: userA.token,
      body: { theme: "neon", renewal_lead_days: 0 },
    });
    assert(badSettings.status === 400, "invalid settings should return 400");
    const stillDark = await request(baseUrl, "GET", "/api/settings", { token: userA.token });
    assert(stillDark.body.settings.theme === "dark", "invalid settings were saved");
    console.log("invalid settings: 400");

    const emptySettings = await request(baseUrl, "PUT", "/api/settings", {
      token: userA.token,
      body: {},
    });
    assert(emptySettings.status === 400, "empty settings update should return 400");
    console.log("empty settings update: 400");
    console.log("Account tests passed.");
  } catch (error) {
    console.error("Account tests failed:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.query("DELETE FROM users WHERE email IN (?, ?, ?)", emails);
    await new Promise((resolve) => server.close(resolve));
    await pool.end();
  }
}

testAccount();
