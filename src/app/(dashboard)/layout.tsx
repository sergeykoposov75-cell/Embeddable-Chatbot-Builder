import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LayoutDashboard, MessageSquare, Upload, FileText, Plus, LogOut, Code2, CreditCard } from "lucide-react";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  const { data: chatbots } = await supabase
    .from("chatbots")
    .select("id, name")
    .eq("user_id", session.user.id);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-60 border-r bg-white flex flex-col shrink-0">
        <div className="p-4 border-b">
          <Link href="/dashboard" className="text-xl font-bold">ChatbotBuilder</Link>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-gray-100"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <Link
            href="/dashboard/chatbots/new"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-gray-100"
          >
            <Plus className="h-4 w-4" />
            New Chatbot
          </Link>
          <Link
            href="/dashboard/upload"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-gray-100"
          >
            <Upload className="h-4 w-4" />
            Upload
          </Link>
          <Link
            href="/dashboard/documents"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-gray-100"
          >
            <FileText className="h-4 w-4" />
            Documents
          </Link>
          <Link
            href="/dashboard/billing"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-gray-100"
          >
            <CreditCard className="h-4 w-4" />
            Billing
          </Link>

          {chatbots && chatbots.length > 0 && (
            <>
              <div className="pt-3 pb-1">
                <p className="px-3 text-xs font-medium text-gray-400 uppercase">Chatbots</p>
              </div>
              {chatbots.map((bot) => (
                <div key={bot.id} className="group relative">
                  <Link
                    href={`/dashboard/chatbots/${bot.id}`}
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-gray-100"
                  >
                    <MessageSquare className="h-4 w-4 text-gray-400 shrink-0" />
                    <span className="truncate">{bot.name}</span>
                  </Link>
                  <Link
                    href={`/dashboard/chatbots/${bot.id}/embed`}
                    className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-gray-700 hover:bg-gray-200 transition-opacity"
                    title="Embed"
                  >
                    <Code2 className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))}
            </>
          )}
        </nav>
        <div className="p-3 border-t">
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 w-full"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
