CREATE TABLE IF NOT EXISTS payment_plans (
  id text PRIMARY KEY,
  name text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS payment_plan_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id text NOT NULL REFERENCES payment_plans(id),
  gateway text NOT NULL,
  currency char(3) NOT NULL,
  external_price_id text NOT NULL,
  amount_minor bigint NOT NULL,
  billing_interval text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  UNIQUE(plan_id, gateway, currency, billing_interval)
);
ALTER TABLE payment_subscriptions
  ADD COLUMN IF NOT EXISTS current_period_end timestamp,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS grace_period_until timestamp;
INSERT INTO payment_plans (id,name) VALUES
 ('free','Free'),('starter','Starter'),('pro','Pro'),('business','Business')
ON CONFLICT (id) DO NOTHING;
