import { getDbPool } from '@/lib/database';
export interface BillingEntitlement {tenantId:string|null;plan:string;access:'active'|'blocked';source:'subscription'|'free';}
export async function resolveBillingEntitlement(userId:string):Promise<BillingEntitlement>{
 const result=await getDbPool().query(
  `SELECT s.tenant_id,s.plan_id,s.access_status,s.status,s.current_period_end,s.grace_period_until
     FROM payment_tenant_users tu JOIN payment_subscriptions s ON s.tenant_id=tu.tenant_id
    WHERE tu.user_id=$1 ORDER BY s.updated_at DESC LIMIT 1`,[userId]);
 const row=result.rows[0]; if(!row)return {tenantId:null,plan:'free',access:'active',source:'free'};
 const now=Date.now(),period=row.current_period_end?new Date(row.current_period_end).getTime():0,grace=row.grace_period_until?new Date(row.grace_period_until).getTime():0;
 const paidWindow=row.access_status==='active'||period>now||grace>now;
 return {tenantId:String(row.tenant_id),plan:String(row.plan_id),access:paidWindow?'active':'blocked',source:'subscription'};
}
