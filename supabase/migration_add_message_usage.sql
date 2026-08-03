-- Message usage tracking on subscriptions
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS messages_used INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS period_start TIMESTAMPTZ;

-- One subscription row per user (also fixes duplicate upserts)
-- DROP+ADD so re-runs don't fail with 'relation subscriptions_user_id_key already exists'
ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_user_id_key;
ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_user_id_key UNIQUE (user_id);

-- Align plan names with the app (code uses 'business', constraint used 'enterprise')
ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_plan_check;
ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_plan_check
  CHECK (plan IN ('free', 'pro', 'business'));

-- Atomic per-request increment (SECURITY DEFINER, works with service role)
CREATE OR REPLACE FUNCTION public.increment_message_usage(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan, messages_used, period_start)
  VALUES (p_user_id, 'free', 1, now())
  ON CONFLICT (user_id)
  DO UPDATE SET messages_used = subscriptions.messages_used + 1,
                period_start = COALESCE(subscriptions.period_start, now()),
                updated_at = now();
END;
$$;
