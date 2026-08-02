"use client";

import { FileText, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";

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
      {documents.map((doc) => {
        const config = statusConfig[doc.status] || statusConfig.pending;
        const Icon = config.icon;
        return (
          <div key={doc.id} className="flex items-center justify-between border rounded-lg px-4 py-3 bg-white">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium">{doc.name}</p>
                <p className="text-xs text-gray-500">
                  {new Date(doc.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className={`flex items-center gap-1.5 text-sm ${config.color}`}>
              <Icon className={`h-4 w-4 ${doc.status === "processing" ? "animate-spin" : ""}`} />
              {config.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
