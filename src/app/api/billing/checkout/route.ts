import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyAuth } from '@/lib/auth-middleware';
import { PaymentFactory } from '@/lib/payments/factory';
import { resolveBillingPrice, type BillingPrice } from '@/lib/payments/catalog';
import type { IPaymentGateway } from '@/lib/payments/gateway';
import type { GatewayRef } from '@/lib/payments/types';
import { getDbPool } from '@/lib/database';

const schema = z.object({
  plan: z.enum(['starter', 'pro', 'business']),
  currency: z.enum(['BRL', 'USD', 'EUR']).default('BRL'),
  country: z.string().length(2).optional(),
  preferredGateway: z.enum(['stripe', 'mercado_pago']).optional(),
});

// Uma tentativa 'pending' mais nova que isto é tratada como checkout em andamento (clique duplo);
// uma mais antiga é considerada abandonada e permite uma nova tentativa.
const PENDING_CHECKOUT_WINDOW_MS = 15 * 60 * 1000;
const LIVE_STATUSES = ['pending', 'active', 'past_due', 'paused'];

const fail = (error: string, status: number, extra: Record<string, unknown> = {}) =>
  NextResponse.json({ error, ...extra }, { status });

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.user) return fail(auth.error || 'Não autorizado', auth.status || 401);

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail('invalid_billing_request', 400, { details: parsed.error.format() });

  let gateway: IPaymentGateway;
  try {
    gateway = PaymentFactory.create(parsed.data);
  } catch (error) {
    console.error('billing_gateway_unavailable', error instanceof Error ? error.message : 'unknown');
    return fail('billing_gateway_unavailable', 503);
  }

  let price: BillingPrice;
  try {
    price = await resolveBillingPrice({ planId: parsed.data.plan, gateway: gateway.name, currency: parsed.data.currency });
  } catch (error) {
    if (error instanceof Error && error.message === 'billing_price_not_configured') return fail('billing_price_not_configured', 409);
    throw error;
  }

  const pool = getDbPool();
  // Determinístico: papel 'owner' primeiro e depois o menor tenant_id (a chave primária não tem timestamp).
  const membership = await pool.query(
    `SELECT tenant_id FROM payment_tenant_users WHERE user_id=$1
      ORDER BY CASE WHEN role='owner' THEN 0 ELSE 1 END, tenant_id LIMIT 1`,
    [auth.user.id],
  );
  const tenantId = membership.rows[0]?.tenant_id;
  if (!tenantId) return fail('billing_tenant_required', 409);

  const user = await pool.query('SELECT email,name FROM users WHERE id=$1 LIMIT 1', [auth.user.id]);
  const identity = user.rows[0];
  if (!identity?.email) return fail('billing_identity_required', 409);

  // Serializa os checkouts do mesmo tenant/plano/gateway: sem isso, dois cliques simultâneos criariam dois
  // clientes e duas assinaturas no provedor, porque cada chamada gera IDs externos novos.
  const client = await pool.connect();
  const lockKey = `billing:${tenantId}:${parsed.data.plan}:${gateway.name}`;
  try {
    await client.query('SELECT pg_advisory_lock(hashtext($1))', [lockKey]);

    const current = await client.query(
      `SELECT external_subscription_id,status,created_at FROM payment_subscriptions
        WHERE tenant_id=$1 AND plan_id=$2 AND gateway=$3 AND currency=$4 AND status = ANY($5)
        ORDER BY created_at DESC LIMIT 1`,
      [tenantId, parsed.data.plan, gateway.name, parsed.data.currency, LIVE_STATUSES],
    );
    const row = current.rows[0];
    if (row) {
      const age = Date.now() - new Date(row.created_at).getTime();
      const inProgress = row.status === 'pending' && age < PENDING_CHECKOUT_WINDOW_MS;
      if (row.status !== 'pending' || inProgress) {
        return fail(row.status === 'pending' ? 'billing_checkout_in_progress' : 'billing_subscription_exists', 409, {
          subscriptionId: row.external_subscription_id,
          status: row.status,
        });
      }
    }

    let subscription: GatewayRef;
    let customerId: string;
    try {
      const customer = await gateway.createCustomer({
        tenantId: String(tenantId),
        userId: auth.user.id,
        email: identity.email,
        name: identity.name || undefined,
      });
      subscription = await gateway.createSubscription({
        tenantId: String(tenantId),
        customerExternalId: customer.id,
        planExternalId: price.externalPriceId,
        email: identity.email,
      });
      customerId = customer.id;
    } catch (error) {
      console.error('billing_gateway_error', error instanceof Error ? error.message : 'unknown');
      return fail('billing_gateway_error', 502);
    }

    try {
      await client.query(
        `INSERT INTO payment_subscriptions (tenant_id,user_id,gateway,plan_id,external_customer_id,external_subscription_id,status,access_status,currency,amount_minor)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'blocked',$8,$9)
         ON CONFLICT (gateway,external_subscription_id) DO NOTHING`,
        [tenantId, auth.user.id, gateway.name, parsed.data.plan, customerId, subscription.id, subscription.status || 'pending', parsed.data.currency, price.amountMinor],
      );
    } catch (error) {
      // A assinatura já existe no provedor mas não foi gravada: cancela para não deixá-la órfã e cobrável.
      console.error('billing_persistence_failed', gateway.name, subscription.id, error instanceof Error ? error.message : 'unknown');
      try {
        await gateway.cancelSubscription(subscription.id);
      } catch (cancelError) {
        console.error('billing_orphan_subscription', gateway.name, subscription.id, cancelError instanceof Error ? cancelError.message : 'unknown');
      }
      return fail('billing_persistence_failed', 500);
    }

    return NextResponse.json(
      {
        gateway: gateway.name,
        subscriptionId: subscription.id,
        status: subscription.status,
        checkoutUrl: subscription.checkoutUrl,
        clientSecret: subscription.clientSecret,
      },
      { status: 201 },
    );
  } finally {
    await client.query('SELECT pg_advisory_unlock(hashtext($1))', [lockKey]).catch(() => undefined);
    client.release();
  }
}
