-- Add missing INSERT/UPDATE/DELETE policies for chunks table

DROP POLICY IF EXISTS "Users can insert chunks for own documents" ON public.chunks;
CREATE POLICY "Users can insert chunks for own documents"
  ON public.chunks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE documents.id = document_id AND documents.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own chunks" ON public.chunks;
CREATE POLICY "Users can update own chunks"
  ON public.chunks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE documents.id = document_id AND documents.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own chunks" ON public.chunks;
CREATE POLICY "Users can delete own chunks"
  ON public.chunks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE documents.id = document_id AND documents.user_id = auth.uid()
    )
  );
