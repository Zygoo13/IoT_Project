import assert from 'node:assert/strict';
import fs from 'node:fs';

const base = process.env.IOT_VERIFY_BASE_URL || 'http://localhost:8088';
const env = {};
for (const line of fs.readFileSync(new URL('../.env', import.meta.url), 'utf8').split(/\r?\n/)) {
  const separator = line.indexOf('=');
  if (separator > 0 && !line.trimStart().startsWith('#')) {
    env[line.slice(0, separator).trim()] = line.slice(separator + 1);
  }
}

let checks = 0;
async function call(path, expected, options = {}) {
  const response = await fetch(base + path, { ...options, signal: AbortSignal.timeout(10000) });
  assert.equal(response.status, expected, path);
  checks++;
  return response;
}

const spec = await (await call('/v3/api-docs', 200)).json();
assert.equal(spec.components.securitySchemes.bearerAuth.scheme, 'bearer');
assert.deepEqual(spec.paths['/api/auth/login'].post.security, []);
assert.equal(spec.servers[0].url, '/');
const operations = Object.values(spec.paths).flatMap(path => Object.entries(path)
  .filter(([method]) => ['get', 'post', 'put'].includes(method)));
assert.equal(operations.length, 7);
const command = spec.paths['/api/devices/{deviceId}/actions'].post;
assert.ok(command.responses['202'] && command.responses['503']);
assert.ok(!command.responses['200']);
assert.ok(!spec.components.schemas.ProfileResponse.properties.passwordHash);
assert.deepEqual(spec.components.schemas.CommandRequest.properties.action.enum, ['ON', 'OFF']);
assert.equal(spec.components.schemas.LoginRequest.properties.password.writeOnly, true);
const size = spec.paths['/api/sensor-data'].get.parameters.find(parameter => parameter.name === 'size');
assert.equal(size.schema.maximum, 20);
const status = spec.paths['/api/action-history'].get.parameters.find(parameter => parameter.name === 'status');
assert.ok(status.schema.enum.includes('PROCESSING'));

// Kiểm tra mọi schema reference để phát hiện tài liệu sinh thiếu DTO.
function checkReferences(value) {
  if (!value || typeof value !== 'object') return;
  if (value.$ref?.startsWith('#/')) {
    const target = value.$ref.slice(2).split('/').reduce((node, key) => node?.[key], spec);
    assert.ok(target, value.$ref);
  }
  Object.values(value).forEach(checkReferences);
}
checkReferences(spec);
await call('/swagger-ui/index.html', 200);
await call('/swagger-ui/swagger-ui-bundle.js', 200);
await call('/v3/api-docs/swagger-config', 200);
await call('/v3/api-docs.yaml', 200);
await call('/api/profile', 401);
await call('/api/sensor-data', 401);
await call('/api/action-history', 401);
await call('/api/profile', 401, {method: 'PUT', headers: {'Content-Type': 'application/json'}, body: '{}'});
await call('/api/devices/1/actions', 401, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: '{"action":"ON"}'});
await call('/api/dashboard', 401, {headers: {Authorization: 'Bearer invalid'}});
await call('/api/auth/login', 401, {
  method: 'POST', headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({username: 'swagger-invalid-account', password: 'invalid-test-password'})
});
const login = await (await call('/api/auth/login', 200, {
  method: 'POST', headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({username: env.IOT_SEED_USERNAME, password: env.IOT_SEED_PASSWORD})
})).json();
const headers = {Authorization: 'Bearer ' + login.token};
const profile = await (await call('/api/profile', 200, {headers})).json();
assert.ok(!('passwordHash' in profile));
const dashboard = await (await call('/api/dashboard', 200, {headers})).json();
assert.equal(dashboard.ledDemo, false);
for (const series of Object.values(dashboard.chart)) assert.ok(series.length <= 15);
await call('/api/sensor-data?size=5&sortBy=ID&order=DESC', 200, {headers});
await call('/api/action-history?size=5&status=PROCESSING', 200, {headers});
await call('/api/sensor-data?size=21', 400, {headers});
await call('/api/action-history?status=INVALID', 400, {headers});
await call('/api/sensor-data?from=2026-10-21T00:00:00Z&to=2026-10-20T00:00:00Z', 400, {headers});
for (const route of ['/login', '/dashboard', '/data-sensor', '/action-history', '/profile']) {
  const response = await call(route, 200);
  assert.ok((await response.text()).includes('<div id="root">'));
}
console.log('PASS: ' + checks + ' HTTP checks; 7 operations; schemas/JWT/queries/proxy OK. No DB writes or MQTT commands.');
