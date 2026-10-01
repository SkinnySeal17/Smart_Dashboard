const pool = require("../config/db");
const {
  findUserById,
  findUserByEmail,
  createUser,
  updateUserName,
  updateUserEmail,
  updateUserPasswordHash,
} = require("./userRepository");

async function countUsers() {
  const [rows] = await pool.query("SELECT COUNT(*) AS total FROM users");
  return Number(rows[0].total);
}

async function testUserRepository() {
  const stamp = Date.now();
  const email = `member1.step3.${stamp}@example.com`;
  const renamedEmail = `member1.step3.updated.${stamp}@example.com`;
  const originalHash = "test-hash-not-a-password";
  const updatedHash = "test-hash-not-a-password-updated";
  const before = await countUsers();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const missing = await findUserById(999999999, connection);
    console.log(`findUserById missing user: ${missing === null ? "null" : "unexpected row"}`);

    const created = await createUser(
      {
        name: "Step3 Temp",
        email,
        passwordHash: originalHash,
      },
      connection,
    );

    const byId = await findUserById(created.id, connection);
    const byEmail = await findUserByEmail(email, connection);
    const renamed = await updateUserName(created.id, "Step3 Temp Updated", connection);
    const remailed = await updateUserEmail(created.id, renamedEmail, connection);
    const rehashed = await updateUserPasswordHash(created.id, updatedHash, connection);
    const oldEmail = await findUserByEmail(email, connection);
    const missingUpdate = await updateUserName(999999999, "Nobody", connection);

    let duplicateRejected = false;
    try {
      await createUser(
        {
          name: "Step3 Duplicate",
          email: renamedEmail,
          passwordHash: originalHash,
        },
        connection,
      );
    } catch (error) {
      duplicateRejected = error.code === "DUPLICATE_EMAIL";
    }

    console.log(`created inside transaction: id ${created.id}`);
    console.log(`findUserById: ${byId && byId.email === email ? "ok" : "failed"}`);
    console.log(`findUserByEmail: ${byEmail && byEmail.id === created.id ? "ok" : "failed"}`);
    console.log(`updateUserName: ${renamed && renamed.name === "Step3 Temp Updated" ? "ok" : "failed"}`);
    console.log(`updateUserEmail: ${remailed && remailed.email === renamedEmail ? "ok" : "failed"}`);
    console.log(`updateUserPasswordHash: ${rehashed && rehashed.password_hash === updatedHash ? "ok" : "failed"}`);
    console.log(`old email lookup: ${oldEmail === null ? "null" : "unexpected row"}`);
    console.log(`update missing user: ${missingUpdate === null ? "null" : "unexpected row"}`);
    console.log(`duplicate email rejected: ${duplicateRejected ? "yes" : "no"}`);

    const checks = [
      missing === null,
      byId && byId.email === email,
      byEmail && byEmail.id === created.id,
      renamed && renamed.name === "Step3 Temp Updated",
      remailed && remailed.email === renamedEmail,
      rehashed && rehashed.password_hash === updatedHash,
      oldEmail === null,
      missingUpdate === null,
      duplicateRejected,
    ];

    if (checks.some((ok) => !ok)) {
      throw new Error("User repository checks failed.");
    }

    await connection.rollback();
  } catch (error) {
    await connection.rollback();
    console.error("User repository test failed:", error.message);
    process.exitCode = 1;
  } finally {
    connection.release();
  }

  const after = await countUsers();
  console.log(`user count before: ${before}`);
  console.log(`user count after rollback: ${after}`);
  if (before !== after) {
    console.error("Rollback did not restore the users table.");
    process.exitCode = 1;
  } else if (process.exitCode !== 1) {
    console.log("User repository test passed. No user rows were kept.");
  }

  await pool.end();
}

testUserRepository();
