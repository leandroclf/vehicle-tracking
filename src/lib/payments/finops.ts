import { getDbPool } from '@/lib/database';
export interface GatewayFinOps {gateway:string;currency:string;tpvMinor:number;paidCount:number;failedCount:number;approvalRate:number;gatewayFeeMinor:number;netRevenueMinor:number;effectiveFeeRate:number;}
export async function getGatewayFinOps(from:Date,to:Date):Promise<GatewayFinOps[]>{
 const r=await getDbPool().query(`SELECT gateway,currency,
 COALESCE(SUM(CASE WHEN status='paid' THEN amount_minor ELSE 0 END),0)::bigint tpv,
 COUNT(*) FILTER (WHERE status='paid')::int paid,
 COUNT(*) FILTER (WHERE status='failed')::int failed,
 COALESCE(SUM(gateway_fee_minor),0)::bigint fees,
 COALESCE(SUM(net_amount_minor),0)::bigint net
 FROM payment_transactions WHERE occurred_at >= $1 AND occurred_at < $2 GROUP BY gateway,currency`,[from,to]);
 return r.rows.map(x=>{const paid=Number(x.paid),failed=Number(x.failed),tpv=Number(x.tpv),fees=Number(x.fees);return {gateway:x.gateway,currency:x.currency,tpvMinor:tpv,paidCount:paid,failedCount:failed,approvalRate:paid+failed?paid/(paid+failed):0,gatewayFeeMinor:fees,netRevenueMinor:Number(x.net),effectiveFeeRate:tpv?fees/tpv:0};});
}
