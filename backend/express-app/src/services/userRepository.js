const pool = require("../config/db");

const USER_COLUMNS = "id, name, email, password_hash, created_at, updated_at";

function assertId(id) {
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw new Error("User id must be a positive integer.");
  }
  return numericId;
}

function assertText(value, label, maxLength) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${label} is required.`);
  }
  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    throw new Error(`${label} must be ${maxLength} characters or fewer.`);
  }
  return trimmed;
}

function assertPasswordHash(passwordHash) {
  if (typeof passwordHash !== "string" || passwordHash.length === 0) {
    throw new Error("Password hash is required.");
  }
  if (passwordHash.length > 255) {
    throw new Error("Password hash must be 255 characters or fewer.");
  }
  return passwordHash;
}

async function runQuery(db, sql, params) {
  try {
    return await db.query(sql, params);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      const duplicate = new Error("A user with this email already exists.");
      duplicate.code = "DUPLICATE_EMAIL";
      throw duplicate;
    }
    const safeError = new Error("Database request failed.");
    safeError.code = error.code || "DB_ERROR";
    throw safeError;
  }
}

async function findUserById(id, db = pool) {
  const userId = assertId(id);
  const [rows] = await runQuery(
    db,
    `SELECT ${USER_COLUMNS} FROM users WHERE id = ? LIMIT 1`,
    [userId],
  );
  return rows[0] || null;
}

async function findUserByEmail(email, db = pool) {
  const normalizedEmail = assertText(email, "Email", 255);
  const [rows] = await runQuery(
    db,
    `SELECT ${USER_COLUMNS} FROM users WHERE email = ? LIMIT 1`,
    [normalizedEmail],
  );
  return rows[0] || null;
}

async function createUser({ name, email, passwordHash }, db = pool) {
  const safeName = assertText(name, "Name", 100);
  const safeEmail = assertText(email, "Email", 255);
  const safeHash = assertPasswordHash(passwordHash);

  const [result] = await runQuery(
    db,
    "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
    [safeName, safeEmail, safeHash],
  );

  return findUserById(result.insertId, db);
}

async function updateUserName(id, name, db = pool) {
  const userId = assertId(id);
  const safeName = assertText(name, "Name", 100);
  const existing = await findUserById(userId, db);
  if (!existing) return null;

  await runQuery(db, "UPDATE users SET name = ? WHERE id = ?", [
    safeName,
    userId,
  ]);
  return findUserById(userId, db);
}

async function updateUserEmail(id, email, db = pool) {
  const userId = assertId(id);
  const safeEmail = assertText(email, "Email", 255);
  const existing = await findUserById(userId, db);
  if (!existing) return null;

  await runQuery(db, "UPDATE users SET email = ? WHERE id = ?", [
    safeEmail,
    userId,
  ]);
  return findUserById(userId, db);
}

async function updateUserPasswordHash(id, passwordHash, db = pool) {
  const userId = assertId(id);
  const safeHash = assertPasswordHash(passwordHash);
  const existing = await findUserById(userId, db);
  if (!existing) return null;

  await runQuery(db, "UPDATE users SET password_hash = ? WHERE id = ?", [
    safeHash,
    userId,
  ]);
  return findUserById(userId, db);
}

module.exports = {
  findUserById,
  findUserByEmail,
  createUser,
  updateUserName,
  updateUserEmail,
  updateUserPasswordHash,
};
