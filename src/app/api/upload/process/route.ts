import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { Mistral } from "@mistralai/mistralai";

const MISTRAL_EMBED_MODEL = "mistral-embed";
const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 200;
const BATCH_SIZE = 10;
const MAX_CONCURRENT_BATCHES = 3;

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

async function extractText(buffer: Buffer, name: string): Promise<string> {
  const lowerName = name.toLowerCase();

  if (lowerName.endsWith(".pdf")) {
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (lowerName.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  return buffer.toString("utf-8");
}

async function getEmbeddings(texts: string[], apiKey: string): Promise<number[][]> {
  const mistral = new Mistral({ apiKey });

  const batches: string[][] = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    batches.push(texts.slice(i, i + BATCH_SIZE));
  }

  const results: number[][][] = new Array(batches.length);

  let batchIndex = 0;
  async function worker() {
    while (batchIndex < batches.length) {
      const current = batchIndex;
      batchIndex += 1;
      const response = await mistral.embeddings.create({
        model: MISTRAL_EMBED_MODEL,
        inputs: batches[current],
      });
      const data = response as unknown as { data: { embedding: number[] }[] };
      results[current] = data.data.map((d) => d.embedding);
    }
  }

  const workers = Array.from(
    { length: Math.min(MAX_CONCURRENT_BATCHES, batches.length) },
    () => worker()
  );
  await Promise.all(workers);

  return results.flat();
}

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const documentId = body.documentId as string | undefined;

  if (!documentId) {
    return NextResponse.json({ error: "Missing documentId" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { data: doc, error: docError } = await supabase
    .from("documents")
    .select("*")
    .eq("id", documentId)
    .eq("user_id", userId)
    .single();

  if (docError || !doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const safeName = (doc.name as string).replace(/[^\w.\-]/g, "_");
  const filePath = `${userId}/${documentId}/${safeName}`;

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    await supabase.from("documents").update({ status: "error" }).eq("id", documentId);
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is not configured in Vercel — add it in Project Settings → Environment Variables." },
      { status: 500 }
    );
  }

  const admin = adminClient();
  const { data: fileBlob, error: downloadError } = await admin.storage
    .from("documents")
    .download(filePath);

  if (downloadError || !fileBlob) {
    await supabase.from("documents").update({ status: "error" }).eq("id", documentId);
    return NextResponse.json(
      { error: `File not found in storage: ${downloadError?.message ?? "unknown"}` },
      { status: 500 }
    );
  }

  const buffer = Buffer.from(await fileBlob.arrayBuffer());

  const { data: urlData } = admin.storage.from("documents").getPublicUrl(filePath);
  await supabase.from("documents").update({ file_url: urlData.publicUrl }).eq("id", documentId);

  try {
    const text = await extractText(buffer, doc.name as string);

    if (!text.trim()) {
      await supabase.from("documents").update({ status: "error" }).eq("id", documentId);
      const name = (doc.name as string).toLowerCase();
      const message = name.endsWith(".pdf")
        ? "This PDF appears to be a scan or image-only — it has no text layer to extract. Upload a text-based PDF (exported from Word/browser) or use DOCX/TXT instead."
        : name.endsWith(".docx")
          ? "No text could be extracted from this DOCX. The file may be corrupt or protected."
          : "No text could be extracted from this file.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const chunks = splitText(text, CHUNK_SIZE, CHUNK_OVERLAP);

    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      await supabase.from("documents").update({ status: "error" }).eq("id", documentId);
      return NextResponse.json({ error: "MISTRAL_API_KEY not configured" }, { status: 500 });
    }

    const embeddings = await getEmbeddings(chunks, apiKey);

    const chunkRows = chunks.map((content, i) => ({
      document_id: documentId,
      content,
      embedding: embeddings[i] || [],
      metadata: { chunk_index: i },
    }));

    const { error: chunkError } = await supabase.from("chunks").insert(chunkRows);

    if (chunkError) {
      await supabase.from("documents").update({ status: "error" }).eq("id", documentId);
      return NextResponse.json({ error: `Chunk insert failed: ${chunkError.message}` }, { status: 500 });
    }

    await supabase.from("documents").update({ status: "ready" }).eq("id", documentId);

    return NextResponse.json({
      success: true,
      documentId,
      chunks: chunks.length,
    });
  } catch (err) {
    await supabase.from("documents").update({ status: "error" }).eq("id", documentId);
    const message = err instanceof Error ? err.message : "Processing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}



        

  
   
    

  
          

    

    
    
  
