-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own data" ON public.users;
CREATE POLICY "Users can read own data"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own data" ON public.users;
CREATE POLICY "Users can update own data"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Documents table
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'ready', 'error')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own documents" ON public.documents;
CREATE POLICY "Users can CRUD own documents"
  ON public.documents FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Chunks table (with vector support for embeddings)
CREATE TABLE IF NOT EXISTS public.chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding VECTOR(1024),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.chunks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own chunks" ON public.chunks;
CREATE POLICY "Users can read own chunks"
  ON public.chunks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE documents.id = chunks.document_id AND documents.user_id = auth.uid()
    )
  );

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

-- Chatbots table
CREATE TABLE IF NOT EXISTS public.chatbots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  system_prompt TEXT DEFAULT 'You are a helpful assistant.',
  model TEXT DEFAULT 'mistral-tiny',
  temperature FLOAT DEFAULT 0.7,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.chatbots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own chatbots" ON public.chatbots;
CREATE POLICY "Users can CRUD own chatbots"
  ON public.chatbots FOR ALL
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can read published chatbots" ON public.chatbots;
CREATE POLICY "Anyone can read published chatbots"
  ON public.chatbots FOR SELECT
  USING (is_published = true);

-- Chatbot <-> documents join table
CREATE TABLE IF NOT EXISTS public.chatbot_documents (
  chatbot_id UUID NOT NULL REFERENCES public.chatbots(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  PRIMARY KEY (chatbot_id, document_id)
);

ALTER TABLE public.chatbot_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can CRUD chatbot_documents" ON public.chatbot_documents;
CREATE POLICY "Owners can CRUD chatbot_documents"
  ON public.chatbot_documents FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.chatbots WHERE chatbots.id = chatbot_id AND chatbots.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.chatbots WHERE chatbots.id = chatbot_id AND chatbots.user_id = auth.uid())
  );

-- Chatbot-Documents link table
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

-- Conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id UUID NOT NULL REFERENCES public.chatbots(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  messages JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own conversations" ON public.conversations;
CREATE POLICY "Users can CRUD own conversations"
  ON public.conversations FOR ALL
  USING (auth.uid() = user_id);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'business')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due')),
  messages_used INTEGER NOT NULL DEFAULT 0,
  period_start TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (user_id)
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

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

-- Create a trigger to auto-create a user record on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users can CRUD own files" ON storage.objects;
CREATE POLICY "Users can CRUD own files"
  ON storage.objects FOR ALL
  USING (auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);

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

-- Atomic per-request message usage increment (used by /api/chat and /api/chat/public)
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
SET search_path = ''
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
