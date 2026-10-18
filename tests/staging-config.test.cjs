const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { validate } = require('../scripts/validate-staging-config.cjs');

const base = fs.readFileSync(path.join(__dirname, '..', 'wrangler.toml'), 'utf8');
test('staging configuration is isolated and has no production secrets', () => {
  assert.deepEqual(validate(base), []);
});
test('reject shared production Worker name', () => {
  assert.ok(validate(base.replace('name = "yukz-app-staging"', 'name = "yukz-app"')).length);
});
test('reject production environment or secret values in staging', () => {
  assert.ok(validate(base.replace('APP_ENV = "staging"', 'APP_ENV = "production"')).length);
  assert.ok(validate(base.replace('[env.staging.vars]', '[env.staging.vars]\nDATABASE_URL = "sensitive"')).length);
});
test('reject staging routes and additional binding sections', () => {
  assert.ok(validate(base.replace('name = "yukz-app-staging"', 'name = "yukz-app-staging"\nroute = "example.com/*"')).length);
  assert.ok(validate(base + '\n[env.staging.d1_databases]\ndatabase_id = "a"\n').length);
});
test('reject missing or repeated staging sections', () => {
  assert.ok(validate(base.replace('[env.staging]', '[env.staging-removed]')).length);
  assert.ok(validate(base + '\n[env.staging.vars]\nENVIRONMENT = "staging"\n').length);
});

test('OpenNext adapter has committed non-interactive config without cloud bindings', () => {
  const file = path.join(__dirname, '..', 'open-next.config.ts');
  const config = fs.readFileSync(file, 'utf8');
  assert.match(config, /defineCloudflareConfig\(\)/);
  assert.match(config, /from ["']@opennextjs\/cloudflare["']/);
  assert.doesNotMatch(config, /(?:kv|r2)IncrementalCache|process\.env\./);
});
