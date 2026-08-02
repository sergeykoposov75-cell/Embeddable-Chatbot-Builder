export interface Chatbot {
  id: string;
  name: string;
  description?: string;
  model: string;
  systemPrompt: string;
  temperature: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  chatbotId: string;
  messages: Message[];
  createdAt: string;
}
