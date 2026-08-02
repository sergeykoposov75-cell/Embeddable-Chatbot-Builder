-- Fix RLS: add WITH CHECK for INSERT policies on chatbots and documents

DROP POLICY IF EXISTS "Users can CRUD own chatbots" ON public.chatbots;
CREATE POLICY "Users can CRUD own chatbots"
  ON public.chatbots FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can CRUD own documents" ON public.documents;
CREATE POLICY "Users can CRUD own documents"
  ON public.documents FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
