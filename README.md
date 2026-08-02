# Chatbot Builder

Build AI-powered chatbots from your documents. Upload PDF/DOCX/TXT files, create a chatbot, and embed it on any website.

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Supabase (Auth, Storage, PostgreSQL + pgvector) · Mistral AI · Stripe

## Features

- Landing page with pricing (Free / Pro / Business)
- Auth: signup, login, email confirmation, session middleware
- Document upload: PDF / DOCX / TXT → text extraction → chunking → embeddings
- RAG chat: vector search over your documents + Mistral AI answers
- Chatbot management: create, chat, delete conversations
- Embed widget: iframe or script tag for any website (public API, no auth)
- Billing: Stripe Checkout (or mock mode), plan display with limits

## Requirements

- Node.js 18+ and npm
- A [Supabase](https://supabase.com) project
- A [Mistral](https://console.mistral.ai) API key
- (Optional) A [Stripe](https://stripe.com) test account

## 1. Setup locally

### 1.1 Clone and install

```bash
cd ChatbotBuilder
npm install
```

### 1.2 Create `.env.local`

Copy `.env.example` to `.env.local` and fill in the values:

```bash
copy .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
MISTRAL_API_KEY=your-mistral-key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRO_PRICE_ID=price_xxxxx   # optional — leave empty for mock billing
STRIPE_WEBHOOK_SECRET=whsec_...   # optional — only for webhook testing
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Find your Supabase URL/keys in: Supabase Dashboard → Project Settings → API.

### 1.3 Initialize the database

Run the SQL init script to create all tables, RLS policies, triggers and the vector search functions:

```bash
npx tsx scripts/init-supabase.ts
```

Or manually: open **Supabase Dashboard → SQL Editor**, paste the contents of `supabase/schema.sql`, and run it.

If you already initialized the DB earlier, run the incremental migrations in `supabase/` (SQL Editor, in order):
`migration_fix_vector_dim.sql`, `migration_add_chunk_policies.sql`, `migration_fix_rls_policies.sql`,
`migration_fix_subscriptions_rls.sql`, `migration_add_message_usage.sql`, `migration_add_chatbot_documents.sql`,
`migration_add_scoped_match_functions.sql`.

> The script is idempotent — safe to run multiple times.

### 1.4 Run the dev server

```bash
npm run dev
```

Open http://localhost:3000

## 2. Usage flow

1. Register at `/signup` and confirm your email
2. Go to **Upload** → drop a PDF/DOCX/TXT file → wait for status "Ready"
3. Go to **New Chatbot** → name it, pick the documents → create
4. Chat with it at `/dashboard/chatbots/{id}`
5. Open **Embed** (`</>` icon next to the bot) → press **Publish** → copy the iframe code → paste it on any website

## 3. Enabling real Stripe billing

By default the app runs in **mock billing mode** — clicking Upgrade instantly activates the plan (no payment).

To enable real payments:

1. Create a price in Stripe Dashboard (Products → Add product → recurring monthly, e.g. $19/mo)
2. Copy its `price_...` ID into `STRIPE_PRO_PRICE_ID` in `.env.local`
3. Set `STRIPE_SECRET_KEY` (test key)
4. Restart the server

For webhook handling locally, use Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/webhook/stripe
```

Then copy the `whsec_...` secret into `STRIPE_WEBHOOK_SECRET`.

Test cards: use `4242 4242 4242 4242`, any future expiry, any CVC.

## 4. Deploy to Vercel

### 4.1 Push to GitHub

Create a repo and push the `ChatbotBuilder` folder.

### 4.2 Create a Vercel project

1. Go to [vercel.com](https://vercel.com) → New Project → import your repo
2. Framework preset: **Next.js** (auto-detected)
3. Set environment variables (same as `.env.local`) in Settings → Environment Variables
4. Deploy

### 4.3 Notes

- `SUPABASE_SERVICE_ROLE_KEY` is only used by local scripts — for Vercel you can set it too, but the app works with just `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Set `NEXT_PUBLIC_APP_URL` to your production URL so embed codes point to the right domain
- For production, create real Stripe price IDs and webhook endpoints (Vercel Dashboard → Settings → Webhooks, or Stripe Dashboard)

## Project structure

```
src/
  app/
    page.tsx                      # Landing page
    login/ signup/                # Auth pages
    (dashboard)/                  # Protected area with sidebar layout
      dashboard/                  # dashboard, upload, documents, billing, chatbots/*
    embed/[chatbotId]/            # Public embed widget
    api/
      upload/                     # File upload + RAG pipeline
      chat/ + chat/public/        # Chat API (auth / public)
      chatbots/                   # create, toggle-publish
      create-checkout-session/    # Stripe checkout
      webhook/stripe/             # Stripe webhook
  lib/
    supabase/client.ts            # Browser client
    supabase/server.ts            # Server client (cookie/session)
    supabase/admin.ts             # Service-role client (usage, webhooks)
    plans.ts                      # Plan limits + message usage
    stripeClient.ts
  components/
    ui/                           # Button, Card, Skeleton, Spinner
supabase/
  schema.sql                      # Full database schema + RLS + RPCs
  migration_*.sql                 # Incremental migrations (SQL Editor)
scripts/
  init-supabase.ts                # DB initialization script
```
