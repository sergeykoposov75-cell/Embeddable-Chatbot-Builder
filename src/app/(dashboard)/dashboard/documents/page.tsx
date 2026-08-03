import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DocumentList } from "./DocumentList";

export default async function DocumentsPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Documents</h1>
      <DocumentList documents={documents || []} />
    </div>
  );
}
