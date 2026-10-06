CREATE TABLE IF NOT EXISTS "sales_signal_outbox" (
  "id" serial PRIMARY KEY NOT NULL,
  "idempotency_key" text NOT NULL,
  "kind" text NOT NULL,
  "account_id" uuid NOT NULL,
  "user_id" uuid,
  "plan_id" text,
  "feature" text,
  "occurred_at" timestamp NOT NULL,
  "status" text NOT NULL DEFAULT 'pending',
  "attempts" integer NOT NULL DEFAULT 0,
  "last_error" text,
  "delivered_at" timestamp,
  "created_at" timestamp DEFAULT now(),
  CONSTRAINT "sales_signal_outbox_idempotency_key_unique" UNIQUE("idempotency_key")
);
