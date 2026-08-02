"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send } from "lucide-react";

interface Props {
  chatbotId: string;
  chatbotName: string;
}

export function EmbedWidget({ chatbotId, chatbotName }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;

    const userMsg = { role: "user", content: input.trim() };
    setInput("");
    setSending(true);
    setErrorMsg(null);
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch("/api/chat/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatbotId, message: input.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to get a response");
      }

      if (data.reply) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to get a response");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 font-sans">
      {isOpen ? (
        <div className="mb-4 h-[500px] w-[360px] rounded-2xl border bg-white shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between bg-black text-white px-4 py-3">
            <span className="font-semibold text-sm">{chatbotName}</span>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 text-sm mt-20">
                Ask me anything!
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`rounded-2xl px-4 py-2 max-w-[80%] text-sm whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-black text-white rounded-br-sm"
                      : "bg-gray-100 text-gray-900 rounded-bl-sm"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-4 py-3 bg-gray-100 rounded-bl-sm">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
                    <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
                    <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
            {errorMsg && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700 animate-fade-in">
                {errorMsg}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="border-t p-3">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="flex-1 rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || sending}
                className="rounded-xl bg-black px-3 text-white hover:bg-gray-800 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <button
        onClick={() => setIsOpen(true)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-black text-white shadow-lg hover:bg-gray-800 transition-transform hover:scale-105"
      >
        <MessageCircle className="h-7 w-7" />
      </button>
    </div>
  );
}
