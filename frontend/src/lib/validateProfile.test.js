import { describe, it, expect } from "vitest";
import { validateProfile, PROFILE_LIMITS } from "./validateProfile";

const validDraft = { name: "Alex Morgan", email: "alex@example.com" };

describe("validateProfile — happy path", () => {
  it("returns no errors for a valid draft", () => {
    expect(validateProfile(validDraft)).toEqual({});
  });

  it("accepts surrounding whitespace (trimmed before checks)", () => {
    expect(validateProfile({ name: "  Alex  ", email: "  a@b.co  " })).toEqual(
      {},
    );
  });
});

describe("validateProfile — name", () => {
  it("requires a name", () => {
    expect(validateProfile({ ...validDraft, name: "" }).name).toBe(
      "Name is required.",
    );
  });

  it("treats whitespace-only as empty", () => {
    expect(validateProfile({ ...validDraft, name: "   " }).name).toBe(
      "Name is required.",
    );
  });

  it("rejects names below the minimum length", () => {
    expect(validateProfile({ ...validDraft, name: "a" }).name).toMatch(
      /at least/,
    );
  });

  it("rejects names over the maximum length", () => {
    const name = "x".repeat(PROFILE_LIMITS.name.max + 1);
    expect(validateProfile({ ...validDraft, name }).name).toMatch(/or fewer/);
  });

  it("does not throw on a missing / non-string name", () => {
    expect(validateProfile({ email: "a@b.co" }).name).toBe("Name is required.");
    expect(validateProfile({ name: 42, email: "a@b.co" }).name).toBe(
      "Name is required.",
    );
  });
});

describe("validateProfile — email", () => {
  it("requires an email", () => {
    expect(validateProfile({ ...validDraft, email: "" }).email).toBe(
      "Email is required.",
    );
  });

  it.each(["plainaddress", "no-at.example.com", "a@b", "a@b.", "a @b.co"])(
    "rejects the malformed address %j",
    (email) => {
      expect(validateProfile({ ...validDraft, email }).email).toBe(
        "Enter a valid email address.",
      );
    },
  );

  it.each(["a@b.co", "alex.morgan@example.co.uk", "user+tag@sub.domain.io"])(
    "accepts the valid address %j",
    (email) => {
      expect(validateProfile({ ...validDraft, email }).email).toBeUndefined();
    },
  );
});

describe("validateProfile — robustness", () => {
  it("does not throw on an empty object", () => {
    const errors = validateProfile();
    expect(errors.name).toBeDefined();
    expect(errors.email).toBeDefined();
  });
});
