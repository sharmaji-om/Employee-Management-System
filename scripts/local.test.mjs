// This file tests the local launcher and its configuration checks.
// It checks settings without starting the application or using real credentials.
// Run npm run test:launcher from the project root.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:net';
import { loadEnvironment, validateConfiguration, assertPortAvailable } from './local.mjs';

const valid = {
  DATABASE_URL: 'jdbc:postgresql://example.test:5432/neondb?sslmode=require',
  DATABASE_USER: 'neondb_owner', DATABASE_PASSWORD: 'private-db-password',
  ADMIN_EMAIL: 'admin@example.com', ADMIN_PASSWORD: 'private-admin-password',
};

test('loads quoted passwords, URL query parameters, CRLF, comments and Windows paths literally', () => {
  const directory = mkdtempSync(join(tmpdir(), 'northstar-env-'));
  try {
    writeFileSync(join(directory, '.env'), '\uFEFF# local settings\r\nDATABASE_URL=jdbc:postgresql://host/db?sslmode=require&x=y\r\nDATABASE_PASSWORD="a#b=c$!"\r\nJAVA_HOME=C:\\Program Files\\Java\\jdk-21\r\n');
    const env = loadEnvironment(directory, {});
    assert.equal(env.DATABASE_PASSWORD, 'a#b=c$!');
    assert.equal(env.DATABASE_URL, 'jdbc:postgresql://host/db?sslmode=require&x=y');
    assert.equal(env.JAVA_HOME, 'C:\\Program Files\\Java\\jdk-21');
    assert.equal(loadEnvironment(directory, { DATABASE_PASSWORD: 'shell-value' }).DATABASE_PASSWORD, 'shell-value');
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('accepts Neon and local PostgreSQL with the same configuration contract', () => {
  assert.doesNotThrow(() => validateConfiguration(valid));
  assert.doesNotThrow(() => validateConfiguration({ ...valid, DATABASE_URL: 'jdbc:postgresql://localhost:5432/people', DATABASE_USER: 'people' }));
});

test('reports missing configuration keys without printing secrets', () => {
  assert.throws(() => validateConfiguration({ ...valid, DATABASE_USER: 'YOUR_USERNAME' }), (error) => {
    assert.match(error.message, /DATABASE_USER/);
    assert.ok(!error.message.includes(valid.DATABASE_PASSWORD));
    assert.ok(!error.message.includes(valid.ADMIN_PASSWORD));
    return true;
  });
  assert.throws(() => validateConfiguration({}), /Fill these values/);
});

test('rejects non-JDBC URLs, weak admin passwords, and conflicting ports', () => {
  assert.throws(() => validateConfiguration({ ...valid, DATABASE_URL: 'postgresql://example.test/db' }), /jdbc:postgresql/);
  assert.throws(() => validateConfiguration({ ...valid, ADMIN_PASSWORD: 'short' }), /12 characters/);
  assert.throws(() => validateConfiguration({ ...valid, PORT: '5173' }), /must be different/);
  assert.throws(() => validateConfiguration({ ...valid, FRONTEND_PORT: 'not-a-port' }), /port between/);
  assert.throws(() => validateConfiguration({ ...valid, COOKIE_SECURE: 'true' }), /local HTTP/);
});

test('detects an occupied port instead of silently opening a different app', async () => {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  try { await assert.rejects(assertPortAvailable(port), /already in use/); }
  finally { await new Promise((resolve) => server.close(resolve)); }
  await assertPortAvailable(port);
});
