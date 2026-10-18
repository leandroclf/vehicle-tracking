#!/usr/bin/env node
'use strict';
/** Static staging isolation guard. Does not invoke Cloudflare or validate remote resources. */
const fs = require('node:fs');
const path = require('node:path');

function validate(text) {
  if (typeof text !== 'string') return ['Wrangler configuration is not text'];
  const errors = [];
  const sections = {};
  let section = '';
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/\s+#.*$/, '').trim();
    if (!line || line.startsWith('#')) continue;
    const header = /^\[([a-zA-Z0-9_.-]+)\]$/.exec(line);
    if (header) {
      section = header[1];
      if (Object.hasOwn(sections, section)) errors.push('Repeated TOML section: ' + section);
      sections[section] = {};
      continue;
    }
    const match = /^([a-zA-Z0-9_-]+)\s*=\s*"([^"]*)"$/.exec(line);
    if (!match) {
      // Skip global/nested TOML syntax outside the staging and production sections;
      // do NOT attempt to substitute this check for Wrangler's full parser.
      if (section.startsWith('env.staging') || section.startsWith('env.production'))
        errors.push('Nonliteral or malformed environment value');
      continue;
    }
    if (!sections[section]) sections[section] = {};
    if (Object.hasOwn(sections[section], match[1]))
      errors.push('Repeated key: ' + section + '.' + match[1]);
    sections[section][match[1]] = match[2];
  }
  const staging = sections['env.staging'] || {};
  const stagingVars = sections['env.staging.vars'] || {};
  const productionVars = sections['env.production.vars'] || {};
  const actualProductionWorker = sections['']?.name;
  if (actualProductionWorker !== 'yukz-app') errors.push('Unexpected default production Worker name');
  if (staging.name !== 'yukz-app-staging' || staging.name === actualProductionWorker)
    errors.push('Staging Worker must use distinct approved name');
  if (Object.keys(staging).some(key => key !== 'name')) errors.push('Staging cannot declare additional bindings or routes');
  if (JSON.stringify(stagingVars) !== JSON.stringify({ ENVIRONMENT: 'staging', APP_ENV: 'staging' }))
    errors.push('Staging variables must be exactly ENVIRONMENT and APP_ENV = staging');
  if (productionVars.ENVIRONMENT !== 'production' || productionVars.APP_ENV !== 'production')
    errors.push('Existing production environment markers must remain unchanged');
  if (Object.keys(sections).some(name => name.startsWith('env.staging.') && name !== 'env.staging.vars'))
    errors.push('Staging service/secret bindings require independent review');
  if (/^\s*(?:route|routes|custom_domain|workers_dev|zone_id)\s*=/m.test((text.match(/\[env\.staging\][\s\S]*?(?=\n\[|$)/) || [''])[0]))
    errors.push('Staging cannot attach routes or domains in bootstrap');
  if (/\b(?:DATABASE_URL|JWT_SECRET|REDIS_URL|CLOUDFLARE_API_TOKEN|CLOUDFLARE_ACCOUNT_ID)\s*=/i.test(text))
    errors.push('Credential or backend endpoint declarations are forbidden in Wrangler config');
  return errors;
}
if (require.main === module) {
  const file = process.argv[2] || path.resolve(__dirname, '..', 'wrangler.toml');
  let errors;
  try {
    errors = validate(fs.readFileSync(file, 'utf8'));
  } catch {
    errors = ['Cannot read staging configuration'];
  }
  if (errors.length) {
    console.error('BLOCKED: staging isolation: ' + errors.join('; '));
    process.exitCode = 2;
  } else {
    console.log('OK: static staging Worker isolation only (no deploy, no secrets, no runtime acceptance)');
  }
}
module.exports = { validate };
