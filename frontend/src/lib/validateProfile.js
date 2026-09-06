// Pure validation logic for the Settings > Profile form. No React, no DOM —
// callable and unit-testable on its own. Same shape as validateService():
// returns a { field -> message } map; an empty object means valid.

export const PROFILE_LIMITS = {
  name: { min: 2, max: 60 },
  email: { max: 254 },
};

// Deliberately simple: something, "@", something, ".", something — enough to
// catch obvious typos without pretending to be RFC 5322.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate a profile draft.
 * @param {object} values - { name, email }
 * @returns {Record<string,string>} field -> message. Empty object means valid.
 */
export function validateProfile(values = {}) {
  const errors = {};

  const name = typeof values.name === "string" ? values.name.trim() : "";
  if (!name) {
    errors.name = "Name is required.";
  } else if (name.length < PROFILE_LIMITS.name.min) {
    errors.name = `Name must be at least ${PROFILE_LIMITS.name.min} characters.`;
  } else if (name.length > PROFILE_LIMITS.name.max) {
    errors.name = `Name must be ${PROFILE_LIMITS.name.max} characters or fewer.`;
  }

  const email = typeof values.email === "string" ? values.email.trim() : "";
  if (!email) {
    errors.email = "Email is required.";
  } else if (email.length > PROFILE_LIMITS.email.max) {
    errors.email = `Email must be ${PROFILE_LIMITS.email.max} characters or fewer.`;
  } else if (!EMAIL_RE.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  return errors;
}
