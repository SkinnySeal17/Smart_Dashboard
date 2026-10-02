const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const {
  findUserById,
  findUserByEmail,
  createUser,
  updateUserName,
  updateUserEmail,
  updateUserPasswordHash,
} = require("./userRepository");
const { createDefaultSettings } = require("./userSettingsRepository");

const BCRYPT_ROUNDS = 10;
const TOKEN_EXPIRES_IN = "8h";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COMMON_PASSWORDS = new Set([
  "password",
  "password1",
  "password1!",
  "password123",
  "12345678",
  "qwerty",
  "qwerty123",
  "letmein",
  "welcome",
  "welcome1",
  "admin",
  "admin123",
  "iloveyou",
  "changeme",
  "secret",
  "secret1",
]);
let dummyHashPromise;

function validateRegistration(input) {
  const errors = {};
  const body =
    input && typeof input === "object" && !Array.isArray(input) ? input : {};

  const nameMessage = nameError(body.name);
  if (nameMessage) errors.name = nameMessage;

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email) {
    errors.email = "Email is required.";
  } else if (email.length > 255 || !EMAIL_RE.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  const passwordMessage = passwordError(body.password, { email });
  if (passwordMessage) errors.password = passwordMessage;

  return errors;
}

function nameError(value) {
  if (typeof value !== "string" || value.trim() === "") return "Name is required.";
  if (value.trim().length > 100) return "Name must be 100 characters or fewer.";
  if (/[\u0000-\u001F\u007F]/.test(value)) return "Name contains invalid characters.";
  return "";
}

function passwordError(value, context = {}) {
  if (typeof value !== "string" || value.length === 0) return "Password is required.";
  if (value.length < 8) return "Password must be at least 8 characters.";
  if (value.length > 72) return "Password must be 72 characters or fewer.";
  if (
    !/[a-z]/.test(value) ||
    !/[A-Z]/.test(value) ||
    !/[0-9]/.test(value) ||
    !/[^A-Za-z0-9]/.test(value)
  ) {
    return "Password must include an uppercase letter, a lowercase letter, a number, and a symbol.";
  }
  if (COMMON_PASSWORDS.has(value.toLowerCase())) return "Choose a less common password.";

  const email = typeof context.email === "string" ? context.email.trim().toLowerCase() : "";
  const localPart = email.split("@")[0];
  if (email && (value.toLowerCase() === email || (localPart && value.toLowerCase() === localPart))) {
    return "Password must not match your email.";
  }
  return "";
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
  return jwt.sign({ sub: String(userId) }, secret, {
    expiresIn: TOKEN_EXPIRES_IN,
    algorithm: "HS256",
  });
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

function readBody(input) {
  return input && typeof input === "object" && !Array.isArray(input) ? input : {};
}

async function updateProfile(userId, input) {
  const body = readBody(input);
  const errors = {};

  const nameMessage = nameError(body.name);
  if (nameMessage) errors.name = nameMessage;

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email) {
    errors.email = "Email is required.";
  } else if (email.length > 255 || !EMAIL_RE.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (Object.keys(errors).length > 0) {
    throw validationError(errors, "Invalid profile details.");
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const named = await updateUserName(userId, body.name.trim(), connection);
    if (!named) {
      const missing = new Error("User not found.");
      missing.code = "USER_NOT_FOUND";
      throw missing;
    }

    const taken = await findUserByEmail(email, connection);
    if (taken && taken.id !== userId) {
      const duplicate = new Error("An account with this email already exists.");
      duplicate.code = "DUPLICATE_EMAIL";
      throw duplicate;
    }

    const updated = await updateUserEmail(userId, email, connection);
    await connection.commit();
    return toPublicUser(updated);
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

async function changePassword(userId, input) {
  const body = readBody(input);
  const errors = {};

  if (typeof body.currentPassword !== "string" || body.currentPassword.length === 0) {
    errors.currentPassword = "Current password is required.";
  }
  const nextPasswordMessage = passwordError(body.newPassword);
  if (nextPasswordMessage) errors.newPassword = nextPasswordMessage;
  else if (body.newPassword === body.currentPassword) {
    errors.newPassword = "New password must be different from the current password.";
  }

  if (Object.keys(errors).length > 0) {
    throw validationError(errors, "Invalid password details.");
  }

  const user = await findUserById(userId);
  if (!user) {
    const missing = new Error("User not found.");
    missing.code = "USER_NOT_FOUND";
    throw missing;
  }

  const emailMessage = passwordError(body.newPassword, { email: user.email });
  if (emailMessage) {
    throw validationError({ newPassword: emailMessage }, "Invalid password details.");
  }

  const matches = await bcrypt.compare(body.currentPassword, user.password_hash);
  if (!matches) {
    const invalid = new Error("Current password is incorrect.");
    invalid.code = "INVALID_PASSWORD";
    throw invalid;
  }

  const passwordHash = await bcrypt.hash(body.newPassword, BCRYPT_ROUNDS);
  await updateUserPasswordHash(userId, passwordHash);
  return { message: "Password updated." };
}

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  updateProfile,
  changePassword,
  validateRegistration,
  TOKEN_EXPIRES_IN,
};
