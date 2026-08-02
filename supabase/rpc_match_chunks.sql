CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding VECTOR(1024),
  match_threshold FLOAT,
  match_count INT
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
    chunks.id,
    chunks.document_id,
    chunks.content,
    chunks.metadata,
    1 - (chunks.embedding <=> query_embedding) AS similarity
  FROM chunks
  WHERE 1 - (chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
