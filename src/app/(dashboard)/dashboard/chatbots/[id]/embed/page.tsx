import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { EmbedSettings } from "./EmbedSettings";

interface Props {
  params: { id: string };
}

export default async function EmbedPage({ params }: Props) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  const { data: chatbot } = await supabase
    .from("chatbots")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", session.user.id)
    .single();

  if (!chatbot) return notFound();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">Embed {chatbot.name}</h1>
      <p className="text-gray-600 mb-6">
        Add this chatbot to any website using iframe or a script snippet.
      </p>

      <EmbedSettings
        chatbotId={chatbot.id}
        chatbotName={chatbot.name}
        isPublished={chatbot.is_published}
        baseUrl={baseUrl}
      />
    </div>
  );
}
