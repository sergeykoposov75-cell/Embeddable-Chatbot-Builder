import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", id)
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (docError || !doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const safeName = (doc.name as string).replace(/[^\w.\-]/g, "_");
    const filePath = `${session.user.id}/${doc.id}/${safeName}`;

    const admin = adminClient();
    const { error: storageError } = await admin.storage
      .from("documents")
      .remove([filePath]);

    if (
      storageError &&
      !storageError.message?.toLowerCase().includes("not found") &&
      !storageError.message?.toLowerCase().includes("not_exist")
    ) {
      return NextResponse.json(
        { error: `Storage delete failed: ${storageError.message}` },
        { status: 500 }
      );
    }

    const { error: deleteError } = await supabase
      .from("documents")
      .delete()
      .eq("id", doc.id)
      .eq("user_id", session.user.id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
