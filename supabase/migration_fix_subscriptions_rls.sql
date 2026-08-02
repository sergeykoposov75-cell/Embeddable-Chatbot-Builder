DROP POLICY IF EXISTS "Users can read own subscription" ON public.subscriptions;
CREATE POLICY "Users can read own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own subscription" ON public.subscriptions;
CREATE POLICY "Users can insert own subscription"
  ON public.subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own subscription" ON public.subscriptions;
CREATE POLICY "Users can update own subscription"
  ON public.subscriptions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
