import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Mistral } from "@mistralai/mistralai";
import { checkLimits } from "@/lib/plans";

const MISTRAL_EMBED_MODEL = "mistral-embed";
const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 200;

function splitText(text: string, chunkSize: number, overlap: number): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start += chunkSize - overlap;
  }
  return chunks;
}

async function extractText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();

  if (name.endsWith(".pdf")) {
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (name.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  return buffer.toString("utf-8");
}

async function getEmbeddings(texts: string[], apiKey: string): Promise<number[][]> {
  const mistral = new Mistral({ apiKey });
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += 10) {
    const batch = texts.slice(i, i + 10);
    const response = await mistral.embeddings.create({
      model: MISTRAL_EMBED_MODEL,
      inputs: batch,
    });
    const data = response as unknown as { data: { embedding: number[] }[] };
    allEmbeddings.push(...data.data.map((d) => d.embedding));
  }

  return allEmbeddings;
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const userId = formData.get("userId") as string | null;

  if (!file || !userId) {
    return NextResponse.json({ error: "Missing file or userId" }, { status: 400 });
  }

  const supabase = createClient();

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
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
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
  }

  const { data: doc, error: docError } = await supabase
    .from("documents")
    .insert({ user_id: userId, name: file.name, status: "processing" })
    .select()
    .single();

  if (docError || !doc) {
    return NextResponse.json({ error: `Document insert failed: ${docError?.message ?? "unknown"}` }, { status: 500 });
  }

  const safeName = file.name.replace(/[^\w.\-]/g, "_");
  const bucketName = "documents";
  const filePath = `${userId}/${doc.id}/${safeName}`;

  const { error: storageError } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file, { upsert: true });

  if (storageError) {
    await supabase.from("documents").update({ status: "error" }).eq("id", doc.id);
    return NextResponse.json({ error: `Storage upload failed: ${storageError.message}` }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(filePath);

  await supabase.from("documents").update({ file_url: urlData.publicUrl }).eq("id", doc.id);

  try {
    const text = await extractText(file);

    if (!text.trim()) {
      await supabase.from("documents").update({ status: "error" }).eq("id", doc.id);
      return NextResponse.json({ error: "No text could be extracted from the file" }, { status: 400 });
    }

    const chunks = splitText(text, CHUNK_SIZE, CHUNK_OVERLAP);

    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      await supabase.from("documents").update({ status: "error" }).eq("id", doc.id);
      return NextResponse.json({ error: "MISTRAL_API_KEY not configured" }, { status: 500 });
    }

    const embeddings = await getEmbeddings(chunks, apiKey);

    const chunkRows = chunks.map((content, i) => ({
      document_id: doc.id,
      content,
      embedding: embeddings[i] || [],
      metadata: { chunk_index: i },
    }));

    const { error: chunkError } = await supabase.from("chunks").insert(chunkRows);

    if (chunkError) {
      await supabase.from("documents").update({ status: "error" }).eq("id", doc.id);
      return NextResponse.json({ error: `Chunk insert failed: ${chunkError.message}` }, { status: 500 });
    }

    await supabase.from("documents").update({ status: "ready" }).eq("id", doc.id);

    return NextResponse.json({
      success: true,
      documentId: doc.id,
      chunks: chunks.length,
    });
  } catch (err) {
    await supabase.from("documents").update({ status: "error" }).eq("id", doc.id);
    const message = err instanceof Error ? err.message : "Processing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
