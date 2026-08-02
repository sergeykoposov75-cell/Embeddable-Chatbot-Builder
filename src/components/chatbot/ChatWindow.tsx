import type { Message } from "@/types";

interface ChatWindowProps {
  messages: Message[];
}

export function ChatWindow({ messages }: ChatWindowProps) {
  return (
    <div className="flex h-full flex-col overflow-y-auto border rounded-lg p-4 space-y-4">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`rounded-lg px-4 py-2 max-w-[80%] ${
              msg.role === "user"
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-900"
            }`}
          >
            {msg.content}
          </div>
        </div>
      ))}
    </div>
  );
}
