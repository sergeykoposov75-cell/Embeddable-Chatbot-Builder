-- Add chatbot-scoped vector search functions used by /api/chat and /api/chat/public
-- (the app now calls match_chunks_for_chatbot / public_match_chunks_for_chatbot)

-- Authenticated chat: scope vector search to one chatbot's documents (RLS enforced)
CREATE OR REPLACE FUNCTION public.match_chunks_for_chatbot(
  query_embedding VECTOR(1024),
  match_threshold FLOAT,
  match_count INT,
  p_chatbot_id UUID
)
RETURNS TABLE(
  id UUID,
  document_id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.document_id,
    c.content,
    c.metadata,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM public.chunks c
  JOIN public.chatbot_documents cd ON cd.document_id = c.document_id
  WHERE cd.chatbot_id = p_chatbot_id
    AND 1 - (c.embedding <=> query_embedding) > match_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Public embed chat: scope search to one PUBLISHED chatbot's documents (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.public_match_chunks_for_chatbot(
  query_embedding VECTOR(1024),
  match_threshold FLOAT,
  match_count INT,
  p_chatbot_id UUID
)
RETURNS TABLE(
  id UUID,
  document_id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.document_id,
    c.content,
    c.metadata,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM public.chunks c
  JOIN public.chatbot_documents cd ON cd.document_id = c.document_id
  WHERE cd.chatbot_id = p_chatbot_id
    AND EXISTS (
      SELECT 1 FROM public.chatbots b
      WHERE b.id = p_chatbot_id AND b.is_published = true
    )
    AND 1 - (c.embedding <=> query_embedding) > match_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
