import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ChatInterface } from "./ChatInterface";
import { DocumentAttacher } from "./DocumentAttacher";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ChatbotChatPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  const { data: chatbot } = await supabase
    .from("chatbots")
    .select("*")
    .eq("id", id)
    .eq("user_id", session.user.id)
    .single();

  if (!chatbot) redirect("/dashboard");

  const { data: conversations } = await supabase
    .from("conversations")
    .select("*")
    .eq("chatbot_id", id)
    .order("created_at", { ascending: false });

  const { data: readyDocs } = await supabase
    .from("documents")
    .select("id, name")
    .eq("user_id", session.user.id)
    .eq("status", "ready")
    .order("created_at", { ascending: false });

  const { data: links } = await supabase
    .from("chatbot_documents")
    .select("document_id")
    .eq("chatbot_id", id);

  return (
    <div className="flex h-[calc(100vh)] flex-col">
      <DocumentAttacher
        chatbotId={id}
        documents={readyDocs || []}
        current={(links || []).map((l) => l.document_id)}
      />
      <div className="min-h-0 flex-1">
        <ChatInterface
          chatbot={chatbot}
          conversations={conversations || []}
          userId={session.user.id}
        />
      </div>
    </div>
  );
}
