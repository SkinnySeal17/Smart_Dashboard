// Service records data access (localStorage-backed).
// Canonical shape: { id, name, category, cost, billingCycle, renewalDate, status, notes }
import { readJSON, writeJSON, uid } from "./storage";

// v2: the shape changed (price/description -> cost/billingCycle/renewalDate/notes).
const KEY = "smart-dashboard.services.v2";

const SEED = [
  {
    id: "svc_figma",
    name: "Figma Organization",
    category: "cat_design",
    cost: 45,
    billingCycle: "monthly",
    renewalDate: "2026-11-01",
    status: "active",
    notes: "Org plan, 6 editor seats. Billed to the design ops card.",
    createdAt: "2026-07-02T09:00:00.000Z",
    updatedAt: "2026-08-01T09:00:00.000Z",
  },
  {
    id: "svc_vercel",
    name: "Vercel Pro",
    category: "cat_web",
    cost: 20,
    billingCycle: "monthly",
    renewalDate: "2026-09-15",
    status: "active",
    notes: "Hosting for the marketing site and preview deploys.",
    createdAt: "2026-06-10T09:00:00.000Z",
    updatedAt: "2026-06-10T09:00:00.000Z",
  },
  {
    id: "svc_analytics",
    name: "Legacy Analytics",
    category: "cat_consulting",
    cost: 300,
    billingCycle: "yearly",
    renewalDate: "2026-03-01",
    status: "inactive",
    notes: "Superseded by the in-house dashboard. Do not renew.",
    createdAt: "2025-03-01T09:00:00.000Z",
    updatedAt: "2026-02-20T09:00:00.000Z",
  },
];

export function loadServices() {
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
