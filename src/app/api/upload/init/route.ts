import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkLimits } from "@/lib/plans";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const fileName = (body.fileName as string | undefined)?.trim();
    if (!fileName) {
      return NextResponse.json({ error: "Missing fileName" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan")
      .eq("user_id", userId)
      .maybeSingle();

    const limit = await checkLimits(supabase, userId, (sub?.plan as string) || "free");
    if (!limit.ok) {
      return NextResponse.json({ error: limit.error }, { status: 403 });
    }

    // Ensure user record exists — critical when schema was applied after signup
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .maybeSingle();
    if (!existing) {
      await supabase.from("users").upsert({
        id: userId,
        email: session.user.email ?? "unknown",
        name: session.user.user_metadata?.name ?? session.user.email?.split("@")[0] ?? "User",
      });
    }

    const { data: doc, error: docError } = await supabase
      .from("documents")
      .insert({ user_id: userId, name: fileName, status: "processing" })
      .select()
      .single();
    if (docError || !doc) {
      return NextResponse.json(
        { error: `Document insert failed: ${docError?.message ?? "unknown"}` },
        { status: 500 }
      );
    }

    const safeName = fileName.replace(/[^\w.\-]/g, "_");
    const uploadPath = `${userId}/${doc.id}/${safeName}`;

    return NextResponse.json({ documentId: doc.id, uploadPath });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Init failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
