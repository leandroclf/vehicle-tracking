ALTER TABLE sales_signal_outbox
  ADD COLUMN IF NOT EXISTS locked_at timestamp,
  ADD COLUMN IF NOT EXISTS next_attempt_at timestamp;

CREATE INDEX IF NOT EXISTS sales_signal_outbox_ready_idx
  ON sales_signal_outbox (status, next_attempt_at, id);
