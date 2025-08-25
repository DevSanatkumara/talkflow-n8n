export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: number;
  imageData?: {
    data: string;
    mimeType: string;
    fileName: string;
  };
  isStreaming?: boolean; // Индикатор потокового получения контента
}

export interface ChatSession {
  id: string;
  name?: string;
  messages: Message[];
  createdAt: number;
  lastUpdated: number;
  favorite?: boolean;
}