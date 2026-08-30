// Pure validation logic for the Service form. No React, no DOM, no imports —
// callable and unit-testable on its own. See validateService.test.js.
//
// Canonical service shape (agreed with the team):
//   { id, name, category, cost, billingCycle, renewalDate, status, notes }

export const SERVICE_STATUSES = ["active", "inactive"];

export const BILLING_CYCLES = ["monthly", "quarterly", "yearly", "one_time"];

export const BILLING_CYCLE_LABELS = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
  one_time: "One-time",
};

export const SERVICE_LIMITS = {
  name: { min: 2, max: 80 },
  notes: { max: 500 },
  cost: { min: 0, max: 1_000_000 },
};

export const CATEGORY_LIMITS = {
  name: { min: 2, max: 40 },
};

export const EMPTY_SERVICE = {
  name: "",
  category: "",
  cost: "",
  billingCycle: "monthly",
  renewalDate: "",
  status: "active",
  notes: "",
};

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function categoryId(entry) {
  return typeof entry === "string" ? entry : entry?.id;
}

/**
 * Validate a service draft.
 * @param {object} values - { name, category, cost, billingCycle, renewalDate, status, notes }
 * @param {object} [options]
 * @param {Array<string|{id:string}>} [options.categories] - allowed categories;
 *        when non-empty, `category` must be one of them.
 * @returns {Record<string,string>} field -> message. Empty object means valid.
 */
export function validateService(values = {}, options = {}) {
  const { categories = [] } = options;
  const errors = {};

  const name = typeof values.name === "string" ? values.name.trim() : "";
  if (!name) {
    errors.name = "Name is required.";
  } else if (name.length < SERVICE_LIMITS.name.min) {
    errors.name = `Name must be at least ${SERVICE_LIMITS.name.min} characters.`;
  } else if (name.length > SERVICE_LIMITS.name.max) {
    errors.name = `Name must be ${SERVICE_LIMITS.name.max} characters or fewer.`;
  }

  const category =
    typeof values.category === "string" ? values.category.trim() : "";
  if (!category) {
    errors.category = "Category is required.";
  } else if (
    categories.length > 0 &&
    !categories.some((c) => categoryId(c) === category)
  ) {
    errors.category = "Choose a valid category.";
  }

  const rawCost = values.cost;
  if (rawCost === "" || rawCost === null || rawCost === undefined) {
    errors.cost = "Cost is required.";
  } else {
    const cost = Number(rawCost);
    if (!Number.isFinite(cost)) {
      errors.cost = "Cost must be a number.";
    } else if (cost < SERVICE_LIMITS.cost.min) {
      errors.cost = "Cost cannot be negative.";
    } else if (cost > SERVICE_LIMITS.cost.max) {
      errors.cost = `Cost cannot exceed ${SERVICE_LIMITS.cost.max.toLocaleString(
        "en-US",
      )}.`;
    }
  }

  if (!values.billingCycle) {
    errors.billingCycle = "Billing cycle is required.";
  } else if (!BILLING_CYCLES.includes(values.billingCycle)) {
    errors.billingCycle = "Invalid billing cycle.";
  }

  const renewalDate = values.renewalDate;
  if (!renewalDate) {
    errors.renewalDate = "Renewal date is required.";
  } else if (typeof renewalDate !== "string" || !ISO_DATE_RE.test(renewalDate)) {
    errors.renewalDate = "Enter a valid date (YYYY-MM-DD).";
  } else {
    // Round-trip the parts so rollovers (e.g. 2030-02-30 -> Mar 2) are rejected.
    const [y, m, d] = renewalDate.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    if (
      dt.getFullYear() !== y ||
      dt.getMonth() !== m - 1 ||
      dt.getDate() !== d
    ) {
      errors.renewalDate = "Enter a valid date (YYYY-MM-DD).";
    }
  }

  const status = values.status;
  if (!status) {
    errors.status = "Status is required.";
  } else if (!SERVICE_STATUSES.includes(status)) {
    errors.status = "Invalid status.";
  }

  const notes = typeof values.notes === "string" ? values.notes : "";
  if (notes.length > SERVICE_LIMITS.notes.max) {
    errors.notes = `Notes must be ${SERVICE_LIMITS.notes.max} characters or fewer.`;
  }

  return errors;
}

/**
 * Validate a category name for the Settings page.
 * @param {object} values - { name }
 * @param {object} [options]
 * @param {Array<{id:string,name:string}>} [options.categories] - existing categories
 * @param {string|null} [options.currentId] - id being edited (excluded from the uniqueness check)
 * @returns {Record<string,string>}
 */
export function validateCategory(values = {}, options = {}) {
  const { categories = [], currentId = null } = options;
  const errors = {};

  const name = typeof values.name === "string" ? values.name.trim() : "";
  if (!name) {
    errors.name = "Category name is required.";
  } else if (name.length < CATEGORY_LIMITS.name.min) {
    errors.name = `Must be at least ${CATEGORY_LIMITS.name.min} characters.`;
  } else if (name.length > CATEGORY_LIMITS.name.max) {
    errors.name = `Must be ${CATEGORY_LIMITS.name.max} characters or fewer.`;
  } else if (
    categories.some(
      (c) =>
        c.id !== currentId &&
        c.name.trim().toLowerCase() === name.toLowerCase(),
    )
  ) {
    errors.name = "A category with that name already exists.";
  }

  return errors;
}

/** True when a validate*() result has no errors. */
export function isValid(errors) {
  return !errors || Object.keys(errors).length === 0;
}
