const test = require('node:test');
const assert = require('node:assert/strict');
const { decodeTeltonikaCodec8 } = require('../teltonika-decoder');

test('Teltonika legacy behavior conformance', async (t) => {
  await t.test('recognizes 15-digit IMEI authentication frame', () => {
    const frame=Buffer.concat([Buffer.from([0x00,0x0f]),Buffer.from('135790246811220','ascii')]);
    assert.deepEqual(decodeTeltonikaCodec8(frame),{type:'imei',imei:'135790246811220'});
  });
  await t.test('rejects malformed/short frames deterministically', () => {
    assert.equal(decodeTeltonikaCodec8(Buffer.from([1,2,3])),null);
  });
});
