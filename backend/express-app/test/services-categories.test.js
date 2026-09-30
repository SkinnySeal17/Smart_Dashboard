const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
// Replace only the database boundary; load the real repositories/controllers/routes.
const calls = [];
let execute = async () => [[]];
require.cache[require.resolve('../src/config/db')] = {
  id: require.resolve('../src/config/db'), loaded: true,
  exports: { execute: async (sql, params) => { calls.push({ sql, params }); return execute(sql, params); } },
};
process.env.JWT_SECRET = 'services-categories-test-only-secret';
const app = require('../src/app');
let server, base;
before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { if (server) await new Promise(resolve => server.close(resolve)); });
async function request(method, path, body, token = jwt.sign({ sub: '7' }, process.env.JWT_SECRET)) {
  const response = await fetch(base + path, { method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined || method === "GET" ? undefined : JSON.stringify(body),
  });
  return { status: response.status, body: response.status === 204 ? null : await response.json() };
}
const draft = { category_id: 3, name: 'Hosting', cost: '20.50', billing_cycle: 'monthly', renewal_date: '2028-02-29', status: 'active', notes: '' };

for (const resource of ['categories', 'services']) {
  test(`${resource}: all routes require a valid JWT`, async () => {
    for (const [method, suffix] of [['POST',''],['GET',''],['GET','/3'],['PUT','/3'],['DELETE','/3']]) {
      for (const token of [null, 'invalid', jwt.sign({ sub: '7', exp: 1 }, process.env.JWT_SECRET)]) {
        calls.length = 0;
        assert.equal((await request(method, `/api/${resource}${suffix}`, {}, token)).status, 401);
        assert.equal(calls.length, 0);
      }
    }
  });
  test(`${resource}: list and detail use JWT owner, ignoring supplied owner`, async () => {
    execute = async () => [[{ id: 3, name: 'Owned' }]];
    calls.length = 0;
    assert.equal((await request('GET', `/api/${resource}?user_id=99`)).status, 200);
    assert.deepEqual(calls[0].params, [7]);
    assert.match(calls[0].sql, /WHERE (s\.)?user_id = \?/);
    calls.length = 0;
    assert.equal((await request('GET', `/api/${resource}/3?user_id=99`)).status, 200);
    assert.deepEqual(calls[0].params, [3, 7]);
    assert.match(calls[0].sql, /WHERE (s\.)?id = \? AND (s\.)?user_id = \?/);
  });
  test(`${resource}: missing or foreign records return 404`, async () => {
    execute = async sql => sql.includes('SELECT id\n     FROM categories') ? [[{ id: 3 }]] : sql.trim().startsWith('SELECT') ? [[]] : [{ affectedRows: 0 }];
    for (const method of ['GET', 'PUT', 'DELETE']) {
      assert.equal((await request(method, `/api/${resource}/99`, method === 'PUT' ? (resource === 'services' ? draft : { name: 'Updated', color: '#123456' }) : undefined)).status, 404);
    }
  });
  test(`${resource}: create, update and delete use owner-scoped SQL`, async () => {
    execute = async sql => sql.trim().startsWith('SELECT') ? [[{ id: 3, name: 'Saved' }]] : [{ insertId: 3, affectedRows: 1 }];
    const body = resource === 'services' ? draft : { name: ' Design ', color: '#123456' };
    calls.length = 0;
    assert.equal((await request('POST', `/api/${resource}`, { ...body, user_id: 99 })).status, 201);
    const insert = calls.find(c => c.sql.trim().startsWith('INSERT'));
    assert.equal(insert.params[0], 7);
    calls.length = 0;
    assert.equal((await request('PUT', `/api/${resource}/3`, body)).status, 200);
    const update = calls.find(c => c.sql.trim().startsWith('UPDATE'));
    assert.deepEqual(update.params.slice(-2), [3, 7]);
    assert.match(update.sql, /WHERE id = \? AND user_id = \?/);
    calls.length = 0;
    assert.equal((await request('DELETE', `/api/${resource}/3`)).status, 204);
    assert.deepEqual(calls[0].params, [3, 7]);
    assert.match(calls[0].sql, /WHERE id = \? AND user_id = \?/);
  });
  test(`${resource}: malformed IDs and bodies are rejected before SQL`, async () => {
    calls.length = 0;
    for (const id of ['0', '-1', '1.2', '1e2', '4294967296', 'abc']) {
      for (const method of ['GET', 'PUT', 'DELETE']) assert.equal((await request(method, `/api/${resource}/${id}`, method === 'PUT' ? {} : undefined)).status, 400);
    }
    for (const body of [undefined, [], {}]) assert.equal((await request('POST', `/api/${resource}`, body)).status, 400);
    assert.equal(calls.length, 0);
  });
  test(`${resource}: unexpected database errors stay private`, async () => {
    execute = async () => { throw new Error('secret SQL credentials'); };
    const response = await request('GET', `/api/${resource}`);
    assert.equal(response.status, 500);
    assert.ok(!JSON.stringify(response.body).includes('secret'));
  });
}
test('category validation, default colour, duplicates and in-use deletion', async () => {
  calls.length = 0;
  for (const body of [{ name: 'x' }, { name: 'x'.repeat(41) }, { name: 'Good', color: 'red' }, { name: 'Good', color: ['#123456'] }]) {
    assert.equal((await request('POST', '/api/categories', body)).status, 400);
  }
  assert.equal(calls.length, 0);
  execute = async sql => sql.trim().startsWith('INSERT') ? [{ insertId: 3 }] : [[{ id: 3 }]];
  assert.equal((await request('POST', '/api/categories', { name: ' Good ' })).status, 201);
  assert.deepEqual(calls[0].params, [7, 'Good', '#8b8b8b']);
  execute = async () => { throw Object.assign(new Error(), { code: 'ER_DUP_ENTRY' }); };
  for (const method of ['POST', 'PUT']) assert.equal((await request(method, `/api/categories${method === 'PUT' ? '/3' : ''}`, { name: 'Good', color: '#123456' })).status, 409);
  execute = async () => { throw Object.assign(new Error(), { code: 'ER_ROW_IS_REFERENCED_2' }); };
  const result = await request('DELETE', '/api/categories/3');
  assert.equal(result.status, 409);
  assert.match(result.body.message, /being used/);
});
test('service validation rejects impossible dates, coerced values and excessive precision', async () => {
  calls.length = 0;
  for (const patch of [{ renewal_date: '2027-02-29' }, { renewal_date: '2028-04-31' }, { renewal_date: '0000-01-01' }, { cost: true }, { cost: [] }, { cost: 0 }, { cost: -1 }, { cost: 1000001 }, { cost: '0.001' }, { category_id: true }, { category_id: [3] }, { billing_cycle: 'weekly' }, { status: 'deleted' }, { notes: 1 }, { notes: 'a'.repeat(501) }, { name: 'a' }]) {
    assert.equal((await request('POST', '/api/services', { ...draft, ...patch })).status, 400, JSON.stringify(patch));
  }
  assert.equal(calls.length, 0);
});
test('service rejects unavailable/foreign categories and handles concurrent category deletion', async () => {
  execute = async () => [[]];
  calls.length = 0;
  assert.equal((await request('POST', '/api/services', draft)).status, 400);
  assert.deepEqual(calls[0].params, [3, 7]);
  assert.equal(calls.length, 1);
  execute = async sql => {
    if (sql.trim().startsWith('SELECT')) return [[{ id: 3 }]];
    throw Object.assign(new Error(), { code: 'ER_NO_REFERENCED_ROW_2' });
  };
  assert.equal((await request('POST', '/api/services', draft)).status, 400);
});

test('service filters are parameterized and always scoped to the JWT owner', async () => {
  execute = async () => [[]];
  for (const [query, params, sql] of [
    ['search=netflix', [7, '%netflix%', '%netflix%'], /s.name LIKE.*OR s.notes LIKE/s],
    ['status=active', [7, 'active'], /s.status = \?/],
    ['category_id=2', [7, 2], /s.category_id = \?/],
    ['billing_cycle=monthly', [7, 'monthly'], /s.billing_cycle = \?/],
    ['search=netflix&status=active&category_id=2&billing_cycle=monthly&user_id=99', [7, '%netflix%', '%netflix%', 'active', 2, 'monthly'], /s.status = \? AND s.category_id = \? AND s.billing_cycle = \?/],
    ['search=%25_%21', [7, '%!%!_!!%', '%!%!_!!%'], /ESCAPE '!'/],
    ['search=%27%20OR%201%3D1--', [7, "%' OR 1=1--%", "%' OR 1=1--%"], /s.user_id = \?/],
  ]) {
    calls.length = 0;
    const result = await request('GET', `/api/services?${query}`);
    assert.equal(result.status, 200);
    assert.deepEqual(calls[0].params, params);
    assert.match(calls[0].sql, /WHERE s.user_id = \? AND/);
    assert.match(calls[0].sql, sql);
    assert.ok(!calls[0].sql.includes('OR 1=1'));
  }
  calls.length = 0;
  await request('GET', '/api/services?status=active&user_id=7', undefined, jwt.sign({ sub: '8' }, process.env.JWT_SECRET));
  assert.deepEqual(calls[0].params, [8, 'active']);
});
test('invalid and repeated service filters are rejected before querying', async () => {
  calls.length = 0;
  for (const query of ['status=bad', 'status=', 'category_id=0', 'category_id=1e2', 'category_id=4294967296', 'billing_cycle=weekly', 'search=a&search=b', 'status=active&status=inactive', 'category_id=1&category_id=2', 'billing_cycle=monthly&billing_cycle=yearly', `search=${'a'.repeat(201)}`]) {
    assert.equal((await request('GET', `/api/services?${query}`)).status, 400, query);
  }
  assert.equal(calls.length, 0);
});
