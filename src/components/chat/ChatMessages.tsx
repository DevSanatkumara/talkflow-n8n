
import { Message } from "@/types/chat";
import { ChatMessage } from "@/components/ChatMessage";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

interface ChatMessagesProps {
  messages: Message[];
  isTyping?: boolean;
  onSourceLinkClick?: (payload: { href: string; alias?: string }) => void;
}

export const ChatMessages = ({ messages, isTyping = false, onSourceLinkClick }: ChatMessagesProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  const scrollToBottom = (immediate = false) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: immediate ? "auto" : "smooth"
    });
  };

  useEffect(() => {
    // Проверяем есть ли потоковые сообщения
    const hasStreamingMessage = messages.some(msg => msg.isStreaming);
    
    if (hasStreamingMessage) {
      // Для потоковых сообщений используем дебаунсинг, чтобы избежать постоянного скролла
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        scrollToBottom(false);
      }, 100); // Скролл каждые 100мс максимум
    } else {
      // Для обычных сообщений скроллим сразу
      scrollToBottom(false);
    }

    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [messages]);

  useEffect(() => {
    // Скролл в конец при первой загрузке
    scrollToBottom(true);
  }, []);

  // Проверяем есть ли потоковые сообщения для скрытия общего индикатора
  const hasStreamingMessage = messages.some(msg => msg.isStreaming);

  return (
    <ScrollArea
      className="h-full"
      style={{
        background: `
          linear-gradient(to bottom,
            hsl(var(--background)) 0%,
            hsl(var(--muted)/0.1) 100%
          ),
          radial-gradient(
            circle at 2px 2px,
            hsl(var(--muted)/0.15) 1px,
            transparent 0
          )
        `,
        backgroundSize: '100% 100%, 24px 24px'
      }}
    >
      <div className="container max-w-3xl mx-auto p-4">
        <div className="max-w-[900px] mx-auto space-y-12">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} onSourceLinkClick={onSourceLinkClick} />
          ))}
          {isTyping && !hasStreamingMessage && (
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Исследую Ваш вопрос...</span>
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>
    </ScrollArea>
  );
};
