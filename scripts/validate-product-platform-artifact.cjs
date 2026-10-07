const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'vendor/harness-artifact.json'), 'utf8'));
if (!/^[a-f0-9]{40}$/.test(manifest.source_commit) || manifest.file !== `product-platform-harness-${manifest.source_commit}.tgz`) {
  throw new Error('Invalid pinned harness artifact identity');
}
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
if (pkg.dependencies[manifest.package] !== `file:vendor/${manifest.file}`) throw new Error('Harness dependency is not pinned to the recorded artifact');
const hash = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'vendor', manifest.file))).digest('hex');
if (hash !== manifest.sha256) throw new Error('Harness artifact checksum mismatch');
console.log(`Harness artifact verified: ${manifest.source_commit}`);
