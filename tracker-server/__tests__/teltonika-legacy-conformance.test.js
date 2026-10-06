const { decodeTeltonikaCodec8 } = require('../teltonika-decoder');

describe('Teltonika legacy behavior conformance', () => {
  test('recognizes 15-digit IMEI authentication frame', () => {
    const frame=Buffer.concat([Buffer.from([0x00,0x0f]),Buffer.from('135790246811220','ascii')]);
    expect(decodeTeltonikaCodec8(frame)).toEqual({type:'imei',imei:'135790246811220'});
  });
  test('rejects malformed/short frames deterministically', () => {
    expect(decodeTeltonikaCodec8(Buffer.from([1,2,3]))).toBeNull();
  });
});
