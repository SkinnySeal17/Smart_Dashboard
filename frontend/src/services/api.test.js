import { beforeEach, afterEach, test, expect, vi } from 'vitest';
import { api, setToken } from './api';
import { loadServicesAsync, makeService, applyUpdate, removeService } from './servicesService';
import { createCategory, editCategory, removeCategory, loadCategories } from './categoriesService';
let stored;
beforeEach(() => {
  stored = new Map();
  vi.stubGlobal('sessionStorage', { getItem: key => stored.get(key), setItem: (key, value) => stored.set(key, value), removeItem: key => stored.delete(key) });
  vi.stubGlobal('window', { dispatchEvent: vi.fn() });
  vi.stubGlobal('fetch', vi.fn());
});
afterEach(() => vi.unstubAllGlobals());
const respond = data => fetch.mockResolvedValue({ ok: true, status: 200, json: async () => data });
const row = { id: 2, category_id: 3, name: 'Hosting', cost: '20.50', billing_cycle: 'monthly', renewal_date: '2028-02-29', status: 'active', notes: '', created_at: '2026-01-01', updated_at: '2026-01-02' };
test('service list sends combined filters and JWT and maps database values', async () => {
  setToken('test-token'); respond([row]);
  const signal = new AbortController().signal;
  const result = await loadServicesAsync({ search: 'a&b', category_id: '3', status: 'active', billing_cycle: 'monthly' }, signal);
  const [url, options] = fetch.mock.calls[0];
  expect(url).toContain('search=a%26b'); expect(url).toContain('category_id=3');
  expect(url).toContain('status=active'); expect(url).toContain('billing_cycle=monthly');
  expect(options.signal).toBe(signal); expect(options.headers.Authorization).toBe('Bearer test-token');
  expect(result[0]).toMatchObject({ id: '2', category: '3', cost: 20.5, billingCycle: 'monthly', renewalDate: '2028-02-29' });
});
test('service mutations map frontend fields and wait for server results', async () => {
  respond(row);
  const draft = { name: 'Hosting', category: '3', cost: '20.50', billingCycle: 'monthly', renewalDate: '2028-02-29', status: 'active' };
  expect((await makeService(draft)).id).toBe('2');
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toMatchObject({ category_id: '3', billing_cycle: 'monthly', renewal_date: '2028-02-29', notes: '' });
  await applyUpdate({ id: '2' }, draft);
  expect(fetch.mock.calls[1][0]).toBe('/api/services/2'); expect(fetch.mock.calls[1][1].method).toBe('PUT');
  fetch.mockResolvedValue({ ok: true, status: 204 });
  await removeService('2'); expect(fetch.mock.calls[2][1].method).toBe('DELETE');
});
test('category adapters preserve string IDs and support CRUD', async () => {
  respond([{ id: 3, name: 'Hosting', color: '#123456' }]);
  expect((await loadCategories())[0].id).toBe('3');
  respond({ id: 3, name: 'Hosting', color: '#123456' });
  expect((await createCategory({ name: 'Hosting' })).id).toBe('3');
  await editCategory('3', { name: 'Cloud', color: '#123456' });
  expect(fetch.mock.calls[2][1].method).toBe('PUT');
  fetch.mockResolvedValue({ ok: true, status: 204 }); await removeCategory('3');
  expect(fetch.mock.calls[3][1].method).toBe('DELETE');
});
test('conflicts are surfaced and expired sessions clear the token', async () => {
  setToken('old-token');
  fetch.mockResolvedValue({ ok: false, status: 409, json: async () => ({ message: 'Category is in use.' }) });
  await expect(removeCategory('3')).rejects.toThrow('Category is in use.');
  expect(stored.size).toBe(1);
  fetch.mockResolvedValue({ ok: false, status: 401, json: async () => ({ message: 'Invalid or expired token.' }) });
  await expect(api('/services')).rejects.toThrow('Invalid or expired token.');
  expect(stored.size).toBe(0); expect(window.dispatchEvent).toHaveBeenCalled();
});

test('logout calls the backend with the current token and clears the session', async () => {
  const { logout } = await import('./authService');
  setToken('active-token'); respond({ message: 'Logged out.' });
  await logout();
  expect(fetch.mock.calls[0][0]).toBe('/api/auth/logout');
  expect(fetch.mock.calls[0][1].method).toBe('POST');
  expect(fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer active-token');
  expect(stored.size).toBe(0);
});

test('logout clears the session even when the server is unavailable', async () => {
  const { logout } = await import('./authService');
  setToken('active-token'); fetch.mockRejectedValue(new TypeError('Failed to fetch'));
  await logout();
  expect(stored.size).toBe(0);
});
