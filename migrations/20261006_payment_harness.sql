CREATE TABLE IF NOT EXISTS payment_tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  country char(2),
  default_currency char(3) NOT NULL DEFAULT 'BRL',
  created_at timestamp NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS payment_tenant_users (
  tenant_id uuid NOT NULL REFERENCES payment_tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  PRIMARY KEY (tenant_id,user_id)
);
CREATE TABLE IF NOT EXISTS payment_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES payment_tenants(id),
  user_id uuid REFERENCES users(id),
  gateway text NOT NULL,
  plan_id text NOT NULL,
  external_customer_id text,
  external_subscription_id text NOT NULL,
  status text NOT NULL,
  access_status text NOT NULL DEFAULT 'blocked',
  currency char(3),
  amount_minor bigint,
  next_cycle_at timestamp,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  UNIQUE(gateway,external_subscription_id)
);
CREATE TABLE IF NOT EXISTS payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES payment_tenants(id),
  subscription_id uuid REFERENCES payment_subscriptions(id),
  gateway text NOT NULL,
  external_transaction_id text NOT NULL,
  amount_minor bigint NOT NULL,
  currency char(3) NOT NULL,
  status text NOT NULL,
  occurred_at timestamp NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  UNIQUE(gateway,external_transaction_id)
);
CREATE TABLE IF NOT EXISTS payment_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key text NOT NULL UNIQUE,
  gateway text NOT NULL,
  external_event_id text NOT NULL,
  external_resource_id text NOT NULL,
  event_type text NOT NULL,
  action text NOT NULL,
  normalized_status text NOT NULL,
  processed_at timestamp NOT NULL DEFAULT now()
);
