import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, MessageSquare, Code2 } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  const { data: chatbots } = await supabase
    .from("chatbots")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <a
          href="/dashboard/chatbots/new"
          className="flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
        >
          <Plus className="h-4 w-4" />
          New Chatbot
        </a>
      </div>

      {chatbots && chatbots.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {chatbots.map((bot) => (
            <div
              key={bot.id}
              className="rounded-lg border bg-white p-4 hover:shadow-md transition-shadow"
            >
              <Link href={`/dashboard/chatbots/${bot.id}`} className="block">
                <div className="flex items-center gap-3 mb-2">
                  <MessageSquare className="h-5 w-5 text-gray-400" />
                  <h2 className="font-semibold">{bot.name}</h2>
                </div>
                {bot.description && (
                  <p className="text-sm text-gray-500 line-clamp-2">{bot.description}</p>
                )}
              </Link>
              <div className="mt-3 pt-3 border-t flex items-center gap-2">
                <Link
                  href={`/dashboard/chatbots/${bot.id}/embed`}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-black transition-colors"
                >
                  <Code2 className="h-3.5 w-3.5" />
                  Embed
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <MessageSquare className="mx-auto h-12 w-12 mb-3 text-gray-300" />
          <p>No chatbots yet</p>
          <a href="/dashboard/chatbots/new" className="text-sm text-black underline mt-1 inline-block">
            Create your first chatbot
          </a>
        </div>
      )}
    </div>
  );
}
