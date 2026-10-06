const { decodeTeltonikaCodec8, getCodecName } = require('../teltonika-decoder');

describe('Teltonika legacy behavior conformance', () => {
  test('recognizes 15-digit IMEI authentication frame', () => {
    const frame=Buffer.concat([Buffer.from([0x00,0x0f]),Buffer.from('135790246811220','ascii')]);
    expect(decodeTeltonikaCodec8(frame)).toEqual({type:'imei',imei:'135790246811220'});
  });
  test('retains codec names required by predecessor', () => {
    expect(getCodecName(0x08)).toBe('codec8');
    expect(getCodecName(0x8e)).toBe('codec8_extended');
    expect(getCodecName(0x10)).toBe('codec16');
  });
  test('rejects malformed/short frames deterministically', () => {
    expect(decodeTeltonikaCodec8(Buffer.from([1,2,3]))).toBeNull();
  });
});
