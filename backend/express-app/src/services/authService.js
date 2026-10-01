const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const { findUserById, findUserByEmail, createUser } = require("./userRepository");
const { createDefaultSettings } = require("./userSettingsRepository");

const BCRYPT_ROUNDS = 10;
const TOKEN_EXPIRES_IN = "8h";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
let dummyHashPromise;

function validateRegistration(input) {
  const errors = {};
  const body =
    input && typeof input === "object" && !Array.isArray(input) ? input : {};

  if (typeof body.name !== "string" || body.name.trim() === "") {
    errors.name = "Name is required.";
  } else if (body.name.trim().length > 100) {
    errors.name = "Name must be 100 characters or fewer.";
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email) {
    errors.email = "Email is required.";
  } else if (email.length > 255 || !EMAIL_RE.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (typeof body.password !== "string" || body.password.length === 0) {
    errors.password = "Password is required.";
  } else if (body.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  } else if (body.password.length > 72) {
    errors.password = "Password must be 72 characters or fewer.";
  } else if (!/[a-zA-Z]/.test(body.password) || !/[0-9]/.test(body.password)) {
    errors.password = "Password must include a letter and a number.";
  }

  return errors;
}

function validateLogin(input) {
  const errors = {};
  const body =
    input && typeof input === "object" && !Array.isArray(input) ? input : {};

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email) {
    errors.email = "Email is required.";
  } else if (email.length > 255 || !EMAIL_RE.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (typeof body.password !== "string" || body.password.length === 0) {
    errors.password = "Password is required.";
  }

  return errors;
}

function validationError(errors, message = "Invalid registration details.") {
  const error = new Error(message);
  error.code = "VALIDATION_ERROR";
  error.errors = errors;
  return error;
}

function invalidCredentials() {
  const error = new Error("Invalid email or password.");
  error.code = "INVALID_CREDENTIALS";
  return error;
}

function getDummyHash() {
  if (!dummyHashPromise) {
    dummyHashPromise = bcrypt.hash("not-a-real-account", BCRYPT_ROUNDS);
  }
  return dummyHashPromise;
}

function signToken(userId) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    const error = new Error("Authentication is not configured.");
    error.code = "AUTH_NOT_CONFIGURED";
    throw error;
  }
  return jwt.sign({ sub: String(userId) }, secret, { expiresIn: TOKEN_EXPIRES_IN });
}

function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

async function registerUser(input, deps = {}) {
  const errors = validateRegistration(input);
  if (Object.keys(errors).length > 0) {
    throw validationError(errors);
  }

  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const insertUser = deps.createUser || createUser;
  const insertSettings = deps.createDefaultSettings || createDefaultSettings;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const existing = await findUserByEmail(email, connection);
    if (existing) {
      const duplicate = new Error("An account with this email already exists.");
      duplicate.code = "DUPLICATE_EMAIL";
      throw duplicate;
    }

    const user = await insertUser({ name, email, passwordHash }, connection);
    await insertSettings(user.id, connection);
    await connection.commit();
    return toPublicUser(user);
  } catch (error) {
    try {
      await connection.rollback();
    } catch (_rollbackError) {
      // Keep the original error. Do not log SQL or the password.
    }
    throw error;
  } finally {
    connection.release();
  }
}

async function loginUser(input) {
  const errors = validateLogin(input);
  if (Object.keys(errors).length > 0) {
    throw validationError(errors, "Invalid login details.");
  }

  const email = input.email.trim().toLowerCase();
  const user = await findUserByEmail(email);
  const hash = user ? user.password_hash : await getDummyHash();
  const passwordMatches = await bcrypt.compare(input.password, hash);

  if (!user || !passwordMatches) {
    throw invalidCredentials();
  }

  return {
    token: signToken(user.id),
    user: toPublicUser(user),
  };
}

async function getCurrentUser(userId) {
  const user = await findUserById(userId);
  if (!user) {
    const error = new Error("User not found.");
    error.code = "USER_NOT_FOUND";
    throw error;
  }
  return toPublicUser(user);
}

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  validateRegistration,
  TOKEN_EXPIRES_IN,
};
