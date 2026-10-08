ALTER TABLE payment_transactions
  ADD COLUMN IF NOT EXISTS event_kind text NOT NULL DEFAULT 'charge_created',
  ADD COLUMN IF NOT EXISTS gross_amount_minor bigint,
  ADD COLUMN IF NOT EXISTS gateway_fee_minor bigint,
  ADD COLUMN IF NOT EXISTS net_amount_minor bigint,
  ADD COLUMN IF NOT EXISTS tax_amount_minor bigint;

CREATE INDEX IF NOT EXISTS payment_transactions_finops_idx
  ON payment_transactions (gateway, currency, occurred_at);
