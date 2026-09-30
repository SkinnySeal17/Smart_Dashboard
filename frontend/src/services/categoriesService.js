import { api } from './api';
const normalize = row => ({ ...row, id: String(row.id) });
export async function loadCategories() { return (await api('/categories')).map(normalize); }
export async function createCategory(body) { return normalize(await api('/categories', { method: 'POST', body })); }
export async function editCategory(id, body) { return normalize(await api(`/categories/${id}`, { method: 'PUT', body })); }
export async function removeCategory(id) { await api(`/categories/${id}`, { method: 'DELETE' }); }
