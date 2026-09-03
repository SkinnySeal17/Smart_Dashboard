// Service records data access (localStorage-backed).
// Canonical shape: { id, name, category, cost, billingCycle, renewalDate, status, notes }
import { readJSON, writeJSON, removeKey, uid } from "./storage";
import SEED from "../data/services.json";

// v2: the shape changed (price/description -> cost/billingCycle/renewalDate/notes).
const KEY = "smart-dashboard.services.v2";

// Set to 0 for a stable demo and use the one-shot trigger below to show the
// error state on cue:  localStorage.setItem("smart-dashboard.failNextLoad", "1")
const FAIL_RATE = 0.05;
const FAIL_KEY = "smart-dashboard.failNextLoad";

export function loadServices() {
  return readJSON(KEY, null) ?? SEED;
}

/**
 * Simulated async load: fakes network latency and an occasional failure so the
 * UI has real loading / error states to render (no backend yet).
 */
export async function loadServicesAsync(delay = 400) {
  await new Promise((res) => setTimeout(res, delay));

  // One-shot manual failure for demos/screenshots.
  if (readJSON(FAIL_KEY, null)) {
    removeKey(FAIL_KEY);
    throw new Error("Failed to load services.");
  }
  if (Math.random() < FAIL_RATE) {
    throw new Error("Failed to load services.");
  }

  return readJSON(KEY, null) ?? SEED;
}

export function saveServices(list) {
  writeJSON(KEY, list);
}

function normalize(data) {
  return {
    name: data.name.trim(),
    category: data.category,
    cost: Number(data.cost),
    billingCycle: data.billingCycle,
    renewalDate: data.renewalDate,
    status: data.status,
    notes: (data.notes ?? "").trim(),
  };
}

export function makeService(data) {
  const now = new Date().toISOString();
  return {
    id: uid("svc"),
    ...normalize(data),
    createdAt: now,
    updatedAt: now,
  };
}

export function applyUpdate(current, data) {
  return {
    ...current,
    ...normalize(data),
    updatedAt: new Date().toISOString(),
  };
}
