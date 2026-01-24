create table if not exists billing_payments (
  order_id text primary key,
  payment_id text,
  signature text,
  plan_id text,
  amount numeric,
  currency text,
  status text,
  user_id uuid,
  email text,
  meta jsonb,
  created_at timestamptz default now()
);