import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CreateChatbotForm } from "./CreateChatbotForm";

export default async function NewChatbotPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  const { data: documents } = await supabase
    .from("documents")
    .select("id, name")
    .eq("user_id", session.user.id)
    .eq("status", "ready");

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create Chatbot</h1>
      <CreateChatbotForm documents={documents || []} />
    </div>
  );
}
