"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";

interface Document {
  id: string;
  name: string;
}

interface Props {
  documents: Document[];
}

export function CreateChatbotForm({ documents }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const toggleDoc = (id: string) => {
    setSelectedDocs((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/chatbots/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, documentIds: selectedDocs }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create chatbot");
      }

      router.push(`/dashboard/chatbots/${data.chatbot.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create chatbot");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:border-black focus:ring-1 focus:ring-black outline-none"
          placeholder="My support chatbot"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:border-black focus:ring-1 focus:ring-black outline-none"
          placeholder="What does this chatbot do?"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">
          Documents ({documents.length} ready)
        </label>
        {documents.length === 0 ? (
          <p className="text-sm text-gray-500">
            No documents ready.{" "}
            <a href="/dashboard/upload" className="underline hover:text-black">
              Upload documents first
            </a>
            .
          </p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2">
            {documents.map((doc) => (
              <label
                key={doc.id}
                className={`flex items-center gap-3 rounded-md px-3 py-2 cursor-pointer text-sm transition-colors ${
                  selectedDocs.includes(doc.id)
                    ? "bg-black text-white"
                    : "hover:bg-gray-100"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedDocs.includes(doc.id)}
                  onChange={() => toggleDoc(doc.id)}
                  className="accent-white"
                />
                {doc.name}
              </label>
            ))}
          </div>
        )}
      </div>
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 animate-fade-in">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-black px-4 py-2 text-white font-medium transition-all duration-200 hover:bg-gray-800 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? "Creating..." : "Create Chatbot"}
      </button>
    </form>
  );
}
