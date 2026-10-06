const fs = require('fs');

const schema = JSON.parse(fs.readFileSync('contracts/product-event.schema.json', 'utf8'));
const required = new Set(schema.required);
const allowed = new Set(Object.keys(schema.properties));
const expectedEvents = new Set([
  'signup_completed','activation_completed','feature_used','limit_reached',
  'upgrade_intent','subscription_changed','feedback_submitted'
]);

if (schema.additionalProperties !== false) throw new Error('Product event schema must reject arbitrary top-level fields');
for (const field of ['event','product_id','environment','release_sha','occurred_at']) {
  if (!required.has(field)) throw new Error(`Missing required field: ${field}`);
}
const actualEvents = new Set(schema.properties.event.enum);
if (actualEvents.size !== expectedEvents.size || [...expectedEvents].some((e) => !actualEvents.has(e))) {
  throw new Error('Canonical event enum drift detected');
}
for (const pii of ['email','phone','name','gps','imei','plate','vin','token']) {
  if (allowed.has(pii)) throw new Error(`Forbidden generic analytics field: ${pii}`);
}
console.log('Product Harness contract conformance passed');
