"use client";

import { useState } from "react";
import { FileText, Save } from "lucide-react";

interface Props {
  chatbotId: string;
  documents: { id: string; name: string }[];
  current: string[];
}

export function DocumentAttacher({ chatbotId, documents, current }: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(current);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const save = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/chatbots/${chatbotId}/documents`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentIds: selected }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save documents");
      setStatus({ type: "ok", text: `Saved: ${data.count} document(s) attached.` });
    } catch (err) {
      setStatus({
        type: "error",
        text: err instanceof Error ? err.message : "Save failed",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border-b bg-white">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-4 py-2 text-sm font-medium hover:bg-gray-50"
      >
        <FileText className="h-4 w-4 text-gray-500" />
        Documents ({selected.length}/{documents.length})
        <span className="ml-auto text-xs text-gray-400">{open ? "Hide" : "Manage"}</span>
      </button>

      {open && (
        <div className="space-y-2 px-4 pb-3">
          {documents.length === 0 && (
            <p className="text-sm text-gray-500">
              No ready documents yet. Upload documents first.
            </p>
          )}
          <div className="max-h-40 divide-y overflow-y-auto rounded-lg border">
            {documents.map((doc) => (
              <label
                key={doc.id}
                className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(doc.id)}
                  onChange={() => toggle(doc.id)}
                />
                <span className="truncate">{doc.name}</span>
              </label>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-black px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {saving ? (
                "Saving..."
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" /> Save
                </>
              )}
            </button>
            {status && (
              <span
                className={`text-sm ${
                  status.type === "ok" ? "text-green-600" : "text-red-600"
                }`}
              >
                {status.text}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
