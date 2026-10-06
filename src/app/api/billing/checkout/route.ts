import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyAuth } from '@/lib/auth-middleware';
import { PaymentFactory } from '@/lib/payments/factory';
import { resolveBillingPrice } from '@/lib/payments/catalog';
import { getDbPool } from '@/lib/database';

const schema=z.object({plan:z.enum(['starter','pro','business']),currency:z.enum(['BRL','USD','EUR']).default('BRL'),country:z.string().length(2).optional(),preferredGateway:z.enum(['stripe','mercado_pago']).optional()});

export async function POST(request:NextRequest){
 const auth=await verifyAuth(request); if(!auth.user)return NextResponse.json({error:auth.error||'Não autorizado'},{status:auth.status||401});
 const parsed=schema.safeParse(await request.json()); if(!parsed.success)return NextResponse.json({error:'invalid_billing_request',details:parsed.error.format()},{status:400});
 const gateway=PaymentFactory.create(parsed.data); const price=await resolveBillingPrice({planId:parsed.data.plan,gateway:gateway.name,currency:parsed.data.currency});
 const membership=await getDbPool().query('SELECT tenant_id FROM payment_tenant_users WHERE user_id=$1 LIMIT 1',[auth.user.id]);
 const tenantId=membership.rows[0]?.tenant_id; if(!tenantId)return NextResponse.json({error:'billing_tenant_required'},{status:409});
 const user=await getDbPool().query('SELECT email,name FROM users WHERE id=$1 LIMIT 1',[auth.user.id]); const identity=user.rows[0]; if(!identity?.email)return NextResponse.json({error:'billing_identity_required'},{status:409});
 const customer=await gateway.createCustomer({tenantId:String(tenantId),userId:auth.user.id,email:identity.email,name:identity.name||undefined});
 const subscription=await gateway.createSubscription({tenantId:String(tenantId),customerExternalId:customer.id,planExternalId:price.externalPriceId,email:identity.email});
 await getDbPool().query(`INSERT INTO payment_subscriptions (tenant_id,user_id,gateway,plan_id,external_customer_id,external_subscription_id,status,access_status,currency,amount_minor)
 VALUES ($1,$2,$3,$4,$5,$6,$7,'blocked',$8,$9)
 ON CONFLICT (gateway,external_subscription_id) DO NOTHING`,[tenantId,auth.user.id,gateway.name,parsed.data.plan,customer.id,subscription.id,subscription.status||'pending',parsed.data.currency,price.amountMinor]);
 return NextResponse.json({gateway:gateway.name,subscriptionId:subscription.id,status:subscription.status,checkoutUrl:subscription.checkoutUrl,clientSecret:subscription.clientSecret},{status:201});
}
