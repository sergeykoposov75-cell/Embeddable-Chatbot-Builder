"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Trash2,
  Ban,
} from "lucide-react";

interface Document {
  id: string;
  name: string;
  status: string;
  created_at: string;
}

interface DocumentListProps {
  documents: Document[];
}

const statusConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; label: string }> = {
  pending: { icon: Clock, color: "text-yellow-500", label: "Pending" },
  processing: { icon: Loader2, color: "text-blue-500", label: "Processing" },
  ready: { icon: CheckCircle, color: "text-green-500", label: "Ready" },
  error: { icon: XCircle, color: "text-red-500", label: "Error" },
};

export function DocumentList({ documents }: DocumentListProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<Set<string>>(new Set());
  const [clearing, setClearing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const failedCount = documents.filter((d) => d.status === "error").length;

  async function deleteDocument(id: string) {
    if (!window.confirm("Delete this document and its processed chunks?")) return;
    setDeleting((prev) => new Set(prev).add(id));
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Delete failed");
      }
      router.refresh();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Delete failed");
      setDeleting((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  async function clearFailed() {
    const failed = documents.filter((d) => d.status === "error");
    if (failed.length === 0 || !window.confirm(`Delete ${failed.length} failed document(s)?`)) {
      return;
    }
    setClearing(true);
    setErrorMsg(null);
    for (const doc of failed) {
      try {
        const res = await fetch(`/api/documents/${doc.id}`, { method: "DELETE" });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Delete failed");
        }
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : "Delete failed");
        setClearing(false);
        return;
      }
    }
    setClearing(false);
    router.refresh();
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <FileText className="mx-auto h-12 w-12 mb-3 text-gray-300" />
        <p>No documents yet</p>
        <a href="/dashboard/upload" className="text-sm text-black underline mt-1 inline-block">
          Upload your first document
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {failedCount > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-red-500">
            {failedCount} failed document(s). Files that failed to process can be deleted.
          </p>
          <button
            onClick={clearFailed}
            disabled={clearing}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-red-300 text-red-600 rounded-md hover:bg-red-50 disabled:opacity-50"
          >
            {clearing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Ban className="h-3.5 w-3.5" />
            )}
            Clear all failed
          </button>
        </div>
      )}
      {errorMsg && <p className="text-xs text-red-500">{errorMsg}</p>}
      {documents.map((doc) => {
        const config = statusConfig[doc.status] || statusConfig.pending;
        const Icon = config.icon;
        const isDeleting = deleting.has(doc.id);
        return (
          <div
            key={doc.id}
            className="flex items-center justify-between border rounded-lg px-4 py-3 bg-white"
          >
            <div className="flex items-center gap-3 min-w-0">
              <FileText className="h-5 w-5 text-gray-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{doc.name}</p>
                <p className="text-xs text-gray-500">
                  {new Date(doc.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className={`flex items-center gap-1.5 text-sm ${config.color}`}>
                <Icon className={`h-4 w-4 ${doc.status === "processing" ? "animate-spin" : ""}`} />
                {config.label}
              </div>
              <button
                onClick={() => deleteDocument(doc.id)}
                disabled={isDeleting || doc.status === "processing"}
                title="Delete document"
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md disabled:opacity-40"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

  
    
              
