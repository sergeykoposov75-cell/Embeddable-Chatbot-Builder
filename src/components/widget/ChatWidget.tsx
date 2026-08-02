"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="mb-4 h-96 w-80 rounded-lg border bg-white shadow-xl flex flex-col">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <span className="font-semibold">Chat</span>
            <button onClick={() => setIsOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 p-4 text-sm text-gray-500">
            Chat messages will appear here.
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white shadow-lg hover:bg-gray-800"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}
