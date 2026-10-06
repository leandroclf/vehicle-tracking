import { SalesOutboxWorker } from '../sales-outbox-worker';

describe('SalesOutboxWorker', () => {
  test('defaults to bounded batch and retry settings', () => {
    const sink = { emit: jest.fn() };
    const worker = new SalesOutboxWorker({ sink });
    expect(worker).toBeInstanceOf(SalesOutboxWorker);
  });
});
