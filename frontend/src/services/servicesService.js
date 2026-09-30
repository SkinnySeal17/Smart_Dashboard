import { api } from './api';
export function fromApi(row) {
  return { id: String(row.id), category: String(row.category_id), name: row.name,
    cost: Number(row.cost), billingCycle: row.billing_cycle, renewalDate: row.renewal_date,
    status: row.status, notes: row.notes, createdAt: row.created_at, updatedAt: row.updated_at };
}
export function toApi(data) {
  return { category_id: data.category, name: data.name, cost: data.cost,
    billing_cycle: data.billingCycle, renewal_date: data.renewalDate, status: data.status, notes: data.notes ?? '' };
}
export async function loadServicesAsync(filters = {}, signal) {
  const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value !== '' && value !== 'all' && value !== undefined));
  return (await api(`/services?${query}`, { signal })).map(fromApi);
}
export async function makeService(data) { return fromApi(await api('/services', { method: 'POST', body: toApi(data) })); }
export async function applyUpdate(current, data) { return fromApi(await api(`/services/${current.id}`, { method: 'PUT', body: toApi(data) })); }
export async function removeService(id) { await api(`/services/${id}`, { method: 'DELETE' }); }
