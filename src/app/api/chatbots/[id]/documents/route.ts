import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { documentIds } = await req.json();
    if (!Array.isArray(documentIds)) {
      return NextResponse.json({ error: "documentIds must be an array" }, { status: 400 });
    }

    const { data: bot } = await supabase
      .from("chatbots")
      .select("id")
      .eq("id", params.id)
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (!bot) {
      return NextResponse.json({ error: "Chatbot not found" }, { status: 404 });
    }

    const uniqueIds = Array.from(new Set(documentIds)) as string[];

    if (uniqueIds.length > 0) {
      const { data: docs, error: docsError } = await supabase
        .from("documents")
        .select("id")
        .eq("user_id", session.user.id)
        .eq("status", "ready")
        .in("id", uniqueIds);

      if (docsError || !docs || docs.length !== uniqueIds.length) {
        return NextResponse.json(
          { error: "One or more documents are invalid or not ready" },
          { status: 400 }
        );
      }
    }

    const { error: deleteError } = await supabase
      .from("chatbot_documents")
      .delete()
      .eq("chatbot_id", params.id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    if (uniqueIds.length > 0) {
      const { error: insertError } = await supabase
        .from("chatbot_documents")
        .insert(
          uniqueIds.map((documentId) => ({
            chatbot_id: params.id,
            document_id: documentId,
          }))
        );

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true, count: uniqueIds.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
