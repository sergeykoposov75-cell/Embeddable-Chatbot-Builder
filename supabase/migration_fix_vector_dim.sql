-- Fix vector dimension: Mistral Embed outputs 1024, not 1536
-- pgvector cannot ALTER column dimension, so we drop and recreate

DROP FUNCTION IF EXISTS public_match_chunks(VECTOR(1024), FLOAT, INT);
DROP FUNCTION IF EXISTS match_chunks(VECTOR(1024), FLOAT, INT);

ALTER TABLE chunks DROP COLUMN embedding;
ALTER TABLE chunks ADD COLUMN embedding VECTOR(1024);

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

CREATE OR REPLACE FUNCTION public_match_chunks(
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
SECURITY DEFINER
SET search_path = ''
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
