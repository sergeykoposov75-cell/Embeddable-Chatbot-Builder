"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Send, Trash2, MessageSquare } from "lucide-react";

interface Chatbot {
  id: string;
  name: string;
  description: string | null;
}

interface Conversation {
  id: string;
  messages: { role: string; content: string }[];
  created_at: string;
}

interface Props {
  chatbot: Chatbot;
  conversations: Conversation[];
  userId: string;
}

export function ChatInterface({ chatbot, conversations: initialConversations, userId }: Props) {
  const [convs, setConvs] = useState(initialConversations);
  const [activeConvId, setActiveConvId] = useState<string | null>(
    initialConversations[0]?.id || null
  );
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConvId, convs]);

  const activeConv = convs.find((c) => c.id === activeConvId);
  const messages = activeConv?.messages || [];

  const startNewChat = async () => {
    const { data } = await supabase
      .from("conversations")
      .insert({ chatbot_id: chatbot.id, user_id: userId, messages: [] })
      .select()
      .single();
    if (data) {
      setConvs((prev) => [data, ...prev]);
      setActiveConvId(data.id);
    }
  };

  const deleteChat = async (id: string) => {
    await supabase.from("conversations").delete().eq("id", id);
    setConvs((prev) => prev.filter((c) => c.id !== id));
    if (activeConvId === id) {
      setActiveConvId(convs.find((c) => c.id !== id)?.id || null);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeConvId || sending) return;

    const userMsg = { role: "user", content: input.trim() };
    setInput("");
    setSending(true);
    setErrorMsg(null);

    const updatedMessages = [...messages, userMsg];

    await supabase
      .from("conversations")
      .update({ messages: updatedMessages })
      .eq("id", activeConvId);

    setConvs((prev) =>
      prev.map((c) =>
        c.id === activeConvId ? { ...c, messages: updatedMessages } : c
      )
    );

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input.trim(),
          chatbotId: chatbot.id,
          conversationId: activeConvId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to get a response");
      }

      if (data.reply) {
        const finalMessages = [
          ...updatedMessages,
          { role: "assistant", content: data.reply },
        ];

        await supabase
          .from("conversations")
          .update({ messages: finalMessages })
          .eq("id", activeConvId);

        setConvs((prev) =>
          prev.map((c) =>
            c.id === activeConvId ? { ...c, messages: finalMessages } : c
          )
        );
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
    <div className="flex h-full">
      <div className="w-64 border-r bg-white flex flex-col">
        <div className="p-3 border-b">
          <h2 className="font-semibold text-sm truncate">{chatbot.name}</h2>
          {chatbot.description && (
            <p className="text-xs text-gray-500 truncate">{chatbot.description}</p>
          )}
        </div>
        <button
          onClick={startNewChat}
          className="mx-3 mt-3 rounded-lg bg-black text-white text-sm py-2 hover:bg-gray-800"
        >
          + New Chat
        </button>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {convs.map((conv) => (
            <div
              key={conv.id}
              className={`flex items-center justify-between rounded-md px-2 py-1.5 cursor-pointer text-sm group ${
                conv.id === activeConvId ? "bg-gray-100" : "hover:bg-gray-50"
              }`}
              onClick={() => setActiveConvId(conv.id)}
            >
              <div className="flex items-center gap-2 min-w-0">
                <MessageSquare className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                <span className="truncate text-xs">
                  {conv.messages.find((m) => m.role === "user")?.content.slice(0, 30) || "New chat"}
                </span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); deleteChat(conv.id); }}
                className="shrink-0 opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              Send a message to start chatting
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`rounded-lg px-4 py-2 max-w-[70%] whitespace-pre-wrap ${
                    msg.role === "user" ? "bg-black text-white" : "bg-gray-100 text-gray-900"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))
          )}
          {sending && (
            <div className="flex justify-start">
              <div className="rounded-lg px-4 py-3 bg-gray-100">
                <div className="flex gap-1">
                  <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
                  <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
                  <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
          {errorMsg && (
            <div className="animate-fade-in rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {errorMsg}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t p-4">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              rows={1}
              className="flex-1 resize-none rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || sending || !activeConvId}
              className="rounded-lg bg-black px-4 text-white hover:bg-gray-800 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
