import { NextResponse } from 'next/server';
import { PaymentFactory } from '@/lib/payments/factory';
import { processPaymentEventOnce } from '@/lib/payments/event-store';
import { createProductEvent, emitProductEvent } from '@/lib/product-harness/events';
import { configureProductHarness } from '@/lib/product-harness/configure';

configureProductHarness();

export const runtime = 'nodejs';

export async function POST(request:Request){
  const rawBody=await request.text();
  const input={rawBody,headers:request.headers,url:new URL(request.url)};
  try{
    const gateway=PaymentFactory.fromWebhook(request);
    if(!(await gateway.verifyWebhook(input))) return NextResponse.json({error:'invalid_signature'},{status:401});
    const event=await gateway.normalizeWebhook(input);
    const result=await processPaymentEventOnce(event);
    if (result === 'processed' && event.type === 'subscription' && event.tenantId) {
      await emitProductEvent(createProductEvent('subscription_changed', {
        account_id: event.tenantId,
        plan_id: undefined,
        feature: 'subscription',
        outcome: event.status,
      }));
    }
    return NextResponse.json({received:true,result},{status:200});
  }catch(error){
    console.error('payment_webhook_failed',error instanceof Error?error.message:'unknown');
    return NextResponse.json({error:'webhook_processing_failed'},{status:500});
  }
}
