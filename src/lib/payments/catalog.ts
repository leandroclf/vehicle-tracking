import { getDbPool } from '@/lib/database';
import type { Currency, PaymentGatewayName } from './types';

export interface BillingPrice { planId:string; gateway:PaymentGatewayName; currency:Currency; externalPriceId:string; amountMinor:number; billingInterval:string; }

export async function resolveBillingPrice(input:{planId:string;gateway:PaymentGatewayName;currency:Currency}):Promise<BillingPrice>{
  const result=await getDbPool().query(
    `SELECT plan_id,gateway,currency,external_price_id,amount_minor,billing_interval
       FROM payment_plan_prices
      WHERE plan_id=$1 AND gateway=$2 AND currency=$3 AND active=true
      LIMIT 1`,[input.planId,input.gateway,input.currency]);
  const row=result.rows[0]; if(!row)throw new Error('billing_price_not_configured');
  return {planId:row.plan_id,gateway:row.gateway,currency:row.currency,externalPriceId:row.external_price_id,amountMinor:Number(row.amount_minor),billingInterval:row.billing_interval};
}
