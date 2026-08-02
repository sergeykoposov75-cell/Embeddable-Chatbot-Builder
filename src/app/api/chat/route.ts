import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { checkMessageLimit, incrementMessageUsage } from "@/lib/plans";
import { Mistral } from "@mistralai/mistralai";

const MISTRAL_EMBED_MODEL = "mistral-embed";
const MISTRAL_CHAT_MODEL = "mistral-large-latest";

const SYSTEM_PROMPT =
  "You are a helpful assistant that answers questions based on the provided documents. " +
  "Use ONLY the context below to answer. If the answer is not in the context, say you don't know. " +
  "Be concise and accurate.\n\nContext:\n{context}";

export async function POST(req: NextRequest) {
  try {
    const { message, chatbotId, conversationId } = await req.json();

    if (!message || !chatbotId) {
      return NextResponse.json({ error: "Missing message or chatbotId" }, { status: 400 });
    }

    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "MISTRAL_API_KEY not configured" }, { status: 500 });
    }

    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: chatbot } = await supabase
      .from("chatbots")
      .select("id")
      .eq("id", chatbotId)
      .eq("user_id", session.user.id)
      .single();

    if (!chatbot) {
      return NextResponse.json({ error: "Chatbot not found" }, { status: 404 });
    }

    const admin = adminClient();
    const limitResult = await checkMessageLimit(admin, session.user.id);
    if (!limitResult.ok) {
      return NextResponse.json({ error: limitResult.error }, { status: 429 });
    }

    const mistral = new Mistral({ apiKey });

    const embedResponse = await mistral.embeddings.create({
      model: MISTRAL_EMBED_MODEL,
      inputs: [message],
    });
    const embedData = embedResponse as unknown as { data: { embedding: number[] }[] };
    const embedding = embedData.data[0].embedding;

    const { data: chunks } = await supabase.rpc("match_chunks_for_chatbot", {
      query_embedding: embedding,
      match_threshold: 0.5,
      match_count: 5,
      p_chatbot_id: chatbotId,
    });

    const context = (chunks as { content: string }[] || [])
      .map((c) => c.content)
      .join("\n\n");

    const fullPrompt = SYSTEM_PROMPT.replace("{context}", context || "No relevant documents found.");

    const chatResponse = await mistral.chat.complete({
      model: MISTRAL_CHAT_MODEL,
      messages: [
        { role: "system", content: fullPrompt },
        { role: "user", content: message },
      ],
    });

    const reply = (chatResponse as unknown as { choices: { message: { content: string } }[] })
      ?.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response.";

    await incrementMessageUsage(admin, session.user.id);

    return NextResponse.json({ reply });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Chat error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
