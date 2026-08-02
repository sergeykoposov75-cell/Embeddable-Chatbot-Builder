import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { EmbedWidget } from "./EmbedWidget";

interface Props {
  params: { chatbotId: string };
}

export default async function EmbedPage({ params }: Props) {
  const supabase = createClient();
  const { data: chatbot } = await supabase
    .from("chatbots")
    .select("id, name")
    .eq("id", params.chatbotId)
    .eq("is_published", true)
    .single();

  if (!chatbot) return notFound();

  return (
    <div className="m-0 p-0">
      <EmbedWidget chatbotId={chatbot.id} chatbotName={chatbot.name} />
    </div>
  );
}
