import crypto from 'node:crypto';
import { StripeAdapter } from '../adapters/stripe';
import { MercadoPagoAdapter } from '../adapters/mercado-pago';

describe('payment webhook signatures',()=>{
  test('validates Stripe raw-body signature',async()=>{
    const rawBody='{"id":"evt_1"}',ts='1700000000',secret='whsec_test';
    const v1=crypto.createHmac('sha256',secret).update(ts+'.'+rawBody).digest('hex');
    const adapter=new StripeAdapter('sk_test',secret);
    expect(await adapter.verifyWebhook({rawBody,headers:new Headers({'stripe-signature':'t='+ts+',v1='+v1}),url:new URL('https://app.test/api/webhooks/payments')})).toBe(true);
  });
  test('validates Mercado Pago manifest signature',async()=>{
    const secret='mp_secret',requestId='req-1',dataId='ABC123',ts='1700000000';
    const manifest='id:'+dataId.toLowerCase()+';request-id:'+requestId+';ts:'+ts+';';
    const v1=crypto.createHmac('sha256',secret).update(manifest).digest('hex');
    const adapter=new MercadoPagoAdapter('token',secret,'https://app.test/billing');
    expect(await adapter.verifyWebhook({rawBody:'{}',headers:new Headers({'x-signature':'ts='+ts+',v1='+v1,'x-request-id':requestId}),url:new URL('https://app.test/api/webhooks/payments?data.id='+dataId)})).toBe(true);
  });
});
