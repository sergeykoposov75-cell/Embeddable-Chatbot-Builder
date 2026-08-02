import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { UploadZone } from "./UploadZone";

export default async function UploadPage() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Upload Document</h1>
      <UploadZone userId={session.user.id} />
    </div>
  );
}
