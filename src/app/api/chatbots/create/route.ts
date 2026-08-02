import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkLimits } from "@/lib/plans";

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description, documentIds } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (!Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json({ error: "Select at least one document" }, { status: 400 });
    }

    const { data: docs } = await supabase
      .from("documents")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("status", "ready")
      .in("id", documentIds);

    if (!docs || docs.length !== documentIds.length) {
      return NextResponse.json(
        { error: "One or more documents are invalid or not ready" },
        { status: 400 }
      );
    }

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan")
      .eq("user_id", session.user.id)
      .maybeSingle();

    const plan = (sub?.plan as string) || "free";

    const limit = await checkLimits(supabase, session.user.id, plan);
    if (!limit.ok) {
      return NextResponse.json({ error: limit.error }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("chatbots")
      .insert({
        user_id: session.user.id,
        name,
        description,
        model: "mistral-large-latest",
      })
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: `Failed to create chatbot: ${error?.message ?? "unknown"}` }, { status: 500 });
    }

    const { error: linkError } = await supabase
      .from("chatbot_documents")
      .insert(
        documentIds.map((documentId: string) => ({
          chatbot_id: data.id,
          document_id: documentId,
        }))
      );

    if (linkError) {
      await supabase.from("chatbots").delete().eq("id", data.id);
      return NextResponse.json(
        { error: `Failed to attach documents: ${linkError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ chatbot: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
