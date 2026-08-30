import { BILLING_CYCLE_LABELS } from "../lib/validateService";

export function formatMoney(amount, currency = "$") {
  return `${currency}${Number(amount).toFixed(2)}`;
}

export const STATUS_LABELS = { active: "Active", inactive: "Inactive" };

export function statusLabel(status) {
  return STATUS_LABELS[status] ?? status;
}

/** Badge tone for a service status. */
export function statusTone(status) {
  return status === "active" ? "ok" : "muted";
}

export function billingCycleLabel(cycle) {
  return BILLING_CYCLE_LABELS[cycle] ?? cycle;
}

/** Short suffix for list/table cells, e.g. "$20.00/mo". */
export const CYCLE_SUFFIX = {
  monthly: "/mo",
  quarterly: "/qtr",
  yearly: "/yr",
  one_time: "",
};

/** A service's cost normalised to a per-month figure (one-time counts as 0). */
export function monthlyCost({ cost, billingCycle }) {
  const n = Number(cost) || 0;
  if (billingCycle === "monthly") return n;
  if (billingCycle === "quarterly") return n / 3;
  if (billingCycle === "yearly") return n / 12;
  return 0;
}
