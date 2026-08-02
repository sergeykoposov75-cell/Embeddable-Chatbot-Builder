-- Link chatbots to their documents
CREATE TABLE IF NOT EXISTS public.chatbot_documents (
  chatbot_id UUID NOT NULL REFERENCES public.chatbots(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  PRIMARY KEY (chatbot_id, document_id)
);

ALTER TABLE public.chatbot_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own chatbot_documents" ON public.chatbot_documents;
CREATE POLICY "Users can manage own chatbot_documents"
  ON public.chatbot_documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.chatbots
      WHERE chatbots.id = chatbot_id AND chatbots.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chatbots
      WHERE chatbots.id = chatbot_id AND chatbots.user_id = auth.uid()
    )
  );
